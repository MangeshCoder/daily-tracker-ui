// ─── Core Types (original) ────────────────────────────────────────────────────
export interface User { id: number; fullName: string; email: string; role: string; isActive: boolean;}
export interface AuthResponse { accessToken: string; refreshToken: string; accessTokenExpiry: string; user: User; }
export interface LoginDto { email: string; password: string; }

// ─── Two-Factor Authentication ────────────────────────────────────────────────
export interface LoginResponseDto {
  requiresTwoFactor: boolean;
  tempToken?: string;
  message?: string;
  tokens?: AuthResponse;
}
export interface ManagerUserDto {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
}
export interface Setup2FAResponse { manualEntryKey: string; qrCodeBase64: string; message: string; }
export interface RegisterDto { fullName: string; email: string; password: string; role: string; }
export interface BreakLog { id: number; breakType: string; startTime: string; endTime?: string; durationMinutes: number; isActive: boolean; }
export interface TaskLog { id: number; taskTitle: string; description?: string; projectName?: string; status: 'InProgress'|'Completed'|'Blocked'|'OnHold'; timeSpentMinutes: number; priority: 'Low'|'Medium'|'High'; tags?: string; completedAt?: string; createdAt: string; }
export interface CreateTaskDto { taskTitle: string; description?: string; projectName?: string; status: string; timeSpentMinutes: number; priority: string; tags?: string; }
export interface MediaEvidence { id: number; mediaType: string; fileName: string; url: string; fileSizeBytes: number; mimeType: string; }
export interface SupportLog { id: number; supportedDeveloperName: string; issueDescription: string; resolution?: string; timeSpentMinutes: number; supportType: string; supportedAt: string; media?: MediaEvidence[]; }
export interface CreateSupportDto { supportedDeveloperId: number; issueDescription: string; resolution?: string; timeSpentMinutes: number; supportType: string; }
export interface DailyLog { id: number; logDate: string; checkInTime?: string; checkOutTime?: string; totalWorkMinutes: number; totalBreakMinutes: number; dayStatus: string; notes?: string; workHours: string; breaks: BreakLog[]; tasks: TaskLog[]; supportLogs: SupportLog[]; }
export interface DashboardSummary { todayLog?: DailyLog; tasksCompleted: number; tasksInProgress: number; totalSupportGiven: number; netWorkMinutes: number; netWorkHours: string; isCheckedIn: boolean; hasActiveBreak: boolean; activeBreak?: BreakLog; }

// ─── Feature 11: Security ─────────────────────────────────────────────────────
export interface RefreshTokenRequest { refreshToken: string; }

// ─── Feature 4: Goals ─────────────────────────────────────────────────────────
export interface SetGoalDto { targetWorkMinutes: number; targetTasksCompleted: number; targetBreakMinutes: number; managerSetNote?: string; }
export interface GoalProgress {
  goal: SetGoalDto;
  actualWorkMinutes: number; actualTasksCompleted: number; actualBreakMinutes: number;
  workProgress: number; taskProgress: number; breakProgress: number;
  productivityScore: number; scoreGrade: string; insights: string[];
}

// ─── Feature 6: EOD Report ────────────────────────────────────────────────────
export interface CreateEODReportDto { whatWasDone: string; blockers?: string; planForTomorrow?: string; learnings?: string; moodRating: string; }
export interface EODReport { id: number; userName: string; reportDate: string; whatWasDone: string; blockers?: string; planForTomorrow?: string; learnings?: string; moodRating: string; submittedAt: string; isReviewedByManager: boolean; managerComment?: string; }

// ─── Feature 3: Task Templates ────────────────────────────────────────────────
export interface CreateTemplateDto { title: string; description?: string; projectName?: string; defaultTimeMinutes: number; priority: string; tags?: string; isRecurring: boolean; recurrenceDays?: string; }
export interface TaskTemplate extends CreateTemplateDto { id: number; createdAt: string; }

// ─── Feature 3: Task Timer ────────────────────────────────────────────────────
export interface TaskTimer { id: number; taskLogId: number; startedAt: string; stoppedAt?: string; durationMinutes: number; isRunning: boolean; totalSessionMinutes: number; }

