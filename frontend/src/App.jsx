import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Form, Input, Button, DatePicker, InputNumber, Select, Card, Space, message, Divider, Typography } from 'antd';
import axios from 'axios';
import { PlusOutlined, DeleteOutlined, SaveOutlined, MedicineBoxOutlined, DropboxOutlined } from '@ant-design/icons';

const { Title } = Typography;
const API_BASE = "http://localhost:5223/api";

const App = () => {
  const [form] = Form.useForm();
  const [batches, setBatches] = useState([{ key: Date.now() }]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const watchedValues = Form.useWatch(['pur_inv_total_vat', 'pur_inv_total_discount'], form);

  const calculateSummary = () => {
    const values = form.getFieldsValue();
    // 1. Tính tổng tiền hàng (Base Value)
    const totalProductValue = batches.reduce((sum, b) => {
      const qty = values[`qty_${b.key}`] || 0;
      const cost = values[`cost_${b.key}`] || 0;
      return sum + (qty * cost);
    }, 0);

    // 2. Lấy các giá trị trực tiếp (Số tiền, không phải tỷ lệ)
    const totalVat = values.pur_inv_total_vat || 0;
    const totalDiscount = values.pur_inv_total_discount || 0;
    
    // 3. Tổng cộng cuối cùng của hóa đơn
    const finalAmount = totalProductValue + totalVat - totalDiscount;

    return { totalProductValue, totalVat, totalDiscount, finalAmount };
  };

  const summary = calculateSummary();



  // Load dữ liệu ban đầu
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resSupp, resProd] = await Promise.all([
          axios.get(`${API_BASE}/Supplier`),
          axios.get(`${API_BASE}/Product/search`)
        ]);
        setSuppliers(resSupp.data);
        setProducts(resProd.data);
      } catch (e) { message.error("Fail to load initial data"); }
    };
    fetchData();
  }, []);

  // Khi chọn Thuốc: Tự động điền Giá nhập và reset Đơn vị
  const handleProductChange = (prodId, key) => {
    const product = products.find(p => p.prod_id === prodId);
    if (product && product.units && product.units.length > 0) {
      const defaultUnit = product.units[0];
      form.setFieldsValue({
        [`prod_unit_id_${key}`]: defaultUnit.prod_unit_id,
        [`cost_${key}`]: defaultUnit.prod_unit_price
      });
    }
  };

  const handleUnitChange = (unitId, key) => {
    const prodId = form.getFieldValue(`prod_id_${key}`);
    const product = products.find(p => p.prod_id === prodId);
    const unit = product?.units?.find(u => u.prod_unit_id === unitId);
    if (unit) {
      form.setFieldsValue({ [`cost_${key}`]: unit.prod_unit_price });
    }
  };

  const removeBatchRow = (key) => {
    if (batches.length > 1) {
      setBatches(batches.filter(b => b.key !== key));
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        pur_inv_supplier_invoice_code: values.pur_inv_supplier_invoice_code,
        staff_id: 1,
        supplier_id: values.supplier_id,
        pur_inv_invoice_date: values.pur_inv_invoice_date?.toISOString(),
        pur_inv_received_date: values.pur_inv_received_date?.toISOString(),
        
        pur_inv_total_product_value: summary.totalProductValue,
        pur_inv_total_vat: values.pur_inv_total_vat || 0,
        pur_inv_total_discount: values.pur_inv_total_discount || 0,
        pur_inv_amount_paid: values.pur_inv_amount_paid || 0,
        pur_inv_note: values.pur_inv_note || "",

        Batches: batches.map(b => ({
          prod_id: values[`prod_id_${b.key}`],
          prod_unit_id: values[`prod_unit_id_${b.key}`],
          batch_number: values[`batch_number_${b.key}`] || "LOT-DEFAULT",
          batch_import_qty_pkg: values[`qty_${b.key}`],
          batch_cost_price_unit: values[`cost_${b.key}`],
          batch_expiry_date: values[`expiry_${b.key}`]?.toISOString(),
        }))
    };
    
    await axios.post(`${API_BASE}/PurchaseInvoice`, payload);
    message.success("Nhập kho thành công");
    form.resetFields();
    setBatches([{ key: Date.now() }]);
    } catch (e) { 
      const errorMsg = e.response?.data?.title || e.response?.data || e.message;
      message.error("Lỗi nhập kho: " + (typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg));
      console.error("Full Error:", e.response);
    }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card shadow="sm">
        <Title level={3}>Nhập hàng <DropboxOutlined/></Title>
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish} 
          initialValues={{
            pur_inv_total_vat: 0,
            pur_inv_total_discount: 0,
            pur_inv_amount_paid: 0,
            pur_inv_invoice_date: dayjs(),
            pur_inv_received_date: dayjs()
          }}
        >

          {/* 1. Header: Mã hóa đơn, Nhà cung cấp, Ngày tháng */}
          <Space size="large" wrap>
            <Form.Item name="pur_inv_supplier_invoice_code" label="Số hóa đơn" rules={[{required: false}]}><Input placeholder="Nhập số hóa đơn..."/></Form.Item>
            <Form.Item name="supplier_id" label="Nhà cung cấp" rules={[{required: true}]}>
              <Select
                placeholder="Chọn nhà cung cấp"
                showSearch = {{optionFilterProp: "label"}}
                options={suppliers.map(s => ({
                  value: s.supplier_id,
                  label: s.supplier_name
                }))}
              />
            </Form.Item>
            <Form.Item name="pur_inv_invoice_date" label="Ngày hóa đơn"><DatePicker/></Form.Item>
            <Form.Item name="pur_inv_received_date" label="Ngày nhập kho"><DatePicker/></Form.Item>
          </Space>

          <Divider titlePlacement="left">Danh sách thuốc nhập</Divider>

          {/* 2. Body: Danh sách các dòng thuốc nhập (Batches) */}
          {batches.map(batch => (
            <div key={batch.key} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginbottom: '12px', background: '#fafafa', padding: '12px', borderRadius: '8px' }}>
              <Form.Item name={`prod_id_${batch.key}`} label="Thuốc" style={{flex: 3}} rules={[{required: true}]}>
              <Select 
                showSearch={{
                  optionFilterProp: "label" 
                }}
                placeholder="Tìm theo tên..." 
                onChange={(val) => handleProductChange(val, batch.key)}
                options={products.map(p => ({
                  value: p.prod_id,
                  label: p.prod_name
                }))}
              />
              </Form.Item>
              <Form.Item name={`batch_number_${batch.key}`} label="Số lô" style={{flex: 1.5}} rules={[{required: false}]}>
                <Input placeholder="Nhập số lô..." />
              </Form.Item>
              <Form.Item shouldUpdate={(prev, curr) => prev[`prod_id_${batch.key}`] !== curr[`prod_id_${batch.key}`]} style={{flex: 2, marginbottom: 0}}>
                {() => (
                  <Form.Item name={`prod_unit_id_${batch.key}`} label="Đơn vị" rules={[{required: true}]}>
                    <Select 
                      placeholder="Chọn đơn vị" 
                      onChange={(val) => handleUnitChange(val, batch.key)}
                      options={products
                        .find(p => p.prod_id === form.getFieldValue(`prod_id_${batch.key}`))
                        ?.units?.map(u => ({
                          value: u.prod_unit_id,
                          label: u.prod_unit_name
                        }))}
                    />
                  </Form.Item>
                )}
              </Form.Item>

              <Form.Item name={`cost_${batch.key}`} label="Giá nhập" style={{flex: 2}} rules={[{required: true}]}><InputNumber min={0} step={1000} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} style={{width: '100%'} }/></Form.Item>
              <Form.Item name={`qty_${batch.key}`} label="Số lượng" style={{flex: 1.5}} rules={[{required: true}]}><InputNumber min={1} step={1} style={{width: '100%'}}/></Form.Item>
              <Form.Item name={`expiry_${batch.key}`} label="Hạn dùng" style={{flex: 2}} rules={[{required: true}]}><DatePicker style={{width: '100%'}}/></Form.Item>
              
              <Button type="text" danger onClick={() => removeBatchRow(batch.key)} icon={<DeleteOutlined />} style={{marginTop: '32px'}} />
            </div>
          ))}
          
          {/* 3. Nút thêm dòng (Thường đặt ngay sau danh sách thuốc) */}
          <Button type="dashed" onClick={() => setBatches([...batches, {key: Date.now()}])} block icon={<PlusOutlined />}>Thêm thuốc mới</Button>
          
          {/* 4. ĐẶT ĐOẠN CHI TIẾT THANH TOÁN Ở ĐÂY */}
          <Divider titlePlacement="left">Chi tiết thanh toán</Divider>
            <Form.Item shouldUpdate>
              {() => {
                const summary = calculateSummary(); // Gọi hàm tính toán tại đây
                return (
                  <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
                    <Space size="large" align="start">
                      <Form.Item name="pur_inv_total_vat" label="Tổng tiền VAT" marginbottom={0}>
                        <InputNumber min={0} step={1000} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} style={{ width: 200 }} />
                      </Form.Item>
                      <Form.Item name="pur_inv_total_discount" label="Tổng chiết khấu" marginbottom={0}>
                        <InputNumber min={0} max={summary.totalProductValue} step={1000} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} style={{ width: 200 }} />
                      </Form.Item>
                      <Form.Item name="pur_inv_amount_paid" label="Thực trả" rules={[{required: true}]} marginbottom={0}>
                        <InputNumber min={0} max={summary.finalAmount} step={1000} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} style={{ width: 200 }} />
                      </Form.Item>
                    </Space>

                    <div style={{ marginTop: '10px', textAlign: 'right', fontSize: '15px' }}>
                      <div>Tổng tiền hàng: <b>{summary.totalProductValue.toLocaleString()} đ</b></div>
                      <div>Thuế VAT (+): <span>{summary.totalVat.toLocaleString()} đ</span></div>
                      <div>Chiết khấu (-): <span>{summary.totalDiscount.toLocaleString()} đ</span></div>
                      <div style={{ fontSize: '18px', color: '#f5222d' }}>
                        Cần trả nhà cung cấp: <b>{summary.finalAmount.toLocaleString()} đ</b>
                      </div>
                    </div>
                  </div>
                );
              }}
            </Form.Item>

          {/* 5. Footer: Nút lưu hóa đơn cuối cùng */}
          <div style={{ marginTop: '24px', textAlign: 'right' }}>
            <Button type="primary" size="large" htmlType="submit" loading={loading} icon={<PlusOutlined />}>LƯU HÓA ĐƠN</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};
export default App;