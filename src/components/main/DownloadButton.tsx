import { useCallback, useEffect, useState } from 'react'
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

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return true
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData
  return uaData?.mobile === true
}

function DownloadButton({ image, effect, count, duration, size, gap, bgColor }: DownloadButtonProps) {
  const [progress, setProgress] = useState<number | null>(null)
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState<string | null>(null)

  const isGenerating = progress !== null

  const closeMobilePreview = useCallback(() => {
    setMobilePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }, [])

  useEffect(() => {
    return () => {
      if (mobilePreviewUrl) URL.revokeObjectURL(mobilePreviewUrl)
    }
  }, [mobilePreviewUrl])

  async function deliverGifBlob(blob: Blob) {
    const filename = `pichange_${effect}_${duration}s.gif`
    const file = new File([blob], filename, { type: 'image/gif' })

    try {
      if (navigator.share && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'PICHANGE',
          text: '배경화면 GIF',
        })
        return
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.warn('Web Share failed, fallback:', err)
    }

    if (isMobileDevice()) {
      const url = URL.createObjectURL(blob)
      setMobilePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
      return
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function handleDownload() {
    if (!image || isGenerating) return

    try {
      setProgress(0)
      const blob = await generateGif(image, effect, count, duration, size, gap, bgColor, setProgress)
      await deliverGifBlob(blob)
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

      {mobilePreviewUrl && (
        <div className="download-button-mobile-save" role="dialog" aria-modal="true" aria-label="GIF 저장">
          <button
            type="button"
            className="download-button-mobile-save-backdrop"
            aria-label="닫기"
            onClick={closeMobilePreview}
          />
          <div className="download-button-mobile-save-panel">
            <p className="download-button-mobile-save-text">
              아래 GIF를 <strong>길게 눌러</strong> &quot;이미지 저장&quot; 또는 &quot;사진에 저장&quot;을 눌러주세요.
            </p>
            <div className="download-button-mobile-save-img-wrap">
              <img src={mobilePreviewUrl} alt="저장할 GIF" className="download-button-mobile-save-img" />
            </div>
            <button type="button" className="download-button-mobile-save-close" onClick={closeMobilePreview}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DownloadButton
