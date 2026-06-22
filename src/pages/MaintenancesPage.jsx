import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import maintenanceService from '../services/maintenanceService';
import deviceService from '../services/deviceService';
import userService from '../services/userService';
import apartmentService from '../services/apartmentService';
import { useAuth } from '../contexts/AuthContext';
import DropdownSelect from '../components/common/DropdownSelect';

registerLocale('vi', vi);

/* ─── constants ─── */
const STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'SCHEDULED', label: 'Đã lên lịch' },
  { value: 'IN_PROGRESS', label: 'Đang thực hiện' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const statusLabel = {
  SCHEDULED: 'Đã lên lịch',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const statusColor = {
  SCHEDULED: { color: '#2563eb', bg: '#dbeafe' },
  IN_PROGRESS: { color: '#d97706', bg: '#fef3c7' },
  COMPLETED: { color: '#059669', bg: '#d1fae5' },
  CANCELLED: { color: '#dc2626', bg: '#fee2e2' },
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
  wrench: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
  ),
  dollar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.18-2.18a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
  ),
};

/* ─── helpers ─── */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    // Handle array format [year, month, day]
    if (Array.isArray(dateStr)) {
      const [y, m, d] = dateStr;
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
    // Handle DD/MM/YYYY
    if (typeof dateStr === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    // Handle ISO or YYYY-MM-DD
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  } catch { return '—'; }
};

