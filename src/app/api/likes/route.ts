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
    const { postId, commentId } = body;

    if (!postId && !commentId) {
      return NextResponse.json(
        { error: "请指定要点赞的内容" },
        { status: 400 }
      );
    }

    if (postId) {
      // Toggle like on post
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId,
          },
        },
      });

      if (existingLike) {
        await prisma.like.delete({ where: { id: existingLike.id } });
        await prisma.post.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } },
        });

        return NextResponse.json({ liked: false, message: "取消点赞" });
      } else {
        await prisma.like.create({
          data: {
            userId: session.user.id,
            postId,
          },
        });
        await prisma.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
        });

        // Create notification
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { authorId: true, title: true },
        });
        if (post && post.authorId !== session.user.id) {
          await prisma.notification.create({
            data: {
              type: "like",
              senderId: session.user.id,
              receiverId: post.authorId,
              link: `/post/${postId}`,
              content: `赞了你的帖子「${post.title}」`,
            },
          });

          // Award 5 coins to post author for being liked
          await prisma.user.update({
            where: { id: post.authorId },
            data: { coins: { increment: 5 } },
          });
        }

        // Award 2 coins to the liker
        await prisma.user.update({
          where: { id: session.user.id },
          data: { coins: { increment: 2 } },
        });

        return NextResponse.json({ liked: true, message: "点赞成功" });
      }
    }

    if (commentId) {
      // Toggle like on comment
      const existingLike = await prisma.like.findFirst({
        where: {
          userId: session.user.id,
          commentId,
        },
      });

      if (existingLike) {
        await prisma.like.delete({ where: { id: existingLike.id } });
        await prisma.comment.update({
          where: { id: commentId },
          data: { likesCount: { decrement: 1 } },
        });
        return NextResponse.json({ liked: false, message: "取消点赞" });
      } else {
        await prisma.like.create({
          data: {
            userId: session.user.id,
            commentId,
          },
        });
        await prisma.comment.update({
          where: { id: commentId },
          data: { likesCount: { increment: 1 } },
        });
        return NextResponse.json({ liked: true, message: "点赞成功" });
      }
    }
  } catch (error) {
    console.error("Toggle like error:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
