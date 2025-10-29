// src/app/(auth)/check-email/page.tsx
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResendEmail = async () => {
    if (!email) {
      setResendMessage('無法重新發送，請返回註冊頁面重試');
      return;
    }

    setResendLoading(true);
    setResendMessage('');

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setResendMessage('✅ 驗證郵件已重新發送，請檢查您的信箱');
      } else {
        setResendMessage('❌ ' + (data.error || '發送失敗，請稍後再試'));
      }
    } catch (error) {
      setResendMessage('❌ 發送失敗，請稍後再試');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Success Icon */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              檢查您的電子郵件
            </h2>

            {email && (
              <p className="text-gray-600 mb-4">
                我們已發送驗證連結至
                <br />
                <span className="font-semibold text-blue-600">{email}</span>
              </p>
            )}

            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">接下來該做什麼？</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>打開您的電子郵件收件匣</li>
                <li>找到來自股票預測平台的郵件</li>
                <li>點擊郵件中的「驗證電子郵件」按鈕</li>
                <li>返回並登入您的帳號</li>
              </ol>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                沒有收到郵件？
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                <li>檢查垃圾郵件或促銷資料夾</li>
                <li>確認電子郵件地址輸入正確</li>
                <li>等待幾分鐘，郵件可能延遲送達</li>
                <li>點擊下方按鈕重新發送</li>
              </ul>
            </div>

            {/* Resend Button */}
            <button
              onClick={handleResendEmail}
              disabled={resendLoading || !email}
              className="w-full mb-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {resendLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  發送中...
                </span>
              ) : (
                '重新發送驗證郵件'
              )}
            </button>

            {/* Resend Message */}
            {resendMessage && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${
                resendMessage.includes('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {resendMessage}
              </div>
            )}

            {/* Return to Login */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">已經驗證了？</p>
              <Link
                href="/login"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                前往登入
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
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

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CheckEmailContent />
    </Suspense>
  );
}