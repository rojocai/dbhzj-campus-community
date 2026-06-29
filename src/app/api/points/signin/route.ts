import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Calculate points for a sign-in based on streak length.
 * Daily sign-in: +10
 * 3-day streak bonus: +5
 * 7-day streak bonus: +15
 * 30-day streak bonus: +50
 */
function calculateSigninPoints(streakDays: number): number {
  let points = 10; // base daily
  if (streakDays >= 3) points += 5;
  if (streakDays >= 7) points += 15;
  if (streakDays >= 30) points += 50;
  return points;
}

/**
 * Calculate experience needed for a given level.
 * Level 1: 0 XP, Level 2: 100 XP, Level 3: 250 XP, etc.
 */
function calcExpForLevel(level: number): number {
  return level * (level + 1) * 25;
}

/**
 * Update user's experience and level based on points earned.
 * Every 10 coins = 1 XP (roughly). Also updates level automatically.
 */
async function updateExperienceAndLevel(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coins: true, experience: true, level: true },
  });
  if (!user) return;

  // Sync experience from coins (every 10 coins = 1 XP)
  const targetExp = Math.floor(user.coins / 10) * 10;

  // Find correct level based on experience
  let newLevel = 1;
  while (calcExpForLevel(newLevel + 1) <= targetExp) {
    newLevel++;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      experience: targetExp,
      level: newLevel,
    },
  });
}

// POST /api/points/signin - Perform daily check-in
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    // Check if already signed in today
    const existing = await prisma.signinRecord.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "今日已签到", signedInToday: true, streakDays: existing.streakDays },
        { status: 400 }
      );
    }

    // Calculate streak
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const yesterdayRecord = await prisma.signinRecord.findUnique({
      where: { userId_date: { userId, date: yesterdayStr } },
    });

    const streakDays = yesterdayRecord ? yesterdayRecord.streakDays + 1 : 1;
    const pointsEarned = calculateSigninPoints(streakDays);

    // Create sign-in record
    await prisma.signinRecord.create({
      data: {
        userId,
        date: today,
        streakDays,
        points: pointsEarned,
      },
    });

    // Award coins to user
    await prisma.user.update({
      where: { id: userId },
      data: { coins: { increment: pointsEarned } },
    });

    // Update experience and level
    await updateExperienceAndLevel(userId);

    return NextResponse.json({
      signedIn: true,
      streakDays,
      pointsEarned,
      message: `签到成功！连续签到 ${streakDays} 天，获得 ${pointsEarned} 积分`,
    });
    // 检查勋章发放（异步，不影响签到结果）
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/badges/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (badgeError) {
      console.error("Badge check after signin error:", badgeError);
    }

    return NextResponse.json({
      signedIn: true,
      streakDays,
      pointsEarned,
      message: `签到成功！连续签到 ${streakDays} 天，获得 ${pointsEarned} 积分`,
    });
  } catch (error) {
    console.error("Sign-in error:", error);
    return NextResponse.json({ error: "签到失败" }, { status: 500 });
  }
}
