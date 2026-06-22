import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SseProvider } from './contexts/SseContext';

// Admin pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import ResidentsPage from './pages/ResidentsPage';
import ApartmentsPage from './pages/ApartmentsPage';
import BuildingReportsPage from './pages/BuildingReportsPage';
import DevicesPage from './pages/DevicesPage';
import NotificationsPage from './pages/NotificationsPage';
import FeedbacksPage from './pages/FeedbacksPage';
import MaintenancesPage from './pages/MaintenancesPage';
import InvoicesPage from './pages/InvoicesPage';
import ContractsPage from './pages/ContractsPage';
import VehiclesPage from './pages/VehiclesPage';
import AuditLogsPage from './pages/AuditLogsPage';
import PaymentResultPage from './pages/PaymentResultPage';
import Layout from './components/layout/Layout';

// Resident pages
import ResidentLayout from './components/layout/ResidentLayout';
import ResidentDashboardPage from './pages/resident/ResidentDashboardPage';
import ResidentProfilePage from './pages/resident/ResidentProfilePage';
import ResidentInvoicePage from './pages/resident/ResidentInvoicePage';
import ResidentFeedbackPage from './pages/resident/ResidentFeedbackPage';
import ResidentNotificationPage from './pages/resident/ResidentNotificationPage';
import ResidentContractPage from './pages/resident/ResidentContractPage';
import ResidentPaymentResultPage from './pages/resident/ResidentPaymentResultPage';
import ResidentMembersPage from './pages/resident/ResidentMembersPage';
import ResidentVehiclePage from './pages/resident/ResidentVehiclePage';

// ─── Route guards ───────────────────────────────────────────────────────────

/** Chỉ cho phép khi chưa đăng nhập → nếu đã đăng nhập redirect theo role */
function PublicRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) {
    const role = user?.role;
    return <Navigate to={role === 'RESIDENT' ? '/resident/dashboard' : '/'} replace />;
  }
  return children;
}

/** Chỉ cho phép ADMIN và TECHNICIAN (admin dashboard) */
function AdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = user?.role;
  if (role === 'RESIDENT') {
    return <Navigate to="/resident/dashboard" replace />;
  }
  return children;
}

/** Chặn từng trang theo vai trò cụ thể trong khu admin shell */
function RoleRoute({ children, roles, fallback = '/' }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!roles.includes(user?.role)) {
    return <Navigate to={user?.role === 'RESIDENT' ? '/resident/dashboard' : fallback} replace />;
  }
  return children;
}

/** Chỉ cho phép RESIDENT (resident portal) */
function ResidentRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = user?.role;
  if (role !== 'RESIDENT') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ color: '#64748b' }}>Đang tải...</div>
    </div>
  );
}

/* Placeholder page for modules not yet built */
function ComingSoon({ title }) {
  return (
    <div className="coming-soon">
      <div className="coming-soon__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>
      <h2 className="coming-soon__title">{title}</h2>
      <p className="coming-soon__desc">Tính năng này đang được phát triển.</p>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* ─── Public ─── */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* ─── Admin / Technician routes ─── */}
      <Route
        element={
          <AdminRoute>
            <Layout />
          </AdminRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="residents" element={<ResidentsPage />} />
        <Route path="apartments" element={<ApartmentsPage />} />
        <Route path="building-reports" element={<RoleRoute roles={['ADMIN']}><BuildingReportsPage /></RoleRoute>} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="feedbacks" element={<FeedbacksPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="maintenances" element={<MaintenancesPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="payment-result" element={<PaymentResultPage />} />
      </Route>

      {/* ─── Resident portal routes ─── */}
      <Route
        path="/resident"
        element={
          <ResidentRoute>
            <SseProvider>
              <ResidentLayout />
            </SseProvider>
          </ResidentRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ResidentDashboardPage />} />
        <Route path="profile" element={<ResidentProfilePage />} />
        <Route path="invoices" element={<ResidentInvoicePage />} />
        <Route path="feedbacks" element={<ResidentFeedbackPage />} />
        <Route path="notifications" element={<ResidentNotificationPage />} />
        <Route path="contracts" element={<ResidentContractPage />} />
        <Route path="payment-result" element={<ResidentPaymentResultPage />} />
        <Route path="members" element={<ResidentMembersPage />} />
        <Route path="vehicles" element={<ResidentVehiclePage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
