import { Fragment, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import apartmentService from '../services/apartmentService';
import residentService from '../services/residentService';
import invoiceService from '../services/invoiceService';
import meterReadingService from '../services/meterReadingService';
import feedbackService from '../services/feedbackService';
import vehicleService from '../services/vehicleService';
import contractService from '../services/contractService';
import deviceService from '../services/deviceService';
import maintenanceService from '../services/maintenanceService';
import DropdownSelect from '../components/common/DropdownSelect';

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
const REPORT_TABS = [
  { value: 'overview', label: 'Tổng quan' },
  { value: 'finance', label: 'Tài chính' },
  { value: 'utilities', label: 'Điện nước' },
  { value: 'operations', label: 'Vận hành' },
];

const invoiceStatusLabel = {
  PAID: 'Đã thanh toán',
  UNPAID: 'Chưa thanh toán',
  OVERDUE: 'Quá hạn',
};

const paymentMethodLabel = {
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
};

const feedbackStatusLabel = {
  PENDING: 'Chờ xử lý',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã xử lý',
  CLOSED: 'Đã đóng',
};

const contractStatusLabel = {
  ACTIVE: 'Đang hiệu lực',
  EXPIRED: 'Hết hạn',
  TERMINATED: 'Đã chấm dứt',
  PENDING: 'Chờ hiệu lực',
};

const deviceStatusLabel = {
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Ngưng hoạt động',
  BROKEN: 'Hỏng',
  UNDER_MAINTENANCE: 'Đang bảo trì',
};

const vehicleTypeLabel = {
  MOTORBIKE: 'Xe máy',
  CAR: 'Ô tô',
  BICYCLE: 'Xe đạp',
  ELECTRIC_BIKE: 'Xe máy điện',
  ELECTRIC_MOTORBIKE: 'Xe máy điện',
};

const getApartmentLabel = (apartment) => (
  `${apartment?.complexName ? `${apartment.complexName} · ` : ''}${apartment?.block ? `${apartment.block}-` : ''}${apartment?.apartmentNumber || '—'}${apartment?.floor != null ? ` · Tầng ${apartment.floor}` : ''}`
);
const unwrapPageContent = (response) => response?.data?.data?.content || response?.data?.data || [];
const toNumber = (value) => Number(value || 0);
const formatCurrency = (value) => `${Math.round(toNumber(value)).toLocaleString('vi-VN')} đ`;
const formatNumber = (value) => toNumber(value).toLocaleString('vi-VN');
const formatMeasure = (value, unit) => (value == null || value === '' ? '—' : `${formatNumber(value)} ${unit}`);
const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('vi-VN');
};
const sumBy = (items, selector) => items.reduce((sum, item) => sum + toNumber(selector(item)), 0);
const getInvoicePaidAmount = (invoice) => {
  const paymentTotal = sumBy((invoice?.payments || []).filter((payment) => payment.paymentStatus === 'SUCCESS'), (payment) => payment.amount);
  if (paymentTotal > 0) return paymentTotal;
  return invoice?.invoiceStatus === 'PAID' ? toNumber(invoice.totalAmount) : 0;
};
const getInvoiceDueDate = (invoice) => invoice?.dueDate ?? invoice?.DueDate;
const getSuccessfulPayments = (invoice) => (invoice?.payments || [])
  .filter((payment) => payment.paymentStatus === 'SUCCESS')
  .sort((a, b) => new Date(b.paymentDateTime || 0) - new Date(a.paymentDateTime || 0));
const getLatestSuccessfulPayment = (invoice) => getSuccessfulPayments(invoice)[0];
const getPaymentMethodText = (payment) => paymentMethodLabel[payment?.paymentMethod] || payment?.paymentMethod || '—';
const getApartmentIdFromNested = (item) => item?.apartment?.id ?? item?.apartment?.apartmentId ?? item?.apartmentId;
const getResidentId = (resident) => resident?.residentId ?? resident?.id;
const getResidentUsername = (resident) => resident?.userName ?? resident?.username ?? resident?.loginName;
const getResidentPhone = (resident) => resident?.phoneNumber ?? resident?.phone;
const getResidentRelationship = (resident) => resident?.relationshipType ?? resident?.relationship;
const getResidentInitial = (resident) => (resident?.fullName || getResidentUsername(resident) || '?').trim().charAt(0).toUpperCase();
const getRelationshipHint = (relationship, ownerName) => {
  if (relationship === 'OWNER') return 'Chủ hộ căn hộ';
  if (relationship === 'TENANT') return 'Người thuê trong căn hộ';
  if (relationship === 'SPOUSE') return `Vợ/chồng của ${ownerName || 'chủ hộ'}`;
  if (relationship === 'CHILD') return `Con của ${ownerName || 'chủ hộ'}`;
  if (relationship === 'PARENT') return `Cha/mẹ của ${ownerName || 'chủ hộ'}`;
  if (relationship === 'RELATIVE') return `Người thân của ${ownerName || 'chủ hộ'}`;
  return 'Cư dân trong căn hộ';
};

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
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  report: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 19V5" /><path d="M4 19h16" /><rect x="7" y="11" width="3" height="5" rx="1" />
      <rect x="12" y="7" width="3" height="9" rx="1" /><rect x="17" y="9" width="3" height="7" rx="1" />
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

