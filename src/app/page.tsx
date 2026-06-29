"use client";

import Link from "next/link";
import useSWR from "swr";
import { useState, useEffect, useRef } from "react";
import {
  AcademicCapIcon,
  SparklesIcon,
  UserGroupIcon,
  ArrowRightIcon,
  MegaphoneIcon,
  InformationCircleIcon,
  CakeIcon,
} from "@heroicons/react/24/outline";
import Fireworks from "@/components/Fireworks";
import StyledText from "@/components/StyledText";
import { useLang } from "@/lib/lang/LangContext";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const categoryColors: Record<string, { color: string; bgColor: string; textColor: string }> = {
  "校园生活": { color: "from-indigo-500 to-purple-600", bgColor: "bg-indigo-50", textColor: "text-indigo-600" },
  "学习交流": { color: "from-amber-500 to-orange-600", bgColor: "bg-amber-50", textColor: "text-amber-600" },
  "社团活动": { color: "from-emerald-500 to-teal-600", bgColor: "bg-emerald-50", textColor: "text-emerald-600" },
  "游戏讨论区": { color: "from-violet-500 to-purple-600", bgColor: "bg-violet-50", textColor: "text-violet-600" },
  "灌水乐园": { color: "from-cyan-500 to-sky-600", bgColor: "bg-cyan-50", textColor: "text-cyan-600" },
};

const defaultCategory = { color: "from-gray-500 to-slate-600", bgColor: "bg-gray-50", textColor: "text-gray-600" };

const CATEGORY_EN: Record<string, string> = {
  "校园生活": "Campus Life",
  "学习交流": "Study & Exchange",
  "社团活动": "Club Activities",
  "游戏讨论区": "Gaming Discussion",
  "灌水乐园": "Chat Zone",
};

