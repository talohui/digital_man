import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'
import './styles/c-app/cAppTypography.css'
import './styles/admin-ops.css'
import { initPostHogIdle } from './lib/analytics'

// PostHog 改为空闲帧懒加载,首屏不再背 ~180kB SDK
initPostHogIdle()

// 开发/调优期暂时停用 Service Worker:其 cache-first 策略会把旧资源(旧纹理/旧 JS)
// 缓存死,导致每次重新构建后手机上仍是旧版本(看着"改了没生效/还是慢/口型又不动")。
// 这里主动注销已注册的 SW 并清空其缓存,保证设备始终拿到最新构建。
// 最终提交前若要恢复离线/秒开能力,把这段换回 navigator.serviceWorker.register('/sw.js') 即可。
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations?.().then((regs) => {
    regs.forEach((r) => r.unregister())
  }).catch(() => {})
  if (typeof caches !== 'undefined') {
    caches.keys?.().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {})
  }
}

// antd 的 ConfigProvider/AntdApp 不在首屏注入(那两个 import 会把整包 antd
// 拉进 eager chunk);改为在真正用 antd 组件的页面里按需引入。
void React
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
