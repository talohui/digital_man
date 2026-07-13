// FR-B3.4 运营报告导出:把运营驾驶舱当前数据导出为 Excel(多 Sheet)或 PDF。
// - Excel:SheetJS 生成真正的 .xlsx 多工作表,字段即所见数据,无编码/格式坑。
// - PDF:渲染一份浅色、带灵山烫金品牌的独立报告页,新窗口打开并触发打印 →「另存为 PDF」。
//   走浏览器打印管线,中文为矢量、零字体嵌入烦恼,排版可控且专业。
//
// 入参 ReportData 是 AdminDashboard 的 DashboardData 的结构子集(TS 结构化类型,
// 直接把整份 data 传进来即可),只取适合成文的核心板块。

import * as XLSX from 'xlsx'

export interface ReportMeta {
  /** 报告标题,如「灵山胜境 AI 导览 · 运营日报」 */
  title: string
  /** 生成时间(已格式化字符串) */
  generatedAt: string
  /** 游客数据口径标签,如「实时」/「历史」 */
  visitorModeLabel: string
}

export interface ReportData {
  overview: {
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
  service: {
    p50LatencyMs: number
    p90LatencyMs: number
    maxLatencyMs: number
    avgLatencyMs: number
    voiceCompletionRate: number
    estimatedAnswerRate: number
    recentSlowReplies: Array<{ timestamp: string; latencyMs: number; sessionId: string }>
  }
  chat: {
    topQuestions: Array<{ question: string; count: number }>
    keywordStats: Array<{ keyword: string; count: number }>
    negativeQuestionCount: number
  }
  sentimentTrend: Array<{ hour: string; positive: number; negative: number; neutral: number }>
  visitorBehavior: {
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
    attractions: { visits: Array<{ name: string; count: number; avgStayHours?: number }> }
  }
  official: {
    summary: {
      sourceLabel: string
      disclaimer: string
      sampleCount: number
      avgSatisfaction: number
      avgStayHours: number
      avgSpend: number
      dateRange: { start: string; end: string; dayCount: number }
    }
    attractionTypes: {
      items: Array<{
        type: string
        visitCount: number
        visitRatio: number
        avgSatisfaction: number
        avgStayHours: number
        avgSpend: number
      }>
    }
  }
}

// ---------- 格式化 ----------

const pct = (v: number) => `${Math.round((v || 0) * 100)}%`
const ms = (v: number) => `${Math.round(v || 0)} ms`
const num = (v: number) => (v == null ? '' : v)
const fixed1 = (v: number) => (v == null ? '' : Number(v).toFixed(1))
const yuan = (v: number) => `¥${Math.round(v || 0).toLocaleString('zh-CN')}`

type Cell = string | number
type Aoa = Cell[][]

// 概览 KPI 列表(指标 / 数值),Excel 与 PDF 共用
function overviewRows(d: ReportData): Array<[string, string | number]> {
  const o = d.overview
  return [
    ['累计对话消息', o.totalMessages],
    ['AI 回复数', o.totalAiReplies],
    ['近 5 分钟活跃会话', o.activeSessions5min],
    ['正面情绪率', pct(o.positiveRatio)],
    ['平均响应时延', ms(o.avgLatencyMs)],
    ['P90 响应时延', ms(o.p90LatencyMs)],
    ['快捷提问次数', o.quickAskCount],
    ['语音使用次数', o.voiceUseCount],
    ['路线点击次数', o.routeClickCount],
    ['反馈数', o.feedbackCount],
  ]
}

function serviceRows(d: ReportData): Array<[string, string | number]> {
  const s = d.service
  return [
    ['P50 响应时延', ms(s.p50LatencyMs)],
    ['P90 响应时延', ms(s.p90LatencyMs)],
    ['最大响应时延', ms(s.maxLatencyMs)],
    ['平均响应时延', ms(s.avgLatencyMs)],
    ['语音完成率', pct(s.voiceCompletionRate)],
    ['预估回答率', pct(s.estimatedAnswerRate)],
  ]
}

function visitorRows(d: ReportData): Array<[string, string | number]> {
  const v = d.visitorBehavior.summary
  return [
    ['数据口径', d.visitorBehavior.sourceLabel],
    ['统计样本数', d.visitorBehavior.sampleCount],
    ['时间范围', d.visitorBehavior.timeRangeLabel],
    ['游客数', v.visitorCount],
    ['预计客流', v.expectedVisitors],
    ['平均团队规模', fixed1(v.avgGroupSize)],
    ['平均停留时长(小时)', fixed1(v.avgStayHours)],
    ['人均消费', yuan(v.avgSpend)],
    ['平均满意度(/100)', fixed1(v.avgSatisfaction)],
    ['门票收入', yuan(v.ticketRevenue)],
  ]
}

function officialSummaryRows(d: ReportData): Array<[string, string | number]> {
  const s = d.official.summary
  const dr = s.dateRange
  return [
    ['数据来源', s.sourceLabel],
    ['样本数', s.sampleCount],
    ['平均满意度(/100)', fixed1(s.avgSatisfaction)],
    ['平均停留时长(小时)', fixed1(s.avgStayHours)],
    ['人均消费', yuan(s.avgSpend)],
    ['样本时间范围', dr.start && dr.end ? `${dr.start} ~ ${dr.end}(${dr.dayCount} 天)` : '—'],
  ]
}

// ---------- Excel 导出 ----------

function sheetFromKpi(rows: Array<[string, string | number]>): XLSX.WorkSheet {
  const aoa: Aoa = [['指标', '数值'], ...rows]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [{ wch: 22 }, { wch: 28 }]
  return ws
}

export function exportDashboardExcel(data: ReportData, meta: ReportMeta) {
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, sheetFromKpi(overviewRows(data)), '运营概览')
  XLSX.utils.book_append_sheet(wb, sheetFromKpi(serviceRows(data)), '服务质量')

