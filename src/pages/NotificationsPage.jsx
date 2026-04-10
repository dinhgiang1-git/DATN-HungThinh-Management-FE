import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import notificationService from '../services/notificationService';
import apartmentService from '../services/apartmentService';

/* ─── constants ─── */
const TARGET_TYPES = [
  { value: '', label: 'Tất cả' },
  { value: 'ALL', label: 'Toàn bộ' },
  { value: 'BLOCK', label: 'Theo Block' },
  { value: 'APARTMENT', label: 'Theo căn hộ' },
];

const targetLabel = {
  ALL: 'Toàn bộ',
  BLOCK: 'Theo Block',
  APARTMENT: 'Theo căn hộ',
};

const targetColor = {
  ALL: { color: '#7c3aed', bg: '#ede9fe' },
  BLOCK: { color: '#2563eb', bg: '#dbeafe' },
  APARTMENT: { color: '#059669', bg: '#d1fae5' },
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
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
};

export default function NotificationsPage() {
  /* ─── state ─── */
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterTargetType, setFilterTargetType] = useState('');
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
  const [modalMode, setModalMode] = useState('create');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetType: 'ALL',
    block: '',
    apartmentId: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Apartments list for selection
  const [apartments, setApartments] = useState([]);
  const [aptFilterBlock, setAptFilterBlock] = useState('');
  const [aptFilterFloor, setAptFilterFloor] = useState('');

  // Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ─── fetch ─── */
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: PAGE_SIZE,
        sortBy: 'id',
        direction: sortDirection,
      };
      if (filterTargetType) params.targetType = filterTargetType;
      if (searchKeyword.trim()) params.keyword = searchKeyword.trim();

      const res = await notificationService.getAll(params);
      const data = res.data?.data;
      setNotifications(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      toast.error('Không thể tải danh sách thông báo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterTargetType, sortDirection, searchKeyword]);

  const fetchApartments = useCallback(async () => {
    try {
      const res = await apartmentService.getAll({ page: 0, size: 1000 });
      setApartments(res.data?.data?.content || []);
    } catch (err) {
      console.error('Lỗi tải danh sách căn hộ:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);

  /* ─── handlers ─── */
  const handleFilterChange = (val) => { setFilterTargetType(val); setPage(0); };
  const handleToggleSort = () => { setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc')); setPage(0); };

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedNotification(null);
    setFormData({
      title: '',
      content: '',
      targetType: 'ALL',
      block: '',
      apartmentId: '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (notif) => {
    setModalMode('edit');
    setSelectedNotification(notif);
    setFormData({
      title: notif.title || '',
      content: notif.content || '',
      targetType: notif.targetType || 'ALL',
      block: notif.block || '',
      apartmentId: notif.apartmentId || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openViewModal = (notif) => { setModalMode('view'); setSelectedNotification(notif); setModalOpen(true); };
  const openDeleteModal = (notif) => { setDeleteTarget(notif); setDeleteModalOpen(true); };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Vui lòng nhập tiêu đề';
    if (!formData.content.trim()) errors.content = 'Vui lòng nhập nội dung';
    if (formData.content.trim().length < 4) errors.content = 'Nội dung phải có ít nhất 4 ký tự';
    if (!formData.targetType) errors.targetType = 'Vui lòng chọn đối tượng';
    if (formData.targetType === 'BLOCK' && !formData.block.trim()) errors.block = 'Vui lòng nhập tên Block';
    if (formData.targetType === 'APARTMENT' && !formData.apartmentId) errors.apartmentId = 'Vui lòng chọn căn hộ';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      let payload;
      if (modalMode === 'create') {
        payload = {
          title: formData.title,
          content: formData.content,
          targetType: formData.targetType,
          senderId: currentUser?.id || currentUser?.userId,
        };
        if (!payload.senderId) {
          toast.error('Thiếu thông tin người gửi. Vui lòng ĐĂNG XUẤT và ĐĂNG NHẬP LẠI để đồng bộ!');
          setSubmitting(false);
          return;
        }
        if (formData.targetType === 'BLOCK') payload.block = formData.block;
        if (formData.targetType === 'APARTMENT') payload.apartmentId = Number(formData.apartmentId);
      } else {
        payload = {
          title: formData.title,
          content: formData.content,
          targetType: formData.targetType,
        };
      }

      let res;
      if (modalMode === 'create') {
        res = await notificationService.create(payload);
      } else {
        res = await notificationService.update(selectedNotification.notificationId, payload);
      }

      if (res.data?.status) {
        toast.success(modalMode === 'create' ? 'Gửi thông báo thành công!' : 'Cập nhật thông báo thành công!');
        setModalOpen(false);
        fetchNotifications();
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
      const res = await notificationService.delete(deleteTarget.notificationId);
      if (res.data?.status !== false) {
        toast.success('Xóa thông báo thành công!');
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        if (notifications.length === 1 && page > 0) setPage((p) => p - 1);
        else fetchNotifications();
      } else {
        toast.error(res.data?.message || 'Xóa thất bại');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      const h = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      return `${d}/${m}/${y} ${h}:${min}`;
    } catch { return '—'; }
  };

  /* ─── render ─── */
  return (
    <div className="page">
      {/* Header */}
      <div className="page__header">
        <div>
          <h2 className="page__title">Quản lý thông báo</h2>
          <p className="page__desc">Quản lý và gửi thông báo cho cư dân ({totalElements} thông báo)</p>
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <span className="btn__icon">{Icons.plus}</span>
          Gửi thông báo
        </button>
      </div>

      {/* Filters */}
      <div className="page__filters">
        <div className="filter-group">
          <label className="filter-label">Đối tượng:</label>
          <div className="filter-tabs">
            {TARGET_TYPES.map((t) => (
              <button
                key={t.value}
                className={`filter-tab ${filterTargetType === t.value ? 'filter-tab--active' : ''}`}
                onClick={() => handleFilterChange(t.value)}
              >
                {t.label}
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
          <button className="btn btn--ghost btn--sm" onClick={fetchNotifications} title="Làm mới">
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
        ) : notifications.length === 0 ? (
          <div className="page__empty">
            <p>Không tìm thấy thông báo nào</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="data-table__th--id">ID</th>
                <th>Tiêu đề</th>
                <th>Đối tượng</th>
                <th>Người gửi</th>
                <th>Thời gian gửi</th>
                <th>Người nhận</th>
                <th className="data-table__th--actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notif) => {
                const tc = targetColor[notif.targetType] || { color: '#6b7280', bg: '#f3f4f6' };
                const readCount = notif.receivers ? notif.receivers.filter(r => r.isRead).length : 0;
                const totalReceivers = notif.receivers ? notif.receivers.length : 0;
                return (
                  <tr key={notif.notificationId}>
                    <td className="data-table__cell--id">{notif.notificationId}</td>
                    <td className="data-table__cell--bold">{notif.title}</td>
                    <td>
                      <span className="badge" style={{ color: tc.color, backgroundColor: tc.bg }}>
                        {targetLabel[notif.targetType] || notif.targetType}
                      </span>
                    </td>
                    <td>{notif.sender?.fullName || '—'}</td>
                    <td>{formatDateTime(notif.sendTime)}</td>
                    <td>
                      <span className="badge" style={{ color: '#2563eb', backgroundColor: '#dbeafe' }}>
                        {readCount}/{totalReceivers} đã đọc
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn action-btn--view" title="Xem" onClick={() => openViewModal(notif)}>
                          {Icons.eye}
                        </button>
                        <button className="action-btn action-btn--edit" title="Sửa" onClick={() => openEditModal(notif)}>
                          {Icons.edit}
                        </button>
                        <button className="action-btn action-btn--delete" title="Xóa" onClick={() => openDeleteModal(notif)}>
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
                {modalMode === 'create' ? 'Gửi thông báo mới' : 'Chỉnh sửa thông báo'}
              </h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                {Icons.close}
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal__body">
              <div className="form-grid">
                {/* Title */}
                <div className="form-field form-field--full">
                  <label className="form-label">
                    Tiêu đề <span className="form-required">*</span>
                  </label>
                  <input
                    className={`form-input ${formErrors.title ? 'form-input--error' : ''}`}
                    value={formData.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="VD: Thông báo bảo trì thang máy, Lịch cúp nước..."
                  />
                  {formErrors.title && <span className="form-error">{formErrors.title}</span>}
                </div>

                {/* Content */}
                <div className="form-field form-field--full">
                  <label className="form-label">
                    Nội dung <span className="form-required">*</span>
                  </label>
                  <textarea
                    className={`form-input form-textarea ${formErrors.content ? 'form-input--error' : ''}`}
                    value={formData.content}
                    onChange={(e) => handleFormChange('content', e.target.value)}
                    placeholder="Nhập nội dung thông báo..."
                    rows={4}
                  />
                  {formErrors.content && <span className="form-error">{formErrors.content}</span>}
                </div>

                {/* Target Type */}
                <div className="form-field">
                  <label className="form-label">
                    Đối tượng nhận <span className="form-required">*</span>
                  </label>
                  <select
                    className={`form-select ${formErrors.targetType ? 'form-input--error' : ''}`}
                    value={formData.targetType}
                    onChange={(e) => handleFormChange('targetType', e.target.value)}
                  >
                    <option value="ALL">Toàn bộ cư dân</option>
                    <option value="BLOCK">Theo Block</option>
                    <option value="APARTMENT">Theo căn hộ</option>
                  </select>
                  {formErrors.targetType && <span className="form-error">{formErrors.targetType}</span>}
                </div>

                {/* Block - conditional */}
                {formData.targetType === 'BLOCK' && (
                  <div className="form-field">
                    <label className="form-label">
                      Block <span className="form-required">*</span>
                    </label>
                    <input
                      className={`form-input ${formErrors.block ? 'form-input--error' : ''}`}
                      value={formData.block}
                      onChange={(e) => handleFormChange('block', e.target.value)}
                      placeholder="VD: A, B, C..."
                    />
                    {formErrors.block && <span className="form-error">{formErrors.block}</span>}
                  </div>
                )}

                {/* Apartment - conditional: scrollable radio list with block+floor filters */}
                {formData.targetType === 'APARTMENT' && (() => {
                  // Extract unique blocks & floors
                  const blocks = [...new Set(apartments.map(a => a.block).filter(Boolean))].sort();
                  const floors = [...new Set(apartments.map(a => a.floor).filter(v => v != null))].sort((a, b) => a - b);
                  // Filter apartments
                  const filteredApts = apartments.filter(a => {
                    if (aptFilterBlock && a.block !== aptFilterBlock) return false;
                    if (aptFilterFloor && a.floor !== Number(aptFilterFloor)) return false;
                    return true;
                  });
                  return (
                    <div className="form-field form-field--full">
                      <label className="form-label">
                        Chọn căn hộ <span className="form-required">*</span>
                      </label>
                      {/* Block + Floor filters */}
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <select
                          className="form-select"
                          value={aptFilterBlock}
                          onChange={(e) => setAptFilterBlock(e.target.value)}
                          style={{ flex: 1 }}
                        >
                          <option value="">Tất cả tòa nhà</option>
                          {blocks.map(b => <option key={b} value={b}>Tòa {b}</option>)}
                        </select>
                        <select
                          className="form-select"
                          value={aptFilterFloor}
                          onChange={(e) => setAptFilterFloor(e.target.value)}
                          style={{ flex: 1 }}
                        >
                          <option value="">Tất cả tầng</option>
                          {floors.map(f => <option key={f} value={f}>Tầng {f}</option>)}
                        </select>
                      </div>
                      {/* Scrollable list */}
                      <div className="resident-select">
                        {filteredApts.length === 0 ? (
                          <p className="resident-select__empty">Không tìm thấy căn hộ nào</p>
                        ) : (
                          <div className="resident-select__grid">
                            {filteredApts.map((apt) => {
                              const selected = String(formData.apartmentId) === String(apt.id);
                              return (
                                <label
                                  key={apt.id}
                                  className={`resident-select__item ${selected ? 'resident-select__item--active' : ''}`}
                                >
                                  <input
                                    type="radio"
                                    name="apartmentSelect"
                                    checked={selected}
                                    onChange={() => handleFormChange('apartmentId', apt.id)}
                                    className="resident-select__checkbox"
                                  />
                                  <div className="resident-select__info">
                                    <span className="resident-select__name">Căn {apt.apartmentNumber}</span>
                                    <span className="resident-select__sub">
                                      {apt.block ? `Tòa ${apt.block} · ` : ''}Tầng {apt.floor}{apt.area ? ` · ${apt.area}m²` : ''}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {formErrors.apartmentId && <span className="form-error">{formErrors.apartmentId}</span>}
                    </div>
                  );
                })()}
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : modalMode === 'create' ? 'Gửi thông báo' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modalOpen && modalMode === 'view' && selectedNotification && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Chi tiết thông báo</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                {Icons.close}
              </button>
            </div>
            <div className="modal__body">
              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">ID</span>
                  <span className="detail-value">{selectedNotification.notificationId}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tiêu đề</span>
                  <span className="detail-value detail-value--bold">{selectedNotification.title}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Đối tượng</span>
                  <span className="detail-value">
                    <span
                      className="badge"
                      style={{
                        color: targetColor[selectedNotification.targetType]?.color || '#6b7280',
                        backgroundColor: targetColor[selectedNotification.targetType]?.bg || '#f3f4f6',
                      }}
                    >
                      {targetLabel[selectedNotification.targetType] || selectedNotification.targetType}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Người gửi</span>
                  <span className="detail-value">{selectedNotification.sender?.fullName || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Thời gian gửi</span>
                  <span className="detail-value">{formatDateTime(selectedNotification.sendTime)}</span>
                </div>
                <div className="detail-item detail-item--full">
                  <span className="detail-label">Nội dung</span>
                  <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{selectedNotification.content}</span>
                </div>
              </div>

              {/* Receivers list */}
              {selectedNotification.receivers && selectedNotification.receivers.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary, #1e293b)' }}>
                    Danh sách người nhận ({selectedNotification.receivers.length})
                  </h4>
                  <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '0.5rem' }}>
                    <table className="data-table" style={{ marginBottom: 0 }}>
                      <thead>
                        <tr>
                          <th>Tên cư dân</th>
                          <th>Email</th>
                          <th>Trạng thái</th>
                          <th>Đọc lúc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedNotification.receivers.map((r) => (
                          <tr key={r.receiverNotificationId}>
                            <td className="data-table__cell--bold">{r.resident?.fullName || '—'}</td>
                            <td>{r.resident?.email || '—'}</td>
                            <td>
                              <span
                                className="badge"
                                style={{
                                  color: r.isRead ? '#059669' : '#d97706',
                                  backgroundColor: r.isRead ? '#d1fae5' : '#fef3c7',
                                }}
                              >
                                {r.isRead ? 'Đã đọc' : 'Chưa đọc'}
                              </span>
                            </td>
                            <td>{r.readAt ? formatDateTime(r.readAt) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setModalOpen(false)}>
                Đóng
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  setModalOpen(false);
                  setTimeout(() => openEditModal(selectedNotification), 100);
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
                  Bạn có chắc chắn muốn xóa thông báo{' '}
                  <strong>"{deleteTarget.title}"</strong>?
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
