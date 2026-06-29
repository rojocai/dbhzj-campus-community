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

import zhMessages from "@/lib/lang/zh.json";
import enMessages from "@/lib/lang/en.json";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value === "en") ? "en" : "zh";
  const messages = lang === "en" ? enMessages : zhMessages;
  const site = messages.site as any;
  return {
    title: {
      default: site.defaultTitle || "Dongbaihu Home - Campus Forum Community",
      template: site.template || "%s | Dongbaihu Home",
    },
    description: site.description || "Dongbaihu Home Campus Forum Community",
    keywords: lang === "en"
      ? ["Dongbaihu Home", "Campus Forum", "Student Community", "School"]
      : ["东白湖之家", "校园论坛", "学习交流", "社团活动"],
  };
}

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
