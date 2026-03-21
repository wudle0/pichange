import { useRef } from 'react'

interface ImageUploaderProps {
  image: string | null
  onImageChange: (src: string | null) => void
}

function ImageUploader({ image, onImageChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleClick() {
    inputRef.current?.click()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      onImageChange(reader.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div
      className={`image-uploader ${image ? 'has-image' : ''}`}
      onClick={handleClick}
    >
      {image ? (
        <>
          <img className="image-uploader-preview" src={image} alt="uploaded" />
          <span className="image-uploader-change">변경</span>
        </>
      ) : (
        <>
          <div className="image-uploader-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <span className="image-uploader-text">이미지를 업로드해주세요</span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
      />
    </div>
  )
}

export default ImageUploader
