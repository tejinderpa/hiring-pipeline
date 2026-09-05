import { useEffect, useMemo, useState } from 'react';

import PageHeader from '../components/PageHeader.jsx';

function formatDate(value) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

const stageConfig = {
  APPLIED: { cls: 'bg-blue-50 border-blue-200 text-blue-700', dot: '#0ea5e9' },
  SCREENING: { cls: 'bg-[#f0edff] border-[#ddd6fe] text-[#5a49d6]', dot: '#6c5ce7' },
  INTERVIEW: { cls: 'bg-[#fff4df] border-[#ffe0a3] text-[#a86500]', dot: '#ffb020' },
  OFFER: { cls: 'bg-indigo-50 border-indigo-200 text-indigo-700', dot: '#6366f1' },
  HIRED: { cls: 'bg-[#e9fbf5] border-[#bcefdc] text-[#128763]', dot: '#20c997' },
  REJECTED: { cls: 'bg-red-50 border-red-200 text-red-600', dot: '#ff6b6b' },
};

function StageBadge({ stage }) {
  const cfg = stageConfig[stage] || { cls: 'bg-slate-50 border-slate-200 text-slate-600', dot: '#94a3b8' };
  return (
    <span className={`inline-flex h-6 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold tracking-wide ${cfg.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
      {stage}
    </span>
  );
}

function CandidateAvatar({ name }) {
  const initials = name
    ?.split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'NA';
  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#5a49d6] text-xs font-extrabold text-white shadow-sm shadow-[#6c5ce7]/20">
      {initials}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m21 21-4.3-4.3" />
      <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M8 2v3M16 2v3M3.5 9h17M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 19.5v-13Z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function UserTagIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BellAlertIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 9.8A6 6 0 0 0 6 9.8c0 7-3 6.7-3 8.2h18c0-1.5-3-.9-3-8.2Z" />
      <path d="M10 20a2.2 2.2 0 0 0 4 0" />
      <circle cx="18" cy="4" fill="currentColor" r="3" stroke="none" />
    </svg>
  );
}

function MetaItem({ icon: Icon, label, value, highlight = false }) {
  return (
    <div className={`rounded-xl p-3 transition ${highlight ? 'bg-indigo-50/70 border border-indigo-100' : 'bg-[#f8f7fc]'}`}>
      <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {Icon ? <Icon className="h-3.5 w-3.5 text-slate-400" /> : null}
        <span>{label}</span>
      </dt>
      <dd className={`mt-1 text-sm font-semibold truncate ${highlight ? 'text-indigo-900 font-bold' : 'text-slate-800'}`}>{value}</dd>
    </div>
  );
}

const recommendationOptions = [
  { label: 'Strong Hire', value: 'Strong Hire', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', activeTone: 'bg-emerald-600 text-white border-emerald-600 shadow-sm' },
  { label: 'Hire', value: 'Hire', tone: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100', activeTone: 'bg-blue-600 text-white border-blue-600 shadow-sm' },
  { label: 'Hold / Neutral', value: 'Hold', tone: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', activeTone: 'bg-amber-500 text-white border-amber-500 shadow-sm' },
  { label: 'Do Not Hire', value: 'Do Not Hire', tone: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100', activeTone: 'bg-red-600 text-white border-red-600 shadow-sm' },
];

function parseFeedbackContent(rawContent) {
  if (!rawContent) return { recommendation: null, notes: '' };
  const match = rawContent.match(/^\[Recommendation:\s*([^\]]+)\]\s*([\s\S]*)$/);
  if (match) {
    return {
      recommendation: match[1].trim(),
      notes: match[2].trim(),
    };
  }
  return {
    recommendation: null,
    notes: rawContent,
  };
}

function RecommendationBadge({ recommendation }) {
  if (!recommendation) return null;
  let cls = 'bg-slate-100 text-slate-700 border-slate-200';
  if (recommendation.toLowerCase().includes('strong hire')) {
    cls = 'bg-[#e9fbf5] text-[#128763] border-[#bcefdc]';
  } else if (recommendation.toLowerCase() === 'hire') {
    cls = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (recommendation.toLowerCase().includes('hold')) {
    cls = 'bg-[#fff4df] text-[#a86500] border-[#ffe0a3]';
  } else if (recommendation.toLowerCase().includes('not hire')) {
    cls = 'bg-red-50 text-red-700 border-red-200';
  }

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${cls}`}>
      {recommendation}
    </span>
  );
}

