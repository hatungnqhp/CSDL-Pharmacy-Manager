using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyAPI.Models
{
    [Table("PURCHASE_INVOICE")]
    public class PurchaseInvoice
    {
        [Key] [DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int pur_inv_id { get; set; }
        public string? pur_inv_supplier_invoice_code { get; set; }
        [Required] public int staff_id { get; set; }
        [Required] public int supplier_id { get; set; }
        public DateOnly pur_inv_invoice_date { get; set; }
        public DateTime? pur_inv_received_date { get; set; }
        [Column(TypeName = "decimal(18,2)")] public decimal pur_inv_total_product_value { get; set; }
        [Column(TypeName = "decimal(18,2)")] public decimal pur_inv_total_discount { get; set; }
        [Column(TypeName = "decimal(18,2)")] public decimal pur_inv_total_vat { get; set; }
        [Column(TypeName = "decimal(18,2)")] public decimal pur_inv_amount_paid { get; set; }
        public string? pur_inv_note { get; set; }

        [ForeignKey("staff_id")] public virtual Staff? Staff { get; set; }
        [ForeignKey("supplier_id")] public virtual Supplier? Supplier { get; set; }
        public virtual ICollection<PurchaseInvoiceDetail>? PurchaseInvoiceDetails { get; set; }

        [NotMapped] public decimal TotalPayable => pur_inv_total_product_value - pur_inv_total_discount + pur_inv_total_vat;
        [NotMapped] public decimal RemainingDebt => TotalPayable - pur_inv_amount_paid;
        [NotMapped] public bool IsReceived => pur_inv_received_date.HasValue;
    }
}