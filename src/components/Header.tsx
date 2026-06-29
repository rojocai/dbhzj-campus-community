"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import useSWR from "swr";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { useLang } from "@/lib/lang/LangContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Header() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: siteConfig } = useSWR("/api/site-config", fetcher);
  const { t } = useLang();

  const user = session?.user as any;
  const siteTitle = siteConfig?.toolbarTitle || siteConfig?.siteTitle || t('site.title');
  const toolbarLogo = siteConfig?.toolbarLogo || '';
  const logoInitial = toolbarLogo ? '' : (siteTitle.charAt(0));

  const navLinks = [
    { href: "/", label: t('nav.home') },
    { href: "/feed", label: t('nav.feed') },
    { href: "/checkin", label: t('nav.checkin') },
    { href: "/create", label: t('nav.create') },
    { href: "/about", label: t('nav.about') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {toolbarLogo ? (
              <img
                src={toolbarLogo}
                alt={siteTitle}
                className="w-9 h-9 rounded-lg object-cover shadow-md"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {logoInitial}
              </div>
            )}
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
              {siteTitle}
            </span>

          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Area */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <ShieldCheckIcon className="w-4 h-4" />
                    {t('nav.admin')}
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-6 h-6 text-indigo-500" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {user.name || user.username}
                  </span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  {t('nav.signout')}
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/signin"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  {t('nav.signin')}
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  {t('nav.signup')}
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label={t('nav.menuLabel')}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-gray-100" />
            {user ? (
              <>
                <Link
                  href="/checkin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                >
                  <CalendarDaysIcon className="w-5 h-5" />
                  {t('nav.dailyCheckin')}
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                >
                  <UserCircleIcon className="w-5 h-5" />
                  {t('nav.profile')}
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-50"
                  >
                    <ShieldCheckIcon className="w-5 h-5" />
                    {t('nav.adminFull')}
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 w-full"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  {t('nav.signoutFull')}
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  href="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                >
                  {t('nav.signin')}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {t('nav.signup')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
