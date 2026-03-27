import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, InputNumber, Space, Tag, Modal, Form, Select, Typography, Divider, Row, Col, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FolderOpenOutlined, MedicineBoxOutlined, HistoryOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Option } = Select;
const API_BASE = "http://localhost:5223/api";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [lastUpdated, setLastUpdated] = useState(dayjs().format('HH:mm:ss'));
  
  // Modal states
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodForm] = Form.useForm();
  const [catForm] = Form.useForm();
  const [productUnits, setProductUnits] = useState([{ key: Date.now(), prod_unit_exchange_value: 1 }]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resProd, resCat] = await Promise.all([
        axios.get(`${API_BASE}/Product`),
        axios.get(`${API_BASE}/Category`)
      ]);
      setProducts(resProd.data);
      setCategories(resCat.data);
      setLastUpdated(dayjs().format('HH:mm:ss'));
    } catch (e) {
      message.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Column Definitions ---
  const columns = [
    {
      title: 'Tên mặt hàng',
      dataIndex: 'prod_name',
      key: 'prod_name',
      render: (text, record) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>SĐK: {record.prod_registration_number}</Text>
        </Space>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category_id',
      render: (catId) => {
        const cat = categories.find(c => c.category_id === catId);
        return <Tag color="blue">{cat?.category_name || "N/A"}</Tag>;
      }
    },
    {
      title: 'Hãng sản xuất',
      dataIndex: 'prod_manufacturer',
      render: (text, record) => (
        <Space orientation="vertical" size={0}>
          <Text>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.prod_country}</Text>
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditProduct(record)}>Sửa</Button>
        </Space>
      ),
    }
  ];

  // --- Logic Handlers ---
  const handleEditProduct = async (product) => {
    try {
      const res = await axios.get(`${API_BASE}/Product/${product.prod_id}`);
      const productWithUnits = res.data;

      setEditingProduct({ ...productWithUnits });
      prodForm.setFieldsValue({
        prod_name: productWithUnits.prod_name,
        category_id: productWithUnits.category_id,
        prod_national_code: productWithUnits.prod_national_code,
        prod_registration_number: productWithUnits.prod_registration_number,
        prod_manufacturer: productWithUnits.prod_manufacturer,
        prod_country: productWithUnits.prod_country,
        prod_active_ingredient: productWithUnits.prod_active_ingredient,
        prod_dosage: productWithUnits.prod_dosage,
        prod_registration_ingredient: productWithUnits.prod_registration_ingredient,
      });

      if (productWithUnits.productUnits && productWithUnits.productUnits.length > 0) {
        setProductUnits(productWithUnits.productUnits.map((unit, index) => ({
          key: Date.now() + index,
          prod_unit_id: unit.prod_unit_id,
          prod_unit_name: unit.prod_unit_name,
          prod_unit_exchange_value: unit.prod_unit_exchange_value,
          prod_unit_price: unit.prod_unit_price,
        })));
      } else {
        setProductUnits([{ key: Date.now(), prod_unit_exchange_value: 1 }]);
      }

      setIsProdModalOpen(true);
    } catch (e) {
      message.error("Không tải được thông tin đơn vị. Vui lòng thử lại.");
    }
  };

  const addProductUnit = () => {
    setProductUnits([...productUnits, { key: Date.now(), prod_unit_exchange_value: 1 }]);
  };

  const removeProductUnit = (key) => {
    if (productUnits.length > 1) {
      setProductUnits(productUnits.filter(u => u.key !== key));
    }
  };

  const handleUnitChange = (key, field, value) => {
    setProductUnits(productUnits.map(u => 
      u.key === key ? { ...u, [field]: value } : u
    ));
  };

  const onProductFinish = async (values) => {
    try {
      const payload = {
        ...values,
        ProductUnits: productUnits.map(u => ({
          ...(u.prod_unit_id && { prod_unit_id: u.prod_unit_id }),
          prod_unit_name: u.prod_unit_name,
          prod_unit_exchange_value: u.prod_unit_exchange_value,
          prod_unit_price: u.prod_unit_price || 0
        }))
      };

      if (editingProduct) {
        payload.prod_id = editingProduct.prod_id;
        await axios.put(`${API_BASE}/Product/${editingProduct.prod_id}`, payload);
        message.success("Cập nhật mặt hàng thành công");
      } else {
        await axios.post(`${API_BASE}/Product`, payload);
        message.success("Thêm mặt hàng mới thành công");
      }
      setIsProdModalOpen(false);
      fetchData();
    } catch (e) { message.error("Lỗi lưu dữ liệu"); }
  };

  const onCategoryFinish = async (values) => {
    try {
      await axios.post(`${API_BASE}/Category`, values);
      message.success("Thêm danh mục mới thành công");
      setIsCatModalOpen(false);
      catForm.resetFields();
      fetchData();
    } catch (e) { message.error("Lỗi thêm danh mục"); }
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Row gutter={24}>
        {/* CỘT TRÁI: DANH MỤC */}
        <Col span={6}>
          <Card title={<Space><FolderOpenOutlined /><span>Danh mục</span></Space>} 
                extra={<Button type="link" icon={<PlusOutlined />} onClick={() => setIsCatModalOpen(true)} />}>
            <Table 
              dataSource={categories}
              rowKey="category_id"
              pagination={{ pageSize: 10, size: 'small' }}
              columns={[
                { title: 'Tên nhóm', dataIndex: 'category_name' },
                { 
                  title: '', 
                  key: 'op', 
                  render: (_, r) => <Text type="secondary">{products.filter(p => p.category_id === r.category_id).length}</Text> 
                }
              ]}
              size="small"
            />
          </Card>
        </Col>

        {/* CỘT PHẢI: MẶT HÀNG */}
        <Col span={18}>
          <Card title={<Space><MedicineBoxOutlined /><span>Danh sách mặt hàng</span></Space>}>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Input
                  placeholder="Tìm tên thuốc, hoạt chất..."
                  prefix={<SearchOutlined />}
                  style={{ width: 300 }}
                  onChange={e => setSearchText(e.target.value)}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingProduct(null); prodForm.resetFields(); setProductUnits([{ key: Date.now(), prod_unit_exchange_value: 1 }]); setIsProdModalOpen(true); }}>
                  Thêm mặt hàng
                </Button>
              </Space>
              
              <Space>
                <HistoryOutlined style={{ color: '#8c8c8c' }} />
                <Text type="secondary">Cập nhật lần cuối: {lastUpdated}</Text>
              </Space>
            </div>

            <Table 
              loading={loading}
              dataSource={products.filter(p => p.prod_name.toLowerCase().includes(searchText.toLowerCase()))}
              columns={columns}
              rowKey="prod_id"
            />
          </Card>
        </Col>
      </Row>

      {/* MODAL THÊM/SỬA MẶT HÀNG */}
      <Modal 
        title={editingProduct ? "Chỉnh sửa mặt hàng" : "Thêm mặt hàng mới"} 
        open={isProdModalOpen} 
        onOk={() => prodForm.submit()} 
        onCancel={() => setIsProdModalOpen(false)}
        width={700}
      >
        <Form form={prodForm} layout="vertical" onFinish={onProductFinish}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="prod_name" label="Tên mặt hàng" rules={[{required: true}]}><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category_id" label="Danh mục" rules={[{required: true}]}>
                <Select options={categories.map(c => ({value: c.category_id, label: c.category_name}))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="prod_national_code" label="Mã dược quốc gia"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="prod_registration_number" label="Số đăng ký"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="prod_manufacturer" label="Hãng sản xuất"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="prod_country" label="Quốc gia"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="prod_active_ingredient" label="Hoạt chất chính"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="prod_dosage" label="Liều lượng"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="prod_registration_ingredient" label="Hoạt chính đăng ký"><Input /></Form.Item>
            </Col>
          </Row>

          <Divider>Đơn vị tính</Divider>
          {productUnits.map((unit, index) => (
            <Row key={unit.key} gutter={16} align="middle" style={{ marginBottom: 8 }}>
              <Col span={index === 0 ? 12 : 6}>
                <Form.Item label={index === 0 ? "Đơn vị cơ bản" : "Tên đơn vị"} required>
                  <Input 
                    placeholder="Ví dụ: Viên"
                    value={unit.prod_unit_name}
                    onChange={(e) => handleUnitChange(unit.key, 'prod_unit_name', e.target.value)}
                  />
                </Form.Item>
              </Col>
              {index === 0 && (
                <Col span={6}>
                  <Form.Item label="Giá bán niêm yết">
                    <InputNumber 
                      min={0}
                      step={1000}
                      value={unit.prod_unit_price}
                      onChange={(value) => handleUnitChange(unit.key, 'prod_unit_price', value || 0)}
                      style={{ width: '100%' }}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    />
                  </Form.Item>
                </Col>
              )}
              {index > 0 && (
                <>
                  <Col span={6}>
                    <Form.Item label="Giá trị quy đổi" required>
                      <InputNumber 
                        min={1}
                        value={unit.prod_unit_exchange_value}
                        onChange={(value) => handleUnitChange(unit.key, 'prod_unit_exchange_value', value || 1)}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="Giá bán niêm yết">
                      <InputNumber 
                        min={0}
                        step={1000}
                        value={unit.prod_unit_price}
                        onChange={(value) => handleUnitChange(unit.key, 'prod_unit_price', value || 0)}
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => removeProductUnit(unit.key)}
                    >
                      Xóa
                    </Button>
                  </Col>
                </>
              )}
            </Row>
          ))}
          <Button type="dashed" onClick={addProductUnit} block icon={<PlusOutlined />}>
            Thêm đơn vị tính
          </Button>
        </Form>
      </Modal>

      {/* MODAL THÊM DANH MỤC */}
      <Modal title="Thêm danh mục mới" open={isCatModalOpen} onOk={() => catForm.submit()} onCancel={() => setIsCatModalOpen(false)}>
        <Form form={catForm} layout="vertical" onFinish={onCategoryFinish}>
          <Form.Item name="category_name" label="Tên danh mục" rules={[{required: true}]}><Input /></Form.Item>
          <Form.Item name="category_description" label="Mô tả"><Input.TextArea /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;