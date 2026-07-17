import { useCallback, useEffect, useState } from 'react'
import { AlertOutlined, CheckCircleOutlined, FileSearchOutlined, FireOutlined, HistoryOutlined, MailOutlined, ReloadOutlined, RiseOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Space, Spin, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import DecisionActionPanel from '../components/admin/DecisionActionPanel'
import DecisionEvidenceDrawer from '../components/admin/DecisionEvidenceDrawer'
import DecisionHistoryDrawer from '../components/admin/DecisionHistoryDrawer'
import { fetchDecisionActions, type DecisionAction } from '../api/decisionOps'
import { getAnalyticsApiBase } from '../lib/runtimeConfig'
import { useAdminOpsPageActions } from '../components/admin-ops/AdminOpsPageActions'
import { decisionActionKey, indexDecisionActions } from '../lib/decisionActionState'

const { Title, Text, Paragraph } = Typography
const BASE_URL = getAnalyticsApiBase()

type DecisionCard = {
  cardId?: string | null
  title: string
  type: string
  priority: '高' | '中' | '低' | string
  evidence: string[]
  reason: string
  actions: string[]
  relatedTopics: string[]
  relatedSpots: string[]
  demoFallback: boolean
}

type DecisionResponse = {
  snapshotId?: string
  summary: string
  cards: DecisionCard[]
  actionTodos: string[]
  dataSources: string[]
  demoFallback: boolean
  generationSource?: 'llm' | 'rules' | 'demo' | string
  generatedAt?: string
  cacheHit?: boolean
  fallbackReason?: string
}

const actionStatusLabels: Record<string, string> = {
  PROPOSED: '待确认',
  ACCEPTED: '已接受',
  IN_PROGRESS: '执行中',
  COMPLETED: '已完成',
  DISMISSED: '已驳回',
}

const actionStatusColors: Record<string, string> = {
  PROPOSED: 'gold',
  ACCEPTED: 'blue',
  IN_PROGRESS: 'cyan',
  COMPLETED: 'green',
  DISMISSED: 'red',
}

const palette = {
  bg: '#f5f1e8',
  panel: 'rgba(232, 240, 226, 0.82)',
  panelRaised: 'rgba(218, 231, 212, 0.76)',
  border: '#ddd4c4',
  text: '#263730',
  muted: '#728078',
  gold: '#a87c34',
  cyan: '#2f766c',
  green: '#3f7d5b',
  red: '#a34a3f',
}

const typeColor: Record<string, string> = {
  '游客兴趣洞察': 'cyan',
  '营销机会': 'gold',
  '服务优化': 'orange',
  '客流分流': 'volcano',
  '知识库补全': 'geekblue',
  '技术优化': 'purple',
  '应急处置': 'red',
}

const priorityColor: Record<string, string> = { 高: palette.red, 中: '#ffb426', 低: '#55ca55' }

async function readDecision(path: string): Promise<{ response: Response; data: DecisionResponse }> {
  const response = await fetch(`${BASE_URL}${path}`)
  if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status })
  return { response, data: await response.json() as DecisionResponse }
}

async function fetchDecision(forceRefresh = false): Promise<DecisionResponse> {
  const suffix = forceRefresh ? '?forceRefresh=true' : ''
  try {
    return (await readDecision(`/dashboard/marketing-decision${suffix}`)).data
  } catch (error) {
    if (!(error instanceof Error) || (error as Error & { status?: number }).status !== 404) throw error
    return (await readDecision(`/decision/cards${suffix}`)).data
  }
}

function sourceMeta(decision: DecisionResponse | null) {
  if (!decision) return null
  if (decision.demoFallback || decision.generationSource === 'demo') return { label: '演示样例', color: 'warning' }
  if (decision.generationSource === 'rules') return { label: '规则兜底', color: 'orange' }
  return { label: '大模型生成', color: 'green' }
}

