// src/app/(auth)/test/page.tsx
import OAuthButtons from '@/components/auth/OAuthButtons';

export default function TestPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">OAuth Buttons Test</h1>
      <OAuthButtons />
    </div>
  );
}