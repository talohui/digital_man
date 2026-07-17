import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const mapPage = readFileSync(new URL('./Map3DGuidePrototypeCPage.tsx', import.meta.url), 'utf8')
const mapStyles = readFileSync(new URL('../styles/map/mapBrowseMobile.css', import.meta.url), 'utf8')
const componentPath = new URL('../components/map/MapVoiceAssistant.tsx', import.meta.url)

test('mounts a dedicated press-to-talk assistant on the mobile map overlay', () => {
  assert.match(mapPage, /MapVoiceAssistant/)
})

test('reuses the guide conversation and only exposes compact map voice states', () => {
  assert.equal(existsSync(componentPath), true)
  const component = readFileSync(componentPath, 'utf8')
  assert.match(component, /onPointerDown/)
  assert.match(component, /createVoiceAsr/)
  assert.match(component, /sendMessage/)
  assert.match(component, /TOUR_GUIDE_SCENE_ID/)
  assert.match(component, /查看文字/)
})

test('keeps the voice trigger inside the map safe area without a full chat panel', () => {
  assert.match(mapStyles, /\.map-voice-assistant/)
  assert.match(mapStyles, /touch-action:\s*none/)
  assert.doesNotMatch(mapStyles, /map-voice-assistant[\s\S]{0,800}chat-card/)
})
