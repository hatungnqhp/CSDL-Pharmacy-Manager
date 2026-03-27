using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyAPI.Models
{
    [Table("PURCHASE_INVOICE_DETAIL")]
    public class PurchaseInvoiceDetail
    {
        [Required] public int pur_inv_id { get; set; }
        [Required] public int batch_id { get; set; }
        [Required] public int pur_inv_dtl_import_qty { get; set; }
        [Required] [Column(TypeName = "decimal(15,2)")] public decimal pur_inv_dtl_cost_price_unit { get; set; }
        [Required] [Column(TypeName = "decimal(15,2)")] public decimal pur_inv_dtl_discount_amount { get; set; }
        [Required] [Column(TypeName = "decimal(15,2)")] public decimal pur_inv_dtl_vat_amount { get; set; }

        [ForeignKey("pur_inv_id")] public virtual PurchaseInvoice? PurchaseInvoice { get; set; }
        [ForeignKey("batch_id")] public virtual Batch? Batch { get; set; }
    }
}