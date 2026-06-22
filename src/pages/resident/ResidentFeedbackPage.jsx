import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import feedbackService from '../../services/feedbackService';
import apartmentService from '../../services/apartmentService';
import deviceService from '../../services/deviceService';
import DropdownSelect from '../../components/common/DropdownSelect';

const feedbackStatusConfig = {
  PENDING: { label: 'Chờ xử lý', color: '#f59e0b', bg: '#fef3c7' },
  IN_PROGRESS: { label: 'Đang xử lý', color: '#3b82f6', bg: '#dbeafe' },
  RESOLVED: { label: 'Đã giải quyết', color: '#10b981', bg: '#d1fae5' },
  CLOSED: { label: 'Đã đóng', color: '#6b7280', bg: '#f3f4f6' },
};

function StatusBadge({ status }) {
  const s = feedbackStatusConfig[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span className="fb__badge" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
}

const FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái', color: '#94a3b8' },
  { value: 'PENDING', label: 'Chờ xử lý', color: '#f59e0b' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý', color: '#3b82f6' },
  { value: 'RESOLVED', label: 'Đã giải quyết', color: '#10b981' },
  { value: 'CLOSED', label: 'Đã đóng', color: '#6b7280' },
];

function FilterDropdown({ value, onChange }) {
  return (
    <DropdownSelect
      value={value}
      onChange={onChange}
      options={FILTER_OPTIONS}
      style={{ width: 190 }}
      renderValue={(option) => (
        <span className="ds-status-value">
          <span className="ds-status-dot" style={{ background: option.color }} />
          <span className="ds-option-label">{option.label}</span>
        </span>
      )}
      renderOption={(option) => (
        <span className="ds-status-value">
          <span className="ds-status-dot" style={{ background: option.color }} />
          <span className="ds-option-label">{option.label}</span>
        </span>
      )}
    />
  );
}

export default function ResidentFeedbackPage() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [apartmentId, setApartmentId] = useState(null);
  const [apartmentDevices, setApartmentDevices] = useState([]);

  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  const [createForm, setCreateForm] = useState({ title: '', content: '', feedbackType: 'GENERAL', deviceId: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchApartment();
  }, []);

  useEffect(() => {
    if (apartmentId) fetchFeedbacks();
  }, [page, statusFilter, apartmentId]);

  useEffect(() => {
    if (!selectedFeedback && !showCreateModal) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedFeedback, showCreateModal]);

  const fetchApartment = async () => {
    try {
      const res = await apartmentService.getByResident(user.id);
      const apt = res.data?.data;
      if (apt?.id) {
        setApartmentId(apt.id);
        fetchApartmentDevices(apt.id);
      }
    } catch {
      setApartmentId(null);
    }
  };

  const fetchApartmentDevices = async (aptId) => {
    try {
      const res = await deviceService.getAll({
        page: 0,
        size: 100,
        apartmentId: aptId,
        deviceType: 'APARTMENT'
      });
      setApartmentDevices(res.data?.data?.content || []);
    } catch {
      setApartmentDevices([]);
    }
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: pageSize,
        sortBy: 'id',
        direction: 'desc',
        apartmentId,
      };
      if (statusFilter) params.feedbackStatus = statusFilter;
      if (keyword.trim()) params.keyword = keyword.trim();

      const res = await feedbackService.getAll(params);
      const data = res.data?.data;
      setFeedbacks(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
    } catch {
      toast.error('Không thể tải danh sách phản hồi');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchFeedbacks();
  };

  const handleCreate = async () => {
    if (!createForm.title.trim()) { toast.warning('Vui lòng nhập tiêu đề'); return; }
    if (!createForm.content.trim()) { toast.warning('Vui lòng nhập nội dung'); return; }
    if (!apartmentId) { toast.error('Bạn chưa được gán căn hộ, không thể gửi phản hồi'); return; }

    setCreating(true);
    try {
      await feedbackService.create({
        title: createForm.title,
        content: createForm.content,
        feedbackType: createForm.feedbackType,
        deviceId: createForm.feedbackType === 'MAINTENANCE' ? (createForm.deviceId || undefined) : undefined,
        feedbackStatus: 'PENDING',
        apartmentId: apartmentId,
        senderId: user.id,
      });
      toast.success('Gửi phản hồi thành công!');
      setShowCreateModal(false);
      setCreateForm({ title: '', content: '', feedbackType: 'GENERAL', deviceId: '' });
      setPage(0);
      fetchFeedbacks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi phản hồi thất bại');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page fb" id="feedback-page">
      <div className="page__header">
        <div>
          <h2 className="page__title">Phản hồi</h2>
          <p className="page__desc">Gửi phản hồi, theo dõi tiến độ xử lý và phản hồi từ ban quản lý</p>
        </div>
        <button className="btn btn--primary fb__create-btn" onClick={() => setShowCreateModal(true)} id="create-feedback-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Gửi phản hồi
        </button>
      </div>

      <div className="page__filters fb__toolbar">
        <form className="fb__search" onSubmit={handleSearch}>
          <div className="fb__search-wrapper">
            <svg className="fb__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="fb__search-input"
              placeholder="Tìm theo tiêu đề, nội dung..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              id="feedback-search-input"
            />
          </div>
          <button type="submit" className="fb__search-btn">Tìm kiếm</button>
        </form>

        <div className="fb__toolbar-right">
          <FilterDropdown value={statusFilter} onChange={(val) => { setStatusFilter(val); setPage(0); }} />
        </div>
      </div>

      <div className="page__table-wrapper fb__list">
        {loading ? (
          <div className="fb__loading">
            <div className="fb__spinner" />
            <p>Đang tải phản hồi...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="fb__empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>Chưa có phản hồi nào</p>
          </div>
        ) : (
          <>
            {feedbacks.map((fb) => (
              <div key={fb.feedbackId} className="fb__item" onClick={() => setSelectedFeedback(fb)}>
                <div className="fb__item-top">
                  <h3 className="fb__item-title">{fb.title}</h3>
                  <StatusBadge status={fb.feedbackStatus} />
                </div>
                <p className="fb__item-content">{fb.content}</p>
                <div className="fb__item-meta">
                  {fb.apartment && (
                    <span className="fb__item-apt">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                        <rect x="4" y="2" width="16" height="20" rx="2" />
                        <path d="M9 22V12h6v10" />
                      </svg>
                      Căn {fb.apartment.apartmentNumber}
                    </span>
                  )}
                  {fb.response && (
                    <span className="fb__item-has-response">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                        <polyline points="9 11 12 14 22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      </svg>
                      Đã phản hồi
                    </span>
                  )}
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="fb__pagination">
                <button className="fb__page-btn" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>← Trước</button>
                <span className="fb__page-info">Trang {page + 1} / {totalPages}</span>
                <button className="fb__page-btn" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>Sau →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedFeedback && createPortal((
        <div className="fb__overlay resident-feedback-detail-overlay" onClick={() => setSelectedFeedback(null)}>
          <div className="fb__modal resident-feedback-detail-modal" onClick={(e) => e.stopPropagation()} id="feedback-detail-modal">
            <div className="fb__modal-header">
              <h3>Chi tiết phản hồi</h3>
              <button className="fb__modal-close" onClick={() => setSelectedFeedback(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="fb__modal-body">
              <div className="fb__detail-status">
                <StatusBadge status={selectedFeedback.feedbackStatus} />
                {selectedFeedback.apartment && (
                  <span className="fb__detail-apt">
                    Căn {selectedFeedback.apartment.apartmentNumber} · Block {selectedFeedback.apartment.block} · Tầng {selectedFeedback.apartment.floor}
                  </span>
                )}
              </div>
              <div className="fb__detail-section">
                <h4 className="fb__detail-label">Tiêu đề</h4>
                <p className="fb__detail-title">{selectedFeedback.title}</p>
              </div>
              <div className="fb__detail-section">
                <h4 className="fb__detail-label">Nội dung</h4>
                <div className="fb__detail-content">{selectedFeedback.content}</div>
              </div>
              {selectedFeedback.response ? (
                <div className="fb__detail-section">
                  <h4 className="fb__detail-label fb__detail-label--response">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    Phản hồi từ Ban quản lý
                  </h4>
                  <div className="fb__detail-response">{selectedFeedback.response}</div>
                </div>
              ) : (
                <div className="fb__detail-no-response">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <span>Chưa có phản hồi từ Ban quản lý</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ), document.body)}

      {/* Create Modal */}
      {showCreateModal && createPortal((
        <div className="fb__overlay resident-feedback-create-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="fb__modal resident-feedback-create-modal" onClick={(e) => e.stopPropagation()} id="create-feedback-modal">
            <div className="fb__modal-header">
              <h3>Gửi phản hồi mới</h3>
              <button className="fb__modal-close" onClick={() => setShowCreateModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="fb__modal-body">
              <div className="fb__form-field">
                <label className="fb__form-label">Loại phản hồi <span className="fb__required">*</span></label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <div
                    className={`fb__type-card ${createForm.feedbackType === 'GENERAL' ? 'fb__type-card--active' : ''}`}
                    onClick={() => setCreateForm({ ...createForm, feedbackType: 'GENERAL' })}
                  >
                    <div className="fb__type-card-icon">💬</div>
                    <div className="fb__type-card-info">
                      <span className="fb__type-card-label">Ý kiến/Kiến nghị</span>
                      <span className="fb__type-card-desc">Đóng góp ý kiến chung</span>
                    </div>
                  </div>
                  <div
                    className={`fb__type-card ${createForm.feedbackType === 'MAINTENANCE' ? 'fb__type-card--active' : ''}`}
                    onClick={() => setCreateForm({ ...createForm, feedbackType: 'MAINTENANCE' })}
                  >
                    <div className="fb__type-card-icon">🛠️</div>
                    <div className="fb__type-card-info">
                      <span className="fb__type-card-label">Sửa chữa/Bảo trì</span>
                      <span className="fb__type-card-desc">Yêu cầu sửa chữa thiết bị</span>
                    </div>
                  </div>
                </div>
              </div>

              {createForm.feedbackType === 'MAINTENANCE' && (
                <div className="fb__form-field">
                  <label className="fb__form-label">Chọn thiết bị cần bảo trì <span className="fb__required">*</span></label>
                  <div className="fb__device-grid">
                    {apartmentDevices.length === 0 ? (
                      <p className="fb__device-empty">Không tìm thấy thiết bị nào trong căn hộ của bạn</p>
                    ) : (
                      apartmentDevices.map(dev => (
                        <div
                          key={dev.id}
                          className={`fb__device-item ${createForm.deviceId === dev.id ? 'fb__device-item--active' : ''}`}
                          onClick={() => setCreateForm({ ...createForm, deviceId: dev.id })}
                        >
                          <span className="fb__device-icon">📦</span>
                          <span className="fb__device-name">{dev.deviceName}</span>
                          {createForm.deviceId === dev.id && <span className="fb__device-check">✓</span>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="fb__form-field">
                <label className="fb__form-label" htmlFor="fb-title">Tiêu đề <span className="fb__required">*</span></label>
                <input
                  id="fb-title"
                  type="text"
                  className="fb__form-input"
                  placeholder="VD: Thang máy bị hỏng"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </div>
              <div className="fb__form-field">
                <label className="fb__form-label" htmlFor="fb-content">Nội dung <span className="fb__required">*</span></label>
                <textarea
                  id="fb-content"
                  className="fb__form-textarea"
                  placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                  rows={5}
                  value={createForm.content}
                  onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                />
              </div>
              <div className="fb__form-actions">
                <button className="fb__form-cancel" onClick={() => setShowCreateModal(false)} disabled={creating}>Hủy</button>
                <button className="fb__form-submit" onClick={handleCreate} disabled={creating} id="submit-feedback-btn">
                  {creating ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="fb__btn-spinner" /> Đang gửi...
                    </span>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      Gửi phản hồi
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}
