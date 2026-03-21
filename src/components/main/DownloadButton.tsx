import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AnimationEffect, ImageCount, BgColor } from '@/types'
import { generateGif } from '@/utils/gifGenerator'

/** 모바일 저장 안내·버튼을 나누는 기준 (문구·기능 분기) */
type MobileSavePlatform = 'android' | 'ios' | 'other'

function detectMobileSavePlatform(): MobileSavePlatform {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/Android/i.test(ua)) return 'android'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  return 'other'
}

type MobileSaveCopy = {
  badge: string
  intro: ReactNode
  steps: ReactNode
  note: string
  shareFailHint: string
  labels: {
    download: string
    newTab: string
    share: string
  }
  /** 버튼 순서: 다운로드 링크 / 새 탭 / 공유 */
  actionOrder: Array<'download' | 'newTab' | 'share'>
  downloadStyle: 'primary' | 'secondary' | 'tertiary'
  newTabStyle: 'primary' | 'secondary'
}

function getMobileSaveCopy(platform: MobileSavePlatform): MobileSaveCopy {
  const commonInApp = (
    <>
      {' '}
      <strong>카톡·인스타 인앱 브라우저</strong>는 저장이 막히는 경우가 많아요. 가능하면 <strong>Chrome / Safari</strong>로 여세요.
    </>
  )

  switch (platform) {
    case 'android':
      return {
        badge: '안드로이드',
        intro: (
          <>
            <strong>안드로이드</strong>에서는 <strong>「GIF 다운로드」</strong>가 가장 잘 됩니다.
            {commonInApp}
          </>
        ),
        steps: (
          <>
            ① <strong>「GIF 다운로드」</strong>로 다운로드 폴더에 저장합니다.
            <br />
            ② 안 되면 <strong>「새 탭에서 GIF 열기」</strong> → 주소창 옆 <strong>⋮(더보기)</strong> → <strong>다운로드</strong> / <strong>이미지 저장</strong>.
            <br />
            ③ 갤러리·파일 앱에 넣으려면 <strong>「공유로 저장」</strong>을 누르세요.
          </>
        ),
        note: '미리보기는 저장용이 아닙니다. 위 버튼을 사용해 주세요.',
        shareFailHint:
          '「GIF 다운로드」 또는 「새 탭에서 GIF 열기」를 누른 뒤,\n'
          + '⋮(더보기) 메뉴에서 「다운로드」·「이미지 저장」을 이용해 주세요.',
        labels: {
          download: 'GIF 다운로드 (권장)',
          newTab: '새 탭에서 GIF 열기',
          share: '공유로 저장 (갤러리·파일 앱)',
        },
        actionOrder: ['download', 'newTab', 'share'],
        downloadStyle: 'primary',
        newTabStyle: 'secondary',
      }
    case 'ios':
      return {
        badge: 'iPhone · iPad',
        intro: (
          <>
            <strong>iOS(Safari)</strong>는 이 화면에서 GIF를 길게 눌러 저장하면 실패하는 경우가 많습니다.
            {commonInApp}
          </>
        ),
        steps: (
          <>
            ① <strong>「새 탭에서 GIF 열기」</strong>를 누릅니다.
            <br />
            ② Safari 맨 아래 <strong>공유(□↑)</strong> → <strong>이미지 저장</strong> / <strong>파일에 저장</strong>.
            <br />
            ③ <strong>Chrome 앱</strong> 등 다른 브라우저면 <strong>「GIF 다운로드 시도」</strong>도 눌러 볼 수 있어요. (Safari는 대부분 무시됩니다)
          </>
        ),
        note: '미리보기는 저장용이 아닙니다. 새 탭·공유 방법을 먼저 써 주세요.',
        shareFailHint:
          '「새 탭에서 GIF 열기」를 누른 뒤,\n'
          + 'Safari 맨 아래 공유(□↑) → 「이미지 저장」 또는 「파일에 저장」을 이용해 주세요.',
        labels: {
          download: 'GIF 다운로드 시도 (Chrome 등)',
          newTab: '새 탭에서 GIF 열기 (권장)',
          share: '공유로 저장 (사진·파일)',
        },
        actionOrder: ['newTab', 'share', 'download'],
        downloadStyle: 'tertiary',
        newTabStyle: 'primary',
      }
    default:
      return {
        badge: '모바일',
        intro: (
          <>
            이 화면에서 GIF를 <strong>길게 눌러 저장</strong>하면 실패하는 브라우저가 많습니다.
            {commonInApp}
          </>
        ),
        steps: (
          <>
            ① <strong>「GIF 다운로드」</strong> 또는 <strong>「새 탭에서 GIF 열기」</strong>를 시도합니다.
            <br />
            ② <strong>공유</strong> 또는 <strong>⋮ 메뉴</strong>에서 <strong>다운로드</strong>·<strong>이미지 저장</strong>을 고릅니다.
            <br />
            ③ 안 되면 다른 브라우저(Chrome / Safari)로 같은 페이지를 열어 보세요.
          </>
        ),
        note: '미리보기는 저장용이 아닙니다. 위 버튼을 순서대로 시도해 주세요.',
        shareFailHint:
          '「GIF 다운로드」·「새 탭에서 GIF 열기」를 누른 뒤,\n'
          + '브라우저 메뉴에서 「다운로드」 또는 「이미지 저장」을 이용해 주세요.',
        labels: {
          download: 'GIF 다운로드',
          newTab: '새 탭에서 GIF 열기',
          share: '공유로 저장',
        },
        actionOrder: ['download', 'newTab', 'share'],
        downloadStyle: 'primary',
        newTabStyle: 'secondary',
      }
  }
}

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

