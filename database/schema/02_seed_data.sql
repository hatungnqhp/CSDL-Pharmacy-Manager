USE PharmacyDB;

-- 1. NHOM DANH MUC & SAN PHAM
INSERT INTO CATEGORY (category_name, category_description) VALUES 
('Kháng sinh', 'Các loại thuốc diệt khuẩn, điều trị nhiễm trùng'),
('Giảm đau - Hạ sốt', 'Thuốc giảm đau thông thường và hạ sốt'),
('Thực phẩm chức năng', 'Vitamin và các sản phẩm hỗ trợ sức khỏe');

INSERT INTO PRODUCT (
    category_id, prod_national_code, prod_name, 
    prod_registration_number, prod_active_ingredient, 
    prod_dosage, prod_manufacturer, prod_country
) VALUES
(1, 'VN-0001', 'Amoxicillin 500mg', 'VD-10001-20', 'Amoxicillin', '500mg', 'Hau Giang Pharma', 'Vietnam'),
(1, 'VN-0002', 'Augmentin 625mg', 'VN-20002-21', 'Amoxicillin + Clavulanic', '625mg', 'GSK', 'France'),
(1, 'VN-0003', 'Cefuroxim 500mg', 'VD-10003-22', 'Cefuroxim', '500mg', 'Mekophar', 'Vietnam'),
(2, 'VN-0011', 'Paracetamol 500mg', 'VD-10011-20', 'Paracetamol', '500mg', 'Traphaco', 'Vietnam'),
(2, 'VN-0012', 'Hapacol 650', 'VD-10012-21', 'Paracetamol', '650mg', 'Hau Giang Pharma', 'Vietnam'),
(2, 'VN-0013', 'Efferalgan 500mg', 'VN-20013-18', 'Paracetamol', '500mg', 'UPSA', 'France'),
(3, 'VN-0021', 'Enervon', 'VD-10021-20', 'Vitamin B Complex + C', '500mg', 'United Pharma', 'Vietnam'),
(3, 'VN-0022', 'Berocca', 'VN-20022-19', 'Multi-vitamin', 'Effervescent', 'Bayer', 'Indonesia'),
(3, 'VN-0023', 'Dầu cá Omega 3', 'VN-20023-22', 'Fish Oil', '1000mg', 'Nature Made', 'USA');

INSERT INTO PRODUCT_UNIT (prod_id, prod_unit_id, prod_unit_name, prod_unit_exchange_value, prod_unit_price) VALUES 
(1, 1, 'Hộp', 100, 150000.00), (1, 2, 'Viên', 1, 2000.00),
(2, 3, 'Hộp', 14, 210000.00), (2, 4, 'Viên', 1, 18000.00),
(3, 5, 'Viên', 1, 5000.00),
(4, 6, 'Vỉ', 10, 15000.00), (4, 7, 'Viên', 1, 2000.00),
(5, 8, 'Viên', 1, 3000.00),
(6, 9, 'Viên', 1, 6000.00),
(7, 10, 'Chai', 100, 125000.00), (7, 11, 'Viên', 1, 1500.00),
(8, 12, 'Tuýp', 10, 95000.00), (8, 13, 'Viên', 1, 11000.00),
(9, 14, 'Viên', 1, 8000.00);

-- 2. NHOM DOI TAC & NHAN VIEN
INSERT INTO STAFF (staff_full_name, staff_birth_date, staff_phone) VALUES 
('Hà Quang Tùng', '2006-01-15', '0123456789'),
('Tôn Nữ Ngân Châu', '1985-08-20', '0987654321'),
('Nguyễn Văn Kiệt', '1992-12-10', '0112233445');

INSERT INTO SUPPLIER (supplier_name, supplier_phone) VALUES 
('Dược phẩm Trung ương 1', '0243123456'),
('DHG Pharma', '02923891433'),
('Công ty CP Dược phẩm Imexpharm', '02773851941');

