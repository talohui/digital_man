import MobileTicketPageV2 from './MobileTicketPageV2'

/**
 * 正式 C 端购票路由 `/ticket`。
 *
 * 复用已确认的“灵山入境仪式”体验，并继续通过 V2 的 formal 模式
 * 写入现有本地票务状态、使用 PaymentSheet 模拟支付。
 * 真实票务服务的替换边界见 docs/ticket-v2-formal-migration.md。
 */
function MobileTicketPage() {
  return <MobileTicketPageV2 mode="formal" />
}

export default MobileTicketPage
