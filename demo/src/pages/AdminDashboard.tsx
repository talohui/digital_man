import React, { useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, ConfigProvider, Progress, Row, Segmented, Statistic, Tag, Typography, theme } from 'antd'
import { Bar, Line, Pie } from '@ant-design/charts'
import { Link } from 'react-router-dom'
import {
  AlertOutlined,
  AudioOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FireOutlined,
  LikeOutlined,
  MessageOutlined,
  SettingOutlined,
  SkinOutlined,
  SmileOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { exportDashboardExcel, exportDashboardPdf } from '../lib/reportExport'
import { getAnalyticsApiBase } from '../lib/runtimeConfig'

const { Title, Text } = Typography
const BASE_URL = getAnalyticsApiBase()

type Overview = {
  totalMessages: number
  totalAiReplies: number
  activeSessions5min: number
  activeWindowMinutes?: number
  positiveRatio: number
  avgLatencyMs: number
  p90LatencyMs: number
  quickAskCount: number
  voiceUseCount: number
  routeClickCount: number
  feedbackCount: number
  feedbackPositiveCount: number
  feedbackNegativeCount: number
  feedbackNeutralCount: number
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
  activeWindowMinutes?: number
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

type OpportunityLevel = 'warning' | 'info'

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
    feedbackPositiveCount: 0,
    feedbackNegativeCount: 0,
    feedbackNeutralCount: 0,
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

// B 端临时演示数据开关:用于比赛前快速检查大屏满数据状态。
// 接回真实运营数据时改为 false 即可恢复接口结果。
const ADMIN_DASHBOARD_DEMO_DATA_ENABLED = true
const ACTIVE_WINDOW_STORAGE_KEY = 'lingshan_admin_active_window_minutes'
const ACTIVE_WINDOW_OPTIONS = [1, 3, 4, 5, 10, 15, 30] as const
type ActiveWindowMinutes = typeof ACTIVE_WINDOW_OPTIONS[number]

function normalizeActiveWindowMinutes(value: unknown): ActiveWindowMinutes {
  const numeric = typeof value === 'number' ? value : Number(value)
  return ACTIVE_WINDOW_OPTIONS.includes(numeric as ActiveWindowMinutes)
    ? numeric as ActiveWindowMinutes
    : 5
}

function readActiveWindowMinutes(): ActiveWindowMinutes {
  if (typeof window === 'undefined') return 5
  try {
    return normalizeActiveWindowMinutes(window.localStorage.getItem(ACTIVE_WINDOW_STORAGE_KEY))
  } catch {
    return 5
  }
}

function buildDemoDashboardData(visitorMode: VisitorMode, activeWindowMinutes: ActiveWindowMinutes): DashboardData {
  const now = dayjs()
  const at = (minutesAgo: number) => now.subtract(minutesAgo, 'minute').toISOString()
  const isHistory = visitorMode === 'history'
  const demoActiveSessions = Math.max(1, Math.round(43 * Math.sqrt(activeWindowMinutes / 5)))

  const visitorBehavior: VisitorBehaviorDashboard = {
    mode: visitorMode,
    sourceLabel: isHistory ? '灵山历史样本' : '实时游客数据',
    sampleCount: isHistory ? 48620 : 522,
    timeRangeLabel: isHistory ? '2026 春夏历史样本' : '近24小时 / 小程序采集',
    summary: {
      visitorCount: isHistory ? 48620 : 522,
      expectedVisitors: isHistory ? 51240 : 686,
      avgGroupSize: isHistory ? 2.8 : 3.1,
      avgStayHours: isHistory ? 5.6 : 4.7,
      avgSpend: isHistory ? 318 : 896,
      avgSatisfaction: isHistory ? 91.8 : 88.6,
      ticketRevenue: isHistory ? 6284600 : 106197,
    },
    demographics: {
      ageBands: [
        { ageBand: '25-34', label: '25-34', count: isHistory ? 15860 : 192 },
        { ageBand: '35-44', label: '35-44', count: isHistory ? 12240 : 116 },
        { ageBand: '45-59', label: '45-59', count: isHistory ? 10810 : 109 },
        { ageBand: '18-24', label: '18-24', count: isHistory ? 6420 : 66 },
        { ageBand: '60+', label: '60+', count: isHistory ? 3290 : 39 },
      ],
      genderDistribution: [
        { gender: 'male', label: '男', count: isHistory ? 25380 : 278 },
        { gender: 'female', label: '女', count: isHistory ? 23240 : 244 },
      ],
      groupSizeDistribution: [
        { groupSize: '1', label: '单人', count: isHistory ? 3820 : 43 },
        { groupSize: '2', label: '双人', count: isHistory ? 13760 : 146 },
        { groupSize: '3-4', label: '3-4人', count: isHistory ? 21680 : 238 },
        { groupSize: '5-8', label: '5-8人', count: isHistory ? 7430 : 82 },
        { groupSize: '9+', label: '9人以上', count: isHistory ? 1930 : 13 },
      ],
    },
    consumption: {
      totalAmount: isHistory ? 15458760 : 467648,
      avgPerVisitor: isHistory ? 318 : 896,
      costMix: [
        { category: 'ticket', label: '门票', amount: isHistory ? 5565150 : 106197, share: 0.23 },
        { category: 'food', label: '餐饮', amount: isHistory ? 4637628 : 119108, share: 0.25 },
        { category: 'creative', label: '文创', amount: isHistory ? 4792216 : 123094, share: 0.26 },
        { category: 'transport', label: '交通', amount: isHistory ? 2576460 : 66207, share: 0.14 },
        { category: 'show', label: '演艺', amount: isHistory ? 1883306 : 53043, share: 0.12 },
      ],
      topCategories: [
        { category: 'creative', label: '文创', amount: isHistory ? 4792216 : 123094, share: 0.26 },
        { category: 'food', label: '餐饮', amount: isHistory ? 4637628 : 119108, share: 0.25 },
        { category: 'ticket', label: '门票', amount: isHistory ? 5565150 : 106197, share: 0.23 },
      ],
      trend: [
        { bucket: '09:00', amount: isHistory ? 920000 : 26800, count: 48 },
        { bucket: '10:00', amount: isHistory ? 1280000 : 42100, count: 71 },
        { bucket: '11:00', amount: isHistory ? 1680000 : 66800, count: 92 },
        { bucket: '12:00', amount: isHistory ? 2130000 : 81600, count: 118 },
        { bucket: '13:00', amount: isHistory ? 1960000 : 70400, count: 96 },
        { bucket: '14:00', amount: isHistory ? 2410000 : 95700, count: 124 },
        { bucket: '15:00', amount: isHistory ? 2740000 : 109300, count: 138 },
        { bucket: '16:00', amount: isHistory ? 2110000 : 75200, count: 91 },
      ],
    },
    attractions: {
      visits: [
        { name: '灵山大佛', spotId: 'giant_buddha', count: isHistory ? 39480 : 486, avgStayHours: 1.1 },
        { name: '梵宫', spotId: 'fan_gong', count: isHistory ? 32860 : 392, avgStayHours: 0.9 },
        { name: '九龙灌浴', spotId: 'jiulong_guanyu', count: isHistory ? 28630 : 348, avgStayHours: 0.7 },
        { name: '五印坛城', spotId: 'wuyin_tancheng', count: isHistory ? 23980 : 286, avgStayHours: 0.6 },
        { name: '祥符禅寺', spotId: 'xiangfu_temple', count: isHistory ? 21160 : 241, avgStayHours: 0.8 },
        { name: '佛手广场', spotId: 'foshou_square', count: isHistory ? 18620 : 219, avgStayHours: 0.4 },
        { name: '菩提大道', spotId: 'puti_avenue', count: isHistory ? 16930 : 205, avgStayHours: 0.5 },
        { name: '百子戏弥勒', spotId: 'baizi_mile', count: isHistory ? 14200 : 176, avgStayHours: 0.35 },
      ],
      dwellRanking: [
        { name: '灵山大佛', spotId: 'giant_buddha', avgStayHours: 1.1, avgSeconds: 3960 },
        { name: '梵宫', spotId: 'fan_gong', avgStayHours: 0.9, avgSeconds: 3240 },
        { name: '祥符禅寺', spotId: 'xiangfu_temple', avgStayHours: 0.8, avgSeconds: 2880 },
        { name: '九龙灌浴', spotId: 'jiulong_guanyu', avgStayHours: 0.7, avgSeconds: 2520 },
        { name: '五印坛城', spotId: 'wuyin_tancheng', avgStayHours: 0.6, avgSeconds: 2160 },
      ],
    },
    satisfaction: {
      distribution: [
        { score: '95-100', count: isHistory ? 15640 : 168 },
        { score: '90-94', count: isHistory ? 18120 : 194 },
        { score: '80-89', count: isHistory ? 10860 : 116 },
        { score: '70-79', count: isHistory ? 3120 : 34 },
        { score: '<70', count: isHistory ? 880 : 10 },
      ],
      lowSatisfactionItems: [
        { name: '亲子轻游路线', reason: '路线评分偏低', score: 3.2 },
        { name: '佛手广场', reason: '点踩反馈偏高', score: 24 },
        { name: '菩提大道', reason: '点踩反馈偏高', score: 19 },
      ],
      spotFeedback: [
        { spotId: 'giant_buddha', name: '灵山大佛', likes: 462, dislikes: 18 },
        { spotId: 'fan_gong', name: '梵宫', likes: 398, dislikes: 16 },
        { spotId: 'jiulong_guanyu', name: '九龙灌浴', likes: 322, dislikes: 21 },
        { spotId: 'wuyin_tancheng', name: '五印坛城', likes: 286, dislikes: 19 },
        { spotId: 'xiangfu_temple', name: '祥符禅寺', likes: 248, dislikes: 13 },
        { spotId: 'foshou_square', name: '佛手广场', likes: 18, dislikes: 24 },
        { spotId: 'puti_avenue', name: '菩提大道', likes: 14, dislikes: 19 },
      ],
    },
  }
  const demoFeedbackPositiveCount = visitorBehavior.satisfaction.spotFeedback.reduce((sum, item) => sum + item.likes, 0)
  const demoFeedbackNegativeCount = visitorBehavior.satisfaction.spotFeedback.reduce((sum, item) => sum + item.dislikes, 0)
  const demoFeedbackNeutralCount = 0
  const demoFeedbackCount = demoFeedbackPositiveCount + demoFeedbackNegativeCount + demoFeedbackNeutralCount

  return {
    overview: {
      totalMessages: 1846,
      totalAiReplies: 1762,
      activeSessions5min: demoActiveSessions,
      activeWindowMinutes,
      positiveRatio: 0.87,
      avgLatencyMs: 1260,
      p90LatencyMs: 2860,
      quickAskCount: 624,
      voiceUseCount: 318,
      routeClickCount: 276,
      feedbackCount: demoFeedbackCount,
      feedbackPositiveCount: demoFeedbackPositiveCount,
      feedbackNegativeCount: demoFeedbackNegativeCount,
      feedbackNeutralCount: demoFeedbackNeutralCount,
    },
    service: {
      p50LatencyMs: 820,
      p90LatencyMs: 2860,
      maxLatencyMs: 6420,
      avgLatencyMs: 1260,
      voiceStartCount: 358,
      voiceEndCount: 331,
      voiceCompletionRate: 0.925,
      estimatedAnswerRate: 0.956,
      recentSlowReplies: [
        { timestamp: at(4), latencyMs: 4210, sessionId: 'wx-ls-2039' },
        { timestamp: at(11), latencyMs: 5380, sessionId: 'wx-ls-1982' },
        { timestamp: at(18), latencyMs: 3940, sessionId: 'wx-ls-1916' },
        { timestamp: at(27), latencyMs: 6420, sessionId: 'wx-ls-1841' },
      ],
    },
    chat: {
      topQuestions: [
        { question: '灵山大佛高度咨询', count: 186 },
        { question: '梵宫时间/演出咨询', count: 142 },
        { question: '亲子路线咨询', count: 119 },
        { question: '餐饮茶歇咨询', count: 106 },
        { question: '停车交通咨询', count: 94 },
        { question: '五印坛城介绍咨询', count: 81 },
        { question: '文创购物咨询', count: 73 },
        { question: '祈福礼佛咨询', count: 66 },
      ],
      keywordStats: [
        { keyword: '灵山大佛', count: 268 },
        { keyword: '梵宫', count: 224 },
        { keyword: '路线', count: 198 },
        { keyword: '演出', count: 166 },
        { keyword: '停车', count: 132 },
        { keyword: '餐饮', count: 121 },
        { keyword: '祈福', count: 108 },
        { keyword: '文创', count: 96 },
      ],
      intentDistribution: [
        { type: '景点讲解', value: 432 },
        { type: '路线规划', value: 286 },
        { type: '消费咨询', value: 218 },
        { type: '服务问询', value: 176 },
        { type: '祈福体验', value: 128 },
      ],
      spotMentionStats: [
        { spot: '灵山大佛', count: 286 },
        { spot: '梵宫', count: 242 },
        { spot: '九龙灌浴', count: 168 },
        { spot: '五印坛城', count: 139 },
        { spot: '祥符禅寺', count: 116 },
        { spot: '佛手广场', count: 92 },
      ],
      negativeQuestionCount: 17,
    },
    behavior: {
      routeClicks: [
        { routeId: 'historical_culture', name: '历史文化路线', count: 214 },
        { routeId: 'pray-calm', name: '祈福静心路线', count: 188 },
        { routeId: 'family', name: '亲子轻游路线', count: 146 },
        { routeId: 'photo', name: '拍照打卡路线', count: 132 },
        { routeId: 'natural_scenery', name: '自然风光路线', count: 86 },
      ],
      spotVisits: visitorBehavior.attractions.visits.map((item) => ({
        spotId: item.spotId ?? item.name,
        name: item.name,
        count: item.count,
      })),
      spotDwellAvg: visitorBehavior.attractions.dwellRanking.map((item) => ({
        spotId: item.spotId ?? item.name,
        name: item.name,
        avgSeconds: item.avgSeconds ?? Math.round((item.avgStayHours ?? 0) * 3600),
      })),
      routeRatings: [
        { routeId: 'historical_culture', name: '历史文化路线', avgRating: 4.7, count: 86 },
        { routeId: 'pray-calm', name: '祈福静心路线', avgRating: 4.8, count: 74 },
        { routeId: 'family', name: '亲子轻游路线', avgRating: 3.2, count: 58 },
      ],
      spotFeedback: visitorBehavior.satisfaction.spotFeedback,
      lowSatisfactionItems: visitorBehavior.satisfaction.lowSatisfactionItems,
    },
    persona: {
      selectedTagDistribution: [
        { tag: '祈福静心', count: 196 },
        { tag: '文化探秘', count: 154 },
        { tag: '亲子游', count: 132 },
        { tag: '拍照打卡', count: 108 },
        { tag: '轻松漫步', count: 86 },
        { tag: '自然风光', count: 74 },
      ],
      tagTrend: [
        { hour: '09:00', tag: '祈福静心', count: 18 },
        { hour: '10:00', tag: '文化探秘', count: 26 },
        { hour: '11:00', tag: '亲子游', count: 31 },
        { hour: '14:00', tag: '拍照打卡', count: 34 },
      ],
    },
    realtime: {
      activeSessions5min: demoActiveSessions,
      activeWindowMinutes,
      recentEvents: [
        { event: 'ask', label: '问答', timestamp: at(1), target: '灵山大佛讲解' },
        { event: 'route', label: '路线', timestamp: at(3), target: '祈福静心路线' },
        { event: 'purchase', label: '消费', timestamp: at(5), target: '梵宫文创' },
        { event: 'voice', label: '语音', timestamp: at(7), target: '小灵讲解' },
        { event: 'feedback', label: '反馈', timestamp: at(9), target: '九龙灌浴' },
        { event: 'ticket', label: '票务', timestamp: at(12), target: '3人入园' },
      ],
      alerts: [
        { level: 'warning', message: '亲子轻游路线评分低于 3.5' },
        { level: 'info', message: '梵宫相关问询进入高峰' },
      ],
    },
    recommendation: {
      exposureCount: 2386,
      clickCount: 286,
      ctr: 0.12,
      engineDistribution: [
        { engine: '规则推荐', count: 1024 },
        { engine: 'Gorse 协同过滤', count: 856 },
        { engine: 'RAG 场景召回', count: 506 },
      ],
      topRoutes: [
        { routeId: 'history-culture', name: '历史文化路线', exposureCount: 632, clickCount: 86, ctr: 0.136 },
        { routeId: 'pray-calm', name: '祈福静心路线', exposureCount: 598, clickCount: 81, ctr: 0.135 },
        { routeId: 'family', name: '亲子轻松路线', exposureCount: 482, clickCount: 56, ctr: 0.116 },
      ],
    },
    visitorBehavior,
    sentimentTrend: [
      { hour: '09:00', positive: 64, negative: 4, neutral: 18 },
      { hour: '10:00', positive: 86, negative: 6, neutral: 24 },
      { hour: '11:00', positive: 112, negative: 9, neutral: 31 },
      { hour: '12:00', positive: 128, negative: 13, neutral: 36 },
      { hour: '13:00', positive: 118, negative: 12, neutral: 29 },
      { hour: '14:00', positive: 146, negative: 15, neutral: 38 },
      { hour: '15:00', positive: 158, negative: 17, neutral: 42 },
      { hour: '16:00', positive: 126, negative: 11, neutral: 33 },
    ],
    official: {
      summary: {
        sourceLabel: '官方历史样本',
        disclaimer: officialDisclaimer,
        recordCount: 48620,
        dateRange: { start: '2026-03-01', end: '2026-06-30', dayCount: 122 },
        sampleCount: 48620,
        attractionTypeCount: 7,
        avgSatisfaction: 91.8,
        avgStayHours: 5.6,
        avgSpend: 318,
        stayDurationUnit: 'hour',
        dataQuality: {
          totalRows: 48620,
          negativeCostRows: 0,
          costMismatchRows: 126,
          costMismatchRatio: 0.0026,
          totalCostClip: { p1: 48, p99: 1260 },
        },
      },
      demographics: {
        sourceLabel: '官方历史样本',
        disclaimer: officialDisclaimer,
        ageBands: visitorBehavior.demographics.ageBands.map((item) => ({
          label: item.label,
          count: item.count,
          ratio: item.count / visitorBehavior.summary.visitorCount,
        })),
        genderDistribution: visitorBehavior.demographics.genderDistribution.map((item) => ({
          label: item.label,
          count: item.count,
          ratio: item.count / visitorBehavior.summary.visitorCount,
        })),
        groupSizeBands: visitorBehavior.demographics.groupSizeDistribution.map((item) => ({
          label: item.label,
          count: item.count,
          ratio: item.count / visitorBehavior.summary.visitorCount,
        })),
      },
      attractionTypes: {
        sourceLabel: '官方历史样本',
        disclaimer: officialDisclaimer,
        items: [
          { type: '佛教文化', visitCount: 39480, visitRatio: 0.81, heatIndex: 96, avgSatisfaction: 94.2, avgStayHours: 1.1, avgSpend: 286, sampleSize: 39480 },
          { type: '室内展陈', visitCount: 32860, visitRatio: 0.68, heatIndex: 89, avgSatisfaction: 92.8, avgStayHours: 0.9, avgSpend: 352, sampleSize: 32860 },
          { type: '互动演艺', visitCount: 28630, visitRatio: 0.59, heatIndex: 84, avgSatisfaction: 89.6, avgStayHours: 0.7, avgSpend: 316, sampleSize: 28630 },
          { type: '祈福体验', visitCount: 23980, visitRatio: 0.49, heatIndex: 78, avgSatisfaction: 93.1, avgStayHours: 0.6, avgSpend: 298, sampleSize: 23980 },
        ],
      },
      satisfaction: {
        sourceLabel: '官方历史样本',
        disclaimer: officialDisclaimer,
        overallSat: 91.8,
        distribution: visitorBehavior.satisfaction.distribution.map((item, index) => ({
          score: 100 - index * 10,
          normalizedScore: 100 - index * 10,
          count: item.count,
          ratio: item.count / visitorBehavior.summary.visitorCount,
        })),
        satByType: [
          { type: '佛教文化', avgSatisfaction: 94.2, sampleSize: 39480 },
          { type: '祈福体验', avgSatisfaction: 93.1, sampleSize: 23980 },
          { type: '室内展陈', avgSatisfaction: 92.8, sampleSize: 32860 },
          { type: '交通服务', avgSatisfaction: 82.4, sampleSize: 18620 },
        ],
        lowSatWarnings: [
          { type: '交通服务', avgSatisfaction: 82.4, sampleSize: 18620, reason: '停车与接驳体验波动' },
          { type: '餐饮服务', avgSatisfaction: 84.6, sampleSize: 21140, reason: '午间排队压力较高' },
        ],
      },
      spending: {
        sourceLabel: '官方历史样本',
        disclaimer: officialDisclaimer,
        avgTotalCost: 318,
        costMix: visitorBehavior.consumption.costMix.map((item) => ({
          category: item.category,
          label: item.label,
          total: item.amount,
          avg: Math.round(item.amount / visitorBehavior.summary.visitorCount),
          share: item.share,
        })),
        avgCostByType: [
          { type: '家庭亲子', avgSpend: 386, sampleSize: 13200 },
          { type: '文化深度', avgSpend: 352, sampleSize: 10860 },
          { type: '祈福静心', avgSpend: 296, sampleSize: 14280 },
          { type: '轻松游览', avgSpend: 244, sampleSize: 10280 },
        ],
        dataQuality: {
          costMismatchRows: 126,
          costMismatchRatio: 0.0026,
          note: '演示样本已做金额裁剪与异常值过滤。',
        },
      },
    },
  }
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
  muted: '#b5c6dc',
  dim: '#8ca0ba',
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

const chartSeriesColors = [palette.gold, palette.cyan, palette.green, '#9d8cff', '#ff9f7a', '#7aa7ff']

const chartTextStyle = {
  fill: palette.text,
  fontSize: 12,
  fontWeight: 600,
}

const chartMutedTextStyle = {
  fill: palette.muted,
  fontSize: 12,
  fontWeight: 500,
}

const darkLegend = {
  position: 'bottom' as const,
  itemName: {
    style: {
      fill: palette.muted,
      fontSize: 12,
      fontWeight: 600,
    },
  },
  marker: {
    style: {
      r: 5,
    },
  },
}

const hiddenDonutStatistic = {
  title: false as const,
  content: false as const,
}

function asDarkDonut(data: Array<Record<string, unknown>>, angleField = 'value', colorField = 'type', innerRadius = 0.58) {
  return {
    data,
    angleField,
    colorField,
    innerRadius,
    label: {
      type: 'spider' as const,
      style: {
        fill: palette.muted,
        fontSize: 12,
        fontWeight: 600,
      },
      labelLine: {
        style: {
          stroke: palette.muted,
          lineWidth: 1,
        },
      },
    },
    legend: darkLegend,
    statistic: hiddenDonutStatistic,
    theme: chartTheme,
  }
}

function asCompactDonut(data: Array<Record<string, unknown>>, angleField = 'value', colorField = 'type', innerRadius = 0.62) {
  return {
    data,
    angleField,
    colorField,
    innerRadius,
    radius: 0.86,
    label: false as const,
    legend: false as const,
    statistic: hiddenDonutStatistic,
    theme: chartTheme,
  }
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

// 响应时长统一格式化，避免超长/异常毫秒数（如时间戳级 latency）撑破卡片
// <1000ms → “xxx ms”；1s–60s → “x.x s”；>60s 或异常值 → “异常”
function formatLatency(ms: number) {
  const value = Math.max(0, Math.round(ms || 0))
  if (!Number.isFinite(value)) return '异常'
  if (value < 1000) return `${value} ms`
  if (value <= 60000) return `${(value / 1000).toFixed(1)} s`
  return '异常'
}

// P90 响应时长“需关注”阈值（毫秒），全局统一口径
const LATENCY_ATTENTION_MS = 3000

function asLongBar<T extends Record<string, unknown>>(data: T[], xField: keyof T, yField: keyof T) {
  return {
    data,
    xField: String(xField),
    yField: String(yField),
    height: 220,
    colorField: String(yField),
    label: { position: 'right' as const, style: chartTextStyle },
    axis: {
      x: {
        labelFill: palette.muted,
        label: { style: chartMutedTextStyle },
        gridStroke: '#2a3d5c',
        grid: { line: { style: { stroke: '#2a3d5c', lineWidth: 1 } } },
      },
      y: {
        labelFill: palette.muted,
        label: { style: { ...chartMutedTextStyle, fontSize: 13 } },
      },
    },
    theme: chartTheme,
  }
}

const EmptyState = ({ text = '暂无数据，等待游客互动接入' }: { text?: string }) => (
  <div style={{ height: '100%', minHeight: 120, display: 'grid', placeItems: 'center', color: '#62758d', fontSize: 13 }}>{text}</div>
)

const Panel = ({ title, extra, children, minHeight }: { title: string; extra?: React.ReactNode; children: React.ReactNode; minHeight?: number }) => (
  <Card
    title={<span style={{ color: palette.text, fontWeight: 700, fontSize: 18, lineHeight: '24px' }}>{title}</span>}
    extra={extra}
    style={{ ...panelStyle, minHeight }}
    bordered={false}
    bodyStyle={{ padding: 16 }}
    headStyle={{ borderBottom: `1px solid ${palette.border}`, minHeight: 44 }}
  >
    {children}
  </Card>
)

const SectionHeading = ({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) => (
  <div style={{ margin: '18px 0 10px' }}>
    <Text style={{ color: palette.gold, letterSpacing: 0, fontWeight: 700, fontSize: 12 }}>{eyebrow}</Text>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
      <Title level={4} style={{ color: palette.text, margin: '2px 0 0', fontSize: 18 }}>{title}</Title>
      {note ? <Text style={{ color: palette.muted, fontSize: 12 }}>{note}</Text> : null}
    </div>
  </div>
)

const MetricCard = ({
  title,
  value,
  suffix,
  icon,
  tone = palette.text,
  footer,
}: {
  title: string
  value: number | string
  suffix?: string
  icon: React.ReactNode
  tone?: string
  footer?: React.ReactNode
}) => (
  <Card style={{ ...panelStyle, background: '#0d1a2f' }} bordered={false} bodyStyle={{ padding: '14px 16px' }}>
    <Statistic
      title={<span style={{ color: palette.muted }}>{title}</span>}
      value={value}
      suffix={suffix}
      prefix={<span style={{ color: tone, marginRight: 4 }}>{icon}</span>}
      valueStyle={{ color: tone, fontSize: 26, fontWeight: 800 }}
    />
    {footer ? <div style={{ marginTop: 8 }}>{footer}</div> : null}
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
  const [activeWindowMinutes, setActiveWindowMinutes] = useState<ActiveWindowMinutes>(readActiveWindowMinutes)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss')), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let stopped = false
    const load = async () => {
      const activeWindowQuery = `activeWindowMinutes=${activeWindowMinutes}`
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
        fetchJson<Overview>(`/dashboard/overview?${activeWindowQuery}`, emptyData.overview),
        fetchJson<ServiceQuality>('/dashboard/service-quality', emptyData.service),
        fetchJson<ChatInsights>('/dashboard/chat-insights', emptyData.chat),
        fetchJson<Behavior>('/dashboard/behavior', emptyData.behavior),
        fetchJson<Persona>('/dashboard/persona', emptyData.persona),
        fetchJson<Realtime>(`/dashboard/realtime?${activeWindowQuery}`, emptyData.realtime),
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
        const liveData = {
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
        }
        setData(ADMIN_DASHBOARD_DEMO_DATA_ENABLED ? buildDemoDashboardData(visitorMode, activeWindowMinutes) : liveData)
      }
    }
    load()
    const timer = setInterval(load, 15000)
    return () => { stopped = true; clearInterval(timer) }
  }, [visitorMode, activeWindowMinutes])

  const activeWindowOptions = useMemo(() => ACTIVE_WINDOW_OPTIONS.map((minutes) => ({
    label: `${minutes}分钟`,
    value: minutes,
  })), [])

  const handleActiveWindowChange = (value: string | number) => {
    const next = normalizeActiveWindowMinutes(value)
    setActiveWindowMinutes(next)
    try {
      window.localStorage.setItem(ACTIVE_WINDOW_STORAGE_KEY, String(next))
    } catch {
      // localStorage 在隐私模式下可能不可用，设置失败不影响页面切换。
    }
  }

  const sentimentLines = useMemo(() => data.sentimentTrend.flatMap((row) => [
    { hour: row.hour?.slice(-5) || row.hour, value: row.positive, type: '正面' },
    { hour: row.hour?.slice(-5) || row.hour, value: row.negative, type: '负面' },
    { hour: row.hour?.slice(-5) || row.hour, value: row.neutral, type: '中性' },
  ]), [data.sentimentTrend])

  // 运营机会清单：把已有真实指标规则化成“运营该做什么”，不引入新数据源、不伪造实时。
  const opportunities = useMemo<Array<{ level: OpportunityLevel; title: string; action: string }>>(() => {
    const items: Array<{ level: OpportunityLevel; title: string; action: string }> = []

    // 1) 推荐点击率偏低
    const ctrPct = Math.round((data.recommendation.ctr || 0) * 100)
    if (data.recommendation.exposureCount > 0 && data.recommendation.ctr < 0.1) {
      items.push({
        level: 'warning',
        title: `首页推荐点击率偏低（${ctrPct}%）`,
        action: '建议优化推荐卡文案与排序，突出适合人群与亮点。',
      })
    }

    // 2) 回复延迟偏高
    if (data.service.p90LatencyMs > LATENCY_ATTENTION_MS) {
      items.push({
        level: 'warning',
        title: `回复延迟偏高（P90 ${formatLatency(data.service.p90LatencyMs)}）`,
        action: '关注「AI 服务质量」，排查知识库召回、模型响应与语音合成耗时。',
      })
    }

    // 3) 低满意路线/景点
    data.behavior.lowSatisfactionItems.slice(0, 2).forEach((item) => {
      items.push({
        level: 'warning',
        title: `${item.name} 满意度偏低`,
        action: `${item.reason || '建议复核讲解内容与现场体验'}。`,
      })
    })

    // 4) 停留时间最长的景点 —— 提示加强消费/导购引导（用真实停留排行，不伪造）
    const topDwell = data.visitorBehavior.attractions.dwellRanking?.[0]
    if (topDwell?.name) {
      items.push({
        level: 'info',
        title: `${topDwell.name} 游客停留时间最长`,
        action: '可在此点位增加消费/导购与拍照引导，提升停留转化。',
      })
    }

    // 5) 高频问题 —— 提示补充知识库/快捷入口
    const topQuestion = data.chat.topQuestions?.[0]
    if (topQuestion?.question) {
      items.push({
        level: 'info',
        title: `高频主题：${topQuestion.question}`,
        action: '可补充对应知识库内容或设置首页快捷入口。',
      })
    }

    return items
  }, [data.recommendation, data.service, data.behavior.lowSatisfactionItems, data.visitorBehavior.attractions.dwellRanking, data.chat.topQuestions])

  const spotFeedbackRank = data.behavior.spotFeedback
    .map((item) => {
      const total = item.likes + item.dislikes
      return {
        ...item,
        total,
        positiveRate: total > 0 ? Math.round((item.likes / total) * 100) : 0,
      }
    })
    .sort((a, b) => {
      if (b.dislikes !== a.dislikes) return b.dislikes - a.dislikes
      return b.total - a.total
    })
  const visitorAgeBars = data.visitorBehavior.demographics.ageBands.map((item) => ({ name: item.label, value: item.count }))
  const visitorGroupBars = data.visitorBehavior.demographics.groupSizeDistribution.map((item) => ({ name: item.label, value: item.count }))
  const visitorGenderPie = data.visitorBehavior.demographics.genderDistribution.map((item) => ({ type: item.label, value: item.count }))
  const visitorGenderTotal = visitorGenderPie.reduce((sum, item) => sum + item.value, 0)
  const visitorCostMixPie = data.visitorBehavior.consumption.costMix.map((item) => ({ type: item.label, value: item.amount }))
  const visitorTrendLines = data.visitorBehavior.consumption.trend.map((item) => ({ bucket: item.bucket?.slice(-5) || item.bucket, amount: item.amount }))
  const spotFeedbackPositiveFallback = spotFeedbackRank.reduce((sum, item) => sum + item.likes, 0)
  const spotFeedbackNegativeFallback = spotFeedbackRank.reduce((sum, item) => sum + item.dislikes, 0)
  const feedbackPositiveCount = data.overview.feedbackPositiveCount ?? spotFeedbackPositiveFallback
  const feedbackNegativeCount = data.overview.feedbackNegativeCount ?? spotFeedbackNegativeFallback
  const feedbackNeutralCount = data.overview.feedbackNeutralCount ?? Math.max(0, data.overview.feedbackCount - feedbackPositiveCount - feedbackNegativeCount)
  const feedbackTotal = Math.max(data.overview.feedbackCount, feedbackPositiveCount + feedbackNegativeCount + feedbackNeutralCount)
  const feedbackPositiveRate = feedbackTotal > 0 ? Math.round((feedbackPositiveCount / feedbackTotal) * 100) : 0

  // FR-B3.4 导出运营报告:基于驾驶舱当前数据生成 Excel(多 Sheet)/ PDF
  const buildReportMeta = () => ({
    title: '灵山胜境 AI 导览 · 运营报告',
    generatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    visitorModeLabel: visitorMode === 'realtime' ? '实时' : '历史',
  })

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <main style={{ minHeight: '100vh', background: `radial-gradient(circle at top left, #183457 0, ${palette.bg} 38%, #050b14 100%)`, color: palette.text, padding: 22 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div>
            <Text style={{ color: palette.gold, letterSpacing: 0, fontWeight: 700 }}>AI GUIDE OPERATIONS</Text>
            <Title level={2} style={{ color: palette.text, margin: '4px 0 0', fontSize: 30 }}>灵山胜境 · AI 导览运营驾驶舱</Title>
          </div>
          <div style={{ display: 'grid', justifyItems: 'end', gap: 8, textAlign: 'right' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                size="large"
                icon={<FileExcelOutlined />}
                onClick={() => exportDashboardExcel(data, buildReportMeta())}
                style={{ color: palette.green, fontWeight: 700, borderColor: palette.green, background: 'rgba(94, 230, 168, 0.1)' }}
              >
                导出 Excel
              </Button>
              <Button
                size="large"
                icon={<FilePdfOutlined />}
                onClick={() => exportDashboardPdf(data, buildReportMeta())}
                style={{ color: palette.red, fontWeight: 700, borderColor: palette.red, background: 'rgba(255, 123, 123, 0.1)' }}
              >
                导出 PDF
              </Button>
              <Link to="/admin/kb">
                <Button
                  size="large"
                  icon={<DatabaseOutlined />}
                  style={{
                    color: palette.gold,
                    fontWeight: 700,
                    borderColor: palette.gold,
                    background: 'rgba(212, 175, 55, 0.1)',
                  }}
                >
                  知识库管理
                </Button>
              </Link>
              <Link to="/admin/decision">
                <Button
                  size="large"
                  icon={<BulbOutlined />}
                  style={{
                    color: palette.cyan,
                    fontWeight: 700,
                    borderColor: palette.cyan,
                    background: 'rgba(79, 195, 231, 0.1)',
                  }}
                >
                  AI 营销决策
                </Button>
              </Link>
              <Link to="/admin/avatar">
                <Button
                  size="large"
                  icon={<SkinOutlined />}
                  style={{
                    color: palette.gold,
                    fontWeight: 700,
                    borderColor: palette.gold,
                    background: 'rgba(212, 175, 55, 0.1)',
                  }}
                >
                  数字人形象
                </Button>
              </Link>
              <Link to="/admin/config">
                <Button
                  size="large"
                  icon={<SettingOutlined />}
                  style={{
                    color: palette.gold,
                    fontWeight: 700,
                    borderColor: palette.gold,
                    background: 'rgba(212, 175, 55, 0.1)',
                  }}
                >
                  服务配置
                </Button>
              </Link>
              <Link to="/admin/heatmap">
                <Button
                  type="primary"
                  size="large"
                  icon={<FireOutlined />}
                  style={{
                    color: '#1a1208',
                    fontWeight: 800,
                    borderColor: palette.gold,
                    background: 'linear-gradient(135deg, #f3da80, #d4af37)',
                    boxShadow: '0 6px 22px rgba(212, 175, 55, 0.5)',
                  }}
                >
                  客流热力图
                </Button>
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {ADMIN_DASHBOARD_DEMO_DATA_ENABLED ? <Tag color="purple">演示数据</Tag> : null}
              <Text style={{ color: palette.muted }}>实时刷新 · 15s</Text>
            </div>
            <div style={{ color: palette.cyan, fontFamily: 'monospace', fontSize: 20 }}>{currentTime}</div>
          </div>
        </header>

        <SectionHeading eyebrow="REAL-TIME OVERVIEW" title="实时态势" note="近 24 小时小程序与数字人实时采集" />
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          margin: '-4px 0 10px',
        }}>
          <Text style={{ color: palette.muted, fontSize: 12 }}>活跃统计窗口</Text>
          <Segmented
            size="small"
            value={activeWindowMinutes}
            options={activeWindowOptions}
            onChange={handleActiveWindowChange}
            style={{
              background: '#0d1a2f',
              border: `1px solid ${palette.border}`,
              color: palette.text,
            }}
          />
        </div>
        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
          <Col span={4}><MetricCard title="近24h对话" value={data.overview.totalMessages} icon={<MessageOutlined />} tone={palette.cyan} /></Col>
          <Col span={4}><MetricCard title={`近${activeWindowMinutes}分钟活跃`} value={data.overview.activeSessions5min} icon={<FireOutlined />} tone="#ffb86b" /></Col>
          <Col span={4}><MetricCard title="正面情绪率" value={formatPct(data.overview.positiveRatio)} suffix="%" icon={<SmileOutlined />} tone={palette.green} /></Col>
          <Col span={4}><MetricCard title="P90 响应" value={formatLatency(data.overview.p90LatencyMs)} icon={<ClockCircleOutlined />} tone={data.overview.p90LatencyMs > LATENCY_ATTENTION_MS ? palette.red : palette.gold} /></Col>
          <Col span={4}><MetricCard title="语音使用" value={data.overview.voiceUseCount} icon={<AudioOutlined />} tone="#b69cff" /></Col>
          <Col span={4}>
            <MetricCard
              title="游客反馈"
              value={feedbackTotal}
              icon={<LikeOutlined />}
              tone={feedbackNegativeCount > 0 ? palette.gold : palette.green}
              footer={(
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', color: palette.muted, fontSize: 12, lineHeight: 1.4 }}>
                  <span style={{ color: palette.green }}>好评 {feedbackPositiveCount}</span>
                  <span style={{ color: feedbackNegativeCount > 0 ? palette.red : palette.muted }}>差评 {feedbackNegativeCount}</span>
                  <span>好评率 {feedbackPositiveRate}%</span>
                </div>
              )}
            />
          </Col>
        </Row>

        <SectionHeading eyebrow="OPERATION OPPORTUNITIES" title="今天该处理什么？" note="基于实时指标自动梳理的运营机会与待办，按真实数据触发" />
        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
          <Col span={24}>
            <Panel title="运营机会清单" extra={<Tag color={opportunities.some((o) => o.level === 'warning') ? 'warning' : 'success'}>{opportunities.length ? `${opportunities.length} 项待办` : '运行正常'}</Tag>}>
              {opportunities.length ? (
                <Row gutter={[12, 12]}>
                  {opportunities.map((item, index) => (
                    <Col span={8} key={`${item.title}-${index}`}>
                      <div style={{
                        height: '100%',
                        padding: '12px 14px',
                        borderRadius: 8,
                        background: '#0d1a2f',
                        borderLeft: `3px solid ${item.level === 'warning' ? palette.red : palette.cyan}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <Tag color={item.level === 'warning' ? 'error' : 'processing'} style={{ marginInlineEnd: 0 }}>
                            {item.level === 'warning' ? '需关注' : '机会'}
                          </Tag>
                          <Text style={{ color: palette.text, fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</Text>
                        </div>
                        <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 1.6 }}>{item.action}</Text>
                      </div>
                    </Col>
                  ))}
                </Row>
              ) : (
                <EmptyState text="当前各项指标正常，暂无需要处理的运营事项" />
              )}
            </Panel>
          </Col>
        </Row>

        <SectionHeading eyebrow="CHAT & SERVICE INSIGHTS" title="聊天洞察与服务质量" note="基于实时问答日志，反映小灵的回答质量与游客情绪" />
        <Row gutter={[12, 12]}>
          <Col span={6}>
            <Panel title="AI 服务质量" minHeight={300} extra={<Tag color={data.service.p90LatencyMs > LATENCY_ATTENTION_MS ? 'error' : 'success'}>{data.service.p90LatencyMs > LATENCY_ATTENTION_MS ? '需关注' : '稳定'}</Tag>}>
              <Row gutter={[8, 14]}>
                <Col span={8}><Statistic title="P50" value={formatLatency(data.service.p50LatencyMs)} valueStyle={{ color: palette.text, fontSize: 22 }} /></Col>
                <Col span={8}><Statistic title="P90" value={formatLatency(data.service.p90LatencyMs)} valueStyle={{ color: palette.gold, fontSize: 22 }} /></Col>
                <Col span={8}><Statistic title="MAX" value={formatLatency(data.service.maxLatencyMs)} valueStyle={{ color: palette.red, fontSize: 22 }} /></Col>
              </Row>
              <div style={{ marginTop: 18 }}>
                <Text style={{ color: palette.muted }}>语音完成率</Text>
                <Progress percent={formatPct(data.service.voiceCompletionRate)} strokeColor={palette.cyan} trailColor="#1c2a3f" />
                <Text style={{ color: palette.muted }}>AI 回复率</Text>
                <Progress percent={formatPct(data.service.estimatedAnswerRate)} strokeColor={palette.green} trailColor="#1c2a3f" />
              </div>
            </Panel>
          </Col>

          <Col span={12}>
            <Panel title="聊天内容洞察" minHeight={300} extra={<Tag color="blue">负面问题 {data.chat.negativeQuestionCount}</Tag>}>
              <Row gutter={12}>
                <Col span={12}>
                  <Text style={{ color: palette.muted }}>热门咨询主题</Text>
                  <RankedList data={data.chat.topQuestions} nameKey="question" valueKey="count" />
                </Col>
                <Col span={12}>
                  {data.chat.intentDistribution.some((item) => item.value > 0) ? (
                    <Pie data={data.chat.intentDistribution} angleField="value" colorField="type" innerRadius={0.58} height={230} legend={{ position: 'bottom' }} theme={chartTheme} />
                  ) : <EmptyState text="暂无意图分类数据" />}
                </Col>
              </Row>
            </Panel>
          </Col>

          <Col span={6}>
            <Panel title="游览期待偏好" minHeight={300}>
              {data.persona.selectedTagDistribution.some((item) => item.count > 0) ? (
                <Pie data={data.persona.selectedTagDistribution} angleField="count" colorField="tag" innerRadius={0.62} height={230} legend={{ position: 'bottom' }} theme={chartTheme} />
              ) : <EmptyState />}
            </Panel>
          </Col>
        </Row>

        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          <Col span={6}>
            <Panel title="情绪趋势" minHeight={290}>
              {sentimentLines.length ? (
                <Line
                  data={sentimentLines}
                  xField="hour"
                  yField="value"
                  seriesField="type"
                  height={214}
                  smooth
                  color={[palette.green, palette.red, palette.muted]}
                  legend={{ position: 'top' }}
                  theme={chartTheme}
                />
              ) : <EmptyState />}
            </Panel>
          </Col>

          <Col span={6}>
            <Panel title="高频关键词" minHeight={290}>
              {data.chat.keywordStats.length ? <Bar {...asLongBar(data.chat.keywordStats.slice(0, 8), 'count', 'keyword')} /> : <EmptyState />}
            </Panel>
          </Col>

          <Col span={6}>
            <Panel title="景点关注度" minHeight={290}>
              {data.chat.spotMentionStats.length ? <Bar {...asLongBar(data.chat.spotMentionStats, 'count', 'spot')} /> : <EmptyState />}
            </Panel>
          </Col>

          <Col span={6}>
            <Panel title="路线点击排行" minHeight={290}>
              <RankedList data={data.behavior.routeClicks} nameKey="name" valueKey="count" />
            </Panel>
          </Col>
        </Row>

        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          <Col span={24}>
            <Panel title="反馈来源排行" minHeight={168}>
              {spotFeedbackRank.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(176px, 1fr))', gap: 10 }}>
                  {spotFeedbackRank.slice(0, 5).map((item) => (
                    <div
                      key={item.spotId}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: item.dislikes > 0 ? 'rgba(255, 123, 123, 0.08)' : '#0d1a2f',
                        border: `1px solid ${item.dislikes > 0 ? 'rgba(255, 123, 123, 0.28)' : palette.border}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: palette.text, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                        <span style={{ color: item.positiveRate < 80 ? palette.red : palette.green, fontSize: 12, flex: '0 0 auto' }}>
                          {item.positiveRate}%
                        </span>
                      </div>
                      <div style={{ height: 5, borderRadius: 999, background: '#1c2a3f', overflow: 'hidden', marginTop: 9 }}>
                        <div style={{ width: `${item.positiveRate}%`, height: '100%', borderRadius: 999, background: item.positiveRate < 80 ? palette.red : palette.green }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 8, color: palette.muted, fontSize: 12 }}>
                        <span style={{ color: palette.green }}>好评 {item.likes}</span>
                        <span style={{ color: item.dislikes > 0 ? palette.red : palette.muted }}>差评 {item.dislikes}</span>
                        <span>总计 {item.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState text="暂无点赞/点踩数据" />}
            </Panel>
          </Col>
        </Row>

        <SectionHeading eyebrow="RECOMMENDATION & OPS MONITOR" title="推荐与运营监控" note="推荐曝光点击与低满意风险提示" />
        <Row gutter={[12, 12]} style={{ marginTop: 0 }}>
          <Col span={12}>
            <Panel title="推荐效果" minHeight={190} extra={<Tag color={data.recommendation.ctr > 0 ? (data.recommendation.ctr < 0.1 ? 'orange' : 'cyan') : 'default'}>{Math.round(data.recommendation.ctr * 100)}% CTR</Tag>}>
              <div style={{ display: 'flex', gap: 18, marginBottom: 8 }}>
                <Statistic title="曝光" value={data.recommendation.exposureCount} valueStyle={{ color: palette.cyan, fontSize: 20 }} />
                <Statistic title="点击" value={data.recommendation.clickCount} valueStyle={{ color: palette.green, fontSize: 20 }} />
              </div>
              <div style={{ marginBottom: 10, fontSize: 12, color: palette.muted }}>
                {data.recommendation.exposureCount === 0
                  ? '首页推荐卡片展示后会产生曝光数据'
                  : data.recommendation.ctr < 0.1
                    ? '点击率偏低，建议优化推荐文案与排序'
                    : '点击率表现正常，推荐链路健康'}
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
          <Col span={12}>
            <Panel title="低满意风险提示" minHeight={190} extra={<AlertOutlined style={{ color: palette.gold }} />}>
              {data.behavior.lowSatisfactionItems.length ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {data.behavior.lowSatisfactionItems.map((item, index) => <Tag key={index} color="warning" style={{ width: 'fit-content' }}>{item.name} · {item.reason}</Tag>)}
                </div>
              ) : <EmptyState text="暂无低满意风险" />}
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
                size="large"
                className="dash-source-toggle"
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
                      <div style={{ display: 'grid', gridTemplateRows: '24px 1fr', gap: 4, height: 190 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'center',
                            gap: 6,
                            color: palette.muted
                          }}
                        >
                          <span style={{ fontSize: 12 }}>性别样本</span>
                          <span style={{ color: palette.cyan, fontSize: 18, fontWeight: 800, lineHeight: 1 }}>
                            {formatCount(visitorGenderTotal)}
                          </span>
                          <span style={{ fontSize: 12 }}>人</span>
                        </div>
                        <Pie
                          {...asDarkDonut(visitorGenderPie, 'value', 'type', 0.62)}
                          height={160}
                        />
                      </div>
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
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <Text style={{ color: palette.muted, fontSize: 12 }}>总消费</Text>
                      <span style={{ color: palette.gold, fontSize: 22, fontWeight: 800 }}>
                        {formatMoney(data.visitorBehavior.consumption.totalAmount)}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '126px 1fr', alignItems: 'center', gap: 14 }}>
                      <Pie
                        {...asCompactDonut(visitorCostMixPie, 'value', 'type', 0.66)}
                        height={124}
                      />
                      <div style={{ display: 'grid', gap: 7 }}>
                        {data.visitorBehavior.consumption.costMix.slice(0, 5).map((item, index) => {
                          const share = item.share || (data.visitorBehavior.consumption.totalAmount ? item.amount / data.visitorBehavior.consumption.totalAmount : 0)
                          const percent = Math.round(share * 100)
                          const color = chartSeriesColors[index % chartSeriesColors.length]

                          return (
                            <div key={item.category}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, lineHeight: 1.35 }}>
                                <span style={{ color: palette.text, display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                                  <i style={{ width: 8, height: 8, borderRadius: 999, background: color, flex: '0 0 auto' }} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                                </span>
                                <span style={{ color: palette.muted, flex: '0 0 auto' }}>{percent}%</span>
                              </div>
                              <div style={{ height: 4, borderRadius: 999, background: '#1c2a3f', marginTop: 4, overflow: 'hidden' }}>
                                <div style={{ width: `${Math.max(4, percent)}%`, height: '100%', borderRadius: 999, background: color }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : <EmptyState text="暂无消费结构" />}
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
                        <span style={{ color: palette.gold }}>{item.reason.includes('评分') ? `${item.score} 分` : `${item.score} 次`}</span>
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
