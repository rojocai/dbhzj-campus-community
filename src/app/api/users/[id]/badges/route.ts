import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/users/[id]/badges - 返回指定用户已获得的勋章列表
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const userBadges = await prisma.userBadge.findMany({
      where: { userId: id },
      include: {
        badge: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      userBadges.map((ub) => ({
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        icon: ub.badge.icon,
        color: ub.badge.color,
        condition: ub.badge.condition,
        awardedAt: ub.createdAt,
      }))
    );
  } catch (error) {
    console.error("Get user badges error:", error);
    return NextResponse.json({ error: "获取用户勋章失败" }, { status: 500 });
  }
}
