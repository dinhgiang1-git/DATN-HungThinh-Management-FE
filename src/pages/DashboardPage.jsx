import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apartmentService from '../services/apartmentService';
import residentService from '../services/residentService';
import deviceService from '../services/deviceService';
import invoiceService from '../services/invoiceService';
import feedbackService from '../services/feedbackService';
import maintenanceService from '../services/maintenanceService';

/* ─── helpers ─── */
const formatNumber = (n) => (n ?? 0).toLocaleString('vi-VN');
const formatCurrency = (n) =>
  (n ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN') : '—';

/* ─── status configs ─── */
const feedbackStatusConfig = {
  PENDING: { label: 'Chờ xử lý', color: '#f59e0b', bg: '#fef3c7' },
  IN_PROGRESS: { label: 'Đang xử lý', color: '#3b82f6', bg: '#dbeafe' },
  RESOLVED: { label: 'Đã giải quyết', color: '#10b981', bg: '#d1fae5' },
  CLOSED: { label: 'Đã đóng', color: '#6b7280', bg: '#f3f4f6' },
};

const invoiceStatusConfig = {
  PAID: { label: 'Đã thanh toán', color: '#10b981', bg: '#d1fae5' },
  UNPAID: { label: 'Chưa thanh toán', color: '#ef4444', bg: '#fee2e2' },
};

const maintenanceStatusConfig = {
  SCHEDULED: { label: 'Đã lên lịch', color: '#f59e0b', bg: '#fef3c7' },
  COMPLETED: { label: 'Hoàn thành', color: '#10b981', bg: '#d1fae5' },
  CANCELLED: { label: 'Đã hủy', color: '#ef4444', bg: '#fee2e2' },
};

const deviceStatusConfig = {
  ACTIVE: { label: 'Hoạt động', color: '#10b981', bg: '#d1fae5' },
  INACTIVE: { label: 'Ngưng', color: '#6b7280', bg: '#f3f4f6' },
  UNDER_MAINTENANCE: { label: 'Đang bảo trì', color: '#f59e0b', bg: '#fef3c7' },
  BROKEN: { label: 'Hỏng', color: '#ef4444', bg: '#fee2e2' },
};

const apartmentStatusConfig = {
  OCCUPIED: { label: 'Đang ở', color: '#10b981', bg: '#d1fae5' },
  VACANT: { label: 'Trống', color: '#3b82f6', bg: '#dbeafe' },
  UNDER_MAINTENANCE: { label: 'Đang bảo trì', color: '#f59e0b', bg: '#fef3c7' },
};

function StatusBadge({ status, config }) {
  const s = config[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span
      className="dashboard__badge"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {s.label}
    </span>
  );
}

/* ─── stat card icons ─── */
const statIcons = {
  apartment: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22V12h6v10" />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01" />
    </svg>
  ),
  resident: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  device: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
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
  maintenance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    apartments: 0,
    residents: 0,
    devices: 0,
    unpaidInvoices: 0,
    pendingFeedbacks: 0,
    scheduledMaintenances: 0,
  });
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentMaintenances, setRecentMaintenances] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        apartmentsRes,
        residentsRes,
        devicesRes,
        invoicesRes,
        feedbacksRes,
        maintenancesRes,
      ] = await Promise.allSettled([
        apartmentService.getAll({ page: 0, size: 1 }),
        residentService.getAll({ page: 0, size: 1 }),
        deviceService.getAll({ page: 0, size: 1, deviceStatus: 'ACTIVE' }),
        invoiceService.getAll({ page: 0, size: 5, direction: 'desc', sortBy: 'id' }),
        feedbackService.getAll({ page: 0, size: 5, direction: 'desc', sortBy: 'id' }),
        maintenanceService.getAll({ page: 0, size: 5, direction: 'desc', sortBy: 'id' }),
      ]);

      const getValue = (res) => res.status === 'fulfilled' ? res.value?.data?.data : null;

      const apartments = getValue(apartmentsRes);
      const residents = getValue(residentsRes);
      const devices = getValue(devicesRes);
      const invoices = getValue(invoicesRes);
      const feedbacks = getValue(feedbacksRes);
      const maintenances = getValue(maintenancesRes);

      setStats({
        apartments: apartments?.totalElements ?? 0,
        residents: residents?.totalElements ?? 0,
        devices: devices?.totalElements ?? 0,
        unpaidInvoices: invoices?.content?.filter((i) => i.invoiceStatus === 'UNPAID').length ?? 0,
        pendingFeedbacks: feedbacks?.content?.filter((f) => f.feedbackStatus === 'PENDING').length ?? 0,
        scheduledMaintenances: maintenances?.content?.filter((m) => m.maintenanceStatus === 'SCHEDULED').length ?? 0,
      });

      setRecentFeedbacks(feedbacks?.content?.slice(0, 5) ?? []);
      setRecentInvoices(invoices?.content?.slice(0, 5) ?? []);
      setRecentMaintenances(maintenances?.content?.slice(0, 5) ?? []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { key: 'apartment', label: 'Tổng căn hộ', value: stats.apartments, color: '#3b82f6', bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' },
    { key: 'resident', label: 'Tổng cư dân', value: stats.residents, color: '#8b5cf6', bg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)' },
    { key: 'device', label: 'Thiết bị', value: stats.devices, color: '#06b6d4', bg: 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)' },
    { key: 'invoice', label: 'HĐ chưa thanh toán', value: stats.unpaidInvoices, color: '#ef4444', bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' },
    { key: 'feedback', label: 'Phản hồi chờ xử lý', value: stats.pendingFeedbacks, color: '#f59e0b', bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' },
    { key: 'maintenance', label: 'Bảo trì đã lên lịch', value: stats.scheduledMaintenances, color: '#10b981', bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' },
  ];

  if (loading) {
    return (
      <div className="dashboard__loading">
        <div className="dashboard__spinner" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Welcome */}
      <div className="dashboard__welcome">
        <div>
          <h2 className="dashboard__welcome-title">
            Xin chào, {user?.username || 'Admin'}! 👋
          </h2>
          <p className="dashboard__welcome-desc">
            Chào Mừng Bạn Đến Với Hệ Thống Quản Lý Chung Cư Hưng Thịnh.
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

      {/* Stat Cards */}
      <div className="dashboard__stats">
        {statCards.map((card) => (
          <div key={card.key} className="dashboard__stat-card" style={{ background: card.bg }}>
            <div className="dashboard__stat-icon" style={{ color: card.color }}>
              {statIcons[card.key]}
            </div>
            <div className="dashboard__stat-info">
              <span className="dashboard__stat-value" style={{ color: card.color }}>
                {formatNumber(card.value)}
              </span>
              <span className="dashboard__stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tables section */}
      <div className="dashboard__tables">
        {/* Recent Feedbacks */}
        <div className="dashboard__table-card">
          <div className="dashboard__table-header">
            <h3 className="dashboard__table-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              Phản hồi gần đây
            </h3>
          </div>
          <div className="dashboard__table-body">
            {recentFeedbacks.length === 0 ? (
              <div className="dashboard__empty">Chưa có phản hồi nào</div>
            ) : (
              <table className="dashboard__table">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Căn hộ</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentFeedbacks.map((fb) => (
                    <tr key={fb.feedbackId}>
                      <td className="dashboard__cell-title">{fb.title}</td>
                      <td>{fb.apartment?.apartmentNumber ?? '—'}</td>
                      <td>
                        <StatusBadge status={fb.feedbackStatus} config={feedbackStatusConfig} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="dashboard__table-card">
          <div className="dashboard__table-header">
            <h3 className="dashboard__table-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
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
                      <td>{formatDate(inv.dueDate)}</td>
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
      </div>

      {/* Maintenance row */}
      <div className="dashboard__tables dashboard__tables--full">
        <div className="dashboard__table-card">
          <div className="dashboard__table-header">
            <h3 className="dashboard__table-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
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
                    <th>Ngày hoàn thành</th>
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
                      <td>{formatDate(m.completedDate)}</td>
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
      </div>
    </div>
  );
}
