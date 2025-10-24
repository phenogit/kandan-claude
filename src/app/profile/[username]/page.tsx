// src/app/profile/[username]/page.tsx
'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileHeader from '@/components/profile/ProfileHeader';

interface ProfileData {
  user: {
    _id: string;
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
  isSubscribed?: boolean;
  isOwnProfile: boolean;
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${username}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load profile');
        return;
      }

      setProfileData(data.data);
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!profileData) return;

    try {
      const action = profileData.isSubscribed ? 'unsubscribe' : 'subscribe';
      
      const response = await fetch(`/api/users/${username}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.error || 'Failed to update subscription');
        return;
      }

      // Update local state
      setProfileData(prev => prev ? {
        ...prev,
        isSubscribed: data.data.isSubscribed,
        stats: {
          ...prev.stats,
          subscriberCount: prev.stats.subscriberCount + (data.data.isSubscribed ? 1 : -1),
        }
      } : null);

      alert(data.message);
    } catch (err) {
      console.error('Error updating subscription:', err);
      alert('Failed to update subscription');
    }
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">找不到用戶</h2>
          <p className="text-gray-600 mb-4">{error || '用戶不存在'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Container */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <ProfileHeader
          user={profileData.user}
          stats={profileData.stats}
          isOwnProfile={profileData.isOwnProfile}
          isSubscribed={profileData.isSubscribed}
          onSubscribe={handleSubscribe}
          onEditProfile={handleEditProfile}
        />

        {/* Tabs Section - Coming Next */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">預測列表即將推出</p>
            <p className="text-sm">這裡將顯示用戶的所有預測</p>
          </div>
        </div>
      </div>
    </div>
  );
}