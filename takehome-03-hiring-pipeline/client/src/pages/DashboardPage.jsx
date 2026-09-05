import { useEffect, useMemo, useState } from 'react';
import {
  Area, AreaChart, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import PageHeader from '../components/PageHeader.jsx';

const kpiItems = [
  { key: 'openPositions', label: 'Open Positions', accent: '#6c5ce7', tone: 'bg-[#f0edff] text-[#5a49d6]' },
  { key: 'activeApplications', label: 'Active Applications', accent: '#20c997', tone: 'bg-[#e9fbf5] text-[#128763]' },
  { key: 'interviewsThisWeek', label: 'Interviews This Week', accent: '#ffb020', tone: 'bg-[#fff4df] text-[#a86500]' },
  { key: 'hiresThisMonth', label: 'Hires This Month', accent: '#ff6b6b', tone: 'bg-[#fff0f0] text-[#c94545]' },
];
const palette = ['#6c5ce7', '#20c997', '#ffb020', '#ff6b6b', '#0ea5e9', '#94a3b8'];
const maxVisibleJobOpenings = 8;

function formatCount(value) {
  return new Intl.NumberFormat('en').format(value ?? 0);
}

function formatWeekLabel(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
    .format(new Date(`${value}T00:00:00.000Z`));
}

function hasAnyCount(rows) {
  return rows.some((row) => Number(row.count) > 0);
}

function getMaxCount(rows) {
  return Math.max(1, ...rows.map((row) => Number(row.count) || 0));
}

function getDisplayJobRows(rows) {
  const positiveRows = rows
    .filter((row) => Number(row.count) > 0)
    .sort((a, b) => Number(b.count) - Number(a.count));

  if (positiveRows.length <= maxVisibleJobOpenings) return positiveRows;

  const visibleRows = positiveRows.slice(0, maxVisibleJobOpenings - 1);
  const otherCount = positiveRows
    .slice(maxVisibleJobOpenings - 1)
    .reduce((sum, row) => sum + Number(row.count), 0);

  return [
    ...visibleRows,
    {
      jobId: 'other-openings',
      title: 'Other openings',
      count: otherCount,
    },
  ];
}

function EmptyState({ children }) {
  return (
    <div className="grid h-64 place-items-center rounded-lg border border-dashed border-slate-200 bg-[#faf9fd] px-4 text-center text-sm font-semibold text-slate-400">
      {children}
    </div>
  );
}

function MoreIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 12h.01M19 12h.01M5 12h.01" />
    </svg>
  );
}

