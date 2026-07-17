import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons'
import { Alert, Steps, Tag, Typography } from 'antd'

const { Text } = Typography

const stageLabels: Record<string, string> = {
  VALIDATE: '校验草案',
  VERIFY_ADMIN: '验证管理员',
  WRITE_TARGET: '写入目标服务',
  SYNC_DEPENDENCIES: '同步联动服务',
}

const resultLabels: Record<string, string> = {
  eventId: '应急事件 ID',
  faqId: '知识条目 ID',
  kbSyncStatus: '知识同步状态',
  syncStatus: '联动同步状态',
  operationId: '操作追踪 ID',
  failedStage: '未完成步骤',
  status: '执行状态',
  outcomeStatus: '下游结果',
  reconciliationStatus: '核验进度',
  kind: '操作类型',
}

function localizedStatus(value: string): string {
  return ({
    COMPLETED: '已完成', completed: '已完成', CONFIRMED: '已完成',
    PARTIAL: '部分完成', partial: '部分完成', PENDING: '同步中', pending: '同步中',
    RECONCILING: '正在核验', UNKNOWN: '结果待核验',
    SYNCED: '已同步', SKIPPED: '已跳过',
    FAILED: '失败', failed: '失败', active: '已生效', updated: '已更新', inactive: '已停用',
    emergency: '应急发布', knowledge: '知识库维护',
  } as Record<string, string>)[value] ?? value
}

export default function OperationsCopilotExecutionResult({ result }: { result: Record<string, unknown> }) {
  const status = typeof result.status === 'string' ? result.status : 'COMPLETED'
  const failed = /failed/i.test(status)
  const partial = /partial|pending/i.test(status)
  const outcomeStatus = typeof result.outcomeStatus === 'string' ? result.outcomeStatus : ''
  const reconciliationStatus = typeof result.reconciliationStatus === 'string' ? result.reconciliationStatus : ''
  const uncertain = /reconciling|unknown/i.test(`${status} ${outcomeStatus} ${reconciliationStatus}`)
  const stages = Array.isArray(result.stages) ? result.stages.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object')) : []
  const target = result.target && typeof result.target === 'object' ? result.target as Record<string, unknown> : {}
  const details = [
    ...Object.entries(result).filter(([key, value]) => key !== 'stages' && key !== 'target' && ['string', 'number', 'boolean'].includes(typeof value)),
    ...Object.entries(target).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value)),
  ]

  return (
    <div className="operations-copilot-execution">
      <Alert
        showIcon
        type={failed ? 'error' : partial || uncertain ? 'warning' : 'success'}
        message={
          failed
            ? '执行失败，未完成全部写入'
            : uncertain
              ? '下游结果正在核验，请勿重复发布'
              : partial
                ? '主操作已完成，部分联动仍在同步'
                : '操作已完成并记录结果'
        }
      />
      {stages.length ? (
        <Steps
          size="small"
          direction="vertical"
          items={stages.map((stage) => {
            const stageStatus = String(stage.status ?? '')
            const stageKey = String(stage.stage ?? stage.key ?? stage.name ?? '')
            const stageFailed = /failed/i.test(stageStatus)
            const stagePending = /pending|running|partial|skipped|reconciling|unknown/i.test(stageStatus)
            return {
              title: (stageLabels[stageKey] ?? stageKey) || '执行步骤',
              description: typeof stage.message === 'string' ? stage.message : undefined,
              status: stageFailed ? 'error' : stagePending ? 'process' : 'finish',
              icon: stageFailed ? <CloseCircleOutlined /> : stagePending ? <LoadingOutlined /> : <CheckCircleOutlined />,
            }
          })}
        />
      ) : null}
      {details.length ? (
        <div className="operations-copilot-execution__details">
          {details.map(([key, value]) => (
            <span key={key}><Text type="secondary">{resultLabels[key] ?? key}</Text><Tag>{localizedStatus(String(value))}</Tag></span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
