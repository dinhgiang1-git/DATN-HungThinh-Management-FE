import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import vehicleService from '../services/vehicleService';
import apartmentService from '../services/apartmentService';
import { exportToExcel } from '../utils/exportExcel';

/* ─── constants ─── */
const VEHICLE_TYPES = [
  { value: 'MOTORBIKE', label: 'Xe máy', icon: '🏍️' },
  { value: 'CAR', label: 'Ô tô', icon: '🚗' },
  { value: 'BICYCLE', label: 'Xe đạp', icon: '🚲' },
  { value: 'ELECTRIC_BIKE', label: 'Xe đạp điện', icon: '🛵' },
];

const vehicleTypeLabel = { MOTORBIKE: 'Xe máy', CAR: 'Ô tô', BICYCLE: 'Xe đạp', ELECTRIC_BIKE: 'Xe đạp điện' };
const vehicleTypeIcon = { MOTORBIKE: '🏍️', CAR: '🚗', BICYCLE: '🚲', ELECTRIC_BIKE: '🛵' };
const vehicleTypeColor = {
  MOTORBIKE: { color: '#7c3aed', bg: '#ede9fe' },
  CAR: { color: '#2563eb', bg: '#dbeafe' },
  BICYCLE: { color: '#059669', bg: '#d1fae5' },
  ELECTRIC_BIKE: { color: '#d97706', bg: '#fef3c7' },
};

/* ──────────────────────────────────────────────
   Custom Dropdown Component (replace ugly <select>)
   ────────────────────────────────────────────── */
