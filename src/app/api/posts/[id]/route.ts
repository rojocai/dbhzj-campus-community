import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
            bio: true,
            grade: true,
            class_: true,
            experience: true,
            level: true,
            role: true,
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
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                nickname: true,
                avatarUrl: true,
                role: true,
              },
            },
            replies: {
              orderBy: { createdAt: "asc" },
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    nickname: true,
                    avatarUrl: true,
                  },
                },
                replyTo: {
                  select: {
                    id: true,
                    author: {
                      select: {
                        id: true,
                        username: true,
                        nickname: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!post || post.status === "DELETED") {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    // Private posts: only author and admin can view
    const session = (await getServerSession(authOptions)) as any;
    if (post.isPrivate) {
      if (!session?.user?.id || (session.user.id !== post.authorId && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
      }
    }

    // Increment views
    await prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    // Check if current user has liked
    let isLiked = false;
    let isCollected = false;

    if (session?.user?.id) {
      const [like, collection] = await Promise.all([
        prisma.like.findUnique({
          where: {
            userId_postId: {
              userId: session.user.id,
              postId: id,
            },
          },
        }),
        prisma.collection.findUnique({
          where: {
            userId_postId: {
              userId: session.user.id,
              postId: id,
            },
          },
        }),
      ]);
      isLiked = !!like;
      isCollected = !!collection;
    }

    return NextResponse.json({
      ...post,
      tags: JSON.parse(post.tags),
      images: JSON.parse(post.images),
      videos: JSON.parse(post.videos),
      views: post.views + 1,
      isLiked,
      isCollected,
    });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json({ error: "获取帖子详情失败" }, { status: 500 });
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

    const { id } = await params;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    if (post.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权修改此帖子" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, type, images, videos, tags, categoryId, status, isEssence, commentsLocked, isPrivate, bgMusic } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (images !== undefined) updateData.images = JSON.stringify(images);
    if (videos !== undefined) updateData.videos = JSON.stringify(videos);
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (bgMusic !== undefined) updateData.bgMusic = bgMusic;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    // Author can set commentsLocked and isPrivate on their own posts
    if (commentsLocked !== undefined && (post.authorId === session.user.id || session.user.role === "ADMIN"))
      updateData.commentsLocked = commentsLocked === true;
    if (isPrivate !== undefined && (post.authorId === session.user.id || session.user.role === "ADMIN"))
      updateData.isPrivate = isPrivate === true;
    if (status !== undefined && session.user.role === "ADMIN")
      updateData.status = status;
    if (isEssence !== undefined && session.user.role === "ADMIN") {
      updateData.isEssence = isEssence;
    }

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

    // Award 50 coins when post is set as essence (only on first essence, not unsetting)
    if (isEssence === true && !post.isEssence && session.user.role === "ADMIN") {
      await prisma.user.update({
        where: { id: post.authorId },
        data: { coins: { increment: 50 } },
      });
    }

    return NextResponse.json({
      ...updated,
      tags: JSON.parse(updated.tags),
      images: JSON.parse(updated.images),
      videos: JSON.parse(updated.videos),
    });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json({ error: "更新帖子失败" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    const canDelete =
      post.authorId === session.user.id ||
      session.user.role === "ADMIN" ||
      session.user.role === "MODERATOR";

    if (!canDelete) {
      return NextResponse.json({ error: "无权删除此帖子" }, { status: 403 });
    }

    // Moderators can only delete posts in their managed categories
    if (
      session.user.role === "MODERATOR" &&
      post.authorId !== session.user.id
    ) {
      const moderator = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          managedCategories: {
            select: { id: true },
          },
        },
      });

      const managedCategoryIds =
        moderator?.managedCategories.map((c) => c.id) || [];
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
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "删除帖子失败" }, { status: 500 });
  }
}
