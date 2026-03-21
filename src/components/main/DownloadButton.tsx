import { useState } from 'react'
import type { AnimationEffect, ImageCount, BgColor } from '@/types'
import { generateGif } from '@/utils/gifGenerator'

interface DownloadButtonProps {
  image: string | null
  effect: AnimationEffect
  count: ImageCount
  duration: number
  size: number
  gap: number
  bgColor: BgColor
}

function DownloadButton({ image, effect, count, duration, size, gap, bgColor }: DownloadButtonProps) {
  const [progress, setProgress] = useState<number | null>(null)

  const isGenerating = progress !== null

  async function handleDownload() {
    if (!image || isGenerating) return

    try {
      setProgress(0)
      const blob = await generateGif(image, effect, count, duration, size, gap, bgColor, setProgress)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pichange_${effect}_${duration}s.gif`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('GIF generation failed:', err)
    } finally {
      setProgress(null)
    }
  }

  if (isGenerating) {
    const percent = Math.round(progress * 100)
    return (
      <div className="download-button">
        <div className="download-button-progress">
          <div
            className="download-button-progress-bar"
            style={{ width: `${percent}%` }}
          />
          <span className="download-button-progress-text">
            생성 중... {percent}%
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="download-button">
      <button
        className="download-button-btn"
        disabled={!image}
        onClick={handleDownload}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        GIF 다운로드
      </button>
    </div>
  )
}

export default DownloadButton
