using Microsoft.EntityFrameworkCore;
using PharmacyAPI.Models;

namespace PharmacyAPI.Data
{
    public class PharmacyContext : DbContext
    {
        public PharmacyContext(DbContextOptions<PharmacyContext> options) : base(options) { }
        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<ProductUnit> ProductUnits { get; set; }
        public DbSet<Batch> Batches { get; set; }
        public DbSet<Staff> Staffs { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<PurchaseInvoice> PurchaseInvoices { get; set; }
        public DbSet<SellInvoice> SellInvoices { get; set; }
        public DbSet<SellInvoiceDetail> SellInvoiceDetails { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Cấu hình thêm nếu tên cột hoặc quan hệ phức tạp
            // Ví dụ: Đảm bảo kiểu dữ liệu decimal khớp chính xác với MySQL
            // modelBuilder.Entity<ProductUnit>()
            //     .Property(p => p.prod_unit_price)
            //     .HasPrecision(15, 2);

            // modelBuilder.Entity<Batch>()
            //     .Property(b => b.batch_cost_price_unit)
            //     .HasPrecision(15, 2);
        }
    }
}