<p align="right">
  <a href="README.md">🏠 Home</a> &nbsp;·&nbsp; <a href="README.zh.md">🇨🇳 中文版</a>
</p>

# 🏠 Dongbaihu Home Campus Forum

> A full-featured campus community system built with Next.js 16 + Prisma 5 + SQLite. Perfect for schools, classes, and clubs to build an internal communication platform.

---

## ✨ Features

### 👤 User System
- Registration, login, logout (NextAuth v4 + Credentials)
- Profile page: avatar, cover, bio, grade, class, gender, birthday
- Level/experience system, coin system
- Achievement badge system (auto-detected triggers)
- Daily check-in (streak rewards)
- Follow/follower system

### 📝 Posts
- Create posts (text, image gallery, video, poll)
- Post categories (custom icons and colors)
- Like, favorite, comment (threaded replies)
- Pin, mark as essence, lock comments
- Public/private/hidden visibility
- Paid posts (coin purchase)

### 👑 Admin Panel
- User management (search, ban, password change)
- Post management (delete, pin, mark essence)
- Category management (CRUD + sorting)
- Announcement management
- Site configuration (About Us, Contact, Footer, Hero, Fireworks, Text Styles)

### 🌐 Dynamic Config
- Site title, subtitle, logo configurable from admin panel
- Hero background gradient/color/opacity/blur/brightness
- Fireworks toggle and duration
- Text styles (JSON custom)
- Contact info (phone, email, WeChat, QQ, address)

### 🔧 Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: Prisma 5 + SQLite (zero config)
- **Auth**: NextAuth v4 (JWT)
- **Frontend**: React 19 + Tailwind CSS 4 + Heroicons
- **Data Fetching**: SWR
- **Multi-language**: Built-in Chinese + English, toggle anytime

---

## 🌐 Live Demo

| Page | Link | Description |
|------|------|-------------|
| 🏠 **Home** | [https://780417.xyz](https://780417.xyz) | Community home, check-in, feed |
| 🔧 **Admin** | [https://780417.xyz/admin](https://780417.xyz/admin) | Admin dashboard |
| 📝 **Feed** | [https://780417.xyz/feed](https://780417.xyz/feed) | Post list |
| ✅ **Check-in** | [https://780417.xyz/checkin](https://780417.xyz/checkin) | Daily check-in |

**Admin Account:** `admin@dongbaihu.com` / `admin123`

> ⏰ Database resets daily at 00:00 UTC+8 — all data will be cleared back to seed data.

---

## 📋 Quick Start

### Requirements
- Node.js 18+
- npm/pnpm
- Linux / macOS / Windows

### Installation

```bash
# 1. Clone
git clone https://github.com/rojocai/dbhzj-campus-community.git
cd dbhzj-campus-community

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit NEXTAUTH_URL and NEXTAUTH_SECRET

# 4. Initialize database
npx prisma db push
npx prisma db seed

# 5. Build & start
npm run build
npm start
```

### Default Admin
- Email: `admin@dongbaihu.com`
- Password: `admin123`

---

## 🚀 One-Click Deploy (Production)

Supports Debian / Ubuntu / CentOS / Fedora / RHEL / AlmaLinux / Rocky / Kali / Linux Mint.

```bash
# Auto install (recommended)
bash <(curl -fsSL https://raw.githubusercontent.com/rojocai/dbhzj-campus-community/main/install-campus.sh)

# Or download and run
wget https://raw.githubusercontent.com/rojocai/dbhzj-campus-community/main/install-campus.sh
chmod +x install-campus.sh
sudo bash install-campus.sh
```

Script Features:

| Feature | Description |
|---------|-------------|
| 🌐 Main site | Clone → npm install → build → systemd service |
| 🌐 Sub site | Deploy a second site (same/remote server) |
| ☁️ Cloudflare DNS | Auto-create A records via API |
| 🔒 SSL Cert | NPM + Let's Encrypt (DNS-01 challenge) |
| 🐳 Docker/NPM | Auto-configure Nginx Proxy Manager reverse proxy |
| 🔗 Remote SSH | Deploy sub-site on remote server (password/key) |

### Update

```bash
bash /opt/dbhzj-campus-community/update.sh
```

---

## 📦 Project Structure

```
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── page.tsx       # Home (feed + hero)
│   │   ├── feed/          # Post list
│   │   ├── create/        # Create post
│   │   ├── post/[id]/     # Post detail
│   │   ├── profile/       # User profile
│   │   ├── admin/         # Admin panel
│   │   ├── about/         # About page
│   │   ├── checkin/       # Daily check-in
│   │   ├── signin/        # Sign in
│   │   ├── signup/        # Sign up
│   │   └── user/[id]/     # User page
│   ├── components/        # Shared components
│   │   ├── Header.tsx     # Nav bar (with language toggle)
│   │   ├── Footer.tsx     # Footer
│   │   ├── LanguageSwitcher.tsx  # 中/EN toggle
│   │   └── ...
│   └── lib/
│       ├── auth.ts        # NextAuth config
│       ├── prisma.ts      # Prisma client
│       └── lang/          # i18n files
│           ├── zh.json    # Chinese translations
│           ├── en.json    # English translations
│           └── LangContext.tsx  # Language context
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── public/                # Static assets
├── install-campus.sh      # One-click deployment script
└── update.sh              # One-click update script
```

---

## 📜 License

MIT License

---

<p align="center">
  <a href="README.md">🏠 Home</a> &nbsp;·&nbsp; <a href="README.zh.md">🇨🇳 中文版</a> &nbsp;·&nbsp; <a href="https://780417.xyz">🌐 Live Demo</a> &nbsp;·&nbsp; <a href="https://github.com/rojocai/dbhzj-campus-community">📦 GitHub</a>
</p>
