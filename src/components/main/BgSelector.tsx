import type { BgColor } from '@/types'

interface BgSelectorProps {
  bgColor: BgColor
  onBgColorChange: (color: BgColor) => void
}

const COLORS: { id: BgColor; label: string; swatchClass?: string }[] = [
  { id: '#ffffff', label: '흰색' },
  { id: '#000000', label: '검은색' },
  { id: 'transparent', label: '투명', swatchClass: 'is-transparent' },
]

function BgSelector({ bgColor, onBgColorChange }: BgSelectorProps) {
  return (
    <div className="bg-selector">
      {COLORS.map((item) => (
        <button
          key={item.id}
          className={`bg-selector-item ${bgColor === item.id ? 'active' : ''}`}
          onClick={() => onBgColorChange(item.id)}
        >
          <span
            className={`bg-selector-item-swatch ${item.swatchClass ?? ''}`.trim()}
            style={item.id === 'transparent' ? undefined : { backgroundColor: item.id }}
          />
          <span className="bg-selector-item-name">{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export default BgSelector
