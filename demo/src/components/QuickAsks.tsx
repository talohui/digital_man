import { MessageOutlined } from '@ant-design/icons'
import { useChatStore } from '../store/useChatStore'

const defaultQuestions = [
  '灵山大佛有多高？',
  '九龙灌浴几点开始？',
  '梵宫里有什么好玩的？',
  '一日游路线怎么安排？',
  '门票包含哪些景点？',
  '怎么去抱佛脚？'
]

type QuickAsksProps = {
  questions?: string[]
  title?: string
  subtitle?: string
  sceneId?: string
}

function QuickAsks({
  questions = defaultQuestions,
  title = '一键发起热门导览问题',
  subtitle = '猜你想问',
  sceneId
}: QuickAsksProps) {
  const sendQuickAsk = useChatStore((state) => state.sendQuickAsk)

  return (
    <section className="quick-asks-card">
      <div className="quick-asks-card__stack">
        <div>
          <span className="section-kicker">{subtitle}</span>
          <h5 className="quick-asks-card__title">{title}</h5>
        </div>

        <div className="quick-asks-card__list">
          {questions.map((question) => (
            <button
              key={question}
              type="button"
              className="quick-asks-card__button"
              onClick={() => sendQuickAsk(question, sceneId)}
            >
              <MessageOutlined />
              <span>{question}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default QuickAsks
