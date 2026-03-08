import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationBell } from '../../pages/Dashboardwidgets';
import { Suspense, useState, useRef, useEffect } from 'react';
import { SkeletonDashboard } from '../Skeleton';
import { announcementsApi } from '../../services/api';
import { useQuery } from '@tanstack/react-query';
export const Layout = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [openSections, setOpenSections] = useState<string[]>(['General']);
  const [floatingSection, setFloatingSection] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isManager = user?.role === 'Manager';


  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  const { data: unreadData } = useQuery({
    queryKey: ['announcementUnread'],
    queryFn:  () => announcementsApi.getUnreadCount().then((r) => r.data),
    refetchInterval: 60_000,   // poll every 60s as a fallback
  });
  const announcementUnread: number = unreadData?.count ?? 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setFloatingSection(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // EMPLOYEE NAVIGATION ITEMS
  // ═══════════════════════════════════════════════════════════════════════
  const navSections = [
    {
      title: 'General',
      icon: '🏠',
      items: [
        { to: '/', label: 'Dashboard', icon: '🏠', exact: true },
        { to: '/analytics', label: 'Analytics', icon: '📊' },
        { to: '/history', label: 'History', icon: '📅' },
        { to: '/chat', icon: '💬', label: 'Messages' },
        { to: '/kudos', label: 'Kudos', icon: '🏆' },
        { to: '/announcements', label: 'Announcements', icon: '📢', badge: announcementUnread },
        { to: '/profile', label: 'My Profile', icon: '👤' }, 
      ],
    },
    {
      title: 'Work Management',
      icon: '📋',
      items: [
        { to: '/tasks', label: 'Tasks', icon: '✅' },
        { to: '/eod-reports', label: 'EOD Reports', icon: '📝' },
        { to: '/my-eod-reviews', label: 'My Reviews', icon: '📌' },
        { to: '/my-report', label: 'My Report', icon: '📥' },
        { to: '/Goals', icon: '🎯', label: 'Goals' },
        { to: '/Goal history', icon: '📈', label: 'Goal History' },
        { to: '/support', label: 'Support', icon: '🤝' },
      ],
    },
    {
      title: 'HR & Requests',
      icon: '🧑',
      items: [
        { to: '/leave', label: 'Leave', icon: '🗓️' },
        { to: '/request', label: 'WFH Requests', icon: '🏡' },
        { to: '/team/directory', label: 'Directory',    icon: '👥' },
        { to: '/team/calendar', label: 'Team Calendar', icon: '📅' },
      ],
    },
    {
      title: 'System',
      icon: '⚙️',
      items: [
        { to: '/security', label: 'Security (2FA)', icon: '🔐' }
      ],
    },
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // MANAGER NAVIGATION ITEMS
  // ═══════════════════════════════════════════════════════════════════════
    const managerSection = {
      title: 'Manager',
      icon: '👨‍💼',
      items: [
        { to: '/manager', label: 'Team Dashboard', icon: '📋' },
        { to: '/manager/assign-role', label: 'Assign Roles', icon: '👥' },  
        { to: '/manager/eod-reviews', label: 'EOD Reviews', icon: '📝' },
        { to: '/manager/wfh-dashboard', label: 'Employee Attendance', icon: '🗓️' },
      ],
    };

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
      {/* SIDEBAR */}
      <aside
        ref={sidebarRef}
        className={`${collapsed ? 'w-20' : 'w-64'} transition-all duration-300 flex-shrink-0 flex flex-col border-r 
        ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
      >
        {/* Logo Section */}
        <div className="p-2 border-b border-slate-800/50 text-center relative">
          {/* Collapse Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center 
                      rounded-md hover:bg-slate-700 transition"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Logo Container */}
          <div
            className={`
              ${collapsed ? 'w-12 h-12' : 'h-16'} 
              mx-auto mb-2 bg-white rounded-lg 
              flex items-center justify-center 
              shadow-md overflow-hidden transition-all duration-300
            `}
          >
            <img
              src="/montcrest_software_pvt_ltd_cover.jpg"
              alt="Montcrest Software"
              className="w-full h-full object-contain p-2"
            />
          </div>

          {/* System Name */}
          {!collapsed && (
            <p className="font-bold text-lg text-white tracking-wide">
              EMS System
            </p>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-2 overflow-y-auto space-y-2">
          {navSections.map((section) => {
            const isOpen = openSections.includes(section.title);

            return (
              <div key={section.title}>
                {/* Section Header */}
                <button
                  onClick={() => {
                    if (collapsed) {
                      setFloatingSection(
                        floatingSection === section.title ? null : section.title
                      );
                    } else {
                      toggleSection(section.title);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold
                    ${isDark
                      ? 'text-slate-400 hover:bg-slate-800'
                      : 'text-slate-600 hover:bg-slate-200'}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span>{section.icon}</span>
                    {!collapsed && section.title}
                  </div>
                  {!collapsed && (
                    <span className="flex flex-col justify-center items-center gap-[3px]">
                      <span
                        className={`h-[2px] w-4 bg-current transition-all duration-300 ${
                          isOpen ? 'rotate-45 translate-y-[5px]' : ''
                        }`}
                      />
                      <span
                        className={`h-[2px] w-4 bg-current transition-all duration-300 ${
                          isOpen ? 'opacity-0' : ''
                        }`}
                      />
                      <span
                        className={`h-[2px] w-4 bg-current transition-all duration-300 ${
                          isOpen ? '-rotate-45 -translate-y-[5px]' : ''
                        }`}
                      />
                    </span>
                  )}
                </button>

                {/* Expanded Mode Items */}
                {!collapsed && isOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.exact}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                          ${isActive
                            ? 'bg-blue-600/20 text-blue-400'
                            : isDark
                            ? 'text-slate-400 hover:bg-slate-800'
                            : 'text-slate-600 hover:bg-slate-200'}`
                        }
                      >
                        <span>{item.icon}</span>
                        {item.label}
                        {/* ↓ ADD THIS */}
                          {'badge' in item && (item as any).badge > 0 && (
                            <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                              {(item as any).badge > 99 ? '99+' : (item as any).badge}
                            </span>
                          )}
                      </NavLink>
                    ))}
                  </div>
                )}

                {/* Collapsed Floating Popup */}
                {collapsed && floatingSection === section.title && (
                  <div className="absolute left-20 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-2 z-50">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.exact}
                        onClick={() => setFloatingSection(null)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                          ${isActive
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-slate-400 hover:bg-slate-800'}`
                        }
                      >
                        <span>{item.icon}</span>
                        {item.label}
                          {/* ↓ ADD THIS */}
                          {'badge' in item && (item as any).badge > 0 && (
                            <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                              {(item as any).badge > 99 ? '99+' : (item as any).badge}
                            </span>
                          )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Manager Section */}
          {isManager && (
            <div>
              <button
                onClick={() => {
                  if (collapsed) {
                    setFloatingSection(
                      floatingSection === managerSection.title
                        ? null
                        : managerSection.title
                    );
                  } else {
                    toggleSection(managerSection.title);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold
                  ${isDark
                    ? 'text-violet-400 hover:bg-slate-800'
                    : 'text-violet-600 hover:bg-slate-200'}
                `}
              >
                <div className="flex items-center gap-2">
                  <span>{managerSection.icon}</span>
                  {!collapsed && managerSection.title}
                </div>

                {/* 3-Line Animated Icon */}
                {!collapsed && (
                  <span className="flex flex-col justify-center items-center gap-[3px]">
                    <span
                      className={`h-[2px] w-4 bg-current transition-all duration-300 ${
                        openSections.includes(managerSection.title)
                          ? 'rotate-45 translate-y-[5px]'
                          : ''
                      }`}
                    />
                    <span
                      className={`h-[2px] w-4 bg-current transition-all duration-300 ${
                        openSections.includes(managerSection.title)
                          ? 'opacity-0'
                          : ''
                      }`}
                    />
                    <span
                      className={`h-[2px] w-4 bg-current transition-all duration-300 ${
                        openSections.includes(managerSection.title)
                          ? '-rotate-45 -translate-y-[5px]'
                          : ''
                      }`}
                    />
                  </span>
                )}
              </button>

              {/* Manager Items */}
              {!collapsed && openSections.includes(managerSection.title) && (
                <div className="ml-6 mt-1 space-y-1">
                  {managerSection.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                        ${isActive
                          ? 'bg-violet-600/20 text-violet-400'
                          : isDark
                          ? 'text-slate-400 hover:bg-slate-800'
                          : 'text-slate-600 hover:bg-slate-200'}`
                      }
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}

              {/* Collapsed Floating Menu */}
              {collapsed && floatingSection === managerSection.title && (
                <div className="absolute left-20 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-2 z-50">
                  {managerSection.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setFloatingSection(null)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                        ${
                          isActive
                            ? 'bg-violet-600/20 text-violet-400'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`
                      }
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* ─── User Profile Section ─────────────────────────────────────── */}
        <div ref={profileRef} className="p-3 border-t border-slate-800/50 relative">
          {/* Clickable User Row */}
          <div
            onClick={() => setProfileOpen(!profileOpen)}
            className={`flex items-center gap-2 px-2 mb-2 cursor-pointer rounded-xl 
            hover:bg-slate-800/50 transition ${collapsed ? 'justify-center' : ''}`}
          >
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 
              flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>

            {/* User Info */}
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate text-white">{user?.fullName}</p>
                <p className="text-xs text-slate-500">{user?.role}</p>
              </div>
            )}

            {/* Notification Bell */}
            {!collapsed && (
              <div onClick={(e) => e.stopPropagation()}>
                <NotificationBell />
              </div>
            )}
          </div>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div
              className={`
                absolute 
                ${collapsed ? 'left-16' : 'left-3'} 
                bottom-16 
                w-44 
                bg-slate-900 
                border border-slate-700 
                rounded-xl 
                shadow-xl 
                p-2
                z-50
              `}
            >
              {/* Theme Toggle Button */}
              <button
                onClick={() => {
                  toggleTheme();
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 text-xs py-2 px-3 rounded-xl 
                bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition mb-1"
              >
                {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>

              {/* Sign Out Button */}
              <button
                onClick={() => {
                  logout();
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 text-xs py-2 px-3 rounded-xl 
                bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ═════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ═════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<SkeletonDashboard />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};