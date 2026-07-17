import MobileProfilePageV2 from './MobileProfilePageV2'

/**
 * 正式 C 端个人中心路由 `/me`。
 *
 * 页面直接复用已确认的行旅档案体验，读取现有票务、订单、
 * 游历与偏好状态，不改写票务和订单核心逻辑。
 */
function MobileProfilePage() {
  return <MobileProfilePageV2 />
}

export default MobileProfilePage
