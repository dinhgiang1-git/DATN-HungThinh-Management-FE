import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSse } from '../../contexts/SseContext';
import systemNotificationService from '../../services/systemNotificationService';

const pageTitles = {
  '/resident/dashboard': 'Trang chủ',
  '/resident/invoices': 'Hóa đơn',
  '/resident/contracts': 'Hợp đồng',
  '/resident/feedbacks': 'Phản hồi',
  '/resident/notifications': 'Thông báo',
  '/resident/vehicles': 'Phương tiện',
  '/resident/members': 'Thành viên',
  '/resident/profile': 'Thông tin cá nhân',
};

const formatTime = (d) =>
  d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';

export default function ResidentHeader({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { newCount, resetCount, subscribe } = useSse();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [bellNotifications, setBellNotifications] = useState([]);
  const [bellLoading, setBellLoading] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  const pageTitle = pageTitles[location.pathname] || 'Trang chủ';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      setBellNotifications((prev) => [data, ...prev.slice(0, 4)]);
    });
    return unsubscribe;
  }, [subscribe]);

  const handleBellClick = async () => {
    const opening = !bellOpen;
    setBellOpen(opening);
    setDropdownOpen(false);
    if (opening) {
      resetCount();
      setBellLoading(true);
      try {
        if (user?.id) {
          const res = await systemNotificationService.getByResident(user.id, { page: 0, size: 5 });
          setBellNotifications(res.data?.data?.content ?? []);
        }
      } catch {
        setBellNotifications([]);
      } finally {
        setBellLoading(false);
      }
    }
  };

  const handleNotificationClick = (notification) => {
    setBellOpen(false);
    resetCount();
    if (notification.id && !notification.isRead) {
      systemNotificationService.markAsRead(notification.id).catch(() => {});
    }
    navigate('/resident/notifications');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header" id="resident-header">
      <div className="header__left">
        <button className="header__toggle" onClick={onToggleSidebar} id="sidebar-toggle-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="header__title-block">
          <span className="header__eyebrow">Cổng cư dân</span>
          <h1 className="header__title">{pageTitle}</h1>
        </div>
      </div>

      <div className="header__right">
        {/* Notification Bell – RESIDENT only */}
        {user?.role === 'RESIDENT' && (
          <div className="header__bell-wrap" ref={bellRef}>
            <button className="header__bell" onClick={handleBellClick} id="header-bell-btn" title="Thông báo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {newCount > 0 && (
                <span className="header__bell-badge">{newCount > 9 ? '9+' : newCount}</span>
              )}
            </button>

            {bellOpen && (
              <div className="header__bell-dropdown" id="bell-dropdown">
                <div className="header__bell-dropdown-header">
                  <span>Thông báo</span>
                  <button onClick={() => { setBellOpen(false); navigate('/resident/notifications'); }} className="header__bell-viewall">
                    Xem tất cả
                  </button>
                </div>
                <div className="header__bell-dropdown-list">
                  {bellLoading ? (
                    <div className="header__bell-loading">
                      <div className="header__bell-spinner" />
                    </div>
                  ) : bellNotifications.length === 0 ? (
                    <div className="header__bell-empty">Chưa có thông báo</div>
                  ) : (
                    bellNotifications.map((n) => (
                      <button
                        key={n.id || n.title + n.sendTime}
                        className={`header__bell-item ${!n.isRead ? 'header__bell-item--unread' : ''}`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div className="header__bell-item-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                        </div>
                        <div className="header__bell-item-body">
                          <div className="header__bell-item-title">{n.title}</div>
                          {n.content && (
                            <div className="header__bell-item-desc">
                              {n.content.length > 60 ? n.content.slice(0, 60) + '…' : n.content}
                            </div>
                          )}
                          <div className="header__bell-item-time">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
                              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                            {formatTime(n.sendTime)}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User dropdown */}
        <div ref={dropdownRef}>
          <button
            className="header__user"
            onClick={() => { setDropdownOpen(!dropdownOpen); setBellOpen(false); }}
            id="user-menu-btn"
          >
            <div className="header__avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="header__username">{user?.username || 'User'}</span>
            <svg
              className={`header__dropdown-arrow ${dropdownOpen ? 'header__dropdown-arrow--open' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="header__dropdown" id="user-dropdown">
              <div className="header__dropdown-info">
                <div className="header__dropdown-name">{user?.username}</div>
                <div className="header__dropdown-role">
                  {user?.role === 'TECHNICIAN' ? 'Kỹ thuật viên' : 'Cư dân'}
                </div>
              </div>
              <div className="header__dropdown-divider" />
              <button
                className="header__dropdown-item header__dropdown-item--profile"
                onClick={() => { setDropdownOpen(false); navigate('/resident/profile'); }}
                id="profile-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Thông tin cá nhân
              </button>
              <button
                className="header__dropdown-item header__dropdown-item--logout"
                onClick={handleLogout}
                id="logout-btn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
