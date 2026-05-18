import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRole } from './RoleContext';
import { ROLES } from '../types';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface LayoutProps {
  children: ReactNode;
  breadcrumbs: BreadcrumbItem[];
}

const menuItems = [
  {
    label: 'Lenh thanh toan',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <line x1="2" y1="9" x2="22" y2="9" />
        <line x1="8" y1="3" x2="8" y2="9" />
      </svg>
    ),
    path: '/payment-orders',
  },
  {
    label: 'Tra cuu',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
    ),
    path: '#',
  },
  {
    label: 'Bao cao',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-8 4 4 4-6" />
      </svg>
    ),
    path: '#',
  },
  {
    label: 'Phan quyen',
    icon: (
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    path: '#',
  },
];

export default function Layout({ children, breadcrumbs }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { role, roleInfo, setRole } = useRole();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f4f6fa' }}>
      {/* Top bar */}
      <header
        className="flex items-center px-5 shrink-0 z-30"
        style={{
          height: 54,
          background: 'linear-gradient(90deg, #073763, #0b5394)',
          color: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,.12)',
        }}
      >
        <button
          type="button"
          className="mr-3 p-1 rounded hover:bg-white/10"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <div
          className="flex items-center justify-center font-extrabold text-sm tracking-wide mr-3 rounded-md"
          style={{ width: 34, height: 34, background: '#fff', color: '#073763' }}
        >
          TT
        </div>
        <div className="flex flex-col leading-tight">
          <strong className="text-sm font-semibold">VDBAS - Quan ly Thanh toan</strong>
          <small className="text-[11px] opacity-85">Quan ly Lenh thanh toan lien ngan hang va song phuong</small>
        </div>

        <div className="flex-1" />

        {/* Role Switcher */}
        <div className="flex items-center gap-2 mr-4">
          <span className="text-[11px] opacity-75">Vai trò:</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="text-xs font-semibold rounded px-2 py-1 border-0 cursor-pointer"
            style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}
          >
            {ROLES.map((r) => (
              <option key={r.role} value={r.role} style={{ color: '#333' }}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* User */}
        <div className="flex items-center rounded-full py-1 px-3 gap-2" style={{ background: 'rgba(255,255,255,.12)' }}>
          <div
            className="flex items-center justify-center font-bold text-[11px] rounded-full"
            style={{ width: 22, height: 22, background: roleInfo.color, color: '#fff' }}
          >
            {roleInfo.shortLabel}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold">{roleInfo.label}</span>
            <small className="text-[10.5px] opacity-85">KBNN Hà Nội</small>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside
            className="shrink-0 flex flex-col border-r py-2"
            style={{ width: 220, background: '#fff', borderColor: '#d7dbe0' }}
          >
            {menuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path) && item.path !== '#';
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'text-[#073763] font-semibold bg-[#e7f0f9]'
                      : 'text-[#5f6368] hover:bg-[#f4f6fa] hover:text-[#0b5394]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </aside>
        )}

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-auto">
          {/* Breadcrumb */}
          <nav
            className="px-5 py-2 text-xs shrink-0 border-b"
            style={{ background: '#fff', color: '#5f6368', borderColor: '#d7dbe0' }}
          >
            {breadcrumbs.map((crumb, i) => (
              <span key={i}>
                {crumb.path && i < breadcrumbs.length - 1 ? (
                  <>
                    <Link to={crumb.path} className="font-medium" style={{ color: '#0b5394' }}>
                      {crumb.label}
                    </Link>
                    <span className="mx-1.5 text-gray-400">{'>'}</span>
                  </>
                ) : (
                  <span className="font-semibold text-[#1f2328]">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>

          {/* Page content */}
          <main className="flex-1 p-4 pb-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
