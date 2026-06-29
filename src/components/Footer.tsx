'use client'

import Link from "next/link";
import useSWR from "swr";
import { PhoneIcon, EnvelopeIcon, ChatBubbleLeftIcon, ChatBubbleOvalLeftIcon } from "@heroicons/react/24/outline";
import { useLang } from "@/lib/lang/LangContext";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Footer() {
  const { data: siteConfig } = useSWR("/api/site-config", fetcher);
  const { t } = useLang();

  const contacts = [
    { key: 'contactPhone', label: t('about.phone'), icon: PhoneIcon, value: siteConfig?.contactPhone },
    { key: 'contactEmail', label: t('about.email'), icon: EnvelopeIcon, value: siteConfig?.contactEmail },
    { key: 'contactWechat', label: t('about.wechat'), icon: ChatBubbleLeftIcon, value: siteConfig?.contactWechat },
    { key: 'contactQQ', label: t('about.qq'), icon: ChatBubbleOvalLeftIcon, value: siteConfig?.contactQQ },
  ].filter((c) => c.value);

  const siteTitle = siteConfig?.siteTitle || t('site.title');

  return (
    <footer className="bg-[#1e293b] text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* School Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                {siteTitle.charAt(0)}
              </div>
              <span className="text-lg font-bold text-white">
                {siteTitle}
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              {t('footer.description', { siteTitle })}
            </p>
            <p className="text-sm text-gray-500 mt-3">
              {siteConfig?.footerCopyright || t('footer.copyright', { year: new Date().getFullYear(), siteTitle })}
            </p>
            {siteConfig?.footerIcp && (
              <p className="text-xs text-gray-500 mt-1">{siteConfig.footerIcp}</p>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/feed" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('footer.campusFeed')}
                </Link>
              </li>
              <li>
                <Link href="/create" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('footer.publishPost')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('footer.aboutUs')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t('footer.contact')}
            </h3>
            {contacts.length > 0 ? (
              <ul className="space-y-3 text-sm text-gray-400">
                {contacts.map((c) => {
                  const Icon = c.icon
                  return (
                    <li key={c.key} className="flex items-center gap-2">
                      <Icon className="w-4 h-4 shrink-0 text-gray-500" />
                      <span>{c.label}: {c.value}</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <ul className="space-y-2 text-sm text-gray-400">
                <li>{t('footer.contactPhone')}</li>
                <li>{t('footer.contactAddress')}</li>
              </ul>
            )}
            {siteConfig?.contactAddress && (
              <p className="text-xs text-gray-500 mt-3">{siteConfig.contactAddress}</p>
            )}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            {siteConfig?.footerPoweredBy
              ? t('footer.poweredBy', { text: siteConfig.footerPoweredBy })
              : t('footer.poweredBy', { text: '练川实验学校校园社区 v1.0 | Powered by Next.js & Prisma' })}
          </p>
          <div className="flex gap-4 text-xs text-gray-500">
            <Link href="/about" className="hover:text-gray-300">{t('about.privacy')}</Link>
            <Link href="/about" className="hover:text-gray-300">{t('about.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
