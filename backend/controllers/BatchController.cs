using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmacyAPI.Data;
using PharmacyAPI.Models;

namespace PharmacyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BatchController : ControllerBase
    {
        private readonly PharmacyContext _context;
        public BatchController(PharmacyContext context) => _context = context;

        // Hàm Projection dùng chung để chuẩn hóa cấu trúc JSON trả về
        private static IQueryable<object> ProjectBatch(IQueryable<Batch> query)
        {
            return query.Select(b => new {
                b.batch_id,
                b.prod_id,
                b.prod_unit_id,
                b.batch_number,
                b.batch_expiry_date,
                b.batch_current_qty,
                Product = b.Product != null ? new {
                    b.Product.prod_id,
                    b.Product.prod_name,
                    ProductUnits = b.Product.ProductUnits!.Select(u => new {
                        u.prod_unit_id,
                        u.prod_unit_name,
                        u.prod_unit_exchange_value,
                        u.prod_unit_price
                    })
                } : null,
                ProductUnit = b.ProductUnit != null ? new {
                    b.ProductUnit.prod_unit_id,
                    b.ProductUnit.prod_unit_name,
                    b.ProductUnit.prod_unit_price
                } : null,
                // Lấy giá nhập từ chi tiết hóa đơn nhập kho liên kết với lô này
                pur_inv_dtl_cost_price_unit = b.PurchaseInvoiceDetail != null 
                    ? b.PurchaseInvoiceDetail.pur_inv_dtl_cost_price_unit 
                    : 0
            });
        }

        // GET: api/Batch
        [HttpGet]
        public async Task<IActionResult> GetBatches([FromQuery] int? productId)
        {
            /* SQL TRUY VẤN:
               SELECT b.*, p.prod_name, u.prod_unit_name, 
                      ISNULL(pid.pur_inv_dtl_cost_price_unit, 0) AS cost_price
               FROM Batches b
               LEFT JOIN Products p ON b.prod_id = p.prod_id
               LEFT JOIN ProductUnits u ON b.prod_unit_id = u.prod_unit_id
               LEFT JOIN PurchaseInvoiceDetails pid ON b.batch_id = pid.batch_id
               WHERE (@productId IS NULL OR b.prod_id = @productId)
               ORDER BY b.batch_expiry_date ASC;
            */
            var query = _context.Batches.AsNoTracking();
            if (productId.HasValue) query = query.Where(b => b.prod_id == productId);

            var data = await ProjectBatch(query.OrderBy(b => b.batch_expiry_date)).ToListAsync();
            return Ok(data);
        }

        // GET: api/Batch/product/5
        [HttpGet("product/{prodId}")]
        public async Task<IActionResult> GetBatchesByProduct(int prodId)
        {
            /* SQL TRUY VẤN (Ưu tiên FEFO - Hết hạn trước xuất trước):
               SELECT b.*, u.prod_unit_name
               FROM Batches b
               INNER JOIN ProductUnits u ON b.prod_unit_id = u.prod_unit_id
               WHERE b.prod_id = @prodId AND b.batch_current_qty > 0
               ORDER BY b.batch_expiry_date ASC;
            */
            var query = _context.Batches.AsNoTracking()
                .Where(b => b.prod_id == prodId && b.batch_current_qty > 0);

            var data = await ProjectBatch(query.OrderBy(b => b.batch_expiry_date)).ToListAsync();
            return Ok(data);
        }

        // GET: api/Batch/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBatch(int id)
        {
            /* SQL TRUY VẤN:
               SELECT b.*, p.prod_name, pid.pur_inv_dtl_cost_price_unit
               FROM Batches b
               JOIN Products p ON b.prod_id = p.prod_id
               LEFT JOIN PurchaseInvoiceDetails pid ON b.batch_id = pid.batch_id
               WHERE b.batch_id = @id;
            */
            var query = _context.Batches.AsNoTracking().Where(b => b.batch_id == id);
            var batch = await ProjectBatch(query).FirstOrDefaultAsync();
            
            if (batch == null) return NotFound(new { message = "Không tìm thấy thông tin lô hàng" });
            return Ok(batch);
        }

        // DELETE: api/Batch/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBatch(int id)
        {
            /* SQL TRUY VẤN:
               -- Chỉ cho phép xóa lô hàng chưa có giao dịch bán lẻ
               IF NOT EXISTS (SELECT 1 FROM SellInvoiceDetails WHERE batch_id = @id)
               BEGIN
                   DELETE FROM Batches WHERE batch_id = @id;
               END
            */
            var batch = await _context.Batches.FindAsync(id);
            if (batch == null) return NotFound();

            // Kiểm tra lô hàng đã được bán chưa
            var isSold = await _context.SellInvoiceDetails.AnyAsync(sd => sd.batch_id == id);
            if (isSold) return BadRequest(new { message = "Lô hàng đã có lịch sử bán lẻ, không thể xóa." });

            _context.Batches.Remove(batch);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}