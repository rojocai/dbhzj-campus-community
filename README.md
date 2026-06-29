# 🏠 东白湖之家校园论坛社区

> 一款功能完善的校园社区系统，基于 Next.js 16 + Prisma 5 + SQLite，适合学校、班级、社团搭建内部交流平台。

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
- **种子数据**: TypeScript 种子脚本

## 📋 快速开始

### 环境要求
- Node.js 18+
- npm/pnpm
- Linux / macOS / Windows 均可

### 安装与运行

```bash
# 1. 克隆项目
git clone https://github.com/rojocai/dongbaihu-campus.git
cd dongbaihu-campus

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env  # 或直接编辑 .env
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

## 🚀 生产部署（一键脚本）

详见 [install-campus.sh](install-campus.sh) 一键部署脚本，支持：

- ✅ 自动检测 Linux 发行版（Debian/Ubuntu/CentOS/Fedora/RHEL）
- ✅ 自动安装 Node.js（无则安装）
- ✅ 域名 + IP 配置
- ✅ Cloudflare API → 自动配置 DNS A 记录 + 申请 SSL 证书（可选）
- ✅ Nginx Proxy Manager 反代配置（NPM）
- ✅ systemd 服务自动创建和管理
- ✅ 主站本地部署 + 副站远程 SSH 部署（可选）
- ✅ 部署完成后输出完整信息

```bash
# 下载脚本
wget -O install-campus.sh https://raw.githubusercontent.com/rojocai/dongbaihu-campus/main/install-campus.sh

# 执行安装
chmod +x install-campus.sh
sudo bash install-campus.sh
```

## 📦 项目结构

```
├── src/
│   ├── app/           # Next.js App Router 页面
│   │   ├── page.tsx   # 首页（信息流 + Hero）
│   │   ├── feed/      # 广场（帖子列表）
│   │   ├── create/    # 发帖
│   │   ├── post/      # 帖子详情
│   │   ├── profile/   # 个人主页
│   │   ├── admin/     # 管理员后台
│   │   ├── about/     # 关于我们
│   │   ├── checkin/   # 签到页面
│   │   ├── signin/    # 登录
│   │   ├── signup/    # 注册
│   │   └── user/      # 用户主页
│   ├── components/    # 通用组件
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── BadgeDisplay.tsx
│   │   ├── Fireworks.tsx
│   │   ├── SessionProvider.tsx
│   │   ├── StylePanel.tsx
│   │   ├── StyledText.tsx
│   │   └── UploadZone.tsx
│   └── lib/           # 工具库
│       ├── auth.ts    # NextAuth 配置
│       ├── prisma.ts  # Prisma 客户端
│       └── upload.ts  # 文件上传
├── prisma/
│   ├── schema.prisma  # 数据库模型
│   └── seed.ts        # 种子数据
└── public/            # 静态资源
```

## 📄 License

MIT License

---

## 🧪 测试网站

本项目已部署测试站，用于功能演示和效果预览：

| 项目 | 信息 |
|------|------|
| **测试网址** | https://780417.xyz |
| **管理员邮箱** | `admin@dongbaihu.com` |
| **管理员密码** | `admin123` |

> ⏰ **注意**：测试站数据库每天凌晨 00:00 自动重置为初始状态，
> 所有用户数据、帖子、评论等将被清空恢复至种子数据。
> 如需持久化测试数据，请在本地部署或自行搭建独立实例。
