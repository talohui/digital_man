import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, DatePicker, Descriptions, Drawer, Form, Input, Space, Tag, Typography, message } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { createDecisionAction, evaluateDecisionAction, fetchDecisionSnapshot, updateDecisionAction, type DecisionAction } from '../../api/decisionOps'
import { translateEvidenceField } from '../../lib/decisionEvidenceLabels'
import { transitionActionLabel } from '../../lib/decisionActionState'
import DecisionEvidenceValue from './DecisionEvidenceValue'

const { RangePicker } = DatePicker
const { Paragraph, Text } = Typography

type Props = { open: boolean; onClose: () => void; onActionUpdated?: (action: DecisionAction) => void; snapshotId?: string; cardId?: string | null; initialAction?: DecisionAction | null; cardTitle: string; actionText: string }
type Status = 'PROPOSED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED'

const labels: Record<Status, string> = { PROPOSED: '待确认', ACCEPTED: '已接受', IN_PROGRESS: '执行中', COMPLETED: '已完成', DISMISSED: '已驳回' }
const nextStates: Record<Status, Status[]> = { PROPOSED: ['ACCEPTED', 'DISMISSED'], ACCEPTED: ['IN_PROGRESS', 'DISMISSED'], IN_PROGRESS: ['COMPLETED', 'DISMISSED'], COMPLETED: [], DISMISSED: [] }

