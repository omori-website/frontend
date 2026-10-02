import assert from 'node:assert/strict'
import { advanceFlip, readingPose, readingStep } from './book-reading.ts'
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
const flip = { page: 1, from: 1, to: 1, started: 0, active: false }
advanceFlip(flip, 6, 0, false, false)
assert.equal(flip.page, 1, 'Wait for camera pullback')
advanceFlip(flip, 6, 100, true, false)
advanceFlip(flip, 6, 475, true, false)
assert.equal(flip.page, 1.5, 'Fast swipe cannot accelerate a flip')
advanceFlip(flip, 0, 849, true, false)
assert.ok(flip.page < 2 && flip.active, 'Reversal cannot truncate the current flip')
advanceFlip(flip, 0, 850, true, false)
assert.equal(flip.page, 2)
advanceFlip(flip, 0, 900, true, false)
advanceFlip(flip, 0, 1650, true, false)
assert.equal(flip.page, 1, 'Reverse flip also takes 750ms')
advanceFlip(flip, 6, 1651, true, true)
assert.equal(flip.page, 6, 'Reduced motion skips queued flips')
console.log('PASS: fixed 750ms flips, pullback gate, reversal, immediate navigation')
