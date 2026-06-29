import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params
    const filePath = path.join(UPLOAD_DIR, ...pathSegments)
    
    // Security: prevent directory traversal
    const resolved = path.resolve(filePath)
    const uploadRoot = path.resolve(UPLOAD_DIR)
    if (!resolved.startsWith(uploadRoot)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    const buffer = fs.readFileSync(resolved)
    const ext = path.extname(resolved).toLowerCase()
    
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
    }
    
    const contentType = mimeTypes[ext] || 'application/octet-stream'
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'File not found' }, { status: 500 })
  }
}