export default function ApartmentsPage() {
  /* ─── state ─── */
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterComplexName, setFilterComplexName] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [expandedApartments, setExpandedApartments] = useState({});
  const [residentTooltip, setResidentTooltip] = useState({
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
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [formData, setFormData] = useState({
    complexName: 'Hưng Thịnh',
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
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportApartment, setReportApartment] = useState(null);
  const [reportTab, setReportTab] = useState('overview');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportData, setReportData] = useState({
    invoices: [],
    meterReadings: [],
    feedbacks: [],
    vehicles: [],
    contracts: [],
    devices: [],
    maintenances: [],
  });

  // Available owners & residents (without apartment)
  const [availableOwners, setAvailableOwners] = useState([]);
  const [availableResidents, setAvailableResidents] = useState([]);

  // Delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!modalOpen && !reportModalOpen && !deleteModalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen, reportModalOpen, deleteModalOpen]);

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
      if (filterComplexName) params.complexName = filterComplexName;
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
  }, [page, filterStatus, filterComplexName, filterBlock, filterFloor, sortDirection, searchKeyword]);

  // Dynamic filter options (fetched from all apartments)
  const [allComplexNames, setAllComplexNames] = useState([]);
  const [allBlocks, setAllBlocks] = useState([]);
  const [allFloors, setAllFloors] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apartmentService.getAll({ page: 0, size: 999 });
        const all = res.data?.data?.content || [];
        const complexes = [...new Set(all.map((a) => a.complexName || 'Hưng Thịnh').filter(Boolean))].sort();
        const blocks = [...new Set(all.map((a) => a.block).filter(Boolean))].sort();
        const floors = [...new Set(all.map((a) => a.floor).filter((f) => f != null))].sort((a, b) => a - b);
        setAllComplexNames(complexes);
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

  const toggleApartmentResidents = (apartmentId) => {
    setExpandedApartments((prev) => ({
      ...prev,
      [apartmentId]: !prev[apartmentId],
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

  const showResidentTooltip = (event, payload) => {
    setResidentTooltip({
      visible: true,
      ...getTooltipPosition(event),
      ...payload,
    });
  };

  const moveResidentTooltip = (event) => {
    setResidentTooltip((prev) => (
      prev.visible ? { ...prev, ...getTooltipPosition(event) } : prev
    ));
  };

  const hideResidentTooltip = () => {
    setResidentTooltip((prev) => ({ ...prev, visible: false }));
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedApartment(null);
    setFormData({
      complexName: filterComplexName || 'Hưng Thịnh',
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
      complexName: apt.complexName || 'Hưng Thịnh',
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

  const openReportModal = async (apt) => {
    setReportApartment(apt);
    setReportTab('overview');
    setReportError('');
    setReportModalOpen(true);
    setReportLoading(true);

    const apartmentId = apt.id;
    const requests = await Promise.allSettled([
      apartmentService.getById(apartmentId),
      invoiceService.getAll({ page: 0, size: 1000, sortBy: 'id', direction: 'desc', apartmentId }),
      meterReadingService.getAll({ page: 0, size: 1000, apartmentId }),
      feedbackService.getAll({ page: 0, size: 1000, sortBy: 'id', direction: 'desc', apartmentId }),
      vehicleService.getByApartment(apartmentId),
      contractService.getByApartment(apartmentId, { page: 0, size: 100, sortBy: 'id', direction: 'desc' }),
      deviceService.getAll({ page: 0, size: 1000, apartmentId }),
      maintenanceService.getAll({ page: 0, size: 1000, sortBy: 'id', direction: 'desc' }),
    ]);

    const valueAt = (index) => requests[index].status === 'fulfilled' ? requests[index].value : null;
    const failedCount = requests.filter((item) => item.status === 'rejected').length;
    const maintenances = unwrapPageContent(valueAt(7))
      .filter((item) => String(getApartmentIdFromNested(item)) === String(apartmentId));

    setReportApartment(valueAt(0)?.data?.data || apt);
    setReportData({
      invoices: unwrapPageContent(valueAt(1)),
      meterReadings: unwrapPageContent(valueAt(2)),
      feedbacks: unwrapPageContent(valueAt(3)),
      vehicles: unwrapPageContent(valueAt(4)),
      contracts: unwrapPageContent(valueAt(5)),
      devices: unwrapPageContent(valueAt(6)),
      maintenances,
    });
    setReportError(failedCount ? `Có ${failedCount} nhóm dữ liệu chưa tải được. Báo cáo vẫn hiển thị phần còn lại.` : '');
    setReportLoading(false);
  };

  const openDeleteModal = (apt) => {
    setDeleteTarget(apt);
    setDeleteModalOpen(true);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'ownerId' && value ? { apartmentStatus: 'OCCUPIED' } : {}),
    }));
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
    if (!formData.complexName.trim()) errors.complexName = 'Vui lòng nhập khu chung cư';
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
        complexName: formData.complexName || 'Hưng Thịnh',
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
        <div className="filter-group">
          <label className="filter-label">Khu:</label>
          <DropdownSelect
            value={filterComplexName}
            onChange={(value) => { setFilterComplexName(value); setPage(0); }}
            style={{ width: 140 }}
            options={[
              { value: '', label: 'Tất cả khu' },
              ...allComplexNames.map((name) => ({ value: name, label: name })),
            ]}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Tòa:</label>
          <DropdownSelect
            value={filterBlock}
            onChange={(value) => { setFilterBlock(value); setPage(0); }}
            style={{ width: 130 }}
            options={[
              { value: '', label: 'Tất cả tòa' },
              ...allBlocks.map((block) => ({ value: block, label: `Tòa ${block}` })),
            ]}
          />
        </div>
        <div className="filter-group">
          <label className="filter-label">Tầng:</label>
          <DropdownSelect
            value={filterFloor}
            onChange={(value) => { setFilterFloor(value); setPage(0); }}
            style={{ width: 130 }}
            options={[
              { value: '', label: 'Tất cả tầng' },
              ...allFloors.map((floor) => ({ value: String(floor), label: `Tầng ${floor}` })),
            ]}
          />
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
                <th>Khu</th>
                <th>Số căn hộ</th>
                <th>Tòa</th>
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
                const residents = apt.residents || [];
                const owner = apt.ownerId && residents
                  ? residents.find((r) => String(getResidentId(r)) === String(apt.ownerId))
                  : residents.find((r) => getResidentRelationship(r) === 'OWNER');
                const hasResidents = residents.length > 0;
                const isExpanded = !!expandedApartments[apt.id];
                return (
                  <Fragment key={apt.id}>
                    <tr
                      className={`apartment-row ${isExpanded ? 'apartment-row--expanded' : ''} ${hasResidents ? 'apartment-row--clickable' : ''}`}
                      onClick={() => hasResidents && toggleApartmentResidents(apt.id)}
                    >
                      <td className="data-table__cell--id">{apt.id}</td>
                      <td>{apt.complexName || 'Hưng Thịnh'}</td>
                      <td className="data-table__cell--bold">
                        <div className="apartment-number-cell">
                          <div className="apartment-number-cell__info">
                            <span className="apartment-number-cell__main">{apt.apartmentNumber}</span>
                            {hasResidents && (
                              <span className="apartment-number-cell__count">
                                {residents.length} cư dân
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{apt.block || '—'}</td>
                      <td>{apt.floor ?? '—'}</td>
                      <td>{apt.area ? `${apt.area} m²` : '—'}</td>
                      <td>
                        {owner
                          ? <span className="resident-chip">{owner.fullName}</span>
                          : <span className="text-muted">Chưa có</span>}
                      </td>
                      <td>
                        <span className="badge" style={{ color: sc.color, backgroundColor: sc.bg }}>
                          {statusLabel[apt.apartmentStatus] || apt.apartmentStatus}
                        </span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="action-btn action-btn--view" data-tooltip="Xem chi tiết" onClick={(e) => { e.stopPropagation(); openViewModal(apt); }}>
                            {Icons.eye}
                          </button>
                          <button className="action-btn action-btn--report" data-tooltip="Báo cáo" onClick={(e) => { e.stopPropagation(); openReportModal(apt); }}>
                            {Icons.report}
                          </button>
                          <button className="action-btn action-btn--edit" data-tooltip="Chỉnh sửa" onClick={(e) => { e.stopPropagation(); openEditModal(apt); }}>
                            {Icons.edit}
                          </button>
                          <button className="action-btn action-btn--delete" data-tooltip="Xóa" onClick={(e) => { e.stopPropagation(); openDeleteModal(apt); }}>
                            {Icons.trash}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {hasResidents && (
                      <tr
                        className={`apartment-residents-row ${isExpanded ? 'apartment-residents-row--open' : 'apartment-residents-row--closed'}`}
                        aria-hidden={!isExpanded}
                      >
                        <td colSpan="9">
                          <div className="apartment-residents-collapse">
                            <div className="apartment-residents-collapse__inner">
                              <div className="resident-hh-inline">
                                <span className="resident-hh-inline__label">
                                  {Icons.users}
                                  Thành viên trong hộ:
                                </span>
                                <div className="resident-hh-inline__list">
                                  {residents.map((resident) => {
                                    const relationship = getResidentRelationship(resident);
                                    const rc = relationshipColor[relationship] || relationshipColor.OTHER;
                                    const username = getResidentUsername(resident);
                                    const phone = getResidentPhone(resident);
                                    const residentName = resident.fullName || username || '—';
                                    const relationshipHint = getRelationshipHint(relationship, owner?.fullName);
                                    return (
                                      <div
                                        key={getResidentId(resident)}
                                        className="resident-hh-chip"
                                        style={{ '--chip-accent': rc.color, '--chip-bg': rc.bg }}
                                        onMouseEnter={(e) => showResidentTooltip(e, {
                                          title: residentName,
                                          relationship: relationshipLabel[relationship] || relationship || '—',
                                          phone: phone || 'Chưa có SĐT',
                                          email: resident.email || 'Chưa có email',
                                          context: relationshipHint,
                                        })}
                                        onMouseMove={moveResidentTooltip}
                                        onMouseLeave={hideResidentTooltip}
                                      >
                                        <span className="resident-hh-chip__avatar" style={{ background: rc.bg, color: rc.color }}>
                                          {getResidentInitial(resident)}
                                        </span>
                                        <span className="resident-hh-chip__name">{residentName}</span>
                                        <span className="resident-hh-chip__role" style={{ color: rc.color, background: rc.bg }}>
                                          {relationshipLabel[relationship] || relationship || '—'}
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
        <div className="modal-overlay apartment-form-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal apartment-form-modal" onClick={(e) => e.stopPropagation()}>
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
                <div className="form-field">
                  <label className="form-label">
                    Khu chung cư <span className="form-required">*</span>
                  </label>
                  <input
                    className={`form-input ${formErrors.complexName ? 'form-input--error' : ''}`}
                    value={formData.complexName}
                    onChange={(e) => handleFormChange('complexName', e.target.value)}
                    placeholder="VD: Hưng Thịnh, Hưng Thịnh Riverside..."
                  />
                  {formErrors.complexName && <span className="form-error">{formErrors.complexName}</span>}
                </div>

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

                <div className="form-field">
                  <label className="form-label">Tòa / Block</label>
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
                  <DropdownSelect
                    className={formErrors.apartmentStatus ? 'form-input--error' : ''}
                    value={formData.apartmentStatus}
                    onChange={(value) => handleFormChange('apartmentStatus', value)}
                    options={[
                      { value: 'VACANT', label: 'Trống' },
                      { value: 'OCCUPIED', label: 'Đang ở' },
                      { value: 'UNDER_MAINTENANCE', label: 'Đang bảo trì' },
                    ]}
                  />
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
      ), document.body)}

      {/* View Modal */}
      {modalOpen && modalMode === 'view' && selectedApartment && createPortal((
        <div className="modal-overlay apartment-detail-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal apartment-detail-modal" onClick={(e) => e.stopPropagation()}>
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
                  <span className="detail-label">Khu chung cư</span>
                  <span className="detail-value">{selectedApartment.complexName || 'Hưng Thịnh'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Số căn hộ</span>
                  <span className="detail-value detail-value--bold">{selectedApartment.apartmentNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tòa / Block</span>
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
      ), document.body)}

      {residentTooltip.visible && (
        <div
          className="apartment-resident-tooltip"
          style={{ left: residentTooltip.x, top: residentTooltip.y }}
        >
          <strong>{residentTooltip.title}</strong>
          <span>{residentTooltip.relationship}</span>
          <small>{residentTooltip.context}</small>
          <div className="apartment-resident-tooltip__meta">
            <span>{residentTooltip.phone}</span>
            <span>{residentTooltip.email}</span>
          </div>
        </div>
      )}

      {reportModalOpen && reportApartment && createPortal((
        <div className="modal-overlay apt-report-overlay" onClick={() => setReportModalOpen(false)}>
          <div className="modal apt-report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header apt-report-modal__header">
              <div>
                <h3 className="modal__title">Báo cáo căn hộ {reportApartment.apartmentNumber}</h3>
                <p className="apt-report-modal__subtitle">
                  {getApartmentLabel(reportApartment)} · {statusLabel[reportApartment.apartmentStatus] || reportApartment.apartmentStatus || '—'}
                </p>
              </div>
              <button className="modal__close" onClick={() => setReportModalOpen(false)}>
                {Icons.close}
              </button>
            </div>

            <div className="apt-report-modal__tabs">
              {REPORT_TABS.map((tab) => (
                <button
                  key={tab.value}
                  className={`apt-report-tab ${reportTab === tab.value ? 'apt-report-tab--active' : ''}`}
                  onClick={() => setReportTab(tab.value)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="modal__body apt-report-modal__body">
              {reportLoading ? (
                <div className="apt-report-loading">
                  <div className="spinner" />
                  <span>Đang tổng hợp báo cáo...</span>
                </div>
              ) : (() => {
                const residents = reportApartment.residents || [];
                const owner = reportApartment.ownerId
                  ? residents.find((item) => String(getResidentId(item)) === String(reportApartment.ownerId))
                  : residents.find((item) => getResidentRelationship(item) === 'OWNER');
                const tenant = residents.find((item) => getResidentRelationship(item) === 'TENANT');
                const householdResidents = residents.filter((item) => getResidentRelationship(item) !== 'TENANT');
                const invoices = reportData.invoices || [];
                const meterReadings = reportData.meterReadings || [];
                const feedbacks = reportData.feedbacks || [];
                const vehicles = reportData.vehicles || [];
                const contracts = reportData.contracts || [];
                const devices = reportData.devices || [];
                const maintenances = reportData.maintenances || [];
                const paidAmount = sumBy(invoices, getInvoicePaidAmount);
                const totalAmount = sumBy(invoices, (invoice) => invoice.totalAmount);
                const unpaidAmount = Math.max(0, totalAmount - paidAmount);
                const unpaidInvoices = invoices.filter((invoice) => invoice.invoiceStatus !== 'PAID');
                const paidInvoices = invoices.filter((invoice) => invoice.invoiceStatus === 'PAID');
                const latestInvoice = invoices[0];
                const sortedMeterReadings = [...meterReadings].sort((a, b) => String(b.billingPeriod || '').localeCompare(String(a.billingPeriod || '')));
                const latestReading = sortedMeterReadings[0];
                const electricReadings = sortedMeterReadings.filter((reading) => reading.electricCurrentReading != null || reading.electricQuantity != null);
                const waterReadings = sortedMeterReadings.filter((reading) => reading.waterCurrentReading != null || reading.waterQuantity != null);
                const electricUsage = sumBy(invoices, (invoice) => invoice.electricQuantity);
                const waterUsage = sumBy(invoices, (invoice) => invoice.waterQuantity);
                const electricFee = sumBy(invoices, (invoice) => invoice.electricFee);
                const waterFee = sumBy(invoices, (invoice) => invoice.waterFee);
                const managementFee = sumBy(invoices, (invoice) => invoice.managementFee);
                const parkingFee = sumBy(invoices, (invoice) => invoice.parkingFee);
                const activeContracts = contracts.filter((contract) => contract.contractStatus === 'ACTIVE');
                const openFeedbacks = feedbacks.filter((item) => item.feedbackStatus === 'PENDING' || item.feedbackStatus === 'IN_PROGRESS');
                const riskyDevices = devices.filter((item) => item.deviceStatus === 'BROKEN' || item.deviceStatus === 'UNDER_MAINTENANCE');
                const maintenanceCost = sumBy(maintenances, (item) => item.cost);
                const riskLabel = unpaidAmount > 0
                  ? `${unpaidInvoices.length} hóa đơn chưa thanh toán`
                  : openFeedbacks.length > 0
                    ? `${openFeedbacks.length} phản ánh đang xử lý`
                    : 'Ổn định';

                return (
                  <>
                    {reportError && <div className="apt-report-warning">{reportError}</div>}

                    {reportTab === 'overview' && (
                      <div className="apt-report-section">
                        <div className="apt-report-hero">
                          <div>
                            <span className="apt-report-eyebrow">Tình trạng căn hộ</span>
                            <strong>{riskLabel}</strong>
                          </div>
                          <span className="badge" style={{
                            color: statusColor[reportApartment.apartmentStatus]?.color || '#6b7280',
                            backgroundColor: statusColor[reportApartment.apartmentStatus]?.bg || '#f3f4f6',
                          }}>
                            {statusLabel[reportApartment.apartmentStatus] || reportApartment.apartmentStatus || '—'}
                          </span>
                        </div>

                        <div className="apt-report-stat-grid">
                          <div className="apt-report-stat"><span>Cư dân</span><strong>{householdResidents.length}</strong></div>
                          <div className="apt-report-stat"><span>Người thuê</span><strong>{tenant ? 1 : 0}</strong></div>
                          <div className="apt-report-stat"><span>Phương tiện</span><strong>{vehicles.length}</strong></div>
                          <div className="apt-report-stat"><span>Thiết bị</span><strong>{devices.length}</strong></div>
                        </div>

                        <div className="apt-report-info-grid">
                          <div className="apt-report-info">
                            <span>Chủ hộ</span>
                            <strong>{owner?.fullName || 'Chưa có'}</strong>
                            <small>{owner?.phone || owner?.phoneNumber || owner?.email || '—'}</small>
                          </div>
                          <div className="apt-report-info">
                            <span>Người thuê</span>
                            <strong>{tenant?.fullName || 'Chưa có'}</strong>
                            <small>{tenant?.phone || tenant?.phoneNumber || tenant?.email || '—'}</small>
                          </div>
                          <div className="apt-report-info">
                            <span>Diện tích</span>
                            <strong>{reportApartment.area ? `${reportApartment.area} m²` : '—'}</strong>
                            <small>{reportApartment.complexName || 'Hưng Thịnh'} · Tòa {reportApartment.block || '—'} · Tầng {reportApartment.floor ?? '—'}</small>
                          </div>
                        </div>

                        <section className="apt-report-panel apt-report-residents-panel">
                          <div className="apt-report-panel__head">
                            <strong>Cư dân trong căn hộ</strong>
                            <span>
                              {householdResidents.length} cư dân
                              {tenant ? ' · 1 người thuê' : ''}
                            </span>
                          </div>
                          {householdResidents.length > 0 ? (
                            <div className="apt-report-resident-grid">
                              {householdResidents.map((resident) => {
                                const relationship = getResidentRelationship(resident);
                                const colors = relationshipColor[relationship] || relationshipColor.OTHER;
                                const phone = getResidentPhone(resident);

                                return (
                                  <article
                                    key={getResidentId(resident) || getResidentUsername(resident) || resident.fullName}
                                    className="apt-report-resident-card"
                                    style={{ '--resident-accent': colors.color, '--resident-bg': colors.bg }}
                                  >
                                    <div className="apt-report-resident-card__avatar">
                                      {getResidentInitial(resident)}
                                    </div>
                                    <div className="apt-report-resident-card__body">
                                      <div className="apt-report-resident-card__top">
                                        <strong>{resident.fullName || getResidentUsername(resident) || 'Chưa có tên'}</strong>
                                        <span>{relationshipLabel[relationship] || relationship || 'Khác'}</span>
                                      </div>
                                      <div className="apt-report-resident-card__meta">
                                        <span>{phone || 'Chưa có SĐT'}</span>
                                        <span>{resident.email || 'Chưa có email'}</span>
                                      </div>
                                      <small>{getRelationshipHint(relationship, owner?.fullName)}</small>
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="apt-report-empty">Căn hộ này chưa có cư dân liên kết.</p>
                          )}
                        </section>
                      </div>
                    )}

                    {reportTab === 'finance' && (
                      <div className="apt-report-section">
                        <div className="apt-report-stat-grid apt-report-stat-grid--finance">
                          <div className="apt-report-stat apt-report-stat--success"><span>Đã thu</span><strong>{formatCurrency(paidAmount)}</strong></div>
                          <div className="apt-report-stat apt-report-stat--danger"><span>Còn phải thu</span><strong>{formatCurrency(unpaidAmount)}</strong></div>
                          <div className="apt-report-stat"><span>Hóa đơn</span><strong>{invoices.length}</strong><small>{paidInvoices.length} đã thanh toán</small></div>
                          <div className="apt-report-stat"><span>Gần nhất</span><strong>{latestInvoice?.billingPeriod || '—'}</strong><small>{formatCurrency(latestInvoice?.totalAmount)}</small></div>
                        </div>

                        <div className="apt-report-finance-layout">
                          <section className="apt-report-panel">
                            <div className="apt-report-panel__head">
                              <strong>Cơ cấu phí</strong>
                              <span>Tổng cộng theo các hóa đơn</span>
                            </div>
                            <div className="apt-report-breakdown">
                              {[
                                ['Điện', electricFee],
                                ['Nước', waterFee],
                                ['Quản lý', managementFee],
                                ['Gửi xe', parkingFee],
                              ].map(([label, value]) => (
                                <div key={label} className="apt-report-breakdown__item">
                                  <span>{label}</span>
                                  <strong>{formatCurrency(value)}</strong>
                                </div>
                              ))}
                            </div>
                          </section>

                          <section className="apt-report-panel">
                            <div className="apt-report-panel__head">
                              <strong>Theo dõi thanh toán</strong>
                              <span>{unpaidInvoices.length ? `${unpaidInvoices.length} hóa đơn cần xử lý` : 'Không có công nợ'}</span>
                            </div>
                            <div className="apt-report-payment-grid">
                              <div>
                                <span>Đã thanh toán</span>
                                <strong>{paidInvoices.length}</strong>
                              </div>
                              <div>
                                <span>Chưa thanh toán</span>
                                <strong>{unpaidInvoices.length}</strong>
                              </div>
                              <div>
                                <span>Tổng ghi nhận</span>
                                <strong>{formatCurrency(totalAmount)}</strong>
                              </div>
                            </div>
                          </section>
                        </div>

                        <div className="apt-report-list apt-report-invoice-list">
                          <div className="apt-report-list__head apt-report-invoice-list__head">
                            <strong>Hóa đơn gần đây</strong>
                            <span>Hạn thanh toán</span>
                            <span>Ngày thanh toán</span>
                            <span>Hình thức</span>
                            <span>Trạng thái</span>
                            <b>{invoices.length} bản ghi</b>
                          </div>
                          {invoices.slice(0, 6).map((invoice) => {
                            const latestPayment = getLatestSuccessfulPayment(invoice);
                            const invoicePaidAmount = getInvoicePaidAmount(invoice);
                            const remainingAmount = Math.max(0, toNumber(invoice.totalAmount) - invoicePaidAmount);

                            return (
                              <div key={invoice.invoiceId} className="apt-report-list__row apt-report-invoice-list__row">
                                <div className="apt-report-invoice-main">
                                  <strong>{invoice.billingPeriod || invoice.invoiceNumber || `#${invoice.invoiceId}`}</strong>
                                  <span>{invoice.invoiceNumber && invoice.invoiceNumber !== invoice.billingPeriod ? invoice.invoiceNumber : `#${invoice.invoiceId}`}</span>
                                  <small>Tạo {formatDate(invoice.createdAt)}</small>
                                </div>
                                <span className="apt-report-muted-cell">{formatDate(getInvoiceDueDate(invoice))}</span>
                                <div className="apt-report-payment-cell">
                                  <strong>{latestPayment ? formatDate(latestPayment.paymentDateTime) : '—'}</strong>
                                  <span>{latestPayment?.payerName || latestPayment?.payerPhoneNumber || latestPayment?.transactionCode || 'Chưa ghi nhận'}</span>
                                </div>
                                <span className="apt-report-method-cell">{getPaymentMethodText(latestPayment)}</span>
                                <span className={`apt-report-status-pill apt-report-status-pill--${String(invoice.invoiceStatus || 'unknown').toLowerCase()}`}>
                                  {invoiceStatusLabel[invoice.invoiceStatus] || invoice.invoiceStatus || '—'}
                                </span>
                                <div className="apt-report-amount-cell">
                                  <b>{formatCurrency(invoice.totalAmount)}</b>
                                  <small>{remainingAmount > 0 ? `Còn ${formatCurrency(remainingAmount)}` : `Đã thu ${formatCurrency(invoicePaidAmount)}`}</small>
                                </div>
                              </div>
                            );
                          })}
                          {invoices.length === 0 && <p className="apt-report-empty">Chưa có hóa đơn cho căn hộ này.</p>}
                        </div>
                      </div>
                    )}

                    {reportTab === 'utilities' && (
                      <div className="apt-report-section">
                        <div className="apt-report-utility-grid">
                          <section className="apt-report-utility-card apt-report-utility-card--electric">
                            <div className="apt-report-utility-card__head">
                              <div>
                                <span>Điện</span>
                                <strong>Theo dõi tiêu thụ điện</strong>
                              </div>
                              <b>{formatMeasure(electricUsage, 'kWh')}</b>
                            </div>
                            <div className="apt-report-utility-metrics">
                              <div>
                                <span>Chỉ số mới nhất</span>
                                <strong>{formatMeasure(latestReading?.electricCurrentReading, 'kWh')}</strong>
                              </div>
                              <div>
                                <span>Tiêu thụ kỳ mới nhất</span>
                                <strong>{formatMeasure(latestReading?.electricQuantity, 'kWh')}</strong>
                              </div>
                              <div>
                                <span>Tiền điện</span>
                                <strong>{formatCurrency(electricFee)}</strong>
                              </div>
                            </div>
                            <div className="apt-report-list apt-report-list--embedded">
                              <div className="apt-report-list__head">
                                <strong>Lịch sử điện</strong>
                                <span>{electricReadings.length} kỳ</span>
                              </div>
                              {electricReadings.slice(0, 6).map((reading) => (
                                <div key={`electric-${reading.meterReadingId}`} className="apt-report-list__row">
                                  <div>
                                    <strong>{reading.billingPeriod}</strong>
                                    <span>{formatDate(reading.recordedAt)}</span>
                                  </div>
                                  <b>{formatMeasure(reading.electricQuantity, 'kWh')}</b>
                                </div>
                              ))}
                              {electricReadings.length === 0 && <p className="apt-report-empty">Chưa có dữ liệu điện.</p>}
                            </div>
                          </section>

                          <section className="apt-report-utility-card apt-report-utility-card--water">
                            <div className="apt-report-utility-card__head">
                              <div>
                                <span>Nước</span>
                                <strong>Theo dõi tiêu thụ nước</strong>
                              </div>
                              <b>{formatMeasure(waterUsage, 'm³')}</b>
                            </div>
                            <div className="apt-report-utility-metrics">
                              <div>
                                <span>Chỉ số mới nhất</span>
                                <strong>{formatMeasure(latestReading?.waterCurrentReading, 'm³')}</strong>
                              </div>
                              <div>
                                <span>Tiêu thụ kỳ mới nhất</span>
                                <strong>{formatMeasure(latestReading?.waterQuantity, 'm³')}</strong>
                              </div>
                              <div>
                                <span>Tiền nước</span>
                                <strong>{formatCurrency(waterFee)}</strong>
                              </div>
                            </div>
                            <div className="apt-report-list apt-report-list--embedded">
                              <div className="apt-report-list__head">
                                <strong>Lịch sử nước</strong>
                                <span>{waterReadings.length} kỳ</span>
                              </div>
                              {waterReadings.slice(0, 6).map((reading) => (
                                <div key={`water-${reading.meterReadingId}`} className="apt-report-list__row">
                                  <div>
                                    <strong>{reading.billingPeriod}</strong>
                                    <span>{formatDate(reading.recordedAt)}</span>
                                  </div>
                                  <b>{formatMeasure(reading.waterQuantity, 'm³')}</b>
                                </div>
                              ))}
                              {waterReadings.length === 0 && <p className="apt-report-empty">Chưa có dữ liệu nước.</p>}
                            </div>
                          </section>
                        </div>
                      </div>
                    )}

                    {reportTab === 'operations' && (
                      <div className="apt-report-section">
                        <div className="apt-report-stat-grid">
                          <div className="apt-report-stat"><span>Phản ánh</span><strong>{feedbacks.length}</strong><small>{openFeedbacks.length} đang mở</small></div>
                          <div className="apt-report-stat"><span>Thiết bị cần chú ý</span><strong>{riskyDevices.length}</strong></div>
                          <div className="apt-report-stat"><span>Lượt bảo trì</span><strong>{maintenances.length}</strong></div>
                          <div className="apt-report-stat"><span>Chi phí bảo trì</span><strong>{formatCurrency(maintenanceCost)}</strong></div>
                        </div>

                        <div className="apt-report-info-grid">
                          <div className="apt-report-info">
                            <span>Thiết bị</span>
                            <strong>{devices.length} thiết bị</strong>
                            <small>
                              {riskyDevices.length
                                ? `${riskyDevices.length} thiết bị ${deviceStatusLabel.BROKEN.toLowerCase()}/${deviceStatusLabel.UNDER_MAINTENANCE.toLowerCase()}`
                                : 'Không có cảnh báo thiết bị'}
                            </small>
                          </div>
                          <div className="apt-report-info">
                            <span>Phương tiện</span>
                            <strong>{vehicles.length} xe</strong>
                            <small>{vehicles.map((vehicle) => vehicleTypeLabel[vehicle.vehicleType] || vehicle.vehicleType).filter(Boolean).slice(0, 3).join(', ') || '—'}</small>
                          </div>
                          <div className="apt-report-info">
                            <span>Hợp đồng</span>
                            <strong>{contracts.length} hợp đồng</strong>
                            <small>{activeContracts.length ? `Có hợp đồng ${contractStatusLabel.ACTIVE.toLowerCase()}` : 'Chưa có hợp đồng hiệu lực'}</small>
                          </div>
                        </div>

                        <div className="apt-report-list">
                          <div className="apt-report-list__head">
                            <strong>Phản ánh gần đây</strong>
                            <span>{feedbacks.length} bản ghi</span>
                          </div>
                          {feedbacks.slice(0, 5).map((feedback) => (
                            <div key={feedback.feedbackId} className="apt-report-list__row">
                              <div>
                                <strong>{feedback.title || `Phản ánh #${feedback.feedbackId}`}</strong>
                                <span>{feedbackStatusLabel[feedback.feedbackStatus] || feedback.feedbackStatus || '—'} · {formatDate(feedback.createdAt)}</span>
                              </div>
                              <b>{feedback.feedbackType || '—'}</b>
                            </div>
                          ))}
                          {feedbacks.length === 0 && <p className="apt-report-empty">Chưa có phản ánh từ căn hộ này.</p>}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setReportModalOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* Delete Modal */}
      {deleteModalOpen && deleteTarget && createPortal((
        <div className="modal-overlay apartment-delete-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal modal--sm apartment-delete-modal" onClick={(e) => e.stopPropagation()}>
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
      ), document.body)}
    </div>
  );
}
