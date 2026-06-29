import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import { LangProvider } from "@/lib/lang/LangContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { cookies } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "东白湖之家 - 校园论坛社区",
    template: "%s | 东白湖之家",
  },
  description: "东白湖之家校园论坛社区 — 交流学习，分享生活",
  keywords: ["东白湖之家", "校园论坛", "学习交流", "社团活动"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const lang = cookieStore.get('lang')?.value === 'en' ? 'en' : 'zh';

  return (
    <html
      lang={lang === 'en' ? 'en' : 'zh-CN'}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-[#0f172a]">
        <SessionProvider session={session}>
          <LangProvider initialLang={lang as 'zh' | 'en'}>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </LangProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
