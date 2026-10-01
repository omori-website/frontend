// Run: node src/sections/CharactersSection/book-interaction.test.mjs
import assert from 'node:assert/strict'
import { DoubleSide, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Quaternion, Raycaster, Texture, Vector3 } from 'three'
import { bookTime, pickPolaroid, swayPolaroid } from './book-interaction.ts'

for (let page = 0; page < 8; page++) assert.equal(bookTime(page), (1 + page * 30) / 30)
assert.equal(bookTime(-1), 1 / 30)
assert.equal(bookTime(9), 211 / 30)

const model = new Group()
const mesh = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ side: DoubleSide }))
mesh.position.z = 0.1
model.add(mesh)
const texture = new Texture()
texture.updateMatrix()
const card = {
  mesh, position: mesh.position.clone(), quaternion: mesh.quaternion.clone(),
  scale: mesh.scale.clone(), zoom: 1,
  texture, mask: new Uint8ClampedArray([255, 255, 255, 255]), width: 1, height: 1,
  angle: 0, velocity: 0, target: 0,
}
const cards = new Map([[mesh, card]])
const ray = new Raycaster(new Vector3(0, 0, 2), new Vector3(0, 0, -1))
model.updateMatrixWorld(true)
assert.equal(pickPolaroid(ray, model, cards)?.card, card)
const page = new Mesh(new PlaneGeometry(2, 2), new MeshBasicMaterial({ side: DoubleSide }))
page.position.z = 0.2
model.add(page)
model.updateMatrixWorld(true)
assert.equal(pickPolaroid(ray, model, cards), null, 'An opaque page must block hidden cards')
model.remove(page)
card.mask[3] = 0
assert.equal(pickPolaroid(ray, model, cards), null, 'Transparent artwork margins are not interactive')
card.mask[3] = 255
ray.set(new Vector3(0, 0, -2), new Vector3(0, 0, 1))
assert.equal(pickPolaroid(ray, model, cards), null, 'The back of a card must not be picked')

const parent = mesh.parent
card.quaternion.setFromAxisAngle(new Vector3(0, 0, 1), 0.4)
mesh.quaternion.copy(card.quaternion)
card.target = 0.04
for (let i = 0; i < 120; i++) swayPolaroid(card, 1 / 60, false, false)
assert.ok(Math.abs(card.angle - 0.04) < 0.001)
assert.ok(mesh.quaternion.angleTo(card.quaternion) > 0.02)
assert.equal(mesh.parent, parent)
assert.ok(mesh.position.equals(card.position))
card.target = 0
for (let i = 0; i < 180; i++) swayPolaroid(card, 1 / 60, false, false)
assert.ok(mesh.quaternion.angleTo(card.quaternion) < 0.0001, 'Card returns to its loaded rotation')
card.angle = 0.1
card.velocity = 1
swayPolaroid(card, 1 / 60, true, false)
assert.ok(mesh.quaternion.equals(card.quaternion))
assert.equal(card.velocity, 0)
assert.ok(card.quaternion instanceof Quaternion)
card.scale.set(2, 3, 1)
for (let i = 0; i < 60; i++) swayPolaroid(card, 1 / 60, false, true)
assert.ok(mesh.scale.distanceTo(new Vector3(2.06, 3.09, 1.03)) < 0.00001, 'Hover preserves the loaded proportions')
for (let i = 0; i < 60; i++) swayPolaroid(card, 1 / 60, false, false)
assert.ok(mesh.scale.distanceTo(card.scale) < 0.00001, 'Mouse-out restores the loaded scale')
swayPolaroid(card, 1 / 60, true, true)
assert.ok(mesh.scale.distanceTo(new Vector3(2.06, 3.09, 1.03)) < 0.00001, 'Reduced motion applies hover feedback without interpolation')
swayPolaroid(card, 1 / 60, true, false)
assert.ok(mesh.scale.equals(card.scale), 'Reduced motion restores scale immediately')
console.log('PASS: book landmarks, page occlusion, transparent margins, back-face rejection, reversible parented sway, reduced motion')
