import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import invoiceService from '../services/invoiceService';
import apartmentService from '../services/apartmentService';
import tableFeeService from '../services/tableFeeService';
import paymentService from '../services/paymentService';

registerLocale('vi', vi);

/* ─── constants ─── */
const STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'UNPAID', label: 'Chưa thanh toán' },
];

const statusLabel = { PAID: 'Đã thanh toán', UNPAID: 'Chưa thanh toán' };
const statusColor = {
  PAID: { color: '#059669', bg: '#d1fae5' },
  UNPAID: { color: '#dc2626', bg: '#fee2e2' },
};

const paymentStatusLabel = { PENDING: 'Đang xử lý', SUCCESS: 'Thành công', FAILED: 'Thất bại' };
const paymentStatusColor = {
  PENDING: { color: '#d97706', bg: '#fef3c7' },
  SUCCESS: { color: '#059669', bg: '#d1fae5' },
  FAILED: { color: '#dc2626', bg: '#fee2e2' },
};

const PAGE_SIZE = 10;

/* ─── icons ─── */
const Icons = {
  plus: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>),
  edit: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>),
  trash: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>),
  eye: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>),
  chevronLeft: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>),
  chevronRight: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 6 15 12 9 18" /></svg>),
  close: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>),
  search: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>),
  refresh: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>),
  fee: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="18" rx="2" /><line x1="2" y1="9" x2="22" y2="9" /><line x1="9" y1="3" x2="9" y2="21" /></svg>),
  vnpay: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>),
};

/* ─── helpers ─── */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    if (Array.isArray(dateStr)) {
      const [y, m, d] = dateStr;
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
    if (typeof dateStr === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  } catch { return '—'; }
};

const toInputDate = (dateStr) => {
  if (!dateStr) return '';
  if (Array.isArray(dateStr)) {
    const [y, m, d] = dateStr;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  if (typeof dateStr === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m}-${d}`;
  }
  if (typeof dateStr === 'string' && dateStr.includes('-')) return dateStr.substring(0, 10);
  return '';
};

const formatDateTime = (dtStr) => {
  if (!dtStr) return '—';
  try {
    if (Array.isArray(dtStr)) {
      const [y, mo, d, h = 0, mi = 0] = dtStr;
      return `${String(d).padStart(2, '0')}/${String(mo).padStart(2, '0')}/${y} ${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
    }
    const date = new Date(dtStr);
    if (isNaN(date.getTime())) return dtStr;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    const h = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    return `${d}/${m}/${y} ${h}:${mi}`;
  } catch { return '—'; }
};

