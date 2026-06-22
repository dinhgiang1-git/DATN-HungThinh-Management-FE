import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import userService from '../../services/userService';

const pageTitles = {
  '/': 'Tổng quan',
  '/users': 'Tài khoản',
  '/residents': 'Cư dân',
  '/apartments': 'Căn hộ',
  '/building-reports': 'Khu & tòa nhà',
  '/devices': 'Thiết bị',
  '/notifications': 'Thông báo',
  '/feedbacks': 'Phản hồi',
  '/invoices': 'Hóa đơn',
  '/contracts': 'Hợp đồng',
  '/maintenances': 'Bảo trì',
  '/vehicles': 'Phương tiện',
  '/audit-logs': 'Nhật ký hệ thống',
};

const roleLabel = {
  ADMIN: 'Quản trị viên',
  TECHNICIAN: 'Kỹ thuật viên',
  RESIDENT: 'Cư dân',
};

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const pageTitle = pageTitles[location.pathname] || 'Hệ thống quản lý';

  // Profile modal states
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileMode, setProfileMode] = useState('view'); // 'view' or 'edit'
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!profileModalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [profileModalOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openProfileView = async () => {
    setDropdownOpen(false);
    try {
      const res = await userService.getByUsername(user?.username);

      if (res.data?.status !== false) {
        setProfileData(res.data.data || res.data);
        setProfileMode('view');
        setProfileModalOpen(true);
      } else {
        toast.error('Không tìm thấy thông tin cá nhân');
      }
    } catch (err) {
      toast.error('Lỗi khi tải thông tin cá nhân');
    }
  };

  const openProfileEdit = () => {
    setFormData({
      fullName: profileData?.fullName || '',
      phoneNumber: profileData?.phoneNumber || '',
      email: profileData?.email || '',
      password: '',
    });
    setProfileMode('edit');
  };

  const handleProfileSubmit = async (e) => {
    e?.preventDefault();
    const payload = {};
    if (formData.fullName !== profileData.fullName) payload.fullName = formData.fullName;
    if (formData.phoneNumber !== profileData.phoneNumber) payload.phoneNumber = formData.phoneNumber;
    if (formData.email !== profileData.email) payload.email = formData.email;
    if (formData.password?.trim()) payload.password = formData.password.trim();

    if (Object.keys(payload).length === 0) {
      setProfileMode('view');
      return;
    }

    setSubmitting(true);
    try {
      const res = await userService.update(profileData.id, payload);
      if (res.data?.status !== false) {
        toast.success('Cập nhật thông tin chuyên môn thành công!');
        openProfileView();
      } else {
        toast.error(res.data?.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      toast.error('Lỗi khi cập nhật thông tin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <header className="header">
      <div className="header__left">
        <button className="header__toggle" onClick={onToggleSidebar} aria-label="Thu gọn thanh điều hướng">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="header__title-block">
          <span className="header__eyebrow">Hệ thống quản lý chung cư</span>
          <h1 className="header__title">{pageTitle}</h1>
        </div>
      </div>

      <div className="header__right" ref={dropdownRef}>
        <button
          className="header__user"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div className="header__avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span className="header__username">{user?.username || 'Admin'}</span>
          <svg className={`header__dropdown-arrow ${dropdownOpen ? 'header__dropdown-arrow--open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="header__dropdown">
            <div className="header__dropdown-info">
              <p className="header__dropdown-name">{user?.username}</p>
              <p className="header__dropdown-role">{roleLabel[user?.role] || user?.role}</p>
            </div>
            <div className="header__dropdown-divider" />
            <button className="header__dropdown-item header__dropdown-item--profile" onClick={openProfileView}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.25rem', height: '1.25rem' }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Thông tin
            </button>
            <button className="header__dropdown-item header__dropdown-item--logout" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Đăng xuất
            </button>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {profileModalOpen && createPortal((
        <div className="modal-overlay" onClick={() => setProfileModalOpen(false)} style={{ zIndex: 9999 }}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{profileMode === 'view' ? 'Thông tin cá nhân' : 'Chỉnh sửa thông tin'}</h3>
              <button className="modal__close" onClick={() => setProfileModalOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {profileMode === 'view' && profileData ? (
              <div className="modal__body">
                <div className="detail-list">
                  <div className="detail-item">
                    <span className="detail-label">Tên đăng nhập</span>
                    <span className="detail-value detail-value--bold">{profileData.username}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Họ và tên</span>
                    <span className="detail-value">{profileData.fullName || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Số điện thoại</span>
                    <span className="detail-value">{profileData.phoneNumber || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{profileData.email || '—'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Vai trò</span>
                    <span className="detail-value">
                      <span className="badge" style={{ color: '#7c3aed', backgroundColor: '#ede9fe' }}>
                        {profileData.userRole === 'ADMIN' ? 'Admin' : (profileData.userRole === 'TECHNICIAN' ? 'Kỹ thuật viên' : profileData.userRole)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            ) : profileMode === 'edit' && profileData ? (
              <form onSubmit={handleProfileSubmit} className="modal__body">
                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="form-field">
                    <label className="form-label">Họ và tên</label>
                    <input className="form-input" value={formData.fullName} onChange={(e) => setFormData(p => ({...p, fullName: e.target.value}))} placeholder="Nhập họ và tên..." />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Số điện thoại</label>
                    <input className="form-input" value={formData.phoneNumber} onChange={(e) => setFormData(p => ({...p, phoneNumber: e.target.value}))} placeholder="Nhập số điện thoại..." />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData(p => ({...p, email: e.target.value}))} placeholder="Nhập email..." />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Đổi mật khẩu mới</label>
                    <input type="password" placeholder="Nhập mật khẩu mới... (Để trống nếu không đổi)" className="form-input" value={formData.password} onChange={(e) => setFormData(p => ({...p, password: e.target.value}))} />
                  </div>
                </div>
              </form>
            ) : null}

            <div className="modal__footer">
              {profileMode === 'view' ? (
                <>
                  <button className="btn btn--ghost" onClick={() => setProfileModalOpen(false)}>Đóng</button>
                  <button className="btn btn--primary" onClick={openProfileEdit}>Chỉnh sửa</button>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn--ghost" onClick={() => setProfileMode('view')}>Hủy</button>
                  <button type="button" className="btn btn--primary" onClick={handleProfileSubmit} disabled={submitting}>
                    {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ), document.body)}
    </header>
  );
}
