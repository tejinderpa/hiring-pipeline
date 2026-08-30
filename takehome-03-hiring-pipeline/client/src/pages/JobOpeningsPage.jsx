import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import JobFormModal from '../components/JobFormModal.jsx';

const emptyForm = {
  title: '',
  department: '',
  description: '',
  status: 'OPEN',
};

function formatDate(value) {
  if (!value) {
    return 'Never';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function getApplicationCount(job) {
  return job.applicationCount ?? job.applications?.length ?? 0;
}

function StatusBadge({ status }) {
  const classes = status === 'OPEN'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-slate-200 bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-semibold ${classes}`}>
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

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  async function hydrateApplicationCounts(nextJobs) {
    const detailedJobs = await Promise.all(nextJobs.map(async (job) => {
      const data = await requestJson(`/api/jobs/${job.id}`, {
        headers: authHeaders,
      });

      return {
        ...job,
        applicationCount: data.job.applications?.length ?? 0,
      };
    }));

    return detailedJobs;
  }

  async function loadJobs(nextView = view) {
    setIsLoading(true);
    setError('');

    try {
      const query = nextView === 'archived' ? '?archived=true' : '';
      const data = await requestJson(`/api/jobs${query}`, {
        headers: authHeaders,
      });
      const detailedJobs = await hydrateApplicationCounts(data.jobs);

      setJobs(detailedJobs);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load job openings.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadJobs(view);
  }, [view]);

  function openCreateModal() {
    setEditingJob(null);
    setForm(emptyForm);
    setModalError('');
    setModalMode('create');
  }

  function openEditModal(job) {
    setEditingJob(job);
    setForm({
      title: job.title,
      department: job.department,
      description: job.description,
      status: job.status,
    });
    setModalError('');
    setModalMode('edit');
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setModalMode(null);
    setEditingJob(null);
    setModalError('');
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setModalError('');

    const payload = {
      title: form.title,
      department: form.department,
      description: form.description,
      status: form.status,
    };

    setIsSaving(true);

    try {
      if (modalMode === 'create') {
        await requestJson('/api/jobs', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
      } else {
        await requestJson(`/api/jobs/${editingJob.id}`, {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
      }

      setModalMode(null);
      setEditingJob(null);
      await loadJobs(view);
    } catch (requestError) {
      setModalError(requestError.message || 'Unable to save job opening.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive(job) {
    try {
      await requestJson(`/api/jobs/${job.id}/archive`, {
        method: 'POST',
        headers: authHeaders,
      });
      await loadJobs(view);
    } catch (requestError) {
      setError(requestError.message || 'Unable to archive job opening.');
    }
  }

  async function handleRestore(job) {
    try {
      await requestJson(`/api/jobs/${job.id}/restore`, {
        method: 'POST',
        headers: authHeaders,
      });
      await loadJobs(view);
    } catch (requestError) {
      setError(requestError.message || 'Unable to restore job opening.');
    }
  }

  const isArchivedView = view === 'archived';

  return (
    <div className="flex flex-1 flex-col px-5 py-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Recruiting</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Job Openings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Manage positions currently being hired for.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isArchivedView}
          onClick={openCreateModal}
          type="button"
        >
          Create Job Opening
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-md border border-slate-300 bg-white p-1 shadow-sm">
          <button
            className={`h-9 rounded px-3 text-sm font-semibold transition ${!isArchivedView ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
            onClick={() => setView('active')}
            type="button"
          >
            Active openings
          </button>
          <button
            className={`h-9 rounded px-3 text-sm font-semibold transition ${isArchivedView ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
            onClick={() => setView('archived')}
            type="button"
          >
            Archived
          </button>
        </div>
        <p className="text-sm text-slate-500">
          {jobs.length} {jobs.length === 1 ? 'opening' : 'openings'}
        </p>
      </div>

      {error ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Job Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Applications</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Last Updated</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan="6">Loading job openings...</td>
                  </tr>
                ) : jobs.length ? jobs.map((job) => (
                  <tr className="hover:bg-slate-50" key={job.id}>
                    <td className="max-w-xs px-4 py-4">
                      <p className="truncate text-sm font-semibold text-slate-950">{job.title}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">{job.description}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">{job.department}</td>
                    <td className="px-4 py-4"><StatusBadge status={job.status} /></td>
                    <td className="px-4 py-4 text-sm text-slate-700">{getApplicationCount(job)}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{formatDate(job.updatedAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-950"
                          to={`/jobs/${job.id}`}
                        >
                          {isArchivedView ? 'View' : 'Open'}
                        </Link>
                        {!isArchivedView ? (
                          <>
                            <button
                              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-950"
                              onClick={() => openEditModal(job)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-950"
                              onClick={() => handleArchive(job)}
                              type="button"
                            >
                              Archive
                            </button>
                          </>
                        ) : (
                          <button
                            className="h-9 rounded-md border border-cyan-200 bg-cyan-50 px-3 text-sm font-semibold text-cyan-800 shadow-sm hover:bg-cyan-100"
                            onClick={() => handleRestore(job)}
                            type="button"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-4 py-12 text-center" colSpan="6">
                      <p className="text-sm font-semibold text-slate-950">
                        {isArchivedView ? 'No archived openings.' : 'No active job openings yet.'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {isArchivedView
                          ? 'Archived jobs will appear here when they are hidden from the active list.'
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
          error={modalError}
          form={form}
          isSaving={isSaving}
          mode={modalMode}
          onChange={handleFormChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}

export default JobOpeningsPage;
