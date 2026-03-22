using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyAPI.Models
{
    [Table("SUPPLIER")]
    public class Supplier
    {
        [Key] [DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int supplier_id { get; set; }
        [Required] [StringLength(255)] public string supplier_name { get; set; } = string.Empty;
        [StringLength(20)] public string? supplier_phone { get; set; }
    }
}