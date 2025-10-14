// src/components/home/MostSuccessfulUsers.tsx
'use client';

import { useEffect, useState } from 'react';

type User = {
  _id: string;
  username: string;
  displayName: string;
  isLegacy: boolean;
  stats: {
    totalPredictions: number;
    accuracyRate: number;
    avgProfitRate: number;
    currentStreak: number;
  };
  weekStats: {
    resolved: number;
    successful: number;
    accuracyRate: number;
    avgProfit: number;
  };
};

export default function MostSuccessfulUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'alltime'>('week');

  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        // TODO: Update API to support timeframe parameter
        const response = await fetch(`/api/users/most-successful?timeframe=${timeframe}`);
        const data = await response.json();
        if (data.success) {
          setUsers(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch most successful users:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, [timeframe]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          最成功用戶
        </h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header with Timeframe Tabs */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          最成功用戶
        </h2>
        
        {/* Timeframe Selector - Desktop: Segmented Control */}
        <div className="hidden sm:flex items-center justify-center border border-gray-300 rounded-lg p-1">
          <button
            onClick={() => setTimeframe('week')}
            className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition ${
              timeframe === 'week'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            本週
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition ${
              timeframe === 'month'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            本月
          </button>
          <button
            onClick={() => setTimeframe('alltime')}
            className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition ${
              timeframe === 'alltime'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            全部時間
          </button>
        </div>

        {/* Timeframe Selector - Mobile: Tabs */}
        <div className="sm:hidden border-b border-gray-200">
          <nav className="-mb-px flex gap-4">
            <button
              onClick={() => setTimeframe('week')}
              className={`py-2 px-1 border-b-2 text-sm font-medium ${
                timeframe === 'week'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              本週
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`py-2 px-1 border-b-2 text-sm font-medium ${
                timeframe === 'month'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              本月
            </button>
            <button
              onClick={() => setTimeframe('alltime')}
              className={`py-2 px-1 border-b-2 text-sm font-medium ${
                timeframe === 'alltime'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              全部
            </button>
          </nav>
        </div>
      </div>

      <div className="space-y-3">
        {users.map((user, index) => (
          <div
            key={user._id}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition"
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : 
                <span className="text-sm font-semibold text-gray-500">{index + 1}</span>
              }
            </div>

            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.displayName.substring(0, 2).toUpperCase()}
                </span>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  @{user.username}
                </p>
                {user.isLegacy && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                    Legacy
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {user.weekStats.accuracyRate}% 準確 · 本週 {user.weekStats.successful}/{user.weekStats.resolved} 成功
              </p>
            </div>

            {/* Stats */}
            <div className="flex-shrink-0 text-right">
              <p className={`text-sm font-semibold ${
                user.weekStats.avgProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {user.weekStats.avgProfit >= 0 ? '+' : ''}{user.weekStats.avgProfit.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500">
                平均報酬
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* View All Link */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center">
          查看排行榜 →
        </button>
      </div>
    </div>
  );
}