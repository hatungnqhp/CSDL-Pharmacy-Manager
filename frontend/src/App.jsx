import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Spin } from 'antd';
import { HomeOutlined, ShoppingCartOutlined, DatabaseOutlined, MedicineBoxOutlined, AppstoreOutlined, DollarOutlined} from '@ant-design/icons';

// Sử dụng Lazy Load để tăng tốc độ tải trang đầu tiên
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const PurchaseInvoice = lazy(() => import('./pages/PurchaseInvoice'));
const SellInvoice = lazy(() => import('./pages/SellInvoice'));
const Batchs = lazy(() => import('./pages/Batchs'));

const { Header, Content, Footer } = Layout;

const App = () => {
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: <Link to="/dashboard">Trang chủ</Link>,
    },
    {
      key: '/products',
      icon: <AppstoreOutlined />,
      label: <Link to="/products">Hàng hóa</Link>,
    },
    {
      key: '/batchs',
      icon: <DatabaseOutlined />,
      label: <Link to="/batchs">Quản lý lô hàng</Link>,
    },
    {
      key: '/purchase',
      icon: <ShoppingCartOutlined />,
      label: <Link to="/purchase">Nhập hàng</Link>,
    },
    {
      key: '/sell',
      icon: <DollarOutlined />,
      label: <Link to="/sell">Bán hàng</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: '#001529', 
        padding: '0 20px',
        position: 'fixed',
        zIndex: 1,
        width: '100%' 
      }}>
        {/* Logo hoặc Tên hệ thống */}
        <div style={{ 
          color: '#fff', 
          fontWeight: 'bold', 
          marginRight: '40px', 
          display: 'flex', 
          alignItems: 'center',
          fontSize: '16px'
        }}>
          <MedicineBoxOutlined style={{ fontSize: '24px', marginRight: '8px', color: '#1890ff' }} />
          TCK PHARMACY
        </div>

        {/* Menu Ngang */}
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Header>

      <Content style={{ marginTop: 64, padding: '24px 50px', background: '#f0f2f5' }}>
        <div style={{ background: '#fff', padding: 24, borderRadius: '8px', minHeight: '80vh' }}>
          <Suspense fallback={
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" description="Đang tải trang..." />
            </div>
          }>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/batchs" element={<Batchs />} />
              <Route path="/purchase" element={<PurchaseInvoice />} />
              <Route path="/sell" element={<SellInvoice />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', color: '#bfbfbf' }}>
        Pharmacy Management System ©2026 - TCK
      </Footer>
    </Layout>
  );
};

// Cần bọc Router bên ngoài App để useLocation hoạt động
const Root = () => (
  <Router>
    <App />
  </Router>
);

export default Root;