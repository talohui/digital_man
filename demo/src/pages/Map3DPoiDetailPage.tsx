import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import CAppBottomSheet from '../components/mobile/overlays/CAppBottomSheet'
import PoiDetailArticleTitle from '../components/mobile/poi/PoiDetailArticleTitle'
import PoiDetailCompanionCard from '../components/mobile/poi/PoiDetailCompanionCard'
import PoiDetailHighlights from '../components/mobile/poi/PoiDetailHighlights'
import PoiDetailPaintingFrame from '../components/mobile/poi/PoiDetailPaintingFrame'
import PoiDetailVisitTips from '../components/mobile/poi/PoiDetailVisitTips'
import PoiReviewCard, { type PoiVisitorReview } from '../components/mobile/poi/PoiReviewCard'
import { openGlobalXiaoling } from '../components/guide/guideAssistantEvents'
import { getScenicRouteConfig } from '../data/lingshanScenicRoutes'
import { getLingshanPoiDetailById, lingshanPoiDetails, type LingshanPoiDetail } from '../data/lingshanPoiDetails'
import { getPoiDetailContent, type PoiDetailContent } from '../data/poiDetailContent'
import { getRecommendedStayLabel } from '../data/poiGuideMetadata'
import { getPoiDetailPresentationConfig, getPoiReviewSamples } from '../data/poiDetailPresentationConfig'
import { guideSpots } from '../data/guideData'
import { lingshanPois } from '../data/lingshanMapData'
import { getPoiMedia, type ScenicMediaEntry } from '../data/scenicMediaCatalog'
import { goBackFromPoi, goContinueNextStop, goToMapBrowse } from '../lib/mapGuideNavigation'
import { readCAppReturnContext, resolveHomeCrowdPoiReturn, resolveSpotsListPoiReturn } from '../lib/cAppReturnContext'
import { resolvePoiNavigationTarget } from '../prototype-navigation/poiNavigationTarget'
import { queuePoiShowcaseNavigation, resolveShowcaseNavigationOrigin } from '../prototype-navigation/showcaseNavigation'
import { useGuideStore } from '../store/useGuideStore'
import { isPoiEntrySource, parsePoiRouteReturnContext, parseStopParam } from '../types/mapGuide'
import '../styles/map/mapPoiDetailMobile.css'

type ModelPreviewStatus = 'idle' | 'loading' | 'ready' | 'error'

const POI_REVIEW_TAGS = ['庄严震撼', '视野开阔', '值得登临', '讲解有帮助', '拍照出片']

const POI_DETAIL_ID_ALIASES: Record<string, string> = {
  jiulong_bath: 'jiulong_guanyu',
  lingshan_screen_wall: 'lingshan_wall'
}

