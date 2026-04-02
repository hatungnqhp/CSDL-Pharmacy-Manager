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

        // GET: api/PurchaseInvoice
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseInvoice>>> GetInvoices()
        {
            /* SQL TRUY VẤN:
               SELECT pi.*, s.supplier_name, st.staff_name
               FROM PurchaseInvoices pi
               LEFT JOIN Suppliers s ON pi.supplier_id = s.supplier_id
               LEFT JOIN Staffs st ON pi.staff_id = st.staff_id
               ORDER BY pi.pur_inv_id DESC;
            */
            return await _context.PurchaseInvoices
                .Include(i => i.Supplier)
                .Include(i => i.Staff)
                .OrderByDescending(i => i.pur_inv_id)
                .AsNoTracking()
                .ToListAsync();
        }

        // GET: api/PurchaseInvoice/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PurchaseInvoice>> GetInvoice(int id)
        {
            /* SQL TRUY VẤN:
               SELECT pi.*, s.supplier_name, pid.*, b.batch_number
               FROM PurchaseInvoices pi
               LEFT JOIN Suppliers s ON pi.supplier_id = s.supplier_id
               LEFT JOIN PurchaseInvoiceDetails pid ON pi.pur_inv_id = pid.pur_inv_id
               LEFT JOIN Batches b ON pid.batch_id = b.batch_id
               WHERE pi.pur_inv_id = @id;
            */
            var invoice = await _context.PurchaseInvoices
                .Include(i => i.Supplier)
                .Include(i => i.Staff)
                .Include(i => i.PurchaseInvoiceDetails!)
                    .ThenInclude(d => d.Batch)
                .FirstOrDefaultAsync(i => i.pur_inv_id == id);

            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

        // POST: api/PurchaseInvoice
        [HttpPost]
        public async Task<ActionResult<PurchaseInvoice>> CreateInvoice([FromBody] PurchaseInvoice invoice)
        {
            /* SQL TRANSACTION LOGIC:
               1. INSERT INTO PurchaseInvoices (...) VALUES (...);
                  DECLARE @new_inv_id INT = SCOPE_IDENTITY();
               2. Lặp qua từng item:
                  INSERT INTO Batches (prod_id, batch_number, batch_expiry_date, batch_current_qty, ...) 
                  VALUES (...);
                  DECLARE @new_batch_id INT = SCOPE_IDENTITY();
               3. INSERT INTO PurchaseInvoiceDetails (pur_inv_id, batch_id, qty, cost, ...)
                  VALUES (@new_inv_id, @new_batch_id, ...);
            */
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var details = invoice.PurchaseInvoiceDetails?.ToList();
                invoice.PurchaseInvoiceDetails = null;

                _context.PurchaseInvoices.Add(invoice);
                await _context.SaveChangesAsync();

                if (details != null && details.Any())
                {
                    foreach (var detail in details)
                    {
                        if (detail.Batch != null)
                        {
                            // Đồng bộ số lượng tồn kho của lô bằng số lượng nhập
                            detail.Batch.batch_current_qty = detail.pur_inv_dtl_import_qty;

                            _context.Batches.Add(detail.Batch);
                            await _context.SaveChangesAsync();

                            detail.batch_id = detail.Batch.batch_id;
                            detail.Batch = null;
                        }

                        detail.pur_inv_id = invoice.pur_inv_id;
                        detail.PurchaseInvoice = null;

                        _context.PurchaseInvoiceDetails.Add(detail);
                    }
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                var created = await _context.PurchaseInvoices
                    .Include(i => i.Supplier)
                    .Include(i => i.Staff)
                    .Include(i => i.PurchaseInvoiceDetails!)
                        .ThenInclude(d => d.Batch)
                    .FirstOrDefaultAsync(i => i.pur_inv_id == invoice.pur_inv_id);

                return CreatedAtAction(nameof(GetInvoice), new { id = invoice.pur_inv_id }, created);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                var inner = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, new { message = "Lỗi xử lý giao dịch SQL", detail = inner });
            }
        }

        // PATCH: api/PurchaseInvoice/5/confirm-receipt
        [HttpPatch("{id}/confirm-receipt")]
        public async Task<IActionResult> ConfirmReceipt(int id, [FromBody] DateTime receivedDate)
        {
            /* SQL TRUY VẤN:
               UPDATE PurchaseInvoices 
               SET pur_inv_received_date = @receivedDate
               WHERE pur_inv_id = @id AND pur_inv_received_date IS NULL;
            */
            var invoice = await _context.PurchaseInvoices.FindAsync(id);
            if (invoice == null) return NotFound();
            
            if (invoice.pur_inv_received_date.HasValue) 
                return BadRequest("Hóa đơn này đã được xác nhận nhập kho trước đó.");

            invoice.pur_inv_received_date = receivedDate;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xác nhận nhập kho thành công", date = receivedDate });
        }

        // DELETE: api/PurchaseInvoice/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvoice(int id)
        {
            /* SQL TRUY VẤN:
               -- Kiểm tra trước khi xóa
               IF EXISTS (SELECT 1 FROM PurchaseInvoices WHERE pur_inv_id = @id AND pur_inv_received_date IS NULL)
               BEGIN
                  DELETE FROM PurchaseInvoiceDetails WHERE pur_inv_id = @id;
                  DELETE FROM PurchaseInvoices WHERE pur_inv_id = @id;
               END
            */
            var invoice = await _context.PurchaseInvoices
                .Include(i => i.PurchaseInvoiceDetails)
                .FirstOrDefaultAsync(i => i.pur_inv_id == id);

            if (invoice == null) return NotFound();
            if (invoice.pur_inv_received_date.HasValue) 
                return BadRequest("Không thể xóa hóa đơn đã hoàn tất nhập kho.");

            _context.PurchaseInvoices.Remove(invoice);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}