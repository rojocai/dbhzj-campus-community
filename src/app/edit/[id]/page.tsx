"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import Link from "next/link";
import { ArrowLeftIcon, LockClosedIcon, ChatBubbleLeftEllipsisIcon, EyeSlashIcon, MusicalNoteIcon } from "@heroicons/react/24/outline";
import UploadZone from "@/components/UploadZone";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EditPostPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: post,
    error: postError,
    isLoading: postLoading,
  } = useSWR(postId ? `/api/posts/${postId}` : null, fetcher);

  const { data: categories } = useSWR("/api/categories", fetcher);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [commentsLocked, setCommentsLocked] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [bgMusicUrl, setBgMusicUrl] = useState("");
  const [bgMusicName, setBgMusicName] = useState("");
  const [bgMusicType, setBgMusicType] = useState<"link" | "upload">("link");
  const [bgMusicUploading, setBgMusicUploading] = useState(false);
  const [bgMusicProgress, setBgMusicProgress] = useState({ percent: 0, speed: "" });
  const [uploading, setUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Load post data into form
  useEffect(() => {
    if (post && !initialized) {
      setTitle(post.title || "");
      setContent(post.content || "");
      setCategoryId(post.categoryId || "");
      setTagsInput((post.tags || []).join(", "));
      setImages(post.images || []);
      setVideos(post.videos || []);
      setCommentsLocked(post.commentsLocked || false);
      setIsPrivate(post.isPrivate || false);
      if (post.bgMusic) {
        try {
          const bm = JSON.parse(post.bgMusic);
          setBgMusicUrl(bm.url || "");
          setBgMusicName(bm.name || "");
          setBgMusicType(bm.type || "link");
        } catch {}
      }
      setInitialized(true);
    }
  }, [post, initialized]);

  // Auth check
  useEffect(() => {
    if (!postLoading && post && session) {
      const user = session.user as any;
      if (post.authorId !== user.id && user.role !== "ADMIN") {
        router.push(`/post/${postId}`);
      }
    }
  }, [postLoading, post, session, postId, router]);

  const handleImageUpload = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true);
      setError("");
      try {
        for (const file of Array.from(files)) {
          if (!file.type.startsWith("image/")) continue;
          if (file.size > 5 * 1024 * 1024) {
            setError("图片大小不能超过5MB");
            continue;
          }
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            setImages((prev) => [...prev, data.url]);
          } else {
            const err = await res.json();
            setError(err.error || "上传失败");
          }
        }
      } catch (err) {
        setError("上传图片失败");
      }
      setUploading(false);
    },
    []
  );

  const handleVideoUpload = useCallback(async (files: FileList | File[]) => {
    setVideoUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("video/")) continue;
        if (file.size > 200 * 1024 * 1024) {
          setError("视频大小不能超过200MB");
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          setVideos((prev) => [...prev, data.url]);
        } else {
          const err = await res.json();
          setError(err.error || "上传视频失败");
        }
      }
    } catch {
      setError("上传视频失败");
    }
    setVideoUploading(false);
  }, []);

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleImageUpload(e.dataTransfer.files);
      }
    },
    [handleImageUpload]
  );

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("请填写标题和内容");
      return;
    }
    if (title.length > 100) {
      setError("标题不能超过100个字符");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const tags = tagsInput
        .split(/[,，、\s]+/)
        .filter((t) => t.trim());

      const res = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          categoryId: categoryId || null,
          images,
          videos,
          tags,
          commentsLocked,
          isPrivate,
          bgMusic: bgMusicUrl ? JSON.stringify({ url: bgMusicUrl, type: bgMusicType, name: bgMusicName }) : "",
        }),
      });

      if (res.ok) {
        router.push(`/post/${postId}`);
      } else {
        const err = await res.json();
        setError(err.error || "保存失败");
      }
    } catch (err) {
      setError("保存失败，请稍后再试");
    }
    setSubmitting(false);
  };

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">请先登录</h2>
        <p className="text-gray-500 mb-6">登录后才能编辑帖子</p>
        <Link
          href="/signin"
          className="inline-block px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
        >
          立即登录
        </Link>
      </div>
    );
  }

  if (postLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded w-full"></div>
          <div className="h-40 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">帖子不存在</h2>
        <Link
          href="/feed"
          className="inline-block px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
        >
          返回广场
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href={`/post/${postId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          返回帖子
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">编辑帖子</h1>
        <p className="text-gray-500">修改你的帖子内容或设置</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入帖子标题..."
            maxLength={100}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {title.length}/100
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            分类
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
          >
            <option value="">选择分类（可选）</option>
            {categories?.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下你想分享的内容..."
            rows={12}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-y min-h-[200px] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            标签
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="输入标签，用逗号或空格分隔（如：学习, 考试, 经验分享）"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Image Upload */}
        <UploadZone
          accept="image/*"
          maxSizeMB={10}
          label="🖼️ 图片上传"
          hint="支持 JPG、PNG、GIF、WebP，单张不超过 10MB，支持多选"
          fileList={images}
          onAdd={(urls) => setImages(prev => [...prev, ...urls])}
          onRemove={(i) => setImages(prev => prev.filter((_, j) => j !== i))}
        />

        {/* Video Upload */}
        <UploadZone
          accept="video/*"
          maxSizeMB={200}
          label="🎬 视频上传"
          hint="支持 MP4、WebM、MOV，单文件不超过 200MB，支持多选"
          fileList={videos}
          onAdd={(urls) => setVideos(prev => [...prev, ...urls])}
          onRemove={(i) => setVideos(prev => prev.filter((_, j) => j !== i))}
        />

        {/* Background Music */}
        <div className="border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <MusicalNoteIcon className="w-4 h-4" />
            背景音乐（可选）
          </h3>
          <p className="text-xs text-gray-400 mb-3">设置后，读者打开帖子将自动播放此音乐，每个读者可独立关闭</p>

          {bgMusicUrl ? (
            <div className="flex items-center justify-between bg-indigo-50 rounded-lg p-3">
              <div className="flex items-center gap-2 min-w-0">
                <span>🎵</span>
                <span className="text-sm text-gray-700 truncate">{bgMusicName || "背景音乐"}</span>
              </div>
              <button type="button" onClick={() => { setBgMusicUrl(""); setBgMusicName(""); }} className="shrink-0 ml-2 text-xs text-red-500 hover:text-red-700">移除</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => setBgMusicType("link")} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${bgMusicType === "link" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>🔗 音乐链接</button>
                <button type="button" onClick={() => setBgMusicType("upload")} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${bgMusicType === "upload" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>📤 上传MP3</button>
              </div>
              {bgMusicType === "link" ? (
                <input type="text" value={bgMusicUrl} onChange={(e) => { setBgMusicUrl(e.target.value); setBgMusicName(e.target.value.split('/').pop() || '音乐链接'); }} placeholder="粘贴音乐文件直链 URL" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
              ) : (
                <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-200 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                  {bgMusicUploading ? (
                    <span className="text-sm text-gray-500 flex items-center gap-2"><div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>上传中...</span>
                  ) : (
                    <span className="text-sm text-gray-500">🎵 点击选择 MP3 文件（不超过 20MB）</span>
                  )}
                  <input type="file" accept="audio/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 20 * 1024 * 1024) { setError("音频不能超过20MB"); return; }
                    setBgMusicUploading(true);
                    try {
                      const fd = new FormData(); fd.append("file", file);
                      const res = await fetch("/api/upload", { method: "POST", body: fd });
                      if (res.ok) { const d = await res.json(); setBgMusicUrl(d.url); setBgMusicName(file.name); setBgMusicType("upload"); }
                      else { const e2 = await res.json(); setError(e2.error || "上传失败"); }
                    } catch { setError("上传音频失败"); }
                    setBgMusicUploading(false);
                  }} className="hidden" disabled={bgMusicUploading} />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Post Settings - only shown to author */}
        <div className="border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <LockClosedIcon className="w-4 h-4" />
            帖子设置
          </h3>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={commentsLocked}
                onChange={(e) => setCommentsLocked(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-red-400 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors flex items-center gap-1.5">
                <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                禁止评论
              </span>
              <span className="text-xs text-gray-400">
                开启后，其他人无法对该帖子发表评论
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-amber-400 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors flex items-center gap-1.5">
                <EyeSlashIcon className="w-4 h-4" />
                设为私密
              </span>
              <span className="text-xs text-gray-400">
                开启后，只有你和超级管理员可以看到此帖子
              </span>
            </div>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href={`/post/${postId}`}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                保存中...
              </span>
            ) : (
              "保存修改"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
