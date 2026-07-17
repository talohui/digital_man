import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const page = readFileSync(new URL('./AdminServiceConfigPage.tsx', import.meta.url), 'utf8')

test('embeds email-report settings in the verified AI service configuration workspace', () => {
  assert.match(page, /运营邮件（QQ SMTP）/)
  assert.match(page, /发件人邮箱/)
  assert.match(page, /QQ 授权码/)
  assert.match(page, /fetchEmailReportSettings/)
  assert.match(page, /updateEmailReportSmtpSettings/)
  assert.match(page, /保存 QQ SMTP 配置/)
  assert.match(page, /前往运营报告/)
  assert.doesNotMatch(page, /收件人/)
  assert.doesNotMatch(page, /每日自动发送/)
  assert.doesNotMatch(page, /每周自动发送/)
  assert.doesNotMatch(page, /保存发送计划/)
})

test('embeds encrypted Tencent weather settings in the verified AI service configuration workspace', () => {
  assert.match(page, /腾讯天气（WebService）/)
  assert.match(page, /fetchWeatherSettings/)
  assert.match(page, /updateWeatherSettings/)
  assert.match(page, /加密保存并立即应用/)
})
