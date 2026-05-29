import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Scenic3DMapScene from '../components/scenic3d/Scenic3DMapScene'
import { lingshanPois, lingshanSceneRoutes } from '../data/lingshanMapData'

const fallbackRoute = {
  id: 'fallback_3d_scene',
  name: '灵山经典 3D 导览线',
  description: '以灵山大佛、九龙灌浴、梵宫、五印坛城为核心的艺术化 3D 导览路线。',
  poiSequence: ['jiulong_guanyu', 'giant_buddha', 'fan_gong', 'wuyin_tancheng'],
}

const fallbackPoiMeta: Record<string, { name: string; intro: string }> = {
  giant_buddha: {
    name: '灵山大佛',
    intro: '核心地标低模占位，后续替换为庄重、符号化的大佛模型。',
  },
  jiulong_guanyu: {
    name: '九龙灌浴',
    intro: '水景核心低模占位，后续补充莲台、水池和仪式感表达。',
  },
  fan_gong: {
    name: '梵宫',
    intro: '建筑地标低模占位，后续替换为梵宫外部体块与穹顶模型。',
  },
  wuyin_tancheng: {
    name: '五印坛城',
    intro: '坛城建筑低模占位，后续补充多层结构与中心塔体。',
  },
}

function Scenic3DMapPage() {
  const navigate = useNavigate()
  const currentRoute = lingshanSceneRoutes[0] ?? fallbackRoute
  const [selectedPoiId, setSelectedPoiId] = useState(currentRoute.poiSequence[0])
  const routePois = useMemo(
    () =>
      currentRoute.poiSequence.map((poiId) => {
        const poi = lingshanPois.find((item) => item.id === poiId)
        const fallback = fallbackPoiMeta[poiId]

        return {
          poiId,
          name: poi?.name ?? fallback?.name ?? poiId,
          intro: poi?.intro ?? fallback?.intro ?? '当前为 3D 艺术化路线站点占位。',
        }
      }),
    [currentRoute.poiSequence]
  )
  const selectedPoi = routePois.find((poi) => poi.poiId === selectedPoiId) ?? routePois[0]

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        background: '#dfe9e7',
        color: '#24323a',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
        }}
      >
        <Scenic3DMapScene
          selectedPoiId={selectedPoiId}
          onSelectPoi={setSelectedPoiId}
          routePoiSequence={currentRoute.poiSequence}
        />
      </div>

      <section
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          width: 340,
          maxWidth: 'calc(100vw - 48px)',
          padding: 18,
          border: '1px solid rgba(255, 255, 255, 0.58)',
          borderRadius: 14,
          background: 'rgba(255, 255, 255, 0.78)',
          boxShadow: '0 20px 50px rgba(22, 34, 40, 0.16)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <p
          style={{
            margin: '0 0 6px',
            color: '#6a7c76',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0,
          }}
        >
          艺术化 3D 原型
        </p>
        <h1
          style={{
            margin: '0 0 16px',
            fontSize: 28,
            lineHeight: 1.22,
          }}
        >
          灵山胜境 3D 导览地图
        </h1>

        <div
          style={{
            marginBottom: 14,
            padding: 12,
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.54)',
          }}
        >
          <strong
            style={{
              display: 'block',
              marginBottom: 6,
              fontSize: 16,
            }}
          >
            {currentRoute.name}
          </strong>
          <p
            style={{
              margin: 0,
              color: '#5f716b',
              fontSize: 13,
              lineHeight: 1.55,
            }}
          >
            {currentRoute.description}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {routePois.map((poi, index) => {
            const active = poi.poiId === selectedPoiId

            return (
              <button
                key={poi.poiId}
                type="button"
                onClick={() => setSelectedPoiId(poi.poiId)}
                style={{
                  padding: 13,
                  border: active ? '1px solid rgba(171, 112, 24, 0.62)' : '1px solid rgba(56, 76, 84, 0.14)',
                  borderRadius: 10,
                  background: active ? 'rgba(255, 246, 219, 0.92)' : 'rgba(255, 255, 255, 0.58)',
                  color: '#24323a',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: active ? '0 10px 24px rgba(171, 112, 24, 0.14)' : 'none',
                }}
              >
                <span style={{ display: 'block', marginBottom: 5, color: active ? '#9a6518' : '#71827c', fontSize: 12, fontWeight: 700 }}>
                  第 {index + 1} 站
                </span>
                <strong style={{ display: 'block', marginBottom: 4, fontSize: 16 }}>
                  {poi.name}
                </strong>
                <span style={{ display: 'block', color: '#64756f', fontSize: 12 }}>
                  {poi.poiId}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <aside
        style={{
          position: 'absolute',
          right: 24,
          bottom: 24,
          width: 380,
          maxWidth: 'calc(100vw - 48px)',
          padding: 18,
          border: '1px solid rgba(255, 255, 255, 0.58)',
          borderRadius: 14,
          background: 'rgba(255, 255, 255, 0.78)',
          boxShadow: '0 20px 50px rgba(22, 34, 40, 0.16)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <h2
          style={{
            margin: '0 0 6px',
            fontSize: 22,
            lineHeight: 1.3,
          }}
        >
          {selectedPoi.name}
        </h2>
        <p style={{ margin: '0 0 10px', color: '#64756f', fontSize: 13 }}>
          poiId：{selectedPoi.poiId}
        </p>
        <p
          style={{
            margin: '0 0 14px',
            color: '#3f5057',
            fontSize: 14,
            lineHeight: 1.65,
          }}
        >
          {selectedPoi.intro}
        </p>
        <p
          style={{
            margin: '0 0 14px',
            color: '#6a5a36',
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          3D 地图为艺术化导览，当前 3D 路线不等同于真实步行导航；真实定位和导航以腾讯地图页 POI 与 navLocation 为准。
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {selectedPoiId ? (
            <button
              type="button"
              onClick={() => navigate(`/map?poi=${encodeURIComponent(selectedPoiId)}`)}
              style={{
                minHeight: 40,
                padding: '0 14px',
                border: 0,
                borderRadius: 8,
                background: '#0d9488',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              查看该景点真实地图
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => navigate(`/map?sceneRoute=${encodeURIComponent(currentRoute.id)}`)}
            style={{
              minHeight: 40,
              padding: '0 14px',
              border: '1px solid rgba(13, 148, 136, 0.3)',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.72)',
              color: '#0b746b',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            查看整条路线真实地图
          </button>
          <button
            type="button"
            onClick={() => navigate('/map')}
            style={{
              minHeight: 40,
              padding: '0 14px',
              border: '1px solid rgba(79, 96, 104, 0.2)',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.58)',
              color: '#43565e',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            返回真实地图
          </button>
        </div>
      </aside>
    </main>
  )
}

export default Scenic3DMapPage
