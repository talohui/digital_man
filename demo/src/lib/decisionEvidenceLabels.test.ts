import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatEvidenceScalar,
  localizeEvidenceValue,
  localizeGenerationSource,
  translateEvidenceField,
} from './decisionEvidenceLabels.ts'

test('translates decision evidence field names and nested JSON keys', () => {
  assert.equal(translateEvidenceField('totalMessages'), '累计对话消息')
  assert.equal(translateEvidenceField('questionCount'), '问答次数')
  assert.equal(translateEvidenceField('routeClicks'), '路线点击次数')
  assert.equal(translateEvidenceField('purchaseAmount'), '其他消费金额')
  assert.deepEqual(localizeEvidenceValue({
    topics: [{ topic: '其他咨询', count: 3 }],
  }), {
    '高频主题': [{ '主题': '其他咨询', '数量': 3 }],
  })
})

test('formats evidence values with operator-friendly Chinese units', () => {
  assert.equal(formatEvidenceScalar('positiveRatio', 0.75), '75%')
  assert.equal(formatEvidenceScalar('p90LatencyMs', 2860), '2,860 毫秒')
  assert.equal(formatEvidenceScalar('ticketRevenue', 106197), '¥106,197')
  assert.equal(formatEvidenceScalar('heatmapHot', false), '否')
  assert.equal(localizeGenerationSource('llm'), '大模型生成')
  assert.equal(localizeGenerationSource('rules'), '规则兜底')
})
