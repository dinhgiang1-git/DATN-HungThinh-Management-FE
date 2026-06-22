import { Fragment, useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import residentService from '../services/residentService';
import apartmentService from '../services/apartmentService';
import { exportToExcel } from '../utils/exportExcel';
import DropdownSelect from '../components/common/DropdownSelect';

/* ─── constants ─── */
const RELATIONSHIPS = [
  { value: '', label: 'Tất cả' },
  { value: 'OWNER', label: 'Chủ hộ' },
  { value: 'SPOUSE', label: 'Vợ/Chồng' },
  { value: 'CHILD', label: 'Con' },
  { value: 'PARENT', label: 'Cha/Mẹ' },
  { value: 'RELATIVE', label: 'Người thân' },
  { value: 'TENANT', label: 'Người thuê' },
  { value: 'OTHER', label: 'Khác' },
];

const APARTMENT_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'true', label: 'Đã có căn hộ' },
  { value: 'false', label: 'Chưa có căn hộ' },
];

const relationshipLabel = {
  OWNER: 'Chủ hộ',
  SPOUSE: 'Vợ/Chồng',
  CHILD: 'Con',
  PARENT: 'Cha/Mẹ',
  RELATIVE: 'Người thân',
  TENANT: 'Người thuê',
  OTHER: 'Khác',
};

const relationshipColor = {
  OWNER: { color: '#7c3aed', bg: '#ede9fe' },
  SPOUSE: { color: '#db2777', bg: '#fce7f3' },
  CHILD: { color: '#0891b2', bg: '#cffafe' },
  PARENT: { color: '#059669', bg: '#d1fae5' },
  RELATIVE: { color: '#d97706', bg: '#fef3c7' },
  TENANT: { color: '#2563eb', bg: '#dbeafe' },
  OTHER: { color: '#6b7280', bg: '#f3f4f6' },
};

const PAGE_SIZE = 10;

const getResidentId = (resident) => resident?.residentId ?? resident?.id;
const getResidentUsername = (resident) => resident?.userName ?? resident?.username ?? resident?.loginName;
const getResidentRelationship = (resident) => resident?.relationshipType ?? resident?.relationship;
const getResidentPhone = (resident) => resident?.phoneNumber ?? resident?.phone;
const getResidentEmail = (resident) => resident?.email;
const getApartmentLabel = (apartment) => {
  if (!apartment) return '—';
  return `${apartment.block ? `${apartment.block}-` : ''}${apartment.apartmentNumber || '—'}${apartment.floor != null ? ` · Tầng ${apartment.floor}` : ''}`;
};
const getResidentInitial = (resident) => (resident?.fullName || getResidentUsername(resident) || '?').trim().charAt(0).toUpperCase();
const getRelationshipHint = (relationship) => {
  if (relationship === 'OWNER') return 'Chủ hộ';
  if (relationship === 'TENANT') return 'Người thuê trong hộ';
  if (relationship === 'SPOUSE') return 'Vợ/chồng của chủ hộ';
  if (relationship === 'CHILD') return 'Con của chủ hộ';
  if (relationship === 'PARENT') return 'Cha/mẹ của chủ hộ';
  if (relationship === 'RELATIVE') return 'Người thân của chủ hộ';
  return 'Thành viên liên quan';
};
const normalizeResidentRecord = (resident) => ({
  ...resident,
  id: getResidentId(resident),
  userName: getResidentUsername(resident),
  relationship: getResidentRelationship(resident),
  phoneNumber: getResidentPhone(resident),
});

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
  chevronDown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
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
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L8 9.64a16 16 0 0 0 6.36 6.36l1.21-1.21a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
    </svg>
  ),
};

