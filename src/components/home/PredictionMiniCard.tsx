// File: src/components/home/PredictionMiniCard.tsx
// Compact prediction card for displaying in successful users section

'use client';

import { useState } from 'react';

interface Prediction {
  _id: string;
  ticker: string;
  tickerName: string; // Your API uses tickerName
  direction: number;
  startPrice: number;
  currentPrice: number;
  ceiling: number;
  floor: number;
  confidence?: number;
  status: string;
  createdAt: string;
  followCount?: number;
  isLegacy: boolean;
}

interface PredictionMiniCardProps {
  prediction: Prediction;
  showFollowButton?: boolean;
  onFollow?: (predictionId: string) => void;
}

export default function PredictionMiniCard({
  prediction,
  showFollowButton = true,
  onFollow,
}: PredictionMiniCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = async () => {
    if (onFollow && !isFollowing) {
      setIsFollowing(true);
      try {
        await onFollow(prediction._id);
      } catch (error) {
        setIsFollowing(false);
        console.error('Follow failed:', error);
      }
    }
  };

  // Calculate marker position for visual indicator
  const calculateMarkerPosition = () => {
    const { currentPrice, floor, ceiling } = prediction;
    const range = ceiling - floor;
    if (range === 0) return 50;
    const position = ((currentPrice - floor) / range) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const markerPosition = calculateMarkerPosition();
  const isBull = prediction.direction === 1;
  const directionColor = isBull ? 'text-red-600' : 'text-green-600';
  const directionEmoji = isBull ? '🐂' : '🐻';
  const directionArrow = isBull ? '↗' : '↘';
  const targetPrice = isBull ? prediction.ceiling : prediction.floor;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
      {/* Header: Direction + Stock + Target */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0">{directionEmoji}</span>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className={`font-semibold text-sm ${directionColor} truncate`}>
              {prediction.ticker} {prediction.tickerName}
            </span>
            <span className="text-gray-500 text-xs flex-shrink-0">
              {directionArrow} ${targetPrice}
            </span>
          </div>
        </div>

        {showFollowButton && (
          <button
            onClick={handleFollow}
            disabled={isFollowing}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex-shrink-0 ml-2"
          >
            {isFollowing ? '處理中...' : '跟單'}
          </button>
        )}
      </div>

      {/* Confidence + Start Price */}
      <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
        {!prediction.isLegacy && prediction.confidence && (
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
        )}
        <span>起始 ${prediction.startPrice}</span>
      </div>

      {/* Visual Indicator */}
      <div className="relative">
        {/* Labels */}
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>地板</span>
          <span>天花板</span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-0.5 bg-gray-300 rounded">
          <div
            className="absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm"
            style={{
              left: `${markerPosition}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>

        {/* Prices */}
        <div className="flex justify-between text-xs font-medium mt-1">
          <span className="text-gray-700">${prediction.floor}</span>
          <span className="text-blue-600">
            ${prediction.currentPrice} {directionArrow} 目前
          </span>
          <span className="text-gray-700">${prediction.ceiling}</span>
        </div>
      </div>
    </div>
  );
}