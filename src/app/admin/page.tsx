'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import StylePanel from '@/components/StylePanel'
import { useLang } from '@/lib/lang/LangContext'

interface SiteConfig {
  aboutTitle: string
  aboutContent: string
  aboutImage: string
  contactPhone: string
  contactEmail: string
  contactWechat: string
  contactQQ: string
  contactAddress: string
  footerCopyright: string
  footerIcp: string
  siteTitle: string
  siteSubtitle: string
  siteImage: string
  footerPoweredBy: string
  heroWelcome: string
  toolbarTitle: string
  toolbarLogo: string
  aboutSubtitle: string
  heroTagline1: string
  heroTagline2: string
  heroJoinTitle: string
  heroJoinSubtitle: string
  heroBgEnabled: boolean
  heroBgColor1: string
  heroBgColor2: string
  heroBgColor3: string
  heroBgOpacity: string
  heroBgBlur: string
  heroBgBrightness: string
  fireworksDuration: number
  textStyles: string
}

interface UserInfo {
  id: string
  username: string
  nickname: string
  email: string
  role: string
  level: number
  coins: number
  experience: number
  isBanned: boolean
  banExpiresAt: string | null
  banReason: string | null
  avatarUrl: string | null
  grade: string | null
  class_: string | null
  gender: string
  bio: string | null
  createdAt: string
  _count: {
    posts: number
    comments: number
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

const defaultConfig: SiteConfig = {
  aboutTitle: '关于我们',
  aboutContent: '练川实验学校社区，致力于为师生提供一个交流、分享、成长的平台。',
  aboutImage: '',
  contactPhone: '',
  contactEmail: '',
  contactWechat: '',
  contactQQ: '',
  contactAddress: '',
  footerCopyright: '© 2024 练川实验学校 All Rights Reserved',
  footerIcp: '',
  siteTitle: '练川实验学校',
  siteSubtitle: 'Connect Campus, Share Growth',
  siteImage: '',
  footerPoweredBy: 'Dongbaihu Home v1.0 | Powered by Next.js & Prisma',
  heroWelcome: 'Welcome to Lianchuan Experimental School',
  toolbarTitle: '练川实验学校',
  toolbarLogo: '',
  heroTagline1: 'Exchange learning experiences, share campus life, join activities',
  heroTagline2: 'Make every campus day more exciting',
  heroJoinTitle: 'Join Lianchuan Experimental School Community',
  heroJoinSubtitle: 'Exchange ideas, share life, make campus time wonderful',
  heroBgEnabled: false,
  heroBgColor1: '#4f46e5',
  heroBgColor2: '#7c3aed',
  heroBgColor3: '#6366f1',
  heroBgOpacity: '1',
  heroBgBlur: '0',
  heroBgBrightness: '1',
  fireworksDuration: 15,
  textStyles: '{}',
}

const EMOJI_LIST = [
  '🏫', '📚', '🎭', '🎮', '💧', '📖', '✏️', '🎨',
  '🎵', '🎪', '⚽', '🏀', '🎯', '🎪', '🎤', '🎬',
  '📸', '💻', '🔬', '🔭', '🌍', '🌈', '🌸', '🌺',
  '🍔', '🍕', '☕', '🎂', '🚌', '🚲', '✈️', '🏔️',
  '🏖️', '🏕️', '🎉', '🎊', '💡', '💪', '🤝', '❤️',
  '⭐', '🔥', '💎', '👑', '🧩', '🎲', '🎰', '🏆',
  '🥇', '🥈', '🥉', '🎁', '🎈', '🎀', '📌', '📝',
  '📋', '📊', '🗂️', '📁', '🔖', '🏷️', '💬', '🗨️',
  '👋', '👍', '🎓', '🧪', '🖥️', '📱', '🖌️', '🎼',
]

export default function AdminPage() {
  const { data: session, status } = useSession()
  const { t, lang } = useLang()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'about' | 'contact' | 'footer' | 'home' | 'users' | 'categories' | 'posts'>('about')
  const [config, setConfig] = useState<SiteConfig>(defaultConfig)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // User management state
  const [users, setUsers] = useState<UserInfo[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userPagination, setUserPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [banDialog, setBanDialog] = useState<{
    open: boolean
    userId: string
    userName: string
  }>({ open: false, userId: '', userName: '' })
  const [banDays, setBanDays] = useState('')
  const [banReason, setBanReason] = useState('')
  const [deleteUserDialog, setDeleteUserDialog] = useState<{
    open: boolean
    userId: string
    userName: string
  }>({ open: false, userId: '', userName: '' })

  // Category management state
  const [categories, setCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoryForm, setCategoryForm] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    id?: string
    name: string
    description: string
    icon: string
    color: string
    sortOrder: number
  }>({
    open: false,
    mode: 'create',
    name: '',
    description: '',
    icon: '📁',
    color: '#6366f1',
    sortOrder: 0,
  })
  const [deleteConfirm, setDeleteConfirm] = useState<{open: boolean; id: string; name: string}>({
    open: false,
    id: '',
    name: '',
  })
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Post management state
  const [posts, setPosts] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postSearch, setPostSearch] = useState('')
  const [postStatusFilter, setPostStatusFilter] = useState('')
  const [postPagination, setPostPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [postDeleteConfirm, setPostDeleteConfirm] = useState<{open: boolean; id: string; title: string}>({
    open: false,
    id: '',
    title: '',
  })

  // Accordion state for style panels
  const [openStylePanels, setOpenStylePanels] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/signin')
    if (session && (session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'MODERATOR') router.push('/')
  }, [session, status, router])

  useEffect(() => {
    if (session && (session.user as any).role === 'ADMIN') {
      fetch('/api/site-config')
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.error) {
            setConfig(data)
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [session])

  const updateField = useCallback((field: keyof SiteConfig, value: string | boolean) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(t('admin.saved'))
        setConfig(data)
      } else {
        setMessage(t('admin.saveFailed', { error: data.error || 'Unknown error' }))
      }
    } catch {
      setMessage(t('admin.saveNetworkError'))
    }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const fetchUsers = useCallback(async (page = 1, search = '') => {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users)
        setUserPagination(data.pagination)
      }
    } catch {
      console.error('获取用户列表失败')
    }
    setUsersLoading(false)
  }, [])

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true)
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      if (res.ok) {
        setCategories(data)
      }
    } catch {
      console.error('获取版块列表失败')
    }
    setCategoriesLoading(false)
  }, [])

  const handleCategorySave = useCallback(async () => {
    const { mode, id, name, description, icon, color, sortOrder } = categoryForm
    if (!name.trim()) {
      setMessage(t('admin.categories.nameRequired'))
      setTimeout(() => setMessage(''), 3000)
      return
    }

    try {
      let res
      if (mode === 'create') {
        res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description, icon, color, sortOrder }),
        })
      } else {
        res = await fetch('/api/admin/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, name, description, icon, color, sortOrder }),
        })
      }
      const data = await res.json()
      if (res.ok) {
        setMessage(mode === 'create' ? t('admin.categories.messages.created') : t('admin.categories.messages.updated'))
        setCategoryForm(prev => ({ ...prev, open: false }))
        fetchCategories()
      } else {
        setMessage(t('admin.categories.messages.failed', { error: data.error || 'Unknown error' }))
      }
    } catch {
      setMessage(t('admin.categories.messages.error'))
    }
    setTimeout(() => setMessage(''), 3000)
  }, [categoryForm, fetchCategories])

  const handleDeleteCategory = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/categories/${deleteConfirm.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(t('admin.categories.messages.deleted'))
        setDeleteConfirm({ open: false, id: '', name: '' })
        fetchCategories()
      } else {
        setMessage(t('admin.categories.messages.deleteFailed', { error: data.error || 'Unknown error' }))
      }
    } catch {
      setMessage(t('admin.categories.messages.deleteError'))
    }
    setTimeout(() => setMessage(''), 3000)
  }, [deleteConfirm, fetchCategories])

  const handleUserSearch = useCallback(() => {
    fetchUsers(1, userSearch)
  }, [fetchUsers, userSearch])

  const handleBanUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${banDialog.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isBanned: true,
          banDays: parseInt(banDays) || 0,
          banReason: banReason || 'Violation',
        }),
      })
      if (res.ok) {
        setMessage(t('admin.users.messages.banSuccess'))
        setBanDialog({ open: false, userId: '', userName: '' })
        setBanDays('')
        setBanReason('')
        fetchUsers(userPagination.page, userSearch)
      } else {
        const data = await res.json()
        setMessage(t('admin.users.messages.banFailed', { error: data.error || 'Unknown error' }))
      }
    } catch {
      setMessage(t('admin.users.messages.banError'))
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleUnbanUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: false }),
      })
      if (res.ok) {
        setMessage(t('admin.users.messages.unbanSuccess'))
        fetchUsers(userPagination.page, userSearch)
      } else {
        const data = await res.json()
        setMessage(t('admin.users.messages.unbanFailed', { error: data.error || 'Unknown error' }))
      }
    } catch {
      setMessage(t('admin.users.messages.unbanError'))
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleDeleteUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${deleteUserDialog.userId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMessage(t('admin.users.messages.deleteSuccess'))
        setDeleteUserDialog({ open: false, userId: '', userName: '' })
        fetchUsers(userPagination.page, userSearch)
      } else {
        const data = await res.json()
        setMessage(t('admin.users.messages.deleteFailed', { error: data.error || 'Unknown error' }))
      }
    } catch {
      setMessage(t('admin.users.messages.deleteError'))
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handleToggleModerator = async (user: UserInfo) => {
    const newRole = user.role === 'MODERATOR' ? 'USER' : 'MODERATOR'
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        setMessage(newRole === 'MODERATOR' ? t('admin.users.messages.setModeratorSuccess') : t('admin.users.messages.unsetModeratorSuccess'))
        fetchUsers(userPagination.page, userSearch)
      } else {
        const data = await res.json()
        setMessage(t('admin.categories.messages.failed', { error: data.error || 'Unknown error' }))
      }
    } catch {
      setMessage(t('admin.categories.messages.error'))
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const fetchPosts = useCallback(async (page = 1, search = '', status = '') => {
    setPostsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      const res = await fetch(`/api/admin/posts?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setPosts(data.posts)
        setPostPagination(data.pagination)
      }
    } catch {
      console.error('获取帖子列表失败')
    }
    setPostsLoading(false)
  }, [])

  const handlePostSearch = useCallback(() => {
    fetchPosts(1, postSearch, postStatusFilter)
  }, [fetchPosts, postSearch, postStatusFilter])

  const handleDeletePost = async () => {
    try {
      const res = await fetch(`/api/admin/posts/${postDeleteConfirm.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMessage(t('admin.posts.messages.deleteSuccess'))
        setPostDeleteConfirm({ open: false, id: '', title: '' })
        fetchPosts(postPagination.page, postSearch, postStatusFilter)
      } else {
        const data = await res.json()
        setMessage(t('admin.posts.messages.deleteFailed', { error: data.error || 'Unknown error' }))
      }
    } catch {
      setMessage(t('admin.posts.messages.deleteError'))
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const handlePostAction = async (postId: string, action: string, value: boolean) => {
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [action]: value }),
      })
      const data = await res.json()
      if (res.ok) {
        const actionLabels: Record<string, string> = {
          isEssence: value ? t('admin.posts.messages.essenceSet') : t('admin.posts.messages.essenceUnset'),
          isPinned: value ? t('admin.posts.messages.pinnedSet') : t('admin.posts.messages.pinnedUnset'),
          commentsLocked: value ? t('admin.posts.messages.commentsLocked') : t('admin.posts.messages.commentsUnlocked'),
        }
        setMessage(`✅ ${actionLabels[action] || t('admin.posts.messages.actionSuccess')}`)
        fetchPosts(postPagination.page, postSearch, postStatusFilter)
      } else {
        setMessage(`❌ ${data.error || t('admin.posts.messages.actionError')}`)
      }
    } catch {
      setMessage(t('admin.posts.messages.actionError'))
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const postStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PUBLISHED: t('admin.posts.published'),
      DRAFT: t('admin.posts.draft'),
      HIDDEN: t('admin.posts.hidden'),
      DELETED: t('admin.posts.deleted'),
    }
    return labels[status] || status
  }

  const postStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PUBLISHED: 'text-green-600 bg-green-50',
      DRAFT: 'text-yellow-600 bg-yellow-50',
      HIDDEN: 'text-gray-600 bg-gray-50',
      DELETED: 'text-red-600 bg-red-50',
    }
    return colors[status] || 'text-gray-600 bg-gray-50'
  }

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(1, '')
    } else if (activeTab === 'categories') {
      fetchCategories()
    } else if (activeTab === 'posts') {
      fetchPosts(1, '', '')
    }
  }, [activeTab, fetchUsers, fetchCategories, fetchPosts])

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showEmojiPicker])

  if (status === 'loading' || loading) {
    return <div className="text-center py-20 text-gray-500">{t('admin.loading')}</div>
  }
  if (!session || ((session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'MODERATOR')) return null

  // 根据角色筛选可见的标签
  const userRole = (session?.user as any)?.role
  const allTabs = [
    { key: 'home' as const, label: t('admin.tabs.home') },
    { key: 'about' as const, label: t('admin.tabs.about') },
    { key: 'contact' as const, label: t('admin.tabs.contact') },
    { key: 'footer' as const, label: t('admin.tabs.footer') },
    { key: 'users' as const, label: t('admin.tabs.users') },
    { key: 'categories' as const, label: t('admin.tabs.categories') },
    { key: 'posts' as const, label: t('admin.tabs.posts') },
    { key: 'version' as const, label: t('admin.tabs.version') },
  ]
  // MODERATOR 只能看到帖子管理
  const tabs = userRole === 'MODERATOR'
    ? allTabs.filter(t => t.key === 'posts')
    : allTabs

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-700',
      MODERATOR: 'bg-blue-100 text-blue-700',
      USER: 'bg-gray-100 text-gray-600',
    }
    const labels: Record<string, string> = {
      ADMIN: t('admin.users.roles.ADMIN'),
      MODERATOR: t('admin.users.roles.MODERATOR'),
      USER: t('admin.users.roles.USER'),
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
        <h1 className="text-2xl font-bold text-gray-800">{t('admin.title')}</h1>
        <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-700">
          {t('admin.backHome')}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {activeTab === 'home' && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">{t('admin.home.title')}</h2>

            {/* Toolbar Settings */}
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-md font-semibold text-gray-700 mb-3">{t('admin.home.toolbarSettings')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.home.toolbarTitle')}</label>
                  <input
                    type="text"
                    value={config.toolbarTitle}
                    onChange={(e) => updateField('toolbarTitle', e.target.value)}
                    placeholder={t('admin.home.toolbarTitlePlaceholder')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{t('admin.home.toolbarTitleHint')}</p>
                  <button
                    type="button"
                    onClick={() => setOpenStylePanels(p => ({ ...p, toolbarTitle: !p.toolbarTitle }))}
                    className="mt-2 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                  >
                    {t('admin.home.textStyle')} {openStylePanels.toolbarTitle ? '▲' : '▼'}
                  </button>
                  {openStylePanels.toolbarTitle && <StylePanel textKey="toolbarTitle" config={config} updateField={updateField} />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.home.toolbarLogo')}</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={config.toolbarLogo}
                      onChange={(e) => updateField('toolbarLogo', e.target.value)}
                      placeholder={t('admin.home.toolbarLogoPlaceholder')}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                    <label className="shrink-0 cursor-pointer px-4 py-2.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium">
                      {t('admin.home.uploadImage')}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (file.size > 10 * 1024 * 1024) {
                            alert('Image cannot exceed 10MB')
                            return
                          }
                          const fd = new FormData()
                          fd.append('file', file)
                          const res = await fetch('/api/upload', {
                            method: 'POST',
                            body: fd,
                          })
                          const data = await res.json()
                          if (data.url) updateField('toolbarLogo', data.url)
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{t('admin.home.toolbarLogoSuggest')}</p>
                  {config.toolbarLogo && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={config.toolbarLogo} alt="Logo preview" className="w-9 h-9 rounded-lg object-cover border" />
                      <button
                        onClick={() => updateField('toolbarLogo', '')}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        {t('admin.home.clear')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ===== 首页欢迎语 ===== */}
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-md font-semibold text-gray-700 mb-3">{t('admin.home.heroWelcomeTitle')}</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.home.heroWelcomeLabel')}</label>
                <input
                  type="text"
                  value={config.heroWelcome}
                  onChange={(e) => updateField('heroWelcome', e.target.value)}
                  placeholder={t('admin.home.heroWelcomePlaceholder')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">{t('admin.home.heroWelcomeHint')}</p>
                <button
                  type="button"
                  onClick={() => setOpenStylePanels(p => ({ ...p, heroTitle: !p.heroTitle }))}
                  className="mt-2 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                >
                  {t('admin.home.textStyle')} {openStylePanels.heroTitle ? '▲' : '▼'}
                </button>
                {openStylePanels.heroTitle && <StylePanel textKey="heroTitle" config={config} updateField={updateField} />}
              </div>
            </div>

            {/* ===== 副标题 ===== */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.home.subtitle')}</label>
              <input
                type="text"
                value={config.siteSubtitle}
                onChange={(e) => updateField('siteSubtitle', e.target.value)}
                placeholder={t('admin.home.subtitlePlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">{t('admin.home.subtitleHint')}</p>
              <button
                type="button"
                onClick={() => setOpenStylePanels(p => ({ ...p, heroSubtitle: !p.heroSubtitle }))}
                className="mt-2 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                {t('admin.home.textStyle')} {openStylePanels.heroSubtitle ? '▲' : '▼'}
              </button>
              {openStylePanels.heroSubtitle && <StylePanel textKey="heroSubtitle" config={config} updateField={updateField} />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.home.tagline1')}</label>
              <input
                type="text"
                value={config.heroTagline1}
                onChange={(e) => updateField('heroTagline1', e.target.value)}
                placeholder={t('admin.home.tagline1Placeholder')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Hero tagline line 1</p>
              <button
                type="button"
                onClick={() => setOpenStylePanels(p => ({ ...p, heroTagline1: !p.heroTagline1 }))}
                className="mt-2 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                {t('admin.home.textStyle')} {openStylePanels.heroTagline1 ? '▲' : '▼'}
              </button>
              {openStylePanels.heroTagline1 && <StylePanel textKey="heroTagline1" config={config} updateField={updateField} />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.home.tagline2')}</label>
              <input
                type="text"
                value={config.heroTagline2}
                onChange={(e) => updateField('heroTagline2', e.target.value)}
                placeholder={t('admin.home.tagline2Placeholder')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Hero tagline line 2</p>
              <button
                type="button"
                onClick={() => setOpenStylePanels(p => ({ ...p, heroTagline2: !p.heroTagline2 }))}
                className="mt-2 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                {t('admin.home.textStyle')} {openStylePanels.heroTagline2 ? '▲' : '▼'}
              </button>
              {openStylePanels.heroTagline2 && <StylePanel textKey="heroTagline2" config={config} updateField={updateField} />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.home.joinTitle')}</label>
              <input
                type="text"
                value={config.heroJoinTitle}
                onChange={(e) => updateField('heroJoinTitle', e.target.value)}
                placeholder={t('admin.home.joinTitlePlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Join title hint - supports text styles</p>
              <button
                type="button"
                onClick={() => setOpenStylePanels(p => ({ ...p, heroJoinTitle: !p.heroJoinTitle }))}
                className="mt-2 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                {t('admin.home.textStyle')} {openStylePanels.heroJoinTitle ? '▲' : '▼'}
              </button>
              {openStylePanels.heroJoinTitle && <StylePanel textKey="heroJoinTitle" config={config} updateField={updateField} />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.home.joinSubtitle')}</label>
              <input
                type="text"
                value={config.heroJoinSubtitle}
                onChange={(e) => updateField('heroJoinSubtitle', e.target.value)}
                placeholder={t('admin.home.joinSubtitlePlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Join subtitle hint - supports text styles</p>
              <button
                type="button"
                onClick={() => setOpenStylePanels(p => ({ ...p, heroJoinSubtitle: !p.heroJoinSubtitle }))}
                className="mt-2 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                {t('admin.home.textStyle')} {openStylePanels.heroJoinSubtitle ? '▲' : '▼'}
              </button>
              {openStylePanels.heroJoinSubtitle && <StylePanel textKey="heroJoinSubtitle" config={config} updateField={updateField} />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.home.homeImage')}
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={config.siteImage}
                  onChange={(e) => updateField('siteImage', e.target.value)}
                  placeholder={t('admin.home.homeImagePlaceholder')}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <label className="shrink-0 cursor-pointer px-4 py-2.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium">
                  {t('admin.home.uploadImage')}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > 10 * 1024 * 1024) {
                        alert('Image cannot exceed 10MB')
                        return
                      }
                      const fd = new FormData()
                      fd.append('file', file)
                      const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: fd,
                      })
                      const data = await res.json()
                      if (res.ok && data.url) {
                        updateField('siteImage', data.url)
                      } else {
                        alert('Upload failed: ' + (data.error || 'Unknown error'))
                      }
                    }}
                  />
                </label>
              </div>
              {config.siteImage && (
                <div className="mt-3">
                  <img
                    src={config.siteImage}
                    alt="Preview"
                    className="max-h-48 rounded-lg border border-gray-200 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.home.poweredBy')}</label>
              <input
                type="text"
                value={config.footerPoweredBy}
                onChange={(e) => updateField('footerPoweredBy', e.target.value)}
                placeholder={t('admin.home.poweredByPlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">显示在页脚底部的技术提供信息</p>
            </div>

            {/* Hero 背景自定义 */}
            <div className="border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Hero 背景自定义</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!config.heroBgEnabled}
                    onChange={(e) => updateField('heroBgEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <p className="text-xs text-gray-400">开启后可自定义首页背景渐变颜色、透明度、模糊和亮度</p>

              {config.heroBgEnabled && (
                <>
                  {/* 颜色预览 */}
                  <div
                    className="w-full h-24 rounded-xl border border-gray-200 transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${config.heroBgColor1} 0%, ${config.heroBgColor2} 50%, ${config.heroBgColor3} 100%)`,
                      opacity: parseFloat(config.heroBgOpacity) || 1,
                      filter: `blur(${config.heroBgBlur || '0'}px) brightness(${config.heroBgBrightness || '1'})`,
                    }}
                  ></div>

                  {/* 三个渐变色 */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.heroBgColor1}
                          onChange={(e) => updateField('heroBgColor1', e.target.value)}
                          className="w-9 h-9 rounded border border-gray-300 cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={config.heroBgColor1}
                          onChange={(e) => updateField('heroBgColor1', e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Mid Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.heroBgColor2}
                          onChange={(e) => updateField('heroBgColor2', e.target.value)}
                          className="w-9 h-9 rounded border border-gray-300 cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={config.heroBgColor2}
                          onChange={(e) => updateField('heroBgColor2', e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.heroBgColor3}
                          onChange={(e) => updateField('heroBgColor3', e.target.value)}
                          className="w-9 h-9 rounded border border-gray-300 cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={config.heroBgColor3}
                          onChange={(e) => updateField('heroBgColor3', e.target.value)}
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 透明度和亮度 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Opacity: {parseFloat(config.heroBgOpacity).toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={config.heroBgOpacity}
                        onChange={(e) => updateField('heroBgOpacity', e.target.value)}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Brightness: {parseFloat(config.heroBgBrightness).toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0.3"
                        max="2"
                        step="0.1"
                        value={config.heroBgBrightness}
                        onChange={(e) => updateField('heroBgBrightness', e.target.value)}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>

                  {/* 模糊效果 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Blur: {config.heroBgBlur || '0'}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={config.heroBgBlur}
                      onChange={(e) => updateField('heroBgBlur', e.target.value)}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  {/* 恢复默认按钮 */}
                  <button
                    type="button"
                    onClick={() => {
                      updateField('heroBgEnabled', false)
                      updateField('heroBgColor1', '#4f46e5')
                      updateField('heroBgColor2', '#7c3aed')
                      updateField('heroBgColor3', '#6366f1')
                      updateField('heroBgOpacity', '1')
                      updateField('heroBgBlur', '0')
                      updateField('heroBgBrightness', '1')
                    }}
                    className="w-full py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-red-500 transition-colors"
                  >
                    Reset to Default
                  </button>
                </>
              )}
            </div>

            {/* 烟花特效设置 */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-md font-semibold text-gray-800 mb-3">🎆 Homepage Fireworks</h3>
              <p className="text-xs text-gray-400 mb-4">Fireworks play once per session on homepage entry.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (seconds): <span className="font-bold text-indigo-600">{config.fireworksDuration || 0}</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-6 text-right">0</span>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="1"
                      value={config.fireworksDuration ?? 15}
                      onChange={(e) => updateField('fireworksDuration', e.target.value)}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="text-xs text-gray-400 w-6">60</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs text-gray-400">0=Off</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-400">Recommended: 15s</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? t('admin.saving') : t('admin.save')}
            </button>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">{t('admin.aboutTab.title')}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.aboutTab.aboutTitle')}</label>
              <input
                type="text"
                value={config.aboutTitle}
                onChange={(e) => updateField('aboutTitle', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setOpenStylePanels(p => ({ ...p, aboutTitle: !p.aboutTitle }))}
                className="mt-2 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                {t('admin.home.textStyle')} {openStylePanels.aboutTitle ? '▲' : '▼'}
              </button>
              {openStylePanels.aboutTitle && <StylePanel textKey="aboutTitle" config={config} updateField={updateField} />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.aboutTab.aboutSubtitle')}</label>
              <input
                type="text"
                value={config.aboutSubtitle}
                onChange={(e) => updateField('aboutSubtitle', e.target.value)}
                placeholder="练川实验学校校园社区"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">显示在标题下方的副标题</p>
              <button
                type="button"
                onClick={() => setOpenStylePanels(p => ({ ...p, aboutSubtitle: !p.aboutSubtitle }))}
                className="mt-2 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                {t('admin.home.textStyle')} {openStylePanels.aboutSubtitle ? '▲' : '▼'}
              </button>
              {openStylePanels.aboutSubtitle && <StylePanel textKey="aboutSubtitle" config={config} updateField={updateField} />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.aboutTab.aboutContent')}</label>
              <textarea
                rows={6}
                value={config.aboutContent}
                onChange={(e) => updateField('aboutContent', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y"
              />
              <button
                type="button"
                onClick={() => setOpenStylePanels(p => ({ ...p, aboutContent: !p.aboutContent }))}
                className="mt-2 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                {t('admin.home.textStyle')} {openStylePanels.aboutContent ? '▲' : '▼'}
              </button>
              {openStylePanels.aboutContent && <StylePanel textKey="aboutContent" config={config} updateField={updateField} />}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.aboutTab.aboutImage')}
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={config.aboutImage}
                  onChange={(e) => updateField('aboutImage', e.target.value)}
                  placeholder="https://example.com/image.jpg 或点击上方上传"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <label className="shrink-0 cursor-pointer px-4 py-2.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium">
                  {t('admin.home.uploadImage')}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > 10 * 1024 * 1024) {
                        alert('Image cannot exceed 10MB')
                        return
                      }
                      const fd = new FormData()
                      fd.append('file', file)
                      const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: fd,
                      })
                      const data = await res.json()
                      if (res.ok && data.url) {
                        updateField('aboutImage', data.url)
                      } else {
                        alert('Upload failed: ' + (data.error || 'Unknown error'))
                      }
                    }}
                  />
                </label>
              </div>
              {config.aboutImage && (
                <div className="mt-3">
                  <img
                    src={config.aboutImage}
                    alt="Preview"
                    className="max-h-48 rounded-lg border border-gray-200 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? t('admin.saving') : t('admin.save')}
            </button>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">{t("admin.contact.title")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.contact.phone")}</label>
                <input
                  type="text"
                  value={config.contactPhone}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  placeholder="010-88886666"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.contact.email")}</label>
                <input
                  type="email"
                  value={config.contactEmail}
                  onChange={(e) => updateField('contactEmail', e.target.value)}
                  placeholder="contact@lc26.de"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.contact.wechat")}</label>
                <input
                  type="text"
                  value={config.contactWechat}
                  onChange={(e) => updateField('contactWechat', e.target.value)}
                  placeholder="lcsy"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.contact.qq")}</label>
                <input
                  type="text"
                  value={config.contactQQ}
                  onChange={(e) => updateField('contactQQ', e.target.value)}
                  placeholder="123456789"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.contact.address")}</label>
                <input
                  type="text"
                  value={config.contactAddress}
                  onChange={(e) => updateField('contactAddress', e.target.value)}
                  placeholder="练川市实验学校"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? t('admin.saving') : t('admin.save')}
            </button>
          </div>
        )}

        {activeTab === 'footer' && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-800">{t("admin.footer.title")}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.footer.copyright")}</label>
              <input
                type="text"
                value={config.footerCopyright}
                onChange={(e) => updateField('footerCopyright', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.footer.icp")}</label>
              <input
                type="text"
                value={config.footerIcp}
                onChange={(e) => updateField('footerIcp', e.target.value)}
                placeholder="京ICP备xxxxxxxx号"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? t('admin.saving') : t('admin.save')}
            </button>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{t("admin.users.title")}</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
                  placeholder={t('admin.users.search')}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-60"
                />
                <button
                  onClick={handleUserSearch}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                >
                  {t("admin.users.searchButton")}
                </button>
              </div>
            </div>

            {usersLoading ? (
              <div className="text-center py-10 text-gray-500">{t("admin.loading")}</div>
            ) : users.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No users yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-500">#</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">{t("admin.users.nickname")}</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">{t("admin.users.email")}</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500">{t("admin.users.level")}</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500">{t("admin.users.coins")}</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500">{t("admin.users.role")}</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500">{t("admin.users.status")}</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">{t("admin.users.registeredDate")}</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500">{t("admin.users.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2 text-gray-600 font-mono text-xs">
                          #{user.uid}
                        </td>
                        <td className="py-3 px-2 font-medium text-gray-800">
                          <div className="flex items-center gap-2">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-600 font-medium">
                                {(user.nickname || user.username)[0]}
                              </div>
                            )}
                            <span>{user.nickname || user.username}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-500">{user.email}</td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs font-medium">
                            Lv.{user.level}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-gray-600">{user.coins}</td>
                        <td className="py-3 px-2 text-center">{roleBadge(user.role)}</td>
                        <td className="py-3 px-2 text-center">
                          {user.isBanned ? (
                            <span className="text-red-500 text-xs font-medium">{t("admin.users.banned")}</span>
                          ) : (
                            <span className="text-green-500 text-xs font-medium">{t("admin.users.normal")}</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-gray-400 text-xs">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1 justify-center">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
                            >
                              {t("admin.users.edit")}
                            </Link>
                            {user.isBanned ? (
                              <button
                                onClick={() => handleUnbanUser(user.id)}
                                className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                              >
                                {t("admin.users.unban")}
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setBanDialog({
                                    open: true,
                                    userId: user.id,
                                    userName: user.nickname || user.username,
                                  })
                                }
                                className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                              >
                                {t("admin.users.ban")}
                              </button>
                            )}
                            {user.role === 'MODERATOR' ? (
                              <button
                                onClick={() => handleToggleModerator(user)}
                                className="px-2 py-1 text-xs bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition-colors"
                              >
                                {t("admin.users.unsetModerator")}
                              </button>
                            ) : user.role === 'USER' ? (
                              <button
                                onClick={() => handleToggleModerator(user)}
                                className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                              >
                                {t("admin.users.setModerator")}
                              </button>
                            ) : null}
                            {user.role !== 'ADMIN' && (
                              <button
                                onClick={() =>
                                  setDeleteUserDialog({
                                    open: true,
                                    userId: user.id,
                                    userName: user.nickname || user.username,
                                  })
                                }
                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                              >
                                {t("admin.users.delete")}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {userPagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => fetchUsers(userPagination.page - 1, userSearch)}
                  disabled={userPagination.page <= 1}
                  className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t("feed.prevPage")}
                </button>
                <span className="px-3 py-1 text-sm text-gray-500">
                  {userPagination.page} / {userPagination.totalPages} (共{userPagination.total}人)
                </span>
                <button
                  onClick={() => fetchUsers(userPagination.page + 1, userSearch)}
                  disabled={userPagination.page >= userPagination.totalPages}
                  className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t("feed.nextPage")}
                </button>
              </div>
            )}

            {/* Delete User Dialog */}
            {deleteUserDialog.open && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">⚠️ {t("admin.users.confirmDeleteTitle")}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {t("admin.users.confirmDeleteMessage", { name: deleteUserDialog.userName })}
                    <br/><br/>
                    {t("admin.users.confirmDeleteDescription")}
                    <br/>• {t("admin.users.allPosts")}
                    <br/>• {t("admin.users.allComments")}
                    <br/>• {t("admin.users.allLikes") || "所有点赞/收藏"}
                    <br/>• {t("admin.users.allFollows") || "所有关注关系"}
                    <br/><br/>
                    <span className="text-red-500 font-medium">{t("admin.users.irreversible") || "此操作不可恢复！"}</span>
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setDeleteUserDialog({ open: false, userId: '', userName: '' })}
                      className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {t("admin.users.cancel")}
                    </button>
                    <button
                      onClick={handleDeleteUser}
                      className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      {t("admin.users.confirmDelete")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Ban Dialog */}
            {banDialog.open && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{t("admin.users.banDialogTitle")}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {t("admin.users.banUserLabel")}: <span className="font-medium text-gray-700">{banDialog.userName}</span>
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("admin.users.banDaysLabel")}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={banDays}
                        onChange={(e) => setBanDays(e.target.value)}
                        placeholder={t("admin.users.banDaysPlaceholder")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("admin.users.banReasonLabel")}</label>
                      <input
                        type="text"
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder={t("admin.users.banDefaultReason")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      onClick={() => {
                        setBanDialog({ open: false, userId: '', userName: '' })
                        setBanDays('')
                        setBanReason('')
                      }}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {t("admin.users.cancel")}
                    </button>
                    <button
                      onClick={handleBanUser}
                      className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      {t("admin.users.confirmBan")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{t("admin.categories.title")}</h2>
              <button
                onClick={() =>
                  setCategoryForm({
                    open: true,
                    mode: 'create',
                    name: '',
                    description: '',
                    icon: '📁',
                    color: '#6366f1',
                    sortOrder: categories.length,
                  })
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                + {t("admin.categories.create")}
              </button>
            </div>

            {categoriesLoading ? (
              <div className="text-center py-10 text-gray-500">{t("admin.loading")}</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-10 text-gray-500">{t("admin.categories.noCategories")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-500 w-12">{t("admin.categories.sortOrder")}</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">{t("admin.categories.icon")}</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">{t("admin.categories.name")}</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">{t("admin.categories.description")}</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500">{t("admin.categories.postCount")}</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500">{t("admin.categories.moderators")}</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500">{t("admin.categories.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat: any) => (
                      <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2 text-gray-400 text-xs">{cat.sortOrder}</td>
                        <td className="py-3 px-2 text-lg">{cat.icon}</td>
                        <td className="py-3 px-2 font-medium text-gray-800">
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: cat.color }}
                          ></span>
                          {cat.name}
                        </td>
                        <td className="py-3 px-2 text-gray-500 max-w-[200px] truncate">
                          {cat.description || '-'}
                        </td>
                        <td className="py-3 px-2 text-center text-gray-600">{cat._count?.posts || 0}</td>
                        <td className="py-3 px-2 text-gray-500 text-xs">
                          {cat.moderators?.length > 0
                            ? cat.moderators
                                .map((m: any) => m.nickname || m.username)
                                .join(', ')
                            : '-'}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => {
                                setCategoryForm({
                                  open: true,
                                  mode: 'edit',
                                  id: cat.id,
                                  name: cat.name,
                                  description: cat.description || '',
                                  icon: cat.icon,
                                  color: cat.color,
                                  sortOrder: cat.sortOrder,
                                })
                              }}
                              className="px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
                            >
                              {t("admin.categories.edit")}
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirm({ open: true, id: cat.id, name: cat.name })
                              }}
                              className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                            >
                              {t("admin.categories.delete")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Category Form Dialog */}
            {categoryForm.open && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {categoryForm.mode === 'create' ? t("admin.categories.create") : t("admin.categories.edit")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
                      <input
                        type="text"
                        value={categoryForm.name}
                        onChange={(e) =>
                          setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder={t("admin.categories.namePlaceholder")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                      <input
                        type="text"
                        value={categoryForm.description}
                        onChange={(e) =>
                          setCategoryForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder={t("admin.categories.descriptionPlaceholder")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">图标</label>
                        <div className="relative emoji-picker-container">
                          <div
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm flex items-center gap-2 cursor-pointer hover:border-indigo-400 transition-colors"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          >
                            <span className="text-xl">{categoryForm.icon}</span>
                            <span className="text-gray-400 text-xs">点击选择</span>
                          </div>
                          {showEmojiPicker && (
                            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-72">
                              <div className="text-xs text-gray-400 mb-2">常用图标</div>
                              <div className="grid grid-cols-8 gap-1">
                                {EMOJI_LIST.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                      setCategoryForm((prev) => ({ ...prev, icon: emoji }))
                                      setShowEmojiPicker(false)
                                    }}
                                    className={`w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-indigo-50 transition-colors ${
                                      categoryForm.icon === emoji ? 'bg-indigo-100 ring-2 ring-indigo-300' : ''
                                    }`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <input
                                  type="text"
                                  value={categoryForm.icon}
                                  onChange={(e) =>
                                    setCategoryForm((prev) => ({ ...prev, icon: e.target.value }))
                                  }
                                  placeholder="或手动输入 Emoji"
                                  maxLength={2}
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">颜色</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={categoryForm.color}
                            onChange={(e) =>
                              setCategoryForm((prev) => ({ ...prev, color: e.target.value }))
                            }
                            className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={categoryForm.color}
                            onChange={(e) =>
                              setCategoryForm((prev) => ({ ...prev, color: e.target.value }))
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        排序序号（数字越小越靠前）
                      </label>
                      <input
                        type="number"
                        value={categoryForm.sortOrder}
                        onChange={(e) =>
                          setCategoryForm((prev) => ({
                            ...prev,
                            sortOrder: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      onClick={() => setCategoryForm((prev) => ({ ...prev, open: false }))}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleCategorySave}
                      className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      {categoryForm.mode === 'create' ? '创建' : '保存'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirm Dialog */}
            {deleteConfirm.open && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">确认删除</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {t("admin.categories.deleteConfirmText", { name: deleteConfirm.name })}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setDeleteConfirm({ open: false, id: '', name: '' })}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleDeleteCategory}
                      className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      确认删除
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">{t("admin.posts.title")}</h2>
              <span className="text-sm text-gray-400">
                Total {postPagination.total} posts
              </span>
            </div>

            {/* Search + Filter */}
            <div className="flex gap-2">
              <input
                type="text"
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePostSearch()}
                placeholder={t('admin.posts.search')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <select
                value={postStatusFilter}
                onChange={(e) => {
                  setPostStatusFilter(e.target.value)
                  fetchPosts(1, postSearch, e.target.value)
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="">{t("admin.posts.allStatus")}</option>
                <option value="PUBLISHED">{t('admin.posts.published')}</option>
                <option value="DRAFT">{t('admin.posts.draft')}</option>
                <option value="HIDDEN">{t('admin.posts.hidden')}</option>
                <option value="DELETED">{t("admin.posts.deleted")}</option>
              </select>
              <button
                onClick={handlePostSearch}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {t('admin.posts.searchButton')}
              </button>
            </div>

            {/* Posts Table */}
            {postsLoading ? (
              <div className="text-center py-10 text-gray-400 text-sm">加载中...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">{t("admin.posts.noPosts")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-500">{t("admin.posts.postTitle")}</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 w-24">{t("admin.posts.author")}</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500 w-16">{t("admin.posts.statusTitle")}</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500 w-16">评论</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500 w-16">点赞</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 w-28">{t("admin.posts.created")}</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500 w-32">{t("admin.posts.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {post.isEssence && <span className="text-xs">⭐</span>}
                            {post.isPinned && <span className="text-xs">📌</span>}
                            <span className={`truncate max-w-xs inline-block ${post.status === 'DELETED' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                              {post.title || '(无标题)'}
                            </span>
                            {post.category && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                                style={{ backgroundColor: post.category.color + '20', color: post.category.color }}
                              >
                                {post.category.icon} {post.category.name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-500">
                          {post.author?.nickname || post.author?.username || '未知'}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${postStatusColor(post.status)}`}>
                            {postStatusLabel(post.status)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-gray-500">{post._count?.comments || 0}</td>
                        <td className="py-3 px-2 text-center text-gray-500">{post._count?.likes || 0}</td>
                        <td className="py-3 px-2 text-gray-500 text-xs">
                          {new Date(post.createdAt).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {/* 管理员全部权限 */}
                            {userRole === 'ADMIN' && post.status !== 'DELETED' && (
                              <>
                                <button
                                  onClick={() => handlePostAction(post.id, 'commentsLocked', !post.commentsLocked)}
                                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                                    post.commentsLocked
                                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                  title={post.commentsLocked ? '已禁止评论，点击允许' : '禁止评论'}
                                >
                                  {post.commentsLocked ? '🔓评' : '🔒评'}
                                </button>
                                <button
                                  onClick={() => setPostDeleteConfirm({
                                    open: true,
                                    id: post.id,
                                    title: post.title || '(无标题)',
                                  })}
                                  className="px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  删帖
                                </button>
                              </>
                            )}
                            {/* 管理员 + 版主共有权限 */}
                            {post.status !== 'DELETED' && (
                              <>
                                <button
                                  onClick={() => handlePostAction(post.id, 'isEssence', !post.isEssence)}
                                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                                    post.isEssence
                                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                  title={post.isEssence ? '取消加精' : '加精'}
                                >
                                  {post.isEssence ? '⭐' : '☆'}
                                </button>
                                <button
                                  onClick={() => handlePostAction(post.id, 'isPinned', !post.isPinned)}
                                  className={`px-2 py-0.5 text-xs rounded transition-colors ${
                                    post.isPinned
                                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                  title={post.isPinned ? '取消置顶' : '置顶'}
                                >
                                  {post.isPinned ? '📌' : '📍'}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {postPagination.totalPages > 1 && (
              <div className="flex justify-center gap-1 mt-4">
                <button
                  disabled={postPagination.page <= 1}
                  onClick={() => fetchPosts(postPagination.page - 1, postSearch, postStatusFilter)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                >
                  上一页
                </button>
                {Array.from({ length: postPagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => fetchPosts(p, postSearch, postStatusFilter)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      p === postPagination.page
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={postPagination.page >= postPagination.totalPages}
                  onClick={() => fetchPosts(postPagination.page + 1, postSearch, postStatusFilter)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                >
                  下一页
                </button>
              </div>
            )}

            {/* Delete Confirm Dialog */}
            {postDeleteConfirm.open && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">确认删除帖子</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    确定要删除帖子「<span className="font-medium text-gray-700">{postDeleteConfirm.title}</span>」吗？
                  </p>
                  <p className="text-xs text-red-500 mb-4">此操作为软删除，帖子将对用户隐藏。</p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setPostDeleteConfirm({ open: false, id: '', title: '' })}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      确认删除
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'version' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">{t("admin.version.title")}</h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold">V1.0.0</span>
                <span className="text-sm text-gray-400">Current Version</span>
              </div>
              <div className="prose prose-sm max-w-none text-gray-600 space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">📋 功能列表</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5 shrink-0">●</span>
                        <span><b>用户系统</b> — 注册/登录/个人主页/资料编辑</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5 shrink-0">●</span>
                        <span><b>发帖系统</b> — 图文/投票/背景音乐/标签/分类</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5 shrink-0">●</span>
                        <span><b>评论系统</b> — 回复/引用/评论锁定/点赞</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5 shrink-0">●</span>
                        <span><b>版块管理</b> — 多版块/自定义图标/颜色/排序</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5 shrink-0">●</span>
                        <span><b>积分签到</b> — 每日签到/连续奖励/积分规则</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5 shrink-0">●</span>
                        <span><b>勋章系统</b> — 8种成就勋章/自动发放</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5 shrink-0">●</span>
                        <span><b>关注收藏</b> — 关注用户/收藏帖子</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5 shrink-0">●</span>
                        <span><b>通知系统</b> — 赞/评论/关注/系统通知</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5 shrink-0">●</span>
                        <span><b>管理后台</b> — 站点配置/用户/版块/帖子管理</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5 shrink-0">●</span>
                        <span><b>头像系统</b> — 注册12款卡通头像/自定义上传</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5 shrink-0">●</span>
                        <span><b>文字样式</b> — 全站文字颜色/大小/阴影/特效自定义</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5 shrink-0">●</span>
                        <span><b>首页Hero</b> — 欢迎语/标语/背景渐变/烟花特效</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5 shrink-0">●</span>
                        <span><b>版主体系</b> — 管理员/版主分级权限</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5 shrink-0">●</span>
                        <span><b>禁言系统</b> — 临时/永久禁言/自动解封</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5 shrink-0">●</span>
                        <span><b>防刷机制</b> — 发帖冷却/敏感词过滤</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5 shrink-0">●</span>
                        <span><b>全站配置</b> — 站点名/关于页/联系方式/页脚在线编辑</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-800 mb-3">🔄 数据同步</h4>
                  <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                    <p className="mb-1"><b>主副站 10 分钟自动同步</b></p>
                    <p className="text-blue-500 text-xs">主站与副站每 10 分钟增量同步一次数据（帖子/用户/评论/配置），确保两端数据一致。</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-800 mb-2">🖥 部署信息</h4>
                  <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-700">
                    <p className="mb-1"><b>💡 提示：</b>您可自行设置主站与副站域名</p>
                    <p className="text-amber-400 text-xs mt-2">进入 Nginx Proxy Manager 添加/修改域名即可</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {message && (activeTab !== 'users' && activeTab !== 'categories' && activeTab !== 'posts') && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm font-medium ${
              message.startsWith('✅')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message}
          </div>
        )}
        {message && activeTab === 'users' && !banDialog.open && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm font-medium ${
              message.startsWith('✅')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
