export type UploadOperation = 'created' | 'replaced' | 'unchanged'

export type UploadQuality = {
  status: string
  characterCount: number
  headingCount: number
  tableCount: number
  pageCount: number
  chunkCount: number
  topics: string[]
  spots: string[]
  warnings: string[]
  retrieval: {
    passed: boolean
    passedCount: number
    probeCount: number
    probes: Array<{ query: string; matched: boolean }>
    status?: string
  }
}

export function describeUploadOperation(operation: UploadOperation) {
  if (operation === 'replaced') return '已替换旧版本'
  if (operation === 'unchanged') return '内容未变化'
  return '新增入库'
}

export function summarizeUploadQuality(quality: UploadQuality) {
  const structureParts = [
    `${quality.characterCount.toLocaleString('zh-CN')} 字`,
    `${quality.headingCount} 个标题`
  ]
  if (quality.tableCount > 0) structureParts.push(`${quality.tableCount} 个表格`)
  if (quality.pageCount > 0) structureParts.push(`${quality.pageCount} 页`)
  return {
    retrievalLabel: quality.retrieval.passed ? '已验证可检索' : '检索验证未通过',
    structureLabel: structureParts.join(' · '),
    probeLabel: quality.retrieval.probeCount > 0
      ? `${quality.retrieval.passedCount} / ${quality.retrieval.probeCount} 个检索探针命中`
      : '内容未变化，无需重复验证'
  }
}
