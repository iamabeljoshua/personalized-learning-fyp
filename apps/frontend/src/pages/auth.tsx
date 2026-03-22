import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLogin, useRegister } from '../hooks/auth';
import { getErrorMessage } from '../utils/get-error-message';
import Input from '../components/input';

type Tab = 'login' | 'register';

const tabs: { value: Tab; label: string }[] = [
  { value: 'login', label: 'Log in' },
  { value: 'register', label: 'Create account' },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const { mutateAsync: login, isPending: isLoggingIn } = useLogin();
  const { mutateAsync: register, isPending: isRegistering } = useRegister();

  const isPending = isLoggingIn || isRegistering;

  const switchTab = (next: Tab) => {
    setTab(next);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (tab === 'register' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const data = tab === 'login'
        ? await login({ email, password })
        : await register({ email, password });

      toast.success(tab === 'login' ? 'Welcome back' : 'Account created');
      navigate(data.user.isOnboarded ? '/' : '/onboard');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-semibold text-gray-900">
          Agentic Tutor
        </h1>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-6 flex border-b border-gray-200">
            {tabs.map((t) => (
              <button
                key={t.value}
                onClick={() => switchTab(t.value)}
                className={`flex-1 pb-3 text-sm font-medium ${
                  tab === t.value
                    ? 'border-b-2 border-gray-900 text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
            />

            {tab === 'register' && (
              <Input
                label="Confirm password"
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
              />
            )}

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isPending ? '...' : tab === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
