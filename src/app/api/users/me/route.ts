import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
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
        role: true,
        createdAt: true,
        _count: {
          select: {
            posts: { where: { status: "PUBLISHED" } },
            followers: true,
            follows: true,
            collections: true,
            notifications: { where: { isRead: false } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get me error:", error);
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = session.user.id;
    const updateData: any = {};

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      // FormData mode — handle avatar file upload
      const formData = await req.formData();

      const avatarFile = formData.get("avatar") as File | null;
      if (avatarFile && avatarFile.size > 0) {
        // Validate
        if (avatarFile.size > 2 * 1024 * 1024) {
          return NextResponse.json({ error: "头像不能超过 2MB" }, { status: 400 });
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(avatarFile.type)) {
          return NextResponse.json({ error: "仅支持 JPG、PNG、WebP 格式" }, { status: 400 });
        }

        // Save to user avatar directory
        const fs = await import("fs");
        const path = await import("path");
        const { v4: uuid } = await import("uuid");

        const ext = path.extname(avatarFile.name) || ".jpg";
        const filename = uuid() + ext;
        const avatarDir = path.join(process.cwd(), "public", "uploads", "avatars", userId);
        fs.mkdirSync(avatarDir, { recursive: true });

        const buffer = Buffer.from(await avatarFile.arrayBuffer());
        fs.writeFileSync(path.join(avatarDir, filename), buffer);

        updateData.avatarUrl = `/uploads/avatars/${userId}/${filename}`;
      }

      // Text fields
      const nickname = formData.get("nickname") as string;
      const bio = formData.get("bio") as string;
      const grade = formData.get("grade") as string;
      const class_ = formData.get("class_") as string;
      const gender = formData.get("gender") as string;

      if (nickname !== null) updateData.nickname = nickname;
      if (bio !== null) updateData.bio = bio;
      if (grade !== null) updateData.grade = grade;
      if (class_ !== null) updateData.class_ = class_;
      if (gender !== null) updateData.gender = gender;
    } else {
      // JSON mode (backward compat)
      const body = await req.json();
      const {
        nickname,
        avatarUrl,
        coverUrl,
        bio,
        grade,
        class_,
        gender,
      } = body;

      if (nickname !== undefined) updateData.nickname = nickname;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
      if (bio !== undefined) updateData.bio = bio;
      if (grade !== undefined) updateData.grade = grade;
      if (class_ !== undefined) updateData.class_ = class_;
      if (gender !== undefined) updateData.gender = gender;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      coverUrl: user.coverUrl,
      bio: user.bio,
      grade: user.grade,
      class_: user.class_,
      gender: user.gender,
    });
  } catch (error) {
    console.error("Update me error:", error);
    return NextResponse.json({ error: "更新个人信息失败" }, { status: 500 });
  }
}