  // 情感趋势
  const sentimentAoa: Aoa = [
    ['时间', '正面', '负面', '中性'],
    ...data.sentimentTrend.map((r) => [r.hour, num(r.positive), num(r.negative), num(r.neutral)]),
  ]
  const sentimentWs = XLSX.utils.aoa_to_sheet(sentimentAoa)
  sentimentWs['!cols'] = [{ wch: 18 }, { wch: 8 }, { wch: 8 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, sentimentWs, '情感趋势')

  // 热门问题
  const questionAoa: Aoa = [
    ['排名', '问题', '次数'],
    ...data.chat.topQuestions.map((q, i) => [i + 1, q.question, num(q.count)]),
  ]
  const questionWs = XLSX.utils.aoa_to_sheet(questionAoa)
  questionWs['!cols'] = [{ wch: 6 }, { wch: 50 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, questionWs, '热门问题')

  // 关键词
  const keywordAoa: Aoa = [
    ['关键词', '次数'],
    ...data.chat.keywordStats.map((k) => [k.keyword, num(k.count)]),
  ]
  const keywordWs = XLSX.utils.aoa_to_sheet(keywordAoa)
  keywordWs['!cols'] = [{ wch: 24 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, keywordWs, '热门关键词')

  // 游客行为(概览 + 景点访问)
  const visitorAoa: Aoa = [
    ['指标', '数值'],
    ...visitorRows(data),
    [],
    ['景点', '访问次数', '平均停留(小时)'],
    ...data.visitorBehavior.attractions.visits.map((a) => [
      a.name,
      num(a.count),
      a.avgStayHours != null ? fixed1(a.avgStayHours) : '',
    ]),
  ]
  const visitorWs = XLSX.utils.aoa_to_sheet(visitorAoa)
  visitorWs['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, visitorWs, '游客行为')

  // 官方行业基线
  const officialAoa: Aoa = [
    ['指标', '数值'],
    ...officialSummaryRows(data),
    [],
    ['景区类型', '访问数', '占比', '满意度', '平均停留(小时)', '人均消费'],
    ...data.official.attractionTypes.items.map((it) => [
      it.type,
      num(it.visitCount),
      pct(it.visitRatio),
      fixed1(it.avgSatisfaction),
      fixed1(it.avgStayHours),
      yuan(it.avgSpend),
    ]),
  ]
  const officialWs = XLSX.utils.aoa_to_sheet(officialAoa)
  officialWs['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 16 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, officialWs, '官方基线')

  // 元信息页
  const metaWs = XLSX.utils.aoa_to_sheet([
    ['灵山胜境 AI 导览 · 运营报告'],
    ['报告标题', meta.title],
    ['生成时间', meta.generatedAt],
    ['游客数据口径', meta.visitorModeLabel],
    [],
    [data.official.summary.disclaimer],
  ])
  metaWs['!cols'] = [{ wch: 16 }, { wch: 60 }]
  XLSX.utils.book_append_sheet(wb, metaWs, '说明')

  const fname = `灵山运营报告_${meta.generatedAt.replace(/[:\s/]/g, '-')}.xlsx`
  XLSX.writeFile(wb, fname)
}

// ---------- PDF 导出(浏览器打印 → 另存为 PDF) ----------

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

function kpiTable(rows: Array<[string, string | number]>): string {
  return `<table class="kv">${rows
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
    .join('')}</table>`
}

function dataTable(headers: string[], rows: Cell[][]): string {
  if (!rows.length) return `<p class="empty">暂无数据</p>`
  return `<table class="grid">
    <thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
      .join('')}</tbody>
  </table>`
}

function buildReportHtml(data: ReportData, meta: ReportMeta): string {
  const kpiCards = overviewRows(data)
    .slice(0, 6)
    .map(
      ([k, v]) =>
        `<div class="card"><div class="card-v">${esc(v)}</div><div class="card-k">${esc(k)}</div></div>`
    )
    .join('')

  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8" />
<title>${esc(meta.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
    color: #1f2a37; margin: 0; padding: 32px 36px; background: #fff; }
  .head { border-bottom: 3px solid #b8860b; padding-bottom: 14px; margin-bottom: 22px; }
  .brand { color: #b8860b; font-weight: 700; letter-spacing: 4px; font-size: 13px; }
  h1 { font-size: 24px; margin: 6px 0 4px; }
  .meta { color: #6b7280; font-size: 12px; }
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0 26px; }
  .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px;
    background: linear-gradient(180deg, #fffdf7, #fbf6e9); }
  .card-v { font-size: 22px; font-weight: 700; color: #1f2a37; }
  .card-k { font-size: 12px; color: #6b7280; margin-top: 4px; }
  h2 { font-size: 15px; margin: 26px 0 10px; padding-left: 10px; border-left: 4px solid #b8860b; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  table.kv th { text-align: left; width: 38%; color: #6b7280; font-weight: 500;
    padding: 7px 10px; border-bottom: 1px solid #f0f0f0; }
  table.kv td { padding: 7px 10px; border-bottom: 1px solid #f0f0f0; font-weight: 600; }
  table.grid th { background: #f7f3e8; color: #5b4a1f; text-align: left; padding: 8px 10px;
    border: 1px solid #ece3cc; font-weight: 600; }
  table.grid td { padding: 7px 10px; border: 1px solid #eef0f2; }
  table.grid tbody tr:nth-child(even) { background: #fafafa; }
  .empty { color: #9aa3af; font-size: 12px; padding: 8px 0; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .foot { margin-top: 30px; padding-top: 12px; border-top: 1px solid #eee;
    color: #9aa3af; font-size: 11px; line-height: 1.6; }
  @media print { body { padding: 0; } @page { margin: 16mm; } h2 { break-after: avoid; }
    table { break-inside: auto; } tr { break-inside: avoid; } }
</style></head><body>
  <div class="head">
    <div class="brand">LINGSHAN · AI GUIDE OPERATIONS</div>
    <h1>${esc(meta.title)}</h1>
    <div class="meta">生成时间：${esc(meta.generatedAt)} ｜ 游客数据口径：${esc(meta.visitorModeLabel)}</div>
  </div>

  <div class="cards">${kpiCards}</div>

  <div class="two">
    <div><h2>运营概览</h2>${kpiTable(overviewRows(data))}</div>
    <div><h2>服务质量</h2>${kpiTable(serviceRows(data))}</div>
  </div>

  <h2>情感趋势</h2>
  ${dataTable(
    ['时间', '正面', '负面', '中性'],
    data.sentimentTrend.map((r) => [r.hour, r.positive, r.negative, r.neutral])
  )}

  <div class="two">
    <div><h2>热门问题</h2>${dataTable(
      ['#', '问题', '次数'],
      data.chat.topQuestions.map((q, i) => [i + 1, q.question, q.count])
    )}</div>
    <div><h2>热门关键词</h2>${dataTable(
      ['关键词', '次数'],
      data.chat.keywordStats.map((k) => [k.keyword, k.count])
    )}</div>
  </div>

  <h2>游客行为概览（${esc(data.visitorBehavior.sourceLabel)}）</h2>
  ${kpiTable(visitorRows(data))}
  ${dataTable(
    ['景点', '访问次数', '平均停留(小时)'],
    data.visitorBehavior.attractions.visits.map((a) => [
      a.name,
      a.count,
      a.avgStayHours != null ? fixed1(a.avgStayHours) : '—',
    ])
  )}

  <h2>官方行业基线</h2>
  ${kpiTable(officialSummaryRows(data))}
  ${dataTable(
    ['景区类型', '访问数', '占比', '满意度', '平均停留(小时)', '人均消费'],
    data.official.attractionTypes.items.map((it) => [
      it.type,
      it.visitCount,
      pct(it.visitRatio),
      fixed1(it.avgSatisfaction),
      fixed1(it.avgStayHours),
      yuan(it.avgSpend),
    ])
  )}

  <div class="foot">${esc(data.official.summary.disclaimer)}<br/>本报告由灵山胜境 AI 导览运营驾驶舱自动生成。</div>
</body></html>`
}

export function exportDashboardPdf(data: ReportData, meta: ReportMeta) {
  const html = buildReportHtml(data, meta)
  const win = window.open('', '_blank', 'width=900,height=1000')
  if (!win) {
    // 弹窗被拦截:退化为同窗 Blob 预览,用户可自行打印
    const blob = new Blob([html], { type: 'text/html' })
    window.open(URL.createObjectURL(blob), '_blank')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
  // 等待字体/布局就绪再唤起打印对话框(用户在其中选「另存为 PDF」)
  win.focus()
  setTimeout(() => {
    try {
      win.print()
    } catch {
      /* 用户可手动打印 */
    }
  }, 350)
}
