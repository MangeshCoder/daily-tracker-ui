import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { teamCalendarApi } from '../services/api';
import { useAuth } from '../context/Authcontext';
import type {
  TeamCalendarResponse,
  CalendarDay,
  CalendarMemberDay,
  MemberDayStatus,
} from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────
const BACKEND_ORIGIN = 'https://localhost:7096';

const STATUS_CFG: Record<
  MemberDayStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  Present: { label: 'Present',  dot: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  WFH:     { label: 'WFH',      dot: 'bg-blue-500',    text: 'text-blue-400',    bg: 'bg-blue-500/10'    },
  HalfDay: { label: 'Half Day', dot: 'bg-amber-500',   text: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  Leave:   { label: 'On Leave', dot: 'bg-rose-500',    text: 'text-rose-400',    bg: 'bg-rose-500/10'    },
  Absent:  { label: 'Absent',   dot: 'bg-slate-600',   text: 'text-slate-500',   bg: 'bg-slate-800/50'   },
  Weekend: { label: 'Weekend',  dot: 'bg-slate-700',   text: 'text-slate-600',   bg: 'bg-transparent'    },
  Unknown: { label: '—',        dot: 'bg-slate-700',   text: 'text-slate-600',   bg: 'bg-transparent'    },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ src, name, size = 'sm' }: { src?: string | null; name: string; size?: 'xs' | 'sm' | 'md' }) => {
  const sizeMap = { xs: 'w-5 h-5 text-[9px]', sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm' };
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const resolvedSrc = src ? (src.startsWith('http') ? src : `${BACKEND_ORIGIN}${src}`) : null;

  if (resolvedSrc) {
    return <img src={resolvedSrc} alt={name} className={`${sizeMap[size]} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-blue-500 to-violet-600
      flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
};

// ─── Status dot pill ──────────────────────────────────────────────────────────
const StatusDot = ({ status }: { status: MemberDayStatus }) => {
  const cfg = STATUS_CFG[status];
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />;
};

// ─── Today's availability sidebar ────────────────────────────────────────────
const TodayPanel = ({ today }: { today: CalendarDay | undefined }) => {
  if (!today) return null;

  const groups = useMemo(() => {
    const g: Partial<Record<MemberDayStatus, CalendarMemberDay[]>> = {};
    for (const m of today.members) {
      if (!g[m.status]) g[m.status] = [];
      g[m.status]!.push(m);
    }
    return g;
  }, [today]);

  const orderedStatuses: MemberDayStatus[] = ['Present', 'WFH', 'HalfDay', 'Leave', 'Absent', 'Unknown'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">📍</span>
        <h2 className="text-white font-semibold text-sm">Today's Availability</h2>
        {today.isHoliday && (
          <span className="ml-auto bg-violet-500/15 text-violet-400 border border-violet-500/30
            text-[10px] px-2 py-0.5 rounded-full">
            🎉 {today.holidayName}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {orderedStatuses.map(status => {
          const members = groups[status];
          if (!members?.length) return null;
          const cfg = STATUS_CFG[status];
          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-2">
                <StatusDot status={status} />
                <span className={`text-xs font-medium ${cfg.text}`}>
                  {cfg.label} <span className="text-slate-600">({members.length})</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {members.map(m => (
                  <div key={m.userId} className="flex items-center gap-1.5 bg-slate-800/60
                    rounded-lg px-2 py-1.5" title={m.fullName}>
                    <Avatar src={m.profilePhotoUrl} name={m.fullName} size="xs" />
                    <span className="text-slate-300 text-xs truncate max-w-[80px]">
                      {m.fullName.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Day cell tooltip ─────────────────────────────────────────────────────────
const DayTooltip = ({ day, onClose }: { day: CalendarDay; onClose: () => void }) => {
  const groups = useMemo(() => {
    const g: Partial<Record<MemberDayStatus, CalendarMemberDay[]>> = {};
    for (const m of day.members) {
      if (!g[m.status]) g[m.status] = [];
      g[m.status]!.push(m);
    }
    return g;
  }, [day]);

  const orderedStatuses: MemberDayStatus[] = ['Present', 'WFH', 'HalfDay', 'Leave', 'Absent', 'Unknown'];
  const dateObj = new Date(day.date + 'T00:00:00');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl
          max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">
              {dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {day.isHoliday && (
              <p className="text-violet-400 text-xs mt-0.5">🎉 {day.holidayName}</p>
            )}
            {day.isToday && (
              <p className="text-blue-400 text-xs mt-0.5">Today</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Members grouped by status */}
        <div className="p-5 space-y-4">
          {orderedStatuses.map(status => {
            const members = groups[status];
            if (!members?.length) return null;
            const cfg = STATUS_CFG[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-2">
                  <StatusDot status={status} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.text}`}>
                    {cfg.label} ({members.length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {members.map(m => (
                    <div key={m.userId} className="flex items-center gap-2.5 px-2 py-1.5
                      bg-slate-800/50 rounded-xl">
                      <Avatar src={m.profilePhotoUrl} name={m.fullName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-xs font-medium truncate">{m.fullName}</p>
                        <p className="text-slate-500 text-[10px]">
                          {m.role}
                          {m.status === 'Leave' && m.leaveType ? ` · ${m.leaveType} leave` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Calendar cell ────────────────────────────────────────────────────────────
const DayCell = ({
  day,
  filteredUserIds,
  onClick,
}: {
  day: CalendarDay;
  filteredUserIds: Set<number> | null;
  onClick: () => void;
}) => {
  const dateNum = parseInt(day.date.split('-')[2]);
  const isWeekend = day.isWeekend;

  // Count statuses for mini bars (filtered or all)
  const relevantMembers = filteredUserIds
    ? day.members.filter(m => filteredUserIds.has(m.userId))
    : day.members;

  const counts = useMemo(() => {
    const c: Partial<Record<MemberDayStatus, number>> = {};
    for (const m of relevantMembers) {
      c[m.status] = (c[m.status] ?? 0) + 1;
    }
    return c;
  }, [relevantMembers]);

  const statusOrder: MemberDayStatus[] = ['Present', 'WFH', 'HalfDay', 'Leave'];

  if (isWeekend) {
    return (
      <div className="bg-slate-950/40 rounded-xl p-2 min-h-[80px] flex flex-col">
        <span className="text-slate-700 text-xs font-medium">{dateNum}</span>
        {day.isHoliday && (
          <span className="text-[9px] text-violet-500 mt-auto truncate">{day.holidayName}</span>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-2 min-h-[80px] flex flex-col cursor-pointer transition-all
        hover:border-slate-600 border
        ${day.isToday
          ? 'bg-blue-600/10 border-blue-500/40'
          : day.isHoliday
            ? 'bg-violet-500/5 border-violet-500/20'
            : 'bg-slate-900 border-slate-800 hover:bg-slate-800/60'}`}
    >
      {/* Date number */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-semibold
          ${day.isToday ? 'text-blue-400' : 'text-slate-300'}`}>
          {dateNum}
        </span>
        {day.isHoliday && <span className="text-[9px] text-violet-400">🎉</span>}
      </div>

      {/* Status mini bars */}
      <div className="flex-1 space-y-1">
        {statusOrder.map(s => {
          const n = counts[s];
          if (!n) return null;
          const cfg = STATUS_CFG[s];
          return (
            <div key={s} className={`flex items-center gap-1 rounded px-1.5 py-0.5 ${cfg.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
              <span className={`text-[10px] font-medium ${cfg.text} truncate`}>
                {n} {cfg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Holiday name */}
      {day.isHoliday && (
        <p className="text-[9px] text-violet-400 mt-1 truncate">{day.holidayName}</p>
      )}
    </div>
  );
};

// ─── Main TeamCalendarPage ────────────────────────────────────────────────────
export const TeamCalendarPage = () => {
  const { user } = useAuth();
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);  // 1-based
  const [year, setYear]   = useState(now.getFullYear());
  const [selectedDay, setSelectedDay]   = useState<CalendarDay | null>(null);
  const [filterStatus, setFilterStatus] = useState<MemberDayStatus | ''>('');
  const [searchName, setSearchName]     = useState('');

  const { data, isLoading } = useQuery<TeamCalendarResponse>({
    queryKey: ['teamCalendar', month, year],
    queryFn:  () => teamCalendarApi.get(month, year).then(r => r.data),
    staleTime: 60_000,
  });

  // Month navigation
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setMonth(now.getMonth() + 1); setYear(now.getFullYear()); };

  // Today's data for the side panel
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayDay = data?.days.find(d => d.date === todayStr);

  // All unique members across the calendar (stable list)
  const allMembers = useMemo(() => {
    if (!data) return [];
    const seen = new Map<number, CalendarMemberDay>();
    for (const day of data.days) {
      for (const m of day.members) {
        if (!seen.has(m.userId)) seen.set(m.userId, m);
      }
    }
    return [...seen.values()].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [data]);

  // Filtered user IDs for cell display (null = no filter = show all)
  const filteredUserIds = useMemo<Set<number> | null>(() => {
    if (!searchName && !filterStatus) return null;
    const ids = new Set<number>();
    for (const m of allMembers) {
      const matchName = !searchName || m.fullName.toLowerCase().includes(searchName.toLowerCase());
      if (matchName) ids.add(m.userId);
    }
    return ids.size === allMembers.length ? null : ids;
  }, [allMembers, searchName, filterStatus]);

  // Summary stats for selected month
  const stats = useMemo(() => {
    if (!data) return null;
    let present = 0, wfh = 0, onLeave = 0, absent = 0;
    for (const day of data.days) {
      if (day.isWeekend) continue;
      for (const m of day.members) {
        if (m.status === 'Present') present++;
        else if (m.status === 'WFH') wfh++;
        else if (m.status === 'Leave') onLeave++;
        else if (m.status === 'Absent') absent++;
      }
    }
    return { present, wfh, onLeave, absent };
  }, [data]);

  // Calendar grid — pad leading empty cells for first weekday
  const firstDayOfWeek = data
    ? new Date(year, month - 1, 1).getDay()  // 0 = Sun
    : 0;
  // Adjust to Mon-first: Sun (0) becomes 6, Mon (1) becomes 0, etc.
  const leadingBlanks = (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Calendar 📅</h1>
          <p className="text-slate-400 text-sm mt-1">
            See who's in, WFH, or on leave across your team
          </p>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800
              border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            ‹
          </button>
          <button
            onClick={goToday}
            className="px-4 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-300
              hover:text-white hover:bg-slate-700 transition-colors text-sm font-medium min-w-[130px] text-center"
          >
            {data?.label ?? `${month}/${year}`}
          </button>
          <button
            onClick={nextMonth}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800
              border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {([
            { label: 'Present Days',    value: stats.present,  dot: 'bg-emerald-500' },
            { label: 'WFH Days',        value: stats.wfh,      dot: 'bg-blue-500'    },
            { label: 'On Leave Days',   value: stats.onLeave,  dot: 'bg-rose-500'    },
            { label: 'Absent Days',     value: stats.absent,   dot: 'bg-slate-600'   },
          ] as const).map(({ label, value, dot }) => (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${dot} flex-shrink-0`} />
              <div>
                <p className="text-2xl font-bold text-white leading-none">{value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Main layout: calendar + today panel ─────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">

        {/* Calendar grid */}
        <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[180px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
              <input
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                placeholder="Filter by name…"
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl
                  pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                  placeholder-slate-500"
              />
            </div>
            {(searchName) && (
              <button
                onClick={() => { setSearchName(''); setFilterStatus(''); }}
                className="px-3 py-2 rounded-xl border border-slate-700 text-slate-400
                  hover:text-white text-sm transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {(['Present', 'WFH', 'HalfDay', 'Leave', 'Absent'] as MemberDayStatus[]).map(s => {
              const cfg = STATUS_CFG[s];
              return (
                <div key={s} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  <span className="text-slate-400 text-xs">{cfg.label}</span>
                </div>
              );
            })}
          </div>

          {/* Weekday headers — Mon to Sun */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-500 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          {isLoading ? (
            <div className="grid grid-cols-7 gap-1">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="bg-slate-900 rounded-xl h-20 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Leading blanks */}
              {[...Array(leadingBlanks)].map((_, i) => (
                <div key={`blank-${i}`} className="min-h-[80px]" />
              ))}
              {/* Day cells */}
              {data?.days.map(day => (
                <DayCell
                  key={day.date}
                  day={day}
                  filteredUserIds={filteredUserIds}
                  onClick={() => !day.isWeekend && setSelectedDay(day)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Today panel (sidebar) */}
        <div className="space-y-4">
          <TodayPanel today={todayDay} />

          {/* Member legend */}
          {allMembers.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                Team Members ({allMembers.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {allMembers.map(m => (
                  <div key={m.userId} className="flex items-center gap-2.5">
                    <Avatar src={m.profilePhotoUrl} name={m.fullName} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-xs truncate">{m.fullName}</p>
                      <p className="text-slate-600 text-[10px]">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Day detail modal */}
      {selectedDay && (
        <DayTooltip day={selectedDay} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  );
};