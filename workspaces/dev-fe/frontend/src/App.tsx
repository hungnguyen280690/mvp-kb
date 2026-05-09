// ============================================================================
// App — Router with all pages
// ============================================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/auth';
import { NotificationProvider } from '@/lib/notification-context';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Lazy load pages
const S01PaymentOrderList = React.lazy(() =>
  import('@/pages/S01-PaymentOrderList').then((m) => ({ default: m.S01PaymentOrderList }))
);
const S02PaymentOrderForm = React.lazy(() =>
  import('@/pages/S02-PaymentOrderForm').then((m) => ({ default: m.S02PaymentOrderForm }))
);
const S03PaymentOrderDetail = React.lazy(() =>
  import('@/pages/S03-PaymentOrderDetail').then((m) => ({ default: m.S03PaymentOrderDetail }))
);
const S04ApprovalQueue = React.lazy(() =>
  import('@/pages/S04-ApprovalQueue').then((m) => ({ default: m.S04ApprovalQueue }))
);
const S06CancelReverse = React.lazy(() =>
  import('@/pages/S06-CancelReverse').then((m) => ({ default: m.S06CancelReverse }))
);
const LoginPage = React.lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);

/** Protected route wrapper */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <React.Suspense fallback={<LoadingSpinner size="lg" message="Dang tai trang..." />}>
      {children}
    </React.Suspense>
  );
}

/** App routes */
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <React.Suspense fallback={<LoadingSpinner />}>
              <LoginPage />
            </React.Suspense>
          )
        }
      />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* S01 — Danh sach LTT */}
        <Route path="/" element={<S01PaymentOrderList />} />

        {/* S02 — Lap LTT (Create) */}
        <Route path="/payment-orders/new" element={<S02PaymentOrderForm />} />

        {/* S02 — Sua LTT (Edit) */}
        <Route path="/payment-orders/:id/edit" element={<S02PaymentOrderForm />} />

        {/* S03 — Chi tiet LTT */}
        <Route path="/payment-orders/:id" element={<S03PaymentOrderDetail />} />

        {/* S04 — Hang doi phe duyet */}
        <Route path="/approval-queue" element={<S04ApprovalQueue />} />

        {/* S06 — Huy/Dao but toan */}
        <Route path="/payment-orders/:id/cancel" element={<S06CancelReverse />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
