export type BgColor = '#ffffff' | '#000000' | 'transparent'

export type AnimationEffect = 'rain' | 'rotate' | 'shake' | 'float' | 'ninja'

export type ImageCount = number | 'infinite'

export interface AnimationConfig {
  image: string | null
  effect: AnimationEffect
  count: ImageCount
  duration: number
}

export interface GridInfo {
  cols: number
  rows: number
}
