// src/app/prediction/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface Prediction {
  _id: string;
  ticker: string;
  tickerName: string;
  direction: number;
  ceiling: number;
  floor: number;
  startPrice: number;
  currentPrice: number;
  confidence: number;
  rationale?: string;
  status: string;
  createdAt: string;
  user: {
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export default function PredictionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const response = await fetch(`/api/predictions/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch prediction');
        }
        const data = await response.json();
        setPrediction(data.prediction);
      } catch (err) {
        setError('無法載入預測資料');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrediction();
  }, [resolvedParams.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '找不到預測'}</p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  const priceProgress =
    ((prediction.currentPrice - prediction.floor) /
      (prediction.ceiling - prediction.floor)) *
    100;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← 返回
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Stock Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {prediction.ticker} - {prediction.tickerName}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    prediction.direction === 1
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {prediction.direction === 1 ? '🐂 看漲' : '🐻 看跌'}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {prediction.status === 'pending' ? '進行中' : prediction.status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">信心指數</div>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${
                      star <= prediction.confidence
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>

          {/* Price Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>地板: ${prediction.floor.toFixed(2)}</span>
              <span>天花板: ${prediction.ceiling.toFixed(2)}</span>
            </div>
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-blue-500 transition-all"
                style={{ width: `${Math.max(0, Math.min(100, priceProgress))}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="text-sm text-gray-500">
                起始: ${prediction.startPrice.toFixed(2)}
              </div>
              <div className="text-xl font-bold text-blue-600">
                ${prediction.currentPrice.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-lg font-semibold mb-3">預測者</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {prediction.user.displayName.charAt(0)}
            </div>
            <div>
              <div className="font-medium">{prediction.user.displayName}</div>
              <div className="text-sm text-gray-500">@{prediction.user.username}</div>
            </div>
          </div>
        </div>

        {/* Rationale */}
        {prediction.rationale && (
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h2 className="text-lg font-semibold mb-3">預測理由</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{prediction.rationale}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">預測資訊</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">創建時間</span>
              <span className="text-gray-900">
                {new Date(prediction.createdAt).toLocaleString('zh-TW')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">狀態</span>
              <span className="text-gray-900">
                {prediction.status === 'pending' ? '進行中' : prediction.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}