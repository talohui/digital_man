import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Col, Layout, Row, Space, Typography } from 'antd'
import ChatPanel from './components/ChatPanel'
import Live2DStage from './components/Live2DStage'
import QuickAsks from './components/QuickAsks'
import SceneHeader from './components/SceneHeader'
import AdminDashboard from './pages/AdminDashboard'
import { useChatStore } from './store/useChatStore'

const { Content } = Layout
const { Paragraph } = Typography

function App() {
  const initializeConnection = useChatStore((state) => state.initializeConnection)
  const disconnectConnection = useChatStore((state) => state.disconnectConnection)

  useEffect(() => {
    initializeConnection()

    return () => {
      disconnectConnection()
    }
  }, [disconnectConnection, initializeConnection])

  const mainPage = (
    <Layout className="app-shell">
      <div className="app-shell__glow app-shell__glow--left" />
      <div className="app-shell__glow app-shell__glow--right" />

      <SceneHeader />

      <Content className="app-content">
        <div className="hero-copy">
          <Space direction="vertical" size={4}>
            <Typography.Text className="hero-copy__eyebrow">
              LINGSHAN SMART TOUR
            </Typography.Text>
            <Typography.Title level={2} className="hero-copy__title">
              React 化的灵山胜境 AI 导览台
            </Typography.Title>
            <Paragraph className="hero-copy__desc">
              现在这套 demo 已切到 React 18 + Vite + Ant Design 5 +
              Zustand，页面结构、聊天交互与 Fay 接入点都已经按 React 工程方式重新组织。
            </Paragraph>
          </Space>
        </div>

        <Row gutter={[24, 24]} align="stretch">
          <Col xs={24} xl={15}>
            <Live2DStage />
          </Col>

          <Col xs={24} xl={9}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <QuickAsks />
              <ChatPanel />
            </Space>
          </Col>
        </Row>
      </Content>
    </Layout>
  )

  return (
    <Routes>
      <Route path="/" element={mainPage} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  )
}

export default App
