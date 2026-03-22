import { Link } from 'react-router-dom';
import { useGoals } from '../hooks/goals';
import Spinner from '../components/spinner';
import type { Goal } from '../types';

const motivationLabels: Record<string, string> = {
  career: 'Career',
  academic: 'Academic',
  curiosity: 'Curiosity',
  exam_prep: 'Exam Prep',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  completed: 'bg-blue-50 text-blue-700',
  archived: 'bg-gray-100 text-gray-500',
};

function GoalCard({ goal }: { goal: Goal }) {
  const date = new Date(goal.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link
      to={`/goals/${goal.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-base font-semibold text-gray-900">{goal.topic}</h3>
        <span className={`ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[goal.status] || statusColors.active}`}>
          {goal.status}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {motivationLabels[goal.motivation] || goal.motivation}
        </span>
        <span>{date}</span>
      </div>

      {goal.priorKnowledge && (
        <p className="mt-3 line-clamp-2 text-sm text-gray-500">
          {goal.priorKnowledge}
        </p>
      )}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <p className="text-lg font-medium text-gray-900">No learning goals yet</p>
      <p className="mt-1 text-sm text-gray-500">Create one to get started with your personalised curriculum.</p>
      <Link
        to="/goals/new"
        className="mt-6 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
      >
        Create your first goal
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useGoals();

  if (isLoading) return <Spinner />;

  if (isError) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-red-600">Failed to load your learning goals. Please try again.</p>
      </div>
    );
  }

  const goals = data?.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Your learning goals</h1>
        {goals.length > 0 && (
          <Link
            to="/goals/new"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            New goal
          </Link>
        )}
      </div>

      {goals.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
