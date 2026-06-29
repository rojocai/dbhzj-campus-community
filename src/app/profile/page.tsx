"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import useSWR from "swr";
import {
  PencilSquareIcon,
  UserCircleIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import { useLang } from "@/lib/lang/LangContext";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const { t } = useLang();

  const {
    data: profile,
    error,
    isLoading,
    mutate,
  } = useSWR(session ? "/api/users/me" : null, fetcher);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nickname: "",
    bio: "",
    grade: "",
    class_: "",
    gender: "保密",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        nickname: profile.nickname || "",
        bio: profile.bio || "",
        grade: profile.grade || "",
        class_: profile.class_ || "",
        gender: profile.gender || "保密",
      });
      setAvatarPreview(profile.avatarUrl || "");
    }
  }, [profile]);

  if (status === "loading") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-2xl mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('profile.loginRequired')}</h2>
        <p className="text-gray-500 mb-6">{t('profile.loginRequiredDesc')}</p>
        <Link
          href="/signin"
          className="inline-block px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
        >
          {t('profile.signinNow')}
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-gray-500">{t('profile.loadFailed')}</p>
        <button
          onClick={() => mutate()}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm"
        >
          {t('profile.reload')}
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-2xl mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 mx-auto"></div>
        </div>
      </div>
    );
  }

  const update = (key: string) => (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => setForm({ ...form, [key]: e.target.value });

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage(t('profile.errors.avatarTooLarge'));
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage(t('profile.errors.avatarFormat'));
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setMessage("");
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const fd = new FormData();
      if (avatarFile) {
        fd.append("avatar", avatarFile);
      }
      fd.append("nickname", form.nickname);
      fd.append("bio", form.bio);
      fd.append("grade", form.grade);
      fd.append("class_", form.class_);
      fd.append("gender", form.gender);

      const res = await fetch("/api/users/me", {
        method: "PUT",
        body: fd,
      });
      if (res.ok) {
        setMessage(t('profile.saved'));
        setAvatarFile(null);
        mutate();
        setTimeout(() => setMessage(""), 2500);
      } else {
        const err = await res.json();
        setMessage(`❌ ${err.error || t('profile.saveFailed')}`);
      }
    } catch {
      setMessage(t('profile.networkError'));
    }
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end -mt-12 mb-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
                <div className="w-full h-full rounded-xl bg-indigo-100 flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-12 h-12 text-indigo-400" />
                  )}
                </div>
              </div>
              {editing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition-all"
                  title={t('profile.uploadAvatar')}
                >
                  <ArrowUpTrayIcon className="w-4 h-4" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </div>
            <div className="ml-4 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.nickname || profile.username}
              </h1>
              <p className="text-sm text-gray-500">
                @{profile.username}
                {profile.grade && ` · ${profile.grade}`}
                {profile.class_ && ` · ${profile.class_}`}
              </p>
            </div>
          </div>

          {/* Bio */}
          {!editing && profile.bio && (
            <p className="text-sm text-gray-600 mb-4">{profile.bio}</p>
          )}

          {/* Edit Form */}
          {editing ? (
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    {t('profile.form.nickname')}
                  </label>
                  <input
                    type="text"
                    value={form.nickname}
                    onChange={update("nickname")}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    {t('profile.form.usernameFixed')}
                  </label>
                  <input
                    type="text"
                    value={profile.username}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-gray-100 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    {t('profile.form.grade')}
                  </label>
                  <input
                    type="text"
                    value={form.grade}
                    onChange={update("grade")}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    placeholder={t('profile.form.gradePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    {t('profile.form.class')}
                  </label>
                  <input
                    type="text"
                    value={form.class_}
                    onChange={update("class_")}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    placeholder={t('profile.form.classPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    {t('profile.form.gender')}
                  </label>
                  <select
                    value={form.gender}
                    onChange={update("gender")}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
                  >
                    <option value="保密">{t('profile.form.genderSecret')}</option>
                    <option value="男">{t('profile.form.genderMale')}</option>
                    <option value="女">{t('profile.form.genderFemale')}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  {t('profile.form.bio')}
                </label>
                <textarea
                  value={form.bio}
                  onChange={update("bio")}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              {message && (
                <div
                  className={`text-sm ${
                    message.startsWith("✅") ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {message}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
                >
                  {saving ? t('profile.saving') : t('profile.save')}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      nickname: profile.nickname || "",
                      bio: profile.bio || "",
                      grade: profile.grade || "",
                      class_: profile.class_ || "",
                      gender: profile.gender || "保密",
                    });
                    setAvatarFile(null);
                    setAvatarPreview(profile.avatarUrl || "");
                    setMessage("");
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                  {t('profile.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
            >
              <PencilSquareIcon className="w-4 h-4" />
              {t('profile.editProfile')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
