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
        public async Task<ActionResult<IEnumerable<object>>> GetProducts()
        {
            var products = await _context.Products
                .Select(p => new
                {
                    p.prod_id,
                    p.category_id,
                    p.prod_national_code,
                    p.prod_name,
                    p.prod_registration_number,
                    p.prod_active_ingredient,
                    p.prod_registration_ingredient,
                    p.prod_dosage,
                    p.prod_manufacturer,
                    p.prod_country,
                    p.Category!.category_name,
                    p.Category!.category_description,
                    productUnits = p.ProductUnits!.Select(u => new
                    {
                        u.prod_id,
                        u.prod_unit_id,
                        u.prod_unit_name,
                        u.prod_unit_exchange_value,
                        u.prod_unit_price
                    })
                })
                .ToListAsync();

            return Ok(products);
        }

        // GET: api/product/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetProduct(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductUnits)
                .Where(p => p.prod_id == id)
                .Select(p => new
                {
                    p.prod_id,
                    p.category_id,
                    p.prod_national_code,
                    p.prod_name,
                    p.prod_registration_number,
                    p.prod_active_ingredient,
                    p.prod_registration_ingredient,
                    p.prod_dosage,
                    p.prod_manufacturer,
                    p.prod_country,
                    p.Category!.category_name,
                    p.Category!.category_description,
                    productUnits = p.ProductUnits!.Select(u => new
                    {
                        u.prod_id,
                        u.prod_unit_id,
                        u.prod_unit_name,
                        u.prod_unit_exchange_value,
                        u.prod_unit_price
                    })
                })
                .FirstOrDefaultAsync();

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
                        pu.prod_unit_id,
                        pu.prod_unit_name,
                        pu.prod_unit_exchange_value,
                        pu.prod_unit_price
                    })
                })
                .ToListAsync();

            return Ok(products);
        }

        // POST: api/product
        [HttpPost]
        public async Task<ActionResult<Product>> PostProduct(Product product)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (product.ProductUnits == null || !product.ProductUnits.Any())
            {
                return BadRequest();
            }
    
            if (product.ProductUnits.Count(u => u.prod_unit_exchange_value == 1) != 1)
            {
                return BadRequest();
            }

            if (string.IsNullOrWhiteSpace(product.prod_national_code))
            {
                product.prod_national_code = null;
            }

            if (string.IsNullOrWhiteSpace(product.prod_registration_number))
            {
                product.prod_registration_number = null;
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var units = product.ProductUnits?.ToList() ?? new List<ProductUnit>();
                product.ProductUnits = null;

                _context.Products.Add(product);
                await _context.SaveChangesAsync();

                if (units.Any())
                {
                    var nextProdUnitId = 1;
                    foreach (var unit in units)
                    {
                        unit.prod_id = product.prod_id;
                        if (unit.prod_unit_id <= 0)
                        {
                            unit.prod_unit_id = nextProdUnitId++;
                        }
                        _context.ProductUnits.Add(unit);
                    }
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetProduct), new { id = product.prod_id }, product);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                var fullText = ex.ToString().Replace("\r", "").Replace("\n", " | ");
                Console.WriteLine("[ProductController] Exception: " + fullText);
                var baseMessage = ex.GetBaseException()?.Message;
                return StatusCode(500, $"Lỗi hệ thống: {ex.Message} | {baseMessage} | {fullText}");
            }
        }

        // PUT: api/product/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProduct(int id, Product product)
        {
            if (id != product.prod_id)
            {
                return BadRequest();
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var existingProduct = await _context.Products
                    .FirstOrDefaultAsync(p => p.prod_id == id);

                if (existingProduct == null)
                {
                    return NotFound();
                }

                existingProduct.category_id = product.category_id;
                existingProduct.prod_national_code = string.IsNullOrWhiteSpace(product.prod_national_code) ? null : product.prod_national_code;
                existingProduct.prod_name = product.prod_name;
                existingProduct.prod_registration_number = string.IsNullOrWhiteSpace(product.prod_registration_number) ? null : product.prod_registration_number;
                existingProduct.prod_active_ingredient = product.prod_active_ingredient;
                existingProduct.prod_registration_ingredient = product.prod_registration_ingredient;
                existingProduct.prod_dosage = product.prod_dosage;
                existingProduct.prod_manufacturer = product.prod_manufacturer;
                existingProduct.prod_country = product.prod_country;

                var existingUnits = await _context.ProductUnits.Where(pu => pu.prod_id == id).ToListAsync();
                var incomingUnits = product.ProductUnits?.ToList() ?? new List<ProductUnit>();
                var incomingIds = incomingUnits.Where(u => u.prod_unit_id > 0).Select(u => u.prod_unit_id).ToHashSet();

                var removeCandidates = existingUnits.Where(u => !incomingIds.Contains(u.prod_unit_id)).ToList();
                if (removeCandidates.Any())
                {
                    _context.ProductUnits.RemoveRange(removeCandidates);
                }

                // Update existing units or add new ones
                var maxUnitId = existingUnits.Any() ? existingUnits.Max(u => u.prod_unit_id) : 0;
                foreach (var unit in incomingUnits)
                {
                    if (unit.prod_unit_id > 0)
                    {
                        var existingUnit = existingUnits.FirstOrDefault(u => u.prod_unit_id == unit.prod_unit_id);
                        if (existingUnit != null)
                        {
                            existingUnit.prod_unit_name = unit.prod_unit_name;
                            existingUnit.prod_unit_exchange_value = unit.prod_unit_exchange_value;
                            existingUnit.prod_unit_price = unit.prod_unit_price;
                            _context.ProductUnits.Update(existingUnit);
                            continue;
                        }
                    }

                    var newUnit = new ProductUnit
                    {
                        prod_id = id,
                        prod_unit_id = unit.prod_unit_id > 0 ? unit.prod_unit_id : ++maxUnitId,
                        prod_unit_name = unit.prod_unit_name,
                        prod_unit_exchange_value = unit.prod_unit_exchange_value,
                        prod_unit_price = unit.prod_unit_price
                    };
                    _context.ProductUnits.Add(newUnit);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Lỗi hệ thống: {ex.Message} | Inner: {ex.GetBaseException()?.Message} | Full: {ex}");
            }
        }
    }
}