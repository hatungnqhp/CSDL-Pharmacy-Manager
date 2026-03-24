-- 1. NHOM DANH MUC & SAN PHAM
CREATE TABLE CATEGORY (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(255) NOT NULL UNIQUE,
    category_description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE PRODUCT (
    prod_id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    prod_national_code VARCHAR(50) UNIQUE,          -- Ma duoc quoc gia
    prod_name VARCHAR(255) NOT NULL,
    prod_registration_number VARCHAR(100) UNIQUE,   -- So dang ky
    prod_active_ingredient TEXT,                    -- Hoat chat chinh
    prod_registration_ingredient TEXT,              -- Hoat chat dang ky
    prod_dosage VARCHAR(100),                       -- Ham luong
    prod_manufacturer VARCHAR(255),
    prod_country VARCHAR(100),
    CONSTRAINT fk_prod_category FOREIGN KEY (category_id) REFERENCES CATEGORY(category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE PRODUCT_UNIT (
    prod_unit_id INT PRIMARY KEY AUTO_INCREMENT,
    prod_id INT NOT NULL,
    prod_unit_name VARCHAR(50) NOT NULL,
    prod_unit_exchange_value INT NOT NULL DEFAULT 1, -- Gia tri quy doi ra don vi goc
    prod_unit_price DECIMAL(18, 2) NOT NULL,         -- Gia ban niem yet
    CONSTRAINT fk_unit_product FOREIGN KEY (prod_id) REFERENCES PRODUCT(prod_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. NHOM DOI TAC & NHAN VIEN
CREATE TABLE STAFF (
    staff_id INT PRIMARY KEY AUTO_INCREMENT,
    staff_full_name VARCHAR(255) NOT NULL,
    staff_birth_date DATE,
    staff_phone VARCHAR(20) UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE SUPPLIER (
    supplier_id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_phone VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE CUSTOMER (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) UNIQUE,
    customer_address TEXT,
    customer_medical_history TEXT          -- Tien su benh ly/Di ung
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. NHOM QUAN LY NHAP KHO (BATCH)
CREATE TABLE PURCHASE_INVOICE (
    pur_inv_id INT PRIMARY KEY AUTO_INCREMENT,
    pur_inv_supplier_invoice_code VARCHAR(100),
    staff_id INT NOT NULL DEFAULT 1,
    supplier_id INT NOT NULL,

    pur_inv_received_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    pur_inv_invoice_date DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    pur_inv_total_product_value DECIMAL(18, 2) DEFAULT 0, -- Tổng tiền hàng (Gốc)
    pur_inv_total_discount DECIMAL(18, 2) DEFAULT 0,      -- Tổng chiết khấu toàn đơn
    pur_inv_total_vat DECIMAL(18, 2) DEFAULT 0,           -- Tổng thuế VAT toàn đơn
    pur_inv_amount_paid DECIMAL(18, 2) DEFAULT 0,         -- Số tiền đã thanh toán thực tế
    
    pur_inv_note TEXT,
    
    CONSTRAINT fk_pur_staff FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id),
    CONSTRAINT fk_pur_supplier FOREIGN KEY (supplier_id) REFERENCES SUPPLIER(supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE BATCH (
    batch_id INT PRIMARY KEY AUTO_INCREMENT,
    prod_id INT NOT NULL,
    pur_inv_id INT NOT NULL,
    prod_unit_id INT NOT NULL,         -- Don vi luc nhap
    batch_number VARCHAR(100) NOT NULL, -- So lo SX
    batch_import_qty_pkg INT NOT NULL,  -- SL nhap theo don vi nhap
    batch_current_qty_base INT NOT NULL, -- SL ton quy doi ra don vi goc
    batch_manufacturing_date DATE,
    batch_expiry_date DATE NOT NULL,
    batch_cost_price_unit DECIMAL(18, 2), -- Gia nhap
    batch_discount_amount DECIMAL(18, 2) DEFAULT 0,
    batch_vat_amount DECIMAL(18, 2) DEFAULT 0,
    CONSTRAINT fk_batch_prod FOREIGN KEY (prod_id) REFERENCES PRODUCT(prod_id),
    CONSTRAINT fk_batch_inv FOREIGN KEY (pur_inv_id) REFERENCES PURCHASE_INVOICE(pur_inv_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. NHOM BAN HANG
CREATE TABLE SELL_INVOICE (
    sell_inv_id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT NOT NULL,
    customer_id INT,
    sell_inv_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    sell_inv_total DECIMAL(18, 2) DEFAULT 0,
    CONSTRAINT fk_sell_staff FOREIGN KEY (staff_id) REFERENCES STAFF(staff_id),
    CONSTRAINT fk_sell_cust FOREIGN KEY (customer_id) REFERENCES CUSTOMER(customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE SELL_INVOICE_DETAIL (
    sell_inv_dtl_id INT PRIMARY KEY AUTO_INCREMENT,
    sell_inv_id INT NOT NULL,
    batch_id INT NOT NULL,
    prod_unit_id INT NOT NULL,
    sell_inv_dtl_sell_qty_pkg INT NOT NULL,
    prod_unit_price DECIMAL(18, 2) NOT NULL,
    CONSTRAINT fk_dtl_inv FOREIGN KEY (sell_inv_id) REFERENCES SELL_INVOICE(sell_inv_id),
    CONSTRAINT fk_dtl_batch FOREIGN KEY (batch_id) REFERENCES BATCH(batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;