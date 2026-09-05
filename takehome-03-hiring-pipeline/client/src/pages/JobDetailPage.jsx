import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import JobFormModal from '../components/JobFormModal.jsx';
import PageHeader from '../components/PageHeader.jsx';

function getTodayDateInput() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
}

function getCurrentDateTimeInput() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

const emptyApplicationForm = {
  candidateName: '',
  candidateEmail: '',
  source: '',
  notes: '',
  appliedAt: getTodayDateInput(),
  interviewScheduledAt: '',
};

function formatDate(value) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date(value));
}

function formatDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function formatDateInput(value) {
  if (!value) return getTodayDateInput();
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
}

const stageConfig = {
  APPLIED:   { cls: 'bg-blue-50 border-blue-200 text-blue-700' },
  SCREENING: { cls: 'bg-violet-50 border-violet-200 text-violet-700' },
  INTERVIEW: { cls: 'bg-amber-50 border-amber-200 text-amber-700' },
  OFFER:     { cls: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  HIRED:     { cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  REJECTED:  { cls: 'bg-red-50 border-red-200 text-red-600' },
};

function StatusBadge({ status }) {
  const cfg = status === 'OPEN'
    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
    : 'bg-slate-100 border-slate-200 text-slate-600';
  return (
    <span className={`inline-flex h-6 items-center rounded-lg border px-2.5 text-[11px] font-semibold tracking-wide ${cfg}`}>
      {status}
    </span>
  );
}

function StageBadge({ stage }) {
  const cfg = stageConfig[stage] || { cls: 'bg-slate-50 border-slate-200 text-slate-600' };
  return (
    <span className={`inline-flex h-6 items-center rounded-lg border px-2.5 text-[11px] font-semibold tracking-wide ${cfg.cls}`}>
      {stage}
    </span>
  );
}

/* Application Form Modal */
function ApplicationFormModal({
  error,
  form,
  isSaving,
  mode,
  onChange,
  onClose,
  onSubmit,
  todayDate,
  currentDateTime,
}) {
  const title = mode === 'create' ? 'Add Candidate' : 'Edit Candidate';
  const action = mode === 'create' ? 'Add Candidate' : 'Save Changes';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <form
        className="relative w-full max-w-2xl animate-scale-in rounded-2xl border border-slate-200/80 bg-white p-7 shadow-2xl"
        noValidate
        onSubmit={onSubmit}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">Stage is managed separately from candidate details.</p>
          </div>
          <button
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            onClick={onClose}
            type="button"
            aria-label="Close modal"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor"
              strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="candidate-name">
              Candidate name
            </label>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              id="candidate-name" name="candidateName" onChange={onChange}
              placeholder="Asha Mehta" value={form.candidateName}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="candidate-email">
                Candidate email
              </label>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                id="candidate-email" name="candidateEmail" onChange={onChange}
                placeholder="candidate@example.com" type="email" value={form.candidateEmail}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="candidate-source">
                Source
              </label>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                id="candidate-source" name="source" onChange={onChange}
                placeholder="LinkedIn" value={form.source}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="candidate-applied-at">
                Applied date
              </label>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                disabled={mode !== 'create'}
                id="candidate-applied-at"
                max={todayDate}
                name="appliedAt"
                onChange={onChange}
                type="date"
                value={form.appliedAt}
              />
              <p className="mt-1.5 text-xs text-slate-400">
                {mode === 'create' ? 'Defaults to today. Future dates are not allowed.' : 'Applied date is locked after creation.'}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="candidate-interview-scheduled-at">
                Interview scheduled time
              </label>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                id="candidate-interview-scheduled-at" name="interviewScheduledAt" onChange={onChange}
                min={currentDateTime}
                type="datetime-local" value={form.interviewScheduledAt}
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Leave blank until an interview is confirmed. Past times are not allowed.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="candidate-notes">
              Notes
            </label>
            <textarea
              className="min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              id="candidate-notes" name="notes" onChange={onChange}
              placeholder="Optional context for the recruiting team." value={form.notes}
            />
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-6">
          <button
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={onClose} type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            disabled={isSaving} type="submit"
          >
            {isSaving ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin-smooth" />
                Saving...
              </>
            ) : action}
          </button>
        </div>
      </form>
    </div>
  );
}

