import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider,useAuth } from './context/Authcontext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { SignalRProvider, useSignalR } from './context/SignalRContext';
import { queryClient } from './components/QueryClient';
import { ToastContainer } from './components/ToastContainer';
import { NotificationBell } from './pages/Dashboardwidgets';
import { LeaveManagementPage } from './pages/LeaveManagementPage';
import { Layout } from './components/layout/Layout';

// Lazy imports for pages (Feature 15: Code splitting)
import { lazy, Suspense } from 'react';
import { SkeletonDashboard } from './components/Skeleton';
import { WFHRequestPage } from './pages/WFHRequestPage';
import { ManagerWFHDashboard } from './pages/ManagerWFHDashboard';
import { MyWFHRequests } from './components/MyWFHRequests';


const DashboardPage = lazy(() => import('./pages/Dashboardpage').then(m => ({ default: m.DashboardPage })));
const TasksPage = lazy(() => import('./pages/Taskspage').then(m => ({ default: m.TasksPage })));
const SupportPage = lazy(() => import('./pages/Supportpage').then(m => ({ default: m.SupportPage })));
const HistoryPage = lazy(() => import('./pages/Historyanalyticspages').then(m => ({ default: m.HistoryPage })));
const AnalyticsPage = lazy(() => import('./pages/AdvancedAnalyticsPage').then(m => ({ default: m.AdvancedAnalyticsPage })));
const MyReportPage = lazy(() => import('./pages/Myreportpage').then(m => ({ default: m.MyReportPage })));
const ManagerDashboardPage = lazy(() => import('./pages/Managerdashboardpage').then(m => ({ default: m.ManagerDashboardPage })));
const KudosPage = lazy(() => import('./pages/KudosPage').then(m => ({ default: m.KudosPage })));
const TwoFactorSettingsPage = lazy(() => import('./pages/TwoFactorSettingsPage').then(m => ({ default: m.TwoFactorSettingsPage })));




// Route guards
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const ManagerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'Manager') return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Sidebar Layout
// const Layout = () => {
//   const { user, logout } = useAuth();
//   const { isDark, toggleTheme } = useTheme();
//   const isManager = user?.role === 'Manager';

//   const navItems = [
//     { to: '/', icon: '🏠', label: 'Dashboard', exact: true },
//     { to: '/tasks', icon: '✅', label: 'Tasks' },
//     { to: '/support', icon: '🤝', label: 'Support' },
//     { to: '/history', icon: '📅', label: 'History' },
//     { to: '/analytics', icon: '📊', label: 'Analytics' },
//     { to: '/kudos', icon: '🏆', label: 'Kudos' },
//     { to: '/leave', icon: '🗓️', label: 'Leave' },
//     { to: '/my-report', icon: '📥', label: 'My Report' },
//     { to: '/security', icon: '🔐', label: 'Security (2FA)' },
//     { to: '/request', icon: '🏡', label: 'WFH Requests' }
    
//   ];

//   const managerItems = [
//     { to: '/manager', icon: '📋', label: 'Team Dashboard' },
//     { to: '/manager/wfh-dashboard', icon: '🗓️', label: 'Employee Attendance' },
//   ];

//   return (
//     <div className={`flex h-screen overflow-hidden ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
//       {/* Sidebar */}
//       <aside className={`w-60 flex-shrink-0 flex flex-col border-r ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
//         {/* Logo */}
//         <div className="p-2 border-b border-slate-800/50 text-center">
          
//           {/* Logo Container */}
//           <div className="w-30 h-16 mx-auto mb-2 bg-white rounded-lg flex items-center justify-center shadow-md overflow-hidden">
//             <img
//               src="public/montcrest_software_pvt_ltd_cover.jpg"
//               alt="Montcrest Software"
//               className="w-full h-full object-contain p-2"
//             />
//           </div>

//           {/* System Name */}
//           <p className="font-bold text-lg text-white tracking-wide">
//             EMS System
//           </p>

//         </div>

//         {/* Nav */}
//         <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
//           <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 py-2">My Work</p>
//           {navItems.map(item => (
//             <NavLink key={item.to} to={item.to} end={item.exact}
//               className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
//               <span>{item.icon}</span> {item.label}
//             </NavLink>
//           ))}

//           {isManager && (
//             <>
//               <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 py-2 mt-4">Manager</p>
//               {managerItems.map(item => (
//                 <NavLink key={item.to} to={item.to}
//                   className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? 'bg-violet-600/20 text-violet-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
//                   <span>{item.icon}</span> {item.label}
//                 </NavLink>
//               ))}
//             </>
//           )}
//         </nav>

//         {/* User info */}
//         <div className="p-3 border-t border-slate-800/50">
//           <div className="flex items-center gap-2 px-2 mb-2">
//             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
//               {user?.fullName?.charAt(0)}
//             </div>
//             <div className="min-w-0 flex-1">
//               <p className="text-xs font-medium truncate text-white">{user?.fullName}</p>
//               <p className="text-xs text-slate-500">{user?.role}</p>
//             </div>
//             <NotificationBell />
//           </div>
//           <div className="flex gap-1">
//             <button onClick={toggleTheme}
//               className="flex-1 text-xs py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition">
//               {isDark ? '☀️ Light' : '🌙 Dark'}
//             </button>
//             <button onClick={logout}
//               className="flex-1 text-xs py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition">
//               Sign Out
//             </button>
//           </div>
//         </div>
//       </aside>

//       {/* Main */}
//       <main className="flex-1 overflow-y-auto">
//         <Suspense fallback={<SkeletonDashboard />}>
//           <Outlet />
//         </Suspense>
//       </main>
//     </div>
//   );
// };

import { LoginPage, RegisterPage } from './pages/Authpages';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <RegisterPage />} />
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" /> : <ForgotPasswordPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="kudos" element={<KudosPage />} />
        <Route path="leave" element={<LeaveManagementPage />} />
        <Route path="my-report" element={<MyReportPage />} />
        <Route path="security" element={<TwoFactorSettingsPage />} />
        <Route path="manager" element={<ManagerRoute><ManagerDashboardPage /></ManagerRoute>} />
        <Route path="request" element={<WFHRequestPage />} />
        <Route path="manager/wfh-dashboard" element={<ManagerRoute><ManagerWFHDashboard /></ManagerRoute>} />

        
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <SignalRProvider>
                <AppRoutes />
                <ToastContainer />
              </SignalRProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
      {(import.meta as any).env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

export default App;