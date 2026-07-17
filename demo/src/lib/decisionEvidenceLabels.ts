const FIELD_LABELS: Record<string, string> = {
  totalMessages: '累计对话消息',
  totalAiReplies: '累计 AI 回复',
  questionCount: '问答次数',
  negativeRatio: '负面情绪占比',
  routeExposures: '路线曝光次数',
  routeClicks: '路线点击次数',
  spotVisits: '景点到访次数',
  ticketAmount: '门票消费金额',
  purchaseAmount: '其他消费金额',
  averageRating: '平均评分',
  positiveRatio: '正面情绪率',
  p90LatencyMs: 'P90 响应延迟',
  avgLatencyMs: '平均响应延迟',
  maxLatencyMs: '最大响应延迟',
  topics: '高频主题',
  heatmapHot: '热力图热区',
  hottestSpot: '最热景点',
  hottestSpotVisits: '最热景点客流',
  personaTags: '游客画像标签',
  topConsumptionCategory: '消费最高品类',
  totalConsumptionAmount: '消费总额',
  activeEmergencies: '当前应急事件',
  consumptionSignal: '消费信号',
  available: '是否有数据',
  topCategory: '主要消费品类',
  sourceLabel: '数据来源',
  historicalBaseline: '历史基线',
  categoryShare: '品类占比',
  averageSpend: '人均消费',
  ticketPurchaseCount: '购票人数',
  ticketRevenue: '门票收入',
  ancillaryAmount: '其他消费金额',
  topic: '主题',
  count: '数量',
  negativeCount: '负面数量',
  samples: '示例问题',
}

export function translateEvidenceField(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key]
  return key
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/\b(id|url|api|json|ms|p\d+)\b/gi, (part) => part.toUpperCase())
}

export function localizeEvidenceValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(localizeEvidenceValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        translateEvidenceField(key),
        localizeEvidenceValue(nested),
      ]),
    )
  }
  return value
}

const RATIO_FIELDS = /(?:ratio|share|rate)$/i
const LATENCY_FIELDS = /latencyms$/i
const MONEY_FIELDS = /(?:amount|spend|revenue|cost)$/i

export function formatEvidenceScalar(key: string, value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === '') return '暂无数据'
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'number') {
    if (RATIO_FIELDS.test(key)) {
      const percentage = value * 100
      return `${Number.isInteger(percentage) ? percentage : percentage.toFixed(1)}%`
    }
    const formatted = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(value)
    if (LATENCY_FIELDS.test(key)) return `${formatted} 毫秒`
    if (MONEY_FIELDS.test(key)) return `¥${formatted}`
    return formatted
  }
  return value
}

export function localizeGenerationSource(value: string): string {
  return ({ llm: '大模型生成', rules: '规则兜底', demo: '演示样例' } as Record<string, string>)[value] ?? value
}
