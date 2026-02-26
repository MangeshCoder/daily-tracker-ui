import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi, holidayApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/Authcontext';
import { Trash2 } from 'lucide-react';

export const LeaveManagementPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isManager = user?.role === 'Manager';
  const [showApply, setShowApply] = useState(false);
  const [tab, setTab] = useState<'mine' | 'all' | 'holidays'>('mine');
  const [form, setForm] = useState({ fromDate: '', toDate: '', leaveType: 'Casual', reason: '' });
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const { data: myLeaves = [] } = useQuery({ queryKey: ['myLeaves'], queryFn: () => leaveApi.getMine().then(r => r.data), enabled: tab === 'mine' });
  const { data: allLeaves = [] } = useQuery({ queryKey: ['allLeaves'], queryFn: () => leaveApi.getAll().then(r => r.data), enabled: tab === 'all' && isManager });
  const { data: holidays = [] } = useQuery({ queryKey: ['holidays'], queryFn: () => holidayApi.getByYear().then(r => r.data), enabled: tab === 'holidays' });
  
  const { data: balances = [], isLoading: balanceLoading } = useQuery({
    queryKey: ['leaveBalance'],
    queryFn: () => leaveApi.getBalance().then(r => r.data),
  });

  const [holidayForm, setHolidayForm] = useState({name: '',date: '',type: 'Public'});

  const applyLeave = useMutation({
    mutationFn: () => leaveApi.apply(form),

    onSuccess: () => {
      toast.success('Leave applied successfully 🎉');
      qc.invalidateQueries({ queryKey: ['myLeaves'] });
      qc.invalidateQueries({ queryKey: ['leaveBalance'] });
      setShowApply(false);
    },

    onError: (error: any) => {
      const msg =
        error.response?.data?.message ||
        error.response?.data ||
        'Leave limit reached for this month';

      toast.error(msg);
    }
  });
  const cancelLeave = useMutation({
    mutationFn: (id: number) => leaveApi.cancel(id),
    onSuccess: () => { toast.success('Leave cancelled'); qc.invalidateQueries({ queryKey: ['myLeaves'] }); }
  });
  const doReview = useMutation({
    mutationFn: ({ id, s }: { id: number; s: string }) => leaveApi.review(id, { status: s, reviewNote }),
    onSuccess: () => { toast.success('Review submitted'); qc.invalidateQueries({ queryKey: ['allLeaves'] }); setReviewId(null); }
  });

  const createHoliday = useMutation({
    mutationFn: () => holidayApi.create(holidayForm),
    onSuccess: () => {
      toast.success('Holiday added successfully 🎉');
      qc.invalidateQueries({ queryKey: ['holidays'] });
      setHolidayForm({ name: '', date: '', type: 'Public' });
    }
  });

  const deleteHoliday = useMutation({
    mutationFn: (id: number) => holidayApi.delete(id),
    onSuccess: () => {
      toast.success('Holiday deleted');
      qc.invalidateQueries({ queryKey: ['holidays'] });
    }
  });

  const leaveData: any[] = tab === 'mine' ? myLeaves : tab === 'all' ? allLeaves : [];
  const statusColor: Record<string, string> = { Pending: 'text-amber-400 bg-amber-500/10 border border-amber-500/20', Approved: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20', Rejected: 'text-red-400 bg-red-500/10 border border-red-500/20' };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">

        <div><h1 className="text-2xl font-bold text-white">Leave Management</h1><p className="text-slate-400 text-sm mt-1">Apply and track your leave requests</p></div>
        <button onClick={() => setShowApply(!showApply)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
          {showApply ? 'Cancel' : '+ Apply Leave'}
        </button>
      </div>
              {/* Leave Balance Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">
            📊 Monthly Leave Balance
          </h3>

          {balances.length === 0 && (
            <p className="text-slate-500 text-sm">
              No leave used this month.
            </p>
          )}

          <div className="space-y-2">
            {balances.map((b: any) => (
              <div
                key={b.userId}
                className="flex justify-between items-center bg-slate-800 px-4 py-2 rounded-xl"
              >
                <div>
                  <p className="text-white text-sm font-medium">
                    {isManager ? b.userName : 'Your Balance'}
                  </p>
                  <p className="text-slate-400 text-xs">
                    Used: {b.usedDays} day{b.usedDays !== 1 ? 's' : ''}
                  </p>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-xl font-medium ${
                    b.remainingDays === 0
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {b.remainingDays} Remaining
                </span>
              </div>
            ))}
          </div>
        </div>

      {showApply && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">New Leave Application</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div><label className="block text-xs text-slate-400 mb-1">From Date</label>
              <input type="date" value={form.fromDate} onChange={e => setForm(p => ({ ...p, fromDate: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">To Date</label>
              <input type="date" value={form.toDate} onChange={e => setForm(p => ({ ...p, toDate: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Leave Type</label>
              <select value={form.leaveType} onChange={e => setForm(p => ({ ...p, leaveType: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['Casual','Sick','Earned','CompOff','Unpaid'].map(t => <option key={t}>{t}</option>)}
              </select></div>
          </div>
          <textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Reason for leave..." rows={2} className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3" />
          <button onClick={() => applyLeave.mutate()} disabled={!form.fromDate || !form.toDate || !form.reason.trim() || applyLeave.isPending} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition">
            {applyLeave.isPending ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-5 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 w-fit">
        {(['mine', ...(isManager ? ['all'] : []), 'holidays'] as const).map(t => (
          <button key={t} onClick={() => setTab(t as 'mine' | 'all' | 'holidays')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t === 'mine' ? 'My Leaves' : t === 'all' ? 'All Team Leaves' : '🗓️ Holidays'}
          </button>
        ))}
      </div>

      {tab === 'holidays' ? (
        <>
            {/* Manager Create Form */}
            {isManager && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
                <h3 className="text-sm font-semibold text-white mb-4">Add New Holiday</h3>

                <div className="grid md:grid-cols-3 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Holiday Name"
                    value={holidayForm.name}
                    onChange={e => setHolidayForm(p => ({ ...p, name: e.target.value }))}
                    className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2"
                  />

                  <input
                    type="date"
                    value={holidayForm.date}
                    onChange={e => setHolidayForm(p => ({ ...p, date: e.target.value }))}
                    className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2"
                  />

                  <select
                    value={holidayForm.type}
                    onChange={e => setHolidayForm(p => ({ ...p, type: e.target.value }))}
                    className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2"
                  >
                    <option value="Public">Public</option>
                    <option value="Optional">Optional</option>
                    <option value="Company">Company</option>
                  </select>
                </div>

                <button
                  onClick={() => createHoliday.mutate()}
                  disabled={!holidayForm.name || !holidayForm.date || createHoliday.isPending}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  {createHoliday.isPending ? 'Adding...' : 'Add Holiday'}
                </button>
              </div>
            )}

            {/* Holiday Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(holidays as any[]).map((h: any) => (
                <div
                  key={h.id}
                  className={`bg-slate-900 border rounded-2xl p-4 ${
                    h.isToday
                      ? 'border-blue-500 ring-1 ring-blue-500/20'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-semibold">{h.name}</p>
                      <p className="text-slate-400 text-sm mt-1">
                        {new Date(h.date).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </p>
                    </div>

                    {/* Delete button for Manager */}
                    {isManager && (
                      <button
                        onClick={() => deleteHoliday.mutate(h.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-lg">
                      {h.type}
                    </span>

                    {h.isToday && (
                      <span className="text-xs text-blue-400 font-medium">
                        Today 🎉
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {(holidays as any[]).length === 0 && (
                <div className="col-span-3 text-center py-12 text-slate-500">
                  No holidays added yet.
                </div>
              )}
            </div>
          </>
      ) : (
        <div className="space-y-3">
          {leaveData.length === 0 && <div className="text-center py-12 text-slate-500">No leave requests found.</div>}
          {leaveData.map((l: any) => (
            <div key={l.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {tab === 'all' && <p className="text-xs text-slate-400 mb-1 font-medium">👤 {l.userName}</p>}
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold">{l.leaveType} Leave</p>
                    <span className="text-xs text-slate-500">•</span>
                    <p className="text-slate-400 text-sm">{l.leaveDays} day{l.leaveDays > 1 ? 's' : ''}</p>
                  </div>
                  <p className="text-slate-300 text-sm">{new Date(l.fromDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {new Date(l.toDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-slate-500 text-xs mt-1.5">{l.reason}</p>
                  {l.reviewerName && <p className="text-slate-400 text-xs mt-1">Reviewed by {l.reviewerName}{l.reviewNote ? `: ${l.reviewNote}` : ''}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <span className={`text-xs px-2.5 py-1 rounded-xl font-medium ${statusColor[l.status] ?? ''}`}>{l.status}</span>
                  <p className="text-xs text-slate-600">Applied {new Date(l.appliedAt).toLocaleDateString()}</p>
                  {tab === 'mine' && l.status === 'Pending' && (
                    <button onClick={() => cancelLeave.mutate(l.id)} className="text-xs text-red-400 hover:text-red-300 transition">Cancel</button>
                  )}
                  {tab === 'all' && l.status === 'Pending' && !reviewId && (
                    <button onClick={() => setReviewId(l.id)} className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-lg hover:bg-blue-600/30 transition">Review</button>
                  )}
                </div>
              </div>
              {reviewId === l.id && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Review note (optional)..." rows={2} className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none resize-none mb-3" />
                  <div className="flex gap-2">
                    <button onClick={() => doReview.mutate({ id: l.id, s: 'Approved' })} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm py-2 rounded-xl font-medium transition">✅ Approve</button>
                    <button onClick={() => doReview.mutate({ id: l.id, s: 'Rejected' })} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm py-2 rounded-xl font-medium transition">❌ Reject</button>
                    <button onClick={() => setReviewId(null)} className="bg-slate-700 text-slate-300 text-sm py-2 px-3 rounded-xl">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};