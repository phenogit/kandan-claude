// src/components/home/MostFollowedPredictions.tsx
'use client';

import { useEffect, useState } from 'react';

type Prediction = {
  _id: string;
  userName: string;
  ticker: string;
  tickerName: string;
  direction: number; // 1 = bull, -1 = bear
  ceiling: number;
  floor: number;
  startPrice: number;
  confidence: number;
  status: string;
  followCount: number;
  createdAt: string;
  isLegacy: boolean;
};

export default function MostFollowedPredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPredictions() {
      try {
        const response = await fetch('/api/predictions/most-followed');
        const data = await response.json();
        if (data.success) {
          setPredictions(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch most followed predictions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPredictions();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          本週最多追蹤預測
        </h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        本週最多追蹤預測
      </h2>
      <div className="space-y-4">
        {predictions.map((pred) => (
          <div
            key={pred._id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition cursor-pointer"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">@{pred.userName}</span>
                {pred.isLegacy && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                    Legacy
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {new Date(pred.createdAt).toLocaleDateString('zh-TW')}
              </span>
            </div>

            {/* Prediction Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Direction Icon */}
                <span className="text-3xl">
                  {pred.direction === 1 ? '🐂' : '🐻'}
                </span>

                {/* Stock Info */}
                <div>
                  <p className="font-semibold text-gray-900">
                    {pred.ticker} {pred.tickerName}
                  </p>
                  <p className="text-sm text-gray-600">
                    ${pred.startPrice} → ${pred.floor}-${pred.ceiling}
                  </p>
                </div>
              </div>

              {/* Confidence & Status */}
              <div className="text-right">
                {/* Only show confidence for non-legacy predictions */}
                {!pred.isLegacy && (
                  <div className="flex gap-0.5 justify-end mb-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < pred.confidence ? 'text-yellow-400' : 'text-gray-300'}>
                        ★
                      </span>
                    ))}
                  </div>
                )}
                <span className={`text-xs px-2 py-1 rounded ${
                  pred.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  pred.status.includes('success') ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {pred.status === 'pending' ? '進行中' : pred.status.includes('success') ? '成功' : '失敗'}
                </span>
              </div>
            </div>

            {/* Follow Count */}
            {pred.followCount > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  👥 {pred.followCount} 人追蹤此預測
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* View All Link */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center">
          查看全部 →
        </button>
      </div>
    </div>
  );
}