import assert from 'node:assert/strict'
import test from 'node:test'

import { buildServiceConfigUpdate } from '../lib/serviceConfigUpdate.ts'

test('buildServiceConfigUpdate omits untouched masked secrets', () => {
  const update = buildServiceConfigUpdate(
    {
      gpt_model_engine: 'qwen-plus',
      gpt_api_key: '••••1234',
    },
    {
      gpt_model_engine: 'qwen-max',
      gpt_api_key: '••••1234',
    },
  )

  assert.deepEqual(update, { gpt_model_engine: 'qwen-max' })
})

test('buildServiceConfigUpdate includes an entered replacement secret', () => {
  const update = buildServiceConfigUpdate(
    { gpt_api_key: '••••1234' },
    { gpt_api_key: 'new-secret-key' },
  )

  assert.deepEqual(update, { gpt_api_key: 'new-secret-key' })
})

test('buildServiceConfigUpdate allows a non-sensitive field to be cleared', () => {
  const update = buildServiceConfigUpdate(
    { gpt_model_engine: 'qwen-plus' },
    { gpt_model_engine: '' },
  )

  assert.deepEqual(update, { gpt_model_engine: '' })
})