const money = (val) => {
  if (val == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

const shortMoney = (val) => {
  if (val == null || val === 0) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
};

const formatInputCurrency = (val) => {
  if (!val && val !== 0) return '';
  const numVal = String(val).replace(/\D/g, '');
  if (!numVal) return '';
  return new Intl.NumberFormat('vi-VN').format(Number(numVal));
};

const parseInputCurrency = (val) => {
  if (!val) return '';
  return String(val).replace(/\D/g, '');
};

export default function InvoicesPage() {
  /* ─── state ─── */
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [sortDirection, setSortDirection] = useState('desc');
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

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create | edit | view
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    dueDate: '',
    electricFee: '',
    waterFee: '',
    managementFee: '',
    parkingFee: '',
    otherFee: '',
    apartmentId: '',
    invoiceStatus: 'UNPAID',
    electricQuantity: '',
    waterQuantity: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Apartments
  const [apartments, setApartments] = useState([]);
  const [aptFilterBlock, setAptFilterBlock] = useState('');
  const [aptFilterFloor, setAptFilterFloor] = useState('');

  // Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Table Fee Delete
  const [feeDeleteModalOpen, setFeeDeleteModalOpen] = useState(false);
  const [feeDeleteTargetIdx, setFeeDeleteTargetIdx] = useState(null);
  const [feeDeleting, setFeeDeleting] = useState(false);

  // Table Fee
  const [tableFees, setTableFees] = useState([]);
  const [tableFeeLoading, setTableFeeLoading] = useState(true);
  const [tableFeeEditOpen, setTableFeeEditOpen] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [tableFeeForm, setTableFeeForm] = useState({
    title: '', electricFee: '', waterFee: '', managementFee: '', parkingFee: '', otherFee: '',
  });
  const [tableFeeSubmitting, setTableFeeSubmitting] = useState(false);
  const [selectedFeeIndex, setSelectedFeeIndex] = useState(0); // index của bảng phí được chọn
  const [feeDropdownOpen, setFeeDropdownOpen] = useState(false); // dropdown menu state
  const [modalFeeDropdownOpen, setModalFeeDropdownOpen] = useState(false); // modal dropdown menu state

  /* ─── fetch ─── */
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE, sortBy: 'id', direction: sortDirection };
      if (filterStatus) params.invoiceStatus = filterStatus;
      if (searchKeyword.trim()) params.keyword = searchKeyword.trim();
      const res = await invoiceService.getAll(params);
      const data = res.data?.data;
      setInvoices(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      toast.error('Không thể tải danh sách hóa đơn');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, sortDirection, searchKeyword]);

  const fetchApartments = useCallback(async () => {
    try {
      const res = await apartmentService.getAll({ page: 0, size: 1000 });
      setApartments(res.data?.data?.content || []);
    } catch (err) {
      console.error('Lỗi tải danh sách căn hộ:', err);
    }
  }, []);

  const fetchTableFees = useCallback(async () => {
    setTableFeeLoading(true);
    try {
      const res = await tableFeeService.getAll();
      setTableFees(res.data?.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách bảng phí:', err);
    } finally {
      setTableFeeLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { fetchApartments(); }, [fetchApartments]);
  useEffect(() => { fetchTableFees(); }, [fetchTableFees]);

  /* ─── current user ─── */
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  /* ─── the active fee (selected entry) ─── */
  const activeFee = tableFees?.[selectedFeeIndex] || tableFees?.[0] || null;

  /* ─── auto-fill form from selected fee ─── */
  useEffect(() => {
    if (modalOpen && activeFee) {
      setFormData((prev) => ({
        ...prev,
        managementFee: activeFee.managementFee ? String(activeFee.managementFee) : '',
        parkingFee: activeFee.parkingFee ? String(activeFee.parkingFee) : '',
        otherFee: activeFee.otherFee ? String(activeFee.otherFee) : '0',
      }));
    }
  }, [selectedFeeIndex, modalOpen, activeFee]);

  /* ─── handlers ─── */
  const handleFilterChange = (val) => { setFilterStatus(val); setPage(0); };
  const handleToggleSort = () => { setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc')); setPage(0); };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedInvoice(null);
    
    // Default dueDate to today + 1 day of next month (using local timezone)
    const today = new Date();
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate() + 1);
    const yyyy = nextMonthDate.getFullYear();
    const mm = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
    const dd = String(nextMonthDate.getDate()).padStart(2, '0');
    const defaultDueDate = `${yyyy}-${mm}-${dd}`;
    
    setFormData({
      invoiceNumber: '', dueDate: defaultDueDate, electricFee: '', waterFee: '',
      managementFee: '', parkingFee: '', otherFee: '', apartmentId: '', invoiceStatus: 'UNPAID',
      electricQuantity: '', waterQuantity: '',
    });
    setFormErrors({});
    setAptFilterBlock('');
    setAptFilterFloor('');
    setModalOpen(true);
  };

  const openEditModal = (inv) => {
    setModalMode('edit');
    setSelectedInvoice(inv);
    
    // Reverse calculate quantities if activeFee is available
    let eq = '';
    if (inv.electricFee && activeFee && activeFee.electricFee > 0) {
      eq = String(inv.electricFee / activeFee.electricFee);
    }
    let wq = '';
    if (inv.waterFee && activeFee && activeFee.waterFee > 0) {
      wq = String(inv.waterFee / activeFee.waterFee);
    }

    setFormData({
      invoiceNumber: inv.invoiceNumber || '',
      dueDate: toInputDate(inv.dueDate),
      electricFee: inv.electricFee != null ? String(inv.electricFee) : '',
      waterFee: inv.waterFee != null ? String(inv.waterFee) : '',
      managementFee: inv.managementFee != null ? String(inv.managementFee) : '',
      parkingFee: inv.parkingFee != null ? String(inv.parkingFee) : '',
      otherFee: inv.otherFee != null ? String(inv.otherFee) : '',
      apartmentId: inv.apartment?.id || inv.apartmentId || '',
      invoiceStatus: inv.invoiceStatus || 'UNPAID',
      electricQuantity: eq,
      waterQuantity: wq,
    });
    setFormErrors({});
    setAptFilterBlock('');
    setAptFilterFloor('');
    setModalOpen(true);
  };

  const openViewModal = (inv) => { setModalMode('view'); setSelectedInvoice(inv); setModalOpen(true); };
  const openDeleteModal = (inv) => { setDeleteTarget(inv); setDeleteModalOpen(true); };

  const handleFormChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Limit electricQuantity and waterQuantity to 999999999
      const MAX_QUANTITY = 999999999;
      if (field === 'electricQuantity') {
        const qty = Number(value);
        if (qty > MAX_QUANTITY) {
          updated.electricQuantity = String(MAX_QUANTITY);
        }
      }
      if (field === 'waterQuantity') {
        const qty = Number(value);
        if (qty > MAX_QUANTITY) {
          updated.waterQuantity = String(MAX_QUANTITY);
        }
      }
      
      // Auto-calculate electricFee when electricQuantity changes
      if (field === 'electricQuantity' && activeFee && activeFee.electricFee > 0) {
        const qty = Number(updated.electricQuantity);
        updated.electricFee = qty > 0 ? String(qty * Number(activeFee.electricFee)) : '';
      }
      
      // Auto-calculate waterFee when waterQuantity changes
      if (field === 'waterQuantity' && activeFee && activeFee.waterFee > 0) {
        const qty = Number(updated.waterQuantity);
        updated.waterFee = qty > 0 ? String(qty * Number(activeFee.waterFee)) : '';
      }
      
      return updated;
    });
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.invoiceNumber.trim()) errors.invoiceNumber = 'Vui lòng nhập số hóa đơn';
    if (!formData.dueDate) errors.dueDate = 'Vui lòng chọn hạn thanh toán';
    if (modalMode === 'create' && !formData.apartmentId) errors.apartmentId = 'Vui lòng chọn căn hộ';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      let payload;
      if (modalMode === 'create') {
        payload = {
          invoiceNumber: formData.invoiceNumber.trim(),
          dueDate: formData.dueDate,
          apartmentId: Number(formData.apartmentId),
          creatorId: currentUser?.id || currentUser?.userId,
        };
        if (!payload.creatorId) {
          toast.error('Thiếu thông tin người tạo. Vui lòng đăng xuất và đăng nhập lại!');
          setSubmitting(false);
          return;
        }
      } else {
        payload = {
          invoiceNumber: formData.invoiceNumber.trim(),
          dueDate: formData.dueDate,
          invoiceStatus: formData.invoiceStatus,
        };
      }
      // Fee fields - Lấy trực tiếp kết quả tổng tiền từ form (đã được tính toán khi nhập quantity)
      // Electric
      if (formData.electricFee) {
        payload.electricFee = Number(formData.electricFee);
      }

      // Water
      if (formData.waterFee) {
        payload.waterFee = Number(formData.waterFee);
      }

      // Other fees
      if (formData.managementFee) payload.managementFee = Number(formData.managementFee);
      if (formData.parkingFee) payload.parkingFee = Number(formData.parkingFee);
      if (formData.otherFee) payload.otherFee = Number(formData.otherFee);

      let res;
      if (modalMode === 'create') {
        res = await invoiceService.create(payload);
      } else {
        res = await invoiceService.update(selectedInvoice.invoiceId, payload);
      }

      if (res.data?.status) {
        toast.success(modalMode === 'create' ? 'Tạo hóa đơn thành công!' : 'Cập nhật hóa đơn thành công!');
        setModalOpen(false);
        fetchInvoices();
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
      const res = await invoiceService.delete(deleteTarget.invoiceId);
      if (res.data?.status !== false) {
        toast.success('Xóa hóa đơn thành công!');
        setDeleteModalOpen(false);
        setDeleteTarget(null);
        if (invoices.length === 1 && page > 0) setPage((p) => p - 1);
        else fetchInvoices();
      } else {
        toast.error(res.data?.message || 'Xóa thất bại');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  };

  /* ─── VNPay Payment ─── */
  const handleVnpayPayment = async (invoiceId) => {
    try {
      toast.info('Đang tạo liên kết thanh toán VNPay...');
      const res = await paymentService.createVnpayPayment(invoiceId);
      const paymentUrl = res.data;
      if (paymentUrl) {
        window.open(paymentUrl, '_blank');
      } else {
        toast.error('Không thể tạo liên kết thanh toán');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo thanh toán VNPay');
    }
  };

  const getApartmentLabel = (apt) => {
    if (!apt) return '—';
    return `${apt.block ? `${apt.block}-` : ''}${apt.apartmentNumber || ''}${apt.floor != null ? ` (Tầng ${apt.floor})` : ''}`;
  };

  /* ─── Table Fee handlers ─── */
  const openTableFeeEdit = (fee, index) => {
    setEditingFee(fee ? { ...fee, _index: index } : null);
    setTableFeeForm({
      title: fee?.title || '',
      electricFee: fee?.electricFee != null ? String(fee.electricFee) : '',
      waterFee: fee?.waterFee != null ? String(fee.waterFee) : '',
      managementFee: fee?.managementFee != null ? String(fee.managementFee) : '',
      parkingFee: fee?.parkingFee != null ? String(fee.parkingFee) : '',
      otherFee: fee?.otherFee != null ? String(fee.otherFee) : '',
    });
    setTableFeeEditOpen(true);
  };

  const handleTableFeeSubmit = async (e) => {
    e.preventDefault();
    setTableFeeSubmitting(true);
    try {
      const params = {
        title: tableFeeForm.title.trim(),
        electricFee: Number(tableFeeForm.electricFee) || 0,
        waterFee: Number(tableFeeForm.waterFee) || 0,
        managementFee: Number(tableFeeForm.managementFee) || 0,
        parkingFee: Number(tableFeeForm.parkingFee) || 0,
        otherFee: Number(tableFeeForm.otherFee) || 0,
      };

      let res;
      if (editingFee && editingFee._index !== undefined) {
        const feeId = tableFees[editingFee._index]?.id || tableFees[editingFee._index]?.tableFeeId;
        if (feeId) {
          res = await tableFeeService.update(feeId, params);
        } else {
          throw new Error('Không tìm thấy ID bảng phí');
        }
      } else {
        res = await tableFeeService.create(params);
      }

      if (res.data?.status !== false) {
        toast.success(editingFee ? 'Cập nhật bảng phí thành công!' : 'Tạo bảng phí thành công!');
        setTableFeeEditOpen(false);
        fetchTableFees();
      } else {
        toast.error(res.data?.message || 'Thao tác thất bại');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setTableFeeSubmitting(false);
    }
  };

  const handleTableFeeDelete = async (idxToDel) => {
    const targetIdx = idxToDel !== undefined ? idxToDel : (editingFee?._index !== undefined ? editingFee._index : selectedFeeIndex);
    if (targetIdx === undefined || targetIdx < 0 || targetIdx >= tableFees.length) return;
    
    setFeeDeleteTargetIdx(targetIdx);
    setFeeDeleteModalOpen(true);
  };

  const executeTableFeeDelete = async () => {
    if (feeDeleteTargetIdx === null) return;
    
    setFeeDeleting(true);
    try {
      const targetFee = tableFees[feeDeleteTargetIdx];
      const feeId = targetFee?.id || targetFee?.tableFeeId;
      if (!feeId) throw new Error('Không tìm thấy ID bảng phí (Lỗi API không trả về ID)');
      
      const res = await tableFeeService.delete(feeId);
      if (res.data?.status !== false) {
        toast.success('Xóa bảng phí thành công!');
        setTableFeeEditOpen(false);
        setFeeDeleteModalOpen(false);
        if (selectedFeeIndex === feeDeleteTargetIdx && tableFees.length > 1) {
          setSelectedFeeIndex(0);
        }
        fetchTableFees();
      } else {
        toast.error(res.data?.message || 'Xóa thất bại');
      }
    } catch (err) {
      toast.error(err.message || err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setFeeDeleting(false);
      setFeeDeleteTargetIdx(null);
    }
  };

  /* ─── Fee table data rows ─── */
  const feeTableRows = activeFee ? [
    { label: 'Phí quản lý căn hộ', sub: 'Phí duy trì hoạt động chung cư', value: activeFee.managementFee, unit: 'tháng' },
    { label: 'Phí gửi xe', sub: 'Ô tô, xe máy, xe đạp', value: activeFee.parkingFee, unit: 'tháng' },
    { label: 'Điện', sub: 'Tiêu thụ điện năng', value: activeFee.electricFee, unit: 'kWh' },
    { label: 'Nước', sub: 'Tiêu thụ nước', value: activeFee.waterFee, unit: 'm³' },
    { label: 'Phí khác', sub: 'Các phí phát sinh khác', value: activeFee.otherFee, unit: 'tháng' },
  ] : [];

  /* ─── render ─── */
  return (
    <div className="page">
      {/* ═══════════ BẢNG PHÍ DỊCH VỤ ═══════════ */}
      <div style={{
        background: 'var(--card-bg, #fff)',
        borderRadius: '12px',
        border: '1px solid var(--border, #e2e8f0)',
        padding: '1rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff',
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                <rect x="2" y="3" width="20" height="18" rx="2" /><line x1="2" y1="9" x2="22" y2="9" /><line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text, #1e293b)' }}>Bảng phí dịch vụ</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                {activeFee?.title || 'Bảng giá phí dịch vụ chung cư'}
              </p>
            </div>
          </div>
          {tableFees.length === 0 ? (
            <button className="btn btn--primary btn--sm" onClick={() => openTableFeeEdit(null)}>
              <span className="btn__icon">{Icons.plus}</span> Tạo bảng phí
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {tableFees.length > 1 && (
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setFeeDropdownOpen(!feeDropdownOpen)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border, #e2e8f0)',
                      background: 'var(--card-bg, #fff)',
                      color: 'var(--text, #1e293b)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                      boxShadow: feeDropdownOpen ? '0 4px 12px rgba(69, 41, 41, 0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
                      width: '280px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {tableFees[selectedFeeIndex]?.title || 'Bảng phí ' + (selectedFeeIndex + 1)}
                    <svg style={{ width: '1rem', height: '1rem', transform: feeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>
                  {feeDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '0.5rem',
                      background: 'var(--card-bg, #fff)',
                      border: '1px solid var(--border, #e2e8f0)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      zIndex: 10,
                      minWidth: '200px',
                    }}>
                      {tableFees.map((fee, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedFeeIndex(idx);
                            setFeeDropdownOpen(false);
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '0.75rem 1rem',
                            textAlign: 'left',
                            border: 'none',
                            background: selectedFeeIndex === idx ? '#e0e7ff' : 'transparent',
                            color: selectedFeeIndex === idx ? '#1d4ed8' : 'var(--text, #1e293b)',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                            borderBottom: idx < tableFees.length - 1 ? '1px solid var(--border, #e2e8f0)' : 'none',
                            fontWeight: selectedFeeIndex === idx ? 700 : 500,
                          }}
                          onMouseEnter={(e) => {
                            if (selectedFeeIndex !== idx) e.target.style.background = '#f1f5f9';
                          }}
                          onMouseLeave={(e) => {
                            if (selectedFeeIndex !== idx) e.target.style.background = 'transparent';
                          }}
                        >
                          {fee.title || 'Bảng phí ' + (idx + 1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button className="btn btn--ghost btn--sm" onClick={() => openTableFeeEdit(activeFee, selectedFeeIndex)} title="Chỉnh sửa">
                <span className="btn__icon">{Icons.edit}</span>
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => {
                handleTableFeeDelete(selectedFeeIndex);
              }} title="Xóa bảng phí">
                <span className="btn__icon">{Icons.trash}</span>
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => openTableFeeEdit(null)} title="Thêm bảng phí">
                <span className="btn__icon">{Icons.plus}</span>
              </button>
            </div>
          )}
        </div>

        {tableFeeLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>
            <div className="spinner" style={{ margin: '0 auto 0.5rem' }} /> Đang tải bảng phí...
          </div>
        ) : tableFees.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>
            <p>Chưa có bảng phí dịch vụ nào. Hãy tạo bảng phí để sử dụng khi tạo hóa đơn.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
          }}>
            {feeTableRows.map((row, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-secondary, #f8fafc)',
                  border: '1px solid var(--border, #e2e8f0)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #64748b)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {row.label}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1d4ed8' }}>
                  {shortMoney(row.value)}/{row.unit}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════ QUẢN LÝ HÓA ĐƠN ═══════════ */}
      {/* Header */}
      <div className="page__header">
        <div>
          <h2 className="page__title">Quản lý hóa đơn</h2>
          <p className="page__desc">Quản lý hóa đơn thu phí căn hộ ({totalElements} hóa đơn)</p>
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <span className="btn__icon">{Icons.plus}</span>
          Tạo hóa đơn
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
            {sortDirection === 'asc' ? '↑ Cũ nhất' : '↓ Mới nhất'}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={fetchInvoices} title="Làm mới">
            <span className="btn__icon">{Icons.refresh}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="page__table-wrapper">
        {loading ? (
          <div className="page__loading"><div className="spinner" /><span>Đang tải dữ liệu...</span></div>
        ) : invoices.length === 0 ? (
          <div className="page__empty"><p>Không tìm thấy hóa đơn nào</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="data-table__th--id">ID</th>
                <th>Số hóa đơn</th>
                <th>Căn hộ</th>
                <th>Tổng tiền</th>
                <th>Hạn thanh toán</th>
                <th>Trạng thái</th>
                <th className="data-table__th--actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const sc = statusColor[inv.invoiceStatus] || { color: '#6b7280', bg: '#f3f4f6' };
                return (
                  <tr key={inv.invoiceId}>
                    <td className="data-table__cell--id">{inv.invoiceId}</td>
                    <td className="data-table__cell--bold">{inv.invoiceNumber || '—'}</td>
                    <td>{getApartmentLabel(inv.apartment)}</td>
                    <td style={{ fontWeight: 600 }}>{money(inv.totalAmount)}</td>
                    <td>{formatDate(inv.dueDate)}</td>
                    <td>
                      <span className="badge" style={{ color: sc.color, backgroundColor: sc.bg }}>
                        {statusLabel[inv.invoiceStatus] || inv.invoiceStatus}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn action-btn--view" title="Xem" onClick={() => openViewModal(inv)}>{Icons.eye}</button>
                        <button className="action-btn action-btn--edit" title="Sửa" onClick={() => openEditModal(inv)}>{Icons.edit}</button>
                        <button className="action-btn action-btn--delete" title="Xóa" onClick={() => openDeleteModal(inv)}>{Icons.trash}</button>
                        {inv.invoiceStatus === 'UNPAID' && (
                          <button
                            className="action-btn"
                            title="Thanh toán VNPay"
                            onClick={() => handleVnpayPayment(inv.invoiceId)}
                            style={{ color: '#0066cc', background: '#e0f0ff' }}
                          >
                            {Icons.vnpay}
                          </button>
                        )}
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
          <span className="pagination__info">Trang {page + 1} / {totalPages} — Tổng {totalElements} bản ghi</span>
          <div className="pagination__btns">
            <button className="pagination__btn" disabled={page === 0} onClick={() => setPage(0)} title="Trang đầu">««</button>
            <button className="pagination__btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>{Icons.chevronLeft}</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i;
              else if (page < 3) pageNum = i;
              else if (page > totalPages - 4) pageNum = totalPages - 5 + i;
              else pageNum = page - 2 + i;
              return (
                <button key={pageNum} className={`pagination__btn pagination__btn--num ${page === pageNum ? 'pagination__btn--active' : ''}`} onClick={() => setPage(pageNum)}>{pageNum + 1}</button>
              );
            })}
            <button className="pagination__btn" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>{Icons.chevronRight}</button>
            <button className="pagination__btn" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)} title="Trang cuối">»»</button>
          </div>
        </div>
      )}

      {/* ═══════════ CREATE / EDIT INVOICE MODAL ═══════════ */}
      {modalOpen && (modalMode === 'create' || modalMode === 'edit') && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{modalMode === 'create' ? 'Tạo hóa đơn mới' : 'Chỉnh sửa hóa đơn'}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {tableFees.length > 0 && (
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setModalFeeDropdownOpen(!modalFeeDropdownOpen)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: '2px solid #8b5cf6',
                        background: '#fff',
                        color: '#1e293b',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s ease',
                        width: '280px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {tableFees[selectedFeeIndex]?.title || 'Chọn bảng phí'}
                      <svg style={{ width: '1rem', height: '1rem', transform: modalFeeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    {modalFeeDropdownOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '0.5rem',
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        zIndex: 100,
                        minWidth: '250px',
                      }}>
                        {tableFees.map((fee, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedFeeIndex(idx);
                              setModalFeeDropdownOpen(false);
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '0.75rem 1rem',
                              textAlign: 'left',
                              border: 'none',
                              background: selectedFeeIndex === idx ? '#fef3c7' : 'transparent',
                              color: selectedFeeIndex === idx ? '#d97706' : '#1e293b',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              transition: 'background 0.15s ease',
                              borderBottom: idx < tableFees.length - 1 ? '1px solid #e2e8f0' : 'none',
                              fontWeight: selectedFeeIndex === idx ? 700 : 500,
                            }}
                            onMouseEnter={(e) => {
                              if (selectedFeeIndex !== idx) e.target.style.background = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              if (selectedFeeIndex !== idx) e.target.style.background = 'transparent';
                            }}
                          >
                            {fee.title || 'Bảng phí ' + (idx + 1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <button className="modal__close" onClick={() => setModalOpen(false)}>{Icons.close}</button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="modal__body">
              <div className="form-grid">
                {/* Invoice number */}
                <div className="form-field">
                  <label className="form-label">Số hóa đơn <span className="form-required">*</span></label>
                  <input
                    className={`form-input ${formErrors.invoiceNumber ? 'form-input--error' : ''}`}
                    value={formData.invoiceNumber}
                    onChange={(e) => handleFormChange('invoiceNumber', e.target.value)}
                    placeholder="VD: HD-001"
                  />
                  {formErrors.invoiceNumber && <span className="form-error">{formErrors.invoiceNumber}</span>}
                </div>

                {/* Due date */}
                <div className="form-field">
                  <label className="form-label">Hạn thanh toán <span className="form-required">*</span></label>
                  <DatePicker
                    selected={formData.dueDate ? new Date(formData.dueDate) : null}
                    onChange={(date) => handleFormChange('dueDate', date ? date.toISOString().substring(0, 10) : '')}
                    dateFormat="dd/MM/yyyy"
                    locale="vi"
                    placeholderText="dd/MM/yyyy"
                    className={`form-input ${formErrors.dueDate ? 'form-input--error' : ''}`}
                    isClearable
                  />
                  {formErrors.dueDate && <span className="form-error">{formErrors.dueDate}</span>}
                </div>

                {/* Electric fee */}
                {/* Electric quantity */}
                <div className="form-field">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    Tiền điện (VNĐ)
                    {activeFee && activeFee.electricFee > 0 && (
                      <span style={{ color: '#e74c3c', fontSize: '0.8rem', fontWeight: 600 }}>
                        {shortMoney(activeFee.electricFee)}/kWh
                      </span>
                    )}
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formatInputCurrency(formData.electricQuantity)}
                    onChange={(e) => handleFormChange('electricQuantity', parseInputCurrency(e.target.value))}
                    placeholder="Nhập số điện tiêu thụ" 
                  />
                </div>

                {/* Water quantity */}
                <div className="form-field">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    Tiền nước (VNĐ)
                    {activeFee && activeFee.waterFee > 0 && (
                      <span style={{ color: '#e74c3c', fontSize: '0.8rem', fontWeight: 600 }}>
                        {shortMoney(activeFee.waterFee)}/m³
                      </span>
                    )}
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formatInputCurrency(formData.waterQuantity)}
                    onChange={(e) => handleFormChange('waterQuantity', parseInputCurrency(e.target.value))}
                    placeholder="Nhập số nước tiêu thụ" 
                  />
                </div>

                {/* Electric fee (auto-calculated) */}
                <div className="form-field">
                  <label className="form-label">Tổng tiền điện (VNĐ)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formatInputCurrency(formData.electricFee)}
                    readOnly
                    placeholder="Tự động tính từ số điện" 
                    style={{ background: '#d1fae5', color: '#047857', cursor: 'not-allowed', fontWeight: 600 }}
                  />
                </div>

                {/* Water fee (auto-calculated) */}
                <div className="form-field">
                  <label className="form-label">Tổng tiền nước (VNĐ)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formatInputCurrency(formData.waterFee)}
                    readOnly
                    placeholder="Tự động tính từ số nước" 
                    style={{ background: '#d1fae5', color: '#047857', cursor: 'not-allowed', fontWeight: 600 }}
                  />
                </div>
                {/* Management fee */}
                <div className="form-field">
                  <label className="form-label">Phí quản lý (VNĐ)</label>
                  <input type="text" className="form-input" value={formatInputCurrency(formData.managementFee)}
                    onChange={(e) => handleFormChange('managementFee', parseInputCurrency(e.target.value))}
                    placeholder={activeFee ? 'Tự động fill phí quản lý từ phí dịch vụ' : '0'} />
                </div>
                {/* Parking fee */}
                <div className="form-field">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    Phí gửi xe (VNĐ)
                  </label>
                  <input type="text" className="form-input" value={formatInputCurrency(formData.parkingFee)}
                    onChange={(e) => handleFormChange('parkingFee', parseInputCurrency(e.target.value))}
                    placeholder={activeFee ? 'Tự động fill phí gửi xe từ bảng phí dịch vụ' : '0'} />
                </div>
                {/* Other fee */}
                <div className="form-field form-field--full">
                  <label className="form-label">Phí khác (VNĐ)</label>
                  <input type="text" className="form-input" value={formatInputCurrency(formData.otherFee)}
                    onChange={(e) => handleFormChange('otherFee', parseInputCurrency(e.target.value))}
                    placeholder={activeFee ? 'Tự động fill phí khác từ bảng phí dịch vụ' : '0'} />
                </div>

                {/* Status (edit only) */}
                {modalMode === 'edit' && (
                  <div className="form-field">
                    <label className="form-label">Trạng thái</label>
                    <select className="form-select" value={formData.invoiceStatus}
                      onChange={(e) => handleFormChange('invoiceStatus', e.target.value)}>
                      <option value="UNPAID">Chưa thanh toán</option>
                      <option value="PAID">Đã thanh toán</option>
                    </select>
                  </div>
                )}

                {/* Apartment selection (create only) */}
                {modalMode === 'create' && (() => {
                  const blocks = [...new Set(apartments.map(a => a.block).filter(Boolean))].sort();
                  const floors = [...new Set(apartments.map(a => a.floor).filter(v => v != null))].sort((a, b) => a - b);
                  const filteredApts = apartments.filter(a => {
                    if (aptFilterBlock && a.block !== aptFilterBlock) return false;
                    if (aptFilterFloor && a.floor !== Number(aptFilterFloor)) return false;
                    return true;
                  });
                  return (
                    <div className="form-field form-field--full">
                      <label className="form-label">Căn hộ <span className="form-required">*</span></label>
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <select className="form-select" value={aptFilterBlock} onChange={(e) => setAptFilterBlock(e.target.value)} style={{ flex: 1 }}>
                          <option value="">Tất cả tòa nhà</option>
                          {blocks.map(b => <option key={b} value={b}>Tòa {b}</option>)}
                        </select>
                        <select className="form-select" value={aptFilterFloor} onChange={(e) => setAptFilterFloor(e.target.value)} style={{ flex: 1 }}>
                          <option value="">Tất cả tầng</option>
                          {floors.map(f => <option key={f} value={f}>Tầng {f}</option>)}
                        </select>
                      </div>
                      <div className="resident-select">
                        {filteredApts.length === 0 ? (
                          <p className="resident-select__empty">Không tìm thấy căn hộ nào</p>
                        ) : (
                          <div className="resident-select__grid">
                            {filteredApts.map((apt) => {
                              const selected = String(formData.apartmentId) === String(apt.id);
                              return (
                                <label key={apt.id} className={`resident-select__item ${selected ? 'resident-select__item--active' : ''}`}>
                                  <input type="radio" name="apartmentSelect" checked={selected}
                                    onChange={() => handleFormChange('apartmentId', apt.id)} className="resident-select__checkbox" />
                                  <div className="resident-select__info">
                                    <span className="resident-select__name">Căn {apt.apartmentNumber}</span>
                                    <span className="resident-select__sub">{apt.block ? `Tòa ${apt.block} · ` : ''}Tầng {apt.floor}{apt.area ? ` · ${apt.area}m²` : ''}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {formErrors.apartmentId && <span className="form-error">{formErrors.apartmentId}</span>}
                    </div>
                  );
                })()}
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : modalMode === 'create' ? 'Tạo hóa đơn' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════ VIEW MODAL ═══════════ */}
      {modalOpen && modalMode === 'view' && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Chi tiết hóa đơn</h3>
              <button className="modal__close" onClick={() => setModalOpen(false)}>{Icons.close}</button>
            </div>
            <div className="modal__body">
              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">ID</span>
                  <span className="detail-value">{selectedInvoice.invoiceId}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Số hóa đơn</span>
                  <span className="detail-value detail-value--bold">{selectedInvoice.invoiceNumber || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Căn hộ</span>
                  <span className="detail-value">{getApartmentLabel(selectedInvoice.apartment)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Trạng thái</span>
                  <span className="detail-value">
                    <span className="badge" style={{
                      color: statusColor[selectedInvoice.invoiceStatus]?.color || '#6b7280',
                      backgroundColor: statusColor[selectedInvoice.invoiceStatus]?.bg || '#f3f4f6',
                    }}>
                      {statusLabel[selectedInvoice.invoiceStatus] || selectedInvoice.invoiceStatus}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Hạn thanh toán</span>
                  <span className="detail-value">{formatDate(selectedInvoice.dueDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Người tạo</span>
                  <span className="detail-value">{selectedInvoice.creator?.fullName || '—'}</span>
                </div>
              </div>

              {/* Fee breakdown */}
              <h4 style={{ margin: '1.5rem 0 0.75rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text, #1e293b)' }}>Chi tiết phí</h4>
              <table className="data-table" style={{ marginBottom: '1rem' }}>
                <thead>
                  <tr>
                    <th>Hạng mục</th>
                    <th style={{ textAlign: 'right' }}>Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Tiền điện</td><td style={{ textAlign: 'right' }}>{money(selectedInvoice.electricFee)}</td></tr>
                  <tr><td>Tiền nước</td><td style={{ textAlign: 'right' }}>{money(selectedInvoice.waterFee)}</td></tr>
                  <tr><td>Phí quản lý</td><td style={{ textAlign: 'right' }}>{money(selectedInvoice.managementFee)}</td></tr>
                  <tr><td>Phí gửi xe</td><td style={{ textAlign: 'right' }}>{money(selectedInvoice.parkingFee)}</td></tr>
                  <tr><td>Phí khác</td><td style={{ textAlign: 'right' }}>{money(selectedInvoice.otherFee)}</td></tr>
                  <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border, #e2e8f0)' }}>
                    <td>Tổng cộng</td>
                    <td style={{ textAlign: 'right', color: '#dc2626' }}>{money(selectedInvoice.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Payment history */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <>
                  <h4 style={{ margin: '1.5rem 0 0.75rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text, #1e293b)' }}>Lịch sử thanh toán</h4>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mã GD</th>
                        <th>Số tiền</th>
                        <th>Thời gian</th>
                        <th>Phương thức</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.payments.map((p) => {
                        const psc = paymentStatusColor[p.paymentStatus] || { color: '#6b7280', bg: '#f3f4f6' };
                        return (
                          <tr key={p.paymentId}>
                            <td style={{ fontSize: '0.85rem' }}>{p.transactionCode || '—'}</td>
                            <td>{money(p.amount)}</td>
                            <td>{formatDateTime(p.paymentDateTime)}</td>
                            <td>{p.paymentMethod || '—'}</td>
                            <td>
                              <span className="badge" style={{ color: psc.color, backgroundColor: psc.bg }}>
                                {paymentStatusLabel[p.paymentStatus] || p.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setModalOpen(false)}>Đóng</button>
              {selectedInvoice.invoiceStatus === 'UNPAID' && (
                <button
                  className="btn"
                  onClick={() => handleVnpayPayment(selectedInvoice.invoiceId)}
                  style={{
                    background: 'linear-gradient(135deg, #0066cc, #004499)',
                    color: '#fff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span className="btn__icon">{Icons.vnpay}</span>
                  Thanh toán VNPay
                </button>
              )}
              <button className="btn btn--primary" onClick={() => { setModalOpen(false); setTimeout(() => openEditModal(selectedInvoice), 100); }}>
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ DELETE MODAL ═══════════ */}
      {deleteModalOpen && deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header modal__header--danger">
              <h3 className="modal__title">Xác nhận xóa</h3>
              <button className="modal__close" onClick={() => setDeleteModalOpen(false)}>{Icons.close}</button>
            </div>
            <div className="modal__body">
              <div className="delete-confirm">
                <div className="delete-confirm__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className="delete-confirm__text">
                  Bạn có chắc chắn muốn xóa hóa đơn <strong>"{deleteTarget.invoiceNumber}"</strong>?
                </p>
                <p className="delete-confirm__sub">Hành động này không thể hoàn tác.</p>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setDeleteModalOpen(false)}>Hủy</button>
              <button className="btn btn--danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TABLE FEE DELETE MODAL ═══════════ */}
      {feeDeleteModalOpen && feeDeleteTargetIdx !== null && (
        <div className="modal-overlay" onClick={() => setFeeDeleteModalOpen(false)} style={{ zIndex: 1100 }}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header modal__header--danger">
              <h3 className="modal__title">Xác nhận xóa bảng phí</h3>
              <button className="modal__close" onClick={() => setFeeDeleteModalOpen(false)}>{Icons.close}</button>
            </div>
            <div className="modal__body">
              <div className="delete-confirm">
                <div className="delete-confirm__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className="delete-confirm__text">
                  Bạn có chắc chắn muốn xóa bảng phí <strong>"{tableFees[feeDeleteTargetIdx]?.title || 'Bảng phí này'}"</strong>?
                </p>
                <p className="delete-confirm__sub">Hành động này không thể hoàn tác.</p>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setFeeDeleteModalOpen(false)}>Hủy</button>
              <button className="btn btn--danger" onClick={executeTableFeeDelete} disabled={feeDeleting}>
                {feeDeleting ? 'Đang xóa...' : 'Xóa bảng phí'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TABLE FEE EDIT MODAL ═══════════ */}
      {tableFeeEditOpen && (
        <div className="modal-overlay" onClick={() => setTableFeeEditOpen(false)}>
          <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{editingFee ? 'Chỉnh sửa bảng phí dịch vụ' : 'Tạo bảng phí dịch vụ'}</h3>
              <button className="modal__close" onClick={() => setTableFeeEditOpen(false)}>{Icons.close}</button>
            </div>
            <form onSubmit={handleTableFeeSubmit} className="modal__body">
              <div className="form-grid">
                <div className="form-field form-field--full">
                  <label className="form-label">Tiêu đề</label>
                  <input className="form-input" value={tableFeeForm.title}
                    onChange={(e) => setTableFeeForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="VD: Bảng phí dịch vụ cho toàn bộ Chung Cư" />
                </div>
                <div className="form-field">
                  <label className="form-label">Phí điện (VNĐ/kWh)</label>
                  <input type="text" className="form-input" value={formatInputCurrency(tableFeeForm.electricFee)}
                    onChange={(e) => setTableFeeForm(p => ({ ...p, electricFee: parseInputCurrency(e.target.value) }))} placeholder="0" />
                </div>
                <div className="form-field">
                  <label className="form-label">Phí nước (VNĐ/m³)</label>
                  <input type="text" className="form-input" value={formatInputCurrency(tableFeeForm.waterFee)}
                    onChange={(e) => setTableFeeForm(p => ({ ...p, waterFee: parseInputCurrency(e.target.value) }))} placeholder="0" />
                </div>
                <div className="form-field">
                  <label className="form-label">Phí quản lý (VNĐ/tháng)</label>
                  <input type="text" className="form-input" value={formatInputCurrency(tableFeeForm.managementFee)}
                    onChange={(e) => setTableFeeForm(p => ({ ...p, managementFee: parseInputCurrency(e.target.value) }))} placeholder="0" />
                </div>
                <div className="form-field">
                  <label className="form-label">Phí gửi xe (VNĐ/tháng)</label>
                  <input type="text" className="form-input" value={formatInputCurrency(tableFeeForm.parkingFee)}
                    onChange={(e) => setTableFeeForm(p => ({ ...p, parkingFee: parseInputCurrency(e.target.value) }))} placeholder="0" />
                </div>
                <div className="form-field form-field--full">
                  <label className="form-label">Phí khác (VNĐ)</label>
                  <input type="text" className="form-input" value={formatInputCurrency(tableFeeForm.otherFee)}
                    onChange={(e) => setTableFeeForm(p => ({ ...p, otherFee: parseInputCurrency(e.target.value) }))} placeholder="0" />
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setTableFeeEditOpen(false)}>Hủy</button>

                <button type="submit" className="btn btn--primary" disabled={tableFeeSubmitting}>
                  {tableFeeSubmitting ? 'Đang xử lý...' : editingFee ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
