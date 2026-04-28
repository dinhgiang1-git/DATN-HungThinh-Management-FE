import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import contractService from '../services/contractService';
import apartmentService from '../services/apartmentService';
import SearchableSelect from '../components/common/SearchableSelect';

registerLocale('vi', vi);

/* ─── constants ─── */
const CONTRACT_STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Đang hiệu lực' },
  { value: 'EXPIRED', label: 'Hết hạn' },
  { value: 'TERMINATED', label: 'Đã chấm dứt' },
];

const CONTRACT_TYPES = [
  { value: '', label: 'Tất cả' },
  { value: 'RENT', label: 'Thuê' },
  { value: 'PURCHASE', label: 'Mua bán' },
  { value: 'SERVICE', label: 'Dịch vụ' },
];

const statusLabel = {
  ACTIVE: 'Đang hiệu lực',
  EXPIRED: 'Hết hạn',
  TERMINATED: 'Đã chấm dứt',
};

const statusColor = {
  ACTIVE: { color: '#059669', bg: '#d1fae5' },
  EXPIRED: { color: '#d97706', bg: '#fef3c7' },
  TERMINATED: { color: '#dc2626', bg: '#fee2e2' },
};

const typeLabel = {
  RENT: 'Thuê',
  PURCHASE: 'Mua bán',
  SERVICE: 'Dịch vụ',
};

const typeColor = {
  RENT: { color: '#2563eb', bg: '#dbeafe' },
  PURCHASE: { color: '#7c3aed', bg: '#ede9fe' },
  SERVICE: { color: '#0891b2', bg: '#cffafe' },
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
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
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
};

