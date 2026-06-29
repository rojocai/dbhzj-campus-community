import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "MODERATOR") {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { commentsLocked } = body;

    if (typeof commentsLocked !== "boolean") {
      return NextResponse.json(
        { error: "参数错误: commentsLocked 必须为布尔值" },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    // Moderators can only lock comments on posts in their managed categories
    if (role === "MODERATOR") {
      const moderator = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          managedCategories: { select: { id: true } },
        },
      });

      const managedCategoryIds =
        moderator?.managedCategories.map((c) => c.id) || [];
      if (!managedCategoryIds.includes(post.categoryId || "")) {
        return NextResponse.json(
          { error: "您无权锁定此版块的帖子评论" },
          { status: 403 }
        );
      }
    }

    await prisma.post.update({
      where: { id },
      data: { commentsLocked },
    });

    return NextResponse.json({
      message: commentsLocked ? "评论已锁定" : "评论已解锁",
      commentsLocked,
    });
  } catch (error) {
    console.error("Moderator lock comments error:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
