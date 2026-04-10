import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import maintenanceService from '../services/maintenanceService';
import deviceService from '../services/deviceService';
import userService from '../services/userService';

/* ─── constants ─── */
const STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'SCHEDULED', label: 'Đã lên lịch' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const statusLabel = {
  SCHEDULED: 'Đã lên lịch',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const statusColor = {
  SCHEDULED: { color: '#2563eb', bg: '#dbeafe' },
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

export default function MaintenancesPage() {
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
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Dropdown data
  const [devices, setDevices] = useState([]);
  const [technicians, setTechnicians] = useState([]);

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
      const [devRes, techRes] = await Promise.all([
        deviceService.getAll({ page: 0, size: 1000 }),
        userService.getAll({ page: 0, size: 1000, userRole: 'TECHNICIAN' }),
      ]);
      setDevices(devRes.data?.data?.content || []);
      setTechnicians(techRes.data?.data?.content || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu dropdown:', err);
    }
  }, []);

  useEffect(() => { fetchMaintenances(); }, [fetchMaintenances]);
  useEffect(() => { fetchDropdownData(); }, [fetchDropdownData]);

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
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (m) => {
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
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openViewModal = (m) => { setModalMode('view'); setSelectedMaintenance(m); setModalOpen(true); };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    if (!formData.deviceId) errors.deviceId = 'Vui lòng chọn thiết bị';
    if (formData.technicianId.length === 0) errors.technicianId = 'Vui lòng chọn ít nhất 1 kỹ thuật viên';
    if (formData.cost && isNaN(Number(formData.cost))) errors.cost = 'Chi phí phải là số';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        startedDate: formData.startedDate,
        maintenanceStatus: formData.maintenanceStatus,
        deviceId: Number(formData.deviceId),
        technicianId: formData.technicianId,
      };
      if (formData.completedDate) payload.completedDate = formData.completedDate;
      if (formData.cost) payload.cost = Number(formData.cost);
      if (formData.description.trim()) payload.description = formData.description.trim();

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
                <th>Thiết bị</th>
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
                return (
                  <tr key={m.maintenanceId}>
                    <td className="data-table__cell--id">{m.maintenanceId}</td>
                    <td className="data-table__cell--bold">{m.device?.deviceName || '—'}</td>
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
                        <button className="action-btn action-btn--view" title="Xem" onClick={() => openViewModal(m)}>
                          {Icons.eye}
                        </button>
                        <button className="action-btn action-btn--edit" title="Sửa" onClick={() => openEditModal(m)}>
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

      {/* Create / Edit Modal */}
      {modalOpen && (modalMode === 'create' || modalMode === 'edit') && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">
                {modalMode === 'create' ? 'Tạo lịch bảo trì' : 'Chỉnh sửa bảo trì'}
              </h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                {Icons.close}
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal__body">
              <div className="form-grid">
                {/* Device */}
                <div className="form-field form-field--full">
                  <label className="form-label">
                    Thiết bị <span className="form-required">*</span>
                  </label>
                  <div className="resident-select">
                    {devices.length === 0 ? (
                      <p className="resident-select__empty">Không có thiết bị nào</p>
                    ) : (
                      <div className="resident-select__grid">
                        {devices.map((d) => {
                          const selected = String(formData.deviceId) === String(d.id);
                          return (
                            <label
                              key={d.id}
                              className={`resident-select__item ${selected ? 'resident-select__item--active' : ''}`}
                            >
                              <input
                                type="radio"
                                name="deviceSelect"
                                checked={selected}
                                onChange={() => handleFormChange('deviceId', d.id)}
                                className="resident-select__checkbox"
                              />
                              <div className="resident-select__info">
                                <span className="resident-select__name">{d.deviceName}</span>
                                <span className="resident-select__sub">
                                  {d.location || '—'}{d.deviceStatus ? ` · ${d.deviceStatus}` : ''}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {formErrors.deviceId && <span className="form-error">{formErrors.deviceId}</span>}
                </div>

                {/* Started date */}
                <div className="form-field">
                  <label className="form-label">
                    Ngày bắt đầu <span className="form-required">*</span>
                  </label>
                  <input
                    type="date"
                    className={`form-input ${formErrors.startedDate ? 'form-input--error' : ''}`}
                    value={formData.startedDate}
                    onChange={(e) => handleFormChange('startedDate', e.target.value)}
                  />
                  {formErrors.startedDate && <span className="form-error">{formErrors.startedDate}</span>}
                </div>

                {/* Completed date */}
                <div className="form-field">
                  <label className="form-label">Ngày hoàn thành</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.completedDate}
                    onChange={(e) => handleFormChange('completedDate', e.target.value)}
                  />
                </div>

                {/* Cost */}
                <div className="form-field">
                  <label className="form-label">Chi phí (VNĐ)</label>
                  <input
                    type="number"
                    className={`form-input ${formErrors.cost ? 'form-input--error' : ''}`}
                    value={formData.cost}
                    onChange={(e) => handleFormChange('cost', e.target.value)}
                    placeholder="VD: 500000"
                    min="0"
                  />
                  {formErrors.cost && <span className="form-error">{formErrors.cost}</span>}
                </div>

                {/* Status */}
                <div className="form-field">
                  <label className="form-label">Trạng thái</label>
                  <select
                    className="form-select"
                    value={formData.maintenanceStatus}
                    onChange={(e) => handleFormChange('maintenanceStatus', e.target.value)}
                  >
                    <option value="SCHEDULED">Đã lên lịch</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>

                {/* Description */}
                <div className="form-field form-field--full">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    className="form-input form-textarea"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Mô tả công việc bảo trì..."
                    rows={3}
                  />
                </div>

                {/* Technician selection */}
                <div className="form-field form-field--full">
                  <label className="form-label">
                    Kỹ thuật viên <span className="form-required">*</span>
                  </label>
                  <div className="resident-select">
                    {technicians.length === 0 ? (
                      <p className="resident-select__empty">Không có kỹ thuật viên nào</p>
                    ) : (
                      <div className="resident-select__grid">
                        {technicians.map((t) => {
                          const checked = formData.technicianId.includes(t.id);
                          return (
                            <label
                              key={t.id}
                              className={`resident-select__item ${checked ? 'resident-select__item--active' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleTechnicianToggle(t.id)}
                                className="resident-select__checkbox"
                              />
                              <div className="resident-select__info">
                                <span className="resident-select__name">{t.fullName || t.username}</span>
                                <span className="resident-select__sub">
                                  {t.phoneNumber || t.email || 'Kỹ thuật viên'}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {formErrors.technicianId && <span className="form-error">{formErrors.technicianId}</span>}
                </div>
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : modalMode === 'create' ? 'Tạo bảo trì' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modalOpen && modalMode === 'view' && selectedMaintenance && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Chi tiết bảo trì</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                {Icons.close}
              </button>
            </div>
            <div className="modal__body">
              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">ID</span>
                  <span className="detail-value">{selectedMaintenance.maintenanceId}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Thiết bị</span>
                  <span className="detail-value detail-value--bold">{selectedMaintenance.device?.deviceName || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Trạng thái</span>
                  <span className="detail-value">
                    <span
                      className="badge"
                      style={{
                        color: statusColor[selectedMaintenance.maintenanceStatus]?.color || '#6b7280',
                        backgroundColor: statusColor[selectedMaintenance.maintenanceStatus]?.bg || '#f3f4f6',
                      }}
                    >
                      {statusLabel[selectedMaintenance.maintenanceStatus] || selectedMaintenance.maintenanceStatus}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Ngày bắt đầu</span>
                  <span className="detail-value">{formatDate(selectedMaintenance.startedDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Ngày hoàn thành</span>
                  <span className="detail-value">{formatDate(selectedMaintenance.completedDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Chi phí</span>
                  <span className="detail-value">{formatCurrency(selectedMaintenance.cost)}</span>
                </div>
                <div className="detail-item detail-item--full">
                  <span className="detail-label">Mô tả</span>
                  <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedMaintenance.description || <em style={{ color: 'var(--text-light, #94a3b8)' }}>Không có mô tả</em>}
                  </span>
                </div>
                <div className="detail-item detail-item--full">
                  <span className="detail-label">Kỹ thuật viên</span>
                  <span className="detail-value">
                    {selectedMaintenance.technician && selectedMaintenance.technician.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {selectedMaintenance.technician.map((t) => (
                          <span
                            key={t.technicianId}
                            className="badge"
                            style={{ color: '#7c3aed', backgroundColor: '#ede9fe' }}
                          >
                            {t.technicianName}
                          </span>
                        ))}
                      </div>
                    ) : '—'}
                  </span>
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
                  setTimeout(() => openEditModal(selectedMaintenance), 100);
                }}
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
