import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import deviceService from '../services/deviceService';

/* ─── constants ─── */
const DEVICE_STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Không hoạt động' },
  { value: 'UNDER_MAINTENANCE', label: 'Đang bảo trì' },
  { value: 'BROKEN', label: 'Hỏng' },
];

const statusLabel = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Không hoạt động',
  UNDER_MAINTENANCE: 'Đang bảo trì',
  BROKEN: 'Hỏng',
};

const statusColor = {
  ACTIVE: { color: '#059669', bg: '#d1fae5' },
  INACTIVE: { color: '#6b7280', bg: '#f3f4f6' },
  UNDER_MAINTENANCE: { color: '#d97706', bg: '#fef3c7' },
  BROKEN: { color: '#dc2626', bg: '#fee2e2' },
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
};

export default function DevicesPage() {
  /* ─── state ─── */
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
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
  const [modalMode, setModalMode] = useState('create');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [formData, setFormData] = useState({
    deviceName: '',
    location: '',
    deviceStatus: 'ACTIVE',
    maintenanceCycleDay: '',
    installationDate: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ─── fetch ─── */
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: PAGE_SIZE,
        sortBy: 'id',
        direction: sortDirection,
      };
      if (filterStatus) params.deviceStatus = filterStatus;
      if (searchKeyword.trim()) params.keyword = searchKeyword.trim();

      const res = await deviceService.getAll(params);
      const data = res.data?.data;
      setDevices(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      toast.error('Không thể tải danh sách thiết bị');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, sortDirection, searchKeyword]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  /* ─── handlers ─── */
  const handleFilterStatus = (val) => { setFilterStatus(val); setPage(0); };
  const handleToggleSort = () => { setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc')); setPage(0); };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedDevice(null);
    setFormData({
      deviceName: '',
      location: '',
      deviceStatus: 'ACTIVE',
      maintenanceCycleDay: '',
      installationDate: '',
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
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openViewModal = (dev) => { setModalMode('view'); setSelectedDevice(dev); setModalOpen(true); };
  const openDeleteModal = (dev) => { setDeleteTarget(dev); setDeleteModalOpen(true); };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.deviceName.trim()) errors.deviceName = 'Vui lòng nhập tên thiết bị';
    if (!formData.deviceStatus) errors.deviceStatus = 'Vui lòng chọn trạng thái';
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

  /* ─── render ─── */
  return (
    <div className="page">
      {/* Header */}
      <div className="page__header">
        <div>
          <h2 className="page__title">Quản lý thiết bị</h2>
          <p className="page__desc">Quản lý các thiết bị trong chung cư ({totalElements} thiết bị)</p>
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <span className="btn__icon">{Icons.plus}</span>
          Thêm thiết bị
        </button>
      </div>

      {/* Filters */}
      <div className="page__filters">
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
            {sortDirection === 'asc' ? '↑ Tăng dần' : '↓ Giảm dần'}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={fetchDevices} title="Làm mới">
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
                <th>Vị trí</th>
                <th>Chu kỳ bảo trì</th>
                <th>Ngày lắp đặt</th>
                <th>Trạng thái</th>
                <th className="data-table__th--actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((dev) => {
                const sc = statusColor[dev.deviceStatus] || { color: '#6b7280', bg: '#f3f4f6' };
                return (
                  <tr key={dev.id}>
                    <td className="data-table__cell--id">{dev.id}</td>
                    <td className="data-table__cell--bold">{dev.deviceName}</td>
                    <td>{dev.location || '—'}</td>
                    <td>{dev.maintenanceCycleDay ? `${dev.maintenanceCycleDay} ngày` : '—'}</td>
                    <td>{formatDate(dev.installationDate)}</td>
                    <td>
                      <span className="badge" style={{ color: sc.color, backgroundColor: sc.bg }}>
                        {statusLabel[dev.deviceStatus] || dev.deviceStatus}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn action-btn--view" title="Xem" onClick={() => openViewModal(dev)}>
                          {Icons.eye}
                        </button>
                        <button className="action-btn action-btn--edit" title="Sửa" onClick={() => openEditModal(dev)}>
                          {Icons.edit}
                        </button>
                        <button className="action-btn action-btn--delete" title="Xóa" onClick={() => openDeleteModal(dev)}>
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



                {/* Location */}
                <div className="form-field">
                  <label className="form-label">Vị trí lắp đặt</label>
                  <input
                    className="form-input"
                    value={formData.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="VD: Tầng 1 - Sảnh chính, Tầng hầm B1..."
                  />
                </div>

                {/* Status */}
                <div className="form-field">
                  <label className="form-label">
                    Trạng thái <span className="form-required">*</span>
                  </label>
                  <select
                    className={`form-select ${formErrors.deviceStatus ? 'form-input--error' : ''}`}
                    value={formData.deviceStatus}
                    onChange={(e) => handleFormChange('deviceStatus', e.target.value)}
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Không hoạt động</option>
                    <option value="UNDER_MAINTENANCE">Đang bảo trì</option>
                    <option value="BROKEN">Hỏng</option>
                  </select>
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
      )}

      {/* View Modal */}
      {modalOpen && modalMode === 'view' && selectedDevice && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
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
                  <span className="detail-label">Ngày lắp đặt</span>
                  <span className="detail-value">{formatDate(selectedDevice.installationDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Trạng thái</span>
                  <span className="detail-value">
                    <span
                      className="badge"
                      style={{
                        color: statusColor[selectedDevice.deviceStatus]?.color || '#6b7280',
                        backgroundColor: statusColor[selectedDevice.deviceStatus]?.bg || '#f3f4f6',
                      }}
                    >
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
      )}

      {/* Delete Modal */}
      {deleteModalOpen && deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
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
      )}
    </div>
  );
}