function Dropdown({ label, value, options, onChange, placeholder = 'Chọn...', width = 140 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div className="cdd" ref={ref} style={{ minWidth: width }}>
      {label && <span className="cdd__label">{label}</span>}
      <button type="button" className={`cdd__trigger ${open ? 'cdd__trigger--open' : ''} ${value ? 'cdd__trigger--active' : ''}`} onClick={() => setOpen(!open)}>
        <span className="cdd__trigger-text">{selected ? selected.label : placeholder}</span>
        <svg className="cdd__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="cdd__menu">
          <div className="cdd__option cdd__option--placeholder" onClick={() => { onChange(''); setOpen(false); }}>
            {placeholder}
          </div>
          {options.map(o => (
            <div key={o.value}
              className={`cdd__option ${String(o.value) === String(value) ? 'cdd__option--selected' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}>
              {o.icon && <span className="cdd__option-icon">{o.icon}</span>}
              <span>{o.label}</span>
              {String(o.value) === String(value) && (
                <svg className="cdd__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── icons ─── */
const Icons = {
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
};

export default function VehiclesPage() {
  /* ─── state ─── */
  const [allVehicles, setAllVehicles] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterBlock, setFilterBlock] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({ licensePlate: '', vehicleType: 'MOTORBIKE', vehicleName: '', apartmentId: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formFilterBlock, setFormFilterBlock] = useState('');
  const [formFilterFloor, setFormFilterFloor] = useState('');

  /* ─── fetch ─── */
  const fetchApartments = useCallback(async () => {
    try {
      const res = await apartmentService.getAll({ page: 0, size: 1000, sortBy: 'id', direction: 'asc' });
      setApartments(res.data?.data?.content || []);
    } catch { setApartments([]); }
  }, []);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vehicleService.getAll();
      setAllVehicles(res.data?.data || []);
    } catch (err) { toast.error('Không thể tải danh sách xe'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchApartments(); fetchVehicles(); }, [fetchApartments, fetchVehicles]);

  /* ─── derived ─── */
  const blocks = useMemo(() => [...new Set(apartments.map(a => a.block).filter(Boolean))].sort(), [apartments]);
  const floors = useMemo(() => {
    const list = apartments.filter(a => !filterBlock || a.block === filterBlock).map(a => a.floor).filter(f => f != null);
    return [...new Set(list)].sort((a, b) => a - b);
  }, [apartments, filterBlock]);

  const filteredVehicles = useMemo(() => {
    return allVehicles.filter(v => {
      if (filterBlock && v.block !== filterBlock) return false;
      if (filterFloor && String(v.floor) !== String(filterFloor)) return false;
      if (filterType && v.vehicleType !== filterType) return false;
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        return (v.licensePlate || '').toLowerCase().includes(kw) ||
          (v.vehicleName || '').toLowerCase().includes(kw) ||
          (v.apartmentNumber || '').toLowerCase().includes(kw);
      }
      return true;
    });
  }, [allVehicles, filterBlock, filterFloor, filterType, searchKeyword]);

  const motorbikeCount = filteredVehicles.filter(v => v.vehicleType === 'MOTORBIKE').length;
  const carCount = filteredVehicles.filter(v => v.vehicleType === 'CAR').length;
  const otherCount = filteredVehicles.length - motorbikeCount - carCount;

  const formApartments = useMemo(() => {
    return apartments.filter(a =>
      (!formFilterBlock || a.block === formFilterBlock) &&
      (!formFilterFloor || String(a.floor) === String(formFilterFloor))
    );
  }, [apartments, formFilterBlock, formFilterFloor]);

  /* ─── handlers ─── */
  const openCreateModal = () => {
    setModalMode('create'); setEditingVehicle(null);
    setFormData({ licensePlate: '', vehicleType: 'MOTORBIKE', vehicleName: '', apartmentId: '' });
    setFormFilterBlock(''); setFormFilterFloor(''); setFormErrors({}); setModalOpen(true);
  };

  const openEditModal = (v) => {
    setModalMode('edit'); setEditingVehicle(v);
    setFormData({ licensePlate: v.licensePlate || '', vehicleType: v.vehicleType || 'MOTORBIKE', vehicleName: v.vehicleName || '', apartmentId: String(v.apartmentId) });
    setFormFilterBlock(v.block || ''); setFormFilterFloor(v.floor != null ? String(v.floor) : '');
    setFormErrors({}); setModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.licensePlate.trim()) errors.licensePlate = 'Biển số không được để trống';
    if (!formData.apartmentId) errors.apartmentId = 'Vui lòng chọn căn hộ';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = { licensePlate: formData.licensePlate.trim(), vehicleType: formData.vehicleType, vehicleName: formData.vehicleName.trim() || undefined, apartmentId: Number(formData.apartmentId) };
      if (modalMode === 'create') await vehicleService.create(payload); else await vehicleService.update(editingVehicle.vehicleId, payload);
      toast.success(modalMode === 'create' ? 'Thêm xe thành công!' : 'Cập nhật xe thành công!');
      setModalOpen(false); fetchVehicles();
    } catch (err) { toast.error(err.response?.data?.message || 'Có lỗi xảy ra'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await vehicleService.delete(deleteTarget.vehicleId);
      toast.success('Xóa xe thành công!');
      setDeleteModalOpen(false); setDeleteTarget(null); fetchVehicles();
    } catch (err) { toast.error(err.response?.data?.message || 'Xóa thất bại'); }
    finally { setDeleting(false); }
  };

  const clearFilters = () => { setFilterBlock(''); setFilterFloor(''); setFilterType(''); setSearchKeyword(''); };
  const hasFilters = filterBlock || filterFloor || filterType || searchKeyword.trim();

  const handleExport = () => {
    const dataToExport = filteredVehicles.length > 0 ? filteredVehicles : allVehicles;
    if (dataToExport.length === 0) { toast.warning('Không có dữ liệu để xuất'); return; }
    exportToExcel(dataToExport, [
      { header: 'ID', key: 'vehicleId', width: 8 },
      { header: 'Biển số', key: 'licensePlate', width: 16 },
      { header: 'Loại xe', key: 'vehicleType', width: 14, transform: (v) => vehicleTypeLabel[v.vehicleType] || v.vehicleType },
      { header: 'Tên xe', key: 'vehicleName', width: 22 },
      { header: 'Căn hộ', key: 'apartmentNumber', width: 12 },
      { header: 'Block', key: 'block', width: 10 },
      { header: 'Tầng', key: 'floor', width: 8 },
    ], `phuong-tien_${new Date().toISOString().slice(0,10)}`, 'Phương tiện');
    toast.success('Xuất Excel thành công!');
  };

  /* ─── render ─── */
  return (
    <div className="page">
      {/* Header */}
      <div className="page__header">
        <div>
          <h2 className="page__title">Quản lý phương tiện</h2>
          <p className="page__desc">Tổng cộng {allVehicles.length} phương tiện đăng ký</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn--outline" onClick={handleExport}>
            <span className="btn__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg></span>
            Xuất Excel
          </button>
          <button className="btn btn--primary" onClick={openCreateModal}>
            <span className="btn__icon">{Icons.plus}</span>
            Thêm xe
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="vhc-stats">
        <div className="vhc-stats__card vhc-stats__card--motorbike">
          <span className="vhc-stats__icon">🏍️</span>
          <div className="vhc-stats__info">
            <span className="vhc-stats__num">{motorbikeCount}</span>
            <span className="vhc-stats__label">Xe máy</span>
          </div>
        </div>
        <div className="vhc-stats__card vhc-stats__card--car">
          <span className="vhc-stats__icon">🚗</span>
          <div className="vhc-stats__info">
            <span className="vhc-stats__num">{carCount}</span>
            <span className="vhc-stats__label">Ô tô</span>
          </div>
        </div>
        <div className="vhc-stats__card vhc-stats__card--other">
          <span className="vhc-stats__icon">🚲</span>
          <div className="vhc-stats__info">
            <span className="vhc-stats__num">{otherCount}</span>
            <span className="vhc-stats__label">Khác</span>
          </div>
        </div>
        <div className="vhc-stats__card vhc-stats__card--total">
          <span className="vhc-stats__icon">📊</span>
          <div className="vhc-stats__info">
            <span className="vhc-stats__num">{filteredVehicles.length}</span>
            <span className="vhc-stats__label">Hiển thị</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="page__filters">
        <div className="filter-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Dropdown placeholder="Tất cả tòa" value={filterBlock}
            options={blocks.map(b => ({ value: b, label: `Block ${b}` }))}
            onChange={(v) => { setFilterBlock(v); setFilterFloor(''); }} width={130} />
          <Dropdown placeholder="Tất cả tầng" value={filterFloor}
            options={floors.map(f => ({ value: String(f), label: `Tầng ${f}` }))}
            onChange={setFilterFloor} width={130} />
          <Dropdown placeholder="Tất cả loại xe" value={filterType}
            options={VEHICLE_TYPES.map(t => ({ value: t.value, label: t.label, icon: t.icon }))}
            onChange={setFilterType} width={155} />
          {hasFilters && (
            <button className="btn btn--ghost btn--sm" onClick={clearFilters}
              style={{ fontSize: '0.78rem', color: '#ef4444', gap: 4 }}>
              ✕ Xóa lọc
            </button>
          )}
        </div>
        <div className="filter-actions">
          <div className="search-box">
            <span className="search-box__icon">{Icons.search}</span>
            <input type="text" className="search-input" placeholder="Tìm biển số, tên xe, căn hộ..."
              value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} />
          </div>
          <button className="btn btn--ghost btn--sm" onClick={fetchVehicles} title="Làm mới">
            <span className="btn__icon">{Icons.refresh}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="page__table-wrapper">
        {loading ? (
          <div className="page__loading"><div className="spinner" /><span>Đang tải...</span></div>
        ) : filteredVehicles.length === 0 ? (
          <div className="page__empty"><p>{hasFilters ? 'Không tìm thấy phương tiện phù hợp' : 'Chưa có phương tiện nào'}</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="data-table__th--id">ID</th>
                <th>Biển số</th>
                <th>Loại xe</th>
                <th>Tên xe</th>
                <th>Căn hộ</th>
                <th>Block</th>
                <th>Tầng</th>
                <th className="data-table__th--actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v) => {
                const tc = vehicleTypeColor[v.vehicleType] || { color: '#6b7280', bg: '#f3f4f6' };
                return (
                  <tr key={v.vehicleId}>
                    <td className="data-table__cell--id">{v.vehicleId}</td>
                    <td className="data-table__cell--bold">{v.licensePlate}</td>
                    <td>
                      <span className="badge" style={{ color: tc.color, backgroundColor: tc.bg }}>
                        {vehicleTypeIcon[v.vehicleType] || ''} {vehicleTypeLabel[v.vehicleType] || v.vehicleType}
                      </span>
                    </td>
                    <td>{v.vehicleName || '—'}</td>
                    <td className="data-table__cell--bold">{v.apartmentNumber || '—'}</td>
                    <td>{v.block || '—'}</td>
                    <td>{v.floor ?? '—'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn action-btn--edit" title="Sửa" onClick={() => openEditModal(v)}>{Icons.edit}</button>
                        <button className="action-btn action-btn--delete" title="Xóa"
                          onClick={() => { setDeleteTarget(v); setDeleteModalOpen(true); }}>{Icons.trash}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{modalMode === 'create' ? 'Thêm xe mới' : 'Chỉnh sửa xe'}</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>{Icons.close}</button>
            </div>
            <form onSubmit={handleSubmit} className="modal__body">
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Biển số <span className="form-required">*</span></label>
                  <input className={`form-input ${formErrors.licensePlate ? 'form-input--error' : ''}`}
                    value={formData.licensePlate}
                    onChange={(e) => setFormData(p => ({ ...p, licensePlate: e.target.value }))}
                    placeholder="VD: 59A1-12345" />
                  {formErrors.licensePlate && <span className="form-error">{formErrors.licensePlate}</span>}
                </div>
                <div className="form-field">
                  <label className="form-label">Loại xe</label>
                  <select className="form-select" value={formData.vehicleType}
                    onChange={(e) => setFormData(p => ({ ...p, vehicleType: e.target.value }))}>
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Tên xe</label>
                  <input className="form-input" value={formData.vehicleName}
                    onChange={(e) => setFormData(p => ({ ...p, vehicleName: e.target.value }))}
                    placeholder="VD: Honda Wave, Toyota Camry..." />
                </div>
                <div className="form-field">
                  <label className="form-label">Căn hộ <span className="form-required">*</span></label>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <select className="form-select" value={formFilterBlock}
                      onChange={(e) => { setFormFilterBlock(e.target.value); setFormFilterFloor(''); setFormData(p => ({ ...p, apartmentId: '' })); }}
                      style={{ flex: 1 }}>
                      <option value="">Tòa</option>
                      {[...new Set(apartments.map(a => a.block).filter(Boolean))].sort().map(b => (
                        <option key={b} value={b}>Block {b}</option>
                      ))}
                    </select>
                    <select className="form-select" value={formFilterFloor}
                      onChange={(e) => { setFormFilterFloor(e.target.value); setFormData(p => ({ ...p, apartmentId: '' })); }}
                      style={{ flex: 1 }}>
                      <option value="">Tầng</option>
                      {[...new Set(apartments.filter(a => !formFilterBlock || a.block === formFilterBlock).map(a => a.floor).filter(f => f != null))].sort((a, b) => a - b).map(f => (
                        <option key={f} value={f}>Tầng {f}</option>
                      ))}
                    </select>
                  </div>
                  <select className={`form-select ${formErrors.apartmentId ? 'form-input--error' : ''}`}
                    value={formData.apartmentId}
                    onChange={(e) => setFormData(p => ({ ...p, apartmentId: e.target.value }))}>
                    <option value="">-- Chọn căn hộ --</option>
                    {formApartments.map((apt) => (
                      <option key={apt.id} value={apt.id}>
                        {apt.apartmentNumber} - Tầng {apt.floor}{apt.block ? ` Block ${apt.block}` : ''}
                      </option>
                    ))}
                  </select>
                  {formErrors.apartmentId && <span className="form-error">{formErrors.apartmentId}</span>}
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : modalMode === 'create' ? 'Thêm xe' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal__header">
              <h3 className="modal__title" style={{ color: '#dc2626' }}>Xác nhận xóa</h3>
              <button className="modal__close" onClick={() => setDeleteModalOpen(false)}>{Icons.close}</button>
            </div>
            <div className="modal__body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{vehicleTypeIcon[deleteTarget.vehicleType] || '🚗'}</div>
              <p style={{ fontSize: '0.95rem', color: '#334155' }}>Bạn có chắc muốn xóa phương tiện</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0.5rem 0' }}>{deleteTarget.licensePlate}</p>
              <p style={{ fontSize: '0.82rem', color: '#6b7280' }}>Căn hộ {deleteTarget.apartmentNumber}</p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setDeleteModalOpen(false)}>Hủy</button>
              <button className="btn" style={{ background: '#dc2626', color: '#fff' }}
                onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Đang xóa...' : 'Xóa xe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
