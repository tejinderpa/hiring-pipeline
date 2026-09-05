import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import PageHeader from '../components/PageHeader.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const stages = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
const sortOptions = [
  { label: 'Last Updated', value: 'updatedAt' },
  { label: 'Applied Date', value: 'appliedAt' },
  { label: 'Stage',        value: 'stage' },
];
const tableHeaders = [
  { label: 'Candidate', className: 'w-[18%]' },
  { label: 'Email', className: 'w-[20%]' },
  { label: 'Job Opening', className: 'w-[18%]' },
  { label: 'Source', className: 'w-[12%]' },
  { label: 'Stage', className: 'w-[12%]' },
  { label: 'Applied Date', className: 'w-[10%] whitespace-nowrap' },
  { label: 'Last Updated', className: 'w-[10%] whitespace-nowrap' },
];
const limit = 20;

function formatDate(value) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(value));
}

const stageConfig = {
  APPLIED:   { cls: 'bg-blue-50 border-blue-200 text-blue-700' },
  SCREENING: { cls: 'bg-violet-50 border-violet-200 text-violet-700' },
  INTERVIEW: { cls: 'bg-amber-50 border-amber-200 text-amber-700' },
  OFFER:     { cls: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  HIRED:     { cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  REJECTED:  { cls: 'bg-red-50 border-red-200 text-red-600' },
};

function StageBadge({ stage }) {
  const cfg = stageConfig[stage] || { cls: 'bg-slate-50 border-slate-200 text-slate-600' };
  return (
    <span className={`inline-flex h-6 max-w-full items-center rounded-lg border px-2 text-[10px] font-semibold tracking-normal ${cfg.cls}`}>
      {stage}
    </span>
  );
}

function CandidateInitials({ name }) {
  const initials = name
    ?.split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 text-[10px] font-bold text-white">
      {initials}
    </div>
  );
}

function getSearchParam(searchParams, key, fallback = '') {
  return searchParams.get(key) || fallback;
}

function parsePage(searchParams) {
  const value = Number(searchParams.get('page') || '1');
  if (!Number.isInteger(value) || value < 1) return 1;
  return value;
}

function buildApplicationsQuery(params) {
  const apiParams = new URLSearchParams();
  if (params.search) apiParams.set('search', params.search);
  if (params.jobId)  apiParams.set('jobId', params.jobId);
  if (params.stage)  apiParams.set('stage', params.stage);
  if (params.source) apiParams.set('source', params.source);
  apiParams.set('sort', params.sort);
  apiParams.set('order', params.order);
  apiParams.set('page', String(params.page));
  apiParams.set('limit', String(limit));
  return apiParams.toString();
}

function getBulkActionLabel(action) {
  return action === 'advance' ? 'advanced' : 'rejected';
}

function getDownloadFilename(contentDisposition) {
  const match = contentDisposition?.match(/filename="([^"]+)"/);
  return match?.[1] || 'hiring-pipeline.csv';
}