function ChartPanel({ bodyClassName = 'h-72', children, title, subtitle }) {
  return (
    <section className="rounded-lg border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        <button aria-label="More options" className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-700" type="button">
          <MoreIcon />
        </button>
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

function StageDistribution({ rows }) {
  const maxCount = getMaxCount(rows);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {rows.map((row, index) => {
        const color = palette[index % palette.length];
        const width = `${Math.max(10, (Number(row.count) / maxCount) * 100)}%`;
        return (
          <article className="rounded-lg bg-[#f8f7fc] p-3" key={row.stage}>
            <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <p className="truncate text-sm font-bold text-slate-950">{row.stage}</p>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-400">Current stage</p>
                </div>
                <span className="text-2xl font-extrabold tracking-tight text-slate-950">{row.count}</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ backgroundColor: color, width }} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function JobDistribution({ rows }) {
  const sortedRows = getDisplayJobRows(rows);
  const maxCount = getMaxCount(sortedRows);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {sortedRows.map((job, index) => {
        const color = palette[index % palette.length];
        const width = `${Math.max(8, (Number(job.count) / maxCount) * 100)}%`;
        return (
          <article className="rounded-lg border border-slate-100 bg-[#faf9fd] p-3.5" key={job.jobId}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 gap-2.5">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-xs font-extrabold text-slate-500 shadow-sm">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold leading-7 text-slate-950" title={job.title}>{job.title}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-700 shadow-sm">
                {job.count}
              </span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full" style={{ backgroundColor: color, width }} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, labelFormatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <p className="mb-1.5 text-xs font-semibold text-slate-500">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm font-bold text-slate-900">
          {p.value}
        </p>
      ))}
    </div>
  );
};

function DashboardPage({ requestJson, token }) {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    let isCurrent = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError('');
      try {
        const data = await requestJson('/api/dashboard', { headers: authHeaders });
        if (isCurrent) setDashboard(data);
      } catch (requestError) {
        if (isCurrent) setError(requestError.message || 'Unable to load dashboard.');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => { isCurrent = false; };
  }, [authHeaders, requestJson]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader eyebrow="Recruiting" subtitle="Live hiring metrics and pipeline movement." title="Dashboard" />
        <div className="flex flex-1 items-center justify-center py-20">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <span className="h-5 w-5 rounded-full border-2 border-[#6c5ce7]/20 border-t-[#6c5ce7] animate-spin-smooth" />
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader eyebrow="Recruiting" subtitle="Live hiring metrics and pipeline movement." title="Dashboard" />
        <div className="px-5 py-6 lg:px-8">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  const applicationsByStage = dashboard?.applicationsByStage ?? [];
  const applicationsByJob = dashboard?.applicationsByJob ?? [];
  const displayJobRows = getDisplayJobRows(applicationsByJob);
  const applicationsPerWeek = dashboard?.applicationsPerWeek ?? [];

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHeader eyebrow="Recruiting" subtitle="Live hiring metrics and pipeline movement." title="Dashboard" />

      <div className="flex-1 px-5 py-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiItems.map((item) => (
            <article className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm" key={item.key}>
              <div className="flex items-center justify-between">
                <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${item.tone}`}>{item.label}</span>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.accent }} />
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
                {formatCount(dashboard?.[item.key])}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">Current workspace total</p>
            </article>
          ))}
        </div>

        <div className="mt-6">
          <ChartPanel bodyClassName="min-h-44" title="Applications by Stage" subtitle="Current pipeline distribution">
            {applicationsByStage.length ? (
              <StageDistribution rows={applicationsByStage} />
            ) : (
              <EmptyState>No stage data yet.</EmptyState>
            )}
          </ChartPanel>
        </div>

        <div className="mt-6">
          <ChartPanel bodyClassName="min-h-52" title="Applications by Job Opening" subtitle="Top positions by volume">
            {displayJobRows.length ? (
              <JobDistribution rows={displayJobRows} />
            ) : (
              <EmptyState>No job data yet.</EmptyState>
            )}
          </ChartPanel>
        </div>

        <div className="mt-6">
          <ChartPanel title="Applications Received Per Week" subtitle="Trend over the last quarter">
            {applicationsPerWeek.length ? (
              <ResponsiveContainer height="100%" width="100%">
                <AreaChart data={applicationsPerWeek} margin={{ bottom: 12, left: 0, right: 16, top: 8 }}>
                  <defs>
                    <linearGradient id="weeklyApplicationFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.3} />
                      <stop offset="75%" stopColor="#6c5ce7" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="weekStart" interval={1} stroke="#94a3b8"
                    tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={formatWeekLabel} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip labelFormatter={formatWeekLabel} />} />
                  <Area
                    dataKey="count"
                    dot={{ fill: '#6c5ce7', r: 4, strokeWidth: 0 }}
                    fill="url(#weeklyApplicationFill)"
                    fillOpacity={1}
                    activeDot={{ r: 6, fill: '#5a49d6' }}
                    isAnimationActive={false}
                    stroke="#6c5ce7"
                    strokeWidth={2.5}
                    type="monotone"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState>No weekly application data returned.</EmptyState>
            )}
          </ChartPanel>
        </div>
        {applicationsPerWeek.length > 0 && !hasAnyCount(applicationsPerWeek) ? (
          <p className="mt-3 text-sm text-slate-500">No applications were received in the last quarter.</p>
        ) : null}
      </div>
    </div>
  );
}

export default DashboardPage;