async function tryShareGifFile(file: File): Promise<boolean> {
  if (!navigator.share) return false

  const data: ShareData = {
    files: [file],
    title: 'PICHANGE',
    text: '배경화면 GIF',
  }

  async function attempt(): Promise<'ok' | 'abort' | 'fail'> {
    try {
      await navigator.share(data)
      return 'ok'
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return 'abort'
      console.warn('Web Share:', e)
      return 'fail'
    }
  }

  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    const r = await attempt()
    return r === 'ok' || r === 'abort'
  }

  const r = await attempt()
  return r === 'ok' || r === 'abort'
}

function DownloadButton({ image, effect, count, duration, size, gap, bgColor }: DownloadButtonProps) {
  const [progress, setProgress] = useState<number | null>(null)
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState<string | null>(null)
  const [mobileFileName, setMobileFileName] = useState('')
  const pendingBlobRef = useRef<Blob | null>(null)
  const revokeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isGenerating = progress !== null

  const closeMobilePreview = useCallback(() => {
    pendingBlobRef.current = null
    setMobileFileName('')
    setMobilePreviewUrl((prev) => {
      if (prev) {
        if (revokeTimerRef.current) {
          clearTimeout(revokeTimerRef.current)
          revokeTimerRef.current = null
        }
        // 새 탭에서 blob URL을 쓰므로 바로 revoke 하면 안 됨 → 지연 해제
        revokeTimerRef.current = setTimeout(() => {
          URL.revokeObjectURL(prev)
          revokeTimerRef.current = null
        }, 300_000)
      }
      return null
    })
  }, [])

  useEffect(() => {
    return () => {
      if (revokeTimerRef.current) clearTimeout(revokeTimerRef.current)
      if (mobilePreviewUrl) URL.revokeObjectURL(mobilePreviewUrl)
    }
  }, [mobilePreviewUrl])

  async function deliverGifBlob(blob: Blob) {
    const filename = `pichange_${effect}_${duration}s.gif`

    if (isMobileDevice()) {
      /*
       * 모바일: GIF 생성은 비동기라 생성 직후 navigator.share는 제스처가 끊겨 실패하는 경우가 많음.
       * iOS Safari는 <a download> + blob이 거의 안 됨 → 새 탭 + 공유 안내.
       * Android Chrome은 사용자 탭으로 <a download>가 되는 경우가 많음 → 모달에서 버튼 제공.
       */
      pendingBlobRef.current = blob
      setMobileFileName(filename)
      setMobilePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(blob)
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

  async function handleShareFromModal() {
    const blob = pendingBlobRef.current
    if (!blob || !mobileFileName) return
    const file = new File([blob], mobileFileName, { type: 'image/gif' })
    const ok = await tryShareGifFile(file)
    if (ok) {
      closeMobilePreview()
      return
    }
    const hint = getMobileSaveCopy(detectMobileSavePlatform()).shareFailHint
    window.alert(`이 기기에서 공유 창을 열 수 없습니다.\n\n${hint}`)
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

  const mobileSaveCopy = useMemo(() => getMobileSaveCopy(detectMobileSavePlatform()), [])

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

      {mobilePreviewUrl && mobileFileName && (
        <div className="download-button-mobile-save" role="dialog" aria-modal="true" aria-label="GIF 저장">
          <button
            type="button"
            className="download-button-mobile-save-backdrop"
            aria-label="닫기"
            onClick={closeMobilePreview}
          />
          <div className="download-button-mobile-save-panel">
            <span className="download-button-mobile-save-badge" aria-hidden>
              {mobileSaveCopy.badge}
            </span>
            <p className="download-button-mobile-save-text">{mobileSaveCopy.intro}</p>
            <p className="download-button-mobile-save-text-secondary">{mobileSaveCopy.steps}</p>
            <div className="download-button-mobile-save-actions">
              {mobileSaveCopy.actionOrder.map((action) => {
                if (action === 'download') {
                  const downloadClass =
                    mobileSaveCopy.downloadStyle === 'primary'
                      ? 'download-button-mobile-save-download'
                      : mobileSaveCopy.downloadStyle === 'secondary'
                        ? 'download-button-mobile-save-download download-button-mobile-save-download--secondary'
                        : 'download-button-mobile-save-download download-button-mobile-save-download--tertiary'
                  return (
                    <a
                      key={action}
                      href={mobilePreviewUrl}
                      download={mobileFileName}
                      className={downloadClass}
                    >
                      {mobileSaveCopy.labels.download}
                    </a>
                  )
                }
                if (action === 'newTab') {
                  const openClass =
                    mobileSaveCopy.newTabStyle === 'primary'
                      ? 'download-button-mobile-save-open'
                      : 'download-button-mobile-save-open download-button-mobile-save-open--secondary'
                  return (
                    <a
                      key={action}
                      href={mobilePreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={openClass}
                    >
                      {mobileSaveCopy.labels.newTab}
                    </a>
                  )
                }
                return (
                  <button
                    key={action}
                    type="button"
                    className="download-button-mobile-save-share"
                    onClick={handleShareFromModal}
                  >
                    {mobileSaveCopy.labels.share}
                  </button>
                )
              })}
            </div>
            <p className="download-button-mobile-save-note">{mobileSaveCopy.note}</p>
            <div className="download-button-mobile-save-img-wrap download-button-mobile-save-img-wrap--dim">
              <img src={mobilePreviewUrl} alt="" className="download-button-mobile-save-img" draggable={false} />
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
