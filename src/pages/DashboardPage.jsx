import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import apartmentService from '../services/apartmentService';
import residentService from '../services/residentService';
import deviceService from '../services/deviceService';
import invoiceService from '../services/invoiceService';
import feedbackService from '../services/feedbackService';
import maintenanceService from '../services/maintenanceService';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { exportToExcel } from '../utils/exportExcel';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

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
  const [chartData, setChartData] = useState({
    revenueByMonth: { labels: [], paid: [], unpaid: [] },
    paymentRate: { paid: 0, unpaid: 0 },
    apartmentStatus: { occupied: 0, vacant: 0, maintenance: 0 },
    feedbackStatus: { pending: 0, inProgress: 0, resolved: 0, closed: 0 },
  });

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
        apartmentService.getAll({ page: 0, size: 9999 }),
        residentService.getAll({ page: 0, size: 1 }),
        deviceService.getAll({ page: 0, size: 1, deviceStatus: 'ACTIVE' }),
        invoiceService.getAll({ page: 0, size: 9999, direction: 'desc', sortBy: 'id' }),
        feedbackService.getAll({ page: 0, size: 9999, direction: 'desc', sortBy: 'id' }),
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

      // ── Chart data processing ──
      const allInvoices = invoices?.content ?? [];
      const allApartments = apartments?.content ?? [];
      const allFeedbacks = feedbacks?.content ?? [];

      // 1. Revenue by month (6 months)
      const now = new Date();
      const monthLabels = [];
      const paidByMonth = [];
      const unpaidByMonth = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthLabels.push(`T${d.getMonth() + 1}/${d.getFullYear()}`);
        const monthInvoices = allInvoices.filter(inv => {
          const created = inv.createdAt ? inv.createdAt.substring(0, 7) : '';
          return created === key;
        });
        paidByMonth.push(monthInvoices.filter(i => i.invoiceStatus === 'PAID').reduce((s, i) => s + (i.totalAmount || 0), 0));
        unpaidByMonth.push(monthInvoices.filter(i => i.invoiceStatus === 'UNPAID').reduce((s, i) => s + (i.totalAmount || 0), 0));
      }

      // 2. Payment rate
      const paidCount = allInvoices.filter(i => i.invoiceStatus === 'PAID').length;
      const unpaidCount = allInvoices.filter(i => i.invoiceStatus === 'UNPAID').length;

      // 3. Apartment status
      const occupied = allApartments.filter(a => a.apartmentStatus === 'OCCUPIED').length;
      const vacant = allApartments.filter(a => a.apartmentStatus === 'VACANT').length;
      const underMaint = allApartments.filter(a => a.apartmentStatus === 'UNDER_MAINTENANCE').length;

      // 4. Feedback distribution
      const fbPending = allFeedbacks.filter(f => f.feedbackStatus === 'PENDING').length;
      const fbInProgress = allFeedbacks.filter(f => f.feedbackStatus === 'IN_PROGRESS').length;
      const fbResolved = allFeedbacks.filter(f => f.feedbackStatus === 'RESOLVED').length;
      const fbClosed = allFeedbacks.filter(f => f.feedbackStatus === 'CLOSED').length;

      setChartData({
        revenueByMonth: { labels: monthLabels, paid: paidByMonth, unpaid: unpaidByMonth },
        paymentRate: { paid: paidCount, unpaid: unpaidCount },
        apartmentStatus: { occupied, vacant, maintenance: underMaint },
        feedbackStatus: { pending: fbPending, inProgress: fbInProgress, resolved: fbResolved, closed: fbClosed },
      });
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
          <button style={{background:'#059669',color:'#fff',border:'none',borderRadius:'0.5rem',padding:'0.5rem 1rem',cursor:'pointer',fontWeight:600,fontSize:'0.85rem',display:'flex',alignItems:'center',gap:'0.4rem',marginRight:'0.75rem'}} onClick={() => {
            const rows = chartData.revenueByMonth.labels.map((label, i) => ({
              month: label,
              paid: chartData.revenueByMonth.paid[i],
              unpaid: chartData.revenueByMonth.unpaid[i],
              total: chartData.revenueByMonth.paid[i] + chartData.revenueByMonth.unpaid[i],
            }));
            exportToExcel(rows, [
              { header: 'Tháng', key: 'month', width: 16 },
              { header: 'Đã thu (VNĐ)', key: 'paid', width: 18 },
              { header: 'Chưa thu (VNĐ)', key: 'unpaid', width: 18 },
              { header: 'Tổng (VNĐ)', key: 'total', width: 18 },
            ], `bao-cao-doanh-thu-${new Date().toISOString().slice(0,10)}`, 'Doanh thu');
            toast.success('Xuất báo cáo thành công!');
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:16,height:16}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Xuất báo cáo
          </button>
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

      {/* ── Charts Section ── */}
      <div className="dashboard__charts">
        <div className="dashboard__chart-card dashboard__chart-card--wide">
          <h3 className="dashboard__chart-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="18" rx="1" /><rect x="14" y="9" width="7" height="12" rx="1" /></svg>
            Doanh thu theo tháng
          </h3>
          <div style={{ height: 280 }}>
            <Bar
              data={{
                labels: chartData.revenueByMonth.labels,
                datasets: [
                  { label: 'Đã thu (VNĐ)', data: chartData.revenueByMonth.paid, backgroundColor: 'rgba(16, 185, 129, 0.7)', borderRadius: 6 },
                  { label: 'Chưa thu (VNĐ)', data: chartData.revenueByMonth.unpaid, backgroundColor: 'rgba(239, 68, 68, 0.5)', borderRadius: 6 },
                ],
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { callback: v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'tr' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'k' : v } } } }}
            />
          </div>
        </div>
        <div className="dashboard__chart-card">
          <h3 className="dashboard__chart-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
            Tỷ lệ thanh toán
          </h3>
          <div style={{ height: 220, display: 'flex', justifyContent: 'center' }}>
            <Doughnut
              data={{
                labels: ['Đã thanh toán', 'Chưa thanh toán'],
                datasets: [{ data: [chartData.paymentRate.paid, chartData.paymentRate.unpaid], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0 }],
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
        </div>
      </div>
      <div className="dashboard__charts">
        <div className="dashboard__chart-card">
          <h3 className="dashboard__chart-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22V12h6v10" /></svg>
            Tình trạng căn hộ
          </h3>
          <div style={{ height: 220, display: 'flex', justifyContent: 'center' }}>
            <Doughnut
              data={{
                labels: ['Đang ở', 'Trống', 'Bảo trì'],
                datasets: [{ data: [chartData.apartmentStatus.occupied, chartData.apartmentStatus.vacant, chartData.apartmentStatus.maintenance], backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'], borderWidth: 0 }],
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
        </div>
        <div className="dashboard__chart-card">
          <h3 className="dashboard__chart-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            Phân bố phản hồi
          </h3>
          <div style={{ height: 220, display: 'flex', justifyContent: 'center' }}>
            <Doughnut
              data={{
                labels: ['Chờ xử lý', 'Đang xử lý', 'Đã giải quyết', 'Đã đóng'],
                datasets: [{ data: [chartData.feedbackStatus.pending, chartData.feedbackStatus.inProgress, chartData.feedbackStatus.resolved, chartData.feedbackStatus.closed], backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#6b7280'], borderWidth: 0 }],
              }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
        </div>
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
