import { Navigate } from 'react-router-dom'
import { useTicketStore } from '../store/useTicketStore'
import MobileConsumePageV2 from './MobileConsumePageV2'

/**
 * 正式 C 端消费路由 `/consume`。
 *
 * 未购票时直接进入新的“灵山入境仪式”购票流程；已购票后使用已确认的雅集消费体验，
 * 订单仍通过 useTicketStore 记账，支付仍由 PaymentSheet 模拟完成。
 */
function MobileConsumePage() {
  const ticket = useTicketStore((state) => state.ticketProfile)

  if (!ticket) {
    return <Navigate replace to="/ticket?from=consume" />
  }

  return <MobileConsumePageV2 mode="formal" />
}

export default MobileConsumePage
