export default function AdminMobileNotice({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="admin-notice">
      <div className="admin-notice__card">
        <div className="admin-notice__icon">🖥️</div>
        <h1 className="admin-notice__title">灵山运营驾驶舱</h1>
        <p className="admin-notice__sub">AI GUIDE OPERATIONS</p>
        <p className="admin-notice__text">
          这是 B 端运营大屏,包含多列实时数据看板,
          建议在<strong>电脑浏览器</strong>或手机<strong>横屏</strong>下查看,以获得完整体验。
        </p>
        <button className="admin-notice__btn" type="button" onClick={onContinue}>
          仍要在手机查看
        </button>
        <a className="admin-notice__back" href="/">
          返回游客首页
        </a>
      </div>
    </div>
  )
}
