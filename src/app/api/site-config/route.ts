import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    let config = await prisma.siteConfig.findUnique({ where: { id: 'default' } })
    if (!config) {
      config = await prisma.siteConfig.create({ data: { id: 'default' } })
    }
    return NextResponse.json({
      ...config,
      heroBgEnabled: config.heroBgEnabled === true || config.heroBgEnabled === 'true' || config.heroBgEnabled === 1,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '获取配置失败' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions) as any
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限，仅管理员可操作' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const allowedFields = [
      'aboutTitle', 'aboutContent', 'aboutImage',
      'aboutSubtitle',
      'contactPhone', 'contactEmail', 'contactWechat', 'contactQQ', 'contactAddress',
      'footerCopyright', 'footerIcp',
      'siteTitle', 'siteSubtitle', 'siteImage', 'footerPoweredBy',
      'heroWelcome', 'toolbarTitle', 'toolbarLogo',
      'heroTagline1', 'heroTagline2',
      'heroJoinTitle', 'heroJoinSubtitle',
      'heroBgEnabled', 'heroBgColor1', 'heroBgColor2', 'heroBgColor3',
      'heroBgOpacity', 'heroBgBlur', 'heroBgBrightness',
      'fireworksDuration',
      'textStyles',
    ]
    const data: Record<string, string | boolean | number> = {}
    for (const field of allowedFields) {
      if (field === 'heroBgEnabled') {
        data[field] = body[field] === true || body[field] === 'true'
      } else if (field === 'fireworksDuration') {
        const val = parseInt(body[field])
        data[field] = isNaN(val) ? 15 : Math.max(0, Math.min(120, val))
      } else if (typeof body[field] === 'string') {
        data[field] = body[field]
      }
    }
    const config = await prisma.siteConfig.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    })
    return NextResponse.json(config)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '更新配置失败' }, { status: 500 })
  }
}
