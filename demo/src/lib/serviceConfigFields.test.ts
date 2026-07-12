import assert from 'node:assert/strict'
import test from 'node:test'

import { SERVICE_CONFIG_GROUPS } from './serviceConfigFields.ts'

test('service configuration form covers all five operational groups without duplicate fields', () => {
  assert.deepEqual(
    SERVICE_CONFIG_GROUPS.map((group) => group.id),
    ['llm', 'embedding', 'asr', 'tts', 'emotion'],
  )

  const fields = SERVICE_CONFIG_GROUPS.flatMap((group) => group.fields.map((field) => field.key))
  assert.equal(new Set(fields).size, fields.length)
  assert.ok(fields.includes('gpt_api_key'))
  assert.ok(fields.includes('embedding_api_key'))
  assert.ok(fields.includes('ali_nls_key_secret'))
  assert.ok(fields.includes('ms_tts_region'))
  assert.ok(fields.includes('baidu_emotion_secret_key'))
})
