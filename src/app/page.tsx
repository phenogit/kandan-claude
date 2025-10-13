// src/app/page.tsx
import Link from 'next/link';
import MostPredictedStocks from '@/components/home/MostPredictedStocks';
import MostFollowedPredictions from '@/components/home/MostFollowedPredictions';
import MostSuccessfulUsers from '@/components/home/MostSuccessfulUsers';
import GlobalFeed from '@/components/home/GlobalFeed';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">
                股票預測平台
              </span>
            </Link>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* Notifications (placeholder) */}
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {/* Badge */}
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Auth buttons */}
              <Link
                href="/login"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                登入
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                註冊
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Tabs */}
        <div className="lg:hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-8">
              <button className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600">
                動態
              </button>
              <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                統計
              </button>
            </nav>
          </div>
        </div>

        {/* Desktop: Three Column Layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left Sidebar - Desktop only */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-8 space-y-6">
              <MostPredictedStocks />
            </div>
          </aside>

          {/* Main Feed */}
          <div className="lg:col-span-6 space-y-8">
            {/* Mobile: Most Predicted Stocks */}
            <div className="lg:hidden">
              <MostPredictedStocks />
            </div>

            {/* Most Followed Predictions */}
            <MostFollowedPredictions />

            {/* Most Successful Users */}
            <MostSuccessfulUsers />

            {/* Global Feed */}
            <GlobalFeed />
          </div>

          {/* Right Sidebar - Desktop only */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-8 space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  平台統計
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">總預測</span>
                    <span className="text-sm font-semibold text-gray-900">38,393</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">活躍用戶</span>
                    <span className="text-sm font-semibold text-gray-900">2,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">平台準確率</span>
                    <span className="text-sm font-semibold text-green-600">62.5%</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}