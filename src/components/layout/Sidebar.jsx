import { useState, useEffect, useCallback } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import badgeService from '../../services/badgeService';
import logo from '../../assets/Gemini-logo.png';

const menuItems = [
  {
    label: 'TRANG CHỦ',
    path: '/',
    roles: ['ADMIN', 'TECHNICIAN'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'TÀI KHOẢN',
    roles: ['ADMIN'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    children: [
      { label: 'Người dùng', path: '/users' },
      { label: 'Cư dân', path: '/residents' },
    ],
  },
  {
    label: 'QUẢN LÝ',
    roles: ['ADMIN', 'TECHNICIAN'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    children: [
      { label: 'Căn hộ', path: '/apartments', roles: ['ADMIN'] },
      { label: 'Thiết bị', path: '/devices', roles: ['ADMIN', 'TECHNICIAN'] },
    ],
  },
  {
    label: 'THÔNG BÁO & PHẢN ÁNH',
    roles: ['ADMIN', 'TECHNICIAN'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    children: [
      { label: 'Thông báo', path: '/notifications', roles: ['ADMIN', 'TECHNICIAN'] },
      { label: 'Phản hồi', path: '/feedbacks', roles: ['ADMIN'], badgeKey: 'pendingFeedbacks' },
    ],
  },
  {
    label: 'TÀI CHÍNH',
    roles: ['ADMIN'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    children: [
      { label: 'Hóa đơn', path: '/invoices', badgeKey: 'unpaidInvoices' },
      { label: 'Hợp đồng', path: '/contracts' },
    ],
  },
  {
    label: 'VẬN HÀNH',
    roles: ['ADMIN', 'TECHNICIAN'],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    children: [
      { label: 'Bảo trì', path: '/maintenances', roles: ['ADMIN', 'TECHNICIAN'] },
      { label: 'Phương tiện', path: '/vehicles', roles: ['ADMIN'] },
      { label: 'Nhật ký', path: '/audit-logs', roles: ['ADMIN'] },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { user } = useAuth();
  const [openMenus, setOpenMenus] = useState({});
  const userRole = user?.role || 'ADMIN';

  // Badge counts
  const [badgeCounts, setBadgeCounts] = useState({});

  const fetchBadgeCounts = useCallback(async () => {
    if (userRole !== 'ADMIN') return;
    try {
      const res = await badgeService.getCounts();
      setBadgeCounts(res.data?.data || {});
    } catch {}
  }, [userRole]);

  useEffect(() => {
    fetchBadgeCounts();
    // Poll mỗi 30 giây
    const interval = setInterval(fetchBadgeCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchBadgeCounts]);

  // Filter menu items by role
  const filteredMenuItems = menuItems
    .filter((item) => !item.roles || item.roles.includes(userRole))
    .map((item) => {
      if (item.children) {
        const filteredChildren = item.children.filter(
          (child) => !child.roles || child.roles.includes(userRole)
        );
        return filteredChildren.length > 0 ? { ...item, children: filteredChildren } : null;
      }
      return item;
    })
    .filter(Boolean);

  const toggleMenu = (label, children) => {
    setOpenMenus((prev) => {
      const currentlyOpen = prev[label] !== undefined ? prev[label] : isChildActive(children);
      return { ...prev, [label]: !currentlyOpen };
    });
  };

  const isChildActive = (children) => {
    return children?.some((child) => location.pathname === child.path);
  };

  // Tính tổng badge cho parent group
  const getGroupBadge = (children) => {
    if (!children) return 0;
    return children.reduce((sum, child) => {
      if (child.badgeKey && badgeCounts[child.badgeKey]) {
        return sum + badgeCounts[child.badgeKey];
      }
      return sum;
    }, 0);
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Logo section */}
      <Link to="/" className="sidebar__logo" style={{ textDecoration: 'none', color: 'inherit' }}>
        <img src={logo} alt="Hung Thinh" className="sidebar__logo-img" />
        {!collapsed && (
          <div className="sidebar__logo-text">
            <span className="sidebar__logo-title">Hệ thống quản lý</span>
            <span className="sidebar__logo-desc">Chung cư Hưng Thịnh</span>
          </div>
        )}
      </Link>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {filteredMenuItems.map((item) => {
          if (item.path) {
            // Direct link (TRANG CHỦ)
            return (
              <NavLink
                key={item.label}
                to={item.path}
                end
                className={({ isActive }) =>
                  `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
                }
              >
                <span className="sidebar__item-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar__item-label">{item.label}</span>}
              </NavLink>
            );
          }

          // Dropdown menu
          const isOpen = openMenus[item.label] !== undefined ? openMenus[item.label] : isChildActive(item.children);
          const groupBadge = getGroupBadge(item.children);

          return (
            <div key={item.label} className="sidebar__group">
              <button
                className={`sidebar__item sidebar__item--parent ${isChildActive(item.children) ? 'sidebar__item--active' : ''}`}
                onClick={() => toggleMenu(item.label, item.children)}
              >
                <span className="sidebar__item-icon">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="sidebar__item-label">{item.label}</span>
                    <svg
                      className={`sidebar__chevron ${isOpen ? 'sidebar__chevron--open' : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </>
                )}
              </button>
              {!collapsed && isOpen && (
                <div className="sidebar__submenu">
                  {item.children.map((child) => {
                    const count = child.badgeKey ? badgeCounts[child.badgeKey] || 0 : 0;
                    return (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          `sidebar__subitem ${isActive ? 'sidebar__subitem--active' : ''}`
                        }
                      >
                        <span className="sidebar__subitem-dot" />
                        {child.label}
                        {count > 0 && (
                          <span className="sidebar__badge">{count > 99 ? '99+' : count}</span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
