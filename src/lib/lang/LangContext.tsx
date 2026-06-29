'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import zhMessages from './zh.json'
import enMessages from './en.json'

type Lang = 'zh' | 'en'

interface LangContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LangContext = createContext<LangContextType>({
  lang: 'zh',
  setLang: () => {},
  t: (key: string) => key,
})

const ALL_MESSAGES: Record<string, any> = {
  zh: zhMessages,
  en: enMessages,
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  const keys = path.split('.')
  let result: any = obj
  for (const key of keys) {
    if (result == null || typeof result !== 'object') return undefined
    result = result[key]
  }
  return result
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    const val = params[key]
    return val != null ? String(val) : `{${key}}`
  })
}

export function LangProvider({ children, initialLang = 'zh' }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    const saved = localStorage.getItem('lang')
    if (saved === 'en' || saved === 'zh') {
      setLangState(saved)
    }
  }, [])

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem('lang', newLang)
    document.cookie = `lang=${newLang}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const messages = ALL_MESSAGES[lang] || ALL_MESSAGES['zh']
      const value = getNestedValue(messages, key)
      if (value === undefined || typeof value === 'object') {
        // Fallback to Chinese
        const zhValue = getNestedValue(ALL_MESSAGES['zh'], key)
        if (typeof zhValue === 'string') return interpolate(zhValue, params)
        console.warn(`[i18n] Missing translation key: ${key}`)
        return key
      }
      if (typeof value === 'string') return interpolate(value, params)
      return String(value)
    },
    [lang]
  )

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const context = useContext(LangContext)
  if (!context) {
    throw new Error('useLang must be used within a LangProvider')
  }
  return context
}

export default LangContext
