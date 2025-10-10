// src/components/auth/SignupForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('密碼不一致');
      return;
    }

    if (formData.password.length < 8) {
      setError('密碼必須至少 8 個字元');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName || formData.username,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success message and redirect to login
        alert('註冊成功！請登入');
        router.push('/login');
      } else {
        setError(data.error || '註冊失敗');
      }
    } catch (err) {
      setError('註冊失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-2">
          使用者名稱 *
        </label>
        <input
          id="username"
          type="text"
          required
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="username"
          disabled={loading}
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_]+"
          title="只能包含字母、數字和底線"
        />
        <p className="text-xs text-text-secondary mt-1">
          3-30 個字元，只能使用字母、數字和底線
        </p>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
          電子郵件 *
        </label>
        <input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="your@email.com"
          disabled={loading}
        />
      </div>

      {/* Display Name (Optional) */}
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-text-primary mb-2">
          顯示名稱 <span className="text-text-secondary">(可選)</span>
        </label>
        <input
          id="displayName"
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="您的顯示名稱"
          disabled={loading}
          maxLength={100}
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
          密碼 *
        </label>
        <input
          id="password"
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="••••••••"
          disabled={loading}
          minLength={8}
        />
        <p className="text-xs text-text-secondary mt-1">
          至少 8 個字元
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
          確認密碼 *
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="••••••••"
          disabled={loading}
          minLength={8}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-fail/10 border border-fail/20 rounded-lg">
          <p className="text-sm text-fail">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            註冊中...
          </span>
        ) : (
          '註冊'
        )}
      </button>

      {/* Login Link */}
      <p className="text-center text-sm text-text-secondary">
        已經有帳號？
        <Link href="/login" className="text-primary font-medium hover:underline ml-1">
          登入
        </Link>
      </p>
    </form>
  );
}