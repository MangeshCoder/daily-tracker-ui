import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationBell } from '../../pages/Dashboardwidgets';
import { Suspense, useState,useRef,useEffect } from 'react';
import { SkeletonDashboard } from '../Skeleton';

export const Layout = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
const [profileOpen, setProfileOpen] = useState(false);
const profileRef = useRef<HTMLDivElement>(null);

  const isManager = user?.role === 'Manager';

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

  const navItems = [
    { to: '/', icon: '🏠', label: 'Dashboard', exact: true },
    { to: '/tasks', icon: '✅', label: 'Tasks' },
    { to: '/support', icon: '🤝', label: 'Support' },
    { to: '/history', icon: '📅', label: 'History' },
    { to: '/analytics', icon: '📊', label: 'Analytics' },
    { to: '/kudos', icon: '🏆', label: 'Kudos' },
    { to: '/leave', icon: '🗓️', label: 'Leave' },
    { to: '/my-report', icon: '📥', label: 'My Report' },
    { to: '/security', icon: '🔐', label: 'Security (2FA)' },
    { to: '/request', icon: '🏡', label: 'WFH Requests' }
  ];

  const managerItems = [
    { to: '/manager', icon: '📋', label: 'Team Dashboard' },
    { to: '/manager/wfh-dashboard', icon: '🗓️', label: 'Employee Attendance' },
  ];

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>

      {/* Sidebar */}
      <aside
        className={`${collapsed ? 'w-20' : 'w-64'} transition-all duration-300 flex-shrink-0 flex flex-col border-r 
        ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
      >

      {/* Header */}
      {/* Logo Section */}
      <div className="p-2 border-b border-slate-800/50 text-center relative">

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center 
                    rounded-md hover:bg-slate-700 transition"
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

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl text-sm font-medium transition 
                ${isActive
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`
              }
            >
              <span>{item.icon}</span>
              {!collapsed && item.label}
            </NavLink>
          ))}

          {isManager && (
            <>
              {!collapsed && (
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 py-2 mt-4">
                  Manager
                </p>
              )}
              {managerItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl text-sm font-medium transition 
                    ${isActive
                      ? 'bg-violet-600/20 text-violet-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`
                  }
                >
                  <span>{item.icon}</span>
                  {!collapsed && item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User info */}
        <div
          ref={profileRef}
          className="p-3 border-t border-slate-800/50 relative"
        >

          {/* Clickable User Row */}
          <div
            onClick={() => setProfileOpen(!profileOpen)}
            className={`flex items-center gap-2 px-2 mb-2 cursor-pointer rounded-xl 
            hover:bg-slate-800/50 transition ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 
              flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.fullName?.charAt(0)}
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate text-white">{user?.fullName}</p>
                <p className="text-xs text-slate-500">{user?.role}</p>
              </div>
            )}

            {!collapsed && (
              <div
                onClick={(e) => e.stopPropagation()}
              >
                <NotificationBell />
              </div>
            )}
          </div>

          {/* Dropdown */}
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
              `}
            >
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-2 text-xs py-2 px-3 rounded-xl 
                bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition mb-1"
              >
                {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center gap-2 text-xs py-2 px-3 rounded-xl 
                bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<SkeletonDashboard />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};