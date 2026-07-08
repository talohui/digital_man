import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Scenic3DMapScene from '../components/scenic3d/Scenic3DMapScene'
import { lingshanPois, lingshanSceneRoutes } from '../data/lingshanMapData'
import { lingshanRoadNetwork } from '../data/lingshanRoadNetwork'
import { getLingshanRouteGeometryBySceneRouteId } from '../data/lingshanRouteGeometries'

const fallbackRoute = {
  id: 'fallback_3d_scene',
  guideRouteId: 'historical_culture',
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
  const initialSceneRoute = lingshanSceneRoutes[0] ?? fallbackRoute
  const [currentSceneRouteId, setCurrentSceneRouteId] = useState(initialSceneRoute.id)
  const [selectedPoiId, setSelectedPoiId] = useState(initialSceneRoute.poiSequence[0] ?? '')
  const currentRoute = useMemo(
    () => lingshanSceneRoutes.find((route) => route.id === currentSceneRouteId) ?? initialSceneRoute,
    [currentSceneRouteId, initialSceneRoute]
  )
  const currentRouteGeometry = useMemo(
    () => getLingshanRouteGeometryBySceneRouteId(currentRoute.id),
    [currentRoute.id]
  )
  const roadNetworkSegmentCount = lingshanRoadNetwork.segments.length
  const scenePois = useMemo(
    () =>
      lingshanPois
        .filter((poi) => poi.scenePosition)
        .map((poi) => ({
          poiId: poi.id,
          name: poi.name,
          intro: poi.intro,
        })),
    []
  )
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
  const selectedPoi = scenePois.find((poi) => poi.poiId === selectedPoiId) ?? routePois[0] ?? {
    poiId: selectedPoiId,
    name: '未选择景点',
    intro: '请选择一个 3D 导览节点查看详情。',
  }
  const handleSceneRouteChange = (sceneRouteId: string) => {
    const nextRoute = lingshanSceneRoutes.find((route) => route.id === sceneRouteId)

    if (!nextRoute) {
      return
    }

    setCurrentSceneRouteId(nextRoute.id)
    setSelectedPoiId(nextRoute.poiSequence[0] ?? '')
  }

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #f3eedf 0%, #dce8df 58%, #d4e0d7 100%)',
        color: '#23352f',
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
          routeGeometryPath={currentRouteGeometry?.path}
          layoutMode="projected"
        />
      </div>

      <section
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          width: 326,
          maxWidth: 'calc(100vw - 40px)',
          maxHeight: 'calc(100vh - 40px)',
          padding: 16,
          border: '1px solid rgba(255, 255, 255, 0.66)',
          borderRadius: 18,
          background: 'rgba(255, 252, 242, 0.86)',
          boxShadow: '0 24px 60px rgba(48, 58, 47, 0.16)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <p
          style={{
            margin: '0 0 6px',
            color: '#75816f',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0,
          }}
        >
          真实投影 3D 原型
        </p>
        <h1
          style={{
            margin: '0 0 16px',
            color: '#243a31',
            fontSize: 26,
            lineHeight: 1.22,
            fontFamily: "'Songti SC', 'STSong', 'Noto Serif SC', serif",
          }}
        >
          灵山胜境 3D 导览地图
        </h1>

        <div
          style={{
            marginBottom: 12,
            padding: 10,
            border: '1px solid rgba(129, 142, 113, 0.12)',
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.42)',
          }}
        >
          <p
            style={{
              margin: '0 0 8px',
              color: '#6d776e',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            选择 3D 导览路线
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {lingshanSceneRoutes.map((sceneRoute) => {
              const active = sceneRoute.id === currentRoute.id

              return (
                <button
                  key={sceneRoute.id}
                  type="button"
                  onClick={() => handleSceneRouteChange(sceneRoute.id)}
                  style={{
                    minHeight: 32,
                    padding: '0 10px',
                    border: active ? '1px solid rgba(169, 111, 30, 0.58)' : '1px solid rgba(68, 83, 73, 0.12)',
                    borderRadius: 999,
                    background: active ? 'rgba(255, 246, 219, 0.96)' : 'rgba(255, 255, 255, 0.52)',
                    color: active ? '#815516' : '#465b51',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {sceneRoute.name}
                </button>
              )
            })}
          </div>
        </div>

        <div
          style={{
            marginBottom: 14,
            padding: 12,
            border: '1px solid rgba(129, 142, 113, 0.14)',
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.56)',
          }}
        >
          <strong
            style={{
              display: 'block',
              marginBottom: 6,
              color: '#2f4a3f',
              fontSize: 16,
            }}
          >
            {currentRoute.name}
          </strong>
          <p
            style={{
              margin: 0,
              color: '#65756a',
              fontSize: 13,
              lineHeight: 1.55,
            }}
          >
            {currentRoute.description}
          </p>
          <p
            style={{
              margin: '8px 0 0',
              color: '#7a6a44',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            当前 3D 地图依据景点真实经纬度进行近似投影，已展示 {scenePois.length} 个核心游线节点，用于表达景区核心游线与空间关系。
          </p>
          <p
            style={{
              margin: '8px 0 0',
              color: '#7a6a44',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            路线几何：
            {currentRouteGeometry
              ? `腾讯 walking 候选路径，候选路径点数：${currentRouteGeometry.pointCount}，状态：${currentRouteGeometry.status}，需要人工核对。`
              : 'POI 节点骨架，当前路线暂无候选 routeGeometry。'}
          </p>
          {currentRouteGeometry ? (
            <p
              style={{
                margin: '6px 0 0',
                color: '#8a5b12',
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              routeGeometry 来自腾讯 walking runtime 导出，比 POI 中心连线更接近真实步行路径，但仍不是最终 verified 园区路线。
            </p>
          ) : null}
          <p
            style={{
              margin: '6px 0 0',
              color: '#607166',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            3D 道路底网已接入 candidate roadNetwork，来源于腾讯 walking route 批量采样的 {roadNetworkSegmentCount} 段候选 segment，用于增强道路视觉和后续导航吸附基础。
          </p>
          <p
            style={{
              margin: '6px 0 0',
              color: '#607166',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            candidate 不代表 verified，也不代表官方景区道路；当前路线仍以 routeGeometry / guideRoute 金线高亮展示。
          </p>
          <p
            style={{
              margin: '6px 0 0',
              color: '#607166',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            水面为艺术化太湖/水系意象，不代表精确湖岸线。
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            paddingRight: 4,
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
                  display: 'grid',
                  gridTemplateColumns: '28px minmax(0, 1fr)',
                  gap: 9,
                  alignItems: 'center',
                  padding: 11,
                  border: active ? '1px solid rgba(169, 111, 30, 0.58)' : '1px solid rgba(68, 83, 73, 0.12)',
                  borderRadius: 14,
                  background: active ? 'rgba(255, 246, 219, 0.96)' : 'rgba(255, 255, 255, 0.52)',
                  color: '#243a31',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: active ? '0 12px 26px rgba(153, 105, 35, 0.16)' : 'none',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    background: active ? '#b9822e' : 'rgba(72, 91, 80, 0.1)',
                    color: active ? '#fff8e8' : '#66766e',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {index + 1}
                </span>
                <span>
                  <strong style={{ display: 'block', marginBottom: 4, fontSize: 16 }}>
                    {poi.name}
                  </strong>
                  <span style={{ display: 'block', color: '#66766e', fontSize: 12 }}>
                    {poi.poiId}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <aside
        style={{
          position: 'absolute',
          right: 20,
          bottom: 20,
          width: 354,
          maxWidth: 'calc(100vw - 40px)',
          padding: 16,
          border: '1px solid rgba(255, 255, 255, 0.66)',
          borderRadius: 18,
          background: 'rgba(255, 252, 242, 0.87)',
          boxShadow: '0 24px 60px rgba(48, 58, 47, 0.16)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <h2
          style={{
            margin: '0 0 6px',
            color: '#253a31',
            fontSize: 22,
            lineHeight: 1.3,
            fontFamily: "'Songti SC', 'STSong', 'Noto Serif SC', serif",
          }}
        >
          {selectedPoi.name}
        </h2>
        <p style={{ margin: '0 0 10px', color: '#64756f', fontSize: 13 }}>
          poiId：{selectedPoi.poiId}
        </p>
        <p
          style={{
            display: 'inline-flex',
            margin: '0 0 12px',
            padding: '5px 9px',
            border: '1px solid rgba(184, 130, 46, 0.18)',
            borderRadius: 999,
            background: 'rgba(255, 246, 221, 0.78)',
            color: '#8a5b12',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          当前为低模 3D 占位
        </p>
        <p
          style={{
            margin: '0 0 14px',
            color: '#3c5047',
            fontSize: 14,
            lineHeight: 1.65,
          }}
        >
          {selectedPoi.intro}
        </p>
        <p
          style={{
            margin: '0 0 14px',
            color: '#6d5b37',
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          当前 3D 地图依据景点真实经纬度进行近似投影，用于表达景区核心游线与空间关系；真实导航仍以腾讯地图和 navLocation 为准。
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
                borderRadius: 10,
                background: '#1f7d70',
                color: '#fffaf0',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                boxShadow: '0 10px 22px rgba(31, 125, 112, 0.2)',
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
              border: '1px solid rgba(31, 125, 112, 0.24)',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.68)',
              color: '#1f7469',
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
              border: '1px solid rgba(79, 96, 104, 0.18)',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.54)',
              color: '#435a50',
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
