'use client'
import { useEffect, useRef, useState } from 'react'

// 纯 Canvas 烟花特效
// 从后台管理读取时长，支持 0=关闭 / 1~120 秒
export default function Fireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [duration, setDuration] = useState<number | null>(null)

  useEffect(() => {
    // 从 API 读取烟花时长配置
    fetch('/api/site-config')
      .then(r => r.json())
      .then(data => {
        if (data && typeof data.fireworksDuration === 'number') {
          setDuration(data.fireworksDuration)
        } else {
          setDuration(15) // 默认 15 秒
        }
      })
      .catch(() => setDuration(15))
  }, [])

  useEffect(() => {
    // duration === 0 表示关闭烟花
    if (duration === null || duration === 0) return

    // 每次刷新都播放（不检查 sessionStorage）

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const DURATION_MS = duration * 1000

    // 设置 Canvas 尺寸
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    interface Particle {
      x: number; y: number; vx: number; vy: number
      life: number; maxLife: number
      color: string; size: number; gravity: number
      trail: { x: number; y: number }[]
    }

    const particles: Particle[] = []
    const colors = [
      '#ff004d', '#ff6b35', '#ffd700', '#00e676',
      '#00bcd4', '#7c4dff', '#e040fb', '#ff4081',
      '#fdd835', '#4fc3f7', '#ff9100', '#76ff03',
    ]

    const launch = (cx: number, cy: number) => {
      const count = 40 + Math.floor(Math.random() * 60)
      const color = colors[Math.floor(Math.random() * colors.length)]
      const color2 = colors[Math.floor(Math.random() * colors.length)]

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3
        const speed = 2 + Math.random() * 5
        const life = 60 + Math.floor(Math.random() * 40)
        const mixColor = i % 3 === 0 ? color2 : color

        particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life, maxLife: life,
          color: mixColor,
          size: 1.5 + Math.random() * 2.5,
          gravity: 0.04 + Math.random() * 0.03,
          trail: [],
        })
      }
    }

    let startTime = Date.now()
    let lastLaunch = 0
    let animId: number

    const animate = () => {
      const elapsed = Date.now() - startTime
      if (elapsed > DURATION_MS + 1000) {
        if (particles.length === 0) {
          cancelAnimationFrame(animId)
          return
        }
      }

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      if (elapsed < DURATION_MS && Date.now() - lastLaunch > 300 + Math.random() * 400) {
        lastLaunch = Date.now()
        const x = canvas!.width * 0.1 + Math.random() * canvas!.width * 0.8
        const y = canvas!.height * 0.1 + Math.random() * canvas!.height * 0.5
        launch(x, y)
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += p.gravity
        p.vx *= 0.98
        p.vy *= 0.98
        p.life--

        p.trail.push({ x: p.x, y: p.y })
        if (p.trail.length > 6) p.trail.shift()

        const alpha = Math.min(1, p.life / 30)
        if (elapsed > DURATION_MS) {
          const fadeOut = Math.max(0, 1 - (elapsed - DURATION_MS) / 2000)
          ctx!.globalAlpha = alpha * fadeOut
        } else {
          ctx!.globalAlpha = alpha
        }

        if (p.trail.length > 1) {
          ctx!.beginPath()
          ctx!.moveTo(p.trail[0].x, p.trail[0].y)
          for (let j = 1; j < p.trail.length; j++) {
            ctx!.lineTo(p.trail[j].x, p.trail[j].y)
          }
          ctx!.strokeStyle = p.color
          ctx!.lineWidth = p.size * 0.5
          ctx!.stroke()
        }

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = p.color
        ctx!.fill()

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx!.fillStyle = p.color + '30'
        ctx!.fill()

        if (p.life <= 0) {
          particles.splice(i, 1)
        }
      }

      animId = requestAnimationFrame(animate)
    }

    // 开场连发
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const x = canvas!.width * 0.15 + Math.random() * canvas!.width * 0.7
        const y = canvas!.height * 0.15 + Math.random() * canvas!.height * 0.4
        launch(x, y)
      }, i * 200)
    }

    animId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [duration])

  if (duration === 0) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}
