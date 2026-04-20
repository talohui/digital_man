import { MessageOutlined } from '@ant-design/icons'
import { Button, Card, Space, Typography } from 'antd'
import { useChatStore } from '../store/useChatStore'

const questions = [
  '灵山大佛有多高？',
  '九龙灌浴几点开始？',
  '梵宫里有什么好玩的？',
  '一日游路线怎么安排？',
  '门票包含哪些景点？',
  '怎么去抱佛脚？'
]

function QuickAsks() {
  const sendQuickAsk = useChatStore((state) => state.sendQuickAsk)

  return (
    <Card className="quick-asks-card" bordered={false}>
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <div>
          <Typography.Text className="section-kicker">
            猜你想问
          </Typography.Text>
          <Typography.Title level={5} className="quick-asks-card__title">
            一键发起热门导览问题
          </Typography.Title>
        </div>

        <div className="quick-asks-card__list">
          {questions.map((question) => (
            <Button
              key={question}
              className="quick-asks-card__button"
              icon={<MessageOutlined />}
              onClick={() => sendQuickAsk(question)}
            >
              {question}
            </Button>
          ))}
        </div>
      </Space>
    </Card>
  )
}

export default QuickAsks
