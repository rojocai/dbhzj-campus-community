"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowLeftIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import BadgeDisplay from "@/components/BadgeDisplay";
import { useLang } from "@/lib/lang/LangContext";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { t, lang } = useLang();

  const { data: user, error, isLoading } = useSWR(`/api/users/${id}`, fetcher);
  const { data: badges } = useSWR(`/api/users/${id}/badges`, fetcher);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-2xl mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('user.notFound')}</h2>
        <p className="text-gray-500 mb-6">{t('user.notFoundDesc')}</p>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {t('user.backToFeed')}
        </Link>
      </div>
    );
  }

  const postCount = user._count?.posts || 0;
  const followerCount = user._count?.followers || 0;
  const followingCount = user._count?.follows || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link
        href="/feed"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        {t('user.backToFeed')}
      </Link>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm mb-6">
        {/* Cover */}
        <div className="h-40 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end -mt-16 mb-4">
            <div className="w-28 h-28 rounded-2xl bg-white p-1.5 shadow-lg">
              <div className="w-full h-full rounded-xl bg-indigo-100 flex items-center justify-center overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="w-14 h-14 text-indigo-400" />
                )}
              </div>
            </div>
            <div className="ml-5 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {user.nickname || user.username}
              </h1>
              <p className="text-sm text-gray-500">
                @{user.username}
                {user.grade && ` · ${user.grade}`}
                {user.class_ && ` · ${user.class_}`}
              </p>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-gray-600 mb-4 max-w-2xl">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-1.5 text-gray-500">
              <FireIcon className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-gray-900">Lv.{user.level}</span>
              <span className="text-gray-400">· {user.experience} {t('user.experience')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <CalendarDaysIcon className="w-4 h-4 text-indigo-500" />
              <span>
                {t('user.joinedAt', {
                  date: new Date(user.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : "zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-3 text-sm">
            <span className="text-gray-500">
              <span className="font-semibold text-gray-900">{postCount}</span>{' '}
              {t('user.posts')}
            </span>
            <span className="text-gray-500">
              <span className="font-semibold text-gray-900">
                {followerCount}
              </span>{' '}
              {t('user.followers')}
            </span>
            <span className="text-gray-500">
              <span className="font-semibold text-gray-900">
                {followingCount}
              </span>{' '}
              {t('user.following')}
            </span>
            <span className="text-gray-500">
              💰 <span className="font-semibold text-gray-900">{user.coins}</span> {t('user.coins')}
            </span>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5 text-indigo-500" />
          {t('user.badges')}
          {badges && badges.length > 0 && (
            <span className="text-sm font-normal text-gray-400">
              ({badges.length})
            </span>
          )}
        </h2>
        <BadgeDisplay badges={badges || []} size="md" />
      </div>

      {/* User's Posts */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AcademicCapIcon className="w-5 h-5 text-indigo-500" />
          {t('user.recentPosts')}
        </h2>

        {user.posts && user.posts.length > 0 ? (
          <div className="space-y-3">
            {user.posts.map((post: any) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-5 card-hover"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                      <span>❤️ {post.likesCount}</span>
                      <span>💬 {post.commentsCount}</span>
                      <span>👁️ {post.views}</span>
                      {post.category && (
                        <span
                          className="ml-auto"
                          style={{ color: post.category.color }}
                        >
                          {post.category.icon} {post.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                  {post.images?.length > 0 && (
                    <img
                      src={post.images[0]}
                      alt=""
                      className="w-20 h-20 rounded-lg object-cover border border-gray-100 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">
            <p className="text-sm">{t('user.noPosts')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
