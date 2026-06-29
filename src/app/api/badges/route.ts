import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/badges - 返回所有可用勋章列表
export async function GET() {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(badges);
  } catch (error) {
    console.error("Get badges error:", error);
    return NextResponse.json({ error: "获取勋章列表失败" }, { status: 500 });
  }
}
