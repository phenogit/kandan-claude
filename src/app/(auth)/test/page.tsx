// src/app/(auth)/test/page.tsx
import LoginForm from '@/components/auth/LoginForm';

export default function TestPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">登入</h1>
      <LoginForm />
    </div>
  );
}