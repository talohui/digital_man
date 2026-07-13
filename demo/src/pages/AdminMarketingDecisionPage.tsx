import { useEffect, useState } from 'react'
import { AlertOutlined, ArrowLeftOutlined, CheckCircleOutlined, FireOutlined, RiseOutlined } from '@ant-design/icons'
import { Button, Card, Col, ConfigProvider, Row, Space, Spin, Tag, Typography, theme } from 'antd'
import { Link } from 'react-router-dom'
import { getAnalyticsApiBase } from '../lib/runtimeConfig'

const { Title, Text, Paragraph } = Typography
const BASE_URL = getAnalyticsApiBase()

type DecisionCard = {
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
  summary: string
  cards: DecisionCard[]
  actionTodos: string[]
  dataSources: string[]
  demoFallback: boolean
}

const palette = {
  bg: '#08111f',
  panel: '#111c30',
  panelRaised: '#16243a',
  border: '#2b3d59',
  text: '#e7edf8',
  muted: '#9babc3',
  gold: '#d5a73a',
  cyan: '#4fc3e7',
  green: '#61d878',
  red: '#ff5c6c',
}

const typeColor: Record<string, string> = {
  '游客兴趣洞察': 'cyan',
  '营销机会': 'gold',
  '服务优化': 'orange',
  '客流分流': 'volcano',
  '知识库补全': 'geekblue',
  '技术优化': 'purple',
}

const priorityColor: Record<string, string> = { 高: palette.red, 中: '#ffb426', 低: '#55ca55' }

async function readDecision(path: string): Promise<{ response: Response; data: DecisionResponse }> {
  const response = await fetch(`${BASE_URL}${path}`)
  if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status })
  return { response, data: await response.json() as DecisionResponse }
}

async function fetchDecision(): Promise<DecisionResponse> {
  try {
    return (await readDecision('/dashboard/marketing-decision')).data
  } catch (error) {
    if (!(error instanceof Error) || (error as Error & { status?: number }).status !== 404) throw error
    return (await readDecision('/decision/cards')).data
  }
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

  useEffect(() => {
    let stopped = false
    const load = async () => {
      try {
        const next = await fetchDecision()
        if (!stopped) {
          setDecision(next)
          setError('')
        }
      } catch {
        if (!stopped) setError('暂时无法读取营销决策数据，请确认 analytics-server 已启动。')
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 60000)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [])

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <main style={{ minHeight: '100vh', padding: 22, color: palette.text, background: `radial-gradient(circle at top left, #183457 0, ${palette.bg} 43%, #050b14 100%)` }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <div>
            <Text style={{ color: palette.gold, fontWeight: 700, letterSpacing: '.04em' }}>NEXT BEST ACTION</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: palette.text }}>AI 营销决策分析</Title>
          </div>
          <Space wrap>
            <Link to="/admin"><Button icon={<ArrowLeftOutlined />}>返回运营驾驶舱</Button></Link>
            <Link to="/admin/heatmap"><Button icon={<FireOutlined />} type="primary">查看客流热力图</Button></Link>
          </Space>
        </header>

        <Card bordered={false} style={{ marginBottom: 16, border: `1px solid rgba(213, 167, 58, .32)`, background: 'linear-gradient(135deg, rgba(213,167,58,.16), rgba(17,28,48,.92))' }}>
          <Space align="start" size={12}>
            <RiseOutlined style={{ marginTop: 2, color: palette.gold, fontSize: 23 }} />
            <div>
              <Text style={{ color: '#f5dc9a', fontWeight: 800 }}>今日 AI 运营摘要</Text>
              <Paragraph style={{ maxWidth: 940, margin: '7px 0 0', color: palette.muted, lineHeight: 1.7 }}>
                {decision?.summary ?? (error || '正在读取游客行为数据，生成今日营销决策建议…')}
              </Paragraph>
            </div>
            {decision?.demoFallback ? <Tag color="warning">demo fallback</Tag> : null}
          </Space>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={16}>
            {decision ? (
              <Row gutter={[14, 14]}>
                {decision.cards.map((card) => (
                  <Col xs={24} lg={12} key={`${card.type}-${card.title}`}>
                    <Card bordered={false} style={{ height: '100%', border: `1px solid ${palette.border}`, background: palette.panel }} bodyStyle={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                        <div>
                          <Space size={6} wrap>
                            <Tag color={typeColor[card.type] ?? 'default'}>{card.type}</Tag>
                            {card.demoFallback ? <Tag>演示样例</Tag> : null}
                          </Space>
                          <Title level={4} style={{ margin: '9px 0 0', color: palette.text, fontSize: 18 }}>{card.title}</Title>
                        </div>
                        <PriorityBadge value={card.priority} />
                      </div>
                      <div style={{ marginTop: 16 }}>
                        <Text style={{ color: palette.muted, fontSize: 12 }}>证据</Text>
                        <div style={{ display: 'grid', gap: 5, marginTop: 7 }}>
                          {card.evidence.slice(0, 3).map((item) => <Text key={item} style={{ color: '#c6d0df', fontSize: 12 }}>· {item}</Text>)}
                        </div>
                      </div>
                      <Paragraph style={{ minHeight: 44, margin: '14px 0', color: '#cdd7e6', lineHeight: 1.65 }}>{card.reason}</Paragraph>
                      <div>
                        <Text style={{ color: '#f4da98', fontSize: 12, fontWeight: 700 }}>建议动作</Text>
                        <div style={{ display: 'grid', gap: 7, marginTop: 8 }}>
                          {card.actions.slice(0, 3).map((action) => <Text key={action} style={{ color: palette.text }}><CheckCircleOutlined style={{ marginRight: 7, color: palette.green }} />{action}</Text>)}
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
            ) : <Card bordered={false} style={{ border: `1px solid ${palette.border}`, background: palette.panel }}><Spin /> <Text style={{ marginLeft: 10, color: palette.muted }}>正在加载智能决策…</Text></Card>}
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
                {(decision?.dataSources ?? ['热门问题 TopN', '情感趋势', '响应延迟', '客流热力图']).map((source) => <Text key={source} style={{ color: '#c6d0df' }}><AlertOutlined style={{ marginRight: 8, color: palette.gold }} />{source}</Text>)}
                <Link to="/admin/heatmap"><Button block icon={<FireOutlined />} style={{ marginTop: 4 }}>查看客流热力图</Button></Link>
              </Space>
            </Card>
          </Col>
        </Row>
      </main>
    </ConfigProvider>
  )
}

export default AdminMarketingDecisionPage
