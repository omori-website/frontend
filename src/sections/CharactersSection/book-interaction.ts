import { MathUtils, Mesh, Quaternion, Vector2, Vector3 } from 'three'
import type { Object3D, Raycaster, Texture } from 'three'

export const BOOK_PAGES = ['Front cover', 'Omori', 'Aubrey', 'Hero', 'Kel', 'Mari', 'Basil', 'Green back cover'] as const

export function bookTime(page: number) {
  return (1 + MathUtils.clamp(page, 0, 7) * 30) / 30
}

export type Polaroid = {
  mesh: Mesh
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
  zoom: number
  mask: Uint8ClampedArray
  width: number
  height: number
  texture: Texture
  angle: number
  velocity: number
  target: number
}

const uv = new Vector2()
const normal = new Vector3()
const axis = new Vector3(0, 1, 0)
const offset = new Quaternion()

export function pickPolaroid(raycaster: Raycaster, model: Object3D, cards: Map<Object3D, Polaroid>) {
  for (const hit of raycaster.intersectObject(model, true)) {
    const card = cards.get(hit.object)
    if (!card) return null // The nearest physical page occludes every card behind it.
    if (!hit.uv || !hit.face) return null
    card.texture.transformUv(uv.copy(hit.uv))
    const x = MathUtils.clamp(Math.floor(uv.x * card.width), 0, card.width - 1)
    const y = MathUtils.clamp(Math.floor(uv.y * card.height), 0, card.height - 1)
    if (card.mask[(y * card.width + x) * 4 + 3] < 128) continue
    normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld)
    if (normal.dot(raycaster.ray.direction) >= 0) return null
    return { card, uv: hit.uv }
  }
  return null
}

export function swayPolaroid(card: Polaroid, delta: number, reducedMotion: boolean, hovered: boolean) {
  if (reducedMotion) {
    card.angle = card.velocity = 0
  } else {
    // Substeps keep the loose screw stable even after a slow frame.
    const steps = Math.max(1, Math.ceil(delta / (1 / 120)))
    const step = delta / steps
    for (let i = 0; i < steps; i++) {
      card.velocity += ((card.target - card.angle) * 95 - card.velocity * 9) * step
      card.angle = MathUtils.clamp(card.angle + card.velocity * step, -0.18, 0.18)
    }
  }
  const zoom = hovered ? 1.03 : 1
  card.zoom = reducedMotion ? zoom : MathUtils.damp(card.zoom, zoom, hovered ? 18 : 24, delta)
  card.mesh.scale.copy(card.scale).multiplyScalar(card.zoom)
  card.mesh.position.copy(card.position)
  card.mesh.quaternion.copy(card.quaternion).multiply(offset.setFromAxisAngle(axis, card.angle))
}
