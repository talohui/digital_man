import React, { useEffect, useMemo, useState } from 'react'
import { Card, Col, ConfigProvider, Progress, Row, Segmented, Statistic, Tag, Typography, theme } from 'antd'
import { Bar, Line, Pie } from '@ant-design/charts'
import {
  AlertOutlined,
  AudioOutlined,
  ClockCircleOutlined,
  FireOutlined,
  LikeOutlined,
  MessageOutlined,
  RadarChartOutlined,
  SmileOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { getAnalyticsApiBase } from '../lib/runtimeConfig'

const { Title, Text } = Typography
const BASE_URL = getAnalyticsApiBase()

type Overview = {
  totalMessages: number
  totalAiReplies: number
  activeSessions5min: number
  positiveRatio: number
  avgLatencyMs: number
  p90LatencyMs: number
  quickAskCount: number
  voiceUseCount: number
  routeClickCount: number
  feedbackCount: number
}

type ServiceQuality = {
  p50LatencyMs: number
  p90LatencyMs: number
  maxLatencyMs: number
  avgLatencyMs: number
  voiceStartCount: number
  voiceEndCount: number
  voiceCompletionRate: number
  estimatedAnswerRate: number
  recentSlowReplies: Array<{ timestamp: string; latencyMs: number; sessionId: string }>
}

type ChatInsights = {
  topQuestions: Array<{ question: string; count: number }>
  keywordStats: Array<{ keyword: string; count: number }>
  intentDistribution: Array<{ type: string; value: number }>
  spotMentionStats: Array<{ spot: string; count: number }>
  negativeQuestionCount: number
}

type Behavior = {
  routeClicks: Array<{ routeId: string; name: string; count: number }>
  spotVisits: Array<{ spotId: string; name: string; count: number }>
  spotDwellAvg: Array<{ spotId: string; name: string; avgSeconds: number }>
  routeRatings: Array<{ routeId: string; name: string; avgRating: number; count: number }>
  spotFeedback: Array<{ spotId: string; name: string; likes: number; dislikes: number }>
  lowSatisfactionItems: Array<{ name: string; reason: string; score: number }>
}

type Persona = {
  selectedTagDistribution: Array<{ tag: string; count: number }>
  tagTrend: Array<{ hour: string; tag: string; count: number }>
}

type Realtime = {
  activeSessions5min: number
  recentEvents: Array<{ event: string; label: string; timestamp: string; target?: string }>
  alerts: Array<{ level: string; message: string }>
}

type SentimentTrend = Array<{ hour: string; positive: number; negative: number; neutral: number }>

type Recommendation = {
  exposureCount: number
  clickCount: number
  ctr: number
  engineDistribution: Array<{ engine: string; count: number }>
  topRoutes: Array<{ routeId: string; name: string; exposureCount: number; clickCount: number; ctr: number }>
}

type Ticketing = {
  ticketCount: number
  expectedVisitors: number
  avgGroupSize: number
  ticketRevenue: number
  visitDateDistribution: Array<{ visitDate: string; label: string; count: number }>
  ageBands: Array<{ ageBand: string; label: string; count: number }>
  genderDistribution: Array<{ gender: string; label: string; count: number }>
  groupSizeDistribution: Array<{ groupSize: number; label: string; count: number }>
  ticketTypes: Array<{ ticketType: string; label: string; count: number }>
}

type Consumption = {
  purchaseCount: number
  totalAmount: number
  avgPerPurchase: number
  avgPerTicket: number
  costMix: Array<{ category: string; label: string; amount: number; count: number; share: number }>
  topCategories: Array<{ category: string; label: string; amount: number; count: number; share: number }>
  trend: Array<{ hour: string; amount: number; count: number }>
  recentPurchases: Array<{ timestamp: string; category: string; label: string; amount: number; spotName?: string; routeName?: string }>
}

type VisitorMode = 'realtime' | 'history'

type VisitorBehaviorDashboard = {
  mode: VisitorMode
  sourceLabel: string
  sampleCount: number
  timeRangeLabel: string
  summary: {
    visitorCount: number
    expectedVisitors: number
    avgGroupSize: number
    avgStayHours: number
    avgSpend: number
    avgSatisfaction: number
    ticketRevenue: number
  }
  demographics: {
    ageBands: Array<{ ageBand: string; label: string; count: number }>
    genderDistribution: Array<{ gender: string; label: string; count: number }>
    groupSizeDistribution: Array<{ groupSize: string; label: string; count: number }>
  }
  consumption: {
    totalAmount: number
    avgPerVisitor: number
    costMix: Array<{ category: string; label: string; amount: number; share: number }>
    topCategories: Array<{ category: string; label: string; amount: number; share: number }>
    trend: Array<{ bucket: string; amount: number; count: number }>
  }
  attractions: {
    visits: Array<{ name: string; spotId?: string; count: number; avgStayHours?: number }>
    dwellRanking: Array<{ name: string; spotId?: string; avgStayHours?: number; avgSeconds?: number }>
  }
  satisfaction: {
    distribution: Array<{ score: string; count: number }>
    lowSatisfactionItems: Array<{ name: string; reason: string; score: number }>
    spotFeedback: Array<{ spotId: string; name: string; likes: number; dislikes: number }>
  }
}

type OfficialSourceMeta = {
  sourceLabel: string
  disclaimer: string
  recordCount: number
  dateRange: { start: string; end: string; dayCount: number }
}

type OfficialSummary = OfficialSourceMeta & {
  sampleCount: number
  attractionTypeCount: number
  avgSatisfaction: number
  avgStayHours: number
  avgSpend: number
  stayDurationUnit: string
  dataQuality: {
    totalRows: number
    negativeCostRows: number
    costMismatchRows: number
    costMismatchRatio: number
    totalCostClip: { p1: number; p99: number }
  }
}

type OfficialDemographics = {
  sourceLabel: string
  disclaimer: string
  ageBands: Array<{ label: string; count: number; ratio: number }>
  genderDistribution: Array<{ label: string; count: number; ratio: number }>
  groupSizeBands: Array<{ label: string; count: number; ratio: number }>
}

type OfficialAttractionTypes = {
  sourceLabel: string
  disclaimer: string
  items: Array<{
    type: string
    visitCount: number
    visitRatio: number
    heatIndex: number
    avgSatisfaction: number
    avgStayHours: number
    avgSpend: number
    sampleSize: number
  }>
}

type OfficialSatisfaction = {
  sourceLabel: string
  disclaimer: string
  overallSat: number
  distribution: Array<{ score: number; normalizedScore: number; count: number; ratio: number }>
  satByType: Array<{ type: string; avgSatisfaction: number; sampleSize: number }>
  lowSatWarnings: Array<{ type: string; avgSatisfaction: number; sampleSize: number; reason: string }>
}

type OfficialSpending = {
  sourceLabel: string
  disclaimer: string
  avgTotalCost: number
  costMix: Array<{ category: string; label: string; total: number; avg: number; share: number }>
  avgCostByType: Array<{ type: string; avgSpend: number; sampleSize: number }>
  dataQuality: { costMismatchRows: number; costMismatchRatio: number; note: string }
}

type OfficialBehavior = {
  summary: OfficialSummary
  demographics: OfficialDemographics
  attractionTypes: OfficialAttractionTypes
  satisfaction: OfficialSatisfaction
  spending: OfficialSpending
}

type DashboardData = {
  overview: Overview
  service: ServiceQuality
  chat: ChatInsights
  behavior: Behavior
  persona: Persona
  realtime: Realtime
  recommendation: Recommendation
  visitorBehavior: VisitorBehaviorDashboard
  sentimentTrend: SentimentTrend
  official: OfficialBehavior
}

const officialDisclaimer = '该数据来自官方示范景区历史行为样本，用作行业基线与推荐先验，不代表灵山实时客流。'

const emptyVisitorBehavior: VisitorBehaviorDashboard = {
  mode: 'realtime',
  sourceLabel: '实时游客数据',
  sampleCount: 0,
  timeRangeLabel: '近24小时 / 小程序采集',
  summary: {
    visitorCount: 0,
    expectedVisitors: 0,
    avgGroupSize: 0,
    avgStayHours: 0,
    avgSpend: 0,
    avgSatisfaction: 0,
    ticketRevenue: 0,
  },
  demographics: {
    ageBands: [],
    genderDistribution: [],
    groupSizeDistribution: [],
  },
  consumption: {
    totalAmount: 0,
    avgPerVisitor: 0,
    costMix: [],
    topCategories: [],
    trend: [],
  },
  attractions: {
    visits: [],
    dwellRanking: [],
  },
  satisfaction: {
    distribution: [],
    lowSatisfactionItems: [],
    spotFeedback: [],
  },
}

const emptyData: DashboardData = {
  overview: {
    totalMessages: 0,
    totalAiReplies: 0,
    activeSessions5min: 0,
    positiveRatio: 0,
    avgLatencyMs: 0,
    p90LatencyMs: 0,
    quickAskCount: 0,
    voiceUseCount: 0,
    routeClickCount: 0,
    feedbackCount: 0,
  },
  service: {
    p50LatencyMs: 0,
    p90LatencyMs: 0,
    maxLatencyMs: 0,
    avgLatencyMs: 0,
    voiceStartCount: 0,
    voiceEndCount: 0,
    voiceCompletionRate: 0,
    estimatedAnswerRate: 0,
    recentSlowReplies: [],
  },
  chat: {
    topQuestions: [],
    keywordStats: [],
    intentDistribution: [],
    spotMentionStats: [],
    negativeQuestionCount: 0,
  },
  behavior: {
    routeClicks: [],
    spotVisits: [],
    spotDwellAvg: [],
    routeRatings: [],
    spotFeedback: [],
    lowSatisfactionItems: [],
  },
  persona: { selectedTagDistribution: [], tagTrend: [] },
  realtime: { activeSessions5min: 0, recentEvents: [], alerts: [] },
  recommendation: { exposureCount: 0, clickCount: 0, ctr: 0, engineDistribution: [], topRoutes: [] },
  visitorBehavior: emptyVisitorBehavior,
  sentimentTrend: [],
  official: {
    summary: {
      sourceLabel: '官方历史样本',
      disclaimer: officialDisclaimer,
      recordCount: 0,
      dateRange: { start: '', end: '', dayCount: 0 },
      sampleCount: 0,
      attractionTypeCount: 0,
      avgSatisfaction: 0,
      avgStayHours: 0,
      avgSpend: 0,
      stayDurationUnit: 'hour',
      dataQuality: {
        totalRows: 0,
        negativeCostRows: 0,
        costMismatchRows: 0,
        costMismatchRatio: 0,
        totalCostClip: { p1: 0, p99: 0 },
      },
    },
    demographics: {
      sourceLabel: '官方历史样本',
      disclaimer: officialDisclaimer,
      ageBands: [],
      genderDistribution: [],
      groupSizeBands: [],
    },
    attractionTypes: {
      sourceLabel: '官方历史样本',
      disclaimer: officialDisclaimer,
      items: [],
    },
    satisfaction: {
      sourceLabel: '官方历史样本',
      disclaimer: officialDisclaimer,
      overallSat: 0,
      distribution: [],
      satByType: [],
      lowSatWarnings: [],
    },
    spending: {
      sourceLabel: '官方历史样本',
      disclaimer: officialDisclaimer,
      avgTotalCost: 0,
      costMix: [],
      avgCostByType: [],
      dataQuality: { costMismatchRows: 0, costMismatchRatio: 0, note: '' },
    },
  },
}

const palette = {
  bg: '#08111f',
  panel: '#101b2e',
  panel2: '#0d1727',
  border: '#233653',
  gold: '#d7a955',
  green: '#5ee6a8',
  cyan: '#5ad7ff',
  red: '#ff7b7b',
  text: '#edf5ff',
  muted: '#8fa6c1',
}

const panelStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: 8,
  border: `1px solid ${palette.border}`,
  background: `linear-gradient(180deg, ${palette.panel}, ${palette.panel2})`,
  boxShadow: '0 12px 30px rgba(0,0,0,0.26)',
}

