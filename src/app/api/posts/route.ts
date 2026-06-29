import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const categoryId = searchParams.get("categoryId");
    const sort = searchParams.get("sort") || "latest";
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";

    const skip = (page - 1) * limit;

    const where: any = {
      status: "PUBLISHED",
    };

    // Only show public posts to non-admin users
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user || session.user.role !== "ADMIN") {
      where.isPrivate = false;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    if (type) {
      where.type = type;
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "hot") {
      orderBy = { likesCount: "desc" };
    } else if (sort === "views") {
      orderBy = { views: "desc" };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatarUrl: true,
              role: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const postsWithTags = posts.map((post) => ({
      ...post,
      tags: JSON.parse(post.tags),
      images: JSON.parse(post.images),
      videos: JSON.parse(post.videos),
    }));

    return NextResponse.json({
      posts: postsWithTags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json({ error: "获取帖子列表失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, type, images, videos, tags, categoryId, commentsLocked, isPrivate, bgMusic } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "标题和内容不能为空" },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        { error: "标题不能超过100个字符" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        type: type || "text",
        images: JSON.stringify(images || []),
        videos: JSON.stringify(videos || []),
        tags: JSON.stringify(tags || []),
        bgMusic: bgMusic || "",
        categoryId: categoryId || null,
        authorId: session.user.id,
        commentsLocked: commentsLocked === true,
        isPrivate: isPrivate === true,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    // Award coins for creating a post
    await prisma.user.update({
      where: { id: session.user.id },
      data: { coins: { increment: 20 } },
    });

    return NextResponse.json(
      {
        ...post,
        tags: JSON.parse(post.tags),
        images: JSON.parse(post.images),
        videos: JSON.parse(post.videos),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "发布帖子失败" }, { status: 500 });
  }
}
