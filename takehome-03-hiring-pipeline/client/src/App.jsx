import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const AUTH_TOKEN_KEY = 'hiringPipelineToken';
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const navigationItems = [
  { label: 'Dashboard', icon: DashboardIcon, isActive: true },
  { label: 'Job Openings', icon: BriefcaseIcon },
  { label: 'Candidates', icon: UsersIcon },
  { label: 'Alerts', icon: BellIcon },
];

function getDisplayName(user) {
  if (user?.name) {
    return user.name;
  }

  if (!user?.email) {
    return 'User';
  }

  return user.email
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

function LogoMark() {
  return (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-slate-300 bg-white shadow-sm">
      <span className="h-4 w-4 rounded-[3px] bg-cyan-700" />
    </div>
  );
}

function IconFrame({ children }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
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

function UserAvatar({ name }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-900 text-xs font-semibold text-white">
      {initials}
    </div>
  );
}

function SidebarNavItem({ item }) {
  const Icon = item.icon;
  const activeClasses = item.isActive
    ? 'border-cyan-700/20 bg-cyan-50 text-cyan-900'
    : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950';

  return (
    <a
      aria-current={item.isActive ? 'page' : undefined}
      className={`flex h-10 shrink-0 items-center gap-3 rounded-md border px-3 text-sm font-medium transition ${activeClasses}`}
      href="#"
    >
      <Icon />
      <span>{item.label}</span>
    </a>
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
    if (!submitted) {
      return '';
    }

    if (!email.trim()) {
      return 'Work email is required.';
    }

    if (!emailPattern.test(email.trim())) {
      return 'Enter a valid work email.';
    }

    return '';
  }, [email, submitted]);

  const passwordError = submitted && !password ? 'Password is required.' : '';

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    setAuthError('');

    if (!email.trim() || !emailPattern.test(email.trim()) || !password) {
      return;
    }

    setIsLoading(true);

    try {
      const data = await requestJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      window.localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      onLogin(data.user);
      navigate('/', { replace: true });
    } catch (error) {
      setAuthError(error.message || 'Unable to sign in.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-slate-200/80 pb-5">
          <div className="flex items-center gap-3">
            <LogoMark />
            <span className="text-sm font-semibold tracking-normal text-slate-900">
              Hiring Pipeline
            </span>
          </div>
          <span className="hidden text-sm text-slate-500 sm:block">Internal recruiting workspace</span>
        </header>

        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16">
          <div className="max-w-2xl border-l border-slate-300 pl-6">
            <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-5xl">
              Hiring Pipeline
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              Sign in to manage your recruiting workflow.
            </p>
            <p className="mt-8 text-sm font-medium text-slate-500">Recruiter and interviewer access</p>
          </div>

          <form
            className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            noValidate
            onSubmit={handleSubmit}
          >
            <div className="mb-8">
              <div className="mb-5 grid h-10 w-10 place-items-center rounded-md bg-cyan-700 text-sm font-semibold text-white">
                HP
              </div>
              <h2 className="text-xl font-semibold tracking-normal text-slate-950">Sign in</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use your company credentials to continue.
              </p>
            </div>

            {authError ? (
              <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {authError}
              </div>
            ) : null}

            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="email">
                  Work email
                </label>
                <input
                  aria-describedby={emailError ? 'email-error' : undefined}
                  aria-invalid={Boolean(emailError)}
                  autoComplete="email"
                  className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
                  id="email"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                />
                {emailError ? (
                  <p className="mt-2 text-sm text-red-600" id="email-error">
                    {emailError}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="password">
                  Password
                </label>
                <div className="relative mt-2">
                  <input
                    aria-describedby={passwordError ? 'password-error' : undefined}
                    aria-invalid={Boolean(passwordError)}
                    autoComplete="current-password"
                    className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 pr-14 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
                    id="password"
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-cyan-700/10"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    <EyeIcon isVisible={showPassword} />
                  </button>
                </div>
                {passwordError ? (
                  <p className="mt-2 text-sm text-red-600" id="password-error">
                    {passwordError}
                  </p>
                ) : null}
              </div>
            </div>

            <button
              className="mt-7 flex h-11 w-full items-center justify-center rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-700/20 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function ProtectedRoute({ authStatus, user, children }) {
  if (authStatus === 'checking') {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">
        <div className="flex items-center gap-3 text-sm font-medium">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-700/20 border-t-cyan-700" />
          Loading workspace...
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return children;
}

function AppLayout({ user, onLogout }) {
  const displayName = getDisplayName(user);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="flex border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r">
          <div className="flex w-full flex-col">
            <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
              <LogoMark />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">Hiring Pipeline</p>
                <p className="truncate text-xs text-slate-500">Internal recruiting</p>
              </div>
            </div>

            <nav className="flex gap-2 overflow-x-auto px-4 py-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-4 lg:py-5">
              {navigationItems.map((item) => (
                <SidebarNavItem item={item} key={item.label} />
              ))}
            </nav>

            <div className="hidden border-t border-slate-200 p-4 lg:block">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <UserAvatar name={displayName} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">{displayName}</p>
                    <p className="truncate text-xs font-medium text-cyan-800">{user.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-16 flex-col gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Dashboard</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
                Recruiting workspace
              </h1>
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="flex items-center gap-3">
                <UserAvatar name={displayName} />
                <div className="min-w-0 text-left sm:text-right">
                  <p className="truncate text-sm font-semibold text-slate-950">{displayName}</p>
                  <p className="truncate text-xs font-medium text-slate-500">{user.role}</p>
                </div>
              </div>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-cyan-700/10"
                onClick={onLogout}
                type="button"
              >
                <LogoutIcon />
                <span>Logout</span>
              </button>
            </div>
          </header>

          <div className="flex flex-1 items-center justify-center px-5 py-12 lg:px-8">
            <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-md bg-cyan-50 text-cyan-800">
                <DashboardIcon />
              </div>
              <p className="text-lg font-semibold text-slate-950">
                Your recruiting workspace is ready.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function App() {
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState('checking');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      setAuthStatus('signed-out');
      return;
    }

    async function loadCurrentUser() {
      try {
        const data = await requestJson('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(data.user);
        setAuthStatus('signed-in');
      } catch (error) {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
        setAuthStatus('signed-out');
        navigate('/login', { replace: true });
      }
    }

    loadCurrentUser();
  }, [navigate]);

  function handleLogin(nextUser) {
    setUser(nextUser);
    setAuthStatus('signed-in');
  }

  function handleLogout() {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setAuthStatus('signed-out');
    navigate('/login', { replace: true });
  }

  return (
    <Routes>
      <Route
        element={user ? <Navigate replace to="/" /> : <LoginPage onLogin={handleLogin} />}
        path="/login"
      />
      <Route
        element={(
          <ProtectedRoute authStatus={authStatus} user={user}>
            <AppLayout onLogout={handleLogout} user={user} />
          </ProtectedRoute>
        )}
        path="/"
      />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}

export default App;
