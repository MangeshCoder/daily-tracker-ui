// ─────────────────────────────────────────────────────────────────────────────
//  FILE 9:  frontend/src/pages/Supportpage.tsx
//  ACTION:  REPLACE entire file
//
//  Changes from original:
//  1. useGeolocation hook imported and used
//  2. "Log Support" button triggers GPS request FIRST before showing form
//  3. Location status banner shown inside the form (green=ok, red=outside)
//  4. Submit is disabled unless location is confirmed
//  5. lat/lng appended to FormData for with-media path
//  6. lat/lng added to JSON body for no-media path
//  7. Backend 403 (location error) caught and displayed separately
//  8. All original UI preserved exactly — list/kanban, media upload, delete
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from 'react';
import { supportApi, authApi } from '../services/api';
import { SupportLog, User, CreateSupportDto } from '../types';
import { SupportMediaDisplay } from '../components/SupportMediaDisplay';
import { SupportKanbanBoard } from './SupportKanbanBoard';
import { SupportFileUpload } from '../components/SupportFileUpload';
import { Trash2 } from 'lucide-react';
import { useGeolocation } from '../context/useGeolocation';

const supportTypes = ['Technical', 'CodeReview', 'Debugging', 'Deployment', 'Other'];

const formatISTTime = (dateString?: string) => {
  if (!dateString) return '--:--';
  const utcDate = new Date(dateString + 'Z');
  return utcDate.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
    hour12: true, timeZone: 'Asia/Kolkata',
  });
};

const defaultForm: CreateSupportDto = {
  supportedDeveloperId: 0,
  issueDescription:     '',
  resolution:           '',
  timeSpentMinutes:     0,
  supportType:          'Technical',
};

