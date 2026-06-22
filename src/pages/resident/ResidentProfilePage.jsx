import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import residentService from '../../services/residentService';
import userService from '../../services/userService';

const relationshipLabels = {
  OWNER: 'Chủ hộ',
  SPOUSE: 'Vợ/Chồng',
  CHILD: 'Con',
  PARENT: 'Cha/Mẹ',
  RELATIVE: 'Người thân',
  TENANT: 'Người thuê',
  OTHER: 'Khác',
};

export default function ResidentProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ fullName: '', phoneNumber: '', email: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      let res;
      if (user?.role === 'RESIDENT') {
        res = await residentService.getByUsername(user.username);
      } else {
        res = await userService.getByUsername(user.username);
      }
      const data = res.data?.data;
      setProfile(data);
      setForm({
        fullName: data?.fullName || '',
        phoneNumber: data?.phoneNumber || '',
        email: data?.email || '',
      });
    } catch {
      toast.error('Không thể tải thông tin cá nhân');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCancel = () => {
    setForm({
      fullName: profile?.fullName || '',
      phoneNumber: profile?.phoneNumber || '',
      email: profile?.email || '',
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      toast.warning('Họ tên không được để trống');
      return;
    }

    setSaving(true);
    try {
      if (user?.role === 'RESIDENT') {
        await residentService.update(user.id, {
          fullName: form.fullName,
          phoneNumber: form.phoneNumber,
          email: form.email,
        });
      } else {
        await userService.update(user.id, {
          fullName: form.fullName,
          phoneNumber: form.phoneNumber,
          email: form.email,
        });
      }
      toast.success('Cập nhật thông tin thành công!');
      setIsEditing(false);
      await fetchProfile();
    } catch (err) {
      const msg = err.response?.data?.message || 'Cập nhật thất bại';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile__loading">
        <div className="profile__spinner" />
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className="profile" id="profile-page">
      <div className="profile__card">
        {/* Header */}
        <div className="profile__header">
          <div className="profile__avatar-section">
            <div className="profile__avatar-large">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="profile__avatar-info">
              <h2 className="profile__name">{profile?.fullName || profile?.userName || user?.username}</h2>
              <span className="profile__role-badge">
                {user?.role === 'TECHNICIAN' ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                    Kỹ thuật viên
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    Cư dân
                  </>
                )}
              </span>
            </div>
          </div>
          {!isEditing ? (
            <button className="profile__edit-btn" onClick={() => setIsEditing(true)} id="edit-profile-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Chỉnh sửa
            </button>
          ) : (
            <div className="profile__action-group">
              <button className="profile__cancel-btn" onClick={handleCancel} disabled={saving}>
                Hủy
              </button>
              <button className="profile__save-btn" onClick={handleSave} disabled={saving} id="save-profile-btn">
                {saving ? (
                  <span className="profile__saving">
                    <svg className="profile__save-spinner" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" opacity="0.75" />
                    </svg>
                    Đang lưu...
                  </span>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="profile__body">
          <div className="profile__section">
            <h3 className="profile__section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Thông tin cá nhân
            </h3>

            <div className="profile__fields">
              {/* Username - readonly */}
              <div className="profile__field">
                <label className="profile__label">Tên đăng nhập</label>
                <div className="profile__value-readonly">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="profile__field-icon">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span>{profile?.userName || profile?.username || user?.username}</span>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="profile__lock-icon">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Full Name */}
              <div className="profile__field">
                <label className="profile__label" htmlFor="profile-fullname">Họ và tên</label>
                {isEditing ? (
                  <input
                    id="profile-fullname"
                    name="fullName"
                    type="text"
                    className="profile__input"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
                  />
                ) : (
                  <div className="profile__value">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="profile__field-icon">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>{profile?.fullName || '—'}</span>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="profile__field">
                <label className="profile__label" htmlFor="profile-phone">Số điện thoại</label>
                {isEditing ? (
                  <input
                    id="profile-phone"
                    name="phoneNumber"
                    type="tel"
                    className="profile__input"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                  />
                ) : (
                  <div className="profile__value">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile__field-icon">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>{profile?.phoneNumber || '—'}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="profile__field">
                <label className="profile__label" htmlFor="profile-email">Email</label>
                {isEditing ? (
                  <input
                    id="profile-email"
                    name="email"
                    type="email"
                    className="profile__input"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Nhập email"
                  />
                ) : (
                  <div className="profile__value">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile__field-icon">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>{profile?.email || '—'}</span>
                  </div>
                )}
              </div>

              {/* Relationship (Resident only, readonly) */}
              {user?.role === 'RESIDENT' && profile?.relationship && (
                <div className="profile__field">
                  <label className="profile__label">Quan hệ</label>
                  <div className="profile__value">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="profile__field-icon">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>{relationshipLabels[profile.relationship] || profile.relationship}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