// ─── Feature 9: Team Features ─────────────────────────────────────────────────
export interface UpdatePresenceDto { isAvailableForHelp: boolean; status: string; statusMessage?: string; }
export interface UserPresence { user: User; isAvailableForHelp: boolean; status: string; statusMessage?: string; updatedAt: string; isCheckedInToday: boolean; checkInTime?: string; }
export interface GiveKudosDto { toUserId: number; message: string; badgeType: string; }
export interface Kudos { id: number; fromUserName: string; toUserName: string; message: string; badgeType: string; givenAt: string; }
export interface KudosSummary { user: User; totalReceived: number; totalGiven: number; badgeCounts: Record<string, number>; recentKudos: Kudos[]; }

// ─── Feature 9: Leave ─────────────────────────────────────────────────────────
export interface ApplyLeaveDto { fromDate: string; toDate: string; leaveType: string; reason: string; }
export interface LeaveRequest { id: number; userName: string; fromDate: string; toDate: string; leaveDays: number; leaveType: string; reason: string; status: string; reviewerName?: string; reviewNote?: string; reviewedAt?: string; appliedAt: string; }
export interface ReviewLeaveDto { status: string; reviewNote?: string; }

// ─── Feature 10: Attendance ───────────────────────────────────────────────────
export interface Holiday { id: number; date: string; name: string; type: string; year: number; isToday: boolean; }
export interface CreateHolidayDto { date: string; name: string; type: string; }

// ─── Feature 1: Notifications ─────────────────────────────────────────────────
export interface AppNotification { id: number; title: string; message: string; type: string; actionUrl?: string; isRead: boolean; createdAt: string; }

// ─── Feature 5: Analytics ─────────────────────────────────────────────────────
export interface HeatmapData { date: string; workMinutes: number; tasksCompleted: number; level: number; }
export interface ProjectTime { projectName: string; totalMinutes: number; taskCount: number; percentage: number; }
export interface ProductivityTrend { date: string; score: number; workMinutes: number; tasksCompleted: number; dayName: string; }
export interface PeakHour { hour: number; hourLabel: string; tasksCompleted: number; }
export interface AdvancedAnalytics { heatmap: HeatmapData[]; projectBreakdown: ProjectTime[]; productivityTrend: ProductivityTrend[]; peakHours: PeakHour[]; overallProductivityScore: number; mostProductiveDay: string; mostWorkedProject: string; totalTasksCompleted: number; totalWorkMinutes: number; totalSupportGiven: number; }

// ─── Audit ────────────────────────────────────────────────────────────────────
export interface AuditLog { id: number; userName: string; action: string; entity: string; entityId?: number; oldValues?: string; newValues?: string; ipAddress?: string; createdAt: string; }

// ─── Manager types (from previous version) ────────────────────────────────────
export interface UserDailyActivity { user: User; dayStatus: string; checkInTime?: string; checkOutTime?: string; workHours: string; totalBreakMinutes: number; tasksTotal: number; tasksCompleted: number; tasksInProgress: number; supportGiven: number; isOnBreak: boolean; activeBreakType?: string; tasks: TaskLog[]; supportLogs: SupportLog[]; }
export interface ManagerTeamDaily { date: string; totalMembers: number; checkedIn: number; notCheckedIn: number; members: UserDailyActivity[]; }
export interface UserAttendanceSummary { user: User; month: number; year: number; workingDaysInMonth: number; daysPresent: number; daysWFH: number; daysHalfDay: number; daysAbsent: number; attendancePercentage: number; totalWorkMinutes: number; totalWorkHours: string; averageDailyHours: number; totalTasksCompleted: number; totalSupportGiven: number; }
export interface AttendanceDay { date: string; status: string; checkIn?: string; checkOut?: string; workHours: string; tasksCompleted: number; }
export interface TeamMonthlyStats { month: number; year: number; members: UserAttendanceSummary[]; teamAverageAttendance: number; teamTotalTasksCompleted: number; teamTotalSupportLogs: number; }
export interface UserFullReport { user: User; fromDate: string; toDate: string; totalWorkingDays: number; daysPresent: number; attendancePercentage: number; totalWorkMinutes: number; totalWorkHours: string; averageDailyHours: number; totalTasksCompleted: number; totalTasksLogged: number; totalSupportGiven: number; dailyEntries: DailyReportEntry[]; }
export interface DailyReportEntry { date: string; dayStatus: string; checkIn: string; checkOut: string; workHours: string; breakMinutes: number; tasksSummary: string[]; supportSummary: string[]; notes?: string; }

