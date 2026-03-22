using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyAPI.Models
{
    [Table("SELL_INVOICE")]
    public class SellInvoice
    {
        [Key] [DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int sell_inv_id { get; set; }
        [Required] public int staff_id { get; set; }
        public int? customer_id { get; set; }
        public DateTime sell_inv_date { get; set; } = DateTime.Now;
        [Column(TypeName = "decimal(15,2)")] public decimal sell_inv_total { get; set; }
        [ForeignKey("staff_id")] public virtual Staff? Staff { get; set; }
        [ForeignKey("customer_id")] public virtual Customer? Customer { get; set; }
        public virtual ICollection<SellInvoiceDetail> Details { get; set; } = new List<SellInvoiceDetail>();
    }
}