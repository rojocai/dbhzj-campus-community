import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, password, nickname, name, grade, class_, gender, birthday, avatarUrl } = body;

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "请填写必要信息（邮箱、用户名、密码）" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少需要6个字符" },
        { status: 400 }
      );
    }

    if (username.length < 2 || username.length > 20) {
      return NextResponse.json(
        { error: "用户名长度应在2-20个字符之间" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email ? "邮箱" : "用户名";
      return NextResponse.json(
        { error: `该${field}已被注册` },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Get next UID
    const lastUser = await prisma.user.findFirst({
      orderBy: { uid: "desc" },
      select: { uid: true },
    });
    const nextUid = (lastUser?.uid || 0) + 1;

    const user = await prisma.user.create({
      data: {
        email,
        username,
        uid: nextUid,
        nickname: nickname || name || username,
        passwordHash,
        avatarUrl: avatarUrl || null,
        grade: grade || "",
        class_: class_ || "",
        gender: gender || "保密",
        birthday: birthday || null,
      },
    });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        nickname: user.nickname,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
