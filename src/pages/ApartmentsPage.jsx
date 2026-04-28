import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import apartmentService from '../services/apartmentService';
import residentService from '../services/residentService';

/* ─── constants ─── */
const STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'OCCUPIED', label: 'Đang ở' },
  { value: 'VACANT', label: 'Trống' },
  { value: 'UNDER_MAINTENANCE', label: 'Đang bảo trì' },
];

const statusLabel = {
  OCCUPIED: 'Đang ở',
  VACANT: 'Trống',
  UNDER_MAINTENANCE: 'Đang bảo trì',
};

const statusColor = {
  OCCUPIED: { color: '#059669', bg: '#d1fae5' },
  VACANT: { color: '#2563eb', bg: '#dbeafe' },
  UNDER_MAINTENANCE: { color: '#d97706', bg: '#fef3c7' },
};

const relationshipLabel = {
  OWNER: 'Chủ hộ',
  SPOUSE: 'Vợ / chồng',
  CHILD: 'Con',
  PARENT: 'Cha / mẹ',
  RELATIVE: 'Người thân',
  TENANT: 'Người thuê',
  OTHER: 'Khác',
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
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
};

export default function ApartmentsPage() {
  /* ─── state ─── */
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [blockDropOpen, setBlockDropOpen] = useState(false);
  const [floorDropOpen, setFloorDropOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = () => { setBlockDropOpen(false); setFloorDropOpen(false); };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  const [sortDirection, setSortDirection] = useState('asc');
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

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [formData, setFormData] = useState({
    apartmentNumber: '',
    block: '',
    floor: '',
    area: '',
    apartmentStatus: 'VACANT',
    ownerId: '',
    residentIds: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [residentSearchKeyword, setResidentSearchKeyword] = useState('');
  const [residentFilterTab, setResidentFilterTab] = useState('owner');

  // Available owners & residents (without apartment)
  const [availableOwners, setAvailableOwners] = useState([]);
  const [availableResidents, setAvailableResidents] = useState([]);

  // Delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ─── fetch ─── */
  const fetchApartments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: PAGE_SIZE,
        sortBy: 'id',
        direction: sortDirection,
      };
      if (filterStatus) params.apartmentStatus = filterStatus;
      if (filterBlock) params.block = filterBlock;
      if (filterFloor) params.floor = Number(filterFloor);
      if (searchKeyword.trim()) params.keyword = searchKeyword.trim();

      const res = await apartmentService.getAll(params);
      const data = res.data?.data;
      setApartments(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      toast.error('Không thể tải danh sách căn hộ');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterBlock, filterFloor, sortDirection, searchKeyword]);

  // Dynamic filter options (fetched from all apartments)
  const [allBlocks, setAllBlocks] = useState([]);
  const [allFloors, setAllFloors] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apartmentService.getAll({ page: 0, size: 999 });
        const all = res.data?.data?.content || [];
        const blocks = [...new Set(all.map((a) => a.block).filter(Boolean))].sort();
        const floors = [...new Set(all.map((a) => a.floor).filter((f) => f != null))].sort((a, b) => a - b);
        setAllBlocks(blocks);
        setAllFloors(floors);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);

  // Fetch available owners (OWNER + chưa thuộc căn hộ nào)
  const fetchAvailableOwners = async (currentOwnerId) => {
    try {
      const res = await residentService.getAll({
        page: 0, size: 1000, sortBy: 'id', direction: 'asc',
        relationshipType: 'OWNER', hasApartment: false,
      });
      let owners = res.data?.data?.content || [];
      // Khi edit: thêm owner hiện tại vào list nếu chưa có
      if (currentOwnerId && !owners.find((o) => o.id === currentOwnerId)) {
        try {
          const ownerRes = await residentService.getById(currentOwnerId);
          if (ownerRes.data?.data) owners = [ownerRes.data.data, ...owners];
        } catch { /* ignore */ }
      }
      setAvailableOwners(owners);
    } catch {
      setAvailableOwners([]);
    }
  };

  // Fetch available residents (chưa thuộc căn hộ nào)
  const fetchAvailableResidents = async (currentResidentIds = []) => {
    try {
      const res = await residentService.getAll({
        page: 0, size: 1000, sortBy: 'id', direction: 'asc',
        hasApartment: false,
      });
      let residents = res.data?.data?.content || [];
      // Khi edit: thêm residents hiện tại vào list nếu chưa có
      if (currentResidentIds.length > 0) {
        const existingIds = residents.map((r) => r.id);
        for (const id of currentResidentIds) {
          if (!existingIds.includes(id)) {
            try {
              const rRes = await residentService.getById(id);
              if (rRes.data?.data) residents.push(rRes.data.data);
            } catch { /* ignore */ }
          }
        }
      }
      setAvailableResidents(residents);
    } catch {
      setAvailableResidents([]);
    }
  };

  /* ─── handlers ─── */
  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setPage(0);
  };

  const handleToggleSort = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setPage(0);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedApartment(null);
    setFormData({
      apartmentNumber: '',
      block: '',
      floor: '',
      area: '',
      apartmentStatus: 'VACANT',
      ownerId: '',
      tenantId: '',
      residentIds: [],
    });
    setFormErrors({});
    setResidentSearchKeyword('');
    setResidentFilterTab('owner');
    fetchAvailableOwners();
    fetchAvailableResidents();
    setModalOpen(true);
  };

  const openEditModal = (apt) => {
    setModalMode('edit');
    setSelectedApartment(apt);
    // Find TENANT resident
    const tenantResident = (apt.residents || []).find((r) => r.relationshipType === 'TENANT');
    // Filter out null/undefined IDs and also exclude the ownerId and tenantId from the regular resident list
    const currentResidentIds = (apt.residents || [])
      .map((r) => r.id)
      .filter((id) => id != null && id !== apt.ownerId && id !== (tenantResident?.id));

    setFormData({
      apartmentNumber: apt.apartmentNumber || '',
      block: apt.block || '',
      floor: apt.floor ?? '',
      area: apt.area ?? '',
      apartmentStatus: apt.apartmentStatus || 'VACANT',
      ownerId: apt.ownerId ?? '',
      tenantId: tenantResident?.id ?? '',
      residentIds: currentResidentIds,
    });
    setFormErrors({});
    setResidentSearchKeyword('');
    setResidentFilterTab('owner');
    fetchAvailableOwners(apt.ownerId);
    fetchAvailableResidents(currentResidentIds);
    setModalOpen(true);
  };

  const openViewModal = (apt) => {
    setModalMode('view');
    setSelectedApartment(apt);
    setModalOpen(true);
  };

  const openDeleteModal = (apt) => {
    setDeleteTarget(apt);
    setDeleteModalOpen(true);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleResidentToggle = (residentId) => {
    setFormData((prev) => {
      const ids = prev.residentIds.includes(residentId)
        ? prev.residentIds.filter((id) => id !== residentId)
        : [...prev.residentIds, residentId];
      return { ...prev, residentIds: ids };
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.apartmentNumber.trim()) errors.apartmentNumber = 'Vui lòng nhập số căn hộ';
    if (formData.floor === '' || formData.floor === null) errors.floor = 'Vui lòng nhập tầng';
    if (formData.area === '' || formData.area === null) errors.area = 'Vui lòng nhập diện tích';
    if (!formData.apartmentStatus) errors.apartmentStatus = 'Vui lòng chọn trạng thái';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);

    try {
      const finalOwnerId = formData.ownerId ? Number(formData.ownerId) : undefined;
      const finalTenantId = formData.tenantId ? Number(formData.tenantId) : undefined;
      // Ensure no null/empty IDs and the owner/tenant is not duplicated in residentIds
      const validResidentIds = [
        ...formData.residentIds.filter((id) => id != null && id !== finalOwnerId && id !== finalTenantId),
        ...(finalTenantId ? [finalTenantId] : []),
      ];

      const payload = {
        apartmentNumber: formData.apartmentNumber,
        block: formData.block || undefined,
        floor: Number(formData.floor),
        area: Number(formData.area),
        apartmentStatus: formData.apartmentStatus,
        ownerId: finalOwnerId,
        residentIds: validResidentIds.length > 0 ? validResidentIds : undefined,
      };

      let res;
      if (modalMode === 'create') {
        res = await apartmentService.create(payload);
      } else {
        res = await apartmentService.update(selectedApartment.id, payload);
      }

      if (res.data?.status) {
        toast.success(modalMode === 'create' ? 'Tạo căn hộ thành công!' : 'Cập nhật căn hộ thành công!');
        setModalOpen(false);
        fetchApartments();
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
      const res = await apartmentService.delete(deleteTarget.id);
      if (res.data?.status !== false) {
        toast.success('Xóa căn hộ thành công!');
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        if (apartments.length === 1 && page > 0) setPage((p) => p - 1);
        else fetchApartments();
      } else {
        toast.error(res.data?.message || 'Xóa thất bại');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  };

  /* ─── render ─── */
  return (
    <div className="page">
      {/* Page header */}
      <div className="page__header">
        <div>
          <h2 className="page__title">Quản lý căn hộ</h2>
          <p className="page__desc">Quản lý thông tin căn hộ trong chung cư ({totalElements} căn hộ)</p>
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <span className="btn__icon">{Icons.plus}</span>
          Thêm căn hộ
        </button>
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
        <div className="filter-group" style={{ position: 'relative' }}>
          <label className="filter-label">Tòa:</label>
          <button
            className={`filter-tab ${filterBlock ? 'filter-tab--active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setBlockDropOpen(!blockDropOpen); setFloorDropOpen(false); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {filterBlock || 'Tất cả'}
            <svg style={{ width: 12, height: 12, transform: blockDropOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {blockDropOpen && (
            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
              <div
                className={`filter-dropdown__item ${filterBlock === '' ? 'filter-dropdown__item--active' : ''}`}
                onClick={() => { setFilterBlock(''); setPage(0); setBlockDropOpen(false); }}
              >Tất cả</div>
              {allBlocks.map((b) => (
                <div
                  key={b}
                  className={`filter-dropdown__item ${filterBlock === b ? 'filter-dropdown__item--active' : ''}`}
                  onClick={() => { setFilterBlock(b); setPage(0); setBlockDropOpen(false); }}
                >Tòa {b}</div>
              ))}
            </div>
          )}
        </div>
        <div className="filter-group" style={{ position: 'relative' }}>
          <label className="filter-label">Tầng:</label>
          <button
            className={`filter-tab ${filterFloor ? 'filter-tab--active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setFloorDropOpen(!floorDropOpen); setBlockDropOpen(false); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {filterFloor ? `Tầng ${filterFloor}` : 'Tất cả'}
            <svg style={{ width: 12, height: 12, transform: floorDropOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {floorDropOpen && (
            <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
              <div
                className={`filter-dropdown__item ${filterFloor === '' ? 'filter-dropdown__item--active' : ''}`}
                onClick={() => { setFilterFloor(''); setPage(0); setFloorDropOpen(false); }}
              >Tất cả</div>
              {allFloors.map((f) => (
                <div
                  key={f}
                  className={`filter-dropdown__item ${filterFloor === String(f) ? 'filter-dropdown__item--active' : ''}`}
                  onClick={() => { setFilterFloor(String(f)); setPage(0); setFloorDropOpen(false); }}
                >Tầng {f}</div>
              ))}
            </div>
          )}
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
          <button className="btn btn--ghost btn--sm" onClick={handleToggleSort} title="Đổi thứ tự sắp xếp">
            {sortDirection === 'asc' ? '↑ Tăng dần' : '↓ Giảm dần'}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={fetchApartments} title="Làm mới">
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
        ) : apartments.length === 0 ? (
          <div className="page__empty">
            <p>Không tìm thấy căn hộ nào</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="data-table__th--id">ID</th>
                <th>Số căn hộ</th>
                <th>Block</th>
                <th>Tầng</th>
                <th>Diện tích (m²)</th>
                <th>Chủ hộ</th>
                <th>Trạng thái</th>
                <th className="data-table__th--actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {apartments.map((apt) => {
                const sc = statusColor[apt.apartmentStatus] || { color: '#6b7280', bg: '#f3f4f6' };
                return (
                  <tr key={apt.id}>
                    <td className="data-table__cell--id">{apt.id}</td>
                    <td className="data-table__cell--bold">{apt.apartmentNumber}</td>
                    <td>{apt.block || '—'}</td>
                    <td>{apt.floor ?? '—'}</td>
                    <td>{apt.area ? `${apt.area} m²` : '—'}</td>
                    <td>
                      {(() => {
                        const owner = apt.ownerId && apt.residents
                          ? apt.residents.find((r) => r.residentId === apt.ownerId)
                          : null;
                        return owner
                          ? <span className="resident-chip">{owner.fullName}</span>
                          : <span className="text-muted">Chưa có</span>;
                      })()}
                    </td>
                    <td>
                      <span className="badge" style={{ color: sc.color, backgroundColor: sc.bg }}>
                        {statusLabel[apt.apartmentStatus] || apt.apartmentStatus}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn action-btn--view" title="Xem" onClick={() => openViewModal(apt)}>
                          {Icons.eye}
                        </button>
                        <button className="action-btn action-btn--edit" title="Sửa" onClick={() => openEditModal(apt)}>
                          {Icons.edit}
                        </button>
                        <button className="action-btn action-btn--delete" title="Xóa" onClick={() => openDeleteModal(apt)}>
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

      {/* Create / Edit Modal */}
      {modalOpen && (modalMode === 'create' || modalMode === 'edit') && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">
                {modalMode === 'create' ? 'Thêm căn hộ mới' : 'Chỉnh sửa căn hộ'}
              </h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                {Icons.close}
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal__body">
              <div className="form-grid">
                {/* Apartment Number */}
                <div className="form-field">
                  <label className="form-label">
                    Số căn hộ <span className="form-required">*</span>
                  </label>
                  <input
                    className={`form-input ${formErrors.apartmentNumber ? 'form-input--error' : ''}`}
                    value={formData.apartmentNumber}
                    onChange={(e) => handleFormChange('apartmentNumber', e.target.value)}
                    placeholder="VD: A101, B205..."
                  />
                  {formErrors.apartmentNumber && <span className="form-error">{formErrors.apartmentNumber}</span>}
                </div>

                {/* Block */}
                <div className="form-field">
                  <label className="form-label">Block</label>
                  <input
                    className="form-input"
                    value={formData.block}
                    onChange={(e) => handleFormChange('block', e.target.value)}
                    placeholder="VD: A, B, C..."
                  />
                </div>

                {/* Floor */}
                <div className="form-field">
                  <label className="form-label">
                    Tầng <span className="form-required">*</span>
                  </label>
                  <input
                    type="number"
                    className={`form-input ${formErrors.floor ? 'form-input--error' : ''}`}
                    value={formData.floor}
                    onChange={(e) => handleFormChange('floor', e.target.value)}
                    placeholder="Nhập số tầng"
                    min="0"
                  />
                  {formErrors.floor && <span className="form-error">{formErrors.floor}</span>}
                </div>

                {/* Area */}
                <div className="form-field">
                  <label className="form-label">
                    Diện tích (m²) <span className="form-required">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className={`form-input ${formErrors.area ? 'form-input--error' : ''}`}
                    value={formData.area}
                    onChange={(e) => handleFormChange('area', e.target.value)}
                    placeholder="VD: 65.5"
                    min="0"
                  />
                  {formErrors.area && <span className="form-error">{formErrors.area}</span>}
                </div>

                {/* Status */}
                <div className="form-field">
                  <label className="form-label">
                    Trạng thái <span className="form-required">*</span>
                  </label>
                  <select
                    className={`form-select ${formErrors.apartmentStatus ? 'form-input--error' : ''}`}
                    value={formData.apartmentStatus}
                    onChange={(e) => handleFormChange('apartmentStatus', e.target.value)}
                  >
                    <option value="VACANT">Trống</option>
                    <option value="OCCUPIED">Đang ở</option>
                    <option value="UNDER_MAINTENANCE">Đang bảo trì</option>
                  </select>
                  {formErrors.apartmentStatus && <span className="form-error">{formErrors.apartmentStatus}</span>}
                </div>
              </div>

              {/* Resident selection with tabs */}
              <div className="form-field" style={{ marginTop: 16 }}>
                <label className="form-label">Chọn cư dân</label>
                {/* Filter tabs */}
                <div className="resident-select__tabs">
                  <button
                    type="button"
                    className={`resident-select__tab ${residentFilterTab === 'owner' ? 'resident-select__tab--active' : ''}`}
                    onClick={() => { setResidentFilterTab('owner'); setResidentSearchKeyword(''); }}
                  >
                    Chủ hộ {formData.ownerId ? '(1)' : ''}
                  </button>
                  <button
                    type="button"
                    className={`resident-select__tab ${residentFilterTab === 'resident' ? 'resident-select__tab--active' : ''}`}
                    onClick={() => { setResidentFilterTab('resident'); setResidentSearchKeyword(''); }}
                  >
                    Cư dân {(() => {
                      const count = formData.residentIds.filter(id =>
                        !availableResidents.find(r => r.id === id && r.relationship === 'TENANT')
                      ).length;
                      return count > 0 ? `(${count})` : '';
                    })()}
                  </button>
                  <button
                    type="button"
                    className={`resident-select__tab ${residentFilterTab === 'tenant' ? 'resident-select__tab--active' : ''}`}
                    onClick={() => { setResidentFilterTab('tenant'); setResidentSearchKeyword(''); }}
                  >
                    Người thuê {formData.tenantId ? '(1)' : ''}
                  </button>
                </div>
                <div className="resident-select">
                  {/* Search box */}
                  <div className="resident-select__search">
                    <span className="resident-select__search-icon">{Icons.search}</span>
                    <input
                      type="text"
                      className="resident-select__search-input"
                      placeholder={
                        residentFilterTab === 'owner' ? 'Tìm kiếm chủ hộ...'
                          : residentFilterTab === 'tenant' ? 'Tìm kiếm người thuê...'
                          : 'Tìm kiếm cư dân...'
                      }
                      value={residentSearchKeyword}
                      onChange={(e) => setResidentSearchKeyword(e.target.value)}
                    />
                    {residentSearchKeyword && (
                      <button
                        type="button"
                        className="resident-select__search-clear"
                        onClick={() => setResidentSearchKeyword('')}
                      >
                        {Icons.close}
                      </button>
                    )}
                  </div>
                  {(() => {
                    const keyword = residentSearchKeyword.trim().toLowerCase();
                    // Lọc theo tab: owner = OWNER, tenant = TENANT, resident = không phải OWNER và TENANT
                    const sourceList = residentFilterTab === 'owner'
                      ? availableOwners
                      : residentFilterTab === 'tenant'
                        ? availableResidents.filter((r) => r.relationship === 'TENANT')
                        : availableResidents.filter((r) => r.relationship !== 'OWNER' && r.relationship !== 'TENANT');

                    const filtered = keyword
                      ? sourceList.filter((r) => {
                          const name = (r.fullName || r.userName || '').toLowerCase();
                          const phone = (r.phoneNumber || '').toLowerCase();
                          const email = (r.email || '').toLowerCase();
                          return name.includes(keyword) || phone.includes(keyword) || email.includes(keyword);
                        })
                      : sourceList;

                    if (sourceList.length === 0) {
                      return (
                        <p className="resident-select__empty">
                          {residentFilterTab === 'owner' ? 'Không có chủ hộ khả dụng'
                            : residentFilterTab === 'tenant' ? 'Không có người thuê khả dụng'
                            : 'Không có cư dân khả dụng'}
                        </p>
                      );
                    }
                    if (filtered.length === 0) {
                      return <p className="resident-select__empty">Không tìm thấy kết quả phù hợp</p>;
                    }

                    if (residentFilterTab === 'owner') {
                      // Radio buttons cho chủ hộ
                      return (
                        <div className="resident-select__grid">
                          {filtered.map((r) => {
                            const selected = Number(formData.ownerId) === r.id;
                            return (
                              <label
                                key={r.id}
                                className={`resident-select__item ${selected ? 'resident-select__item--active' : ''}`}
                              >
                                <input
                                  type="radio"
                                  name="ownerId"
                                  checked={selected}
                                  onChange={() => handleFormChange('ownerId', r.id)}
                                  className="resident-select__checkbox"
                                />
                                <div className="resident-select__info">
                                  <span className="resident-select__name">
                                    {r.fullName || r.userName}
                                    <span className="resident-select__owner-badge">Chủ hộ</span>
                                  </span>
                                  <span className="resident-select__sub">
                                    {r.phoneNumber || r.email || ''}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      );
                    } else if (residentFilterTab === 'tenant') {
                      // Radio buttons cho người thuê (chọn 1)
                      return (
                        <div className="resident-select__grid">
                          {filtered.map((r) => {
                            const selected = Number(formData.tenantId) === r.id;
                            return (
                              <label
                                key={r.id}
                                className={`resident-select__item ${selected ? 'resident-select__item--active' : ''}`}
                              >
                                <input
                                  type="radio"
                                  name="tenantId"
                                  checked={selected}
                                  onChange={() => handleFormChange('tenantId', r.id)}
                                  className="resident-select__checkbox"
                                />
                                <div className="resident-select__info">
                                  <span className="resident-select__name">
                                    {r.fullName || r.userName}
                                    <span className="resident-select__owner-badge" style={{ color: '#2563eb', background: '#dbeafe' }}>Người thuê</span>
                                  </span>
                                  <span className="resident-select__sub">
                                    {r.phoneNumber || r.email || ''}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      );
                    } else {
                      // Checkboxes cho cư dân
                      return (
                        <div className="resident-select__grid">
                          {filtered.map((r) => {
                            const checked = formData.residentIds.includes(r.id);
                            return (
                              <label
                                key={r.id}
                                className={`resident-select__item ${checked ? 'resident-select__item--active' : ''}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => handleResidentToggle(r.id)}
                                  className="resident-select__checkbox"
                                />
                                <div className="resident-select__info">
                                  <span className="resident-select__name">
                                    {r.fullName || r.userName}
                                    {r.relationship && (
                                      <span className="resident-select__owner-badge">
                                        {relationshipLabel[r.relationship] || r.relationship}
                                      </span>
                                    )}
                                  </span>
                                  <span className="resident-select__sub">
                                    {r.phoneNumber || r.email || ''}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : modalMode === 'create' ? 'Tạo mới' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {modalOpen && modalMode === 'view' && selectedApartment && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Chi tiết căn hộ</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                {Icons.close}
              </button>
            </div>
            <div className="modal__body">
              {/* Basic info - 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <div className="detail-item">
                  <span className="detail-label">ID</span>
                  <span className="detail-value">{selectedApartment.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Số căn hộ</span>
                  <span className="detail-value detail-value--bold">{selectedApartment.apartmentNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Block</span>
                  <span className="detail-value">{selectedApartment.block || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tầng</span>
                  <span className="detail-value">{selectedApartment.floor ?? '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Diện tích</span>
                  <span className="detail-value">{selectedApartment.area ? `${selectedApartment.area} m²` : '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Trạng thái</span>
                  <span className="detail-value">
                    <span
                      className="badge"
                      style={{
                        color: statusColor[selectedApartment.apartmentStatus]?.color || '#6b7280',
                        backgroundColor: statusColor[selectedApartment.apartmentStatus]?.bg || '#f3f4f6',
                      }}
                    >
                      {statusLabel[selectedApartment.apartmentStatus] || selectedApartment.apartmentStatus}
                    </span>
                  </span>
                </div>
              </div>

              {/* Chủ hộ & Người thuê in detail */}
              <div className="detail-section">
                <h4 className="detail-section__title">Chủ hộ & Người thuê</h4>
                {(() => {
                  const owner = selectedApartment.ownerId && selectedApartment.residents
                    ? selectedApartment.residents.find((r) => r.residentId === selectedApartment.ownerId)
                    : null;
                  const tenant = (selectedApartment.residents || []).find(
                    (r) => r.relationshipType === 'TENANT' && r.residentId !== selectedApartment.ownerId
                  );
                  return (
                    <>
                      {owner ? (
                        <div className="detail-resident-card">
                          <div className="detail-resident-card__avatar">
                            {owner.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="detail-resident-card__info">
                            <span className="detail-resident-card__name">
                              {owner.fullName}
                              <span className="resident-select__owner-badge">Chủ hộ</span>
                            </span>
                            <span className="detail-resident-card__sub">
                              {owner.phone || owner.phoneNumber || owner.email || '—'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="detail-section__empty">Chưa gán chủ hộ</p>
                      )}
                      {tenant ? (
                        <div className="detail-resident-card" style={{ marginTop: 8 }}>
                          <div className="detail-resident-card__avatar" style={{ background: '#dbeafe', color: '#2563eb' }}>
                            {tenant.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="detail-resident-card__info">
                            <span className="detail-resident-card__name">
                              {tenant.fullName}
                              <span className="resident-select__owner-badge" style={{ color: '#2563eb', background: '#dbeafe' }}>Người thuê</span>
                            </span>
                            <span className="detail-resident-card__sub">
                              {tenant.phone || tenant.phoneNumber || tenant.email || '—'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="detail-section__empty" style={{ marginTop: 8 }}>Chưa có người thuê</p>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Residents list in detail */}
              <div className="detail-section">
                {(() => {
                  const viewResidents = (selectedApartment.residents || []).filter(
                    (r) => r.residentId !== selectedApartment.ownerId && r.relationshipType !== 'TENANT'
                  );
                  return (
                    <>
                      <h4 className="detail-section__title">
                        Danh sách cư dân ({viewResidents.length})
                      </h4>
                      {viewResidents.length > 0 ? (
                        <div className="detail-residents">
                          {viewResidents.map((r) => (
                            <div key={r.residentId || r.id} className="detail-resident-card">
                              <div className="detail-resident-card__avatar">
                                {(r.fullName || r.userName || '?').charAt(0).toUpperCase()}
                              </div>
                              <div className="detail-resident-card__info">
                                <span className="detail-resident-card__name">
                                  {r.fullName || r.userName}
                                  {r.relationshipType && (
                                    <span className="resident-select__owner-badge">
                                      {relationshipLabel[r.relationshipType] || r.relationshipType}
                                    </span>
                                  )}
                                </span>
                                <span className="detail-resident-card__sub">
                                  {r.phone || r.phoneNumber || r.email || '—'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="detail-section__empty">Chưa có cư dân nào</p>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Contracts list in detail */}
              <div className="detail-section">
                {(() => {
                  const contracts = selectedApartment.contracts || [];
                  const contractTypeLabel = { RENT: 'Thuê', PURCHASE: 'Mua bán', SERVICE: 'Dịch vụ' };
                  const contractTypeColor = { RENT: { color: '#2563eb', bg: '#dbeafe' }, PURCHASE: { color: '#7c3aed', bg: '#ede9fe' }, SERVICE: { color: '#0891b2', bg: '#cffafe' } };
                  const contractStatusLabel = { ACTIVE: 'Đang hiệu lực', EXPIRED: 'Hết hạn', TERMINATED: 'Đã chấm dứt' };
                  const contractStatusColor = { ACTIVE: { color: '#059669', bg: '#d1fae5' }, EXPIRED: { color: '#d97706', bg: '#fef3c7' }, TERMINATED: { color: '#dc2626', bg: '#fee2e2' } };
                  const fmtDate = (d) => {
                    if (!d) return '—';
                    if (Array.isArray(d)) { const [y, m, dd] = d; return `${String(dd).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`; }
                    return d;
                  };
                  const handleDownloadContract = async (contract) => {
                    try {
                      const contractService = (await import('../services/contractService')).default;
                      const res = await contractService.download(contract.contractId);
                      const url = window.URL.createObjectURL(new Blob([res.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', contract.originalFileName || 'contract.docx');
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                      toast.success('Tải file thành công!');
                    } catch {
                      toast.error('Không thể tải file hợp đồng');
                    }
                  };
                  return (
                    <>
                      <h4 className="detail-section__title">
                        Hợp đồng ({contracts.length})
                      </h4>
                      {contracts.length > 0 ? (
                        <div className="detail-residents">
                          {contracts.map((c) => {
                            const tc = contractTypeColor[c.contractType] || { color: '#6b7280', bg: '#f3f4f6' };
                            const sc = contractStatusColor[c.contractStatus] || { color: '#6b7280', bg: '#f3f4f6' };
                            return (
                              <div key={c.contractId} className="detail-resident-card" style={{ alignItems: 'flex-start' }}>
                                <div className="detail-resident-card__avatar" style={{ background: tc.bg, color: tc.color, fontSize: '0.7rem', fontWeight: 700 }}>
                                  HĐ
                                </div>
                                <div className="detail-resident-card__info" style={{ gap: '4px', flex: 1 }}>
                                  <span className="detail-resident-card__name">
                                    {c.contractNumber}
                                    <span className="resident-select__owner-badge" style={{ color: tc.color, background: tc.bg }}>
                                      {contractTypeLabel[c.contractType] || c.contractType}
                                    </span>
                                    <span className="resident-select__owner-badge" style={{ color: sc.color, background: sc.bg }}>
                                      {contractStatusLabel[c.contractStatus] || c.contractStatus}
                                    </span>
                                  </span>
                                  <span className="detail-resident-card__sub">
                                    {fmtDate(c.startDate)} → {fmtDate(c.endDate)}
                                    {c.residentName && ` • ${c.residentName}`}
                                  </span>
                                </div>
                                {c.originalFileName && (
                                  <button
                                    className="action-btn action-btn--view"
                                    title={`Tải: ${c.originalFileName}`}
                                    onClick={() => handleDownloadContract(c)}
                                    style={{ flexShrink: 0 }}
                                  >
                                    {Icons.download}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="detail-section__empty">Chưa có hợp đồng nào</p>
                      )}
                    </>
                  );
                })()}
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
                  setTimeout(() => openEditModal(selectedApartment), 100);
                }}
              >
                Chỉnh sửa
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
                  Bạn có chắc chắn muốn xóa căn hộ{' '}
                  <strong>{deleteTarget.apartmentNumber}</strong>?
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
