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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "请指定要关注的用户" },
        { status: 400 }
      );
    }

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "不能关注自己" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId,
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({ where: { id: existingFollow.id } });
      return NextResponse.json({ following: false, message: "已取消关注" });
    } else {
      await prisma.follow.create({
        data: {
          followerId: session.user.id,
          followingId: userId,
        },
      });

      await prisma.notification.create({
        data: {
          type: "follow",
          senderId: session.user.id,
          receiverId: userId,
          content: "关注了你",
        },
      });

      return NextResponse.json({ following: true, message: "关注成功" });
    }
  } catch (error) {
    console.error("Toggle follow error:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
