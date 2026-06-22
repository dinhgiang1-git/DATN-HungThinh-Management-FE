import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import invoiceService from '../../services/invoiceService';
import paymentService from '../../services/paymentService';
import apartmentService from '../../services/apartmentService';
import DropdownSelect from '../../components/common/DropdownSelect';

/* ─── helpers ─── */
const formatCurrency = (n) =>
  (n ?? 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN') : '—';

/* ─── status configs ─── */
const invoiceStatusConfig = {
  PAID: { label: 'Đã thanh toán', color: '#10b981', bg: '#d1fae5' },
  UNPAID: { label: 'Chưa thanh toán', color: '#ef4444', bg: '#fee2e2' },
  OVERDUE: { label: 'Quá hạn', color: '#c2410c', bg: '#ffedd5' },
};

const paymentStatusConfig = {
  PENDING: { label: 'Đang xử lý', color: '#f59e0b', bg: '#fef3c7' },
  SUCCESS: { label: 'Thành công', color: '#10b981', bg: '#d1fae5' },
  FAILED: { label: 'Thất bại', color: '#ef4444', bg: '#fee2e2' },
};

function StatusBadge({ status, config }) {
  const s = config[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span className="inv__badge" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
}

export default function ResidentInvoicePage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [apartmentId, setApartmentId] = useState(null);

  // Payment modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payInvoiceId, setPayInvoiceId] = useState(null);
  const [payMethod, setPayMethod] = useState('');
  const [payNote, setPayNote] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);

  /* Filters */
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const init = async () => {
      try {
        const res = await apartmentService.getByResident(user.id);
        const apt = res.data?.data;
        if (apt?.id) setApartmentId(apt.id);
      } catch {
        setApartmentId(null);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (apartmentId) fetchInvoices();
  }, [page, statusFilter, apartmentId]);

  useEffect(() => {
    if (!selectedInvoice && !payModalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedInvoice, payModalOpen]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: pageSize,
        sortBy: 'id',
        direction: 'desc',
        apartmentId,
      };
      if (statusFilter) params.invoiceStatus = statusFilter;
      if (keyword.trim()) params.keyword = keyword.trim();

      const res = await invoiceService.getAll(params);
      const data = res.data?.data;
      setInvoices(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
    } catch {
      toast.error('Không thể tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchInvoices();
  };

  const handleViewDetail = async (invoiceId) => {
    setDetailLoading(true);
    try {
      const res = await invoiceService.getById(invoiceId);
      setSelectedInvoice(res.data?.data);
    } catch {
      toast.error('Không thể tải chi tiết hóa đơn');
    } finally {
      setDetailLoading(false);
    }
  };

  const openPaymentModal = (invoiceId) => {
    setPayInvoiceId(invoiceId); setPayMethod(''); setPayNote('');
    setPayModalOpen(true);
  };

  const handleMomoPayment = async (invoiceId) => {
    setPayingId(invoiceId);
    try {
      const res = await paymentService.createMomo(invoiceId);
      const paymentUrl = res.data?.data;
      if (paymentUrl) {
        window.open(paymentUrl, '_blank');
      } else {
        toast.error('Không thể tạo liên kết thanh toán');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi tạo thanh toán');
    } finally {
      setPayingId(null);
    }
  };

  const handleVnPayPayment = async (invoiceId) => {
    setPayingId(invoiceId);
    try {
      const res = await paymentService.createVnPay(invoiceId);
      const paymentUrl = res.data?.data;
      if (paymentUrl) {
        window.open(paymentUrl, '_blank');
      } else {
        toast.error('Không thể tạo liên kết thanh toán');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi tạo thanh toán VNPay');
    } finally {
      setPayingId(null);
    }
  };

  const handleManualPayment = async () => {
    if (!payMethod) { toast.warning('Vui lòng chọn phương thức'); return; }
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
    const payInvoice = getPayInvoice();
    if (hasPendingCashPayment(payInvoice)) {
      toast.info('Hóa đơn này đã có đề xuất thanh toán tiền mặt đang chờ xác nhận');
      return;
    }
    setPaySubmitting(true);
    try {
      await paymentService.requestCashPayment({
        invoiceId: payInvoiceId,
        paymentMethod: 'CASH',
        note: payNote || undefined,
      });
      toast.success('Đã gửi đề xuất thanh toán tiền mặt, vui lòng chờ ban quản lý xác nhận!');
      setPayModalOpen(false);
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setPaySubmitting(false);
    }
  };

  const getPendingCashPayment = (invoice) =>
    invoice?.payments?.find((p) => p.paymentMethod === 'CASH' && p.paymentStatus === 'PENDING');

  const hasPendingCashPayment = (invoice) => Boolean(getPendingCashPayment(invoice));

  const getPayInvoice = () =>
    selectedInvoice?.invoiceId === payInvoiceId
      ? selectedInvoice
      : invoices.find((inv) => inv.invoiceId === payInvoiceId);

  return (
    <div className="page inv" id="invoice-page">
      <div className="page__header">
        <div>
          <h2 className="page__title">Hóa đơn</h2>
          <p className="page__desc">Theo dõi hóa đơn căn hộ, trạng thái thanh toán và lịch sử giao dịch</p>
        </div>
      </div>

      {/* Header Bar */}
      <div className="page__filters inv__toolbar">
        <form className="inv__search" onSubmit={handleSearch}>
          <div className="inv__search-wrapper">
            <svg className="inv__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="inv__search-input"
              placeholder="Tìm theo mã hóa đơn, ngày..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              id="invoice-search-input"
            />
          </div>
          <button type="submit" className="inv__search-btn" id="invoice-search-btn">Tìm kiếm</button>
        </form>

        <div className="inv__filters">
          <DropdownSelect
            value={statusFilter}
            onChange={(value) => { setStatusFilter(value); setPage(0); }}
            style={{ width: 180 }}
            options={[
              { value: '', label: 'Tất cả trạng thái' },
              { value: 'UNPAID', label: 'Chưa thanh toán' },
              { value: 'OVERDUE', label: 'Quá hạn' },
              { value: 'PAID', label: 'Đã thanh toán' },
            ]}
            renderValue={(option) => {
              const tone = invoiceStatusConfig[option.value];
              return (
                <span className="ds-status-value">
                  {tone && <span className="ds-status-dot" style={{ background: tone.color }} />}
                  <span className="ds-option-label">{option.label}</span>
                </span>
              );
            }}
            renderOption={(option) => {
              const tone = invoiceStatusConfig[option.value];
              return (
                <span className="ds-status-value">
                  {tone && <span className="ds-status-dot" style={{ background: tone.color }} />}
                  <span className="ds-option-label">{option.label}</span>
                </span>
              );
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="page__table-wrapper inv__card">
        {loading ? (
          <div className="inv__loading">
            <div className="inv__spinner" />
            <p>Đang tải hóa đơn...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="inv__empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p>Không có hóa đơn nào</p>
          </div>
        ) : (
          <>
            <div className="inv__table-wrapper inv__desktop-only">
              <table className="data-table inv__table">
                <thead>
                  <tr>
                    <th>Mã hóa đơn</th>
                    <th>Căn hộ</th>
                    <th>Tổng tiền</th>
                    <th>Hạn thanh toán</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.invoiceId}>
                      <td className="inv__cell-code">{inv.invoiceNumber}</td>
                      <td>{inv.apartment?.apartmentNumber ?? '—'}</td>
                      <td className="inv__cell-amount">{formatCurrency(inv.totalAmount)}</td>
                      <td>{formatDate(inv.dueDate || inv.DueDate)}</td>
                      <td>
                        <StatusBadge status={inv.invoiceStatus} config={invoiceStatusConfig} />
                        {hasPendingCashPayment(inv) && (
                          <div style={{ marginTop: 6 }}>
                            <span className="inv__badge" style={{ color: '#92400e', backgroundColor: '#fef3c7' }}>
                              Chờ xác nhận tiền mặt
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="inv__actions">
                          <button
                            className="inv__action-btn inv__action-btn--view"
                            onClick={() => handleViewDetail(inv.invoiceId)}
                            title="Xem chi tiết"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          {(inv.invoiceStatus === 'UNPAID' || inv.invoiceStatus === 'OVERDUE') ? (
                            <button
                              className="inv__action-btn inv__action-btn--pay"
                              onClick={() => openPaymentModal(inv.invoiceId)}
                              title="Thanh toán"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                <line x1="1" y1="10" x2="23" y2="10" />
                              </svg>
                            </button>
                          ) : (
                            <button className="inv__action-btn" disabled title="Đã thanh toán" style={{ opacity: 0.35, cursor: 'default', color: '#10b981' }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="inv__mobile-only">
              {invoices.map((inv) => (
                <div key={inv.invoiceId} className="inv__mob-card" onClick={() => handleViewDetail(inv.invoiceId)}>
                  <div className="inv__mob-card-top">
                    <span className="inv__mob-card-code">{inv.invoiceNumber}</span>
                    <StatusBadge status={inv.invoiceStatus} config={invoiceStatusConfig} />
                  </div>
                  <div className="inv__mob-card-info">
                    <div className="inv__mob-card-row">
                      <span className="inv__mob-card-label">Căn hộ</span>
                      <span className="inv__mob-card-val">{inv.apartment?.apartmentNumber ?? '—'}</span>
                    </div>
                    <div className="inv__mob-card-row">
                      <span className="inv__mob-card-label">Hạn thanh toán</span>
                      <span className="inv__mob-card-val">{formatDate(inv.dueDate || inv.DueDate)}</span>
                    </div>
                  </div>
                  <div className="inv__mob-card-bottom">
                    <span className="inv__mob-card-amount">{formatCurrency(inv.totalAmount)}</span>
                    <div className="inv__mob-card-actions">
                      <button className="inv__mob-btn inv__mob-btn--view" onClick={(e) => { e.stopPropagation(); handleViewDetail(inv.invoiceId); }}>Chi tiết</button>
                      {(inv.invoiceStatus === 'UNPAID' || inv.invoiceStatus === 'OVERDUE') && (
                        <button className="inv__mob-btn inv__mob-btn--pay" onClick={(e) => { e.stopPropagation(); openPaymentModal(inv.invoiceId); }}>Thanh toán</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="inv__pagination">
                <button className="inv__page-btn" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>← Trước</button>
                <span className="inv__page-info">Trang {page + 1} / {totalPages}</span>
                <button className="inv__page-btn" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>Sau →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedInvoice && createPortal((
        <div className="inv__overlay resident-invoice-detail-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="inv__modal resident-invoice-detail-modal" onClick={(e) => e.stopPropagation()} id="invoice-detail-modal">
            {detailLoading ? (
              <div className="inv__loading" style={{ minHeight: 200 }}>
                <div className="inv__spinner" />
              </div>
            ) : (
              <>
                <div className="inv__modal-header">
                  <h3>Chi tiết hóa đơn</h3>
                  <button className="inv__modal-close" onClick={() => setSelectedInvoice(null)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="inv__modal-body">
                  <div className="inv__resident-detail-shell">
                    <section className="inv__resident-detail-main">
                      <div className="inv__detail-summary">
                        <div>
                          <span className="inv__detail-summary-label">Hóa đơn</span>
                          <strong className="inv__detail-summary-code">{selectedInvoice.invoiceNumber}</strong>
                        </div>
                        <div className="inv__detail-status">
                          <StatusBadge status={selectedInvoice.invoiceStatus} config={invoiceStatusConfig} />
                          {hasPendingCashPayment(selectedInvoice) && (
                            <span className="inv__badge" style={{ color: '#92400e', backgroundColor: '#fef3c7' }}>
                              Chờ xác nhận tiền mặt
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="inv__detail-grid">
                        <div className="inv__detail-row">
                          <span className="inv__detail-label">Căn hộ</span>
                          <span className="inv__detail-value">
                            {selectedInvoice.apartment
                              ? `${selectedInvoice.apartment.apartmentNumber} - Block ${selectedInvoice.apartment.block} - Tầng ${selectedInvoice.apartment.floor}`
                              : '—'}
                          </span>
                        </div>
                        <div className="inv__detail-row">
                          <span className="inv__detail-label">Hạn thanh toán</span>
                          <span className="inv__detail-value">{formatDate(selectedInvoice.dueDate || selectedInvoice.DueDate)}</span>
                        </div>
                        <div className="inv__detail-row">
                          <span className="inv__detail-label">Ngày tạo</span>
                          <span className="inv__detail-value">{selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString('vi-VN') : '—'}</span>
                        </div>
                        <div className="inv__detail-row">
                          <span className="inv__detail-label">Tổng phải thanh toán</span>
                          <span className="inv__detail-value inv__detail-value--bold">{formatCurrency(selectedInvoice.totalAmount)}</span>
                        </div>
                      </div>

                      <div className="inv__total-row">
                        <span>Tổng cộng</span>
                        <span className="inv__total-amount">{formatCurrency(selectedInvoice.totalAmount)}</span>
                      </div>

                      {(selectedInvoice.invoiceStatus === 'UNPAID' || selectedInvoice.invoiceStatus === 'OVERDUE') && (
                        <button
                          className="inv__pay-btn"
                          onClick={() => { setSelectedInvoice(null); setTimeout(() => openPaymentModal(selectedInvoice.invoiceId), 100); }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                          Thanh toán
                        </button>
                      )}
                    </section>

                    <section className="inv__resident-detail-side">
                      <h4 className="inv__detail-section-title">Chi tiết phí</h4>

                      <div className="inv__fee-grid">
                        <div className="inv__fee-item">
                          <span className="inv__fee-label">⚡ Tiền điện</span>
                          <span className="inv__fee-value">{formatCurrency(selectedInvoice.electricFee)}</span>
                        </div>
                        <div className="inv__fee-item">
                          <span className="inv__fee-label">💧 Tiền nước</span>
                          <span className="inv__fee-value">{formatCurrency(selectedInvoice.waterFee)}</span>
                        </div>
                        <div className="inv__fee-item">
                          <span className="inv__fee-label">🏢 Phí quản lý</span>
                          <span className="inv__fee-value">{formatCurrency(selectedInvoice.managementFee)}</span>
                        </div>
                        <div className="inv__fee-item">
                          <span className="inv__fee-label">🚗 Phí gửi xe</span>
                          <span className="inv__fee-value">{formatCurrency(selectedInvoice.parkingFee)}</span>
                        </div>
                        {(selectedInvoice.otherFee > 0) && (
                          <div className="inv__fee-item inv__fee-item--full">
                            <span className="inv__fee-label">📋 Phí khác
                              {selectedInvoice.descriptionOtherFee && (
                                <span className="inv__fee-desc"> ({selectedInvoice.descriptionOtherFee})</span>
                              )}
                            </span>
                            <span className="inv__fee-value">{formatCurrency(selectedInvoice.otherFee)}</span>
                          </div>
                        )}
                      </div>

                      {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                        <>
                          <div className="inv__detail-divider" />
                          <h4 className="inv__detail-section-title">Lịch sử thanh toán</h4>
                          <div className="inv__payment-table-wrap">
                            <table className="inv__payment-table">
                              <thead>
                                <tr>
                                  <th>Phương thức</th>
                                  <th>Ngày</th>
                                  <th>Số tiền</th>
                                  <th>Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedInvoice.payments.map((p) => (
                                  <tr key={p.paymentId}>
                                    <td className="inv__payment-method">{p.paymentMethod}</td>
                                    <td className="inv__payment-date">{formatDate(p.paymentDateTime)}</td>
                                    <td className="inv__payment-amount">{formatCurrency(p.amount)}</td>
                                    <td>
                                      <StatusBadge status={p.paymentStatus} config={paymentStatusConfig} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </section>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ), document.body)}

      {/* Payment Method Modal */}
      {payModalOpen && createPortal((
        <div className="inv__overlay resident-invoice-payment-overlay" onClick={() => setPayModalOpen(false)}>
          <div className="inv__modal resident-invoice-payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv__modal-header">
              <h3>Chọn phương thức thanh toán</h3>
              <button className="inv__modal-close" onClick={() => setPayModalOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="inv__modal-body">
              <div className="resident-pay-methods">
                {[
                  { value: 'CASH', label: 'Tiền mặt', icon: '💵', color: '#16a34a', bg: '#d1fae5' },
                  { value: 'MOMO', label: 'MoMo', icon: '📱', color: '#ae2070', bg: '#fce4ec' },
                  { value: 'VNPAY', label: 'VNPay', icon: '🏦', color: '#2563eb', bg: '#dbeafe' },
                ].map((m) => {
                  const cashPending = m.value === 'CASH' && hasPendingCashPayment(getPayInvoice());
                  return (
                  <button key={m.value} type="button"
                    disabled={cashPending}
                    onClick={() => !cashPending && setPayMethod(m.value)}
                    style={{
                      flex: 1, padding: '1rem 0.5rem', borderRadius: 12,
                      border: payMethod === m.value ? `2.5px solid ${m.color}` : '2px solid #e2e8f0',
                      background: payMethod === m.value ? m.bg : '#fff',
                      minHeight: 118,
                      cursor: cashPending ? 'not-allowed' : 'pointer', textAlign: 'center',
                      transition: 'all 0.2s ease',
                      opacity: cashPending ? 0.55 : 1,
                    }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>{m.icon}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: payMethod === m.value ? m.color : '#64748b' }}>{m.label}</div>
                    {cashPending && <div style={{ fontSize: '0.72rem', color: '#92400e', marginTop: 4 }}>Đang chờ</div>}
                  </button>
                  );
                })}
              </div>

              <div className="resident-pay-note">
                {payMethod === 'CASH' && (
                <div className="resident-pay-note__cash">
                  <div style={{ padding: '0.75rem 1rem', background: '#d1fae5', borderRadius: 8, fontSize: '0.85rem', color: '#065f46' }}>
                    Gửi đề xuất thanh toán tiền mặt sau khi bạn nộp tiền tại quầy lễ tân hoặc ban quản lý.
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 500, color: '#374151', marginBottom: 4, display: 'block' }}>Ghi chú (tùy chọn)</label>
                    <input
                      type="text"
                      value={payNote}
                      onChange={(e) => setPayNote(e.target.value)}
                      placeholder="VD: Đã nộp tại lễ tân"
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                )}

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
              </div>
            </div>
            <div className="resident-pay-footer">
              <button onClick={() => setPayModalOpen(false)}
                style={{ padding: '0.55rem 1.2rem', borderRadius: 8, border: '1.5px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: 500, fontSize: '0.88rem', color: '#64748b' }}>
                Hủy
              </button>
              <button onClick={handleManualPayment}
                disabled={!payMethod || paySubmitting || payingId === payInvoiceId || (payMethod === 'CASH' && hasPendingCashPayment(getPayInvoice()))}
                style={{
                  padding: '0.55rem 1.2rem', borderRadius: 8, border: 'none',
                  cursor: !payMethod ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: '0.88rem', color: '#fff',
                  background: payMethod === 'MOMO' ? 'linear-gradient(135deg, #ae2070, #880e4f)' : payMethod === 'VNPAY' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : payMethod === 'CASH' ? 'linear-gradient(135deg, #16a34a, #15803d)' : '#cbd5e1',
                  opacity: !payMethod || paySubmitting ? 0.6 : 1,
                }}>
                {paySubmitting || payingId === payInvoiceId ? 'Đang xử lý...' : payMethod === 'MOMO' ? '📱 Thanh toán MoMo' : payMethod === 'VNPAY' ? '🏦 Thanh toán VNPay' : payMethod === 'CASH' ? '💵 Gửi đề xuất tiền mặt' : 'Chọn phương thức'}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}
