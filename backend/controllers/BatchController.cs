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

        public BatchController(PharmacyContext context)
        {
            _context = context;
        }

        // GET: api/batch
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Batch>>> GetBatches()
        {
            return await _context.Batches
                .Include(b => b.Product)
                .Include(b => b.ProductUnit)
                .OrderBy(b => b.batch_expiry_date)
                .ToListAsync();
        }
    }
}