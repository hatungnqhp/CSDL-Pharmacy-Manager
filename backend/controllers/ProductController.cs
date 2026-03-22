using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmacyAPI.Data;
using PharmacyAPI.Models;

namespace PharmacyAPI.Controllers
{
    [Route("api/[controller]")] // Đường dẫn sẽ là: api/product
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly PharmacyContext _context;

        // Dependency Injection: Bơm Context vào để sử dụng
        public ProductController(PharmacyContext context)
        {
            _context = context;
        }

        // GET: api/product
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
        {
            // Lấy toàn bộ danh sách thuốc, bao gồm cả thông tin Category liên quan
            var products = await _context.Products
                .Include(p => p.Category)
                .ToListAsync();

            return Ok(products);
        }

        // GET: api/product/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductUnits)
                .FirstOrDefaultAsync(p => p.prod_id == id);

            if (product == null) return NotFound();

            return Ok(product);
        }

        // GET: api/Products/search?q=paracetamol
        [HttpGet("search")]
        public async Task<ActionResult> SearchProducts(string? q)
        {
            var query = _context.Products.AsQueryable();

            if (!string.IsNullOrEmpty(q))
            {
                query = query.Where(p => p.prod_name.Contains(q));
            }

            var products = await query
                .Select(p => new {
                    p.prod_id,
                    p.prod_name,
                    units = p.ProductUnits!.Select(pu => new {
                        prod_unit_id = pu.prod_unit_id,
                        prod_unit_name = pu.prod_unit_name,
                        prod_unit_exchange_value = pu.prod_unit_exchange_value,
                        prod_unit_price = pu.prod_unit_price
                    })
                })
                .ToListAsync();

            return Ok(products);
        }
    }
}