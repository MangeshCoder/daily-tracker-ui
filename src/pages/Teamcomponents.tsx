import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eodApi,presenceApi,kudosApi } from '../services/api';
import { UserPresence } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/Authcontext';

// ═══════════════════════════════════════════════════════════════════════════════
//  Feature 6: EOD Report Modal
// ═══════════════════════════════════════════════════════════════════════════════
interface EODModalProps { open: boolean; onClose: () => void; }

const MOODS = [
  { value: 'Great', emoji: '🚀', label: 'Great' },
  { value: 'Good', emoji: '😊', label: 'Good' },
  { value: 'Okay', emoji: '😐', label: 'Okay' },
  { value: 'Tired', emoji: '😴', label: 'Tired' },
  { value: 'Stressed', emoji: '😰', label: 'Stressed' },
];

export const EODReportModal = ({ open, onClose }: EODModalProps) => {
  const [form, setForm] = useState({
    whatWasDone: '', blockers: '', planForTomorrow: '', learnings: '', moodRating: 'Good'
  });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ['eodToday'],
    queryFn: () => eodApi.getToday().then(r => r.data),
    enabled: open,
  });

  const submit = useMutation({
    mutationFn: () => eodApi.submit(form),
    onSuccess: () => {
      toast.success('EOD report submitted! Great work today 🎉');
      qc.invalidateQueries({ queryKey: ['eodToday'] });
      onClose();
    },
    onError: () => toast.error('Failed to submit report. Are you checked in?')
  });

  if (!open) return null;

  const fields = [
    { key: 'whatWasDone', label: '✅ What did you accomplish today?', placeholder: 'List your key accomplishments...', required: true },
    { key: 'blockers', label: '🚫 Blockers or issues?', placeholder: 'Any blockers, bugs, or issues you faced...' },
    { key: 'planForTomorrow', label: '📋 Plan for tomorrow?', placeholder: 'What will you work on tomorrow...' },
    { key: 'learnings', label: '💡 Learnings?', placeholder: 'Something new you learned today...' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">📝 End of Day Report</h3>
            <p className="text-slate-400 text-xs mt-0.5">Wrap up your day — takes 2 minutes</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition">✕</button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {existing && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <p className="text-emerald-400 text-xs">✅ You already submitted today's EOD report. You can update it.</p>
            </div>
          )}

          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {f.label} {f.required && <span className="text-red-400">*</span>}
              </label>
              <textarea
                value={(form as Record<string, string>)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-600"
              />
            </div>
          ))}

          {/* Mood selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">How are you feeling?</label>
            <div className="flex gap-2">
              {MOODS.map(mood => (
                <button key={mood.value} onClick={() => setForm(p => ({ ...p, moodRating: mood.value }))}
                  className={`flex-1 flex flex-col items-center py-2.5 rounded-xl border transition text-xs ${
                    form.moodRating === mood.value
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}>
                  <span className="text-2xl mb-1">{mood.emoji}</span>
                  {mood.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-800">
          <button
            onClick={() => submit.mutate()}
            disabled={submit.isPending || !form.whatWasDone.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition">
            {submit.isPending ? 'Submitting...' : '📤 Submit EOD Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  Feature 9: Team Presence Panel
// ═══════════════════════════════════════════════════════════════════════════════
export const TeamPresencePanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: team } = useQuery<UserPresence[]>({
    queryKey: ['teamPresence'],
    queryFn: () => presenceApi.getTeam().then(r => r.data),
    refetchInterval: 30_000
  });

  const [myStatus, setMyStatus] = useState('Online');
  const [available, setAvailable] = useState(false);

  const updatePresence = useMutation({
    mutationFn: (d: object) => presenceApi.update(d),
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['teamPresence'] });
    }
  });

  const statusColors: Record<string, string> = {
    Online: 'bg-emerald-500',
    Busy: 'bg-red-500',
    InMeeting: 'bg-amber-500',
    Away: 'bg-slate-500',
    Offline: 'bg-slate-700'
  };

  const statuses = ['Online', 'Busy', 'InMeeting', 'Away'];

  const myTeam = team?.filter(m => m.user.id !== user?.id) ?? [];
  const online = myTeam.filter(m => m.status !== 'Offline' && m.isCheckedInToday);
  const available_devs = myTeam.filter(m => m.isAvailableForHelp);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">👥 Team Presence</h3>

      {/* My status */}
      <div className="bg-slate-800/50 rounded-xl p-3 mb-4">
        <p className="text-xs text-slate-400 mb-2">My Status</p>
        <div className="flex gap-1.5 mb-2">
          {statuses.map(s => (
            <button key={s} onClick={() => setMyStatus(s)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                myStatus === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}>
              {s}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setAvailable(!available)}
            className={`relative w-9 h-5 rounded-full transition ${available ? 'bg-blue-600' : 'bg-slate-700'}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
              available ? 'left-4' : 'left-0.5'
            }`} />
          </div>
          <span className="text-xs text-slate-400">Available for help</span>
        </label>
        <button
          onClick={() => updatePresence.mutate({ status: myStatus, isAvailableForHelp: available })}
          className="mt-2 w-full bg-blue-600/20 text-blue-400 text-xs py-1.5 rounded-lg hover:bg-blue-600/30 transition">
          Update Status
        </button>
      </div>

      {/* Team list */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500">
          {online.length} online · {available_devs.length} available for help
        </p>
        {myTeam.slice(0, 6).map(member => (
          <div key={member.user.id} className="flex items-center gap-2">
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {member.user.fullName.charAt(0)}
              </div>
              <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-900 ${
                statusColors[member.status] ?? 'bg-slate-700'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{member.user.fullName}</p>
              <p className="text-xs text-slate-600">{member.status}</p>
            </div>
            {member.isAvailableForHelp && (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                Available
              </span>
            )}
            {!member.isCheckedInToday && (
              <span className="text-xs text-slate-600">Offline</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  Feature 9: Give Kudos Form
// ═══════════════════════════════════════════════════════════════════════════════
interface KudosFormProps { users: Array<{ id: number; fullName: string }>; onClose?: () => void; }

const BADGES = [
  { value: 'GreatWork', emoji: '🌟', label: 'Great Work' },
  { value: 'TeamPlayer', emoji: '🤝', label: 'Team Player' },
  { value: 'ProblemSolver', emoji: '🔧', label: 'Problem Solver' },
  { value: 'Mentor', emoji: '🎓', label: 'Mentor' },
  { value: 'Innovation', emoji: '💡', label: 'Innovation' },
];

export const GiveKudosForm = ({ users, onClose }: KudosFormProps) => {
  const [toUserId, setToUserId] = useState<number | ''>('');
  const [badge, setBadge] = useState('GreatWork');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const qc = useQueryClient();

  const give = useMutation({
    mutationFn: () => kudosApi.give({ toUserId: toUserId as number, message, badgeType: badge }),
    onSuccess: () => {
      toast.success('Kudos sent! 🎉 You made someone\'s day!');
      qc.invalidateQueries({ queryKey: ['kudosFeed'] });
      qc.invalidateQueries({ queryKey: ['myKudos'] });
      setToUserId('');
      setMessage('');
      onClose?.();
    },
    onError: (e: unknown) => toast.error((e as {response?: {data?: {message?: string}}}).response?.data?.message ?? 'Failed to send kudos')
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">🏆 Give Kudos</h3>

      <div className="space-y-3">
        <select value={toUserId} onChange={e => setToUserId(+e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select teammate...</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>

        <div className="grid grid-cols-5 gap-1.5">
          {BADGES.map(b => (
            <button key={b.value} onClick={() => setBadge(b.value)}
              title={b.label}
              className={`flex flex-col items-center py-2 rounded-xl text-xs transition border ${
                badge === b.value
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}>
              <span className="text-xl">{b.emoji}</span>
              <span className="mt-0.5 text-[10px] leading-tight text-center">{b.label}</span>
            </button>
          ))}
        </div>

        <textarea value={message} onChange={e => setMessage(e.target.value)}
          placeholder="Write a message..."
          rows={3}
          className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-600" />

        <button
          onClick={() => give.mutate()}
          disabled={!toUserId || !message.trim() || give.isPending}
          className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition">
          {give.isPending ? 'Sending...' : '🎉 Send Kudos'}
        </button>
      </div>
    </div>
  );
};