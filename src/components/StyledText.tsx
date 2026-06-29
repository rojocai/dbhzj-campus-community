'use client'

// 带样式的文本组件——读取 siteConfig 中的 textStyles 并应用
// 支持特效: fadeIn, slideUp, reflection, glow, rainbow, typing, scroll

interface TextStyle {
  font: string
  size: string
  color: string
  opacity: string
  effect: string
}

const defaultStyle: TextStyle = {
  font: 'sans',
  size: '18',
  color: '#ffffff',
  opacity: '1',
  effect: 'none',
}

// 解析样式配置
function parseStyles(raw: string | undefined): Record<string, TextStyle> {
  try {
    return JSON.parse(raw || '{}')
  } catch {
    return {}
  }
}

export function getTextStyle(
  siteConfig: any,
  key: string
): TextStyle {
  const styles = parseStyles(siteConfig?.textStyles)
  return { ...defaultStyle, ...(styles[key] || {}) }
}

export function getTextStyleInline(style: TextStyle): React.CSSProperties {
  const fontFamily =
    style.font === 'cursive'
      ? 'KaiTi, STKaiti, cursive'
      : style.font === 'serif'
        ? 'Georgia, serif'
        : style.font === 'mono'
          ? 'Consolas, monospace'
          : 'inherit'

  return {
    fontFamily,
    fontSize: style.size + 'px',
    color: style.color,
    opacity: parseFloat(style.opacity),
  }
}

export function getTextEffectClass(effect: string): string {
  switch (effect) {
    case 'fadeIn': return 'animate-text-fadeIn'
    case 'slideUp': return 'animate-text-slideUp'
    case 'reflection': return 'animate-text-reflection'
    case 'glow': return 'animate-text-glow'
    case 'rainbow': return 'animate-text-rainbow'
    case 'typing': return 'animate-text-typing'
    case 'scroll': return 'animate-text-scroll'
    default: return ''
  }
}

export default function StyledText({
  siteConfig,
  textKey,
  children,
  className = '',
  as: Tag = 'span',
}: {
  siteConfig: any
  textKey: string
  children: React.ReactNode
  className?: string
  as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'p'
}) {
  const style = getTextStyle(siteConfig, textKey)
  const inlineStyle = getTextStyleInline(style)
  const effectClass = getTextEffectClass(style.effect)

  return (
    <Tag
      className={`${effectClass} ${className}`}
      style={inlineStyle}
      {...(style.effect === 'reflection' ? { 'data-text': typeof children === 'string' ? children : undefined } : {})}
    >
      {children}
    </Tag>
  )
}
