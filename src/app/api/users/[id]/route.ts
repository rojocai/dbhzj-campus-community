import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatarUrl: true,
        coverUrl: true,
        bio: true,
        grade: true,
        class_: true,
        gender: true,
        experience: true,
        level: true,
        coins: true,
        createdAt: true,
        _count: {
          select: {
            posts: { where: { status: "PUBLISHED" } },
            followers: true,
            follows: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // Get recent posts
    const posts = await prisma.post.findMany({
      where: { authorId: id, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true },
        },
      },
    });

    return NextResponse.json({
      ...user,
      posts: posts.map((p) => ({
        ...p,
        tags: JSON.parse(p.tags),
        images: JSON.parse(p.images),
      })),
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 });
  }
}
