import { Navigate } from 'react-router-dom';
import { useIsAuthenticated } from '../hooks/auth';
import Spinner from './spinner';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useIsAuthenticated();

  if (isLoading) return <Spinner />;

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}
