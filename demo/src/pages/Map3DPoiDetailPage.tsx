import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { getLingshanPoiDetailById, lingshanPoiDetails, type LingshanPoiDetail } from '../data/lingshanPoiDetails'

type GlbPreviewStatus = 'idle' | 'loading' | 'ready' | 'error'

function Map3DPoiDetailPage() {
  const navigate = useNavigate()
  const { poiId } = useParams()
  const detail = getLingshanPoiDetailById(poiId)
  const relatedDetails = useMemo(
    () => lingshanPoiDetails.filter((item) => item.id !== detail?.id).slice(0, 4),
    [detail?.id]
  )

  if (!detail) {
    return (
      <main className="map-poi-detail map-poi-detail--empty">
        <button className="map-poi-detail__back" onClick={() => navigate('/map-3d-guide-c')}>
          返回沙盘
        </button>
        <section className="map-poi-detail__panel">
          <p className="map-poi-detail__kicker">POI DETAIL</p>
          <h1>景点详情待补充</h1>
          <p>当前点位还没有绑定移动端详情资料，可返回沙盘继续查看其它核心景点。</p>
        </section>
      </main>
    )
  }

  return (
    <main className="map-poi-detail">
      <header className="map-poi-detail__topbar">
        <button className="map-poi-detail__back" onClick={() => navigate('/map-3d-guide-c')}>
          返回沙盘
        </button>
        <span>{detail.category}</span>
      </header>

      <section className="map-poi-detail__hero">
        <PoiDetailPhoto detail={detail} />

        <div className="map-poi-detail__title">
          <p className="map-poi-detail__kicker">LINGSHAN SCENIC POI</p>
          <h1>{detail.name}</h1>
          <p>{detail.subtitle}</p>
        </div>
      </section>

      <section className="map-poi-detail__panel map-poi-detail__intro">
        <h2>景点介绍</h2>
        <p>{detail.intro}</p>
      </section>

      <section className="map-poi-detail__grid">
        <div className="map-poi-detail__panel">
          <h2>看点</h2>
          <ul>
            {detail.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="map-poi-detail__panel">
          <h2>移动端游览提示</h2>
          <ul>
            {detail.visitTips.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="map-poi-detail__model">
        <div>
          <p className="map-poi-detail__kicker">HIGH DETAIL GLB</p>
          <h2>{detail.model?.label ?? '暂无专用 GLB'}</h2>
          <p>{detail.model?.note ?? '该点位暂未绑定核心地标 GLB，后续可补充轻量模型或高清模型。'}</p>
        </div>
        {detail.model ? (
          <a className="map-poi-detail__model-link" href={detail.model.url} target="_blank" rel="noreferrer">
            打开 GLB
            {detail.model.sizeLabel ? <span>{detail.model.sizeLabel}</span> : null}
          </a>
        ) : null}
      </section>

      <MapPoiGlbPreview model={detail.model} name={detail.name} />

      <section className="map-poi-detail__panel">
        <h2>资料来源</h2>
        <div className="map-poi-detail__sources">
          {detail.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
              {source.label}
            </a>
          ))}
        </div>
      </section>

      <section className="map-poi-detail__related">
        <h2>继续查看</h2>
        <div>
          {relatedDetails.map((item) => (
            <Link key={item.id} to={`/map-3d-guide-c/poi/${item.id}`}>
              <strong>{item.name}</strong>
              <span>{item.subtitle}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

function PoiDetailPhoto({ detail }: { detail: LingshanPoiDetail }) {
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set())
  const photo = detail.photo
  const photoUrl =
    photo && !failedUrls.has(photo.url)
      ? photo.url
      : photo?.fallbackUrl && !failedUrls.has(photo.fallbackUrl)
        ? photo.fallbackUrl
        : undefined
  const showPhoto = Boolean(photoUrl)
  const usingFallbackPhoto = Boolean(photo?.fallbackUrl && photoUrl === photo.fallbackUrl)

  useEffect(() => {
    setFailedUrls(new Set())
  }, [photo?.url])

  return (
    <div className="map-poi-detail__photo">
      {showPhoto && photo ? (
        <img
          src={photoUrl}
          alt={photo.alt}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => {
            if (!photoUrl) {
              return
            }
            setFailedUrls((current) => new Set([...current, photoUrl]))
          }}
        />
      ) : (
        <div className="map-poi-detail__photo-placeholder" role="img" aria-label={`${detail.name} 本地水墨封面`}>
          <span>{detail.shortName}</span>
          <small>INK COVER</small>
        </div>
      )}
      <div className="map-poi-detail__photo-caption">
        <span>
          {showPhoto && photo
            ? usingFallbackPhoto
              ? '本地照片待补充，已显示水墨封面'
              : photo.caption
            : photo
              ? '官方图加载受限，已显示本地水墨封面'
              : '本地水墨封面'}
        </span>
        {photo ? (
          <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
            来源
          </a>
        ) : null}
      </div>
    </div>
  )
}

function MapPoiGlbPreview({ model, name }: { model: LingshanPoiDetail['model']; name: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [status, setStatus] = useState<GlbPreviewStatus>('idle')
  const modelUrl = model?.url

  useEffect(() => {
    if (!enabled || !modelUrl || !canvasRef.current) {
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
        scene.background = new THREE.Color('#f4f4f4')
        camera = new THREE.PerspectiveCamera(38, 1, 0.1, 5000)
        renderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6))

        const resize = () => {
          if (!canvasRef.current || !renderer || !camera) return
          const rect = canvasRef.current.getBoundingClientRect()
          const width = Math.max(1, Math.floor(rect.width))
          const height = Math.max(1, Math.floor(rect.height))
          renderer.setSize(width, height, false)
          camera.aspect = width / height
          camera.updateProjectionMatrix()
        }

        const ambient = new THREE.HemisphereLight('#ffffff', '#b8b8b8', 2.4)
        const key = new THREE.DirectionalLight('#ffffff', 2.6)
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
        const targetSize = 3.2
        rootModel.scale.setScalar(targetSize / maxSize)
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
        console.error('[Map3DPoiDetailPage] GLB preview failed', error)
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
      renderer?.dispose?.()
      scene?.clear?.()
    }
  }, [enabled, modelUrl])

  return (
    <section className="map-poi-detail__preview map-poi-detail__panel">
      <div>
        <p className="map-poi-detail__kicker">MOBILE 3D PREVIEW</p>
        <h2>{name} 高精模型预览</h2>
        <p>为避免移动端首屏卡顿，高清 GLB 预览需要手动加载。</p>
      </div>
      {model ? (
        <>
          <div className="map-poi-detail__preview-stage">
            {enabled ? <canvas ref={canvasRef} aria-label={`${name} 3D GLB 预览`} /> : null}
            {!enabled ? <span>点击加载 3D 模型</span> : null}
            {status === 'loading' ? <span>模型加载中...</span> : null}
            {status === 'error' ? <span>模型加载失败，可使用上方 GLB 链接检查资源。</span> : null}
          </div>
          <button
            className="map-poi-detail__preview-button"
            type="button"
            onClick={() => setEnabled((value) => !value)}
          >
            {enabled ? '关闭 3D 预览' : '加载高清 3D 模型'}
          </button>
        </>
      ) : (
        <div className="map-poi-detail__preview-stage">
          <span>暂无绑定模型</span>
        </div>
      )}
    </section>
  )
}

export default Map3DPoiDetailPage
