import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始种子数据...");

  // 1. 清空所有旧数据（帖子、评论、点赞、收藏、关注、通知、签到、勋章关联）
  await prisma.like.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.collection.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.signinRecord.deleteMany({});
  await prisma.userBadge.deleteMany({});
  await prisma.post.deleteMany({});

  console.log("✅ 旧帖子/评论等数据已清空");

  // 2. 删除旧用户（保留管理员重新创建）
  await prisma.user.deleteMany({});

  // 3. 创建管理员用户
  const adminPasswordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@dongbaihu.com",
      username: "admin",
      nickname: "东白湖之家",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      uid: 1,
      avatarUrl: null,
      bio: "东白湖之家校园论坛 — 社区运营团队",
      grade: "教职工",
      class_: "",
      gender: "保密",
      experience: 9999,
      level: 99,
      coins: 99999,
    },
  });
  console.log(`✅ 管理员用户: ${admin.nickname} (admin)`);

  // 4. 创建分类
  const categories = [
    {
      name: "校园生活",
      description: "分享校园日常、食堂美食、宿舍生活等",
      icon: "🏫",
      color: "#6366f1",
      sortOrder: 0,
    },
    {
      name: "学习交流",
      description: "课程讨论、学习资源、考试经验分享",
      icon: "📚",
      color: "#f59e0b",
      sortOrder: 1,
    },
    {
      name: "社团活动",
      description: "社团招新、活动通知、精彩回顾",
      icon: "🎭",
      color: "#10b981",
      sortOrder: 2,
    },
    {
      name: "游戏讨论区",
      description: "电子游戏、桌游、电竞交流与讨论",
      icon: "🎮",
      color: "#8b5cf6",
      sortOrder: 3,
    },
    {
      name: "灌水乐园",
      description: "闲聊八卦、日常吐槽、轻松话题",
      icon: "💧",
      color: "#06b6d4",
      sortOrder: 4,
    },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    createdCategories.push(category);
    console.log(`✅ 分类: ${category.name}`);
  }

  // 5. 创建默认站点配置 — 改为东白湖之家
  await prisma.siteConfig.upsert({
    where: { id: 'default' },
    update: {
      aboutTitle: '关于我们',
      aboutContent: '东白湖之家校园论坛社区，致力于为东白湖师生提供一个交流、分享、成长的平台。',
      aboutSubtitle: '东白湖之家校园论坛社区',
      aboutImage: '',
      contactEmail: 'admin@dongbaihu.com',
      contactQQ: '',
      contactAddress: '',
      siteTitle: '东白湖之家',
      siteSubtitle: '连接校园，分享成长',
      siteImage: '',
      toolbarTitle: '东白湖之家',
      toolbarLogo: '',
      footerPoweredBy: '东白湖之家校园论坛社区 v1.0 | Powered by Next.js & Prisma',
      footerCopyright: '© 2026 东白湖之家 All Rights Reserved',
      footerIcp: '',
      heroWelcome: '欢迎来到东白湖之家',
      heroTagline1: '在这里，你可以交流学习经验、分享校园生活、参与社团活动',
      heroTagline2: '让每一天的校园生活都更加精彩',
      heroJoinTitle: '加入东白湖之家社区',
      heroJoinSubtitle: '与全校师生一起交流学习、分享生活，让校园时光更加精彩',
    },
    create: {
      id: 'default',
      aboutTitle: '关于我们',
      aboutContent: '东白湖之家校园论坛社区，致力于为东白湖师生提供一个交流、分享、成长的平台。',
      aboutSubtitle: '东白湖之家校园论坛社区',
      aboutImage: '',
      contactEmail: 'admin@dongbaihu.com',
      contactQQ: '',
      contactAddress: '',
      siteTitle: '东白湖之家',
      siteSubtitle: '连接校园，分享成长',
      siteImage: '',
      toolbarTitle: '东白湖之家',
      toolbarLogo: '',
      footerPoweredBy: '东白湖之家校园论坛社区 v1.0 | Powered by Next.js & Prisma',
      footerCopyright: '© 2026 东白湖之家 All Rights Reserved',
      footerIcp: '',
      heroWelcome: '欢迎来到东白湖之家',
      heroTagline1: '在这里，你可以交流学习经验、分享校园生活、参与社团活动',
      heroTagline2: '让每一天的校园生活都更加精彩',
      heroJoinTitle: '加入东白湖之家社区',
      heroJoinSubtitle: '与全校师生一起交流学习、分享生活，让校园时光更加精彩',
    },
  })
  console.log('✅ 站点配置已创建（东白湖之家）')

  // 6. 创建勋章种子数据
  const badges = [
    {
      name: '初来乍到',
      description: '注册即获得',
      icon: '🌱',
      color: '#10b981',
      condition: 'register',
    },
    {
      name: '签到达人',
      description: '累计签到7天',
      icon: '📅',
      color: '#f59e0b',
      condition: 'signin_7',
    },
    {
      name: '签到王者',
      description: '累计签到30天',
      icon: '👑',
      color: '#f97316',
      condition: 'signin_30',
    },
    {
      name: '发帖达人',
      description: '发布10篇帖子',
      icon: '✍️',
      color: '#6366f1',
      condition: 'posts_10',
    },
    {
      name: '社区精英',
      description: '获得1000积分',
      icon: '💎',
      color: '#8b5cf6',
      condition: 'points_1000',
    },
    {
      name: '精华大师',
      description: '3篇帖子被加精',
      icon: '⭐',
      color: '#ec4899',
      condition: 'essence_3',
    },
    {
      name: '人气之星',
      description: '获得50个点赞',
      icon: '🔥',
      color: '#ef4444',
      condition: 'likes_50',
    },
    {
      name: '早起鸟',
      description: '在早上6-8点签到',
      icon: '🐦',
      color: '#06b6d4',
      condition: 'early_bird',
    },
  ]

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    })
  }
  console.log(`✅ ${badges.length} 个勋章已创建`)

  console.log("\n🎉 种子数据创建完成！");
  console.log("📧 管理员登录: admin / admin123");
}

main()
  .catch((e) => {
    console.error("❌ 种子数据创建失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
