import { CloudServerOutlined } from '@ant-design/icons'
import { Avatar, Layout, Space, Tag, Typography } from 'antd'

const { Header } = Layout
const { Text, Title } = Typography

function SceneHeader() {
  return (
    <Header className="scene-header">
      <Space size={14} align="center">
        <Avatar className="scene-header__avatar">佛</Avatar>
        <div>
          <Text className="scene-header__eyebrow">灵山胜境 · AI 导览</Text>
          <Title level={4} className="scene-header__title">
            小灵导览控制台
          </Title>
        </div>
      </Space>

      <Tag className="scene-header__tag" icon={<CloudServerOutlined />}>
        powered by Fay & RAG
      </Tag>
    </Header>
  )
}

export default SceneHeader
