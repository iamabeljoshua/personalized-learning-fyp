import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGoal, useOutline, useDeleteGoal } from '../hooks/goals';
import Spinner from '../components/spinner';
import ConfirmModal from '../components/confirm-modal';
import type { OutlineNode } from '../types';

const motivationLabels: Record<string, string> = {
  career: 'Career',
  academic: 'Academic',
  curiosity: 'Curiosity',
  exam_prep: 'Exam Prep',
};

const typeLabels: Record<string, string> = {
  concept: 'Concept',
  example: 'Example',
  exercise: 'Exercise',
  introduction: 'Intro',
  summary: 'Summary',
  review: 'Review',
};

function NodeRow({ node, index }: { node: OutlineNode; index: number }) {
  const typeLabel = typeLabels[node.type] || node.type;

  return (
    <Link
      to={`/learn/${node.id}`}
      className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{node.title}</p>
        <span className="mt-0.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
          {typeLabel}
        </span>
      </div>

      <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default function GoalPage() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { data: goal, isLoading: goalLoading, isError: goalError } = useGoal(goalId!);
  const { data: outline, isLoading: outlineLoading } = useOutline(goalId!);
  const { mutateAsync: deleteGoal, isPending: isDeleting } = useDeleteGoal();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (goalLoading || outlineLoading) return <Spinner />;

  if (goalError || !goal) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-red-600">Could not load this learning goal.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-gray-500 hover:text-gray-700">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const nodes = outline?.nodes ?? [];

  return (
    <div>
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
        &larr; Back to dashboard
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">{goal.topic}</h1>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {motivationLabels[goal.motivation] || goal.motivation}
          </span>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete learning goal?"
          message={`This will permanently delete "${goal.topic}" and all its content, quizzes, and progress. This cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          isLoading={isDeleting}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            try {
              await deleteGoal(goalId!);
              toast.success('Learning goal deleted');
              navigate('/');
            } catch {
              toast.error('Failed to delete goal');
              setShowDeleteConfirm(false);
            }
          }}
        />
      )}

      {goal.priorKnowledge && (
        <p className="mt-2 text-sm text-gray-500">{goal.priorKnowledge}</p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {nodes.length} {nodes.length === 1 ? 'lesson' : 'lessons'} in this curriculum
        </span>
        {nodes.length > 0 && (
          <Link
            to={`/goals/${goalId}/progress`}
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            View Progress
          </Link>
        )}
      </div>

      {nodes.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">Your curriculum is being generated. This may take a moment.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {nodes.map((node, i) => (
            <NodeRow key={node.id} node={node} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
