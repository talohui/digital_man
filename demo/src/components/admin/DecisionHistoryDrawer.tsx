import { useEffect, useState } from 'react'
import { Alert, Button, Checkbox, Drawer, Empty, List, Space, Spin, Tag, Typography, message } from 'antd'
import { compareDecisionSnapshots, fetchDecisionHistory, type DecisionComparison, type DecisionSnapshotSummary } from '../../api/decisionOps'

const { Text } = Typography

type Props = { open: boolean; onClose: () => void; onInspect: (snapshotId: string) => void }

function sourceLabel(value: string) {
  if (value === 'llm') return <Tag color="green">大模型生成</Tag>
  if (value === 'rules') return <Tag color="orange">规则兜底</Tag>
  return <Tag>演示样例</Tag>
}

export default function DecisionHistoryDrawer({ open, onClose, onInspect }: Props) {
  const [items, setItems] = useState<DecisionSnapshotSummary[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [comparison, setComparison] = useState<DecisionComparison | null>(null)
  const [loading, setLoading] = useState(false)
  const [comparing, setComparing] = useState(false)

  useEffect(() => {
    if (!open) return
    let active = true
    setLoading(true)
    fetchDecisionHistory(0, 20)
      .then((page) => { if (active) setItems(page.items) })
      .catch(() => { if (active) message.error('历史版本加载失败') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [open])

  const toggle = (id: string, checked: boolean) => {
    setComparison(null)
    setSelected((current) => checked ? [...current.filter((value) => value !== id), id].slice(-2) : current.filter((value) => value !== id))
  }

  const compare = async () => {
    if (selected.length !== 2) return
    setComparing(true)
    try {
      setComparison(await compareDecisionSnapshots(selected[0], selected[1]))
    } catch {
      message.error('版本对比失败')
    } finally {
      setComparing(false)
    }
  }

  return (
    <Drawer title="历史版本" width={620} open={open} onClose={onClose} extra={<Button type="primary" disabled={selected.length !== 2} loading={comparing} onClick={() => void compare()}>对比已选版本</Button>}>
      <Alert showIcon type="info" message="选择两个版本可对比决策卡的新增、移除和优先级变化。" style={{ marginBottom: 16 }} />
      {loading ? <Spin /> : items.length ? (
        <List dataSource={items} renderItem={(item) => (
          <List.Item actions={[<Button key="inspect" type="link" onClick={() => onInspect(item.id)}>查看证据</Button>]}>
            <List.Item.Meta
              avatar={<Checkbox checked={selected.includes(item.id)} onChange={(event) => toggle(item.id, event.target.checked)} />}
              title={<Space wrap>{sourceLabel(item.generationSource)}<Text>{new Date(item.generatedAt).toLocaleString('zh-CN')}</Text></Space>}
              description={<Text type="secondary" ellipsis={{ tooltip: item.summary }}>{item.summary}</Text>}
            />
          </List.Item>
        )} />
      ) : <Empty description="暂无历史决策" />}

      {comparison ? (
        <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
          <Text strong>对比结果</Text>
          <Space wrap><Tag color="green">新增 {comparison.added.length}</Tag><Tag color="red">移除 {comparison.removed.length}</Tag><Tag color="gold">优先级变化 {comparison.priorityChanged.length}</Tag></Space>
          {comparison.added.map((card) => <Alert key={`add-${card.title}`} type="success" message={`新增：${card.title}`} />)}
          {comparison.removed.map((card) => <Alert key={`remove-${card.title}`} type="error" message={`移除：${card.title}`} />)}
          {comparison.priorityChanged.map((item) => <Alert key={item.stableKey} type="warning" message={`${item.title}：${item.oldPriority} → ${item.newPriority}`} />)}
          {!comparison.added.length && !comparison.removed.length && !comparison.priorityChanged.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="两个版本的卡片无变化" /> : null}
        </div>
      ) : null}
    </Drawer>
  )
}
