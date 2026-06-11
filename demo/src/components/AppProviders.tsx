import type { ReactNode } from 'react'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

type AppProvidersProps = {
  children: ReactNode
}

function AppProviders({ children }: AppProvidersProps) {
  return (
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
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  )
}

export default AppProviders
