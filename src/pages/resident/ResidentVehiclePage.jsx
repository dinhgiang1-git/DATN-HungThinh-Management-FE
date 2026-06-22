import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import vehicleService from '../../services/vehicleService';
import apartmentService from '../../services/apartmentService';

/* ─── constants ─── */
const VEHICLE_TYPES = [
  { value: 'MOTORBIKE', label: 'Xe máy', icon: '🏍️' },
  { value: 'CAR', label: 'Ô tô', icon: '🚗' },
  { value: 'BICYCLE', label: 'Xe đạp', icon: '🚲' },
  { value: 'ELECTRIC_BIKE', label: 'Xe máy điện', icon: '🛵' },
];

const vehicleTypeLabel = { MOTORBIKE: 'Xe máy', CAR: 'Ô tô', BICYCLE: 'Xe đạp', ELECTRIC_BIKE: 'Xe máy điện' };
const vehicleTypeIcon = { MOTORBIKE: '🏍️', CAR: '🚗', BICYCLE: '🚲', ELECTRIC_BIKE: '🛵' };
const vehicleTypeColor = {
  MOTORBIKE: { color: '#7c3aed', bg: '#ede9fe' },
  CAR: { color: '#2563eb', bg: '#dbeafe' },
  BICYCLE: { color: '#059669', bg: '#d1fae5' },
  ELECTRIC_BIKE: { color: '#d97706', bg: '#fef3c7' },
};

