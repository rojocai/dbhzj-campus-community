import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Protect admin routes（ADMIN + MODERATOR 可访问页面）
  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req });
    if (!token || ((token as any).role !== "ADMIN" && (token as any).role !== "MODERATOR")) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
  }

  // Protect /api/admin routes（仅 ADMIN 可调用 API）
  if (pathname.startsWith("/api/admin")) {
    const token = await getToken({ req });
    if (!token || (token as any).role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }
  }

  // Protect /api/moderator routes - require MODERATOR or ADMIN role
  if (pathname.startsWith("/api/moderator")) {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    const role = (token as any).role;
    if (role !== "MODERATOR" && role !== "ADMIN") {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/moderator/:path*"],
};
