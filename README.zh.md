<p align="right">
  <a href="README.md">🏠 双语版 / Bilingual</a> &nbsp;·&nbsp; <a href="README.en.md">🇬🇧 English</a>
</p>

# 🏠 东白湖之家校园论坛社区

> 一款功能完善的校园社区系统，基于 Next.js 16 + Prisma 5 + SQLite，适合学校、班级、社团搭建内部交流平台。

---

## ✨ 功能特性

### 👤 用户系统
- 用户注册、登录、退出（NextAuth v4 + Credentials）
- 个人主页：头像、封面、签名、年级班级、性别、生日
- 等级/经验值系统、硬币系统
- 勋章成就系统（自动检测触发）
- 每日签到（连续签到奖励）
- 关注/粉丝功能

### 📝 帖子系统
- 发帖（纯文本、图片、视频、投票帖）
- 帖子分类管理（自定义分类图标和颜色）
- 帖子点赞、收藏、评论（支持楼中楼回复）
- 帖子置顶、加精、锁定评论
- 帖子可见性设置（公开/私密/隐藏）
- 付费帖子（硬币购买）

### 👑 管理员系统
- 用户管理（搜索、禁言/封禁、改密）
- 帖子管理（删除、置顶、加精）
- 分类管理（增删改、排序）
- 公告管理
- 站点配置后台管理（关于我们、联系方式、页脚、首页欢迎语、Hero背景、烟花特效、文字样式等）

### 🌐 动态配置
- 站点标题、副标题、Logo 后台可配
- Hero 区域背景渐变/颜色/透明度/模糊度/亮度自定义
- 烟花特效开关和时长
- 文字样式配置（支持 JSON 自定义）
- 联系方式（电话、邮箱、微信、QQ、地址）后台可配

### 🔧 技术栈
- **框架**: Next.js 16 (App Router)
- **数据库**: Prisma 5 + SQLite（零配置，即开即用）
- **认证**: NextAuth v4 (JWT)
- **前端**: React 19 + Tailwind CSS 4 + Heroicons
- **数据获取**: SWR
- **多语言**: 内置中/英文，一键切换
- **种子数据**: TypeScript 种子脚本

---

## 🌐 在线演示

| 页面 | 链接 |
|------|------|
| 🏠 **首页** | [https://780417.xyz](https://780417.xyz) |
| 🔧 **管理后台** | [https://780417.xyz/admin](https://780417.xyz/admin) |

**管理员账号：** `admin@dongbaihu.com` / `admin123`

> ⏰ **注意**：演示站数据库每天凌晨 00:00 自动重置为初始状态，所有用户数据将被清空恢复至种子数据。

---

## 📋 快速开始

### 环境要求
- Node.js 18+
- npm/pnpm
- Linux / macOS / Windows 均可

### 安装与运行

```bash
# 1. 克隆项目
git clone https://github.com/rojocai/dbhzj-campus-community.git
cd dbhzj-campus-community

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 修改 NEXTAUTH_URL 和 NEXTAUTH_SECRET

# 4. 初始化数据库
npx prisma db push
npx prisma db seed

# 5. 构建并启动
npm run build
npm start
```

### 默认管理员
- 邮箱：`admin@dongbaihu.com`
- 密码：`admin123`

---

## 🚀 一键部署（生产环境）

支持 Debian / Ubuntu / CentOS / Fedora / RHEL / AlmaLinux / Rocky / Kali / Linux Mint。

```bash
# 一键运行（推荐）
bash <(curl -fsSL https://raw.githubusercontent.com/rojocai/dbhzj-campus-community/main/install-campus.sh)

# 或下载后运行
wget https://raw.githubusercontent.com/rojocai/dbhzj-campus-community/main/install-campus.sh
chmod +x install-campus.sh
sudo bash install-campus.sh
```

脚本功能：

| 功能 | 说明 |
|------|------|
| 🌐 主站部署 | 克隆源码 → 安装依赖 → 构建 → systemd 服务 |
| 🌐 副站部署 | 同机/远程服务器部署第二个站点 |
| ☁️ Cloudflare DNS | 提供 API Key 自动创建 A 记录 |
| 🔒 自动 SSL | 通过 NPM 容器申请 Let's Encrypt 证书（DNS-01） |
| 🐳 Docker/NPM | Nginx Proxy Manager 自动反代 |
| 🔗 远程部署 | SSH 连接远程服务器部署副站（支持密码/密钥） |

### 升级

```bash
bash /opt/dbhzj-campus-community/update.sh
```

---

## 📦 项目结构

```
├── src/
│   ├── app/               # Next.js App Router 页面
│   │   ├── page.tsx       # 首页（信息流 + Hero）
│   │   ├── feed/          # 广场（帖子列表）
│   │   ├── create/        # 发帖
│   │   ├── post/[id]/     # 帖子详情
│   │   ├── profile/       # 个人主页
│   │   ├── admin/         # 管理员后台
│   │   ├── about/         # 关于我们
│   │   ├── checkin/       # 签到页面
│   │   ├── signin/        # 登录
│   │   ├── signup/        # 注册
│   │   └── user/[id]/     # 用户主页
│   ├── components/        # 通用组件
│   │   ├── Header.tsx     # 顶部导航（含语言切换按钮）
│   │   ├── Footer.tsx     # 页脚
│   │   ├── LanguageSwitcher.tsx  # 中/EN 切换
│   │   └── ...
│   └── lib/
│       ├── auth.ts        # NextAuth 配置
│       ├── prisma.ts      # Prisma 客户端
│       └── lang/          # 多语言文件
│           ├── zh.json    # 中文翻译
│           ├── en.json    # 英文翻译
│           └── LangContext.tsx  # 语言上下文
├── prisma/
│   ├── schema.prisma      # 数据库模型
│   └── seed.ts            # 种子数据
├── public/                # 静态资源
├── install-campus.sh      # 一键部署脚本
└── update.sh              # 一键升级脚本
```

---

## 📜 License

MIT License

---

<p align="center">
  <a href="README.md">🏠 返回首页</a> &nbsp;·&nbsp; <a href="README.en.md">🇬🇧 English</a> &nbsp;·&nbsp; <a href="https://780417.xyz">🌐 在线演示</a> &nbsp;·&nbsp; <a href="https://github.com/rojocai/dbhzj-campus-community">📦 GitHub</a>
</p>
