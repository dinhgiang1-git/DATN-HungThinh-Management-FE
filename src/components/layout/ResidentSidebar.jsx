import { useState, useEffect, useCallback } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSse } from '../../contexts/SseContext';
import apartmentService from '../../services/apartmentService';
import invoiceService from '../../services/invoiceService';
import feedbackService from '../../services/feedbackService';
import logo from '../../assets/Gemini-logo.png';

const residentMenu = [
  {
    label: 'Trang chủ',
    path: '/resident/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Hóa đơn',
    path: '/resident/invoices',
    badgeKey: 'unpaidInvoices',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Hợp đồng',
    path: '/resident/contracts',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 15l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Thành viên',
    path: '/resident/members',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Phương tiện',
    path: '/resident/vehicles',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 3H8l-4 6h16l-4-6z" /><rect x="2" y="9" width="20" height="8" rx="2" />
        <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
      </svg>
    ),
  },
  {
    label: 'Phản hồi',
    path: '/resident/feedbacks',
    badgeKey: 'pendingFeedbacks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Thông báo',
    path: '/resident/notifications',
    badgeKey: 'notifications',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

const technicianMenu = [
  {
    label: 'Trang chủ',
    path: '/resident/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Thông báo',
    path: '/resident/notifications',
    badgeKey: 'notifications',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

export default function ResidentSidebar({ collapsed, onNavigate }) {
  const { user } = useAuth();
  const { newCount } = useSse();
  const menu = user?.role === 'TECHNICIAN' ? technicianMenu : residentMenu;

  const [badgeCounts, setBadgeCounts] = useState({});

  const fetchBadgeCounts = useCallback(async () => {
    if (user?.role !== 'RESIDENT') return;
    try {
      const aptRes = await apartmentService.getByResident(user.id);
      const apt = aptRes?.data?.data;
      if (apt?.id) {
        const [invRes, pendingFbRes, inProgressFbRes] = await Promise.allSettled([
          invoiceService.getAll({ invoiceStatus: 'UNPAID', apartmentId: apt.id, page: 0, size: 1 }),
          feedbackService.getAll({ feedbackStatus: 'PENDING', apartmentId: apt.id, page: 0, size: 1 }),
          feedbackService.getAll({ feedbackStatus: 'IN_PROGRESS', apartmentId: apt.id, page: 0, size: 1 }),
        ]);
        const unpaidCount = invRes.status === 'fulfilled' ? invRes.value?.data?.data?.totalElements || 0 : 0;
        const pendingCount = pendingFbRes.status === 'fulfilled' ? pendingFbRes.value?.data?.data?.totalElements || 0 : 0;
        const inProgressCount = inProgressFbRes.status === 'fulfilled' ? inProgressFbRes.value?.data?.data?.totalElements || 0 : 0;
        setBadgeCounts({
          unpaidInvoices: unpaidCount,
          pendingFeedbacks: pendingCount + inProgressCount,
        });
      }
    } catch {
      setBadgeCounts({});
    }
  }, [user]);

  useEffect(() => {
    const loadBadgeCounts = async () => {
      await fetchBadgeCounts();
    };
    loadBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchBadgeCounts]);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`} id="resident-sidebar">
      <Link to="/resident/dashboard" className="sidebar__logo" style={{ textDecoration: 'none', color: 'inherit' }} onClick={onNavigate}>
        <img src={logo} alt="Logo" className="sidebar__logo-img" />
        {!collapsed && (
          <div className="sidebar__logo-text">
            <span className="sidebar__logo-title">Cổng cư dân</span>
            <span className="sidebar__logo-desc">Chung cư Hưng Thịnh</span>
          </div>
        )}
      </Link>

      <nav className="sidebar__nav">
        {menu.map((item) => {
          let badgeCount = item.badgeKey === 'notifications'
            ? newCount
            : (item.badgeKey ? badgeCounts[item.badgeKey] || 0 : 0);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/resident/dashboard'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar__item-icon">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="sidebar__item-label">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="sidebar__badge">{badgeCount > 99 ? '99+' : badgeCount}</span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="sidebar__role">
          <div className="sidebar__role-badge">
            {user?.role === 'TECHNICIAN' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            )}
            <span>{user?.role === 'TECHNICIAN' ? 'Kỹ thuật viên' : 'Cư dân'}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
