using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyAPI.Models
{
    [Table("BATCH")]
    public class Batch
    {
        [Key] [DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int batch_id { get; set; }
        [Required] public int prod_id { get; set; }
        [Required] public int pur_inv_id { get; set; }
        [Required] public int prod_unit_id { get; set; }
        [Required] public int batch_import_qty_pkg { get; set; }
        [Required] public int batch_current_qty_base { get; set; }
        [Required] [StringLength(50)] public string batch_number { get; set; } = string.Empty;
        public DateTime? batch_manufacturing_date { get; set; }
        [Required] public DateTime batch_expiry_date { get; set; }
        [Required] [Column(TypeName = "decimal(15,2)")] public decimal batch_cost_price_unit { get; set; }
        [Required] [Column(TypeName = "decimal(15,2)")] public decimal batch_discount_amount { get; set; }
        [Required] [Column(TypeName = "decimal(15,2)")] public decimal batch_vat_amount { get; set; }
        [ForeignKey("prod_id")] public virtual Product? Product { get; set; }
        [ForeignKey("pur_inv_id")] public virtual PurchaseInvoice? PurchaseInvoice { get; set; }
        [ForeignKey("prod_unit_id")] public virtual ProductUnit? ProductUnit { get; set; }
    }
}