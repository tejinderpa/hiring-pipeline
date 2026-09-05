import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';

import AlertsPage from './pages/AlertsPage.jsx';
import CandidatesPage from './pages/CandidatesPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import InterviewerDashboardPage from './pages/InterviewerDashboardPage.jsx';
import JobDetailPage from './pages/JobDetailPage.jsx';
import JobOpeningsPage from './pages/JobOpeningsPage.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const AUTH_TOKEN_KEY = 'hiringPipelineToken';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const navigationItems = [
  { label: 'Dashboard', icon: DashboardIcon, path: '/', roles: ['RECRUITER'] },
  { label: 'My Interviews', icon: CalendarIcon, path: '/interviews', roles: ['INTERVIEWER'] },
  { label: 'Job Openings', icon: BriefcaseIcon, path: '/jobs', roles: ['RECRUITER'] },
  { label: 'Candidates', icon: UsersIcon, path: '/candidates', roles: ['RECRUITER'] },
  { label: 'Alerts', icon: BellIcon, path: '/alerts', roles: ['RECRUITER'] },
];

function getHomePathForUser(user) {
  return user?.role === 'INTERVIEWER' ? '/interviews' : '/';
}

function getDisplayName(user) {
  if (user?.name) return user.name;
  if (!user?.email) return 'User';
  return user.email
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function requestJson(path, options = {}) {
  const { headers, ...fetchOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function IconFrame({ children, className = 'h-[18px] w-[18px]' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

function DashboardIcon() {
  return (
    <IconFrame>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v5A1.5 1.5 0 0 1 9.5 12h-4A1.5 1.5 0 0 1 4 10.5v-5Z" />
      <path d="M13 5.5A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v2A1.5 1.5 0 0 1 18.5 9h-4A1.5 1.5 0 0 1 13 7.5v-2Z" />
      <path d="M13 13.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5v-5Z" />
      <path d="M4 16.5A1.5 1.5 0 0 1 5.5 15h4a1.5 1.5 0 0 1 1.5 1.5v2A1.5 1.5 0 0 1 9.5 20h-4A1.5 1.5 0 0 1 4 18.5v-2Z" />
    </IconFrame>
  );
}

function BriefcaseIcon() {
  return (
    <IconFrame>
      <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" />
      <path d="M5.5 7h13A1.5 1.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9A1.5 1.5 0 0 1 5.5 7Z" />
      <path d="M4 12h16" />
      <path d="M10 12v1h4v-1" />
    </IconFrame>
  );
}

function UsersIcon() {
  return (
    <IconFrame>
      <path d="M16 19a4 4 0 0 0-8 0" />
      <path d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M20 18a3.3 3.3 0 0 0-3-3.2" />
      <path d="M17 5.2a2.6 2.6 0 0 1 0 5.1" />
      <path d="M4 18a3.3 3.3 0 0 1 3-3.2" />
      <path d="M7 5.2a2.6 2.6 0 0 0 0 5.1" />
    </IconFrame>
  );
}

function BellIcon() {
  return (
    <IconFrame>
      <path d="M18 9.8A6 6 0 0 0 6 9.8c0 7-3 6.7-3 8.2h18c0-1.5-3-.9-3-8.2Z" />
      <path d="M10 20a2.2 2.2 0 0 0 4 0" />
    </IconFrame>
  );
}

function CalendarIcon() {
  return (
    <IconFrame>
      <path d="M8 2v3M16 2v3M3.5 9h17M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 19.5v-13Z" />
    </IconFrame>
  );
}

function LogoutIcon() {
  return (
    <IconFrame>
      <path d="M10 6H6.8A1.8 1.8 0 0 0 5 7.8v8.4A1.8 1.8 0 0 0 6.8 18H10" />
      <path d="M14 8l4 4-4 4" />
      <path d="M9 12h9" />
    </IconFrame>
  );
}

function EyeIcon({ isVisible }) {
  if (isVisible) {
    return (
      <IconFrame>
        <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 4.2 9.7 6a2.5 2.5 0 0 1 0 2.8 17.8 17.8 0 0 1-2.3 2.7M6.2 6.3A17.6 17.6 0 0 0 2.3 10a2.5 2.5 0 0 0 0 2.8c1.2 1.8 4.7 6 9.7 6 1 0 2-.2 2.9-.5" />
      </IconFrame>
    );
  }
  return (
    <IconFrame>
      <path d="M2.3 10.6a2.5 2.5 0 0 0 0 2.8c1.2 1.8 4.7 6 9.7 6s8.5-4.2 9.7-6a2.5 2.5 0 0 0 0-2.8c-1.2-1.8-4.7-6-9.7-6s-8.5 4.2-9.7 6Z" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </IconFrame>
  );
}

function SearchIcon() {
  return (
    <IconFrame className="h-4 w-4">
      <path d="m21 21-4.3-4.3" />
      <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
    </IconFrame>
  );
}

function LogoMark() {
  return (
    <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white shadow-sm shadow-[#6c5ce7]/20 ring-1 ring-slate-200">
      <img alt="" className="h-6 w-6 object-contain" src="/app-icon.png" />
    </div>
  );
}

function UserAvatar({ name, size = 'md' }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizeClass = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs';

  return (
    <div className={`grid shrink-0 place-items-center rounded-full bg-[#6c5ce7] font-semibold text-white shadow-sm ${sizeClass}`}>
      {initials}
    </div>
  );
}

function SidebarNavItem({ alertCount, item }) {
  const Icon = item.icon;

  return (
    <NavLink
      className={({ isActive }) => {
        const base = 'relative flex h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all duration-200';
        if (isActive) return `${base} bg-[#f0edff] text-[#5a49d6] shadow-sm`;
        return `${base} text-slate-500 hover:bg-slate-100 hover:text-slate-900`;
      }}
      end={item.path === '/'}
      to={item.path}
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[#6c5ce7]" />
          ) : null}
          <span className={`transition-colors duration-200 ${isActive ? 'text-[#6c5ce7]' : ''}`}>
            <Icon />
          </span>
          <span>{item.label}</span>
          {item.path === '/alerts' && alertCount > 0 ? (
            <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[#ff6b6b] px-1.5 py-0.5 text-[11px] font-semibold text-white">
              {alertCount}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  );
}

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const emailError = useMemo(() => {
    if (!submitted) return '';
    if (!email.trim()) return 'Work email is required.';
    if (!emailPattern.test(email.trim())) return 'Enter a valid work email.';
    return '';
  }, [email, submitted]);

  const passwordError = submitted && !password ? 'Password is required.' : '';

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    setAuthError('');
    if (!email.trim() || !emailPattern.test(email.trim()) || !password) return;
    setIsLoading(true);
    try {
      const data = await requestJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      window.localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      onLogin(data.user, data.token);
      navigate(getHomePathForUser(data.user), { replace: true });
    } catch (error) {
      setAuthError(error.message || 'Unable to sign in.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f5ff] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            linear-gradient(rgba(108, 92, 231, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(108, 92, 231, 0.08) 1px, transparent 1px),
            radial-gradient(circle at 18% 20%, rgba(32, 201, 151, 0.14), transparent 28%),
            radial-gradient(circle at 82% 14%, rgba(255, 176, 32, 0.13), transparent 26%),
            radial-gradient(circle at 78% 86%, rgba(108, 92, 231, 0.15), transparent 30%)
          `,
          backgroundSize: '42px 42px, 42px 42px, auto, auto, auto',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: 'radial-gradient(circle, #1e293b 0.7px, transparent 0.7px)',
          backgroundSize: '18px 18px',
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-7xl overflow-hidden rounded-[28px] border border-white/90 bg-white/75 shadow-2xl shadow-[#6c5ce7]/10 backdrop-blur-xl">
        <section className="hidden flex-1 bg-white/35 p-5 lg:block">
          <div className="relative h-full overflow-hidden rounded-2xl border border-white bg-[#ebe7ff] shadow-sm ring-1 ring-slate-900/5">
            <img
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              onError={(event) => { event.currentTarget.style.display = 'none'; }}
              src="/login-cover.jpg"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/78 via-white/18 to-slate-950/58" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-white/35" />

            <div className="relative flex h-full flex-col justify-between p-8 xl:p-10">
              <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-lg shadow-slate-900/10 backdrop-blur-md">
                <LogoMark />
                <div>
                  <p className="text-lg font-extrabold leading-none tracking-tight text-slate-950">TalentFlow</p>
                  <p className="mt-1 text-[12px] font-semibold text-[#6c5ce7]">Recruiting workspace</p>
                </div>
              </div>

              <div className="max-w-xl">
                <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-[#20c997]" />
                  Interview and recruiter access
                </div>
                <h2 className="text-5xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm">
                  Manage hiring work from one focused place.
                </h2>
                <p className="mt-4 max-w-md text-base font-medium leading-7 text-white/90 drop-shadow-sm">
                  Review candidates, track interviews, and keep every next step visible.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex w-full items-center justify-center bg-white/80 p-6 sm:p-10 lg:w-[450px]">
          <div className="w-full max-w-sm animate-slide-up rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-7 lg:border-0 lg:shadow-none">
            <div className="mb-9 flex items-center gap-3">
              <LogoMark />
              <div>
                <p className="text-sm font-bold text-slate-950">TalentFlow</p>
                <p className="text-xs text-slate-500">Internal recruiting</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6c5ce7]">Welcome back</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Sign in</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Open your recruiting board and keep every candidate moving.
              </p>
            </div>

            {authError ? (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {authError}
              </div>
            ) : null}

            <form noValidate onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="email">
                    Work email
                  </label>
                  <input
                    aria-describedby={emailError ? 'email-error' : undefined}
                    aria-invalid={Boolean(emailError)}
                    autoComplete="email"
                    className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                      emailError
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-slate-200 focus:border-[#6c5ce7] focus:ring-[#6c5ce7]/10'
                    }`}
                    id="email"
                    name="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    type="email"
                    value={email}
                  />
                  {emailError ? (
                    <p className="mt-1.5 text-xs text-red-600" id="email-error">{emailError}</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      aria-describedby={passwordError ? 'password-error' : undefined}
                      aria-invalid={Boolean(passwordError)}
                      autoComplete="current-password"
                      className={`h-11 w-full rounded-lg border bg-white px-4 pr-12 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                        passwordError
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : 'border-slate-200 focus:border-[#6c5ce7] focus:ring-[#6c5ce7]/10'
                      }`}
                      id="password"
                      name="password"
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                    />
                    <button
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      onClick={() => setShowPassword((c) => !c)}
                      type="button"
                    >
                      <EyeIcon isVisible={showPassword} />
                    </button>
                  </div>
                  {passwordError ? (
                    <p className="mt-1.5 text-xs text-red-600" id="password-error">{passwordError}</p>
                  ) : null}
                </div>
              </div>

              <button
                className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#6c5ce7] px-4 text-sm font-bold text-white shadow-lg shadow-[#6c5ce7]/20 transition hover:-translate-y-px hover:bg-[#5a49d6] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin-smooth" />
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">Recruiter and interviewer access</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProtectedRoute({ authStatus, user, children }) {
  if (authStatus === 'checking') {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f5ff]">
        <div className="flex flex-col items-center gap-4">
          <LogoMark />
          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-500">
            <span className="h-4 w-4 rounded-full border-2 border-[#6c5ce7]/20 border-t-[#6c5ce7] animate-spin-smooth" />
            Loading workspace...
          </div>
        </div>
      </main>
    );
  }
  if (!user) return <Navigate replace to="/login" />;
  return children;
}

function PlaceholderPage({ icon: Icon, title }) {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-12 lg:px-8">
      <div className="w-full max-w-sm rounded-lg border border-slate-200/80 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-lg bg-[#f0edff] text-[#6c5ce7]">
          <Icon />
        </div>
        <p className="text-base font-semibold text-slate-800">{title}</p>
      </div>
    </div>
  );
}

function RecruiterOnlyRoute({ icon = BriefcaseIcon, title = 'You do not have access to job openings.', user, children }) {
  if (user.role !== 'RECRUITER') return <PlaceholderPage icon={icon} title={title} />;
  return children;
}

function InterviewerOnlyRoute({ icon = UsersIcon, title = 'You do not have access to interviews.', user, children }) {
  if (user.role !== 'INTERVIEWER') return <PlaceholderPage icon={icon} title={title} />;
  return children;
}

function AppLayout({ alertCount, user, onLogout }) {
  const displayName = getDisplayName(user);
  const visibleNavigationItems = navigationItems.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  return (
    <div className="flex min-h-screen bg-[#f7f5ff] text-slate-950">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white lg:flex xl:w-72">
        <div className="flex h-20 shrink-0 items-center gap-3 px-5">
          <LogoMark />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950">TalentFlow</p>
            <p className="truncate text-xs text-slate-500">Internal recruiting</p>
          </div>
        </div>

        <div className="px-4">
          <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-400">
            <SearchIcon />
            Search
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Menu
          </p>
          <div className="flex flex-col gap-1">
            {visibleNavigationItems.map((item) => (
              <SidebarNavItem alertCount={alertCount} item={item} key={item.label} />
            ))}
          </div>
        </nav>

        <div className="shrink-0 border-t border-slate-200/70 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-[#f8f7fc] p-3">
            <UserAvatar name={displayName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-950">{displayName}</p>
              <p className="truncate text-[11px] font-semibold text-[#6c5ce7]">{user.role}</p>
            </div>
            <button
              aria-label="Logout"
              className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-white hover:text-slate-700"
              onClick={onLogout}
              title="Logout"
              type="button"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5 lg:hidden">
          <div className="flex items-center gap-3">
            <LogoMark />
            <span className="text-sm font-bold text-slate-950">TalentFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <UserAvatar name={displayName} size="sm" />
            <button
              className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
              onClick={onLogout}
              title="Logout"
              type="button"
            >
              <LogoutIcon />
            </button>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          {visibleNavigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#f0edff] text-[#5a49d6]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
                end={item.path === '/'}
                key={item.label}
                to={item.path}
              >
                <Icon />
                <span>{item.label}</span>
                {item.path === '/alerts' && alertCount > 0 ? (
                  <span className="ml-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-[#ff6b6b] px-1 text-[10px] font-semibold text-white">
                    {alertCount}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState('checking');
  const [stalledAlertCount, setStalledAlertCount] = useState(0);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => window.localStorage.getItem(AUTH_TOKEN_KEY) || '');

  const refreshStalledAlertCount = useCallback(async () => {
    const currentToken = token || window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!currentToken) {
      setStalledAlertCount(0);
      return;
    }
    const data = await requestJson('/api/alerts/stalled', {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    setStalledAlertCount(data.count ?? 0);
  }, [token]);

  useEffect(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setAuthStatus('signed-out');
      return;
    }

    async function loadCurrentUser() {
      try {
        const data = await requestJson('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setToken(token);
        setUser(data.user);
        setAuthStatus('signed-in');
      } catch {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken('');
        setUser(null);
        setAuthStatus('signed-out');
        navigate('/login', { replace: true });
      }
    }
    loadCurrentUser();
  }, [navigate]);

  useEffect(() => {
    if (user?.role !== 'RECRUITER') {
      setStalledAlertCount(0);
      return;
    }
    refreshStalledAlertCount().catch(() => setStalledAlertCount(0));
  }, [refreshStalledAlertCount, user]);

  function handleLogin(nextUser, nextToken) {
    setToken(nextToken || window.localStorage.getItem(AUTH_TOKEN_KEY) || '');
    setUser(nextUser);
    setAuthStatus('signed-in');
  }

  function handleLogout() {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken('');
    setStalledAlertCount(0);
    setUser(null);
    setAuthStatus('signed-out');
    navigate('/login', { replace: true });
  }

  return (
    <Routes>
      <Route
        element={user ? <Navigate replace to={getHomePathForUser(user)} /> : <LoginPage onLogin={handleLogin} />}
        path="/login"
      />
      <Route
        element={
          <ProtectedRoute authStatus={authStatus} user={user}>
            <AppLayout alertCount={stalledAlertCount} onLogout={handleLogout} user={user} />
          </ProtectedRoute>
        }
        path="/"
      >
        <Route
          index
          element={
            <RecruiterOnlyRoute icon={DashboardIcon} title="You do not have access to the dashboard." user={user}>
              <DashboardPage requestJson={requestJson} token={token} />
            </RecruiterOnlyRoute>
          }
        />
        <Route
          path="jobs"
          element={
            <RecruiterOnlyRoute user={user}>
              <JobOpeningsPage requestJson={requestJson} token={token} />
            </RecruiterOnlyRoute>
          }
        />
        <Route
          path="jobs/:id"
          element={
            <RecruiterOnlyRoute user={user}>
              <JobDetailPage requestJson={requestJson} token={token} />
            </RecruiterOnlyRoute>
          }
        />
        <Route
          path="candidates"
          element={
            <RecruiterOnlyRoute icon={UsersIcon} title="You do not have access to candidates." user={user}>
              <CandidatesPage requestJson={requestJson} token={token} />
            </RecruiterOnlyRoute>
          }
        />
        <Route
          path="alerts"
          element={
            <RecruiterOnlyRoute icon={BellIcon} title="You do not have access to alerts." user={user}>
              <AlertsPage onAlertsChanged={setStalledAlertCount} requestJson={requestJson} token={token} />
            </RecruiterOnlyRoute>
          }
        />
        <Route
          path="interviews"
          element={
            <InterviewerOnlyRoute icon={CalendarIcon} title="You do not have access to interviews." user={user}>
              <InterviewerDashboardPage requestJson={requestJson} token={token} />
            </InterviewerOnlyRoute>
          }
        />
      </Route>
      <Route element={<Navigate replace to={getHomePathForUser(user)} />} path="*" />
    </Routes>
  );
}

export default App;
