import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import apartmentService from '../services/apartmentService';
import { exportToExcel } from '../utils/exportExcel';
import DropdownSelect from '../components/common/DropdownSelect';

const GROUP_OPTIONS = [
  { value: 'COMPLEX', label: 'Theo khu', icon: 'complex' },
  { value: 'BLOCK', label: 'Theo tòa', icon: 'block' },
  { value: 'FLOOR', label: 'Theo tầng', icon: 'floor' },
  { value: 'APARTMENT', label: 'Theo căn hộ', icon: 'apartment' },
];

const statusLabel = {
  OCCUPIED: 'Đang ở',
  VACANT: 'Trống',
  UNDER_MAINTENANCE: 'Bảo trì',
};

const relationshipLabel = {
  OWNER: 'Chủ hộ',
  SPOUSE: 'Vợ / chồng',
  CHILD: 'Con',
  PARENT: 'Cha / mẹ',
  RELATIVE: 'Người thân',
  TENANT: 'Người thuê',
  OTHER: 'Khác',
};

const icons = {
  building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-6h6v6" />
      <path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01" />
    </svg>
  ),
  report: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16v-3" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2m-.5-5v5h5" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 5v-5h-5" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  ),
  apartment: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
      <path d="M9 21v-4h6v4" />
      <path d="M9 7h.01M9 11h.01M9 15h.01M15 7h.01M15 11h.01M15 15h.01" />
    </svg>
  ),
  residents: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  device: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  ),
  money: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  debt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  filter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L8 9.64a16 16 0 0 0 6.36 6.36l1.21-1.21a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  ),
  table: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 6 15 12 9 18" /></svg>
  ),
};

const toNumber = (value) => Number(value || 0);
const formatNumber = (value) => toNumber(value).toLocaleString('vi-VN');
const formatCurrency = (value) => `${Math.round(toNumber(value)).toLocaleString('vi-VN')} đ`;

const getApartmentLabel = (apartment) => (
  `${apartment?.complexName || 'Hưng Thịnh'} / ${apartment?.block || '—'}-${apartment?.apartmentNumber || '—'}`
);

const buildParams = (filters) => {
  const params = {};
  if (filters.complexName) params.complexName = filters.complexName;
  if (filters.block) params.block = filters.block;
  if (filters.floor !== '') params.floor = Number(filters.floor);
  return params;
};

/* Animated number component */
function AnimatedNumber({ value, format = 'number' }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const target = toNumber(value);
    if (target === 0) { setDisplayed(0); return; }
    const duration = 600;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, target);
      setDisplayed(Math.round(current));
      if (step >= steps) { setDisplayed(target); clearInterval(timer); }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  if (format === 'currency') return formatCurrency(displayed);
  return formatNumber(displayed);
}

