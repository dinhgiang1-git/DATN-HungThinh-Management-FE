import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import apartmentService from '../../services/apartmentService';
import contractService from '../../services/contractService';

/* ─── helpers ─── */
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN') : '—';

/* ─── status configs ─── */
const contractStatusConfig = {
  ACTIVE: { label: 'Đang hiệu lực', color: '#10b981', bg: '#d1fae5' },
  EXPIRED: { label: 'Hết hạn', color: '#f59e0b', bg: '#fef3c7' },
  TERMINATED: { label: 'Đã chấm dứt', color: '#ef4444', bg: '#fee2e2' },
};

const contractTypeConfig = {
  RENT: { label: 'Thuê', color: '#6366f1', bg: '#eef2ff' },
  PURCHASE: { label: 'Mua bán', color: '#059669', bg: '#d1fae5' },
  SERVICE: { label: 'Dịch vụ', color: '#d97706', bg: '#fef3c7' },
};

function StatusBadge({ status, config }) {
  const s = config[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span className="ct__badge" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
}

export default function ResidentContractPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apartmentId, setApartmentId] = useState(null);
  const [apartmentInfo, setApartmentInfo] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchApartment();
  }, []);

  useEffect(() => {
    if (apartmentId) fetchContracts();
  }, [apartmentId, page]);

  useEffect(() => {
    if (!selectedContract) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedContract]);

  const fetchApartment = async () => {
    try {
      const res = await apartmentService.getByResident(user.id);
      const apt = res.data?.data;
      if (apt?.id) {
        setApartmentId(apt.id);
        setApartmentInfo(apt);
      }
    } catch {
      // Resident may not have apartment
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await contractService.getByApartment(apartmentId, {
        page,
        size: pageSize,
        sortBy: 'id',
        direction: 'desc',
      });
      const data = res.data?.data;
      setContracts(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
    } catch {
      toast.error('Không thể tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (contract) => {
    if (!contract.originalFileName) {
      toast.warning('Hợp đồng này chưa có file đính kèm');
      return;
    }
    setDownloading(contract.contractId);
    try {
      const res = await contractService.downloadResident(contract.contractId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', contract.originalFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Tải file thành công!');
    } catch {
      toast.error('Không thể tải file hợp đồng');
    } finally {
      setDownloading(null);
    }
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (!apartmentId && !loading) {
    return (
      <div className="ct__empty-state" id="contract-page">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, color: '#94a3b8' }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '1rem' }}>Bạn chưa được gán căn hộ, không thể xem hợp đồng.</p>
      </div>
    );
  }

  return (
    <div className="page ct" id="contract-page">
      <div className="page__header">
        <div>
          <h2 className="page__title">Hợp đồng</h2>
          <p className="page__desc">Tra cứu hợp đồng căn hộ và tải file đính kèm khi có quyền truy cập</p>
        </div>
      </div>

      {/* Header */}
      <div className="page__filters ct__toolbar">
        <div className="ct__toolbar-left">
          {apartmentInfo && (
            <span className="ct__apt-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M9 22V12h6v10" />
              </svg>
              Căn {apartmentInfo.apartmentNumber} · Block {apartmentInfo.block} · Tầng {apartmentInfo.floor}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="page__table-wrapper ct__card">
        {loading ? (
          <div className="ct__loading">
            <div className="ct__spinner" />
            <p>Đang tải hợp đồng...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="ct__empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p>Chưa có hợp đồng nào cho căn hộ này</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="ct__table-wrapper ct__desktop-only">
              <table className="data-table ct__table">
                <thead>
                  <tr>
                    <th>Mã hợp đồng</th>
                    <th>Loại</th>
                    <th>Ngày bắt đầu</th>
                    <th>Ngày kết thúc</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((ct) => {
                    const days = getDaysRemaining(ct.endDate);
                    return (
                      <tr key={ct.contractId}>
                        <td className="ct__cell-code">{ct.contractNumber}</td>
                        <td>
                          <StatusBadge status={ct.contractType} config={contractTypeConfig} />
                        </td>
                        <td>{formatDate(ct.startDate)}</td>
                        <td>
                          {formatDate(ct.endDate)}
                          {ct.contractStatus === 'ACTIVE' && days != null && days <= 30 && days > 0 && (
                            <span className="ct__expiry-warn"> (còn {days} ngày)</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={ct.contractStatus} config={contractStatusConfig} />
                        </td>
                        <td>
                          <div className="ct__actions">
                            <button
                              className="ct__action-btn ct__action-btn--view"
                              onClick={() => setSelectedContract(ct)}
                              title="Xem chi tiết"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            {ct.originalFileName ? (
                              <button
                                className="ct__action-btn ct__action-btn--download"
                                onClick={() => handleDownload(ct)}
                                disabled={downloading === ct.contractId}
                                title="Tải file"
                              >
                                {downloading === ct.contractId ? (
                                  <div className="ct__btn-spinner" />
                                ) : (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                  </svg>
                                )}
                              </button>
                            ) : (
                              <button className="ct__action-btn" disabled title="Không có file" style={{ opacity: 0.25, cursor: 'default' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="ct__mobile-only">
              {contracts.map((ct) => {
                const days = getDaysRemaining(ct.endDate);
                return (
                  <div key={ct.contractId} className="ct__mob-card" onClick={() => setSelectedContract(ct)}>
                    <div className="ct__mob-card-top">
                      <span className="ct__mob-card-code">{ct.contractNumber}</span>
                      <StatusBadge status={ct.contractStatus} config={contractStatusConfig} />
                    </div>
                    <div className="ct__mob-card-info">
                      <div className="ct__mob-card-row">
                        <span className="ct__mob-card-label">Loại</span>
                        <StatusBadge status={ct.contractType} config={contractTypeConfig} />
                      </div>
                      <div className="ct__mob-card-row">
                        <span className="ct__mob-card-label">Thời hạn</span>
                        <span className="ct__mob-card-val">{formatDate(ct.startDate)} - {formatDate(ct.endDate)}</span>
                      </div>
                      {ct.contractStatus === 'ACTIVE' && days != null && days <= 30 && days > 0 && (
                        <div className="ct__mob-card-row">
                          <span className="ct__expiry-warn">⚠ Sắp hết hạn: còn {days} ngày</span>
                        </div>
                      )}
                    </div>
                    <div className="ct__mob-card-bottom">
                      <button className="ct__mob-btn ct__mob-btn--view" onClick={(e) => { e.stopPropagation(); setSelectedContract(ct); }}>Chi tiết</button>
                      {ct.originalFileName && (
                        <button
                          className="ct__mob-btn ct__mob-btn--download"
                          onClick={(e) => { e.stopPropagation(); handleDownload(ct); }}
                          disabled={downloading === ct.contractId}
                        >
                          {downloading === ct.contractId ? 'Đang tải...' : 'Tải file'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="ct__pagination">
                <button className="ct__page-btn" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>← Trước</button>
                <span className="ct__page-info">Trang {page + 1} / {totalPages}</span>
                <button className="ct__page-btn" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>Sau →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedContract && createPortal((
        <div className="ct__overlay resident-contract-detail-overlay" onClick={() => setSelectedContract(null)}>
          <div className="ct__modal resident-contract-detail-modal" onClick={(e) => e.stopPropagation()} id="contract-detail-modal">
            <div className="ct__modal-header">
              <h3>Chi tiết hợp đồng</h3>
              <button className="ct__modal-close" onClick={() => setSelectedContract(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="ct__modal-body">
              <div className="ct__detail-summary">
                <div>
                  <div className="ct__detail-summary-label">Mã hợp đồng</div>
                  <div className="ct__detail-summary-code">{selectedContract.contractNumber}</div>
                </div>
                <div className="ct__detail-header-badges">
                  <StatusBadge status={selectedContract.contractType} config={contractTypeConfig} />
                  <StatusBadge status={selectedContract.contractStatus} config={contractStatusConfig} />
                </div>
              </div>

              <div className="ct__detail-grid">
                {selectedContract.apartment && (
                  <div className="ct__detail-row">
                    <span className="ct__detail-label">Căn hộ</span>
                    <span className="ct__detail-value">
                      Căn {selectedContract.apartment.apartmentNumber} · Block {selectedContract.apartment.block} · Tầng {selectedContract.apartment.floor}
                    </span>
                  </div>
                )}

                {selectedContract.resident && (
                  <div className="ct__detail-row">
                    <span className="ct__detail-label">Người ký</span>
                    <span className="ct__detail-value">
                      {selectedContract.resident.fullName}
                      {selectedContract.resident.phoneNumber && ` · ${selectedContract.resident.phoneNumber}`}
                    </span>
                  </div>
                )}

                <div className="ct__detail-row">
                  <span className="ct__detail-label">Ngày bắt đầu</span>
                  <span className="ct__detail-value">{formatDate(selectedContract.startDate)}</span>
                </div>

                <div className="ct__detail-row">
                  <span className="ct__detail-label">Ngày kết thúc</span>
                  <span className="ct__detail-value">
                    {formatDate(selectedContract.endDate)}
                    {(() => {
                      const days = getDaysRemaining(selectedContract.endDate);
                      if (selectedContract.contractStatus === 'ACTIVE' && days != null && days <= 30 && days > 0) {
                        return <span className="ct__expiry-warn"> (còn {days} ngày)</span>;
                      }
                      return null;
                    })()}
                  </span>
                </div>
              </div>

              {selectedContract.note && (
                <div className="ct__detail-section">
                  <span className="ct__detail-label">Ghi chú</span>
                  <div className="ct__detail-note">{selectedContract.note}</div>
                </div>
              )}

              {selectedContract.originalFileName && (
                <div className="ct__detail-file">
                  <div className="ct__file-info">
                    <div className="ct__file-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div>
                      <span className="ct__file-label">File đính kèm</span>
                      <span className="ct__file-name">{selectedContract.originalFileName}</span>
                    </div>
                  </div>
                  <button
                    className="ct__download-btn"
                    onClick={() => handleDownload(selectedContract)}
                    disabled={downloading === selectedContract.contractId}
                  >
                    {downloading === selectedContract.contractId ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="ct__btn-spinner" /> Đang tải...
                      </span>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Tải file
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}
