import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
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
      return NextResponse.json({ error: "无权删除帖子" }, { status: 403 });
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    // Moderators can only delete posts in their managed categories
    if (role === "MODERATOR") {
      const moderator = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          managedCategories: {
            select: { id: true },
          },
        },
      });

      const managedCategoryIds = moderator?.managedCategories.map((c) => c.id) || [];
      if (!managedCategoryIds.includes(post.categoryId || "")) {
        return NextResponse.json(
          { error: "您无权删除此版块的帖子" },
          { status: 403 }
        );
      }
    }

    // Soft delete
    await prisma.post.update({
      where: { id },
      data: { status: "DELETED" },
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("Admin delete post error:", error);
    return NextResponse.json({ error: "删除帖子失败" }, { status: 500 });
  }
}

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

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    // 权限矩阵：
    // ADMIN: 加精(isEssence), 置顶(isPinned), 禁止评论(commentsLocked), 删帖(status)
    // MODERATOR: 加精(isEssence), 置顶(isPinned)（仅限管辖版块）

    const allowedFields: Record<string, string[]> = {
      ADMIN: ["isEssence", "isPinned", "commentsLocked", "status"],
      MODERATOR: ["isEssence", "isPinned"],
    };

    const fields = Object.keys(body);
    const permitted = allowedFields[role] || [];

    // Check if any field is not permitted
    for (const field of fields) {
      if (!permitted.includes(field)) {
        return NextResponse.json(
          { error: `无权执行操作: ${field}` },
          { status: 403 }
        );
      }
    }

    // Moderators can only manage posts in their managed categories
    if (role === "MODERATOR") {
      const moderator = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          managedCategories: {
            select: { id: true },
          },
        },
      });

      const managedCategoryIds = moderator?.managedCategories.map((c) => c.id) || [];
      if (!managedCategoryIds.includes(post.categoryId || "")) {
        return NextResponse.json(
          { error: "您无权管理此版块的帖子" },
          { status: 403 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (body.isEssence !== undefined) updateData.isEssence = body.isEssence;
    if (body.isPinned !== undefined) updateData.isPinned = body.isPinned;
    if (body.commentsLocked !== undefined) updateData.commentsLocked = body.commentsLocked;
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    // Award 50 coins when post is set as essence (only on first essence)
    if (body.isEssence === true && !post.isEssence) {
      await prisma.user.update({
        where: { id: post.authorId },
        data: { coins: { increment: 50 } },
      });
    }

    return NextResponse.json({
      ...updated,
      tags: JSON.parse(updated.tags),
      images: JSON.parse(updated.images),
      message: "操作成功",
    });
  } catch (error) {
    console.error("Admin update post error:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
