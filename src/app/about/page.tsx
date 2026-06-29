'use client'

import Link from "next/link";
import useSWR from "swr";
import StyledText from "@/components/StyledText";
import { useLang } from "@/lib/lang/LangContext";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AboutPage() {
  const { data: siteConfig, error } = useSWR("/api/site-config", fetcher);
  const { t } = useLang();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-indigo-600 transition-colors">{t('about.breadcrumbHome')}</Link>
        <span>/</span>
        <span className="text-gray-600">{t('about.breadcrumbAbout')}</span>
      </nav>

      {!siteConfig && !error && (
        <div className="text-center py-20 text-gray-400">{t('about.loading')}</div>
      )}

      {error && (
        <div className="text-center py-20 text-gray-400">
          {t('about.loadFailed')}
        </div>
      )}

      {siteConfig && !siteConfig.error && (
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-12 text-white">
            <h1 className="text-3xl font-bold mb-2">
              <StyledText siteConfig={siteConfig} textKey="aboutTitle">
                {siteConfig.aboutTitle || t('about.breadcrumbAbout')}
              </StyledText>
            </h1>
            <p className="text-indigo-100 text-sm">
              <StyledText siteConfig={siteConfig} textKey="aboutSubtitle">
                {siteConfig.aboutSubtitle || t('about.subtitle')}
              </StyledText>
            </p>
          </div>

          <div className="p-8">
            {siteConfig.aboutImage && (
              <div className="mb-8 rounded-xl overflow-hidden shadow-md">
                <img
                  src={siteConfig.aboutImage}
                  alt={siteConfig.aboutTitle || t('about.breadcrumbAbout')}
                  className="w-full object-cover max-h-96"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}

            <div className="prose prose-gray max-w-none">
              {siteConfig.aboutContent.split('\n').map((paragraph: string, i: number) => (
                paragraph.trim() ? (
                  <StyledText key={i} siteConfig={siteConfig} textKey="aboutContent" as="p" className="text-gray-600 leading-relaxed mb-4 text-lg">
                    {paragraph}
                  </StyledText>
                ) : null
              ))}
            </div>
          </div>

          {/* Contact Card */}
          {(siteConfig.contactPhone || siteConfig.contactEmail || siteConfig.contactWechat || siteConfig.contactQQ || siteConfig.contactAddress) && (
            <div className="border-t border-gray-100 bg-gray-50/50 px-8 py-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">{t('about.contactTitle')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {siteConfig.contactPhone && (
                  <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl shrink-0">📞</div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{t('about.phone')}</p>
                      <p className="text-sm font-medium text-gray-800">{siteConfig.contactPhone}</p>
                    </div>
                  </div>
                )}
                {siteConfig.contactEmail && (
                  <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 text-xl shrink-0">✉️</div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{t('about.email')}</p>
                      <p className="text-sm font-medium text-gray-800">{siteConfig.contactEmail}</p>
                    </div>
                  </div>
                )}
                {siteConfig.contactWechat && (
                  <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 text-xl shrink-0">💬</div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{t('about.wechat')}</p>
                      <p className="text-sm font-medium text-gray-800">{siteConfig.contactWechat}</p>
                    </div>
                  </div>
                )}
                {siteConfig.contactQQ && (
                  <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-xl shrink-0">💭</div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{t('about.qq')}</p>
                      <p className="text-sm font-medium text-gray-800">{siteConfig.contactQQ}</p>
                    </div>
                  </div>
                )}
              </div>
              {siteConfig.contactAddress && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <span>📍</span>
                  <span>{siteConfig.contactAddress}</span>
                </div>
              )}
            </div>
          )}
        </article>
      )}

      {/* Back to Home */}
      <div className="text-center mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          {t('about.backHome')}
        </Link>
      </div>
    </div>
  );
}
