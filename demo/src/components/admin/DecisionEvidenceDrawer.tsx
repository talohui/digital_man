import { useEffect, useMemo, useState } from 'react'
import { Alert, Descriptions, Drawer, Empty, List, Space, Spin, Tag, Typography, message } from 'antd'
import { fetchDecisionSnapshot, type DecisionSnapshotDetail } from '../../api/decisionOps'
import { localizeGenerationSource, translateEvidenceField } from '../../lib/decisionEvidenceLabels'
import DecisionEvidenceValue from './DecisionEvidenceValue'

const { Paragraph, Text } = Typography

type Props = { open: boolean; onClose: () => void; snapshotId?: string; cardTitle?: string }

function safeEntries(value: Record<string, unknown>) {
  return Object.entries(value).filter(([key]) => !/(user|session|phone|mobile|openid|token|key|secret|password)/i.test(key))
}

export default function DecisionEvidenceDrawer({ open, onClose, snapshotId, cardTitle }: Props) {
  const [detail, setDetail] = useState<DecisionSnapshotDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const card = useMemo(() => detail?.cards.find((item) => item.title === cardTitle), [cardTitle, detail])

  useEffect(() => {
    if (!open || !snapshotId) return
    let active = true
    setLoading(true)
    fetchDecisionSnapshot(snapshotId)
      .then((value) => { if (active) setDetail(value) })
      .catch(() => { if (active) message.error('决策证据加载失败') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [open, snapshotId])

  return (
    <Drawer title="查看证据" width={640} open={open} onClose={onClose}>
      {!snapshotId ? <Alert showIcon type="warning" message="当前决策尚未生成可追溯快照，请点击“重新生成”。" /> : loading ? <Spin /> : detail ? (
        <Space direction="vertical" size={18} style={{ width: '100%' }}>
          <Alert showIcon type="info" message="仅展示聚合证据，不展示游客、会话或设备标识。" />
          <Descriptions bordered size="small" column={1} title="决策快照">
            <Descriptions.Item label="生成时间">{new Date(detail.generatedAt).toLocaleString('zh-CN')}</Descriptions.Item>
            <Descriptions.Item label="数据窗口">{new Date(detail.inputWindowStart).toLocaleString('zh-CN')} — {new Date(detail.inputWindowEnd).toLocaleString('zh-CN')}</Descriptions.Item>
            <Descriptions.Item label="生成来源">{localizeGenerationSource(detail.generationSource)}</Descriptions.Item>
          </Descriptions>
          {card ? (
            <div>
              <Text strong>{card.title}</Text>
              <Paragraph type="secondary" style={{ marginTop: 8 }}>{card.reason}</Paragraph>
              <List size="small" header={<Text strong>卡片证据</Text>} dataSource={card.evidence} renderItem={(item) => <List.Item>· {item}</List.Item>} />
            </div>
          ) : cardTitle ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="该版本中未找到当前卡片" /> : null}
          <div><Text strong>数据来源</Text><div style={{ marginTop: 10 }}>{detail.dataSources.map((source) => <Tag key={source} style={{ marginBottom: 8 }}>{source}</Tag>)}</div></div>
          <Descriptions bordered size="small" column={1} title="脱敏聚合输入">
            {safeEntries(detail.inputSummary).map(([key, value]) => <Descriptions.Item key={key} label={translateEvidenceField(key)}><DecisionEvidenceValue fieldKey={key} value={value} /></Descriptions.Item>)}
          </Descriptions>
        </Space>
      ) : <Empty description="暂无证据详情" />}
    </Drawer>
  )
}