function formatGeneratedAt(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function PriorityBadge({ value }: { value: string }) {
  return (
    <span style={{ display: 'grid', width: 28, height: 28, placeItems: 'center', borderRadius: 7, color: '#fff', background: priorityColor[value] ?? '#60708b', fontSize: 13, fontWeight: 800 }}>
      {value}
    </span>
  )
}

function AdminMarketingDecisionPage() {
  const [decision, setDecision] = useState<DecisionResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [evidence, setEvidence] = useState<{ open: boolean; snapshotId?: string; cardTitle?: string }>({ open: false })
  const [actionPanel, setActionPanel] = useState<{ open: boolean; cardId?: string | null; cardTitle: string; actionText: string }>({ open: false, cardTitle: '', actionText: '' })
  const [decisionActions, setDecisionActions] = useState<Record<string, DecisionAction>>({})

  const load = useCallback(async (forceRefresh = false, isActive: () => boolean = () => true) => {
    if (isActive()) setLoading(true)
    try {
      const next = await fetchDecision(forceRefresh)
      const actions = next.snapshotId
        ? await fetchDecisionActions(next.snapshotId).catch(() => [])
        : []
      if (isActive()) {
        setDecision(next)
        setDecisionActions(indexDecisionActions(actions))
        setError('')
      }
    } catch {
      if (isActive()) setError('暂时无法读取营销决策数据，请确认 analytics-server 已启动。')
    } finally {
      if (isActive()) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const isActive = () => active
    void load(false, isActive)
    const timer = window.setInterval(() => void load(false, isActive), 60000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [load])

  const source = sourceMeta(decision)
  const generatedTime = formatGeneratedAt(decision?.generatedAt)
  const onActionUpdated = (action: DecisionAction) => {
    setDecisionActions((current) => ({
      ...current,
      [decisionActionKey(action.cardId, action.actionText)]: action,
      [decisionActionKey(undefined, action.actionText)]: action,
    }))
  }

  useAdminOpsPageActions({
    refreshedAt: generatedTime,
    refreshing: loading,
    onRefresh: load,
  })

  return (
      <main className="admin-page admin-ops-decision" style={{ overflowX: 'hidden' }}>
        <header className="admin-ops-page-intro" style={{ flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <Text className="admin-ops-page-intro__eyebrow">智能决策与执行闭环</Text>
            <Title level={2}>AI 营销决策分析</Title>
            <Text className="admin-ops-page-intro__description">将门票、消费、画像、热力、问答、情绪与响应质量汇聚为可追溯、可执行的运营动作。</Text>
          </div>
          <Space wrap>
            <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void load(true)}>重新生成</Button>
            <Button icon={<HistoryOutlined />} onClick={() => setHistoryOpen(true)}>历史版本</Button>
            <Link to="/admin/reports"><Button icon={<MailOutlined />}>运营报告</Button></Link>
            <Link to="/admin/heatmap"><Button icon={<FireOutlined />} type="primary">查看客流热力图</Button></Link>
          </Space>
        </header>

        <Card className="admin-ops-highlight-card" bordered={false} style={{ marginBottom: 16 }}>
          <Space align="start" size={12} wrap style={{ width: '100%' }}>
            <RiseOutlined style={{ marginTop: 2, color: palette.gold, fontSize: 23 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <Space size={8} wrap>
                <Text style={{ color: palette.gold, fontWeight: 800 }}>今日 AI 运营摘要</Text>
                {source ? <Tag color={source.color}>{source.label}</Tag> : null}
                {generatedTime ? <Text style={{ color: palette.muted, fontSize: 12 }}>生成于 {generatedTime}{decision?.cacheHit ? ' · 缓存' : ''}</Text> : null}
              </Space>
              <Paragraph style={{ maxWidth: 940, margin: '7px 0 0', color: palette.muted, lineHeight: 1.7 }}>
                {decision?.summary ?? (error || '正在读取游客行为数据，生成今日营销决策建议…')}
              </Paragraph>
              {decision?.fallbackReason ? <Text style={{ color: palette.gold, fontSize: 12 }}>{decision.fallbackReason}</Text> : null}
            </div>
          </Space>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16} style={{ minWidth: 0 }}>
            {decision ? (
              <Row gutter={[14, 14]}>
                {decision.cards.map((card) => (
                  <Col xs={24} lg={12} key={`${card.type}-${card.title}`}>
                    <Card bordered={false} style={{ height: '100%', border: `1px solid ${palette.border}`, background: palette.panel }} bodyStyle={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ minWidth: 0 }}>
                          <Space size={6} wrap>
                            <Tag color={typeColor[card.type] ?? 'default'}>{card.type}</Tag>
                            {card.demoFallback ? <Tag>演示样例</Tag> : null}
                          </Space>
                          <Title level={4} style={{ margin: '9px 0 0', color: palette.text, fontSize: 18 }}>{card.title}</Title>
                        </div>
                        <PriorityBadge value={card.priority} />
                      </div>
                      <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <Text style={{ color: palette.muted, fontSize: 12 }}>证据</Text>
                          <Button size="small" type="text" icon={<FileSearchOutlined />} onClick={() => setEvidence({ open: true, snapshotId: decision.snapshotId, cardTitle: card.title })}>查看证据</Button>
                        </div>
                        <div style={{ display: 'grid', gap: 5, marginTop: 7 }}>
                          {card.evidence.slice(0, 3).map((item) => <Text key={item} style={{ color: palette.muted, fontSize: 12 }}>· {item}</Text>)}
                        </div>
                      </div>
                      <Paragraph style={{ minHeight: 44, margin: '14px 0', color: palette.text, lineHeight: 1.65 }}>{card.reason}</Paragraph>
                      <div>
                        <Text style={{ color: palette.gold, fontSize: 12, fontWeight: 700 }}>建议动作</Text>
                        <div style={{ display: 'grid', gap: 7, marginTop: 8 }}>
                          {card.actions.slice(0, 3).map((action) => (
                            <div key={action} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                              <Text style={{ color: palette.text }}><CheckCircleOutlined style={{ marginRight: 7, color: palette.green }} />{action}</Text>
                              {(() => {
                                const existingAction = decisionActions[decisionActionKey(card.cardId, action)]
                                const status = existingAction?.status
                                return existingAction ? (
                                  <Button size="small" type="text" title="查看待办状态与效果评估" onClick={() => setActionPanel({ open: true, cardId: card.cardId, cardTitle: card.title, actionText: action })}>
                                    <Tag color={actionStatusColors[status] ?? 'default'}>{actionStatusLabels[status] ?? status}</Tag>
                                  </Button>
                                ) : (
                                  <Button size="small" type="link" title="转为待办后可进行效果评估" onClick={() => setActionPanel({ open: true, cardId: card.cardId, cardTitle: card.title, actionText: action })}>转为待办</Button>
                                )
                              })()}
                            </div>
                          ))}
                        </div>
                      </div>
                      {card.relatedTopics.length || card.relatedSpots.length ? (
                        <Space size={[6, 6]} wrap style={{ marginTop: 16 }}>
                          {card.relatedTopics.slice(0, 2).map((topic) => <Tag key={topic}>{topic}</Tag>)}
                          {card.relatedSpots.slice(0, 3).map((spot) => <Tag key={spot} color="blue">{spot}</Tag>)}
                        </Space>
                      ) : null}
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : loading ? (
              <Card bordered={false} style={{ border: `1px solid ${palette.border}`, background: palette.panel }}><Spin /> <Text style={{ marginLeft: 10, color: palette.muted }}>正在加载智能决策…</Text></Card>
            ) : (
              <Card bordered={false} style={{ border: `1px solid ${palette.border}`, background: palette.panel }}>
                <AlertOutlined style={{ marginRight: 8, color: palette.red }} />
                <Text style={{ color: palette.muted }}>{error || '暂无可用的营销决策数据。'}</Text>
              </Card>
            )}
          </Col>

          <Col xs={24} xl={8}>
            <Card title="Next Best Action 待办" bordered={false} style={{ marginBottom: 14, border: `1px solid ${palette.border}`, background: palette.panel }}>
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                {(decision?.actionTodos ?? []).slice(0, 6).map((todo, index) => (
                  <div key={`${todo}-${index}`} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 9, padding: '9px 10px', borderRadius: 7, background: palette.panelRaised }}>
                    <PriorityBadge value={index < 2 ? '高' : index < 4 ? '中' : '低'} />
                    <Text style={{ color: palette.text, lineHeight: 1.55 }}>{todo}</Text>
                  </div>
                ))}
                {decision && !decision.actionTodos.length ? <Text style={{ color: palette.muted }}>暂无待办，等待游客数据积累。</Text> : null}
              </Space>
            </Card>
            <Card title="证据来源" bordered={false} style={{ border: `1px solid ${palette.border}`, background: palette.panel }}>
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                {(decision?.dataSources ?? ['热门问题 TopN', '情感趋势', '响应延迟', '客流热力图']).map((source) => <Text key={source} style={{ color: palette.muted }}><AlertOutlined style={{ marginRight: 8, color: palette.gold }} />{source}</Text>)}
                <Link to="/admin/heatmap"><Button block icon={<FireOutlined />} style={{ marginTop: 4 }}>查看客流热力图</Button></Link>
              </Space>
            </Card>
          </Col>
        </Row>
        <DecisionHistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          onInspect={(snapshotId) => {
            setHistoryOpen(false)
            setEvidence({ open: true, snapshotId })
          }}
        />
        <DecisionEvidenceDrawer open={evidence.open} snapshotId={evidence.snapshotId} cardTitle={evidence.cardTitle} onClose={() => setEvidence({ open: false })} />
        <DecisionActionPanel
          open={actionPanel.open}
          snapshotId={decision?.snapshotId}
          cardId={actionPanel.cardId}
          cardTitle={actionPanel.cardTitle}
          actionText={actionPanel.actionText}
          initialAction={decisionActions[decisionActionKey(actionPanel.cardId, actionPanel.actionText)]}
          onActionUpdated={onActionUpdated}
          onClose={() => setActionPanel((current) => ({ ...current, open: false }))}
        />
      </main>
  )
}

export default AdminMarketingDecisionPage
