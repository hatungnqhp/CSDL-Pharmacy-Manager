// using Microsoft.AspNetCore.Mvc;
// using Microsoft.EntityFrameworkCore;
// using PharmacyAPI.Data;
// using PharmacyAPI.Models;

// namespace PharmacyAPI.Controllers
// {
//     [Route("api/[controller]")]
//     [ApiController]
//     public class SellInvoiceController : ControllerBase
//     {
//         private readonly PharmacyContext _context;

//         public SellInvoiceController(PharmacyContext context)
//         {
//             _context = context;
//         }

//         // GET: api/sellinvoice/5
//         // Lấy chi tiết hóa đơn kèm thông tin thuốc và khách hàng
//         [HttpGet("{id}")]
//         public async Task<ActionResult<object>> GetInvoice(int id)
//         {
//             var invoice = await _context.SellInvoices
//                 .Include(s => s.Customer)
//                 .Include(s => s.Staff)
//                 .Include(s => s.SellInvoiceDetails)
//                     .ThenInclude(d => d.Batch)
//                         .ThenInclude(b => b.Product)
//                 .FirstOrDefaultAsync(s => s.sell_inv_id == id);

//             if (invoice == null) return NotFound();
//             return Ok(invoice);
//         }

//         // POST: api/sellinvoice
//         // Xử lý bán hàng và trừ tồn kho
//         [HttpPost]
//         public async Task<ActionResult<SellInvoice>> CreateInvoice(SellInvoice invoice)
//         {
//             using var transaction = await _context.Database.BeginTransactionAsync();
//             try
//             {
//                 _context.SellInvoices.Add(invoice);
//                 await _context.SaveChangesAsync();

//                 foreach (var detail in invoice.SellInvoiceDetails)
//                 {
//                     // 1. Tìm lô hàng tương ứng
//                     var batch = await _context.Batches.FindAsync(detail.batch_id);
//                     if (batch == null) throw new Exception("Không tìm thấy lô hàng");

//                     // 2. Lấy đơn vị tính để biết giá trị quy đổi (Ví dụ: 1 Hộp = 10 Viên)
//                     var unit = await _context.ProductUnits.FindAsync(detail.prod_unit_id);
//                     if (unit == null) throw new Exception("Đơn vị tính không hợp lệ");

//                     // 3. Tính tổng số lượng đơn vị gốc cần trừ (Qty * ExchangeValue)
//                     int totalQtyToSubtract = detail.sell_inv_dtl_sell_qty_pkg * unit.prod_unit_exchange_value;

//                     // 4. Kiểm tra tồn kho
//                     if (batch.batch_current_qty_base < totalQtyToSubtract)
//                         throw new Exception($"Sản phẩm {batch.batch_id} không đủ tồn kho");

//                     // 5. Trừ tồn kho thực tế
//                     batch.batch_current_qty_base -= totalQtyToSubtract;
//                 }

//                 await _context.SaveChangesAsync();
//                 await transaction.CommitAsync();

//                 return CreatedAtAction(nameof(GetInvoice), new { id = invoice.sell_inv_id }, invoice);
//             }
//             catch (Exception ex)
//             {
//                 await transaction.RollbackAsync();
//                 return BadRequest(ex.Message);
//             }
//         }
//     }
// }