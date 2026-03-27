using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyAPI.Models
{
    [Table("SELL_INVOICE_DETAIL")]
    public class SellInvoiceDetail
    {
        [Required] public int sell_inv_id { get; set; }
        [Required] public int batch_id { get; set; }
        [Required] public int prod_unit_id { get; set; }
        [Required] public int sell_inv_dtl_sell_qty_pkg { get; set; }
        [Required] [Column(TypeName = "decimal(18,2)")] public decimal prod_unit_price { get; set; }

        [ForeignKey("sell_inv_id")] public virtual SellInvoice? SellInvoice { get; set; }
        [ForeignKey("batch_id")] public virtual Batch? Batch { get; set; }
    }
}