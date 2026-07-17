import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')
const pageSource = readFileSync(new URL('./AdminEmergencyPage.tsx', import.meta.url), 'utf8')

test('registers emergency route and required event controls', () => {
  assert.match(appSource, /path="emergency"\s+element=\{<AdminEmergencyPage\s*\/>\}/)
  for (const label of ['临时闭园', '演出取消', '极端天气', '景点拥堵', '道路封闭', '游客走失', '医疗求助', '发布', '解除', '重试知识库同步']) {
    assert.match(pageSource, new RegExp(label))
  }
})
