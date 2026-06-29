<!--
东白湖之家校园论坛社区 - README
This file auto-detects language via browser. 
For direct links: README.zh.md (Chinese) | README.en.md (English)
-->

<p align="center">
  <a href="README.zh.md"><img src="https://img.shields.io/badge/🇨🇳-中文版-red?style=for-the-badge" alt="中文版"/></a>
  &nbsp;&nbsp;
  <a href="README.en.md"><img src="https://img.shields.io/badge/🇬🇧-English-blue?style=for-the-badge" alt="English"/></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js"/>
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma"/>
  <img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react"/>
  <img src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss"/>
  <img src="https://img.shields.io/badge/多语言-🌐中/EN-ff69b4?style=flat-square"/>
</p>

<p align="center">
  👆 <b>点击上方按钮切换语言</b> 👆
</p>

<br/>

# 🏠 东白湖之家校园论坛社区

> 一款功能完善的校园社区系统，基于 Next.js 16 + Prisma 5 + SQLite，适合学校、班级、社团搭建内部交流平台。  
> A full-featured campus community system built with Next.js 16 + Prisma 5 + SQLite. Perfect for schools, classes, and clubs.

---

## ✨ 功能特性 / Features

<table>
<tr>
<td width="50%">

### 👤 用户系统
- 注册、登录、退出（NextAuth v4）
- 个人主页：头像、封面、签名、年级班级
- 等级/经验值/硬币系统
- 勋章成就系统（自动检测）
- 每日签到（连续签到奖励）
- 关注/粉丝功能

### 📝 帖子系统
- 发帖（文本、图片、视频、投票）
- 分类管理（自定义图标颜色）
- 点赞、收藏、评论（楼中楼）
- 置顶、加精、锁定评论
- 付费帖子（硬币购买）

### 👑 管理员系统
- 用户管理（搜索/禁言/改密）
- 帖子管理（删除/置顶/加精）
- 分类/公告管理
- 站点配置（Hero 背景、烟花、联系方式等）

</td>
<td width="50%">

### 👤 User System
- Registration, login, logout (NextAuth v4)
- Profile: avatar, cover, bio, grade, class
- Level/Experience/Coin system
- Achievement badges (auto-detect)
- Daily check-in (streak rewards)
- Follow/follower system

### 📝 Posts
- Create posts (text, gallery, video, poll)
- Category management (custom icons/colors)
- Like, favorite, comment (threaded replies)
- Pin, essence, lock comments
- Paid posts (coin purchase)

### 👑 Admin Panel
- User management (search/ban/password)
- Post management (delete/pin/essence)
- Category/Announcement management
- Site config (Hero, Fireworks, Contact, etc.)

</td>
</tr>
</table>

### 🔧 技术栈 / Tech Stack

| 类别 | 技术 |
|------|------|
| **框架** | Next.js 16 (App Router) |
| **数据库** | Prisma 5 + SQLite（零配置） |
| **认证** | NextAuth v4 (JWT) |
| **前端** | React 19 + Tailwind CSS 4 + Heroicons |
| **数据** | SWR |
| **多语言** | 内置中/英文，一键切换 |

---

## 🌐 在线演示 / Live Demo

| 页面 / Page | 链接 / Link | 说明 |
|-------------|-------------|------|
| 🏠 首页 / Home | [https://780417.xyz](https://780417.xyz) | 社区首页、签到、信息流 |
| 🔧 管理 / Admin | [https://780417.xyz/admin](https://780417.xyz/admin) | 管理后台 |
| 📝 广场 / Feed | [https://780417.xyz/feed](https://780417.xyz/feed) | 帖子列表 |
| ✅ 签到 / Check-in | [https://780417.xyz/checkin](https://780417.xyz/checkin) | 每日签到 |

**管理员账号 / Admin Account：** `admin@dongbaihu.com` / `admin123`

> ⏰ 演示站每天 00:00 自动重置数据库 / Database resets daily at 00:00 UTC+8

---

## 📋 快速开始 / Quick Start

### 环境要求 / Requirements
- Node.js 18+
- npm / pnpm

```bash
# 克隆 / Clone
git clone https://github.com/rojocai/dbhzj-campus-community.git
cd dbhzj-campus-community

# 安装依赖 / Install dependencies
npm install

# 配置环境 / Configure
cp .env.example .env
# 编辑 .env 中的 NEXTAUTH_URL 和 NEXTAUTH_SECRET

# 初始化数据库 / Init database
npx prisma db push
npx prisma db seed

# 构建并启动 / Build & start
npm run build
npm start
```

---

## 🚀 一键部署 / One-Click Deploy

支持 Debian / Ubuntu / CentOS / Fedora / RHEL / AlmaLinux / Rocky / Kali / Linux Mint。

### 自动安装 / Auto Install

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/rojocai/dbhzj-campus-community/main/install-campus.sh)
```

### 手动下载 / Manual Download

```bash
wget https://raw.githubusercontent.com/rojocai/dbhzj-campus-community/main/install-campus.sh
chmod +x install-campus.sh
sudo bash install-campus.sh
```

### 部署功能 / Features

| 功能 | 说明 |
|------|------|
| 🌐 主站部署 | 克隆源码 → npm install → build → systemd 服务 |
| 🌐 副站部署 | 同机/远程服务器部署第二个站点 |
| ☁️ DNS 配置 | Cloudflare API → 自动创建 A 记录 |
| 🔒 SSL 证书 | NPM + Let's Encrypt (DNS-01) |
| 🐳 Docker/NPM | Nginx Proxy Manager 自动反代 |
| 🔗 远程部署 | SSH 连接远程服务器部署副站 |

### 🆙 升级 / Update

```bash
bash /opt/dbhzj-campus-community/update.sh
```

---

## 📦 项目结构 / Project Structure

```
├── src/
│   ├── app/               # 页面 Pages
│   │   ├── page.tsx       # 首页 Home
│   │   ├── feed/          # 广场 Feed
│   │   ├── create/        # 发帖 Create Post
│   │   ├── post/[id]/     # 帖子详情 Post Detail
│   │   ├── profile/       # 个人主页 Profile
│   │   ├── admin/         # 管理后台 Admin
│   │   ├── about/         # 关于我们 About
│   │   ├── checkin/       # 签到 Check-in
│   │   ├── signin/        # 登录 Sign In
│   │   ├── signup/        # 注册 Sign Up
│   │   └── user/[id]/     # 用户主页 User Page
│   ├── components/        # 通用组件 Components
│   └── lib/               # 工具库 Libraries
│       └── lang/          # 多语言 i18n (zh/en)
├── prisma/
│   ├── schema.prisma      # 数据库模型
│   └── seed.ts            # 种子数据
├── install-campus.sh      # 一键部署脚本
└── update.sh              # 一键升级脚本
```

---

## 📜 License

MIT License

---

<p align="center">
  <a href="README.zh.md">🇨🇳 中文版</a>
  &nbsp;·&nbsp;
  <a href="README.en.md">🇬🇧 English</a>
  &nbsp;·&nbsp;
  <a href="https://780417.xyz">🌐 在线演示 Live Demo</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/rojocai/dbhzj-campus-community">📦 GitHub</a>
</p>
