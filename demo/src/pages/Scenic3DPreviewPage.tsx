import { useState } from 'react'

import Scenic3DPreview from '../components/scenic3d/Scenic3DPreview'

const previewPoiIds = [
  'giant_buddha',
  'jiulong_guanyu',
  'fan_gong',
  'wuyin_tancheng',
]

function Scenic3DPreviewPage() {
  const [selectedPoiId, setSelectedPoiId] = useState(previewPoiIds[0])

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: 24,
        background: '#f5f7f8',
        color: '#1f2a33',
        boxSizing: 'border-box',
      }}
    >
      <section
        style={{
          maxWidth: 1120,
          margin: '0 auto',
        }}
      >
        <h1
          style={{
            margin: '0 0 16px',
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          灵山 3D 预览测试页
        </h1>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 16,
          }}
        >
          {previewPoiIds.map((poiId) => {
            const active = poiId === selectedPoiId

            return (
              <button
                key={poiId}
                type="button"
                onClick={() => setSelectedPoiId(poiId)}
                style={{
                  minHeight: 38,
                  padding: '0 14px',
                  border: active ? '1px solid #2f6fed' : '1px solid #cbd5df',
                  borderRadius: 6,
                  background: active ? '#2f6fed' : '#ffffff',
                  color: active ? '#ffffff' : '#2f3b46',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {poiId}
              </button>
            )
          })}
        </div>

        <p
          style={{
            margin: '0 0 16px',
            color: '#5d6b76',
            fontSize: 14,
          }}
        >
          当前 selectedPoiId：{selectedPoiId}
        </p>

        <Scenic3DPreview selectedPoiId={selectedPoiId} height={520} />
      </section>
    </main>
  )
}

export default Scenic3DPreviewPage
