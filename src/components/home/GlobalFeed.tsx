// src/components/home/GlobalFeed.tsx
'use client';

import { useState, useEffect } from 'react';
import PredictionCard from '@/components/home/PredictionCard';

type Filters = {
  ticker: string;
  status: 'all' | 'pending' | 'resolved';
  direction: 'all' | 'bull' | 'bear';
  userType: 'all' | 'legacy' | 'new';
  timeRange: 'all' | 'today' | 'week' | 'month';
  sortBy: 'newest' | 'popular' | 'ending-soon';
};

type Prediction = {
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
};

export default function GlobalFeed() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null); // Changed from page to cursor
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    ticker: '',
    status: 'all',
    direction: 'all',
    userType: 'all',
    timeRange: 'all',
    sortBy: 'newest',
  });
  
  // Debounced ticker value - initialize with same value as filters.ticker
  const [debouncedTicker, setDebouncedTicker] = useState(filters.ticker);

  // Debounce ticker input (wait 500ms after user stops typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTicker(filters.ticker);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [filters.ticker]);

  // Reset cursor and predictions when debouncedTicker changes (after debounce completes)
  useEffect(() => {
    // Don't reset on initial mount (when both are empty)
    if (debouncedTicker === '' && filters.ticker === '') {
      return;
    }
    
    if (debouncedTicker !== filters.ticker) {
      // Still debouncing, don't reset yet
      return;
    }
    
    // Debounce complete, reset for new search
    setCursor(null);
    setPredictions([]);
  }, [debouncedTicker]);

  useEffect(() => {
    async function fetchPredictions() {
      setIsLoading(true);
      try {
        // Build query string
        const params = new URLSearchParams();
        
        // Add cursor if it exists (for subsequent pages)
        if (cursor) {
          params.append('cursor', cursor);
        }
        
        params.append('limit', '20');
        
        // Add filters (use debouncedTicker instead of filters.ticker)
        if (debouncedTicker) params.append('ticker', debouncedTicker);
        if (filters.status !== 'all') params.append('status', filters.status);
        if (filters.direction !== 'all') params.append('direction', filters.direction);
        if (filters.userType !== 'all') params.append('userType', filters.userType);
        if (filters.timeRange !== 'all') params.append('timeRange', filters.timeRange);
        if (filters.sortBy !== 'newest') params.append('sortBy', filters.sortBy);

        const response = await fetch(`/api/feed/global?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          // If cursor is null, this is the first page - replace data
          // Otherwise, append to existing data
          setPredictions(prev => cursor === null ? data.data : [...prev, ...data.data]);
          setHasMore(data.pagination.hasMore);
        }
      } catch (error) {
        console.error('Failed to fetch global feed:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPredictions();
  }, [cursor, debouncedTicker, filters.status, filters.direction, filters.userType, filters.timeRange, filters.sortBy]);

  const loadMore = () => {
    if (predictions.length > 0) {
      // Set cursor to the timestamp of the last prediction
      const lastPrediction = predictions[predictions.length - 1];
      setCursor(lastPrediction.createdAt);
    }
  };

  const handleFollow = async (predictionId: string) => {
    try {
      // TODO: Implement follow API call
      console.log('Following prediction:', predictionId);
      alert('追蹤功能開發中...');
    } catch (error) {
      console.error('Follow failed:', error);
      alert('追蹤失敗，請稍後再試');
    }
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    // Only reset cursor and predictions for non-ticker filters
    // Ticker filter uses debouncing, so it handles its own reset
    if (key !== 'ticker') {
      setCursor(null);
      setPredictions([]);
    }
  };

  const clearFilters = () => {
    setFilters({
      ticker: '',
      status: 'all',
      direction: 'all',
      userType: 'all',
      timeRange: 'all',
      sortBy: 'newest',
    });
    setCursor(null); // Reset cursor
    setPredictions([]); // Clear existing predictions
  };

  // Check if any filters are active
  const hasActiveFilters = 
    debouncedTicker !== '' ||
    filters.status !== 'all' ||
    filters.direction !== 'all' ||
    filters.userType !== 'all' ||
    filters.timeRange !== 'all' ||
    filters.sortBy !== 'newest';

  if (isLoading && cursor === null) {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          全球動態
        </h2>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          🔍 篩選
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
              {Object.values(filters).filter(v => v !== 'all' && v !== '' && v !== 'newest').length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Ticker Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                股票代號
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="例如: 2330"
                  value={filters.ticker}
                  onChange={(e) => updateFilter('ticker', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {filters.ticker !== debouncedTicker && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              {filters.ticker && filters.ticker !== debouncedTicker && (
                <p className="text-xs text-gray-500 mt-1">正在搜尋...</p>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                狀態
              </label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部</option>
                <option value="pending">進行中</option>
                <option value="resolved">已結算</option>
              </select>
            </div>

            {/* Direction Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                方向
              </label>
              <select
                value={filters.direction}
                onChange={(e) => updateFilter('direction', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部</option>
                <option value="bull">看漲 🐂</option>
                <option value="bear">看跌 🐻</option>
              </select>
            </div>

            {/* User Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用戶類型
              </label>
              <select
                value={filters.userType}
                onChange={(e) => updateFilter('userType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部</option>
                <option value="new">新版用戶</option>
                <option value="legacy">舊版用戶</option>
              </select>
            </div>

            {/* Time Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                時間範圍
              </label>
              <select
                value={filters.timeRange}
                onChange={(e) => updateFilter('timeRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部</option>
                <option value="today">今天</option>
                <option value="week">本週</option>
                <option value="month">本月</option>
              </select>
            </div>

            {/* Sort By Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                排序方式
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">最新</option>
                <option value="popular">最熱門</option>
                <option value="ending-soon">即將結算</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                清除所有篩選
              </button>
            </div>
          )}
        </div>
      )}

      {/* Predictions List */}
      <div className="space-y-4">
        {predictions.map((pred) => (
          <PredictionCard
            key={pred._id}
            prediction={pred}
            onFollow={handleFollow}
          />
        ))}
      </div>

      {/* Empty State */}
      {!isLoading && predictions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">找不到符合條件的預測</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              清除篩選條件
            </button>
          )}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && predictions.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isLoading ? '載入中...' : '載入更多'}
          </button>
        </div>
      )}
    </div>
  );
}