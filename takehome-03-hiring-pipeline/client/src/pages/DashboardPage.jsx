import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const kpiItems = [
  { key: 'openPositions', label: 'Open Positions' },
  { key: 'activeApplications', label: 'Active Applications' },
  { key: 'interviewsThisWeek', label: 'Interviews This Week' },
  { key: 'hiresThisMonth', label: 'Hires This Month' },
];

function formatCount(value) {
  return new Intl.NumberFormat('en').format(value ?? 0);
}

function formatWeekLabel(value) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function EmptyState({ children }) {
  return (
    <div className="grid h-64 place-items-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm font-medium text-slate-500">
      {children}
    </div>
  );
}

function ChartPanel({ children, title }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-5 h-72">
        {children}
      </div>
    </section>
  );
}

function hasAnyCount(rows) {
  return rows.some((row) => Number(row.count) > 0);
}

function DashboardPage({ requestJson, token }) {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  useEffect(() => {
    let isCurrent = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError('');

      try {
        const data = await requestJson('/api/dashboard', {
          headers: authHeaders,
        });

        if (isCurrent) {
          setDashboard(data);
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(requestError.message || 'Unable to load dashboard.');
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isCurrent = false;
    };
  }, [authHeaders, requestJson]);

  if (isLoading) {
    return (
      <div className="grid flex-1 place-items-center px-5 py-12 text-sm font-medium text-slate-500 lg:px-8">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col px-5 py-6 lg:px-8">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const applicationsByStage = dashboard?.applicationsByStage ?? [];
  const applicationsByJob = dashboard?.applicationsByJob ?? [];
  const applicationsPerWeek = dashboard?.applicationsPerWeek ?? [];

  return (
    <div className="flex flex-1 flex-col px-5 py-6 lg:px-8">
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-semibold uppercase text-slate-500">Overview</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">Recruiting dashboard</h1>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiItems.map((item) => (
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={item.key}>
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {formatCount(dashboard?.[item.key])}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartPanel title="Applications by stage">
          {applicationsByStage.length ? (
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={applicationsByStage} margin={{ bottom: 18, left: 0, right: 8, top: 8 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis
                  angle={-20}
                  dataKey="stage"
                  height={54}
                  interval={0}
                  stroke="#64748b"
                  textAnchor="end"
                  tick={{ fontSize: 12 }}
                />
                <YAxis allowDecimals={false} stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0e7490" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState>No stage data yet.</EmptyState>
          )}
        </ChartPanel>

        <ChartPanel title="Applications by job opening">
          {applicationsByJob.length ? (
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={applicationsByJob} layout="vertical" margin={{ bottom: 8, left: 18, right: 16, top: 8 }}>
                <CartesianGrid stroke="#e2e8f0" horizontal={false} />
                <XAxis allowDecimals={false} stroke="#64748b" tick={{ fontSize: 12 }} type="number" />
                <YAxis
                  dataKey="title"
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                  type="category"
                  width={130}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#334155" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState>No job data yet.</EmptyState>
          )}
        </ChartPanel>
      </section>

      <section className="mt-6">
        <ChartPanel title="Applications received per week">
          {applicationsPerWeek.length ? (
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={applicationsPerWeek} margin={{ bottom: 12, left: 0, right: 16, top: 8 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="weekStart"
                  interval={1}
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatWeekLabel}
                />
                <YAxis allowDecimals={false} stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip labelFormatter={formatWeekLabel} />
                <Line
                  dataKey="count"
                  dot
                  isAnimationActive={false}
                  stroke="#0e7490"
                  strokeWidth={2}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState>No weekly application data returned.</EmptyState>
          )}
        </ChartPanel>
        {applicationsPerWeek.length > 0 && !hasAnyCount(applicationsPerWeek) ? (
          <p className="mt-3 text-sm text-slate-500">No applications were received in the last quarter.</p>
        ) : null}
      </section>
    </div>
  );
}

export default DashboardPage;
