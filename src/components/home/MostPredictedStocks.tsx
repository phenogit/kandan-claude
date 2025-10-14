// src/components/home/MostPredictedStocks.tsx
'use client';

import { useEffect, useState } from 'react';

type Stock = {
  ticker: string;
  name: string;
  predictionCount: number;
  ongoingCount: number;
  resolvedCount: number;
};

export default function MostPredictedStocks() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStocks() {
      try {
        const response = await fetch('/api/stocks/most-predicted');
        const data = await response.json();
        if (data.success) {
          setStocks(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch most predicted stocks:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStocks();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          本週最多預測股票
        </h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="h-4 w-6 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        本週最多預測股票
      </h2>
      <div className="space-y-3">
        {stocks.map((stock, index) => (
          <div
            key={stock.ticker}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition"
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-6 text-center">
              <span className="text-sm font-semibold text-gray-500">
                {index + 1}
              </span>
            </div>

            {/* Stock Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {stock.ticker} {stock.name}
              </p>
              <p className="text-xs text-gray-500">
                {stock.predictionCount} 個預測 · {stock.ongoingCount} 進行中 · {stock.resolvedCount} 已結束
              </p>
            </div>
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