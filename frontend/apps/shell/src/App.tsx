import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { RoleProvider } from './components/RoleContext';
import { PaymentOrderStoreProvider } from './api/usePaymentOrders';
import Dashboard from './pages/Dashboard';
import PaymentOrderList from './pages/PaymentOrderList';
import PaymentOrderForm from './pages/PaymentOrderForm';
import PaymentOrderDetail from './pages/PaymentOrderDetail';

function BreadcrumbWrapper() {
  const location = useLocation();
  const path = location.pathname;

  let breadcrumbs: { label: string; path?: string }[] = [];

  if (path === '/') {
    breadcrumbs = [{ label: 'Trang chu' }];
  } else if (path === '/payment-orders') {
    breadcrumbs = [
      { label: 'Trang chu', path: '/' },
      { label: 'Thanh toan' },
      { label: 'Lenh thanh toan' },
      { label: 'Danh sach' },
    ];
  } else if (path === '/payment-orders/new') {
    breadcrumbs = [
      { label: 'Trang chu', path: '/' },
      { label: 'Thanh toan' },
      { label: 'Lenh thanh toan', path: '/payment-orders' },
      { label: 'Them moi' },
    ];
  } else if (path.match(/^\/payment-orders\/[^/]+\/edit$/)) {
    breadcrumbs = [
      { label: 'Trang chu', path: '/' },
      { label: 'Thanh toan' },
      { label: 'Lenh thanh toan', path: '/payment-orders' },
      { label: 'Sua' },
    ];
  } else if (path.match(/^\/payment-orders\/[^/]+$/)) {
    breadcrumbs = [
      { label: 'Trang chu', path: '/' },
      { label: 'Thanh toan' },
      { label: 'Lenh thanh toan', path: '/payment-orders' },
      { label: 'Chi tiet' },
    ];
  }

  return (
    <Layout breadcrumbs={breadcrumbs}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/payment-orders" element={<PaymentOrderList />} />
        <Route path="/payment-orders/new" element={<PaymentOrderForm />} />
        <Route path="/payment-orders/:id" element={<PaymentOrderDetail />} />
        <Route path="/payment-orders/:id/edit" element={<PaymentOrderForm />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <RoleProvider>
    <PaymentOrderStoreProvider>
    <BrowserRouter>
      <BreadcrumbWrapper />
    </BrowserRouter>
    </PaymentOrderStoreProvider>
    </RoleProvider>
  );
}
