// src/components/home/GlobalFeed.tsx
'use client';

import { useEffect, useState } from 'react';

type Prediction = {
  _id: string;
  userName: string;
  ticker: string;
  tickerName: string;
  direction: number;
  ceiling: number;
  floor: number;
  startPrice: number;
  currentPrice: number;
  confidence: number;
  status: string;
  profitRate?: number;
  createdAt: string;
  isLegacy: boolean;
};

export default function GlobalFeed() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    async function fetchPredictions() {
      try {
        const response = await fetch(`/api/feed/global?page=${page}&limit=10`);
        const data = await response.json();
        if (data.success) {
          setPredictions(prev => page === 1 ? data.data : [...prev, ...data.data]);
          setHasMore(data.pagination.hasMore);
        }
      } catch (error) {
        console.error('Failed to fetch global feed:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPredictions();
  }, [page]);

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  if (isLoading && page === 1) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          全球動態
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          全球動態
        </h2>
        <button className="text-sm text-gray-600 hover:text-gray-900">
          🔍 篩選
        </button>
      </div>

      <div className="space-y-4">
        {predictions.map((pred) => (
          <div
            key={pred._id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition cursor-pointer"
          >
            {/* User Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-600">
                    {pred.userName.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    @{pred.userName}
                  </p>
                </div>
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

            {/* Prediction Content */}
            <div className="flex items-start gap-4">
              {/* Direction */}
              <div className="flex-shrink-0">
                <span className="text-4xl">
                  {pred.direction === 1 ? '🐂' : '🐻'}
                </span>
              </div>

              {/* Details */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {pred.ticker} {pred.tickerName}
                </h3>
                
                {/* Visual Price Indicator */}
                <div className="mb-3 space-y-1">
                  {/* Price Range Bar */}
                  <div className="relative h-2 bg-gray-200 rounded-full">
                    {/* Current Price Marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow"
                      style={{
                        left: `${Math.min(100, Math.max(0, 
                          ((pred.currentPrice - pred.floor) / (pred.ceiling - pred.floor)) * 100
                        ))}%`
                      }}
                    />
                  </div>
                  
                  {/* Labels */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="text-gray-600">
                      <div>地板</div>
                      <div className="font-semibold text-gray-900">${pred.floor}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-600 font-medium">↑ 目前</div>
                      <div className="font-semibold text-blue-600">${pred.currentPrice}</div>
                    </div>
                    <div className="text-gray-600 text-right">
                      <div>天花板</div>
                      <div className="font-semibold text-gray-900">${pred.ceiling}</div>
                    </div>
                  </div>
                  
                  {/* Start Price */}
                  <div className="text-xs text-gray-500 text-center">
                    起始: ${pred.startPrice}
                  </div>
                </div>
                
                {/* Confidence & Status */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Only show confidence for non-legacy predictions */}
                  {!pred.isLegacy && (
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < pred.confidence ? 'text-yellow-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    pred.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    pred.status.includes('success') ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {pred.status === 'pending' ? '進行中' : 
                     pred.status.includes('success') ? '成功' : '失敗'}
                  </span>
                  {pred.profitRate !== undefined && pred.profitRate !== null && (
                    <span className={`text-xs font-semibold ${
                      pred.profitRate >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {pred.profitRate >= 0 ? '+' : ''}{pred.profitRate.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
              <button className="text-sm text-gray-600 hover:text-blue-600">
                👁️ 查看詳情
              </button>
              <button className="text-sm text-gray-600 hover:text-blue-600">
                🔗 追蹤
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium disabled:opacity-50"
          >
            {isLoading ? '載入中...' : '載入更多'}
          </button>
        </div>
      )}
    </div>
  );
}