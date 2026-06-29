"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import {
  HeartIcon as HeartOutline,
  BookmarkIcon as BookmarkOutline,
  ShareIcon,
  ArrowLeftIcon,
  ChatBubbleLeftIcon,
  PencilSquareIcon,
  LockClosedIcon,
  EyeSlashIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid,
} from "@heroicons/react/24/solid";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function PostDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  const user = session?.user as any;

  const {
    data: post,
    error,
    isLoading,
    mutate,
  } = useSWR(`/api/posts/${id}`, fetcher);

  const [commentContent, setCommentContent] = useState("");
  const [replyTo, setReplyTo] = useState<{
    id: string;
    nickname: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Background music: each user controls independently via localStorage
  const musicId = id;
  const musicEnabledKey = `bgmusic_enabled_${musicId}`;

  useEffect(() => {
    // Only auto-play if user hasn't explicitly disabled this post's music
    const saved = localStorage.getItem(musicEnabledKey);
    if (saved !== "off" && post?.bgMusic) {
      setMusicPlaying(true);
    }
  }, [post?.bgMusic, musicEnabledKey]);

  const toggleMusic = () => {
    const newVal = !musicPlaying;
    setMusicPlaying(newVal);
    localStorage.setItem(musicEnabledKey, newVal ? "on" : "off");
    if (!newVal && audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleLike = async () => {
    if (!session) {
      window.location.href = "/signin";
      return;
    }
    await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: id }),
    });
    mutate();
  };

  const handleCollect = async () => {
    if (!session) {
      window.location.href = "/signin";
      return;
    }
    await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: id }),
    });
    mutate();
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: post?.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert("链接已复制到剪贴板！");
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !commentContent.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentContent,
          postId: id,
          parentId: replyTo?.id || null,
          replyToId: replyTo?.id || null,
        }),
      });
      if (res.ok) {
        setCommentContent("");
        setReplyTo(null);
        mutate();
      }
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">帖子不存在</h2>
        <p className="text-gray-500 mb-6">
          该帖子可能已被删除或链接无效
        </p>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          返回广场
        </Link>
      </div>
    );
  }

  const images = post.images || [];
  const videos = post.videos || [];
  const tags = post.tags || [];
  const comments = post.comments || [];
  const topLevelComments = comments.filter((c: any) => !c.parentId);
  let bgMusicData: { url: string; type: string; name: string } | null = null;
  if (post.bgMusic) {
    try { bgMusicData = JSON.parse(post.bgMusic); } catch {}
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Music Bar Animation */}
      <style>{`
        @keyframes musicBar {
          0%, 100% { height: 6px; }
          25% { height: 14px; }
          50% { height: 8px; }
          75% { height: 18px; }
        }
        .music-bar {
          animation: musicBar 1.2s ease-in-out infinite;
        }
      `}</style>
      {/* Back button */}
      <Link
        href="/feed"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        返回广场
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <article className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            {/* Category & Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {post.category && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: post.category.color + "15",
                    color: post.category.color,
                  }}
                >
                  {post.category.icon} {post.category.name}
                </span>
              )}
              {post.isEssence && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                  ⭐ 精华
                </span>
              )}
              {post.isPinned && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                  📌 置顶
                </span>
              )}
              {post.isPrivate && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1">
                  <EyeSlashIcon className="w-3 h-3" />
                  私密
                </span>
              )}
              {post.commentsLocked && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium flex items-center gap-1">
                  <LockClosedIcon className="w-3 h-3" />
                  评论已关闭
                </span>
              )}
            </div>

            {/* Title row with edit button */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                {post.title}
              </h1>
              {user?.id === post.authorId && (
                <Link
                  href={`/edit/${post.id}`}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                  编辑
                </Link>
              )}
            </div>

            {/* Author meta */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
              <Link href={`/user/${post.author?.id}`}>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                  {post.author?.avatarUrl ? (
                    <img
                      src={post.author.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-indigo-600">
                      {post.author?.nickname?.[0] || "?"}
                    </span>
                  )}
                </div>
              </Link>
              <div>
                <Link
                  href={`/user/${post.author?.id}`}
                  className="text-sm font-semibold text-gray-900 hover:text-indigo-600"
                >
                  {post.author?.nickname || post.author?.username}
                </Link>
                <span className="inline-flex items-center gap-1 ml-1.5">
                  {post.author?.id === post.authorId && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium border border-indigo-100">楼主</span>
                  )}
                  {(post.author?.role === "MODERATOR" || post.author?.role === "ADMIN") && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium border border-amber-100">版主</span>
                  )}
                </span>
                <p className="text-xs text-gray-400">
                  {new Date(post.createdAt).toLocaleString("zh-CN")} · 发布于
                  {post.author?.grade && ` ${post.author.grade}`}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-gray max-w-none mb-6 whitespace-pre-wrap text-gray-700 leading-relaxed">
              {post.content}
            </div>

            {/* Images */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {images.map((img: string, i: number) => (
                  <img
                    key={i}
                    src={img}
                    alt={`图片 ${i + 1}`}
                    className="rounded-lg w-full object-cover max-h-96"
                  />
                ))}
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div className="space-y-4 mb-6">
                {videos.map((video: string, i: number) => (
                  <div key={i} className="bg-black rounded-lg overflow-hidden">
                    <video
                      src={video}
                      controls
                      preload="metadata"
                      className="w-full max-h-[500px]"
                      playsInline
                    >
                      您的浏览器不支持视频播放
                    </video>
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Background Music Player */}
            {bgMusicData && (
              <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={toggleMusic}
                      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        musicPlaying
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                          : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                      }`}
                    >
                      {musicPlaying ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" opacity="0.3"/>
                          <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">🎵 背景音乐</span>
                        <span className="text-xs text-gray-400 truncate">{bgMusicData.name || "音乐"}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex gap-0.5">
                          {[1,2,3].map((i) => (
                            <div
                              key={i}
                              className={`w-1 rounded-full transition-all duration-300 ${
                                musicPlaying ? "bg-indigo-400 music-bar" : "bg-gray-300"
                              }`}
                              style={{
                                height: musicPlaying ? `${8 + Math.random() * 12}px` : "8px",
                                animationDelay: `${i * 0.15}s`,
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">
                          {musicPlaying ? "播放中" : "点击播放"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded bg-white/60 text-gray-400 border border-indigo-100">
                    仅你可见
                  </span>
                </div>
                <audio
                  ref={audioRef}
                  src={bgMusicData.url}
                  loop
                  autoPlay={musicPlaying}
                  onPlay={() => setMusicPlaying(true)}
                  onPause={() => setMusicPlaying(false)}
                  className="hidden"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  post.isLiked
                    ? "bg-red-50 text-red-600"
                    : "text-gray-500 hover:bg-gray-50 hover:text-red-500"
                }`}
              >
                {post.isLiked ? (
                  <HeartSolid className="w-5 h-5" />
                ) : (
                  <HeartOutline className="w-5 h-5" />
                )}
                {post.likesCount > 0 && post.likesCount}
              </button>
              <button
                onClick={handleCollect}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  post.isCollected
                    ? "bg-amber-50 text-amber-600"
                    : "text-gray-500 hover:bg-gray-50 hover:text-amber-500"
                }`}
              >
                {post.isCollected ? (
                  <BookmarkSolid className="w-5 h-5" />
                ) : (
                  <BookmarkOutline className="w-5 h-5" />
                )}
                收藏
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-indigo-500 transition-all"
              >
                <ShareIcon className="w-5 h-5" />
                分享
              </button>
              <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
                <span>👁️ {post.views}</span>
                <span>💬 {post.commentsCount}</span>
              </div>
            </div>
          </article>

          {/* Comments Section */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ChatBubbleLeftIcon className="w-5 h-5" />
              评论 ({post.commentsCount})
            </h2>

            {/* Comment Form */}
            {post.commentsLocked ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl mb-8">
                <LockClosedIcon className="w-6 h-6 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">该帖子已关闭评论</p>
              </div>
            ) : session ? (
              <form onSubmit={handleComment} className="mb-8">
                {replyTo && (
                  <div className="flex items-center gap-2 text-sm text-indigo-600 mb-2 bg-indigo-50 px-4 py-2 rounded-lg">
                    <span>
                      回复 @{replyTo.nickname}
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyTo(null)}
                      className="ml-auto text-gray-400 hover:text-gray-600"
                    >
                      取消
                    </button>
                  </div>
                )}
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="写下你的评论..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!commentContent.trim() || submitting}
                    className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {submitting ? "发送中..." : "发表评论"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl mb-8">
                <p className="text-gray-500 mb-3">登录后即可发表评论</p>
                <Link
                  href="/signin"
                  className="inline-block px-6 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                >
                  立即登录
                </Link>
              </div>
            )}

            {/* Comments List */}
            {topLevelComments.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                暂无评论，快来抢沙发吧！
              </div>
            )}

            <div className="space-y-4">
              {topLevelComments.map((comment: any) => (
                <div
                  key={comment.id}
                  className="bg-white rounded-xl border border-gray-100 p-5"
                >
                  {/* Comment Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                      {comment.author?.avatarUrl ? (
                        <img
                          src={comment.author.avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-indigo-600">
                          {comment.author?.nickname?.[0] || "?"}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/user/${comment.author?.id}`}
                      className="text-sm font-medium text-gray-700 hover:text-indigo-600"
                    >
                      {comment.author?.nickname || comment.author?.username}
                    </Link>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleString("zh-CN")}
                    </span>
                  </div>

                  {/* Comment Content */}
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    {comment.content}
                  </p>

                  {/* Comment Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setReplyTo({
                          id: comment.id,
                          nickname:
                            comment.author?.nickname ||
                            comment.author?.username,
                        })
                      }
                      className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      回复
                    </button>
                  </div>

                  {/* Replies */}
                  {comment.replies?.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-indigo-100 space-y-3">
                      {comment.replies.map((reply: any) => (
                        <div key={reply.id} className="py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                              {reply.author?.avatarUrl ? (
                                <img
                                  src={reply.author.avatarUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[10px] font-bold text-gray-500">
                                  {reply.author?.nickname?.[0] || "?"}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {reply.author?.nickname || reply.author?.username}
                            </span>
                            {reply.replyTo && (
                              <span className="text-xs text-gray-400">
                                回复 @
                                {reply.replyTo.author?.nickname ||
                                  reply.replyTo.author?.username}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(reply.createdAt).toLocaleString(
                                "zh-CN"
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 ml-8">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Author Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
              <Link href={`/user/${post.author?.id}`}>
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden mx-auto mb-3">
                  {post.author?.avatarUrl ? (
                    <img
                      src={post.author.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-indigo-600">
                      {post.author?.nickname?.[0] || "?"}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 hover:text-indigo-600">
                  {post.author?.nickname || post.author?.username}
                </h3>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {post.author?.id === post.authorId && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium border border-indigo-100">楼主</span>
                  )}
                  {(post.author?.role === "MODERATOR" || post.author?.role === "ADMIN") && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium border border-amber-100">版主</span>
                  )}
                </div>
              </Link>
              {post.author?.bio && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  {post.author.bio}
                </p>
              )}
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
                <span>Lv.{post.author?.level}</span>
                <span>经验 {post.author?.experience}</span>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                帖子数据
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">浏览</span>
                  <span className="font-medium">{post.views}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">点赞</span>
                  <span className="font-medium">{post.likesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">评论</span>
                  <span className="font-medium">{post.commentsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
