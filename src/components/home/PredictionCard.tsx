// src/components/home/PredictionCard.tsx
'use client';

import Link from 'next/link';

interface Prediction {
  _id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  ticker: string;
  stockName: string;
  direction: 'bull' | 'bear' | 1 | -1;  // Accept both string and number formats
  currentPrice: number;
  floor: number;
  ceiling: number;
  confidence?: number;
  followCount: number;
  status: 'pending' | 'resolved';
  createdAt: string;
  isLegacy: boolean;
  rationale?: string | null;
}

interface PredictionCardProps {
  prediction: Prediction;
  onFollow: (predictionId: string) => void;
}

export default function PredictionCard({ prediction, onFollow }: PredictionCardProps) {
  // Calculate price position for the visual indicator
  const priceProgress = 
    ((prediction.currentPrice - prediction.floor) / 
     (prediction.ceiling - prediction.floor)) * 100;
  
  // Clamp between 0 and 100
  const clampedProgress = Math.min(Math.max(priceProgress, 0), 100);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return '剛剛';
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-TW');
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all duration-200">
      {/* User Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            {prediction.userAvatar ? (
              <img 
                src={prediction.userAvatar} 
                alt={prediction.userName || 'User'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-gray-600">
                {prediction.userName?.substring(0, 2).toUpperCase() || '??'}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              @{prediction.userName || 'Unknown'}
            </p>
          </div>
          {prediction.isLegacy && (
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
              Legacy
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {formatDate(prediction.createdAt)}
        </span>
      </div>

      {/* Prediction Content */}
      <Link href={`/prediction/${prediction._id}`} className="block">
        {/* Stock Info */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">
            {prediction.direction === 1 || prediction.direction === 'bull' ? '🐂' : '🐻'}
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">
              {prediction.ticker} {prediction.stockName}
            </h3>
            <p className="text-sm text-gray-600">
              {prediction.direction === 1 || prediction.direction === 'bull' ? '看漲' : '看跌'} • 
              目標 ${prediction.direction === 1 || prediction.direction === 'bull' ? prediction.ceiling : prediction.floor}
            </p>
          </div>
        </div>

        {/* Confidence Stars (only for non-legacy predictions) */}
        {!prediction.isLegacy && prediction.confidence && (
          <div className="flex items-center gap-1 mb-3">
            <span className="text-xs text-gray-500">信心度:</span>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span 
                  key={i} 
                  className={i < prediction.confidence! ? 'text-yellow-400' : 'text-gray-300'}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Price Range with Visual Indicator */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>底價 ${prediction.floor}</span>
            <span className="font-medium">目前 ${prediction.currentPrice}</span>
            <span>天花板 ${prediction.ceiling}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            {/* Price Indicator Marker */}
            <div 
              className="absolute top-0 h-full w-1 bg-blue-600 transition-all duration-300"
              style={{ left: `${clampedProgress}%` }}
            />
          </div>
        </div>

        {/* Rationale (if provided) */}
        {prediction.rationale && (
          <p className="text-sm text-gray-700 line-clamp-2 mb-3">
            {prediction.rationale}
          </p>
        )}

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            prediction.status === 'pending' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {prediction.status === 'pending' ? '進行中' : '已結束'}
          </span>
          
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>👁 {prediction.followCount} 追蹤</span>
          </div>
        </div>
      </Link>

      {/* Follow Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          onFollow(prediction._id);
        }}
        className="mt-3 w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
      >
        追蹤此預測
      </button>
    </div>
  );
}