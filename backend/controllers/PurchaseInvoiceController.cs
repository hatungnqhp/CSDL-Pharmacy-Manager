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
                .OrderByDescending(i => i.pur_inv_received_date)
                .ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<PurchaseInvoice>> CreateInvoice(PurchaseInvoice invoice)
        {
            _context.PurchaseInvoices.Add(invoice);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetInvoices), new { id = invoice.pur_inv_id }, invoice);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvoice(int id)
        {
            var invoice = await _context.PurchaseInvoices.FindAsync(id);
            if (invoice == null) return NotFound();

            // Kiểm tra nếu đã có Batch liên quan thì không cho xóa (Constraint protection)
            var hasBatches = await _context.Batches.AnyAsync(b => b.pur_inv_id == id);
            if (hasBatches) return BadRequest("Không thể xóa hóa đơn đã có lô hàng nhập kho.");

            _context.PurchaseInvoices.Remove(invoice);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}