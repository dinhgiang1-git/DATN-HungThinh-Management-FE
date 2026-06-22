import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import apartmentService from '../../services/apartmentService';
import residentService from '../../services/residentService';

const relationshipConfig = {
  OWNER:    { label: 'Chủ hộ',      color: '#92400e', bg: '#fef3c7', avatarBg: 'linear-gradient(135deg, #fbbf24, #d97706)', group: 'primary' },
  SPOUSE:   { label: 'Vợ/Chồng',    color: '#9d174d', bg: '#fce7f3', avatarBg: 'linear-gradient(135deg, #f472b6, #db2777)', group: 'family' },
  CHILD:    { label: 'Con',          color: '#065f46', bg: '#d1fae5', avatarBg: 'linear-gradient(135deg, #34d399, #059669)', group: 'family' },
  PARENT:   { label: 'Cha/Mẹ',      color: '#5b21b6', bg: '#ede9fe', avatarBg: 'linear-gradient(135deg, #a78bfa, #7c3aed)', group: 'family' },
  RELATIVE: { label: 'Người thân',   color: '#155e75', bg: '#cffafe', avatarBg: 'linear-gradient(135deg, #22d3ee, #0891b2)', group: 'family' },
  TENANT:   { label: 'Người thuê',   color: '#1e40af', bg: '#dbeafe', avatarBg: 'linear-gradient(135deg, #60a5fa, #2563eb)', group: 'primary' },
  OTHER:    { label: 'Khác',         color: '#4b5563', bg: '#f3f4f6', avatarBg: 'linear-gradient(135deg, #9ca3af, #6b7280)', group: 'family' },
};

const relationshipOptions = [
  { value: 'SPOUSE', label: 'Vợ/Chồng' },
  { value: 'CHILD', label: 'Con' },
  { value: 'PARENT', label: 'Cha/Mẹ' },
  { value: 'RELATIVE', label: 'Người thân' },
  { value: 'TENANT', label: 'Người thuê' },
  { value: 'OTHER', label: 'Khác' },
];

