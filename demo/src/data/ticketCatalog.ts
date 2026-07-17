export type TicketCatalogId = 'adult' | 'concession' | 'free' | 'online_bundle' | 'shuttle'

export type TicketCatalogItem = {
  id: TicketCatalogId
  label: string
  price: number
  eligibility: string
  description: string
  kind: 'entry' | 'add_on'
}

/** Single source of truth for ticket selection, payment and Xiaoling's fare explanation. */
export const TICKET_CATALOG: TicketCatalogItem[] = [
  { id: 'adult', label: '成人票', price: 210, eligibility: '18 周岁以上成年人', description: '灵山胜境入园门票', kind: 'entry' },
  { id: 'concession', label: '半价票', price: 105, eligibility: '6–18 周岁、全日制本科及以下学生、60–69 周岁老人', description: '入园时需按规则核验资格', kind: 'entry' },
  { id: 'free', label: '免费票', price: 0, eligibility: '6 周岁以下或 1.4 米以下儿童、70 周岁以上、现役军人、残疾人', description: '入园时需按规则核验资格', kind: 'entry' },
  { id: 'online_bundle', label: '网购联票', price: 225, eligibility: '门票 + 观光车', description: '含景区观光车，可不限次乘坐', kind: 'entry' },
  { id: 'shuttle', label: '观光车单独购票', price: 40, eligibility: '景区内交通', description: '适合少走路、轻松游览', kind: 'add_on' }
]

export function getTicketCatalogItem(id: TicketCatalogId): TicketCatalogItem {
  const item = TICKET_CATALOG.find((ticket) => ticket.id === id)
  if (!item) throw new Error(`Unknown ticket catalog item: ${id}`)
  return item
}

export function getTicketCatalogPrompt() {
  return TICKET_CATALOG.map((ticket) => {
    const price = ticket.price === 0 ? '¥0' : `¥${ticket.price}${ticket.id === 'shuttle' ? '/人' : ''}`
    return `${ticket.label} ${price}，适用${ticket.eligibility}，${ticket.description}`
  }).join('；')
}
