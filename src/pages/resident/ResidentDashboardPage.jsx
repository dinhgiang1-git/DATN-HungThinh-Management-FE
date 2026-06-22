import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apartmentService from '../../services/apartmentService';
import invoiceService from '../../services/invoiceService';
import feedbackService from '../../services/feedbackService';
import notificationService from '../../services/notificationService';
import maintenanceService from '../../services/maintenanceService';

/* ─── helpers ─── */
const formatCurrency = (n) =>
  (n ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN') : '—';

/* ─── status configs ─── */
const invoiceStatusConfig = {
  PAID: { label: 'Đã thanh toán', color: '#10b981', bg: '#d1fae5' },
  UNPAID: { label: 'Chưa thanh toán', color: '#ef4444', bg: '#fee2e2' },
};

const maintenanceStatusConfig = {
  SCHEDULED: { label: 'Đã lên lịch', color: '#f59e0b', bg: '#fef3c7' },
  COMPLETED: { label: 'Hoàn thành', color: '#10b981', bg: '#d1fae5' },
  CANCELLED: { label: 'Đã hủy', color: '#ef4444', bg: '#fee2e2' },
};

function StatusBadge({ status, config }) {
  const s = config[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span className="dashboard__badge" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
}

/* ─── icons ─── */
const icons = {
  invoice: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  feedback: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  notification: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  maintenance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
};

/* ========================================
   RESIDENT DASHBOARD
   ======================================== */
function ResidentDashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [apartment, setApartment] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [stats, setStats] = useState({ unpaidInvoices: 0, pendingFeedbacks: 0, notifications: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const aptRes = await apartmentService.getByResident(user.id);
      const apt = aptRes?.data?.data;
      setApartment(apt);

      const invoiceParams = { page: 0, size: 5, direction: 'desc', sortBy: 'id' };
      if (apt?.id) {
        invoiceParams.apartmentId = apt.id;
      }

      const [invRes, fbRes, notiRes] = await Promise.allSettled([
        invoiceService.getAll(invoiceParams),
        feedbackService.getAll({ page: 0, size: 5, direction: 'desc', sortBy: 'id' }),
        notificationService.getAll({ page: 0, size: 5, direction: 'desc', sortBy: 'id' }),
      ]);

      const getValue = (res) => res.status === 'fulfilled' ? res.value?.data?.data : null;

      const invoices = getValue(invRes);
      const feedbacks = getValue(fbRes);
      const notifications = getValue(notiRes);

      setRecentInvoices(invoices?.content?.slice(0, 5) ?? []);
      setRecentNotifications(notifications?.content?.slice(0, 5) ?? []);
      setStats({
        unpaidInvoices: invoices?.content?.filter((i) => i.invoiceStatus === 'UNPAID').length ?? 0,
        pendingFeedbacks: feedbacks?.content?.filter((f) => f.feedbackStatus === 'PENDING' || f.feedbackStatus === 'IN_PROGRESS').length ?? 0,
        notifications: notifications?.totalElements ?? 0,
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard__loading">
        <div className="dashboard__spinner" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  const statCards = [
    {
      key: 'unpaid',
      label: 'HĐ chưa thanh toán',
      value: stats.unpaidInvoices,
      color: '#ef4444',
      bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      icon: icons.invoice,
    },
    {
      key: 'feedback',
      label: 'Phản hồi đang xử lý',
      value: stats.pendingFeedbacks,
      color: '#f59e0b',
      bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      icon: icons.feedback,
    },
    {
      key: 'notification',
      label: 'Tổng thông báo',
      value: stats.notifications,
      color: '#3b82f6',
      bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      icon: icons.notification,
    },
  ];

  return (
    <div className="dashboard" id="resident-dashboard">
      {/* Welcome banner */}
      <div className="dashboard__welcome">
        <div className="dashboard__welcome-left">
          <h2 className="dashboard__welcome-title">
            Xin chào, {user?.username}! 👋
          </h2>
          <p className="dashboard__welcome-desc">
            Chào mừng bạn đến với Cổng thông tin cư dân Chung cư Hưng Thịnh.
          </p>
          {apartment && (
            <div className="dashboard__welcome-apartment">
              <span className="dashboard__apt-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <path d="M9 22V12h6v10" />
                </svg>
                Căn {apartment.apartmentNumber} · Block {apartment.block} · Tầng {apartment.floor}
              </span>
            </div>
          )}
        </div>
        <div className="dashboard__welcome-date">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {new Date().toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Stat cards */}
      <div className="dashboard__stats">
        {statCards.map((card) => (
          <div key={card.key} className="dashboard__stat-card" style={{ background: card.bg }}>
            <div className="dashboard__stat-icon" style={{ color: card.color }}>
              {card.icon}
            </div>
            <div className="dashboard__stat-info">
              <span className="dashboard__stat-value" style={{ color: card.color }}>
                {(card.value ?? 0).toLocaleString('vi-VN')}
              </span>
              <span className="dashboard__stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tables */}
      <div className="dashboard__tables">
        {/* Recent Invoices */}
        <div className="dashboard__table-card">
          <div className="dashboard__table-header">
            <h3 className="dashboard__table-title">
              {icons.invoice}
              Hóa đơn gần đây
            </h3>
          </div>
          <div className="dashboard__table-body">
            {recentInvoices.length === 0 ? (
              <div className="dashboard__empty">Chưa có hóa đơn nào</div>
            ) : (
              <table className="dashboard__table">
                <thead>
                  <tr>
                    <th>Mã HĐ</th>
                    <th>Tổng tiền</th>
                    <th>Hạn</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv.invoiceId}>
                      <td className="dashboard__cell-title">{inv.invoiceNumber}</td>
                      <td>{formatCurrency(inv.totalAmount)}</td>
                      <td>{formatDate(inv.dueDate || inv.DueDate)}</td>
                      <td>
                        <StatusBadge status={inv.invoiceStatus} config={invoiceStatusConfig} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="dashboard__table-card">
          <div className="dashboard__table-header">
            <h3 className="dashboard__table-title">
              {icons.notification}
              Thông báo gần đây
            </h3>
          </div>
          <div className="dashboard__table-body">
            {recentNotifications.length === 0 ? (
              <div className="dashboard__empty">Chưa có thông báo nào</div>
            ) : (
              <table className="dashboard__table">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Thời gian</th>
                    <th>Đối tượng</th>
                  </tr>
                </thead>
                <tbody>
                  {recentNotifications.map((n) => (
                    <tr key={n.notificationId}>
                      <td className="dashboard__cell-title">{n.title}</td>
                      <td>{formatDate(n.sendTime)}</td>
                      <td>
                        <span className="dashboard__badge" style={{ color: '#6366f1', backgroundColor: '#eef2ff' }}>
                          {n.targetType === 'ALL' ? 'Tất cả' : n.targetType === 'BLOCK' ? `Block ${n.block}` : `Căn hộ`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================
   TECHNICIAN DASHBOARD (resident portal)
   ======================================== */
function TechnicianDashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [recentMaintenances, setRecentMaintenances] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [stats, setStats] = useState({ scheduled: 0, completed: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [maintRes, notiRes] = await Promise.allSettled([
        maintenanceService.getAll({ page: 0, size: 5, direction: 'desc', sortBy: 'id' }),
        notificationService.getAll({ page: 0, size: 5, direction: 'desc', sortBy: 'id' }),
      ]);

      const getValue = (res) => res.status === 'fulfilled' ? res.value?.data?.data : null;

      const maintenances = getValue(maintRes);
      const notifications = getValue(notiRes);

      setRecentMaintenances(maintenances?.content?.slice(0, 5) ?? []);
      setRecentNotifications(notifications?.content?.slice(0, 5) ?? []);
      setStats({
        scheduled: maintenances?.content?.filter((m) => m.maintenanceStatus === 'SCHEDULED').length ?? 0,
        completed: maintenances?.content?.filter((m) => m.maintenanceStatus === 'COMPLETED').length ?? 0,
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard__loading">
        <div className="dashboard__spinner" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  const statCards = [
    {
      key: 'scheduled',
      label: 'Bảo trì đã lên lịch',
      value: stats.scheduled,
      color: '#f59e0b',
      bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      icon: icons.maintenance,
    },
    {
      key: 'completed',
      label: 'Bảo trì hoàn thành',
      value: stats.completed,
      color: '#10b981',
      bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      icon: icons.maintenance,
    },
    {
      key: 'notification',
      label: 'Thông báo',
      value: recentNotifications.length,
      color: '#3b82f6',
      bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      icon: icons.notification,
    },
  ];

  return (
    <div className="dashboard" id="technician-dashboard">
      <div className="dashboard__welcome dashboard__welcome--tech">
        <div className="dashboard__welcome-left">
          <h2 className="dashboard__welcome-title">
            Xin chào, {user?.username}! 🔧
          </h2>
          <p className="dashboard__welcome-desc">
            Chào mừng bạn đến với hệ thống quản lý bảo trì Chung cư Hưng Thịnh.
          </p>
        </div>
        <div className="dashboard__welcome-date">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {new Date().toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      <div className="dashboard__stats">
        {statCards.map((card) => (
          <div key={card.key} className="dashboard__stat-card" style={{ background: card.bg }}>
            <div className="dashboard__stat-icon" style={{ color: card.color }}>
              {card.icon}
            </div>
            <div className="dashboard__stat-info">
              <span className="dashboard__stat-value" style={{ color: card.color }}>
                {(card.value ?? 0).toLocaleString('vi-VN')}
              </span>
              <span className="dashboard__stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard__tables">
        <div className="dashboard__table-card">
          <div className="dashboard__table-header">
            <h3 className="dashboard__table-title">
              {icons.maintenance}
              Lịch bảo trì gần đây
            </h3>
          </div>
          <div className="dashboard__table-body">
            {recentMaintenances.length === 0 ? (
              <div className="dashboard__empty">Chưa có lịch bảo trì nào</div>
            ) : (
              <table className="dashboard__table">
                <thead>
                  <tr>
                    <th>Mô tả</th>
                    <th>Thiết bị</th>
                    <th>Ngày bắt đầu</th>
                    <th>Chi phí</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMaintenances.map((m) => (
                    <tr key={m.maintenanceId}>
                      <td className="dashboard__cell-title">{m.description || '—'}</td>
                      <td>{m.device?.deviceName ?? '—'}</td>
                      <td>{formatDate(m.startedDate)}</td>
                      <td>{formatCurrency(m.cost)}</td>
                      <td>
                        <StatusBadge status={m.maintenanceStatus} config={maintenanceStatusConfig} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="dashboard__table-card">
          <div className="dashboard__table-header">
            <h3 className="dashboard__table-title">
              {icons.notification}
              Thông báo gần đây
            </h3>
          </div>
          <div className="dashboard__table-body">
            {recentNotifications.length === 0 ? (
              <div className="dashboard__empty">Chưa có thông báo nào</div>
            ) : (
              <table className="dashboard__table">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Thời gian</th>
                    <th>Đối tượng</th>
                  </tr>
                </thead>
                <tbody>
                  {recentNotifications.map((n) => (
                    <tr key={n.notificationId}>
                      <td className="dashboard__cell-title">{n.title}</td>
                      <td>{formatDate(n.sendTime)}</td>
                      <td>
                        <span className="dashboard__badge" style={{ color: '#6366f1', backgroundColor: '#eef2ff' }}>
                          {n.targetType === 'ALL' ? 'Tất cả' : n.targetType === 'BLOCK' ? `Block ${n.block}` : `Căn hộ`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================
   MAIN RESIDENT DASHBOARD PAGE
   ======================================== */
export default function ResidentDashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'TECHNICIAN') {
    return <TechnicianDashboard user={user} />;
  }
  return <ResidentDashboard user={user} />;
}
