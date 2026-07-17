import assert from 'node:assert/strict'
import test from 'node:test'
import { FAY_FEMALE_VOICE_OPTIONS } from './fayVoices.ts'

test('lists the curated Aliyun NLS female voices used by Fay', () => {
  assert.deepEqual(
    FAY_FEMALE_VOICE_OPTIONS.map((voice) => voice.id),
    ['zhimiao_emo', 'zhimi_emo', 'zhiyan_emo', 'zhitian_emo', 'zhixiaoxia', 'zhixiaomei']
  )
  assert.ok(FAY_FEMALE_VOICE_OPTIONS.every((voice) => voice.provider === 'aliyun-nls'))
})
