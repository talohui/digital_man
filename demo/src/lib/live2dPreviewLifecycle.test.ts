import assert from 'node:assert/strict'
import test from 'node:test'
import { destroyAdminLive2DPreview } from './live2dPreviewLifecycle.ts'

test('destroys PIXI resources without removing the React-owned canvas', () => {
  const calls: Array<{ removeView: boolean; children: boolean }> = []

  destroyAdminLive2DPreview({
    destroy(removeView, options) {
      calls.push({ removeView, children: options.children })
    }
  })

  assert.deepEqual(calls, [{ removeView: false, children: true }])
})
