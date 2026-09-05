import { useEffect } from 'react';
import { createPortal } from 'react-dom';

function JobFormModal({ error, form, isSaving, mode, onChange, onClose, onSubmit }) {
  const title = mode === 'create' ? 'Create Job Opening' : 'Edit Job Opening';
  const action = mode === 'create' ? 'Create Job Opening' : 'Save Changes';

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center overflow-hidden p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <form
        className="relative flex max-h-[calc(100vh-3rem)] w-full max-w-2xl animate-scale-in flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl"
        noValidate
        onSubmit={onSubmit}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-7 py-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">Use concise details recruiters can scan quickly.</p>
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

        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6 overscroll-contain">
          {error ? (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="job-title">
                Job Title
              </label>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                id="job-title" name="title" onChange={onChange}
                placeholder="Frontend Engineer" value={form.title}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="job-department">
                  Department
                </label>
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  id="job-department" name="department" onChange={onChange}
                  placeholder="Engineering" value={form.department}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="job-status">
                  Status
                </label>
                <select
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  id="job-status" name="status" onChange={onChange} value={form.status}
                >
                  <option value="OPEN">OPEN</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="job-description">
                Description
              </label>
              <textarea
                className="min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                id="job-description" name="description" onChange={onChange}
                placeholder="Describe the role and hiring need." value={form.description}
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-white px-7 py-5">
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
    </div>,
    document.body,
  );
}

export default JobFormModal;
