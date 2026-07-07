import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'
import { initPostHogIdle } from './lib/analytics'

// PostHog 改为空闲帧懒加载,首屏不再背 ~180kB SDK
initPostHogIdle()

// 生产环境注册 Service Worker:预缓存 vendor-* / CSS / 字体,
// 第二次访问近 0 网络请求;开发环境跳过避免 HMR 被劫持。
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* SW 注册失败不影响应用,静默 */
    })
  })
}

// antd 的 ConfigProvider/AntdApp 不在首屏注入(那两个 import 会把整包 antd
// 拉进 eager chunk);改为在真正用 antd 组件的页面里按需引入。
void React
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
