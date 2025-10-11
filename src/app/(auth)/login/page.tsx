// src/app/(auth)/login/page.tsx
import LoginForm from '@/components/auth/LoginForm';
import OAuthButtons from '@/components/auth/OAuthButtons';

export const metadata = {
  title: '登入 | 股票預測平台',
  description: '登入您的帳號開始預測股票',
};

export default function LoginPage() {
  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          歡迎回來
        </h1>
        <p className="text-text-secondary">
          登入您的帳號繼續使用
        </p>
      </div>

      {/* OAuth Buttons */}
      <div className="mb-6">
        <OAuthButtons />
      </div>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-text-secondary">
            或使用電子郵件
          </span>
        </div>
      </div>

      {/* Login Form */}
      <LoginForm />
    </div>
  );
}