import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useSse } from '../../contexts/SseContext';
import systemNotificationService from '../../services/systemNotificationService';

/* ─── helpers ─── */
const formatDateTime = (d) => {
  if (!d) return '—';
  let date;
  if (Array.isArray(d)) {
    date = new Date(d[0], (d[1] || 1) - 1, d[2] || 1, d[3] || 0, d[4] || 0, d[5] || 0);
  } else {
    date = new Date(d);
  }
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function ResidentNotificationPage() {
  const { user } = useAuth();
  const { connected, subscribe, resetCount, decrementCount } = useSse();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  useEffect(() => {
    const openId = location.state?.openNotificationId;
    if (openId) {
      handleViewDetail(openId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const unsubscribe = subscribe((newNotification) => {
      if (page === 0) {
        setNotifications((prev) => [newNotification, ...prev.slice(0, pageSize - 1)]);
      }
    });
    return unsubscribe;
  }, [subscribe, page]);

  useEffect(() => {
    if (!selectedNotification) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedNotification]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await systemNotificationService.getByResident(user.id, { page, size: pageSize });
      const data = res.data?.data;
      setNotifications(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
    } catch {
      toast.error('Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (notification) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      systemNotificationService.markAsRead(notification.id).catch(() => {});
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      decrementCount();
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id || markingAll) return;
    setMarkingAll(true);
    try {
      await systemNotificationService.markAllAsRead(user.id);
      const readAt = new Date().toISOString();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: n.readAt || readAt })));
      setSelectedNotification(prev => prev ? { ...prev, isRead: true, readAt: prev.readAt || readAt } : prev);
      resetCount();
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đánh dấu tất cả thông báo');
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotificationIcon = (title) => {
    if (!title) return '🔔';
    const t = title.toLowerCase();
    if (t.includes('hóa đơn') || t.includes('hoa don')) return '💰';
    if (t.includes('thanh toán') || t.includes('thanh toan')) return '💳';
    if (t.includes('bảo trì') || t.includes('bao tri')) return '🔧';
    return '📢';
  };

  const getIconColors = (title) => {
    if (!title) return { bg: '#eef2ff', color: '#6366f1' };
    const t = title.toLowerCase();
    if (t.includes('hóa đơn') || t.includes('hoa don')) return { bg: '#ecfdf5', color: '#10b981' };
    if (t.includes('thanh toán') || t.includes('thanh toan')) return { bg: '#fef3c7', color: '#f59e0b' };
    if (t.includes('bảo trì') || t.includes('bao tri')) return { bg: '#fee2e2', color: '#ef4444' };
    return { bg: '#eef2ff', color: '#6366f1' };
  };

  return (
    <div className="page noti" id="notification-page">
      <div className="page__header">
        <div>
          <h2 className="page__title">Thông báo</h2>
          <p className="page__desc">Xem thông báo từ ban quản lý và cập nhật trạng thái đã đọc</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="page__filters noti__toolbar">
        {user?.role === 'RESIDENT' && (
          <div className="noti__toolbar-actions">
            <button
              type="button"
              className="noti__mark-read-btn"
              onClick={handleMarkAllAsRead}
              disabled={markingAll || loading || notifications.length === 0}
            >
              {markingAll ? 'Đang xử lý...' : 'Đánh dấu đã đọc tất cả'}
            </button>
            <div className="noti__sse-status" id="sse-status">
              <span className={`noti__sse-dot ${connected ? 'noti__sse-dot--connected' : ''}`} />
              <span className="noti__sse-label">
                {connected ? 'Thời gian thực' : 'Đang kết nối...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Notification List */}
      <div className="page__table-wrapper noti__list">
        {loading ? (
          <div className="noti__loading">
            <div className="noti__spinner" />
            <p>Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="noti__empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p>Chưa có thông báo nào</p>
          </div>
        ) : (
          <>
            {notifications.map((n) => {
              const icon = getNotificationIcon(n.title);
              const colors = getIconColors(n.title);
              return (
                <div
                  key={n.id}
                  className={`noti__item ${!n.isRead ? 'noti__item--unread' : ''}`}
                  onClick={() => handleViewDetail(n)}
                >
                  <div className="noti__item-icon-col">
                    <div className="noti__item-icon" style={{ backgroundColor: colors.bg, color: colors.color }}>
                      <span className="noti__item-emoji">{icon}</span>
                    </div>
                  </div>
                  <div className="noti__item-body">
                    <div className="noti__item-top">
                      <h3 className="noti__item-title">
                        {!n.isRead && <span className="noti__unread-dot" />}
                        {n.title}
                      </h3>
                      <span className="noti__item-time">{formatDateTime(n.sendTime)}</span>
                    </div>
                    {n.content && (
                      <p className="noti__item-content">
                        {n.content.length > 120 ? n.content.slice(0, 120) + '…' : n.content}
                      </p>
                    )}
                    <div className="noti__item-meta">
                      {n.apartment && (
                        <span className="noti__item-sender">
                          🏠 {n.apartment.block}-{n.apartment.apartmentNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="noti__pagination">
                <button className="noti__page-btn" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>← Trước</button>
                <span className="noti__page-info">Trang {page + 1} / {totalPages}</span>
                <button className="noti__page-btn" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>Sau →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedNotification && createPortal((
        <div className="noti__overlay resident-notification-detail-overlay" onClick={() => setSelectedNotification(null)}>
          <div className="noti__modal resident-notification-detail-modal" onClick={(e) => e.stopPropagation()} id="notification-detail-modal">
            <div className="noti__detail-header">
              <div className="noti__detail-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className="noti__detail-header-info">
                <h3 className="noti__detail-header-title">{selectedNotification.title}</h3>
                <div className="noti__detail-header-meta">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12, flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{formatDateTime(selectedNotification.sendTime)}</span>
                </div>
              </div>
              <button className="noti__detail-header-close" onClick={() => setSelectedNotification(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="noti__modal-body">
              <div className="noti__detail-info-grid">
                <div className="noti__detail-info-card">
                  <div className="noti__detail-info-icon" style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" style={{ width: 16, height: 16 }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div className="noti__detail-info-text">
                    <span className="noti__detail-info-label">Đối tượng</span>
                    <span className="noti__detail-info-value">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, color: '#6366f1', backgroundColor: '#eef2ff' }}>
                        {selectedNotification.apartment
                          ? `Căn hộ ${selectedNotification.apartment.block}-${selectedNotification.apartment.apartmentNumber}`
                          : 'Cá nhân'}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="noti__detail-info-card">
                  <div className="noti__detail-info-icon" style={{ background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" style={{ width: 16, height: 16 }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="noti__detail-info-text">
                    <span className="noti__detail-info-label">Người gửi</span>
                    <span className="noti__detail-info-value noti__detail-info-value--bold">
                      {selectedNotification.senderName || 'Ban Quản lý'}
                    </span>
                  </div>
                </div>

                <div className="noti__detail-info-card">
                  <div className="noti__detail-info-icon" style={{ background: selectedNotification.isRead ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
                    {selectedNotification.isRead ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" style={{ width: 16, height: 16 }}>
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" style={{ width: 16, height: 16 }}>
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    )}
                  </div>
                  <div className="noti__detail-info-text">
                    <span className="noti__detail-info-label">Trạng thái</span>
                    <span className="noti__detail-info-value">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, color: selectedNotification.isRead ? '#059669' : '#d97706', backgroundColor: selectedNotification.isRead ? '#d1fae5' : '#fef3c7' }}>
                        {selectedNotification.isRead ? 'Đã đọc' : 'Chưa đọc'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {selectedNotification.content && (
                <div className="noti__detail-content-section">
                  <div className="noti__detail-content-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <span>Nội dung thông báo</span>
                  </div>
                  <div className="noti__detail-content-body">
                    {selectedNotification.content}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}
