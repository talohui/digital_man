import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { getScenicRouteConfig } from '../data/lingshanScenicRoutes'
import { getLingshanPoiDetailById, lingshanPoiDetails, type LingshanPoiDetail } from '../data/lingshanPoiDetails'
import { goBackFromPoi, goContinueNextStop } from '../lib/mapGuideNavigation'
import { isPoiEntrySource, parsePoiRouteReturnContext, parseStopParam, POI_MODE_QUESTION_MAP } from '../types/mapGuide'
import '../styles/map/mapPoiDetailMobile.css'

type ModelPreviewStatus = 'idle' | 'loading' | 'ready' | 'error'

const POI_DETAIL_ID_ALIASES: Record<string, string> = {
  jiulong_bath: 'jiulong_guanyu',
  lingshan_screen_wall: 'lingshan_wall'
}

const GENERIC_POI_QUESTIONS = ['这个景点有什么看点？', '适合停留多久？', '这里适合拍照吗？', '游览时要注意什么？'] as const

function Map3DPoiDetailPage() {
  const navigate = useNavigate()
  const { poiId } = useParams()
  const [searchParams] = useSearchParams()
  const sourceParam = searchParams.get('from')
  const source = isPoiEntrySource(sourceParam) ? sourceParam : 'browse'
  const routeId = searchParams.get('routeId') ?? undefined
  const stopIndex = parseStopParam(searchParams.get('stop'))
  const resolvedPoiId = resolvePoiDetailId(poiId)
  const detail = getLingshanPoiDetailById(resolvedPoiId)
  const route = routeId ? getScenicRouteConfig(routeId) : undefined
  const routeReturnContext = route ? parsePoiRouteReturnContext(searchParams, route.stops.length) : undefined
  const relatedDetails = useMemo(
    () => lingshanPoiDetails.filter((item) => item.id !== detail?.id).slice(0, 4),
    [detail?.id]
  )
  const [modelPreviewOpen, setModelPreviewOpen] = useState(false)
  const [xiaolingOpen, setXiaolingOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const articleRef = useRef<HTMLElement | null>(null)
  const handleBack = () => goBackFromPoi(navigate, {
    from: source,
    routeId,
    poiStopIndex: stopIndex,
    returnStage: routeReturnContext?.returnStage,
    returnStopIndex: routeReturnContext?.returnStopIndex,
    presentation: routeReturnContext?.presentation
  })
  const isRouteEntry = source === 'route'
  const stopNumber = stopIndex !== undefined ? stopIndex + 1 : undefined

  useEffect(() => {
    setModelPreviewOpen(false)
    setXiaolingOpen(false)
    setFeedbackText('')
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

  const questions = POI_MODE_QUESTION_MAP[detail.id] ?? GENERIC_POI_QUESTIONS
  const xiaolingTip = isRouteEntry
    ? '小灵：我可以给你讲讲建筑格局、礼佛顺序和路线衔接。'
    : '小灵：我可以给你讲讲这里的佛诞故事、看点和拍照建议。'
  const routeResumeStopIndex = routeReturnContext?.returnStopIndex ?? stopIndex
  const nextStopIndex = routeResumeStopIndex !== undefined ? routeResumeStopIndex + 1 : undefined
  const routeStopCount = route?.stops.length ?? 0
  const canContinueRoute = Boolean(
    isRouteEntry && routeId && nextStopIndex !== undefined && (!routeStopCount || nextStopIndex < routeStopCount)
  )

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
    >
      <header className="map-poi-detail__topbar">
        <button className="map-poi-detail__back" type="button" onClick={handleBack} aria-label="返回">
          <span aria-hidden="true" />
        </button>
        <div className="map-poi-detail__top-title">
          {isRouteEntry ? (
            <>
              <strong>{route?.name ?? '历史文化路线'}</strong>
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

      <section className={`map-poi-detail__stage map-poi-detail__stage--${detail.id}`}>
        <PoiStageMedia detail={detail} />
        {modelPreviewOpen ? <MapPoiModelPreview model={detail.model} name={detail.name} /> : null}

        {detail.model ? (
          <button
            className={`map-poi-detail__model-switch ${modelPreviewOpen ? 'is-on' : ''}`}
            type="button"
            onClick={() => setModelPreviewOpen((open) => !open)}
            aria-pressed={modelPreviewOpen}
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

        <button className="map-poi-detail__xiaoling-card" type="button" onClick={() => setXiaolingOpen(true)}>
          <span className="map-poi-detail__xiaoling-avatar" aria-hidden="true">
            <i />
          </span>
          <span>
            {xiaolingTip}
            <em>点我提问</em>
          </span>
        </button>
      </section>

      <section className="map-poi-detail__entry">
        <button
          className="map-poi-detail__article-entry"
          type="button"
          onClick={() => articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          <strong>图文介绍</strong>
          <span>景点故事 / 核心看点 / 游览建议</span>
        </button>
        {!isRouteEntry ? (
          <button
            className="map-poi-detail__nav-chip"
            type="button"
            onClick={() => setFeedbackText('导航能力建设中，后续将接入腾讯地图路线规划。')}
          >
            距你约 320m · 到这里
          </button>
        ) : null}
      </section>

      {isRouteEntry ? (
        <p className="map-poi-detail__route-note">
          当前为{route?.name ?? '路线'}{stopNumber ? `第 ${stopNumber} 站` : '中的景点'}。看完详情后，可返回路线或继续下一站。
        </p>
      ) : null}

      <article className="map-poi-detail__article" ref={articleRef}>
        <section className="map-poi-detail__section">
          <h2>一眼看懂</h2>
          <p>{detail.intro || `${detail.name} 是灵山胜境中的重要景点，适合结合图文、小灵讲解和现场游览一起了解。`}</p>
        </section>

        <section className="map-poi-detail__section">
          <h2>核心看点</h2>
          <ul>
            {getLimitedList(detail.highlights, ['景点氛围鲜明', '适合停留拍照', '可结合路线讲解']).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="map-poi-detail__section">
          <h2>游览建议</h2>
          <ul>
            {getLimitedList(detail.visitTips, ['建议先看整体环境，再靠近观察细节', '适合结合小灵讲解快速理解看点'], 2).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

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
          {detail.sources.length ? detail.sources.map((sourceItem) => sourceItem.label).join(' / ') : '灵山胜境官网 / 公开资料'}
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

      <button
        className="map-poi-detail__floating-xiaoling"
        type="button"
        onClick={() => setXiaolingOpen(true)}
        aria-label="问小灵"
      >
        <span className="map-poi-detail__xiaoling-avatar" aria-hidden="true">
          <i />
        </span>
        <em>小灵</em>
      </button>

      {feedbackText ? <div className="map-poi-detail__toast">{feedbackText}</div> : null}

      {xiaolingOpen ? (
        <XiaolingPoiSheet detail={detail} questions={questions} onClose={() => setXiaolingOpen(false)} />
      ) : null}
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

function getPoiMockAnswer(detail: LingshanPoiDetail, question: string) {
  if (question.includes('故事') || question.includes('看点')) {
    return detail.highlights[0]
      ? `${detail.name}的重点可以先看“${detail.highlights[0]}”。正式接入后，小灵会结合现场位置继续讲得更细。`
      : `${detail.name}是灵山胜境中的重要节点，适合结合图文介绍和现场空间一起理解。`
  }

  if (question.includes('表演')) {
    return '表演时间后续会接入景区运营数据。演示版先建议你在到达后留意现场公告，并提前几分钟占位观看。'
  }

  if (question.includes('拍照') || question.includes('位置')) {
    return '建议先找能看到景点整体轮廓的位置，再靠近观察细节。正式版本会补充更具体的拍照点。'
  }

  if (question.includes('礼佛') || question.includes('顺序')) {
    return '可以按景区动线先看整体空间，再进入核心节点停留。正式接入后会结合路线站点给出顺序建议。'
  }

  if (question.includes('多久') || question.includes('停留')) {
    return `${getStayTimeLabel(detail)}。如果你在路线中，我也可以按下一站节奏帮你控制时间。`
  }

  return `我会围绕${detail.name}回答故事、看点、拍照位置和游览建议。`
}

function getStayTimeLabel(detail: LingshanPoiDetail) {
  const matched = detail.visitTips.join(' ').match(/建议(?:停留)?\s*(\d+\s*[-~至]?\s*\d*)\s*分钟/)
  return matched ? `建议停留${matched[1]}分钟` : '建议停留15分钟'
}

function getPrimaryTag(detail: LingshanPoiDetail) {
  if (detail.id === 'jiulong_guanyu') return '水景演绎'
  if (detail.id === 'xiangfu_temple') return '路线节点'
  if (detail.id === 'giant_buddha') return '佛境核心'
  if (detail.id === 'fan_gong') return '建筑艺术'
  if (detail.id === 'wuyin_tancheng') return '坛城圣境'
  return detail.highlights[0] ?? '景点导览'
}

function PoiStageMedia({ detail }: { detail: LingshanPoiDetail }) {
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set())
  const photo = detail.photo
  const photoUrl =
    photo && !failedUrls.has(photo.url)
      ? photo.url
      : photo?.fallbackUrl && !failedUrls.has(photo.fallbackUrl)
        ? photo.fallbackUrl
        : undefined

  useEffect(() => {
    setFailedUrls(new Set())
  }, [photo?.url])

  return (
    <div className="map-poi-detail__stage-media">
      {photoUrl && photo ? (
        <img
          src={photoUrl}
          alt={photo.alt}
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

function MapPoiModelPreview({ model, name }: { model: LingshanPoiDetail['model']; name: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [status, setStatus] = useState<ModelPreviewStatus>('idle')
  const modelUrl = model?.url

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
        scene.background = new THREE.Color('#1f3b31')
        camera = new THREE.PerspectiveCamera(38, 1, 0.1, 5000)
        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          antialias: true,
          alpha: false,
          powerPreference: 'low-power'
        })
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

        const ambient = new THREE.HemisphereLight('#fff9e8', '#6b806d', 2.3)
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
  }, [modelUrl])

  return (
    <div className="map-poi-detail__model-preview" aria-live="polite">
      {model ? <canvas ref={canvasRef} aria-label={`${name} 3D 模型预览`} /> : null}
      {!model ? <span>3D 建设中</span> : null}
      {status === 'loading' ? <span>模型加载中...</span> : null}
      {status === 'error' ? <span>模型暂时无法显示</span> : null}
    </div>
  )
}

function XiaolingPoiSheet({
  detail,
  questions,
  onClose
}: {
  detail: LingshanPoiDetail
  questions: readonly string[]
  onClose: () => void
}) {
  const defaultAnswer = '可以问我这里的故事、看点、拍照位置和游览建议。选择一个问题，我会围绕当前景点继续讲。'
  const [selectedQuestion, setSelectedQuestion] = useState('')
  const [answerText, setAnswerText] = useState(defaultAnswer)
  const [inputText, setInputText] = useState('')
  const [voiceActive, setVoiceActive] = useState(false)

  useEffect(() => {
    setSelectedQuestion('')
    setAnswerText(defaultAnswer)
    setInputText('')
    setVoiceActive(false)
  }, [defaultAnswer, detail.id])

  const handleQuestion = (question: string) => {
    setSelectedQuestion(question)
    setAnswerText(getPoiMockAnswer(detail, question))
  }

  const handleSend = () => {
    const question = inputText.trim()
    if (!question) {
      return
    }
    setSelectedQuestion(question)
    setAnswerText(getPoiMockAnswer(detail, question))
    setInputText('')
  }

  return (
    <div className="map-poi-detail__sheet-layer" role="dialog" aria-modal="true" aria-label={`小灵 · ${detail.name}`}>
      <button className="map-poi-detail__sheet-scrim" type="button" onClick={onClose} aria-label="关闭小灵问答" />
      <section className="map-poi-detail__xiaoling-sheet">
        <div className="map-poi-detail__sheet-handle" />
        <header className="map-poi-detail__sheet-head">
          <span className="map-poi-detail__xiaoling-avatar" aria-hidden="true">
            <i />
          </span>
          <div>
            <h2>小灵 · {detail.name}</h2>
            <p>你想先了解什么？</p>
          </div>
        </header>

        <div className="map-poi-detail__question-grid">
          {questions.map((question) => (
            <button
              key={question}
              type="button"
              className={selectedQuestion === question ? 'is-active' : ''}
              onClick={() => handleQuestion(question)}
            >
              {question}
            </button>
          ))}
        </div>

        <div className="map-poi-detail__answer-box">
          <strong>{selectedQuestion || '小灵在这儿'}</strong>
          <p>{answerText}</p>
        </div>

        <div className="map-poi-detail__sheet-input">
          <button
            type="button"
            className={voiceActive ? 'is-active' : ''}
            onClick={() => setVoiceActive((value) => !value)}
            aria-label="语音输入"
            aria-pressed={voiceActive}
          >
            <span />
          </button>
          <input
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleSend()
              }
            }}
            placeholder="问小灵景点故事、拍照点"
            aria-label="问小灵"
          />
          <button type="button" aria-label="发送" onClick={handleSend}>
            ↑
          </button>
        </div>
      </section>
    </div>
  )
}

export default Map3DPoiDetailPage
