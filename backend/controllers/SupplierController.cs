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

        // GET: api/Supplier
        [HttpGet]
        public async Task<ActionResult> GetSuppliers()
        {
            /* SQL TRUY VẤN:
               SELECT supplier_id, supplier_name, supplier_phone 
               FROM Suppliers 
               ORDER BY supplier_name ASC;
            */
            var suppliers = await _context.Suppliers
                .Select(s => new { 
                    s.supplier_id, 
                    s.supplier_name,
                    s.supplier_phone
                })
                .OrderBy(s => s.supplier_name)
                .ToListAsync();

            return Ok(suppliers);
        }

        // POST: api/Supplier
        [HttpPost]
        public async Task<ActionResult<Supplier>> PostSupplier(Supplier supplier)
        {
            /* SQL TRUY VẤN:
               INSERT INTO Suppliers (supplier_name, supplier_phone, supplier_address, supplier_tax_code)
               VALUES (@name, @phone, @address, @taxCode);
               
               SELECT SCOPE_IDENTITY(); -- Lấy ID vừa tạo tự động
            */
            try 
            {
                _context.Suppliers.Add(supplier);
                await _context.SaveChangesAsync();
                return Ok(supplier);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi thêm nhà cung cấp", detail = ex.Message });
            }
        }

        // GET: api/Supplier/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Supplier>> GetSupplier(int id)
        {
            /* SQL TRUY VẤN:
               SELECT * FROM Suppliers WHERE supplier_id = @id;
            */
            var supplier = await _context.Suppliers.FindAsync(id);

            if (supplier == null) return NotFound(new { message = "Không tìm thấy nhà cung cấp" });
            return Ok(supplier);
        }

        // DELETE: api/Supplier/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            /* SQL TRUY VẤN:
               -- Kiểm tra ràng buộc trước khi xóa
               IF NOT EXISTS (SELECT 1 FROM PurchaseInvoices WHERE supplier_id = @id)
               BEGIN
                   DELETE FROM Suppliers WHERE supplier_id = @id;
               END
            */
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null) return NotFound();

            // Kiểm tra xem nhà cung cấp có hóa đơn nhập nào không (tránh lỗi khóa ngoại)
            var hasInvoices = await _context.PurchaseInvoices.AnyAsync(pi => pi.supplier_id == id);
            if (hasInvoices)
            {
                return BadRequest(new { message = "Không thể xóa nhà cung cấp đã có lịch sử giao dịch hóa đơn." });
            }

            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}