interface DurationInputProps {
  duration: number
  onDurationChange: (duration: number) => void
}

function DurationInput({ duration, onDurationChange }: DurationInputProps) {
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value)
    if (!isNaN(val) && val >= 0.5 && val <= 10) {
      onDurationChange(val)
    }
  }

  function handleRangeChange(e: React.ChangeEvent<HTMLInputElement>) {
    onDurationChange(parseFloat(e.target.value))
  }

  return (
    <div className="duration-input">
      <input
        className="duration-input-field"
        type="number"
        min="0.5"
        max="10"
        step="0.5"
        value={duration}
        onChange={handleInputChange}
      />
      <span className="duration-input-unit">초</span>
      <input
        className="duration-input-range"
        type="range"
        min="0.5"
        max="10"
        step="0.5"
        value={duration}
        onChange={handleRangeChange}
      />
    </div>
  )
}

export default DurationInput
