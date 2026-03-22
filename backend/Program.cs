using Microsoft.EntityFrameworkCore;
using PharmacyAPI.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Lấy Connection String từ appsettings.json
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// 2. Đăng ký DbContext với MySQL (Pomelo Driver)
builder.Services.AddDbContext<PharmacyContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// 3. Thêm dịch vụ Controller (Thay thế cho Minimal API mặc định)
builder.Services.AddControllers()
    .AddJsonOptions(options => 
    {
        // Ngăn chặn vòng lặp vô tận khi chuyển đổi dữ liệu sang JSON
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// 4. Cấu hình Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors("AllowReact");
app.UseAuthorization();
app.MapControllers();

app.Run();