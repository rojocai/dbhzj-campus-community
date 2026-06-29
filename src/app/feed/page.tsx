"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import {
  FunnelIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useLang } from "@/lib/lang/LangContext";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const getSortOptions = (t: (key: string) => string) => [
  { value: "latest", label: t('feed.sortLatest') },
  { value: "hot", label: t('feed.sortHot') },
  { value: "essence", label: t('feed.sortEssence') },
];

export default function FeedPage() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const { t, lang } = useLang();

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeSort, setActiveSort] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data: categoriesData } = useSWR("/api/categories", fetcher);
  const categories = categoriesData || [];

  // Find category by name
  const activeCategoryObj = categories.find(
    (c: any) => c.name === activeCategory
  );
  const categoryId = activeCategoryObj?.id || "";

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", "12");
  queryParams.set("sort", activeSort);
  if (categoryId) queryParams.set("categoryId", categoryId);
  if (searchQuery) queryParams.set("search", searchQuery);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/posts?${queryParams.toString()}`,
    fetcher
  );

  const posts = data?.posts || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  useEffect(() => {
    setPage(1);
  }, [activeCategory, activeSort, searchQuery]);

  const sortOptions = getSortOptions(t);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('feed.title')}</h1>
        <p className="text-gray-500">{t('feed.subtitle')}</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={t('feed.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => setActiveCategory("")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !activeCategory
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {t('feed.allCategories')}
        </button>
        {categories.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.name)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeCategory === cat.name
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Sort & Info Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveSort(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeSort === opt.value
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => mutate()}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            title={t('feed.refresh')}
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
          {pagination.total > 0 && (
            <span className="text-xs text-gray-400">
              {t('feed.totalPosts', { count: pagination.total })}
            </span>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
              <div className="flex gap-4">
                <div className="h-3 bg-gray-200 rounded w-12"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-4">{t('feed.loadFailed')}</p>
          <button
            onClick={() => mutate()}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
          >
            {t('feed.reload')}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && posts.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t('feed.noPosts')}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery
              ? t('feed.noPostsMatch')
              : t('feed.noPostsYet')}
          </p>
          <Link
            href="/create"
            className="inline-block px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
          >
            {t('feed.createPost')}
          </Link>
        </div>
      )}

      {/* Post Grid */}
      {!isLoading && !error && posts.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post: any) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-5 card-hover"
              >
                {/* Author */}
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
                  <div className="min-w-0">
                    <Link
                      href={`/user/${post.author?.id}`}
                      className="text-sm font-medium text-gray-700 hover:text-indigo-600 truncate block"
                    >
                      {post.author?.nickname || post.author?.username}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : "zh-CN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {post.isEssence && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium shrink-0">
                      {t('feed.essence')}
                    </span>
                  )}
                  {post.isPinned && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium shrink-0">
                      {t('feed.pinned')}
                    </span>
                  )}
                </div>

                {/* Title & Content */}
                <div className="flex gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                  {post.images?.length > 0 && (
                    <div className="shrink-0">
                      <img
                        src={post.images[0]}
                        alt=""
                        className="w-24 h-24 rounded-lg object-cover border border-gray-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  {!post.images?.length && post.videos?.length > 0 && (
                    <div className="shrink-0">
                      <div className="w-24 h-24 rounded-lg bg-gray-900 flex items-center justify-center border border-gray-100 relative overflow-hidden">
                        <video
                          src={post.videos[0]}
                          className="w-full h-full object-cover opacity-70"
                          preload="metadata"
                          muted
                          playsInline
                        />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-gray-800 text-lg">▶</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"
                      >
                        #{tag}
                      </span>
                    ))}
                    {post.tags.length > 3 && (
                      <span className="text-xs px-2 py-0.5 text-gray-400">
                        +{post.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-gray-50">
                  <span>❤️ {post.likesCount}</span>
                  <span>💬 {post.commentsCount}</span>
                  <span>👁️ {post.views}</span>
                  {post.category && (
                    <span className="ml-auto" style={{ color: post.category.color }}>
                      {post.category.icon}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
              >
                {t('feed.prevPage')}
              </button>
              {Array.from(
                { length: Math.min(pagination.totalPages, 5) },
                (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        page === pageNum
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page >= pagination.totalPages}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
              >
                {t('feed.nextPage')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
