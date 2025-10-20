// ============================================
// src/components/prediction/PriceTargets.tsx
// ============================================
'use client';

interface PriceTargetsProps {
  ceiling: string;
  floor: string;
  currentPrice?: number;
  onCeilingChange: (value: string) => void;
  onFloorChange: (value: string) => void;
  errors?: { ceiling?: string; floor?: string };
}

export default function PriceTargets({
  ceiling,
  floor,
  currentPrice,
  onCeilingChange,
  onFloorChange,
  errors,
}: PriceTargetsProps) {
  return (
    <div className="space-y-4">
      {/* Ceiling */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          天花板價格 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600">
            $
          </span>
          <input
            type="number"
            step="0.01"
            value={ceiling}
            onChange={(e) => onCeilingChange(e.target.value)}
            placeholder="目標上限"
            className={`w-full pl-8 pr-4 py-3 border ${
              errors?.ceiling ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500`}
          />
        </div>
        {errors?.ceiling && (
          <p className="mt-1 text-sm text-red-600">{errors.ceiling}</p>
        )}
        {currentPrice && ceiling && parseFloat(ceiling) > currentPrice && (
          <p className="mt-1 text-sm text-green-600">
            +{(((parseFloat(ceiling) - currentPrice) / currentPrice) * 100).toFixed(2)}% 
            上漲空間
          </p>
        )}
      </div>

      {/* Current Price Indicator */}
      {currentPrice && (
        <div className="flex items-center justify-center py-2">
          <div className="flex-1 border-t border-gray-300" />
          <div className="px-4 text-center">
            <div className="text-xs text-gray-500">現價</div>
            <div className="text-lg font-bold text-blue-600">
              ${currentPrice.toFixed(2)}
            </div>
          </div>
          <div className="flex-1 border-t border-gray-300" />
        </div>
      )}

      {/* Floor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          地板價格 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
            $
          </span>
          <input
            type="number"
            step="0.01"
            value={floor}
            onChange={(e) => onFloorChange(e.target.value)}
            placeholder="目標下限"
            className={`w-full pl-8 pr-4 py-3 border ${
              errors?.floor ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
        {errors?.floor && (
          <p className="mt-1 text-sm text-red-600">{errors.floor}</p>
        )}
        {currentPrice && floor && parseFloat(floor) < currentPrice && (
          <p className="mt-1 text-sm text-red-600">
            {(((currentPrice - parseFloat(floor)) / currentPrice) * 100).toFixed(2)}% 
            下跌空間
          </p>
        )}
      </div>
    </div>
  );
}