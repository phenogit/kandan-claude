// src/components/prediction/DirectionSelector.tsx
'use client';

interface DirectionSelectorProps {
  value: 'bull' | 'bear';
  onChange: (value: 'bull' | 'bear') => void;
}

export default function DirectionSelector({ value, onChange }: DirectionSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onChange('bull')}
        className={`p-4 rounded-lg border-2 transition ${
          value === 'bull'
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-red-300'
        }`}
      >
        <div className="text-center">
          <div className="text-3xl mb-2">🐂</div>
          <div className="font-semibold text-gray-900">看漲 (Bull)</div>
          <div className="text-sm text-gray-500 mt-1">預期股價上漲</div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onChange('bear')}
        className={`p-4 rounded-lg border-2 transition ${
          value === 'bear'
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-green-300'
        }`}
      >
        <div className="text-center">
          <div className="text-3xl mb-2">🐻</div>
          <div className="font-semibold text-gray-900">看跌 (Bear)</div>
          <div className="text-sm text-gray-500 mt-1">預期股價下跌</div>
        </div>
      </button>
    </div>
  );
}