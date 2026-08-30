import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import JobFormModal from '../components/JobFormModal.jsx';

const emptyApplicationForm = {
  candidateName: '',
  candidateEmail: '',
  source: '',
  notes: '',
};

function formatDate(value) {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
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

function StageBadge({ stage }) {
  return (
    <span className="inline-flex h-7 items-center rounded-md border border-cyan-200 bg-cyan-50 px-2 text-xs font-semibold text-cyan-800">
      {stage}
    </span>
  );
}

function ApplicationFormModal({ error, form, isSaving, mode, onChange, onClose, onSubmit }) {
  const title = mode === 'create' ? 'Add Candidate' : 'Edit Candidate';
  const action = mode === 'create' ? 'Add Candidate' : 'Save Changes';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-6">
      <form
        className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
        noValidate
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">Stage is managed separately from candidate details.</p>
          </div>
          <button
            className="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid gap-5">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="candidate-name">Candidate name</label>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
              id="candidate-name"
              name="candidateName"
              onChange={onChange}
              placeholder="Asha Mehta"
              value={form.candidateName}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="candidate-email">Candidate email</label>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
                id="candidate-email"
                name="candidateEmail"
                onChange={onChange}
                placeholder="candidate@example.com"
                type="email"
                value={form.candidateEmail}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="candidate-source">Source</label>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
                id="candidate-source"
                name="source"
                onChange={onChange}
                placeholder="LinkedIn"
                value={form.source}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="candidate-notes">Notes</label>
            <textarea
              className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
              id="candidate-notes"
              name="notes"
              onChange={onChange}
              placeholder="Optional context for the recruiting team."
              value={form.notes}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
          <button
            className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="h-10 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? 'Saving...' : action}
          </button>
        </div>
      </form>
    </div>
  );
}

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

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  async function loadJob() {
    setIsLoading(true);
    setError('');

    try {
      const data = await requestJson(`/api/jobs/${id}`, {
        headers: authHeaders,
      });
      setJob(data.job);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load job opening.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadJob();
  }, [id]);

  function openJobEdit() {
    setJobForm({
      title: job.title,
      department: job.department,
      description: job.description,
      status: job.status,
    });
    setModalError('');
  }

  function closeJobEdit() {
    if (!isSaving) {
      setJobForm(null);
      setModalError('');
    }
  }

  function handleJobFormChange(event) {
    const { name, value } = event.target;
    setJobForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleJobSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setModalError('');

    try {
      const data = await requestJson(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(jobForm),
      });
      setJob((current) => ({
        ...data.job,
        applications: current.applications,
      }));
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
      const data = await requestJson(`/api/jobs/${job.id}/archive`, {
        method: 'POST',
        headers: authHeaders,
      });
      setJob((current) => ({
        ...data.job,
        applications: current.applications,
      }));
    } catch (requestError) {
      setError(requestError.message || 'Unable to archive job opening.');
    }
  }

  function openApplicationCreate() {
    setEditingApplication(null);
    setApplicationForm(emptyApplicationForm);
    setModalError('');
    setApplicationMode('create');
  }

  function openApplicationEdit(application) {
    setEditingApplication(application);
    setApplicationForm({
      candidateName: application.candidateName,
      candidateEmail: application.candidateEmail,
      source: application.source,
      notes: application.notes || '',
    });
    setModalError('');
    setApplicationMode('edit');
  }

  function closeApplicationModal() {
    if (!isSaving) {
      setApplicationMode(null);
      setEditingApplication(null);
      setModalError('');
    }
  }

  function handleApplicationFormChange(event) {
    const { name, value } = event.target;
    setApplicationForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleApplicationSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setModalError('');

    try {
      if (applicationMode === 'create') {
        await requestJson(`/api/jobs/${job.id}/applications`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(applicationForm),
        });
      } else {
        await requestJson(`/api/applications/${editingApplication.id}`, {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify(applicationForm),
        });
      }

      setApplicationMode(null);
      setEditingApplication(null);
      await loadJob();
    } catch (requestError) {
      setModalError(requestError.message || 'Unable to save candidate.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="grid flex-1 place-items-center px-5 py-12 text-sm font-medium text-slate-500 lg:px-8">
        Loading job opening...
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="flex flex-1 flex-col px-5 py-6 lg:px-8">
        <Link className="text-sm font-semibold text-cyan-800 hover:text-cyan-900" to="/jobs">
          Back to Job Openings
        </Link>
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-5 py-6 lg:px-8">
      <div className="border-b border-slate-200 pb-5">
        <Link className="text-sm font-semibold text-cyan-800 hover:text-cyan-900" to="/jobs">
          Back to Job Openings
        </Link>

        <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-950">{job.title}</h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">{job.department}</p>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-700">{job.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
              onClick={openJobEdit}
              type="button"
            >
              Edit
            </button>
            <button
              className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              disabled={Boolean(job.archivedAt)}
              onClick={handleArchive}
              type="button"
            >
              {job.archivedAt ? 'Archived' : 'Archive'}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Applications</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Candidates for this opening</h2>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800"
            onClick={openApplicationCreate}
            type="button"
          >
            Add Candidate
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Candidate</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Applied Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {job.applications?.length ? job.applications.map((application) => (
                  <tr className="hover:bg-slate-50" key={application.id}>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-950">{application.candidateName}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{application.candidateEmail}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{application.source}</td>
                    <td className="px-4 py-4"><StageBadge stage={application.stage} /></td>
                    <td className="px-4 py-4 text-sm text-slate-700">{formatDate(application.appliedAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <button
                          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-950"
                          onClick={() => openApplicationEdit(application)}
                          type="button"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-4 py-12 text-center" colSpan="6">
                      <p className="text-sm font-semibold text-slate-950">No applications yet.</p>
                      <p className="mt-1 text-sm text-slate-500">Add a candidate to start tracking this opening.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {jobForm ? (
        <JobFormModal
          error={modalError}
          form={jobForm}
          isSaving={isSaving}
          mode="edit"
          onChange={handleJobFormChange}
          onClose={closeJobEdit}
          onSubmit={handleJobSubmit}
        />
      ) : null}

      {applicationMode ? (
        <ApplicationFormModal
          error={modalError}
          form={applicationForm}
          isSaving={isSaving}
          mode={applicationMode}
          onChange={handleApplicationFormChange}
          onClose={closeApplicationModal}
          onSubmit={handleApplicationSubmit}
        />
      ) : null}
    </div>
  );
}

export default JobDetailPage;
