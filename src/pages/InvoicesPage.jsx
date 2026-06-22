import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
import vehicleService from '../services/vehicleService';
import meterReadingService from '../services/meterReadingService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DropdownSelect from '../components/common/DropdownSelect';

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
const apartmentStatusLabel = {
  OCCUPIED: 'Đang ở',
  VACANT: 'Trống',
  UNDER_MAINTENANCE: 'Đang bảo trì',
};

const paymentStatusLabel = { PENDING: 'Đang xử lý', SUCCESS: 'Thành công', FAILED: 'Thất bại' };
const paymentStatusColor = {
  PENDING: { color: '#d97706', bg: '#fef3c7' },
  SUCCESS: { color: '#059669', bg: '#d1fae5' },
  FAILED: { color: '#dc2626', bg: '#fee2e2' },
};

const PAGE_SIZE = 10;
const MODAL_APARTMENT_PAGE_SIZE = 8;
const METER_APARTMENT_PAGE_SIZE = 12;
const METER_APARTMENT_MODES = [
  { value: 'NEED_READING', label: 'Cần ghi' },
  { value: 'RECORDED', label: 'Đã ghi' },
  { value: 'ALL', label: 'Tất cả' },
];

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
  check: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>),
  home: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>),
  calendar: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>),
  zap: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z" /></svg>),
  droplet: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.5S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.5-7-12.5Z" /></svg>),
  image: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="m21 15-5-5L5 20" /></svg>),
  note: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z" /><path d="M8 8h8" /><path d="M8 12h8" /><path d="M8 16h5" /></svg>),
  clipboard: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4h6l1 2h3v15H5V6h3l1-2Z" /><path d="M9 11h6" /><path d="M9 15h6" /></svg>),
  chevronDown: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>),
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

const createOtherFeeItem = (description = '', amount = '') => ({
  id: `other-fee-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  description,
  amount: amount ? String(amount).replace(/\D/g, '') : '',
});

const normalizeOtherFeeItems = (amount, description) => {
  const normalizedAmount = amount ? String(amount).replace(/\D/g, '') : '';
  const normalizedDescription = description || '';
  if (!normalizedAmount && !normalizedDescription.trim()) {
    return [createOtherFeeItem()];
  }
  return [createOtherFeeItem(normalizedDescription, normalizedAmount)];
};

const summarizeOtherFeeItems = (items = []) => {
  const normalizedItems = (Array.isArray(items) ? items : [])
    .map((item) => ({
      ...item,
      description: item.description?.trim() || '',
      amount: Number(String(item.amount || '').replace(/\D/g, '')) || 0,
    }))
    .filter((item) => item.description || item.amount > 0);

  return {
    items: normalizedItems,
    total: normalizedItems.reduce((sum, item) => sum + item.amount, 0),
    description: normalizedItems
      .map((item, index) => `${index + 1}. ${item.description || 'Phí phát sinh'}: ${formatInputCurrency(item.amount)}đ`)
      .join('\n'),
  };
};

const buildOtherFeeFields = (items = []) => {
  const safeItems = Array.isArray(items) && items.length ? items : [createOtherFeeItem()];
  const summary = summarizeOtherFeeItems(safeItems);
  return {
    otherFeeItems: safeItems,
    otherFee: summary.total > 0 ? String(summary.total) : '',
    descriptionOtherFee: summary.description,
  };
};

const getFormOtherFeeSummary = (data) => {
  const items = Array.isArray(data?.otherFeeItems) && data.otherFeeItems.length
    ? data.otherFeeItems
    : normalizeOtherFeeItems(data?.otherFee, data?.descriptionOtherFee);
  return summarizeOtherFeeItems(items);
};

const toPreTaxFeeString = (fee, taxMultiplier) => {
  if (fee == null || fee === '') return '';
  const amount = Number(fee);
  if (!Number.isFinite(amount)) return '';
  return String(Math.round(amount / taxMultiplier));
};

const formatBillingPeriodDisplay = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-');
    return `${month}/${year}`;
  }
  if (typeof value === 'string' && /^\d{1,2}\/\d{4}$/.test(value)) {
    const [month, year] = value.split('/');
    return `${String(month).padStart(2, '0')}/${year}`;
  }
  return value;
};

const normalizeBillingPeriodInput = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const parseBillingPeriodInput = (value) => {
  const match = String(value || '').trim().match(/^(\d{1,2})\/(\d{4})$/);
  if (!match) return '';
  const month = Number(match[1]);
  if (month < 1 || month > 12) return '';
  return `${match[2]}-${String(month).padStart(2, '0')}`;
};

const billingPeriodFromDate = (dateValue) => {
  if (!dateValue) return new Date().toISOString().slice(0, 7);
  if (Array.isArray(dateValue)) {
    const [year, month] = dateValue;
    return `${year}-${String(month).padStart(2, '0')}`;
  }
  if (typeof dateValue === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
    const [, month, year] = dateValue.split('/');
    return `${year}-${month}`;
  }
  if (typeof dateValue === 'string') return dateValue.slice(0, 7);
  try {
    return `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return new Date().toISOString().slice(0, 7);
  }
};

const billingPeriodStartDate = (billingPeriod, fallbackDate) => {
  const period = billingPeriod || billingPeriodFromDate(fallbackDate);
  if (typeof period === 'string' && /^\d{4}-\d{2}$/.test(period)) {
    return `${period}-01`;
  }
  return fallbackDate ? billingPeriodFromDate(fallbackDate) + '-01' : '';
};

const createBatchFeeDraft = (fee = {}) => ({
  electricFee: fee?.electricFee != null ? String(fee.electricFee) : '',
  waterFee: fee?.waterFee != null ? String(fee.waterFee) : '',
  managementFee: fee?.managementFee != null ? String(fee.managementFee) : '',
  motorbikeParkingFee: fee?.motorbikeParkingFee != null ? String(fee.motorbikeParkingFee) : '',
  carParkingFee: fee?.carParkingFee != null ? String(fee.carParkingFee) : '',
  bicycleParkingFee: fee?.bicycleParkingFee != null ? String(fee.bicycleParkingFee) : '',
  electricMotorbikeParkingFee: fee?.electricMotorbikeParkingFee != null ? String(fee.electricMotorbikeParkingFee) : '',
  otherFee: fee?.otherFee != null ? String(fee.otherFee) : '',
  descriptionOtherFee: fee?.descriptionOtherFee || '',
  otherFeeItems: normalizeOtherFeeItems(fee?.otherFee, fee?.descriptionOtherFee),
  useTieredElectric: !!fee?.useTieredElectric,
});

const getResidentId = (resident) => resident?.residentId ?? resident?.id;
const getApartmentOwner = (apt) => {
  const residents = apt?.residents || [];
  return residents.find((r) => String(getResidentId(r)) === String(apt?.ownerId))
    || residents.find((r) => r.relationshipType === 'OWNER');
};
const getApartmentTenant = (apt) => apt?.residents?.find((r) => r.relationshipType === 'TENANT');
const getResidentPhone = (resident) => resident?.phone || resident?.phoneNumber;
const isMeterEligibleApartment = (apt) => Boolean(getApartmentOwner(apt) || getApartmentTenant(apt));
const getInvoiceApartmentId = (invoice) => invoice?.apartment?.id ?? invoice?.apartmentId ?? invoice?.apartment?.apartmentId;
const getMeterReadingApartmentId = (reading) => reading?.apartment?.id ?? reading?.apartmentId ?? reading?.apartment?.apartmentId;

