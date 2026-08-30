function JobFormModal({ error, form, isSaving, mode, onChange, onClose, onSubmit }) {
  const title = mode === 'create' ? 'Create Job Opening' : 'Edit Job Opening';
  const action = mode === 'create' ? 'Create Job Opening' : 'Save Changes';

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
            <p className="mt-1 text-sm text-slate-500">Use concise details recruiters can scan quickly.</p>
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
            <label className="text-sm font-medium text-slate-700" htmlFor="job-title">Title</label>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
              id="job-title"
              name="title"
              onChange={onChange}
              placeholder="Frontend Engineer"
              value={form.title}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="job-department">Department</label>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
                id="job-department"
                name="department"
                onChange={onChange}
                placeholder="Engineering"
                value={form.department}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="job-status">Status</label>
              <select
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
                id="job-status"
                name="status"
                onChange={onChange}
                value={form.status}
              >
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="job-description">Description</label>
            <textarea
              className="mt-2 min-h-32 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
              id="job-description"
              name="description"
              onChange={onChange}
              placeholder="Describe the role and hiring need."
              value={form.description}
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

export default JobFormModal;
