using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmacyAPI.Data;
using PharmacyAPI.Models;

namespace PharmacyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerController : ControllerBase
    {
        private readonly PharmacyContext _context;

        public CustomerController(PharmacyContext context)
        {
            _context = context;
        }

        // GET: api/Customer
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Customer>>> GetCustomers()
        {
            /*
            SELECT 
                customer_id, 
                customer_name, 
                customer_phone, 
                customer_address, 
                customer_medical_history
            FROM Customers
            ORDER BY customer_name ASC;
            */

            return await _context.Customers
                .OrderBy(c => c.customer_name)
                .ToListAsync();
        }

        // GET: api/Customer/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Customer>> GetCustomer(int id)
        {
            /*
            SELECT * FROM Customers 
            WHERE customer_id = @id;
            */

            var customer = await _context.Customers.FindAsync(id);

            if (customer == null)
            {
                return NotFound();
            }

            return customer;
        }

        // POST: api/Customer
        [HttpPost]
        public async Task<ActionResult<Customer>> PostCustomer(Customer customer)
        {
            /*
            INSERT INTO Customers (
                customer_name, 
                customer_phone, 
                customer_address, 
                customer_medical_history
            )
            VALUES (@name, @phone, @address, @medicalHistory);
            SELECT SCOPE_IDENTITY();
            */

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCustomer", new { id = customer.customer_id }, customer);
        }

        // PUT: api/Customer/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCustomer(int id, Customer customer)
        {
            /*
            UPDATE Customers
            SET 
                customer_name = @name,
                customer_phone = @phone,
                customer_address = @address,
                customer_medical_history = @medicalHistory
            WHERE customer_id = @id;
            */

            if (id != customer.customer_id)
            {
                return BadRequest();
            }

            _context.Entry(customer).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CustomerExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return Ok(customer);
        }

        // DELETE: api/Customer/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            /*
            DELETE FROM Customers 
            WHERE customer_id = @id;
            */

            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound();
            }

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool CustomerExists(int id)
        {
            /*
            SELECT 1 
            WHERE EXISTS (
                SELECT 1 
                FROM Customers 
                WHERE customer_id = @id
            );
            */

            return _context.Customers.Any(e => e.customer_id == id);
        }
    }
}