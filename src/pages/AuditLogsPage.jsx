import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import auditLogService from '../services/auditLogService';
import { exportToExcel } from '../utils/exportExcel';

/* ─── config ─── */
const actionConfig = {
  CREATE: { label: 'Tạo mới', color: '#10b981', bg: '#ecfdf5' },
  UPDATE: { label: 'Cập nhật', color: '#f59e0b', bg: '#fffbeb' },
  DELETE: { label: 'Xóa', color: '#ef4444', bg: '#fef2f2' },
  BATCH_CREATE: { label: 'Tạo hàng loạt', color: '#6366f1', bg: '#eef2ff' },
};

const entityConfig = {
  INVOICE: { label: 'Hóa đơn' },
  CONTRACT: { label: 'Hợp đồng' },
  VEHICLE: { label: 'Phương tiện' },
  APARTMENT: { label: 'Căn hộ' },
  RESIDENT: { label: 'Cư dân' },
  USER: { label: 'Tài khoản' },
  PAYMENT: { label: 'Thanh toán' },
  DEVICE: { label: 'Thiết bị' },
  MAINTENANCE: { label: 'Bảo trì' },
  NOTIFICATION: { label: 'Thông báo' },
  FEEDBACK: { label: 'Phản hồi' },
};

const roleConfig = {
  ADMIN: { label: 'Admin', color: '#7c3aed', bg: '#ede9fe' },
  RESIDENT: { label: 'Cư dân', color: '#0891b2', bg: '#cffafe' },
  TECHNICIAN: { label: 'Kỹ thuật', color: '#f59e0b', bg: '#fef3c7' },
  SYSTEM: { label: 'Hệ thống', color: '#6b7280', bg: '#f3f4f6' },
};

const ENTITY_TYPES = [
  { value: '', label: 'Tất cả' },
  ...Object.entries(entityConfig).map(([k, v]) => ({ value: k, label: v.label })),
];

const ACTIONS = [
  { value: '', label: 'Tất cả' },
  ...Object.entries(actionConfig).map(([k, v]) => ({ value: k, label: v.label })),
];

/* ─── helpers ─── */
const formatDate = (dt) => {
  if (!dt) return '—';
  const d = new Date(dt);
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return { time, date };
};

