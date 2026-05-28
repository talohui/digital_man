import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TicketAgeBand = '18-24' | '25-34' | '35-44' | '45-59' | '60+'
export type TicketGender = '男' | '女' | '不便透露'
export type TicketType = 'standard' | 'family' | 'culture' | 'blessing' | 'leisure'
export type PurchaseCategory = 'food' | 'shopping' | 'transport' | 'entertainment'

export type TicketInput = {
  ageBand: TicketAgeBand
  gender: TicketGender
  groupSize: number
  visitDate: string
  ticketType: TicketType
}

export type TicketProfile = TicketInput & {
  ticketId: string
  ticketCost: number
  createdAt: string
}

export type PurchaseInput = {
  category: PurchaseCategory
  amount: number
  spotId?: string
  routeId?: string
  ticketId?: string
}

export type PurchaseRecord = PurchaseInput & {
  id: string
  createdAt: string
}

export const ticketTypeOptions: Array<{ id: TicketType; label: string; description: string; price: number }> = [
  { id: 'standard', label: '标准票', description: '适合首次入园，完整导览', price: 210 },
  { id: 'family', label: '亲子套票', description: '同行节奏更轻松', price: 398 },
  { id: 'culture', label: '文化深度票', description: '偏重历史建筑讲解', price: 238 },
  { id: 'blessing', label: '祈福体验票', description: '偏重礼佛与静心路线', price: 268 },
  { id: 'leisure', label: '轻松漫步票', description: '少排队、少折返', price: 198 },
]

export const purchaseCategoryLabels: Record<PurchaseCategory, string> = {
  food: '餐饮',
  shopping: '文创',
  transport: '交通',
  entertainment: '演艺',
}

type TicketState = {
  ticketProfile: TicketProfile | null
  purchases: PurchaseRecord[]
  submitTicket: (input: TicketInput) => TicketProfile
  addPurchase: (input: PurchaseInput) => PurchaseRecord
  totalSpend: () => number
  spendByCategory: () => Record<PurchaseCategory, number>
}

function createId(prefix: string) {
  const randomId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${randomId}`
}

function normalizeGroupSize(value: number) {
  if (!Number.isFinite(value)) return 1
  return Math.max(1, Math.min(5, Math.round(value)))
}

function ticketPrice(ticketType: TicketType) {
  return ticketTypeOptions.find((item) => item.id === ticketType)?.price ?? 210
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      ticketProfile: null,
      purchases: [],
      submitTicket: (input) => {
        const ticket: TicketProfile = {
          ...input,
          groupSize: normalizeGroupSize(input.groupSize),
          ticketId: createId('ticket'),
          ticketCost: ticketPrice(input.ticketType),
          createdAt: new Date().toISOString(),
        }
        set({ ticketProfile: ticket, purchases: [] })
        return ticket
      },
      addPurchase: (input) => {
        const record: PurchaseRecord = {
          ...input,
          amount: Math.max(0, Math.round(input.amount * 100) / 100),
          id: createId('purchase'),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ purchases: [record, ...state.purchases].slice(0, 30) }))
        return record
      },
      totalSpend: () => get().purchases.reduce((sum, item) => sum + item.amount, 0),
      spendByCategory: () => get().purchases.reduce<Record<PurchaseCategory, number>>(
        (acc, item) => {
          acc[item.category] += item.amount
          return acc
        },
        { food: 0, shopping: 0, transport: 0, entertainment: 0 }
      ),
    }),
    {
      name: 'lingshan-ticket-store',
      partialize: (state) => ({
        ticketProfile: state.ticketProfile,
        purchases: state.purchases,
      }),
    }
  )
)
