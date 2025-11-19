// File: src/components/home/UserCurrentPredictions.tsx
// Component that fetches and displays a user's current ongoing predictions

'use client';

import { useState, useEffect } from 'react';
import PredictionMiniCard from './PredictionMiniCard';
import Link from 'next/link';

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

interface UserCurrentPredictionsProps {
  username: string;
  limit?: number;
}

export default function UserCurrentPredictions({
  username,
  limit = 3,
}: UserCurrentPredictionsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserPredictions();
  }, [username, limit]);

  const fetchUserPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use existing API endpoint with status=pending filter
      const response = await fetch(
        `/api/users/${username}/predictions?status=pending&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      }

      const data = await response.json();

      if (data.success) {
        // Your existing API returns: { success: true, data: { predictions: [...], pagination: {...} } }
        setPredictions(data.data.predictions);
        setTotal(data.data.pagination.total);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (predictionId: string) => {
    // TODO: Implement follow functionality
    // This should open a follow dialog or navigate to follow page
    console.log('Following prediction:', predictionId);
    alert('跟單功能開發中...');
  };

  // Loading state
  if (loading) {
    return (
      <div className="mt-3 space-y-2">
        <p className="text-xs text-gray-600">目前預測中:</p>
        <div className="space-y-2">
          {[...Array(Math.min(2, limit))].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 border border-gray-200 rounded-lg p-3 animate-pulse"
            >
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-2 bg-gray-300 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mt-3">
        <p className="text-xs text-red-600">載入預測失敗</p>
      </div>
    );
  }

  // No predictions
  if (predictions.length === 0) {
    return null; // Don't show section if user has no ongoing predictions
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-gray-600 font-medium">目前預測中:</p>

      <div className="space-y-2">
        {predictions.map((pred) => (
          <PredictionMiniCard
            key={pred._id}
            prediction={pred}
            showFollowButton={true}
            onFollow={handleFollow}
          />
        ))}
      </div>

      {total > limit && (
        <Link
          href={`/profile/${username}`}
          className="inline-block text-xs text-blue-600 hover:text-blue-700 hover:underline"
        >
          +{total - limit} 更多預測 →
        </Link>
      )}
    </div>
  );
}