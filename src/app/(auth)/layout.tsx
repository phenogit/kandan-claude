// src/app/(auth)/layout.tsx
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-bull/5 flex flex-col">
      {/* Header */}
      <header className="w-full p-4 sm:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">📈</span>
            </div>
            <span className="text-xl font-bold text-text-primary">
              股票預測平台
            </span>
          </Link>
          
          <Link 
            href="/" 
            className="text-sm text-text-secondary hover:text-primary transition-colors"
          >
            返回首頁
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
            {children}
          </div>

          {/* Footer Text */}
          <p className="text-center text-sm text-text-secondary mt-6">
            繼續使用即表示您同意我們的
            <Link href="/terms" className="text-primary hover:underline ml-1">
              服務條款
            </Link>
            {' '}和{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              隱私政策
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-4 text-center text-sm text-text-secondary">
        <p>© 2025 股票預測平台. All rights reserved.</p>
      </footer>
    </div>
  );
}