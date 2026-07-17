type ConsumeXiaolingPickButtonProps = {
  onClick: () => void
}

function ConsumeXiaolingPickButton({ onClick }: ConsumeXiaolingPickButtonProps) {
  return (
    <section className="consume-xiaoling-pick" aria-label="小灵消费推荐">
      <button type="button" onClick={onClick}>
        <span>让小灵帮我挑</span>
        <i aria-hidden="true">›</i>
      </button>
    </section>
  )
}

export default ConsumeXiaolingPickButton
