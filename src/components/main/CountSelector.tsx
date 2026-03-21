import type { ImageCount } from '@/types'

interface CountSelectorProps {
  count: ImageCount
  onCountChange: (count: ImageCount) => void
  disabled?: boolean
}

const COUNTS: ImageCount[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 'infinite',
]

function CountSelector({ count, onCountChange, disabled }: CountSelectorProps) {
  return (
    <div className={`count-selector ${disabled ? 'disabled' : ''}`}>
      {COUNTS.map((item) => (
        <button
          key={String(item)}
          className={`count-selector-item ${item === 'infinite' ? 'infinite' : ''} ${count === item ? 'active' : ''}`}
          onClick={() => !disabled && onCountChange(item)}
          disabled={disabled}
        >
          {item === 'infinite' ? '∞ 무한' : item}
        </button>
      ))}
    </div>
  )
}

export default CountSelector
