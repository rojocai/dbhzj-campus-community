'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLang } from '@/lib/lang/LangContext'

const AVATARS = Array.from({ length: 12 }, (_, i) => `/avatars/avatar-${i + 1}.svg`)

export default function SignUpPage() {
  const router = useRouter()
  const { t } = useLang()
  const [form, setForm] = useState({ email: '', username: '', nickname: '', password: '', confirm: '', name: '', grade: '', class_: '', gender: '保密', birthday: '' })
  const [avatarUrl, setAvatarUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError(t('signup.errors.passwordMismatch')); return }
    if (form.password.length < 6) { setError(t('signup.errors.passwordTooShort')); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, avatarUrl: avatarUrl || undefined })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t('signup.errors.registerFailed'))
        setLoading(false)
        return
      }
      router.push('/signin')
    } catch {
      setError(t('signup.errors.networkError'))
      setLoading(false)
    }
  }

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value })

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">{t('signup.title')}</h2>
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('signup.avatarLabel')}</label>
            <div className="grid grid-cols-6 gap-2 mb-2">
              {AVATARS.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={`w-full aspect-square rounded-xl border-2 transition-all overflow-hidden ${
                    avatarUrl === url
                      ? 'border-indigo-500 ring-2 ring-indigo-200 scale-105'
                      : 'border-gray-200 hover:border-indigo-300 hover:scale-105'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            {!avatarUrl && <p className="text-xs text-gray-400">{t('signup.avatarHint')}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('signup.emailLabel')}</label>
            <input type="email" value={form.email} onChange={update('email')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={t('signup.emailPlaceholder')} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('signup.usernameLabel')}</label>
            <input type="text" value={form.username} onChange={update('username')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={t('signup.usernamePlaceholder')} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('signup.nicknameLabel')}</label>
            <input type="text" value={form.nickname} onChange={update('nickname')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={t('signup.nicknamePlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('signup.passwordLabel')}</label>
            <input type="password" value={form.password} onChange={update('password')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={t('signup.passwordPlaceholder')} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('signup.confirmLabel')}</label>
            <input type="password" value={form.confirm} onChange={update('confirm')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={t('signup.confirmPlaceholder')} required />
          </div>
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-400 mb-3">{t('signup.optionalSection')}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('signup.nameLabel')}</label>
                <input type="text" value={form.name} onChange={update('name')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={t('signup.namePlaceholder')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('signup.gradeLabel')}</label>
                  <input type="text" value={form.grade} onChange={update('grade')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={t('signup.gradePlaceholder')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('signup.classLabel')}</label>
                  <input type="text" value={form.class_} onChange={update('class_')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={t('signup.classPlaceholder')} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('signup.genderLabel')}</label>
                <select value={form.gender} onChange={update('gender') as any} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                  <option value="保密">{t('signup.genderSecret')}</option>
                  <option value="男">{t('signup.genderMale')}</option>
                  <option value="女">{t('signup.genderFemale')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('signup.birthdayLabel')}</label>
                <input type="date" value={form.birthday} onChange={update('birthday')} max={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors mt-2">
            {loading ? t('signup.submitting') : t('signup.submit')}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          {t('signup.hasAccount')}<Link href="/signin" className="text-indigo-600 hover:underline">{t('signup.signinLink')}</Link>
        </p>
      </div>
    </div>
  )
}
