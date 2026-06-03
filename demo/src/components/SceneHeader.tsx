import { CloudServerOutlined } from '@ant-design/icons'

function SceneHeader() {
  return (
    <header className="scene-header">
      <div className="scene-header__left">
        <div className="scene-header__avatar" aria-hidden>佛</div>
        <div>
          <span className="scene-header__eyebrow">灵山胜境 · AI 导览</span>
          <h4 className="scene-header__title">小灵导览控制台</h4>
        </div>
      </div>

      <span className="scene-header__tag">
        <CloudServerOutlined />
        powered by Fay &amp; RAG
      </span>
    </header>
  )
}

export default SceneHeader
