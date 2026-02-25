import { useQuery } from '@tanstack/react-query';
import { authApi } from '../services/api';
import { KudosFeed } from './Dashboardwidgets';
import { GiveKudosForm } from './Teamcomponents';
import { KudosSummary } from '../types';
import { kudosApi } from '../services/api';
import { GoalsWidget } from './Dashboardwidgets';

export const KudosPage = () => {
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.getUsers().then(r => r.data),
  });

  const { data: mySummary } = useQuery<KudosSummary>({
    queryKey: ['myKudos'],
    queryFn: () => kudosApi.getMySummary().then(r => r.data),
  });

  const BADGES: Record<string, { emoji: string; label: string }> = {
    GreatWork: { emoji: '🌟', label: 'Great Work' },
    TeamPlayer: { emoji: '🤝', label: 'Team Player' },
    ProblemSolver: { emoji: '🔧', label: 'Problem Solver' },
    Mentor: { emoji: '🎓', label: 'Mentor' },
    Innovation: { emoji: '💡', label: 'Innovation' },
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Kudos & Recognition 🏆</h1>
        <p className="text-slate-400 text-sm mt-1">Celebrate your teammates and make someone's day!</p>
      </div>

      {/* My kudos summary */}
      {mySummary && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">My Kudos Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">{mySummary.totalReceived}</p>
              <p className="text-xs text-slate-500 mt-0.5">Received</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{mySummary.totalGiven}</p>
              <p className="text-xs text-slate-500 mt-0.5">Given</p>
            </div>
            {Object.entries(mySummary.badgeCounts).slice(0, 2).map(([badge, count]) => (
              <div key={badge} className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-2xl">{BADGES[badge]?.emoji ?? '🏅'}</p>
                <p className="text-sm font-bold text-white">{count}</p>
                <p className="text-xs text-slate-500">{BADGES[badge]?.label ?? badge}</p>
              </div>
            ))}
          </div>
          {/* Badge showcase */}
          {Object.keys(mySummary.badgeCounts).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(mySummary.badgeCounts).map(([badge, count]) => (
                <span key={badge} className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-medium">
                  {BADGES[badge]?.emoji} {BADGES[badge]?.label} ×{count}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Give kudos */}
        <GiveKudosForm users={users as Array<{id: number; fullName: string}>} />

        {/* Feed */}
        <KudosFeed />
      </div>
    </div>
  );
};