import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const now = new Date();
    // Use China timezone for birthday matching
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const today = `${month}-${day}`;

    const users = await prisma.user.findMany({
      where: {
        birthday: today,
        isBanned: false,
      },
      select: {
        id: true,
        nickname: true,
        username: true,
        avatarUrl: true,
        grade: true,
        class_: true,
      },
    });

    return NextResponse.json({ users, today });
  } catch (error) {
    console.error("Get birthdays error:", error);
    return NextResponse.json({ users: [], today: "" });
  }
}