export interface WeeklyReport { days: DailyLog[]; totalWorkMinutes: number; totalTasksCompleted: number; totalSupportGiven: number; averageDailyHours: number; }

// Manager Types
export interface UserDailyActivity { user: User; dayStatus: string; checkInTime?: string; checkOutTime?: string; workHours: string; totalBreakMinutes: number; tasksTotal: number; tasksCompleted: number; tasksInProgress: number; supportGiven: number; isOnBreak: boolean; activeBreakType?: string; tasks: TaskLog[]; supportLogs: SupportLog[]; }
export interface ManagerTeamDaily { date: string; totalMembers: number; checkedIn: number; notCheckedIn: number; members: UserDailyActivity[]; }
export interface UserAttendanceSummary { user: User; month: number; year: number; workingDaysInMonth: number; daysPresent: number; daysWFH: number; daysHalfDay: number; daysAbsent: number; attendancePercentage: number; totalWorkMinutes: number; totalWorkHours: string; averageDailyHours: number; totalTasksCompleted: number; totalSupportGiven: number; }
export interface AttendanceDay { date: string; status: string; checkIn?: string; checkOut?: string; workHours: string; tasksCompleted: number; }
export interface TeamMonthlyStats { month: number; year: number; members: UserAttendanceSummary[]; teamAverageAttendance: number; teamTotalTasksCompleted: number; teamTotalSupportLogs: number; }
export interface DailyReportEntry { date: string; dayStatus: string; checkIn: string; checkOut: string; workHours: string; breakMinutes: number; tasksSummary: string[]; supportSummary: string[]; notes?: string; }
export interface UserFullReport { user: User; fromDate: string; toDate: string; totalWorkingDays: number; daysPresent: number; attendancePercentage: number; totalWorkMinutes: number; totalWorkHours: string; averageDailyHours: number; totalTasksCompleted: number; totalTasksLogged: number; totalSupportGiven: number; dailyEntries: DailyReportEntry[]; }
export interface WFHRequest {
  id: number;
  userId: number;
  employeeName: string;
  requestType: 'WFH' | 'HalfDay';
  requestDate: string;
  requestDateLabel: string;
  halfDaySlot?: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  reviewedByName?: string;
  reviewNote?: string;
  reviewedAt?: string;
  requestedAt: string;
}

export interface TeamMemberStatus {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  effectiveStatus: string;
  checkInTime?: string;
  checkOutTime?: string;
  workMinutes: number;
  workHours: string;
  breakMinutes: number;
  isOnBreak: boolean;
  tasksCompleted: number;
  tasksTotal: number;
  hasApprovedWFH: boolean;
  hasApprovedHalfDay: boolean;
  halfDaySlot?: string;
  hasPendingRequest: boolean;
  pendingRequestType?: string;
  pendingRequestId?: number;
}

export interface TeamDailyStatus {
  date: string;
  dateLabel: string;
  totalMembers: number;
  presentCount: number;
  wfhCount: number;
  halfDayCount: number;
  notCheckedInCount: number;
  pendingRequestsCount: number;
  members: TeamMemberStatus[];
}

export interface TeamMonthlyAttendance {
  userId: number;
  fullName: string;
  role: string;
  workingDaysInMonth: number;
  daysPresent: number;
  daysWFH: number;
  daysHalfDay: number;
  daysAbsent: number;
  attendancePercentage: number;
  totalWorkHours: string;
  averageDailyHours: number;
  totalTasksCompleted: number;
  wfhDates: string[];
  halfDayDates: string[];
}

export interface EmailOtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
}