const LAST_SEEN_COUNT_KEY = 'interviewerDashboardLastSeenCount';

function InterviewerDashboardPage({ requestJson, token }) {
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('needs-feedback'); // 'needs-feedback' | 'completed' | 'upcoming' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilter, setJobFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [feedbackDrafts, setFeedbackDrafts] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingApplicationId, setSavingApplicationId] = useState('');
  // New-assignment notification banner
  const [newAssignmentBannerCount, setNewAssignmentBannerCount] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  // Pending interviews this week section collapsed state
  const [pendingExpanded, setPendingExpanded] = useState(true);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    let isCurrent = true;

    async function loadApplications() {
      setIsLoading(true);
      setError('');
      try {
        const data = await requestJson('/api/interviewer/applications', { headers: authHeaders });
        const apps = data.applications ?? [];
        if (isCurrent) {
          setApplications(apps);
          // Check localStorage to see if there are new assignments since last visit
          const lastSeen = parseInt(window.localStorage.getItem(LAST_SEEN_COUNT_KEY) ?? '0', 10);
          const currentCount = apps.length;
          if (currentCount > lastSeen) {
            setNewAssignmentBannerCount(currentCount - lastSeen);
          }
        }
      } catch (requestError) {
        if (isCurrent) setError(requestError.message || 'Unable to load assigned interviews.');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadApplications();
    return () => { isCurrent = false; };
  }, [authHeaders, requestJson]);

  function dismissNewAssignmentBanner() {
    window.localStorage.setItem(LAST_SEEN_COUNT_KEY, String(applications.length));
    setBannerDismissed(true);
    setNewAssignmentBannerCount(0);
  }

  // Derived KPI Stats
  const stats = useMemo(() => {
    const total = applications.length;
    const pendingFeedback = applications.filter((app) => !app.feedback || app.feedback.length === 0).length;
    const completedFeedback = applications.filter((app) => app.feedback && app.feedback.length > 0).length;
    const upcomingInterviews = applications.filter((app) => Boolean(app.interviewScheduledAt)).length;
    return { total, pendingFeedback, completedFeedback, upcomingInterviews };
  }, [applications]);

  // Pending interviews within the next 7 days
  const pendingThisWeek = useMemo(() => {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return applications
      .filter((app) => {
        if (!app.interviewScheduledAt) return false;
        const d = new Date(app.interviewScheduledAt);
        return d >= now && d <= sevenDaysLater;
      })
      .sort((a, b) => new Date(a.interviewScheduledAt) - new Date(b.interviewScheduledAt));
  }, [applications]);

  // Unique job openings for the filter dropdown
  const jobOptions = useMemo(() => {
    const map = new Map();
    applications.forEach((app) => {
      if (app.jobOpening?.id) {
        map.set(app.jobOpening.id, app.jobOpening.title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [applications]);

  // Filter applications based on activeTab, search, jobFilter, and stageFilter
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Tab matching
      if (activeTab === 'needs-feedback') {
        if (app.feedback && app.feedback.length > 0) return false;
      } else if (activeTab === 'completed') {
        if (!app.feedback || app.feedback.length === 0) return false;
      } else if (activeTab === 'upcoming') {
        if (!app.interviewScheduledAt) return false;
      }

      // Search match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const candidateName = app.candidateName?.toLowerCase() || '';
        const candidateEmail = app.candidateEmail?.toLowerCase() || '';
        const jobTitle = app.jobOpening?.title?.toLowerCase() || '';
        const department = app.jobOpening?.department?.toLowerCase() || '';
        if (!candidateName.includes(query) && !candidateEmail.includes(query) && !jobTitle.includes(query) && !department.includes(query)) {
          return false;
        }
      }

      // Job Filter
      if (jobFilter !== 'ALL' && app.jobOpening?.id !== jobFilter) {
        return false;
      }

      // Stage Filter
      if (stageFilter !== 'ALL' && app.stage !== stageFilter) {
        return false;
      }

      return true;
    });
  }, [applications, activeTab, searchTerm, jobFilter, stageFilter]);

  function handleDraftChange(applicationId, field, value) {
    setFeedbackDrafts((current) => ({
      ...current,
      [applicationId]: {
        ...(current[applicationId] || { recommendation: 'Hire', content: '', error: '' }),
        [field]: value,
        error: '',
      },
    }));
  }

  async function handleFeedbackSubmit(event, application) {
    event.preventDefault();
    setError('');
    setMessage('');

    const draft = feedbackDrafts[application.id] || { recommendation: 'Hire', content: '', error: '' };
    const trimmedNotes = (draft.content || '').trim();

    if (!trimmedNotes) {
      setFeedbackDrafts((current) => ({
        ...current,
        [application.id]: {
          ...(current[application.id] || draft),
          error: 'Please enter your interview evaluation notes before saving.',
        },
      }));
      return;
    }

    if (trimmedNotes.length < 10) {
      setFeedbackDrafts((current) => ({
        ...current,
        [application.id]: {
          ...(current[application.id] || draft),
          error: 'Evaluation notes should be at least 10 characters long.',
        },
      }));
      return;
    }

    const payloadContent = draft.recommendation
      ? `[Recommendation: ${draft.recommendation}] ${trimmedNotes}`
      : trimmedNotes;

    setSavingApplicationId(application.id);

    try {
      const response = await requestJson(`/api/applications/${application.id}/feedback`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ content: payloadContent }),
      });

      const newFeedback = response.feedback || {
        id: `feedback-${Date.now()}`,
        content: payloadContent,
        createdAt: new Date().toISOString(),
      };

      // Update local state so application reflects submitted feedback immediately
      setApplications((prev) =>
        prev.map((app) => {
          if (app.id !== application.id) return app;
          return {
            ...app,
            feedback: [newFeedback, ...(app.feedback || [])],
          };
        })
      );

      // Clear draft for this application
      setFeedbackDrafts((current) => ({
        ...current,
        [application.id]: { recommendation: 'Hire', content: '', error: '' },
      }));

      setMessage(`Feedback saved successfully for ${application.candidateName}.`);
    } catch (requestError) {
      setError(requestError.message || 'Unable to save feedback.');
    } finally {
      setSavingApplicationId('');
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          eyebrow="Interviewer Workspace"
          subtitle="Loading your assigned interview panel..."
          title="Interview Dashboard"
        />
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
            <span className="h-5 w-5 rounded-full border-2 border-[#6c5ce7]/20 border-t-[#6c5ce7] animate-spin-smooth" />
            Loading assigned interviews...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHeader
        actions={(
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 items-center rounded-lg bg-[#f0edff] px-3 text-xs font-bold text-[#5a49d6]">
              {stats.total} Assigned
            </span>
            {stats.pendingFeedback > 0 ? (
              <span className="inline-flex h-8 items-center rounded-lg bg-[#fff4df] px-3 text-xs font-bold text-[#a86500]">
                {stats.pendingFeedback} Needs Feedback
              </span>
            ) : null}
          </div>
        )}
        eyebrow="Interviewer Workspace"
        subtitle="Review assigned candidates, prepare for upcoming interviews, and submit structured feedback for hiring teams."
        title="Interview Dashboard"
      />

      <div className="flex-1 px-5 py-6 lg:px-8 space-y-6">
        {/* Global Error & Success Alerts */}
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-in">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-xl border border-[#bcefdc] bg-[#e9fbf5] px-4 py-3 text-sm font-semibold text-[#128763] animate-fade-in flex items-center justify-between">
            <span>{message}</span>
            <button
              className="text-xs text-[#128763] hover:underline"
              onClick={() => setMessage('')}
              type="button"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {/* New-assignment notification banner */}
        {newAssignmentBannerCount > 0 && !bannerDismissed ? (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-[#ffe0a3] bg-[#fff8ec] px-4 py-3 animate-fade-in">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-[#a86500]">
              <BellAlertIcon />
              <span>
                You have <strong>{newAssignmentBannerCount}</strong> new candidate assignment{newAssignmentBannerCount !== 1 ? 's' : ''} since your last visit.
              </span>
            </div>
            <button
              className="shrink-0 rounded-lg border border-[#ffe0a3] bg-white px-3 py-1 text-xs font-bold text-[#a86500] transition hover:bg-[#fff4df]"
              onClick={dismissNewAssignmentBanner}
              type="button"
            >
              Mark as seen
            </button>
          </div>
        ) : null}

        {/* Executive KPI Stats Cards */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl bg-white border border-slate-200/80 p-5 shadow-sm transition hover:border-[#6c5ce7]/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Assigned</span>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#f0edff] text-[#5a49d6]">
                <UsersIcon />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-950">{stats.total}</p>
            <p className="mt-1 text-xs text-slate-500">Across all job openings</p>
          </article>

          <article className="rounded-xl bg-white border border-slate-200/80 p-5 shadow-sm transition hover:border-amber-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Needs Feedback</span>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#fff4df] text-[#a86500]">
                <ClockIcon />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-amber-700">{stats.pendingFeedback}</p>
            <p className="mt-1 text-xs text-slate-500">Awaiting your evaluation</p>
          </article>

          <article className="rounded-xl bg-white border border-slate-200/80 p-5 shadow-sm transition hover:border-emerald-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Completed Reviews</span>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#e9fbf5] text-[#128763]">
                <CheckCircleIcon />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-emerald-700">{stats.completedFeedback}</p>
            <p className="mt-1 text-xs text-slate-500">Feedback logged</p>
          </article>

          <article className="rounded-xl bg-white border border-slate-200/80 p-5 shadow-sm transition hover:border-blue-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Scheduled Interviews</span>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-700">
                <CalendarIcon />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-blue-700">{stats.upcomingInterviews}</p>
            <p className="mt-1 text-xs text-slate-500">With scheduled date/time</p>
          </article>
        </section>

        {/* Pending Interviews This Week */}
        {pendingThisWeek.length > 0 ? (
          <section className="rounded-2xl border border-blue-100 bg-blue-50/60 shadow-sm overflow-hidden">
            <button
              className="flex w-full items-center justify-between px-5 py-3.5 text-left"
              onClick={() => setPendingExpanded((v) => !v)}
              type="button"
            >
              <div className="flex items-center gap-2.5">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-white">
                  <CalendarIcon />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900">Pending Interviews This Week</p>
                  <p className="text-[11px] text-blue-600">{pendingThisWeek.length} interview{pendingThisWeek.length !== 1 ? 's' : ''} scheduled in the next 7 days</p>
                </div>
              </div>
              <svg
                aria-hidden="true"
                className={`h-4 w-4 shrink-0 text-blue-500 transition-transform duration-200 ${pendingExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {pendingExpanded ? (
              <div className="divide-y divide-blue-100 border-t border-blue-100">
                {pendingThisWeek.map((app) => {
                  const scheduled = new Date(app.interviewScheduledAt);
                  const isToday = scheduled.toDateString() === new Date().toDateString();
                  const isTomorrow = scheduled.toDateString() === new Date(Date.now() + 86400000).toDateString();
                  const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : null;
                  return (
                    <div className="flex items-center gap-4 px-5 py-3" key={app.id}>
                      <CandidateAvatar name={app.candidateName} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 truncate">{app.candidateName}</p>
                          <StageBadge stage={app.stage} />
                          {dayLabel ? (
                            <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              {dayLabel}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 truncate">{app.jobOpening?.title}{app.jobOpening?.department ? ` · ${app.jobOpening.department}` : ''}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold text-blue-700">
                          {new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(scheduled)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(scheduled)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Section Tabs & Filter Toolbar */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-4">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap gap-1.5">
              <button
                className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-bold transition ${
                  activeTab === 'needs-feedback'
                    ? 'bg-[#6c5ce7] text-white shadow-sm shadow-[#6c5ce7]/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setActiveTab('needs-feedback')}
                type="button"
              >
                <span>Needs Feedback</span>
                <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                  activeTab === 'needs-feedback' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {stats.pendingFeedback}
                </span>
              </button>

              <button
                className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-bold transition ${
                  activeTab === 'completed'
                    ? 'bg-[#6c5ce7] text-white shadow-sm shadow-[#6c5ce7]/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setActiveTab('completed')}
                type="button"
              >
                <span>Completed Reviews</span>
                <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                  activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {stats.completedFeedback}
                </span>
              </button>

              <button
                className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-bold transition ${
                  activeTab === 'upcoming'
                    ? 'bg-[#6c5ce7] text-white shadow-sm shadow-[#6c5ce7]/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setActiveTab('upcoming')}
                type="button"
              >
                <span>Upcoming Interviews</span>
                <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                  activeTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {stats.upcomingInterviews}
                </span>
              </button>

              <button
                className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-bold transition ${
                  activeTab === 'all'
                    ? 'bg-[#6c5ce7] text-white shadow-sm shadow-[#6c5ce7]/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setActiveTab('all')}
                type="button"
              >
                <span>All Assigned</span>
                <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                  activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {stats.total}
                </span>
              </button>
            </div>

            <span className="text-xs font-semibold text-slate-400">
              Showing {filteredApplications.length} of {applications.length} candidates
            </span>
          </div>

          {/* Filters Bar */}
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Search Input */}
            <div className="relative">
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-[#faf9fd] pl-9 pr-8 text-xs font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#6c5ce7] focus:bg-white focus:ring-4 focus:ring-[#6c5ce7]/10"
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidate, role, email..."
                type="text"
                value={searchTerm}
              />
              <span className="pointer-events-none absolute left-3 top-3 text-slate-400">
                <SearchIcon />
              </span>
              {searchTerm ? (
                <button
                  aria-label="Clear search"
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  onClick={() => setSearchTerm('')}
                  type="button"
                >
                  ✕
                </button>
              ) : null}
            </div>

            {/* Job Filter */}
            <select
              aria-label="Filter by job opening"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-[#6c5ce7] focus:ring-4 focus:ring-[#6c5ce7]/10"
              onChange={(e) => setJobFilter(e.target.value)}
              value={jobFilter}
            >
              <option value="ALL">All Job Openings ({jobOptions.length})</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>

            {/* Stage Filter */}
            <select
              aria-label="Filter by stage"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-[#6c5ce7] focus:ring-4 focus:ring-[#6c5ce7]/10"
              onChange={(e) => setStageFilter(e.target.value)}
              value={stageFilter}
            >
              <option value="ALL">All Stages</option>
              <option value="INTERVIEW">INTERVIEW</option>
              <option value="SCREENING">SCREENING</option>
              <option value="OFFER">OFFER</option>
              <option value="APPLIED">APPLIED</option>
              <option value="HIRED">HIRED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {/* Candidate Cards Grid */}
        {filteredApplications.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredApplications.map((application) => {
              const draft = feedbackDrafts[application.id] || { recommendation: 'Hire', content: '', error: '' };
              const hasFeedback = application.feedback && application.feedback.length > 0;

              return (
                <article
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md space-y-4"
                  key={application.id}
                >
                  {/* Card Top: Candidate Info & Stage */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3.5">
                      <CandidateAvatar name={application.candidateName} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-bold text-slate-950">{application.candidateName}</h3>
                          <StageBadge stage={application.stage} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{application.candidateEmail}</p>
                        <p className="mt-1 text-xs font-bold text-slate-800">
                          {application.jobOpening?.title}
                          {application.jobOpening?.department ? (
                            <span className="ml-1.5 font-medium text-slate-400">
                              • {application.jobOpening.department}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {hasFeedback ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#e9fbf5] px-2.5 py-1 text-[11px] font-bold text-[#128763]">
                          <CheckCircleIcon />
                          Feedback Logged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4df] px-2.5 py-1 text-[11px] font-bold text-[#a86500]">
                          <ClockIcon />
                          Pending Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <dl className="grid gap-2.5 sm:grid-cols-3">
                    <MetaItem
                      label="Applied"
                      value={formatDate(application.appliedAt)}
                    />
                    <MetaItem
                      highlight={Boolean(application.interviewScheduledAt)}
                      icon={CalendarIcon}
                      label="Interview Time"
                      value={formatDateTime(application.interviewScheduledAt)}
                    />
                    <MetaItem
                      label="Assigned On"
                      value={formatDate(application.interviewers?.[0]?.assignedAt)}
                    />
                  </dl>

                  {/* Assigned By Recruiter */}
                  {application.assignedByRecruiter ? (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-[#faf9fd] px-3 py-2">
                      <span className="text-slate-400">
                        <UserTagIcon />
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Managed by</span>
                      <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-700 shadow-xs">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            application.assignedByRecruiter.role === 'RECRUITER'
                              ? 'bg-[#6c5ce7]'
                              : 'bg-slate-300'
                          }`}
                        />
                        {application.assignedByRecruiter.email}
                      </span>
                    </div>
                  ) : null}

                  {/* Recruiter notes if present */}
                  {application.notes ? (
                    <div className="rounded-xl border border-slate-100 bg-[#faf9fd] p-3 text-xs text-slate-600">
                      <span className="font-bold text-slate-700">Recruiter Notes: </span>
                      {application.notes}
                    </div>
                  ) : null}

                  {/* Submitted Feedback History (if any) */}
                  {hasFeedback ? (
                    <div className="rounded-xl border border-slate-100 bg-[#fbfbfe] p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Your Submitted Feedback ({application.feedback.length})
                        </h4>
                        <span className="text-[11px] text-slate-400">Immutable Timeline History</span>
                      </div>

                      <div className="space-y-2.5">
                        {application.feedback.map((item) => {
                          const parsed = parseFeedbackContent(item.content);
                          return (
                            <div className="rounded-lg border border-slate-200/70 bg-white p-3 shadow-xs space-y-1.5" key={item.id}>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <RecommendationBadge recommendation={parsed.recommendation} />
                                <time className="text-[11px] text-slate-400">
                                  {formatDateTime(item.createdAt)}
                                </time>
                              </div>
                              <p className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                                {parsed.notes}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Feedback Form */}
                  <form
                    className="rounded-xl border border-slate-200/80 bg-[#f8f7fc] p-4 space-y-3"
                    onSubmit={(event) => handleFeedbackSubmit(event, application)}
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor={`feedback-${application.id}`}>
                        {hasFeedback ? 'Add Additional Evaluation Notes' : 'Interview Evaluation & Scorecard'}
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {(draft.content || '').length} / 2000 chars
                      </span>
                    </div>

                    {/* Recommendation Selector Pills */}
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold text-slate-500">Recommendation Decision:</p>
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                        {recommendationOptions.map((opt) => {
                          const isSelected = draft.recommendation === opt.value;
                          return (
                            <button
                              className={`h-8 rounded-lg border text-xs font-bold transition ${
                                isSelected ? opt.activeTone : opt.tone
                              }`}
                              key={opt.value}
                              onClick={() => handleDraftChange(application.id, 'recommendation', opt.value)}
                              type="button"
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Feedback Textarea */}
                    <div>
                      <textarea
                        className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#6c5ce7] focus:ring-4 focus:ring-[#6c5ce7]/10"
                        id={`feedback-${application.id}`}
                        maxLength={2000}
                        onChange={(event) => handleDraftChange(application.id, 'content', event.target.value)}
                        placeholder="Write detailed assessment, technical competency, communication skills, strengths and concerns for the recruiter..."
                        value={draft.content || ''}
                      />
                      {draft.error ? (
                        <p className="mt-1 text-xs font-semibold text-red-600 animate-fade-in">{draft.error}</p>
                      ) : null}
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[11px] text-slate-400">
                        Submissions are permanently recorded on the candidate timeline.
                      </p>
                      <button
                        className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#6c5ce7] px-4 text-xs font-bold text-white shadow-sm shadow-[#6c5ce7]/20 transition hover:bg-[#5a49d6] hover:-translate-y-px disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:translate-y-0"
                        disabled={savingApplicationId === application.id || !(draft.content || '').trim()}
                        type="submit"
                      >
                        {savingApplicationId === application.id ? (
                          <>
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin-smooth" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <SendIcon />
                            <span>Submit Feedback</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </article>
              );
            })}
          </div>
        ) : (
          /* Empty States tailored to tab/filter */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#f0edff] text-[#6c5ce7]">
              <SearchIcon />
            </div>
            <h3 className="text-base font-bold text-slate-950">
              {activeTab === 'needs-feedback' && stats.pendingFeedback === 0
                ? 'All caught up! No pending reviews'
                : activeTab === 'completed' && stats.completedFeedback === 0
                ? 'No completed evaluations yet'
                : activeTab === 'upcoming' && stats.upcomingInterviews === 0
                ? 'No upcoming interviews scheduled'
                : 'No candidates found'}
            </h3>
            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
              {activeTab === 'needs-feedback' && stats.pendingFeedback === 0
                ? 'You have submitted evaluations for all assigned candidates. When new candidates are assigned, they will appear here.'
                : activeTab === 'completed' && stats.completedFeedback === 0
                ? 'When you submit interview notes and scorecards, they will be archived here in your completed reviews.'
                : searchTerm || jobFilter !== 'ALL' || stageFilter !== 'ALL'
                ? 'Try clearing or changing your search filters to find assigned candidates.'
                : 'When recruiters assign candidates to your interview panel, they will appear here.'}
            </p>
            {searchTerm || jobFilter !== 'ALL' || stageFilter !== 'ALL' ? (
              <button
                className="mt-4 inline-flex h-8 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => {
                  setSearchTerm('');
                  setJobFilter('ALL');
                  setStageFilter('ALL');
                }}
                type="button"
              >
                Reset Filters
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default InterviewerDashboardPage;
