import { useState } from 'react'

import Scenic3DPreview from '../components/scenic3d/Scenic3DPreview'

const previewPois = [
  {
    poiId: 'giant_buddha',
    name: '灵山大佛',
    status: 'placeholder',
    description: '核心宗教地标，占位模型强调大佛轮廓、莲座和台阶关系。',
  },
  {
    poiId: 'jiulong_guanyu',
    name: '九龙灌浴',
    status: 'placeholder',
    description: '核心水景地标，占位模型强调圆形水池、莲台和中心构图。',
  },
  {
    poiId: 'fan_gong',
    name: '梵宫',
    status: 'placeholder',
    description: '核心建筑地标，占位模型强调建筑体块、穹顶和入口轴线。',
  },
  {
    poiId: 'wuyin_tancheng',
    name: '五印坛城',
    status: 'placeholder',
    description: '核心建筑地标，占位模型强调多层坛城结构和中心塔体。',
  },
]

function Scenic3DPreviewPage() {
  const [selectedPoiId, setSelectedPoiId] = useState(previewPois[0].poiId)
  const selectedPoi = previewPois.find((poi) => poi.poiId === selectedPoiId) ?? previewPois[0]

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '28px 24px',
        background: '#eef2f3',
        color: '#1f2a33',
        boxSizing: 'border-box',
      }}
    >
      <section
        style={{
          maxWidth: 1240,
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            margin: '0 0 20px',
            fontSize: 30,
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          灵山胜境 3D 资产预览测试页
        </h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <aside
            style={{
              flex: '0 0 320px',
              minWidth: 280,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {previewPois.map((poi) => {
              const active = poi.poiId === selectedPoiId

              return (
                <button
                  key={poi.poiId}
                  type="button"
                  onClick={() => setSelectedPoiId(poi.poiId)}
                  style={{
                    width: '100%',
                    padding: 16,
                    border: active ? '1px solid #2f6fed' : '1px solid #d6dee6',
                    borderRadius: 8,
                    background: active ? '#ffffff' : '#f9fbfc',
                    boxShadow: active ? '0 10px 24px rgba(47, 111, 237, 0.12)' : 'none',
                    color: '#25323d',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <strong
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      fontSize: 17,
                      lineHeight: 1.35,
                    }}
                  >
                    {poi.name}
                  </strong>
                  <span
                    style={{
                      display: 'block',
                      marginBottom: 8,
                      color: '#60707d',
                      fontSize: 13,
                      lineHeight: 1.4,
                    }}
                  >
                    {poi.poiId}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      marginBottom: 10,
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: active ? '#eaf1ff' : '#edf1f4',
                      color: active ? '#2f6fed' : '#687985',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {poi.status}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      color: '#53636f',
                      fontSize: 13,
                      lineHeight: 1.55,
                    }}
                  >
                    {poi.description}
                  </span>
                </button>
              )
            })}
          </aside>

          <section
            style={{
              flex: '1 1 620px',
              minWidth: 320,
              padding: 18,
              border: '1px solid #d7e0e8',
              borderRadius: 10,
              background: '#ffffff',
              boxShadow: '0 18px 42px rgba(31, 42, 51, 0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 14,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: '0 0 6px',
                    fontSize: 22,
                    lineHeight: 1.3,
                  }}
                >
                  {selectedPoi.name}
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: '#62717d',
                    fontSize: 14,
                  }}
                >
                  当前 selectedPoiId：{selectedPoi.poiId}
                </p>
              </div>
              <span
                style={{
                  alignSelf: 'flex-start',
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: '#fff4df',
                  color: '#8a5b12',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {selectedPoi.status}
              </span>
            </div>

            <Scenic3DPreview selectedPoiId={selectedPoiId} height={560} />

            <p
              style={{
                margin: '14px 0 0',
                color: '#63727d',
                fontSize: 14,
                lineHeight: 1.65,
              }}
            >
              当前为低模占位资产，后续可替换为 Blender 导出的 .glb 模型。
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}

export default Scenic3DPreviewPage
