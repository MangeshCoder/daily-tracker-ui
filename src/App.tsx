import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './context/Authcontext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { SignalRProvider } from './context/SignalRContext';
import { queryClient } from './components/QueryClient';
import { ToastContainer } from './components/ToastContainer';
import { Layout } from './components/layout/Layout';
import { lazy, Suspense } from 'react';
import { SkeletonDashboard } from './components/Skeleton';
import { LeaveManagementPage } from './pages/LeaveManagementPage';
import { WFHRequestPage } from './pages/WFHRequestPage';
import { ManagerWFHDashboard } from './pages/ManagerWFHDashboard';
import { EmailAction } from './pages/EmailAction';
import { WFHEmailActionPage } from './pages/WFHEmailActionPage';
import { AssignRole } from './pages/AssignRole';
// ═══════════════════════════════════════════════════════════════════════════════
// LAZY PAGE IMPORTS (Feature 15: Code splitting)
// ═══════════════════════════════════════════════════════════════════════════════

// Employee Pages
const DashboardPage = lazy(() =>
  import('./pages/Dashboardpage').then(m => ({ default: m.DashboardPage }))
);
const TasksPage = lazy(() =>
  import('./pages/Taskspage').then(m => ({ default: m.TasksPage }))
);
const SupportPage = lazy(() =>
  import('./pages/Supportpage').then(m => ({ default: m.SupportPage }))
);
const HistoryPage = lazy(() =>
  import('./pages/Historyanalyticspages').then(m => ({ default: m.HistoryPage }))
);
const AnalyticsPage = lazy(() =>
  import('./pages/AdvancedAnalyticsPage').then(m => ({ default: m.AdvancedAnalyticsPage }))
);
const MyReportPage = lazy(() =>
  import('./pages/Myreportpage').then(m => ({ default: m.MyReportPage }))
);
const KudosPage = lazy(() =>
  import('./pages/KudosPage').then(m => ({ default: m.KudosPage }))
);
// ADD this line right after the KudosPage import
const ChatPage = lazy(() => import('./pages/Chatpage').then(m => ({ default: m.ChatPage })));

const TwoFactorSettingsPage = lazy(() =>
  import('./pages/TwoFactorSettingsPage').then(m => ({ default: m.TwoFactorSettingsPage }))
);

// ✅ EOD Report Pages - NEW
const EODReportPage = lazy(() =>
  import('./pages/EODReportPage').then(m => ({ default: m.EODReportPage }))
);
const MyEODReviewsPage = lazy(() =>
  import('./pages/MyEODReviewsPage').then(m => ({ default: m.MyEODReviewsPage }))
);

// Manager Pages
const ManagerDashboardPage = lazy(() =>
  import('./pages/Managerdashboardpage').then(m => ({ default: m.ManagerDashboardPage }))
);
const ManagerEODReviewPage = lazy(() =>
  import('./pages/ManagerEODReviewPage').then(m => ({ default: m.ManagerEODReviewPage }))
);

// Auth Pages
const LoginPage = lazy(() =>
  import('./pages/Authpages').then(m => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/Authpages').then(m => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage').then(m => ({ default: m.default }))
);



// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE GUARDS
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* ─── Auth Routes ──────────────────────────────────────────────────── */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : (
          <Suspense fallback={<SkeletonDashboard />}>
            <LoginPage />
          </Suspense>
        )}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" /> : (
          <Suspense fallback={<SkeletonDashboard />}>
            <RegisterPage />
          </Suspense>
        )}
      />
      <Route
        path="/forgot-password"
        element={isAuthenticated ? <Navigate to="/" /> : (
          <Suspense fallback={<SkeletonDashboard />}>
            <ForgotPasswordPage />
          </Suspense>
        )}
      />

      {/* ─── Protected Routes ─────────────────────────────────────────────── */}
      <Route
        path="/"
        element={<ProtectedRoute><Layout /></ProtectedRoute>}
      >
        {/* EMPLOYEE ROUTES */}
        <Route
          index
          element={
            <Suspense fallback={<SkeletonDashboard />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="tasks"
          element={
            <Suspense fallback={<SkeletonDashboard />}>
              <TasksPage />
            </Suspense>
          }
        />
        <Route
          path="support"
          element={
            <Suspense fallback={<SkeletonDashboard />}>
              <SupportPage />
            </Suspense>
          }
        />
        <Route
          path="history"
          element={
            <Suspense fallback={<SkeletonDashboard />}>
              <HistoryPage />
            </Suspense>
          }
        />
        <Route
          path="chat"
          element={
            <Suspense fallback={<SkeletonDashboard />}>
              <ChatPage />
            </Suspense>
          }
        />
        <Route
          path="analytics"
          element={
            <Suspense fallback={<SkeletonDashboard />}>
              <AnalyticsPage />
            </Suspense>
          }
        />
        <Route
          path="kudos"
          element={
            <Suspense fallback={<SkeletonDashboard />}>
              <KudosPage />
            </Suspense>
          }
        />
        <Route
          path="leave"
          element={<LeaveManagementPage />}
        />
        <Route
          path="my-report"
          element={
            <Suspense fallback={<SkeletonDashboard />}>
              <MyReportPage />
            </Suspense>
          }
        />
        <Route
          path="security"
          element={
            <Suspense fallback={<SkeletonDashboard />}>
              <TwoFactorSettingsPage />
            </Suspense>
          }
        />
        <Route
          path="request"
          element={<WFHRequestPage />}
        />

        {/* ✅ EOD REPORT ROUTES - NEW */}
        <Route
          path="eod-reports"
          element={
            <Suspense fallback={<SkeletonDashboard />}>
              <EODReportPage />
            </Suspense>
          }
        />
        <Route
          path="my-eod-reviews"
          element={
            <Suspense fallback={<SkeletonDashboard />}>
              <MyEODReviewsPage />
            </Suspense>
          }
        />

        {/* MANAGER ROUTES */}
        <Route
          path="manager"
          element={
            <ManagerRoute>
              <Suspense fallback={<SkeletonDashboard />}>
                <ManagerDashboardPage />
              </Suspense>
            </ManagerRoute>
          }
        />
        <Route
          path="manager/wfh-dashboard"
          element={
            <ManagerRoute>
              <ManagerWFHDashboard />
            </ManagerRoute>
          }
        />
        <Route
          path="manager/eod-reviews"
          element={
            <ManagerRoute>
              <Suspense fallback={<SkeletonDashboard />}>
                <ManagerEODReviewPage />
              </Suspense>
            </ManagerRoute>
          }
        />
        <Route
            path="manager/assign-role"
            element={
              <ManagerRoute>
                <AssignRole />
              </ManagerRoute>
            }
          />
      </Route>
      <Route path="/email-action" element={<EmailAction />} />
      <Route path="/wfh-email-action" element={<WFHEmailActionPage />} />

      {/* ─── 404 Route ───────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

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