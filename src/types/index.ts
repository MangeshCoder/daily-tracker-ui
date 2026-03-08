// ─── Core Types (original) ────────────────────────────────────────────────────
export interface User { id: number; fullName: string; email: string; role: string; isActive: boolean;department?:      string;
  designation?:     string;
  profilePhotoUrl?: string;
  phone?:           string;
  bio?:             string;
  joinDate?:        string;}
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
export interface SetGoalDto { targetWorkMinutes: number; targetTasksCompleted: number; targetSupportGiven: number; targetBreakMinutes: number; managerSetNote?: string; }
export interface GoalProgress {
  goal: SetGoalDto;
  actualWorkMinutes: number; actualTasksCompleted: number; actualBreakMinutes: number; actualSupportGiven: number;
  workProgress: number; taskProgress: number; breakProgress: number; supportProgress: number;
  productivityScore: number; scoreGrade: string; insights: string[];
}
export interface GoalHistoryEntry {
  date: string;
  dayName: string;       // "Mon"
  dateLabel: string;     // "Jan 15"

  // Targets
  targetWorkMinutes: number;
  targetTasksCompleted: number;
  targetSupportGiven: number;
  targetBreakMinutes: number;

  // Actuals
  actualWorkMinutes: number;
  actualTasksCompleted: number;
  actualSupportGiven: number;
  actualBreakMinutes: number;

  // Progress 0–100
  workProgress: number;
  taskProgress: number;
  supportProgress: number;
  breakProgress: number;

  // Score
  productivityScore: number;
  scoreGrade: string;    // "A" | "B" | "C" | "D"
  goalWasSet: boolean;   // false = worked but no goal configured that day
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
export interface KudosLeaderboardEntry {
  rank:          number;
  userId:        number;
  userName:      string;
  totalReceived: number;
  totalGiven:    number;
  badgeCounts:   Record<string, number>;
  topBadge:      string;
  // NOTE: no 'role' — backend DTO does not include it
}

export interface KudosLeaderboard {
  year:        number;
  month:       number | null;
  periodLabel: string;        // e.g. "March 2025" or "Full Year 2025"
  entries:     KudosLeaderboardEntry[];
  // NOTE: property is 'entries', not 'rankings'
}

// ─── Feature 9: Leave ─────────────────────────────────────────────────────────
export interface ApplyLeaveDto { fromDate: string; toDate: string; leaveType: string; reason: string; }
export interface LeaveRequest { id: number; userName: string; fromDate: string; toDate: string; leaveDays: number; leaveType: string; reason: string; status: string; reviewerName?: string; reviewNote?: string; reviewedAt?: string; appliedAt: string; }
export interface ReviewLeaveDto { status: string; reviewNote?: string; }
export interface LeaveTypeBalanceItem {leaveType: string;entitlement: number; used: number;pending: number;remaining: number;isUnlimited: boolean;}
export interface LeaveBalanceDto {userId: number;userName: string;year: number;balances: LeaveTypeBalanceItem[];}

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

export interface ConversationSummary {
  id: number;
  type: 'Direct' | 'Group';
  displayName: string;
  avatarUrl?: string;
  otherUserId?: number;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCount: number;
  memberCount: number;
  isMuted: boolean;
}

export interface ConversationDetail {
  id: number;
  type: 'Direct' | 'Group';
  groupName?: string;
  groupAvatar?: string;
  createdAt: string;
  myRole: 'Member' | 'Admin';
  members: MemberInfo[];
}

export interface MemberInfo {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  joinedAt: string;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderInitial: string;
  content: string;
  messageType: 'Text' | 'Image' | 'File' | 'System';
  attachmentUrl?: string;
  attachmentName?: string;
  isDeleted: boolean;
  isEdited: boolean;
  sentAt: string;
  editedAt?: string;
  replyTo?: ReplyPreview;
  reactions: Reaction[];
  readByUserIds: number[];
}

export interface ReplyPreview {
  id: number;
  senderName: string;
  contentPreview: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: number[];
}

export interface UserChatProfile {
  id: number;
  fullName: string;
  email: string;
  role: string;
  onlineStatus: 'Online' | 'Offline' | 'Busy' | 'Away';
  statusMessage?: string;
}

export interface SendMessagePayload {
  conversationId: number;
  content: string;
  messageType?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  replyToMessageId?: number;
}

//Announcement Types
export interface Announcement {
  id: number;
  title: string;
  content: string;
  category: 'General' | 'Policy' | 'Event' | 'Urgent';
  isPinned: boolean;
  expiresAt: string | null;
  createdAt: string;
  createdByName: string;
  isRead: boolean;
}

export interface AnnouncementsResponse {
  pinned: Announcement[];
  regular: Announcement[];
  unreadCount: number;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  expiresAt: string | null;
}

export interface UserProfile {
  id:              number;
  fullName:        string;
  email:           string;
  role:            string;
  isActive:        boolean;
  department:      string | null;
  designation:     string | null;
  phone:           string | null;
  bio:             string | null;
  profilePhotoUrl: string | null;
  joinDate:        string | null;
  createdAt:       string;
  managerId:       number | null;
  managerName:     string | null;
}

export interface UpdateProfileDto {
  fullName?:    string;
  phone?:       string;
  bio?:         string;
  designation?: string;
  department?:  string;
  joinDate?:    string;  // ISO string
}

// export interface DirectoryUser {
//   id: number;
//   fullName: string;
//   email: string;
//   role: string;
//   department: string | null;
//   designation: string | null;
//   phone: string | null;
//   profilePhotoUrl: string | null;
//   isActive: boolean;
//   managerName: string | null;
// }

export interface UpdateEmployeeProfileDto {
  department?:  string;
  designation?: string;
  joinDate?:    string;  // ISO string
  managerId?:   number;
}
export type DirectoryUser = UserProfile;

export type MemberDayStatus =
  | 'Present' | 'WFH' | 'HalfDay' | 'Leave'
  | 'Absent'  | 'Weekend' | 'Unknown';

export interface CalendarMemberDay {
  userId:          number;
  fullName:        string;
  profilePhotoUrl: string | null;
  role:            string;
  status:          MemberDayStatus;
  leaveType:       string | null;
}

export interface CalendarDay {
  date:        string;        // "yyyy-MM-dd"
  weekday:     string;        // "Mon", "Tue" …
  isWeekend:   boolean;
  isHoliday:   boolean;
  holidayName: string | null;
  isToday:     boolean;
  members:     CalendarMemberDay[];
}

export interface TeamCalendarResponse {
  month: number;
  year:  number;
  label: string;              // "June 2025"
  days:  CalendarDay[];
}


