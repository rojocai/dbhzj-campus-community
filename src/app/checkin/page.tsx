'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  FireIcon,
  SparklesIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { useLang } from '@/lib/lang/LangContext'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function CheckinPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const user = session?.user as any
  const { t, lang } = useLang()

  const {
    data: pointsData,
    error: pointsError,
    isLoading: pointsLoading,
    mutate: mutatePoints,
  } = useSWR('/api/points', fetcher)
  const { data: rules, error: rulesError } = useSWR(
    '/api/points/rule',
    fetcher
  )

  const [signingIn, setSigningIn] = useState(false)
  const [signinResult, setSigninResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    }
  }, [status, router])

  const handleSignIn = async () => {
    setSigningIn(true)
    setSigninResult(null)
    try {
      const res = await fetch('/api/points/signin', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSigninResult({ success: true, message: data.message })
        mutatePoints()
        setTimeout(() => router.push('/'), 1500)
      } else {
        setSigninResult({
          success: false,
          message: data.error || t('checkin.signinFailed'),
        })
      }
    } catch {
      setSigninResult({ success: false, message: t('checkin.signinNetworkError') })
    }
    setSigningIn(false)
  }

  // Build calendar grid
  const buildCalendar = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const firstDay = new Date(year, month, 1).getDay() // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const signedDates = new Set(pointsData?.monthRecords || [])
    const todayStr = now.toISOString().slice(0, 10)

    const cells: { day: number; signed: boolean; isToday: boolean }[] = []

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: 0, signed: false, isToday: false })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        day: d,
        signed: signedDates.has(dateStr),
        isToday: dateStr === todayStr,
      })
    }

    return cells
  }

  if (status === 'loading' || pointsLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded-2xl"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('checkin.loginRequired')}</h2>
        <p className="text-gray-500 mb-6">{t('checkin.loginRequiredDesc')}</p>
        <Link
          href="/signin"
          className="inline-block px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
        >
          {t('checkin.signinNow')}
        </Link>
      </div>
    )
  }

  const calendar = buildCalendar()
  const weekDays = t('checkin.calendar.weekdays') as unknown as string[]
  const monthNames = t('checkin.calendar.months') as unknown as string[]
  const now = new Date()

  // Determine streak bonus info
  const streakForBonus =
    pointsData?.currentStreak >= 30
      ? 30
      : pointsData?.currentStreak >= 7
        ? 7
        : pointsData?.currentStreak >= 3
          ? 3
          : null
  const streakBonus =
    streakForBonus === 30 ? 50 : streakForBonus === 7 ? 15 : streakForBonus === 3 ? 5 : 0

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('checkin.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('checkin.subtitle')}</p>
        </div>
        <Link
          href="/"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          {t('checkin.backHome')}
        </Link>
      </div>

      {/* Points Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-indigo-600">
              {pointsData?.coins || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">{t('checkin.points')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-500">
              {pointsData?.experience || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">{t('checkin.experience')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">
              Lv.{pointsData?.level || 1}
            </div>
            <div className="text-xs text-gray-500 mt-1">{t('checkin.level')}</div>
          </div>
        </div>
      </div>

      {/* Sign-in Button + Streak */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FireIcon className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">
              {t('checkin.streak')}
            </span>
            <span className="text-2xl font-bold text-orange-500">
              {pointsData?.currentStreak || 0}
            </span>
            <span className="text-sm text-gray-400">{t('checkin.days')}</span>
          </div>
          {streakForBonus && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
              <SparklesIcon className="w-3.5 h-3.5" />
              {t('checkin.streakBonus', { bonus: streakBonus })}
            </div>
          )}
        </div>

        {/* Streak progress bar */}
        <div className="mb-6">
          <div className="flex gap-1 mb-2">
            {[3, 7, 30].map((target) => {
              const achieved = (pointsData?.currentStreak || 0) >= target
              const pct = Math.min(
                100,
                ((pointsData?.currentStreak || 0) / target) * 100
              )
              return (
                <div
                  key={target}
                  className={`flex-1 h-2 rounded-full ${
                    achieved ? 'bg-green-400' : 'bg-gray-100'
                  }`}
                  style={{
                    background: achieved
                      ? undefined
                      : `linear-gradient(to right, #34d399 ${pct}%, #f3f4f6 ${pct}%)`,
                  }}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{t('checkin.streak3')}</span>
            <span>{t('checkin.streak7')}</span>
            <span>{t('checkin.streak30')}</span>
          </div>
        </div>

        {/* Sign-in Button */}
        <button
          onClick={handleSignIn}
          disabled={signingIn || pointsData?.signedInToday}
          className={`w-full py-3.5 rounded-xl font-medium text-base transition-all flex items-center justify-center gap-2 ${
            pointsData?.signedInToday
              ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98] disabled:opacity-50'
          }`}
        >
          {signingIn ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              {t('checkin.signingIn')}
            </>
          ) : pointsData?.signedInToday ? (
            <>
              <CheckCircleIcon className="w-5 h-5" />
              {t('checkin.signedInToday')}
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5" />
              {t('checkin.signinButton')}
            </>
          )}
        </button>

        {/* Sign-in result message */}
        {signinResult && (
          <div
            className={`mt-3 text-sm text-center font-medium ${
              signinResult.success ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {signinResult.message}
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-semibold text-gray-800">
              {t('checkin.calendar.title', { year: now.getFullYear(), month: monthNames[now.getMonth()] })}
            </h2>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span className="inline-block w-3 h-3 rounded bg-green-400"></span>
            <span>{t('checkin.calendar.legendSigned')}</span>
            <span className="ml-2 inline-block w-3 h-3 rounded border border-dashed border-indigo-300"></span>
            <span>{t('checkin.calendar.legendToday')}</span>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map((d: string) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-gray-400 py-2"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendar.map((cell, idx) => (
            <div
              key={idx}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm ${
                cell.day === 0
                  ? ''
                  : cell.signed
                    ? 'bg-green-100 text-green-700 font-medium'
                    : cell.isToday
                      ? 'border-2 border-dashed border-indigo-300 text-indigo-600 font-medium'
                      : 'text-gray-500'
              }`}
            >
              {cell.day > 0 ? cell.day : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Points Rules */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          {t('checkin.rules.title')}
        </h2>

        {/* Sign-in Rules */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <CalendarDaysIcon className="w-4 h-4 text-indigo-500" />
            {t('checkin.rules.dailyCheckin')}
          </h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between py-1.5 px-3 rounded-lg bg-gray-50">
              <span className="text-gray-600">{t('checkin.rules.dailyPoints')}</span>
              <span className="font-medium text-indigo-600">+10</span>
            </div>
            {rules?.streakBonuses?.map(
              (bonus: { consecutiveDays: number; bonus: number; description: string }) => (
                <div
                  key={bonus.consecutiveDays}
                  className="flex justify-between py-1.5 px-3 rounded-lg bg-gray-50"
                >
                  <span className="text-gray-600">{bonus.description}</span>
                  <span className="font-medium text-amber-600">
                    +{bonus.bonus}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Action Rules */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <SparklesIcon className="w-4 h-4 text-indigo-500" />
            {t('checkin.rules.communityActivity')}
          </h3>
          <div className="space-y-1.5 text-sm">
            {rules?.actions?.map(
              (rule: { action: string; points: number; description: string }) => (
                <div
                  key={rule.action}
                  className="flex justify-between py-1.5 px-3 rounded-lg bg-gray-50"
                >
                  <span className="text-gray-600">{rule.description}</span>
                  <span className="font-medium text-emerald-600">
                    +{rule.points}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Experience note */}
        {rules?.experience && (
          <div className="mt-4 p-3 rounded-lg bg-indigo-50 text-xs text-indigo-700">
            💡 {rules.experience.formula} · {rules.experience.levels}
          </div>
        )}
      </div>
    </div>
  )
}
