import { useState, useEffect, useCallback } from 'react';
import { exportToExcel } from '../utils/exportExcel';
import { toast } from 'react-toastify';
import DatePicker, { registerLocale } from 'react-datepicker';
import { vi } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import invoiceService from '../services/invoiceService';
import apartmentService from '../services/apartmentService';
import tableFeeService from '../services/tableFeeService';
import tableElectricTierService from '../services/tableElectricTierService';
import paymentService from '../services/paymentService';
import evnService from '../services/evnService';
import waterService from '../services/waterService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SearchableSelect from '../components/common/SearchableSelect';

registerLocale('vi', vi);

/* ─── constants ─── */
const STATUSES = [
  { value: '', label: 'Tất cả' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'UNPAID', label: 'Chưa thanh toán' },
  { value: 'OVERDUE', label: 'Quá hạn' },
];

const statusLabel = { PAID: 'Đã thanh toán', UNPAID: 'Chưa thanh toán', OVERDUE: 'Quá hạn' };
const statusColor = {
  PAID: { color: '#059669', bg: '#d1fae5' },
  UNPAID: { color: '#dc2626', bg: '#fee2e2' },
  OVERDUE: { color: '#c2410c', bg: '#ffedd5' },
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
  momo: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" /><path d="M12 10v4" /><path d="M10 12h4" /><line x1="1" y1="10" x2="23" y2="10" /></svg>),
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
    descriptionOtherFee: '',
    apartmentId: '',
    invoiceStatus: 'UNPAID',
    electricQuantity: '',
    waterQuantity: '',
    electricStartDate: '',
    electricEndDate: '',
    numberOfHouseholds: '1',
  });
  const [isCalculatingElectric, setIsCalculatingElectric] = useState(false);
  const [evnMockInfo, setEvnMockInfo] = useState({ loading: false, data: null, error: null });
  const [waterMockInfo, setWaterMockInfo] = useState({ loading: false, data: null, error: null });
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

  // Payment method modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payInvoiceId, setPayInvoiceId] = useState(null);
  const [payMethod, setPayMethod] = useState(''); // MOMO, CASH, BANK_TRANSFER
  const [payNote, setPayNote] = useState('');
  const [payTxnNo, setPayTxnNo] = useState('');
  const [payBank, setPayBank] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);

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
    title: '', electricFee: '', waterFee: '', managementFee: '', parkingFee: '', otherFee: '', descriptionOtherFee: '',
  });
  const [tableFeeSubmitting, setTableFeeSubmitting] = useState(false);
  const [selectedFeeIndex, setSelectedFeeIndex] = useState(0); // index của bảng phí được chọn
  const [feeDropdownOpen, setFeeDropdownOpen] = useState(false); // dropdown menu state
  const [modalFeeDropdownOpen, setModalFeeDropdownOpen] = useState(false); // modal dropdown menu state

  // Tiered Electric
  const [electricTiers, setElectricTiers] = useState([]);
  const [useTieredElectric, setUseTieredElectric] = useState(false);
  const [tierSubmitting, setTierSubmitting] = useState(false);
  const [editingTierId, setEditingTierId] = useState(null); // 'new' or tier.id
  const [tierForm, setTierForm] = useState({ tierOrder: '', limitValue: '', unitPrice: '' });

  // Batch Invoice
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchDueDate, setBatchDueDate] = useState('');
  const [batchSelectedApts, setBatchSelectedApts] = useState([]);
  const [batchFeeIndex, setBatchFeeIndex] = useState(0);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchFilterBlock, setBatchFilterBlock] = useState('');
  const [batchFilterFloor, setBatchFilterFloor] = useState('');

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

  const fetchGlobalTiers = useCallback(async () => {
    try {
      const res = await tableElectricTierService.getAll();
      setElectricTiers(res.data?.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách cấu hình giá điện bậc thang:', err);
      setElectricTiers([]);
    }
  }, []);

  useEffect(() => {
    const activeFee = tableFees.length > 0 ? tableFees[selectedFeeIndex] : null;
    const isTiered = activeFee?.useTieredElectric;
    
    if (modalOpen && modalMode === 'create' && isTiered && formData.apartmentId) {
      const apt = apartments.find(a => String(a.id) === String(formData.apartmentId));
      if (apt && apt.ownerId) {
        setEvnMockInfo({ loading: true, data: null, error: null });
        evnService.getBillByResidentId(apt.ownerId)
          .then(res => {
            if (res.data?.status) {
              const d = res.data.data;
              setEvnMockInfo({ loading: false, data: d, error: null });
              setFormData(prev => ({ ...prev, electricQuantity: String(d.kwhConsumed) }));
              toast.success('Đã tự động lấy biểu điện EVN (Mock)');
            } else {
              setEvnMockInfo({ loading: false, data: null, error: res.data?.message || 'Không lấy được EVN' });
            }
          })
          .catch(err => {
            setEvnMockInfo({ loading: false, data: null, error: 'Chưa có hóa đơn EVN' });
          });
      } else {
         setEvnMockInfo({ loading: false, data: null, error: 'Căn hộ chưa có chủ sở hữu (residentId)' });
      }
    } else {
      setEvnMockInfo({ loading: false, data: null, error: null });
    }
  }, [modalOpen, modalMode, formData.apartmentId, tableFees, selectedFeeIndex, apartments]);

  // Fetch water mock data when apartment changes
  useEffect(() => {
    if (modalOpen && modalMode === 'create' && formData.apartmentId) {
      const apt = apartments.find(a => String(a.id) === String(formData.apartmentId));
      if (apt && apt.ownerId) {
        setWaterMockInfo({ loading: true, data: null, error: null });
        waterService.getBillByResidentId(apt.ownerId)
          .then(res => {
            if (res.data?.status) {
              const d = res.data.data;
              setWaterMockInfo({ loading: false, data: d, error: null });
              setFormData(prev => {
                const qty = d.cubicMeterConsumed;
                const fee = (activeFee && activeFee.waterFee > 0 && qty > 0) ? String(qty * Number(activeFee.waterFee)) : '';
                return { ...prev, waterQuantity: String(qty), waterFee: fee };
              });
            } else {
              setWaterMockInfo({ loading: false, data: null, error: res.data?.message || 'Không lấy được dữ liệu nước' });
            }
          })
          .catch(err => {
            setWaterMockInfo({ loading: false, data: null, error: 'Chưa có hóa đơn nước' });
          });
      } else {
        setWaterMockInfo({ loading: false, data: null, error: 'Căn hộ chưa có chủ sở hữu' });
      }
    } else {
      setWaterMockInfo({ loading: false, data: null, error: null });
    }
  }, [modalOpen, modalMode, formData.apartmentId, apartments]);

  const handleTierEdit = (tier) => {
    setEditingTierId(tier.id);
    setTierForm({
      tierOrder: tier.tierOrder != null ? String(tier.tierOrder) : '',
      limitValue: tier.limitValue != null ? String(tier.limitValue) : '',
      unitPrice: tier.unitPrice != null ? String(tier.unitPrice) : '',
    });
  };

  const handleTierCancel = () => {
    setEditingTierId(null);
    setTierForm({ tierOrder: '', limitValue: '', unitPrice: '' });
  };

  const handleTierSave = async (id) => {
    try {
      const params = {
        tierOrder: Number(tierForm.tierOrder) || 0,
        limitValue: tierForm.limitValue ? Number(tierForm.limitValue) : null,
        unitPrice: Number(tierForm.unitPrice) || 0,
      };
      if (id === 'new') {
        await tableElectricTierService.create(params);
        toast.success("Thêm bậc điện thành công!");
      } else {
        await tableElectricTierService.update(id, params);
        toast.success("Cập nhật bậc điện thành công!");
      }
      setEditingTierId(null);
      fetchGlobalTiers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu bậc.');
      console.error(err);
    }
  };

  const handleTierDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa bậc điện này?")) return;
    try {
      await tableElectricTierService.delete(id);
      toast.success("Xóa bậc điện thành công!");
      fetchGlobalTiers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa bậc.');
      console.error(err);
    }
  };

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
        descriptionOtherFee: activeFee.descriptionOtherFee || '',
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
    
    // Ngày hiện tại
    const s_yyyy = today.getFullYear();
    const s_mm = String(today.getMonth() + 1).padStart(2, '0');
    const s_dd = String(today.getDate()).padStart(2, '0');
    const defaultStartDate = `${s_yyyy}-${s_mm}-${s_dd}`;
    
    setFormData({
      invoiceNumber: '', dueDate: defaultDueDate, electricFee: '', waterFee: '',
      managementFee: '', parkingFee: '', otherFee: '', descriptionOtherFee: '', apartmentId: '', invoiceStatus: 'UNPAID',
      electricQuantity: '', waterQuantity: '', electricStartDate: defaultStartDate, electricEndDate: defaultDueDate, numberOfHouseholds: '1',
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
      descriptionOtherFee: inv.descriptionOtherFee || '',
      apartmentId: inv.apartment?.id || inv.apartmentId || '',
      invoiceStatus: inv.invoiceStatus || 'UNPAID',
      electricQuantity: eq,
      waterQuantity: wq,
      electricStartDate: '',
      electricEndDate: '',
      numberOfHouseholds: '1',
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
      if (field === 'electricQuantity' && activeFee) {
        if (!activeFee.useTieredElectric && activeFee.electricFee > 0) {
          const qty = Number(updated.electricQuantity);
          updated.electricFee = qty > 0 ? String(qty * Number(activeFee.electricFee)) : '';
        } else if (activeFee.useTieredElectric) {
          updated.electricFee = '';
        }
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
    if (!formData.dueDate) errors.dueDate = 'Vui lòng chọn hạn thanh toán';
    if (modalMode === 'create' && !formData.apartmentId) errors.apartmentId = 'Vui lòng chọn căn hộ';
    if (activeFee?.useTieredElectric && formData.electricQuantity && !formData.electricFee && isCalculatingElectric) {
      toast.error('Đang tính phí điện bậc thang, vui lòng chờ...');
      return false;
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      setTimeout(() => {
        const el = document.getElementById(`invoice-field-${firstErrorField}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const input = el.querySelector('input, select');
          if (input) input.focus();
        }
      }, 100);
      return false;
    }
    return true;
  };

  const handleCalculateElectric = async () => {
    if (!formData.electricQuantity || !formData.electricStartDate || !formData.electricEndDate) {
      return;
    }
    setIsCalculatingElectric(true);
    try {
      const res = await tableElectricTierService.calculator(
        Number(formData.electricQuantity),
        formData.electricStartDate,
        formData.electricEndDate,
        Number(formData.numberOfHouseholds) || 1
      );
      if (res.data?.status !== false) {
        setFormData(p => ({ ...p, electricFee: String(res.data.data || 0) }));
      } else {
        toast.error(res.data?.message || "Không thể tính phí điện");
      }
    } catch(err) {
      toast.error(err.response?.data?.message || "Lỗi khi tính phí điện");
    } finally {
      setIsCalculatingElectric(false);
    }
  };

  // Auto-calculate tiered electric fee when inputs change
  useEffect(() => {
    if (!modalOpen || !activeFee?.useTieredElectric) return;
    if (!formData.electricQuantity || !formData.electricStartDate || !formData.electricEndDate) return;
    
    const timer = setTimeout(() => {
      handleCalculateElectric();
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.electricQuantity, formData.electricStartDate, formData.electricEndDate, formData.numberOfHouseholds, modalOpen, activeFee?.useTieredElectric]);

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
      if (formData.descriptionOtherFee) payload.descriptionOtherFee = formData.descriptionOtherFee.trim();

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

  /* ─── Export Invoice PDF ─── */
  const handleExportPDF = (inv) => {
    // Strip Vietnamese diacritics (jsPDF helvetica doesn't support them)
    const rd = (str) => {
      if (!str) return '';
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, (c) => c === 'đ' ? 'd' : 'D');
    };

    const doc = new jsPDF();
    const fmt = (val) => val != null ? new Intl.NumberFormat('vi-VN').format(val) + ' VND' : '0 VND';
    const apt = inv.apartment;
    const aptLabel = apt ? 'Can ' + apt.apartmentNumber + (apt.block ? ' - Toa ' + apt.block : '') + (apt.floor ? ' - Tang ' + apt.floor : '') : 'N/A';

    // Lookup owner name
    let ownerName = 'N/A';
    if (apt) {
      const fullApt = apartments.find(a => a.id === apt.id);
      if (fullApt) {
        if (fullApt.residents && fullApt.residents.length > 0) {
          const owner = fullApt.residents.find(r => r.id === fullApt.ownerId);
          if (owner) ownerName = rd(owner.fullName);
          else ownerName = rd(fullApt.residents[0]?.fullName) || 'N/A';
        }
      }
    }

    // Creator
    const creatorName = rd(inv.creator?.fullName || inv.creator?.username || 'Admin');

    // Created date - try multiple fields
    let createdDate = 'N/A';
    const rawDate = inv.createdAt || inv.createdDate || inv.created_at;
    if (rawDate) {
      try { createdDate = new Date(rawDate).toLocaleDateString('vi-VN'); } catch(e) { /* ignore */ }
    }

    const isPaid = inv.invoiceStatus === 'PAID';

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CHUNG CU HUNG THINH', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('He thong quan ly chung cu thong minh', 105, 27, { align: 'center' });

    // Line
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.8);
    doc.line(20, 32, 190, 32);

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('HOA DON DICH VU', 105, 42, { align: 'center' });

    // Invoice info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const infoY = 52;
    doc.text('So hoa don: ' + inv.invoiceNumber, 20, infoY);
    doc.text('Ngay tao: ' + createdDate, 130, infoY);
    doc.text('Can ho: ' + aptLabel, 20, infoY + 7);
    doc.text('Han thanh toan: ' + (inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('vi-VN') : 'N/A'), 130, infoY + 7);
    doc.text('Chu ho: ' + ownerName, 20, infoY + 14);
    doc.text('Nguoi tao: ' + creatorName, 130, infoY + 14);
    // Status
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isPaid ? 16 : 239, isPaid ? 185 : 68, isPaid ? 129 : 68);
    doc.text('Trang thai: ' + (isPaid ? 'DA THANH TOAN' : 'CHUA THANH TOAN'), 20, infoY + 23);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');

    // Fee table
    const fees = [];
    if (inv.electricFee > 0) fees.push(['Tien dien', fmt(inv.electricFee)]);
    if (inv.waterFee > 0) fees.push(['Tien nuoc', fmt(inv.waterFee)]);
    if (inv.managementFee > 0) fees.push(['Phi quan ly', fmt(inv.managementFee)]);
    if (inv.parkingFee > 0) fees.push(['Phi gui xe', fmt(inv.parkingFee)]);
    if (inv.otherFee > 0) fees.push([rd('Phi khac' + (inv.descriptionOtherFee ? ' (' + inv.descriptionOtherFee + ')' : '')), fmt(inv.otherFee)]);
    if (fees.length === 0) fees.push(['Khong co khoan phi nao', '0 VND']);

    autoTable(doc, {
      startY: infoY + 30,
      head: [['Khoan muc', 'Thanh tien (VND)']],
      body: fees,
      foot: [['TONG CONG', fmt(inv.totalAmount)]],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', halign: 'center' },
      footStyles: { fillColor: isPaid ? [16, 185, 129] : [239, 68, 68], textColor: 255, fontStyle: 'bold', fontSize: 12 },
      columnStyles: { 0: { cellWidth: 110 }, 1: { halign: 'right', cellWidth: 60 } },
      styles: { fontSize: 10 },
    });

    // Footer
    const finalY = (doc.lastAutoTable?.finalY || doc.previousAutoTable?.finalY || 150) + 15;
    doc.setFontSize(9);
    doc.setTextColor(130);
    doc.text('Day la hoa don duoc xuat tu he thong Quan ly Chung cu Hung Thinh.', 105, finalY, { align: 'center' });

    doc.save('HoaDon_' + inv.invoiceNumber + '.pdf');
    toast.success('Xuat PDF thanh cong!');
  };
  const openPaymentModal = (invoiceId) => {
    setPayInvoiceId(invoiceId); setPayMethod(''); setPayNote(''); setPayTxnNo(''); setPayBank('');
    setPayModalOpen(true);
  };

  const handleMomoPayment = async (invoiceId) => {
    try {
      toast.info('Đang tạo liên kết thanh toán MoMo...');
      const res = await paymentService.createMomoPayment(invoiceId);
      const paymentUrl = res.data?.data;
      if (paymentUrl && typeof paymentUrl === 'string' && paymentUrl.startsWith('http')) {
        window.open(paymentUrl, '_blank');
      } else {
        toast.error('Không thể tạo liên kết thanh toán');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo thanh toán MoMo');
    }
  };

  const handleManualPayment = async () => {
    if (!payMethod) { toast.warning('Vui lòng chọn phương thức thanh toán'); return; }
    if (payMethod === 'MOMO') {
      setPayModalOpen(false);
      handleMomoPayment(payInvoiceId);
      return;
    }
    setPaySubmitting(true);
    try {
      await paymentService.createManualPayment({
        invoiceId: payInvoiceId,
        paymentMethod: payMethod,
        note: payNote || undefined,
        transactionNo: payTxnNo || undefined,
        bankCode: payBank || undefined,
      });
      toast.success('Ghi nhận thanh toán thành công!');
      setPayModalOpen(false);
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setPaySubmitting(false);
    }
  };

  const getApartmentLabel = (apt) => {
    if (!apt) return '—';
    return `${apt.block ? `${apt.block}-` : ''}${apt.apartmentNumber || ''}${apt.floor != null ? ` (Tầng ${apt.floor})` : ''}`;
  };

  /* ─── Table Fee handlers ─── */
  const openTableFeeEdit = async (fee, index) => {
    setEditingFee(fee ? { ...fee, _index: index } : null);
    setTableFeeForm({
      title: fee?.title || '',
      electricFee: fee?.electricFee != null ? String(fee.electricFee) : '',
      waterFee: fee?.waterFee != null ? String(fee.waterFee) : '',
      managementFee: fee?.managementFee != null ? String(fee.managementFee) : '',
      parkingFee: fee?.parkingFee != null ? String(fee.parkingFee) : '',
      otherFee: fee?.otherFee != null ? String(fee.otherFee) : '',
      descriptionOtherFee: fee?.descriptionOtherFee || '',
    });
    
    setUseTieredElectric(!!fee?.useTieredElectric);
    
    fetchGlobalTiers();
    
    setTableFeeEditOpen(true);
  };

  const handleTableFeeSubmit = async (e) => {
    e.preventDefault();
    setTableFeeSubmitting(true);
    try {
      const params = {
        title: tableFeeForm.title.trim(),
        electricFee: useTieredElectric ? 0 : (Number(tableFeeForm.electricFee) || 0),
        waterFee: Number(tableFeeForm.waterFee) || 0,
        managementFee: Number(tableFeeForm.managementFee) || 0,
        parkingFee: Number(tableFeeForm.parkingFee) || 0,
        otherFee: Number(tableFeeForm.otherFee) || 0,
        descriptionOtherFee: tableFeeForm.descriptionOtherFee?.trim() || '',
        useTieredElectric: useTieredElectric,
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
    { label: 'Điện', sub: 'Tiêu thụ điện năng', value: activeFee.electricFee, unit: 'kWh', isTiered: activeFee.useTieredElectric },
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
                  {row.isTiered ? 'Lũy tiến (Bậc thang)' : `${shortMoney(row.value)}/${row.unit}`}
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn--primary" onClick={openCreateModal}>
            <span className="btn__icon">{Icons.plus}</span>
            Tạo hóa đơn
          </button>
          <button className="btn" style={{background:'linear-gradient(135deg,#6366f1,#4f46e5)',color:'#fff'}} onClick={() => { const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(d.getDate() + 1); const dd = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; setBatchModalOpen(true); setBatchSelectedApts([]); setBatchDueDate(dd); setBatchFeeIndex(0); setBatchFilterBlock(''); setBatchFilterFloor(''); }}>
            <span className="btn__icon">{Icons.plus}</span>
            Tạo hàng loạt
          </button>
          <button className="btn" style={{background:'#059669',color:'#fff'}} onClick={() => {
            const statusLabel = { PAID:'Đã thanh toán', UNPAID:'Chưa thanh toán', OVERDUE:'Quá hạn', CANCELLED:'Đã hủy' };
            exportToExcel(invoices, [
              { header: 'Mã hóa đơn', key: 'invoiceNumber', width: 18 },
              { header: 'Căn hộ', key: 'apartment', width: 20, transform: inv => inv.apartment ? `${inv.apartment.apartmentNumber} - Block ${inv.apartment.block} - Tầng ${inv.apartment.floor}` : '' },
              { header: 'Tiền điện', key: 'electricFee', width: 14 },
              { header: 'Tiền nước', key: 'waterFee', width: 14 },
              { header: 'Phí quản lý', key: 'managementFee', width: 14 },
              { header: 'Phí gửi xe', key: 'parkingFee', width: 14 },
              { header: 'Phí khác', key: 'otherFee', width: 14 },
              { header: 'Tổng tiền', key: 'totalAmount', width: 16 },
              { header: 'Hạn thanh toán', key: 'dueDate', width: 16, transform: inv => inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('vi-VN') : '' },
              { header: 'Trạng thái', key: 'invoiceStatus', width: 16, transform: inv => statusLabel[inv.invoiceStatus] || inv.invoiceStatus },
              { header: 'Người tạo', key: 'creator', width: 18, transform: inv => inv.creator?.fullName || '' },
              { header: 'Ngày tạo', key: 'createdAt', width: 20, transform: inv => inv.createdAt ? new Date(inv.createdAt).toLocaleString('vi-VN') : '' },
            ], `hoa-don-${new Date().toISOString().slice(0,10)}`, 'Hóa đơn');
            toast.success('Xuất Excel thành công!');
          }}>
            <span className="btn__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
            Xuất Excel
          </button>
        </div>
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
                        {(inv.invoiceStatus === 'UNPAID' || inv.invoiceStatus === 'OVERDUE') ? (
                          <button
                            className="action-btn"
                            title="Thanh toán"
                            onClick={() => openPaymentModal(inv.invoiceId)}
                            style={{ color: '#16a34a', background: '#dcfce7' }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                          </button>
                        ) : (
                          <button
                            className="action-btn"
                            title="Đã thanh toán"
                            disabled
                            style={{ color: '#a3e635', background: '#f0fdf4', opacity: 0.5, cursor: 'default' }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><polyline points="20 6 9 17 4 12" /></svg>
                          </button>
                        )}
                        <button className="action-btn" title="Xuất PDF" onClick={() => handleExportPDF(inv)} style={{ color: '#dc2626', background: '#fee2e2' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                        </button>
                        <button className="action-btn action-btn--edit" title="Sửa" onClick={() => openEditModal(inv)}>{Icons.edit}</button>
                        <button className="action-btn action-btn--delete" title="Xóa" onClick={() => openDeleteModal(inv)}>{Icons.trash}</button>
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
          <div className="modal" style={{ maxWidth: '850px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
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
                {/* 1. Apartment selection (create only) */}
                {modalMode === 'create' && (
                  <div className="form-field form-field--full" style={{ padding: 0, background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', padding: '0.85rem 1.25rem', borderBottom: '1px solid #cbd5e1', fontWeight: 600, color: '#3730a3', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px 8px 0 0' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                      Chọn căn hộ <span className="form-required">*</span>
                    </div>
                    <div style={{ padding: '1.25rem' }} id="invoice-field-apartmentId">
                      <SearchableSelect
                        options={apartments.map(apt => ({
                          value: apt.id,
                          label: `Căn ${apt.apartmentNumber}`,
                          sub: `${apt.block ? `Tòa ${apt.block} · ` : ''}Tầng ${apt.floor}${apt.area ? ` · ${apt.area}m²` : ''}`,
                        }))}
                        value={formData.apartmentId}
                        onChange={(val) => handleFormChange('apartmentId', val)}
                        placeholder="Tìm kiếm căn hộ..."
                        error={formErrors.apartmentId}
                      />
                      {formErrors.apartmentId && <span className="form-error" style={{ marginTop: 4 }}>{formErrors.apartmentId}</span>}
                    </div>
                  </div>
                )}

                {/* 2. Invoice Info */}
                <div className="form-field form-field--full" style={{ padding: 0, background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: 0, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', padding: '0.85rem 1.25rem', borderBottom: '1px solid #a7f3d0', fontWeight: 600, color: '#065f46', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                    Thông tin chứng từ
                  </div>
                  <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-field" style={{ marginBottom: 0 }} id="invoice-field-invoiceNumber">
                      <label className="form-label">Số hóa đơn</label>
                      <input
                        className="form-input"
                        value={formData.invoiceNumber}
                        onChange={(e) => handleFormChange('invoiceNumber', e.target.value)}
                        placeholder="Để trống sẽ tự sinh (HD-MM/YYYY-001)"
                      />
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>Để trống để hệ thống tự sinh mã</span>
                    </div>

                    <div className="form-field" style={{ marginBottom: 0 }} id="invoice-field-dueDate">
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

                    {/* Status (edit only) */}
                    {modalMode === 'edit' && (
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="form-label">Trạng thái</label>
                        <select className="form-select" value={formData.invoiceStatus}
                          onChange={(e) => handleFormChange('invoiceStatus', e.target.value)}>
                          <option value="UNPAID">Chưa thanh toán</option>
                          <option value="PAID">Đã thanh toán</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Electric & Water Consumption */}
                <div className="form-field form-field--full" style={{ padding: 0, background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: 0, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', padding: '0.85rem 1.25rem', borderBottom: '1px solid #93c5fd', fontWeight: 600, color: '#1e40af', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    Dịch vụ Điện nước
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    {/* ELECTRIC SECTION */}
                    {activeFee && activeFee.useTieredElectric ? (
                      <div style={{ marginBottom: '1rem', padding: '1.25rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontWeight: 600, color: '#1d4ed8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                          Tính phí điện (Bậc thang)
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: '0.75rem' }}>
                          <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Từ ngày</label>
                            <DatePicker
                              selected={formData.electricStartDate ? new Date(formData.electricStartDate) : null}
                              onChange={(date) => handleFormChange('electricStartDate', date ? date.toISOString().substring(0, 10) : '')}
                              dateFormat="dd/MM/yyyy"
                              locale="vi"
                              placeholderText="dd/MM/yyyy"
                              className="form-input"
                              isClearable
                            />
                          </div>
                          <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Đến ngày</label>
                            <DatePicker
                              selected={formData.electricEndDate ? new Date(formData.electricEndDate) : null}
                              onChange={(date) => handleFormChange('electricEndDate', date ? date.toISOString().substring(0, 10) : '')}
                              dateFormat="dd/MM/yyyy"
                              locale="vi"
                              placeholderText="dd/MM/yyyy"
                              className="form-input"
                              isClearable
                            />
                          </div>
                          <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Số hộ chung công tơ</label>
                            <input type="number" className="form-input" value={formData.numberOfHouseholds} onChange={(e) => handleFormChange('numberOfHouseholds', e.target.value)} min="1" step="1" />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                          <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Số điện tiêu thụ (kWh)</label>
                            <input type="text" className="form-input" value={formatInputCurrency(formData.electricQuantity)} onChange={(e) => handleFormChange('electricQuantity', parseInputCurrency(e.target.value))} placeholder="Nhập số điện..." readOnly={!!(!evnMockInfo.loading && evnMockInfo.data)} style={{ background: (!evnMockInfo.loading && evnMockInfo.data) ? '#f1f5f9' : '#fff' }} />
                          </div>
                          <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem', color: '#047857' }}>Tổng tiền điện</label>
                            <div style={{ position: 'relative' }}>
                              <input type="text" className="form-input" value={formatInputCurrency(formData.electricFee)} readOnly placeholder="Tự động tính..." style={{ background: '#d1fae5', color: '#047857', cursor: 'default', fontWeight: 600 }} />
                              {isCalculatingElectric && (
                                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                                  <div className="spinner" style={{ width: 16, height: 16, margin: 0 }} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {modalMode === 'create' && activeFee?.useTieredElectric && formData.apartmentId && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {evnMockInfo.loading && <span style={{ color: '#d97706' }}>⏳ Đang kết nối EVN...</span>}
                            {!evnMockInfo.loading && evnMockInfo.error && <span style={{ color: '#dc2626' }}>⚠ {evnMockInfo.error}</span>}
                            {!evnMockInfo.loading && evnMockInfo.data && <span style={{ color: '#059669' }}>✓ EVN: {evnMockInfo.data.kwhConsumed} kWh · Kỳ {evnMockInfo.data.billingPeriod || 'N/A'}</span>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ marginBottom: '1rem', padding: '1.25rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 600, color: '#1d4ed8', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                          Tiền điện
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Điện tiêu thụ (kWh) {activeFee && activeFee.electricFee > 0 && <span style={{ color: '#e74c3c', fontSize: '0.8rem', fontWeight: 600 }}>{shortMoney(activeFee.electricFee)}/kWh</span>}</label>
                            <input type="text" className="form-input" value={formatInputCurrency(formData.electricQuantity)} onChange={(e) => handleFormChange('electricQuantity', parseInputCurrency(e.target.value))} placeholder="Nhập số điện..." />
                          </div>
                          <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ color: '#047857' }}>Tổng tiền điện</label>
                            <input type="text" className="form-input" value={formatInputCurrency(formData.electricFee)} readOnly placeholder="Tự động tính" style={{ background: '#d1fae5', color: '#047857', cursor: 'default', fontWeight: 600 }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* WATER SECTION */}
                    <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 600, color: '#0369a1', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
                        Tiền nước
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-field" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Nước tiêu thụ (m³) {activeFee && activeFee.waterFee > 0 && <span style={{ color: '#e74c3c', fontSize: '0.8rem', fontWeight: 600 }}>{shortMoney(activeFee.waterFee)}/m³</span>}</label>
                          <input type="text" className="form-input" value={formatInputCurrency(formData.waterQuantity)} onChange={(e) => handleFormChange('waterQuantity', parseInputCurrency(e.target.value))} placeholder="Nhập số khối nước..." readOnly={!!(!waterMockInfo.loading && waterMockInfo.data)} style={{ background: (!waterMockInfo.loading && waterMockInfo.data) ? '#f1f5f9' : '#fff' }} />
                          {modalMode === 'create' && formData.apartmentId && (
                            <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', fontWeight: 500 }}>
                              {waterMockInfo.loading && <span style={{ color: '#d97706' }}>Đang kết nối Công ty nước...</span>}
                              {!waterMockInfo.loading && waterMockInfo.error && <span style={{ color: '#dc2626' }}>{waterMockInfo.error}</span>}
                              {!waterMockInfo.loading && waterMockInfo.data && <span style={{ color: '#059669' }}>✓ Nước: {waterMockInfo.data.cubicMeterConsumed} m³ (Kỳ: {waterMockInfo.data.billingPeriod || 'N/A'})</span>}
                            </div>
                          )}
                        </div>
                        <div className="form-field" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ color: '#047857' }}>Tổng tiền nước</label>
                          <input type="text" className="form-input" value={formatInputCurrency(formData.waterFee)} readOnly placeholder="Tự động tính" style={{ background: '#d1fae5', color: '#047857', cursor: 'default', fontWeight: 600 }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Other Fees */}
                <div className="form-field form-field--full" style={{ padding: 0, background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: 0, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ background: 'linear-gradient(135deg, #fefce8, #fef9c3)', padding: '0.85rem 1.25rem', borderBottom: '1px solid #fde68a', fontWeight: 600, color: '#92400e', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    Các loại phí khác
                  </div>
                  <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '1rem' }}>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="form-label">Phí quản lý (VNĐ)</label>
                      <input type="text" className="form-input" value={formatInputCurrency(formData.managementFee)}
                        onChange={(e) => handleFormChange('managementFee', parseInputCurrency(e.target.value))}
                        placeholder={activeFee ? 'Từ phí dịch vụ' : '0'} />
                    </div>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="form-label">Phí gửi xe (VNĐ)</label>
                      <input type="text" className="form-input" value={formatInputCurrency(formData.parkingFee)}
                        onChange={(e) => handleFormChange('parkingFee', parseInputCurrency(e.target.value))}
                        placeholder={activeFee ? 'Từ bảng phí dịch vụ' : '0'} />
                    </div>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="form-label">Phí phát sinh (VNĐ)</label>
                      <input type="text" className="form-input" value={formatInputCurrency(formData.otherFee)}
                        onChange={(e) => handleFormChange('otherFee', parseInputCurrency(e.target.value))}
                        placeholder={activeFee ? 'Từ bảng phí dịch vụ' : '0'} />
                    </div>
                    <div className="form-field" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                      <label className="form-label">Mô tả (Phí phát sinh)</label>
                      <textarea className="form-input" value={formData.descriptionOtherFee || ''}
                        onChange={(e) => handleFormChange('descriptionOtherFee', e.target.value)}
                        placeholder="VD: Phí sửa vòi nước..." rows="3" style={{ resize: 'vertical' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Live total preview */}
              {(() => {
                const total = (Number(formData.electricFee) || 0) + (Number(formData.waterFee) || 0) + (Number(formData.managementFee) || 0) + (Number(formData.parkingFee) || 0) + (Number(formData.otherFee) || 0);
                return (
                  <div style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', borderTop: '2px solid #fca5a5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#991b1b' }}>Tổng tạm tính</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', letterSpacing: '-0.02em' }}>{money(total)}</span>
                  </div>
                );
              })()}
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', width: '95%' }}>
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
                        <th>Người thanh toán</th>
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
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ width: 14, height: 14, flexShrink: 0 }}>
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                </svg>
                                <span style={{ fontWeight: 500, color: '#334155' }}>{p.payerName || '—'}</span>
                              </div>
                            </td>
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
              {(selectedInvoice.invoiceStatus === 'UNPAID' || selectedInvoice.invoiceStatus === 'OVERDUE') && (
                <button
                  className="btn"
                  onClick={() => { setModalOpen(false); setTimeout(() => openPaymentModal(selectedInvoice.invoiceId), 100); }}
                  style={{
                    background: 'linear-gradient(135deg, #16a34a, #15803d)',
                    color: '#fff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span className="btn__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg></span>
                  Thanh toán
                </button>
              )}
              <button className="btn btn--primary" onClick={() => { setModalOpen(false); setTimeout(() => openEditModal(selectedInvoice), 100); }}>
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ PAYMENT METHOD MODAL ═══════════ */}
      {payModalOpen && (
        <div className="modal-overlay" onClick={() => setPayModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', width: '90%' }}>
            <div className="modal__header">
              <h3 className="modal__title">Chọn phương thức thanh toán</h3>
              <button className="modal__close" onClick={() => setPayModalOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="modal__body">
              {/* Method selection */}
              <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.2rem' }}>
                {[
                  { value: 'CASH', label: 'Tiền mặt', icon: '💵', color: '#16a34a', bg: '#dcfce7' },
                  { value: 'MOMO', label: 'MoMo', icon: '📱', color: '#ae2070', bg: '#fce4ec' },
                ].map((m) => (
                  <button key={m.value} type="button"
                    onClick={() => setPayMethod(m.value)}
                    style={{
                      flex: 1, padding: '1rem 0.5rem', borderRadius: 10,
                      border: payMethod === m.value ? `2px solid ${m.color}` : '2px solid #e2e8f0',
                      background: payMethod === m.value ? m.bg : '#fff',
                      cursor: 'pointer', textAlign: 'center',
                      transition: 'all 0.2s ease',
                      transform: payMethod === m.value ? 'scale(1.03)' : 'scale(1)',
                      boxShadow: payMethod === m.value ? `0 4px 12px ${m.color}22` : 'none',
                    }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>{m.icon}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: payMethod === m.value ? m.color : '#64748b' }}>{m.label}</div>
                  </button>
                ))}
              </div>

              {/* MoMo info */}
              {payMethod === 'MOMO' && (
                <div style={{ padding: '0.75rem 1rem', background: '#fce4ec', borderRadius: 8, fontSize: '0.85rem', color: '#880e4f' }}>
                  Bạn sẽ được chuyển sang trang MoMo để thanh toán trực tuyến.
                </div>
              )}

              {/* Cash form */}
              {payMethod === 'CASH' && (
                <div className="form-field">
                  <label className="form-label">Ghi chú</label>
                  <input className="form-input" value={payNote} onChange={(e) => setPayNote(e.target.value)}
                    placeholder="VD: Nhận tiền mặt tại quầy lễ tân" />
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setPayModalOpen(false)}>Hủy</button>
              <button className="btn btn--primary" onClick={handleManualPayment}
                disabled={!payMethod || paySubmitting}
                style={payMethod === 'MOMO' ? { background: 'linear-gradient(135deg, #ae2070, #880e4f)' } : {}}>
                {paySubmitting ? 'Đang xử lý...' : payMethod === 'MOMO' ? '📱 Thanh toán MoMo' : payMethod === 'CASH' ? '💵 Xác nhận tiền mặt' : 'Chọn phương thức'}
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
          <div className="modal" style={{ maxWidth: '650px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
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
                <div className="form-field form-field--full">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Phương thức tính tiền điện</label>
                  <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '6px' }}>
                    <button
                      type="button"
                      style={{
                        flex: 1, padding: '0.4rem', borderRadius: '4px', border: 'none',
                        background: !useTieredElectric ? '#fff' : 'transparent',
                        color: !useTieredElectric ? '#0f172a' : '#475569',
                        fontWeight: !useTieredElectric ? 600 : 500,
                        fontSize: '0.8rem',
                        boxShadow: !useTieredElectric ? '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
                      }}
                      onClick={() => setUseTieredElectric(false)}
                    >
                      <span style={{ 
                        width: 12, height: 12, borderRadius: '50%', border: '3px solid', 
                        borderColor: !useTieredElectric ? '#3b82f6' : '#94a3b8',
                        background: '#fff'
                      }}></span>
                      Cố định (Một giá)
                    </button>
                    <button
                      type="button"
                      style={{
                        flex: 1, padding: '0.4rem', borderRadius: '4px', border: 'none',
                        background: useTieredElectric ? '#fff' : 'transparent',
                        color: useTieredElectric ? '#0f172a' : '#475569',
                        fontWeight: useTieredElectric ? 600 : 500,
                        fontSize: '0.8rem',
                        boxShadow: useTieredElectric ? '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
                      }}
                      onClick={() => setUseTieredElectric(true)}
                    >
                      <span style={{ 
                        width: 12, height: 12, borderRadius: '50%', border: '3px solid', 
                        borderColor: useTieredElectric ? '#3b82f6' : '#94a3b8',
                        background: '#fff'
                      }}></span>
                      Lũy tiến (Bậc thang)
                    </button>
                  </div>
                </div>

                {!useTieredElectric ? (
                  <div className="form-field">
                    <label className="form-label">Phí điện (VNĐ/kWh)</label>
                    <input type="text" className="form-input" value={formatInputCurrency(tableFeeForm.electricFee)}
                      onChange={(e) => setTableFeeForm(p => ({ ...p, electricFee: parseInputCurrency(e.target.value) }))} placeholder="0" />
                  </div>
                ) : (
                  <div className="form-field form-field--full">
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                          <thead style={{ background: '#f1f5f9' }}>
                            <tr>
                              <th style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '20%' }}>Bậc</th>
                              <th style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569' }}>Sản lượng (kWh)</th>
                              <th style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Đơn giá (VNĐ)</th>
                              <th style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', textAlign: 'right', width: '80px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {electricTiers.map((tier, idx) => {
                              const displayLimit = tier.limitValue ? tier.limitValue : 'Trở lên';
                              const isEditing = editingTierId === tier.id;
                              return (
                                <tr key={tier.id || idx} style={{ borderBottom: idx < electricTiers.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                                  {isEditing ? (
                                    <>
                                      <td style={{ padding: '0.4rem 0.5rem' }}>
                                        <input className="form-input" style={{ padding: '0.25rem', minHeight: 'unset' }} value={tierForm.tierOrder} onChange={e => setTierForm(p => ({ ...p, tierOrder: e.target.value }))} type="number" placeholder="Thứ tự" />
                                      </td>
                                      <td style={{ padding: '0.4rem 0.5rem' }}>
                                        <input className="form-input" style={{ padding: '0.25rem', minHeight: 'unset' }} value={tierForm.limitValue} onChange={e => setTierForm(p => ({ ...p, limitValue: e.target.value }))} type="number" placeholder="VD: 50" />
                                      </td>
                                      <td style={{ padding: '0.4rem 0.5rem' }}>
                                        <input className="form-input" style={{ padding: '0.25rem', minHeight: 'unset' }} value={tierForm.unitPrice} onChange={e => setTierForm(p => ({ ...p, unitPrice: e.target.value }))} type="number" placeholder="VD: 2000" />
                                      </td>
                                      <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        <button type="button" onClick={() => handleTierSave(tier.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', marginRight: '8px' }} title="Lưu">{Icons.check}</button>
                                        <button type="button" onClick={handleTierCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} title="Hủy">{Icons.close}</button>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td style={{ padding: '0.5rem 0.75rem', color: '#1e293b' }}>Bậc {tier.tierOrder || idx + 1}</td>
                                      <td style={{ padding: '0.5rem 0.75rem', color: '#1e293b' }}>{displayLimit}</td>
                                      <td style={{ padding: '0.5rem 0.75rem', color: '#1e293b', textAlign: 'right', fontWeight: 500 }}>{money(tier.unitPrice)}</td>
                                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        <button type="button" title="Chỉnh sửa" onClick={() => handleTierEdit(tier)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: '6px', padding: 0 }}>
                                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>
                                        <button type="button" title="Xóa" onClick={() => handleTierDelete(tier.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0 }}>
                                          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })}
                            
                            {/* Row tạo mới */}
                            {editingTierId === 'new' ? (
                                <tr style={{ borderTop: '1px solid #cbd5e1', background: '#f8fafc' }}>
                                  <td style={{ padding: '0.4rem 0.5rem' }}>
                                    <input className="form-input" style={{ padding: '0.25rem', minHeight: 'unset' }} value={tierForm.tierOrder} onChange={e => setTierForm(p => ({ ...p, tierOrder: e.target.value }))} type="number" placeholder="Mức thứ" />
                                  </td>
                                  <td style={{ padding: '0.4rem 0.5rem' }}>
                                    <input className="form-input" style={{ padding: '0.25rem', minHeight: 'unset' }} value={tierForm.limitValue} onChange={e => setTierForm(p => ({ ...p, limitValue: e.target.value }))} type="number" placeholder="Sản lượng" />
                                  </td>
                                  <td style={{ padding: '0.4rem 0.5rem' }}>
                                    <input className="form-input" style={{ padding: '0.25rem', minHeight: 'unset' }} value={tierForm.unitPrice} onChange={e => setTierForm(p => ({ ...p, unitPrice: e.target.value }))} type="number" placeholder="VNĐ" />
                                  </td>
                                  <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                    <button type="button" onClick={() => handleTierSave('new')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', marginRight: '8px' }} title="Lưu">{Icons.check}</button>
                                    <button type="button" onClick={handleTierCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} title="Hủy">{Icons.close}</button>
                                  </td>
                                </tr>
                            ) : (
                                <tr style={{ borderTop: electricTiers.length > 0 ? '1px solid #e2e8f0' : 'none' }}>
                                  <td colSpan={4} style={{ padding: '0.4rem 0.75rem', textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => { setEditingTierId('new'); setTierForm({ tierOrder: electricTiers.length + 1, limitValue: '', unitPrice: '' }); }}
                                      style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', width: '100%', fontSize: '0.8rem', padding: '0.25rem' }}
                                    >
                                      + Khởi tạo bậc điện mới
                                    </button>
                                  </td>
                                </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                  </div>
                )}
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
                <div className="form-field form-field--full">
                  <label className="form-label">Mô tả (Phí khác)</label>
                  <textarea className="form-input" value={tableFeeForm.descriptionOtherFee || ''}
                    onChange={(e) => setTableFeeForm(p => ({ ...p, descriptionOtherFee: e.target.value }))} placeholder="Nhập mô tả cho khoản phí khác..." rows="3" style={{ resize: 'vertical' }} />
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

      {/* ═══ Batch Invoice Modal ═══ */}
      {batchModalOpen && (
        <div className="modal-overlay" onClick={() => setBatchModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal__header">
              <h3 className="modal__title">Tạo hóa đơn hàng loạt</h3>
              <button className="modal__close" onClick={() => setBatchModalOpen(false)}>{Icons.close}</button>
            </div>
            <div className="modal__body">
              <div className="form-grid">
                {/* Bảng phí */}
                <div className="form-field form-field--full">
                  <label className="form-label">Bảng phí áp dụng <span className="form-required">*</span></label>
                  <select className="form-select" value={batchFeeIndex} onChange={(e) => setBatchFeeIndex(Number(e.target.value))}>
                    {tableFees.map((f, i) => (
                      <option key={f.id} value={i}>{f.title || `Bảng phí #${f.id}`}</option>
                    ))}
                  </select>
                </div>
                {/* Hạn thanh toán + Đã chọn */}
                <div className="form-field">
                  <label className="form-label">Hạn thanh toán <span className="form-required">*</span></label>
                  <input type="text" className="form-input" value={batchDueDate}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9/]/g, '');
                      if (v.length === 2 && !v.includes('/')) v += '/';
                      if (v.length === 5 && v.split('/').length === 2) v += '/';
                      if (v.length <= 10) setBatchDueDate(v);
                    }}
                    placeholder="dd/MM/yyyy" maxLength={10} />
                </div>
                <div className="form-field">
                  <label className="form-label">Đã chọn</label>
                  <input type="text" className="form-input" value={`${batchSelectedApts.length} / ${apartments.filter(a => a.ownerId || a.residents?.some(r => r.relationshipType === 'TENANT')).length} căn hộ`} readOnly
                    style={{ fontWeight: 600, cursor: 'default', background: 'var(--bg-card, #f8fafc)' }} />
                </div>
              </div>
              {/* Chọn căn hộ */}
              <div style={{ marginTop: '1rem' }}>
                <label className="form-label">Chọn căn hộ</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select className="form-select" value={batchFilterBlock} onChange={(e) => { setBatchFilterBlock(e.target.value); setBatchFilterFloor(''); }}
                    style={{ width: 'auto', minWidth: '120px' }}>
                    <option value="">Tất cả tòa</option>
                    {[...new Set(apartments.map(a => a.block).filter(Boolean))].sort().map(b => (
                      <option key={b} value={b}>Block {b}</option>
                    ))}
                  </select>
                  <select className="form-select" value={batchFilterFloor} onChange={(e) => setBatchFilterFloor(e.target.value)}
                    style={{ width: 'auto', minWidth: '120px' }}>
                    <option value="">Tất cả tầng</option>
                    {[...new Set(apartments
                      .filter(a => !batchFilterBlock || a.block === batchFilterBlock)
                      .map(a => a.floor).filter(f => f != null)
                    )].sort((a, b) => a - b).map(f => (
                      <option key={f} value={f}>Tầng {f}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => {
                    const filtered = apartments.filter(a => (!batchFilterBlock || a.block === batchFilterBlock) && (!batchFilterFloor || String(a.floor) === String(batchFilterFloor)) && (a.ownerId || a.residents?.some(r => r.relationshipType === 'TENANT')));
                    setBatchSelectedApts(prev => [...new Set([...prev, ...filtered.map(a => a.id)])]);
                  }}>Chọn tất cả</button>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => {
                    const filtered = apartments.filter(a => (!batchFilterBlock || a.block === batchFilterBlock) && (!batchFilterFloor || String(a.floor) === String(batchFilterFloor)) && (a.ownerId || a.residents?.some(r => r.relationshipType === 'TENANT')));
                    const filteredIds = new Set(filtered.map(a => a.id));
                    setBatchSelectedApts(prev => prev.filter(id => !filteredIds.has(id)));
                  }}>Bỏ chọn</button>
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border, #e2e8f0)', borderRadius: '0.5rem' }}>
                  {apartments
                    .filter(apt => (!batchFilterBlock || apt.block === batchFilterBlock) && (!batchFilterFloor || String(apt.floor) === String(batchFilterFloor)))
                    .filter(apt => apt.ownerId || apt.residents?.some(r => r.relationshipType === 'TENANT'))
                    .map((apt) => {
                      const checked = batchSelectedApts.includes(apt.id);
                      const owner = apt.ownerId && apt.residents?.find(r => r.residentId === apt.ownerId);
                      const tenant = apt.residents?.find(r => r.relationshipType === 'TENANT');
                      const badgeStyle = (isOwner) => ({
                        fontSize: '0.6rem', padding: '0px 4px', borderRadius: '3px', fontWeight: 700, whiteSpace: 'nowrap',
                        background: isOwner ? '#dcfce7' : '#dbeafe',
                        color: isOwner ? '#166534' : '#1e40af',
                        marginLeft: '3px', verticalAlign: 'middle',
                      });
                      return (
                        <label key={apt.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem',
                          cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                          background: checked ? '#eef2ff' : 'transparent',
                          transition: 'background 0.15s',
                        }}>
                          <input type="checkbox" checked={checked}
                            onChange={() => setBatchSelectedApts(prev => checked ? prev.filter(id => id !== apt.id) : [...prev, apt.id])}
                            style={{ width: '15px', height: '15px', flexShrink: 0, accentColor: '#6366f1' }} />
                          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b', minWidth: '48px' }}>{apt.apartmentNumber}</span>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', minWidth: '90px', flexShrink: 0 }}>T{apt.floor} - {apt.block}</span>
                          <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.15rem 0.75rem', justifyContent: 'flex-end', fontSize: '0.78rem' }}>
                            {owner && (
                              <span style={{ color: '#334155', whiteSpace: 'nowrap' }}>
                                {owner.fullName}<span style={badgeStyle(true)}>Chủ</span>
                                {owner.phone && <span style={{ color: '#94a3b8', marginLeft: '4px' }}>{owner.phone}</span>}
                              </span>
                            )}
                            {tenant && (
                              <span style={{ color: '#334155', whiteSpace: 'nowrap' }}>
                                {tenant.fullName}<span style={badgeStyle(false)}>Thuê</span>
                                {tenant.phone && <span style={{ color: '#94a3b8', marginLeft: '4px' }}>{tenant.phone}</span>}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setBatchModalOpen(false)}>Hủy</button>
              <button className="btn btn--primary" disabled={batchSubmitting || batchSelectedApts.length === 0 || !batchDueDate}
                onClick={async () => {
                  setBatchSubmitting(true);
                  try {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    const fee = tableFees[batchFeeIndex];
                      const [dd, mm, yyyy] = batchDueDate.split('/');
                      const res = await invoiceService.batchCreate({
                      apartmentIds: batchSelectedApts,
                      dueDate: `${yyyy}-${mm}-${dd}`,
                      creatorId: user.id,
                      tableFeeId: fee.id,
                    });
                    if (res.data?.status) {
                      toast.success(`Đã tạo ${res.data.data.length} hóa đơn thành công!`);
                      setBatchModalOpen(false);
                      fetchInvoices();
                    } else {
                      toast.error(res.data?.message || 'Tạo hàng loạt thất bại');
                    }
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
                  } finally {
                    setBatchSubmitting(false);
                  }
                }}>
                {batchSubmitting ? 'Đang xử lý...' : `Tạo ${batchSelectedApts.length} hóa đơn`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
