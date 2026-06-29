'use client'

interface StylePanelProps {
  textKey: string
  config: any
  updateField: (field: string, value: any) => void
}

const fonts = [
  { value: 'sans', label: 'Sans Serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Monospace' },
  { value: 'cursive', label: 'Cursive' },
]

const effects = [
  { value: 'none', label: 'None' },
  { value: 'fadeIn', label: 'Fade In' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'reflection', label: 'Reflection' },
  { value: 'glow', label: 'Glow' },
  { value: 'rainbow', label: 'Rainbow' },
  { value: 'typing', label: 'Typewriter' },
  { value: 'scroll', label: 'Scroll' },
]

const defaultStyle = { font: 'sans', size: '18', color: '#ffffff', opacity: '1', effect: 'none' }

function parseStyles(raw: string | undefined): Record<string, any> {
  try { return JSON.parse(raw || '{}') } catch { return {} }
}

export default function StylePanel({ textKey, config, updateField }: StylePanelProps) {
  const parsed = parseStyles(config.textStyles)
  const style = { ...defaultStyle, ...(parsed[textKey] || {}) }

  const updateStyle = (prop: string, value: string) => {
    const current = { ...defaultStyle, ...(parsed[textKey] || {}) }
    current[prop] = value
    const newParsed = { ...parsed, [textKey]: current }
    updateField('textStyles', JSON.stringify(newParsed))
  }

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
      {/* Preview */}
      <div
        className="bg-white rounded-lg p-3 border border-gray-200 text-sm overflow-hidden"
        style={{
          fontFamily: style.font === 'cursive' ? 'KaiTi, STKaiti, cursive' :
                      style.font === 'serif' ? 'serif' :
                      style.font === 'mono' ? 'monospace' : 'inherit',
          fontSize: style.size + 'px',
          color: style.color,
          opacity: parseFloat(style.opacity),
        }}
      >
        <span
          className={
            style.effect === 'rainbow' ? 'animate-text-rainbow' :
            style.effect === 'glow' ? 'animate-text-glow' :
            style.effect === 'fadeIn' ? 'animate-text-fadeIn' :
            style.effect === 'slideUp' ? 'animate-text-slideUp' :
            style.effect === 'typing' ? 'animate-text-typing' :
            style.effect === 'scroll' ? 'animate-text-scroll' : ''
          }
          {...(style.effect === 'reflection' ? { 'data-text': 'Preview Text' } : {})}
        >
          {style.effect === 'reflection' ? 'Preview Text' : 'Preview Text'}
        </span>
      </div>

      {/* Font + Size */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Font</label>
          <select
            value={style.font}
            onChange={(e) => updateStyle('font', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          >
            {fonts.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Size {style.size}px</label>
          <input
            type="range" min="12" max="72"
            value={parseInt(style.size) || 18}
            onChange={(e) => updateStyle('size', e.target.value)}
            className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </div>

      {/* Color + Opacity */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Color</label>
          <input
            type="color"
            value={style.color}
            onChange={(e) => updateStyle('color', e.target.value)}
            className="w-full h-7 rounded border border-gray-300 cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">Opacity {parseFloat(style.opacity).toFixed(1)}</label>
          <input
            type="range" min="0" max="1" step="0.1"
            value={parseFloat(style.opacity)}
            onChange={(e) => updateStyle('opacity', e.target.value)}
            className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </div>

      {/* Effect */}
      <div>
        <label className="block text-xs text-gray-500 mb-0.5">Effect</label>
        <div className="flex flex-wrap gap-1">
          {effects.map(eff => (
            <button
              key={eff.value}
              type="button"
              onClick={() => updateStyle('effect', eff.value)}
              className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                style.effect === eff.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {eff.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
