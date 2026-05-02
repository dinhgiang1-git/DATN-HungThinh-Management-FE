import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import feedbackService from '../services/feedbackService';

/* ─── constants ─── */
const STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'CLOSED', label: 'Đã đóng' },
];

const statusLabel = {
  PENDING: 'Chờ xử lý',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
};

const statusColor = {
  PENDING: { color: '#d97706', bg: '#fef3c7' },
  IN_PROGRESS: { color: '#2563eb', bg: '#dbeafe' },
  RESOLVED: { color: '#059669', bg: '#d1fae5' },
  CLOSED: { color: '#6b7280', bg: '#f3f4f6' },
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
  reply: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  ),
  wrench: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
};

/* ─── Custom Status Dropdown ─── */
const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'CLOSED', label: 'Đã đóng' },
];

function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = STATUS_OPTIONS.find((o) => o.value === value) || STATUS_OPTIONS[0];
  const sc = statusColor[current.value] || { color: '#6b7280', bg: '#f3f4f6' };

  return (
    <div className="custom-select" ref={ref}>
      <button
        type="button"
        className={`custom-select__trigger ${open ? 'custom-select__trigger--open' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span className="custom-select__value">
          <span className="custom-select__dot" style={{ background: sc.color }} />
          {current.label}
        </span>
        <svg className={`custom-select__arrow ${open ? 'custom-select__arrow--open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="custom-select__menu">
          {STATUS_OPTIONS.map((opt) => {
            const optSc = statusColor[opt.value] || { color: '#6b7280', bg: '#f3f4f6' };
            const isActive = opt.value === value;
            return (
              <div
                key={opt.value}
                className={`custom-select__option ${isActive ? 'custom-select__option--active' : ''}`}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                <span className="custom-select__dot" style={{ background: optSc.color }} />
                <span className="custom-select__option-label">{opt.label}</span>
                {isActive && (
                  <svg className="custom-select__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
const formatDate = (dateStr) => {
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

const getApartmentLabel = (apt) => {
  if (!apt) return '—';
  return `${apt.block ? `${apt.block}-` : ''}${apt.apartmentNumber || ''}${apt.floor != null ? ` (Tầng ${apt.floor})` : ''}`;
};

export default function FeedbacksPage() {
  const navigate = useNavigate();
  /* ─── state ─── */
  const [feedbacks, setFeedbacks] = useState([]);
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
  const [modalMode, setModalMode] = useState('view'); // edit | view | respond
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    feedbackStatus: 'PENDING',
    apartmentId: '',
    response: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);


  // Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ─── fetch ─── */
  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: PAGE_SIZE,
        sortBy: 'id',
        direction: sortDirection,
      };
      if (filterStatus) params.feedbackStatus = filterStatus;
      if (searchKeyword.trim()) params.keyword = searchKeyword.trim();

      const res = await feedbackService.getAll(params);
      const data = res.data?.data;
      setFeedbacks(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      toast.error('Không thể tải danh sách phản hồi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, sortDirection, searchKeyword]);

  useEffect(() => { fetchFeedbacks(); }, [fetchFeedbacks]);

  /* ─── handlers ─── */
  const handleFilterChange = (val) => { setFilterStatus(val); setPage(0); };
  const handleToggleSort = () => { setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc')); setPage(0); };


  const openEditModal = (fb) => {
    setModalMode('edit');
    setSelectedFeedback(fb);
    setFormData({
      title: fb.title || '',
      content: fb.content || '',
      feedbackStatus: fb.feedbackStatus || 'PENDING',
      apartmentId: fb.apartment?.id || fb.apartmentId || '',
      response: fb.response || '',
    });
    setFormErrors({});
    setAptFilterBlock('');
    setAptFilterFloor('');
    setModalOpen(true);
  };

  const openRespondModal = (fb) => {
    setModalMode('respond');
    setSelectedFeedback(fb);
    setFormData({
      title: fb.title || '',
      content: fb.content || '',
      feedbackStatus: fb.feedbackStatus || 'PENDING',
      apartmentId: fb.apartment?.id || fb.apartmentId || '',
      response: fb.response || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openViewModal = (fb) => { setModalMode('view'); setSelectedFeedback(fb); setModalOpen(true); };
  const openDeleteModal = (fb) => { setDeleteTarget(fb); setDeleteModalOpen(true); };

  const handleFormChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      // Tự động chuyển sang Đang xử lý nếu đang ở Chờ xử lý và có nội dung phản hồi
      if (modalMode === 'respond' && field === 'response' && value.trim() && prev.feedbackStatus === 'PENDING') {
        newData.feedbackStatus = 'IN_PROGRESS';
      }
      return newData;
    });
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (modalMode === 'edit') {
      if (!formData.title.trim()) errors.title = 'Vui lòng nhập tiêu đề';
      if (!formData.content.trim()) errors.content = 'Vui lòng nhập nội dung';
    }
    if (modalMode === 'respond') {
      if (!formData.response.trim()) errors.response = 'Vui lòng nhập phản hồi';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      let payload;
      if (modalMode === 'respond') {
        payload = {
          response: formData.response,
          feedbackStatus: formData.feedbackStatus,
        };
      } else {
        payload = {
          title: formData.title,
          content: formData.content,
          feedbackStatus: formData.feedbackStatus,
          response: formData.response || undefined,
        };
      }

      const res = await feedbackService.update(selectedFeedback.feedbackId, payload);

      if (res.data?.status) {
        toast.success(
          modalMode === 'respond' ? 'Phản hồi thành công!' : 'Cập nhật phản hồi thành công!'
        );
        setModalOpen(false);
        fetchFeedbacks();
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
      const res = await feedbackService.delete(deleteTarget.feedbackId);
      if (res.data?.status !== false) {
        toast.success('Xóa phản hồi thành công!');
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        if (feedbacks.length === 1 && page > 0) setPage((p) => p - 1);
        else fetchFeedbacks();
      } else {
        toast.error(res.data?.message || 'Xóa thất bại');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  };
  
  const handleCreateMaintenance = (fb) => {
    const desc = `${fb.title}: ${fb.content}`;
    const aptId = fb.apartment?.id || fb.apartmentId || '';
    const devId = fb.deviceId || (fb.device ? fb.device.deviceId : '');
    navigate(`/maintenances?feedbackId=${fb.feedbackId}&description=${encodeURIComponent(desc)}&apartmentId=${aptId}&deviceId=${devId}`);
  };


  /* ─── render ─── */
  return (
    <div className="page">
      {/* Header */}
      <div className="page__header">
        <div>
          <h2 className="page__title">Quản lý phản hồi</h2>
          <p className="page__desc">Quản lý và xử lý phản hồi từ cư dân ({totalElements} phản hồi)</p>
        </div>
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
          <button className="btn btn--ghost btn--sm" onClick={fetchFeedbacks} title="Làm mới">
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
        ) : feedbacks.length === 0 ? (
          <div className="page__empty">
            <p>Không tìm thấy phản hồi nào</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="data-table__th--id">ID</th>
                <th>Loại</th>
                <th>Tiêu đề</th>
                <th>Căn hộ</th>
                <th>Trạng thái</th>
                <th>Phản hồi</th>
                <th className="data-table__th--actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((fb) => {
                const sc = statusColor[fb.feedbackStatus] || { color: '#6b7280', bg: '#f3f4f6' };
                return (
                  <tr key={fb.feedbackId}>
                    <td className="data-table__cell--id">{fb.feedbackId}</td>
                    <td>
                      {fb.feedbackType === 'MAINTENANCE' ? (
                        <span className="badge-type badge-type--maintenance" title="Sửa chữa/Bảo trì">
                          {Icons.wrench}
                        </span>
                      ) : (
                        <span className="badge-type badge-type--general" title="Ý kiến/Kiến nghị">
                          {Icons.message}
                        </span>
                      )}
                    </td>
                    <td className="data-table__cell--bold">{fb.title}</td>
                    <td>{getApartmentLabel(fb.apartment)}</td>
                    <td>
                      <span className="badge" style={{ color: sc.color, backgroundColor: sc.bg }}>
                        {statusLabel[fb.feedbackStatus] || fb.feedbackStatus}
                      </span>
                    </td>
                    <td>
                      {fb.response ? (
                        <span className="badge" style={{ color: '#059669', backgroundColor: '#d1fae5' }}>
                          Đã phản hồi
                        </span>
                      ) : (
                        <span className="badge" style={{ color: '#d97706', backgroundColor: '#fef3c7' }}>
                          Chưa phản hồi
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn action-btn--view" title="Xem" onClick={() => openViewModal(fb)}>
                          {Icons.eye}
                        </button>
                        <button className="action-btn action-btn--edit" title="Phản hồi" onClick={() => openRespondModal(fb)}>
                          {Icons.reply}
                        </button>
                        <button className="action-btn action-btn--delete" title="Xóa" onClick={() => openDeleteModal(fb)}>
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

      {/* Edit Modal */}
      {modalOpen && modalMode === 'edit' && selectedFeedback && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Chỉnh sửa phản hồi</h3>
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
                    placeholder="VD: Hỏng ống nước, Thang máy bị kẹt..."
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
                    placeholder="Mô tả chi tiết vấn đề..."
                    rows={4}
                  />
                  {formErrors.content && <span className="form-error">{formErrors.content}</span>}
                </div>

                {/* Status */}
                <div className="form-field">
                  <label className="form-label">Trạng thái</label>
                  <StatusDropdown
                    value={formData.feedbackStatus}
                    onChange={(val) => handleFormChange('feedbackStatus', val)}
                  />
                </div>

                {/* Response */}
                <div className="form-field form-field--full">
                  <label className="form-label">Phản hồi từ quản lý</label>
                  <textarea
                    className="form-input form-textarea"
                    value={formData.response}
                    onChange={(e) => handleFormChange('response', e.target.value)}
                    placeholder="Nhập phản hồi xử lý..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Respond Modal */}
      {modalOpen && modalMode === 'respond' && selectedFeedback && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal--respond" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Phản hồi yêu cầu</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                {Icons.close}
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal__body">
              {/* ── Feedback card từ cư dân ── */}
              {/* Summary of resident request */}
              <div className="fb-res-summary">
                <div className="fb-res-summary__header">
                  <div className="fb-res-summary__apt">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14, color: '#3b82f6' }}>
                      <rect x="4" y="2" width="16" height="20" rx="2" />
                      <path d="M9 22V12h6v10" />
                    </svg>
                    {getApartmentLabel(selectedFeedback.apartment)}
                  </div>
                  <span
                    className="badge"
                    style={{
                      color: (statusColor[selectedFeedback.feedbackStatus] || {}).color || '#6b7280',
                      backgroundColor: (statusColor[selectedFeedback.feedbackStatus] || {}).bg || '#f3f4f6',
                      padding: '4px 10px',
                      borderRadius: '30px',
                      fontSize: '11px'
                    }}
                  >
                    {statusLabel[selectedFeedback.feedbackStatus] || selectedFeedback.feedbackStatus}
                  </span>
                </div>
                
                <div className="fb-res-summary__body">
                  <h4 className="fb-res-summary__title">{selectedFeedback.title}</h4>
                  <div className="fb-res-summary__text">
                    {selectedFeedback.content}
                  </div>
                </div>
              </div>

              {/* ── Phần phản hồi của admin ── */}
              <div className="fb-respond">
                <div className="fb-respond__header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                    <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                  </svg>
                  <span>Phản hồi từ ban quản lý</span>
                </div>

                <div className="form-grid">
                  {/* Status */}
                  <div className="form-field">
                    <label className="form-label">Cập nhật trạng thái</label>
                    <StatusDropdown
                      value={formData.feedbackStatus}
                      onChange={(val) => handleFormChange('feedbackStatus', val)}
                    />
                  </div>

                  {/* Response */}
                  <div className="form-field form-field--full">
                    <label className="form-label">
                      Nội dung phản hồi <span className="form-required">*</span>
                    </label>
                    <textarea
                      className={`form-input form-textarea ${formErrors.response ? 'form-input--error' : ''}`}
                      value={formData.response}
                      onChange={(e) => handleFormChange('response', e.target.value)}
                      placeholder="Nhập nội dung phản hồi cho cư dân..."
                      rows={4}
                    />
                    {formErrors.response && <span className="form-error">{formErrors.response}</span>}
                  </div>
                </div>
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : 'Gửi phản hồi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modalOpen && modalMode === 'view' && selectedFeedback && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Chi tiết phản hồi</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                {Icons.close}
              </button>
            </div>
            <div className="modal__body fbv__body">
              {/* Header Bar: Apt Pill + Status Badge */}
              <div className="fbv__header-bar">
                <div className="fbv__apt-pill">
                  <svg className="fbv__apt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <path d="M9 22V12h6v10" />
                  </svg>
                  {getApartmentLabel(selectedFeedback.apartment)}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className={`badge-type-label ${selectedFeedback.feedbackType === 'MAINTENANCE' ? 'badge-type-label--maintenance' : 'badge-type-label--general'}`}>
                    {selectedFeedback.feedbackType === 'MAINTENANCE' ? '🛠️ Bảo trì' : '💬 Góp ý'}
                  </span>
                  <span
                    className="badge"
                    style={{
                      color: statusColor[selectedFeedback.feedbackStatus]?.color || '#6b7280',
                      backgroundColor: statusColor[selectedFeedback.feedbackStatus]?.bg || '#f3f4f6',
                      padding: '4px 12px',
                      borderRadius: '30px'
                    }}
                  >
                    {statusLabel[selectedFeedback.feedbackStatus] || selectedFeedback.feedbackStatus}
                  </span>
                </div>
              </div>

              {/* Meta Grid: Sender & Date */}
              <div className="fbv__meta-grid">
                <div className="fbv__meta-card">
                  <div className="fbv__meta-icon">👤</div>
                  <div className="fbv__meta-info">
                    <span className="fbv__meta-label">Người gửi</span>
                    <span className="fbv__meta-value">{selectedFeedback.senderName || 'Cư dân'}</span>
                  </div>
                </div>
                <div className="fbv__meta-card">
                  <div className="fbv__meta-icon">📅</div>
                  <div className="fbv__meta-info">
                    <span className="fbv__meta-label">Ngày gửi</span>
                    <span className="fbv__meta-value">{formatDate(selectedFeedback.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Device Box (If maintenance) */}
              {selectedFeedback.deviceName && (
                <div className="fbv__device-box">
                  <div className="fbv__device-top">
                    <span className="fbv__device-tag">Hạng mục sửa chữa</span>
                    <div style={{ color: '#60a5fa' }}>{Icons.box}</div>
                  </div>
                  <div className="fbv__device-main">
                    <div className="fbv__device-img">📦</div>
                    <div className="fbv__device-detail">
                      <div className="fbv__device-name">{selectedFeedback.deviceName}</div>
                      <div className="fbv__device-id">Device Ref: #{selectedFeedback.deviceId}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Card */}
              <div className="fbv__content-card">
                <h4 className="fbv__title">{selectedFeedback.title}</h4>
                <div className="fbv__text">{selectedFeedback.content}</div>
              </div>

              {/* Response Section */}
              <div className="fbv__response-section">
                <div className="fbv__response-header">
                  <span style={{ color: 'var(--primary)' }}>{Icons.reply}</span>
                  Phản hồi từ Ban quản lý
                </div>
                {selectedFeedback.response ? (
                  <div className="fbv__response-bubble">
                    <div className="fbv__text" style={{ fontSize: '0.95rem' }}>{selectedFeedback.response}</div>
                  </div>
                ) : (
                  <div className="fbv__response-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 32, height: 32, marginBottom: 8 }}>
                      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                    </svg>
                    <span>Chưa có nội dung phản hồi cho cư dân</span>
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
                  setTimeout(() => openRespondModal(selectedFeedback), 100);
                }}
              >
                Phản hồi
              </button>
              <button
                className="btn btn--warning"
                style={{ backgroundColor: '#d97706', color: 'white' }}
                onClick={() => handleCreateMaintenance(selectedFeedback)}
              >
                <span className="btn__icon">{Icons.wrench}</span>
                Tạo bảo trì
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
                  Bạn có chắc chắn muốn xóa phản hồi{' '}
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