export default function InvoicesPage() {
  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }, []);
  const userRole = currentUser?.role || currentUser?.userRole || 'ADMIN';
  const isTechnician = userRole === 'TECHNICIAN';
  const canManageInvoices = userRole === 'ADMIN';

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
  const [invoiceStep, setInvoiceStep] = useState(0);
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    dueDate: '',
    electricFee: '',
    waterFee: '',
    managementFee: '',
    parkingFee: '',
    otherFee: '',
    descriptionOtherFee: '',
    otherFeeItems: [createOtherFeeItem()],
    apartmentId: '',
    invoiceStatus: 'UNPAID',
    electricQuantity: '',
    electricPreviousReading: '',
    electricCurrentReading: '',
    waterQuantity: '',
    waterPreviousReading: '',
    waterCurrentReading: '',
    electricStartDate: '',
    electricEndDate: '',
    numberOfHouseholds: '1',
  });
  const [isCalculatingElectric, setIsCalculatingElectric] = useState(false);
  const [evnMockInfo, setEvnMockInfo] = useState({ loading: false, data: null, error: null });
  const [waterMockInfo, setWaterMockInfo] = useState({ loading: false, data: null, error: null });
  const [meterPreviewInfo, setMeterPreviewInfo] = useState({ loading: false, data: null, error: null });
  const [electricMeterSource, setElectricMeterSource] = useState('MOCK_API');
  const [waterMeterSource, setWaterMeterSource] = useState('MOCK_API');
  const [mockMeterReloadKey, setMockMeterReloadKey] = useState(0);
  const [parkingFeeInfo, setParkingFeeInfo] = useState({ loading: false, vehicles: null, error: null });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Manual meter readings
  const [meterTab, setMeterTab] = useState('electric'); // 'electric' | 'water'
  const [meterReadings, setMeterReadings] = useState([]);
  const [meterReadingsLoading, setMeterReadingsLoading] = useState(false);
  const [readingSubmitting, setReadingSubmitting] = useState(false);
  const [meterEntryModalOpen, setMeterEntryModalOpen] = useState(false);
  const [readingForm, setReadingForm] = useState({
    apartmentId: '',
    billingPeriod: new Date().toISOString().slice(0, 7),
    electricCurrentReading: '',
    waterCurrentReading: '',
    note: '',
    electricFile: null,
    waterFile: null,
  });
  const [billingPeriodInput, setBillingPeriodInput] = useState(formatBillingPeriodDisplay(new Date().toISOString().slice(0, 7)));

  // Apartments
  const [apartments, setApartments] = useState([]);
  const [aptFilterBlock, setAptFilterBlock] = useState('');
  const [aptFilterFloor, setAptFilterFloor] = useState('');
  const [aptFilterStatus, setAptFilterStatus] = useState('');
  const [meterAptSearch, setMeterAptSearch] = useState('');
  const [meterAptMode, setMeterAptMode] = useState('NEED_READING');
  const [meterAptPage, setMeterAptPage] = useState(0);
  const [meterFilterMenu, setMeterFilterMenu] = useState(null);
  const [aptModalSearch, setAptModalSearch] = useState('');
  const [aptModalPage, setAptModalPage] = useState(0);
  const [periodInvoices, setPeriodInvoices] = useState([]);
  const [periodInvoicesLoading, setPeriodInvoicesLoading] = useState(false);
  const [periodMeterReadings, setPeriodMeterReadings] = useState([]);
  const [periodMeterReadingsLoading, setPeriodMeterReadingsLoading] = useState(false);

  // Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Payment method modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payInvoiceId, setPayInvoiceId] = useState(null);
  const [payMethod, setPayMethod] = useState(''); // MOMO, VNPAY, CASH, BANK_TRANSFER
  const [payNote, setPayNote] = useState('');
  const [payTxnNo, setPayTxnNo] = useState('');
  const [payBank, setPayBank] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Table Fee Delete
  const [feeDeleteModalOpen, setFeeDeleteModalOpen] = useState(false);
  const [feeDeleteTargetIdx, setFeeDeleteTargetIdx] = useState(null);
  const [feeDeleting, setFeeDeleting] = useState(false);

  useEffect(() => {
    if (
      !(modalOpen && ['create', 'edit', 'view'].includes(modalMode))
      && !deleteModalOpen
      && !feeDeleteModalOpen
    ) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen, modalMode, deleteModalOpen, feeDeleteModalOpen]);

  // Table Fee
  const [tableFees, setTableFees] = useState([]);
  const [tableFeeLoading, setTableFeeLoading] = useState(true);
  const [tableFeeEditOpen, setTableFeeEditOpen] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [tableFeeForm, setTableFeeForm] = useState({
    title: '', electricFee: '', waterFee: '', managementFee: '', motorbikeParkingFee: '', carParkingFee: '', bicycleParkingFee: '', electricMotorbikeParkingFee: '', otherFee: '', descriptionOtherFee: '',
  });
  const [tableFeeSubmitting, setTableFeeSubmitting] = useState(false);
  const [selectedFeeIndex, setSelectedFeeIndex] = useState(0); // index của bảng phí được chọn
  const [feeDropdownOpen, setFeeDropdownOpen] = useState(false); // dropdown menu state
  const [modalFeeDropdownOpen, setModalFeeDropdownOpen] = useState(false); // modal dropdown menu state

  // Tiered Electric
  const [electricTiers, setElectricTiers] = useState([]);
  const [useTieredElectric, setUseTieredElectric] = useState(false);
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
  const [batchInvoiceFilter, setBatchInvoiceFilter] = useState('ALL');
  const [batchFeeDraft, setBatchFeeDraft] = useState(createBatchFeeDraft());

  useEffect(() => {
    if (!batchModalOpen) return;
    setBatchFeeDraft(createBatchFeeDraft(tableFees[batchFeeIndex] || {}));
  }, [batchModalOpen, batchFeeIndex, tableFees]);

  const eligibleBatchApartments = useMemo(
    () => apartments.filter((apt) => getApartmentOwner(apt) || getApartmentTenant(apt)),
    [apartments]
  );

  const scopedBatchApartments = useMemo(
    () => eligibleBatchApartments.filter((apt) =>
      (!batchFilterBlock || apt.block === batchFilterBlock)
      && (!batchFilterFloor || String(apt.floor) === String(batchFilterFloor))
    ),
    [eligibleBatchApartments, batchFilterBlock, batchFilterFloor]
  );

  /* ─── fetch ─── */
  const fetchInvoices = useCallback(async () => {
    if (!canManageInvoices) {
      setLoading(false);
      return;
    }
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
  }, [page, filterStatus, sortDirection, searchKeyword, canManageInvoices]);

  const fetchApartments = useCallback(async () => {
    try {
      const res = await apartmentService.getAll({ page: 0, size: 1000 });
      setApartments(res.data?.data?.content || []);
    } catch (err) {
      console.error('Lỗi tải danh sách căn hộ:', err);
    }
  }, []);

  const fetchTableFees = useCallback(async () => {
    if (!canManageInvoices) {
      setTableFeeLoading(false);
      return;
    }
    setTableFeeLoading(true);
    try {
      const res = await tableFeeService.getAll();
      setTableFees(res.data?.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách bảng phí:', err);
    } finally {
      setTableFeeLoading(false);
    }
  }, [canManageInvoices]);

  const fetchGlobalTiers = useCallback(async () => {
    try {
      const res = await tableElectricTierService.getAll();
      setElectricTiers(res.data?.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách cấu hình giá điện bậc thang:', err);
      setElectricTiers([]);
    }
  }, []);

  const fetchMeterReadings = useCallback(async (apartmentId = readingForm.apartmentId) => {
    setMeterReadingsLoading(true);
    try {
      const params = { page: 0, size: 20 };
      if (apartmentId) params.apartmentId = apartmentId;
      const res = await meterReadingService.getAll(params);
      setMeterReadings(res.data?.data?.content || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải lịch sử chỉ số');
    } finally {
      setMeterReadingsLoading(false);
    }
  }, [readingForm.apartmentId]);

  const applyInvoiceMeterSnapshot = useCallback((snapshot, selectedActiveFee, sourceLabel) => {
    setMeterPreviewInfo({ loading: false, data: snapshot, error: null });
    setEvnMockInfo({
      loading: false,
      data: {
        kwhConsumed: snapshot.electricQuantity,
        billingPeriod: snapshot.billingPeriod,
        sourceLabel,
      },
      error: null,
    });
    setWaterMockInfo({
      loading: false,
      data: {
        cubicMeterConsumed: snapshot.waterQuantity,
        billingPeriod: snapshot.billingPeriod,
        sourceLabel,
      },
      error: null,
    });
    setFormData((prev) => {
      const electricQty = Number(snapshot.electricQuantity) || 0;
      const waterQty = Number(snapshot.waterQuantity) || 0;
      const electricFee = selectedActiveFee && !selectedActiveFee.useTieredElectric && selectedActiveFee.electricFee > 0 && electricQty > 0
        ? String(electricQty * Number(selectedActiveFee.electricFee))
        : (selectedActiveFee?.useTieredElectric ? '' : prev.electricFee);
      const waterFee = selectedActiveFee && selectedActiveFee.waterFee > 0 && waterQty > 0
        ? String(waterQty * Number(selectedActiveFee.waterFee))
        : prev.waterFee;

      return {
        ...prev,
        electricPreviousReading: snapshot.electricPreviousReading != null ? String(snapshot.electricPreviousReading) : '',
        electricCurrentReading: snapshot.electricCurrentReading != null ? String(snapshot.electricCurrentReading) : '',
        electricQuantity: snapshot.electricQuantity != null ? String(snapshot.electricQuantity) : '',
        waterPreviousReading: snapshot.waterPreviousReading != null ? String(snapshot.waterPreviousReading) : '',
        waterCurrentReading: snapshot.waterCurrentReading != null ? String(snapshot.waterCurrentReading) : '',
        waterQuantity: snapshot.waterQuantity != null ? String(snapshot.waterQuantity) : '',
        electricFee,
        waterFee,
      };
    });
  }, []);

  useEffect(() => {
    if (!modalOpen || modalMode !== 'create' || !formData.apartmentId || !canManageInvoices) {
      setMeterPreviewInfo({ loading: false, data: null, error: null });
      setEvnMockInfo({ loading: false, data: null, error: null });
      setWaterMockInfo({ loading: false, data: null, error: null });
      return;
    }

    let cancelled = false;
    setMeterPreviewInfo({ loading: true, data: null, error: null });
    setEvnMockInfo({ loading: true, data: null, error: null });
    setWaterMockInfo({ loading: true, data: null, error: null });
    const selectedActiveFee = tableFees?.[selectedFeeIndex] || tableFees?.[0] || null;
    const targetBillingPeriod = billingPeriodFromDate(formData.dueDate);

    Promise.all([
      meterReadingService.preview(formData.apartmentId, targetBillingPeriod).then((res) => res.data?.data || null),
      meterReadingService.getAll({ page: 0, size: 100, apartmentId: formData.apartmentId })
        .then((res) => res.data?.data?.content || []),
    ])
      .then(([mockSnapshot, readings]) => {
        if (cancelled) return;
        if (!mockSnapshot) {
          const message = 'Không lấy được chỉ số điện nước';
          setMeterPreviewInfo({ loading: false, data: null, error: message });
          setEvnMockInfo({ loading: false, data: null, error: message });
          setWaterMockInfo({ loading: false, data: null, error: message });
          return;
        }

        const manualReadings = readings.filter((item) => item.source === 'MANUAL');
        const findManualReading = (hasReading) => manualReadings.find((item) => item.billingPeriod === targetBillingPeriod && hasReading(item))
          || manualReadings
            .filter((item) => item.billingPeriod && item.billingPeriod < targetBillingPeriod && hasReading(item))
            .sort((a, b) => b.billingPeriod.localeCompare(a.billingPeriod) || (b.meterReadingId || 0) - (a.meterReadingId || 0))[0];
        const electricManual = findManualReading((item) => item.electricCurrentReading != null);
        const waterManual = findManualReading((item) => item.waterCurrentReading != null);
        const electricManualReady = !!electricManual;
        const waterManualReady = !!waterManual;
        const manualNote = (manual) => manual
          ? (manual.billingPeriod === targetBillingPeriod
            ? `Ghi thủ công kỳ ${formatBillingPeriodDisplay(manual.billingPeriod)}`
            : `Ghi thủ công mới nhất (${formatBillingPeriodDisplay(manual.billingPeriod)})`)
          : '';

        const snapshot = {
          apartmentId: formData.apartmentId,
          billingPeriod: targetBillingPeriod,
          electricPreviousReading: electricMeterSource === 'MANUAL' && electricManualReady ? electricManual.electricPreviousReading : mockSnapshot.electricPreviousReading,
          electricCurrentReading: electricMeterSource === 'MANUAL' && electricManualReady ? electricManual.electricCurrentReading : mockSnapshot.electricCurrentReading,
          electricQuantity: electricMeterSource === 'MANUAL' && electricManualReady ? electricManual.electricQuantity : mockSnapshot.electricQuantity,
          waterPreviousReading: waterMeterSource === 'MANUAL' && waterManualReady ? waterManual.waterPreviousReading : mockSnapshot.waterPreviousReading,
          waterCurrentReading: waterMeterSource === 'MANUAL' && waterManualReady ? waterManual.waterCurrentReading : mockSnapshot.waterCurrentReading,
          waterQuantity: waterMeterSource === 'MANUAL' && waterManualReady ? waterManual.waterQuantity : mockSnapshot.waterQuantity,
        };
        applyInvoiceMeterSnapshot(snapshot, selectedActiveFee, `Mock API kỳ ${formatBillingPeriodDisplay(mockSnapshot.billingPeriod)}`);

        if (electricMeterSource === 'MANUAL') {
          if (electricManualReady) {
            setEvnMockInfo({ loading: false, data: { kwhConsumed: electricManual.electricQuantity, billingPeriod: electricManual.billingPeriod, sourceLabel: manualNote(electricManual) }, error: null });
          } else {
            setEvnMockInfo({ loading: false, data: null, error: 'Kĩ thuật viên chưa ghi lại dữ liệu điện' });
            setFormData((prev) => ({ ...prev, electricCurrentReading: '', electricQuantity: '', electricFee: '' }));
          }
        }

        if (waterMeterSource === 'MANUAL') {
          if (waterManualReady) {
            setWaterMockInfo({ loading: false, data: { cubicMeterConsumed: waterManual.waterQuantity, billingPeriod: waterManual.billingPeriod, sourceLabel: manualNote(waterManual) }, error: null });
          } else {
            setWaterMockInfo({ loading: false, data: null, error: 'Kĩ thuật viên chưa ghi lại dữ liệu nước' });
            setFormData((prev) => ({ ...prev, waterCurrentReading: '', waterQuantity: '', waterFee: '' }));
          }
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err.response?.data?.message || 'Không thể lấy chỉ số điện nước';
        setMeterPreviewInfo({ loading: false, data: null, error: message });
        setEvnMockInfo({ loading: false, data: null, error: message });
        setWaterMockInfo({ loading: false, data: null, error: message });
      });

    return () => { cancelled = true; };
  }, [modalOpen, modalMode, formData.apartmentId, formData.dueDate, tableFees, selectedFeeIndex, canManageInvoices, electricMeterSource, waterMeterSource, mockMeterReloadKey, applyInvoiceMeterSnapshot]);

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

  useEffect(() => {
    const targetPeriod = isTechnician
      ? readingForm.billingPeriod
      : (batchModalOpen && canManageInvoices && /^\d{2}\/\d{2}\/\d{4}$/.test(batchDueDate)
        ? billingPeriodFromDate(batchDueDate)
        : (modalOpen && modalMode === 'create' && canManageInvoices && formData.dueDate
          ? billingPeriodFromDate(formData.dueDate)
          : ''));
    if (!targetPeriod) {
      setPeriodInvoices([]);
      setPeriodInvoicesLoading(false);
      return undefined;
    }

    let cancelled = false;

    const fetchPeriodInvoices = async () => {
      setPeriodInvoicesLoading(true);
      try {
        const pageSize = 500;
        let pageIndex = 0;
        let totalPageCount = 1;
        const rows = [];

        while (pageIndex < totalPageCount) {
          const res = await invoiceService.getAll({ page: pageIndex, size: pageSize, sortBy: 'id', direction: 'desc', billingPeriod: targetPeriod });
          const data = res.data?.data;
          const content = Array.isArray(data) ? data : (data?.content || []);
          rows.push(...content);
          totalPageCount = Array.isArray(data) ? 1 : (data?.totalPages || 1);
          pageIndex += 1;
        }

        if (!cancelled) {
          setPeriodInvoices(rows.filter((invoice) => billingPeriodFromDate(invoice.dueDate) === targetPeriod));
        }
      } catch (err) {
        console.error('Không thể kiểm tra hóa đơn đã có trong kỳ:', err);
        if (!cancelled) setPeriodInvoices([]);
      } finally {
        if (!cancelled) setPeriodInvoicesLoading(false);
      }
    };

    fetchPeriodInvoices();

    return () => {
      cancelled = true;
    };
  }, [modalOpen, modalMode, formData.dueDate, batchModalOpen, batchDueDate, canManageInvoices, isTechnician, readingForm.billingPeriod]);

  useEffect(() => {
    if (!isTechnician || !readingForm.billingPeriod) {
      setPeriodMeterReadings([]);
      setPeriodMeterReadingsLoading(false);
      return undefined;
    }

    let cancelled = false;
    const targetPeriod = readingForm.billingPeriod;

    const fetchPeriodMeterReadings = async () => {
      setPeriodMeterReadingsLoading(true);
      try {
        const pageSize = 500;
        let pageIndex = 0;
        let totalPageCount = 1;
        const rows = [];

        while (pageIndex < totalPageCount) {
          const res = await meterReadingService.getAll({ page: pageIndex, size: pageSize, billingPeriod: targetPeriod });
          const data = res.data?.data;
          const content = Array.isArray(data) ? data : (data?.content || []);
          rows.push(...content);
          totalPageCount = Array.isArray(data) ? 1 : (data?.totalPages || 1);
          pageIndex += 1;
        }

        if (!cancelled) {
          setPeriodMeterReadings(rows.filter((reading) => reading.billingPeriod === targetPeriod));
        }
      } catch (err) {
        console.error('Không thể kiểm tra chỉ số đã ghi trong kỳ:', err);
        if (!cancelled) setPeriodMeterReadings([]);
      } finally {
        if (!cancelled) setPeriodMeterReadingsLoading(false);
      }
    };

    fetchPeriodMeterReadings();

    return () => {
      cancelled = true;
    };
  }, [isTechnician, readingForm.billingPeriod]);

  useEffect(() => {
    if (isTechnician || canManageInvoices) fetchMeterReadings();
  }, [fetchMeterReadings, isTechnician, canManageInvoices]);

  useEffect(() => {
    if (!isTechnician || !readingForm.apartmentId) {
      if (isTechnician) setMeterPreviewInfo({ loading: false, data: null, error: null });
      return;
    }

    let cancelled = false;
    setMeterPreviewInfo({ loading: true, data: null, error: null });
    meterReadingService.preview(readingForm.apartmentId, readingForm.billingPeriod)
      .then((res) => {
        if (cancelled) return;
        setMeterPreviewInfo({ loading: false, data: res.data?.data || null, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setMeterPreviewInfo({ loading: false, data: null, error: err.response?.data?.message || 'Không thể tải chỉ số gần nhất' });
      });
    return () => { cancelled = true; };
  }, [isTechnician, readingForm.apartmentId, readingForm.billingPeriod]);

  /* ─── the active fee (selected entry) ─── */
  const activeFee = tableFees?.[selectedFeeIndex] || tableFees?.[0] || null;

  /* ─── auto-fill form from selected fee ─── */
  useEffect(() => {
    if (modalOpen && modalMode === 'create' && activeFee) {
      const otherFeeFields = buildOtherFeeFields(normalizeOtherFeeItems(activeFee.otherFee, activeFee.descriptionOtherFee));
      setFormData((prev) => ({
        ...prev,
        managementFee: activeFee.managementFee ? String(activeFee.managementFee) : '',
        ...otherFeeFields,
      }));
    }
  }, [selectedFeeIndex, modalOpen, modalMode, activeFee]);

  /* ─── auto-calculate parking fee from vehicle counts ─── */
  useEffect(() => {
    if (!modalOpen || modalMode !== 'create' || !formData.apartmentId || !activeFee) {
      setParkingFeeInfo({ loading: false, vehicles: null, error: null });
      return;
    }

    const motorbikeFee = activeFee.motorbikeParkingFee || 0;
    const carFee = activeFee.carParkingFee || 0;
    const bicycleFee = activeFee.bicycleParkingFee || 0;
    const electricMotorbikeFee = activeFee.electricMotorbikeParkingFee || 0;

    // If all fees are 0, skip calculation
    if (motorbikeFee === 0 && carFee === 0 && bicycleFee === 0 && electricMotorbikeFee === 0) {
      setFormData(prev => ({ ...prev, parkingFee: '0' }));
      setParkingFeeInfo({ loading: false, vehicles: null, error: 'Bảng phí chưa cấu hình phí gửi xe' });
      return;
    }

    setParkingFeeInfo({ loading: true, vehicles: null, error: null });

    // Fetch vehicles for the apartment to show breakdown
    const apartmentId = Number(formData.apartmentId);
    Promise.all([
      vehicleService.calculateParkingFee(apartmentId, motorbikeFee, carFee, bicycleFee, electricMotorbikeFee),
      vehicleService.getByApartment(apartmentId),
    ])
      .then(([feeRes, vehRes]) => {
        const totalFee = feeRes.data?.data;
        const vehicles = vehRes.data?.data || [];

        // Count by type
        const counts = {
          MOTORBIKE: vehicles.filter(v => v.vehicleType === 'MOTORBIKE').length,
          CAR: vehicles.filter(v => v.vehicleType === 'CAR').length,
          BICYCLE: vehicles.filter(v => v.vehicleType === 'BICYCLE').length,
          ELECTRIC_BIKE: vehicles.filter(v => v.vehicleType === 'ELECTRIC_BIKE' || v.vehicleType === 'ELECTRIC_MOTORBIKE').length,
        };

        setFormData(prev => ({ ...prev, parkingFee: totalFee != null ? String(totalFee) : '0' }));
        setParkingFeeInfo({
          loading: false,
          vehicles: { counts, rates: { motorbikeFee, carFee, bicycleFee, electricMotorbikeFee } },
          error: null,
        });
      })
      .catch(err => {
        console.error('Lỗi tính phí gửi xe:', err);
        setParkingFeeInfo({ loading: false, vehicles: null, error: 'Không thể tính phí gửi xe' });
      });
  }, [modalOpen, modalMode, formData.apartmentId, activeFee, selectedFeeIndex]);

  /* ─── handlers ─── */
  const handleFilterChange = (val) => { setFilterStatus(val); setPage(0); };
  const handleToggleSort = () => { setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc')); setPage(0); };

  const openMeterEntryModal = (apt) => {
    setReadingForm((prev) => ({
      ...prev,
      apartmentId: apt.id,
      electricCurrentReading: '',
      waterCurrentReading: '',
      note: '',
      electricFile: null,
      waterFile: null,
    }));
    setMeterEntryModalOpen(true);
  };

  const closeMeterEntryModal = () => {
    setMeterEntryModalOpen(false);
  };

  const handleReadingFormChange = (field, value) => {
    setReadingForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBillingPeriodChange = (value) => {
    const nextInput = normalizeBillingPeriodInput(value);
    setBillingPeriodInput(nextInput);
    setReadingForm((prev) => ({ ...prev, billingPeriod: parseBillingPeriodInput(nextInput) }));
  };

  const handleReadingSubmit = async (e) => {
    e.preventDefault();
    if (!readingForm.apartmentId) {
      toast.warning('Vui lòng chọn căn hộ');
      return;
    }
    if (billingPeriodInput && !readingForm.billingPeriod) {
      toast.warning('Kỳ ghi chỉ số phải đúng định dạng MM/yyyy');
      return;
    }
    if (!readingForm.electricCurrentReading && !readingForm.waterCurrentReading) {
      toast.warning('Vui lòng nhập chỉ số điện hoặc nước');
      return;
    }
    if (meterReadingPeriodByApartmentId.has(String(readingForm.apartmentId))) {
      toast.error(`Căn hộ này đã ghi chỉ số kỳ ${formatBillingPeriodDisplay(readingForm.billingPeriod)}. Không thể ghi lại.`);
      return;
    }

    const data = new FormData();
    data.append('apartmentId', readingForm.apartmentId);
    if (readingForm.billingPeriod) data.append('billingPeriod', readingForm.billingPeriod);
    if (readingForm.electricCurrentReading) data.append('electricCurrentReading', readingForm.electricCurrentReading);
    if (readingForm.waterCurrentReading) data.append('waterCurrentReading', readingForm.waterCurrentReading);
    if (readingForm.note?.trim()) data.append('note', readingForm.note.trim());
    if (readingForm.electricFile) data.append('electricFile', readingForm.electricFile);
    if (readingForm.waterFile) data.append('waterFile', readingForm.waterFile);

    setReadingSubmitting(true);
    try {
      const res = await meterReadingService.create(data);
      if (res.data?.status !== false) {
        const savedReading = res.data?.data;
        if (savedReading?.billingPeriod === readingForm.billingPeriod) {
          setPeriodMeterReadings((prev) => [
            savedReading,
            ...prev.filter((item) => item.meterReadingId !== savedReading.meterReadingId),
          ]);
        }
        toast.success('Đã ghi chỉ số điện nước');
        setMeterEntryModalOpen(false);
        setReadingForm((prev) => ({
          ...prev,
          electricCurrentReading: '',
          waterCurrentReading: '',
          note: '',
          electricFile: null,
          waterFile: null,
        }));
        fetchMeterReadings(readingForm.apartmentId);
        meterReadingService.preview(readingForm.apartmentId, readingForm.billingPeriod)
          .then((previewRes) => setMeterPreviewInfo({ loading: false, data: previewRes.data?.data || null, error: null }))
          .catch(() => {});
      } else {
        toast.error(res.data?.message || 'Ghi chỉ số thất bại');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ghi chỉ số thất bại');
    } finally {
      setReadingSubmitting(false);
    }
  };

  const handleOpenEvidence = async (reading, type) => {
    if (!reading?.meterReadingId) return;
    try {
      const res = await meterReadingService.evidence(reading.meterReadingId, type);
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể mở ảnh kiểm chứng');
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedInvoice(null);
    setInvoiceStep(0);
    
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
      managementFee: '', parkingFee: '', otherFee: '', descriptionOtherFee: '', otherFeeItems: [createOtherFeeItem()], apartmentId: '', invoiceStatus: 'UNPAID',
      electricQuantity: '', electricPreviousReading: '', electricCurrentReading: '',
      waterQuantity: '', waterPreviousReading: '', waterCurrentReading: '',
      electricStartDate: defaultStartDate, electricEndDate: defaultDueDate, numberOfHouseholds: '1',
    });
    setFormErrors({});
    setMeterPreviewInfo({ loading: false, data: null, error: null });
    setElectricMeterSource('MOCK_API');
    setWaterMeterSource('MOCK_API');
    setAptFilterBlock('');
    setAptFilterFloor('');
    setAptFilterStatus('');
    setAptModalSearch('');
    setAptModalPage(0);
    setModalOpen(true);
  };

  const openEditModal = (inv) => {
    setModalMode('edit');
    setSelectedInvoice(inv);
    setInvoiceStep(0);
    const dueDate = toInputDate(inv.dueDate);
    
    // Reverse calculate quantities if activeFee is available
    let eq = '';
    if (inv.electricQuantity != null) {
      eq = String(inv.electricQuantity);
    } else if (inv.electricFee && activeFee && activeFee.electricFee > 0) {
      eq = String(Math.round(Number(toPreTaxFeeString(inv.electricFee, 1.08)) / activeFee.electricFee));
    }
    let wq = '';
    if (inv.waterQuantity != null) {
      wq = String(inv.waterQuantity);
    } else if (inv.waterFee && activeFee && activeFee.waterFee > 0) {
      wq = String(Math.round(Number(toPreTaxFeeString(inv.waterFee, 1.15)) / activeFee.waterFee));
    }

    setFormData({
      invoiceNumber: inv.invoiceNumber || '',
      dueDate,
      electricFee: toPreTaxFeeString(inv.electricFee, 1.08),
      waterFee: toPreTaxFeeString(inv.waterFee, 1.15),
      managementFee: inv.managementFee != null ? String(inv.managementFee) : '',
      parkingFee: inv.parkingFee != null ? String(inv.parkingFee) : '',
      otherFee: inv.otherFee != null ? String(inv.otherFee) : '',
      descriptionOtherFee: inv.descriptionOtherFee || '',
      otherFeeItems: normalizeOtherFeeItems(inv.otherFee, inv.descriptionOtherFee),
      apartmentId: inv.apartment?.id || inv.apartmentId || '',
      invoiceStatus: inv.invoiceStatus || 'UNPAID',
      electricQuantity: eq,
      electricPreviousReading: inv.electricPreviousReading != null ? String(inv.electricPreviousReading) : '',
      electricCurrentReading: inv.electricCurrentReading != null ? String(inv.electricCurrentReading) : '',
      waterQuantity: wq,
      waterPreviousReading: inv.waterPreviousReading != null ? String(inv.waterPreviousReading) : '',
      waterCurrentReading: inv.waterCurrentReading != null ? String(inv.waterCurrentReading) : '',
      electricStartDate: billingPeriodStartDate(inv.billingPeriod, dueDate),
      electricEndDate: dueDate,
      numberOfHouseholds: '1',
    });
    setFormErrors({});
    setElectricMeterSource('MOCK_API');
    setWaterMeterSource('MOCK_API');
    setAptFilterBlock('');
    setAptFilterFloor('');
    setAptFilterStatus('');
    setAptModalSearch('');
    setAptModalPage(0);
    setModalOpen(true);
  };

  const openViewModal = async (inv) => {
    setModalMode('view');
    setSelectedInvoice(inv);
    setModalOpen(true);

    if (!inv?.invoiceId) return;

    try {
      const res = await invoiceService.getById(inv.invoiceId);
      const detail = res.data?.data;
      if (detail) setSelectedInvoice({ ...inv, ...detail });
    } catch (err) {
      console.error('Không thể tải chi tiết hóa đơn:', err);
    }
  };
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
        if (updated.electricPreviousReading !== '') {
          updated.electricCurrentReading = String((Number(updated.electricPreviousReading) || 0) + (Number(updated.electricQuantity) || 0));
        }
      }
      if (field === 'waterQuantity') {
        const qty = Number(value);
        if (qty > MAX_QUANTITY) {
          updated.waterQuantity = String(MAX_QUANTITY);
        }
        if (updated.waterPreviousReading !== '') {
          updated.waterCurrentReading = String((Number(updated.waterPreviousReading) || 0) + (Number(updated.waterQuantity) || 0));
        }
      }

      if (field === 'electricPreviousReading' || field === 'electricCurrentReading') {
        const prevReading = Number(updated.electricPreviousReading) || 0;
        const currentReading = Number(updated.electricCurrentReading) || 0;
        if (currentReading >= prevReading) {
          updated.electricQuantity = String(currentReading - prevReading);
        }
      }

      if (field === 'waterPreviousReading' || field === 'waterCurrentReading') {
        const prevReading = Number(updated.waterPreviousReading) || 0;
        const currentReading = Number(updated.waterCurrentReading) || 0;
        if (currentReading >= prevReading) {
          updated.waterQuantity = String(currentReading - prevReading);
        }
      }
       
      // Auto-calculate electricFee when electricQuantity changes
      if ((field === 'electricQuantity' || field === 'electricPreviousReading' || field === 'electricCurrentReading') && activeFee) {
        if (!activeFee.useTieredElectric && activeFee.electricFee > 0) {
          const qty = Number(updated.electricQuantity);
          updated.electricFee = qty > 0 ? String(qty * Number(activeFee.electricFee)) : '';
        } else if (activeFee.useTieredElectric) {
          updated.electricFee = '';
        }
      }
      
      // Auto-calculate waterFee when waterQuantity changes
      if ((field === 'waterQuantity' || field === 'waterPreviousReading' || field === 'waterCurrentReading') && activeFee && activeFee.waterFee > 0) {
        const qty = Number(updated.waterQuantity);
        updated.waterFee = qty > 0 ? String(qty * Number(activeFee.waterFee)) : '';
      }
      
      return updated;
    });
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const getCurrentOtherFeeItems = (data) => (
    Array.isArray(data.otherFeeItems) && data.otherFeeItems.length
      ? data.otherFeeItems
      : normalizeOtherFeeItems(data.otherFee, data.descriptionOtherFee)
  );

  const handleOtherFeeItemChange = (id, field, value) => {
    setFormData((prev) => {
      const items = getCurrentOtherFeeItems(prev).map((item) => (
        item.id === id
          ? { ...item, [field]: field === 'amount' ? parseInputCurrency(value) : value }
          : item
      ));
      return { ...prev, ...buildOtherFeeFields(items) };
    });
  };

  const handleAddOtherFeeItem = () => {
    setFormData((prev) => ({
      ...prev,
      ...buildOtherFeeFields([...getCurrentOtherFeeItems(prev), createOtherFeeItem()]),
    }));
  };

  const handleRemoveOtherFeeItem = (id) => {
    setFormData((prev) => {
      const items = getCurrentOtherFeeItems(prev).filter((item) => item.id !== id);
      return { ...prev, ...buildOtherFeeFields(items) };
    });
  };

  const handleElectricMeterSourceSelect = (source) => {
    setElectricMeterSource(source);
    if (source === 'MOCK_API') {
      setMockMeterReloadKey((prev) => prev + 1);
    }
  };

  const handleWaterMeterSourceSelect = (source) => {
    setWaterMeterSource(source);
    if (source === 'MOCK_API') {
      setMockMeterReloadKey((prev) => prev + 1);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.dueDate) errors.dueDate = 'Vui lòng chọn hạn thanh toán';
    if (modalMode === 'create' && !formData.apartmentId) errors.apartmentId = 'Vui lòng chọn căn hộ';
    if (modalMode === 'create' && electricMeterSource === 'MANUAL' && !formData.electricCurrentReading) {
      toast.error(evnMockInfo.error || 'Kĩ thuật viên chưa ghi lại dữ liệu điện');
      return false;
    }
    if (modalMode === 'create' && waterMeterSource === 'MANUAL' && !formData.waterCurrentReading) {
      toast.error(waterMockInfo.error || 'Kĩ thuật viên chưa ghi lại dữ liệu nước');
      return false;
    }
    if (activeFee?.useTieredElectric && formData.electricQuantity && !formData.electricFee && isCalculatingElectric) {
      toast.error('Đang tính phí điện bậc thang, vui lòng chờ...');
      return false;
    }
    if (activeFee?.useTieredElectric && formData.electricQuantity && !formData.electricFee) {
      toast.error('Chưa có tiền điện bậc thang sau khi đổi chỉ số. Vui lòng kiểm tra ngày tính điện và chờ hệ thống tính lại.');
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
      const otherFeeSummary = getFormOtherFeeSummary(formData);
      let payload;
      if (modalMode === 'create') {
        payload = {
          invoiceNumber: formData.invoiceNumber.trim(),
          dueDate: formData.dueDate,
          apartmentId: Number(formData.apartmentId),
          creatorId: currentUser?.id || currentUser?.userId,
          meterReadingSource: electricMeterSource === 'MANUAL' && waterMeterSource === 'MANUAL' ? 'MANUAL' : 'MOCK_API',
          electricMeterReadingSource: electricMeterSource,
          waterMeterReadingSource: waterMeterSource,
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
      // Electric (bao gồm 8% thuế GTGT)
      if (formData.electricFee) {
        payload.electricFee = Math.round(Number(formData.electricFee) * 1.08);
      }

      // Water (bao gồm 5% thuế GTGT + 10% phí BVMT = 15%)
      if (formData.waterFee) {
        payload.waterFee = Math.round(Number(formData.waterFee) * 1.15);
      }

      if (formData.electricQuantity) payload.electricQuantity = Number(formData.electricQuantity);
      if (formData.electricPreviousReading !== '') payload.electricPreviousReading = Number(formData.electricPreviousReading);
      if (formData.electricCurrentReading !== '') payload.electricCurrentReading = Number(formData.electricCurrentReading);
      if (formData.waterQuantity) payload.waterQuantity = Number(formData.waterQuantity);
      if (formData.waterPreviousReading !== '') payload.waterPreviousReading = Number(formData.waterPreviousReading);
      if (formData.waterCurrentReading !== '') payload.waterCurrentReading = Number(formData.waterCurrentReading);

      // Other fees
      if (formData.managementFee) payload.managementFee = Number(formData.managementFee);
      if (formData.parkingFee) payload.parkingFee = Number(formData.parkingFee);
      if (otherFeeSummary.total > 0) payload.otherFee = otherFeeSummary.total;
      if (otherFeeSummary.description) payload.descriptionOtherFee = otherFeeSummary.description;

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
      try { createdDate = new Date(rawDate).toLocaleDateString('vi-VN'); } catch { /* ignore */ }
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

  const handleVnPayPayment = async (invoiceId) => {
    try {
      toast.info('Đang tạo liên kết thanh toán VNPay...');
      const res = await paymentService.createVnPayPayment(invoiceId);
      const paymentUrl = res.data?.data;
      if (paymentUrl && typeof paymentUrl === 'string' && paymentUrl.startsWith('http')) {
        window.open(paymentUrl, '_blank');
      } else {
        toast.error('Không thể tạo liên kết thanh toán');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo thanh toán VNPay');
    }
  };

  const handleManualPayment = async () => {
    if (!payMethod) { toast.warning('Vui lòng chọn phương thức thanh toán'); return; }
    if (payMethod === 'MOMO') {
      setPayModalOpen(false);
      handleMomoPayment(payInvoiceId);
      return;
    }
    if (payMethod === 'VNPAY') {
      setPayModalOpen(false);
      handleVnPayPayment(payInvoiceId);
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

  const handleConfirmCashPayment = async (paymentId) => {
    if (!paymentId) return;
    setPaySubmitting(true);
    try {
      await paymentService.confirmCashPayment(paymentId);
      toast.success('Đã xác nhận thanh toán tiền mặt!');
      fetchInvoices();
      if (selectedInvoice?.invoiceId) {
        const res = await invoiceService.getById(selectedInvoice.invoiceId);
        setSelectedInvoice(res.data?.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xác nhận thanh toán tiền mặt');
    } finally {
      setPaySubmitting(false);
    }
  };

  const getPendingCashPayment = (invoice) =>
    invoice?.payments?.find((p) => p.paymentMethod === 'CASH' && p.paymentStatus === 'PENDING');

  const getSuccessfulPaidAmount = (invoice) =>
    invoice?.payments
      ?.filter((p) => p.paymentStatus === 'SUCCESS')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

  const getPaymentSummaryStatus = (invoice) => {
    if (invoice?.invoiceStatus === 'PAID') return { label: 'Đã hoàn tất', color: '#047857', bg: '#d1fae5' };
    if (getPendingCashPayment(invoice)) return { label: 'Chờ xác nhận tiền mặt', color: '#92400e', bg: '#fef3c7' };
    if (invoice?.invoiceStatus === 'OVERDUE') return { label: 'Quá hạn', color: '#c2410c', bg: '#ffedd5' };
    return { label: 'Chưa thanh toán', color: '#dc2626', bg: '#fee2e2' };
  };

  const getApartmentLabel = (apt) => {
    if (!apt) return '—';
    return `${apt.block ? `${apt.block}-` : ''}${apt.apartmentNumber || ''}${apt.floor != null ? ` (Tầng ${apt.floor})` : ''}`;
  };

  const getCurrentBatchOtherFeeItems = (data) => (
    Array.isArray(data?.otherFeeItems) && data.otherFeeItems.length
      ? data.otherFeeItems
      : normalizeOtherFeeItems(data?.otherFee, data?.descriptionOtherFee)
  );

  const handleBatchOtherFeeItemChange = (id, field, value) => {
    setBatchFeeDraft((prev) => {
      const items = getCurrentBatchOtherFeeItems(prev).map((item) => (
        item.id === id
          ? { ...item, [field]: field === 'amount' ? parseInputCurrency(value) : value }
          : item
      ));
      return { ...prev, ...buildOtherFeeFields(items) };
    });
  };

  const handleAddBatchOtherFeeItem = () => {
    setBatchFeeDraft((prev) => ({
      ...prev,
      ...buildOtherFeeFields([...getCurrentBatchOtherFeeItems(prev), createOtherFeeItem()]),
    }));
  };

  const handleRemoveBatchOtherFeeItem = (id) => {
    setBatchFeeDraft((prev) => {
      const items = getCurrentBatchOtherFeeItems(prev).filter((item) => item.id !== id);
      return { ...prev, ...buildOtherFeeFields(items) };
    });
  };

  /* ─── Table Fee handlers ─── */
  const openTableFeeEdit = async (fee, index) => {
    setEditingFee(fee ? { ...fee, _index: index } : null);
    setTableFeeForm({
      title: fee?.title || '',
      electricFee: fee?.electricFee != null ? String(fee.electricFee) : '',
      waterFee: fee?.waterFee != null ? String(fee.waterFee) : '',
      managementFee: fee?.managementFee != null ? String(fee.managementFee) : '',
      motorbikeParkingFee: fee?.motorbikeParkingFee != null ? String(fee.motorbikeParkingFee) : '',
      carParkingFee: fee?.carParkingFee != null ? String(fee.carParkingFee) : '',
      bicycleParkingFee: fee?.bicycleParkingFee != null ? String(fee.bicycleParkingFee) : '',
      electricMotorbikeParkingFee: fee?.electricMotorbikeParkingFee != null ? String(fee.electricMotorbikeParkingFee) : '',
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
        motorbikeParkingFee: Number(tableFeeForm.motorbikeParkingFee) || 0,
        carParkingFee: Number(tableFeeForm.carParkingFee) || 0,
        bicycleParkingFee: Number(tableFeeForm.bicycleParkingFee) || 0,
        electricMotorbikeParkingFee: Number(tableFeeForm.electricMotorbikeParkingFee) || 0,
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
    { label: 'Phí gửi xe', sub: 'Ô tô, xe máy, xe đạp', value: 'Tính theo xe', isVehicle: true },
    { label: 'Điện', sub: 'Tiêu thụ điện năng', value: activeFee.electricFee, unit: 'kWh', isTiered: activeFee.useTieredElectric },
    { label: 'Nước', sub: 'Tiêu thụ nước', value: activeFee.waterFee, unit: 'm³' },
    { label: 'Phí khác', sub: 'Các phí phát sinh khác', value: activeFee.otherFee, unit: 'tháng' },
  ] : [];

  const apartmentBlocks = useMemo(
    () => [...new Set(apartments.map((apt) => apt.block).filter(Boolean))].sort(),
    [apartments]
  );
  const apartmentFloors = useMemo(
    () => [...new Set(apartments
      .filter((apt) => !aptFilterBlock || apt.block === aptFilterBlock)
      .map((apt) => apt.floor)
      .filter((floor) => floor != null)
    )].sort((a, b) => Number(a) - Number(b)),
    [apartments, aptFilterBlock]
  );
  const apartmentStatuses = useMemo(
    () => [...new Set(apartments.map((apt) => apt.apartmentStatus).filter(Boolean))].sort(),
    [apartments]
  );
  const filteredApartments = useMemo(
    () => apartments.filter((apt) =>
      (!aptFilterBlock || apt.block === aptFilterBlock)
      && (!aptFilterFloor || String(apt.floor) === String(aptFilterFloor))
      && (!aptFilterStatus || apt.apartmentStatus === aptFilterStatus)
    ),
    [apartments, aptFilterBlock, aptFilterFloor, aptFilterStatus]
  );
  const meterEligibleApartments = useMemo(
    () => apartments.filter(isMeterEligibleApartment),
    [apartments]
  );
  const meterApartmentBlocks = useMemo(
    () => [...new Set(meterEligibleApartments.map((apt) => apt.block).filter(Boolean))].sort(),
    [meterEligibleApartments]
  );
  const meterApartmentFloors = useMemo(
    () => [...new Set(meterEligibleApartments
      .filter((apt) => !aptFilterBlock || apt.block === aptFilterBlock)
      .map((apt) => apt.floor)
      .filter((floor) => floor != null)
    )].sort((a, b) => Number(a) - Number(b)),
    [meterEligibleApartments, aptFilterBlock]
  );
  const meterApartmentStatuses = useMemo(
    () => [...new Set(meterEligibleApartments.map((apt) => apt.apartmentStatus).filter(Boolean))].sort(),
    [meterEligibleApartments]
  );
  const invoicePeriodByApartmentId = useMemo(() => {
    const map = new Map();
    periodInvoices.forEach((invoice) => {
      const apartmentId = getInvoiceApartmentId(invoice);
      if (!apartmentId) return;
      const key = String(apartmentId);
      if (!map.has(key)) map.set(key, invoice);
    });
    return map;
  }, [periodInvoices]);
  const filteredBatchApartments = useMemo(
    () => scopedBatchApartments.filter((apt) => {
      const hasInvoice = invoicePeriodByApartmentId.has(String(apt.id));
      if (batchInvoiceFilter === 'HAS_INVOICE') return hasInvoice;
      if (batchInvoiceFilter === 'NO_INVOICE') return !hasInvoice;
      return true;
    }),
    [scopedBatchApartments, invoicePeriodByApartmentId, batchInvoiceFilter]
  );
  const batchScopedExistingInvoiceCount = useMemo(
    () => scopedBatchApartments.filter((apt) => invoicePeriodByApartmentId.has(String(apt.id))).length,
    [scopedBatchApartments, invoicePeriodByApartmentId]
  );
  const batchScopedNoInvoiceCount = scopedBatchApartments.length - batchScopedExistingInvoiceCount;
  const batchInvoicePeriodLabel = /^\d{2}\/\d{2}\/\d{4}$/.test(batchDueDate)
    ? formatBillingPeriodDisplay(billingPeriodFromDate(batchDueDate))
    : '';
  const batchExistingInvoiceCount = useMemo(
    () => eligibleBatchApartments.filter((apt) => invoicePeriodByApartmentId.has(String(apt.id))).length,
    [eligibleBatchApartments, invoicePeriodByApartmentId]
  );
  const batchSelectedExistingCount = useMemo(
    () => batchSelectedApts.filter((id) => invoicePeriodByApartmentId.has(String(id))).length,
    [batchSelectedApts, invoicePeriodByApartmentId]
  );
  const meterReadingPeriodByApartmentId = useMemo(() => {
    const map = new Map();
    periodMeterReadings.forEach((reading) => {
      const apartmentId = getMeterReadingApartmentId(reading);
      if (!apartmentId) return;
      const key = String(apartmentId);
      if (!map.has(key)) map.set(key, reading);
    });
    return map;
  }, [periodMeterReadings]);
  const meterFilteredApartments = useMemo(() => {
    const keyword = meterAptSearch.trim().toLowerCase();

    return meterEligibleApartments.filter((apt) => {
      const aptKey = String(apt.id);
      const hasPeriodReading = meterReadingPeriodByApartmentId.has(aptKey);
      if (meterAptMode === 'NEED_READING' && hasPeriodReading) return false;
      if (meterAptMode === 'RECORDED' && !hasPeriodReading) return false;
      if (aptFilterBlock && apt.block !== aptFilterBlock) return false;
      if (aptFilterFloor && String(apt.floor) !== String(aptFilterFloor)) return false;
      if (aptFilterStatus && apt.apartmentStatus !== aptFilterStatus) return false;
      if (!keyword) return true;

      const owner = getApartmentOwner(apt);
      const tenant = getApartmentTenant(apt);
      const searchable = [
        apt.apartmentNumber,
        apt.block,
        apt.floor,
        apt.area,
        apt.apartmentStatus,
        apartmentStatusLabel[apt.apartmentStatus],
        owner?.fullName,
        getResidentPhone(owner),
        tenant?.fullName,
        getResidentPhone(tenant),
      ].filter(Boolean).join(' ').toLowerCase();

      return searchable.includes(keyword);
    });
  }, [meterEligibleApartments, meterReadingPeriodByApartmentId, meterAptMode, aptFilterBlock, aptFilterFloor, aptFilterStatus, meterAptSearch]);
  const meterApartmentPageCount = Math.max(1, Math.ceil(meterFilteredApartments.length / METER_APARTMENT_PAGE_SIZE));
  const safeMeterAptPage = Math.min(meterAptPage, meterApartmentPageCount - 1);
  const meterApartmentRows = useMemo(
    () => meterFilteredApartments.slice(
      safeMeterAptPage * METER_APARTMENT_PAGE_SIZE,
      safeMeterAptPage * METER_APARTMENT_PAGE_SIZE + METER_APARTMENT_PAGE_SIZE
    ),
    [meterFilteredApartments, safeMeterAptPage]
  );

  const modalFilteredApartments = useMemo(() => {
    const keyword = aptModalSearch.trim().toLowerCase();
    if (!keyword) return filteredApartments;

    return filteredApartments.filter((apt) => {
      const owner = getApartmentOwner(apt);
      const tenant = getApartmentTenant(apt);
      const searchable = [
        apt.apartmentNumber,
        apt.block,
        apt.floor,
        apt.area,
        apt.apartmentStatus,
        apartmentStatusLabel[apt.apartmentStatus],
        owner?.fullName,
        owner?.phone,
        tenant?.fullName,
        tenant?.phone,
      ].filter(Boolean).join(' ').toLowerCase();

      return searchable.includes(keyword);
    });
  }, [filteredApartments, aptModalSearch]);

  const modalApartmentPageCount = Math.max(1, Math.ceil(modalFilteredApartments.length / MODAL_APARTMENT_PAGE_SIZE));
  const safeAptModalPage = Math.min(aptModalPage, modalApartmentPageCount - 1);
  const modalApartmentRows = useMemo(
    () => modalFilteredApartments.slice(
      safeAptModalPage * MODAL_APARTMENT_PAGE_SIZE,
      safeAptModalPage * MODAL_APARTMENT_PAGE_SIZE + MODAL_APARTMENT_PAGE_SIZE
    ),
    [modalFilteredApartments, safeAptModalPage]
  );
  const selectedModalApartment = useMemo(
    () => apartments.find((apt) => String(apt.id) === String(formData.apartmentId)),
    [apartments, formData.apartmentId]
  );
  const modalInvoicePeriodLabel = formatBillingPeriodDisplay(billingPeriodFromDate(formData.dueDate));

  useEffect(() => {
    setMeterAptPage(0);
  }, [aptFilterBlock, aptFilterFloor, aptFilterStatus, meterAptSearch, meterAptMode, readingForm.billingPeriod]);

  useEffect(() => {
    if (meterAptPage > meterApartmentPageCount - 1) {
      setMeterAptPage(meterApartmentPageCount - 1);
    }
  }, [meterAptPage, meterApartmentPageCount]);

  useEffect(() => {
    setAptModalPage(0);
  }, [aptFilterBlock, aptFilterFloor, aptFilterStatus, aptModalSearch]);

  useEffect(() => {
    if (aptModalPage > modalApartmentPageCount - 1) {
      setAptModalPage(modalApartmentPageCount - 1);
    }
  }, [aptModalPage, modalApartmentPageCount]);

  const invoiceSteps = useMemo(() => {
    const steps = modalMode === 'create'
      ? [
        { key: 'apartment', label: 'Căn hộ', icon: Icons.home },
        { key: 'info', label: 'Chứng từ', icon: Icons.note },
        { key: 'electric', label: 'Tiền điện', icon: Icons.zap },
        { key: 'water', label: 'Tiền nước', icon: Icons.droplet },
        { key: 'fees', label: 'Phí khác', icon: Icons.fee },
        { key: 'review', label: 'Xác nhận', icon: Icons.check },
      ]
      : [
        { key: 'info', label: 'Chứng từ', icon: Icons.note },
        { key: 'electric', label: 'Tiền điện', icon: Icons.zap },
        { key: 'water', label: 'Tiền nước', icon: Icons.droplet },
        { key: 'fees', label: 'Phí khác', icon: Icons.fee },
        { key: 'review', label: 'Xác nhận', icon: Icons.check },
      ];
    return steps;
  }, [modalMode]);

  const currentInvoiceStep = invoiceSteps[Math.min(invoiceStep, invoiceSteps.length - 1)] || invoiceSteps[0];
  const isInvoiceFirstStep = invoiceStep <= 0;
  const isInvoiceLastStep = invoiceStep >= invoiceSteps.length - 1;
  const isInvoiceStep = (key) => currentInvoiceStep?.key === key;

  const getInvoiceStepBlockReason = (nextStep) => {
    const targetStep = Math.max(0, Math.min(nextStep, invoiceSteps.length - 1));
    if (targetStep <= invoiceStep) return '';

    const requiredSteps = invoiceSteps.slice(0, targetStep);
    if (requiredSteps.some((step) => step.key === 'apartment') && !formData.apartmentId) {
      return 'Vui lòng chọn căn hộ trước khi qua bước tiếp theo';
    }
    if (requiredSteps.some((step) => step.key === 'info') && !formData.dueDate) {
      return 'Vui lòng chọn hạn thanh toán trước khi qua bước tiếp theo';
    }
    return '';
  };

  const goToInvoiceStep = (nextStep) => {
    const targetStep = Math.max(0, Math.min(nextStep, invoiceSteps.length - 1));
    const blockReason = getInvoiceStepBlockReason(targetStep);
    if (blockReason) {
      if (modalMode === 'create' && !formData.apartmentId) {
        setFormErrors((prev) => ({ ...prev, apartmentId: 'Vui lòng chọn căn hộ' }));
      }
      if (!formData.dueDate) {
        setFormErrors((prev) => ({ ...prev, dueDate: 'Vui lòng chọn hạn thanh toán' }));
      }
      toast.warning(blockReason);
      return;
    }
    setInvoiceStep(targetStep);
  };

  const handleInvoiceNextStep = () => {
    if (currentInvoiceStep?.key === 'apartment' && !formData.apartmentId) {
      setFormErrors((prev) => ({ ...prev, apartmentId: 'Vui lòng chọn căn hộ' }));
      toast.warning('Vui lòng chọn căn hộ trước khi tiếp tục');
      return;
    }
    if (currentInvoiceStep?.key === 'info' && !formData.dueDate) {
      setFormErrors((prev) => ({ ...prev, dueDate: 'Vui lòng chọn hạn thanh toán' }));
      toast.warning('Vui lòng chọn hạn thanh toán');
      return;
    }
    goToInvoiceStep(invoiceStep + 1);
  };

  const invoiceOtherFeeItems = Array.isArray(formData.otherFeeItems) && formData.otherFeeItems.length
    ? formData.otherFeeItems
    : normalizeOtherFeeItems(formData.otherFee, formData.descriptionOtherFee);
  const invoiceOtherFeeSummary = summarizeOtherFeeItems(invoiceOtherFeeItems);
  const batchOtherFeeItems = Array.isArray(batchFeeDraft?.otherFeeItems) && batchFeeDraft.otherFeeItems.length
    ? batchFeeDraft.otherFeeItems
    : normalizeOtherFeeItems(batchFeeDraft?.otherFee, batchFeeDraft?.descriptionOtherFee);
  const batchOtherFeeSummary = summarizeOtherFeeItems(batchOtherFeeItems);

  const invoiceTotalPreview = (() => {
    const electricAfterTax = Math.round((Number(formData.electricFee) || 0) * 1.08);
    const waterAfterTax = Math.round((Number(formData.waterFee) || 0) * 1.15);
    return {
      electricAfterTax,
      waterAfterTax,
      total: electricAfterTax + waterAfterTax + (Number(formData.managementFee) || 0) + (Number(formData.parkingFee) || 0) + invoiceOtherFeeSummary.total,
    };
  })();

  if (isTechnician) {
    const preview = meterPreviewInfo.data;
    const isElectricTab = meterTab === 'electric';
    const selectedApartment = apartments.find((apt) => String(apt.id) === String(readingForm.apartmentId));
    const selectedPeriodReading = selectedApartment
      ? meterReadingPeriodByApartmentId.get(String(selectedApartment.id))
      : null;
    const meterCards = [
      {
        key: 'electric',
        label: 'Điện',
        title: 'Chỉ số điện',
        unit: 'kWh',
        icon: Icons.zap,
        currentField: 'electricCurrentReading',
        formValue: readingForm.electricCurrentReading,
        previous: preview?.electricPreviousReading,
        current: preview?.electricCurrentReading,
        quantity: preview?.electricQuantity,
      },
      {
        key: 'water',
        label: 'Nước',
        title: 'Chỉ số nước',
        unit: 'm³',
        icon: Icons.droplet,
        currentField: 'waterCurrentReading',
        formValue: readingForm.waterCurrentReading,
        previous: preview?.waterPreviousReading,
        current: preview?.waterCurrentReading,
        quantity: preview?.waterQuantity,
      },
    ];
    const visibleMeterReadings = meterReadings.filter((r) =>
      isElectricTab ? r.electricCurrentReading != null : r.waterCurrentReading != null
    );
    const activeMeterFilterCount = [
      aptFilterBlock,
      aptFilterFloor,
      aptFilterStatus,
      meterAptMode !== 'NEED_READING' ? meterAptMode : '',
      meterAptSearch.trim(),
    ].filter(Boolean).length;
    const meterFilterGroups = [
      {
        key: 'block',
        label: 'Tòa',
        value: aptFilterBlock,
        display: aptFilterBlock ? `Tòa ${aptFilterBlock}` : 'Tất cả',
        options: [
          { value: '', label: 'Tất cả' },
          ...meterApartmentBlocks.map((block) => ({ value: block, label: `Tòa ${block}` })),
        ],
        onSelect: (value) => {
          setAptFilterBlock(value);
          setAptFilterFloor('');
        },
      },
      {
        key: 'floor',
        label: 'Tầng',
        value: aptFilterFloor,
        display: aptFilterFloor ? `Tầng ${aptFilterFloor}` : 'Tất cả',
        options: [
          { value: '', label: 'Tất cả' },
          ...meterApartmentFloors.map((floor) => ({ value: String(floor), label: `Tầng ${floor}` })),
        ],
        onSelect: setAptFilterFloor,
      },
      {
        key: 'status',
        label: 'Trạng thái',
        value: aptFilterStatus,
        display: aptFilterStatus ? (apartmentStatusLabel[aptFilterStatus] || aptFilterStatus) : 'Tất cả',
        options: [
          { value: '', label: 'Tất cả' },
          ...meterApartmentStatuses.map((status) => ({ value: status, label: apartmentStatusLabel[status] || status })),
        ],
        onSelect: setAptFilterStatus,
      },
      {
        key: 'mode',
        label: 'Hiển thị',
        value: meterAptMode,
        display: METER_APARTMENT_MODES.find((mode) => mode.value === meterAptMode)?.label || 'Tất cả',
        options: METER_APARTMENT_MODES,
        onSelect: setMeterAptMode,
      },
    ];
    return (
      <div className={`page meter-page meter-page--${meterTab}`} id="meter-page">
        <div className="meter-workbench">
          <aside className="meter-workbench__sidebar">
            <div className="meter-sidebar-title">
              <span>Vận hành chỉ số</span>
              <h2>Ghi chỉ số điện nước</h2>
              <p>Quản lý kỳ ghi, lọc căn hộ cần xử lý và mở modal nhập chỉ số từ một hàng đợi duy nhất.</p>
            </div>

            <div className="meter-sidebar-card">
              <div className="meter-sidebar-card__head">
                <strong>Bộ lọc thao tác</strong>
                <button className="btn btn--ghost btn--sm" onClick={() => fetchMeterReadings()} title="Làm mới">
                  <span className="btn__icon">{Icons.refresh}</span>
                  Làm mới
                </button>
              </div>
              <div className="meter-filter-console">
                <div className="meter-filter-main">
                  <div className="meter-filter-control meter-filter-control--search">
                    <label>Tìm căn hộ</label>
                    <div className="meter-apartment-search">
                      {Icons.search}
                      <input
                        value={meterAptSearch}
                        onChange={(e) => setMeterAptSearch(e.target.value)}
                        placeholder="Căn hộ, chủ hộ, người thuê, SĐT..."
                      />
                    </div>
                  </div>
                  <div className="meter-filter-control meter-filter-control--period">
                    <label>Kỳ ghi</label>
                    <div className="meter-period-box">
                      {Icons.calendar}
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength="7"
                        value={billingPeriodInput}
                        onChange={(e) => handleBillingPeriodChange(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="meter-filter-strip">
                  {meterFilterGroups.map((group) => (
                    <div
                      key={group.key}
                      className="meter-filter-menu-wrap"
                      onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) {
                          setMeterFilterMenu(null);
                        }
                      }}
                    >
                      <button
                        type="button"
                        className={`meter-filter-pill ${group.value ? 'meter-filter-pill--active' : ''}`}
                        onClick={() => setMeterFilterMenu((current) => (current === group.key ? null : group.key))}
                        aria-expanded={meterFilterMenu === group.key}
                      >
                        <span>{group.label}</span>
                        <strong>{group.display}</strong>
                        {Icons.chevronDown}
                      </button>
                      {meterFilterMenu === group.key && (
                        <div className="meter-filter-menu">
                          {group.options.map((option) => (
                            <button
                              key={String(option.value)}
                              type="button"
                              className={String(group.value) === String(option.value) ? 'meter-filter-menu__item meter-filter-menu__item--active' : 'meter-filter-menu__item'}
                              onClick={() => {
                                group.onSelect(option.value);
                                setMeterFilterMenu(null);
                              }}
                            >
                              <span>{option.label}</span>
                              {String(group.value) === String(option.value) && Icons.check}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="meter-filter-reset"
                    disabled={activeMeterFilterCount === 0}
                    onClick={() => {
                      setAptFilterBlock('');
                      setAptFilterFloor('');
                      setAptFilterStatus('');
                      setMeterAptSearch('');
                      setMeterAptMode('NEED_READING');
                      setMeterFilterMenu(null);
                    }}
                  >
                    Xóa lọc {activeMeterFilterCount > 0 ? `(${activeMeterFilterCount})` : ''}
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <main className="meter-workbench__main">
            <section className="meter-panel meter-filter-panel meter-queue-panel">
              <div className="meter-panel-head meter-panel-head--queue">
                <div>
                  <span className="meter-step-badge">1</span>
                  <strong>Hàng đợi căn hộ cần ghi</strong>
                </div>
                <p>
                  Kỳ {billingPeriodInput || 'MM/yyyy'} · {meterFilteredApartments.length} căn hộ phù hợp
                  {(periodInvoicesLoading || periodMeterReadingsLoading) ? ' · Đang kiểm tra dữ liệu kỳ này' : ''}
                </p>
              </div>
              <div className="meter-apartment-picker" id="meter-field-apartmentId">
            <div className="meter-apartment-picker__head">
              <div>
                <label className="form-label meter-label"><span>{Icons.home}</span> Hàng đợi căn hộ <span className="form-required">*</span></label>
                <p>Bấm vào một dòng để mở modal ghi chỉ số. Căn đã ghi trong kỳ sẽ tự khóa.</p>
              </div>
              <span>{meterFilteredApartments.length} kết quả</span>
            </div>
            <div className="meter-apartment-card-grid">
              {meterApartmentRows.length === 0 ? (
                <div className="meter-apartment-empty">
                  Không tìm thấy căn hộ phù hợp. Hãy kiểm tra lại bộ lọc hoặc từ khóa tìm kiếm.
                </div>
              ) : (
                <>
                  <div className="meter-apartment-list__header">
                    <span />
                    <span>Căn hộ</span>
                    <span>Chủ hộ / người thuê</span>
                    <span>Trạng thái</span>
                    <span>Thao tác</span>
                  </div>
                  {meterApartmentRows.map((apt) => {
                const owner = getApartmentOwner(apt);
                const tenant = getApartmentTenant(apt);
                const selected = String(readingForm.apartmentId) === String(apt.id);
                const periodReading = meterReadingPeriodByApartmentId.get(String(apt.id));
                const periodInvoice = invoicePeriodByApartmentId.get(String(apt.id));
                const hasPeriodReading = Boolean(periodReading);
                const hasPeriodInvoice = Boolean(periodInvoice);
                const actionStatus = hasPeriodReading
                  ? 'Đã ghi kỳ này'
                  : hasPeriodInvoice
                    ? 'Cần ghi'
                    : 'Chưa ghi chỉ số';
                const statusTone = apt.apartmentStatus === 'OCCUPIED'
                  ? 'occupied'
                  : apt.apartmentStatus === 'VACANT'
                    ? 'vacant'
                    : apt.apartmentStatus === 'UNDER_MAINTENANCE'
                      ? 'maintenance'
                      : 'default';

                return (
                  <button
                    key={apt.id}
                    type="button"
                    className={`meter-apartment-card ${selected ? 'meter-apartment-card--selected' : ''} ${hasPeriodReading ? 'meter-apartment-card--recorded' : ''} ${!hasPeriodInvoice ? 'meter-apartment-card--needs-invoice' : ''}`}
                    disabled={hasPeriodReading}
                    title={hasPeriodReading ? `Căn hộ đã ghi chỉ số kỳ ${billingPeriodInput}` : 'Mở modal ghi chỉ số'}
                    onClick={() => {
                      if (!hasPeriodReading) openMeterEntryModal(apt);
                    }}
                  >
                    <span className={`meter-apartment-card__check ${selected ? 'meter-apartment-card__check--active' : ''}`}>
                      {selected ? Icons.check : null}
                    </span>
                    <span className="meter-apartment-card__main">
                      <strong>Căn {apt.apartmentNumber}</strong>
                      <small>
                        {[
                          apt.block ? `Tòa ${apt.block}` : '',
                          apt.floor != null ? `Tầng ${apt.floor}` : '',
                          apt.area ? `${apt.area}m²` : '',
                        ].filter(Boolean).join(' · ') || 'Chưa có vị trí'}
                      </small>
                    </span>
                    <span className="meter-apartment-card__people">
                      {owner && <span>Chủ: {owner.fullName}{getResidentPhone(owner) ? ` · ${getResidentPhone(owner)}` : ''}</span>}
                      {tenant && <span>Thuê: {tenant.fullName}{getResidentPhone(tenant) ? ` · ${getResidentPhone(tenant)}` : ''}</span>}
                    </span>
                    <span className="meter-apartment-card__badges">
                      <span className={`meter-apartment-card__status meter-apartment-card__status--${statusTone}`}>
                        {apartmentStatusLabel[apt.apartmentStatus] || apt.apartmentStatus || '—'}
                      </span>
                      <span className={`meter-apartment-card__period ${hasPeriodReading ? 'meter-apartment-card__period--recorded' : (!hasPeriodInvoice ? 'meter-apartment-card__period--no-invoice' : 'meter-apartment-card__period--todo')}`}>
                        {actionStatus}
                      </span>
                    </span>
                    <span className="meter-apartment-card__action">
                      {hasPeriodReading ? 'Đã khóa' : 'Ghi chỉ số'}
                    </span>
                  </button>
                );
              })}
                </>
              )}
            </div>
            <div className="meter-apartment-pagination">
              <span className="meter-apartment-pagination__range">
                {meterFilteredApartments.length === 0
                  ? '0 kết quả'
                  : `Hiển thị ${safeMeterAptPage * METER_APARTMENT_PAGE_SIZE + 1}-${Math.min((safeMeterAptPage + 1) * METER_APARTMENT_PAGE_SIZE, meterFilteredApartments.length)} / ${meterFilteredApartments.length} căn hộ`}
              </span>
              <div className="meter-apartment-pagination__controls">
                <button type="button" disabled={safeMeterAptPage <= 0} onClick={() => setMeterAptPage((p) => Math.max(0, p - 1))}>{Icons.chevronLeft}</button>
                <strong>Trang {safeMeterAptPage + 1} / {meterApartmentPageCount}</strong>
                <button type="button" disabled={safeMeterAptPage >= meterApartmentPageCount - 1} onClick={() => setMeterAptPage((p) => Math.min(meterApartmentPageCount - 1, p + 1))}>{Icons.chevronRight}</button>
              </div>
            </div>
              </div>
            </section>

        {meterEntryModalOpen && selectedApartment && (
          <div className="modal-overlay" onClick={closeMeterEntryModal}>
            <form className="modal meter-entry-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleReadingSubmit}>
              <div className="modal__header meter-entry-modal__header">
                <div>
                  <h3 className="modal__title">Ghi chỉ số {getApartmentLabel(selectedApartment)}</h3>
                  <p className="meter-entry-modal__subtitle">Kỳ {billingPeriodInput || 'MM/yyyy'} · {apartmentStatusLabel[selectedApartment.apartmentStatus] || selectedApartment.apartmentStatus || '—'}</p>
                </div>
                <button type="button" className="modal__close" onClick={closeMeterEntryModal}>
                  {Icons.close}
                </button>
              </div>

              <div className="modal__body meter-entry-modal__body">
                <div className="meter-entry-summary">
                  <div>
                    <span>Căn hộ</span>
                    <strong>{getApartmentLabel(selectedApartment)}</strong>
                  </div>
                  <div>
                    <span>Diện tích</span>
                    <strong>{selectedApartment.area ? `${selectedApartment.area}m²` : '—'}</strong>
                  </div>
                  <div>
                    <span>Kỳ ghi</span>
                    <strong>{billingPeriodInput || 'MM/yyyy'}</strong>
                  </div>
                  <div>
                    <span>Trạng thái kỳ</span>
                    <strong>{selectedPeriodReading ? 'Đã ghi' : 'Chưa ghi chỉ số'}</strong>
                  </div>
                </div>

                {selectedPeriodReading && (
                  <div className="meter-period-lock">
                    Căn hộ này đã có bản ghi chỉ số kỳ {billingPeriodInput}. Hệ thống đã khóa nhập mới cho kỳ này.
                  </div>
                )}

                <div className="meter-entry-modal__content">
                  <div className="meter-entry-modal__form">
                    <div className="meter-reading-cards meter-reading-cards--modal">
                      {meterCards.map((meter) => {
                        const currentValue = Number(meter.formValue || 0);
                        const previousValue = Number(meter.previous || 0);
                        const draftUsage = meter.formValue ? Math.max(0, currentValue - previousValue) : null;
                        return (
                          <div key={meter.key} className={`meter-reading-card meter-reading-card--${meter.key}`}>
                            <div className="meter-reading-card__head">
                              <span>{meter.icon}</span>
                              <div>
                                <strong>{meter.title}</strong>
                                <small>Đơn vị: {meter.unit}</small>
                              </div>
                            </div>
                            <div className="meter-reading-card__baseline">
                              <span>Kỳ trước</span>
                              <strong>{formatInputCurrency(meter.previous || 0)} {meter.unit}</strong>
                            </div>
                            <div className="form-field meter-field">
                              <label className="form-label">Chỉ số hiện tại</label>
                              <div className="meter-reading-input">
                                <input
                                  className="form-input"
                                  inputMode="numeric"
                                  value={formatInputCurrency(meter.formValue)}
                                  onChange={(e) => handleReadingFormChange(meter.currentField, parseInputCurrency(e.target.value))}
                                  disabled={Boolean(selectedPeriodReading)}
                                />
                                <span>{meter.unit}</span>
                              </div>
                            </div>
                            <div className={`meter-reading-card__usage ${draftUsage != null ? 'meter-reading-card__usage--ready' : ''}`}>
                              <span>Tiêu thụ tạm tính</span>
                              <strong>{draftUsage != null ? `+${formatInputCurrency(draftUsage)} ${meter.unit}` : 'Chưa nhập'}</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="meter-form-grid meter-form-grid--support meter-form-grid--modal">
                      <div className="form-field meter-field meter-field--full">
                        <label className="form-label meter-label"><span>{Icons.image}</span> Ảnh kiểm chứng</label>
                        <div className="meter-evidence-grid">
                          {[
                            { id: 'meter-entry-electric-evidence', field: 'electricFile', label: 'Ảnh chỉ số điện', icon: Icons.zap },
                            { id: 'meter-entry-water-evidence', field: 'waterFile', label: 'Ảnh chỉ số nước', icon: Icons.droplet },
                          ].map((evidence) => {
                            const selectedFile = readingForm[evidence.field];
                            return (
                              <div key={evidence.field} className="meter-evidence-picker">
                                <span className="meter-evidence-picker__label">{evidence.icon} {evidence.label}</span>
                                <div className="meter-file-picker">
                                  <input
                                    id={evidence.id}
                                    key={selectedFile ? `${evidence.field}-set` : `${evidence.field}-empty`}
                                    type="file"
                                    accept="image/*"
                                    disabled={Boolean(selectedPeriodReading)}
                                    onChange={(event) => handleReadingFormChange(evidence.field, event.target.files?.[0] || null)}
                                  />
                                  <label htmlFor={evidence.id}>
                                    <span>{Icons.image}</span>
                                    Chọn ảnh
                                  </label>
                                  <span title={selectedFile?.name || ''}>{selectedFile?.name || 'Chưa chọn ảnh'}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="form-field meter-field meter-field--full">
                        <label className="form-label meter-label"><span>{Icons.note}</span> Ghi chú</label>
                        <textarea className="form-input meter-note" rows="3" value={readingForm.note} onChange={(e) => handleReadingFormChange('note', e.target.value)} disabled={Boolean(selectedPeriodReading)} placeholder="VD: Đồng hồ bị mờ, cần đối chiếu lại..." />
                      </div>
                    </div>
                  </div>

                  <aside className="meter-entry-preview">
                    <strong>Đối chiếu nhanh</strong>
                    {!readingForm.apartmentId ? (
                      <div className="meter-help-empty">Chọn căn hộ để xem chỉ số nền.</div>
                    ) : meterPreviewInfo.loading ? (
                      <div className="page__loading" style={{ minHeight: 80 }}><div className="spinner" /><span>Đang tải...</span></div>
                    ) : meterPreviewInfo.error ? (
                      <p className="meter-error">{meterPreviewInfo.error}</p>
                    ) : (
                      <div className="meter-preview-list">
                        {meterCards.map((meter) => (
                          <div key={meter.key} className={`meter-stat meter-stat--${meter.key}`}>
                            <span>{meter.title}</span>
                            <strong>{formatInputCurrency(meter.previous || 0)} <small>{meter.unit}</small></strong>
                            <p>Gần nhất: {formatInputCurrency(meter.current || 0)} {meter.unit} · Tiêu thụ +{formatInputCurrency(meter.quantity || 0)} {meter.unit}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </aside>
                </div>
              </div>

              <div className="modal__footer meter-entry-modal__footer">
                <button type="button" className="btn btn--ghost" onClick={closeMeterEntryModal}>Đóng</button>
                <button type="submit" className="btn btn--primary meter-submit" disabled={readingSubmitting || Boolean(selectedPeriodReading)}>
                  {selectedPeriodReading ? 'Đã khóa kỳ này' : (readingSubmitting ? 'Đang lưu...' : 'Lưu chỉ số')}
                </button>
              </div>
            </form>
          </div>
        )}

        <section className="meter-panel meter-history-shell">
          <div className="meter-history-shell__head">
            <div>
              <span className="meter-step-badge">2</span>
              <strong>Lịch sử ghi chỉ số</strong>
            </div>
            <div className="meter-tabs">
          {[
            { key: 'electric', label: 'Chỉ số điện', icon: Icons.zap },
            { key: 'water', label: 'Chỉ số nước', icon: Icons.droplet },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMeterTab(tab.key)}
              className={`meter-tab meter-tab--${tab.key} ${meterTab === tab.key ? 'meter-tab--active' : ''}`}
            >
              <span className="meter-tab__icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
            </div>
          </div>

        {/* ── History Table ── */}
        <div className="page__table-wrapper meter-history">
          <div className="meter-history__header">
            <span>{Icons.clipboard}</span>
            <h3>Lịch sử ghi chỉ số {isElectricTab ? 'điện' : 'nước'}</h3>
          </div>
          {meterReadingsLoading ? (
            <div className="page__loading"><div className="spinner" /><span>Đang tải lịch sử...</span></div>
          ) : visibleMeterReadings.length === 0 ? (
            <div className="meter-empty-state">
              <span>{Icons.clipboard}</span>
              <p>Chưa có lịch sử ghi chỉ số</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Căn hộ</th>
                  <th>Kỳ</th>
                  <th>Trước</th>
                  <th>Sau</th>
                  <th>Tiêu thụ</th>
                  <th>Nguồn</th>
                  <th>Ảnh</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {visibleMeterReadings.map((r) => {
                  const prev = isElectricTab ? r.electricPreviousReading : r.waterPreviousReading;
                  const curr = isElectricTab ? r.electricCurrentReading : r.waterCurrentReading;
                  const qty = isElectricTab ? r.electricQuantity : r.waterQuantity;
                  const unit = isElectricTab ? 'kWh' : 'm³';
                  const evidenceType = isElectricTab ? 'electric' : 'water';
                  const evidenceUrl = isElectricTab
                    ? (r.electricEvidenceUrl || r.evidenceUrl)
                    : (r.waterEvidenceUrl || r.evidenceUrl);
                  return (
                    <tr key={r.meterReadingId}>
                      <td>{getApartmentLabel(r.apartment)}</td>
                      <td>{formatBillingPeriodDisplay(r.billingPeriod) || '—'}</td>
                      <td>{formatInputCurrency(prev || 0)} {unit}</td>
                      <td style={{ fontWeight: 600 }}>{formatInputCurrency(curr)} {unit}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                          background: isElectricTab ? '#fef3c7' : '#e0f2fe',
                          color: isElectricTab ? '#92400e' : '#0369a1',
                        }}>
                          +{formatInputCurrency(qty || 0)} {unit}
                        </span>
                      </td>
                      <td>{r.source === 'MANUAL' ? 'Ghi tay' : 'Mock API'}</td>
                      <td>
                        {evidenceUrl ? (
                          <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleOpenEvidence(r, evidenceType)}>Xem ảnh</button>
                        ) : '—'}
                      </td>
                      <td>{formatDateTime(r.recordedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        </section>
          </main>
        </div>
      </div>
    );
  }

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
                  {row.isTiered ? 'Lũy tiến (Bậc thang)' : row.isVehicle ? row.value : `${shortMoney(row.value)}/${row.unit}`}
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
                const pendingCashPayment = getPendingCashPayment(inv);
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
                      {pendingCashPayment && (
                        <div style={{ marginTop: 6 }}>
                          <span className="badge" style={{ color: '#92400e', backgroundColor: '#fef3c7' }}>
                            Chờ xác nhận tiền mặt
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn action-btn--view" data-tooltip="Xem chi tiết" aria-label="Xem chi tiết" onClick={() => openViewModal(inv)}>{Icons.eye}</button>
                        {(inv.invoiceStatus === 'UNPAID' || inv.invoiceStatus === 'OVERDUE') ? (
                          <button
                            className="action-btn"
                            data-tooltip="Thanh toán"
                            aria-label="Thanh toán"
                            onClick={() => openPaymentModal(inv.invoiceId)}
                            style={{ color: '#16a34a', background: '#dcfce7' }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                          </button>
                        ) : (
                          <button
                            className="action-btn"
                            data-tooltip="Đã thanh toán"
                            aria-label="Đã thanh toán"
                            disabled
                            style={{ color: '#a3e635', background: '#f0fdf4', opacity: 0.5, cursor: 'default' }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><polyline points="20 6 9 17 4 12" /></svg>
                          </button>
                        )}
                        {pendingCashPayment && (
                          <button
                            className="action-btn"
                            data-tooltip="Xác nhận tiền mặt"
                            aria-label="Xác nhận thanh toán tiền mặt"
                            disabled={paySubmitting}
                            onClick={() => handleConfirmCashPayment(pendingCashPayment.paymentId)}
                            style={{ color: '#16a34a', background: '#dcfce7' }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><polyline points="20 6 9 17 4 12" /></svg>
                          </button>
                        )}
                        <button className="action-btn" data-tooltip="Xuất PDF" aria-label="Xuất PDF" onClick={() => handleExportPDF(inv)} style={{ color: '#dc2626', background: '#fee2e2' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                        </button>
                        <button className="action-btn action-btn--edit" data-tooltip="Chỉnh sửa" aria-label="Chỉnh sửa" onClick={() => openEditModal(inv)}>{Icons.edit}</button>
                        <button className="action-btn action-btn--delete" data-tooltip="Xóa" aria-label="Xóa" onClick={() => openDeleteModal(inv)}>{Icons.trash}</button>
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
      {modalOpen && (modalMode === 'create' || modalMode === 'edit') && createPortal((
        <div className="modal-overlay invoice-create-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal modal--invoice invoice-create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{modalMode === 'create' ? 'Tạo hóa đơn mới' : 'Chỉnh sửa hóa đơn'}</h3>
              <div className="invoice-create-modal__header-actions">
                {tableFees.length > 0 && (
                  <div className="invoice-create-fee-menu">
                    <button
                      type="button"
                      onClick={() => setModalFeeDropdownOpen(!modalFeeDropdownOpen)}
                      className="invoice-create-fee-trigger"
                    >
                      <span>{tableFees[selectedFeeIndex]?.title || 'Chọn bảng phí'}</span>
                      <svg className={modalFeeDropdownOpen ? 'is-open' : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    {modalFeeDropdownOpen && (
                      <div className="invoice-create-fee-dropdown">
                        {tableFees.map((fee, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedFeeIndex(idx);
                              setModalFeeDropdownOpen(false);
                            }}
                            className={`invoice-create-fee-option ${selectedFeeIndex === idx ? 'invoice-create-fee-option--active' : ''}`}
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
            <form onSubmit={handleSubmit} className="modal__body invoice-wizard">
              <div className="invoice-stepper">
                {invoiceSteps.map((step, idx) => {
                  const blockReason = getInvoiceStepBlockReason(idx);
                  return (
                    <button
                      key={step.key}
                      type="button"
                      className={`invoice-stepper__item ${idx === invoiceStep ? 'invoice-stepper__item--active' : ''} ${idx < invoiceStep ? 'invoice-stepper__item--done' : ''} ${blockReason ? 'invoice-stepper__item--locked' : ''}`}
                      onClick={() => goToInvoiceStep(idx)}
                      title={blockReason || step.label}
                    >
                      <span className="invoice-stepper__icon">{step.icon}</span>
                      <span className="invoice-stepper__text">
                        <small>Bước {idx + 1}</small>
                        <strong>{step.label}</strong>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="form-grid">
                {/* 1. Apartment selection (create only) */}
                {modalMode === 'create' && isInvoiceStep('apartment') && (
                  <div className="form-field form-field--full" style={{ padding: 0, background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', padding: '0.85rem 1.25rem', borderBottom: '1px solid #cbd5e1', fontWeight: 600, color: '#3730a3', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px 8px 0 0' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                      Chọn căn hộ <span className="form-required">*</span>
                    </div>
                    <div className="invoice-apartment-picker" id="invoice-field-apartmentId">
                      <div className="invoice-apartment-toolbar">
                        <div className="invoice-apartment-search">
                          {Icons.search}
                          <input
                            value={aptModalSearch}
                            onChange={(e) => setAptModalSearch(e.target.value)}
                            placeholder="Tìm căn hộ, cư dân, số điện thoại..."
                          />
                        </div>
                        <DropdownSelect
                          value={aptFilterBlock}
                          onChange={(value) => {
                            setAptFilterBlock(value);
                            setAptFilterFloor('');
                          }}
                          options={[
                            { value: '', label: 'Tất cả tòa' },
                            ...apartmentBlocks.map((block) => ({ value: block, label: `Tòa ${block}` })),
                          ]}
                        />
                        <DropdownSelect
                          value={aptFilterFloor}
                          onChange={(value) => setAptFilterFloor(value)}
                          options={[
                            { value: '', label: 'Tất cả tầng' },
                            ...apartmentFloors.map((floor) => ({ value: floor, label: `Tầng ${floor}` })),
                          ]}
                        />
                        <DropdownSelect
                          value={aptFilterStatus}
                          onChange={(value) => setAptFilterStatus(value)}
                          options={[
                            { value: '', label: 'Tất cả trạng thái' },
                            ...apartmentStatuses.map((status) => ({ value: status, label: apartmentStatusLabel[status] || status })),
                          ]}
                        />
                        {(aptFilterBlock || aptFilterFloor || aptFilterStatus || aptModalSearch) && (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => {
                              setAptFilterBlock('');
                              setAptFilterFloor('');
                              setAptFilterStatus('');
                              setAptModalSearch('');
                            }}
                          >
                            Xóa lọc
                          </button>
                        )}
                      </div>
                      {formErrors.apartmentId && <span className="form-error" style={{ marginTop: 4 }}>{formErrors.apartmentId}</span>}
                      <div className="invoice-apartment-table-wrap">
                        <table className="invoice-apartment-table">
                          <thead>
                            <tr>
                              <th style={{ width: 54 }}>Chọn</th>
                              <th>Căn hộ</th>
                              <th>Vị trí</th>
                              <th>Cư dân</th>
                              <th>Diện tích</th>
                              <th>Trạng thái</th>
                              <th>Hóa đơn kỳ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modalApartmentRows.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="invoice-apartment-empty">Không tìm thấy căn hộ phù hợp</td>
                              </tr>
                            ) : modalApartmentRows.map((apt) => {
                              const owner = getApartmentOwner(apt);
                              const tenant = getApartmentTenant(apt);
                              const isSelected = String(formData.apartmentId) === String(apt.id);
                              const existingInvoice = invoicePeriodByApartmentId.get(String(apt.id));
                              const hasInvoiceInPeriod = !!existingInvoice;
                              const statusTone = apt.apartmentStatus === 'OCCUPIED'
                                ? 'occupied'
                                : apt.apartmentStatus === 'VACANT'
                                  ? 'vacant'
                                  : apt.apartmentStatus === 'UNDER_MAINTENANCE'
                                    ? 'maintenance'
                                    : 'default';
                              return (
                                <tr
                                  key={apt.id}
                                  className={`${isSelected ? 'invoice-apartment-table__row--selected' : ''} ${hasInvoiceInPeriod ? 'invoice-apartment-table__row--has-invoice' : ''}`}
                                  onClick={() => handleFormChange('apartmentId', apt.id)}
                                >
                                  <td>
                                    <span className={`invoice-apartment-radio ${isSelected ? 'invoice-apartment-radio--checked' : ''}`} />
                                  </td>
                                  <td>
                                    <span className="invoice-apartment-main">Căn {apt.apartmentNumber}</span>
                                    <span className="invoice-apartment-meta">{apt.block ? `Tòa ${apt.block}` : 'Chưa có tòa'}</span>
                                  </td>
                                  <td>
                                    <span className="invoice-apartment-main">{apt.floor != null ? `Tầng ${apt.floor}` : 'Chưa có tầng'}</span>
                                    <span className="invoice-apartment-meta">{apt.block ? `Block ${apt.block}` : '—'}</span>
                                  </td>
                                  <td>
                                    <span className="invoice-apartment-main">{owner?.fullName || tenant?.fullName || 'Chưa có cư dân'}</span>
                                    <span className="invoice-apartment-meta">{owner?.phone || tenant?.phone || '—'}</span>
                                  </td>
                                  <td>
                                    <span className="invoice-apartment-main">{apt.area ? `${apt.area} m²` : '—'}</span>
                                  </td>
                                  <td>
                                    <span className={`invoice-apartment-status invoice-apartment-status--${statusTone}`}>{apartmentStatusLabel[apt.apartmentStatus] || apt.apartmentStatus || '—'}</span>
                                  </td>
                                  <td>
                                    {hasInvoiceInPeriod ? (
                                      <span className="invoice-apartment-invoice-cell">
                                        <span className="invoice-apartment-invoice-badge">Đã có</span>
                                        {existingInvoice?.invoiceNumber && (
                                          <span className="invoice-apartment-invoice-code">{existingInvoice.invoiceNumber}</span>
                                        )}
                                      </span>
                                    ) : (
                                      <span className="invoice-apartment-empty-mark">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="invoice-apartment-footer">
                        <span>
                          {selectedModalApartment
                            ? `Đã chọn: Căn ${selectedModalApartment.apartmentNumber}`
                            : `${modalFilteredApartments.length} / ${apartments.length} căn hộ`}
                          {periodInvoicesLoading ? ` · Đang kiểm tra hóa đơn kỳ ${modalInvoicePeriodLabel}` : ''}
                        </span>
                        <div className="invoice-apartment-pagination">
                          <button type="button" disabled={safeAptModalPage <= 0} onClick={() => setAptModalPage(0)}>«</button>
                          <button type="button" disabled={safeAptModalPage <= 0} onClick={() => setAptModalPage((p) => Math.max(0, p - 1))}>{Icons.chevronLeft}</button>
                          <strong>{safeAptModalPage + 1} / {modalApartmentPageCount}</strong>
                          <button type="button" disabled={safeAptModalPage >= modalApartmentPageCount - 1} onClick={() => setAptModalPage((p) => Math.min(modalApartmentPageCount - 1, p + 1))}>{Icons.chevronRight}</button>
                          <button type="button" disabled={safeAptModalPage >= modalApartmentPageCount - 1} onClick={() => setAptModalPage(modalApartmentPageCount - 1)}>»</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* 2. Invoice Info */}
                {isInvoiceStep('info') && (
                <div className="form-field form-field--full" style={{ padding: 0, background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', padding: '0.85rem 1.25rem', borderBottom: '1px solid #a7f3d0', fontWeight: 600, color: '#065f46', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px 8px 0 0' }}>
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
                        <DropdownSelect
                          value={formData.invoiceStatus}
                          onChange={(value) => handleFormChange('invoiceStatus', value)}
                          options={[
                            { value: 'UNPAID', label: 'Chưa thanh toán' },
                            { value: 'PAID', label: 'Đã thanh toán' },
                          ]}
                        />
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* 3. Electric Consumption */}
                {isInvoiceStep('electric') && (
                <div className="form-field form-field--full" style={{ padding: 0, background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', padding: '0.85rem 1.25rem', borderBottom: '1px solid #93c5fd', fontWeight: 600, color: '#1e40af', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px 8px 0 0' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    Dịch vụ Tiền điện
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    {/* ELECTRIC SECTION */}
                    {activeFee && activeFee.useTieredElectric ? (
                      <div style={{ marginBottom: '1rem', padding: '1.25rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontWeight: 600, color: '#1d4ed8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                          Tính phí điện (Bậc thang)
                        </div>
                        {modalMode === 'create' && (
                          <div className="meter-source-panel meter-source-panel--inline">
                            <div className="meter-source-panel__head">
                              <div>
                                <strong>Nguồn chỉ số điện</strong>
                                <span>Chọn dữ liệu điện dùng để chốt kỳ hóa đơn này.</span>
                              </div>
                              <em>{electricMeterSource === 'MOCK_API' ? 'Đang dùng mock API' : 'Đang dùng ghi thủ công'}</em>
                            </div>
                            <div className="meter-source-options">
                              {[
                                { value: 'MOCK_API', label: 'Mock API', desc: 'Tự lấy chỉ số điện từ EVN mock', icon: Icons.refresh },
                                { value: 'MANUAL', label: 'Ghi thủ công', desc: 'Dùng chỉ số điện Technician đã ghi', icon: Icons.clipboard },
                              ].map((option) => (
                                <button key={option.value} type="button" className={`meter-source-option ${electricMeterSource === option.value ? 'meter-source-option--active' : ''}`} onClick={() => handleElectricMeterSourceSelect(option.value)}>
                                  <span className="meter-source-option__icon">{option.icon}</span>
                                  <span><strong>{option.label}</strong><small>{option.desc}</small></span>
                                  <span className="meter-source-option__radio" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
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
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Chỉ số điện đầu kỳ</label>
                            <input type="text" className="form-input" value={formatInputCurrency(formData.electricPreviousReading)} readOnly style={{ background: '#f1f5f9', cursor: 'default' }} />
                          </div>
                          <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Chỉ số điện cuối kỳ</label>
                            <input type="text" className="form-input" value={formatInputCurrency(formData.electricCurrentReading)} onChange={(e) => handleFormChange('electricCurrentReading', parseInputCurrency(e.target.value))} placeholder="Nhập chỉ số mới..." />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'end' }}>
                          <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem' }}>Số điện tiêu thụ (kWh)</label>
                            <input type="text" className="form-input" value={formatInputCurrency(formData.electricQuantity)} onChange={(e) => handleFormChange('electricQuantity', parseInputCurrency(e.target.value))} placeholder="Nhập số điện..." readOnly={!!(!evnMockInfo.loading && evnMockInfo.data)} style={{ background: (!evnMockInfo.loading && evnMockInfo.data) ? '#f1f5f9' : '#fff' }} />
                          </div>
                          <div className="form-field" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748b' }}>Tiền điện chưa thuế</label>
                            <div style={{ position: 'relative' }}>
                              <input type="text" className="form-input" value={formatInputCurrency(formData.electricFee)} readOnly placeholder="Tự động tính..." style={{ background: '#f1f5f9', color: '#64748b', cursor: 'default', fontWeight: 600 }} />
                              {isCalculatingElectric && (
                                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                                  <div className="spinner" style={{ width: 16, height: 16, margin: 0 }} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {Number(formData.electricFee) > 0 && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem', paddingBottom: '0.5rem', alignItems: 'end' }}>
                            <div className="form-field" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.8rem', color: '#d97706' }}>Thuế GTGT (8%)</label>
                              <input type="text" className="form-input" value={formatInputCurrency(Math.round(Number(formData.electricFee) * 0.08))} readOnly style={{ background: '#fefce8', color: '#d97706', cursor: 'default', fontWeight: 600 }} />
                            </div>
                            <div className="form-field" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '0.8rem', color: '#047857' }}>Tổng tiền điện</label>
                              <input type="text" className="form-input" value={formatInputCurrency(Math.round(Number(formData.electricFee) * 1.08))} readOnly style={{ background: '#d1fae5', color: '#047857', cursor: 'default', fontWeight: 600 }} />
                            </div>
                          </div>
                        )}
                        {modalMode === 'create' && activeFee?.useTieredElectric && formData.apartmentId && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            {evnMockInfo.loading && <span style={{ color: '#d97706' }}>⏳ Đang kết nối EVN...</span>}
                            {!evnMockInfo.loading && evnMockInfo.error && <span style={{ color: '#dc2626' }}>⚠ {evnMockInfo.error}</span>}
                            {!evnMockInfo.loading && evnMockInfo.data && <span style={{ color: '#059669' }}>✓ {evnMockInfo.data.sourceLabel || 'Mock API'}: {evnMockInfo.data.kwhConsumed || 0} kWh</span>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ marginBottom: '1rem', padding: '1.25rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 600, color: '#1d4ed8', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                          Tiền điện
                        </div>
                        {modalMode === 'create' && (
                          <div className="meter-source-panel meter-source-panel--inline">
                            <div className="meter-source-panel__head">
                              <div>
                                <strong>Nguồn chỉ số điện</strong>
                                <span>Chọn dữ liệu điện dùng để chốt kỳ hóa đơn này.</span>
                              </div>
                              <em>{electricMeterSource === 'MOCK_API' ? 'Đang dùng mock API' : 'Đang dùng ghi thủ công'}</em>
                            </div>
                            <div className="meter-source-options">
                              {[
                                { value: 'MOCK_API', label: 'Mock API', desc: 'Tự lấy chỉ số điện từ EVN mock', icon: Icons.refresh },
                                { value: 'MANUAL', label: 'Ghi thủ công', desc: 'Dùng chỉ số điện Technician đã ghi', icon: Icons.clipboard },
                              ].map((option) => (
                                <button key={option.value} type="button" className={`meter-source-option ${electricMeterSource === option.value ? 'meter-source-option--active' : ''}`} onClick={() => handleElectricMeterSourceSelect(option.value)}>
                                  <span className="meter-source-option__icon">{option.icon}</span>
                                  <span><strong>{option.label}</strong><small>{option.desc}</small></span>
                                  <span className="meter-source-option__radio" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      {(() => {
                        const isElectricManualMissing = electricMeterSource === 'MANUAL' && evnMockInfo.error === 'Kĩ thuật viên chưa ghi lại dữ liệu điện';
                        return (
                          <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                              <div className="form-field" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Chỉ số điện đầu kỳ</label>
                                <input type="text" className="form-input" value={formatInputCurrency(formData.electricPreviousReading)} readOnly style={{ background: '#f1f5f9', cursor: 'default' }} />
                              </div>
                              {!isElectricManualMissing && (
                                <div className="form-field" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Chỉ số điện cuối kỳ</label>
                                  <input type="text" className="form-input" value={formatInputCurrency(formData.electricCurrentReading)} onChange={(e) => handleFormChange('electricCurrentReading', parseInputCurrency(e.target.value))} placeholder="Nhập chỉ số mới..." />
                                </div>
                              )}
                            </div>
                            
                            {!isElectricManualMissing && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-field" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Điện tiêu thụ (kWh) {activeFee && activeFee.electricFee > 0 && <span style={{ color: '#e74c3c', fontSize: '0.8rem', fontWeight: 600 }}>{shortMoney(activeFee.electricFee)}/kWh</span>}</label>
                                  <input type="text" className="form-input" value={formatInputCurrency(formData.electricQuantity)} onChange={(e) => handleFormChange('electricQuantity', parseInputCurrency(e.target.value))} placeholder="Nhập số điện..." />
                                </div>
                                <div className="form-field" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ color: '#64748b' }}>Tiền điện chưa thuế</label>
                                  <input type="text" className="form-input" value={formatInputCurrency(formData.electricFee)} readOnly placeholder="Tự động tính" style={{ background: '#f1f5f9', color: '#64748b', cursor: 'default', fontWeight: 600 }} />
                                </div>
                              </div>
                            )}

                            {Number(formData.electricFee) > 0 && !isElectricManualMissing && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem', paddingBottom: '0.5rem', alignItems: 'end' }}>
                                <div className="form-field" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: '0.8rem', color: '#d97706' }}>Thuế GTGT (8%)</label>
                                  <input type="text" className="form-input" value={formatInputCurrency(Math.round(Number(formData.electricFee) * 0.08))} readOnly style={{ background: '#fefce8', color: '#d97706', cursor: 'default', fontWeight: 600 }} />
                                </div>
                                <div className="form-field" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: '0.8rem', color: '#047857' }}>Tổng tiền điện</label>
                                  <input type="text" className="form-input" value={formatInputCurrency(Math.round(Number(formData.electricFee) * 1.08))} readOnly style={{ background: '#d1fae5', color: '#047857', cursor: 'default', fontWeight: 600 }} />
                                </div>
                              </div>
                            )}

                            {modalMode === 'create' && formData.apartmentId && (
                              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 500 }}>
                                {evnMockInfo.loading && <span style={{ color: '#d97706' }}>Đang tải chỉ số điện...</span>}
                                {!evnMockInfo.loading && evnMockInfo.error && <span style={{ color: '#dc2626' }}>{evnMockInfo.error}</span>}
                                {!evnMockInfo.loading && evnMockInfo.data && <span style={{ color: '#059669' }}>✓ {evnMockInfo.data.sourceLabel || 'Mock API'}: {evnMockInfo.data.kwhConsumed || 0} kWh</span>}
                              </div>
                            )}
                          </>
                        );
                      })()}
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* 4. Water Consumption */}
                {isInvoiceStep('water') && (
                <div className="form-field form-field--full" style={{ padding: 0, background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: 0, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', padding: '0.85rem 1.25rem', borderBottom: '1px solid #7dd3fc', fontWeight: 600, color: '#0369a1', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M12 2.5S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.5-7-12.5Z" /></svg>
                    Dịch vụ Tiền nước
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ marginBottom: '1rem', padding: '1.25rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 600, color: '#0ea5e9', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
                        Tiền nước
                      </div>
                      {modalMode === 'create' && (
                        <div className="meter-source-panel meter-source-panel--inline">
                          <div className="meter-source-panel__head">
                            <div>
                              <strong>Nguồn chỉ số nước</strong>
                              <span>Chọn dữ liệu nước dùng để chốt kỳ hóa đơn này.</span>
                            </div>
                            <em>{waterMeterSource === 'MOCK_API' ? 'Đang dùng mock API' : 'Đang dùng ghi thủ công'}</em>
                          </div>
                          <div className="meter-source-options">
                            {[
                              { value: 'MOCK_API', label: 'Mock API', desc: 'Tự lấy chỉ số nước từ Công ty nước mock', icon: Icons.refresh },
                              { value: 'MANUAL', label: 'Ghi thủ công', desc: 'Dùng chỉ số nước Technician đã ghi', icon: Icons.clipboard },
                            ].map((option) => (
                              <button key={option.value} type="button" className={`meter-source-option ${waterMeterSource === option.value ? 'meter-source-option--active' : ''}`} onClick={() => handleWaterMeterSourceSelect(option.value)}>
                                <span className="meter-source-option__icon">{option.icon}</span>
                                <span><strong>{option.label}</strong><small>{option.desc}</small></span>
                                <span className="meter-source-option__radio" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {(() => {
                        const isWaterManualMissing = waterMeterSource === 'MANUAL' && waterMockInfo.error === 'Kĩ thuật viên chưa ghi lại dữ liệu nước';
                        return (
                          <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                              <div className="form-field" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '0.8rem' }}>Chỉ số nước đầu kỳ</label>
                                <input type="text" className="form-input" value={formatInputCurrency(formData.waterPreviousReading)} readOnly style={{ background: '#f1f5f9', cursor: 'default' }} />
                              </div>
                              {!isWaterManualMissing && (
                                <div className="form-field" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Chỉ số nước cuối kỳ</label>
                                  <input type="text" className="form-input" value={formatInputCurrency(formData.waterCurrentReading)} onChange={(e) => handleFormChange('waterCurrentReading', parseInputCurrency(e.target.value))} placeholder="Nhập chỉ số mới..." />
                                </div>
                              )}
                            </div>

                            {!isWaterManualMissing && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-field" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Nước tiêu thụ (m³) {activeFee && activeFee.waterFee > 0 && <span style={{ color: '#e74c3c', fontSize: '0.8rem', fontWeight: 600 }}>{shortMoney(activeFee.waterFee)}/m³</span>}</label>
                                  <input type="text" className="form-input" value={formatInputCurrency(formData.waterQuantity)} onChange={(e) => handleFormChange('waterQuantity', parseInputCurrency(e.target.value))} placeholder="Nhập số khối nước..." />
                                </div>
                                <div className="form-field" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ color: '#64748b' }}>Tiền nước chưa thuế/phí</label>
                                  <input type="text" className="form-input" value={formatInputCurrency(formData.waterFee)} readOnly placeholder="Tự động tính" style={{ background: '#f1f5f9', color: '#64748b', cursor: 'default', fontWeight: 600 }} />
                                </div>
                              </div>
                            )}

                            {Number(formData.waterFee) > 0 && !isWaterManualMissing && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem', paddingBottom: '0.5rem', alignItems: 'end' }}>
                                <div className="form-field" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: '0.8rem', color: '#d97706' }}>Thuế GTGT + phí BVMT (15%)</label>
                                  <input type="text" className="form-input" value={formatInputCurrency(Math.round(Number(formData.waterFee) * 0.15))} readOnly style={{ background: '#fefce8', color: '#d97706', cursor: 'default', fontWeight: 600 }} />
                                </div>
                                <div className="form-field" style={{ marginBottom: 0 }}>
                                  <label className="form-label" style={{ fontSize: '0.8rem', color: '#047857' }}>Tổng tiền nước</label>
                                  <input type="text" className="form-input" value={formatInputCurrency(Math.round(Number(formData.waterFee) * 1.15))} readOnly style={{ background: '#d1fae5', color: '#047857', cursor: 'default', fontWeight: 600 }} />
                                </div>
                              </div>
                            )}

                            {modalMode === 'create' && formData.apartmentId && (
                              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 500 }}>
                                {waterMockInfo.loading && <span style={{ color: '#d97706' }}>Đang tải chỉ số nước...</span>}
                                {!waterMockInfo.loading && waterMockInfo.error && <span style={{ color: '#dc2626' }}>{waterMockInfo.error}</span>}
                                {!waterMockInfo.loading && waterMockInfo.data && <span style={{ color: '#059669' }}>✓ {waterMockInfo.data.sourceLabel || 'Mock API'}: {waterMockInfo.data.cubicMeterConsumed || 0} m³</span>}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                )}

                {/* 4. Other Fees */}
                {isInvoiceStep('fees') && (
                <div className="form-field form-field--full" style={{ padding: 0, background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ background: 'linear-gradient(135deg, #fefce8, #fef9c3)', padding: '0.85rem 1.25rem', borderBottom: '1px solid #fde68a', fontWeight: 600, color: '#92400e', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px 8px 0 0' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    Các loại phí khác
                  </div>
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="form-label">Phí quản lý (VNĐ)</label>
                        <input type="text" className="form-input" value={formatInputCurrency(formData.managementFee)}
                          onChange={(e) => handleFormChange('managementFee', parseInputCurrency(e.target.value))}
                          placeholder={activeFee ? 'Từ phí dịch vụ' : '0'} />
                      </div>
                    </div>

                    <div className="invoice-extra-fees">
                      <div className="invoice-extra-fees__head">
                        <div>
                          <strong>Phí phát sinh</strong>
                          <span>Thêm từng khoản phí kèm mô tả và số tiền.</span>
                        </div>
                        <div className="invoice-extra-fees__actions">
                          <b>{formatInputCurrency(invoiceOtherFeeSummary.total)}đ</b>
                          <button type="button" className="invoice-extra-fees__add" onClick={handleAddOtherFeeItem}>
                            {Icons.plus}
                            <span>Thêm phí</span>
                          </button>
                        </div>
                      </div>
                      <div className="invoice-extra-fees__list">
                        {invoiceOtherFeeItems.map((item, index) => {
                          const isOnlyBlankRow = invoiceOtherFeeItems.length === 1 && !item.description && !item.amount;
                          return (
                            <div className="invoice-extra-fees__row" key={item.id}>
                              <div className="form-field invoice-extra-fees__desc" style={{ marginBottom: 0 }}>
                                <label className="form-label">Mô tả khoản phí {index + 1}</label>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={item.description || ''}
                                  onChange={(e) => handleOtherFeeItemChange(item.id, 'description', e.target.value)}
                                  placeholder="VD: Phí sửa vòi nước..."
                                />
                              </div>
                              <div className="form-field invoice-extra-fees__amount" style={{ marginBottom: 0 }}>
                                <label className="form-label">Số tiền (VNĐ)</label>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={formatInputCurrency(item.amount)}
                                  onChange={(e) => handleOtherFeeItemChange(item.id, 'amount', e.target.value)}
                                  placeholder="0"
                                />
                              </div>
                              <button
                                type="button"
                                className="invoice-extra-fees__remove"
                                disabled={isOnlyBlankRow}
                                onClick={() => handleRemoveOtherFeeItem(item.id)}
                                title="Xóa khoản phí"
                              >
                                {Icons.trash}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Row 3: Phí gửi xe */}
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          Phí gửi xe (VNĐ)
                          {parkingFeeInfo.loading && <span style={{ fontSize: '0.75rem', color: '#6366f1' }}>⏳ Đang tính...</span>}
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>{formatInputCurrency(formData.parkingFee || 0)}đ</span>
                      </div>
                      {parkingFeeInfo.vehicles && parkingFeeInfo.vehicles.counts && (() => {
                        const { counts, rates } = parkingFeeInfo.vehicles;
                        const details = [];
                        if (counts.MOTORBIKE > 0) details.push({ icon: '🏍️', label: 'Xe máy', count: counts.MOTORBIKE, rate: rates.motorbikeFee });
                        if (counts.CAR > 0) details.push({ icon: '🚗', label: 'Ô tô', count: counts.CAR, rate: rates.carFee });
                        if (counts.BICYCLE > 0) details.push({ icon: '🚲', label: 'Xe đạp', count: counts.BICYCLE, rate: rates.bicycleFee });
                        if (counts.ELECTRIC_BIKE > 0) details.push({ icon: '🛵', label: 'Xe điện', count: counts.ELECTRIC_BIKE, rate: rates.electricMotorbikeFee });
                        if (details.length === 0) return <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>Căn hộ chưa đăng ký xe</div>;
                        return (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                            {details.map((d, i) => (
                              <span key={i}>{i > 0 ? ' · ' : ''}{d.icon} {d.label} ×{d.count} ({formatInputCurrency(d.count * d.rate)}đ)</span>
                            ))}
                          </div>
                        );
                      })()}
                      {parkingFeeInfo.error && <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 4 }}>⚠ {parkingFeeInfo.error}</div>}
                    </div>
                  </div>
                </div>
                )}

                {isInvoiceStep('review') && (
                  <div className="form-field form-field--full invoice-review">
                    <div className="invoice-review__head">
                      <div>
                        <strong>Xác nhận hóa đơn</strong>
                        <span>Kiểm tra nhanh các khoản chính trước khi lưu.</span>
                      </div>
                      <div className="invoice-review__total">{money(invoiceTotalPreview.total)}</div>
                    </div>
                    <div className="invoice-review__body">
                      <div className="invoice-review__summary">
                        <div className="invoice-review__summary-card invoice-review__summary-card--home">
                          <span>Căn hộ</span>
                          <strong>{getApartmentLabel(apartments.find((apt) => String(apt.id) === String(formData.apartmentId)) || selectedInvoice?.apartment) || 'Chưa chọn'}</strong>
                        </div>
                        <div className="invoice-review__summary-card invoice-review__summary-card--date">
                          <span>Kỳ / hạn thanh toán</span>
                          <strong>{formatBillingPeriodDisplay(billingPeriodFromDate(formData.dueDate))} · {formatDate(formData.dueDate)}</strong>
                        </div>
                        <div className="invoice-review__summary-card invoice-review__summary-card--source">
                          <span>Nguồn chỉ số</span>
                          <strong>Điện: {electricMeterSource === 'MOCK_API' ? 'Mock API' : 'Ghi thủ công'} · Nước: {waterMeterSource === 'MOCK_API' ? 'Mock API' : 'Ghi thủ công'}</strong>
                        </div>
                      </div>

                      <div className="invoice-review__columns">
                        <section className="invoice-review__section invoice-review__section--usage">
                          <div className="invoice-review__section-head">
                            <span>Tiêu thụ điện nước</span>
                            <strong>{money(invoiceTotalPreview.electricAfterTax + invoiceTotalPreview.waterAfterTax)}</strong>
                          </div>
                          <div className="invoice-review__line invoice-review__line--electric">
                            <div>
                              <span>Điện</span>
                              <strong>{formatInputCurrency(formData.electricQuantity || 0)} kWh</strong>
                              <small>Chỉ số {formatInputCurrency(formData.electricPreviousReading || 0)} → {formatInputCurrency(formData.electricCurrentReading || 0)} kWh</small>
                              <small>{activeFee?.useTieredElectric ? 'Biểu giá lũy tiến, VAT 8%' : `Đơn giá ${shortMoney(activeFee?.electricFee || 0)}/kWh, VAT 8%`}</small>
                            </div>
                            <b>{money(invoiceTotalPreview.electricAfterTax)}</b>
                          </div>
                          <div className="invoice-review__line invoice-review__line--water">
                            <div>
                              <span>Nước</span>
                              <strong>{formatInputCurrency(formData.waterQuantity || 0)} m3</strong>
                              <small>Chỉ số {formatInputCurrency(formData.waterPreviousReading || 0)} → {formatInputCurrency(formData.waterCurrentReading || 0)} m3</small>
                              <small>Đơn giá {shortMoney(activeFee?.waterFee || 0)}/m3, thuế/phí 15%</small>
                            </div>
                            <b>{money(invoiceTotalPreview.waterAfterTax)}</b>
                          </div>
                        </section>

                        <section className="invoice-review__section invoice-review__section--fees">
                          <div className="invoice-review__section-head">
                            <span>Phí dịch vụ</span>
                            <strong>{money((Number(formData.managementFee) || 0) + (Number(formData.parkingFee) || 0) + invoiceOtherFeeSummary.total)}</strong>
                          </div>
                          <div className="invoice-review__fee-list">
                            <div className="invoice-review__fee-row invoice-review__fee-row--management">
                              <span>Phí quản lý</span>
                              <strong>{money(Number(formData.managementFee) || 0)}</strong>
                              <small>Phí dịch vụ cố định từ bảng phí.</small>
                            </div>
                            <div className="invoice-review__fee-row invoice-review__fee-row--parking">
                              <span>Phí gửi xe</span>
                              <strong>{money(Number(formData.parkingFee) || 0)}</strong>
                              <small>
                                {parkingFeeInfo.vehicles?.counts
                                  ? `Xe máy ${parkingFeeInfo.vehicles.counts.MOTORBIKE || 0}, ô tô ${parkingFeeInfo.vehicles.counts.CAR || 0}, xe đạp ${parkingFeeInfo.vehicles.counts.BICYCLE || 0}, xe điện ${parkingFeeInfo.vehicles.counts.ELECTRIC_BIKE || 0}.`
                                  : 'Theo danh sách xe đã đăng ký của căn hộ.'}
                              </small>
                            </div>
                            <div className="invoice-review__fee-row invoice-review__fee-row--other">
                              <span>Phí phát sinh</span>
                              <strong>{money(invoiceOtherFeeSummary.total)}</strong>
                              <small>
                                {invoiceOtherFeeSummary.items.length
                                  ? invoiceOtherFeeSummary.items.map((item) => `${item.description || 'Phí phát sinh'} (${formatInputCurrency(item.amount)}đ)`).join(' · ')
                                  : 'Không có mô tả phí phát sinh.'}
                              </small>
                            </div>
                          </div>
                        </section>
                      </div>

                      <div className="invoice-review__note">
                        <span>Nguồn chỉ số quyết định chỉ số đầu kỳ, cuối kỳ và sản lượng tiêu thụ dùng để tính tiền điện nước. Hóa đơn có hạn thanh toán {formatDate(formData.dueDate)}.</span>
                        <strong>{money(invoiceTotalPreview.total)}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal__footer invoice-wizard__footer">
                <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>Hủy</button>
                <button type="button" className="btn btn--secondary" disabled={isInvoiceFirstStep} onClick={() => goToInvoiceStep(invoiceStep - 1)}>Quay lại</button>
                {!isInvoiceLastStep ? (
                  <button type="button" className="btn btn--primary" onClick={handleInvoiceNextStep}>Tiếp tục</button>
                ) : (
                  <button type="submit" className="btn btn--primary" disabled={submitting}>
                    {submitting ? 'Đang xử lý...' : modalMode === 'create' ? 'Tạo hóa đơn' : 'Cập nhật'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      ), document.body)}

            {/* ═══════════ VIEW MODAL ═══════════ */}
      {modalOpen && modalMode === 'view' && selectedInvoice && createPortal((
        <div className="modal-overlay invoice-view-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal invoice-view-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '960px', width: '96%', maxHeight: '92vh', background: '#f8fafc', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '1rem 3.75rem 1rem 1.5rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', flexShrink: 0, gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.25rem', fontWeight: 600 }}>Hóa đơn dịch vụ</div>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700 }}>{selectedInvoice.invoiceNumber || '—'}</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                <button className="modal__close" onClick={() => setModalOpen(false)} style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: '0.4rem', position: 'absolute', top: '1rem', right: '1rem' }}>{Icons.close}</button>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '1.5rem', maxWidth: 360 }}>
                  <span style={{
                    padding: '0.34rem 0.65rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600,
                    color: statusColor[selectedInvoice.invoiceStatus]?.color || '#6b7280',
                    backgroundColor: statusColor[selectedInvoice.invoiceStatus]?.bg || '#f3f4f6',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {statusLabel[selectedInvoice.invoiceStatus] || selectedInvoice.invoiceStatus}
                  </span>
                  {getPendingCashPayment(selectedInvoice) && (
                    <span style={{ padding: '0.34rem 0.65rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, color: '#92400e', background: '#fef3c7' }}>
                      Chờ xác nhận tiền mặt
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="modal__body" style={{ padding: '1.1rem 1.5rem', background: '#fff', overflowY: 'auto', flex: '1 1 auto' }}>
              
              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.35px', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: 16, height: 16}}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    Thông tin căn hộ
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.12rem' }}>Căn hộ / Tầng / Tòa</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{getApartmentLabel(selectedInvoice.apartment)}</div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.35px', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: 16, height: 16}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    Chi tiết thời gian
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Ngày tạo:</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#1e293b', textAlign: 'right' }}>{formatDate(selectedInvoice.createdAt || selectedInvoice.createdDate)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Người lập:</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#1e293b', textAlign: 'right' }}>{selectedInvoice.creator?.fullName || 'Hệ thống'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>Hạn thanh toán:</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', textAlign: 'right' }}>{formatDate(selectedInvoice.dueDate)}</span>
                    </div>
                  </div>
                </div>

                {(() => {
                  const pendingCashPayment = getPendingCashPayment(selectedInvoice);
                  const paidAmount = getSuccessfulPaidAmount(selectedInvoice);
                  const remainingAmount = Math.max((Number(selectedInvoice.totalAmount) || 0) - paidAmount, 0);
                  const ps = getPaymentSummaryStatus(selectedInvoice);
                  return (
                    <div style={{ background: pendingCashPayment ? '#fffbeb' : '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: pendingCashPayment ? '1px solid #fde68a' : '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.35px', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                        Tình trạng thu tiền
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Trạng thái:</span>
                          <span style={{ fontSize: '0.73rem', fontWeight: 700, color: ps.color, background: ps.bg, padding: '0.18rem 0.4rem', borderRadius: 6, textAlign: 'right' }}>{ps.label}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Đã thu:</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857' }}>{money(paidAmount)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Còn phải thu:</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: remainingAmount > 0 ? '#dc2626' : '#047857' }}>{money(remainingAmount)}</span>
                        </div>
                        {pendingCashPayment && (
                          <div style={{ borderTop: '1px dashed #fbbf24', paddingTop: '0.55rem', marginTop: '0.05rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div style={{ fontSize: '0.74rem', lineHeight: 1.45, color: '#92400e' }}>Cư dân đề xuất nộp tiền mặt: <strong>{pendingCashPayment.payerName || '—'}</strong></div>
                            <button
                              className="btn btn--sm"
                              disabled={paySubmitting}
                              onClick={() => handleConfirmCashPayment(pendingCashPayment.paymentId)}
                              style={{ background: '#16a34a', color: '#fff', border: 'none', alignSelf: 'flex-start', fontSize: '0.74rem', padding: '0.4rem 0.65rem' }}
                            >
                              Xác nhận đã thu
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {(selectedInvoice.electricQuantity != null || selectedInvoice.waterQuantity != null) && (
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden', marginBottom: '1.25rem', background: '#f8fafc' }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                    Chỉ số điện nước
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.85rem' }}>
                    {selectedInvoice.electricQuantity != null && (
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>Điện</div>
                        <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                          {formatInputCurrency(selectedInvoice.electricPreviousReading || 0)} {' -> '} {formatInputCurrency(selectedInvoice.electricCurrentReading || 0)} kWh
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Tiêu thụ {formatInputCurrency(selectedInvoice.electricQuantity || 0)} kWh</div>
                      </div>
                    )}
                    {selectedInvoice.waterQuantity != null && (
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>Nước</div>
                        <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                          {formatInputCurrency(selectedInvoice.waterPreviousReading || 0)} {' -> '} {formatInputCurrency(selectedInvoice.waterCurrentReading || 0)} m3
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Tiêu thụ {formatInputCurrency(selectedInvoice.waterQuantity || 0)} m3</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fee breakdown */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.76rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.35px' }}>Hạng mục phí</th>
                      <th style={{ padding: '0.75rem 1rem', fontSize: '0.76rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.35px', textAlign: 'right' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Number(selectedInvoice.electricFee) > 0 && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><span style={{background: '#dbeafe', color: '#1d4ed8', padding: '0.24rem', borderRadius: '6px', display: 'inline-flex'}}><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg></span> Tiền điện</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.86rem', fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>{money(selectedInvoice.electricFee)}</td>
                      </tr>
                    )}
                    {Number(selectedInvoice.waterFee) > 0 && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><span style={{background: '#e0f2fe', color: '#0369a1', padding: '0.24rem', borderRadius: '6px', display: 'inline-flex'}}><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg></span> Tiền nước</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.86rem', fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>{money(selectedInvoice.waterFee)}</td>
                      </tr>
                    )}
                    {Number(selectedInvoice.managementFee) > 0 && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><span style={{background: '#f3e8ff', color: '#7e22ce', padding: '0.24rem', borderRadius: '6px', display: 'inline-flex'}}><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg></span> Phí quản lý</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.86rem', fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>{money(selectedInvoice.managementFee)}</td>
                      </tr>
                    )}
                    {Number(selectedInvoice.parkingFee) > 0 && (
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><span style={{background: '#dcfce7', color: '#15803d', padding: '0.24rem', borderRadius: '6px', display: 'inline-flex'}}><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg></span> Phí gửi xe</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.86rem', fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>{money(selectedInvoice.parkingFee)}</td>
                      </tr>
                    )}
                    {Number(selectedInvoice.otherFee) > 0 && (
                      <tr>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{background: '#ffedd5', color: '#c2410c', padding: '0.24rem', borderRadius: '6px', display: 'inline-flex'}}><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg></span> Phí khác
                          {selectedInvoice.descriptionOtherFee && <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', marginLeft: '0.15rem' }}>({selectedInvoice.descriptionOtherFee})</span>}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.86rem', fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>{money(selectedInvoice.otherFee)}</td>
                      </tr>
                    )}
                    {Number(selectedInvoice.totalAmount) === 0 && (
                      <tr>
                        <td colSpan="2" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Không có khoản phí nào</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'linear-gradient(to right, #fef2f2, #fee2e2)' }}>
                      <td style={{ padding: '0.9rem 1rem', fontSize: '0.88rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>Tổng cộng</td>
                      <td style={{ padding: '0.9rem 1rem', fontSize: '1.05rem', fontWeight: 800, color: '#dc2626', textAlign: 'right' }}>{money(selectedInvoice.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment history */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.84rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                    Lịch sử thanh toán
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {selectedInvoice.payments.map((p) => {
                      const psc = paymentStatusColor[p.paymentStatus] || { color: '#6b7280', bg: '#f3f4f6' };
                      return (
                        <div key={p.paymentId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: p.paymentMethod === 'MOMO' ? '#fce4ec' : p.paymentMethod === 'VNPAY' ? '#dbeafe' : '#dcfce7', color: p.paymentMethod === 'MOMO' ? '#ae2070' : p.paymentMethod === 'VNPAY' ? '#2563eb' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                              {p.paymentMethod === 'MOMO' ? '📱' : p.paymentMethod === 'VNPAY' ? '🏦' : '💵'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.82rem', marginBottom: '0.12rem' }}>{money(p.amount)} <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 400, marginLeft: '0.2rem' }}>qua {p.paymentMethod}</span></div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                {formatDateTime(p.paymentDateTime)} • {p.payerName || 'Khách hàng'}
                                {p.payerPhoneNumber ? ` • SĐT: ${p.payerPhoneNumber}` : ''}
                                {' '}• GD: {p.transactionCode || '—'}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: psc.color, background: psc.bg, padding: '0.22rem 0.45rem', borderRadius: '4px' }}>
                              {paymentStatusLabel[p.paymentStatus] || p.paymentStatus}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="modal__footer" style={{ padding: '0.85rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', flexShrink: 0 }}>
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
                    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)'
                  }}
                >
                  <span className="btn__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg></span>
                  Thanh toán
                </button>
              )}
              <button className="btn btn--primary" onClick={() => { setModalOpen(false); setTimeout(() => openEditModal(selectedInvoice), 100); }} style={{ boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)' }}>
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

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
                  { value: 'VNPAY', label: 'VNPay', icon: '🏦', color: '#2563eb', bg: '#dbeafe' },
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

              {payMethod === 'VNPAY' && (
                <div style={{ padding: '0.75rem 1rem', background: '#dbeafe', borderRadius: 8, fontSize: '0.85rem', color: '#1d4ed8' }}>
                  Bạn sẽ được chuyển sang cổng VNPay để thanh toán trực tuyến.
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
                style={payMethod === 'MOMO' ? { background: 'linear-gradient(135deg, #ae2070, #880e4f)' } : payMethod === 'VNPAY' ? { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' } : {}}>
                {paySubmitting ? 'Đang xử lý...' : payMethod === 'MOMO' ? '📱 Thanh toán MoMo' : payMethod === 'VNPAY' ? '🏦 Thanh toán VNPay' : payMethod === 'CASH' ? '💵 Xác nhận tiền mặt' : 'Chọn phương thức'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ DELETE MODAL ═══════════ */}
      {deleteModalOpen && deleteTarget && createPortal((
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
      ), document.body)}

      {/* ═══════════ TABLE FEE DELETE MODAL ═══════════ */}
      {feeDeleteModalOpen && feeDeleteTargetIdx !== null && createPortal((
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
      ), document.body)}

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
                <div className="form-field form-field--full" style={{ padding: 0, background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1rem', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginTop: '0.5rem' }}>
                  <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', padding: '0.85rem 1.25rem', borderBottom: '1px solid #bfdbfe', fontWeight: 600, color: '#1e3a8a', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><circle cx="12" cy="12" r="10"/><path d="M16 12H8"/><path d="M12 8l-4 4 4 4"/></svg>
                    Cấu hình phí gửi xe
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                        <thead style={{ background: '#f1f5f9' }}>
                          <tr>
                            <th style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', width: '50%' }}>Loại phương tiện</th>
                            <th style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Đơn giá (VNĐ/tháng)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '0.5rem 0.75rem', color: '#1e293b' }}>Xe đạp</td>
                            <td style={{ padding: '0.4rem 0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                  <input className="form-input" style={{ padding: '0.25rem', minHeight: 'unset', textAlign: 'right', width: '120px' }} value={formatInputCurrency(tableFeeForm.bicycleParkingFee)} onChange={e => setTableFeeForm(p => ({ ...p, bicycleParkingFee: parseInputCurrency(e.target.value) }))} type="text" placeholder="0" />
                                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>đ</span>
                              </div>
                            </td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '0.5rem 0.75rem', color: '#1e293b' }}>Xe máy điện</td>
                            <td style={{ padding: '0.4rem 0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                  <input className="form-input" style={{ padding: '0.25rem', minHeight: 'unset', textAlign: 'right', width: '120px' }} value={formatInputCurrency(tableFeeForm.electricMotorbikeParkingFee)} onChange={e => setTableFeeForm(p => ({ ...p, electricMotorbikeParkingFee: parseInputCurrency(e.target.value) }))} type="text" placeholder="0" />
                                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>đ</span>
                              </div>
                            </td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '0.5rem 0.75rem', color: '#1e293b' }}>Xe máy</td>
                            <td style={{ padding: '0.4rem 0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                  <input className="form-input" style={{ padding: '0.25rem', minHeight: 'unset', textAlign: 'right', width: '120px' }} value={formatInputCurrency(tableFeeForm.motorbikeParkingFee)} onChange={e => setTableFeeForm(p => ({ ...p, motorbikeParkingFee: parseInputCurrency(e.target.value) }))} type="text" placeholder="0" />
                                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>đ</span>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '0.5rem 0.75rem', color: '#1e293b' }}>Ô tô</td>
                            <td style={{ padding: '0.4rem 0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                  <input className="form-input" style={{ padding: '0.25rem', minHeight: 'unset', textAlign: 'right', width: '120px' }} value={formatInputCurrency(tableFeeForm.carParkingFee)} onChange={e => setTableFeeForm(p => ({ ...p, carParkingFee: parseInputCurrency(e.target.value) }))} type="text" placeholder="0" />
                                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>đ</span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
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
      {batchModalOpen && createPortal((
        <div className="modal-overlay invoice-batch-overlay" onClick={() => setBatchModalOpen(false)}>
          <div className="modal invoice-batch-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <div>
                <h3 className="modal__title">Tạo hóa đơn hàng loạt</h3>
                <p className="invoice-batch-modal__desc">Thiết lập kỳ thanh toán, bảng phí và chọn các căn hộ cần phát hành hóa đơn.</p>
              </div>
              <button className="modal__close" onClick={() => setBatchModalOpen(false)}>{Icons.close}</button>
            </div>
            <div className="modal__body invoice-batch-modal__body">
              <div className="invoice-batch-layout">
                <section className="invoice-batch-panel invoice-batch-panel--config">
                  <div className="invoice-batch-section-head">
                    <div>
                      <span>Cấu hình</span>
                      <strong>Kỳ thanh toán & bảng phí</strong>
                    </div>
                  </div>

                  <div className="invoice-batch-top-grid">
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
                      <div className="invoice-batch-count">
                        <strong>{batchSelectedApts.length}</strong>
                        <span>/ {eligibleBatchApartments.length} căn hộ</span>
                        {batchSelectedExistingCount > 0 && (
                          <small className="invoice-batch-skip-note" title={`${batchSelectedExistingCount} căn đã có hóa đơn sẽ được bỏ qua`}>
                            {batchSelectedExistingCount} bỏ qua
                          </small>
                        )}
                      </div>
                    </div>
                    <div className="form-field invoice-batch-field--full">
                      <label className="form-label">Bảng phí áp dụng <span className="form-required">*</span></label>
                      <DropdownSelect
                        value={batchFeeIndex}
                        onChange={(value) => setBatchFeeIndex(Number(value))}
                        options={tableFees.map((fee, index) => ({
                          value: index,
                          label: fee.title || `Bảng phí #${fee.id}`,
                        }))}
                      />
                    </div>
                  </div>

                  <div className="invoice-batch-fee-card">
                    <div className="invoice-batch-fee-card__head">
                      <div>
                        <strong>Chỉnh bảng phí cho lần tạo này</strong>
                        <span>Giá trị tại đây chỉ áp dụng cho đợt tạo hóa đơn hiện tại.</span>
                      </div>
                      <label className="invoice-batch-toggle">
                        <input
                          type="checkbox"
                          checked={!!batchFeeDraft?.useTieredElectric}
                          onChange={(e) => setBatchFeeDraft(p => ({ ...p, useTieredElectric: e.target.checked }))}
                        />
                        Điện lũy tiến
                      </label>
                    </div>

                    <div className="invoice-batch-fee-grid">
                      {!batchFeeDraft?.useTieredElectric && (
                        <div className="form-field">
                          <label className="form-label">Đơn giá điện (VNĐ/kWh)</label>
                          <input className="form-input" value={formatInputCurrency(batchFeeDraft?.electricFee)}
                            onChange={(e) => setBatchFeeDraft(p => ({ ...p, electricFee: parseInputCurrency(e.target.value) }))} placeholder="0" />
                        </div>
                      )}
                      <div className="form-field">
                        <label className="form-label">Đơn giá nước (VNĐ/m3)</label>
                        <input className="form-input" value={formatInputCurrency(batchFeeDraft?.waterFee)}
                          onChange={(e) => setBatchFeeDraft(p => ({ ...p, waterFee: parseInputCurrency(e.target.value) }))} placeholder="0" />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Phí quản lý (VNĐ)</label>
                        <input className="form-input" value={formatInputCurrency(batchFeeDraft?.managementFee)}
                          onChange={(e) => setBatchFeeDraft(p => ({ ...p, managementFee: parseInputCurrency(e.target.value) }))} placeholder="0" />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Xe máy (VNĐ/xe)</label>
                        <input className="form-input" value={formatInputCurrency(batchFeeDraft?.motorbikeParkingFee)}
                          onChange={(e) => setBatchFeeDraft(p => ({ ...p, motorbikeParkingFee: parseInputCurrency(e.target.value) }))} placeholder="0" />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Ô tô (VNĐ/xe)</label>
                        <input className="form-input" value={formatInputCurrency(batchFeeDraft?.carParkingFee)}
                          onChange={(e) => setBatchFeeDraft(p => ({ ...p, carParkingFee: parseInputCurrency(e.target.value) }))} placeholder="0" />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Xe đạp (VNĐ/xe)</label>
                        <input className="form-input" value={formatInputCurrency(batchFeeDraft?.bicycleParkingFee)}
                          onChange={(e) => setBatchFeeDraft(p => ({ ...p, bicycleParkingFee: parseInputCurrency(e.target.value) }))} placeholder="0" />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Xe máy điện (VNĐ/xe)</label>
                        <input className="form-input" value={formatInputCurrency(batchFeeDraft?.electricMotorbikeParkingFee)}
                          onChange={(e) => setBatchFeeDraft(p => ({ ...p, electricMotorbikeParkingFee: parseInputCurrency(e.target.value) }))} placeholder="0" />
                      </div>
                      <div className="invoice-extra-fees invoice-batch-extra-fees">
                        <div className="invoice-extra-fees__head">
                          <div>
                            <strong>Phí phát sinh</strong>
                            <span>Thêm từng khoản phí áp dụng cho toàn bộ hóa đơn được tạo.</span>
                          </div>
                          <div className="invoice-extra-fees__actions">
                            <b>{formatInputCurrency(batchOtherFeeSummary.total)}đ</b>
                            <button type="button" className="invoice-extra-fees__add" onClick={handleAddBatchOtherFeeItem}>
                              {Icons.plus}
                              <span>Thêm phí</span>
                            </button>
                          </div>
                        </div>
                        <div className="invoice-extra-fees__list">
                          {batchOtherFeeItems.map((item, index) => {
                            const isOnlyBlankRow = batchOtherFeeItems.length === 1 && !item.description && !item.amount;
                            return (
                              <div className="invoice-extra-fees__row" key={item.id}>
                                <div className="form-field invoice-extra-fees__desc" style={{ marginBottom: 0 }}>
                                  <label className="form-label">Mô tả khoản phí {index + 1}</label>
                                  <input
                                    className="form-input"
                                    value={item.description || ''}
                                    onChange={(e) => handleBatchOtherFeeItemChange(item.id, 'description', e.target.value)}
                                    placeholder="VD: Phí sửa chữa phát sinh..."
                                  />
                                </div>
                                <div className="form-field invoice-extra-fees__amount" style={{ marginBottom: 0 }}>
                                  <label className="form-label">Số tiền (VNĐ)</label>
                                  <input
                                    className="form-input"
                                    value={formatInputCurrency(item.amount)}
                                    onChange={(e) => handleBatchOtherFeeItemChange(item.id, 'amount', e.target.value)}
                                    placeholder="0"
                                  />
                                </div>
                                <button
                                  type="button"
                                  className="invoice-extra-fees__remove"
                                  disabled={isOnlyBlankRow}
                                  onClick={() => handleRemoveBatchOtherFeeItem(item.id)}
                                  title="Xóa khoản phí"
                                >
                                  {Icons.trash}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="invoice-batch-panel invoice-batch-panel--apartments">
                  <div className="invoice-batch-section-head invoice-batch-section-head--apartments">
                    <div>
                      <span>Phạm vi phát hành</span>
                      <strong>Chọn căn hộ</strong>
                    </div>
                    <em>
                      {filteredBatchApartments.length} căn hộ phù hợp
                      {batchInvoicePeriodLabel && ` · ${batchExistingInvoiceCount} đã có hóa đơn kỳ ${batchInvoicePeriodLabel}`}
                      {periodInvoicesLoading && ' · Đang kiểm tra'}
                    </em>
                  </div>

                  <div className="invoice-batch-apartment-toolbar">
                    <div className="invoice-batch-filter-row">
                      <DropdownSelect
                        value={batchFilterBlock}
                        onChange={(value) => {
                          setBatchFilterBlock(value);
                          setBatchFilterFloor('');
                        }}
                        options={[
                          { value: '', label: 'Tất cả tòa' },
                          ...[...new Set(apartments.map((apartment) => apartment.block).filter(Boolean))]
                            .sort()
                            .map((block) => ({ value: block, label: `Block ${block}` })),
                        ]}
                      />
                      <DropdownSelect
                        value={batchFilterFloor}
                        onChange={(value) => setBatchFilterFloor(value)}
                        options={[
                          { value: '', label: 'Tất cả tầng' },
                          ...[...new Set(apartments
                            .filter((apartment) => !batchFilterBlock || apartment.block === batchFilterBlock)
                            .map((apartment) => apartment.floor)
                            .filter((floor) => floor != null))]
                            .sort((a, b) => a - b)
                            .map((floor) => ({ value: floor, label: `Tầng ${floor}` })),
                        ]}
                      />
                      <div className="invoice-batch-select-actions" aria-label="Chọn nhanh căn hộ">
                        <button type="button" title="Chọn tất cả căn hộ đang lọc" onClick={() => {
                          setBatchSelectedApts(prev => [...new Set([...prev, ...filteredBatchApartments.map(a => a.id)])]);
                        }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          <span>Chọn</span>
                        </button>
                        <button type="button" title="Bỏ chọn các căn hộ đang lọc" onClick={() => {
                          const filteredIds = new Set(filteredBatchApartments.map(a => a.id));
                          setBatchSelectedApts(prev => prev.filter(id => !filteredIds.has(id)));
                        }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                          <span>Bỏ</span>
                        </button>
                      </div>
                    </div>
                    <div className="invoice-batch-status-filter" aria-label="Lọc theo trạng thái hóa đơn">
                      {[
                        { value: 'ALL', label: 'Tất cả', count: scopedBatchApartments.length },
                        { value: 'HAS_INVOICE', label: 'Đã có hóa đơn', count: batchScopedExistingInvoiceCount },
                        { value: 'NO_INVOICE', label: 'Chưa có hóa đơn', count: batchScopedNoInvoiceCount },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={batchInvoiceFilter === option.value ? 'invoice-batch-status-filter__btn invoice-batch-status-filter__btn--active' : 'invoice-batch-status-filter__btn'}
                          onClick={() => setBatchInvoiceFilter(option.value)}
                        >
                          <span>{option.label}</span>
                          <b>{option.count}</b>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="invoice-batch-apartment-list">
                    {filteredBatchApartments.length === 0 ? (
                      <div className="invoice-batch-empty">Không có căn hộ phù hợp với bộ lọc hiện tại.</div>
                    ) : filteredBatchApartments.map((apt) => {
                      const checked = batchSelectedApts.includes(apt.id);
                      const owner = getApartmentOwner(apt);
                      const tenant = getApartmentTenant(apt);
                      const existingInvoice = invoicePeriodByApartmentId.get(String(apt.id));
                      return (
                        <label key={apt.id} className={`invoice-batch-apartment-row ${checked ? 'invoice-batch-apartment-row--selected' : ''} ${existingInvoice ? 'invoice-batch-apartment-row--has-invoice' : ''}`}>
                          <input type="checkbox" checked={checked}
                            onChange={() => setBatchSelectedApts(prev => checked ? prev.filter(id => id !== apt.id) : [...prev, apt.id])}
                          />
                          <div className="invoice-batch-apartment-main">
                            <strong>
                              {apt.apartmentNumber}
                              {existingInvoice && (
                                <i className="invoice-batch-status-badge" title={`Căn hộ đã có hóa đơn kỳ ${batchInvoicePeriodLabel || 'này'}`}>
                                  Đã có hóa đơn
                                </i>
                              )}
                            </strong>
                            <span>{apt.block ? `Block ${apt.block}` : 'Chưa rõ block'} · Tầng {apt.floor ?? '—'}</span>
                            {existingInvoice && (
                              <small className="invoice-batch-existing-note">
                                Sẽ bỏ qua khi tạo hàng loạt
                              </small>
                            )}
                          </div>
                          <div className="invoice-batch-apartment-people">
                            {owner && (
                              <span>
                                <b>{owner.fullName}</b>
                                <i className="invoice-batch-person-badge invoice-batch-person-badge--owner">Chủ</i>
                                {(owner.phone || owner.phoneNumber) && <small>{owner.phone || owner.phoneNumber}</small>}
                              </span>
                            )}
                            {tenant && (
                              <span>
                                <b>{tenant.fullName}</b>
                                <i className="invoice-batch-person-badge invoice-batch-person-badge--tenant">Thuê</i>
                                {(tenant.phone || tenant.phoneNumber) && <small>{tenant.phone || tenant.phoneNumber}</small>}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
            <div className="modal__footer invoice-batch-modal__footer">
              <button className="btn btn--ghost" onClick={() => setBatchModalOpen(false)}>Hủy</button>
              <button className="btn btn--primary" disabled={batchSubmitting || batchSelectedApts.length === 0 || !batchDueDate}
                onClick={async () => {
                  setBatchSubmitting(true);
                  try {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    const fee = tableFees[batchFeeIndex];
                    const otherFeeSummary = getFormOtherFeeSummary(batchFeeDraft);
                      const [dd, mm, yyyy] = batchDueDate.split('/');
                      const res = await invoiceService.batchCreate({
                      apartmentIds: batchSelectedApts,
                      dueDate: `${yyyy}-${mm}-${dd}`,
                      creatorId: user.id,
                      tableFeeId: fee.id,
                      electricFee: batchFeeDraft?.useTieredElectric ? 0 : Number(batchFeeDraft?.electricFee) || 0,
                      waterFee: Number(batchFeeDraft?.waterFee) || 0,
                      managementFee: Number(batchFeeDraft?.managementFee) || 0,
                      motorbikeParkingFee: Number(batchFeeDraft?.motorbikeParkingFee) || 0,
                      carParkingFee: Number(batchFeeDraft?.carParkingFee) || 0,
                      bicycleParkingFee: Number(batchFeeDraft?.bicycleParkingFee) || 0,
                      electricMotorbikeParkingFee: Number(batchFeeDraft?.electricMotorbikeParkingFee) || 0,
                      otherFee: otherFeeSummary.total,
                      descriptionOtherFee: otherFeeSummary.description,
                      useTieredElectric: !!batchFeeDraft?.useTieredElectric,
                    });
                    if (res.data?.status) {
                      const createdCount = res.data.data.length;
                      const skippedCount = batchSelectedApts.length - createdCount;
                      toast.success(
                        skippedCount > 0
                          ? `Đã tạo ${createdCount} hóa đơn, bỏ qua ${skippedCount} căn hộ đã có hóa đơn.`
                          : `Đã tạo ${createdCount} hóa đơn thành công!`
                      );
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
      ), document.body)}
    </div>
  );
}
