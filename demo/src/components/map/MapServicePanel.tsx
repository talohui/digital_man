import MarketCategoryTabs from '../mobile/consume/MarketCategoryTabs'
import CAppBottomSheet from '../mobile/overlays/CAppBottomSheet'
import '../../styles/map/mapServicePanel.css'

const MAP_SERVICE_CATEGORIES = [
  {
    id: 'restroom',
    label: '洗手间',
    icon: '/icons/svc-accessible.png',
    title: '洗手间服务建设中',
    description: '准确点位仍在整理，暂不提供距离和步行方向。',
    meta: '点位数据建设中',
    actionLabel: '点位建设中',
    actionDisabled: true
  },
  {
    id: 'rest',
    label: '休息区',
    icon: '/icons/svc-center.png',
    title: '休息区服务建设中',
    description: '准确点位仍在整理，暂不提供顺路停留建议。',
    meta: '点位数据建设中',
    actionLabel: '点位建设中',
    actionDisabled: true
  },
  {
    id: 'dining',
    label: '餐饮点',
    icon: '/icons/cat-food.png',
    title: '餐饮服务建设中',
    description: '准确点位与营业状态仍在整理，暂不提供附近推荐。',
    meta: '点位数据建设中',
    actionLabel: '点位建设中',
    actionDisabled: true
  },
  {
    id: 'exit',
    label: '出口',
    icon: '/icons/cat-transport.png',
    title: '最近出口',
    description: '出口坐标已经具备，正在接入定位与路线导航。',
    meta: '出口坐标已具备 · 导航接入中',
    actionLabel: '导航到出口',
    actionDisabled: false
  }
] as const

type MapServiceCategoryId = (typeof MAP_SERVICE_CATEGORIES)[number]['id']

type MapServicePanelProps = {
  open: boolean
  category: MapServiceCategoryId
  onCategoryChange: (category: MapServiceCategoryId) => void
  onClose: () => void
  onViewOnMap?: (category: MapServiceCategoryId) => void
}

function MapServicePanel({
  open,
  category,
  onCategoryChange,
  onClose,
  onViewOnMap
}: MapServicePanelProps) {
  if (!open) return null

  const content = MAP_SERVICE_CATEGORIES.find((item) => item.id === category) ?? MAP_SERVICE_CATEGORIES[0]

  return (
    <CAppBottomSheet
      title="游园服务"
      eyebrow="灵山行旅 · 便民指引"
      onClose={onClose}
      className="map-service-panel"
      closeLabel="收起"
      dialogId="map-service-panel"
    >
      <p className="map-service-panel__intro">选择一项服务，地图将结合你的位置和当前路线给出附近建议。</p>
      <MarketCategoryTabs
        items={MAP_SERVICE_CATEGORIES.map(({ id, label, icon }) => ({ id, label, icon }))}
        value={category}
        onChange={(id) => onCategoryChange(id as MapServiceCategoryId)}
        ariaLabel="游园服务分类"
        className="map-service-panel__tabs"
      />
      <section className="map-service-panel__result" aria-live="polite">
        <span>当前服务</span>
        <h3>{content.title}</h3>
        <p>{content.description}</p>
        <small>{content.meta}</small>
        <button
          type="button"
          disabled={content.actionDisabled}
          onClick={() => onViewOnMap?.(content.id)}
        >
          {content.actionLabel}
        </button>
      </section>
    </CAppBottomSheet>
  )
}

export { MAP_SERVICE_CATEGORIES, MapServicePanel }
export type { MapServiceCategoryId, MapServicePanelProps }