export default function DecisionActionPanel({ open, onClose, onActionUpdated, snapshotId, cardId: suppliedCardId, initialAction, cardTitle, actionText }: Props) {
  const [resolvedCardId, setResolvedCardId] = useState<string>()
  const [action, setAction] = useState<DecisionAction | null>(null)
  const [owner, setOwner] = useState('')
  const [note, setNote] = useState('')
  const [dueAt, setDueAt] = useState<Dayjs | null>(null)
  const [baseline, setBaseline] = useState<[Dayjs, Dayjs] | null>(null)
  const [result, setResult] = useState<[Dayjs, Dayjs] | null>(null)
  const [busy, setBusy] = useState(false)
  const allowed = useMemo(() => action ? nextStates[action.status as Status] ?? [] : [], [action])

  useEffect(() => {
    if (!open) return
    setAction(initialAction ?? null)
    setOwner(initialAction?.owner ?? '')
    setNote(initialAction?.note ?? '')
    setDueAt(initialAction?.dueAt ? dayjs(initialAction.dueAt) : null)
    setResolvedCardId(suppliedCardId ?? initialAction?.cardId ?? undefined)
    if (suppliedCardId || initialAction?.cardId || !snapshotId) return
    fetchDecisionSnapshot(snapshotId)
      .then((snapshot) => setResolvedCardId(snapshot.cards.find((card) => card.title === cardTitle)?.cardId ?? undefined))
      .catch(() => message.error('无法确认决策卡，请稍后重试'))
  }, [cardTitle, initialAction, open, snapshotId, suppliedCardId])

  const create = async () => {
    if (!resolvedCardId) return message.warning('当前卡片缺少可追溯标识，请重新生成决策')
    setBusy(true)
    try {
      const nextAction = await createDecisionAction(resolvedCardId, actionText)
      setAction(nextAction)
      onActionUpdated?.(nextAction)
      message.success('已转为执行待办')
    }
    catch (error) { message.error(error instanceof Error ? error.message : '转待办失败') }
    finally { setBusy(false) }
  }

  const transition = async (status: Status) => {
    if (!action) return
    setBusy(true)
    try {
      const nextAction = await updateDecisionAction(action.id, { status, owner, note, dueAt: dueAt?.toISOString() })
      setAction(nextAction)
      onActionUpdated?.(nextAction)
      message.success('待办状态已更新')
    }
    catch (error) { message.error(error instanceof Error ? error.message : '状态更新失败') }
    finally { setBusy(false) }
  }

  const evaluate = async () => {
    if (!action || !baseline || !result) return message.warning('请选择基线期与效果期')
    setBusy(true)
    try {
      const nextAction = await evaluateDecisionAction(action.id, { baselineStart: baseline[0].toISOString(), baselineEnd: baseline[1].toISOString(), resultStart: result[0].toISOString(), resultEnd: result[1].toISOString() })
      setAction(nextAction)
      onActionUpdated?.(nextAction)
      message.success('效果指标已重新计算')
    } catch (error) { message.error(error instanceof Error ? error.message : '效果评估失败') }
    finally { setBusy(false) }
  }

  const metrics = (value?: Record<string, unknown>) => Object.entries(value ?? {}).map(([key, metric]) => {
    return <Descriptions.Item key={key} label={translateEvidenceField(key)}><DecisionEvidenceValue fieldKey={key} value={metric} /></Descriptions.Item>
  })

  return (
    <Drawer title={action ? '执行待办与效果评估' : '转为执行待办'} width={640} open={open} onClose={onClose}>
      <Space direction="vertical" size={18} style={{ width: '100%' }}>
        <div><Text type="secondary">{cardTitle}</Text><Paragraph strong style={{ margin: '6px 0 0' }}>{actionText}</Paragraph></div>
        {!snapshotId ? <Alert showIcon type="warning" message="请先重新生成决策，建立可追溯快照后再转待办。" /> : null}
        {!action ? <Button type="primary" loading={busy} disabled={!snapshotId} onClick={() => void create()}>创建执行待办</Button> : (
          <>
            <Space wrap><Tag color="blue">{labels[action.status as Status] ?? action.status}</Tag><Text type="secondary">待办 ID：{action.id}</Text></Space>
            <Form layout="vertical">
              <Form.Item label="负责人"><Input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="例：景区运营组" /></Form.Item>
              <Form.Item label="截止时间"><DatePicker showTime value={dueAt} onChange={setDueAt} style={{ width: '100%' }} placeholder="选择执行截止时间" /></Form.Item>
              <Form.Item label="执行备注"><Input.TextArea value={note} onChange={(event) => setNote(event.target.value)} rows={3} /></Form.Item>
            </Form>
            <Alert showIcon type="info" message="接受后会保留负责人、截止时间和备注；驳回会结束该建议，不进入执行评估。" />
            <Space wrap>{allowed.map((status) => <Button key={status} danger={status === 'DISMISSED'} type={status === 'ACCEPTED' || status === 'IN_PROGRESS' || status === 'COMPLETED' ? 'primary' : 'default'} loading={busy} onClick={() => void transition(status)}>{transitionActionLabel(status)}</Button>)}</Space>
            <div style={{ paddingTop: 8, borderTop: '1px solid rgba(128,128,128,.25)' }}>
              <Text strong>效果评估</Text>
              <Paragraph type="secondary" style={{ marginTop: 6 }}>对比执行前后的问答、路线、到访、票务、消费、评分与延迟聚合指标。结果仅表示相关变化，不代表因果。</Paragraph>
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <RangePicker showTime value={baseline} onChange={(value) => setBaseline(value as [Dayjs, Dayjs] | null)} placeholder={['基线开始', '基线结束']} style={{ width: '100%' }} />
                <RangePicker showTime value={result} onChange={(value) => setResult(value as [Dayjs, Dayjs] | null)} placeholder={['效果开始', '效果结束']} style={{ width: '100%' }} />
                <Button loading={busy} onClick={() => void evaluate()}>计算效果指标</Button>
              </Space>
            </div>
            {Object.keys(action.baselineMetrics ?? {}).length ? <Descriptions bordered size="small" column={2} title="基线期">{metrics(action.baselineMetrics)}</Descriptions> : null}
            {Object.keys(action.resultMetrics ?? {}).length ? <Descriptions bordered size="small" column={2} title="效果期">{metrics(action.resultMetrics)}</Descriptions> : null}
          </>
        )}
      </Space>
    </Drawer>
  )
}
