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
        public DbSet<PurchaseInvoiceDetail> PurchaseInvoiceDetails { get; set; }
        public DbSet<SellInvoice> SellInvoices { get; set; }
        public DbSet<SellInvoiceDetail> SellInvoiceDetails { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Decimal Precision for MySQL/SQL Server
            foreach (var property in modelBuilder.Model.GetEntityTypes()
                .SelectMany(t => t.GetProperties())
                .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                property.SetPrecision(18);
                property.SetScale(2);
            }

            // Weak Entity: PRODUCT_UNIT (composite key)
            modelBuilder.Entity<ProductUnit>()
                .HasKey(pu => new { pu.prod_id, pu.prod_unit_id });

            modelBuilder.Entity<ProductUnit>()
                .HasOne(u => u.Product)
                .WithMany(p => p.ProductUnits)
                .HasForeignKey(u => u.prod_id)
                .OnDelete(DeleteBehavior.Cascade);

            // Weak Entity: PURCHASE_INVOICE_DETAIL (composite key)
            modelBuilder.Entity<PurchaseInvoiceDetail>()
                .HasKey(d => new { d.pur_inv_id, d.batch_id });

            modelBuilder.Entity<PurchaseInvoiceDetail>()
                .HasOne(d => d.PurchaseInvoice)
                .WithMany(i => i.PurchaseInvoiceDetails)
                .HasForeignKey(d => d.pur_inv_id)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PurchaseInvoiceDetail>()
                .HasOne(d => d.Batch)
                .WithOne(b => b.PurchaseInvoiceDetail)
                .HasForeignKey<PurchaseInvoiceDetail>(d => d.batch_id)
                .OnDelete(DeleteBehavior.Cascade);

            // Weak Entity: SELL_INVOICE_DETAIL (composite key)
            modelBuilder.Entity<SellInvoiceDetail>()
                .HasKey(d => new { d.sell_inv_id, d.batch_id });

            modelBuilder.Entity<SellInvoiceDetail>()
                .HasOne(d => d.SellInvoice)
                .WithMany(i => i.SellInvoiceDetails)
                .HasForeignKey(d => d.sell_inv_id)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SellInvoiceDetail>()
                .HasOne(d => d.Batch)
                .WithMany(b => b.SellInvoiceDetails)
                .HasForeignKey(d => d.batch_id)
                .OnDelete(DeleteBehavior.Cascade);

            // BATCH -> Product
            modelBuilder.Entity<Batch>()
                .HasOne(b => b.Product)
                .WithMany(p => p.Batches)
                .HasForeignKey(b => b.prod_id)
                .OnDelete(DeleteBehavior.Restrict);

            // BATCH -> ProductUnit (composite FK)
            modelBuilder.Entity<Batch>()
                .HasOne(b => b.ProductUnit)
                .WithMany(u => u.Batches)
                .HasForeignKey(b => new { b.prod_id, b.prod_unit_id })
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}