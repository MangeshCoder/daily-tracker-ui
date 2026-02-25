import axios from 'axios';

const BASE_URL = 'http://localhost:5053/api';

const api = axios.create({ baseURL: BASE_URL });

// ─── Attach access token ──────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auto-refresh on 401 ──────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!));
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Device token for trusted devices (skip 2FA for 30 days) ──────────────────
const DEVICE_TOKEN_KEY = 'deviceToken';
export const getDeviceToken = (): string => {
  let t = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem(DEVICE_TOKEN_KEY, t);
  }
  return t;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (d: { email: string; password: string }, deviceToken?: string) =>
    api.post('/auth/login', d, {
      headers: deviceToken ? { 'X-Device-Token': deviceToken } : undefined,
    }),
  verify2FALogin: (tempToken: string, code: string) =>
    api.post('/auth/verify-2fa-login', { tempToken, code }),
  register: (d: object) => api.post('/auth/register', d),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  getUsers: () => api.get('/auth/users'),
  // Two-Factor Authentication
  get2FAStatus: () => api.get<{ twoFactorEnabled: boolean }>('/auth/2fa-status'),
  setup2FA: () => api.post<{ manualEntryKey: string; qrCodeBase64: string; message: string }>('/auth/setup-2fa'),
  verify2FASetup: (code: string) => api.post('/auth/verify-2fa-setup', { code }),
  disable2FA: (code: string) => api.post('/auth/disable-2fa', { code }),
  trustDevice: (deviceToken: string, deviceName?: string) =>
    api.post('/auth/trust-device', { deviceToken, deviceName }),
    sendRegisterOtp: (data: { email: string }) =>
  api.post('/auth/send-register-otp', data),

  verifyRegisterOtp: (data: any) =>
    api.post('/auth/verify-register-otp', data),

  sendLoginOtp: (data: { email: string }) =>
    api.post('/auth/send-login-otp', data),

  verifyLoginOtp: (data: { email: string; code: string }) =>
    api.post('/auth/verify-login-otp', data),

  sendForgotPasswordOtp: (data: { email: string }) =>
    api.post('/auth/send-forgot-password-otp', data),

  resetPassword: (data: { email: string; code: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
};

// ─── Daily Log ────────────────────────────────────────────────────────────────
export const dailyLogApi = {
  checkIn: (d: object) => api.post('/dailylog/checkin', d),
  checkOut: (d: object) => api.put('/dailylog/checkout', d),
  getToday: () => api.get('/dailylog/today'),
  getByDate: (date: string) => api.get(`/dailylog/date/${date}`),
  getHistory: (days = 30) => api.get(`/dailylog/history?days=${days}`),
};

// ─── Breaks ───────────────────────────────────────────────────────────────────
export const breaksApi = {
  startBreak: (breakType: string) => api.post('/breaks/start', { breakType }),
  endBreak: (breakId: number) => api.put(`/breaks/end/${breakId}`),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksApi = {
  create: (d: object) => api.post('/tasks', d),
  update: (id: number, d: object) => api.put(`/tasks/${id}`, d),
  delete: (id: number) => api.delete(`/tasks/${id}`),
  getToday: () => api.get('/tasks/today'),
  getByDate: (date: string) => api.get(`/tasks/date/${date}`),
};

// ─── Support ──────────────────────────────────────────────────────────────────
export const supportApi = {
  create: (d: object) => api.post('/support', d),
  createWithMedia: (formData: FormData, onUploadProgress?: (percent: number) => void) =>
    api.post("/support/with-media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (!progressEvent.total) return;
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onUploadProgress?.(percent);
      },
    }),
  delete: (id: number) => api.delete(`/support/${id}`),
  getToday: () => api.get('/support/today'),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getTodaySummary: () => api.get('/dashboard/today'),
  getWeeklyReport: () => api.get('/dashboard/weekly'),
};

// ─── Goals (Feature 4) ────────────────────────────────────────────────────────
export const goalsApi = {
  setGoal: (d: object) => api.post('/goals', d),
  getProgress: () => api.get('/goals/today'),
  getTrend: (days = 14) => api.get(`/goals/trend?days=${days}`),
};

// ─── EOD Reports (Feature 6) ──────────────────────────────────────────────────
export const eodApi = {
  submit: (d: object) => api.post('/eod', d),
  getToday: () => api.get('/eod/today'),
  getHistory: (days = 14) => api.get(`/eod/history?days=${days}`),
  getPending: () => api.get('/eod/pending'),
  review: (id: number, d: object) => api.put(`/eod/${id}/review`, d),
};

// ─── Kudos (Feature 9) ────────────────────────────────────────────────────────
export const kudosApi = {
  give: (d: object) => api.post('/kudos', d),
  getRecent: (limit = 20) => api.get(`/kudos/recent?limit=${limit}`),
  getMySummary: () => api.get('/kudos/my'),
  getUserSummary: (userId: number) => api.get(`/kudos/user/${userId}`),
};

// ─── Presence (Feature 9) ─────────────────────────────────────────────────────
export const presenceApi = {
  update: (d: object) => api.put('/presence', d),
  getTeam: () => api.get('/presence/team'),
};

// ─── Leave (Feature 9) ────────────────────────────────────────────────────────
export const leaveApi = {
  apply: (d: object) => api.post('/leave', d),
  getMine: () => api.get('/leave/my'),
  getAll: (status?: string) => api.get('/leave/all', { params: status ? { status } : {} }),
  review: (id: number, d: object) => api.put(`/leave/${id}/review`, d),
  cancel: (id: number) => api.delete(`/leave/${id}`),
};

