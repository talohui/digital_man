import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** 自定义降级 UI;默认显示"加载失败,点击重试" */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: unknown
}

/**
 * 路由级错误边界:
 * - lazy chunk 加载失败(移动 4G 闪断)时不再白屏;
 * - 显示重试按钮,reload 重新触发 dynamic import。
 */
class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: unknown) {
    // 简单上报到 console;真有 sentry 等再补
    // eslint-disable-next-line no-console
    console.error('[RouteErrorBoundary]', error)
  }

  private handleRetry = () => {
    // 重置边界,React 会重新渲染并再次触发 lazy import
    this.setState({ hasError: false, error: null })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback

    const message =
      this.state.error instanceof Error ? this.state.error.message : '加载失败'

    return (
      <div className="route-error-boundary">
        <div className="route-error-boundary__card">
          <span className="route-error-boundary__icon" aria-hidden>
            ⚠
          </span>
          <h3>这个页面没加载出来</h3>
          <p>网络可能不稳定。{message ? `(${message})` : ''}</p>
          <div className="route-error-boundary__actions">
            <button type="button" onClick={this.handleRetry}>
              再试一次
            </button>
            <button
              type="button"
              className="route-error-boundary__secondary"
              onClick={this.handleReload}
            >
              整页刷新
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default RouteErrorBoundary
