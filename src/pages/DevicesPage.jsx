import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import deviceService from '../services/deviceService';
import apartmentService from '../services/apartmentService';
import DropdownSelect from '../components/common/DropdownSelect';

/* ─── constants ─── */
const DEVICE_STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Không hoạt động' },
  { value: 'UNDER_MAINTENANCE', label: 'Đang bảo trì' },
  { value: 'BROKEN', label: 'Hỏng' },
];

const DEVICE_TYPES = [
  { value: 'COMMON', label: 'Thiết bị chung' },
  { value: 'APARTMENT', label: 'Thiết bị căn hộ' },
];

const typeLabel = {
  COMMON: 'Thiết bị chung',
  APARTMENT: 'Thiết bị căn hộ',
};

const statusLabel = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Không hoạt động',
  UNDER_MAINTENANCE: 'Đang bảo trì',
  BROKEN: 'Hỏng',
};

const statusColor = {
  ACTIVE: { color: '#047857', bg: '#d1fae5', border: '#a7f3d0' },
  INACTIVE: { color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' },
  UNDER_MAINTENANCE: { color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  BROKEN: { color: '#991b1b', bg: '#fecaca', border: '#fca5a5' },
};

const apartmentStatusLabel = {
  OCCUPIED: 'Đang ở',
  VACANT: 'Trống',
  UNDER_MAINTENANCE: 'Đang bảo trì',
};

const apartmentStatusColor = {
  OCCUPIED: { color: '#059669', bg: '#d1fae5' },
  VACANT: { color: '#2563eb', bg: '#dbeafe' },
  UNDER_MAINTENANCE: { color: '#d97706', bg: '#fef3c7' },
};

const PAGE_SIZE = 10;

/* ─── icons ─── */
const Icons = {
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 6 15 12 9 18" /></svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 10 9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  ),
};

const getApartmentLabel = (apt) => {
  if (!apt) return 'Dùng chung';
  return `${apt.block ? `${apt.block}-` : ''}${apt.apartmentNumber || ''}${apt.floor != null ? ` (Tầng ${apt.floor})` : ''}`;
};

export default function DevicesPage() {
  /* ─── state ─── */
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [apartmentDeviceRows, setApartmentDeviceRows] = useState([]);
  const [apartmentDeviceTotalPages, setApartmentDeviceTotalPages] = useState(0);
  const [apartmentDeviceTotalElements, setApartmentDeviceTotalElements] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Apartments for selection
  const [apartments, setApartments] = useState([]);
  const [aptSearchKeyword, setAptSearchKeyword] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchKeyword !== searchInput) {
        setSearchKeyword(searchInput);
        setPage(0);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchKeyword]);

  const [aptSearchInput, setAptSearchInput] = useState('');
  const [aptLoading, setAptLoading] = useState(false);
  const [aptPage, setAptPage] = useState(0);
  const [aptTotalPages, setAptTotalPages] = useState(0);
  const [aptBlock, setAptBlock] = useState('');
  const [aptFloor, setAptFloor] = useState('');
  const [aptHasDevices, setAptHasDevices] = useState(null); // null: All, true: Has, false: None

  useEffect(() => {
    const timer = setTimeout(() => {
      setAptSearchKeyword(aptSearchInput);
      setAptPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [aptSearchInput]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [formData, setFormData] = useState({
    deviceName: '',
    location: '',
    deviceStatus: 'ACTIVE',
    maintenanceCycleDay: '',
    installationDate: '',
    apartmentId: '',
    deviceType: 'COMMON',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Apartment device detail
  const [apartmentDetailOpen, setApartmentDetailOpen] = useState(false);
  const [selectedApartmentDetail, setSelectedApartmentDetail] = useState(null);
  const [apartmentDetailDevices, setApartmentDetailDevices] = useState([]);
  const [apartmentDetailLoading, setApartmentDetailLoading] = useState(false);

  useEffect(() => {
    if (!modalOpen && !deleteModalOpen && !apartmentDetailOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen, deleteModalOpen, apartmentDetailOpen]);

  const isApartmentDeviceMode = filterType === 'APARTMENT';

  /* ─── fetch ─── */
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      if (isApartmentDeviceMode) {
        const params = {
          page,
          size: PAGE_SIZE,
          sortBy: 'apartmentNumber',
          direction: sortDirection,
          hasDevices: true,
        };
        if (searchKeyword.trim()) params.keyword = searchKeyword.trim();

        const res = await apartmentService.getAll(params);
        const data = res.data?.data;
        setApartmentDeviceRows(data?.content || []);
        setApartmentDeviceTotalPages(data?.totalPages || 0);
        setApartmentDeviceTotalElements(data?.totalElements || 0);
        setDevices([]);
        setTotalPages(0);
        setTotalElements(0);
        return;
      }

      const params = {
        page,
        size: PAGE_SIZE,
        sortBy: 'id',
        direction: sortDirection,
      };
      if (filterStatus) params.deviceStatus = filterStatus;
      if (filterType) params.deviceType = filterType;
      if (searchKeyword.trim()) params.keyword = searchKeyword.trim();

      const res = await deviceService.getAll(params);
      const data = res.data?.data;
      setDevices(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
      setApartmentDeviceRows([]);
      setApartmentDeviceTotalPages(0);
      setApartmentDeviceTotalElements(0);
    } catch (err) {
      toast.error('Không thể tải danh sách thiết bị');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterType, isApartmentDeviceMode, sortDirection, searchKeyword]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    const fetchApts = async () => {
      setAptLoading(true);
      try {
        const params = { 
          page: aptPage, 
          size: 12, // 12 items per page for the grid (3x4 or 4x3)
          sortBy: 'apartmentNumber',
          direction: 'asc'
        };
        if (aptSearchKeyword.trim()) params.keyword = aptSearchKeyword.trim();
        if (aptBlock) params.block = aptBlock;
        if (aptFloor) params.floor = Number(aptFloor);
        if (aptHasDevices !== null) params.hasDevices = aptHasDevices;

        const res = await apartmentService.getAll(params);
        const data = res.data?.data;
        setApartments(data?.content || []);
        setAptTotalPages(data?.totalPages || 0);
      } catch (err) { console.error(err); }
      finally { setAptLoading(false); }
    };
    if (modalOpen && formData.deviceType === 'APARTMENT') {
      fetchApts();
    }
  }, [aptSearchKeyword, aptPage, aptBlock, aptFloor, aptHasDevices, modalOpen, formData.deviceType]);

  /* ─── handlers ─── */
  const handleFilterStatus = (val) => { setFilterStatus(val); setPage(0); };
  const handleFilterType = (val) => {
    setFilterType(val);
    setPage(0);
    if (val === 'APARTMENT') setFilterStatus('');
  };
  const handleToggleSort = () => { setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc')); setPage(0); };

  const openCreateModal = () => {
    const defaultDeviceType = filterType === 'APARTMENT' ? 'APARTMENT' : 'COMMON';
    setModalMode('create');
    setSelectedDevice(null);
    setFormData({
      deviceName: '',
      location: '',
      deviceStatus: 'ACTIVE',
      maintenanceCycleDay: '',
      installationDate: '',
      apartmentId: '',
      deviceType: defaultDeviceType,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (dev) => {
    setModalMode('edit');
    setSelectedDevice(dev);
    setFormData({
      deviceName: dev.deviceName || '',
      location: dev.location || '',
      deviceStatus: dev.deviceStatus || 'ACTIVE',
      maintenanceCycleDay: dev.maintenanceCycleDay ?? '',
      installationDate: (() => {
        const d = dev.installationDate;
        if (!d) return '';
        if (Array.isArray(d)) return `${d[0]}-${String(d[1]).padStart(2,'0')}-${String(d[2]).padStart(2,'0')}`;
        if (typeof d === 'string') {
          // DD/MM/YYYY -> YYYY-MM-DD
          const parts = d.split('/');
          if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
          return d.substring(0, 10);
        }
        return '';
      })(),
      apartmentId: dev.apartment?.id || dev.apartment?.apartmentId || '',
      deviceType: dev.deviceType || 'COMMON',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openViewModal = (dev) => { setModalMode('view'); setSelectedDevice(dev); setModalOpen(true); };
  const openDeleteModal = (dev) => { setDeleteTarget(dev); setDeleteModalOpen(true); };

  const openApartmentDetailModal = async (apt) => {
    setSelectedApartmentDetail(apt);
    setApartmentDetailDevices([]);
    setApartmentDetailOpen(true);
    setApartmentDetailLoading(true);
    try {
      const res = await deviceService.getAll({
        page: 0,
        size: 200,
        sortBy: 'id',
        direction: 'asc',
        deviceType: 'APARTMENT',
        apartmentId: apt.id,
      });
      setApartmentDetailDevices(res.data?.data?.content || []);
    } catch (err) {
      toast.error('Không thể tải thiết bị của căn hộ');
      console.error(err);
    } finally {
      setApartmentDetailLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.deviceName.trim()) errors.deviceName = 'Vui lòng nhập tên thiết bị';
    if (!formData.deviceStatus) errors.deviceStatus = 'Vui lòng chọn trạng thái';
    if (formData.deviceType === 'APARTMENT' && !formData.apartmentId) errors.apartmentId = 'Vui lòng chọn căn hộ sở hữu';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        deviceName: formData.deviceName,
        location: formData.location || undefined,
        deviceStatus: formData.deviceStatus,
        maintenanceCycleDay: formData.maintenanceCycleDay ? Number(formData.maintenanceCycleDay) : undefined,
        installationDate: formData.installationDate || undefined,
        apartmentId: formData.deviceType === 'APARTMENT' ? (formData.apartmentId || undefined) : undefined,
        deviceType: formData.deviceType,
      };

      let res;
      if (modalMode === 'create') {
        res = await deviceService.create(payload);
      } else {
        res = await deviceService.update(selectedDevice.id, payload);
      }

      if (res.data?.status) {
        toast.success(modalMode === 'create' ? 'Tạo thiết bị thành công!' : 'Cập nhật thiết bị thành công!');
        setModalOpen(false);
        fetchDevices();
      } else {
        toast.error(res.data?.message || 'Thao tác thất bại');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deviceService.delete(deleteTarget.id);
      if (res.data?.status !== false) {
        toast.success('Xóa thiết bị thành công!');
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        if (devices.length === 1 && page > 0) setPage((p) => p - 1);
        else fetchDevices();
      } else {
        toast.error(res.data?.message || 'Xóa thất bại');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      // API returns "DD/MM/YYYY" string - use directly
      if (typeof dateStr === 'string' && dateStr.includes('/')) return dateStr;
      // Handle array format [year, month, day]
      if (Array.isArray(dateStr)) {
        const [y, m, d] = dateStr;
        return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
      }
      // Handle ISO string
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '—';
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    } catch { return '—'; }
  };

  const formatArea = (area) => {
    if (area === null || area === undefined || area === '') return '—';
    const value = Number(area);
    return Number.isFinite(value) ? `${value % 1 === 0 ? value.toFixed(0) : value} m²` : `${area} m²`;
  };

  const getApartmentOwner = (apt) => apt?.residents?.find((r) => r.relationshipType === 'OWNER')
    || apt?.residents?.find((r) => r.residentId === apt.ownerId)
    || null;

  const getApartmentTenant = (apt) => apt?.residents?.find((r) => r.relationshipType === 'TENANT') || null;

  const getDeviceStats = (list) => list.reduce((acc, dev) => {
    acc.total += 1;
    acc[dev.deviceStatus] = (acc[dev.deviceStatus] || 0) + 1;
    return acc;
  }, { total: 0, ACTIVE: 0, INACTIVE: 0, UNDER_MAINTENANCE: 0, BROKEN: 0 });

  const getStatusBadgeStyle = (status) => {
    const tone = statusColor[status] || { color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' };
    return {
      color: tone.color,
      backgroundColor: tone.bg,
      border: `1px solid ${tone.border}`,
    };
  };

  const selectedApartmentOwner = getApartmentOwner(selectedApartmentDetail);
  const selectedApartmentTenant = getApartmentTenant(selectedApartmentDetail);
  const selectedApartmentStats = getDeviceStats(apartmentDetailDevices);

  /* ─── render ─── */
  return (
    <div className="page">
      {/* Header */}
      <div className="page__header">
        <div>
          <h2 className="page__title">Quản lý thiết bị</h2>
          <p className="page__desc">
            {isApartmentDeviceMode
              ? `Quản lý thiết bị theo từng căn hộ (${apartmentDeviceTotalElements} căn hộ có thiết bị)`
              : `Quản lý các thiết bị trong chung cư (${totalElements} thiết bị)`}
          </p>
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <span className="btn__icon">{Icons.plus}</span>
          Thêm thiết bị
        </button>
      </div>

      {/* Filters */}
      <div className="page__filters">
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {!isApartmentDeviceMode && (
            <div className="filter-group">
              <label className="filter-label">Trạng thái:</label>
              <div className="filter-tabs">
                {DEVICE_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    className={`filter-tab ${filterStatus === s.value ? 'filter-tab--active' : ''}`}
                    onClick={() => handleFilterStatus(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="filter-group">
            <label className="filter-label">Loại thiết bị:</label>
            <div className="filter-tabs">
              {[
                { val: '', label: 'Tất cả' },
                { val: 'COMMON', label: 'Thiết bị chung' },
                { val: 'APARTMENT', label: 'Thiết bị căn hộ' },
              ].map((t) => (
                <button
                  key={t.val}
                  className={`filter-tab ${filterType === t.val ? 'filter-tab--active' : ''}`}
                  onClick={() => handleFilterType(t.val)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="filter-actions">
          <div className="search-box">
            <span className="search-box__icon">{Icons.search}</span>
            <input
              type="text"
              className="search-input"
              placeholder={isApartmentDeviceMode ? 'Tìm căn hộ, block...' : 'Tìm kiếm...'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button className="btn btn--ghost btn--sm" onClick={handleToggleSort} title="Đổi thứ tự">
            {sortDirection === 'asc' ? '↑ Tăng dần' : '↓ Giảm dần'}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={fetchDevices} title="Làm mới">
            <span className="btn__icon">{Icons.refresh}</span>
          </button>
        </div>
      </div>

      {isApartmentDeviceMode ? (
        <>
          <div className="device-apartment-panel">
            <div className="device-apartment-panel__head">
              <div>
                <h3>Danh sách căn hộ có thiết bị</h3>
                <p>Bấm vào một căn hộ để xem toàn bộ thiết bị, cư dân liên quan và trạng thái vận hành.</p>
              </div>
              <span>{apartmentDeviceTotalElements} căn hộ</span>
            </div>

            {loading ? (
              <div className="page__loading">
                <div className="spinner" />
                <span>Đang tải dữ liệu...</span>
              </div>
            ) : apartmentDeviceRows.length === 0 ? (
              <div className="page__empty">
                <p>Không tìm thấy căn hộ có thiết bị</p>
              </div>
            ) : (
              <div className="device-apartment-list">
                {apartmentDeviceRows.map((apt) => {
                  const owner = getApartmentOwner(apt);
                  const tenant = getApartmentTenant(apt);
                  const aptStatus = apartmentStatusColor[apt.apartmentStatus] || { color: '#64748b', bg: '#f1f5f9' };

                  return (
                    <button
                      type="button"
                      key={apt.id}
                      className="device-apartment-row"
                      onClick={() => openApartmentDetailModal(apt)}
                    >
                      <span className="device-apartment-row__icon">{Icons.home}</span>
                      <span className="device-apartment-row__main">
                        <strong>{getApartmentLabel(apt)}</strong>
                        <small>Block {apt.block || '—'} · Tầng {apt.floor ?? '—'} · {formatArea(apt.area)}</small>
                      </span>
                      <span className="device-apartment-row__resident">
                        <small>Chủ hộ / người thuê</small>
                        <strong>{owner?.fullName || tenant?.fullName || 'Chưa có cư dân'}</strong>
                        <em>{owner?.phone || tenant?.phone || 'Chưa có SĐT'}</em>
                      </span>
                      <span className="device-apartment-row__meta">
                        <span className="badge" style={{ color: aptStatus.color, backgroundColor: aptStatus.bg }}>
                          {apartmentStatusLabel[apt.apartmentStatus] || apt.apartmentStatus || '—'}
                        </span>
                        <span className="device-apartment-row__count">{apt.deviceCount || 0} thiết bị</span>
                      </span>
                      <span className="device-apartment-row__action">Xem chi tiết</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {apartmentDeviceTotalPages > 1 && (
            <div className="pagination">
              <span className="pagination__info">
                Trang {page + 1} / {apartmentDeviceTotalPages} — Tổng {apartmentDeviceTotalElements} căn hộ
              </span>
              <div className="pagination__btns">
                <button className="pagination__btn" disabled={page === 0} onClick={() => setPage(0)} title="Trang đầu">
                  ««
                </button>
                <button className="pagination__btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  {Icons.chevronLeft}
                </button>
                {Array.from({ length: Math.min(5, apartmentDeviceTotalPages) }, (_, i) => {
                  let pageNum;
                  if (apartmentDeviceTotalPages <= 5) pageNum = i;
                  else if (page < 3) pageNum = i;
                  else if (page > apartmentDeviceTotalPages - 4) pageNum = apartmentDeviceTotalPages - 5 + i;
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
                <button className="pagination__btn" disabled={page >= apartmentDeviceTotalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  {Icons.chevronRight}
                </button>
                <button className="pagination__btn" disabled={page >= apartmentDeviceTotalPages - 1} onClick={() => setPage(apartmentDeviceTotalPages - 1)} title="Trang cuối">
                  »»
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="page__table-wrapper">
            {loading ? (
              <div className="page__loading">
                <div className="spinner" />
                <span>Đang tải dữ liệu...</span>
              </div>
            ) : devices.length === 0 ? (
              <div className="page__empty">
                <p>Không tìm thấy thiết bị nào</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="data-table__th--id">ID</th>
                    <th>Tên thiết bị</th>
                    <th>Loại</th>
                    <th>Vị trí / Căn hộ</th>
                    <th>Chu kỳ bảo trì</th>
                    <th>Ngày lắp đặt</th>
                    <th>Trạng thái</th>
                    <th className="data-table__th--actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((dev) => {
                    return (
                      <tr key={dev.id}>
                        <td className="data-table__cell--id">{dev.id}</td>
                        <td className="data-table__cell--bold">{dev.deviceName}</td>
                        <td>
                          <span className={`badge ${dev.deviceType === 'COMMON' ? 'badge--ghost' : 'badge--info'}`}>
                            {typeLabel[dev.deviceType] || dev.deviceType}
                          </span>
                        </td>
                        <td>
                          {dev.deviceType === 'COMMON' ? (
                            dev.location || '—'
                          ) : (
                            getApartmentLabel(dev.apartment)
                          )}
                        </td>
                        <td>{dev.maintenanceCycleDay ? `${dev.maintenanceCycleDay} ngày` : '—'}</td>
                        <td>{formatDate(dev.installationDate)}</td>
                        <td>
                          <span className="badge" style={getStatusBadgeStyle(dev.deviceStatus)}>
                            {statusLabel[dev.deviceStatus] || dev.deviceStatus}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="action-btn action-btn--view" data-tooltip="Xem chi tiết" aria-label="Xem chi tiết" onClick={() => openViewModal(dev)}>
                              {Icons.eye}
                            </button>
                            <button className="action-btn action-btn--edit" data-tooltip="Chỉnh sửa" aria-label="Chỉnh sửa" onClick={() => openEditModal(dev)}>
                              {Icons.edit}
                            </button>
                            <button className="action-btn action-btn--delete" data-tooltip="Xóa" aria-label="Xóa" onClick={() => openDeleteModal(dev)}>
                              {Icons.trash}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <span className="pagination__info">
                Trang {page + 1} / {totalPages} — Tổng {totalElements} bản ghi
              </span>
              <div className="pagination__btns">
                <button className="pagination__btn" disabled={page === 0} onClick={() => setPage(0)} title="Trang đầu">
                  ««
                </button>
                <button className="pagination__btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  {Icons.chevronLeft}
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                <button className="pagination__btn" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  {Icons.chevronRight}
                </button>
                <button className="pagination__btn" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)} title="Trang cuối">
                  »»
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {apartmentDetailOpen && selectedApartmentDetail && createPortal((
        <div className="modal-overlay device-apartment-overlay" onClick={() => setApartmentDetailOpen(false)}>
          <div className="modal device-apartment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header device-apartment-modal__header">
              <div>
                <h3 className="modal__title">Thiết bị căn hộ {getApartmentLabel(selectedApartmentDetail)}</h3>
                <p className="device-apartment-modal__subtitle">
                  Block {selectedApartmentDetail.block || '—'} · Tầng {selectedApartmentDetail.floor ?? '—'} · {formatArea(selectedApartmentDetail.area)}
                </p>
              </div>
              <button className="modal__close" onClick={() => setApartmentDetailOpen(false)}>
                {Icons.close}
              </button>
            </div>

            <div className="modal__body device-apartment-modal__body">
              <div className="device-apartment-modal__summary">
                <div className="device-summary-card">
                  <span>Tổng thiết bị</span>
                  <strong>{selectedApartmentStats.total}</strong>
                </div>
                <div className="device-summary-card device-summary-card--active">
                  <span>Hoạt động</span>
                  <strong>{selectedApartmentStats.ACTIVE || 0}</strong>
                </div>
                <div className="device-summary-card device-summary-card--warning">
                  <span>Đang bảo trì</span>
                  <strong>{selectedApartmentStats.UNDER_MAINTENANCE || 0}</strong>
                </div>
                <div className="device-summary-card device-summary-card--danger">
                  <span>Hỏng</span>
                  <strong>{selectedApartmentStats.BROKEN || 0}</strong>
                </div>
              </div>

              <div className="device-apartment-modal__info-grid">
                <section className="device-info-box">
                  <span className="device-info-box__label">Căn hộ</span>
                  <strong>{getApartmentLabel(selectedApartmentDetail)}</strong>
                  <small>
                    {apartmentStatusLabel[selectedApartmentDetail.apartmentStatus] || selectedApartmentDetail.apartmentStatus || '—'}
                  </small>
                </section>
                <section className="device-info-box">
                  <span className="device-info-box__label">Chủ hộ</span>
                  <strong>{selectedApartmentOwner?.fullName || 'Chưa có'}</strong>
                  <small>{selectedApartmentOwner?.phone || selectedApartmentOwner?.email || 'Chưa có thông tin liên hệ'}</small>
                </section>
                <section className="device-info-box">
                  <span className="device-info-box__label">Người thuê</span>
                  <strong>{selectedApartmentTenant?.fullName || 'Chưa có'}</strong>
                  <small>{selectedApartmentTenant?.phone || selectedApartmentTenant?.email || 'Không có người thuê'}</small>
                </section>
              </div>

              <section className="device-apartment-modal__section">
                <div className="device-apartment-modal__section-head">
                  <div>
                    <h4>Danh sách thiết bị</h4>
                    <p>Thông tin lắp đặt, chu kỳ bảo trì và trạng thái từng thiết bị.</p>
                  </div>
                  <span>{apartmentDetailDevices.length} thiết bị</span>
                </div>

                {apartmentDetailLoading ? (
                  <div className="page__loading">
                    <div className="spinner" />
                    <span>Đang tải thiết bị...</span>
                  </div>
                ) : apartmentDetailDevices.length === 0 ? (
                  <div className="page__empty">
                    <p>Căn hộ này chưa có thiết bị nào</p>
                  </div>
                ) : (
                  <div className="device-detail-list">
                    {apartmentDetailDevices.map((dev) => {
                      return (
                        <div className="device-detail-row" key={dev.id}>
                          <span className="device-detail-row__icon">{Icons.box}</span>
                          <span className="device-detail-row__main">
                            <strong>{dev.deviceName}</strong>
                            <small>ID #{dev.id} · {dev.location || getApartmentLabel(dev.apartment)}</small>
                          </span>
                          <span className="device-detail-row__meta">
                            <small>Ngày lắp đặt</small>
                            <strong>{formatDate(dev.installationDate)}</strong>
                          </span>
                          <span className="device-detail-row__meta">
                            <small>Chu kỳ bảo trì</small>
                            <strong>{dev.maintenanceCycleDay ? `${dev.maintenanceCycleDay} ngày` : '—'}</strong>
                          </span>
                          <span className="badge" style={getStatusBadgeStyle(dev.deviceStatus)}>
                            {statusLabel[dev.deviceStatus] || dev.deviceStatus}
                          </span>
                          <span className="device-detail-row__actions">
                            <button
                              className="action-btn action-btn--view"
                              data-tooltip="Xem chi tiết"
                              aria-label="Xem chi tiết"
                              onClick={() => {
                                setApartmentDetailOpen(false);
                                openViewModal(dev);
                              }}
                            >
                              {Icons.eye}
                            </button>
                            <button
                              className="action-btn action-btn--edit"
                              data-tooltip="Chỉnh sửa"
                              aria-label="Chỉnh sửa"
                              onClick={() => {
                                setApartmentDetailOpen(false);
                                openEditModal(dev);
                              }}
                            >
                              {Icons.edit}
                            </button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setApartmentDetailOpen(false)}>
                Đóng
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  setApartmentDetailOpen(false);
                  openCreateModal();
                  setTimeout(() => {
                    setFormData((prev) => ({
                      ...prev,
                      deviceType: 'APARTMENT',
                      apartmentId: selectedApartmentDetail.id,
                    }));
                  }, 0);
                }}
              >
                Thêm thiết bị cho căn hộ
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* Create / Edit Modal */}
      {modalOpen && (modalMode === 'create' || modalMode === 'edit') && createPortal((
        <div className="modal-overlay device-form-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal--lg device-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">
                {modalMode === 'create' ? 'Thêm thiết bị mới' : 'Chỉnh sửa thiết bị'}
              </h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                {Icons.close}
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal__body">
              <div className="form-grid">
                {/* Device Name */}
                <div className="form-field">
                  <label className="form-label">
                    Tên thiết bị <span className="form-required">*</span>
                  </label>
                  <input
                    className={`form-input ${formErrors.deviceName ? 'form-input--error' : ''}`}
                    value={formData.deviceName}
                    onChange={(e) => handleFormChange('deviceName', e.target.value)}
                    placeholder="VD: Camera sảnh chính, Thang máy A..."
                  />
                  {formErrors.deviceName && <span className="form-error">{formErrors.deviceName}</span>}
                </div>

                {/* Device Type Selection */}
                <div className="form-field form-field--full">
                  <label className="form-label">
                    Cấu hình sở hữu <span className="form-required">*</span>
                  </label>
                  <div className="segmented-control">
                    {DEVICE_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        className={`segmented-control__item ${formData.deviceType === t.value ? 'segmented-control__item--active' : ''}`}
                        onClick={() => {
                          handleFormChange('deviceType', t.value);
                          if (t.value === 'COMMON') handleFormChange('apartmentId', '');
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <p className="form-help" style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formData.deviceType === 'COMMON' 
                      ? 'Thiết bị thuộc quyền quản lý chung của tòa nhà, không gắn liền với căn hộ cụ thể.' 
                      : 'Thiết bị thuộc sở hữu hoặc lắp đặt riêng trong căn hộ của cư dân.'}
                  </p>
                </div>

                {/* Location (for COMMON) */}
                {formData.deviceType === 'COMMON' && (
                  <div className="form-field">
                    <label className="form-label">Vị trí lắp đặt</label>
                    <input
                      className="form-input"
                      value={formData.location}
                      onChange={(e) => handleFormChange('location', e.target.value)}
                      placeholder="VD: Tầng 1 - Sảnh chính, Tầng hầm B1..."
                    />
                  </div>
                )}

                {/* Status */}
                <div className="form-field">
                  <label className="form-label">
                    Trạng thái <span className="form-required">*</span>
                  </label>
                  <DropdownSelect
                    className={formErrors.deviceStatus ? 'form-input--error' : ''}
                    value={formData.deviceStatus}
                    onChange={(value) => handleFormChange('deviceStatus', value)}
                    options={[
                      { value: 'ACTIVE', label: 'Hoạt động' },
                      { value: 'INACTIVE', label: 'Không hoạt động' },
                      { value: 'UNDER_MAINTENANCE', label: 'Đang bảo trì' },
                      { value: 'BROKEN', label: 'Hỏng' },
                    ]}
                  />
                  {formErrors.deviceStatus && <span className="form-error">{formErrors.deviceStatus}</span>}
                </div>

                {/* Installation Date */}
                <div className="form-field">
                  <label className="form-label">Ngày lắp đặt</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.installationDate}
                    onChange={(e) => handleFormChange('installationDate', e.target.value)}
                  />
                </div>

                {/* Chu kỳ bảo trì */}
                <div className="form-field">
                  <label className="form-label">Chu kỳ bảo trì (ngày)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={formData.maintenanceCycleDay}
                    onChange={(e) => handleFormChange('maintenanceCycleDay', e.target.value)}
                    placeholder="VD: 30, 90, 180..."
                  />
                </div>

                {/* Apartment Selection Grid with Filters & Pagination */}
                {formData.deviceType === 'APARTMENT' && (
                  <div className="form-field form-field--full" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <label className="form-label" style={{ marginBottom: '4px' }}>Hệ thống căn hộ <span className="form-required">*</span></label>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chọn căn hộ mục tiêu để quản lý thiết bị</p>
                        </div>
                        <div className="search-box" style={{ width: '320px' }}>
                          <span className="search-box__icon">{Icons.search}</span>
                          <input
                            type="text"
                            className="search-input"
                            placeholder="Gõ số phòng (VD: A101)..."
                            value={aptSearchInput}
                            onChange={(e) => setAptSearchInput(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Advanced Filters Row with Labels */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '15px', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div className="form-field" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tòa nhà / Block</label>
                          <DropdownSelect
                            value={aptBlock}
                            onChange={(value) => { setAptBlock(value); setAptPage(0); }}
                            options={[
                              { value: '', label: 'Tất cả các tòa' },
                              { value: 'A', label: 'Block A' },
                              { value: 'B', label: 'Block B' },
                              { value: 'C', label: 'Block C' },
                              { value: 'D', label: 'Block D' },
                            ]}
                          />
                        </div>
                        <div className="form-field" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tầng số</label>
                          <input 
                            type="number" 
                            className="form-input form-input--sm" 
                            placeholder="Nhập tầng..." 
                            value={aptFloor} 
                            onChange={(e) => { setAptFloor(e.target.value); setAptPage(0); }} 
                          />
                        </div>
                        <div className="form-field" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trạng thái thiết bị</label>
                          <DropdownSelect
                            value={aptHasDevices === null ? '' : String(aptHasDevices)}
                            onChange={(value) => {
                              setAptHasDevices(value === '' ? null : value === 'true');
                              setAptPage(0);
                            }}
                            options={[
                              { value: '', label: 'Tất cả căn hộ' },
                              { value: 'true', label: 'Đã trang bị thiết bị' },
                              { value: 'false', label: 'Chưa có thiết bị nào' },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="apartment-grid" style={{ maxHeight: '280px', overflowY: 'auto', padding: '4px', position: 'relative' }}>
                      {aptLoading ? (
                        <div className="page__loading" style={{ gridColumn: '1/-1', padding: '2rem' }}>
                          <div className="spinner" />
                          <span>Đang tìm kiếm...</span>
                        </div>
                      ) : apartments.length === 0 ? (
                        <div className="page__empty" style={{ gridColumn: '1/-1' }}>
                          <p>Không tìm thấy căn hộ nào khớp với "{aptSearchKeyword}"</p>
                        </div>
                      ) : apartments.map((a) => {
                          const selected = String(formData.apartmentId) === String(a.id);
                          const ownerName = a.residents?.find(r => r.relationshipType === 'OWNER')?.fullName || a.residents?.[0]?.fullName || 'Chưa có cư dân';
                          
                          return (
                            <div
                              key={a.id}
                              className={`apartment-card ${selected ? 'apartment-card--active' : ''}`}
                              onClick={() => handleFormChange('apartmentId', a.id)}
                              style={{ minHeight: '100px', justifyContent: 'space-between' }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span className="apartment-card__number">{a.apartmentNumber}</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <span className={`badge ${a.deviceCount > 0 ? 'badge--info' : 'badge--ghost'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                    {a.deviceCount || 0} TB
                                  </span>
                                  {selected && <span style={{ color: 'var(--accent)' }}>{Icons.check}</span>}
                                </div>
                              </div>
                              <div className="apartment-card__info">
                                <span>Block {a.block} • Tầng {a.floor}</span>
                              </div>
                              <div className="apartment-card__resident" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                                <span style={{ opacity: 0.6 }}>👤</span>
                                <span title={ownerName} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {ownerName}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Apartment Pagination */}
                    {aptTotalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '15px', padding: '10px', borderTop: '1px dashed var(--border-color)' }}>
                        <button 
                          type="button" 
                          className="btn btn--sm btn--ghost" 
                          disabled={aptPage === 0} 
                          onClick={() => setAptPage(p => p - 1)}
                        >
                          {Icons.chevronLeft} Trước
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Trang {aptPage + 1} / {aptTotalPages}</span>
                        <button 
                          type="button" 
                          className="btn btn--sm btn--ghost" 
                          disabled={aptPage >= aptTotalPages - 1} 
                          onClick={() => setAptPage(p => p + 1)}
                        >
                          Sau {Icons.chevronRight}
                        </button>
                      </div>
                    )}

                    {formErrors.apartmentId && <span className="form-error" style={{ marginTop: '8px' }}>{formErrors.apartmentId}</span>}
                  </div>
                )}
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : modalMode === 'create' ? 'Tạo mới' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ), document.body)}

      {/* View Modal */}
      {modalOpen && modalMode === 'view' && selectedDevice && createPortal((
        <div className="modal-overlay device-detail-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal--sm device-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Chi tiết thiết bị</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                {Icons.close}
              </button>
            </div>
            <div className="modal__body">
              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">ID</span>
                  <span className="detail-value">{selectedDevice.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tên thiết bị</span>
                  <span className="detail-value detail-value--bold">{selectedDevice.deviceName}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Vị trí</span>
                  <span className="detail-value">{selectedDevice.location || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Sở hữu</span>
                  <span className="detail-value">
                    {selectedDevice.apartment ? (
                      <span className="badge badge--info">{getApartmentLabel(selectedDevice.apartment)}</span>
                    ) : 'Khu vực công cộng'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Ngày lắp đặt</span>
                  <span className="detail-value">{formatDate(selectedDevice.installationDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Trạng thái</span>
                  <span className="detail-value">
                    <span className="badge" style={getStatusBadgeStyle(selectedDevice.deviceStatus)}>
                      {statusLabel[selectedDevice.deviceStatus] || selectedDevice.deviceStatus}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Chu kỳ bảo trì</span>
                  <span className="detail-value">{selectedDevice.maintenanceCycleDay ? `${selectedDevice.maintenanceCycleDay} ngày` : '—'}</span>
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setModalOpen(false)}>
                Đóng
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  setModalOpen(false);
                  setTimeout(() => openEditModal(selectedDevice), 100);
                }}
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* Delete Modal */}
      {deleteModalOpen && deleteTarget && createPortal((
        <div className="modal-overlay device-delete-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal modal--sm device-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header modal__header--danger">
              <h3 className="modal__title">Xác nhận xóa</h3>
              <button className="modal__close" onClick={() => setDeleteModalOpen(false)}>
                {Icons.close}
              </button>
            </div>
            <div className="modal__body">
              <div className="delete-confirm">
                <div className="delete-confirm__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className="delete-confirm__text">
                  Bạn có chắc chắn muốn xóa thiết bị{' '}
                  <strong>{deleteTarget.deviceName}</strong>?
                </p>
                <p className="delete-confirm__sub">Hành động này không thể hoàn tác.</p>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setDeleteModalOpen(false)}>
                Hủy
              </button>
              <button className="btn btn--danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}
