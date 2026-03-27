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

        // Tách logic Select ra một hàm dùng chung để đảm bảo đồng nhất cấu trúc JSON
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
                pur_inv_dtl_cost_price_unit = b.PurchaseInvoiceDetail != null ? b.PurchaseInvoiceDetail.pur_inv_dtl_cost_price_unit : 0
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetBatches([FromQuery] int? productId)
        {
            var query = _context.Batches.AsNoTracking();
            if (productId.HasValue) query = query.Where(b => b.prod_id == productId);

            var data = await ProjectBatch(query.OrderBy(b => b.batch_expiry_date)).ToListAsync();
            return Ok(data);
        }

        [HttpGet("product/{prodId}")]
        public async Task<IActionResult> GetBatchesByProduct(int prodId)
        {
            var query = _context.Batches.AsNoTracking()
                .Where(b => b.prod_id == prodId && b.batch_current_qty > 0);

            var data = await ProjectBatch(query.OrderBy(b => b.batch_expiry_date)).ToListAsync();
            return Ok(data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetBatch(int id)
        {
            var query = _context.Batches.AsNoTracking().Where(b => b.batch_id == id);
            var batch = await ProjectBatch(query).FirstOrDefaultAsync();
            
            if (batch == null) return NotFound();
            return Ok(batch);
        }
    }
}