// ── Location Status Banner ─────────────────────────────────────────────────────
// Shown inside the form to communicate GPS state clearly to the employee
function LocationBanner({
  status, distance, accuracy, errorMessage, onRetry,
}: {
  status:       string;
  distance:     number | null;
  accuracy:     number | null;
  errorMessage: string;
  onRetry:      () => void;
}) {
  if (status === 'requesting') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
        <div>
          <p className="text-blue-400 text-sm font-medium">Checking your location…</p>
          <p className="text-blue-400/60 text-xs mt-0.5">Please allow location access when prompted</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl">
        <span className="text-xl shrink-0">✅</span>
        <div>
          <p className="text-green-400 text-sm font-medium">You are at the office</p>
          <p className="text-green-400/60 text-xs mt-0.5">
            {distance !== null ? `${Math.round(distance)}m from office` : ''}
            {accuracy !== null ? ` · GPS accuracy ±${Math.round(accuracy)}m` : ''}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'outside') {
    return (
      <div className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
        <span className="text-xl shrink-0 mt-0.5">📍</span>
        <div className="flex-1">
          <p className="text-red-400 text-sm font-medium">You are not at the company location</p>
          <p className="text-red-400/70 text-xs mt-0.5">{errorMessage}</p>
        </div>
        <button
          onClick={onRetry}
          className="shrink-0 text-xs text-red-400 hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <span className="text-xl shrink-0">🔒</span>
        <div>
          <p className="text-amber-400 text-sm font-medium">Location permission denied</p>
          <p className="text-amber-400/70 text-xs mt-0.5">
            Open your browser settings → Site settings → Location → Allow for this site, then retry.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'timeout' || status === 'unavailable' || status === 'error') {
    return (
      <div className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
        <span className="text-xl shrink-0">⚠️</span>
        <div className="flex-1">
          <p className="text-red-400 text-sm font-medium">Could not get your location</p>
          <p className="text-red-400/70 text-xs mt-0.5">{errorMessage}</p>
        </div>
        <button
          onClick={onRetry}
          className="shrink-0 text-xs text-red-400 hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return null;
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export const SupportPage = () => {
  const [logs,    setLogs]    = useState<SupportLog[]>([]);
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,    setForm]    = useState<CreateSupportDto>(defaultForm);
  const [files,   setFiles]   = useState<File[]>([]);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [view,    setView]    = useState<'list' | 'kanban'>('list');
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── Geolocation hook ────────────────────────────────────────────────────────
  const geo = useGeolocation();

  const load = async () => {
    try {
      const [logsRes, usersRes] = await Promise.all([
        supportApi.getToday(),
        authApi.getUsers(),
      ]);
      setLogs(logsRes.data);
      setUsers(usersRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Open form: request GPS first ────────────────────────────────────────────
  // WHY: We request location before showing the form so the employee knows
  // immediately whether they can submit. No wasted form-filling effort.
  const handleOpenForm = async () => {
    setShowForm(true);
    setError('');
    await geo.requestLocation();
  };

  // ── Retry GPS from inside the form ─────────────────────────────────────────
  const handleRetryLocation = async () => {
    setError('');
    await geo.requestLocation();
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.supportedDeveloperId) {
      setError('Please select a developer.');
      return;
    }

    // Frontend gate — instant feedback without a round trip
    if (!geo.withinOffice || geo.latitude === null || geo.longitude === null) {
      setError('Location check required. Please allow location access and ensure you are at the office.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (files.length > 0) {
        // Multipart form — append lat/lng as form fields
        const formData = new FormData();
        formData.append('supportedDeveloperId', form.supportedDeveloperId.toString());
        formData.append('issueDescription',     form.issueDescription);
        formData.append('resolution',           form.resolution ?? '');
        formData.append('timeSpentMinutes',     form.timeSpentMinutes.toString());
        formData.append('supportType',          form.supportType);
        formData.append('latitude',             geo.latitude.toString());   // ← NEW
        formData.append('longitude',            geo.longitude.toString());  // ← NEW
        files.forEach((f) => formData.append('files', f));

        await supportApi.createWithMedia(formData, (percent) => {
          setUploadProgress(percent);
        });
      } else {
        // JSON body — add lat/lng to the object
        await supportApi.create({
          ...form,
          latitude:  geo.latitude,   // ← NEW
          longitude: geo.longitude,  // ← NEW
        });
      }

      setForm(defaultForm);
      setFiles([]);
      setShowForm(false);
      await load();

    } catch (err: any) {
      // 403 = backend location rejection (catches Postman bypass attempts too)
      if (err?.response?.status === 403) {
        setError(err.response.data?.message ?? 'You are not at the company location.');
      } else {
        setError('Failed to log support. Make sure you are checked in today.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this support log?')) return;
    await supportApi.delete(id);
    await load();
  };

  const totalTime = useMemo(
    () => logs.reduce((sum, l) => sum + l.timeSpentMinutes, 0),
    [logs]
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Logs</h1>
          <p className="text-slate-400 text-sm mt-1">
            {logs.length} logs · {Math.floor(totalTime / 60)}h {totalTime % 60}m total
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-xl text-sm ${view === 'list' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            List
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`px-4 py-2 rounded-xl text-sm ${view === 'kanban' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            Kanban
          </button>
          <button
            onClick={handleOpenForm}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm"
          >
            Log Support
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 mb-6 space-y-4">

          {/* ── Location Banner ─────────────────────────────────────────── */}
          <LocationBanner
            status={geo.status}
            distance={geo.distance}
            accuracy={geo.accuracy}
            errorMessage={geo.errorMessage}
            onRetry={handleRetryLocation}
          />

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">

              <select
                value={form.supportedDeveloperId}
                onChange={e => setForm({ ...form, supportedDeveloperId: parseInt(e.target.value) })}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm"
              >
                <option value={0}>Select developer...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.fullName}</option>
                ))}
              </select>

              <select
                value={form.supportType}
                onChange={e => setForm({ ...form, supportType: e.target.value })}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm"
              >
                {supportTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <textarea
                required rows={2}
                value={form.issueDescription}
                onChange={e => setForm({ ...form, issueDescription: e.target.value })}
                className="col-span-2 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm"
                placeholder="Issue description..."
              />

              <textarea
                rows={2}
                value={form.resolution}
                onChange={e => setForm({ ...form, resolution: e.target.value })}
                className="col-span-2 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm"
                placeholder="Resolution..."
              />

              <input
                type="number" min={0}
                value={form.timeSpentMinutes}
                onChange={e => setForm({ ...form, timeSpentMinutes: parseInt(e.target.value) || 0 })}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm"
                placeholder="Time spent (minutes)"
              />

              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-2">Attach Files</label>
                <SupportFileUpload
                  files={files}
                  setFiles={setFiles}
                  uploadProgress={uploadProgress}
                />
                {files.length > 0 && (
                  <div className="mt-3 space-y-1 text-xs text-slate-400">
                    {files.map((file, index) => (
                      <div key={index}
                        className="flex justify-between items-center bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
                        <span className="truncate">{file.name}</span>
                        <span className="text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || !geo.withinOffice}
                title={!geo.withinOffice ? 'Location verification required' : ''}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content — unchanged from original */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : view === 'kanban' ? (
        <SupportKanbanBoard logs={logs} onDelete={handleDelete} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {logs.map((log) => (
            <div key={log.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-violet-500/40 transition-all duration-200 shadow-md">

              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-white font-semibold text-sm">{log.supportedDeveloperName}</h3>
                  <p className="text-xs text-slate-500 mt-1">{formatISTTime(log.supportedAt)}</p>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p className="text-slate-300 text-sm mb-2 line-clamp-2">{log.issueDescription}</p>

              {log.resolution && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg px-3 py-2 text-xs mb-3">
                  ✔ {log.resolution}
                </div>
              )}

              {log.media && log.media.length > 0 && (
                <SupportMediaDisplay media={log.media} />
              )}

              {/* Location tag — shown if coordinates are stored */}
              {(log as any).distanceFromOfficeMetres != null && (
                <div className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                  <span>📍</span>
                  <span>{Math.round((log as any).distanceFromOfficeMetres)}m from office</span>
                </div>
              )}

              <div className="flex justify-between items-center mt-3 text-xs">
                <span className="bg-slate-800 px-3 py-1 rounded-lg text-slate-300">
                  ⏱ {log.timeSpentMinutes} min
                </span>
                <span className="text-slate-500">{log.supportType}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};