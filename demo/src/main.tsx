import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'

// 暂时不用 StrictMode 包,避免开发模式下 useEffect 双跑导致 WS / Live2D
// 双初始化(Fay 部分版本会把消息只推给第一个连上的 socket)。
// 上线前可以再加回来。
void React
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