export default function ResidentsPage() {
  /* ─── state ─── */
  const [residents, setResidents] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [residentsLoading, setResidentsLoading] = useState(true);
  const [apartmentsLoading, setApartmentsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterRelationship, setFilterRelationship] = useState('');
  const [filterHasApartment, setFilterHasApartment] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [expandedHouseholds, setExpandedHouseholds] = useState({});
  const [memberTooltip, setMemberTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    title: '',
    relationship: '',
    phone: '',
    email: '',
    context: '',
  });

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
  const [selectedResident, setSelectedResident] = useState(null);
  const [formData, setFormData] = useState({
    userName: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    email: '',
    relationship: 'OWNER',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen]);

  // Delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ─── fetch ─── */
  const fetchResidents = useCallback(async () => {
    setResidentsLoading(true);
    try {
      const params = {
        page,
        size: PAGE_SIZE,
        sortBy: 'id',
        direction: sortDirection,
      };
      if (filterRelationship) params.relationshipType = filterRelationship;
      if (filterHasApartment !== '') params.hasApartment = filterHasApartment === 'true';
      if (searchKeyword.trim()) params.keyword = searchKeyword.trim();

      const res = await residentService.getAll(params);
      const data = res.data?.data;
      setResidents(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      toast.error('Không thể tải danh sách cư dân');
      console.error(err);
    } finally {
      setResidentsLoading(false);
    }
  }, [page, filterRelationship, filterHasApartment, sortDirection, searchKeyword]);

  const fetchApartments = useCallback(async () => {
    setApartmentsLoading(true);
    try {
      const res = await apartmentService.getAll({ page: 0, size: 1000 });
      setApartments(res.data?.data?.content || []);
    } catch (err) {
      console.error('Không thể tải dữ liệu căn hộ của cư dân:', err);
    } finally {
      setApartmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  useEffect(() => {
    fetchApartments();
  }, [fetchApartments]);

  const householdByResidentId = useMemo(() => {
    const map = {};
    apartments.forEach((apartment) => {
      const members = apartment.residents || [];
      const owner = members.find((member) => String(getResidentId(member)) === String(apartment.ownerId))
        || members.find((member) => getResidentRelationship(member) === 'OWNER')
        || null;
      const household = { apartment, owner, members };

      members.forEach((member) => {
        const memberId = getResidentId(member);
        if (memberId != null) map[String(memberId)] = household;
      });
    });
    return map;
  }, [apartments]);

  const residentById = useMemo(() => {
    const map = {};
    residents.forEach((resident) => {
      if (resident?.id != null) map[String(resident.id)] = resident;
    });
    return map;
  }, [residents]);

  const displayResidents = useMemo(() => {
    const principalRelationships = ['OWNER', 'TENANT'];
    const rows = new Map();
    const addResidentRow = (resident) => {
      if (!resident) return;
      const sourceResident = residentById[String(getResidentId(resident))];
      const normalized = normalizeResidentRecord({ ...resident, ...sourceResident });
      if (!normalized.id) return;
      rows.set(String(normalized.id), normalized);
    };

    if (filterRelationship) {
      residents.forEach(addResidentRow);
      return Array.from(rows.values());
    }

    residents.forEach((resident) => {
      const relationship = resident.relationship;
      if (principalRelationships.includes(relationship)) {
        addResidentRow(resident);
        return;
      }

      const household = householdByResidentId[String(resident.id)];
      if (!household) {
        addResidentRow(resident);
        return;
      }

      addResidentRow(household.owner);
      household?.members
        ?.filter((member) => getResidentRelationship(member) === 'TENANT')
        .forEach(addResidentRow);
    });

    return Array.from(rows.values());
  }, [residents, householdByResidentId, residentById, filterRelationship]);

  const tableLoading = residentsLoading || apartmentsLoading;

  /* ─── handlers ─── */
  const handleFilterChange = (rel) => {
    setFilterRelationship(rel);
    setPage(0);
  };

  const handleHasApartmentChange = (val) => {
    setFilterHasApartment(val);
    setPage(0);
  };

  const handleToggleSort = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setPage(0);
  };

  const toggleHousehold = (residentId) => {
    setExpandedHouseholds((prev) => ({
      ...prev,
      [residentId]: !prev[residentId],
    }));
  };

  const getTooltipPosition = (event) => {
    const offset = 14;
    const width = 280;
    const height = 132;
    const nextX = event.clientX + offset + width > window.innerWidth
      ? event.clientX - width - offset
      : event.clientX + offset;
    const nextY = event.clientY + offset + height > window.innerHeight
      ? event.clientY - height - offset
      : event.clientY + offset;

    return {
      x: Math.max(12, nextX),
      y: Math.max(12, nextY),
    };
  };

  const showMemberTooltip = (event, payload) => {
    setMemberTooltip({
      visible: true,
      ...getTooltipPosition(event),
      ...payload,
    });
  };

  const moveMemberTooltip = (event) => {
    setMemberTooltip((prev) => (
      prev.visible ? { ...prev, ...getTooltipPosition(event) } : prev
    ));
  };

  const hideMemberTooltip = () => {
    setMemberTooltip((prev) => ({ ...prev, visible: false }));
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedResident(null);
    setFormData({
      userName: '',
      password: '',
      fullName: '',
      phoneNumber: '',
      email: '',
      relationship: 'OWNER',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (resident) => {
    setModalMode('edit');
    setSelectedResident(resident);
    setFormData({
      userName: resident.userName || '',
      password: '',
      fullName: resident.fullName || '',
      phoneNumber: resident.phoneNumber || '',
      email: resident.email || '',
      relationship: resident.relationship || 'OWNER',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openViewModal = (resident) => {
    setModalMode('view');
    setSelectedResident(resident);
    setModalOpen(true);
  };

  const openDeleteModal = (resident) => {
    setDeleteTarget(resident);
    setDeleteModalOpen(true);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Vui lòng nhập họ và tên';
    if (modalMode === 'create' && (formData.relationship === 'OWNER' || formData.relationship === 'TENANT')) {
      if (!formData.userName.trim()) errors.userName = 'Vui lòng nhập tên đăng nhập';
      if (!formData.password.trim()) errors.password = 'Vui lòng nhập mật khẩu';
      if (formData.password.length > 0 && formData.password.length < 4) errors.password = 'Mật khẩu tối thiểu 4 ký tự';
    }
    if (!formData.relationship) errors.relationship = 'Vui lòng chọn mối quan hệ';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);

    try {
      if (modalMode === 'create') {
        const payload = {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber || undefined,
          email: formData.email || undefined,
          relationship: formData.relationship,
        };
        if (formData.relationship === 'OWNER' || formData.relationship === 'TENANT') {
          payload.userName = formData.userName;
          payload.password = formData.password;
        }
        const res = await residentService.create(payload);
        if (res.data?.status) {
          toast.success('Tạo cư dân thành công!');
          setModalOpen(false);
          fetchResidents();
        } else {
          toast.error(res.data?.message || 'Tạo cư dân thất bại');
        }
      } else {
        const payload = {};
        if (formData.fullName) payload.fullName = formData.fullName;
        if (formData.phoneNumber !== undefined) payload.phoneNumber = formData.phoneNumber;
        if (formData.email !== undefined) payload.email = formData.email;
        if (formData.relationship) payload.relationship = formData.relationship;

        const res = await residentService.update(selectedResident.id, payload);
        if (res.data?.status) {
          toast.success('Cập nhật cư dân thành công!');
          setModalOpen(false);
          fetchResidents();
        } else {
          toast.error(res.data?.message || 'Cập nhật thất bại');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await residentService.delete(deleteTarget.id);
      if (res.data?.status !== false) {
        toast.success('Xóa cư dân thành công!');
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        if (residents.length === 1 && page > 0) {
          setPage((p) => p - 1);
        } else {
          fetchResidents();
        }
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
    <div className="page" id="resident-page">
      {/* Page header */}
      <div className="page__header">
        <div>
          <h2 className="page__title">Quản lý cư dân</h2>
          <p className="page__desc">Quản lý thông tin cư dân trong hệ thống ({totalElements} cư dân)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn--primary" onClick={openCreateModal}>
            <span className="btn__icon">{Icons.plus}</span>
            Thêm cư dân
          </button>
          <button className="btn" style={{background:'#059669',color:'#fff'}} onClick={async () => {
            try {
              const res = await residentService.getAll({ page: 0, size: 10000 });
              const all = res.data?.data?.content || [];
              exportToExcel(all, [
                { header: 'ID', key: 'id', width: 8 },
                { header: 'Tên đăng nhập', key: 'userName', width: 18 },
                { header: 'Họ và tên', key: 'fullName', width: 22 },
                { header: 'Số điện thoại', key: 'phoneNumber', width: 16 },
                { header: 'Email', key: 'email', width: 24 },
                { header: 'Mối quan hệ', key: 'relationship', width: 14, transform: r => relationshipLabel[r.relationship] || r.relationship || '' },
              ], `cu-dan-${new Date().toISOString().slice(0,10)}`, 'Cư dân');
              toast.success('Xuất Excel thành công!');
            } catch { toast.error('Xuất Excel thất bại'); }
          }}>
            <span className="btn__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="page__filters">
        <div className="filter-group">
          <label className="filter-label">Mối quan hệ:</label>
          <div className="filter-tabs">
            {RELATIONSHIPS.map((r) => (
              <button
                key={r.value}
                className={`filter-tab ${filterRelationship === r.value ? 'filter-tab--active' : ''}`}
                onClick={() => handleFilterChange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label">Căn hộ:</label>
          <div className="filter-tabs">
            {APARTMENT_FILTERS.map((f) => (
              <button
                key={f.value}
                className={`filter-tab ${filterHasApartment === f.value ? 'filter-tab--active' : ''}`}
                onClick={() => handleHasApartmentChange(f.value)}
              >
                {f.label}
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
          <button className="btn btn--ghost btn--sm" onClick={handleToggleSort} title="Đổi thứ tự sắp xếp">
            {sortDirection === 'asc' ? '↑ Tăng dần' : '↓ Giảm dần'}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={fetchResidents} title="Làm mới">
            <span className="btn__icon">{Icons.refresh}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="page__table-wrapper">
        {tableLoading ? (
          <div className="page__loading">
            <div className="spinner" />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : displayResidents.length === 0 ? (
          <div className="page__empty">
            <p>Không tìm thấy cư dân nào</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="data-table__th--id">ID</th>
                <th>Tên đăng nhập</th>
                <th>Họ và tên</th>
                <th>Căn hộ / Chủ hộ</th>
                <th>Số điện thoại</th>
                <th>Email</th>
                <th>Mối quan hệ</th>
                <th className="data-table__th--actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displayResidents.map((resident) => {
                const relationship = resident.relationship;
                const rc = relationshipColor[relationship] || { color: '#6b7280', bg: '#f3f4f6' };
                const household = householdByResidentId[String(resident.id)];
                const owner = household?.owner;
                const isPrincipal = relationship === 'OWNER' || relationship === 'TENANT';
                const memberCount = household?.members?.filter((member) => String(getResidentId(member)) !== String(resident.id)).length || 0;
                const canExpandHousehold = isPrincipal && household && memberCount > 0;
                const isExpanded = !!expandedHouseholds[resident.id];
                return (
                  <Fragment key={resident.id}>
                    <tr
                      className={`resident-row ${canExpandHousehold ? 'resident-row--clickable' : ''} ${isExpanded ? 'resident-row--expanded' : ''}`}
                      onClick={() => canExpandHousehold && toggleHousehold(resident.id)}
                    >
                      <td className="data-table__cell--id">{resident.id}</td>
                      <td className="data-table__cell--bold">{resident.userName || '—'}</td>
                      <td>
                        <div className="resident-name-cell">
                          <div>
                            <span className="resident-name-cell__name">{resident.fullName || '—'}</span>
                            {canExpandHousehold && (
                              <span className="resident-name-cell__sub">
                                {memberCount} thành viên liên quan
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {household ? (
                          <div className="resident-household-context">
                            <span className="resident-household-context__apt">{getApartmentLabel(household.apartment)}</span>
                            <span className="resident-household-context__owner">
                              {relationship === 'OWNER'
                                ? 'Chủ hộ của căn hộ này'
                                : relationship === 'TENANT'
                                  ? `Người thuê · Chủ hộ: ${owner?.fullName || 'Chưa rõ'}`
                                  : `Chủ hộ: ${owner?.fullName || 'Chưa rõ'}`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted">Chưa gán căn hộ</span>
                        )}
                      </td>
                      <td>{resident.phoneNumber || '—'}</td>
                      <td>{resident.email || '—'}</td>
                      <td>
                        <div className="resident-relation-cell">
                          <span className="badge" style={{ color: rc.color, backgroundColor: rc.bg }}>
                            {relationshipLabel[relationship] || relationship || '—'}
                          </span>
                          {relationship !== 'OWNER' && owner?.fullName && (
                            <span className="resident-relation-cell__sub">
                              với {owner.fullName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="action-btn action-btn--view" data-tooltip="Xem chi tiết" aria-label="Xem chi tiết" onClick={(e) => { e.stopPropagation(); openViewModal(resident); }}>
                            {Icons.eye}
                          </button>
                          <button className="action-btn action-btn--edit" data-tooltip="Chỉnh sửa" aria-label="Chỉnh sửa" onClick={(e) => { e.stopPropagation(); openEditModal(resident); }}>
                            {Icons.edit}
                          </button>
                          <button className="action-btn action-btn--delete" data-tooltip="Xóa" aria-label="Xóa" onClick={(e) => { e.stopPropagation(); openDeleteModal(resident); }}>
                            {Icons.trash}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {canExpandHousehold && (
                      <tr
                        key={`${resident.id}-household`}
                        className={`resident-household-row ${isExpanded ? 'resident-household-row--open' : 'resident-household-row--closed'}`}
                        aria-hidden={!isExpanded}
                      >
                        <td colSpan="8">
                          <div className="resident-household-collapse">
                            <div className="resident-household-collapse__inner">
                              <div className="resident-hh-inline">
                                <span className="resident-hh-inline__label">
                                  {Icons.users}
                                  Thành viên trong hộ:
                                </span>
                                <div className="resident-hh-inline__list">
                                  {household.members
                                    .filter((member) => String(getResidentId(member)) !== String(resident.id))
                                    .map((member) => {
                                      const memberRelationship = getResidentRelationship(member);
                                      const memberRc = relationshipColor[memberRelationship] || relationshipColor.OTHER;
                                      const memberUsername = getResidentUsername(member);
                                      const memberPhone = getResidentPhone(member);
                                      const memberEmail = getResidentEmail(member);
                                      const memberName = member.fullName || memberUsername || '—';
                                      const memberRelationshipHint = getRelationshipHint(memberRelationship);
                                      return (
                                        <div
                                          key={getResidentId(member)}
                                          className="resident-hh-chip"
                                          style={{ '--chip-accent': memberRc.color, '--chip-bg': memberRc.bg }}
                                          onMouseEnter={(e) => showMemberTooltip(e, {
                                            title: memberName,
                                            relationship: relationshipLabel[memberRelationship] || memberRelationship || '—',
                                            phone: memberPhone || 'Chưa có SĐT',
                                            email: memberEmail || 'Chưa có email',
                                            context: memberRelationship === 'OWNER'
                                              ? getApartmentLabel(household.apartment)
                                              : `${memberRelationshipHint} · với ${owner?.fullName || 'chủ hộ'}`,
                                          })}
                                          onMouseMove={moveMemberTooltip}
                                          onMouseLeave={hideMemberTooltip}
                                        >
                                          <span className="resident-hh-chip__avatar" style={{ background: memberRc.bg, color: memberRc.color }}>
                                            {getResidentInitial(member)}
                                          </span>
                                          <span className="resident-hh-chip__name">{memberName}</span>
                                          <span className="resident-hh-chip__role" style={{ color: memberRc.color, background: memberRc.bg }}>
                                            {relationshipLabel[memberRelationship] || memberRelationship || '—'}
                                          </span>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
      {modalOpen && (modalMode === 'create' || modalMode === 'edit') && createPortal((
        <div className="modal-overlay resident-form-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal resident-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">
                {modalMode === 'create' ? 'Thêm cư dân mới' : 'Chỉnh sửa cư dân'}
              </h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                {Icons.close}
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal__body">
              <div className="form-grid">
                {/* Full Name */}
                <div className="form-field">
                  <label className="form-label">
                    Họ và tên <span className="form-required">*</span>
                  </label>
                  <input
                    className={`form-input ${formErrors.fullName ? 'form-input--error' : ''}`}
                    value={formData.fullName}
                    onChange={(e) => handleFormChange('fullName', e.target.value)}
                    placeholder="Nhập họ và tên"
                  />
                  {formErrors.fullName && <span className="form-error">{formErrors.fullName}</span>}
                </div>

                {/* Relationship */}
                <div className="form-field">
                  <label className="form-label">
                    Mối quan hệ <span className="form-required">*</span>
                  </label>
                  <DropdownSelect
                    className={formErrors.relationship ? 'form-input--error' : ''}
                    value={formData.relationship}
                    onChange={(value) => handleFormChange('relationship', value)}
                    options={[
                      { value: 'OWNER', label: 'Chủ hộ' },
                      { value: 'SPOUSE', label: 'Vợ/Chồng' },
                      { value: 'CHILD', label: 'Con' },
                      { value: 'PARENT', label: 'Cha/Mẹ' },
                      { value: 'RELATIVE', label: 'Người thân' },
                      { value: 'TENANT', label: 'Người thuê' },
                      { value: 'OTHER', label: 'Khác' },
                    ]}
                  />
                  {formErrors.relationship && <span className="form-error">{formErrors.relationship}</span>}
                </div>

                {/* Username (create + OWNER/TENANT only) */}
                {modalMode === 'create' && (formData.relationship === 'OWNER' || formData.relationship === 'TENANT') && (
                  <div className="form-field">
                    <label className="form-label">
                      Tên đăng nhập <span className="form-required">*</span>
                    </label>
                    <input
                      className={`form-input ${formErrors.userName ? 'form-input--error' : ''}`}
                      value={formData.userName}
                      onChange={(e) => handleFormChange('userName', e.target.value)}
                      placeholder="Nhập tên đăng nhập"
                    />
                    {formErrors.userName && <span className="form-error">{formErrors.userName}</span>}
                  </div>
                )}

                {/* Password (create + OWNER/TENANT only) */}
                {modalMode === 'create' && (formData.relationship === 'OWNER' || formData.relationship === 'TENANT') && (
                  <div className="form-field">
                    <label className="form-label">
                      Mật khẩu <span className="form-required">*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-input ${formErrors.password ? 'form-input--error' : ''}`}
                      value={formData.password}
                      onChange={(e) => handleFormChange('password', e.target.value)}
                      placeholder="Nhập mật khẩu"
                    />
                    {formErrors.password && <span className="form-error">{formErrors.password}</span>}
                  </div>
                )}

                {/* Phone */}
                <div className="form-field">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    className="form-input"
                    value={formData.phoneNumber}
                    onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                {/* Email */}
                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-input ${formErrors.email ? 'form-input--error' : ''}`}
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="Nhập email"
                  />
                  {formErrors.email && <span className="form-error">{formErrors.email}</span>}
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
      ), document.body)}

      {/* View Modal */}
      {modalOpen && modalMode === 'view' && selectedResident && createPortal((
        <div className="modal-overlay resident-detail-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal--sm resident-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Chi tiết cư dân</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                {Icons.close}
              </button>
            </div>
            <div className="modal__body">
              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">ID</span>
                  <span className="detail-value">{selectedResident.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tên đăng nhập</span>
                  <span className="detail-value detail-value--bold">{selectedResident.userName || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Họ và tên</span>
                  <span className="detail-value">{selectedResident.fullName || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Số điện thoại</span>
                  <span className="detail-value">{selectedResident.phoneNumber || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{selectedResident.email || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Mối quan hệ</span>
                  <span className="detail-value">
                    <span
                      className="badge"
                      style={{
                        color: relationshipColor[selectedResident.relationship]?.color || '#6b7280',
                        backgroundColor: relationshipColor[selectedResident.relationship]?.bg || '#f3f4f6',
                      }}
                    >
                      {relationshipLabel[selectedResident.relationship] || selectedResident.relationship || '—'}
                    </span>
                  </span>
                </div>
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
                  setTimeout(() => openEditModal(selectedResident), 100);
                }}
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {memberTooltip.visible && (
        <div
          className="resident-member-tooltip"
          style={{ left: memberTooltip.x, top: memberTooltip.y }}
        >
          <strong>{memberTooltip.title}</strong>
          <span>{memberTooltip.relationship}</span>
          <small>{memberTooltip.context}</small>
          <div className="resident-member-tooltip__meta">
            <span>{memberTooltip.phone}</span>
            <span>{memberTooltip.email}</span>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && deleteTarget && createPortal((
        <div className="modal-overlay resident-delete-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal modal--sm resident-delete-modal" onClick={(e) => e.stopPropagation()}>
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
                  Bạn có chắc chắn muốn xóa cư dân{' '}
                  <strong>{deleteTarget.fullName || deleteTarget.userName}</strong>?
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
      ), document.body)}
    </div>
  );
}