export default function ContractsPage() {
  /* ─── state ─── */
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Apartment lists for selectors
  const [apartments, setApartments] = useState([]);

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

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedContract, setSelectedContract] = useState(null);
  const [formData, setFormData] = useState({
    contractNumber: '',
    contractType: 'RENT',
    contractStatus: 'ACTIVE',
    startDate: '',
    endDate: '',
    note: '',
    apartmentId: '',
    residentId: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ─── fetch ─── */
  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: PAGE_SIZE,
        sortBy: 'id',
        direction: sortDirection,
      };
      if (filterStatus) params.contractStatus = filterStatus;
      if (filterType) params.contractType = filterType;
      if (searchKeyword.trim()) params.keyword = searchKeyword.trim();

      const res = await contractService.getAll(params);
      const data = res.data?.data;
      setContracts(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      toast.error('Không thể tải danh sách hợp đồng');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterType, sortDirection, searchKeyword]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Fetch apartments for dropdowns
  useEffect(() => {
    (async () => {
      try {
        const aptRes = await apartmentService.getAll({ page: 0, size: 999 });
        setApartments(aptRes.data?.data?.content || []);
      } catch (err) {
        console.error('Error loading apartments:', err);
      }
    })();
  }, []);

  // Compute residents of selected apartment
  const apartmentResidents = useMemo(() => {
    if (!formData.apartmentId) return [];
    const apt = apartments.find((a) => String(a.id) === String(formData.apartmentId));
    return apt?.residents || [];
  }, [formData.apartmentId, apartments]);

  /* ─── handlers ─── */
  const handleFilterStatus = (val) => { setFilterStatus(val); setPage(0); };
  const handleFilterType = (val) => { setFilterType(val); setPage(0); };
  const handleToggleSort = () => { setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc')); setPage(0); };

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const resetForm = () => {
    setFormData({
      contractNumber: '',
      contractType: 'RENT',
      contractStatus: 'ACTIVE',
      startDate: getTodayStr(),
      endDate: '',
      note: '',
      apartmentId: '',
      residentId: '',
    });
    setSelectedFile(null);
    setFormErrors({});
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedContract(null);
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (contract) => {
    setModalMode('edit');
    setSelectedContract(contract);
    setFormData({
      contractNumber: contract.contractNumber || '',
      contractType: contract.contractType || 'RENT',
      contractStatus: contract.contractStatus || 'ACTIVE',
      startDate: formatDateForInput(contract.startDate),
      endDate: formatDateForInput(contract.endDate),
      note: contract.note || '',
      apartmentId: contract.apartment ? findApartmentId(contract.apartment.apartmentNumber) : '',
      residentId: contract.resident?.residentId || contract.resident?.id || '',
    });
    setSelectedFile(null);
    setFormErrors({});
    setModalOpen(true);
  };

  const openViewModal = (contract) => { setModalMode('view'); setSelectedContract(contract); setModalOpen(true); };
  const openDeleteModal = (contract) => { setDeleteTarget(contract); setDeleteModalOpen(true); };

  const findApartmentId = (apartmentNumber) => {
    const apt = apartments.find((a) => a.apartmentNumber === apartmentNumber);
    return apt?.id || '';
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['doc', 'docx', 'pdf'].includes(ext)) {
        toast.error('Chỉ cho phép upload file .doc, .docx, .pdf');
        e.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File vượt quá 10MB');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.contractType) errors.contractType = 'Vui lòng chọn loại hợp đồng';
    if (!formData.startDate) errors.startDate = 'Vui lòng chọn ngày bắt đầu';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        contractNumber: formData.contractNumber,
        contractType: formData.contractType,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        note: formData.note || undefined,
        apartmentId: formData.apartmentId ? Number(formData.apartmentId) : undefined,
        residentId: formData.residentId ? Number(formData.residentId) : undefined,
      };

      if (modalMode === 'edit') {
        payload.contractStatus = formData.contractStatus;
      }

      let res;
      if (modalMode === 'create') {
        res = await contractService.create(payload, selectedFile);
      } else {
        res = await contractService.update(selectedContract.contractId, payload, selectedFile);
      }

      if (res.data?.status) {
        toast.success(modalMode === 'create' ? 'Tạo hợp đồng thành công!' : 'Cập nhật hợp đồng thành công!');
        setModalOpen(false);
        fetchContracts();
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
      const res = await contractService.delete(deleteTarget.contractId);
      if (res.data?.status !== false) {
        toast.success('Xóa hợp đồng thành công!');
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        if (contracts.length === 1 && page > 0) setPage((p) => p - 1);
        else fetchContracts();
      } else {
        toast.error(res.data?.message || 'Xóa thất bại');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (contract) => {
    try {
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
    } catch (err) {
      toast.error('Không thể tải file hợp đồng');
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      if (typeof dateStr === 'string' && dateStr.includes('/')) return dateStr;
      if (Array.isArray(dateStr)) {
        const [y, m, d] = dateStr;
        return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '—';
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    } catch { return '—'; }
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    if (Array.isArray(dateStr)) {
      const [y, m, d] = dateStr;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    if (typeof dateStr === 'string') {
      const parts = dateStr.split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      return dateStr.substring(0, 10);
    }
    return '';
  };

  /* ─── render ─── */
  return (
    <div className="page">
      {/* Header */}
      <div className="page__header">
        <div>
          <h2 className="page__title">Quản lý hợp đồng</h2>
          <p className="page__desc">Quản lý các hợp đồng trong chung cư ({totalElements} hợp đồng)</p>
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <span className="btn__icon">{Icons.plus}</span>
          Thêm hợp đồng
        </button>
      </div>

      {/* Filters */}
      <div className="page__filters">
        <div className="filter-group">
          <label className="filter-label">Trạng thái:</label>
          <div className="filter-tabs">
            {CONTRACT_STATUSES.map((s) => (
              <button
                key={s.value}
                className={`filter-tab ${filterStatus === s.value ? 'filter-tab--active' : ''}`}
                onClick={() => handleFilterStatus(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label">Loại:</label>
          <div className="filter-tabs">
            {CONTRACT_TYPES.map((t) => (
              <button
                key={t.value}
                className={`filter-tab ${filterType === t.value ? 'filter-tab--active' : ''}`}
                onClick={() => handleFilterType(t.value)}
              >
                {t.label}
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
          <button className="btn btn--ghost btn--sm" onClick={handleToggleSort} title="Đổi thứ tự">
            {sortDirection === 'asc' ? '↑ Tăng dần' : '↓ Giảm dần'}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={fetchContracts} title="Làm mới">
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
        ) : contracts.length === 0 ? (
          <div className="page__empty">
            <p>Không tìm thấy hợp đồng nào</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="data-table__th--id">ID</th>
                <th>Mã hợp đồng</th>
                <th>Loại</th>
                <th>Căn hộ</th>
                <th>Cư dân</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Trạng thái</th>
                <th>File</th>
                <th className="data-table__th--actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const sc = statusColor[c.contractStatus] || { color: '#6b7280', bg: '#f3f4f6' };
                const tc = typeColor[c.contractType] || { color: '#6b7280', bg: '#f3f4f6' };
                return (
                  <tr key={c.contractId}>
                    <td className="data-table__cell--id">{c.contractId}</td>
                    <td className="data-table__cell--bold">{c.contractNumber}</td>
                    <td>
                      <span className="badge" style={{ color: tc.color, backgroundColor: tc.bg }}>
                        {typeLabel[c.contractType] || c.contractType}
                      </span>
                    </td>
                    <td>{c.apartment ? `${c.apartment.apartmentNumber} (${c.apartment.block})` : '—'}</td>
                    <td>{c.resident?.fullName || '—'}</td>
                    <td>{formatDate(c.startDate)}</td>
                    <td>{formatDate(c.endDate)}</td>
                    <td>
                      <span className="badge" style={{ color: sc.color, backgroundColor: sc.bg }}>
                        {statusLabel[c.contractStatus] || c.contractStatus}
                      </span>
                    </td>
                    <td>
                      {c.originalFileName ? (
                        <button
                          className="action-btn action-btn--view"
                          title={`Tải: ${c.originalFileName}`}
                          onClick={() => handleDownload(c)}
                          style={{ display: 'inline-flex' }}
                        >
                          {Icons.download}
                        </button>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Chưa có</span>
                      )}
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn action-btn--view" title="Xem" onClick={() => openViewModal(c)}>
                          {Icons.eye}
                        </button>
                        <button className="action-btn action-btn--edit" title="Sửa" onClick={() => openEditModal(c)}>
                          {Icons.edit}
                        </button>
                        <button className="action-btn action-btn--delete" title="Xóa" onClick={() => openDeleteModal(c)}>
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
                {modalMode === 'create' ? 'Thêm hợp đồng mới' : 'Chỉnh sửa hợp đồng'}
              </h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                {Icons.close}
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal__body">
              <div className="form-grid">
                {/* Contract Number */}
                <div className="form-field">
                  <label className="form-label">
                    Mã hợp đồng
                  </label>
                  <input
                    className="form-input"
                    value={formData.contractNumber}
                    onChange={(e) => handleFormChange('contractNumber', e.target.value)}
                    placeholder="Để trống sẽ tự sinh (HD-MM/YYYY-001)"
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>Để trống để hệ thống tự sinh mã</span>
                </div>

                {/* Contract Type */}
                <div className="form-field">
                  <label className="form-label">
                    Loại hợp đồng <span className="form-required">*</span>
                  </label>
                  <select
                    className={`form-select ${formErrors.contractType ? 'form-input--error' : ''}`}
                    value={formData.contractType}
                    onChange={(e) => handleFormChange('contractType', e.target.value)}
                  >
                    <option value="RENT">Thuê</option>
                    <option value="PURCHASE">Mua bán</option>
                    <option value="SERVICE">Dịch vụ</option>
                  </select>
                  {formErrors.contractType && <span className="form-error">{formErrors.contractType}</span>}
                </div>

                {/* Contract Status (only in edit mode) */}
                {modalMode === 'edit' && (
                  <div className="form-field">
                    <label className="form-label">Trạng thái</label>
                    <select
                      className="form-select"
                      value={formData.contractStatus}
                      onChange={(e) => handleFormChange('contractStatus', e.target.value)}
                    >
                      <option value="ACTIVE">Đang hiệu lực</option>
                      <option value="EXPIRED">Hết hạn</option>
                      <option value="TERMINATED">Đã chấm dứt</option>
                    </select>
                  </div>
                )}

                {/* Start Date */}
                <div className="form-field">
                  <label className="form-label">
                    Ngày bắt đầu <span className="form-required">*</span>
                  </label>
                  <DatePicker
                    selected={formData.startDate ? new Date(formData.startDate) : null}
                    onChange={(date) => handleFormChange('startDate', date ? date.toISOString().substring(0, 10) : '')}
                    dateFormat="dd/MM/yyyy"
                    locale="vi"
                    placeholderText="dd/MM/yyyy"
                    className={`form-input ${formErrors.startDate ? 'form-input--error' : ''}`}
                    isClearable
                  />
                  {formErrors.startDate && <span className="form-error">{formErrors.startDate}</span>}
                </div>

                {/* End Date */}
                <div className="form-field">
                  <label className="form-label">Ngày kết thúc</label>
                  <DatePicker
                    selected={formData.endDate ? new Date(formData.endDate) : null}
                    onChange={(date) => handleFormChange('endDate', date ? date.toISOString().substring(0, 10) : '')}
                    dateFormat="dd/MM/yyyy"
                    locale="vi"
                    placeholderText="dd/MM/yyyy"
                    className="form-input"
                    isClearable
                  />
                </div>

                {/* Apartment */}
                <div className="form-field">
                  <label className="form-label">Căn hộ</label>
                  <SearchableSelect
                    options={apartments.map((apt) => ({
                      value: apt.id,
                      label: `${apt.apartmentNumber} - ${apt.block}`,
                      sub: `Tầng ${apt.floor}${apt.area ? ` • ${apt.area}m²` : ''}`,
                    }))}
                    value={formData.apartmentId}
                    onChange={(val) => {
                      handleFormChange('apartmentId', val);
                      handleFormChange('residentId', '');
                    }}
                    placeholder="-- Chọn căn hộ --"
                    searchPlaceholder="Tìm theo mã căn hộ, block..."
                  />
                </div>

                {/* Resident */}
                <div className="form-field">
                  <label className="form-label">Cư dân (chủ hợp đồng)</label>
                  {!formData.apartmentId ? (
                    <div className="form-input" style={{ color: 'var(--text-light)', cursor: 'not-allowed', background: '#f8fafc' }}>
                      Vui lòng chọn căn hộ trước
                    </div>
                  ) : apartmentResidents.length === 0 ? (
                    <div className="form-input" style={{ color: 'var(--text-light)', cursor: 'not-allowed', background: '#f8fafc' }}>
                      Căn hộ chưa có cư dân
                    </div>
                  ) : (
                    <SearchableSelect
                      options={apartmentResidents.map((res) => {
                        const relLabel = {
                          OWNER: 'Chủ hộ',
                          SPOUSE: 'Vợ / chồng',
                          CHILD: 'Con',
                          PARENT: 'Cha / mẹ',
                          RELATIVE: 'Người thân',
                          TENANT: 'Người thuê',
                          OTHER: 'Khác',
                        };
                        const rel = res.relationshipType ? ` (${relLabel[res.relationshipType] || res.relationshipType})` : '';
                        return {
                          value: res.residentId,
                          label: `${res.fullName || 'Chưa có tên'}${rel}`,
                          sub: [res.phone, res.email].filter(Boolean).join(' • ') || undefined,
                        };
                      })}
                      value={formData.residentId}
                      onChange={(val) => handleFormChange('residentId', val)}
                      placeholder="-- Chọn cư dân --"
                      searchPlaceholder="Tìm theo tên, SĐT, email..."
                    />
                  )}
                </div>

                {/* File Upload */}
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">
                    File hợp đồng (.doc, .docx, .pdf)
                  </label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="contract-file"
                      accept=".doc,.docx,.pdf"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="contract-file" className="file-upload-label">
                      <span className="file-upload-icon">{Icons.upload}</span>
                      <span className="file-upload-text">
                        {selectedFile
                          ? selectedFile.name
                          : modalMode === 'edit' && selectedContract?.originalFileName
                            ? `File hiện tại: ${selectedContract.originalFileName} (click để thay đổi)`
                            : 'Click để chọn file'
                        }
                      </span>
                    </label>
                  </div>
                </div>

                {/* Note */}
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Ghi chú</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={formData.note}
                    onChange={(e) => handleFormChange('note', e.target.value)}
                    placeholder="Ghi chú thêm về hợp đồng..."
                  />
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
      {modalOpen && modalMode === 'view' && selectedContract && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Chi tiết hợp đồng</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>
                {Icons.close}
              </button>
            </div>
            <div className="modal__body">
              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">ID</span>
                  <span className="detail-value">{selectedContract.contractId}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Mã hợp đồng</span>
                  <span className="detail-value detail-value--bold">{selectedContract.contractNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Loại hợp đồng</span>
                  <span className="detail-value">
                    <span className="badge" style={{
                      color: typeColor[selectedContract.contractType]?.color,
                      backgroundColor: typeColor[selectedContract.contractType]?.bg
                    }}>
                      {typeLabel[selectedContract.contractType] || selectedContract.contractType}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Trạng thái</span>
                  <span className="detail-value">
                    <span className="badge" style={{
                      color: statusColor[selectedContract.contractStatus]?.color,
                      backgroundColor: statusColor[selectedContract.contractStatus]?.bg
                    }}>
                      {statusLabel[selectedContract.contractStatus] || selectedContract.contractStatus}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Ngày bắt đầu</span>
                  <span className="detail-value">{formatDate(selectedContract.startDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Ngày kết thúc</span>
                  <span className="detail-value">{formatDate(selectedContract.endDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Căn hộ</span>
                  <span className="detail-value">
                    {selectedContract.apartment
                      ? `${selectedContract.apartment.apartmentNumber} - ${selectedContract.apartment.block} (Tầng ${selectedContract.apartment.floor})`
                      : '—'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Cư dân</span>
                  <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {selectedContract.resident
                      ? <>
                          {`${selectedContract.resident.fullName} ${selectedContract.resident.phoneNumber ? `(${selectedContract.resident.phoneNumber})` : ''}`}
                          {selectedContract.resident.relationship && (() => {
                            const relColors = {
                              'Chủ hộ': { color: '#0369a1', bg: '#e0f2fe' },
                              'Vợ / chồng': { color: '#9333ea', bg: '#f3e8ff' },
                              'Con': { color: '#ea580c', bg: '#fff7ed' },
                              'Cha / mẹ': { color: '#0d9488', bg: '#f0fdfa' },
                              'Người thân': { color: '#4f46e5', bg: '#eef2ff' },
                              'Người thuê': { color: '#b45309', bg: '#fefce8' },
                              'Khác': { color: '#6b7280', bg: '#f3f4f6' },
                            };
                            const rc = relColors[selectedContract.resident.relationship] || relColors['Khác'];
                            return (
                              <span className="badge" style={{ color: rc.color, backgroundColor: rc.bg, fontSize: '0.78rem' }}>
                                {selectedContract.resident.relationship}
                              </span>
                            );
                          })()}
                        </>
                      : '—'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">File đính kèm</span>
                  <span className="detail-value">
                    {selectedContract.originalFileName ? (
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => handleDownload(selectedContract)}
                        style={{ gap: '6px', display: 'inline-flex', alignItems: 'center' }}
                      >
                        <span className="btn__icon" style={{ width: '16px', height: '16px' }}>{Icons.download}</span>
                        {selectedContract.originalFileName}
                      </button>
                    ) : 'Chưa có file'}
                  </span>
                </div>
                {selectedContract.note && (
                  <div className="detail-item">
                    <span className="detail-label">Ghi chú</span>
                    <span className="detail-value">{selectedContract.note}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Ngày tạo</span>
                  <span className="detail-value">{formatDate(selectedContract.createdAt)}</span>
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
                  setTimeout(() => openEditModal(selectedContract), 100);
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
                  Bạn có chắc chắn muốn xóa hợp đồng{' '}
                  <strong>{deleteTarget.contractNumber}</strong>?
                </p>
                <p className="delete-confirm__sub">Hành động này không thể hoàn tác. File đính kèm cũng sẽ bị xóa.</p>
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
