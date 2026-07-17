export type DigitalHumanStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'offline'

const STATUS_LABELS: Record<DigitalHumanStatus, string> = {
  idle: '小灵正在待命',
  listening: '小灵正在倾听',
  thinking: '小灵正在整理导览信息',
  speaking: '小灵正在讲解',
  offline: '小灵形象准备中'
}

export function DigitalHumanStage({ status = 'idle' }: { status?: DigitalHumanStatus }) {
  return (
    <section className="guide-digital-human-stage" aria-label={STATUS_LABELS[status]}>
      <div className="guide-digital-human-stage__mist" aria-hidden="true" />
      <div className="guide-digital-human-stage__halo" aria-hidden="true" />
      <div className={`guide-digital-human-stage__figure is-${status}`} aria-hidden="true">
        <span className="guide-digital-human-stage__hair" />
        <span className="guide-digital-human-stage__face" />
        <span className="guide-digital-human-stage__robe" />
      </div>
      <p>{STATUS_LABELS[status]}</p>
    </section>
  )
}
