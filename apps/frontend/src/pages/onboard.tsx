import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useOnboard } from '../hooks/students';
import { getErrorMessage } from '../utils/get-error-message';
import SelectCards from '../components/select-cards';
import TagInput from '../components/tag-input';

const LEARNING_STYLES = [
  { value: 'visual', label: 'Visual', description: 'Diagrams, charts, and images help you understand best' },
  { value: 'auditory', label: 'Auditory', description: 'You absorb information by listening to explanations' },
  { value: 'reading', label: 'Reading / Writing', description: 'Written text, notes, and articles are your go-to' },
  { value: 'kinesthetic', label: 'Kinesthetic', description: 'Hands-on practice and real examples work best for you' },
];

const PACES = [
  { value: 'slow', label: 'Take it slow', description: 'Detailed breakdowns with plenty of repetition' },
  { value: 'moderate', label: 'Balanced', description: 'A good mix of depth and forward progress' },
  { value: 'fast', label: 'Move quickly', description: 'Cover key points and keep things moving' },
];

const EDUCATION_LEVELS = [
  { value: 'high_school', label: 'High School', description: 'Currently in or completed secondary education' },
  { value: 'undergraduate', label: 'Undergraduate', description: 'Currently in or completed a bachelor\'s degree' },
  { value: 'postgraduate', label: 'Postgraduate', description: 'Master\'s, PhD, or other advanced study' },
  { value: 'professional', label: 'Professional', description: 'Learning for career development or industry skills' },
];

const LANGUAGE_PROFICIENCIES = [
  { value: 'native', label: 'Native', description: 'English is your first language' },
  { value: 'fluent', label: 'Fluent', description: 'Very comfortable, but not your first language' },
  { value: 'intermediate', label: 'Intermediate', description: 'You follow along fine, but complex language can be tricky' },
  { value: 'basic', label: 'Basic', description: 'You prefer simple, clear language' },
];

const INTEREST_SUGGESTIONS = [
  'football', 'music', 'cooking', 'gaming', 'travel',
  'movies', 'fitness', 'photography', 'science', 'art',
];

interface FormData {
  learningStyle: string;
  pace: string;
  educationLevel: string;
  languageProficiency: string;
  interests: string[];
  personalContext: string;
}

const INITIAL_FORM: FormData = {
  learningStyle: '',
  pace: '',
  educationLevel: '',
  languageProficiency: '',
  interests: [],
  personalContext: '',
};

const steps = [
  { key: 'learningStyle', title: 'How do you learn best?', subtitle: 'We\'ll tailor how your content is presented.' },
  { key: 'pace', title: 'What pace works for you?', subtitle: 'We\'ll adjust the depth and speed of your lessons.' },
  { key: 'educationLevel', title: 'What\'s your education level?', subtitle: 'This helps us pitch explanations at the right level.' },
  { key: 'languageProficiency', title: 'How comfortable are you with English?', subtitle: 'We\'ll adjust vocabulary and sentence complexity.' },
  { key: 'aboutYou', title: 'A bit about you', subtitle: 'Your interests help us make examples you\'ll actually relate to.' },
] as const;

export default function OnboardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [error, setError] = useState('');

  const { mutateAsync: onboard, isPending } = useOnboard();

  const currentStep = steps[step];

  const canContinue = (): boolean => {
    switch (step) {
      case 0: return !!form.learningStyle;
      case 1: return !!form.pace;
      case 2: return !!form.educationLevel;
      case 3: return !!form.languageProficiency;
      case 4: return form.interests.length > 0;
      default: return false;
    }
  };

  const handleContinue = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    setError('');
    try {
      await onboard({
        learningStyle: form.learningStyle,
        pace: form.pace,
        educationLevel: form.educationLevel,
        languageProficiency: form.languageProficiency,
        interests: form.interests,
        ...(form.personalContext.trim() && { personalContext: form.personalContext.trim() }),
      });
      toast.success('Profile saved');
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="h-1 bg-gray-200">
        <div
          className="h-1 bg-gray-900 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-2 text-center">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Step {step + 1} of {steps.length}
            </span>
          </div>

          <h1 className="text-center text-2xl font-semibold text-gray-900">
            {currentStep.title}
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            {currentStep.subtitle}
          </p>

          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {step === 0 && (
              <SelectCards
                options={LEARNING_STYLES}
                value={form.learningStyle}
                onChange={(v) => updateField('learningStyle', v)}
              />
            )}

            {step === 1 && (
              <SelectCards
                options={PACES}
                value={form.pace}
                onChange={(v) => updateField('pace', v)}
              />
            )}

            {step === 2 && (
              <SelectCards
                options={EDUCATION_LEVELS}
                value={form.educationLevel}
                onChange={(v) => updateField('educationLevel', v)}
              />
            )}

            {step === 3 && (
              <SelectCards
                options={LANGUAGE_PROFICIENCIES}
                value={form.languageProficiency}
                onChange={(v) => updateField('languageProficiency', v)}
              />
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Your interests
                  </label>
                  <TagInput
                    tags={form.interests}
                    onChange={(tags) => updateField('interests', tags)}
                    suggestions={INTEREST_SUGGESTIONS}
                    placeholder="Type an interest and press Enter"
                  />
                </div>

                <div>
                  <label htmlFor="personalContext" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Anything else we should know? <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    id="personalContext"
                    rows={3}
                    value={form.personalContext}
                    onChange={(e) => updateField('personalContext', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none"
                    placeholder="e.g. I struggle with abstract math but enjoy practical problems"
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="mt-4 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue() || isPending}
              className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isPending ? '...' : step === steps.length - 1 ? 'Get started' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
