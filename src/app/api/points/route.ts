import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/points - Return user points summary
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true, experience: true, level: true },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // Get today's sign-in record
    const todayRecord = await prisma.signinRecord.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    // Get current month's sign-in records for calendar
    const yearMonth = today.slice(0, 7);
    const monthRecords = await prisma.signinRecord.findMany({
      where: {
        userId,
        date: {
          startsWith: yearMonth,
        },
      },
      select: { date: true, streakDays: true },
      orderBy: { date: "asc" },
    });

    // Calculate streak info
    let currentStreak = 0;
    if (todayRecord) {
      currentStreak = todayRecord.streakDays;
    } else {
      // Check yesterday's streak
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      const yesterdayRecord = await prisma.signinRecord.findUnique({
        where: { userId_date: { userId, date: yesterdayStr } },
      });
      currentStreak = yesterdayRecord ? yesterdayRecord.streakDays : 0;
    }

    return NextResponse.json({
      coins: user.coins,
      experience: user.experience,
      level: user.level,
      signedInToday: !!todayRecord,
      currentStreak,
      monthRecords: monthRecords.map((r) => r.date),
    });
  } catch (error) {
    console.error("Get points error:", error);
    return NextResponse.json({ error: "获取积分信息失败" }, { status: 500 });
  }
}
