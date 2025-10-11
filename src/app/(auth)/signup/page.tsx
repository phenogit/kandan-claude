// src/app/(auth)/signup/page.tsx
import SignupForm from '@/components/auth/SignupForm';
import OAuthButtons from '@/components/auth/OAuthButtons';
import Link from 'next/link';

export const metadata = {
  title: '註冊 | 股票預測平台',
  description: '建立新帳號開始分享您的股票預測',
};

export default function SignupPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          建立新帳號
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          加入社群，開始分享您的股票預測
        </p>
      </div>

      {/* OAuth Buttons */}
      <OAuthButtons />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-gray-500">
            或使用電子郵件註冊
          </span>
        </div>
      </div>

      {/* Signup Form */}
      <SignupForm />

      {/* Login Link */}
      <p className="text-center text-sm text-gray-600">
        已經有帳號了？{' '}
        <Link 
          href="/login" 
          className="font-semibold text-blue-600 hover:text-blue-500"
        >
          立即登入
        </Link>
      </p>
    </div>
  );
}