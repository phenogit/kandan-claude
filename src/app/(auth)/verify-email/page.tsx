// src/app/auth/verify-email/page.tsx - UPDATED VERSION
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('缺少驗證令牌');
    }
  }, [token]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`);
      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?verified=true');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || '驗證失敗');
      }
    } catch (error) {
      setStatus('error');
      setMessage('驗證過程發生錯誤，請稍後再試');
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    setResendMessage('');

    try {
      // Get email from user (you might want to store this in state or get from URL)
      const email = prompt('請輸入您的電子郵件地址：');
      
      if (!email) {
        setResendLoading(false);
        return;
      }

      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setResendMessage('驗證郵件已重新發送！請檢查您的信箱');
      } else {
        setResendMessage(data.error || '發送失敗，請稍後再試');
      }
    } catch (error) {
      setResendMessage('發送過程發生錯誤');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Logo/Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">股票預測平台</h1>
            <p className="text-gray-600 mt-2">電子郵件驗證</p>
          </div>

          {/* Status Content */}
          {status === 'loading' && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">正在驗證您的電子郵件...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">驗證成功！</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500 mb-4">正在跳轉到登入頁面...</p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                立即登入
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">驗證失敗</h2>
              <p className="text-gray-600 mb-6">{message}</p>

              {/* Resend Button */}
              <button
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="w-full mb-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? '發送中...' : '重新發送驗證郵件'}
              </button>

              {resendMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  resendMessage.includes('成功') 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}>
                  {resendMessage}
                </div>
              )}

              <Link
                href="/signup"
                className="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm"
              >
                返回註冊頁面
              </Link>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>需要協助？</p>
          <Link href="/help" className="text-blue-600 hover:text-blue-800">
            聯繫客服
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}