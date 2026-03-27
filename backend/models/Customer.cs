using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyAPI.Models
{
    [Table("CUSTOMER")]
    public class Customer
    {
        [Key] [DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int customer_id { get; set; }
        [Required] [StringLength(255)] public string customer_name { get; set; } = string.Empty;
        [StringLength(20)] public string? customer_phone { get; set; }
        public string? customer_address { get; set; }
        public string? customer_medical_history { get; set; }

        public virtual ICollection<SellInvoice>? SellInvoices { get; set; }
    }
}