const toInputDate = (dateStr) => {
  if (!dateStr) return '';
  // Array format
  if (Array.isArray(dateStr)) {
    const [y, m, d] = dateStr;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  // DD/MM/YYYY
  if (typeof dateStr === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m}-${d}`;
  }
  // ISO or YYYY-MM-DD
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    return dateStr.substring(0, 10);
  }
  return '';
};

const formatCurrency = (val) => {
  if (val == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

const getApartmentLabel = (apt) => {
  if (!apt) return '—';
  return `${apt.block ? `${apt.block}-` : ''}${apt.apartmentNumber || ''}${apt.floor != null ? ` (Tầng ${apt.floor})` : ''}`;
};

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const getApartmentId = (apartment) => apartment?.id ?? apartment?.apartmentId ?? '';
const getDeviceId = (device) => device?.id ?? device?.deviceId ?? '';
const getDeviceApartmentId = (device) => (
  device?.apartment?.id
  ?? device?.apartment?.apartmentId
  ?? device?.apartmentId
  ?? ''
);
const isMaintenanceCompleted = (maintenance) => maintenance?.maintenanceStatus === 'COMPLETED';

export default function MaintenancesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTechnician = user?.role === 'TECHNICIAN';
  /* ─── state ─── */
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

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

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create | edit | view
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [formData, setFormData] = useState({
    startedDate: '',
    completedDate: '',
    cost: '',
    description: '',
    maintenanceStatus: 'SCHEDULED',
    deviceId: '',
    technicianId: [],
    feedbackId: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [targetType, setTargetType] = useState('APARTMENT'); // SYSTEM | APARTMENT
  const lockedFromFeedback = modalMode === 'create' && !!formData.feedbackId && (!!formData.apartmentId || !!formData.deviceId);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen]);

  // Dropdown data
  const [devices, setDevices] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [deviceSearchKeyword, setDeviceSearchKeyword] = useState('');
  const [apartmentSearchKeyword, setApartmentSearchKeyword] = useState('');
  const [techSearchKeyword, setTechSearchKeyword] = useState('');

  /* ─── fetch ─── */
  const fetchMaintenances = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: PAGE_SIZE,
        sortBy: 'id',
        direction: sortDirection,
      };
      if (filterStatus) params.maintenanceStatus = filterStatus;
      if (searchKeyword.trim()) params.keyword = searchKeyword.trim();

      const res = await maintenanceService.getAll(params);
      const data = res.data?.data;
      setMaintenances(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      toast.error('Không thể tải danh sách bảo trì');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, sortDirection, searchKeyword]);

  const fetchDropdownData = useCallback(async () => {
    try {
      const [devRes, techRes, aptRes] = await Promise.all([
        deviceService.getAll({ page: 0, size: 1000 }),
        userService.getAll({ page: 0, size: 1000, userRole: 'TECHNICIAN' }),
        apartmentService.getAll({ page: 0, size: 1000 }),
      ]);
      setDevices(devRes.data?.data?.content || []);
      setTechnicians(techRes.data?.data?.content || []);
      setApartments(aptRes.data?.data?.content || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu dropdown:', err);
    }
  }, []);

  useEffect(() => { fetchMaintenances(); }, [fetchMaintenances]);
  useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);

  useEffect(() => {
    if (!formData.feedbackId || formData.apartmentId || !formData.deviceId || devices.length === 0) return;
    const linkedDevice = devices.find((device) => String(getDeviceId(device)) === String(formData.deviceId));
    const linkedApartmentId = getDeviceApartmentId(linkedDevice);
    if (linkedApartmentId) {
      setFormData(prev => ({ ...prev, apartmentId: linkedApartmentId }));
      setTargetType('APARTMENT');
    }
  }, [devices, formData.apartmentId, formData.deviceId, formData.feedbackId]);

  // Handle feedback link from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const feedbackId = params.get('feedbackId');
    const description = params.get('description');
    const apartmentId = params.get('apartmentId');
    const deviceId = params.get('deviceId');

    if (feedbackId) {
      setFormData(prev => ({
        ...prev,
        feedbackId: feedbackId,
        description: description || '',
        apartmentId: apartmentId || '',
        deviceId: deviceId || '',
      }));
      setTargetType(apartmentId ? 'APARTMENT' : 'SYSTEM');
      setModalMode('create');
      setModalOpen(true);
      // Clear URL params
      navigate('/maintenances', { replace: true });
    }
  }, [location.search, navigate]);

  /* ─── handlers ─── */
  const handleFilterChange = (val) => { setFilterStatus(val); setPage(0); };
  const handleToggleSort = () => { setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc')); setPage(0); };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedMaintenance(null);
    setFormData({
      startedDate: '',
      completedDate: '',
      cost: '',
      description: '',
      maintenanceStatus: 'SCHEDULED',
      deviceId: '',
      technicianId: [],
      feedbackId: '',
      apartmentId: '',
    });
    setFormErrors({});
    setTargetType('APARTMENT');
    setModalOpen(true);
  };

  const handleQuickStatusUpdate = async (mId, newStatus) => {
    try {
      setSubmitting(true);
      const m = maintenances.find(item => item.maintenanceId === mId);
      if (!m) return;

      const payload = {
        maintenanceStatus: newStatus,
        startedDate: toInputDate(m.startedDate),
        technicianId: m.technician?.map(t => t.technicianId) || []
      };

      if (newStatus === 'COMPLETED') {
        payload.completedDate = new Date().toISOString().substring(0, 10);
      } else if (m.completedDate) {
        payload.completedDate = toInputDate(m.completedDate);
      }

      if (m.device?.deviceId) payload.deviceId = Number(m.device.deviceId);
      if (m.cost) payload.cost = Number(m.cost);
      if (m.description) payload.description = m.description;

      await maintenanceService.update(mId, payload);
      toast.success(`Đã chuyển trạng thái sang: ${statusLabel[newStatus]}`);
      fetchMaintenances();
      setModalOpen(false);
    } catch (error) {
      console.error('Quick status update error:', error);
      toast.error('Không thể cập nhật trạng thái nhanh');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (m) => {
    if (isMaintenanceCompleted(m)) {
      toast.info('Lịch bảo trì đã hoàn thành nên không thể chỉnh sửa.');
      return;
    }
    setModalMode('edit');
    setSelectedMaintenance(m);
    setFormData({
      startedDate: toInputDate(m.startedDate),
      completedDate: toInputDate(m.completedDate),
      cost: m.cost != null ? String(m.cost) : '',
      description: m.description || '',
      maintenanceStatus: m.maintenanceStatus || 'SCHEDULED',
      deviceId: m.device?.deviceId || '',
      technicianId: m.technician ? m.technician.map(t => t.technicianId) : [],
      feedbackId: m.feedback?.feedbackId || '',
      apartmentId: m.apartment?.apartmentId || '',
    });
    setFormErrors({});
    setTargetType(m.apartment ? 'APARTMENT' : 'SYSTEM');
    setModalOpen(true);
  };

  const openViewModal = (m) => { setModalMode('view'); setSelectedMaintenance(m); setModalOpen(true); };

  const handleFormChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // Tự động cập nhật trạng thái dựa trên thời gian
      const startStr = field === 'startedDate' ? value : prev.startedDate;
      const endStr = field === 'completedDate' ? value : prev.completedDate;
      
      if (startStr && endStr) {
        const start = new Date(startStr);
        const end = new Date(endStr);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (now >= start && now <= end) {
          if (prev.maintenanceStatus === 'SCHEDULED' || !prev.maintenanceStatus) {
            newData.maintenanceStatus = 'IN_PROGRESS';
          }
        } else if (now < start) {
          if (prev.maintenanceStatus === 'IN_PROGRESS') {
            newData.maintenanceStatus = 'SCHEDULED';
          }
        }
      }
      
      return newData;
    });
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleTechnicianToggle = (techId) => {
    setFormData((prev) => {
      const ids = prev.technicianId.includes(techId)
        ? prev.technicianId.filter(id => id !== techId)
        : [...prev.technicianId, techId];
      return { ...prev, technicianId: ids };
    });
    if (formErrors.technicianId) setFormErrors((prev) => ({ ...prev, technicianId: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.startedDate) errors.startedDate = 'Vui lòng chọn ngày bắt đầu';
    
    // Nếu là admin hoặc tạo mới thì mới yêu cầu chọn đối tượng
    if (!isTechnician || modalMode === 'create') {
        if (!formData.deviceId && !formData.apartmentId) {
          errors.deviceId = 'Vui lòng chọn thiết bị hoặc căn hộ';
        }
        if (formData.technicianId.length === 0) {
          errors.technicianId = 'Vui lòng chọn ít nhất 1 kỹ thuật viên';
        }
    }
    
    if (formData.cost && isNaN(Number(formData.cost))) errors.cost = 'Chi phí phải là số';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (modalMode === 'edit' && isMaintenanceCompleted(selectedMaintenance)) {
      toast.info('Lịch bảo trì đã hoàn thành nên không thể chỉnh sửa.');
      setModalOpen(false);
      return;
    }
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        startedDate: formData.startedDate,
        maintenanceStatus: formData.maintenanceStatus,
        technicianId: formData.technicianId,
      };
      if (formData.deviceId) payload.deviceId = Number(formData.deviceId);
      if (formData.completedDate) payload.completedDate = formData.completedDate;
      if (formData.cost) payload.cost = Number(formData.cost);
      if (formData.description.trim()) payload.description = formData.description.trim();
      if (formData.feedbackId) payload.feedbackId = Number(formData.feedbackId);
      if (formData.apartmentId) payload.apartmentId = Number(formData.apartmentId);

      let res;
      if (modalMode === 'create') {
        res = await maintenanceService.create(payload);
      } else {
        res = await maintenanceService.update(selectedMaintenance.maintenanceId, payload);
      }

      if (res.data?.status) {
        toast.success(modalMode === 'create' ? 'Tạo bảo trì thành công!' : 'Cập nhật bảo trì thành công!');
        setModalOpen(false);
        fetchMaintenances();
      } else {
        toast.error(res.data?.message || 'Thao tác thất bại');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── render ─── */
  return (
    <div className="page">
      {/* Header */}
      <div className="page__header">
        <div>
          <h2 className="page__title">Quản lý bảo trì</h2>
          <p className="page__desc">Quản lý lịch bảo trì thiết bị ({totalElements} bản ghi)</p>
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <span className="btn__icon">{Icons.plus}</span>
          Tạo lịch bảo trì
        </button>
      </div>

      {/* Filters */}
      <div className="page__filters">
        <div className="filter-group">
          <label className="filter-label">Trạng thái:</label>
          <div className="filter-tabs">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                className={`filter-tab ${filterStatus === s.value ? 'filter-tab--active' : ''}`}
                onClick={() => handleFilterChange(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-actions">
          <div className="search-box">
            <span className="search-box__icon">{Icons.search}</span>
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button className="btn btn--ghost btn--sm" onClick={handleToggleSort} title="Đổi thứ tự">
            {sortDirection === 'asc' ? '↑ Cũ nhất' : '↓ Mới nhất'}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={fetchMaintenances} title="Làm mới">
            <span className="btn__icon">{Icons.refresh}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="page__table-wrapper">
        {loading ? (
          <div className="page__loading">
            <div className="spinner" />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : maintenances.length === 0 ? (
          <div className="page__empty">
            <p>Không tìm thấy bản ghi bảo trì nào</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="data-table__th--id">ID</th>
                <th>Thiết bị / Căn hộ</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày hoàn thành</th>
                <th>Chi phí</th>
                <th>Trạng thái</th>
                <th>Kỹ thuật viên</th>
                <th className="data-table__th--actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {maintenances.map((m) => {
                const sc = statusColor[m.maintenanceStatus] || { color: '#6b7280', bg: '#f3f4f6' };
                const completed = isMaintenanceCompleted(m);
                return (
                  <tr key={m.maintenanceId}>
                    <td className="data-table__cell--id">{m.maintenanceId}</td>
                    <td className="data-table__cell--bold">
                      {m.device?.deviceName || getApartmentLabel(m.apartment)}
                    </td>
                    <td>{formatDate(m.startedDate)}</td>
                    <td>{formatDate(m.completedDate)}</td>
                    <td>{formatCurrency(m.cost)}</td>
                    <td>
                      <span className="badge" style={{ color: sc.color, backgroundColor: sc.bg }}>
                        {statusLabel[m.maintenanceStatus] || m.maintenanceStatus}
                      </span>
                    </td>
                    <td>
                      {m.technician && m.technician.length > 0
                        ? m.technician.map(t => t.technicianName).join(', ')
                        : '—'}
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn action-btn--view" data-tooltip="Xem chi tiết" aria-label="Xem chi tiết" onClick={() => openViewModal(m)}>
                          {Icons.eye}
                        </button>
                        <button
                          className="action-btn action-btn--edit"
                          data-tooltip={completed ? 'Đã hoàn thành' : 'Chỉnh sửa'}
                          aria-label={completed ? 'Đã hoàn thành, không thể chỉnh sửa' : 'Chỉnh sửa'}
                          title={completed ? 'Bảo trì đã hoàn thành, không thể chỉnh sửa' : 'Chỉnh sửa'}
                          disabled={completed}
                          onClick={() => openEditModal(m)}
                        >
                          {Icons.edit}
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

      {/* Pagination */}
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

      {/* Create/Edit Modal */}
      {modalOpen && modalMode !== 'view' && createPortal((
        <div className="modal-overlay maintenance-form-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal--maintenance maintenance-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">
                {modalMode === 'create' ? 'Tạo lịch bảo trì mới' : 'Chỉnh sửa thông tin bảo trì'}
              </h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                {Icons.close}
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal__body">
              <div className="mt-edit-grid">
                {/* Left Section: Core Info */}
                <div className={`mt-edit-section ${isTechnician && modalMode === 'edit' ? 'mt-edit-full' : ''}`}>
                  <div className="mt-edit-header">
                    <div className="mt-edit-icon">{Icons.wrench}</div>
                    <div className="mt-edit-title">
                      <span>Nghiệp vụ</span>
                      <span>Thông tin sửa chữa</span>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">Ngày bắt đầu <span className="form-required">*</span></label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.startedDate}
                        onChange={(e) => handleFormChange('startedDate', e.target.value)}
                      />
                      {formErrors.startedDate && <span className="form-error">{formErrors.startedDate}</span>}
                    </div>
                    <div className="form-field">
                      <label className="form-label">Ngày hoàn thành</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.completedDate}
                        onChange={(e) => handleFormChange('completedDate', e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Trạng thái</label>
                      <DropdownSelect
                        value={formData.maintenanceStatus}
                        onChange={(value) => handleFormChange('maintenanceStatus', value)}
                        options={STATUSES.filter((status) => status.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Chi phí (VNĐ)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="VD: 500000"
                        value={formData.cost}
                        onChange={(e) => handleFormChange('cost', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-field" style={{ marginTop: '16px' }}>
                    <label className="form-label">Mô tả chi tiết công việc</label>
                    <textarea
                      className="form-input"
                      rows="4"
                      placeholder="Nhập nội dung công việc bảo trì..."
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                    ></textarea>
                  </div>

                  {/* Tech Selection */}
                  {!isTechnician && (
                    <div className="form-field" style={{ marginTop: '16px' }}>
                      <label className="form-label">Đội ngũ kỹ thuật viên</label>
                      <div className="search-box" style={{ marginBottom: '10px' }}>
                        <span className="search-box__icon">{Icons.search}</span>
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Tìm kiếm kỹ thuật viên..."
                          value={techSearchKeyword}
                          onChange={(e) => setTechSearchKeyword(e.target.value)}
                        />
                      </div>
                      <div className="tech-grid-compact" style={{ maxHeight: '180px', overflowY: 'auto', padding: '2px' }}>
                        {technicians
                          .filter(t => !techSearchKeyword.trim() || t.fullName?.toLowerCase().includes(techSearchKeyword.toLowerCase()))
                          .map(t => (
                            <div 
                              key={t.id} 
                              className={`tech-item-compact ${formData.technicianId.includes(t.id) ? 'tech-item-compact--active' : ''}`}
                              onClick={() => handleTechnicianToggle(t.id)}
                            >
                              <div className="tech-avatar-sm">{getInitials(t.fullName || t.username)}</div>
                              <span className="tech-name-sm">{t.fullName || t.username}</span>
                            </div>
                          ))}
                      </div>
                      {formErrors.technicianId && <span className="form-error">{formErrors.technicianId}</span>}
                    </div>
                  )}
                </div>

                {/* Right Section: Target Selection (Admin only during edit) */}
                {(!isTechnician || modalMode === 'create') && (
                  <div className="mt-edit-section">
                    <div className="mt-edit-header">
                      <div className="mt-edit-icon" style={{ background: '#fef3c7', color: '#d97706' }}>{Icons.target}</div>
                      <div className="mt-edit-title">
                        <span>Đối tượng</span>
                        <span>Địa điểm & Thiết bị</span>
                      </div>
                    </div>

                    <div className="mt-target-tabs">
                      <button 
                        type="button"
                        className={`mt-target-tab ${targetType === 'APARTMENT' ? 'mt-target-tab--active' : ''}`}
                        disabled={lockedFromFeedback}
                        onClick={() => {
                          if (lockedFromFeedback) return;
                          setTargetType('APARTMENT');
                          handleFormChange('deviceId', '');
                        }}
                      >
                        🏠 Căn hộ
                      </button>
                      <button 
                        type="button"
                        className={`mt-target-tab ${targetType === 'SYSTEM' ? 'mt-target-tab--active' : ''}`}
                        disabled={lockedFromFeedback}
                        onClick={() => {
                          if (lockedFromFeedback) return;
                          setTargetType('SYSTEM');
                          handleFormChange('apartmentId', '');
                          handleFormChange('deviceId', '');
                        }}
                      >
                        🏢 Hệ thống
                      </button>
                    </div>
                    {lockedFromFeedback && (
                      <div className="mt-feedback-lock-note">
                        Đối tượng được lấy từ phản hồi bảo trì nên không thể đổi căn hộ hoặc thiết bị.
                      </div>
                    )}

                    <div style={{ marginTop: '16px' }}>
                      {targetType === 'APARTMENT' ? (
                        <>
                          <div className="form-field">
                            <label className="form-label">Chọn Căn hộ</label>
                            <div className="search-box" style={{ marginBottom: '8px' }}>
                              <input
                                type="text"
                                className="search-input"
                                placeholder={lockedFromFeedback ? 'Căn hộ đã được gắn từ phản hồi' : 'Tìm căn hộ...'}
                                value={apartmentSearchKeyword}
                                onChange={(e) => setApartmentSearchKeyword(e.target.value)}
                                disabled={lockedFromFeedback}
                              />
                            </div>
                            <div className={`resident-select ${lockedFromFeedback ? 'resident-select--locked' : ''}`} style={{ maxHeight: '120px' }}>
                              <div className="resident-select__grid">
                                {apartments
                                  .filter(a => {
                                    const aptId = getApartmentId(a);
                                    if (lockedFromFeedback) return String(aptId) === String(formData.apartmentId);
                                    return !apartmentSearchKeyword.trim() || getApartmentLabel(a).toLowerCase().includes(apartmentSearchKeyword.toLowerCase());
                                  })
                                  .map(a => (
                                    <label key={getApartmentId(a)} className={`resident-select__item ${lockedFromFeedback ? 'resident-select__item--locked' : ''} ${String(formData.apartmentId) === String(getApartmentId(a)) ? 'resident-select__item--active' : ''}`}>
                                      <input 
                                        type="radio" 
                                        name="apt" 
                                        checked={String(formData.apartmentId) === String(getApartmentId(a))}
                                        disabled={lockedFromFeedback}
                                        onChange={() => {
                                          if (lockedFromFeedback) return;
                                          handleFormChange('apartmentId', getApartmentId(a));
                                          handleFormChange('deviceId', '');
                                        }}
                                      />
                                      <div className="resident-select__info">
                                        <span className="resident-select__name">{getApartmentLabel(a)}</span>
                                      </div>
                                    </label>
                                  ))}
                              </div>
                            </div>
                          </div>

                          <div className="form-field" style={{ marginTop: '10px' }}>
                            <label className="form-label">Chọn Thiết bị (Nếu có)</label>
                            <div className={`resident-select ${lockedFromFeedback ? 'resident-select--locked' : ''}`} style={{ maxHeight: '120px' }}>
                              {!formData.apartmentId ? (
                                <p className="resident-select__empty">Vui lòng chọn căn hộ trước</p>
                              ) : (
                                <div className="resident-select__grid">
                                  {devices
                                    .filter(d => {
                                      const deviceId = getDeviceId(d);
                                      const deviceApartmentId = getDeviceApartmentId(d);
                                      if (lockedFromFeedback && formData.deviceId) return String(deviceId) === String(formData.deviceId);
                                      return String(deviceApartmentId) === String(formData.apartmentId);
                                    })
                                    .map(d => (
                                      <label key={getDeviceId(d)} className={`resident-select__item ${lockedFromFeedback ? 'resident-select__item--locked' : ''} ${String(formData.deviceId) === String(getDeviceId(d)) ? 'resident-select__item--active' : ''}`}>
                                        <input
                                          type="radio"
                                          name="dev"
                                          checked={String(formData.deviceId) === String(getDeviceId(d))}
                                          disabled={lockedFromFeedback}
                                          onChange={() => {
                                            if (lockedFromFeedback) return;
                                            handleFormChange('deviceId', getDeviceId(d));
                                          }}
                                        />
                                        <div className="resident-select__info"><span className="resident-select__name">{d.deviceName}</span></div>
                                      </label>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="form-field">
                          <label className="form-label">Thiết bị hệ thống</label>
                          <div className="search-box" style={{ marginBottom: '8px' }}>
                            <input
                              type="text"
                              className="search-input"
                              placeholder={lockedFromFeedback ? 'Thiết bị đã được gắn từ phản hồi' : 'Tìm thiết bị chung...'}
                              value={deviceSearchKeyword}
                              onChange={(e) => setDeviceSearchKeyword(e.target.value)}
                              disabled={lockedFromFeedback}
                            />
                          </div>
                          <div className={`resident-select ${lockedFromFeedback ? 'resident-select--locked' : ''}`} style={{ maxHeight: '300px' }}>
                            <div className="resident-select__grid">
                              {devices
                                .filter(d => {
                                  const deviceId = getDeviceId(d);
                                  if (lockedFromFeedback && formData.deviceId) return String(deviceId) === String(formData.deviceId);
                                  return d.deviceType === 'COMMON' && (!deviceSearchKeyword.trim() || d.deviceName?.toLowerCase().includes(deviceSearchKeyword.toLowerCase()));
                                })
                                .map(d => (
                                  <label key={getDeviceId(d)} className={`resident-select__item ${lockedFromFeedback ? 'resident-select__item--locked' : ''} ${String(formData.deviceId) === String(getDeviceId(d)) ? 'resident-select__item--active' : ''}`}>
                                    <input
                                      type="radio"
                                      name="sys-dev"
                                      checked={String(formData.deviceId) === String(getDeviceId(d))}
                                      disabled={lockedFromFeedback}
                                      onChange={() => {
                                        if (lockedFromFeedback) return;
                                        handleFormChange('deviceId', getDeviceId(d));
                                      }}
                                    />
                                    <div className="resident-select__info"><span className="resident-select__name">{d.deviceName}</span></div>
                                  </label>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {(formErrors.deviceId || formErrors.apartmentId) && <span className="form-error">Vui lòng chọn đối tượng cụ thể</span>}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal__footer" style={{ borderTop: 'none', paddingTop: '0' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>Hủy bỏ</button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : (modalMode === 'create' ? 'Tạo lịch ngay' : 'Lưu thay đổi')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ), document.body)}


      {/* View Modal */}
      {modalOpen && modalMode === 'view' && selectedMaintenance && createPortal((
        <div className="modal-overlay maintenance-detail-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal--lg maintenance-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Chi tiết lịch bảo trì #{selectedMaintenance.maintenanceId}</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>{Icons.close}</button>
            </div>
            <div className="modal__body mt-view">
              {/* Header Info */}
              <div className="mt-view__header">
                <div className="mt-view__target">
                  <span className="mt-view__target-label">Đối tượng bảo trì</span>
                  <span className="mt-view__target-value">
                    {selectedMaintenance.device?.deviceName || getApartmentLabel(selectedMaintenance.apartment)}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    className="badge"
                    style={{
                      padding: '6px 16px',
                      borderRadius: '30px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: statusColor[selectedMaintenance.maintenanceStatus]?.color || '#6b7280',
                      backgroundColor: statusColor[selectedMaintenance.maintenanceStatus]?.bg || '#f3f4f6',
                    }}
                  >
                    {statusLabel[selectedMaintenance.maintenanceStatus] || selectedMaintenance.maintenanceStatus}
                  </span>
                </div>
              </div>

              {/* Grid Info */}
              <div className="mt-view__grid">
                <div className="mt-meta-card">
                  <div className="mt-meta-card__icon">{Icons.calendar}</div>
                  <div className="mt-meta-card__content">
                    <span className="mt-meta-card__label">Ngày bắt đầu</span>
                    <span className="mt-meta-card__value">{formatDate(selectedMaintenance.startedDate)}</span>
                  </div>
                </div>
                <div className="mt-meta-card">
                  <div className="mt-meta-card__icon">{Icons.calendar}</div>
                  <div className="mt-meta-card__content">
                    <span className="mt-meta-card__label">Ngày hoàn thành</span>
                    <span className="mt-meta-card__value">{formatDate(selectedMaintenance.completedDate)}</span>
                  </div>
                </div>
                <div className="mt-meta-card">
                  <div className="mt-meta-card__icon">{Icons.dollar}</div>
                  <div className="mt-meta-card__content">
                    <span className="mt-meta-card__label">Chi phí dự kiến</span>
                    <span className="mt-meta-card__value">{formatCurrency(selectedMaintenance.cost)}</span>
                  </div>
                </div>
                <div className="mt-meta-card">
                  <div className="mt-meta-card__icon">{Icons.users}</div>
                  <div className="mt-meta-card__content">
                    <span className="mt-meta-card__label">Kỹ thuật viên</span>
                    <span className="mt-meta-card__value" style={{ fontSize: '0.85rem' }}>
                      {selectedMaintenance.technician?.map(t => t.technicianName).join(', ') || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Feedback Section (if exists) */}
              {selectedMaintenance.feedback && (
                <div className="mt-view__feedback">
                  <div className="mt-view__feedback-header">{Icons.message} Thông tin từ phản ánh cư dân</div>
                  <div className="mt-view__feedback-bubble">
                    <div className="mt-view__feedback-title">{selectedMaintenance.feedback.title}</div>
                    <div className="mt-view__feedback-text">{selectedMaintenance.feedback.content}</div>
                    
                    <div className="mt-view__feedback-contact">
                      <div className="mt-view__contact-item">
                        <span style={{ color: '#3b82f6' }}>{Icons.user}</span>
                        <span>Người gửi:</span>
                        <span>{selectedMaintenance.feedback.senderName}</span>
                      </div>
                      <div className="mt-view__contact-item">
                        <span style={{ color: '#10b981' }}>{Icons.phone}</span>
                        <span>SĐT:</span>
                        <span>{selectedMaintenance.feedback.phoneNumber}</span>
                      </div>
                      <div className="mt-view__contact-item">
                        <span style={{ color: '#f59e0b' }}>{Icons.home}</span>
                        <span>Căn hộ:</span>
                        <span>{selectedMaintenance.feedback.apartmentName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setModalOpen(false)}>Đóng</button>
              
              {/* Quick Action Buttons for Technician/Admin */}
              {selectedMaintenance.maintenanceStatus === 'SCHEDULED' && (
                <button 
                  className="btn btn--primary" 
                  style={{ background: '#3b82f6' }}
                  onClick={() => handleQuickStatusUpdate(selectedMaintenance.maintenanceId, 'IN_PROGRESS')}
                  disabled={submitting}
                >
                  ⚡ Bắt đầu thực hiện
                </button>
              )}
              
              {selectedMaintenance.maintenanceStatus === 'IN_PROGRESS' && (
                <button 
                  className="btn btn--success" 
                  style={{ background: '#10b981', color: 'white' }}
                  onClick={() => handleQuickStatusUpdate(selectedMaintenance.maintenanceId, 'COMPLETED')}
                  disabled={submitting}
                >
                  ✅ Hoàn thành bảo trì
                </button>
              )}

              {selectedMaintenance.maintenanceStatus === 'COMPLETED' && (
                <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}>
                  {Icons.check} Công việc đã hoàn tất
                </div>
              )}

              {!isMaintenanceCompleted(selectedMaintenance) && (
                <button
                  className="btn btn--ghost"
                  style={{ border: '1px solid #e2e8f0' }}
                  onClick={() => {
                    setModalOpen(false);
                    setTimeout(() => openEditModal(selectedMaintenance), 100);
                  }}
                >
                  Chỉnh sửa chi tiết
                </button>
              )}
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}
