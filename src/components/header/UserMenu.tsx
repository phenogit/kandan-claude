// src/components/header/UserMenu.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

type UserMenuProps = {
  user: {
    id: string;
    username: string;
    email: string;
    name: string;
    image: string;
  };
};

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Generate initials for avatar
  const initials = user.name
    ? user.name.substring(0, 2).toUpperCase()
    : user.email.substring(0, 2).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {initials}
            </span>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">@{user.username}</p>
            <p className="text-xs text-gray-500 mt-1">{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href={`/profile/${user.username}`}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              我的個人檔案
            </Link>
            <Link
              href="/create-prediction"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              建立預測
            </Link>
            <Link
              href="/subscription"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              訂閱動態
            </Link>
            <Link
              href="/notifications"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              通知
            </Link>
            <Link
              href="/settings"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              設定
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-200 py-2">
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              登出
            </button>
          </div>
        </div>
      )}
    </div>
  );
}