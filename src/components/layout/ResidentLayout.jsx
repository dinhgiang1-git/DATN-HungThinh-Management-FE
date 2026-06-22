import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import ResidentSidebar from './ResidentSidebar';
import ResidentHeader from './ResidentHeader';

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

export default function ResidentLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(isMobileViewport);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const handleChange = () => {
      setIsMobile(media.matches);
      setSidebarOpen(false);
    };

    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isMobile || !sidebarOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, sidebarOpen]);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen((open) => !open);
      return;
    }
    setSidebarCollapsed((collapsed) => !collapsed);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className={`layout ${sidebarCollapsed ? 'layout--collapsed' : ''} ${sidebarOpen ? 'layout--sidebar-open' : ''}`}>
      <ResidentSidebar collapsed={!isMobile && sidebarCollapsed} onNavigate={handleCloseSidebar} />
      <button
        type="button"
        className="layout__backdrop"
        aria-label="Đóng menu"
        onClick={handleCloseSidebar}
      />
      <div className="layout__main">
        <ResidentHeader onToggleSidebar={handleToggleSidebar} />
        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
