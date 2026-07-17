import { DownOutlined, ToolOutlined } from '@ant-design/icons'
import { Popover } from 'antd'
import { Link } from 'react-router-dom'
import {
  SERVICE_HEALTH_STATUS_LABELS,
  formatServiceHealthTime,
  getServiceHealthTone,
  summarizeServiceHealth,
  type ServiceHealthResponse,
} from '../../api/serviceHealth'

type Props = {
  health: ServiceHealthResponse | null
  error?: string
}

export default function AdminOpsHealthPopover({ health, error }: Props) {
  const tone = error ? 'error' : health ? getServiceHealthTone(health.overall) : 'checking'
  const label = error || summarizeServiceHealth(health)

  const content = (
    <div className="admin-ops-health-popover">
      <header>
        <div>
          <strong>服务运行状态</strong>
          <span>最后检测 {formatServiceHealthTime(health?.checkedAt ?? null)}</span>
        </div>
        <span className={`admin-ops-health-popover__overall is-${tone}`}>{label}</span>
      </header>

      {error ? (
        <p className="admin-ops-health-popover__error">健康聚合接口当前不可达，不会把未检测状态标记为正常。</p>
      ) : null}

      <div className="admin-ops-health-popover__list">
        {health?.components.map((component) => {
          const componentTone = getServiceHealthTone(component.status)
          return (
            <article key={component.key} className="admin-ops-health-popover__item">
              <span className={`admin-ops-health-popover__dot is-${componentTone}`} aria-hidden="true" />
              <div>
                <p><strong>{component.label}</strong><span>{SERVICE_HEALTH_STATUS_LABELS[component.status]}</span></p>
                <small>{component.message}{component.latencyMs > 0 ? ` · ${component.latencyMs} ms` : ''}</small>
              </div>
              {component.status !== 'NORMAL' ? (
                <Link to={component.recoveryPath} className="admin-ops-health-popover__recovery"><ToolOutlined /> 处理</Link>
              ) : null}
            </article>
          )
        }) ?? <p className="admin-ops-health-popover__empty">正在连接健康聚合服务…</p>}
      </div>
    </div>
  )

  return (
    <Popover content={content} trigger="click" placement="bottomRight" overlayClassName="admin-ops-health-popover-overlay">
      <button type="button" className={`admin-ops-health is-${tone}`} aria-label={`查看服务状态：${label}`}>
        <span className="admin-ops-health__dot" />
        <span>{label}</span>
        <DownOutlined className="admin-ops-health__arrow" />
      </button>
    </Popover>
  )
}
