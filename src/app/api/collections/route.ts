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
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "请指定帖子" },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.status === "DELETED") {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    const existing = await prisma.collection.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    });

    if (existing) {
      await prisma.collection.delete({ where: { id: existing.id } });
      return NextResponse.json({
        collected: false,
        message: "已取消收藏",
      });
    } else {
      await prisma.collection.create({
        data: {
          userId: session.user.id,
          postId,
        },
      });
      return NextResponse.json({ collected: true, message: "收藏成功" });
    }
  } catch (error) {
    console.error("Toggle collection error:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          post: {
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
          },
        },
      }),
      prisma.collection.count({ where: { userId: session.user.id } }),
    ]);

    const data = collections.map((c) => ({
      ...c.post,
      tags: JSON.parse(c.post.tags),
      images: JSON.parse(c.post.images),
      collectedAt: c.createdAt,
    }));

    return NextResponse.json({
      collections: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get collections error:", error);
    return NextResponse.json({ error: "获取收藏列表失败" }, { status: 500 });
  }
}