const chartTheme = {
  styleSheet: {
    backgroundColor: 'transparent',
    brandColor: palette.gold,
    paletteQualitative10: [palette.gold, palette.cyan, palette.green, '#9d8cff', '#ff9f7a', '#7aa7ff'],
  },
}

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${path}`)
    if (!res.ok) return fallback
    return (await res.json()) as T
  } catch {
    return fallback
  }
}

function formatPct(value: number) {
  return Math.round((value || 0) * 100)
}

function formatCount(value: number) {
  return new Intl.NumberFormat('zh-CN').format(Math.round(value || 0))
}

function formatMoney(value: number) {
  return `¥${new Intl.NumberFormat('zh-CN').format(Math.round(value || 0))}`
}

function asLongBar<T extends Record<string, unknown>>(data: T[], xField: keyof T, yField: keyof T) {
  return {
    data,
    xField: String(xField),
    yField: String(yField),
    height: 220,
    colorField: String(yField),
    label: { position: 'right' as const, style: { fill: palette.text } },
    axis: {
      x: { labelFill: palette.muted, gridStroke: '#21324c' },
      y: { labelFill: palette.muted },
    },
    theme: chartTheme,
  }
}

const EmptyState = ({ text = '暂无数据，等待游客互动接入' }: { text?: string }) => (
  <div style={{ height: '100%', minHeight: 120, display: 'grid', placeItems: 'center', color: '#62758d', fontSize: 13 }}>{text}</div>
)

const Panel = ({ title, extra, children, minHeight }: { title: string; extra?: React.ReactNode; children: React.ReactNode; minHeight?: number }) => (
  <Card
    title={<span style={{ color: palette.text, fontWeight: 700 }}>{title}</span>}
    extra={extra}
    style={{ ...panelStyle, minHeight }}
    bordered={false}
    bodyStyle={{ padding: 16 }}
    headStyle={{ borderBottom: `1px solid ${palette.border}`, minHeight: 44 }}
  >
    {children}
  </Card>
)

const MetricCard = ({ title, value, suffix, icon, tone = palette.text }: { title: string; value: number | string; suffix?: string; icon: React.ReactNode; tone?: string }) => (
  <Card style={{ ...panelStyle, background: '#0d1a2f' }} bordered={false} bodyStyle={{ padding: '14px 16px' }}>
    <Statistic
      title={<span style={{ color: palette.muted }}>{title}</span>}
      value={value}
      suffix={suffix}
      prefix={<span style={{ color: tone, marginRight: 4 }}>{icon}</span>}
      valueStyle={{ color: tone, fontSize: 26, fontWeight: 800 }}
    />
  </Card>
)

function RankedList<T extends Record<string, unknown>>({ data, nameKey, valueKey, suffix = '' }: { data: T[]; nameKey: keyof T; valueKey: keyof T; suffix?: string }) {
  if (!data.length) return <EmptyState />
  const max = Math.max(1, ...data.map((item) => Number(item[valueKey] ?? 0)))
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {data.slice(0, 8).map((item, index) => {
        const value = Number(item[valueKey] ?? 0)
        return (
          <div key={`${String(item[nameKey])}-${index}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: palette.text, fontSize: 13 }}>
              <span><Text style={{ color: palette.gold, marginRight: 8 }}>{index + 1}</Text>{String(item[nameKey])}</span>
              <span style={{ color: palette.cyan }}>{value}{suffix}</span>
            </div>
            <div style={{ height: 5, borderRadius: 999, background: '#1c2a3f', marginTop: 6, overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(8, (value / max) * 100)}%`, height: '100%', background: `linear-gradient(90deg, ${palette.gold}, ${palette.cyan})` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'))
  const [data, setData] = useState<DashboardData>(emptyData)
  const [visitorMode, setVisitorMode] = useState<VisitorMode>('realtime')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss')), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let stopped = false
    const load = async () => {
      const [
        overview,
        service,
        chat,
        behavior,
        persona,
        realtime,
        recommendation,
        visitorBehavior,
        sentimentTrend,
        officialSummary,
        officialDemographics,
        officialAttractionTypes,
        officialSatisfaction,
        officialSpending,
      ] = await Promise.all([
        fetchJson<Overview>('/dashboard/overview', emptyData.overview),
        fetchJson<ServiceQuality>('/dashboard/service-quality', emptyData.service),
        fetchJson<ChatInsights>('/dashboard/chat-insights', emptyData.chat),
        fetchJson<Behavior>('/dashboard/behavior', emptyData.behavior),
        fetchJson<Persona>('/dashboard/persona', emptyData.persona),
        fetchJson<Realtime>('/dashboard/realtime', emptyData.realtime),
        fetchJson<Recommendation>('/dashboard/recommendation', emptyData.recommendation),
        fetchJson<VisitorBehaviorDashboard>(`/dashboard/visitor-behavior?mode=${visitorMode}`, emptyVisitorBehavior),
        fetchJson<SentimentTrend>('/sentiment-trend?hours=12', []),
        fetchJson<OfficialSummary>('/official-behavior/summary', emptyData.official.summary),
        fetchJson<OfficialDemographics>('/official-behavior/demographics', emptyData.official.demographics),
        fetchJson<OfficialAttractionTypes>('/official-behavior/attraction-types', emptyData.official.attractionTypes),
        fetchJson<OfficialSatisfaction>('/official-behavior/satisfaction', emptyData.official.satisfaction),
        fetchJson<OfficialSpending>('/official-behavior/spending', emptyData.official.spending),
      ])
      if (!stopped) {
        setData({
          overview,
          service,
          chat,
          behavior,
          persona,
          realtime,
          recommendation,
          visitorBehavior,
          sentimentTrend,
          official: {
            summary: officialSummary,
            demographics: officialDemographics,
            attractionTypes: officialAttractionTypes,
            satisfaction: officialSatisfaction,
            spending: officialSpending,
          },
        })
      }
    }
    load()
    const timer = setInterval(load, 15000)
    return () => { stopped = true; clearInterval(timer) }
  }, [visitorMode])

  const sentimentLines = useMemo(() => data.sentimentTrend.flatMap((row) => [
    { hour: row.hour?.slice(-5) || row.hour, value: row.positive, type: '正面' },
    { hour: row.hour?.slice(-5) || row.hour, value: row.negative, type: '负面' },
    { hour: row.hour?.slice(-5) || row.hour, value: row.neutral, type: '中性' },
  ]), [data.sentimentTrend])

  const spotFeedbackBars = data.behavior.spotFeedback.map((item) => ({ name: item.name, value: item.likes - item.dislikes }))
  const visitorAgeBars = data.visitorBehavior.demographics.ageBands.map((item) => ({ name: item.label, value: item.count }))
  const visitorGroupBars = data.visitorBehavior.demographics.groupSizeDistribution.map((item) => ({ name: item.label, value: item.count }))
  const visitorGenderPie = data.visitorBehavior.demographics.genderDistribution.map((item) => ({ type: item.label, value: item.count }))
  const visitorCostMixPie = data.visitorBehavior.consumption.costMix.map((item) => ({ type: item.label, value: item.amount }))
  const visitorTrendLines = data.visitorBehavior.consumption.trend.map((item) => ({ bucket: item.bucket?.slice(-5) || item.bucket, amount: item.amount }))

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <main style={{ minHeight: '100vh', background: `radial-gradient(circle at top left, #183457 0, ${palette.bg} 38%, #050b14 100%)`, color: palette.text, padding: 22 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div>
            <Text style={{ color: palette.gold, letterSpacing: 0, fontWeight: 700 }}>AI GUIDE OPERATIONS</Text>
            <Title level={2} style={{ color: palette.text, margin: '4px 0 0', fontSize: 30 }}>灵山胜境 · AI 导览运营驾驶舱</Title>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Text style={{ color: palette.muted }}>实时刷新 · 15s</Text>
            <div style={{ color: palette.cyan, fontFamily: 'monospace', fontSize: 20 }}>{currentTime}</div>
          </div>
        </header>

        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
          <Col span={4}><MetricCard title="近24h对话" value={data.overview.totalMessages} icon={<MessageOutlined />} tone={palette.cyan} /></Col>
          <Col span={4}><MetricCard title="实时活跃" value={data.overview.activeSessions5min} icon={<FireOutlined />} tone="#ffb86b" /></Col>
          <Col span={4}><MetricCard title="正面情绪率" value={formatPct(data.overview.positiveRatio)} suffix="%" icon={<SmileOutlined />} tone={palette.green} /></Col>
          <Col span={4}><MetricCard title="P90 响应" value={data.overview.p90LatencyMs} suffix="ms" icon={<ClockCircleOutlined />} tone={data.overview.p90LatencyMs > 5000 ? palette.red : palette.gold} /></Col>
          <Col span={4}><MetricCard title="语音使用" value={data.overview.voiceUseCount} icon={<AudioOutlined />} tone="#b69cff" /></Col>
          <Col span={4}><MetricCard title="评分反馈" value={data.overview.feedbackCount} icon={<LikeOutlined />} tone={palette.green} /></Col>
        </Row>

        <Row gutter={[12, 12]}>
          <Col span={6}>
            <div style={{ display: 'grid', gap: 12 }}>
              <Panel title="AI 服务质量" minHeight={288} extra={<Tag color={data.service.p90LatencyMs > 5000 ? 'error' : 'success'}>{data.service.p90LatencyMs > 5000 ? '需关注' : '稳定'}</Tag>}>
                <Row gutter={[8, 14]}>
                  <Col span={8}><Statistic title="P50" value={data.service.p50LatencyMs} suffix="ms" valueStyle={{ color: palette.text, fontSize: 22 }} /></Col>
                  <Col span={8}><Statistic title="P90" value={data.service.p90LatencyMs} suffix="ms" valueStyle={{ color: palette.gold, fontSize: 22 }} /></Col>
                  <Col span={8}><Statistic title="MAX" value={data.service.maxLatencyMs} suffix="ms" valueStyle={{ color: palette.red, fontSize: 22 }} /></Col>
                </Row>
                <div style={{ marginTop: 18 }}>
                  <Text style={{ color: palette.muted }}>语音完成率</Text>
                  <Progress percent={formatPct(data.service.voiceCompletionRate)} strokeColor={palette.cyan} trailColor="#1c2a3f" />
                  <Text style={{ color: palette.muted }}>AI 回复率</Text>
                  <Progress percent={formatPct(data.service.estimatedAnswerRate)} strokeColor={palette.green} trailColor="#1c2a3f" />
                </div>
              </Panel>

              <Panel title="情绪趋势" minHeight={286}>
                {sentimentLines.length ? (
                  <Line
                    data={sentimentLines}
                    xField="hour"
                    yField="value"
                    seriesField="type"
                    height={210}
                    smooth
                    color={[palette.green, palette.red, palette.muted]}
                    legend={{ position: 'top' }}
                    theme={chartTheme}
                  />
                ) : <EmptyState />}
              </Panel>
            </div>
          </Col>

          <Col span={12}>
            <div style={{ display: 'grid', gap: 12 }}>
              <Panel title="聊天内容洞察" minHeight={300} extra={<Tag color="blue">负面问题 {data.chat.negativeQuestionCount}</Tag>}>
                <Row gutter={12}>
                  <Col span={12}>
                    <Text style={{ color: palette.muted }}>热门问题</Text>
                    <RankedList data={data.chat.topQuestions} nameKey="question" valueKey="count" />
                  </Col>
                  <Col span={12}>
                    {data.chat.intentDistribution.some((item) => item.value > 0) ? (
                      <Pie data={data.chat.intentDistribution} angleField="value" colorField="type" innerRadius={0.58} height={230} legend={{ position: 'bottom' }} theme={chartTheme} />
                    ) : <EmptyState text="暂无意图分类数据" />}
                  </Col>
                </Row>
              </Panel>

              <Row gutter={12}>
                <Col span={12}>
                  <Panel title="高频关键词" minHeight={270}>
                    {data.chat.keywordStats.length ? <Bar {...asLongBar(data.chat.keywordStats.slice(0, 8), 'count', 'keyword')} /> : <EmptyState />}
                  </Panel>
                </Col>
                <Col span={12}>
                  <Panel title="景点关注度" minHeight={270}>
                    {data.chat.spotMentionStats.length ? <Bar {...asLongBar(data.chat.spotMentionStats, 'count', 'spot')} /> : <EmptyState />}
                  </Panel>
                </Col>
              </Row>
            </div>
          </Col>

          <Col span={6}>
            <div style={{ display: 'grid', gap: 12 }}>
              <Panel title="游览期待偏好" minHeight={288}>
                {data.persona.selectedTagDistribution.some((item) => item.count > 0) ? (
                  <Pie data={data.persona.selectedTagDistribution} angleField="count" colorField="tag" innerRadius={0.62} height={220} legend={{ position: 'bottom' }} theme={chartTheme} />
                ) : <EmptyState />}
              </Panel>

              <Panel title="路线与景点行为" minHeight={286}>
                <Text style={{ color: palette.muted }}>路线点击排行</Text>
                <RankedList data={data.behavior.routeClicks} nameKey="name" valueKey="count" />
                <div style={{ height: 14 }} />
                <Text style={{ color: palette.muted }}>景点净好评</Text>
                {spotFeedbackBars.length ? <Bar {...asLongBar(spotFeedbackBars.slice(0, 6), 'value', 'name')} /> : <EmptyState text="暂无点赞/点踩数据" />}
              </Panel>
            </div>
          </Col>
        </Row>

        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          <Col span={6}>
            <Panel title="推荐效果" minHeight={190} extra={<Tag color="cyan">{Math.round(data.recommendation.ctr * 100)}% CTR</Tag>}>
              <div style={{ display: 'flex', gap: 18, marginBottom: 10 }}>
                <Statistic title="曝光" value={data.recommendation.exposureCount} valueStyle={{ color: palette.cyan, fontSize: 20 }} />
                <Statistic title="点击" value={data.recommendation.clickCount} valueStyle={{ color: palette.green, fontSize: 20 }} />
              </div>
              <div style={{ marginBottom: 10 }}>
                {data.recommendation.engineDistribution.length ? (
                  data.recommendation.engineDistribution.slice(0, 2).map((item) => (
                    <Tag key={item.engine} color="geekblue">{item.engine} · {item.count}</Tag>
                  ))
                ) : (
                  <Tag color="default">暂无引擎数据</Tag>
                )}
              </div>
              {data.recommendation.topRoutes.length ? (
                <div style={{ display: 'grid', gap: 7 }}>
                  {data.recommendation.topRoutes.slice(0, 3).map((item) => (
                    <div key={item.routeId} style={{ display: 'flex', justifyContent: 'space-between', color: palette.text }}>
                      <span>{item.name}</span>
                      <span style={{ color: palette.gold }}>{item.clickCount}/{item.exposureCount}</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState text="暂无推荐曝光" />}
            </Panel>
          </Col>
          <Col span={6}>
            <Panel title="低满意风险提示" minHeight={190} extra={<AlertOutlined style={{ color: palette.gold }} />}>
              {data.behavior.lowSatisfactionItems.length ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {data.behavior.lowSatisfactionItems.map((item, index) => <Tag key={index} color="warning" style={{ width: 'fit-content' }}>{item.name} · {item.reason}</Tag>)}
                </div>
              ) : <EmptyState text="暂无低满意风险" />}
            </Panel>
          </Col>
          <Col span={6}>
            <Panel title="慢回复监控" minHeight={190} extra={<RadarChartOutlined style={{ color: palette.cyan }} />}>
              {data.service.recentSlowReplies.length ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {data.service.recentSlowReplies.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', color: palette.text }}>
                      <span>{dayjs(item.timestamp).format('HH:mm:ss')} · {item.sessionId}</span>
                      <span style={{ color: palette.red }}>{item.latencyMs}ms</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState text="暂无慢回复" />}
            </Panel>
          </Col>
          <Col span={6}>
            <Panel title="最近事件流" minHeight={190} extra={<ThunderboltOutlined style={{ color: palette.gold }} />}>
              {data.realtime.recentEvents.length ? (
                <div style={{ display: 'grid', gap: 7, maxHeight: 124, overflow: 'hidden' }}>
                  {data.realtime.recentEvents.slice(0, 5).map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: palette.text }}>
                      <span><Tag color="geekblue">{item.label}</Tag>{item.target}</span>
                      <span style={{ color: palette.muted }}>{dayjs(item.timestamp).format('HH:mm:ss')}</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState text="暂无实时事件" />}
            </Panel>
          </Col>
        </Row>

        <section style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
            <div>
              <Text style={{ color: visitorMode === 'history' ? palette.gold : palette.green, letterSpacing: 0, fontWeight: 700 }}>
                VISITOR BEHAVIOR ANALYSIS
              </Text>
              <Title level={3} style={{ color: palette.text, margin: '2px 0 0', fontSize: 22 }}>
                游客行为分析 · {data.visitorBehavior.sourceLabel}
              </Title>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Tag color={visitorMode === 'history' ? 'gold' : 'green'}>{data.visitorBehavior.timeRangeLabel}</Tag>
              <Segmented
                value={visitorMode}
                options={[
                  { label: '实时游客数据', value: 'realtime' },
                  { label: '灵山历史样本', value: 'history' },
                ]}
                onChange={(value) => setVisitorMode(value as VisitorMode)}
              />
            </div>
          </div>

          <Row gutter={[12, 12]}>
            <Col span={6}>
              <Panel title="游客画像总览" minHeight={260} extra={<Tag color={visitorMode === 'history' ? 'gold' : 'success'}>{data.visitorBehavior.sourceLabel}</Tag>}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Statistic title={visitorMode === 'history' ? '历史样本' : '实时游客'} value={formatCount(data.visitorBehavior.summary.visitorCount)} valueStyle={{ color: palette.cyan, fontSize: 22 }} />
                  <Statistic title="预计入园" value={data.visitorBehavior.summary.expectedVisitors} suffix="人" precision={0} valueStyle={{ color: palette.green, fontSize: 22 }} />
                  <Statistic title="平均同行" value={data.visitorBehavior.summary.avgGroupSize} suffix="人" precision={1} valueStyle={{ color: palette.gold, fontSize: 22 }} />
                  <Statistic title="平均满意度" value={data.visitorBehavior.summary.avgSatisfaction} suffix="/100" precision={1} valueStyle={{ color: palette.text, fontSize: 22 }} />
                </div>
                <div style={{ marginTop: 14, color: palette.muted, lineHeight: 1.8 }}>
                  <div>平均停留：<span style={{ color: palette.cyan }}>{data.visitorBehavior.summary.avgStayHours} 小时</span></div>
                  <div>平均消费：<span style={{ color: palette.gold }}>{formatMoney(data.visitorBehavior.summary.avgSpend)}</span></div>
                  <div>门票收入：<span style={{ color: palette.green }}>{formatMoney(data.visitorBehavior.summary.ticketRevenue)}</span></div>
                </div>
              </Panel>
            </Col>

            <Col span={6}>
              <Panel title="游客结构" minHeight={260}>
                <Row gutter={12}>
                  <Col span={12}>
                    {visitorAgeBars.length ? <Bar {...asLongBar(visitorAgeBars, 'value', 'name')} height={190} /> : <EmptyState text="暂无年龄分布" />}
                  </Col>
                  <Col span={12}>
                    {visitorGenderPie.length ? (
                      <Pie
                        data={visitorGenderPie}
                        angleField="value"
                        colorField="type"
                        innerRadius={0.62}
                        height={190}
                        legend={{ position: 'bottom' }}
                        theme={chartTheme}
                      />
                    ) : <EmptyState text="暂无性别分布" />}
                  </Col>
                </Row>
              </Panel>
            </Col>

            <Col span={6}>
              <Panel title="景点访问与停留" minHeight={260}>
                {data.visitorBehavior.attractions.visits.length ? (
                  <Bar {...asLongBar(data.visitorBehavior.attractions.visits.slice(0, 8), 'count', 'name')} height={205} />
                ) : <EmptyState text="暂无景点访问数据" />}
              </Panel>
            </Col>

            <Col span={6}>
              <Panel title="消费结构" minHeight={260} extra={<Tag color="gold">客单 {formatMoney(data.visitorBehavior.consumption.avgPerVisitor)}</Tag>}>
                {visitorCostMixPie.some((item) => item.value > 0) ? (
                  <Pie
                    data={visitorCostMixPie}
                    angleField="value"
                    colorField="type"
                    innerRadius={0.58}
                    height={165}
                    legend={{ position: 'bottom' }}
                    theme={chartTheme}
                  />
                ) : <EmptyState text="暂无消费结构" />}
                <div style={{ color: palette.muted, fontSize: 12, lineHeight: 1.7 }}>
                  总消费：<span style={{ color: palette.gold }}>{formatMoney(data.visitorBehavior.consumption.totalAmount)}</span>
                </div>
              </Panel>
            </Col>
          </Row>

          <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
            <Col span={8}>
              <Panel title="同行人数分布" minHeight={220}>
                {visitorGroupBars.length ? <Bar {...asLongBar(visitorGroupBars, 'value', 'name')} height={160} /> : <EmptyState text="暂无同行人数分布" />}
              </Panel>
            </Col>
            <Col span={8}>
              <Panel title="消费趋势" minHeight={220}>
                {visitorTrendLines.length ? (
                  <Line
                    data={visitorTrendLines}
                    xField="bucket"
                    yField="amount"
                    height={160}
                    smooth
                    color={palette.gold}
                    theme={chartTheme}
                  />
                ) : <EmptyState text="暂无消费趋势" />}
              </Panel>
            </Col>
            <Col span={8}>
              <Panel title="低满意提示" minHeight={220}>
                {data.visitorBehavior.satisfaction.lowSatisfactionItems.length ? (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {data.visitorBehavior.satisfaction.lowSatisfactionItems.slice(0, 5).map((item) => (
                      <div key={`${item.name}-${item.reason}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: palette.text }}>
                        <span>{item.name} · {item.reason}</span>
                        <span style={{ color: palette.gold }}>{item.score}</span>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState text="暂无低满意风险" />}
              </Panel>
            </Col>
          </Row>
        </section>
      </main>
    </ConfigProvider>
  )
}

export default AdminDashboard
