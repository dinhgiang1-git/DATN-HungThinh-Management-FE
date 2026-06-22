import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import auditLogService from '../services/auditLogService';
import { exportToExcel } from '../utils/exportExcel';
import DropdownSelect from '../components/common/DropdownSelect';

const actionConfig = {
  CREATE: { label: 'Tạo mới', tone: 'success' },
  UPDATE: { label: 'Cập nhật', tone: 'warning' },
  DELETE: { label: 'Xóa', tone: 'danger' },
  BATCH_CREATE: { label: 'Tạo hàng loạt', tone: 'info' },
  CONFIRM: { label: 'Xác nhận', tone: 'success' },
  LOGIN: { label: 'Đăng nhập', tone: 'auth' },
  PAYMENT_CALLBACK: { label: 'Callback thanh toán', tone: 'info' },
  FAILED: { label: 'Thất bại', tone: 'danger' },
  ACCESS: { label: 'Truy cập', tone: 'auth' },
};

const entityConfig = {
  AUTH: 'Xác thực',
  INVOICE: 'Hóa đơn',
  CONTRACT: 'Hợp đồng',
  VEHICLE: 'Phương tiện',
  APARTMENT: 'Căn hộ',
  RESIDENT: 'Cư dân',
  USER: 'Tài khoản',
  PAYMENT: 'Thanh toán',
  DEVICE: 'Thiết bị',
  MAINTENANCE: 'Bảo trì',
  NOTIFICATION: 'Thông báo',
  SYSTEM_NOTIFICATION: 'TB hệ thống',
  FEEDBACK: 'Phản hồi',
  TABLE_FEE: 'Bảng phí',
  ELECTRIC_TIER: 'Bậc điện',
  SYSTEM: 'Hệ thống',
};

const roleConfig = {
  ADMIN: 'Quản trị',
  RESIDENT: 'Cư dân',
  TECHNICIAN: 'Kỹ thuật',
  SYSTEM: 'Hệ thống',
  UNKNOWN: 'Không rõ',
};

const Icons = {
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
};

const pageSize = 20;

const formatDate = (value) => {
  if (!value) return { time: '--:--', date: '--/--/----' };
  const date = new Date(value);
  return {
    time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  };
};

const formatFilterDate = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const toApiDate = (value) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return '';
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
};

