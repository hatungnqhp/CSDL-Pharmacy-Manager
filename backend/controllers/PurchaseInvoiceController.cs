using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmacyAPI.Data;
using PharmacyAPI.Models;

namespace PharmacyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PurchaseInvoiceController : ControllerBase
    {
        private readonly PharmacyContext _context;
        public PurchaseInvoiceController(PharmacyContext context) => _context = context;

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseInvoice>>> GetInvoices()
        {
            return await _context.PurchaseInvoices
                .Include(i => i.Supplier)
                .Include(i => i.Staff)
                .OrderByDescending(i => i.pur_inv_id)
                .AsNoTracking()
                .ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<PurchaseInvoice>> CreateInvoice([FromBody] PurchaseInvoice invoice)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Tách chi tiết để không bị EF tự động insert cascade kèm theo (dẫn đến cột phụ bất thường)
                var details = invoice.PurchaseInvoiceDetails?.ToList();
                invoice.PurchaseInvoiceDetails = null;

                // 2. Lưu header để lấy pur_inv_id
                _context.PurchaseInvoices.Add(invoice);
                await _context.SaveChangesAsync();

                if (details != null && details.Any())
                {
                    foreach (var detail in details)
                    {
                        // 3. Xử lý Batch nằm trong Detail
                        if (detail.Batch != null)
                        {
                            detail.Batch.batch_current_qty = detail.pur_inv_dtl_import_qty;

                            _context.Batches.Add(detail.Batch);
                            await _context.SaveChangesAsync();

                            detail.batch_id = detail.Batch.batch_id;
                            detail.Batch = null;
                        }

                        // 4. Gán FK liên kết với Invoice header
                        detail.pur_inv_id = invoice.pur_inv_id;
                        detail.PurchaseInvoice = null;

                        _context.PurchaseInvoiceDetails.Add(detail);
                    }
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                // Trả về record mới đầy đủ để frontend dùng
                var created = await _context.PurchaseInvoices
                    .Include(i => i.Supplier)
                    .Include(i => i.Staff)
                    .Include(i => i.PurchaseInvoiceDetails)
                    .FirstOrDefaultAsync(i => i.pur_inv_id == invoice.pur_inv_id);

                return Ok(created);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                // Lấy lỗi sâu nhất từ MySQL để debug
                var inner = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, new { message = "Lỗi SQL thực tế", detail = inner });
            }
        }

        [HttpPatch("{id}/confirm-receipt")]
        public async Task<IActionResult> ConfirmReceipt(int id, [FromBody] DateTime receivedDate)
        {
            var invoice = await _context.PurchaseInvoices.FindAsync(id);
            if (invoice == null) return NotFound();
            
            if (invoice.pur_inv_received_date.HasValue) 
                return BadRequest("Hóa đơn đã xác nhận nhập kho trước đó.");

            invoice.pur_inv_received_date = receivedDate;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xác nhận thành công", date = receivedDate });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvoice(int id)
        {
            var invoice = await _context.PurchaseInvoices
                .Include(i => i.PurchaseInvoiceDetails)
                .FirstOrDefaultAsync(i => i.pur_inv_id == id);

            if (invoice == null) return NotFound();
            if (invoice.pur_inv_received_date.HasValue) 
                return BadRequest("Không thể xóa hóa đơn đã nhập kho.");

            _context.PurchaseInvoices.Remove(invoice);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}