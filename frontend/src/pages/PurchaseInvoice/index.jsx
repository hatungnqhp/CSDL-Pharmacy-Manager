import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Table, Form, Input, Button, DatePicker, InputNumber, Select, Card, Space, message, Divider, Typography, Modal } from 'antd';
import axios from 'axios';
import { PlusOutlined, DeleteOutlined, SaveOutlined, MedicineBoxOutlined, DropboxOutlined, HistoryOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const API_BASE = "http://localhost:5223/api";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

const PurchaseInvoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'done', 'pending'
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [confirmDate, setConfirmDate] = useState(dayjs());
  const [form] = Form.useForm();
  const [batches, setBatches] = useState([{ key: Date.now() }]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(dayjs().format('HH:mm:ss'));

  const fetchInvoices = async () => {
    try {
      const res = await axios.get(`${API_BASE}/PurchaseInvoice`);
      setInvoices(res.data);
      setLastUpdated(dayjs().format('HH:mm:ss'));
    } catch (e) {
      console.error("Lỗi tải danh sách hóa đơn:", e);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'done') return !!inv.pur_inv_received_date;
    if (filterStatus === 'pending') return !inv.pur_inv_received_date;
    return true;
  });

  const showConfirmModal = (record) => {
    setSelectedInvoice(record);
    setConfirmDate(dayjs());
    setIsConfirmModalVisible(true);
  };

  const handleConfirmOk = async () => {
    if (!selectedInvoice) return;

    try {
      const formattedDate = confirmDate.toISOString();
      
      await axios.patch(
        `${API_BASE}/PurchaseInvoice/${selectedInvoice.pur_inv_id}/confirm-receipt`, 
        JSON.stringify(formattedDate), 
        { headers: { 'Content-Type': 'application/json' } }
      );

      message.success("Xác nhận nhập kho thành công");
      setIsConfirmModalVisible(false);
      await fetchInvoices();
    } catch (e) {
      const errorMsg = e.response?.data || "Lỗi xác nhận";
      message.error(errorMsg);
    }
  };

  const invoiceColumns = [
    {
      title: 'Mã hóa đơn NCC',
      dataIndex: 'pur_inv_supplier_invoice_code',
      key: 'code',
      width: 150,
      render: (text) => {return text || "N/A"}
    },
    {
      title: 'Ngày hóa đơn',
      dataIndex: 'pur_inv_invoice_date',
      key: 'invoice_date',
      width: 150,
      sorter: (a, b) => dayjs(a.pur_inv_invoice_date).unix() - dayjs(b.pur_inv_invoice_date).unix(),
      defaultSortOrder: 'descend', 
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Ngày nhập',
      dataIndex: 'pur_inv_received_date',
      key: 'date',
      width: 180,
      hidden: filterStatus === 'pending',
      render: (date) => date ? dayjs.utc(date).local().format('DD/MM/YYYY HH:mm') : <span style={{ fontStyle: 'italic' }}>Chưa nhập kho</span>,
    },
    {
      title: 'Nhập hàng',
      key: 'action',
      width: 180,
      hidden: filterStatus !== 'pending',
      render: (_, record) => (
        !record.pur_inv_received_date && (
          <Button 
            type="link" 
            size="small" 
            icon={<PlusOutlined />} 
            onClick={() => showConfirmModal(record)}
          >
            Xác nhận nhập
          </Button>
        )
      ),
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplier_id',
      key: 'supplier',
      width: 250,
      render: (supId) => {
        const supplier = suppliers.find(s => s.supplier_id === supId);
        return supplier ? supplier.supplier_name : "N/A";
      }
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'pur_inv_total_product_value',
      key: 'total',
      width: 150,
      render: (val) => `${val?.toLocaleString()}`,
      align: 'right'
    },
    {
      title: 'Cần trả NCC',
      dataIndex: 'remainingDebt',
      key: 'remainingDebt',
      width: 150,
      render: (_, record) => {
        const total = (record.pur_inv_total_product_value || 0) 
                    + (record.pur_inv_total_vat || 0) 
                    - (record.pur_inv_total_discount || 0);
        const debt = total - (record.pur_inv_amount_paid || 0);
        return (
          <span style={{ color: debt <= 0 ? '#52c41a' : '#f5222d' }}>
            {debt.toLocaleString()}
          </span>
        );
      },
      align: 'right'
    },
  ];

//   const calculateSummary = () => {
//     const values = form.getFieldsValue();
//     // 1. Tính tổng tiền hàng (Base Value)
//     const totalProductValue = batches.reduce((sum, b) => {
//       const qty = values[`qty_${b.key}`] || 0;
//       const cost = values[`cost_${b.key}`] || 0;
//       return sum + (qty * cost);
//     }, 0);

//     const totalVat = values.pur_inv_total_vat || 0;
//     const totalDiscount = values.pur_inv_total_discount || 0;
//     const finalAmount = totalProductValue + totalVat - totalDiscount;
//     const amountPaid = values.pur_inv_amount_paid || 0;
//     const remainingDebt = finalAmount - amountPaid;

//     return { totalProductValue, totalVat, totalDiscount, finalAmount, remainingDebt };
//   };

  const calculateSummary = (values, currentBatches) => {
    const totalProductValue = currentBatches.reduce((sum, b) => {
      const qty = values[`qty_${b.key}`] || 0;
      const cost = values[`cost_${b.key}`] || 0;
      return sum + (qty * cost);
    }, 0);

    const totalVat = values.pur_inv_total_vat || 0;
    const totalDiscount = values.pur_inv_total_discount || 0;
    const finalAmount = totalProductValue + totalVat - totalDiscount;
    const amountPaid = values.pur_inv_amount_paid || 0;
    const remainingDebt = finalAmount - amountPaid;

    return { totalProductValue, totalVat, totalDiscount, finalAmount, remainingDebt };
  };

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
        await fetchInvoices();
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
    const summary = calculateSummary(values, batches);
    try {
      const payload = {
        pur_inv_supplier_invoice_code: values.pur_inv_supplier_invoice_code,
        staff_id: 1,
        supplier_id: values.supplier_id,
        pur_inv_invoice_date: values.pur_inv_invoice_date.format('YYYY-MM-DD'),
        pur_inv_received_date: values.pur_inv_received_date?.toISOString(),
        
        pur_inv_total_product_value: summary.totalProductValue,
        pur_inv_total_vat: values.pur_inv_total_vat || 0,
        pur_inv_total_discount: values.pur_inv_total_discount || 0,
        pur_inv_amount_paid: values.pur_inv_amount_paid || 0,
        pur_inv_note: values.pur_inv_note || "",

        PurchaseInvoiceDetails: batches.map(b => ({

          Batch: {
            prod_id: values[`prod_id_${b.key}`],
            prod_unit_id: values[`prod_unit_id_${b.key}`],
            batch_number: values[`batch_number_${b.key}`] || "LOT-DEFAULT",
            batch_manufacturing_date: null,
            batch_expiry_date: values[`expiry_${b.key}`]?.toISOString(),
            batch_current_qty: values[`qty_${b.key}`] 
          },

          pur_inv_dtl_import_qty: values[`qty_${b.key}`],
          pur_inv_dtl_cost_price_unit: values[`cost_${b.key}`],
          pur_inv_dtl_discount_amount: 0, 
          pur_inv_dtl_vat_amount: 0  
        }))
      };
      await axios.post(`${API_BASE}/PurchaseInvoice`, payload);
      message.success("Nhập kho thành công");
      await fetchInvoices();
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
    <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* PHẦN 1: DANH SÁCH CÁC LẦN NHẬP HÀNG */}
      <Card 
        title={<Space><MedicineBoxOutlined /><span>Lịch sử nhập hàng</span></Space>}
        shadow="sm"
      >
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="middle">
            <span>Trạng thái:</span>
            <Select 
              defaultValue="all" 
              style={{ width: 180 }} 
              onChange={(value) => setFilterStatus(value)}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'done', label: 'Đã nhập kho' },
                { value: 'pending', label: 'Chờ kiểm hàng' },
              ]}
            />
          </Space>

          <Space>
            <HistoryOutlined style={{ color: '#8c8c8c' }} />
            <Text type="secondary">Cập nhật lần cuối: {lastUpdated}</Text>
          </Space>
        </div>

        <Table 
          dataSource={filteredInvoices}
          columns={invoiceColumns} 
          rowKey="pur_inv_id" 
          pagination={{ pageSize: 5 }}
        />
      </Card>
      
      <div style={{ marginTop: '30px' }}></div>
      
      {/* PHẦN 2: FORM TẠO PHIẾU NHẬP */}
      <Card title={<><SaveOutlined /> Tạo phiếu nhập mới</>} shadow="sm">
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
            <Form.Item name="pur_inv_invoice_date" label="Ngày hóa đơn" rules={[{required: true}]}> 
              <DatePicker
                format="DD/MM/YYYY"
                value={form.getFieldValue('pur_inv_invoice_date')}
                onChange={(date) => form.setFieldsValue({ pur_inv_invoice_date: date })}
                style={{ width: '100%' }}
                allowClear={false}
              /> 
            </Form.Item>
            <Form.Item name="pur_inv_received_date" label="Ngày nhập kho" rules={[{required: false}]}>
              <DatePicker 
                showTime 
                format="DD/MM/YYYY HH:mm"
                value={form.getFieldValue('pur_inv_received_date')}
                onChange={(date) => form.setFieldsValue({ pur_inv_received_date: date })}
                placeholder="Chưa nhập kho" 
                style={{ width: '100%' }} 
                allowClear={true}
              />
            </Form.Item>
          </Space>

          <Divider titlePlacement="left">Danh sách thuốc nhập</Divider>

          {/* 2. Body: Danh sách các dòng thuốc nhập (Batches) */}
          {batches.map(batch => (
            <div key={batch.key} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '12px', background: '#fafafa', padding: '12px', borderRadius: '8px' }}>
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
              <Form.Item shouldUpdate={(prev, curr) => prev[`prod_id_${batch.key}`] !== curr[`prod_id_${batch.key}`]} noStyle>
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

              <Form.Item name={`cost_${batch.key}`} label="Giá nhập" style={{flex: 2}} rules={[{required: true}]}><InputNumber min={0} step={1000} placeholder="Nhập giá..." formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} style={{width: '100%'} }/></Form.Item>
              <Form.Item name={`qty_${batch.key}`} label="Số lượng" style={{flex: 1.5}} rules={[{required: true}]}><InputNumber min={1} step={1} defaultValue={1} placeholder="Nhập số lượng..." style={{width: '100%'}}/></Form.Item>
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
                const summary = calculateSummary(form.getFieldsValue(), batches);
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

      <Modal
        title="Xác nhận ngày nhập kho"
        open={isConfirmModalVisible}
        onOk={handleConfirmOk}
        onCancel={() => setIsConfirmModalVisible(false)}
        okText="Xác nhận nhập"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: '15px' }}>
          Hóa đơn: <b>{selectedInvoice?.pur_inv_supplier_invoice_code || "N/A"}</b>
        </div>
        <p>Vui lòng chọn ngày thực tế hàng về kho:</p>
        <DatePicker 
          showTime 
          format="DD/MM/YYYY HH:mm"
          value={confirmDate}
          onChange={(date) => setConfirmDate(date)}
          style={{ width: '100%' }}
          allowClear={false}
        />
      </Modal>

    </div>
  );
};
export default PurchaseInvoice;