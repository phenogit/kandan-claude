import { User } from 'lucide-react';

interface ProfileHeaderProps {
  user: {
    username: string;
    displayName: string;
    bio?: string | null;
    avatarUrl?: string | null;
    isLegacy: boolean;
    joinedAt: string;
  };
  stats: {
    totalPredictions: number;
    resolvedPredictions: number;
    accuracyRate: number;
    avgProfitRate: number;
    currentStreak: number;
    highestStreak: number;
    subscriberCount: number;
    subscribedToCount: number;
  };
  isOwnProfile: boolean;
  isSubscribed?: boolean;
  onSubscribe?: () => void;
  onEditProfile?: () => void;
}

export default function ProfileHeader({
  user,
  stats,
  isOwnProfile,
  isSubscribed,
  onSubscribe,
  onEditProfile,
}: ProfileHeaderProps) {
  // Early return if no user data
  if (!user || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-TW', { 
        year: 'numeric', 
        month: 'long' 
      });
    } catch {
      return 'N/A';
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row gap-6 mb-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-100"
            />
          ) : (
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-100">
              {getInitials(user.displayName)}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                {user.displayName}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-600">@{user.username}</p>
                {user.isLegacy && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    Legacy
                  </span>
                )}
              </div>
            </div>

            {/* Action Button */}
            {isOwnProfile ? (
              <button
                onClick={onEditProfile}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                編輯個人檔案
              </button>
            ) : (
              <button
                onClick={onSubscribe}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  isSubscribed
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubscribed ? '已訂閱' : '訂閱'}
              </button>
            )}
          </div>

          {/* Bio */}
          {user.bio && user.bio.trim() && (
            <p className="text-gray-700 mt-3 mb-3 break-words">{user.bio}</p>
          )}

          {/* Join Date */}
          <p className="text-sm text-gray-500 mt-2">
            加入時間：{formatDate(user.joinedAt || new Date().toISOString())}
          </p>
        </div>
      </div>

      {/* Stats Grid - Responsive: 2x4 on mobile, 4x2 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-gray-200">
        {/* Total Predictions */}
        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
          <div className="text-sm text-gray-600 mb-1">總預測數</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalPredictions}
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
          <div className="text-sm text-gray-600 mb-1">已結算</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.resolvedPredictions}
          </div>
        </div>

        {/* Accuracy Rate */}
        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
          <div className="text-sm text-gray-600 mb-1">準確率</div>
          <div className="text-2xl font-bold text-green-600">
            {stats.accuracyRate.toFixed(1)}%
          </div>
        </div>

        {/* Average Profit */}
        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
          <div className="text-sm text-gray-600 mb-1">平均報酬</div>
          <div className={`text-2xl font-bold ${
            stats.avgProfitRate >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {stats.avgProfitRate >= 0 ? '+' : ''}{((stats.avgProfitRate || 0) * 100).toFixed(2)}%
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
          <div className="text-sm text-gray-600 mb-1">當前連勝</div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.currentStreak}
          </div>
        </div>

        {/* Highest Streak */}
        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
          <div className="text-sm text-gray-600 mb-1">最高連勝</div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.highestStreak}
          </div>
        </div>

        {/* Subscribers */}
        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer">
          <div className="text-sm text-gray-600 mb-1">訂閱者</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.subscriberCount}
          </div>
        </div>

        {/* Subscribed To */}
        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer">
          <div className="text-sm text-gray-600 mb-1">已訂閱</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.subscribedToCount}
          </div>
        </div>
      </div>
    </div>
  );
}