import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v4 as uuid } from 'uuid'
import path from 'path'
import fs from 'fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_IMAGES = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
const ALLOWED_VIDEOS = ['.mp4', '.webm', '.mov', '.avi', '.mkv']
const ALLOWED_AUDIO = ['.mp3', '.wav', '.ogg']

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions) as any
  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: '未选择文件' }, { status: 400 })
    }

    const ext = path.extname(file.name).toLowerCase()
    const isVideo = ALLOWED_VIDEOS.includes(ext)
    const isImage = ALLOWED_IMAGES.includes(ext)
    const isAudio = ALLOWED_AUDIO.includes(ext)

    if (!isVideo && !isImage && !isAudio) {
      return NextResponse.json({
        error: `不支持的文件格式 ${ext}，支持图片: ${ALLOWED_IMAGES.join(',')}，视频: ${ALLOWED_VIDEOS.join(',')}，音频: ${ALLOWED_AUDIO.join(',')}`
      }, { status: 400 })
    }

    const baseDir = process.env.UPLOAD_DIR || './public/uploads'
    const subDir = isVideo ? 'videos' : isAudio ? 'audio' : ''
    const uploadDir = path.join(baseDir, subDir)
    fs.mkdirSync(uploadDir, { recursive: true })

    const filename = `${uuid()}${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(path.join(uploadDir, filename), buffer)

    const url = isVideo ? `/uploads/videos/${filename}` : isAudio ? `/uploads/audio/${filename}` : `/uploads/${filename}`
    return NextResponse.json({ url, filename, type: isVideo ? 'video' : isAudio ? 'audio' : 'image' })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '上传失败' }, { status: 500 })
  }
}
