interface GapInputProps {
  gap: number
  onGapChange: (gap: number) => void
  disabled?: boolean
}

function GapInput({ gap, onGapChange, disabled }: GapInputProps) {
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val >= 0 && val <= 40) {
      onGapChange(val)
    }
  }

  function handleRangeChange(e: React.ChangeEvent<HTMLInputElement>) {
    onGapChange(parseInt(e.target.value, 10))
  }

  return (
    <div className={`duration-input ${disabled ? 'disabled' : ''}`}>
      <input
        className="duration-input-field"
        type="number"
        min="0"
        max="40"
        step="1"
        value={gap}
        onChange={handleInputChange}
        disabled={disabled}
      />
      <span className="duration-input-unit">px</span>
      <input
        className="duration-input-range"
        type="range"
        min="0"
        max="40"
        step="1"
        value={gap}
        onChange={handleRangeChange}
        disabled={disabled}
      />
    </div>
  )
}

export default GapInput
