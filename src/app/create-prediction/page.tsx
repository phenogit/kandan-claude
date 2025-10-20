// src/app/create-prediction/page.tsx
'use client';

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import StockSearch from '@/components/prediction/StockSearch';
import DirectionSelector from '@/components/prediction/DirectionSelector';
import PriceTargets from '@/components/prediction/PriceTargets';
import ConfidenceSelector from '@/components/prediction/ConfidenceSelector';

interface Stock {
  ticker: string;
  name: string;
  nameEn?: string;
  currentPrice?: number;
  dailyHigh?: number;
  dailyLow?: number;
}

export default function CreatePredictionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Form state
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [direction, setDirection] = useState<'bull' | 'bear'>('bull');
  const [ceiling, setCeiling] = useState('');
  const [floor, setFloor] = useState('');
  const [confidence, setConfidence] = useState(3);
  const [rationale, setRationale] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not authenticated
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedStock) {
      newErrors.stock = '請選擇股票';
    }

    if (!ceiling || parseFloat(ceiling) <= 0) {
      newErrors.ceiling = '請輸入有效的天花板價格';
    }

    if (!floor || parseFloat(floor) <= 0) {
      newErrors.floor = '請輸入有效的地板價格';
    }

    if (selectedStock?.currentPrice) {
      const ceilingNum = parseFloat(ceiling);
      const floorNum = parseFloat(floor);
      const currentPrice = selectedStock.currentPrice;

      if (direction === 'bull') {
        if (ceilingNum <= currentPrice) {
          newErrors.ceiling = '看漲預測：天花板必須高於現價';
        }
        if (floorNum >= currentPrice) {
          newErrors.floor = '看漲預測：地板必須低於現價';
        }
      } else {
        if (ceilingNum <= currentPrice) {
          newErrors.ceiling = '看跌預測：天花板必須高於現價';
        }
        if (floorNum >= currentPrice) {
          newErrors.floor = '看跌預測：地板必須低於現價';
        }
      }

      if (ceilingNum <= floorNum) {
        newErrors.ceiling = '天花板必須高於地板';
      }
    }

    if (rationale.length > 1000) {
      newErrors.rationale = '理由不能超過 1000 字';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker: selectedStock!.ticker,
          tickerName: selectedStock!.name,
          direction: direction === 'bull' ? 1 : -1,
          ceiling: parseFloat(ceiling),
          floor: parseFloat(floor),
          startPrice: selectedStock!.currentPrice,
          dailyHigh: selectedStock!.dailyHigh,
          dailyLow: selectedStock!.dailyLow,
          confidence,
          rationale: rationale.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '創建預測失敗');
      }

      const data = await response.json();
      
      // Redirect to prediction detail page
      router.push(`/prediction/${data.predictionId}`);
    } catch (error) {
      console.error('Error creating prediction:', error);
      setErrors({
        submit: error instanceof Error ? error.message : '創建預測時發生錯誤',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← 返回
          </button>
          <h1 className="text-xl font-bold">創建預測</h1>
          <div className="w-12" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stock Search */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            選擇股票 <span className="text-red-500">*</span>
          </label>
          <StockSearch
            onSelect={setSelectedStock}
            error={errors.stock}
          />
          {selectedStock && (
            <div className="mt-3 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{selectedStock.ticker} - {selectedStock.name}</div>
                  {selectedStock.nameEn && (
                    <div className="text-sm text-gray-600">{selectedStock.nameEn}</div>
                  )}
                </div>
                {selectedStock.currentPrice && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      ${selectedStock.currentPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">現價</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Direction */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            預測方向 <span className="text-red-500">*</span>
          </label>
          <DirectionSelector
            value={direction}
            onChange={setDirection}
          />
        </div>

        {/* Price Targets */}
        <PriceTargets
          ceiling={ceiling}
          floor={floor}
          currentPrice={selectedStock?.currentPrice}
          onCeilingChange={setCeiling}
          onFloorChange={setFloor}
          errors={{ ceiling: errors.ceiling, floor: errors.floor }}
        />

        {/* Confidence */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            信心指數 <span className="text-red-500">*</span>
          </label>
          <ConfidenceSelector
            value={confidence}
            onChange={setConfidence}
          />
        </div>

        {/* Rationale */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            預測理由 <span className="text-gray-400">(選填)</span>
          </label>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="分享你的分析和理由..."
            rows={4}
            maxLength={1000}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500"
          />
          <div className="mt-1 text-sm text-gray-500 text-right">
            {rationale.length} / 1000
          </div>
          {errors.rationale && (
            <p className="mt-1 text-sm text-red-600">{errors.rationale}</p>
          )}
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !selectedStock}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          {isLoading ? '創建中...' : '創建預測'}
        </button>
      </form>
    </div>
  );
}