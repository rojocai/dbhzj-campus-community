'use client'

import { useLang } from '@/lib/lang/LangContext'

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useLang()

  const toggleLang = () => {
    setLang(lang === 'zh' ? 'en' : 'zh')
  }

  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 bg-white hover:bg-gray-50 hover:border-indigo-300 text-gray-600 hover:text-indigo-600 transition-all shrink-0"
      title={lang === 'zh' ? 'English' : '中文'}
    >
      <span className={lang === 'zh' ? 'text-indigo-600 font-bold' : 'text-gray-400'}>中</span>
      <span className="text-gray-300">/</span>
      <span className={lang === 'en' ? 'text-indigo-600 font-bold' : 'text-gray-400'}>EN</span>
    </button>
  )
}
