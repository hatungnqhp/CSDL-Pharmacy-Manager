import React, { useState, useEffect } from 'react';
import { Select, Table, Card, Tag, Input, Space, Typography, Badge, Tooltip } from 'antd';
import { SearchOutlined, MedicineBoxOutlined, HistoryOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const API_BASE = "http://localhost:5223/api";

const Batchs = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'in_stock', 'out_of_stock', 'expiring'

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/Batch`);
      setBatches(res.data);
    } catch (e) {
      console.error("Lỗi tải dữ liệu lô hàng:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Logic kiểm tra trạng thái hạn dùng
  const getExpiryStatus = (expiryDate) => {
    const diffDay = dayjs(expiryDate).diff(dayjs(), 'day');
    if (diffDay < 0) return { color: 'error', text: 'Đã hết hạn' };
    if (diffDay <= 180) return { color: 'warning', text: `Hết hạn sau ${diffDay} ngày` };
    const diffMonth = dayjs(expiryDate).diff(dayjs(), 'month');
    return { color: 'success', text: `Còn hạn ${diffMonth} tháng` };
  };

  const columns = [
    {
      title: 'Tên thuốc',
      dataIndex: 'prod_name',
      key: 'prod_name',
      render: (text, record) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{record.product?.prod_name || "N/A"}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>ID: {record?.prod_id}</Text>
        </Space>
      ),
      filteredValue: [searchText],
      onFilter: (value, record) => 
        record.product?.prod_name.toLowerCase().includes(value.toLowerCase()) ||
        record.batch_number.toLowerCase().includes(value.toLowerCase())
    },
    {
      title: 'Số lô',
      dataIndex: 'batch_number',
      key: 'batch_number',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Hạn dùng',
      dataIndex: 'batch_expiry_date',
      key: 'expiry',
      sorter: (a, b) => dayjs(a.batch_expiry_date).unix() - dayjs(b.batch_expiry_date).unix(),
      render: (date) => {
        const status = getExpiryStatus(date);
        return (
          <Tooltip title={`Ngày hết hạn: ${dayjs(date).format('DD/MM/YYYY')}`}>
            <Badge status={status.color} text={dayjs(date).format('DD/MM/YYYY')} />
            <div style={{ fontSize: '11px', marginLeft: '14px', color: '#8c8c8c' }}>{status.text}</div>
          </Tooltip>
        );
      }
    },
    {
      title: 'Tồn kho',
      key: 'inventory',
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          <Text>
            {record.batch_current_qty?.toLocaleString()}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.prod_unit_name}</Text>
        </Space>
      ),
      align: 'right'
    },
    {
      title: 'Giá vốn',
      key: 'cost',
      render: (_, record) => {
        const costValue = record.pur_inv_dtl_cost_price_unit || 0;
        return `${costValue.toLocaleString()}`;
      },
      align: 'right'
    },
    {
      title: 'Giá bán',
      key: 'cost',
      render: (_, record) => {
        const sellPrice = record.productUnit?.prod_unit_price || 0;
        return `${sellPrice.toLocaleString()}`;
      },
      align: 'right'
    },
    {
      title: 'Tổng giá trị tồn',
      key: 'total_value',
      render: (_, record) => {
        const qty = record.batch_current_qty || 0;
        const price = record.productUnit?.prod_unit_price || 0;
        return (
          <Text strong>
            {(qty * price).toLocaleString()}
          </Text>
        );
      },
      align: 'right'
    }
  ];

  const filteredData = batches.filter(record => {
    // 1. Lọc theo text tìm kiếm
    const matchesSearch = 
      (record.product?.prod_name || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (record.batch_number || "").toLowerCase().includes(searchText.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Lọc theo trạng thái lô hàng
    const qty = record.batch_current_qty || 0;
    const diffDay = dayjs(record.batch_expiry_date).diff(dayjs(), 'day');

    switch (filterStatus) {
      case 'in_stock':
        return qty > 0;
      case 'out_of_stock':
        return qty <= 0;
      case 'expiring':
        return diffDay >= 0 && diffDay <= 180; // Sắp hết hạn trong 6 tháng
      default:
        return true;
    }
  });

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Card title={
        <Space>
          <MedicineBoxOutlined />
          <span>Quản lý lô hàng</span>
        </Space>
      }>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <Space>
            <Input
              placeholder="Tìm tên thuốc hoặc số lô..."
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              defaultValue="all"
              style={{ width: 200 }}
              onChange={value => setFilterStatus(value)}
              options={[
                { value: 'all', label: 'Tất cả lô hàng' },
                { value: 'in_stock', label: 'Lô còn hàng' },
                { value: 'out_of_stock', label: 'Lô đã hết hàng' },
                { value: 'expiring', label: 'Lô sắp hết hạn (6 tháng)' },
              ]}
            />
          </Space>
          
          <Space>
            <Badge count={filteredData.length} overflowCount={999} color="#1890ff">
              <Text type="secondary" style={{ marginRight: 10 }}>Kết quả: {filteredData.length}</Text>
            </Badge>
            <HistoryOutlined />
            <Text type="secondary">{dayjs().format('HH:mm:ss')}</Text>
          </Space>
        </div>

        <Table
          dataSource={filteredData} // Sử dụng dữ liệu đã lọc
          columns={columns}
          rowKey="batch_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
          size="middle"
        />
      </Card>
    </div>
  );
};

export default Batchs;