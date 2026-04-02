import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Col, Row, Modal, Table, Form, Input, InputNumber, Select, Card, Space, Button, DatePicker, Divider, Typography, message } from 'antd';
import axios from 'axios';
import { EditOutlined, PlusOutlined, DeleteOutlined, SaveOutlined, HistoryOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const API_BASE = "http://localhost:5223/api";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Ho_Chi_Minh");

const SellInvoice = () => {
  const [form] = Form.useForm();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [batchesPerProduct, setBatchesPerProduct] = useState({}); 
  const [sellItems, setSellItems] = useState([{ key: Date.now() }]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('all'); // 'today', 'month', 'all'
  const [lastUpdated, setLastUpdated] = useState(dayjs().format('HH:mm:ss'));
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [editCustomerForm] = Form.useForm();

  const fetchInvoices = async () => {
    try {
      const res = await axios.get(`${API_BASE}/SellInvoice`);
      setInvoices(res.data);
      setLastUpdated(dayjs().format('HH:mm:ss'));
    } catch (e) {
      message.error("Lỗi tải danh sách hóa đơn");
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        const [resCust, resProd] = await Promise.all([
          axios.get(`${API_BASE}/Customer`),
          axios.get(`${API_BASE}/Product/search`)
        ]);
        setCustomers(resCust.data);
        setProducts(resProd.data);
        await fetchInvoices();
      } catch (e) {
        message.error("Lỗi khởi tạo dữ liệu");
      }
    };
    initData();
  }, []);

  const handleProductChange = async (prodId, key) => {
    try {
      let currentBatches = batchesPerProduct[prodId];
      if (!currentBatches) {
        const res = await axios.get(`${API_BASE}/Batch?productId=${prodId}`);
        currentBatches = res.data;
        setBatchesPerProduct(prev => ({ ...prev, [prodId]: currentBatches }));
      }

      const validBatches = currentBatches.filter(b => b.batch_current_qty > 0);

      if (validBatches && validBatches.length > 0) {
        const firstBatch = validBatches[0];
        // Cập nhật lô đầu tiên và lấy đơn vị từ chính lô đó
        form.setFieldsValue({
          [`batch_id_${key}`]: firstBatch.batch_id,
          [`prod_unit_id_${key}`]: firstBatch.productUnit?.prod_unit_id,
          [`prod_unit_name_${key}`]: firstBatch.productUnit?.prod_unit_name,
          [`price_${key}`]: firstBatch.productUnit?.prod_unit_price || 0,
          [`qty_${key}`]: 1
        });
      } else {
        form.setFieldsValue({
          [`batch_id_${key}`]: undefined,
          [`prod_unit_id_${key}`]: undefined,
          [`prod_unit_name_${key}`]: undefined,
          [`price_${key}`]: undefined,
          [`qty_${key}`]: undefined
        });
      }
    } catch (e) {
      message.error("Lỗi khi tải lô hàng");
    }
  };

  const handleBatchChange = (batchId, key) => {
    const prodId = form.getFieldValue(`prod_id_${key}`);
    const batch = (batchesPerProduct[prodId] || []).find(b => b.batch_id === batchId);
    if (batch && batch.productUnit) {
      form.setFieldsValue({
        [`prod_unit_id_${key}`]: batch.productUnit.prod_unit_id,
        [`prod_unit_name_${key}`]: batch.productUnit.prod_unit_name,
        [`price_${key}`]: batch.productUnit.prod_unit_price || 0,
        [`qty_${key}`]: 1
      });
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const processedItems = sellItems.map(item => ({
        prod_id: values[`prod_id_${item.key}`],
        batch_id: values[`batch_id_${item.key}`],
        prod_unit_id: values[`prod_unit_id_${item.key}`],
        qty: Number(values[`qty_${item.key}`] || 0),
        price: Number(values[`price_${item.key}`] || 0)
      }));

      const payload = {
        staff_id: 1,
        customer_id: values.customer_id || null,
        sell_inv_date: values.sell_inv_date.toISOString(),
        sell_inv_total: processedItems.reduce((sum, d) => sum + (d.qty * d.price), 0),
        sellInvoiceDetails: processedItems.map(d => ({
          batch_id: d.batch_id,
          prod_unit_id: d.prod_unit_id,
          sell_inv_dtl_sell_qty_pkg: d.qty,
          prod_unit_price: d.price
        }))
      };

      await axios.post(`${API_BASE}/SellInvoice`, payload);
      message.success("Bán hàng thành công");

      setBatchesPerProduct(prev => {
        const newState = { ...prev };
        processedItems.forEach(item => {
          if (newState[item.prod_id]) {
            newState[item.prod_id] = newState[item.prod_id].map(batch => {
              if (batch.batch_id === item.batch_id) {
                return {
                  ...batch,
                  batch_current_qty: batch.batch_current_qty - item.qty
                };
              }
              return batch;
            });
          }
        });
        return newState;
      });

      form.resetFields();
      setSellItems([{ key: Date.now() }]);
      fetchInvoices();
    } catch (e) {
      message.error("Lỗi lưu hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const removeSellItem = (key) => {
    if (sellItems.length > 1) {
      setSellItems(sellItems.filter(item => item.key !== key));
    }
  };

  const handleAddCustomer = async (values) => {
    try {
      const res = await axios.post(`${API_BASE}/Customer`, values);
      message.success("Thêm khách hàng thành công");
      const newCustomer = res.data;
      
      setCustomers(prev => [...prev, newCustomer]);
      form.setFieldsValue({ customer_id: newCustomer.customer_id });
      
      setIsCustomerModalOpen(false);
      customerForm.resetFields();
    } catch (e) {
      message.error("Lỗi khi thêm khách hàng");
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const invDate = dayjs(inv.sell_inv_date);
    if (dateFilter === 'today') {
      return invDate.isSame(dayjs(), 'day');
    }
    if (dateFilter === 'month') {
      return invDate.isSame(dayjs(), 'month');
    }
    return true; // 'all'
  });

  const handleUpdateCustomer = async (values) => {
    const customerId = form.getFieldValue('customer_id');
    try {
      const res = await axios.put(`${API_BASE}/Customer/${customerId}`, {
        ...values,
        customer_id: customerId
      });
      
      const updatedCustomer = res.data; // Lúc này res.data đã có dữ liệu từ Backend
      
      message.success("Cập nhật khách hàng thành công");
      
      // 1. Cập nhật danh sách khách hàng để Select Options cập nhật label mới
      setCustomers(prev => prev.map(c => c.customer_id === customerId ? updatedCustomer : c));
      
      // 2. Ép Form chính cập nhật lại giá trị hiển thị (tránh bị hiện ID thay vì Name)
      form.setFieldsValue({
        customer_id: updatedCustomer.customer_id
      });

      setIsEditCustomerModalOpen(false);
    } catch (e) {
      console.error(e);
      message.error("Lỗi khi cập nhật thông tin");
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f0f2f5' }}>
      <Card title={<Space><HistoryOutlined />Lịch sử bán hàng</Space>} style={{ marginBottom: 24 }}>
        {/* Dòng Filter và Time Update */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="middle">
            <span>Thời gian:</span>
            <Select 
              defaultValue="all" 
              style={{ width: 150 }} 
              onChange={(value) => setDateFilter(value)}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'today', label: 'Hôm nay' },
                { value: 'month', label: 'Tháng này' },
              ]}
            />
          </Space>

          <Space>
            <HistoryOutlined style={{ color: '#8c8c8c' }} />
            <Text type="secondary">Cập nhật lần cuối: {lastUpdated}</Text>
          </Space>
        </div>

        <Table 
          dataSource={filteredInvoices} // Dùng dữ liệu đã lọc
          rowKey="sell_inv_id" 
          pagination={{ pageSize: 5 }} 
          size="small"
          columns={[
            { title: 'Mã hóa đơn', dataIndex: 'sell_inv_id', width: 120 },
            { title: 'Ngày bán', dataIndex: 'sell_inv_date', render: d => dayjs(d).format('DD/MM/YYYY HH:mm') },
            { title: 'Khách hàng', dataIndex: 'customer_id', render: (customerId) => {
              const customer = customers.find(c => c.customer_id === customerId);
              return customer ? `${customer.customer_phone} - ${customer.customer_name}` : 'Khách lẻ';
            }},
            { title: 'Tổng tiền', dataIndex: 'sell_inv_total', align: 'right', render: v => <Text style={{ color: '#52c41a' }}>{v?.toLocaleString()}</Text> }
          ]}
        />
      </Card>

      <Card title={<Space><SaveOutlined />Tạo phiếu bán hàng</Space>}>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ sell_inv_date: dayjs() }}>
          <Row gutter={24} align="top">
            {/* CỘT 1: CHỌN KHÁCH HÀNG */}
            <Col span={8}>
              <Form.Item label="Khách hàng">
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="customer_id" noStyle>
                    <Select
                      showSearch={{ optionFilterProp: "filter" }}
                      placeholder="Tìm tên hoặc SĐT..."
                      allowClear
                      style={{ width: '100%' }}
                      options={customers.map(c => ({
                        value: c.customer_id,
                        label: `${c.customer_phone} - ${c.customer_name}`,
                        filter: `${c.customer_phone} ${c.customer_name}`,
                      }))}
                    />
                  </Form.Item>
                  {/* Nút Sửa: Chỉ hiện khi đã chọn 1 khách hàng */}
                  <Form.Item shouldUpdate={(prev, curr) => prev.customer_id !== curr.customer_id} noStyle>
                    {({ getFieldValue }) => {
                      const selectedId = getFieldValue('customer_id');
                      return (
                        <Button 
                          icon={<EditOutlined />} 
                          disabled={!selectedId}
                          onClick={() => {
                            const cust = customers.find(c => c.customer_id === selectedId);
                            editCustomerForm.setFieldsValue(cust); // Đổ dữ liệu vào form sửa
                            setIsEditCustomerModalOpen(true);
                          }}
                          title="Sửa thông tin khách hàng"
                        />
                      );
                    }}
                  </Form.Item>
                  <Button 
                    icon={<PlusOutlined />} 
                    onClick={() => setIsCustomerModalOpen(true)}
                    title="Thêm khách hàng mới"
                  />
                </Space.Compact>
              </Form.Item>
            </Col>

            {/* CỘT 2: THÔNG TIN CHI TIẾT (Chỉ hiện chữ thuần) */}
            <Col span={10}>
              <Form.Item label="Thông tin khách hàng">
                <Form.Item shouldUpdate={(prev, curr) => prev.customer_id !== curr.customer_id} noStyle>
                  {({ getFieldValue }) => {
                    const custId = getFieldValue('customer_id');
                    const cust = customers.find(c => c.customer_id === custId);
                    if (!cust) return <Text type="secondary" italic>Chưa chọn khách hàng</Text>;

                    return (
                      <div style={{ paddingTop: '0px' }}>
                        <div>{cust.customer_address || 'N/A'}</div>
                        <div>{cust.customer_medical_history || 'Không'}</div>
                      </div>
                    );
                  }}
                </Form.Item>
              </Form.Item>
            </Col>

            {/* CỘT 3: NGÀY LẬP PHIẾU */}
            <Col span={6}>
              <Form.Item name="sell_inv_date" label="Ngày lập phiếu" rules={[{ required: true }]}>
                <DatePicker 
                  showTime 
                  format="DD/MM/YYYY HH:mm" 
                  allowClear={false} 
                  style={{ width: '100%' }} 
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider titlePlacement="left">Danh mục thuốc</Divider>

          {sellItems.map((item) => (
            <div key={item.key} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start', background: '#fafafa', padding: 15, borderRadius: 8, border: '1px solid #eee' }}>
              <Form.Item name={`prod_id_${item.key}`} label="Sản phẩm" rules={[{ required: true }]} style={{ flex: 3 }}>
                <Select 
                  showSearch = {{optionFilterProp: "label"}}
                  placeholder="Chọn sản phẩm..."
                  onChange={(val) => handleProductChange(val, item.key)}
                  options={products.map(p => ({ value: p.prod_id, label: p.prod_name }))}
                />
              </Form.Item>

              <Form.Item shouldUpdate={(prev, curr) => prev[`prod_id_${item.key}`] !== curr[`prod_id_${item.key}`]} style={{ flex: 3 }}>
                {({ getFieldValue }) => {
                  const productId = getFieldValue(`prod_id_${item.key}`);
                  const availableBatches = (batchesPerProduct[productId] || [])
                    .filter(b => b.batch_current_qty > 0); // LỌC CHỈ LẤY LÔ CÒN HÀNG

                  return (
                    <Form.Item name={`batch_id_${item.key}`} label="Lô hàng" rules={[{ required: true, message: 'Chọn lô' }]}>
                      <Select 
                        placeholder={availableBatches.length > 0 ? "Chọn lô hàng..." : (productId ? "Hết hàng" : "Chọn sản phẩm trước")}
                        onChange={(val) => handleBatchChange(val, item.key)}
                        options={availableBatches.map(b => ({
                          value: b.batch_id,
                          label: `${b.batch_number} - Hạn: ${dayjs(b.batch_expiry_date).format('DD/MM/YYYY')} - Tồn: ${b.batch_current_qty} ${b.productUnit?.prod_unit_name || ''}`
                        }))}
                      />
                    </Form.Item>
                  );
                }}
              </Form.Item>

              <Form.Item label="Đơn vị" style={{ flex: 1.5 }}>
                {/* Field ẩn để submit ID */}
                <Form.Item name={`prod_unit_id_${item.key}`} noStyle>
                  <Input type="hidden" />
                </Form.Item>
                {/* Field hiển thị tên đơn vị của lô */}
                <Form.Item name={`prod_unit_name_${item.key}`} noStyle>
                  <Input disabled placeholder="Đơn vị" />
                </Form.Item>
              </Form.Item>

              <Form.Item name={`price_${item.key}`} label="Đơn giá" rules={[{ required: true }]} style={{ flex: 2 }}>
                <InputNumber formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name={`qty_${item.key}`} label="Số lượng" rules={[{ required: true }]} style={{ flex: 1.5 }}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>

              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeSellItem(item.key)} style={{ marginTop: 30 }} />
            </div>
          ))}

          <Button type="dashed" block icon={<PlusOutlined />} onClick={() => setSellItems([...sellItems, { key: Date.now() }])} style={{ marginBottom: 20 }}>Thêm dòng</Button>

          <Form.Item shouldUpdate noStyle>
            {({ getFieldsValue }) => {
              const values = getFieldsValue();
              const total = sellItems.reduce((sum, item) => sum + ((values[`qty_${item.key}`] || 0) * (values[`price_${item.key}`] || 0)), 0);
              return (
                <div style={{ textAlign: 'right', padding: 20, background: '#fff', border: '1px solid #d9d9d9', borderRadius: 8 }}>
                  <Text strong>Tổng tiền thanh toán:</Text>
                  <Title level={2} style={{ color: '#52c41a', margin: 0 }}>{total.toLocaleString()} đ</Title>
                </div>
              );
            }}
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Button type="primary" size="large" htmlType="submit" loading={loading} icon={<SaveOutlined />}>LƯU HÓA ĐƠN</Button>
          </div>
        </Form>
      </Card>

      {/* Modal thêm khách hàng */}
      <Modal 
        title="Thêm khách hàng mới" 
        open={isCustomerModalOpen} 
        onOk={() => customerForm.submit()} 
        onCancel={() => setIsCustomerModalOpen(false)}
        destroyOnHidden={true}
      >
        <div style={{ marginBottom: '15px' }}> </div>
        <Form form={customerForm} layout="vertical" onFinish={handleAddCustomer}>
          <Form.Item 
            name="customer_name" 
            label="Tên khách hàng" 
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
          >
            <Input placeholder="Nhập tên khách hàng" />
          </Form.Item>
          <Form.Item 
            name="customer_phone" 
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập SĐT' },
              { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có đúng 10 chữ số' }
            ]}
          >
            <Input placeholder="Nhập số điện thoại" maxLength={10} />
          </Form.Item>
          <Form.Item name="customer_address" label="Địa chỉ">
            <Input rows={2} />
          </Form.Item>
          <Form.Item name="customer_medical_history" label="Tiền sử bệnh / dị ứng">
            <Input rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal 
        title="Chỉnh sửa thông tin khách hàng" 
        open={isEditCustomerModalOpen} 
        onOk={() => editCustomerForm.submit()} 
        onCancel={() => setIsEditCustomerModalOpen(false)}
        okText="Lưu thay đổi"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: '15px' }}></div>
        <Form form={editCustomerForm} layout="vertical" onFinish={handleUpdateCustomer}>
          <Form.Item name="customer_name" label="Tên khách hàng" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item 
            name="customer_phone" 
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập SĐT' },
              { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có đúng 10 chữ số' }
            ]}
          >
            <Input placeholder="Nhập số điện thoại" maxLength={10} />
          </Form.Item>
          <Form.Item name="customer_address" label="Địa chỉ">
            <Input />
          </Form.Item>
          <Form.Item name="customer_medical_history" label="Tiền sử bệnh / dị ứng">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SellInvoice;