// ─── Holidays (Feature 10) ────────────────────────────────────────────────────
export const holidayApi = {
  getByYear: (year = new Date().getFullYear()) => api.get(`/holidays?year=${year}`),
  isToday: () => api.get('/holidays/today'),
  create: (d: object) => api.post('/holidays', d),
  delete: (id: number) => api.delete(`/holidays/${id}`),
};

// ─── Notifications (Feature 1) ────────────────────────────────────────────────
export const notifApi = {
  getAll: (unreadOnly = false) => api.get(`/notifications?unreadOnly=${unreadOnly}`),
  getCount: () => api.get('/notifications/count'),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// ─── Analytics (Feature 5) ────────────────────────────────────────────────────
export const analyticsApi = {
  getAdvanced: (days = 90) => api.get(`/analytics?days=${days}`),
  getHeatmap: (days = 365) => api.get(`/analytics/heatmap?days=${days}`),
  getProjects: (days = 30) => api.get(`/analytics/projects?days=${days}`),
  getPeakHours: (days = 30) => api.get(`/analytics/peak-hours?days=${days}`),
  getUserAnalytics: (userId: number, days = 90) => api.get(`/analytics/user/${userId}?days=${days}`),
};

// ─── Task Templates (Feature 3) ───────────────────────────────────────────────
export const templateApi = {
  getAll: () => api.get('/task-templates'),
  getRecurring: () => api.get('/task-templates/recurring'),
  create: (d: object) => api.post('/task-templates', d),
  useTemplate: (templateId: number, dailyLogId: number) =>
    api.post(`/task-templates/${templateId}/use/${dailyLogId}`),
  delete: (id: number) => api.delete(`/task-templates/${id}`),
};

// ─── Task Timer (Feature 3) ───────────────────────────────────────────────────
export const taskTimerApi = {
  start: (taskId: number) => api.post(`/task-timer/${taskId}/start`),
  stop: (taskId: number) => api.post(`/task-timer/${taskId}/stop`),
  getActive: () => api.get('/task-timer/active'),
};

// ─── Manager API ──────────────────────────────────────────────────────────────
export const managerApi = {
  getTeamDaily: (date?: string) => api.get('/manager/team/daily', { params: date ? { date } : {} }),
  getTeamMonthly: (month: number, year: number) => api.get('/manager/team/monthly', { params: { month, year } }),
  getUserAttendance: (userId: number, month: number, year: number) =>
    api.get(`/manager/user/${userId}/attendance`, { params: { month, year } }),
  getUserCalendar: (userId: number, month: number, year: number) =>
    api.get(`/manager/user/${userId}/calendar`, { params: { month, year } }),
  getUserReport: (userId: number, from: string, to: string) =>
    api.get(`/manager/user/${userId}/report`, { params: { from, to } }),
  downloadUserReport: (userId: number, format: string, from: string, to: string) =>
    api.get(`/manager/user/${userId}/download`, { params: { format, from, to }, responseType: 'blob' }),
  getAllUsers: () => api.get('/manager/users'),
  toggleUserStatus: (userId: number) =>
    api.put(`/manager/user/${userId}/toggle-status`)
};

// ─── Report API ───────────────────────────────────────────────────────────────
export const reportApi = {
  getMyReport: (from: string, to: string) => api.get('/report/my', { params: { from, to } }),
  downloadMyReport: (format: string, from: string, to: string) =>
    api.get('/report/my/download', { params: { format, from, to }, responseType: 'blob' }),
  getMyAttendance: (month: number, year: number) =>
    api.get('/report/my/attendance', { params: { month, year } }),
  getMyCalendar: (month: number, year: number) =>
    api.get('/report/my/calendar', { params: { month, year } }),
};

// ─── Audit ────────────────────────────────────────────────────────────────────
export const auditApi = {
  getLogs: (userId?: number, entity?: string, take = 50) =>
    api.get('/audit', { params: { userId, entity, take } }),
};

// ─── Helper: download blob ────────────────────────────────────────────────────
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  a.remove(); window.URL.revokeObjectURL(url);
};

export const wfhApi = {
  submit: (data: object) =>
    api.post('/wfh-requests', data).then(r => r.data),

  getMy: () =>
    api.get('/wfh-requests/my').then(r => r.data),

  cancel: (id: number) =>
    api.delete(`/wfh-requests/${id}/cancel`).then(r => r.data),

  getPending: () =>
    api.get('/wfh-requests/pending').then(r => r.data),

  getAll: (month: number, year: number) =>
    api.get('/wfh-requests/all', { params: { month, year } })
       .then(r => r.data),

  approve: (id: number, note?: string) =>
    api.post(`/wfh-requests/${id}/approve`, { note })
       .then(r => r.data),

  reject: (id: number, note?: string) =>
    api.post(`/wfh-requests/${id}/reject`, { note })
       .then(r => r.data),

  getTeamStatus: (date?: string) =>
    api.get('/wfh-requests/team-status',
      { params: date ? { date } : {} })
       .then(r => r.data),

  getTeamMonthly: (month: number, year: number) =>
    api.get('/wfh-requests/team-monthly',
      { params: { month, year } })
       .then(r => r.data),


};

export default api;