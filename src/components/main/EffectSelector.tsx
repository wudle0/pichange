import type { AnimationEffect } from '@/types'

interface EffectSelectorProps {
  effect: AnimationEffect
  onEffectChange: (effect: AnimationEffect) => void
}

const EFFECTS: { id: AnimationEffect; icon: string; name: string }[] = [
  { id: 'rain', icon: '🌧️', name: '비처럼' },
  { id: 'rotate', icon: '🔄', name: '회전' },
  { id: 'shake', icon: '↔️', name: '좌우샥샥' },
  { id: 'float', icon: '🫧', name: '둥실둥실' },
  { id: 'ninja', icon: '🥷', name: '닌자' },
]

function EffectSelector({ effect, onEffectChange }: EffectSelectorProps) {
  return (
    <div className="effect-selector">
      {EFFECTS.map((item) => (
        <button
          key={item.id}
          className={`effect-selector-item ${effect === item.id ? 'active' : ''}`}
          onClick={() => onEffectChange(item.id)}
        >
          <span className="effect-selector-item-icon">{item.icon}</span>
          <span className="effect-selector-item-name">{item.name}</span>
        </button>
      ))}
    </div>
  )
}

export default EffectSelector
