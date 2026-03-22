using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyAPI.Models
{
    [Table("STAFF")]
    public class Staff
    {
        [Key] [DatabaseGenerated(DatabaseGeneratedOption.Identity)] public int staff_id { get; set; }
        [Required] [StringLength(255)] public string staff_full_name { get; set; } = string.Empty;
        public DateTime? staff_birth_date { get; set; }
        [StringLength(20)] public string? staff_phone { get; set; }
    }
}