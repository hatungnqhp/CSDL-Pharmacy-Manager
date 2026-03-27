import React from 'react';
import { Card, Typography, Row, Col, Divider, Space } from 'antd';
import { 
  MedicineBoxOutlined, 
  SafetyCertificateOutlined, 
  HistoryOutlined, 
  BarChartOutlined,
  AlertOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const Dashboard = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 1. GIỚI THIỆU DỰ ÁN */}
      <Card 
        style={{ 
          textAlign: 'center', 
          marginBottom: 24, 
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          borderRadius: '12px'
        }}
      >
        <MedicineBoxOutlined style={{ fontSize: '48px', color: '#fff', marginBottom: '16px' }} />
        <Title level={2} style={{ color: '#fff', margin: 0 }}>TCK PHARMACY MANAGEMENT</Title>
        <Text style={{ color: '#e6f7ff', fontSize: '16px' }}>
          Giải pháp tối ưu hóa vận hành nhà thuốc và chuyên biệt trong <Text strong style={{ color: '#fff' }}>theo dõi hạn sử dụng</Text> dược phẩm
        </Text>
      </Card>

      <Row gutter={[24, 24]}>
        {/* 2. VẤN ĐỀ THỰC TIỄN */}
        <Col xs={24} md={12}>
          <Card title={<Space><AlertOutlined style={{ color: '#ff4d4f' }} /><span>Vấn đề thực tiễn</span></Space>} hoverable style={{ height: '100%' }}>
            <Paragraph>
              Các nhà thuốc truyền thống thường gặp rủi ro lớn trong khâu vận hành:
            </Paragraph>
            <ul style={{ paddingLeft: '20px', color: '#595959' }}>
              <li>Mất kiểm soát khi phải <Text strong>theo dõi hạn sử dụng</Text> thủ công cho hàng ngàn mã hàng.</li>
              <li>Nhầm lẫn giữa các lô hàng dẫn đến sai lệch giá vốn và rủi ro y tế.</li>
              <li>Hàng hóa hết hạn gây thất thoát kinh tế và ảnh hưởng uy tín nhà thuốc.</li>
              <li>Thiếu công cụ cảnh báo sớm các lô hàng sắp đến ngày hết hạn.</li>
            </ul>
          </Card>
        </Col>

        {/* 3. GIẢI PHÁP MANG LẠI */}
        <Col xs={24} md={12}>
          <Card title={<Space><SafetyCertificateOutlined style={{ color: '#52c41a' }} /><span>Giải pháp hệ thống</span></Space>} hoverable style={{ height: '100%' }}>
            <Paragraph>
              TCK Pharmacy mang đến quy trình quản lý thông minh:
            </Paragraph>
            <ul style={{ paddingLeft: '20px', color: '#595959' }}>
              <li>Tự động hóa hoàn toàn việc <Text strong>theo dõi hạn sử dụng</Text> theo thời gian thực.</li>
              <li>Quản lý chặt chẽ theo từng số lô, đảm bảo nguyên tắc nhập trước - xuất trước.</li>
              <li>Hệ thống thông minh tự động loại bỏ các lô đã hết hạn khỏi danh sách bán hàng.</li>
              <li>Báo cáo chi tiết tình trạng kho hàng dựa trên vòng đời sản phẩm.</li>
            </ul>
          </Card>
        </Col>
      </Row>

      {/* 4. TÍNH NĂNG VƯỢT TRỘI */}
      <Divider orientation="left" style={{ marginTop: 40 }}>Tính năng vượt trội</Divider>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ textAlign: 'center', background: '#f6ffed' }}>
            <ClockCircleOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
            <Title level={5}>Ưu tiên HSD</Title>
            <Text type="secondary">Tự động đề xuất xuất kho những lô có hạn dùng gần nhất.</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ textAlign: 'center', background: '#e6f7ff' }}>
            <BarChartOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
            <Title level={5}>Cảnh báo sớm</Title>
            <Text type="secondary">Nhận biết ngay lập tức các mặt hàng sắp hết hạn để xử lý kịp thời.</Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ textAlign: 'center', background: '#fff7e6' }}>
            <HistoryOutlined style={{ fontSize: '32px', color: '#fa8c16' }} />
            <Title level={5}>Minh bạch dữ liệu</Title>
            <Text type="secondary">Lịch sử lô hàng được lưu trữ trọn đời, dễ dàng truy xuất khi cần.</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;