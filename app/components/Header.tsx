"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import type { User } from "../types";

interface HeaderProps {
  className?: string;
}

interface UserDisplayProps {
  user: User;
  onLogout: () => Promise<void>;
}

interface NavigationItem {
  href: string;
  label: string;
}

const navigationItems: NavigationItem[] = [
  { href: "/karte", label: "AIカード" },
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/news", label: "ニュース" },
  { href: "/ranking", label: "ランキング" },
];

const UserDisplay: React.FC<UserDisplayProps> = ({ user, onLogout }) => {
  const getInitials = useCallback((user: User): string => {
    if (user.displayName) {
      return user.displayName[0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  }, []);

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "User"}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
            {getInitials(user)}
          </div>
        )}
        <span className="text-sm text-gray-700 hidden sm:block">
          {user.displayName || user.email}
        </span>
      </div>
      <button
        onClick={onLogout}
        className="text-sm text-gray-600 hover:text-gray-900 transition"
        type="button"
      >
        ログアウト
      </button>
    </div>
  );
};

const Navigation: React.FC = () => (
  <nav className="hidden md:flex items-center space-x-6">
    {navigationItems.map(item => (
      <Link
        key={item.href}
        href={item.href}
        className="text-gray-600 hover:text-gray-900 transition"
      >
        {item.label}
      </Link>
    ))}
  </nav>
);

const GuestActions: React.FC = () => (
  <div className="flex items-center space-x-4">
    <Link
      href="/login"
      className="text-sm text-gray-600 hover:text-gray-900 transition"
    >
      ログイン
    </Link>
    <Link
      href="/login"
      className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
    >
      新規登録
    </Link>
  </div>
);

export default function Header({ className = "" }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [logout, router]);

  return (
    <header
      className={`bg-white shadow-sm border-b border-gray-200 ${className}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">📊</span>
            <span className="text-xl font-bold text-gray-900">
              株価分析AIカード
            </span>
          </Link>

          {/* ナビゲーション */}
          <Navigation />

          {/* ユーザー情報 */}
          {user ? (
            <UserDisplay user={user} onLogout={handleLogout} />
          ) : (
            <GuestActions />
          )}
        </div>
      </div>
    </header>
  );
}
