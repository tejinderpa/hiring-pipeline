import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

function formatDateTime(value) {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function StageBadge({ stage }) {
  return (
    <span className="inline-flex h-7 items-center rounded-md border border-cyan-200 bg-cyan-50 px-2 text-xs font-semibold text-cyan-800">
      {stage}
    </span>
  );
}

function AlertsPage({ onAlertsChanged, requestJson, token }) {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dismissingId, setDismissingId] = useState('');

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  async function loadAlerts() {
    setError('');

    const data = await requestJson('/api/alerts/stalled', {
      headers: authHeaders,
    });

    setAlerts(data.data ?? []);
    onAlertsChanged(data.count ?? 0);
  }

  useEffect(() => {
    let isCurrent = true;

    async function loadInitialAlerts() {
      setIsLoading(true);

      try {
        const data = await requestJson('/api/alerts/stalled', {
          headers: authHeaders,
        });

        if (isCurrent) {
          setAlerts(data.data ?? []);
          onAlertsChanged(data.count ?? 0);
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(requestError.message || 'Unable to load alerts.');
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadInitialAlerts();

    return () => {
      isCurrent = false;
    };
  }, [authHeaders, onAlertsChanged, requestJson]);

  async function dismissAlert(applicationId) {
    setDismissingId(applicationId);
    setError('');

    try {
      await requestJson(`/api/alerts/stalled/${applicationId}/dismiss`, {
        method: 'POST',
        headers: authHeaders,
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
      <div className="grid flex-1 place-items-center px-5 py-12 text-sm font-medium text-slate-500 lg:px-8">
        Loading alerts...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-5 py-6 lg:px-8">
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-semibold uppercase text-slate-500">Alerts</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Stalled applications</h1>
      </div>

      {error ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mt-6">
        {alerts.length ? (
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <article
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                key={alert.applicationId}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-base font-semibold text-slate-950">{alert.candidateName}</h2>
                      <StageBadge stage={alert.stage} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{alert.candidateEmail}</p>
                    <p className="mt-3 text-sm font-medium text-slate-700">{alert.job.title}</p>
                    <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-slate-800">{alert.daysStalled}</span>
                        {' '}
                        days in current stage
                      </p>
                      <p>Entered stage {formatDateTime(alert.stageEnteredAt)}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
                      to={`/jobs/${alert.job.id}`}
                    >
                      Open Job
                    </Link>
                    <button
                      className="h-10 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      disabled={dismissingId === alert.applicationId}
                      onClick={() => dismissAlert(alert.applicationId)}
                      type="button"
                    >
                      {dismissingId === alert.applicationId ? 'Dismissing...' : 'Dismiss'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-950">No stalled applications.</p>
            <p className="mt-1 text-sm text-slate-500">Candidates that spend more than 10 days in an active stage will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default AlertsPage;
