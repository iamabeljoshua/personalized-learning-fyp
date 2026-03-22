import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/layout';
import ProtectedRoute from './components/protected-route';
import AuthPage from './pages/auth';
import OnboardPage from './pages/onboard';
import DashboardPage from './pages/dashboard';
import NewGoalPage from './pages/new-goal';
import GoalPage from './pages/goal';
import LearnPage from './pages/learn';
import QuizPage from './pages/quiz';
import ProgressPage from './pages/progress';

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/onboard',
    element: (
      <ProtectedRoute>
        <OnboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'goals/new', element: <NewGoalPage /> },
      { path: 'goals/:goalId', element: <GoalPage /> },
      { path: 'goals/:goalId/progress', element: <ProgressPage /> },
      { path: 'learn/:nodeId', element: <LearnPage /> },
      { path: 'quiz/:nodeId', element: <QuizPage /> },
    ],
  },
]);

export default router;
