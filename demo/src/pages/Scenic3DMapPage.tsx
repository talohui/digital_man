import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Scenic3DMapScene from '../components/scenic3d/Scenic3DMapScene'
import { lingshanPois } from '../data/lingshanMapData'

const corePoiIds = ['giant_buddha', 'jiulong_guanyu', 'fan_gong', 'wuyin_tancheng']

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
  const [selectedPoiId, setSelectedPoiId] = useState(corePoiIds[0])
  const corePois = useMemo(
    () =>
      corePoiIds.map((poiId) => {
        const poi = lingshanPois.find((item) => item.id === poiId)
        const fallback = fallbackPoiMeta[poiId]

        return {
          poiId,
          name: poi?.name ?? fallback.name,
          intro: poi?.intro ?? fallback.intro,
        }
      }),
    []
  )
  const selectedPoi = corePois.find((poi) => poi.poiId === selectedPoiId) ?? corePois[0]

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
        <Scenic3DMapScene selectedPoiId={selectedPoiId} onSelectPoi={setSelectedPoiId} />
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
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {corePois.map((poi) => {
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
          当前为艺术化 3D 导览原型，真实导航仍以腾讯地图 POI 与 navLocation 为准。
        </p>
        <button
          type="button"
          onClick={() => navigate('/map')}
          style={{
            minHeight: 40,
            padding: '0 16px',
            border: 0,
            borderRadius: 8,
            background: '#0d9488',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          返回真实地图
        </button>
      </aside>
    </main>
  )
}

export default Scenic3DMapPage
