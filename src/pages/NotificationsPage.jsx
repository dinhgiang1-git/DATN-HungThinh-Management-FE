import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import notificationService from '../services/notificationService';
import apartmentService from '../services/apartmentService';
import DropdownSelect from '../components/common/DropdownSelect';

/* ─── constants ─── */
const TARGET_TYPES = [
  { value: '', label: 'Tất cả' },
  { value: 'BLOCK', label: 'Theo Block' },
  { value: 'APARTMENT', label: 'Theo căn hộ' },
];

const targetLabel = {
  ALL: 'Toàn bộ',
  BLOCK: 'Theo Block',
  APARTMENT: 'Theo căn hộ',
};

const targetColor = {
  ALL: { color: '#5b21b6', bg: '#ddd6fe', border: '#c4b5fd' },
  BLOCK: { color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe' },
  APARTMENT: { color: '#047857', bg: '#d1fae5', border: '#a7f3d0' },
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

  // Paginated receivers for view modal
  const RECEIVER_PAGE_SIZE = 5;
  const [receivers, setReceivers] = useState([]);
  const [receiverPage, setReceiverPage] = useState(0);
  const [receiverTotalPages, setReceiverTotalPages] = useState(0);
  const [receiverTotalElements, setReceiverTotalElements] = useState(0);
  const [receiverLoading, setReceiverLoading] = useState(false);
  const [receiverSearch, setReceiverSearch] = useState('');
  const [receiverSearchKeyword, setReceiverSearchKeyword] = useState('');
  const [receiverReadFilter, setReceiverReadFilter] = useState(null); // null=all, true=read, false=unread

  useEffect(() => {
    if (!modalOpen && !deleteModalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen, deleteModalOpen]);

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

  const getTargetBadgeStyle = (targetType, extra = {}) => {
    const tone = targetColor[targetType] || { color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' };
    return {
      color: tone.color,
      backgroundColor: tone.bg,
      border: `1px solid ${tone.border}`,
      ...extra,
    };
  };

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

  const openViewModal = (notif) => {
    setModalMode('view');
    setSelectedNotification(notif);
    setReceiverPage(0);
    setReceivers([]);
    setReceiverSearch('');
    setReceiverSearchKeyword('');
    setReceiverReadFilter(null);
    setModalOpen(true);
    fetchReceivers(notif.notificationId, 0, '', null);
  };

  const fetchReceivers = async (notificationId, pg, keyword, isRead) => {
    setReceiverLoading(true);
    try {
      const params = { page: pg, size: RECEIVER_PAGE_SIZE };
      if (keyword) params.keyword = keyword;
      if (isRead !== null && isRead !== undefined) params.isRead = isRead;
      const res = await notificationService.getReceivers(notificationId, params);
      const data = res.data?.data;
      setReceivers(data?.content || []);
      setReceiverTotalPages(data?.totalPages || 0);
      setReceiverTotalElements(data?.totalElements || 0);
    } catch (err) {
      console.error('Lỗi tải danh sách người nhận:', err);
    } finally {
      setReceiverLoading(false);
    }
  };

  const handleReceiverPageChange = (newPage) => {
    if (!selectedNotification) return;
    setReceiverPage(newPage);
    fetchReceivers(selectedNotification.notificationId, newPage, receiverSearchKeyword, receiverReadFilter);
  };

  // Debounce receiver search
  useEffect(() => {
    if (!selectedNotification || modalMode !== 'view') return;
    const timer = setTimeout(() => {
      if (receiverSearchKeyword !== receiverSearch) {
        setReceiverSearchKeyword(receiverSearch);
        setReceiverPage(0);
        fetchReceivers(selectedNotification.notificationId, 0, receiverSearch, receiverReadFilter);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [receiverSearch]);

  const handleReceiverReadFilter = (value) => {
    if (!selectedNotification) return;
    setReceiverReadFilter(value);
    setReceiverPage(0);
    fetchReceivers(selectedNotification.notificationId, 0, receiverSearchKeyword, value);
  };
  const openDeleteModal = (notif) => { setDeleteTarget(notif); setDeleteModalOpen(true); };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Vui lòng nhập tiêu đề';
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
      let date;
      if (Array.isArray(dateStr)) {
        date = new Date(dateStr[0], (dateStr[1] || 1) - 1, dateStr[2] || 1, dateStr[3] || 0, dateStr[4] || 0, dateStr[5] || 0);
      } else {
        date = new Date(dateStr);
      }
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
    <div className="page notifications-page">
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
      <div className="page__table-wrapper notification-table">
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
          <table className="data-table notification-table__table">
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
              {notifications.map((notif) => (
                  <tr key={notif.notificationId}>
                    <td data-label="ID" className="data-table__cell--id">{notif.notificationId}</td>
                    <td data-label="Tiêu đề" className="data-table__cell--bold">
                      <div
                        className="notification-table__title"
                        title={notif.title}
                      >
                        {notif.title}
                      </div>
                    </td>
                    <td data-label="Đối tượng">
                      <span className="badge" style={getTargetBadgeStyle(notif.targetType)}>
                        {targetLabel[notif.targetType] || notif.targetType}
                      </span>
                    </td>
                    <td data-label="Người gửi">{notif.sender?.fullName || '—'}</td>
                    <td data-label="Thời gian gửi">{formatDateTime(notif.sendTime)}</td>
                    <td data-label="Người nhận">
                      <span className="badge" style={{ color: '#2563eb', backgroundColor: '#dbeafe' }}>
                        {notif.readCount ?? 0}/{notif.totalReceivers ?? 0} đã đọc
                      </span>
                    </td>
                    <td data-label="Thao tác">
                      <div className="action-btns">
                        <button className="action-btn action-btn--view" data-tooltip="Xem chi tiết" aria-label="Xem chi tiết" onClick={() => openViewModal(notif)}>
                          {Icons.eye}
                        </button>
                        <button className="action-btn action-btn--edit" data-tooltip="Chỉnh sửa" aria-label="Chỉnh sửa" onClick={() => openEditModal(notif)}>
                          {Icons.edit}
                        </button>
                        <button className="action-btn action-btn--delete" data-tooltip="Xóa" aria-label="Xóa" onClick={() => openDeleteModal(notif)}>
                          {Icons.trash}
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
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
      {modalOpen && (modalMode === 'create' || modalMode === 'edit') && createPortal((
        <div className="modal-overlay notification-form-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal notification-form-modal" onClick={(e) => e.stopPropagation()}>
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
                    Nội dung
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
                  <DropdownSelect
                    className={formErrors.targetType ? 'form-input--error' : ''}
                    value={formData.targetType}
                    onChange={(value) => handleFormChange('targetType', value)}
                    options={[
                      { value: 'ALL', label: 'Toàn bộ cư dân' },
                      { value: 'BLOCK', label: 'Theo Block' },
                      { value: 'APARTMENT', label: 'Theo căn hộ' },
                    ]}
                  />
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
                        <DropdownSelect
                          value={aptFilterBlock}
                          onChange={(value) => setAptFilterBlock(value)}
                          style={{ flex: 1 }}
                          options={[
                            { value: '', label: 'Tất cả tòa nhà' },
                            ...blocks.map((block) => ({ value: block, label: `Tòa ${block}` })),
                          ]}
                        />
                        <DropdownSelect
                          value={aptFilterFloor}
                          onChange={(value) => setAptFilterFloor(value)}
                          style={{ flex: 1 }}
                          options={[
                            { value: '', label: 'Tất cả tầng' },
                            ...floors.map((floor) => ({ value: floor, label: `Tầng ${floor}` })),
                          ]}
                        />
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
      ), document.body)}

      {/* View Modal */}
      {modalOpen && modalMode === 'view' && selectedNotification && createPortal((
        <div className="modal-overlay notification-detail-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal--lg notification-detail-modal" onClick={(e) => e.stopPropagation()}>
            {/* Gradient header band */}
            <div className="notif-detail-header">
              <div className="notif-detail-header__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className="notif-detail-header__info">
                <h3 className="notif-detail-header__title">{selectedNotification.title}</h3>
                <div className="notif-detail-header__meta">
                  <span className="notif-detail-header__tag">#{selectedNotification.notificationId}</span>
                  <span className="notif-detail-header__dot">·</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12, flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{formatDateTime(selectedNotification.sendTime)}</span>
                </div>
              </div>
              <button className="notif-detail-header__close" onClick={() => setModalOpen(false)}>
                {Icons.close}
              </button>
            </div>

            <div className="modal__body" style={{ padding: '0' }}>
              {/* Info cards row */}
              <div className="notif-detail-info">
                <div className="notif-detail-info__card">
                  <div className="notif-detail-info__icon" style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" style={{ width: 16, height: 16 }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="notif-detail-info__text">
                    <span className="notif-detail-info__label">Đối tượng</span>
                    <span className="notif-detail-info__value">
                      <span
                        className="badge"
                        style={getTargetBadgeStyle(selectedNotification.targetType, { fontSize: '11px' })}
                      >
                        {targetLabel[selectedNotification.targetType] || selectedNotification.targetType}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="notif-detail-info__card">
                  <div className="notif-detail-info__icon" style={{ background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" style={{ width: 16, height: 16 }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="notif-detail-info__text">
                    <span className="notif-detail-info__label">Người gửi</span>
                    <span className="notif-detail-info__value notif-detail-info__value--bold">{selectedNotification.sender?.fullName || '—'}</span>
                  </div>
                </div>

                <div className="notif-detail-info__card">
                  <div className="notif-detail-info__icon" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" style={{ width: 16, height: 16 }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="notif-detail-info__text">
                    <span className="notif-detail-info__label">Tổng người nhận</span>
                    <span className="notif-detail-info__value notif-detail-info__value--bold">{selectedNotification.totalReceivers ?? 0} người</span>
                  </div>
                </div>

                <div className="notif-detail-info__card">
                  <div className="notif-detail-info__icon" style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" style={{ width: 16, height: 16 }}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div className="notif-detail-info__text">
                    <span className="notif-detail-info__label">Đã đọc</span>
                    <span className="notif-detail-info__value notif-detail-info__value--success">
                      {selectedNotification.readCount ?? 0}/{selectedNotification.totalReceivers ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content section */}
              {selectedNotification.content && (
                <div className="notif-detail-content">
                  <div className="notif-detail-content__header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span>Nội dung thông báo</span>
                  </div>
                  <div className="notif-detail-content__body">
                    {selectedNotification.content}
                  </div>
                </div>
              )}

              {/* Receivers Section */}
              <div className="notif-detail-receivers">
                <div className="notif-detail-receivers__header">
                  <div className="notif-detail-receivers__header-left">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, color: '#475569' }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <h4>Danh sách người nhận ({receiverTotalElements})</h4>
                  </div>
                </div>

                {/* Search + Filter toolbar */}
                <div className="rcv-toolbar">
                  <div className="rcv-toolbar__search">
                    <svg className="rcv-toolbar__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      className="rcv-toolbar__search-input"
                      placeholder="Tìm theo tên hoặc email..."
                      value={receiverSearch}
                      onChange={(e) => setReceiverSearch(e.target.value)}
                    />
                  </div>
                  <div className="rcv-toolbar__filters">
                    <button
                      className={`rcv-filter-btn ${receiverReadFilter === null ? 'rcv-filter-btn--active' : ''}`}
                      onClick={() => handleReceiverReadFilter(null)}
                    >Tất cả</button>
                    <button
                      className={`rcv-filter-btn ${receiverReadFilter === true ? 'rcv-filter-btn--active' : ''}`}
                      onClick={() => handleReceiverReadFilter(true)}
                    >Đã đọc</button>
                    <button
                      className={`rcv-filter-btn ${receiverReadFilter === false ? 'rcv-filter-btn--active' : ''}`}
                      onClick={() => handleReceiverReadFilter(false)}
                    >Chưa đọc</button>
                  </div>
                </div>

                <div className="rcv-table-wrap">
                  {receiverLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                      <div className="spinner" style={{ margin: '0 auto 0.5rem' }} />
                      Đang tải...
                    </div>
                  ) : receivers.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                      {receiverSearch || receiverReadFilter !== null ? 'Không tìm thấy kết quả phù hợp' : 'Không có người nhận'}
                    </div>
                  ) : (
                    <table className="rcv-table">
                      <thead>
                        <tr>
                          <th>Tên cư dân</th>
                          <th>Email</th>
                          <th>Trạng thái</th>
                          <th>Đọc lúc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receivers.map((r) => (
                          <tr key={r.receiverNotificationId}>
                            <td data-label="Tên cư dân" className="rcv-table__name">{r.resident?.fullName || '—'}</td>
                            <td data-label="Email" className="rcv-table__email">{r.resident?.email || '—'}</td>
                            <td data-label="Trạng thái">
                              <span
                                className="badge"
                                style={{
                                  color: r.isRead ? '#059669' : '#d97706',
                                  backgroundColor: r.isRead ? '#d1fae5' : '#fef3c7',
                                  fontSize: '10.5px',
                                }}
                              >
                                {r.isRead ? 'Đã đọc' : 'Chưa đọc'}
                              </span>
                            </td>
                            <td data-label="Đọc lúc" className="rcv-table__read-at">{r.readAt ? formatDateTime(r.readAt) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                {/* Receiver pagination */}
                {receiverTotalPages > 1 && (
                  <div className="rcv-pagination">
                    <span>Trang {receiverPage + 1} / {receiverTotalPages}</span>
                    <div className="rcv-pagination__btns">
                      <button
                        className="btn btn--ghost btn--sm"
                        disabled={receiverPage === 0}
                        onClick={() => handleReceiverPageChange(receiverPage - 1)}
                      >
                        ← Trước
                      </button>
                      <button
                        className="btn btn--ghost btn--sm"
                        disabled={receiverPage >= receiverTotalPages - 1}
                        onClick={() => handleReceiverPageChange(receiverPage + 1)}
                      >
                        Sau →
                      </button>
                    </div>
                  </div>
                )}
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
                  setTimeout(() => openEditModal(selectedNotification), 100);
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
        <div className="modal-overlay notification-delete-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal modal--sm notification-delete-modal" onClick={(e) => e.stopPropagation()}>
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
      ), document.body)}
    </div>
  );
}