/* ── Filter label + select ── */
function FilterField({ label, id, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-500" htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10';

function CandidatesPage({ requestJson, token }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, pages: 0 });
  const [searchInput, setSearchInput] = useState(getSearchParam(searchParams, 'search'));
  const [sourceInput, setSourceInput] = useState(getSearchParam(searchParams, 'source'));
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkResult, setBulkResult] = useState(null);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [error, setError] = useState('');
  const [jobsError, setJobsError] = useState('');
  const [exportError, setExportError] = useState('');
  const bulkRequestInFlightRef = useRef(false);
  const exportRequestInFlightRef = useRef(false);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const queryState = useMemo(() => ({
    search: getSearchParam(searchParams, 'search'),
    jobId:  getSearchParam(searchParams, 'jobId'),
    stage:  getSearchParam(searchParams, 'stage'),
    source: getSearchParam(searchParams, 'source'),
    sort:   getSearchParam(searchParams, 'sort', 'updatedAt'),
    order:  getSearchParam(searchParams, 'order', 'desc'),
    page:   parsePage(searchParams),
  }), [searchParams]);

  const hasFilters = Boolean(queryState.search || queryState.jobId || queryState.stage || queryState.source);
  const showingStart = pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1;
  const showingEnd = Math.min(pagination.page * pagination.limit, pagination.total);
  const selectedCount = selectedIds.size;
  const allCurrentPageSelected = applications.length > 0
    && applications.every((app) => selectedIds.has(app.id));
  const applicationNamesById = useMemo(() => {
    const map = new Map();
    applications.forEach((app) => map.set(app.id, app.candidateName));
    return map;
  }, [applications]);

  useEffect(() => { setSearchInput(queryState.search); }, [queryState.search]);
  useEffect(() => { setSourceInput(queryState.source); }, [queryState.source]);
  useEffect(() => { setSelectedIds(new Set()); setBulkResult(null); }, [queryState]);

  useEffect(() => {
    let isCurrent = true;
    async function loadJobs() {
      setIsLoadingJobs(true); setJobsError('');
      try {
        const data = await requestJson('/api/jobs?archived=all', { headers: authHeaders });
        if (isCurrent) setJobs(data.jobs || []);
      } catch (requestError) {
        if (isCurrent) setJobsError(requestError.message || 'Unable to load job openings.');
      } finally {
        if (isCurrent) setIsLoadingJobs(false);
      }
    }
    loadJobs();
    return () => { isCurrent = false; };
  }, [authHeaders, requestJson]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSearch = searchInput.trim();
      if (nextSearch === queryState.search) return;
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (nextSearch) next.set('search', nextSearch); else next.delete('search');
        next.set('page', '1');
        return next;
      });
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [queryState.search, searchInput, setSearchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSource = sourceInput.trim();
      if (nextSource === queryState.source) return;
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (nextSource) next.set('source', nextSource); else next.delete('source');
        next.set('page', '1');
        return next;
      });
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [queryState.source, setSearchParams, sourceInput]);

  useEffect(() => {
    let isCurrent = true;
    async function loadApplications() {
      setIsLoading(true); setError('');
      try {
        const query = buildApplicationsQuery(queryState);
        const data = await requestJson(`/api/applications?${query}`, { headers: authHeaders });
        if (isCurrent) {
          setApplications(data.data || []);
          setPagination(data.pagination || { page: queryState.page, limit, total: 0, pages: 0 });
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(requestError.message || 'Unable to load candidates.');
          setApplications([]);
          setPagination({ page: queryState.page, limit, total: 0, pages: 0 });
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }
    loadApplications();
    return () => { isCurrent = false; };
  }, [authHeaders, queryState, requestJson]);

  async function refreshApplications() {
    const query = buildApplicationsQuery(queryState);
    const data = await requestJson(`/api/applications?${query}`, { headers: authHeaders });
    setApplications(data.data || []);
    setPagination(data.pagination || { page: queryState.page, limit, total: 0, pages: 0 });
  }

  function updateQuery(updates) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(updates).forEach(([key, value]) => {
        if (value) next.set(key, value); else next.delete(key);
      });
      return next;
    });
  }

  function updateFilter(key, value) { updateQuery({ [key]: value, page: '1' }); }
  function updateSort(value)  { updateQuery({ sort: value, page: '1' }); }
  function updateOrder(value) { updateQuery({ order: value, page: '1' }); }

  function clearFilters() {
    setSearchInput(''); setSourceInput('');
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      ['search', 'jobId', 'stage', 'source'].forEach((k) => next.delete(k));
      next.set('page', '1');
      return next;
    });
  }

  function goToPage(page) { updateQuery({ page: String(page) }); }

  function toggleApplicationSelection(applicationId) {
    setBulkResult(null);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(applicationId)) next.delete(applicationId); else next.add(applicationId);
      return next;
    });
  }

  function toggleCurrentPageSelection() {
    setBulkResult(null);
    setSelectedIds((current) => {
      if (applications.length === 0) return current;
      if (allCurrentPageSelected) return new Set();
      return new Set(applications.map((app) => app.id));
    });
  }

  function clearSelection() { setSelectedIds(new Set()); }

  async function runBulkAction(action) {
    if (bulkRequestInFlightRef.current || selectedIds.size === 0) return;
    if (action === 'reject' && !window.confirm('Reject selected applications?')) return;
    bulkRequestInFlightRef.current = true;
    setIsBulkSubmitting(true); setError(''); setBulkResult(null);
    try {
      const applicationIds = Array.from(selectedIds);
      const data = await requestJson(`/api/applications/bulk/${action}`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify({ applicationIds }),
      });
      const failures = [];
      let succeeded = 0;
      data.results.forEach((result) => {
        if (result.success) {
          succeeded += 1;
        } else {
          failures.push({
            applicationId: result.applicationId,
            name: applicationNamesById.get(result.applicationId) || result.applicationId,
            reason: result.reason,
          });
        }
      });
      await refreshApplications();
      setSelectedIds(new Set());
      setBulkResult({ action, succeeded, failed: failures.length, failures });
    } catch (requestError) {
      setError(requestError.message || `Unable to ${action} selected applications.`);
    } finally {
      bulkRequestInFlightRef.current = false;
      setIsBulkSubmitting(false);
    }
  }

  async function handleExportCsv() {
    if (exportRequestInFlightRef.current) return;
    exportRequestInFlightRef.current = true;
    setIsExporting(true); setExportError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/export`, { headers: authHeaders });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to export candidates.');
      }
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = getDownloadFilename(response.headers.get('Content-Disposition'));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      setExportError(requestError.message || 'Unable to export candidates.');
    } finally {
      exportRequestInFlightRef.current = false;
      setIsExporting(false);
    }
  }

  const bulkActionLabel = bulkResult ? getBulkActionLabel(bulkResult.action) : '';

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHeader
        actions={(
          <div className="flex flex-col items-end gap-1.5">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-px hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isExporting}
              onClick={handleExportCsv}
              type="button"
            >
              {isExporting ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-400/30 border-t-slate-500 animate-spin-smooth" />
                  Exporting...
                </>
              ) : (
                <>
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor"
                    strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Export CSV
                </>
              )}
            </button>
            <p className="text-xs text-slate-400">
              {showingStart}–{showingEnd} of {pagination.total}
            </p>
          </div>
        )}
        eyebrow="Applications"
        subtitle="Search and manage candidates across all job openings."
        title="Candidates"
      />

      <div className="flex-1 px-6 py-5 lg:px-8">
        {/* Filters */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[minmax(200px,1.4fr)_repeat(5,minmax(130px,1fr))_auto] lg:items-end">
            <FilterField label="Search" id="candidate-search">
              <input
                className={inputCls}
                id="candidate-search"
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name or email…"
                value={searchInput}
              />
            </FilterField>

            <FilterField label="Job Opening" id="candidate-job">
              <select
                className={inputCls}
                disabled={isLoadingJobs}
                id="candidate-job"
                onChange={(e) => updateFilter('jobId', e.target.value)}
                value={queryState.jobId}
              >
                <option value="">All jobs</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Stage" id="candidate-stage">
              <select
                className={inputCls}
                id="candidate-stage"
                onChange={(e) => updateFilter('stage', e.target.value)}
                value={queryState.stage}
              >
                <option value="">All stages</option>
                {stages.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Source" id="candidate-source">
              <input
                className={inputCls}
                id="candidate-source"
                onChange={(e) => setSourceInput(e.target.value)}
                placeholder="Any source…"
                value={sourceInput}
              />
            </FilterField>

            <FilterField label="Sort By" id="candidate-sort">
              <select
                className={inputCls}
                id="candidate-sort"
                onChange={(e) => updateSort(e.target.value)}
                value={queryState.sort}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Order" id="candidate-order">
              <select
                className={inputCls}
                id="candidate-order"
                onChange={(e) => updateOrder(e.target.value)}
                value={queryState.order}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </FilterField>

            <div className="flex items-end">
              <button
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!hasFilters}
                onClick={clearFilters}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>

          {jobsError ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{jobsError}</div>
          ) : null}
        </div>

        {/* Error banners */}
        {exportError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{exportError}</div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        {/* Bulk action bar */}
        {selectedCount > 0 ? (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
            <p className="text-sm font-semibold text-indigo-800">
              {selectedCount} {selectedCount === 1 ? 'candidate' : 'candidates'} selected
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex h-9 items-center rounded-xl border border-indigo-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isBulkSubmitting}
                onClick={clearSelection}
                type="button"
              >
                Clear Selection
              </button>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                disabled={isBulkSubmitting}
                onClick={() => runBulkAction('advance')}
                type="button"
              >
                {isBulkSubmitting ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin-smooth" /> : null}
                Advance Selected
              </button>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                disabled={isBulkSubmitting}
                onClick={() => runBulkAction('reject')}
                type="button"
              >
                Reject Selected
              </button>
            </div>
          </div>
        ) : null}

        {/* Bulk result */}
        {bulkResult ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm animate-fade-in">
            <p className="text-sm font-bold text-slate-900">
              {bulkResult.succeeded} {bulkResult.succeeded === 1 ? 'application' : 'applications'} {bulkActionLabel}.
            </p>
            {bulkResult.failed > 0 ? (
              <p className="mt-1 text-sm text-slate-500">
                {bulkResult.failed} could not be {bulkActionLabel}.
              </p>
            ) : null}
            {bulkResult.failures.length ? (
              <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                {bulkResult.failures.map((failure) => (
                  <li className="text-sm text-slate-600" key={failure.applicationId}>
                    <span className="font-semibold text-slate-900">{failure.name}</span>
                    <span className="text-slate-400"> — {failure.reason}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {/* Table */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="w-10 px-4 py-3.5 text-left">
                    <input
                      aria-label="Select all candidates"
                      checked={allCurrentPageSelected}
                      className="h-4 w-4 rounded-md border-slate-300 accent-indigo-600"
                      disabled={isLoading || applications.length === 0}
                      onChange={toggleCurrentPageSelection}
                      type="checkbox"
                    />
                  </th>
                  {tableHeaders.map((header) => (
                    <th
                      className={`px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${header.className}`}
                      key={header.label}
                    >
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td className="py-14 text-center text-sm text-slate-400" colSpan="8">
                      <div className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin-smooth" />
                        Loading candidates...
                      </div>
                    </td>
                  </tr>
                ) : applications.length ? applications.map((application) => (
                  <tr
                    className="group cursor-pointer transition-colors duration-150 hover:bg-indigo-50/30"
                    key={application.id}
                  >
                    <td className="px-4 py-4">
                      <input
                        aria-label={`Select ${application.candidateName}`}
                        checked={selectedIds.has(application.id)}
                        className="h-4 w-4 rounded-md border-slate-300 accent-indigo-600"
                        disabled={isBulkSubmitting}
                        onChange={() => toggleApplicationSelection(application.id)}
                        type="checkbox"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <CandidateInitials name={application.candidateName} />
                        <span className="truncate text-sm font-bold text-slate-900" title={application.candidateName}>
                          {application.candidateName}
                        </span>
                      </div>
                    </td>
                    <td className="truncate px-4 py-4 text-sm text-slate-500" title={application.candidateEmail}>
                      {application.candidateEmail}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {application.jobOpening ? (
                        <Link
                          className="block truncate font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                          title={application.jobOpening.title}
                          to={`/jobs/${application.jobOpening.id}`}
                        >
                          {application.jobOpening.title}
                        </Link>
                      ) : (
                        <span className="text-slate-400">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {application.source
                        ? <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{application.source}</span>
                        : <span className="text-sm text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-4"><StageBadge stage={application.stage} /></td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">{formatDate(application.appliedAt)}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">{formatDate(application.updatedAt)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td className="py-16 text-center" colSpan="8">
                      <p className="text-sm font-semibold text-slate-800">
                        {hasFilters ? 'No candidates match these filters.' : 'No applications yet.'}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {hasFilters
                          ? 'Clear or adjust the search criteria to broaden the list.'
                          : 'Applications will appear here after candidates are added to job openings.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-800">{showingStart}–{showingEnd}</span> of{' '}
            <span className="font-semibold text-slate-800">{pagination.total}</span>
          </p>
          <div className="flex gap-2">
            <button
              className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isLoading || pagination.page <= 1}
              onClick={() => goToPage(pagination.page - 1)}
              type="button"
            >
              ← Previous
            </button>
            <span className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">
              {pagination.page} / {Math.max(pagination.pages, 1)}
            </span>
            <button
              className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isLoading || pagination.page >= pagination.pages}
              onClick={() => goToPage(pagination.page + 1)}
              type="button"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidatesPage;
