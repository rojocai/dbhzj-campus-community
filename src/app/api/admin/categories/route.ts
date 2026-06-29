import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: list all categories (with post counts)
export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { posts: true },
        },
        moderators: {
          select: {
            id: true,
            username: true,
            nickname: true,
          },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Admin get categories error:", error);
    return NextResponse.json({ error: "获取分类失败" }, { status: 500 });
  }
}

// POST: create a new category
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, icon, color, sortOrder } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "版块名称不能为空" }, { status: 400 });
    }

    // Check duplicate
    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return NextResponse.json({ error: "版块名称已存在" }, { status: 409 });
    }

    // Auto-assign sortOrder if not provided
    let order = sortOrder;
    if (order === undefined || order === null) {
      const last = await prisma.category.findFirst({
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      order = (last?.sortOrder ?? -1) + 1;
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description || "",
        icon: icon || "📁",
        color: color || "#6366f1",
        sortOrder: order,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Admin create category error:", error);
    return NextResponse.json({ error: "创建版块失败" }, { status: 500 });
  }
}

// PUT: update a category
export async function PUT(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description, icon, color, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少版块ID" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: "版块名称不能为空" }, { status: 400 });
      }
      // Check duplicate (exclude self)
      const dup = await prisma.category.findFirst({
        where: { name: name.trim(), id: { not: id } },
      });
      if (dup) {
        return NextResponse.json({ error: "版块名称已存在" }, { status: 409 });
      }
      updateData.name = name.trim();
    }
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Admin update category error:", error);
    return NextResponse.json({ error: "更新版块失败" }, { status: 500 });
  }
}
