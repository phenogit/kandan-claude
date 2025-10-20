// src/app/(auth)/verify-email/page.tsx
import Link from 'next/link';

export const metadata = {
  title: '驗證電子郵件 | 股票預測平台',
  description: '請檢查您的電子郵件以完成註冊',
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  // Await searchParams in Next.js 15
  const params = await searchParams;
  const email = params.email;

  return (
    <div className="w-full max-w-md space-y-8 text-center">
      {/* Success Icon */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg
          className="h-10 w-10 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
          />
        </svg>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          請檢查您的電子郵件
        </h1>
        {email && (
          <p className="mt-2 text-sm text-gray-600">
            我們已將驗證連結發送至：
            <br />
            <span className="font-semibold">{email}</span>
          </p>
        )}
      </div>

      {/* Instructions */}
      <div className="rounded-lg bg-blue-50 p-6 text-left">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          接下來的步驟：
        </h2>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="font-bold mr-2">1.</span>
            <span>開啟您的電子郵件收件匣</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">2.</span>
            <span>點擊驗證連結以啟用您的帳號</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">3.</span>
            <span>返回並登入開始使用平台</span>
          </li>
        </ol>
      </div>

      {/* Help Text */}
      <div className="text-sm text-gray-600">
        <p>沒有收到郵件？</p>
        <p className="mt-1">
          請檢查您的垃圾郵件資料夾，或{' '}
          <button className="text-blue-600 hover:text-blue-500 font-semibold">
            重新發送驗證郵件
          </button>
        </p>
      </div>

      {/* Action Links */}
      <div className="flex gap-4 justify-center">
        <Link
          href="/login"
          className="text-blue-600 hover:text-blue-500 font-semibold text-sm"
        >
          返回登入
        </Link>
        <span className="text-gray-300">|</span>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-500 font-semibold text-sm"
        >
          返回首頁
        </Link>
      </div>
    </div>
  );
}