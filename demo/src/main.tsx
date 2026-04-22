import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import posthog from 'posthog-js'
import App from './App'
import './styles/global.css'
import { POSTHOG_KEY, POSTHOG_HOST } from './lib/analytics'

// 初始化 PostHog（Key 为空时跳过，analytics-server 通道仍正常）
if (POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,       // 关闭自动点击采集，只保留手动埋点
    persistence: 'localStorage',
  })
}

// 暂时不用 StrictMode 包,避免开发模式下 useEffect 双跑导致 WS / Live2D
// 双初始化(Fay 部分版本会把消息只推给第一个连上的 socket)。
// 上线前可以再加回来。
void React
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1b5e20',
          colorInfo: '#1b5e20',
          colorSuccess: '#2f7d35',
          colorWarning: '#d97706',
          colorBgBase: '#fafaed',
          colorTextBase: '#2c3e50',
          borderRadius: 18,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }
      }}
    >
      <App />
    </ConfigProvider>
  </BrowserRouter>
)