INSERT INTO CUSTOMER (customer_name, customer_phone, customer_address, customer_medical_history) VALUES 
('Nguyễn Văn A', '0223344551', '123 Đường ABC, Quận 1, TP.HCM', 'Tiền sử dị ứng penicillin'),
('Trần Thị B', '0223344552', '456 Đường XYZ, Quận 2, TP.HCM', 'Tiền sử bệnh tim mạch');

-- 3. NHOM QUAN LY KHO (BATCH)
INSERT INTO BATCH (prod_id, prod_unit_id, batch_number, batch_manufacturing_date, batch_expiry_date, batch_current_qty) VALUES 
(1, 2, 'AMX-2026-001', '2025-10-01', '2027-10-01', 1000),
(2, 4, 'AUG-LOT-A1', '2026-01-15', '2028-01-15', 280),
(3, 5, 'CEF-500-B2', '2025-12-20', '2027-12-20', 250),
(4, 7, 'PARA-03-2026', '2026-03-01', '2029-03-01', 500),
(5, 8, 'HAPA-650-X', '2026-02-10', '2028-02-10', 2000),
(6, 9, 'EFF-E112', '2025-11-05', '2027-11-05', 480),
(7, 11, 'ENER-C-VITA', '2026-01-20', '2028-07-20', 1000),
(8, 13, 'BERO-SUI-09', '2026-02-28', '2027-08-28', 400),
(9, 14, 'OMEGA-US-99', '2025-09-15', '2027-09-15', 900);

-- 4. HOA DON NHAP & CHI TIET NHAP
INSERT INTO PURCHASE_INVOICE (
    pur_inv_supplier_invoice_code, staff_id, supplier_id, 
    pur_inv_received_date, pur_inv_invoice_date, 
    pur_inv_total_product_value, pur_inv_total_discount, pur_inv_total_vat, pur_inv_amount_paid
) VALUES 
('HD-CPC1-001', 1, 1, '2026-03-20 08:30:00', '2026-03-20', 545000.00, 5000.00, 14500.00, 545000.00),
('HD-DHG-992', 1, 2, '2026-03-21 14:15:00', '2026-03-21', 128000.00, 0.00, 12800.00, 12800.00),
('HD-IMEX-44', 2, 3, '2026-03-22 09:00:00', '2026-03-22', 475000.00, 15000.00, 46000.00, 475000.00);

INSERT INTO PURCHASE_INVOICE_DETAIL (
    pur_inv_id, batch_id, 
    pur_inv_dtl_import_qty, pur_inv_dtl_cost_price_unit, 
    pur_inv_dtl_discount_amount, pur_inv_dtl_vat_amount
) VALUES 
(1, 1, 10, 150000.00, 5000.00, 14500.00),
(1, 2, 20, 210000.00, 0.00, 21000.00),
(1, 3, 5, 185000.00, 10000.00, 17500.00),
(2, 4, 50, 15000.00, 500.00, 1450.00),
(2, 5, 100, 45000.00, 2000.00, 4300.00),
(2, 6, 30, 68000.00, 0.00, 6800.00),
(3, 7, 10, 125000.00, 5000.00, 12000.00),
(3, 8, 40, 95000.00, 0.00, 9500.00),
(3, 9, 15, 255000.00, 15000.00, 24000.00);

-- 5. HOA DON BAN & CHI TIET BAN
INSERT INTO SELL_INVOICE (staff_id, customer_id, sell_inv_date, sell_inv_total) VALUES 
(1, 1, '2026-03-22 10:00:00', 34000.00),
(2, 2, '2026-03-22 11:30:00', 438000.00),
(1, NULL, '2026-03-22 15:45:00', 15000.00);

INSERT INTO SELL_INVOICE_DETAIL (sell_inv_id, batch_id, prod_unit_id, sell_inv_dtl_sell_qty_pkg, prod_unit_price) VALUES 
(1, 4, 7, 1, 15000.00),
(1, 2, 4, 1, 19000.00),
(2, 8, 13, 2, 94000.00),
(3, 4, 7, 1, 15000.00);