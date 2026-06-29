'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const AVATARS = Array.from({ length: 12 }, (_, i) => `/avatars/avatar-${i + 1}.svg`)

export default function SignUpPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', username: '', nickname: '', password: '', confirm: '', name: '', grade: '', class_: '', gender: '保密', birthday: '' })
  const [avatarUrl, setAvatarUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('两次密码输入不一致'); return }
    if (form.password.length < 6) { setError('密码至少6位'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, avatarUrl: avatarUrl || undefined })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '注册失败')
        setLoading(false)
        return
      }
      router.push('/signin')
    } catch {
      setError('网络错误，请重试')
      setLoading(false)
    }
  }

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value })

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">注册练川实验学校社区</h2>
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择头像</label>
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
            {!avatarUrl && <p className="text-xs text-gray-400">点击选择一个头像（可选）</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input type="email" value={form.email} onChange={update('email')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="请输入邮箱" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input type="text" value={form.username} onChange={update('username')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="用于登录的用户名" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
            <input type="text" value={form.nickname} onChange={update('nickname')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="在社区显示的名字" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input type="password" value={form.password} onChange={update('password')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="至少6位" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
            <input type="password" value={form.confirm} onChange={update('confirm')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="再次输入密码" required />
          </div>
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-400 mb-3">选填信息</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input type="text" value={form.name} onChange={update('name')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="你的真实姓名" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                  <input type="text" value={form.grade} onChange={update('grade')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="如：高一、高二" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">班级</label>
                  <input type="text" value={form.class_} onChange={update('class_')} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="如：1班、2班" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                <select value={form.gender} onChange={update('gender') as any} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                  <option value="保密">保密</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">出生日期</label>
                <input type="date" value={form.birthday} onChange={update('birthday')} max={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors mt-2">
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          已有账号？<Link href="/signin" className="text-indigo-600 hover:underline">立即登录</Link>
        </p>
      </div>
    </div>
  )
}
