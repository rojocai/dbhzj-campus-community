import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/badges/check - 检查并发放用户应得的勋章
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = session.user.id;

    // 获取所有勋章
    const badges = await prisma.badge.findMany();
    // 获取用户已获得的勋章ID列表
    const ownedBadgeIds = new Set(
      (
        await prisma.userBadge.findMany({
          where: { userId },
          select: { badgeId: true },
        })
      ).map((ub) => ub.badgeId)
    );

    // 获取用户统计数据
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true, createdAt: true },
    });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 统计用户发帖数、加精数
    const postStats = await prisma.post.aggregate({
      where: { authorId: userId, status: "PUBLISHED" },
      _count: true,
      _sum: { likesCount: true },
    });
    const totalPosts = postStats._count;
    const totalLikes = postStats._sum?.likesCount || 0;

    // 统计精华帖数
    const essenceCount = await prisma.post.count({
      where: { authorId: userId, status: "PUBLISHED", isEssence: true },
    });

    // 统计累计签到天数
    const signinCount = await prisma.signinRecord.count({
      where: { userId },
    });

    // 检查每个条件并发放
    const newlyAwarded: string[] = [];

    for (const badge of badges) {
      if (ownedBadgeIds.has(badge.id)) continue;

      let qualified = false;

      switch (badge.condition) {
        case "register":
          // 注册即获得：只要注册了就有
          qualified = true;
          break;

        case "signin_7":
          qualified = signinCount >= 7;
          break;

        case "signin_30":
          qualified = signinCount >= 30;
          break;

        case "posts_10":
          qualified = totalPosts >= 10;
          break;

        case "points_1000":
          qualified = user.coins >= 1000;
          break;

        case "essence_3":
          qualified = essenceCount >= 3;
          break;

        case "likes_50":
          qualified = totalLikes >= 50;
          break;

        case "early_bird": {
          // 在早上6-8点签到
          const now = new Date();
          const hour = now.getHours();
          qualified = hour >= 6 && hour < 8;
          break;
        }

        default:
          break;
      }

      if (qualified) {
        await prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
          },
        });
        newlyAwarded.push(badge.name);
      }
    }

    return NextResponse.json({
      awarded: newlyAwarded,
      message:
        newlyAwarded.length > 0
          ? `🎉 恭喜获得${newlyAwarded.length}枚新勋章！`
          : "暂无新勋章可领取",
    });
  } catch (error) {
    console.error("Badge check error:", error);
    return NextResponse.json({ error: "检查勋章失败" }, { status: 500 });
  }
}
