interface Option {
  value: string;
  label: string;
  description?: string;
}

interface SelectCardsProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export default function SelectCards({ options, value, onChange }: SelectCardsProps) {
  return (
    <div className="grid gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md border px-4 py-3 text-left transition-colors ${
            value === option.value
              ? 'border-gray-900 bg-gray-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className={`block text-sm font-medium ${
            value === option.value ? 'text-gray-900' : 'text-gray-700'
          }`}>
            {option.label}
          </span>
          {option.description && (
            <span className="mt-0.5 block text-sm text-gray-500">
              {option.description}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
