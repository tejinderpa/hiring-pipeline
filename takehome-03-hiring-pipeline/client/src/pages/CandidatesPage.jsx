import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const stages = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
const sortOptions = [
  { label: 'Last Updated', value: 'updatedAt' },
  { label: 'Applied Date', value: 'appliedAt' },
  { label: 'Stage', value: 'stage' },
];
const limit = 20;

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

function StageBadge({ stage }) {
  return (
    <span className="inline-flex h-7 items-center rounded-md border border-cyan-200 bg-cyan-50 px-2 text-xs font-semibold text-cyan-800">
      {stage}
    </span>
  );
}

function getSearchParam(searchParams, key, fallback = '') {
  return searchParams.get(key) || fallback;
}

function parsePage(searchParams) {
  const value = Number(searchParams.get('page') || '1');

  if (!Number.isInteger(value) || value < 1) {
    return 1;
  }

  return value;
}

function buildApplicationsQuery(params) {
  const apiParams = new URLSearchParams();

  if (params.search) {
    apiParams.set('search', params.search);
  }

  if (params.jobId) {
    apiParams.set('jobId', params.jobId);
  }

  if (params.stage) {
    apiParams.set('stage', params.stage);
  }

  if (params.source) {
    apiParams.set('source', params.source);
  }

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

function CandidatesPage({ requestJson, token }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    pages: 0,
  });
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

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  const queryState = useMemo(() => ({
    search: getSearchParam(searchParams, 'search'),
    jobId: getSearchParam(searchParams, 'jobId'),
    stage: getSearchParam(searchParams, 'stage'),
    source: getSearchParam(searchParams, 'source'),
    sort: getSearchParam(searchParams, 'sort', 'updatedAt'),
    order: getSearchParam(searchParams, 'order', 'desc'),
    page: parsePage(searchParams),
  }), [searchParams]);

  const hasFilters = Boolean(
    queryState.search
      || queryState.jobId
      || queryState.stage
      || queryState.source,
  );

  const showingStart = pagination.total === 0
    ? 0
    : ((pagination.page - 1) * pagination.limit) + 1;
  const showingEnd = Math.min(pagination.page * pagination.limit, pagination.total);
  const selectedCount = selectedIds.size;
  const allCurrentPageSelected = applications.length > 0
    && applications.every((application) => selectedIds.has(application.id));
  const applicationNamesById = useMemo(() => {
    const namesById = new Map();

    applications.forEach((application) => {
      namesById.set(application.id, application.candidateName);
    });

    return namesById;
  }, [applications]);

  useEffect(() => {
    setSearchInput(queryState.search);
  }, [queryState.search]);

  useEffect(() => {
    setSourceInput(queryState.source);
  }, [queryState.source]);

  useEffect(() => {
    setSelectedIds(new Set());
    setBulkResult(null);
  }, [queryState]);

  useEffect(() => {
    let isCurrent = true;

    async function loadJobs() {
      setIsLoadingJobs(true);
      setJobsError('');

      try {
        const data = await requestJson('/api/jobs?archived=all', {
          headers: authHeaders,
        });

        if (isCurrent) {
          setJobs(data.jobs || []);
        }
      } catch (requestError) {
        if (isCurrent) {
          setJobsError(requestError.message || 'Unable to load job openings.');
        }
      } finally {
        if (isCurrent) {
          setIsLoadingJobs(false);
        }
      }
    }

    loadJobs();

    return () => {
      isCurrent = false;
    };
  }, [authHeaders, requestJson]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSearch = searchInput.trim();

      if (nextSearch === queryState.search) {
        return;
      }

      setSearchParams((current) => {
        const next = new URLSearchParams(current);

        if (nextSearch) {
          next.set('search', nextSearch);
        } else {
          next.delete('search');
        }

        next.set('page', '1');
        return next;
      });
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [queryState.search, searchInput, setSearchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSource = sourceInput.trim();

      if (nextSource === queryState.source) {
        return;
      }

      setSearchParams((current) => {
        const next = new URLSearchParams(current);

        if (nextSource) {
          next.set('source', nextSource);
        } else {
          next.delete('source');
        }

        next.set('page', '1');
        return next;
      });
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [queryState.source, setSearchParams, sourceInput]);

  useEffect(() => {
    let isCurrent = true;

    async function loadApplications() {
      setIsLoading(true);
      setError('');

      try {
        const query = buildApplicationsQuery(queryState);
        const data = await requestJson(`/api/applications?${query}`, {
          headers: authHeaders,
        });

        if (isCurrent) {
          setApplications(data.data || []);
          setPagination(data.pagination || {
            page: queryState.page,
            limit,
            total: 0,
            pages: 0,
          });
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(requestError.message || 'Unable to load candidates.');
          setApplications([]);
          setPagination({
            page: queryState.page,
            limit,
            total: 0,
            pages: 0,
          });
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadApplications();

    return () => {
      isCurrent = false;
    };
  }, [authHeaders, queryState, requestJson]);

  async function refreshApplications() {
    const query = buildApplicationsQuery(queryState);
    const data = await requestJson(`/api/applications?${query}`, {
      headers: authHeaders,
    });

    setApplications(data.data || []);
    setPagination(data.pagination || {
      page: queryState.page,
      limit,
      total: 0,
      pages: 0,
    });
  }

  function updateQuery(updates) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
      });

      return next;
    });
  }

  function updateFilter(key, value) {
    updateQuery({
      [key]: value,
      page: '1',
    });
  }

  function updateSort(value) {
    updateQuery({
      sort: value,
      page: '1',
    });
  }

  function updateOrder(value) {
    updateQuery({
      order: value,
      page: '1',
    });
  }

  function clearFilters() {
    setSearchInput('');
    setSourceInput('');
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      next.delete('search');
      next.delete('jobId');
      next.delete('stage');
      next.delete('source');
      next.set('page', '1');

      return next;
    });
  }

  function goToPage(page) {
    updateQuery({ page: String(page) });
  }

  function toggleApplicationSelection(applicationId) {
    setBulkResult(null);
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(applicationId)) {
        next.delete(applicationId);
      } else {
        next.add(applicationId);
      }

      return next;
    });
  }

  function toggleCurrentPageSelection() {
    setBulkResult(null);
    setSelectedIds((current) => {
      if (applications.length === 0) {
        return current;
      }

      if (allCurrentPageSelected) {
        return new Set();
      }

      return new Set(applications.map((application) => application.id));
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function runBulkAction(action) {
    if (bulkRequestInFlightRef.current || selectedIds.size === 0) {
      return;
    }

    if (action === 'reject' && !window.confirm('Reject selected applications?')) {
      return;
    }

    bulkRequestInFlightRef.current = true;
    setIsBulkSubmitting(true);
    setError('');
    setBulkResult(null);

    try {
      const applicationIds = Array.from(selectedIds);
      const data = await requestJson(`/api/applications/bulk/${action}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ applicationIds }),
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
      setBulkResult({
        action,
        succeeded,
        failed: failures.length,
        failures,
      });
    } catch (requestError) {
      setError(requestError.message || `Unable to ${action} selected applications.`);
    } finally {
      bulkRequestInFlightRef.current = false;
      setIsBulkSubmitting(false);
    }
  }

  async function handleExportCsv() {
    if (exportRequestInFlightRef.current) {
      return;
    }

    exportRequestInFlightRef.current = true;
    setIsExporting(true);
    setExportError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/applications/export`, {
        headers: authHeaders,
      });

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
    <div className="flex flex-1 flex-col px-5 py-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Applications</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Candidates</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Search candidates across all job openings.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <button
            className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            disabled={isExporting}
            onClick={handleExportCsv}
            type="button"
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <p className="text-sm text-slate-500">
            Showing {showingStart}-{showingEnd} of {pagination.total}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,1.4fr)_repeat(5,minmax(150px,1fr))_auto] lg:items-end">
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="candidate-search">Search</label>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
              id="candidate-search"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Name or email"
              value={searchInput}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="candidate-job">Job Opening</label>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
              disabled={isLoadingJobs}
              id="candidate-job"
              onChange={(event) => updateFilter('jobId', event.target.value)}
              value={queryState.jobId}
            >
              <option value="">All jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="candidate-stage">Stage</label>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
              id="candidate-stage"
              onChange={(event) => updateFilter('stage', event.target.value)}
              value={queryState.stage}
            >
              <option value="">All stages</option>
              {stages.map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="candidate-source">Source</label>
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
              id="candidate-source"
              onChange={(event) => setSourceInput(event.target.value)}
              placeholder="Any source"
              value={sourceInput}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="candidate-sort">Sort By</label>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
              id="candidate-sort"
              onChange={(event) => updateSort(event.target.value)}
              value={queryState.sort}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="candidate-order">Order</label>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
              id="candidate-order"
              onChange={(event) => updateOrder(event.target.value)}
              value={queryState.order}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <button
            className="h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            disabled={!hasFilters}
            onClick={clearFilters}
            type="button"
          >
            Clear
          </button>
        </div>

        {jobsError ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {jobsError}
          </div>
        ) : null}
      </div>

      {exportError ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {exportError}
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {selectedCount > 0 ? (
        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-700">
            {selectedCount} {selectedCount === 1 ? 'candidate' : 'candidates'} selected on this page.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              disabled={isBulkSubmitting}
              onClick={clearSelection}
              type="button"
            >
              Clear Selection
            </button>
            <button
              className="h-10 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isBulkSubmitting}
              onClick={() => runBulkAction('advance')}
              type="button"
            >
              {isBulkSubmitting ? 'Working...' : 'Advance Selected'}
            </button>
            <button
              className="h-10 rounded-md bg-red-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isBulkSubmitting}
              onClick={() => runBulkAction('reject')}
              type="button"
            >
              {isBulkSubmitting ? 'Working...' : 'Reject Selected'}
            </button>
          </div>
        </div>
      ) : null}

      {bulkResult ? (
        <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-950">
            {bulkResult.succeeded} {bulkResult.succeeded === 1 ? 'application' : 'applications'} {bulkActionLabel}.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {bulkResult.failed} {bulkResult.failed === 1 ? 'application' : 'applications'} could not be {bulkActionLabel}.
          </p>
          {bulkResult.failures.length ? (
            <ul className="mt-3 space-y-2 border-t border-slate-200 pt-3">
              {bulkResult.failures.map((failure) => (
                <li className="text-sm text-slate-700" key={failure.applicationId}>
                  <span className="font-semibold text-slate-950">{failure.name}</span>
                  <span className="text-slate-500"> - {failure.reason}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    aria-label="Select all candidates"
                    checked={allCurrentPageSelected}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-700"
                    disabled={isLoading || applications.length === 0}
                    onChange={toggleCurrentPageSelection}
                    type="checkbox"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Candidate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Job Opening</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Applied Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan="8">Loading candidates...</td>
                </tr>
              ) : applications.length ? applications.map((application) => (
                <tr className="hover:bg-slate-50" key={application.id}>
                  <td className="px-4 py-4">
                    <input
                      aria-label={`Select ${application.candidateName}`}
                      checked={selectedIds.has(application.id)}
                      className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-700"
                      disabled={isBulkSubmitting}
                      onChange={() => toggleApplicationSelection(application.id)}
                      type="checkbox"
                    />
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-950">{application.candidateName}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{application.candidateEmail}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {application.jobOpening ? (
                      <Link
                        className="font-semibold text-cyan-800 hover:text-cyan-900"
                        to={`/jobs/${application.jobOpening.id}`}
                      >
                        {application.jobOpening.title}
                      </Link>
                    ) : (
                      'Not set'
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{application.source}</td>
                  <td className="px-4 py-4"><StageBadge stage={application.stage} /></td>
                  <td className="px-4 py-4 text-sm text-slate-700">{formatDate(application.appliedAt)}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{formatDate(application.updatedAt)}</td>
                </tr>
              )) : (
                <tr>
                  <td className="px-4 py-12 text-center" colSpan="8">
                    <p className="text-sm font-semibold text-slate-950">
                      {hasFilters ? 'No candidates match these filters.' : 'No applications yet.'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
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

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Showing {showingStart}-{showingEnd} of {pagination.total}
        </p>
        <div className="flex gap-2">
          <button
            className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            disabled={isLoading || pagination.page <= 1}
            onClick={() => goToPage(pagination.page - 1)}
            type="button"
          >
            Previous
          </button>
          <span className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
            Page {pagination.page} of {Math.max(pagination.pages, 1)}
          </span>
          <button
            className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            disabled={isLoading || pagination.page >= pagination.pages}
            onClick={() => goToPage(pagination.page + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default CandidatesPage;