const emptyForm = { fullName: '', phoneNumber: '', email: '', relationship: 'SPOUSE' };

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function MemberCard({ member, isSelf, onEdit, featured }) {
  const cfg = relationshipConfig[member.relationshipType] || relationshipConfig.OTHER;
  const isOwner = member.relationshipType === 'OWNER';

  return (
    <div className={`mbc ${featured ? 'mbc--featured' : ''}`}>
      {/* Colored top strip */}
      <div className="mbc__strip" style={{ background: cfg.avatarBg }} />

      <div className="mbc__content">
        {/* Avatar centered */}
        <div className="mbc__avatar-wrap">
          <div className="mbc__avatar" style={{ background: cfg.avatarBg }}>
            {getInitials(member.fullName)}
          </div>
          {isOwner && (
            <div className="mbc__crown">
              <svg viewBox="0 0 24 24" fill="#f59e0b" style={{ width: 16, height: 16 }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Name */}
        <h4 className="mbc__name">
          {member.fullName}
          {isSelf && <span className="mbc__you">Bạn</span>}
        </h4>

        {/* Badge */}
        <span className="mbc__badge" style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.label}
        </span>

        {/* Details */}
        <div className="mbc__details">
          <div className="mbc__row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            <span>{member.phone || 'Chưa cập nhật'}</span>
          </div>
          <div className="mbc__row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
            <span>{member.email || 'Chưa cập nhật'}</span>
          </div>
        </div>

        {/* Edit button */}
        {!isOwner && onEdit && (
          <button className="mbc__edit-btn" onClick={() => onEdit(member)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Chỉnh sửa
          </button>
        )}
      </div>
    </div>
  );
}

export default function ResidentMembersPage() {
  const { user } = useAuth();
  const [apartment, setApartment] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apartmentService.getByResident(user.id);
      const apt = res.data?.data;
      setApartment(apt);
      setMembers(apt?.residents || []);
    } catch {
      toast.error('Không thể tải thông tin căn hộ');
    } finally {
      setLoading(false);
    }
  };

  const primaryMembers = members.filter(m => relationshipConfig[m.relationshipType]?.group === 'primary');
  const familyMembers = members.filter(m => relationshipConfig[m.relationshipType]?.group === 'family');

  const openCreateModal = () => { setEditingMember(null); setForm({ ...emptyForm }); setModalOpen(true); };
  const openEditModal = (member) => {
    setEditingMember(member);
    setForm({ fullName: member.fullName || '', phoneNumber: member.phone || '', email: member.email || '', relationship: member.relationshipType || 'OTHER' });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingMember(null); setForm({ ...emptyForm }); };
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.fullName.trim()) { toast.warning('Họ tên không được để trống'); return; }
    if (!form.phoneNumber.trim()) { toast.warning('Số điện thoại không được để trống'); return; }
    setSaving(true);
    try {
      if (editingMember) {
        await residentService.update(editingMember.residentId, { fullName: form.fullName, phoneNumber: form.phoneNumber, email: form.email || null, relationship: form.relationship });
        toast.success('Cập nhật thành viên thành công!');
      } else {
        await residentService.create({ fullName: form.fullName, phoneNumber: form.phoneNumber, email: form.email || null, relationship: form.relationship, apartmentId: apartment.id });
        toast.success('Thêm thành viên mới thành công!');
      }
      closeModal(); await fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Thao tác thất bại'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="mb__loading"><div className="mb__spinner" /><p>Đang tải...</p></div>;
  if (!apartment) return <div className="mb__empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg><p>Bạn chưa được gán vào căn hộ nào</p></div>;

  return (
    <div className="mb" id="members-page">
      {/* Banner */}
      <div className="mb__banner">
        <div className="mb__banner-left">
          <div className="mb__banner-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
          </div>
          <div>
            <h2 className="mb__banner-title">Căn hộ {apartment.apartmentNumber}</h2>
            <p className="mb__banner-sub">Block {apartment.block} · Tầng {apartment.floor} · {members.length} thành viên</p>
          </div>
        </div>
        <button className="mb__add-btn" onClick={openCreateModal} id="add-member-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="17" y1="11" x2="23" y2="11" /></svg>
          Thêm thành viên
        </button>
      </div>

      {/* Primary section */}
      {primaryMembers.length > 0 && (
        <div className="mb__section">
          <div className="mb__section-header">
            <div className="mb__section-line" />
            <span className="mb__section-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 16, height: 16 }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              Chủ hộ & Người thuê
            </span>
            <div className="mb__section-line" />
          </div>
          <div className="mb__grid mb__grid--2">
            {primaryMembers.map(m => (
              <MemberCard key={m.residentId} member={m} isSelf={m.residentId === user.id} onEdit={m.relationshipType !== 'OWNER' ? openEditModal : null} featured={m.relationshipType === 'OWNER'} />
            ))}
          </div>
        </div>
      )}

      {/* Family section */}
      {familyMembers.length > 0 && (
        <div className="mb__section">
          <div className="mb__section-header">
            <div className="mb__section-line" />
            <span className="mb__section-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 16, height: 16 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              Thành viên gia đình
            </span>
            <div className="mb__section-line" />
          </div>
          <div className="mb__grid">
            {familyMembers.map(m => (
              <MemberCard key={m.residentId} member={m} isSelf={m.residentId === user.id} onEdit={openEditModal} />
            ))}
          </div>
        </div>
      )}

      {members.length === 0 && (
        <div className="mb__empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg><p>Chưa có thành viên nào trong căn hộ</p></div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="mb__overlay" onClick={closeModal}>
          <div className="modal mb__modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header mb__modal-header">
              <h3 className="modal__title">{editingMember ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}</h3>
              <button className="modal__close mb__modal-close" onClick={closeModal}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
            </div>
            <div className="modal__body mb__modal-body">
              <div className="mb__form-field"><label className="mb__form-label">Họ và tên *</label><input type="text" className="mb__form-input" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Nhập họ tên" /></div>
              <div className="mb__form-field"><label className="mb__form-label">Số điện thoại *</label><input type="tel" className="mb__form-input" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="Nhập số điện thoại" /></div>
              <div className="mb__form-field"><label className="mb__form-label">Email</label><input type="email" className="mb__form-input" name="email" value={form.email} onChange={handleChange} placeholder="Nhập email (không bắt buộc)" /></div>
              <div className="mb__form-field">
                <label className="mb__form-label">Quan hệ với chủ hộ *</label>
                <div className="mb__relationship-grid">
                  {relationshipOptions.map((opt) => (
                    <button key={opt.value} type="button" className={`mb__rel-btn ${form.relationship === opt.value ? 'mb__rel-btn--active' : ''}`} onClick={() => setForm({ ...form, relationship: opt.value })}>{opt.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal__footer mb__modal-footer">
              <button className="btn btn--ghost mb__cancel-btn" onClick={closeModal} disabled={saving}>Hủy</button>
              <button className="btn btn--primary mb__save-btn" onClick={handleSave} disabled={saving}>{saving ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div className="mb__btn-spinner" /> Đang lưu...</span> : editingMember ? 'Lưu thay đổi' : 'Thêm thành viên'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
