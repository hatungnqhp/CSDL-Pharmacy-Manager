using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmacyAPI.Data;
using PharmacyAPI.Models;

namespace PharmacyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SupplierController : ControllerBase
    {
        private readonly PharmacyContext _context;

        public SupplierController(PharmacyContext context)
        {
            _context = context;
        }

        // GET: api/Suppliers
        [HttpGet]
        public async Task<ActionResult> GetSuppliers()
        {
            var suppliers = await _context.Suppliers
                .Select(s => new { 
                    s.supplier_id, 
                    s.supplier_name 
                })
                .ToListAsync();
            return Ok(suppliers);
        }
    }
}