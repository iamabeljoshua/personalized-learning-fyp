import { Link, useParams } from "react-router-dom";
import { useProgress } from "../hooks/goals";
import Spinner from "../components/spinner";
import type { NodeProgress } from "../types";

const typeLabels: Record<string, string> = {
  concept: "Concept",
  example: "Example",
  exercise: "Exercise",
  introduction: "Intro",
  summary: "Summary",
  review: "Review",
};

function MasteryIndicator({ pKnown }: { pKnown: number }) {
  const pct = Math.round(pKnown * 100);
  const color =
    pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
  const label =
    pct >= 70
      ? "Strong understanding"
      : pct >= 40
        ? "Developing"
        : "Needs review";

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-gray-500">{pct}%</span>
      </div>
      <p
        className={`mt-0.5 text-xs ${pct >= 70 ? "text-green-600" : pct >= 40 ? "text-amber-600" : "text-red-600"}`}
      >
        {label}
      </p>
    </div>
  );
}

function NodeStatus({ node }: { node: NodeProgress }) {
  const contentReady = node.textStatus === "ready";

  if (!contentReady) {
    return <span className="text-xs text-gray-400">Generating...</span>;
  }

  if (!node.quizAttempted) {
    return <span className="text-xs text-gray-400">Ready to learn</span>;
  }

  return null;
}

function NodeRow({ node }: { node: NodeProgress }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-5 py-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
        {node.order + 1}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{node.title}</p>
        <div className="mt-1 flex items-center gap-3">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {typeLabels[node.type] || node.type}
          </span>
          <NodeStatus node={node} />
        </div>
      </div>

      <div className="shrink-0 text-right">
        {node.quizAttempted && (
          <div>
            <p className="text-xs text-gray-500">
              Quiz: {node.lastScore}/{node.lastTotal} correct
            </p>
            {node.pKnown !== null && (
              <div className="mt-1">
                <MasteryIndicator pKnown={node.pKnown} />
              </div>
            )}
          </div>
        )}
      </div>

      <Link
        to={
          node.quizAttempted ? `/quiz/${node.nodeId}` : `/learn/${node.nodeId}`
        }
        className="shrink-0 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

export default function ProgressPage() {
  const { goalId } = useParams<{ goalId: string }>();
  const { data: progress, isLoading, isError } = useProgress(goalId!);

  if (isLoading) return <Spinner />;

  if (isError || !progress) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-red-600">Could not load progress.</p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm text-gray-500 hover:text-gray-700"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const { summary, nodes } = progress;
  const avgPct =
    summary.averagePKnown !== null
      ? Math.round(summary.averagePKnown * 100)
      : null;
  const firstUnquizzed = nodes.find(
    (n) => !n.quizAttempted && n.textStatus === "ready",
  );

  return (
    <div>
      <Link
        to={`/goals/${goalId}`}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to outline
      </Link>

      <h1 className="mt-4 text-xl font-semibold text-gray-900">
        {progress.topic}
      </h1>
      <p className="mt-1 text-sm text-gray-500">Learning progress</p>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {summary.nodesWithContent}
          </p>
          <p className="text-xs text-gray-500">
            of {summary.totalNodes} lessons ready
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {summary.nodesQuizzed}
          </p>
          <p className="text-xs text-gray-500">
            of {summary.totalNodes} tested
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {avgPct !== null ? `${avgPct}%` : "--"}
          </p>
          <p className="text-xs text-gray-500">est. understanding</p>
        </div>
      </div>

      {avgPct !== null && (
        <p className="mt-2 text-xs text-gray-400">
          Understanding is estimated across {summary.nodesQuizzed} tested{" "}
          {summary.nodesQuizzed === 1 ? "concept" : "concepts"} using knowledge
          tracing, it accounts for guessing and slipping, not just quiz scores.
        </p>
      )}

      {firstUnquizzed && (
        <div className="mt-6">
          <Link
            to={`/learn/${firstUnquizzed.nodeId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Continue learning: {firstUnquizzed.title}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      )}

      {/* Node list */}
      <div className="mt-6 space-y-3">
        {nodes.map((node) => (
          <NodeRow key={node.nodeId} node={node} />
        ))}
      </div>
    </div>
  );
}