function Map3DPoiDetailPage() {
  const navigate = useNavigate()
  const markStopListened = useGuideStore((state) => state.markStopListened)
  const { poiId } = useParams()
  const [searchParams] = useSearchParams()
  const sourceParam = searchParams.get('from')
  const source = isPoiEntrySource(sourceParam) ? sourceParam : 'browse'
  const routeId = searchParams.get('routeId') ?? undefined
  const stopIndex = parseStopParam(searchParams.get('stop'))
  const resolvedPoiId = resolvePoiDetailId(poiId)
  const detail = getPoiDetailView(resolvedPoiId)
  const content = getPoiDetailContent(detail?.id)
  const media = getPoiMedia(detail?.id)
  const presentation = getPoiDetailPresentationConfig(detail?.id)
  const route = routeId ? getScenicRouteConfig(routeId) : undefined
  const routeReturnContext = route ? parsePoiRouteReturnContext(searchParams, route.stops.length) : undefined
  const usesEditorialTemplate = Boolean(detail && presentation.template === 'editorial')
  const relatedDetails = useMemo(
    () => lingshanPoiDetails.filter((item) => item.id !== detail?.id).slice(0, 4),
    [detail?.id]
  )
  const showcaseNavigationTarget = useMemo(
    () => resolvePoiNavigationTarget(resolvedPoiId, detail?.name),
    [detail?.name, resolvedPoiId]
  )
  const showcaseNavigationOrigin = useMemo(
    () => resolvedPoiId ? resolveShowcaseNavigationOrigin(resolvedPoiId) : undefined,
    [resolvedPoiId]
  )
  const [modelPreviewOpen, setModelPreviewOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTags, setReviewTags] = useState<string[]>([])
  const [reviewText, setReviewText] = useState('')
  const [visitorReviews, setVisitorReviews] = useState<PoiVisitorReview[]>([])
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false)
  const articleRef = useRef<HTMLElement | null>(null)
  const reviewRef = useRef<HTMLElement | null>(null)
  const handleBack = () => {
    const returnContext = readCAppReturnContext()
    const spotsListReturnTo = resolveSpotsListPoiReturn(returnContext, resolvedPoiId)
    if (spotsListReturnTo) {
      navigate(spotsListReturnTo, { replace: true })
      return
    }
    const homeReturnTo = resolveHomeCrowdPoiReturn(returnContext, resolvedPoiId)
    if (homeReturnTo) {
      navigate(homeReturnTo, { replace: true })
      return
    }
    goBackFromPoi(navigate, {
      from: source,
      routeId,
      poiStopIndex: stopIndex,
      returnStage: routeReturnContext?.returnStage,
      returnStopIndex: routeReturnContext?.returnStopIndex,
      presentation: routeReturnContext?.presentation
    })
  }
  const isRouteEntry = source === 'route'
  const stopNumber = stopIndex !== undefined ? stopIndex + 1 : undefined

  useEffect(() => {
    setModelPreviewOpen(false)
    setFeedbackText('')
    setReviewRating(5)
    setReviewTags([])
    setReviewText('')
    setReviewSheetOpen(false)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [detail?.id])

  useEffect(() => {
    if (!detail?.id) return
    try {
      const stored = window.localStorage.getItem(`lingshan:poi-reviews:${detail.id}`)
      const parsed = stored ? JSON.parse(stored) : []
      setVisitorReviews(Array.isArray(parsed) ? parsed : [])
    } catch {
      setVisitorReviews([])
    }
  }, [detail?.id])

  useEffect(() => {
    if (!feedbackText) {
      return undefined
    }

    const timer = window.setTimeout(() => setFeedbackText(''), 1800)
    return () => window.clearTimeout(timer)
  }, [feedbackText])

  if (!detail) {
    return (
      <main className="map-poi-detail map-poi-detail--empty">
        <button className="map-poi-detail__back" type="button" onClick={handleBack}>
          返回沙盘
        </button>
        <section className="map-poi-detail__empty-panel">
          <p>景点详情待补充</p>
          <h1>当前点位还没有绑定移动端详情资料</h1>
          <span>可返回沙盘继续查看其它核心景点。</span>
        </section>
      </main>
    )
  }

  const routeResumeStopIndex = routeReturnContext?.returnStopIndex ?? stopIndex
  const nextStopIndex = routeResumeStopIndex !== undefined ? routeResumeStopIndex + 1 : undefined
  const routeStopCount = route?.stops.length ?? 0
  const canContinueRoute = Boolean(
    isRouteEntry && routeId && nextStopIndex !== undefined && (!routeStopCount || nextStopIndex < routeStopCount)
  )

  const handleOpenCompanionGuide = () => {
    markStopListened(detail.id)
    openGlobalXiaoling({
      mode: 'poi',
      autoPrompt: presentation.companionPrompt.replace('{spotName}', detail.name)
    })
  }

  const handleShowcaseNavigation = () => {
    if (!showcaseNavigationTarget || !showcaseNavigationOrigin) {
      setFeedbackText('该景点的导航坐标尚未完善')
      return
    }
    const result = queuePoiShowcaseNavigation(showcaseNavigationTarget, showcaseNavigationOrigin)
    if (result.status === 'cancelled') return
    if (result.status === 'unavailable') {
      setFeedbackText(result.message)
      return
    }
    goToMapBrowse(navigate, routeReturnContext?.presentation ?? 'ink2d')
  }

  const handleReviewSubmit = () => {
    const normalizedText = reviewText.trim()
    if (!normalizedText && !reviewTags.length) {
      setFeedbackText('请写一句感受或选择一个印象标签')
      return
    }

    const now = new Date()
    const nextReview: PoiVisitorReview = {
      id: `local-${now.getTime()}`,
      rating: reviewRating,
      tags: reviewTags,
      text: normalizedText,
      createdAt: `${now.getMonth() + 1}月${now.getDate()}日`
    }
    const nextReviews = [nextReview, ...visitorReviews].slice(0, 12)
    setVisitorReviews(nextReviews)
    try {
      window.localStorage.setItem(`lingshan:poi-reviews:${detail.id}`, JSON.stringify(nextReviews))
    } catch {
      // 本地存储不可用时仍保留本次页面内评价。
    }
    setReviewText('')
    setReviewTags([])
    setFeedbackText('评价已保存，感谢分享')
  }
  const handleReviewDelete = (reviewId: string) => {
    const nextReviews = visitorReviews.filter((review) => review.id !== reviewId)
    setVisitorReviews(nextReviews)
    try {
      window.localStorage.setItem(`lingshan:poi-reviews:${detail.id}`, JSON.stringify(nextReviews))
    } catch {
      // 本地存储不可用时仍更新当前页面。
    }
    setFeedbackText('已删除本地评价')
  }
  const reviewProfile = presentation.review
  const displayedReviews = [...visitorReviews, ...getPoiReviewSamples({
    poiId: detail.id,
    spotName: detail.name,
    primaryHighlight: getHighlightItems(content, detail)[0]?.title ?? '现场细节',
    config: presentation
  })].slice(0, 3)

  return (
    <main
      className={`map-poi-detail ${isRouteEntry ? 'map-poi-detail--route' : 'map-poi-detail--browse'} ${
        modelPreviewOpen ? 'is-model-preview-open' : ''
      }`}
      data-map-view-mode="poi"
      data-poi-id={detail.id}
      data-poi-source={source}
      data-route-id={routeId}
      data-route-stop-index={stopIndex}
      data-xiaoling-mode="poi"
      data-poi-template={usesEditorialTemplate ? 'editorial' : undefined}
    >
      <header className="map-poi-detail__topbar">
        <button className="map-poi-detail__back" type="button" onClick={handleBack} aria-label="返回">
          <span aria-hidden="true" />
        </button>
        <div className="map-poi-detail__top-title">
          {isRouteEntry ? (
            <>
              <strong>{route?.name ?? '文化探秘路线'}</strong>
              <small>{stopNumber ? `第${stopNumber}站 · ${detail.name}` : detail.name}</small>
            </>
          ) : (
            <>
              <strong>{detail.name}</strong>
              <small>
                {detail.category} · {detail.subtitle}
              </small>
            </>
          )}
        </div>
        <button className="map-poi-detail__more" type="button" aria-label="更多" onClick={() => setFeedbackText('更多功能建设中')}>
          <span className="map-poi-detail__more-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </button>
      </header>

      <PoiDetailPaintingFrame spotId={detail.id}>
        <PoiStageMedia detail={detail} media={media} />
        {modelPreviewOpen ? <MapPoiModelPreview model={detail.model} name={detail.name} transparentBackdrop={presentation.transparentModelBackdrop} /> : null}

        {detail.model ? (
          <button
            className={`map-poi-detail__model-switch ${modelPreviewOpen ? 'is-on' : ''}`}
            type="button"
            onClick={() => setModelPreviewOpen((open) => !open)}
            aria-pressed={modelPreviewOpen}
            aria-label={modelPreviewOpen ? '切换到景点图片' : '查看3D模型'}
          >
            <strong>3D 模型</strong>
            <span aria-hidden="true" />
          </button>
        ) : null}

        <div className="map-poi-detail__stage-title">
          <div className="map-poi-detail__tags">
            <span>{detail.category}</span>
            <span>{getPrimaryTag(detail)}</span>
            <em>{getStayTimeLabel(detail)}</em>
          </div>
          <h1>{detail.name}</h1>
          <p>{detail.subtitle}</p>
        </div>

      </PoiDetailPaintingFrame>

      <section className="map-poi-detail__entry">
        <button
          className="map-poi-detail__article-entry"
          type="button"
          onClick={() => articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          <strong>图文介绍</strong>
          <span>景点故事 / 核心看点 / 游览建议</span>
        </button>
        <div className="map-poi-detail__entry-actions">
          {usesEditorialTemplate ? (
            <button
              className="map-poi-detail__review-jump"
              type="button"
              onClick={() => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            >
              <span aria-hidden="true">★</span>
              游客评价 {reviewProfile.averageRating.toFixed(1)}
            </button>
          ) : null}
          {!isRouteEntry ? (
            <div className="map-poi-detail__nav-demo">
              <button
                className="map-poi-detail__nav-chip"
                type="button"
                disabled={!showcaseNavigationTarget || !showcaseNavigationOrigin}
                onClick={handleShowcaseNavigation}
              >
                导航到这里
              </button>
              <small>
                {showcaseNavigationOrigin
                  ? `虚拟定位演示 · 从${showcaseNavigationOrigin.name}出发`
                  : '导航坐标待完善'}
              </small>
            </div>
          ) : null}
        </div>
      </section>

      {isRouteEntry ? (
        <p className="map-poi-detail__route-note">
          当前为{route?.name ?? '路线'}{stopNumber ? `第 ${stopNumber} 站` : '中的景点'}。看完详情后，可返回路线或继续下一站。
        </p>
      ) : null}

      <article className="map-poi-detail__article" ref={articleRef}>
        {usesEditorialTemplate ? (
          <PoiDetailArticleTitle title={detail.name} />
        ) : null}
        <section className="map-poi-detail__section">
          <h2>一眼看懂</h2>
          <p>{content?.overview || detail.intro || `${detail.name} 是灵山胜境中的重要景点，适合结合图文、小灵讲解和现场游览一起了解。`}</p>
        </section>
        <PoiInlineImages content={content} afterSection="overview" />

        <PoiDetailHighlights items={getHighlightItems(content, detail)} />
        <PoiInlineImages content={content} afterSection="highlights" />

        <PoiDetailVisitTips
          tips={getLimitedList(content?.visitTips ?? detail.visitTips, ['建议先看整体环境，再靠近观察细节', '适合结合小灵讲解快速理解看点'], content?.contentLevel === 'full' ? 5 : 3)}
        />

        {usesEditorialTemplate ? (
          <PoiDetailCompanionCard
            spotName={detail.name}
            onOpen={handleOpenCompanionGuide}
          />
        ) : null}

        {usesEditorialTemplate ? (
          <div className="map-poi-detail__article-reviews">
            <PoiReviewCard
              ref={reviewRef}
              spotName={detail.name}
              averageRating={reviewProfile.averageRating}
              reviewCount={reviewProfile.reviewCount + visitorReviews.length}
              reviews={displayedReviews}
              onOpen={() => setReviewSheetOpen(true)}
            />
          </div>
        ) : null}

        <section className="map-poi-detail__section">
          <h2>继续查看</h2>
          <div className="map-poi-detail__related-grid">
            {relatedDetails.map((item) => (
              <Link key={item.id} to={`/map-3d-guide-c/poi/${item.id}?from=browse`}>
                <strong>{item.name}</strong>
                <span>{item.subtitle}</span>
              </Link>
            ))}
          </div>
        </section>

        <p className="map-poi-detail__source-note">
          资料来源：
          {content?.source ?? (detail.sources.length ? detail.sources.map((sourceItem) => sourceItem.label).join(' / ') : '灵山胜境官网 / 公开资料')}
        </p>
      </article>

      {isRouteEntry ? (
        <div className="map-poi-detail__route-bar">
          <button className="map-poi-detail__route-secondary" type="button" onClick={handleBack}>
            返回路线
          </button>
          <button
            className="map-poi-detail__route-primary"
            type="button"
            disabled={!canContinueRoute}
            onClick={() => {
              if (routeId && nextStopIndex !== undefined) {
                goContinueNextStop(navigate, routeId, nextStopIndex, routeReturnContext?.presentation)
              }
            }}
          >
            继续下一站
          </button>
        </div>
      ) : null}

      {usesEditorialTemplate && reviewSheetOpen ? (
        <CAppBottomSheet
          title={`评价${detail.name}`}
          eyebrow="游客印象 · 真实感受"
          closeLabel="收起"
          className="map-poi-detail__review-sheet"
          onClose={() => setReviewSheetOpen(false)}
        >
          <div className="map-poi-detail__review-sheet-summary">
            <strong>{reviewProfile.averageRating.toFixed(1)}</strong>
            <span><b aria-label={`${reviewProfile.averageRating.toFixed(1)}星`}>★★★★★</b><small>{reviewProfile.reviewCount + visitorReviews.length} 条评价</small></span>
          </div>

          <div className="map-poi-detail__review-form">
            <div className="map-poi-detail__review-stars" role="group" aria-label="选择评分">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value <= reviewRating ? 'is-active' : ''}
                  onClick={() => setReviewRating(value)}
                  aria-label={`${value}星`}
                  aria-pressed={value === reviewRating}
                >
                  ★
                </button>
              ))}
              <span>{reviewRating}.0</span>
            </div>

            <div className="map-poi-detail__review-tags" aria-label="选择印象标签">
              {POI_REVIEW_TAGS.map((tag) => {
                const active = reviewTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    className={active ? 'is-active' : ''}
                    onClick={() => setReviewTags((current) => active ? current.filter((item) => item !== tag) : [...current, tag])}
                    aria-pressed={active}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>

            <label className="map-poi-detail__review-editor">
              <span>写下你的游览感受</span>
              <textarea
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value.slice(0, 160))}
                placeholder="例如：推荐的观赏位置、游览节奏或现场感受……"
                rows={4}
                maxLength={160}
              />
              <small>{reviewText.length} / 160</small>
            </label>

            <button className="map-poi-detail__review-submit" type="button" onClick={handleReviewSubmit}>
              提交评价
            </button>
          </div>

          <div className="map-poi-detail__review-list" aria-label="近期评价">
            <h3>近期评价</h3>
            {displayedReviews.map((review, index) => (
              <article key={review.id} className="map-poi-detail__review-item">
                <header>
                  <span aria-hidden="true">{index === 0 && visitorReviews.length ? '我' : '游'}</span>
                  <strong>{index === 0 && visitorReviews.length ? '我的评价' : '灵山游客'}</strong>
                  <em>{review.createdAt}</em>
                  <small aria-label={`${review.rating}星`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</small>
                </header>
                {review.text ? <p>{review.text}</p> : null}
                {review.tags.length ? <div>{review.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
                {review.id.startsWith('local-') ? (
                  <button type="button" onClick={() => handleReviewDelete(review.id)}>删除</button>
                ) : null}
              </article>
            ))}
          </div>
          <p className="map-poi-detail__review-local-note">当前为本地评价样板，内容仅保存在此浏览器中。</p>
        </CAppBottomSheet>
      ) : null}

      {feedbackText ? <div className="map-poi-detail__toast">{feedbackText}</div> : null}
    </main>
  )
}

function resolvePoiDetailId(poiId?: string) {
  if (!poiId) {
    return undefined
  }
  return POI_DETAIL_ID_ALIASES[poiId] ?? poiId
}

function getLimitedList(items: string[], fallback: string[], limit = 3) {
  const source = items.length ? items : fallback
  return source.slice(0, limit)
}

function getHighlightItems(content: PoiDetailContent | undefined, detail: LingshanPoiDetail) {
  if (content?.highlights.length) {
    return content.highlights
  }

  return getLimitedList(detail.highlights, ['景点氛围鲜明', '适合停留拍照', '可结合路线讲解']).map((title) => ({ title, description: '' }))
}

function PoiInlineImages({ content, afterSection }: { content?: PoiDetailContent; afterSection: 'overview' | 'highlights' }) {
  const images = content?.inlineImages?.filter((image) => image.afterSection === afterSection) ?? []
  if (!images.length) return null

  return (
    <div className="map-poi-detail__inline-images">
      {images.map((image) => (
        <figure className="map-poi-detail__inline-image" key={image.src}>
          <img src={image.src} alt={image.alt} loading="lazy" />
          {image.caption ? <figcaption>{image.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  )
}

function getPoiDetailView(poiId: string | undefined) {
  const direct = getLingshanPoiDetailById(poiId)
  if (direct) return direct
  if (!poiId) return undefined

  const content = getPoiDetailContent(poiId)
  const catalogPoi = lingshanPois.find((poi) => poi.id === poiId)
  const guideSpot = guideSpots.find((spot) => spot.id === poiId)
  if (!content && !catalogPoi && !guideSpot) return undefined

  const name = catalogPoi?.name ?? guideSpot?.name ?? '灵山景点'
  return {
    id: poiId,
    name,
    shortName: name,
    subtitle: content?.contentLevel === 'full' ? '灵山文化导览' : '景区导览节点',
    category: getFallbackCategory(poiId),
    intro: content?.overview ?? catalogPoi?.intro ?? guideSpot?.intro ?? '',
    highlights: content?.highlights.map((item) => item.title) ?? [],
    visitTips: content?.visitTips ?? [],
    sources: []
  } satisfies LingshanPoiDetail
}

function getFallbackCategory(poiId: string): LingshanPoiDetail['category'] {
  if (['giant_buddha', 'fan_gong', 'wuyin_tancheng', 'jiulong_guanyu'].includes(poiId)) return '核心景点'
  if (['south_gate', 'shengjing_square', 'xingtan_square', 'foqian_square', 'fan_gong_square', 'exit'].includes(poiId)) return '空间节点'
  return '文化节点'
}

function getStayTimeLabel(detail: LingshanPoiDetail) {
  return getRecommendedStayLabel(detail.id)
}

function getPrimaryTag(detail: LingshanPoiDetail) {
  if (detail.id === 'jiulong_guanyu') return '水景演绎'
  if (detail.id === 'xiangfu_temple') return '路线节点'
  if (detail.id === 'giant_buddha') return '佛境核心'
  if (detail.id === 'fan_gong') return '建筑艺术'
  if (detail.id === 'wuyin_tancheng') return '坛城圣境'
  return detail.highlights[0] ?? '景点导览'
}

function PoiStageMedia({ detail, media }: { detail: LingshanPoiDetail; media: ScenicMediaEntry }) {
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set())
  const mediaUrls = Array.from(new Set([media.cover, ...(media.gallery ?? [])]))
  const photoUrl = mediaUrls.find((url) => !failedUrls.has(url))

  useEffect(() => {
    setFailedUrls(new Set())
  }, [detail.id, media.cover])

  return (
    <div className="map-poi-detail__stage-media">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={media.alt}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrls((current) => new Set([...current, photoUrl]))}
        />
      ) : (
        <div className="map-poi-detail__ink-cover" role="img" aria-label={`${detail.name} 水墨意象封面`}>
          <span>{detail.shortName}</span>
        </div>
      )}
    </div>
  )
}

function MapPoiModelPreview({
  model,
  name,
  transparentBackdrop = false
}: {
  model: LingshanPoiDetail['model']
  name: string
  transparentBackdrop?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [status, setStatus] = useState<ModelPreviewStatus>('idle')
  const modelUrl = model?.url
  const usesPaperBackdrop = transparentBackdrop

  useEffect(() => {
    if (!modelUrl || !canvasRef.current) {
      return undefined
    }

    const previewUrl = modelUrl
    let disposed = false
    let animationFrame = 0
    let renderer: any
    let scene: any
    let camera: any
    let rootModel: any

    const disposeMaterial = (material: any) => {
      if (!material) return
      Object.keys(material).forEach((key) => {
        const value = material[key]
        if (value?.isTexture) {
          value.dispose()
        }
      })
      material.dispose?.()
    }

    const disposeObject = (object: any) => {
      object?.traverse?.((child: any) => {
        child.geometry?.dispose?.()
        if (Array.isArray(child.material)) {
          child.material.forEach(disposeMaterial)
        } else {
          disposeMaterial(child.material)
        }
      })
    }

    async function loadPreview() {
      setStatus('loading')
      try {
        const [THREE, loaderModule] = await Promise.all([
          import('three'),
          import('three/examples/jsm/loaders/GLTFLoader.js')
        ])
        if (disposed || !canvasRef.current) return

        scene = new THREE.Scene()
        scene.background = usesPaperBackdrop ? null : new THREE.Color('#1f3b31')
        camera = new THREE.PerspectiveCamera(38, 1, 0.1, 5000)
        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          antialias: true,
          alpha: usesPaperBackdrop,
          powerPreference: 'low-power'
        })
        if (usesPaperBackdrop) renderer.setClearColor(0x000000, 0)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25))

        const resize = () => {
          if (!canvasRef.current || !renderer || !camera) return
          const rect = canvasRef.current.getBoundingClientRect()
          const width = Math.max(1, Math.floor(rect.width))
          const height = Math.max(1, Math.floor(rect.height))
          renderer.setSize(width, height, false)
          camera.aspect = width / height
          camera.updateProjectionMatrix()
        }

        const ambient = new THREE.HemisphereLight('#fff9e8', usesPaperBackdrop ? '#948875' : '#6b806d', 2.3)
        const key = new THREE.DirectionalLight('#fff2c1', 2.6)
        key.position.set(3, 5, 4)
        scene.add(ambient, key)

        const loader = new loaderModule.GLTFLoader()
        const gltf = await loader.loadAsync(previewUrl)
        if (disposed) {
          disposeObject(gltf.scene)
          return
        }

        rootModel = gltf.scene
        const box = new THREE.Box3().setFromObject(rootModel)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxSize = Math.max(size.x, size.y, size.z, 1)
        rootModel.position.sub(center)
        rootModel.scale.setScalar(3.2 / maxSize)
        scene.add(rootModel)

        camera.position.set(3.4, 2.3, 4.2)
        camera.lookAt(0, 0, 0)
        resize()
        setStatus('ready')

        const tick = () => {
          if (disposed) return
          if (rootModel) {
            rootModel.rotation.y += 0.0025
          }
          renderer.render(scene, camera)
          animationFrame = window.requestAnimationFrame(tick)
        }
        tick()
      } catch (error) {
        console.error('[Map3DPoiDetailPage] model preview failed', error)
        if (!disposed) {
          setStatus('error')
        }
      }
    }

    loadPreview()

    return () => {
      disposed = true
      window.cancelAnimationFrame(animationFrame)
      disposeObject(rootModel)
      renderer?.renderLists?.dispose?.()
      renderer?.dispose?.()
      renderer?.forceContextLoss?.()
      scene?.clear?.()
      if (canvasRef.current) {
        canvasRef.current.width = 1
        canvasRef.current.height = 1
      }
      rootModel = null
      camera = null
      scene = null
      renderer = null
    }
  }, [modelUrl, usesPaperBackdrop])

  return (
    <div className="map-poi-detail__model-preview" aria-live="polite">
      {model ? <canvas ref={canvasRef} aria-label={`${name} 3D 模型预览`} /> : null}
      {!model ? <span>3D 建设中</span> : null}
      {status === 'loading' ? <span>模型加载中...</span> : null}
      {status === 'error' ? <span>模型暂时无法显示</span> : null}
    </div>
  )
}

export default Map3DPoiDetailPage
