import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCreateGoal } from '../hooks/goals';
import { getErrorMessage } from '../utils/get-error-message';
import Input from '../components/input';
import SelectCards from '../components/select-cards';

const MOTIVATIONS = [
  { value: 'career', label: 'Career', description: 'Building skills for work or a job switch' },
  { value: 'academic', label: 'Academic', description: 'Studying for a course, degree, or certification' },
  { value: 'curiosity', label: 'Curiosity', description: 'Just genuinely interested in the topic' },
  { value: 'exam_prep', label: 'Exam Prep', description: 'Preparing for a specific test or exam' },
];

const EXPLANATION_STYLES = [
  { value: 'eli5', label: 'Explain like I\'m 5', description: 'Simple language, everyday analogies' },
  { value: 'conceptual', label: 'Conceptual', description: 'Focus on the "why" behind ideas' },
  { value: 'technical', label: 'Technical', description: 'Precise, detailed, with proper terminology' },
  { value: 'example_heavy', label: 'Example heavy', description: 'Lots of worked examples and walkthroughs' },
];

export default function NewGoalPage() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [motivation, setMotivation] = useState('');
  const [preferredExplanationStyle, setPreferredExplanationStyle] = useState('');
  const [priorKnowledge, setPriorKnowledge] = useState('');
  const [error, setError] = useState('');

  const { mutateAsync: createGoal, isPending } = useCreateGoal();

  const canSubmit = topic.trim() && motivation && preferredExplanationStyle;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const goal = await createGoal({
        topic: topic.trim(),
        motivation,
        preferredExplanationStyle,
        ...(priorKnowledge.trim() && { priorKnowledge: priorKnowledge.trim() }),
      });
      toast.success('Learning goal created');
      navigate(`/goals/${goal.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900">Create a learning goal</h1>
      <p className="mt-1 text-sm text-gray-500">
        Tell us what you want to learn and we'll generate a personalised curriculum for you.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <Input
            label="What do you want to learn?"
            id="topic"
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Quantum Physics, Machine Learning, Spanish"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <label className="mb-3 block text-sm font-medium text-gray-700">
            Why are you learning this?
          </label>
          <SelectCards
            options={MOTIVATIONS}
            value={motivation}
            onChange={setMotivation}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <label className="mb-3 block text-sm font-medium text-gray-700">
            How would you like things explained?
          </label>
          <SelectCards
            options={EXPLANATION_STYLES}
            value={preferredExplanationStyle}
            onChange={setPreferredExplanationStyle}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <label htmlFor="priorKnowledge" className="mb-1.5 block text-sm font-medium text-gray-700">
            What do you already know about this? <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            id="priorKnowledge"
            rows={3}
            value={priorKnowledge}
            onChange={(e) => setPriorKnowledge(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none"
            placeholder="e.g. I know basic algebra and Newton's laws"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || isPending}
            className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isPending ? 'Creating...' : 'Create goal'}
          </button>
        </div>
      </form>
    </div>
  );
}
