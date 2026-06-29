import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Verify admin token or cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "campus-cron-secret";
    if (authHeader !== `Bearer ${cronSecret}`) {
      const session = (await getServerSession(authOptions)) as any;
      if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "无权访问" }, { status: 403 });
      }
    }

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const today = `${month}-${day}`;

    // Find users with birthday today
    const birthdayUsers = await prisma.user.findMany({
      where: {
        birthday: today,
        isBanned: false,
      },
      select: {
        id: true,
        nickname: true,
        username: true,
      },
    });

    if (birthdayUsers.length === 0) {
      return NextResponse.json({
        message: "今天没有用户过生日",
        posted: 0,
      });
    }

    // Get admin user for posting
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
    });

    if (!admin) {
      return NextResponse.json({ error: "没有管理员账号" }, { status: 500 });
    }

    const results = [];

    for (const user of birthdayUsers) {
      const displayName = user.nickname || user.username;
      const title = `🎂 ${displayName} 生日快乐！`;
      const content = `🎉🎉🎉 今天（${month}月${day}日）是 **${displayName}** 的生日！\n\n让我们大家一起送上最真挚的祝福吧！\n\n🎂 祝你生日快乐！\n🌟 学业进步，天天开心！\n💪 身体健康，万事如意！\n\n快来评论区送上你的祝福吧～ 👇`;

      // Check if already posted today
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const existingPost = await prisma.post.findFirst({
        where: {
          title,
          authorId: admin.id,
          createdAt: { gte: todayStart },
        },
      });

      if (existingPost) {
        results.push({ user: displayName, status: "already_exists", postId: existingPost.id });
        continue;
      }

      const post = await prisma.post.create({
        data: {
          title,
          content,
          type: "text",
          images: "[]",
          tags: JSON.stringify(["生日", "祝福", displayName]),
          isPinned: true,
          isEssence: true,
          isTop: true,
          authorId: admin.id,
          views: 0,
          likesCount: 0,
          commentsCount: 0,
        },
      });

      // Award coins to birthday user
      await prisma.user.update({
        where: { id: user.id },
        data: { coins: { increment: 100 } },
      });

      results.push({ user: displayName, status: "created", postId: post.id });
    }

    return NextResponse.json({
      message: `为 ${results.length} 位用户发布了生日祝福`,
      posted: results.filter((r) => r.status === "created").length,
      results,
    });
  } catch (error) {
    console.error("Auto post birthday error:", error);
    return NextResponse.json({ error: "自动发帖失败" }, { status: 500 });
  }
}
