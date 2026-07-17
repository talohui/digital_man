import assert from 'node:assert/strict'
import test from 'node:test'

import { describeUploadOperation, summarizeUploadQuality } from './kbUploadQuality.ts'


test('describes created, replaced and unchanged uploads clearly', () => {
  assert.equal(describeUploadOperation('created'), '新增入库')
  assert.equal(describeUploadOperation('replaced'), '已替换旧版本')
  assert.equal(describeUploadOperation('unchanged'), '内容未变化')
})

test('summarizes verified retrieval and parsed structure', () => {
  const summary = summarizeUploadQuality({
    status: 'ready',
    characterCount: 1280,
    headingCount: 6,
    tableCount: 1,
    pageCount: 0,
    chunkCount: 8,
    topics: ['服务信息'],
    spots: ['灵山大佛'],
    warnings: [],
    retrieval: {
      passed: true,
      passedCount: 2,
      probeCount: 3,
      probes: []
    }
  })

  assert.equal(summary.retrievalLabel, '已验证可检索')
  assert.equal(summary.structureLabel, '1,280 字 · 6 个标题 · 1 个表格')
  assert.equal(summary.probeLabel, '2 / 3 个检索探针命中')
})

