import assert from 'node:assert/strict'
import { readingPose, readingStep } from './book-reading.ts'
const pose = { page: 0, x: 0, zoom: 0 }
for (let page = 1; page <= 6; page++) {
  readingPose(page, true, pose)
  assert.deepEqual(pose, { page, x: -0.92, zoom: 1 })
  readingPose(page + 0.45, true, pose)
  assert.equal(pose.page, page)
  assert.ok(pose.x > 0.919 && pose.zoom > 0.999)
  readingPose(page + 0.89, true, pose)
  assert.equal(pose.zoom, 0)
  assert.equal(pose.x, 0)
  assert.ok(pose.page > page && pose.page < page + 1)
  for (const phase of [0.05, 0.3]) {
    readingPose(page + phase, true, pose)
    assert.deepEqual(pose, { page, x: -0.92, zoom: 1 }, 'Hold left for reading')
  }
  for (const phase of [0.5, 0.75]) {
    readingPose(page + phase, true, pose)
    assert.deepEqual(pose, { page, x: 0.92, zoom: 1 }, 'Hold right for reading')
  }
  assert.equal(readingStep(page + 0.3, 1, true), page + 1)
  assert.equal(readingStep(page + 0.7, 1, true), page + 1)
  assert.equal(readingStep(page + 0.7, -1, true), page - 1)
}
readingPose(2.3, false, pose)
assert.deepEqual(pose, { page: 2.3, x: 0, zoom: 0 })
readingPose(8, true, pose)
assert.deepEqual(pose, { page: 8, x: 0, zoom: 0 })
console.log('PASS: left/right order, pullback before flipping, reverse steps, desktop, back cover')