/* ─── icons ─── */
const Icons = {
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  chevronLeft: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>,
  chevronRight: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>,
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [keyword, setKeyword] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: pageSize };
      if (entityType) params.entityType = entityType;
      if (action) params.action = action;
      if (performedBy.trim()) params.performedBy = performedBy.trim();
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (keyword.trim()) params.keyword = keyword.trim();

      const res = await auditLogService.getAll(params);
      const data = res.data?.data;
      setLogs(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch {
      toast.error('Không thể tải nhật ký');
    } finally {
      setLoading(false);
    }
  }, [page, entityType, action, performedBy, dateFrom, dateTo, keyword]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSearch = () => { setPage(0); fetchLogs(); };
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  const clearFilters = () => {
    setEntityType(''); setAction(''); setPerformedBy('');
    setDateFrom(''); setDateTo(''); setKeyword('');
    setPage(0);
  };

  const hasFilters = entityType || action || performedBy.trim() || dateFrom || dateTo || keyword.trim();

  const handleExport = () => {
    if (logs.length === 0) { toast.warning('Không có dữ liệu để xuất'); return; }
    const fmtDt = (dt) => { const f = formatDate(dt); return `${f.time} ${f.date}`; };
    exportToExcel(logs, [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Thời gian', key: 'createdAt', width: 22, transform: (r) => fmtDt(r.createdAt) },
      { header: 'Người thực hiện', key: 'performedBy', width: 16 },
      { header: 'Vai trò', key: 'performerRole', width: 10 },
      { header: 'Hành động', key: 'action', width: 14, transform: (r) => actionConfig[r.action]?.label || r.action },
      { header: 'Module', key: 'entityType', width: 14, transform: (r) => entityConfig[r.entityType]?.label || r.entityType },
      { header: 'ID đối tượng', key: 'entityId', width: 12 },
      { header: 'Chi tiết', key: 'details', width: 40 },
    ], `nhat-ky_${new Date().toISOString().slice(0, 10)}`, 'Nhật ký');
    toast.success('Xuất Excel thành công!');
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page__header">
        <div>
          <h2 className="page__title">Nhật ký hệ thống</h2>
          <p className="page__desc">Lịch sử hoạt động của tất cả module ({totalElements} bản ghi)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn--ghost btn--sm" onClick={() => fetchLogs()} title="Làm mới">
            <span className="btn__icon">{Icons.refresh}</span>
          </button>
          <button className="btn btn--primary btn--sm" onClick={handleExport}>
            <span className="btn__icon">{Icons.download}</span> Xuất Excel
          </button>
        </div>
      </div>

      {/* Filters - 2 rows */}
      <div className="audit-filters">
        <div className="audit-filters__row">
          <div className="filter-group">
            <label className="filter-label">Module:</label>
            <div className="filter-tabs">
              {ENTITY_TYPES.map((et) => (
                <button key={et.value}
                  className={`filter-tab ${entityType === et.value ? 'filter-tab--active' : ''}`}
                  onClick={() => { setEntityType(et.value); setPage(0); }}
                >{et.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="audit-filters__row">
          <div className="filter-group">
            <label className="filter-label">Hành động:</label>
            <div className="filter-tabs">
              {ACTIONS.map((a) => (
                <button key={a.value}
                  className={`filter-tab ${action === a.value ? 'filter-tab--active' : ''}`}
                  onClick={() => { setAction(a.value); setPage(0); }}
                >{a.label}</button>
              ))}
            </div>
          </div>
          <div className="audit-filters__inputs">
            <input type="text" className="form-input" placeholder="Người thực hiện..."
              value={performedBy} onChange={(e) => setPerformedBy(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ width: 130, fontSize: '12px', padding: '6px 10px' }} />
            <input type="date" className="form-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              lang="vi" style={{ width: 130, fontSize: '12px', padding: '6px 10px' }} title="Từ ngày" />
            <input type="date" className="form-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              lang="vi" style={{ width: 130, fontSize: '12px', padding: '6px 10px' }} title="Đến ngày" />
            <div className="search-box" style={{ minWidth: 170 }}>
              <span className="search-box__icon">{Icons.search}</span>
              <input type="text" className="search-input" placeholder="Tìm kiếm..."
                value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={handleKeyDown}
                style={{ fontSize: '12px', padding: '6px 10px 6px 32px' }} />
            </div>
            <button className="btn btn--ghost btn--sm" onClick={handleSearch} style={{ padding: '6px 10px' }}>
              <span className="btn__icon">{Icons.search}</span>
            </button>
            {hasFilters && (
              <button className="btn btn--ghost btn--sm" onClick={clearFilters}
                style={{ padding: '6px 10px', color: '#ef4444', fontSize: '11px', whiteSpace: 'nowrap' }}>✕ Xóa lọc</button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="page__table-wrapper">
        {loading ? (
          <div className="page__loading"><div className="spinner" /><span>Đang tải...</span></div>
        ) : logs.length === 0 ? (
          <div className="page__empty"><p>{hasFilters ? 'Không tìm thấy bản ghi phù hợp' : 'Chưa có nhật ký nào'}</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Thời gian</th>
                <th style={{ width: 140 }}>Người thực hiện</th>
                <th style={{ width: 110 }}>Hành động</th>
                <th style={{ width: 110 }}>Module</th>
                <th>Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const ac = actionConfig[log.action] || { label: log.action, color: '#6b7280', bg: '#f3f4f6' };
                const ec = entityConfig[log.entityType] || { label: log.entityType };
                const rc = roleConfig[log.performerRole] || roleConfig.SYSTEM;
                const dt = formatDate(log.createdAt);

                return (
                  <tr key={log.id}>
                    {/* Thời gian */}
                    <td>
                      <div style={{ lineHeight: 1.4 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>{dt.time}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{dt.date}</div>
                      </div>
                    </td>

                    {/* Người thực hiện + vai trò */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 700, flexShrink: 0,
                          background: rc.bg, color: rc.color
                        }}>
                          {(log.performedBy || '?')[0].toUpperCase()}
                        </div>
                        <div style={{ lineHeight: 1.3 }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b' }}>{log.performedBy || 'System'}</div>
                          <div style={{ fontSize: '10px', color: rc.color, fontWeight: 500 }}>{rc.label}</div>
                        </div>
                      </div>
                    </td>

                    {/* Hành động */}
                    <td>
                      <span className="badge" style={{ color: ac.color, backgroundColor: ac.bg, fontSize: '11px' }}>
                        {ac.label}
                      </span>
                    </td>

                    {/* Module */}
                    <td>
                      <span style={{ fontSize: '12.5px', fontWeight: 500, color: '#475569' }}>
                        {ec.label}
                        {log.entityId && <span style={{ color: '#94a3b8', marginLeft: 4, fontSize: '11px' }}>#{log.entityId}</span>}
                      </span>
                    </td>

                    {/* Mô tả */}
                    <td>
                      <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.4 }}
                        title={[log.entityName, log.details].filter(Boolean).join(' — ')}>
                        {log.entityName && <span style={{ fontWeight: 600, color: '#1e293b', marginRight: 4 }}>{log.entityName}</span>}
                        {log.details && <span>{log.details}</span>}
                        {!log.entityName && !log.details && <span style={{ color: '#cbd5e1' }}>—</span>}
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
            <button className="pagination__btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>{Icons.chevronLeft}</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i;
              else if (page < 3) pageNum = i;
              else if (page > totalPages - 4) pageNum = totalPages - 5 + i;
              else pageNum = page - 2 + i;
              return (
                <button key={pageNum} className={`pagination__btn pagination__btn--num ${page === pageNum ? 'pagination__btn--active' : ''}`}
                  onClick={() => setPage(pageNum)}>{pageNum + 1}</button>
              );
            })}
            <button className="pagination__btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>{Icons.chevronRight}</button>
            <button className="pagination__btn" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)} title="Trang cuối">»»</button>
          </div>
        </div>
      )}
    </div>
  );
}
