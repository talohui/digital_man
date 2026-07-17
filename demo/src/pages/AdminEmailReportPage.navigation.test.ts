import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const page = readFileSync(new URL('./AdminEmailReportPage.tsx', import.meta.url), 'utf8')

test('provides a direct return to the operations overview from the report page', () => {
  assert.match(page, /ArrowLeftOutlined/)
  assert.match(page, /useNavigate/)
  assert.match(page, /返回运营总览/)
  assert.match(page, /navigate\('\/admin'\)/)
})

test('directs SMTP credential setup to the service configuration page', () => {
  assert.match(page, /服务配置页配置 QQ 发件邮箱和授权码/)
  assert.match(page, /收件人最多 20 位/)
  assert.match(page, /运营日报/)
  assert.match(page, /运营周报/)
})

test('only reports authentication success after report settings really load', () => {
  assert.match(page, /const loaded = await load\(session\.token\)/)
  assert.match(page, /if \(loaded\) message\.success\('运营报告配置已安全加载'\)/)
  assert.doesNotMatch(page, /await load\(session\.token\)\s*message\.success\('运营报告配置已安全加载'\)/)
})
