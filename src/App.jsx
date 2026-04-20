import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import ResidentsPage from './pages/ResidentsPage';
import ApartmentsPage from './pages/ApartmentsPage';
import DevicesPage from './pages/DevicesPage';
import NotificationsPage from './pages/NotificationsPage';
import FeedbacksPage from './pages/FeedbacksPage';
import MaintenancesPage from './pages/MaintenancesPage';
import InvoicesPage from './pages/InvoicesPage';
import Layout from './components/layout/Layout';
import PaymentResultPage from './pages/PaymentResultPage';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children;
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
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="residents" element={<ResidentsPage />} />
        <Route path="apartments" element={<ApartmentsPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="feedbacks" element={<FeedbacksPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="maintenances" element={<MaintenancesPage />} />
        <Route path="payment-result" element={<PaymentResultPage />} />
      </Route>
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
