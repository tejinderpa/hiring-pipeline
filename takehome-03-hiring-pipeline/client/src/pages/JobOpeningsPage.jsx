import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import JobFormModal from '../components/JobFormModal.jsx';
import PageHeader from '../components/PageHeader.jsx';

const emptyForm = { title: '', department: '', description: '', status: 'OPEN' };

function formatDate(value) {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(value));
}

function getApplicationCount(job) {
  return job.applicationCount ?? job.applications?.length ?? 0;
}

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

function JobOpeningsPage({ requestJson, token }) {
  const [view, setView] = useState('active');
  const [jobs, setJobs] = useState([]);
  const [modalMode, setModalMode] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingJobIds, setPendingJobIds] = useState([]);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  async function hydrateApplicationCounts(nextJobs) {
    return Promise.all(nextJobs.map(async (job) => {
      const data = await requestJson(`/api/jobs/${job.id}`, { headers: authHeaders });
      return { ...job, applicationCount: data.job.applications?.length ?? 0 };
    }));
  }

  async function loadJobs(nextView = view) {
    setIsLoading(true);
    setError('');
    try {
      const query = nextView === 'archived' ? '?archived=true' : '';
      const data = await requestJson(`/api/jobs${query}`, { headers: authHeaders });
      const detailedJobs = await hydrateApplicationCounts(data.jobs);
      setJobs(detailedJobs);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load job openings.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadJobs(view); }, [view]);

  function openCreateModal() {
    setEditingJob(null); setForm(emptyForm); setModalError(''); setModalMode('create');
  }

  function openEditModal(job) {
    setEditingJob(job);
    setForm({ title: job.title, department: job.department, description: job.description, status: job.status });
    setModalError(''); setModalMode('edit');
  }

  function closeModal() {
    if (isSaving) return;
    setModalMode(null); setEditingJob(null); setModalError('');
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setModalError('');
    const payload = { title: form.title, department: form.department, description: form.description, status: form.status };
    setIsSaving(true);
    try {
      if (modalMode === 'create') {
        const data = await requestJson('/api/jobs', { method: 'POST', headers: authHeaders, body: JSON.stringify(payload) });
        setJobs((current) => [{ ...data.job, applicationCount: 0 }, ...current]);
      } else {
        const data = await requestJson(`/api/jobs/${editingJob.id}`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify(payload) });
        setJobs((current) => current.map((job) => (
          job.id === editingJob.id
            ? { ...data.job, applicationCount: getApplicationCount(job) }
            : job
        )));
      }
      setModalMode(null); setEditingJob(null);
    } catch (requestError) {
      setModalError(requestError.message || 'Unable to save job opening.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive(job) {
    setError('');
    setPendingJobIds((current) => current.includes(job.id) ? current : [...current, job.id]);
    try {
      const data = await requestJson(`/api/jobs/${job.id}/archive`, { method: 'POST', headers: authHeaders });
      setJobs((current) => current.filter((item) => item.id !== job.id));
      setEditingJob((current) => current?.id === job.id ? data.job : current);
    } catch (requestError) {
      setError(requestError.message || 'Unable to archive job opening.');
    } finally {
      setPendingJobIds((current) => current.filter((id) => id !== job.id));
    }
  }

  async function handleRestore(job) {
    setError('');
    setPendingJobIds((current) => current.includes(job.id) ? current : [...current, job.id]);
    try {
      const data = await requestJson(`/api/jobs/${job.id}/restore`, { method: 'POST', headers: authHeaders });
      setJobs((current) => current.filter((item) => item.id !== job.id));
      setEditingJob((current) => current?.id === job.id ? data.job : current);
    } catch (requestError) {
      setError(requestError.message || 'Unable to restore job opening.');
    } finally {
      setPendingJobIds((current) => current.filter((id) => id !== job.id));
    }
  }

  const isArchivedView = view === 'archived';

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHeader
        actions={(
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-indigo-700 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
            disabled={isArchivedView}
            onClick={openCreateModal}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor"
              strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create Job Opening
          </button>
        )}
        eyebrow="Recruiting"
        subtitle="Manage active and archived hiring positions."
        title="Job Openings"
      />

      <div className="flex-1 px-6 py-5 lg:px-8">
        {/* Toolbar */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              className={`h-8 rounded-lg px-4 text-sm font-semibold transition-all duration-200 ${!isArchivedView ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              onClick={() => setView('active')}
              type="button"
            >
              Active
            </button>
            <button
              className={`h-8 rounded-lg px-4 text-sm font-semibold transition-all duration-200 ${isArchivedView ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              onClick={() => setView('archived')}
              type="button"
            >
              Archived
            </button>
          </div>
          <p className="text-sm font-medium text-slate-500">
            <span className="font-bold text-slate-800">{jobs.length}</span> {jobs.length === 1 ? 'opening' : 'openings'}
          </p>
        </div>

        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Job Title</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Department</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Applications</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Last Updated</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td className="px-5 py-12 text-center text-sm text-slate-400" colSpan="6">
                      <div className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin-smooth" />
                        Loading job openings...
                      </div>
                    </td>
                  </tr>
                ) : jobs.length ? jobs.map((job) => {
                  const isPending = pendingJobIds.includes(job.id);

                  return (
                  <tr
                    className={`group transition-all duration-300 hover:bg-indigo-50/30 ${isPending ? 'bg-slate-50 opacity-45' : ''}`}
                    key={job.id}
                  >
                    <td className="max-w-xs px-5 py-4">
                      <p className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{job.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{job.description}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{job.department}</span>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={job.status} /></td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-slate-800">{getApplicationCount(job)}</span>
                      <span className="ml-1 text-xs text-slate-400">apps</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(job.updatedAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          className={`inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 ${isPending ? 'pointer-events-none opacity-50' : ''}`}
                          to={`/jobs/${job.id}`}
                        >
                          {isArchivedView ? 'View' : 'Open'}
                        </Link>
                        {!isArchivedView ? (
                          <>
                            <button
                              className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                              disabled={isPending}
                              onClick={() => openEditModal(job)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="inline-flex h-8 min-w-20 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                              disabled={isPending}
                              onClick={() => handleArchive(job)}
                              type="button"
                            >
                              {isPending ? 'Archiving...' : 'Archive'}
                            </button>
                          </>
                        ) : (
                          <button
                            className="inline-flex h-8 min-w-20 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                            disabled={isPending}
                            onClick={() => handleRestore(job)}
                            type="button"
                          >
                            {isPending ? 'Restoring...' : 'Restore'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                }) : (
                  <tr>
                    <td className="px-5 py-16 text-center" colSpan="6">
                      <p className="text-sm font-semibold text-slate-800">
                        {isArchivedView ? 'No archived openings.' : 'No active job openings yet.'}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {isArchivedView
                          ? 'Archived jobs will appear here.'
                          : 'Create a job opening to start tracking applications.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalMode ? (
        <JobFormModal
          error={modalError} form={form} isSaving={isSaving} mode={modalMode}
          onChange={handleFormChange} onClose={closeModal} onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}

export default JobOpeningsPage;
