using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmacyAPI.Data;
using PharmacyAPI.Models;

namespace PharmacyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        private readonly PharmacyContext _context;
        public CategoryController(PharmacyContext context) => _context = context;

        // GET: api/Category
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCategories()
        {
            /* SQL TRUY VẤN:
               SELECT c.category_id, c.category_name, c.category_description, COUNT(p.prod_id) AS category_product_count
               FROM Categories c
               LEFT JOIN Products p ON c.category_id = p.category_id
               GROUP BY c.category_id, c.category_name, c.category_description
               ORDER BY c.category_name ASC;
            */
            var categories = await _context.Categories
                .Select(c => new
                {
                    c.category_id,
                    c.category_name,
                    c.category_description,
                    category_product_count = c.Products!.Count()
                })
                .OrderBy(c => c.category_name)
                .AsNoTracking()
                .ToListAsync();

            return Ok(categories);
        }

        // GET: api/Category/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Category>> GetCategory(int id)
        {
            /* SQL TRUY VẤN:
               SELECT * FROM Categories WHERE category_id = @id;
            */
            var category = await _context.Categories.FindAsync(id);

            if (category == null) return NotFound("Không tìm thấy danh mục này.");
            return Ok(category);
        }

        // POST: api/Category
        [HttpPost]
        public async Task<ActionResult<Category>> PostCategory(Category category)
        {
            /* SQL TRUY VẤN:
               INSERT INTO Categories (category_name, category_description)
               VALUES (@name, @desc);
               SELECT SCOPE_IDENTITY();
            */
            if (!ModelState.IsValid) return BadRequest(ModelState);

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategory), new { id = category.category_id }, category);
        }

        // PUT: api/Category/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCategory(int id, Category category)
        {
            /* SQL TRUY VẤN:
               UPDATE Categories 
               SET category_name = @name, category_description = @desc
               WHERE category_id = @id;
            */
            if (id != category.category_id) return BadRequest("ID danh mục không khớp.");

            _context.Entry(category).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CategoryExists(id)) return NotFound("Danh mục không tồn tại.");
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Category/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            /* SQL TRUY VẤN:
               -- Bước 1: Kiểm tra sản phẩm
               SELECT COUNT(*) FROM Products WHERE category_id = @id;
               -- Bước 2: Xóa nếu không có sản phẩm
               DELETE FROM Categories WHERE category_id = @id;
            */
            var category = await _context.Categories
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.category_id == id);

            if (category == null) return NotFound("Không tìm thấy danh mục.");

            // Chặn xóa nếu danh mục đang chứa thuốc
            if (category.Products != null && category.Products.Any())
            {
                return BadRequest("Không thể xóa danh mục đang chứa sản phẩm. Vui lòng chuyển sản phẩm sang nhóm khác trước.");
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CategoryExists(int id)
        {
            /* SQL TRUY VẤN:
               SELECT CASE WHEN EXISTS (SELECT 1 FROM Categories WHERE category_id = @id) 
               THEN 1 ELSE 0 END;
            */
            return _context.Categories.Any(e => e.category_id == id);
        }
    }
}