const getInitial = (value) => (value?.trim()?.[0] || 'S').toUpperCase();

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    performedBy: '',
    from: '',
    to: '',
    keyword: '',
  });

  const queryParams = useMemo(() => {
    const params = { page, size: pageSize };
    Object.entries(filters).forEach(([key, value]) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      if (key === 'from' || key === 'to') {
        const apiDate = toApiDate(trimmed);
        if (apiDate) params[key] = apiDate;
        return;
      }
      params[key] = trimmed;
    });
    return params;
  }, [page, filters]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditLogService.getAll(queryParams);
      const data = res.data?.data;
      setLogs(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch {
      toast.error('Không thể tải nhật ký hệ thống');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === 'from' || key === 'to' ? formatFilterDate(value) : value,
    }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({ entityType: '', action: '', performedBy: '', from: '', to: '', keyword: '' });
    setPage(0);
  };

  const hasFilters = Object.values(filters).some((value) => value.trim());
  const firstRecord = totalElements ? page * pageSize + 1 : 0;
  const lastRecord = Math.min((page + 1) * pageSize, totalElements);
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i;
    if (page < 2) return i;
    if (page > totalPages - 3) return totalPages - 5 + i;
    return page - 2 + i;
  });

  const handleExport = () => {
    if (!logs.length) {
      toast.warning('Không có dữ liệu để xuất');
      return;
    }

    exportToExcel(logs, [
      { header: 'Thời gian', key: 'createdAt', width: 22, transform: (r) => `${formatDate(r.createdAt).time} ${formatDate(r.createdAt).date}` },
      { header: 'Người thực hiện', key: 'performedBy', width: 18 },
      { header: 'Vai trò', key: 'performerRole', width: 14, transform: (r) => roleConfig[r.performerRole] || r.performerRole },
      { header: 'Hành động', key: 'action', width: 18, transform: (r) => actionConfig[r.action]?.label || r.action },
      { header: 'Module', key: 'entityType', width: 18, transform: (r) => entityConfig[r.entityType] || r.entityType },
      { header: 'Đối tượng', key: 'entityName', width: 24 },
      { header: 'Đường dẫn', key: 'requestPath', width: 36 },
      { header: 'Trạng thái', key: 'statusCode', width: 12 },
      { header: 'Chi tiết', key: 'details', width: 50 },
    ], `nhat-ky-he-thong_${new Date().toISOString().slice(0, 10)}`, 'Nhật ký');
    toast.success('Xuất Excel thành công');
  };

  return (
    <div className="page audit-page">
      <div className="page__header audit-page__header">
        <div>
          <h2 className="page__title">Nhật ký hệ thống</h2>
          <p className="page__desc">Theo dõi các thao tác quản trị quan trọng ({totalElements} bản ghi).</p>
        </div>
        <div className="audit-page__actions">
          <button className="btn btn--ghost btn--sm" onClick={fetchLogs} title="Làm mới">
            <span className="btn__icon">{Icons.refresh}</span>
          </button>
          <button className="btn btn--primary btn--sm" onClick={handleExport}>
            <span className="btn__icon">{Icons.download}</span> Xuất Excel
          </button>
        </div>
      </div>

      <div className="audit-toolbar">
        <div className="audit-toolbar__search">
          <label>Tìm kiếm</label>
          <span>{Icons.search}</span>
          <input
            value={filters.keyword}
            onChange={(e) => updateFilter('keyword', e.target.value)}
            placeholder="Tìm theo mô tả hoặc đối tượng..."
          />
        </div>
        <label className="audit-filter-field">
          <span>Module</span>
          <DropdownSelect
            value={filters.entityType}
            onChange={(value) => updateFilter('entityType', value)}
            options={[
              { value: '', label: 'Tất cả module' },
              ...Object.entries(entityConfig).map(([value, label]) => ({ value, label })),
            ]}
          />
        </label>
        <label className="audit-filter-field">
          <span>Hành động</span>
          <DropdownSelect
            value={filters.action}
            onChange={(value) => updateFilter('action', value)}
            options={[
              { value: '', label: 'Tất cả hành động' },
              ...Object.entries(actionConfig).map(([value, config]) => ({ value, label: config.label })),
            ]}
          />
        </label>
        <label className="audit-filter-field audit-filter-field--person">
          <span>Người thực hiện</span>
          <input value={filters.performedBy} onChange={(e) => updateFilter('performedBy', e.target.value)} placeholder="VD: admin" />
        </label>
        <label className="audit-filter-field audit-filter-field--date">
          <span>Từ ngày</span>
          <input inputMode="numeric" value={filters.from} onChange={(e) => updateFilter('from', e.target.value)} placeholder="dd/MM/yyyy" />
        </label>
        <label className="audit-filter-field audit-filter-field--date">
          <span>Đến ngày</span>
          <input inputMode="numeric" value={filters.to} onChange={(e) => updateFilter('to', e.target.value)} placeholder="dd/MM/yyyy" />
        </label>
        {hasFilters && <button className="btn btn--ghost btn--sm audit-clear-btn" onClick={clearFilters}>Xóa lọc</button>}
      </div>

      <div className="page__table-wrapper audit-table">
        <div className="audit-table__topbar">
          <div>
            <strong>Danh sách nhật ký</strong>
            <span>{totalElements} bản ghi, sắp xếp mới nhất trước</span>
          </div>
        </div>
        {loading ? (
          <div className="page__loading"><div className="spinner" /><span>Đang tải...</span></div>
        ) : logs.length === 0 ? (
          <div className="page__empty"><p>{hasFilters ? 'Không có nhật ký phù hợp bộ lọc' : 'Chưa có nhật ký hệ thống'}</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="audit-table__time-col">Thời gian</th>
                <th className="audit-table__user-col">Người thực hiện</th>
                <th className="audit-table__activity-col">Hoạt động</th>
                <th>Nội dung</th>
                <th className="audit-table__status-col">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const action = actionConfig[log.action] || { label: log.action, tone: 'neutral' };
                const dt = formatDate(log.createdAt);
                const isFailed = log.statusCode >= 400 || log.action === 'FAILED';
                const statusTone = isFailed ? 'danger' : 'success';
                const statusLabel = isFailed ? 'Lỗi' : 'Thành công';

                return (
                  <tr className={`audit-log-row audit-log-row--${action.tone}`} key={log.id}>
                    <td className="audit-table__time-cell">
                      <div className="audit-time">
                        <strong>{dt.time}</strong>
                        <span>{dt.date}</span>
                      </div>
                    </td>
                    <td className="audit-table__user-cell">
                      <div className="audit-user-wrap">
                        <span className="audit-avatar">{getInitial(log.performedBy)}</span>
                        <div className="audit-user">
                          <strong>{log.performedBy || 'SYSTEM'}</strong>
                          <span>{roleConfig[log.performerRole] || log.performerRole || 'Không rõ'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="audit-table__activity-cell">
                      <div className="audit-activity">
                        <span className={`audit-chip audit-chip--${action.tone}`}>{action.label}</span>
                        <span className="audit-module-pill">{entityConfig[log.entityType] || log.entityType}</span>
                      </div>
                    </td>
                    <td className="audit-table__detail-cell">
                      <div className="audit-detail" title={[log.entityName, log.details].filter(Boolean).join(' - ')}>
                        {log.entityName && <strong>{log.entityName}</strong>}
                        <span>{log.details || 'Không có mô tả chi tiết'}</span>
                      </div>
                    </td>
                    <td className="audit-table__status-cell">
                      <span className={`audit-status audit-status--${statusTone}`}>
                        <i />
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="pagination audit-pagination">
            <span className="pagination__info">
              Hiển thị {firstRecord}-{lastRecord} trong {totalElements} bản ghi
            </span>
            <div className="pagination__btns">
              <button className="pagination__btn" disabled={page === 0} onClick={() => setPage(0)}>Đầu</button>
              <button className="pagination__btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Trước</button>
              {pageNumbers.map((pageNum) => (
                <button
                  key={pageNum}
                  className={`pagination__btn pagination__btn--num ${page === pageNum ? 'pagination__btn--active' : ''}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum + 1}
                </button>
              ))}
              <button className="pagination__btn" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Sau</button>
              <button className="pagination__btn" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>Cuối</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
