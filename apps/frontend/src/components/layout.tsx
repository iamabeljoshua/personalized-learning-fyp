import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useIsAuthenticated, useLogout } from '../hooks/auth';

const navItems = [
  { label: 'Dashboard', path: '/' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useIsAuthenticated();
  const { mutate: doLogout } = useLogout();

  const handleLogout = () => {
    doLogout(undefined, {
      onSuccess: () => navigate('/auth'),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="text-lg font-semibold text-gray-900">
            Agentic Tutor
          </Link>

          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm ${
                  location.pathname === item.path
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}

            <div className="flex items-center gap-4 border-l border-gray-200 pl-4">
              <span className="text-sm text-gray-500">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Log out
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
