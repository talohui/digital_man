import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  BoxGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  Scene
} from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class NodeFileReader {
    constructor() {
      this.result = null
      this.onloadend = null
      this.onerror = null
    }

    readAsArrayBuffer(blob) {
      blob.arrayBuffer()
        .then((buffer) => {
          this.result = buffer
          this.onloadend?.()
        })
        .catch((error) => {
          this.error = error
          this.onerror?.(error)
        })
    }
  }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const outputPath = path.join(
  projectRoot,
  'public/models/lingshan/optimized/xiangfu-temple-base.runtime-v1.glb'
)

const MATERIALS = {
  mainStone: new MeshBasicMaterial({ color: new Color('#d8cfbd') }),
  edgeStone: new MeshBasicMaterial({ color: new Color('#c8bea9') }),
  jointStone: new MeshBasicMaterial({ color: new Color('#a99f8c') }),
  stepStone: new MeshBasicMaterial({ color: new Color('#d3c9b8') })
}

const scene = new Scene()
scene.name = 'xiangfu_temple_base_runtime_v1'

const base = new Group()
base.name = 'xiangfu_temple_low_stone_courtyard_base'
scene.add(base)

addBox(base, 'main_low_stone_slab', 10, 0.24, 7, 0, 0.12, 0, MATERIALS.mainStone)

// A very thin top plane and engraved joints, represented by shallow matte strips.
addBox(base, 'top_paving_surface', 9.55, 0.018, 6.55, 0, 0.258, 0, MATERIALS.mainStone)
for (const x of [-3.2, -1.6, 0, 1.6, 3.2]) {
  addBox(base, `paving_joint_x_${formatNameNumber(x)}`, 0.035, 0.02, 6.35, x, 0.276, 0, MATERIALS.jointStone)
}
for (const z of [-2.1, 0, 2.1]) {
  addBox(base, `paving_joint_z_${formatNameNumber(z)}`, 9.35, 0.02, 0.035, 0, 0.277, z, MATERIALS.jointStone)
}

// Low border stones give the slab a beveled edge impression without costly geometry.
addBox(base, 'front_border_stone', 10.18, 0.18, 0.18, 0, 0.31, 3.59, MATERIALS.edgeStone)
addBox(base, 'back_border_stone', 10.18, 0.18, 0.18, 0, 0.31, -3.59, MATERIALS.edgeStone)
addBox(base, 'left_border_stone', 0.18, 0.18, 7.18, -5.09, 0.31, 0, MATERIALS.edgeStone)
addBox(base, 'right_border_stone', 0.18, 0.18, 7.18, 5.09, 0.31, 0, MATERIALS.edgeStone)

// Three shallow entry steps on the front side. They are deliberately low and neutral.
addBox(base, 'front_step_lower', 4.8, 0.08, 0.72, 0, 0.04, 4.12, MATERIALS.stepStone)
addBox(base, 'front_step_middle', 4.35, 0.08, 0.55, 0, 0.12, 3.83, MATERIALS.stepStone)
addBox(base, 'front_step_upper', 3.9, 0.08, 0.38, 0, 0.20, 3.58, MATERIALS.stepStone)

// Subtle darker riser lines on the steps.
addBox(base, 'front_step_lower_riser_shadow', 4.82, 0.015, 0.035, 0, 0.087, 3.78, MATERIALS.jointStone)
addBox(base, 'front_step_middle_riser_shadow', 4.37, 0.015, 0.035, 0, 0.167, 3.56, MATERIALS.jointStone)

const exporter = new GLTFExporter()
const arrayBuffer = await exporter.parseAsync(scene, {
  binary: true,
  trs: false,
  onlyVisible: true,
  includeCustomExtensions: false
})

await fs.mkdir(path.dirname(outputPath), { recursive: true })
await fs.writeFile(outputPath, Buffer.from(arrayBuffer))

const stat = await fs.stat(outputPath)
console.log(`Generated ${outputPath}`)
console.log(`Size: ${stat.size} bytes`)

function addBox(parent, name, width, height, depth, x, y, z, material) {
  const geometry = new BoxGeometry(width, height, depth)
  const mesh = new Mesh(geometry, material)
  mesh.name = name
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

function formatNameNumber(value) {
  return String(value).replace('-', 'neg_').replace('.', '_')
}
