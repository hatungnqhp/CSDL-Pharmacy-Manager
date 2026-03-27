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

        public CategoryController(PharmacyContext context)
        {
            _context = context;
        }

        // GET: api/Category
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCategories()
        {
            // Trả về dữ liệu phẳng kèm số lượng mặt hàng trong mỗi danh mục
            var categories = await _context.Categories
                .Select(c => new
                {
                    c.category_id,
                    c.category_name,
                    c.category_description,
                    category_product_count = c.Products!.Count()
                })
                .OrderBy(c => c.category_name)
                .ToListAsync();

            return Ok(categories);
        }

        // GET: api/Category/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Category>> GetCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);

            if (category == null)
            {
                return NotFound("Không tìm thấy danh mục này.");
            }

            return Ok(category);
        }

        // POST: api/Category
        [HttpPost]
        public async Task<ActionResult<Category>> PostCategory(Category category)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategory), new { id = category.category_id }, category);
        }

        // PUT: api/Category/5
        // [HttpPut("{id}")]
        // public async Task<IActionResult> PutCategory(int id, Category category)
        // {
        //     if (id != category.category_id)
        //     {
        //         return BadRequest("ID danh mục không khớp.");
        //     }

        //     _context.Entry(category).State = EntityState.Modified;

        //     try
        //     {
        //         await _context.SaveChangesAsync();
        //     }
        //     catch (DbUpdateConcurrencyException)
        //     {
        //         if (!CategoryExists(id))
        //         {
        //             return NotFound("Danh mục đã bị xóa hoặc không tồn tại.");
        //         }
        //         throw;
        //     }

        //     return NoContent();
        // }

        // DELETE: api/Category/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.category_id == id);

            if (category == null)
            {
                return NotFound("Không tìm thấy danh mục.");
            }

            if (category.Products!.Any())
            {
                return BadRequest("Không thể xóa danh mục đang có chứa sản phẩm. Vui lòng chuyển sản phẩm sang nhóm khác trước.");
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // private bool CategoryExists(int id)
        // {
        //     return _context.Categories.Any(e => e.category_id == id);
        // }
    }
}