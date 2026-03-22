using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyAPI.Models
{
    [Table("PRODUCT")]
    public class Product
    {
        [Key] [DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int prod_id { get; set; }
        [Required] public int category_id { get; set; }
        public string? prod_national_code { get; set; }
        [Required] [StringLength(255)] public string prod_name { get; set; } = string.Empty;
        [Required] [StringLength(100)] public string prod_registration_number { get; set; } = string.Empty;
        public string? prod_active_ingredient { get; set; }
        public string? prod_registration_ingredient { get; set; }
        [StringLength(50)] public string? prod_dosage { get; set; }
        [StringLength(255)] public string? prod_manufacturer { get; set; }
        [StringLength(100)] public string? prod_country { get; set; }
        [ForeignKey("category_id")] public virtual Category? Category { get; set; }
        [ForeignKey("prod_unit_id")] public virtual ICollection<ProductUnit>? ProductUnits { get; set; } = new List<ProductUnit>();
    }
}