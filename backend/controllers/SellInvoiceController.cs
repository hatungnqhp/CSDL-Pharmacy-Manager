using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmacyAPI.Data;
using PharmacyAPI.Models;

namespace PharmacyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SellInvoiceController : ControllerBase
    {
        private readonly PharmacyContext _context;
        public SellInvoiceController(PharmacyContext context) => _context = context;

        // GET: api/SellInvoice
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SellInvoice>>> GetInvoices()
        {
            /* SQL TRUY VẤN:
               SELECT si.*, c.customer_name, s.staff_name
               FROM SellInvoices si
               LEFT JOIN Customers c ON si.customer_id = c.customer_id
               LEFT JOIN Staffs s ON si.staff_id = s.staff_id
               ORDER BY si.sell_inv_id DESC;
            */
            return await _context.SellInvoices
                .Include(i => i.Customer)
                .Include(i => i.Staff)
                .OrderByDescending(i => i.sell_inv_id)
                .AsNoTracking()
                .ToListAsync();
        }

        // GET: api/SellInvoice/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetInvoice(int id)
        {
            /* SQL TRUY VẤN:
               SELECT si.*, c.customer_name, sid.*, b.batch_number, p.prod_name
               FROM SellInvoices si
               LEFT JOIN Customers c ON si.customer_id = c.customer_id
               LEFT JOIN SellInvoiceDetails sid ON si.sell_inv_id = sid.sell_inv_id
               LEFT JOIN Batches b ON sid.batch_id = b.batch_id
               LEFT JOIN Products p ON b.prod_id = p.prod_id
               WHERE si.sell_inv_id = @id;
            */
            var invoice = await _context.SellInvoices
                .Include(s => s.Customer)
                .Include(s => s.Staff)
                .Include(s => s.SellInvoiceDetails!)
                    .ThenInclude(d => d.Batch!)
                        .ThenInclude(b => b.Product)
                .FirstOrDefaultAsync(s => s.sell_inv_id == id);

            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

        // POST: api/SellInvoice
        [HttpPost]
        public async Task<ActionResult<SellInvoice>> CreateInvoice([FromBody] SellInvoice invoice)
        {
            /* SQL TRANSACTION LOGIC:
               1. INSERT INTO SellInvoices (customer_id, staff_id, sell_inv_total_product_value, ...) 
                  VALUES (...);
                  DECLARE @new_sell_inv_id INT = SCOPE_IDENTITY();
               2. Với mỗi mặt hàng (Detail):
                  -- Kiểm tra tồn kho trước
                  SELECT batch_current_qty FROM Batches WHERE batch_id = @batch_id;
                  -- Nếu đủ, thực hiện trừ tồn kho
                  UPDATE Batches SET batch_current_qty = batch_current_qty - @sellQty 
                  WHERE batch_id = @batch_id;
                  -- Lưu chi tiết hóa đơn
                  INSERT INTO SellInvoiceDetails (sell_inv_id, batch_id, sell_inv_dtl_sell_qty_pkg, ...)
                  VALUES (@new_sell_inv_id, @batch_id, ...);
            */
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Thêm hóa đơn bán hàng (Header)
                var details = invoice.SellInvoiceDetails; // Lưu details
                invoice.SellInvoiceDetails = null; // Không track details qua navigation
                _context.SellInvoices.Add(invoice);
                await _context.SaveChangesAsync();

                if (details != null)
                {
                    foreach (var detail in details)
                    {
                        // Truy vấn Lô hàng để kiểm tra tồn kho
                        var batch = await _context.Batches
                            .Include(b => b.Product)
                            .FirstOrDefaultAsync(b => b.batch_id == detail.batch_id);

                        if (batch == null) 
                            throw new Exception($"Không tìm thấy lô hàng ID: {detail.batch_id}");

                        // Kiểm tra số lượng tồn thực tế
                        if (batch.batch_current_qty < detail.sell_inv_dtl_sell_qty_pkg)
                            throw new Exception($"Sản phẩm '{batch.Product?.prod_name}' (Lô: {batch.batch_number}) không đủ tồn kho. Hiện có: {batch.batch_current_qty}");

                        // Trừ tồn kho trực tiếp trong lô
                        batch.batch_current_qty -= detail.sell_inv_dtl_sell_qty_pkg;
                        
                        // Gán FK và lưu chi tiết
                        detail.sell_inv_id = invoice.sell_inv_id;
                        _context.SellInvoiceDetails.Add(detail);
                    }
                }
                
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetInvoice), new { id = invoice.sell_inv_id }, invoice);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(new { message = "Lỗi khi tạo hóa đơn bán hàng", detail = ex.Message });
            }
        }

        // // DELETE: api/SellInvoice/5 (Hủy hóa đơn và hoàn tồn kho)
        // [HttpDelete("{id}")]
        // public async Task<IActionResult> CancelInvoice(int id)
        // {
        //     /* SQL TRUY VẤN:
        //        1. Lấy danh sách sản phẩm trong hóa đơn:
        //           SELECT batch_id, sell_inv_dtl_sell_qty_pkg FROM SellInvoiceDetails WHERE sell_inv_id = @id;
        //        2. Hoàn lại tồn kho cho từng lô:
        //           UPDATE Batches SET batch_current_qty = batch_current_qty + @refundQty WHERE batch_id = @batch_id;
        //        3. Xóa hóa đơn (Cascade delete sẽ tự xóa Details):
        //           DELETE FROM SellInvoices WHERE sell_inv_id = @id;
        //     */
        //     using var transaction = await _context.Database.BeginTransactionAsync();
        //     try
        //     {
        //         var invoice = await _context.SellInvoices
        //             .Include(i => i.SellInvoiceDetails)
        //             .FirstOrDefaultAsync(i => i.sell_inv_id == id);

        //         if (invoice == null) return NotFound();

        //         // Hoàn lại số lượng đã bán vào kho trước khi xóa
        //         if (invoice.SellInvoiceDetails != null)
        //         {
        //             foreach (var detail in invoice.SellInvoiceDetails)
        //             {
        //                 var batch = await _context.Batches.FindAsync(detail.batch_id);
        //                 if (batch != null)
        //                 {
        //                     batch.batch_current_qty += detail.sell_inv_dtl_sell_qty_pkg;
        //                 }
        //             }
        //         }

        //         _context.SellInvoices.Remove(invoice);
        //         await _context.SaveChangesAsync();
        //         await transaction.CommitAsync();

        //         return NoContent();
        //     }
        //     catch (Exception ex)
        //     {
        //         await transaction.RollbackAsync();
        //         return StatusCode(500, new { message = "Lỗi khi hủy hóa đơn", detail = ex.Message });
        //     }
        // }
    }
}