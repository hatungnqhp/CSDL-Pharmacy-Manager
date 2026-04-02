# PHARMACY MANAGER
## 1. Giới thiệu dự án
- **Học phần:** Cơ sở dữ liệu (PTIT).
- **Đề tài:** Hệ thống quản lý hiệu thuốc tây và hạn sử dụng.
- **Thời gian thực hiện:** 08 tuần (Tháng 02/2026 - 04/2026).
- **Bối cảnh:** Giải quyết các vấn đề về sai lệch dữ liệu nhập thực tế và rủi ro thuốc hết hạn trong các nhà thuốc vừa và nhỏ.

## 2. Thành viên thực hiện
- **Hà Quang Tùng B24DCGA158**: Phát triển Fullstack, thiết kế database.
- **Tô Nữ Ngân Châu B24DCGA018**: Thiết kế CSDL quan hệ, chuẩn hóa, ràng buộc.
- **Ngô Văn Kiệt B24DCGA082**: Xây dựng mô hình thực thể liên kết, chuẩn bị tài liệu kỹ thuật và thuyết trình.

## 3. Kiến trúc công nghệ
Hệ thống được phát triển trên mô hình Client-Server tách biệt:

### Frontend
- **Framework:** React.js.
- **UI Kit:** Ant Design (v5.x).

### Backend
- **Platform:** .NET 8.0 (ASP.NET Core Web API).

### Database
- **Engine:** SQL Server.

## 4. Các chức năng chính
- **Quản lý Hàng hóa:** Lưu trữ danh mục thuốc, SDK, hoạt chất, đơn vị tính và giá niêm yết.
- **Quản lý Nhập xuất kho:** Lập phiếu nhập xuất kho, xác nhận nhập kho thực tế, quản lý lô hàng và hạn sử dụng
- **Quản lý Dòng tiền:** Tự động tính toán nợ tồn và doanh thu.
- **Truy vấn:** Tìm kiếm đa năng, lọc theo trạng thái và sắp xếp dữ liệu theo thời gian thực.

## 5. Cài đặt và Chạy thử

### Yêu cầu hệ thống
- .NET SDK 8.0+
- Node.js 18.x+
- SQL Server 2019+

### Các bước cài đặt
1. **Database:**
   - Chạy script SQL trong thư mục `/Database`.
2. **Backend:**
   - Di chuyển vào thư mục `/Backend`.
   - Cấu hình `appsettings.json`,
   - Chạy lệnh: `dotnet run`.
3. **Frontend:**
   - Di chuyển vào thư mục `/Frontend`.
   - Chạy lệnh: `npm install`.
   - Chạy lệnh: `npm start`.
