import { ArrowLeftOutlined, CompassOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_SCENE_ID } from '../store/chatSessions'

const ChatPanel = lazy(() => import('../components/ChatPanel'))
const Live2DStage = lazy(() => import('../components/Live2DStage'))

function GuideImmersivePage() {
  const navigate = useNavigate()

  return (
    <main className="immersive-guide">
      <div className="immersive-guide__aura immersive-guide__aura--left" />
      <div className="immersive-guide__aura immersive-guide__aura--right" />

      <header className="immersive-guide__topbar">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} aria-label="返回首页" />
        <div>
          <span>灵山胜境</span>
          <strong>景区数字人</strong>
        </div>
        <Button type="text" onClick={() => navigate('/guide/classic')}>经典布局</Button>
      </header>

      <div className="immersive-guide__status"><EnvironmentOutlined /> 当前导览：灵山胜境</div>

      <section className="immersive-guide__avatar" aria-label="小灵数字人">
        <Suspense fallback={<div className="immersive-guide__loading">小灵正在准备讲解…</div>}>
          <Live2DStage variant="immersive" eager sceneId={DEFAULT_SCENE_ID} />
        </Suspense>
      </section>

      <Button
        className="immersive-guide__map-action"
        type="text"
        icon={<CompassOutlined />}
        onClick={() => navigate('/map')}
      >
        地图导览
      </Button>

      <section className="immersive-guide__chat" aria-label="与小灵对话">
        <Suspense fallback={null}>
          <ChatPanel sceneId={DEFAULT_SCENE_ID} />
        </Suspense>
      </section>
    </main>
  )
}

export default GuideImmersivePage
