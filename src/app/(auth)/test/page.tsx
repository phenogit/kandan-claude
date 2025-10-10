// src/app/(auth)/test/page.tsx
import SignupForm from '@/components/auth/SignupForm';

export default function TestPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">註冊</h1>
      <SignupForm />
    </div>
  );
}