using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyAPI.Models
{
    [Table("PRODUCT_UNIT")]
    public class ProductUnit
    {
        [Required] public int prod_id { get; set; }
        [Required] public int prod_unit_id { get; set; }
        [Required] [StringLength(50)] public string prod_unit_name { get; set; } = string.Empty;
        [Required] public int prod_unit_exchange_value { get; set; }
        [Required] [Column(TypeName = "decimal(15,2)")] public decimal prod_unit_price { get; set; }

        [ForeignKey("prod_id")] public virtual Product? Product { get; set; }
        public virtual ICollection<Batch>? Batches { get; set; }
    }
}