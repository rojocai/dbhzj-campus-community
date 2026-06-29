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

    const body = await req.json();
    const { content, postId, parentId, replyToId } = body;

    if (!content || !postId) {
      return NextResponse.json(
        { error: "内容和帖子ID不能为空" },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.status === "DELETED") {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment) {
        return NextResponse.json(
          { error: "父评论不存在" },
          { status: 404 }
        );
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: session.user.id,
        parentId: parentId || null,
        replyToId: replyToId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update post comment count
    await prisma.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });

    // Create notification for post author
    if (post.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: "comment",
          senderId: session.user.id,
          receiverId: post.authorId,
          link: `/post/${postId}`,
          content: `评论了你的帖子「${post.title}」`,
        },
      });

      // Award 3 coins to post author for receiving comment
      await prisma.user.update({
        where: { id: post.authorId },
        data: { coins: { increment: 3 } },
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "评论失败" }, { status: 500 });
  }
}
