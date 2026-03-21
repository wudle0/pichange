interface SizeInputProps {
  size: number
  onSizeChange: (size: number) => void
}

function SizeInput({ size, onSizeChange }: SizeInputProps) {
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val >= 8 && val <= 120) {
      onSizeChange(val)
    }
  }

  function handleRangeChange(e: React.ChangeEvent<HTMLInputElement>) {
    onSizeChange(parseInt(e.target.value, 10))
  }

  return (
    <div className="duration-input">
      <input
        className="duration-input-field"
        type="number"
        min="8"
        max="120"
        step="4"
        value={size}
        onChange={handleInputChange}
      />
      <span className="duration-input-unit">px</span>
      <input
        className="duration-input-range"
        type="range"
        min="8"
        max="120"
        step="4"
        value={size}
        onChange={handleRangeChange}
      />
    </div>
  )
}

export default SizeInput
