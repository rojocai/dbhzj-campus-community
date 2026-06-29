import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "MODERATOR") {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, days, reason } = body;

    if (!userId) {
      return NextResponse.json({ error: "请指定用户" }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: "不能禁言自己" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // Moderators cannot ban admins or other moderators
    if (role === "MODERATOR" && (targetUser.role === "ADMIN" || targetUser.role === "MODERATOR")) {
      return NextResponse.json({ error: "无权禁言管理员或其他版主" }, { status: 403 });
    }

    // Check if moderator manages the user's posts' categories
    if (role === "MODERATOR") {
      const userPosts = await prisma.post.findMany({
        where: { authorId: userId, status: "PUBLISHED" },
        select: { categoryId: true },
      });

      const userCategoryIds = [
        ...new Set(userPosts.map((p) => p.categoryId).filter(Boolean)),
      ];

      const moderator = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          managedCategories: { select: { id: true } },
        },
      });

      const managedCategoryIds =
        moderator?.managedCategories.map((c) => c.id) || [];

      // If user has posts in categories the moderator doesn't manage, deny
      if (userCategoryIds.length > 0) {
        const canManageAll = userCategoryIds.every((cid) =>
          managedCategoryIds.includes(cid)
        );
        if (!canManageAll) {
          return NextResponse.json(
            { error: "您无权禁言此用户（该用户在您管辖版块之外发过帖子）" },
            { status: 403 }
          );
        }
      }
    }

    const updateData: any = {
      isBanned: true,
      banReason: reason || "违规操作",
    };

    if (days && days > 0) {
      updateData.banExpiresAt = new Date(
        Date.now() + days * 24 * 60 * 60 * 1000
      );
    } else {
      updateData.banExpiresAt = null; // permanent
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ message: "禁言成功" });
  } catch (error) {
    console.error("Moderator ban error:", error);
    return NextResponse.json({ error: "禁言失败" }, { status: 500 });
  }
}
