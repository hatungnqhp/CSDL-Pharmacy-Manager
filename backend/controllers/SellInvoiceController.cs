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

        public SellInvoiceController(PharmacyContext context)
        {
            _context = context;
        }

        // GET: api/sellinvoice
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SellInvoice>>> GetInvoices()
        {
            return await _context.SellInvoices
                .Include(i => i.Customer)
                .Include(i => i.Staff)
                .OrderByDescending(i => i.sell_inv_id)
                .AsNoTracking()
                .ToListAsync();
        }

        // GET: api/sellinvoice/5
        // Lấy chi tiết hóa đơn kèm thông tin thuốc và khách hàng
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetInvoice(int id)
        {
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

        // POST: api/sellinvoice
        // Xử lý bán hàng và trừ tồn kho
        [HttpPost]
        public async Task<ActionResult<SellInvoice>> CreateInvoice(SellInvoice invoice)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.SellInvoices.Add(invoice);

                if (invoice.SellInvoiceDetails != null)
                {
                    foreach (var detail in invoice.SellInvoiceDetails)
                    {
                        var batch = await _context.Batches.FindAsync(detail.batch_id);
                        if (batch == null) throw new Exception("Không tìm thấy lô hàng");

                        if (batch.batch_current_qty < detail.sell_inv_dtl_sell_qty_pkg)
                            throw new Exception($"Sản phẩm {batch.Product?.prod_name} không đủ tồn kho");

                        batch.batch_current_qty -= detail.sell_inv_dtl_sell_qty_pkg;
                    }
                }
                
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetInvoice), new { id = invoice.sell_inv_id }, invoice);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(ex.Message);
            }
        }
    }
}