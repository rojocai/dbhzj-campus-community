'use client'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Badge {
  id: string
  name: string
  icon: string
  color: string
  description: string
}

interface UserBadge {
  badge: Badge
}

interface ManagedCategory {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  icon: string
}

interface PostInfo {
  id: string
  title: string
  status: string
  createdAt: string
  commentsCount: number
  likesCount: number
  views: number
  category: {
    id: string
    name: string
    color: string
  } | null
  commentsLocked: boolean
}

interface UserDetail {
  id: string
  username: string
  nickname: string
  email: string
  role: string
  avatarUrl: string | null
  bio: string | null
  coverUrl: string | null
  grade: string | null
  class_: string | null
  gender: string
  experience: number
  level: number
  coins: number
  isBanned: boolean
  banExpiresAt: string | null
  banReason: string | null
  createdAt: string
  badges: UserBadge[]
  managedCategories: ManagedCategory[]
  _count: {
    posts: number
    comments: number
    likes: number
    followers: number
    follows: number
  }
}

export default function UserEditPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Editable fields
  const [nickname, setNickname] = useState('')
  const [grade, setGrade] = useState('')
  const [class_, setClass_] = useState('')
  const [gender, setGender] = useState('保密')
  const [bio, setBio] = useState('')

  // Ban
  const [banDays, setBanDays] = useState('')
  const [banReason, setBanReason] = useState('')

  // Moderator
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  // Posts
  const [posts, setPosts] = useState<PostInfo[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postPage, setPostPage] = useState(1)
  const [postTotal, setPostTotal] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/signin')
    if (session && (session.user as any).role !== 'ADMIN') router.push('/')
  }, [session, status, router])

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      const data = await res.json()
      if (res.ok && !data.error) {
        setUser(data)
        setNickname(data.nickname || '')
        setGrade(data.grade || '')
        setClass_(data.class_ || '')
        setGender(data.gender || '保密')
        setBio(data.bio || '')
        setSelectedCategoryIds(data.managedCategories?.map((c: ManagedCategory) => c.id) || [])
      }
    } catch {
      console.error('获取用户信息失败')
    }
    setLoading(false)
  }, [userId])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (Array.isArray(data)) {
        setCategories(data)
      }
    } catch {
      console.error('获取分类失败')
    }
  }, [])

  const fetchPosts = useCallback(async (page = 1) => {
    setPostsLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/posts?page=${page}&limit=20`)
      const data = await res.json()
      if (res.ok) {
        setPosts(data.posts)
        setPostTotal(data.pagination.total)
        setPostPage(page)
      }
    } catch {
      console.error('获取用户帖子失败')
    }
    setPostsLoading(false)
  }, [userId])

  useEffect(() => {
    if (session && (session.user as any).role === 'ADMIN') {
      fetchUser()
      fetchCategories()
      fetchPosts(1)
    }
  }, [session, fetchUser, fetchCategories, fetchPosts])

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname,
          grade,
          class_,
          gender,
          bio,
        }),
      })
      if (res.ok) {
        setMessage('✅ 保存成功')
        fetchUser()
      } else {
        const data = await res.json()
        setMessage(`❌ 保存失败: ${data.error || '未知错误'}`)
      }
    } catch {
      setMessage('❌ 保存失败')
    }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleBan = async () => {
    setMessage('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isBanned: true,
          banDays: parseInt(banDays) || 0,
          banReason: banReason || '违规操作',
        }),
      })
      if (res.ok) {
        setMessage('✅ 禁言成功')
        setBanDays('')
        setBanReason('')
        fetchUser()
      } else {
        const data = await res.json()
        setMessage(`❌ 禁言失败: ${data.error || '未知错误'}`)
      }
    } catch {
      setMessage('❌ 禁言失败')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleUnban = async () => {
    setMessage('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: false }),
      })
      if (res.ok) {
        setMessage('✅ 已解禁')
        fetchUser()
      } else {
        const data = await res.json()
        setMessage(`❌ 解禁失败: ${data.error || '未知错误'}`)
      }
    } catch {
      setMessage('❌ 解禁失败')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleSetModerator = async () => {
    setMessage('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'MODERATOR',
          categoryIds: selectedCategoryIds,
        }),
      })
      if (res.ok) {
        setMessage('✅ 已设为版主')
        fetchUser()
      } else {
        const data = await res.json()
        setMessage(`❌ 操作失败: ${data.error || '未知错误'}`)
      }
    } catch {
      setMessage('❌ 操作失败')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleRemoveModerator = async () => {
    setMessage('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'USER' }),
      })
      if (res.ok) {
        setMessage('✅ 已取消版主')
        setSelectedCategoryIds([])
        fetchUser()
      } else {
        const data = await res.json()
        setMessage(`❌ 操作失败: ${data.error || '未知错误'}`)
      }
    } catch {
      setMessage('❌ 操作失败')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('确定要删除此帖子吗？')) return
    setMessage('')
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMessage('✅ 帖子已删除')
        fetchPosts(postPage)
      } else {
        const data = await res.json()
        setMessage(`❌ 删除失败: ${data.error || '未知错误'}`)
      }
    } catch {
      setMessage('❌ 删除失败')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  if (status === 'loading' || loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }
  if (!session || (session.user as any).role !== 'ADMIN') return null
  if (!user) {
    return <div className="text-center py-20 text-gray-500">用户不存在</div>
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-700',
      MODERATOR: 'bg-blue-100 text-blue-700',
      USER: 'bg-gray-100 text-gray-600',
    }
    const labels: Record<string, string> = {
      ADMIN: '管理员',
      MODERATOR: '版主',
      USER: '用户',
    }
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[role] || styles.USER}`}>
        {labels[role] || role}
      </span>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            ← 返回管理后台
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">用户编辑</h1>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            message.startsWith('✅')
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: User Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col items-center mb-4">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-2xl text-indigo-600 font-medium mb-3">
                  {(user.nickname || user.username)[0]}
                </div>
              )}
              <h2 className="text-lg font-semibold text-gray-800">
                {user.nickname || user.username}
              </h2>
              <p className="text-sm text-gray-400">@{user.username}</p>
              <div className="mt-2">{roleBadge(user.role)}</div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">邮箱</span>
                <span className="text-gray-800">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">等级</span>
                <span className="text-indigo-600 font-medium">Lv.{user.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">经验</span>
                <span className="text-gray-800">{user.experience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">积分</span>
                <span className="text-gray-800">{user.coins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">状态</span>
                {user.isBanned ? (
                  <span className="text-red-500 font-medium">禁言中</span>
                ) : (
                  <span className="text-green-500 font-medium">正常</span>
                )}
              </div>
              {user.isBanned && user.banExpiresAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">禁言到期</span>
                  <span className="text-gray-800">{formatDate(user.banExpiresAt)}</span>
                </div>
              )}
              {user.isBanned && user.banReason && (
                <div className="flex justify-between">
                  <span className="text-gray-500">禁言原因</span>
                  <span className="text-gray-800">{user.banReason}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">帖子数</span>
                <span className="text-gray-800">{user._count.posts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">评论数</span>
                <span className="text-gray-800">{user._count.comments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">注册时间</span>
                <span className="text-gray-800 text-xs">{formatDate(user.createdAt)}</span>
              </div>
            </div>

            {/* Badges */}
            {user.badges.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-2">勋章</h3>
                <div className="flex flex-wrap gap-2">
                  {user.badges.map((ub) => (
                    <span
                      key={ub.badge.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: ub.badge.color + '20', color: ub.badge.color }}
                      title={ub.badge.description}
                    >
                      {ub.badge.icon} {ub.badge.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Editable Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Edit */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">编辑资料</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="高一"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">班级</label>
                  <input
                    type="text"
                    value={class_}
                    onChange={(e) => setClass_(e.target.value)}
                    placeholder="1班"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="保密">保密</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>

          {/* Ban Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">禁言管理</h3>
            {user.isBanned ? (
              <div>
                <p className="text-sm text-red-600 mb-3">
                  该用户当前处于禁言状态
                  {user.banExpiresAt && (
                    <>，到期时间: {formatDate(user.banExpiresAt)}</>
                  )}
                  {user.banReason && <>，原因: {user.banReason}</>}
                </p>
                <button
                  onClick={handleUnban}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  解禁该用户
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      禁言天数（留空为永久）
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={banDays}
                      onChange={(e) => setBanDays(e.target.value)}
                      placeholder="留空或0表示永久"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">禁言原因</label>
                    <input
                      type="text"
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="违规操作"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleBan}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  禁言用户
                </button>
              </div>
            )}
          </div>

          {/* Moderator Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">版主管理</h3>
            {user.role === 'MODERATOR' ? (
              <div>
                <p className="text-sm text-blue-600 mb-3">该用户当前是版主</p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    管辖版块（多选）
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <label
                        key={cat.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                          selectedCategoryIds.includes(cat.id)
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                          className="sr-only"
                        />
                        {cat.icon} {cat.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSetModerator}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    更新管辖版块
                  </button>
                  <button
                    onClick={handleRemoveModerator}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                  >
                    取消版主
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  将该用户设为版主，并选择其管辖的版块
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    管辖版块（多选）
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <label
                        key={cat.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                          selectedCategoryIds.includes(cat.id)
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                          className="sr-only"
                        />
                        {cat.icon} {cat.name}
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleSetModerator}
                  disabled={selectedCategoryIds.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  设为版主
                </button>
              </div>
            )}
          </div>

          {/* Posts Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              用户帖子 (共{postTotal}篇)
            </h3>
            {postsLoading ? (
              <div className="text-center py-6 text-gray-500">加载中...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-6 text-gray-500">暂无帖子</div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            post.status === 'PUBLISHED'
                              ? 'bg-green-50 text-green-600'
                              : post.status === 'DELETED'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {post.status === 'PUBLISHED' ? '正常' : post.status === 'DELETED' ? '已删除' : post.status}
                        </span>
                        {post.category && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: post.category.color + '20', color: post.category.color }}
                          >
                            {post.category.name}
                          </span>
                        )}
                        {post.commentsLocked && (
                          <span className="text-xs text-orange-500">🔒锁评</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate mt-1">
                        {post.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(post.createdAt)} · 💬 {post.commentsCount} · 👍 {post.likesCount} · 👁 {post.views}
                      </p>
                    </div>
                    {post.status !== 'DELETED' && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="shrink-0 ml-3 px-2.5 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                      >
                        删除
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {postTotal > 20 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => fetchPosts(postPage - 1)}
                  disabled={postPage <= 1}
                  className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <span className="px-3 py-1 text-sm text-gray-500">
                  {postPage} / {Math.ceil(postTotal / 20)}
                </span>
                <button
                  onClick={() => fetchPosts(postPage + 1)}
                  disabled={postPage >= Math.ceil(postTotal / 20)}
                  className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