export default function ResidentVehiclePage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apartmentId, setApartmentId] = useState(null);
  const [apartmentInfo, setApartmentInfo] = useState(null);

  /* Modal */
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form, setForm] = useState({ licensePlate: '', vehicleType: 'MOTORBIKE', vehicleName: '' });
  const [submitting, setSubmitting] = useState(false);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchApartment();
  }, []);

  useEffect(() => {
    if (apartmentId) fetchVehicles();
  }, [apartmentId]);

  const fetchApartment = async () => {
    try {
      const res = await apartmentService.getByResident(user.id);
      const apt = res.data?.data;
      if (apt?.id) {
        setApartmentId(apt.id);
        setApartmentInfo(apt);
      }
    } catch {
      // không có căn hộ
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await vehicleService.getByApartment(apartmentId);
      setVehicles(res.data?.data || []);
    } catch {
      toast.error('Không thể tải danh sách phương tiện');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingVehicle(null);
    setForm({ licensePlate: '', vehicleType: 'MOTORBIKE', vehicleName: '' });
    setShowModal(true);
  };

  const openEditModal = (v) => {
    setEditingVehicle(v);
    setForm({ licensePlate: v.licensePlate || '', vehicleType: v.vehicleType || 'MOTORBIKE', vehicleName: v.vehicleName || '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.licensePlate.trim()) { toast.warning('Vui lòng nhập biển số'); return; }
    if (!apartmentId) { toast.error('Bạn chưa được gán căn hộ'); return; }
    setSubmitting(true);
    try {
      const payload = {
        licensePlate: form.licensePlate.trim().toUpperCase(),
        vehicleType: form.vehicleType,
        vehicleName: form.vehicleName.trim() || undefined,
        apartmentId,
      };
      if (editingVehicle) {
        await vehicleService.update(editingVehicle.vehicleId, payload);
        toast.success('Cập nhật phương tiện thành công!');
      } else {
        await vehicleService.create(payload);
        toast.success('Đăng ký phương tiện thành công!');
      }
      setShowModal(false);
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await vehicleService.delete(deleteTarget.vehicleId);
      toast.success('Xóa phương tiện thành công!');
      setDeleteTarget(null);
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  };

  const motorbikeCount = vehicles.filter(v => v.vehicleType === 'MOTORBIKE').length;
  const carCount = vehicles.filter(v => v.vehicleType === 'CAR').length;
  const otherCount = vehicles.filter(v => v.vehicleType !== 'MOTORBIKE' && v.vehicleType !== 'CAR').length;

  return (
    <div className="vhc" id="vehicle-page">
      {/* Header */}
      <div className="vhc__header">
        <div>
          <h2 className="vhc__title">Phương tiện của tôi</h2>
          <p className="vhc__subtitle">
            {apartmentInfo ? `Căn ${apartmentInfo.apartmentNumber} - Block ${apartmentInfo.block} - Tầng ${apartmentInfo.floor}` : 'Chưa gán căn hộ'}
          </p>
        </div>
        {apartmentId && (
          <button className="vhc__add-btn" onClick={openCreateModal} id="add-vehicle-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Đăng ký xe
          </button>
        )}
      </div>

      {/* Stats */}
      {vehicles.length > 0 && (
        <div className="vhc__stats">
          <div className="vhc__stat" style={{ background: '#ede9fe' }}>
            <span className="vhc__stat-icon">🏍️</span>
            <span className="vhc__stat-num" style={{ color: '#7c3aed' }}>{motorbikeCount}</span>
            <span className="vhc__stat-label">Xe máy</span>
          </div>
          <div className="vhc__stat" style={{ background: '#dbeafe' }}>
            <span className="vhc__stat-icon">🚗</span>
            <span className="vhc__stat-num" style={{ color: '#2563eb' }}>{carCount}</span>
            <span className="vhc__stat-label">Ô tô</span>
          </div>
          <div className="vhc__stat" style={{ background: '#d1fae5' }}>
            <span className="vhc__stat-icon">🚲</span>
            <span className="vhc__stat-num" style={{ color: '#059669' }}>{otherCount}</span>
            <span className="vhc__stat-label">Khác</span>
          </div>
        </div>
      )}

      {/* Vehicle List */}
      <div className="vhc__list">
        {loading ? (
          <div className="vhc__loading"><div className="vhc__spinner" /><p>Đang tải...</p></div>
        ) : !apartmentId ? (
          <div className="vhc__empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
              <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22V12h6v10" />
            </svg>
            <p>Bạn chưa được gán căn hộ, không thể quản lý phương tiện</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="vhc__empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
              <path d="M16 3H8l-4 6h16l-4-6z" /><rect x="2" y="9" width="20" height="8" rx="2" />
              <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
            </svg>
            <p>Chưa có phương tiện nào được đăng ký</p>
            <button className="vhc__add-btn" onClick={openCreateModal} style={{ marginTop: '1rem' }}>
              Đăng ký phương tiện đầu tiên
            </button>
          </div>
        ) : (
          <div className="vhc__grid">
            {vehicles.map((v) => {
              const tc = vehicleTypeColor[v.vehicleType] || { color: '#6b7280', bg: '#f3f4f6' };
              return (
                <div key={v.vehicleId} className="vhc__card">
                  <div className="vhc__card-top">
                    <span className="vhc__card-icon">{vehicleTypeIcon[v.vehicleType] || '🚗'}</span>
                    <div className="vhc__card-actions">
                      <button className="vhc__card-btn vhc__card-btn--edit" title="Sửa" onClick={() => openEditModal(v)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className="vhc__card-btn vhc__card-btn--delete" title="Xóa" onClick={() => setDeleteTarget(v)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="vhc__card-plate">{v.licensePlate}</div>
                  <div className="vhc__card-info">
                    <span className="vhc__card-badge" style={{ color: tc.color, backgroundColor: tc.bg }}>
                      {vehicleTypeLabel[v.vehicleType] || v.vehicleType}
                    </span>
                    {v.vehicleName && <span className="vhc__card-name">{v.vehicleName}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="vhc__overlay" onClick={() => setShowModal(false)}>
          <div className="vhc__modal" onClick={(e) => e.stopPropagation()}>
            <div className="vhc__modal-header">
              <h3>{editingVehicle ? 'Chỉnh sửa phương tiện' : 'Đăng ký phương tiện'}</h3>
              <button className="vhc__modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="vhc__modal-body">
              <div className="vhc__form-field">
                <label className="vhc__form-label">Biển số xe <span style={{color:'#ef4444'}}>*</span></label>
                <input className="vhc__form-input" value={form.licensePlate}
                  onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                  placeholder="VD: 59A1-12345" />
              </div>
              <div className="vhc__form-field">
                <label className="vhc__form-label">Loại xe</label>
                <div className="vhc__type-grid">
                  {VEHICLE_TYPES.map(t => (
                    <button key={t.value} type="button"
                      className={`vhc__type-btn ${form.vehicleType === t.value ? 'vhc__type-btn--active' : ''}`}
                      onClick={() => setForm({ ...form, vehicleType: t.value })}>
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="vhc__form-field">
                <label className="vhc__form-label">Tên / Mô tả xe</label>
                <input className="vhc__form-input" value={form.vehicleName}
                  onChange={(e) => setForm({ ...form, vehicleName: e.target.value })}
                  placeholder="VD: Honda Wave Alpha, Toyota Camry..." />
              </div>
              <div className="vhc__form-actions">
                <button className="vhc__form-cancel" onClick={() => setShowModal(false)} disabled={submitting}>Hủy</button>
                <button className="vhc__form-submit" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : editingVehicle ? 'Cập nhật' : 'Đăng ký'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="vhc__overlay" onClick={() => setDeleteTarget(null)}>
          <div className="vhc__modal vhc__modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="vhc__modal-header" style={{ borderColor: '#fee2e2' }}>
              <h3 style={{ color: '#dc2626' }}>Xác nhận xóa</h3>
              <button className="vhc__modal-close" onClick={() => setDeleteTarget(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="vhc__modal-body" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1rem', color: '#334155' }}>
                Bạn có chắc muốn xóa phương tiện <b>{deleteTarget.licensePlate}</b>?
              </p>
              <div className="vhc__form-actions" style={{ marginTop: '1.5rem' }}>
                <button className="vhc__form-cancel" onClick={() => setDeleteTarget(null)}>Hủy</button>
                <button className="vhc__form-submit" style={{ background: '#dc2626' }} onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
