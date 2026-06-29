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
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const { id } = await params;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: "版块不存在" }, { status: 404 });
    }

    // Check if there are posts in this category
    const postCount = await prisma.post.count({
      where: { categoryId: id, status: { not: "DELETED" } },
    });

    if (postCount > 0) {
      return NextResponse.json(
        {
          error: `该版块下还有 ${postCount} 篇帖子，无法删除。请先将帖子移出或删除。`,
          postCount,
        },
        { status: 400 }
      );
    }

    // Remove moderator associations first
    await prisma.category.update({
      where: { id },
      data: {
        moderators: { set: [] },
      },
    });

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("Admin delete category error:", error);
    return NextResponse.json(
      { error: "删除版块失败" },
      { status: 500 }
    );
  }
}
