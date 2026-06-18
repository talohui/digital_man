import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getSplashImageIndex,
  pickRandomImages,
  SPLASH_AUTO_FINISH_MS,
  SPLASH_IMAGE_INTERVAL_MS,
  SPLASH_IMAGE_URLS,
} from '../lib/splashImages'
import './SplashAdPage.css'

const EXIT_FADE_MS = 620

type SplashAdPageProps = {
  onFinish: () => void
}

function toPublicAssetUrl(path: string) {
  if (!path.startsWith('/')) {
    return `${import.meta.env.BASE_URL}${path}`
  }

  return `${import.meta.env.BASE_URL}${path.slice(1)}`
}

function SplashAdPage({ onFinish }: SplashAdPageProps) {
  const selectedImages = useMemo(() => pickRandomImages(SPLASH_IMAGE_URLS), [])
  const autoFinishMs = SPLASH_AUTO_FINISH_MS
  const shouldAutoFinish = autoFinishMs !== null
  const [activeIndex, setActiveIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(() =>
    autoFinishMs === null ? null : Math.ceil(autoFinishMs / 1000),
  )
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set())
  const [isLeaving, setIsLeaving] = useState(false)
  const finishTimerRef = useRef<number | undefined>(undefined)

  const finishSplash = useCallback(() => {
    if (finishTimerRef.current !== undefined) {
      return
    }

    setIsLeaving(true)
    finishTimerRef.current = window.setTimeout(onFinish, EXIT_FADE_MS)
  }, [onFinish])

  useEffect(() => {
    const startedAt = Date.now()
    const imageTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const nextIndex = getSplashImageIndex(elapsed, selectedImages.length, SPLASH_IMAGE_INTERVAL_MS)

      setActiveIndex(Math.max(0, nextIndex))
    }, 180)
    const countdownTimer = window.setInterval(() => {
      if (autoFinishMs === null) {
        return
      }

      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, Math.ceil((autoFinishMs - elapsed) / 1000))

      setSecondsLeft(remaining)
    }, 180)
    const completeTimer = autoFinishMs === null ? undefined : window.setTimeout(finishSplash, autoFinishMs)

    return () => {
      window.clearInterval(imageTimer)
      window.clearInterval(countdownTimer)

      if (completeTimer !== undefined) {
        window.clearTimeout(completeTimer)
      }

      if (finishTimerRef.current !== undefined) {
        window.clearTimeout(finishTimerRef.current)
      }
    }
  }, [autoFinishMs, finishSplash, selectedImages.length, shouldAutoFinish])

  const visibleImages = selectedImages.filter((image) => !failedImages.has(image))
  const hasVisibleImage = visibleImages.length > 0

  return (
    <section className={`splash-ad-page${isLeaving ? ' is-leaving' : ''}`} aria-label="灵山胜境开屏广告">
      <div className="splash-ad-fallback" aria-hidden={hasVisibleImage} />

      {selectedImages.map((image, index) => {
        const isFailed = failedImages.has(image)

        if (isFailed) {
          return null
        }

        return (
          <div key={`${image}-${index}`} className={`splash-ad-visual${index === activeIndex ? ' is-active' : ''}`}>
            <img className="splash-ad-backdrop" src={toPublicAssetUrl(image)} alt="" aria-hidden="true" />
            <img
              className="splash-ad-image"
              src={toPublicAssetUrl(image)}
              alt=""
              aria-hidden="true"
              onError={() => {
                setFailedImages((current) => new Set(current).add(image))
              }}
            />
          </div>
        )
      })}

      <div className="splash-ad-shade-top" />
      <div className="splash-ad-shade-bottom" />

      <header className="splash-ad-header">
        <div className="splash-ad-brand" aria-label="灵山胜境 数字人智慧导览">
          <strong>灵山胜境</strong>
          <span>数字人智慧导览</span>
        </div>

        <button className="splash-ad-skip" type="button" onClick={finishSplash}>
          {secondsLeft === null ? '进入首页' : `跳过 ${secondsLeft}`}
        </button>
      </header>

      <div className="splash-ad-copy">
        <span className="splash-ad-eyebrow">Daily Lingshan</span>
        <h1>灵山胜境</h1>
        <p>小灵陪你开启智慧禅意之旅</p>
        <div className="splash-ad-tags">智慧讲解 · 地图导览 · 文创消费 · 祈福体验</div>

        <div className="splash-ad-dots" aria-hidden="true">
          {selectedImages.map((image, index) => (
            <span key={`${image}-dot-${index}`} className={index === activeIndex ? 'is-active' : ''} />
          ))}
        </div>
      </div>

      {shouldAutoFinish && (
        <div className="splash-ad-progress" aria-hidden="true">
          <span />
        </div>
      )}
    </section>
  )
}

export default SplashAdPage
