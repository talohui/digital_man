// B 端(运营驾驶舱)登录鉴权。
// 演示级:前端校验固定账号 + localStorage 标记会话。
// 生产环境应改为后端签发 token(analytics-server 加鉴权接口),前端只存 token。

const TOKEN_KEY = 'lingshan_admin_token'

// 演示账号(部署前请改/移除)
const ACCOUNTS: Record<string, string> = {
  admin: 'lingshan2026'
}

export function isAdminAuthed(): boolean {
  return !!localStorage.getItem(TOKEN_KEY)
}

export function adminLogin(user: string, pwd: string): boolean {
  if (ACCOUNTS[user] && ACCOUNTS[user] === pwd) {
    // 演示 token:base64(用户名:登录时间)。生产应换成后端 JWT。
    localStorage.setItem(TOKEN_KEY, btoa(`${user}:${Date.now()}`))
    return true
  }
  return false
}

export function adminLogout(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function getAdminUser(): string {
  const t = localStorage.getItem(TOKEN_KEY)
  if (!t) return ''
  try {
    return atob(t).split(':')[0] || ''
  } catch {
    return ''
  }
}
