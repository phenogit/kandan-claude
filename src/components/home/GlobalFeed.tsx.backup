// src/components/home/GlobalFeed.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

  const handleFollow = async (predictionId: string) => {
    try {
      // TODO: Implement follow API call
      console.log('Following prediction:', predictionId);
      // const response = await fetch('/api/predictions/follow', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ predictionId }),
      // });
      alert('追蹤功能開發中...');
    } catch (error) {
      console.error('Follow failed:', error);
      alert('追蹤失敗，請稍後再試');
    }
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
          <PredictionCard
            key={pred._id}
            prediction={pred}
            onFollow={handleFollow}
          />
        ))}
      </div>

      {hasMore && (
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

// Separate PredictionCard component for better organization
interface PredictionCardProps {
  prediction: Prediction;
  onFollow: (predictionId: string) => void;
}

function PredictionCard({ prediction, onFollow }: PredictionCardProps) {
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
    <Link 
      href={`/prediction/${prediction._id}`}
      className="block border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {/* User Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-600">
              {prediction.userName.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              @{prediction.userName}
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
      <div className="mb-4">
        {/* Stock Info */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">
            {prediction.direction === 1 ? '🐂' : '🐻'}
          </span>
          <h3 className="text-lg font-bold text-gray-900">
            {prediction.ticker} {prediction.tickerName}
          </h3>
        </div>

        {/* Visual Price Indicator */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>地板</span>
            <span className="font-medium text-blue-600">↑ 目前</span>
            <span>天花板</span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-2 bg-gray-200 rounded-full mb-1">
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-md transition-all"
              style={{ left: `${clampedProgress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-900">${prediction.floor}</span>
            <span className="font-bold text-blue-600">${prediction.currentPrice}</span>
            <span className="text-gray-900">${prediction.ceiling}</span>
          </div>
          
          <div className="text-xs text-gray-500 mt-1">
            起始: ${prediction.startPrice}
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-3">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            prediction.status === 'pending' 
              ? 'bg-orange-100 text-orange-700' 
              : prediction.status.includes('success')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {prediction.status === 'pending' ? '進行中' : 
             prediction.status.includes('success') ? '成功' : '失敗'}
          </span>
        </div>
      </div>

      {/* Action Buttons - Prevent link navigation */}
      <div 
        className="flex gap-2"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // This button now just navigates (redundant with card click)
            // You can either remove it or keep it for explicit action
            window.location.href = `/prediction/${prediction._id}`;
          }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
        >
          👁️ 查看詳情
        </button>
        
        {prediction.status === 'pending' && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFollow(prediction._id);
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            追蹤
          </button>
        )}
      </div>
    </Link>
  );
}