import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PageHeader from '../components/PageHeader.jsx';

function formatDateTime(value) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(value));
}

const stageConfig = {
  APPLIED:   { cls: 'bg-blue-50 border-blue-200 text-blue-700' },
  SCREENING: { cls: 'bg-violet-50 border-violet-200 text-violet-700' },
  INTERVIEW: { cls: 'bg-amber-50 border-amber-200 text-amber-700' },
  OFFER:     { cls: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  HIRED:     { cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  REJECTED:  { cls: 'bg-red-50 border-red-200 text-red-600' },
};

function StageBadge({ stage }) {
  const cfg = stageConfig[stage] || { cls: 'bg-slate-50 border-slate-200 text-slate-600' };
  return (
    <span className={`inline-flex h-6 items-center rounded-lg border px-2.5 text-[11px] font-semibold tracking-wide ${cfg.cls}`}>
      {stage}
    </span>
  );
}

function getDaysClass(days) {
  if (days >= 14) return 'bg-red-100 text-red-700 border-red-200';
  if (days >= 7)  return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function AlertsPage({ onAlertsChanged, requestJson, token }) {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dismissingId, setDismissingId] = useState('');

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  async function loadAlerts() {
    setError('');
    const data = await requestJson('/api/alerts/stalled', { headers: authHeaders });
    setAlerts(data.data ?? []);
    onAlertsChanged(data.count ?? 0);
  }

  useEffect(() => {
    let isCurrent = true;

    async function loadInitialAlerts() {
      setIsLoading(true);
      try {
        const data = await requestJson('/api/alerts/stalled', { headers: authHeaders });
        if (isCurrent) { setAlerts(data.data ?? []); onAlertsChanged(data.count ?? 0); }
      } catch (requestError) {
        if (isCurrent) setError(requestError.message || 'Unable to load alerts.');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadInitialAlerts();
    return () => { isCurrent = false; };
  }, [authHeaders, onAlertsChanged, requestJson]);

  async function dismissAlert(applicationId) {
    setDismissingId(applicationId);
    setError('');
    try {
      await requestJson(`/api/alerts/stalled/${applicationId}/dismiss`, {
        method: 'POST', headers: authHeaders,
      });
      await loadAlerts();
    } catch (requestError) {
      setError(requestError.message || 'Unable to dismiss alert.');
    } finally {
      setDismissingId('');
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader eyebrow="Alerts" subtitle="Candidates spending more than 10 days in an active stage." title="Stalled Applications" />
        <div className="flex flex-1 items-center justify-center py-20">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-400">
            <span className="h-5 w-5 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin-smooth" />
            Loading alerts...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHeader
        actions={alerts.length > 0 ? (
          <span className="inline-flex h-8 items-center rounded-lg bg-red-100 px-3 text-sm font-bold text-red-700">
            {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
          </span>
        ) : null}
        eyebrow="Alerts"
        subtitle="Candidates spending more than 10 days in an active stage."
        title="Stalled Applications"
      />

      <div className="flex-1 px-6 py-6 lg:px-8">
        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        {alerts.length ? (
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <article
                className="group rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
                key={alert.applicationId}
              >
                {/* Urgency bar */}
                <div className={`h-1 w-full rounded-t-2xl ${alert.daysStalled >= 14 ? 'bg-red-400' : alert.daysStalled >= 7 ? 'bg-amber-400' : 'bg-slate-200'}`} />

                <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-base font-bold text-slate-900">{alert.candidateName}</h2>
                      <StageBadge stage={alert.stage} />
                      {/* Days stalled badge */}
                      <span className={`inline-flex h-6 items-center rounded-lg border px-2.5 text-[11px] font-bold tracking-wide ${getDaysClass(alert.daysStalled)}`}>
                        {alert.daysStalled}d stalled
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{alert.candidateEmail}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{alert.job.title}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Entered stage {formatDateTime(alert.stageEnteredAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                    <Link
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-px hover:shadow-md"
                      to={`/jobs/${alert.job.id}`}
                    >
                      Open Job
                    </Link>
                    <button
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-indigo-700 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                      disabled={dismissingId === alert.applicationId}
                      onClick={() => dismissAlert(alert.applicationId)}
                      type="button"
                    >
                      {dismissingId === alert.applicationId ? (
                        <>
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin-smooth" />
                          Dismissing...
                        </>
                      ) : 'Dismiss'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center shadow-sm">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-3xl">
              ✓
            </div>
            <p className="text-base font-semibold text-slate-900">All clear!</p>
            <p className="mt-1 max-w-xs text-sm text-slate-500">
              No stalled applications right now. Candidates spending over 10 days in an active stage will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertsPage;
