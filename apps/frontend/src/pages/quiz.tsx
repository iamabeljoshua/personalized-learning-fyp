import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuiz, useSubmitAttempt } from '../hooks/quizzes';
import type { AttemptResult, QuizQuestion } from '../types';

function QuestionCard({
  question,
  index,
  total,
  selectedIndex,
  onSelect,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  selectedIndex: number | null;
  onSelect: (idx: number) => void;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400">
        Question {index + 1} of {total}
      </p>
      <h2 className="mt-2 text-lg font-medium text-gray-900">
        {question.questionText}
      </h2>
      <div className="mt-6 space-y-3">
        {question.options.map((option, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
              selectedIndex === i
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="mr-3 font-medium">
              {String.fromCharCode(65 + i)}.
            </span>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultsView({
  result,
  questions,
  nodeId,
}: {
  result: AttemptResult;
  questions: QuizQuestion[];
  nodeId: string;
}) {
  const pct = Math.round(result.knowledgeState.pKnown * 100);

  return (
    <div>
      <div className="text-center">
        <p className="text-4xl font-bold text-gray-900">
          {result.score}/{result.total}
        </p>
        <p className="mt-1 text-sm text-gray-500">correct answers</p>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Concept confidence</span>
          <span className="font-medium text-gray-900">{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all ${
              pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-sm font-medium text-gray-900">Review</h3>
        {result.results.map((r, i) => {
          const q = questions[i];
          return (
            <div
              key={r.questionId}
              className={`rounded-lg border px-4 py-3 ${
                r.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <p className="text-sm font-medium text-gray-900">
                {q.questionText}
              </p>
              <div className="mt-2 space-y-1 text-sm">
                {!r.isCorrect && (
                  <p className="text-red-600">
                    Your answer: {String.fromCharCode(65 + r.selectedIndex)}.{' '}
                    {q.options[r.selectedIndex]}
                  </p>
                )}
                <p className="text-green-700">
                  Correct: {String.fromCharCode(65 + r.correctIndex)}.{' '}
                  {q.options[r.correctIndex]}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          to={`/learn/${nodeId}`}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to lesson
        </Link>
        {result.nextNodeId && (
          <Link
            to={`/learn/${result.nextNodeId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Next lesson
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function QuizPage() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const navigate = useNavigate();
  const { data: quiz, isLoading, isError } = useQuiz(nodeId!);
  const submitMutation = useSubmitAttempt(nodeId!);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<AttemptResult | null>(null);

  if (quiz && answers.length === 0) {
    setAnswers(new Array(quiz.questions.length).fill(null));
  }

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        <p className="mt-4 text-sm text-gray-500">
          Preparing your quiz...
        </p>
      </div>
    );
  }

  if (isError || !quiz) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-red-600">Could not load the quiz.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Go back
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-xl">
        <ResultsView result={result} questions={quiz.questions} nodeId={nodeId!} />
      </div>
    );
  }

  const question = quiz.questions[currentIndex];
  const isLast = currentIndex === quiz.questions.length - 1;
  const selected = answers[currentIndex];

  const handleSelect = (idx: number) => {
    const next = [...answers];
    next[currentIndex] = idx;
    setAnswers(next);
  };

  const handleNext = () => {
    if (isLast) {
      submitMutation.mutate(
        { answers: answers as number[] },
        { onSuccess: (data) => setResult(data) },
      );
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back
      </button>

      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gray-900 transition-all"
          style={{
            width: `${((currentIndex + 1) / quiz.questions.length) * 100}%`,
          }}
        />
      </div>

      <div className="mt-8">
        <QuestionCard
          question={question}
          index={currentIndex}
          total={quiz.questions.length}
          selectedIndex={selected}
          onSelect={handleSelect}
        />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="text-sm text-gray-500 hover:text-gray-700 disabled:invisible"
        >
          &larr; Previous
        </button>

        <button
          onClick={handleNext}
          disabled={selected === null || submitMutation.isPending}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
        >
          {submitMutation.isPending
            ? 'Submitting...'
            : isLast
              ? 'Submit'
              : 'Next'}
        </button>
      </div>
    </div>
  );
}
