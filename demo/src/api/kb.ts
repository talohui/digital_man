import { getKbApiBase } from '../lib/runtimeConfig'
import type { UploadOperation, UploadQuality } from '../lib/kbUploadQuality'

const BASE = getKbApiBase()

export type KbDocument = {
  name: string
  category: string
  chunkCount: number
  uploadedAt: string
}

export type KbStats = {
  documentCount: number
  chunkCount: number
  faqCount: number
  lastDocUpdatedAt: string
  faqUpdatedAt: string
  collection: string
  embedModel: string
  documents?: KbDocument[]
}

export type FaqItem = {
  id: string
  question: string
  answer: string
  tags?: string[]
}

export type UploadResult = {
  result: string
  operation: UploadOperation
  docId: string
  docName: string
  category: string
  chunkCount: number
  quality: UploadQuality
  stats: KbStats
}

async function asJson<T>(res: Response): Promise<T> {
  let data: any = null
  try {
    data = await res.json()
  } catch {
    throw new Error(`知识库服务返回异常（HTTP ${res.status}）`)
  }
  if (!res.ok || (data?.result && data.result !== 'successful')) {
    throw new Error(data?.message || `请求失败（HTTP ${res.status}）`)
  }
  return data as T
}

export async function fetchKbStats(): Promise<KbStats> {
  return asJson<KbStats>(await fetch(`${BASE}/kb/stats`))
}

export async function uploadKbDocument(file: File, category?: string): Promise<UploadResult> {
  const form = new FormData()
  form.append('file', file)
  if (category && category.trim()) {
    form.append('category', category.trim())
  }
  return asJson<UploadResult>(
    await fetch(`${BASE}/kb/upload`, { method: 'POST', body: form })
  )
}

export async function fetchFaqList(): Promise<FaqItem[]> {
  const data = await asJson<{ faqs: FaqItem[] }>(await fetch(`${BASE}/kb/faq`))
  return data.faqs
}

export async function createFaq(input: {
  question: string
  answer: string
  tags?: string[]
}): Promise<FaqItem> {
  const data = await asJson<{ faq: FaqItem }>(
    await fetch(`${BASE}/kb/faq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
  )
  return data.faq
}

export async function updateFaq(
  id: string,
  input: { question?: string; answer?: string; tags?: string[] }
): Promise<FaqItem> {
  const data = await asJson<{ faq: FaqItem }>(
    await fetch(`${BASE}/kb/faq/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
  )
  return data.faq
}

export async function deleteFaq(id: string): Promise<void> {
  await asJson(
    await fetch(`${BASE}/kb/faq/${encodeURIComponent(id)}`, { method: 'DELETE' })
  )
}
