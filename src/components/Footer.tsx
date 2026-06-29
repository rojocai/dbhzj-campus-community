'use client'

import Link from "next/link";
import useSWR from "swr";
import { PhoneIcon, EnvelopeIcon, ChatBubbleLeftIcon, ChatBubbleOvalLeftIcon } from "@heroicons/react/24/outline";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Footer() {
  const { data: siteConfig } = useSWR("/api/site-config", fetcher);

  const contacts = [
    { key: 'contactPhone', label: '电话', icon: PhoneIcon, value: siteConfig?.contactPhone },
    { key: 'contactEmail', label: '邮箱', icon: EnvelopeIcon, value: siteConfig?.contactEmail },
    { key: 'contactWechat', label: '微信', icon: ChatBubbleLeftIcon, value: siteConfig?.contactWechat },
    { key: 'contactQQ', label: 'QQ', icon: ChatBubbleOvalLeftIcon, value: siteConfig?.contactQQ },
  ].filter((c) => c.value);

  return (
    <footer className="bg-[#1e293b] text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* School Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                {(siteConfig?.siteTitle || '东白湖之家').charAt(0)}
              </div>
              <span className="text-lg font-bold text-white">
                {siteConfig?.siteTitle || '东白湖之家'}
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-md">
              {siteConfig?.siteTitle || '东白湖之家'}校园社区平台，致力于为全校师生提供交流学习、分享生活的便捷空间。
            </p>
            <p className="text-sm text-gray-500 mt-3">
              {siteConfig?.footerCopyright || `© ${new Date().getFullYear()} 东白湖之家 版权所有`}
            </p>
            {siteConfig?.footerIcp && (
              <p className="text-xs text-gray-500 mt-1">{siteConfig.footerIcp}</p>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              快速链接
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/feed" className="text-sm text-gray-400 hover:text-white transition-colors">
                  校园广场
                </Link>
              </li>
              <li>
                <Link href="/create" className="text-sm text-gray-400 hover:text-white transition-colors">
                  发布帖子
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
                  关于我们
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              联系方式
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
                <li>邮箱: admin@dongbaihu.com</li>
                <li>地址: 练川市高新区学府路1号</li>
              </ul>
            )}
            {siteConfig?.contactAddress && (
              <p className="text-xs text-gray-500 mt-3">{siteConfig.contactAddress}</p>
            )}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            {siteConfig?.footerPoweredBy || '练川实验学校校园社区 v1.0 | Powered by Next.js & Prisma'}
          </p>
          <div className="flex gap-4 text-xs text-gray-500">
            <Link href="/about" className="hover:text-gray-300">隐私政策</Link>
            <Link href="/about" className="hover:text-gray-300">服务条款</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
