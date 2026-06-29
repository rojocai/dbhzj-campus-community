import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        badges: {
          include: {
            badge: true,
          },
        },
        managedCategories: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            posts: true,
            comments: true,
            likes: true,
            followers: true,
            follows: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Admin get user error:", error);
    return NextResponse.json({ error: "获取用户信息失败" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Can't modify own role or ban self
    if (id === session.user.id) {
      return NextResponse.json({ error: "不能修改自己的状态" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const updateData: any = {};

    // Update basic fields
    if (body.nickname !== undefined) updateData.nickname = body.nickname;
    if (body.grade !== undefined) updateData.grade = body.grade;
    if (body.class_ !== undefined) updateData.class_ = body.class_;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.bio !== undefined) updateData.bio = body.bio;

    // Ban/Unban
    if (body.isBanned !== undefined) {
      updateData.isBanned = body.isBanned;
      if (body.isBanned) {
        if (body.banDays && body.banDays > 0) {
          updateData.banExpiresAt = new Date(
            Date.now() + body.banDays * 24 * 60 * 60 * 1000
          );
        } else {
          // Permanent ban
          updateData.banExpiresAt = null;
        }
        updateData.banReason = body.banReason || "违规操作";
      } else {
        updateData.banExpiresAt = null;
        updateData.banReason = null;
      }
    }

    // Set moderator role
    if (body.role !== undefined) {
      if (body.role === "MODERATOR" || body.role === "USER") {
        updateData.role = body.role;
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update managed categories if role is MODERATOR
    if (body.role === "MODERATOR" && body.categoryIds !== undefined) {
      await prisma.user.update({
        where: { id },
        data: {
          managedCategories: {
            set: body.categoryIds.map((cid: string) => ({ id: cid })),
          },
        },
      });
    } else if (body.role === "USER") {
      // Clear managed categories when removing moderator
      await prisma.user.update({
        where: { id },
        data: {
          managedCategories: {
            set: [],
          },
        },
      });
    }

    return NextResponse.json({ message: "更新成功" });
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json({ error: "更新用户失败" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const { id } = await params;

    // Can't delete self
    if (id === session.user.id) {
      return NextResponse.json({ error: "不能删除自己的账号" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // Prevent deleting other admins
    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "不能删除管理员账号" }, { status: 400 });
    }

    // Delete user's related data first
    await prisma.$transaction([
      prisma.like.deleteMany({ where: { userId: id } }),
      prisma.comment.deleteMany({ where: { authorId: id } }),
      prisma.collection.deleteMany({ where: { userId: id } }),
      prisma.notification.deleteMany({ where: { receiverId: id } }),
      prisma.notification.deleteMany({ where: { senderId: id } }),
      prisma.signinRecord.deleteMany({ where: { userId: id } }),
      prisma.userBadge.deleteMany({ where: { userId: id } }),
      prisma.follow.deleteMany({ where: { followerId: id } }),
      prisma.follow.deleteMany({ where: { followingId: id } }),
      prisma.post.deleteMany({ where: { authorId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "用户已删除" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: "删除用户失败" }, { status: 500 });
  }
}