export default function HomePage() {
  const { data: postsData, error: postsError } = useSWR(
    "/api/posts?limit=5&sort=latest",
    fetcher
  );
  const { data: categoriesData } = useSWR("/api/categories", fetcher);
  const { data: announcementsData } = useSWR("/api/announcements", fetcher);
  const { data: siteConfig } = useSWR("/api/site-config", fetcher);
  const { t, lang } = useLang();

  const posts = postsData?.posts || [];
  const announcements = announcementsData?.announcements || [];
  const { data: birthdayData } = useSWR("/api/birthdays/today", fetcher, { refreshInterval: 60000 });
  const birthdayUsers = birthdayData?.users || [];
  const [birthdayPostId, setBirthdayPostId] = useState<string | null>(null);

  // Search for birthday post to link to
  useEffect(() => {
    if (birthdayUsers.length > 0 && postsData?.posts) {
      const displayNames = birthdayUsers.map((u: any) => u.nickname || u.username);
      for (const p of postsData.posts) {
        for (const name of displayNames) {
          if (p.title.includes(name) && p.title.includes("生日")) {
            setBirthdayPostId(p.id);
            return;
          }
        }
      }
    }
  }, [birthdayUsers, postsData]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={siteConfig?.heroBgEnabled ? {
        background: `linear-gradient(135deg, ${siteConfig.heroBgColor1 || '#4f46e5'} 0%, ${siteConfig.heroBgColor2 || '#7c3aed'} 50%, ${siteConfig.heroBgColor3 || '#6366f1'} 100%)`,
        opacity: parseFloat(siteConfig.heroBgOpacity || '1'),
        filter: `brightness(${siteConfig.heroBgBrightness || '1'})`,
      } : {}}>
        {!siteConfig?.heroBgEnabled && <div className="hero-gradient absolute inset-0"></div>}
        <div className={`absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30 ${siteConfig?.heroBgBlur && parseFloat(siteConfig.heroBgBlur) > 0 ? 'backdrop-blur-sm' : ''}`}
          style={siteConfig?.heroBgBlur && parseFloat(siteConfig.heroBgBlur) > 0 ? {
            filter: `blur(${siteConfig.heroBgBlur}px)`,
            opacity: parseFloat(siteConfig.heroBgOpacity || '1'),
          } : {}}
        ></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white/90 font-medium whitespace-nowrap text-xs sm:text-sm">
                <SparklesIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <StyledText siteConfig={siteConfig} textKey="heroTitle">
                  {(lang === 'en' || !siteConfig?.heroWelcome) ? t('siteContent.heroWelcome') : siteConfig.heroWelcome}
                </StyledText>
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              <StyledText siteConfig={siteConfig} textKey="heroSubtitle" as="span">
                {(lang === 'en' || !siteConfig?.siteSubtitle) ? t('siteContent.siteSubtitle') : siteConfig.siteSubtitle.replace(/[，,]\s*/g, '，\\n')}
              </StyledText>
            </h1>
            {siteConfig?.siteImage && (
              <div className="mb-8 flex justify-center">
                <img
                  src={siteConfig.siteImage}
                  alt={siteConfig?.siteTitle || t('siteContent.siteTitle')}
                  className="max-w-full max-h-64 rounded-2xl shadow-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
            <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto mb-10 leading-relaxed">
              <StyledText siteConfig={siteConfig} textKey="heroTagline1">
                {(lang === 'en' || !siteConfig?.heroTagline1) ? t('siteContent.heroTagline1') : siteConfig.heroTagline1}
              </StyledText>
              <br />
              <StyledText siteConfig={siteConfig} textKey="heroTagline2">
                {(lang === 'en' || !siteConfig?.heroTagline2) ? t('siteContent.heroTagline2') : siteConfig.heroTagline2}
              </StyledText>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/feed"
                className="px-8 py-3.5 rounded-xl bg-white text-indigo-700 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                {t('home.browseFeed')}
              </Link>
              <Link
                href="/create"
                className="px-8 py-3.5 rounded-xl bg-white/20 backdrop-blur-sm text-white font-semibold border border-white/30 hover:bg-white/30 hover:scale-105 transition-all duration-200"
              >
                {t('home.createPost')}
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#f8fafc] to-transparent"></div>
      </section>

      {/* Birthday Banner */}
      {birthdayUsers.length > 0 && birthdayPostId && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 mb-8">
          <Link
            href={`/post/${birthdayPostId}`}
            className="block bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 rounded-xl p-4 shadow-lg overflow-hidden group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <CakeIcon className="w-8 h-8 text-white/90" />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="whitespace-nowrap animate-marquee inline-block">
                  <span className="text-white font-bold text-lg">
                    🎂{' '}
                    {birthdayUsers.map((u: any, i: number) => (
                      <span key={u.id}>
                        {u.nickname || u.username}（{u.grade || ''}{u.class_ || ''}）
                        {i < birthdayUsers.length - 1 ? ' · ' : ''}
                      </span>
                    ))}
                    {' '}{t('home.birthdayBanner')}
                    {'  '}
                    {Array.from({ length: 3 }).map((_, i) => (
                      <span key={i}>🎂 🎉 🎊 💝 {'  '}</span>
                    ))}
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                <span className="text-white/80 text-sm group-hover:underline">{t('home.viewDetail')}</span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 mb-12">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <MegaphoneIcon className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 text-sm mb-1">{t('home.announcement')}</h3>
              {announcements.map((a: any) => (
                <p key={a.id} className="text-sm text-amber-700">
                  {a.title} — {a.content}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {t('home.exploreCommunity')}
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            {t('home.exploreDesc')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!categoriesData ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-gray-50 border border-gray-100 p-6">
                <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))
          ) : (
            categoriesData?.map((cat: any) => {
              const colors = categoryColors[cat.name] || defaultCategory;
              const displayName = lang === 'en' ? (CATEGORY_EN[cat.name] || cat.name) : cat.name;
              return (
                <Link
                  key={cat.id}
                  href={`/feed?category=${encodeURIComponent(cat.name)}`}
                  className={`group relative overflow-hidden rounded-2xl ${colors.bgColor} border border-gray-100 p-6 card-hover`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl">{cat.icon}</span>
                    {cat._count?.posts > 0 && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/80 text-gray-500">
                        {t('home.postsCount', { count: cat._count.posts })}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {displayName}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {cat.description || ''}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t('home.browseCategory')} <ArrowRightIcon className="w-4 h-4" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* Recent Posts */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {t('home.latestPosts')}
              </h2>
              <p className="text-gray-500">{t('home.latestPostsDesc')}</p>
            </div>
            <Link
              href="/feed"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              {t('home.viewAll')} <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {postsError && (
            <div className="text-center py-12 text-gray-400">
              {t('home.loadFailed')}
            </div>
          )}

          {!postsData && !postsError && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-gray-50 rounded-xl p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          )}

          {postsData && posts.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">{t('home.noPosts')}</p>
              <Link
                href="/create"
                className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
              >
                {t('home.createPost')}
              </Link>
            </div>
          )}

          {posts.length > 0 && (
            <div className="space-y-4">
              {posts.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="block bg-white border border-gray-100 rounded-xl p-5 card-hover"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Link href={`/user/${post.author?.id}`}>
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                      {post.author?.avatarUrl ? (
                        <img
                          src={post.author.avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-indigo-600">
                          {post.author?.nickname?.[0] || "?"}
                        </span>
                      )}
                    </div>
                  </Link>
                  <Link
                    href={`/user/${post.author?.id}`}
                    className="text-sm font-medium text-gray-700 hover:text-indigo-600"
                  >
                    {post.author?.nickname || post.author?.username}
                  </Link>
                    <span className="text-xs text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : "zh-CN")}
                    </span>
                    {post.category && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: post.category.color + "15",
                          color: post.category.color,
                        }}
                      >
                        {post.category.icon} {post.category.name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                    {post.title}
                  </h3>
                  <div className="flex gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {post.content}
                      </p>
                      {post.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {post.images?.length > 0 && (
                      <div className="shrink-0">
                        <img
                          src={post.images[0]}
                          alt=""
                          className="w-20 h-20 rounded-lg object-cover border border-gray-100"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>❤️ {post.likesCount}</span>
                    <span>💬 {post.commentsCount}</span>
                    <span>👁️ {post.views}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link
              href="/feed"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600"
            >
              {t('home.viewAll')} <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      {siteConfig && !siteConfig.error && (
        <section className="bg-white py-16 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-10">
              {siteConfig.aboutImage && (
                <div className="md:w-1/2 shrink-0">
                  <img
                    src={siteConfig.aboutImage}
                    alt={siteConfig.aboutTitle || t('siteContent.aboutTitle')}
                    className="w-full rounded-2xl shadow-lg object-cover max-h-96"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
              <div className={siteConfig.aboutImage ? 'md:w-1/2' : 'w-full max-w-3xl mx-auto text-center'}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-4">
                  <InformationCircleIcon className="w-4 h-4" />
                  {(lang === 'en' || !siteConfig?.aboutTitle) ? t('siteContent.aboutTitle') : siteConfig.aboutTitle}
                </div>
                <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                  {(lang === 'en' || !siteConfig?.aboutContent) ? t('siteContent.aboutContent') : siteConfig.aboutContent}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20" style={siteConfig?.heroBgEnabled ? {
        background: `linear-gradient(135deg, ${siteConfig.heroBgColor1 || '#4f46e5'} 0%, ${siteConfig.heroBgColor2 || '#7c3aed'} 50%, ${siteConfig.heroBgColor3 || '#6366f1'} 100%)`,
        filter: `brightness(${siteConfig.heroBgBrightness || '1'})`,
      } : {}}>
        {!siteConfig?.heroBgEnabled && <div className="hero-gradient py-20 -my-20"></div>}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            <StyledText siteConfig={siteConfig} textKey="heroJoinTitle">
              {(lang === 'en' || !siteConfig?.heroJoinTitle) ? t('siteContent.heroJoinTitle') : siteConfig.heroJoinTitle}
            </StyledText>
          </h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-xl mx-auto">
            <StyledText siteConfig={siteConfig} textKey="heroJoinSubtitle">
              {(lang === 'en' || !siteConfig?.heroJoinSubtitle) ? t('siteContent.heroJoinSubtitle') : siteConfig.heroJoinSubtitle}
            </StyledText>
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-indigo-700 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <UserGroupIcon className="w-5 h-5" />
            {t('home.registerNow')}
          </Link>
        </div>
      </section>
      <Fireworks />
    </div>
  );
}
