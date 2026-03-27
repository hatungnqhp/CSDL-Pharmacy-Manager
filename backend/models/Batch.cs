using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyAPI.Models
{
    [Table("BATCH")]
    public class Batch
    {
        [Key] [DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int batch_id { get; set; }
        [Required] public int prod_id { get; set; }
        [Required] public int prod_unit_id { get; set; }
        [Required] [StringLength(50)] public string batch_number { get; set; } = string.Empty;
        public DateTime? batch_manufacturing_date { get; set; }
        [Required] public DateTime batch_expiry_date { get; set; }
        [Required] public int batch_current_qty { get; set; }
        
        [ForeignKey("prod_id")] public virtual Product? Product { get; set; }
        [ForeignKey("prod_unit_id")] public virtual ProductUnit? ProductUnit { get; set; }
        
        public virtual PurchaseInvoiceDetail? PurchaseInvoiceDetail { get; set; }
        public virtual ICollection<SellInvoiceDetail>? SellInvoiceDetails { get; set; }
    }
}