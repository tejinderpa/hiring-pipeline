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
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
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
  const cfg = stageConfig[stage] || { cls: 'bg-slate-50 border-slate-200 text-slate-600' };
  return (
    <span className={`inline-flex h-6 items-center rounded-md border px-2.5 text-[11px] font-bold tracking-wide ${cfg.cls}`}>
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
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#6c5ce7] text-xs font-bold text-white shadow-sm">
      {initials}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="m21 21-4.3-4.3" />
      <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function MetaItem({ label, value }) {
  return (
    <div className="rounded-lg bg-[#f8f7fc] p-3">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

function InterviewerDashboardPage({ requestJson, token }) {
  const [applications, setApplications] = useState([]);
  const [feedbackByApplicationId, setFeedbackByApplicationId] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingApplicationId, setSavingApplicationId] = useState('');

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    let isCurrent = true;

    async function loadApplications() {
      setIsLoading(true);
      setError('');
      try {
        const data = await requestJson('/api/interviewer/applications', { headers: authHeaders });
        if (isCurrent) setApplications(data.applications ?? []);
      } catch (requestError) {
        if (isCurrent) setError(requestError.message || 'Unable to load assigned interviews.');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadApplications();
    return () => { isCurrent = false; };
  }, [authHeaders, requestJson]);

  function handleFeedbackChange(applicationId, value) {
    setFeedbackByApplicationId((current) => ({ ...current, [applicationId]: value }));
  }

  async function handleFeedbackSubmit(event, applicationId) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSavingApplicationId(applicationId);
    try {
      await requestJson(`/api/applications/${applicationId}/feedback`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ content: feedbackByApplicationId[applicationId] || '' }),
      });
      setFeedbackByApplicationId((current) => ({ ...current, [applicationId]: '' }));
      setMessage('Feedback saved successfully.');
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
          eyebrow="Interviews"
          subtitle="0 candidate tasks waiting for feedback."
          title="Assigned Candidates"
        />
        <div className="flex flex-1 items-center justify-center py-20">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
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
          <span className="inline-flex h-8 items-center rounded-lg bg-indigo-50 px-3 text-sm font-bold text-indigo-700">
            {applications.length} active
          </span>
        )}
        eyebrow="Interviews"
        subtitle={`${applications.length} candidate tasks waiting for feedback.`}
        title="Assigned Candidates"
      />

      <div className="flex-1 px-5 py-6 lg:px-8">
        {error ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-in">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mb-5 rounded-lg border border-[#bcefdc] bg-[#e9fbf5] px-4 py-3 text-sm text-[#128763] animate-fade-in">
            {message}
          </div>
        ) : null}

        {applications.length ? (
          <section className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-950">Feedback Board</h2>
                <p className="text-xs text-slate-500">Each card is an interview task ready for notes.</p>
              </div>
              <span className="rounded-full bg-[#f0edff] px-3 py-1 text-xs font-bold text-[#5a49d6]">
                {applications.length} active
              </span>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {applications.map((application) => {
                const stageDot = stageConfig[application.stage]?.dot || '#94a3b8';
                return (
                  <article className="rounded-lg bg-[#f8f7fc] p-3" key={application.id}>
                    <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <CandidateAvatar name={application.candidateName} />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-base font-bold text-slate-950">{application.candidateName}</h3>
                              <StageBadge stage={application.stage} />
                            </div>
                            <p className="mt-0.5 truncate text-sm text-slate-500">{application.candidateEmail}</p>
                            <p className="mt-2 text-sm font-bold text-slate-800">
                              {application.jobOpening?.title}
                              {application.jobOpening?.department ? (
                                <span className="ml-1.5 font-semibold text-slate-400">
                                  {application.jobOpening.department}
                                </span>
                              ) : null}
                            </p>
                          </div>
                        </div>
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: stageDot }} />
                      </div>

                      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                        <MetaItem label="Applied" value={formatDate(application.appliedAt)} />
                        <MetaItem label="Interview" value={formatDateTime(application.interviewScheduledAt)} />
                        <MetaItem label="Assigned" value={formatDate(application.interviewers?.[0]?.assignedAt)} />
                      </dl>

                      <form className="mt-4" onSubmit={(event) => handleFeedbackSubmit(event, application.id)}>
                        <label className="mb-2 block text-sm font-bold text-slate-700" htmlFor={`feedback-${application.id}`}>
                          Interview Feedback
                        </label>
                        <textarea
                          className="min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-[#faf9fd] px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#6c5ce7] focus:bg-white focus:ring-4 focus:ring-[#6c5ce7]/10"
                          id={`feedback-${application.id}`}
                          onChange={(event) => handleFeedbackChange(application.id, event.target.value)}
                          placeholder="Share interview notes, strengths, concerns for the recruiting team..."
                          value={feedbackByApplicationId[application.id] || ''}
                        />
                        <div className="mt-3 flex justify-end">
                          <button
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#6c5ce7] px-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-px hover:bg-[#5a49d6] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                            disabled={savingApplicationId === application.id}
                            type="submit"
                          >
                            {savingApplicationId === application.id ? (
                              <>
                                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin-smooth" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <SendIcon />
                                Save Feedback
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-lg bg-[#f0edff] text-[#6c5ce7]">
              <SearchIcon />
            </div>
            <p className="text-base font-bold text-slate-950">No assigned candidates yet</p>
            <p className="mt-1 max-w-xs text-sm text-slate-500">
              When a recruiter assigns you to interviews, they will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default InterviewerDashboardPage;
