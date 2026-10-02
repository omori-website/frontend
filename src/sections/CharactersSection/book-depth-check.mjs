import assert from 'node:assert/strict'

// Run against the dev server on a page containing the photobook section.
export default async function checkBookDepth(page) {
  const pixels = await page.evaluate(async () => {
    const module = await (await fetch('/src/sections/CharactersSection/book-scene.ts')).text()
    const T = await import(module.match(/import \* as THREE from "([^"]+)"/)[1])
    const { GLTFLoader } = await import(module.match(/import \{ GLTFLoader \} from "([^"]+)"/)[1])
    const { mountBook } = await import('/src/sections/CharactersSection/book-scene.ts')
    const original = GLTFLoader.prototype.loadAsync
    let model
    GLTFLoader.prototype.loadAsync = async function (...args) {
      const gltf = await original.apply(this, args)
      model = gltf.scene
      return gltf
    }
    const host = document.createElement('div')
    host.style.cssText = 'position:fixed;inset:0;width:800px;height:600px'
    document.querySelector('.characters-stage').append(host)
    let stop
    let material
    try {
      await new Promise((resolve, reject) => {
        stop = mountBook(host, {
          target: { current: 1 }, immediate: { current: true }, photoOpen: { current: false },
          onReady: resolve, onError: () => reject(new Error('Book failed to load')),
          onOpen: () => {}, onTransition: () => {},
        })
      })
      material = model.getObjectByName('Polaroid_Omori_01').material.clone()
    } finally {
      GLTFLoader.prototype.loadAsync = original
      stop?.()
      host.remove()
    }
    const renderer = new T.WebGLRenderer()
    const target = new T.WebGLRenderTarget(8, 8)
    const scene = new T.Scene()
    const camera = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.position.z = 3
    // Isolate depth behavior from artwork and lighting, retaining the real card's depth settings.
    material.map = material.emissiveMap = null
    material.color.set(0xff0000)
    material.emissive.set(0xff0000)
    material.emissiveIntensity = 1
    const card = new T.Mesh(new T.PlaneGeometry(2, 2), material)
    card.position.z = 1
    const back = new T.Mesh(new T.PlaneGeometry(2, 2), new T.MeshBasicMaterial({ color: 0x0000ff }))
    back.renderOrder = 1
    scene.add(card, back)
    renderer.setRenderTarget(target)
    renderer.render(scene, camera)
    const pixel = new Uint8Array(4)
    renderer.readRenderTargetPixels(target, 4, 4, 1, 1, pixel)
    card.geometry.dispose()
    back.geometry.dispose()
    material.dispose()
    back.material.dispose()
    target.dispose()
    renderer.dispose()
    return [...pixel]
  })
  assert.ok(pixels[0] > 200 && pixels[2] < 10,
    `A later-drawn page must not erase the nearer card: ${pixels}`)
}
