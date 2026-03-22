using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyAPI.Models
{
    [Table("CATEGORY")]
    public class Category
    {
        [Key] [DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int category_id { get; set; }
        [Required] [StringLength(255)] public string category_name { get; set; } = string.Empty;
        public string? category_description { get; set; }
        public virtual ICollection<Product>? Products { get; set; } = new List<Product>();
    }
}