/* Main Page */
function JobDetailPage({ requestJson, token }) {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [jobForm, setJobForm] = useState(null);
  const [applicationMode, setApplicationMode] = useState(null);
  const [editingApplication, setEditingApplication] = useState(null);
  const [applicationForm, setApplicationForm] = useState(emptyApplicationForm);
  const todayDate = getTodayDateInput();
  const currentDateTime = getCurrentDateTimeInput();

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  async function loadJob() {
    setIsLoading(true); setError('');
    try {
      const data = await requestJson(`/api/jobs/${id}`, { headers: authHeaders });
      setJob(data.job);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load job opening.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadJob(); }, [id]);

  function openJobEdit() {
    setJobForm({ title: job.title, department: job.department, description: job.description, status: job.status });
    setModalError('');
  }

  function closeJobEdit() {
    if (!isSaving) { setJobForm(null); setModalError(''); }
  }

  function handleJobFormChange(event) {
    const { name, value } = event.target;
    setJobForm((current) => ({ ...current, [name]: value }));
  }

  async function handleJobSubmit(event) {
    event.preventDefault(); setIsSaving(true); setModalError('');
    try {
      const data = await requestJson(`/api/jobs/${job.id}`, {
        method: 'PATCH', headers: authHeaders, body: JSON.stringify(jobForm),
      });
      setJob((current) => ({ ...data.job, applications: current.applications }));
      setJobForm(null);
    } catch (requestError) {
      setModalError(requestError.message || 'Unable to save job opening.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive() {
    setError('');
    try {
      const data = await requestJson(`/api/jobs/${job.id}/archive`, { method: 'POST', headers: authHeaders });
      setJob((current) => ({ ...data.job, applications: current.applications }));
    } catch (requestError) {
      setError(requestError.message || 'Unable to archive job opening.');
    }
  }

  function openApplicationCreate() {
    setEditingApplication(null);
    setApplicationForm({ ...emptyApplicationForm, appliedAt: getTodayDateInput() });
    setModalError(''); setApplicationMode('create');
  }

  function openApplicationEdit(application) {
    setEditingApplication(application);
    setApplicationForm({
      candidateName: application.candidateName,
      candidateEmail: application.candidateEmail,
      source: application.source,
      notes: application.notes || '',
      appliedAt: formatDateInput(application.appliedAt),
      interviewScheduledAt: formatDateTimeInput(application.interviewScheduledAt),
    });
    setModalError(''); setApplicationMode('edit');
  }

  function closeApplicationModal() {
    if (!isSaving) { setApplicationMode(null); setEditingApplication(null); setModalError(''); }
  }

  function handleApplicationFormChange(event) {
    const { name, value } = event.target;
    setApplicationForm((current) => ({ ...current, [name]: value }));
  }

  async function handleApplicationSubmit(event) {
    event.preventDefault();
    setModalError('');

    if (!applicationForm.appliedAt) {
      setModalError('Applied date is required.');
      return;
    }

    if (applicationForm.appliedAt > todayDate) {
      setModalError('Applied date cannot be in the future.');
      return;
    }

    if (applicationForm.interviewScheduledAt && applicationForm.interviewScheduledAt < currentDateTime) {
      setModalError('Interview scheduled time cannot be in the past.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = applicationMode === 'create'
        ? applicationForm
        : {
          candidateName: applicationForm.candidateName,
          candidateEmail: applicationForm.candidateEmail,
          source: applicationForm.source,
          notes: applicationForm.notes,
          interviewScheduledAt: applicationForm.interviewScheduledAt,
        };

      if (applicationMode === 'create') {
        await requestJson(`/api/jobs/${job.id}/applications`, {
          method: 'POST', headers: authHeaders, body: JSON.stringify(payload),
        });
      } else {
        await requestJson(`/api/applications/${editingApplication.id}`, {
          method: 'PATCH', headers: authHeaders, body: JSON.stringify(payload),
        });
      }
      setApplicationMode(null); setEditingApplication(null);
      await loadJob();
    } catch (requestError) {
      setModalError(requestError.message || 'Unable to save candidate.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-400">
          <span className="h-5 w-5 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin-smooth" />
          Loading job opening...
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          actions={(
            <Link className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50" to="/jobs">
              Back to Jobs
            </Link>
          )}
          eyebrow="Job Opening"
          title="Opening Not Found"
        />
        <div className="px-6 py-6 lg:px-8">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHeader
        actions={(
          <>
            <Link
              className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-px hover:shadow-md"
              to="/jobs"
            >
              Back to Jobs
            </Link>
            <button
              className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-px hover:shadow-md"
              onClick={openJobEdit} type="button"
            >
              Edit Job
            </button>
            <button
              className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={Boolean(job.archivedAt)} onClick={handleArchive} type="button"
            >
              {job.archivedAt ? 'Archived' : 'Archive'}
            </button>
          </>
        )}
        eyebrow="Job Opening"
        meta={<StatusBadge status={job.status} />}
        subtitle={`${job.department} - ${job.description}`}
        title={job.title}
      />

      <div className="flex-1 px-6 py-6 lg:px-8">
        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        {/* Applications section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500">Applications</p>
            <h2 className="mt-1 text-base font-bold text-slate-900">Candidates for this opening</h2>
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-indigo-700 hover:shadow-md"
            onClick={openApplicationCreate} type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor"
              strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Candidate
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50/80">
                  {['Candidate', 'Email', 'Source', 'Stage', 'Applied Date', 'Interview', 'Actions'].map((h) => (
                    <th key={h}
                      className={`px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${h === 'Actions' ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {job.applications?.length ? job.applications.map((application) => (
                  <tr className="group transition-colors duration-150 hover:bg-indigo-50/30" key={application.id}>
                    <td className="px-5 py-4 text-sm font-bold text-slate-900">{application.candidateName}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{application.candidateEmail}</td>
                    <td className="px-5 py-4">
                      {application.source
                        ? <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{application.source}</span>
                        : <span className="text-sm text-slate-400">-</span>}
                    </td>
                    <td className="px-5 py-4"><StageBadge stage={application.stage} /></td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(application.appliedAt)}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDateTime(application.interviewScheduledAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                          onClick={() => openApplicationEdit(application)} type="button"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-5 py-16 text-center" colSpan="7">
                      <p className="text-sm font-semibold text-slate-800">No applications yet.</p>
                      <p className="mt-1 text-sm text-slate-400">Add a candidate to start tracking this opening.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {jobForm ? (
        <JobFormModal
          error={modalError} form={jobForm} isSaving={isSaving} mode="edit"
          onChange={handleJobFormChange} onClose={closeJobEdit} onSubmit={handleJobSubmit}
        />
      ) : null}

      {applicationMode ? (
        <ApplicationFormModal
          error={modalError} form={applicationForm} isSaving={isSaving} mode={applicationMode}
          onChange={handleApplicationFormChange} onClose={closeApplicationModal} onSubmit={handleApplicationSubmit}
          currentDateTime={currentDateTime}
          todayDate={todayDate}
        />
      ) : null}
    </div>
  );
}

export default JobDetailPage;