export default function BuildingReportsPage() {
  const [filters, setFilters] = useState({
    groupBy: 'BLOCK',
    complexName: '',
    block: '',
    floor: '',
  });
  const [loading, setLoading] = useState(true);
  const [apartments, setApartments] = useState([]);
  const [report, setReport] = useState({ items: [] });

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalApartment, setModalApartment] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen]);

  /* Pagination state */
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const complexOptions = useMemo(() => (
    [...new Set(apartments.map((item) => item.complexName || 'Hưng Thịnh'))].sort()
  ), [apartments]);

  const blockOptions = useMemo(() => (
    [...new Set(apartments
      .filter((item) => !filters.complexName || (item.complexName || 'Hưng Thịnh') === filters.complexName)
      .map((item) => item.block)
      .filter(Boolean))]
      .sort()
  ), [apartments, filters.complexName]);

  const floorOptions = useMemo(() => (
    [...new Set(apartments
      .filter((item) => !filters.complexName || (item.complexName || 'Hưng Thịnh') === filters.complexName)
      .filter((item) => !filters.block || item.block === filters.block)
      .map((item) => item.floor)
      .filter((floor) => floor !== null && floor !== undefined))]
      .sort((a, b) => a - b)
  ), [apartments, filters.block, filters.complexName]);

  const scopedApartments = useMemo(() => (
    apartments
      .filter((item) => !filters.complexName || (item.complexName || 'Hưng Thịnh') === filters.complexName)
      .filter((item) => !filters.block || item.block === filters.block)
      .filter((item) => filters.floor === '' || String(item.floor) === String(filters.floor))
  ), [apartments, filters.block, filters.complexName, filters.floor]);

  const summary = {
    apartmentCount: report?.apartmentCount ?? 0,
    occupiedCount: report?.occupiedCount ?? 0,
    vacantCount: report?.vacantCount ?? 0,
    maintenanceCount: report?.maintenanceCount ?? 0,
    residentCount: report?.residentCount ?? 0,
    deviceCount: report?.deviceCount ?? 0,
    unpaidInvoiceCount: report?.unpaidInvoiceCount ?? 0,
    paidRevenue: report?.paidRevenue ?? 0,
    unpaidRevenue: report?.unpaidRevenue ?? 0,
  };

  const occupancyRate = summary.apartmentCount > 0
    ? Math.round((summary.occupiedCount / summary.apartmentCount) * 100)
    : 0;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams(filters);
      const [apartmentRes, reportRes] = await Promise.all([
        apartmentService.getAll({ page: 0, size: 9999, sortBy: 'id', direction: 'asc' }),
        apartmentService.getStatistics({ groupBy: filters.groupBy, ...params }),
      ]);
      setApartments(apartmentRes.data?.data?.content || []);
      setReport(reportRes.data?.data || { items: [] });
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải báo cáo khu và tòa nhà');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'complexName' ? { block: '', floor: '' } : {}),
      ...(key === 'block' ? { floor: '' } : {}),
    }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters({
      groupBy: 'BLOCK',
      complexName: '',
      block: '',
      floor: '',
    });
  };

  const handleExport = () => {
    const rows = report?.items || [];
    if (rows.length === 0) {
      toast.info('Không có dữ liệu để xuất');
      return;
    }

    exportToExcel(rows, [
      { header: 'Nhóm', key: 'groupLabel', width: 34 },
      { header: 'Khu', key: 'complexName', width: 24 },
      { header: 'Tòa', key: 'block', width: 12 },
      { header: 'Tầng', key: 'floor', width: 10 },
      { header: 'Căn hộ', key: 'apartmentCount', width: 12 },
      { header: 'Đang ở', key: 'occupiedCount', width: 12 },
      { header: 'Trống', key: 'vacantCount', width: 12 },
      { header: 'Bảo trì', key: 'maintenanceCount', width: 12 },
      { header: 'Cư dân', key: 'residentCount', width: 12 },
      { header: 'Thiết bị', key: 'deviceCount', width: 12 },
      { header: 'Hóa đơn chưa thu', key: 'unpaidInvoiceCount', width: 18 },
      { header: 'Đã thu', key: 'paidRevenue', width: 18 },
      { header: 'Công nợ', key: 'unpaidRevenue', width: 18 },
    ], `bao-cao-khu-toa-${new Date().toISOString().slice(0, 10)}`, 'Khu toa');
    toast.success('Đã xuất báo cáo');
  };

  const hasActiveFilter = filters.complexName || filters.block || filters.floor !== '';

  /* Open apartment detail modal */
  const openApartmentModal = async (apartment) => {
    setModalOpen(true);
    setModalApartment(apartment);
    setModalLoading(true);
    try {
      const res = await apartmentService.getById(apartment.id);
      setModalApartment(res.data?.data || apartment);
    } catch {
      // fallback to list data
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalApartment(null);
  };

  /* Helper: get owner from residents list */
  const getOwner = (apt) => (apt?.residents || []).find((r) => (r.relationshipType || r.relationship) === 'OWNER');
  const getResidentInitial = (r) => (r?.fullName || r?.userName || '?').trim().charAt(0).toUpperCase();
  const getResidentPhone = (r) => r?.phoneNumber || r?.phone || '—';
  const getResidentEmail = (r) => r?.email || '—';

  return (
    <div className="page building-page">
      {/* ── Hero Header ── */}
      <div className="page__header building-page__header">
        <div>
          <h2 className="page__title">Khu & tòa nhà</h2>
          <p className="page__desc">Theo dõi dữ liệu theo khu, tòa, tầng, căn hộ và tổng hợp báo cáo vận hành.</p>
        </div>
        <div className="building-page__header-actions">
          <button className="btn btn--ghost" onClick={fetchData} disabled={loading}>
            <span className="btn__icon">{icons.refresh}</span>
            Làm mới
          </button>
          <button className="btn btn--primary" onClick={handleExport} disabled={loading}>
            <span className="btn__icon">{icons.download}</span>
            Xuất Excel
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <section className="bld-filters">
        <div className="bld-filters__segment-group">
          <div className="bld-filters__label">
            {icons.filter}
            <span>Cấp tổng hợp</span>
          </div>
          <div className="bld-segmented">
            {GROUP_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`bld-segmented__btn ${filters.groupBy === option.value ? 'bld-segmented__btn--active' : ''}`}
                onClick={() => updateFilter('groupBy', option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bld-filters__selects">
          <label className="bld-filters__field">
            <span>Khu chung cư</span>
            <DropdownSelect
              value={filters.complexName}
              onChange={(value) => updateFilter('complexName', value)}
              options={[
                { value: '', label: 'Tất cả khu' },
                ...complexOptions.map((name) => ({ value: name, label: name })),
              ]}
            />
          </label>

          <label className="bld-filters__field">
            <span>Tòa</span>
            <DropdownSelect
              value={filters.block}
              onChange={(value) => updateFilter('block', value)}
              options={[
                { value: '', label: 'Tất cả tòa' },
                ...blockOptions.map((block) => ({ value: block, label: `Tòa ${block}` })),
              ]}
            />
          </label>

          <label className="bld-filters__field">
            <span>Tầng</span>
            <DropdownSelect
              value={filters.floor}
              onChange={(value) => updateFilter('floor', value)}
              options={[
                { value: '', label: 'Tất cả tầng' },
                ...floorOptions.map((floor) => ({ value: floor, label: `Tầng ${floor}` })),
              ]}
            />
          </label>

          {hasActiveFilter && (
            <button className="bld-filters__clear" onClick={resetFilters} type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Xóa lọc
            </button>
          )}
        </div>
      </section>

      {loading ? (
        <div className="bld-loading">
          <div className="bld-loading__spinner" />
          <span>Đang tải dữ liệu báo cáo...</span>
        </div>
      ) : (
        <>
          {/* ── Summary Statistics ── */}
          <section className="bld-stats">
            {/* Main apartment card with progress ring */}
            <div className="bld-stat bld-stat--hero">
              <div className="bld-stat__ring-wrap">
                <svg className="bld-stat__ring" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="url(#ringGrad)" strokeWidth="6"
                    strokeDasharray={`${(occupancyRate / 100) * 213.6} 213.6`}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                  />
                  <defs>
                    <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="bld-stat__ring-label">
                  <strong>{occupancyRate}%</strong>
                  <small>Lấp đầy</small>
                </div>
              </div>
              <div className="bld-stat__hero-info">
                <div className="bld-stat__icon-badge bld-stat__icon-badge--blue">
                  {icons.apartment}
                </div>
                <span className="bld-stat__category">Căn hộ</span>
                <strong className="bld-stat__value">
                  <AnimatedNumber value={summary.apartmentCount} />
                </strong>
                <div className="bld-stat__breakdown">
                  <span className="bld-stat__dot bld-stat__dot--green" />
                  {formatNumber(summary.occupiedCount)} đang ở
                  <span className="bld-stat__dot bld-stat__dot--blue" />
                  {formatNumber(summary.vacantCount)} trống
                  {summary.maintenanceCount > 0 && (
                    <>
                      <span className="bld-stat__dot bld-stat__dot--amber" />
                      {formatNumber(summary.maintenanceCount)} bảo trì
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Resident card */}
            <div className="bld-stat">
              <div className="bld-stat__icon-badge bld-stat__icon-badge--indigo">
                {icons.residents}
              </div>
              <span className="bld-stat__category">Cư dân</span>
              <strong className="bld-stat__value">
                <AnimatedNumber value={summary.residentCount} />
              </strong>
              <small className="bld-stat__sub">{formatNumber(scopedApartments.length)} căn trong phạm vi lọc</small>
            </div>

            {/* Device card */}
            <div className="bld-stat">
              <div className="bld-stat__icon-badge bld-stat__icon-badge--teal">
                {icons.device}
              </div>
              <span className="bld-stat__category">Thiết bị</span>
              <strong className="bld-stat__value">
                <AnimatedNumber value={summary.deviceCount} />
              </strong>
              <small className="bld-stat__sub">{formatNumber(summary.maintenanceCount)} căn hộ đang bảo trì</small>
            </div>

            {/* Revenue card */}
            <div className="bld-stat bld-stat--success">
              <div className="bld-stat__icon-badge bld-stat__icon-badge--emerald">
                {icons.money}
              </div>
              <span className="bld-stat__category">Đã thu</span>
              <strong className="bld-stat__value bld-stat__value--sm">
                <AnimatedNumber value={summary.paidRevenue} format="currency" />
              </strong>
              <small className="bld-stat__sub">{formatNumber(report?.invoiceCount || 0)} hóa đơn</small>
            </div>

            {/* Debt card */}
            <div className="bld-stat bld-stat--danger">
              <div className="bld-stat__icon-badge bld-stat__icon-badge--red">
                {icons.debt}
              </div>
              <span className="bld-stat__category">Công nợ</span>
              <strong className="bld-stat__value bld-stat__value--sm">
                <AnimatedNumber value={summary.unpaidRevenue} format="currency" />
              </strong>
              <small className="bld-stat__sub">{formatNumber(summary.unpaidInvoiceCount)} hóa đơn chưa thu</small>
            </div>
          </section>

          {/* ── Report Cards Grid ── */}
          <section className="bld-cards-section">
            <div className="bld-section-header">
              <div className="bld-section-header__left">
                <div className="bld-section-header__icon">{icons.report}</div>
                <div>
                  <h3>Tổng hợp theo nhóm</h3>
                  <p>{formatNumber(report?.items?.length || 0)} nhóm dữ liệu</p>
                </div>
              </div>
            </div>
            <div className="bld-cards-grid">
              {(report?.items || []).map((item, index) => (
                <article
                  key={item.groupKey}
                  className="bld-card"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="bld-card__header">
                    <div className="bld-card__avatar">
                      {icons.building}
                    </div>
                    <div className="bld-card__title-group">
                      <strong>{item.groupLabel}</strong>
                      <small>{item.complexName || 'Tất cả khu'}{item.block ? ` · Tòa ${item.block}` : ''}{item.floor != null ? ` · Tầng ${item.floor}` : ''}</small>
                    </div>
                  </div>
                  <div className="bld-card__body">
                    <div className="bld-card__metric">
                      <span>Căn hộ</span>
                      <strong>{formatNumber(item.apartmentCount)}</strong>
                    </div>
                    <div className="bld-card__metric">
                      <span>Cư dân</span>
                      <strong>{formatNumber(item.residentCount)}</strong>
                    </div>
                    <div className="bld-card__metric">
                      <span>Thiết bị</span>
                      <strong>{formatNumber(item.deviceCount)}</strong>
                    </div>
                    <div className="bld-card__metric bld-card__metric--accent">
                      <span>Công nợ</span>
                      <strong>{formatCurrency(item.unpaidRevenue)}</strong>
                    </div>
                  </div>
                  {/* Occupancy mini bar */}
                  {item.apartmentCount > 0 && (
                    <div className="bld-card__bar-wrap">
                      <div className="bld-card__bar">
                        <div
                          className="bld-card__bar-fill bld-card__bar-fill--occupied"
                          style={{ width: `${(item.occupiedCount / item.apartmentCount) * 100}%` }}
                          title={`Đang ở: ${item.occupiedCount}`}
                        />
                        <div
                          className="bld-card__bar-fill bld-card__bar-fill--maintenance"
                          style={{ width: `${(item.maintenanceCount / item.apartmentCount) * 100}%` }}
                          title={`Bảo trì: ${item.maintenanceCount}`}
                        />
                      </div>
                      <div className="bld-card__bar-legend">
                        <span><i style={{ background: '#22c55e' }} /> Đang ở {item.occupiedCount}</span>
                        <span><i style={{ background: '#94a3b8' }} /> Trống {item.vacantCount}</span>
                      </div>
                    </div>
                  )}
                </article>
              ))}
              {(report?.items || []).length === 0 && (
                <div className="bld-empty">
                  <div className="bld-empty__icon">{icons.filter}</div>
                  <p>Không có dữ liệu phù hợp với bộ lọc hiện tại.</p>
                </div>
              )}
            </div>
          </section>

          {/* ── Detailed Report Table ── */}
          <section className="bld-table-section">
            <div className="bld-section-header">
              <div className="bld-section-header__left">
                <div className="bld-section-header__icon bld-section-header__icon--purple">{icons.table}</div>
                <div>
                  <h3>Báo cáo chi tiết</h3>
                  <p>{formatNumber(report?.items?.length || 0)} nhóm dữ liệu</p>
                </div>
              </div>
            </div>
            <div className="bld-table-wrap">
              <table className="bld-table">
                <thead>
                  <tr>
                    <th>Nhóm</th>
                    <th>Căn hộ</th>
                    <th>Đang ở</th>
                    <th>Trống</th>
                    <th>Bảo trì</th>
                    <th>Cư dân</th>
                    <th>Thiết bị</th>
                    <th>HĐ chưa thu</th>
                    <th>Đã thu</th>
                    <th>Công nợ</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.items || []).map((item) => (
                    <tr key={item.groupKey}>
                      <td className="bld-table__cell-name">{item.groupLabel}</td>
                      <td><span className="bld-table__num">{formatNumber(item.apartmentCount)}</span></td>
                      <td><span className="bld-table__num">{formatNumber(item.occupiedCount)}</span></td>
                      <td><span className="bld-table__num">{formatNumber(item.vacantCount)}</span></td>
                      <td><span className="bld-table__num">{formatNumber(item.maintenanceCount)}</span></td>
                      <td><span className="bld-table__num">{formatNumber(item.residentCount)}</span></td>
                      <td><span className="bld-table__num">{formatNumber(item.deviceCount)}</span></td>
                      <td><span className="bld-table__num">{formatNumber(item.unpaidInvoiceCount)}</span></td>
                      <td><span className="bld-table__money bld-table__money--green">{formatCurrency(item.paidRevenue)}</span></td>
                      <td><span className="bld-table__money bld-table__money--red">{formatCurrency(item.unpaidRevenue)}</span></td>
                    </tr>
                  ))}
                  {(report?.items || []).length === 0 && (
                    <tr>
                      <td colSpan="10" className="bld-table__empty">Không có dữ liệu báo cáo</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Apartments Table ── */}
          <section className="bld-table-section">
            <div className="bld-section-header">
              <div className="bld-section-header__left">
                <div className="bld-section-header__icon bld-section-header__icon--teal">{icons.list}</div>
                <div>
                  <h3>Căn hộ trong phạm vi</h3>
                  <p>{formatNumber(scopedApartments.length)} căn hộ</p>
                </div>
              </div>
            </div>
            <div className="bld-table-wrap">
              <table className="bld-table">
                <thead>
                  <tr>
                    <th>Căn hộ</th>
                    <th>Khu</th>
                    <th>Tòa</th>
                    <th>Tầng</th>
                    <th>Diện tích</th>
                    <th>Cư dân</th>
                    <th>Thiết bị</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {scopedApartments.slice(page * pageSize, (page + 1) * pageSize).map((apartment) => (
                    <tr key={apartment.id} className="bld-table__row--clickable" onClick={() => openApartmentModal(apartment)}>
                      <td className="bld-table__cell-name">
                        <span className="bld-table__cell-link">{getApartmentLabel(apartment)}</span>
                      </td>
                      <td>{apartment.complexName || 'Hưng Thịnh'}</td>
                      <td>{apartment.block || '—'}</td>
                      <td>{apartment.floor ?? '—'}</td>
                      <td>{apartment.area ? `${apartment.area} m²` : '—'}</td>
                      <td><span className="bld-table__num">{formatNumber(apartment.residents?.length || 0)}</span></td>
                      <td><span className="bld-table__num">{formatNumber(apartment.deviceCount || 0)}</span></td>
                      <td>
                        <span className={`bld-status bld-status--${String(apartment.apartmentStatus || '').toLowerCase()}`}>
                          {statusLabel[apartment.apartmentStatus] || apartment.apartmentStatus || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {scopedApartments.length === 0 && (
                    <tr>
                      <td colSpan="8" className="bld-table__empty">Không có căn hộ trong phạm vi này</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {Math.ceil(scopedApartments.length / pageSize) > 1 && (
              <div className="pagination" style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#fff', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                <span className="pagination__info">
                  Trang {page + 1} / {Math.ceil(scopedApartments.length / pageSize)} — Tổng {scopedApartments.length} căn hộ
                </span>
                <div className="pagination__btns">
                  <button className="pagination__btn" disabled={page === 0} onClick={() => setPage(0)} title="Trang đầu">
                    ««
                  </button>
                  <button className="pagination__btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                    {icons.chevronLeft}
                  </button>
                  {Array.from({ length: Math.min(5, Math.ceil(scopedApartments.length / pageSize)) }, (_, i) => {
                    const totalPages = Math.ceil(scopedApartments.length / pageSize);
                    let pageNum;
                    if (totalPages <= 5) pageNum = i;
                    else if (page < 3) pageNum = i;
                    else if (page > totalPages - 4) pageNum = totalPages - 5 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        className={`pagination__btn pagination__btn--num ${page === pageNum ? 'pagination__btn--active' : ''}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  <button className="pagination__btn" disabled={page >= Math.ceil(scopedApartments.length / pageSize) - 1} onClick={() => setPage((p) => p + 1)}>
                    {icons.chevronRight}
                  </button>
                  <button className="pagination__btn" disabled={page >= Math.ceil(scopedApartments.length / pageSize) - 1} onClick={() => setPage(Math.ceil(scopedApartments.length / pageSize) - 1)} title="Trang cuối">
                    »»
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* ── Apartment Detail Modal ── */}
      {modalOpen && modalApartment && createPortal((
        <div className="modal-overlay bld-modal-overlay" onClick={closeModal}>
          <div className="modal bld-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bld-modal__header">
              <div className="bld-modal__header-info">
                <div className="bld-modal__header-icon">
                  {icons.apartment}
                </div>
                <div>
                  <h3 className="bld-modal__title">{getApartmentLabel(modalApartment)}</h3>
                  <p className="bld-modal__subtitle">
                    {modalApartment.complexName || 'Hưng Thịnh'}
                    {modalApartment.block ? ` · Tòa ${modalApartment.block}` : ''}
                    {modalApartment.floor != null ? ` · Tầng ${modalApartment.floor}` : ''}
                  </p>
                </div>
              </div>
              <button className="modal__close" onClick={closeModal}>
                {icons.close}
              </button>
            </div>

            {/* Body */}
            <div className="bld-modal__body">
              {modalLoading ? (
                <div className="bld-loading" style={{ padding: '40px 24px' }}>
                  <div className="bld-loading__spinner" />
                  <span>Đang tải thông tin...</span>
                </div>
              ) : (
                <>
                  {/* Info Cards */}
                  <div className="bld-modal__info-grid">
                    <div className="bld-modal__info-card">
                      <span className="bld-modal__info-label">Diện tích</span>
                      <strong>{modalApartment.area ? `${modalApartment.area} m²` : '—'}</strong>
                    </div>
                    <div className="bld-modal__info-card">
                      <span className="bld-modal__info-label">Trạng thái</span>
                      <span className={`bld-status bld-status--${String(modalApartment.apartmentStatus || '').toLowerCase()}`}>
                        {statusLabel[modalApartment.apartmentStatus] || '—'}
                      </span>
                    </div>
                    <div className="bld-modal__info-card">
                      <span className="bld-modal__info-label">Cư dân</span>
                      <strong>{formatNumber(modalApartment.residents?.length || 0)} người</strong>
                    </div>
                    <div className="bld-modal__info-card">
                      <span className="bld-modal__info-label">Thiết bị</span>
                      <strong>{formatNumber(modalApartment.deviceCount || 0)}</strong>
                    </div>
                  </div>

                  {/* Owner Section */}
                  {(() => {
                    const owner = getOwner(modalApartment);
                    if (!owner) return null;
                    return (
                      <div className="bld-modal__section">
                        <h4 className="bld-modal__section-title">
                          <span className="bld-modal__section-icon bld-modal__section-icon--purple">{icons.user}</span>
                          Chủ hộ
                        </h4>
                        <div className="bld-modal__owner-card">
                          <div className="bld-modal__avatar">{getResidentInitial(owner)}</div>
                          <div className="bld-modal__owner-info">
                            <strong>{owner.fullName || owner.userName || '—'}</strong>
                            <div className="bld-modal__owner-meta">
                              <span>{icons.phone} {getResidentPhone(owner)}</span>
                              <span>{icons.mail} {getResidentEmail(owner)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Residents List */}
                  <div className="bld-modal__section">
                    <h4 className="bld-modal__section-title">
                      <span className="bld-modal__section-icon bld-modal__section-icon--teal">{icons.residents}</span>
                      Danh sách cư dân
                      <span className="bld-modal__section-count">{modalApartment.residents?.length || 0}</span>
                    </h4>
                    {(modalApartment.residents || []).length > 0 ? (
                      <div className="bld-modal__residents-list">
                        {(modalApartment.residents || []).map((resident, index) => {
                          const rel = resident.relationshipType || resident.relationship;
                          return (
                            <div key={resident.id || index} className="bld-modal__resident-row">
                              <div className="bld-modal__avatar bld-modal__avatar--sm">{getResidentInitial(resident)}</div>
                              <div className="bld-modal__resident-info">
                                <strong>{resident.fullName || resident.userName || '—'}</strong>
                                <small>{getResidentPhone(resident)}</small>
                              </div>
                              <span className={`bld-modal__rel-badge bld-modal__rel-badge--${String(rel || '').toLowerCase()}`}>
                                {relationshipLabel[rel] || rel || '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bld-modal__empty">
                        <span>{icons.residents}</span>
                        <p>Chưa có cư dân trong căn hộ này</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}
