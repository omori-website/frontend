import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { bookTime, pickPolaroid, swayPolaroid } from './book-interaction'
import type { Polaroid } from './book-interaction'
import bookUrl from '../../assets/characters-section/omori_characters_book.glb?url'
import gameplayBackground from '../../assets/gameplay-news-section/gameplay-news-bg.webp'
import hero1 from '../../assets/kel-and-hero/hero1.png'
import hero2 from '../../assets/kel-and-hero/hero2.png'
import hero3 from '../../assets/kel-and-hero/hero3.png'
import basil1 from '../../assets/kel-and-hero/basil1.png'
import basil2 from '../../assets/kel-and-hero/basil2.png'
import basil3 from '../../assets/kel-and-hero/basil3.png'

const selectedPhotos = { Hero: [hero1, hero2, hero3], Basil: [basil1, basil2, basil3] }

export type Photo = { name: string; character: string; index: number; url: string }

function disposeModel(model: THREE.Object3D) {
  const textures = new Set<THREE.Texture>()
  const materials = new Set<THREE.Material>()
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    object.geometry.dispose()
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material)
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value)
      }
    }
  })
  textures.forEach((texture) => texture.dispose())
  materials.forEach((material) => material.dispose())
}

function uprightPhoto(image: HTMLImageElement, mask: Uint8ClampedArray) {
  const width = image.width
  const height = image.height
  let count = 0, sumY = 0, sumX = 0, sumYY = 0, sumYX = 0
  // Measure the straight sides, away from the transparent corners of the source card.
  for (let y = Math.floor(height * 0.25); y < height * 0.75; y++) {
    let left = width, right = -1
    for (let x = 0; x < width; x++) {
      if (mask[(y * width + x) * 4 + 3] >= 128) {
        left = Math.min(left, x)
        right = x
      }
    }
    if (right < left) continue
    const middle = (left + right) / 2
    count++
    sumY += y
    sumX += middle
    sumYY += y * y
    sumYX += y * middle
  }
  const denominator = count * sumYY - sumY * sumY
  const angle = denominator ? Math.atan((count * sumYX - sumY * sumX) / denominator) : 0
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = Math.ceil(Math.hypot(width, height))
  const context = canvas.getContext('2d')!
  context.translate(canvas.width / 2, canvas.height / 2)
  context.rotate(angle)
  context.drawImage(image, -width / 2, -height / 2)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  let left = canvas.width, top = canvas.height, right = -1, bottom = -1
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    if (pixels[(y * canvas.width + x) * 4 + 3] < 128) continue
    left = Math.min(left, x)
    top = Math.min(top, y)
    right = Math.max(right, x)
    bottom = Math.max(bottom, y)
  }
  if (right < left) throw new Error('Empty Polaroid artwork')
  const cropped = document.createElement('canvas')
  cropped.width = right - left + 1
  cropped.height = bottom - top + 1
  cropped.getContext('2d')!.drawImage(canvas, left, top, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height)
  return cropped.toDataURL('image/png')
}

export function mountBook(container: HTMLDivElement, options: {
  target: { current: number }
  immediate: { current: boolean }
  photoOpen: { current: boolean }
  onReady: (photos: Photo[]) => void
  onError: () => void
  onOpen: (name: string) => void
  onTransition: (complete: boolean) => void
}) {
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  } catch {
    options.onError()
    return () => {}
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NoToneMapping
  renderer.domElement.setAttribute('aria-hidden', 'true')
  container.appendChild(renderer.domElement)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
  camera.up.set(0, 0, -1)
  const pivot = new THREE.Group()
  const centered = new THREE.Group()
  pivot.add(centered)
  scene.add(pivot, new THREE.HemisphereLight(0xffffff, 0xbba6dc, 1.4))
  const light = new THREE.DirectionalLight(0xffffff, 1.5)
  light.position.set(-3, 7, -4)
  scene.add(light)
  // Sample the next background in stage coordinates, not the rotating cover's UVs.
  const backgroundWindow = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      background: { value: null as THREE.Texture | null },
      viewport: { value: new THREE.Vector2() },
      stageSize: { value: new THREE.Vector2() },
      hostSize: { value: new THREE.Vector2() },
      hostOffset: { value: new THREE.Vector2() },
      imageSize: { value: new THREE.Vector2() },
      backgroundScroll: { value: 0 },
    },
    vertexShader: `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D background;
      uniform vec2 viewport, stageSize, hostSize, hostOffset, imageSize;
      uniform float backgroundScroll;
      void main() {
        vec2 pixel = gl_FragCoord.xy / viewport * hostSize + hostOffset;
        float scale = max(stageSize.x / imageSize.x, stageSize.y / imageSize.y);
        vec2 uv = vec2(
          (pixel.x - stageSize.x * 0.5) / (imageSize.x * scale) + 0.5,
          1.0 - (stageSize.y - pixel.y + backgroundScroll) / (imageSize.y * scale)
        );
        gl_FragColor = texture2D(background, uv);
        #include <colorspace_fragment>
      }
    `,
  })
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
  const pointer = new THREE.Vector2()
  const pointerNdc = new THREE.Vector2()
  const raycaster = new THREE.Raycaster()
  const cards = new Map<THREE.Object3D, Polaroid>()
  const bounds = new THREE.Box3()
  const center = new THREE.Vector3()
  let model: THREE.Group | undefined
  let mixer: THREE.AnimationMixer | undefined
  let disposed = false
  let contextLost = false
  let loadedPhotos: Photo[] | undefined
  let visible = true
  let pointerInside = false
  let pointerDirty = false
  let hovered: Polaroid | null = null
  let progress = options.target.current
  let previousTime = -1
  let lastTime = 0
  let press: { x: number; y: number; name: string } | null = null
  let lastPointerX = 0
  let viewDistance = 1
  let transitionComplete = false

  function resize() {
    const width = container.clientWidth
    const height = container.clientHeight
    if (!width || !height) return
    renderer.setSize(width, height)
    camera.aspect = width / height
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2)
    viewDistance = Math.max(1.98 / (Math.tan(halfFov) * camera.aspect), 1.43 / Math.tan(halfFov))
    camera.position.set(0, viewDistance, viewDistance * 0.09)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    const host = container.getBoundingClientRect()
    const stage = container.closest('.characters-stage')!.getBoundingClientRect()
    renderer.getDrawingBufferSize(backgroundWindow.uniforms.viewport.value)
    backgroundWindow.uniforms.hostSize.value.set(width, height)
    backgroundWindow.uniforms.stageSize.value.set(stage.width, stage.height)
    backgroundWindow.uniforms.hostOffset.value.set(host.left - stage.left, stage.bottom - host.bottom)
    pointerDirty = true
  }

  function resetPointer() {
    pointer.set(0, 0)
    pointerInside = false
    pointerDirty = true
    press = null
    hovered = null
    container.style.cursor = ''
  }

  function move(event: PointerEvent) {
    if (options.photoOpen.current || event.pointerType === 'touch' || !finePointer.matches) return
    const rect = container.getBoundingClientRect()
    pointer.set(event.clientX / window.innerWidth * 2 - 1, event.clientY / window.innerHeight * 2 - 1)
    pointerNdc.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
    pointerInside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom
    pointerDirty = true
    if (hovered && !reducedMotion.matches) {
      hovered.velocity = THREE.MathUtils.clamp(hovered.velocity + (event.clientX - lastPointerX) * 0.009, -1.2, 1.2)
    }
    lastPointerX = event.clientX
  }

  function pick(event: PointerEvent) {
    if (!model || options.photoOpen.current) return null
    const rect = container.getBoundingClientRect()
    pointerNdc.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
    scene.updateMatrixWorld(true)
    raycaster.setFromCamera(pointerNdc, camera)
    return pickPolaroid(raycaster, model, cards)
  }

  function down(event: PointerEvent) {
    if (event.button !== 0) return
    const hit = pick(event)
    press = hit ? { x: event.clientX, y: event.clientY, name: hit.card.mesh.name } : null
  }

  function up(event: PointerEvent) {
    const hit = pick(event)
    if (press && hit?.card.mesh.name === press.name && Math.hypot(event.clientX - press.x, event.clientY - press.y) < 8) {
      options.onOpen(press.name)
    }
    press = null
  }

  const destination = container.closest('.characters-section')!.querySelector<HTMLElement>('.gameplay-news-section')!
  function render(time: number) {
    const delta = Math.min((time - (lastTime || time)) / 1000, 0.04)
    lastTime = time
    const smoothing = 1 - Math.exp(-10 * delta)
    const difference = options.target.current - progress
    progress = options.immediate.current || reducedMotion.matches || Math.abs(difference) < 0.001 ? options.target.current : progress + difference * smoothing
    options.immediate.current = false
    const imageSize = backgroundWindow.uniforms.imageSize.value
    const stageSize = backgroundWindow.uniforms.stageSize.value
    if (imageSize.y > 0) {
      const imageHeight = imageSize.y * Math.max(stageSize.x / imageSize.x, stageSize.y / imageSize.y)
      backgroundWindow.uniforms.backgroundScroll.value = THREE.MathUtils.clamp(
        -destination.getBoundingClientRect().top * (reducedMotion.matches ? 1 : 0.35), 0, imageHeight - stageSize.y,
      )
    }
    const animationTime = bookTime(progress)
    const poseChanged = animationTime !== previousTime
    if (model && mixer && poseChanged) {
      mixer.setTime(animationTime) // Scroll owns time; never automatically advance this mixer.
      const tiltX = pivot.rotation.x
      const tiltZ = pivot.rotation.z
      pivot.rotation.set(0, 0, 0)
      centered.position.set(0, 0, 0)
      scene.updateMatrixWorld(true)
      bounds.setFromObject(model).getCenter(center)
      centered.position.copy(center).negate()
      pivot.rotation.set(tiltX, 0, tiltZ)
      previousTime = animationTime
    }
    const oldX = pivot.rotation.x
    const oldZ = pivot.rotation.z
    const reveal = THREE.MathUtils.clamp(progress - 7, 0, 1)
    const zoom = reducedMotion.matches ? (reveal >= 1 ? 1 : 0) : reveal
    // Move close enough that the narrower cover dimension exceeds every viewport edge.
    const coverDistance = Math.min(0.78 / camera.aspect, 1.05) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const distance = THREE.MathUtils.lerp(viewDistance, coverDistance, zoom)
    camera.position.set(0, distance, distance * 0.09 * (1 - zoom))
    camera.lookAt(0, 0, 0)
    const tilt = !reducedMotion.matches && !options.photoOpen.current && finePointer.matches
    pivot.rotation.x += ((tilt ? pointer.y * 0.14 * (1 - reveal) : 0) - pivot.rotation.x) * smoothing
    pivot.rotation.z += ((tilt ? -pointer.x * 0.16 * (1 - reveal) : 0) - pivot.rotation.z) * smoothing
    const complete = !!model && progress >= 7.995
    if (complete !== transitionComplete) {
      transitionComplete = complete
      options.onTransition(complete)
    }
    const tiltChanged = Math.abs(oldX - pivot.rotation.x) + Math.abs(oldZ - pivot.rotation.z) > 0.00001
    if (model && (pointerDirty || poseChanged || tiltChanged || options.photoOpen.current)) {
      scene.updateMatrixWorld(true)
      raycaster.setFromCamera(pointerNdc, camera)
      const hit = pointerInside && !options.photoOpen.current ? pickPolaroid(raycaster, model, cards) : null
      if (hit && hit.card !== hovered && !reducedMotion.matches) {
        hit.card.velocity = (hit.uv.x < 0.5 ? -1 : 1) * 0.7
      }
      hovered = hit?.card ?? null
      for (const card of cards.values()) card.target = card === hovered && hit ? (hit.uv.x - 0.5) * 0.28 : 0
      container.style.cursor = hovered ? 'pointer' : ''
      pointerDirty = false
    }
    for (const card of cards.values()) swayPolaroid(card, delta, reducedMotion.matches, card === hovered)
    renderer.render(scene, camera)
  }

  function activity() {
    resetPointer()
    lastTime = 0
    renderer.setAnimationLoop(visible && !document.hidden && !contextLost ? render : null)
  }
  function loseContext() {
    contextLost = true
    activity()
    options.onError()
  }
  function restoreContext() {
    contextLost = false
    activity()
    if (loadedPhotos) options.onReady(loadedPhotos)
  }
  renderer.domElement.addEventListener('webglcontextlost', loseContext)
  renderer.domElement.addEventListener('webglcontextrestored', restoreContext)
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    activity()
  })
  visibilityObserver.observe(container)
  window.addEventListener('pointermove', move)
  document.documentElement.addEventListener('pointerleave', resetPointer)
  window.addEventListener('blur', resetPointer)
  document.addEventListener('visibilitychange', activity)
  reducedMotion.addEventListener('change', resetPointer)
  container.addEventListener('pointerdown', down)
  container.addEventListener('pointerup', up)
  container.addEventListener('pointercancel', resetPointer)
  renderer.setAnimationLoop(render)
  resize()

  function applyBackground() {
    if (!model || !backgroundWindow.uniforms.background.value) return
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      const replaced = materials.map((material) => {
        if (material.name !== 'Print_green_screen') return material
        material.dispose()
        return backgroundWindow
      })
      object.material = Array.isArray(object.material) ? replaced : replaced[0]
    })
  }
  new THREE.TextureLoader().loadAsync(gameplayBackground).then((background) => {
    if (disposed) {
      background.dispose()
      return
    }
    background.colorSpace = THREE.SRGBColorSpace
    backgroundWindow.uniforms.background.value = background
    backgroundWindow.uniforms.imageSize.value.set(background.image.width, background.image.height)
    applyBackground()
  }).catch((error) => {
    if (!disposed) console.error('Unable to load book background', error)
  })

  new GLTFLoader().loadAsync(bookUrl).then((gltf) => {
    if (disposed) {
      disposeModel(gltf.scene)
      return
    }
    model = gltf.scene
    try {
      const clip = gltf.animations.find((item) => item.name === 'OMORI_Characters_Book')
      if (!model.getObjectByName('OMORI_Book') || !clip) throw new Error('Missing exported book or animation')
      const photos: Photo[] = []
      const printAnisotropy = renderer.capabilities.getMaxAnisotropy()
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        for (const material of materials) {
          if (!/^Print_.*_(description|profile)$/.test(material.name)) continue
          const texture = (material as THREE.MeshStandardMaterial).map
          if (texture) {
            texture.anisotropy = printAnisotropy
            texture.needsUpdate = true
          }
        }
        if (!/^Polaroid_(Omori|Aubrey|Hero|Kel|Mari|Basil)_0[1-3]$/.test(object.name)) return
        const material = materials[0] as THREE.MeshStandardMaterial
        const texture = material.map
        if (!texture?.image) throw new Error('Missing Polaroid artwork')
        const image = texture.image as HTMLImageElement
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const context = canvas.getContext('2d', { willReadFrequently: true })!
        context.drawImage(image, 0, 0)
        const mask = context.getImageData(0, 0, canvas.width, canvas.height).data
        const character = object.userData.character as string
        const index = object.userData.card_index as number
        const photoUrl = character === 'Hero' || character === 'Basil'
          ? selectedPhotos[character][index - 1]
          : uprightPhoto(image, mask)
        // Alpha-test the visible card so transparent margins neither pick nor hide pages.
        material.alphaTest = 0.5
        material.transparent = false
        material.needsUpdate = true
        cards.set(object, {
          mesh: object, position: object.position.clone(), quaternion: object.quaternion.clone(),
          scale: object.scale.clone(), zoom: 1,
          mask, width: canvas.width, height: canvas.height, texture,
          angle: 0, velocity: 0, target: 0,
        })
        photos.push({ name: object.name, character, index, url: photoUrl })
      })
      if (cards.size !== 18) throw new Error('Expected 18 independently parented Polaroids')
      applyBackground()
      centered.add(model)
      mixer = new THREE.AnimationMixer(model)
      mixer.clipAction(clip).play()
      previousTime = -1
      // Upload textures and draw the initial pose while the intro still covers the stage.
      render(0)
      loadedPhotos = photos.sort((a, b) => a.index - b.index)
      if (!contextLost) options.onReady(loadedPhotos)
    } catch (error) {
      console.error('Unable to load OMORI book', error)
      centered.remove(model)
      disposeModel(model)
      model = undefined
      cards.clear()
      options.onError()
    }
  }).catch((error) => {
    if (!disposed) {
      console.error('Unable to load OMORI book', error)
      options.onError()
    }
  })

  return () => {
    disposed = true
    resizeObserver.disconnect()
    visibilityObserver.disconnect()
    window.removeEventListener('pointermove', move)
    document.documentElement.removeEventListener('pointerleave', resetPointer)
    window.removeEventListener('blur', resetPointer)
    document.removeEventListener('visibilitychange', activity)
    reducedMotion.removeEventListener('change', resetPointer)
    container.removeEventListener('pointerdown', down)
    container.removeEventListener('pointerup', up)
    container.removeEventListener('pointercancel', resetPointer)
    renderer.domElement.removeEventListener('webglcontextlost', loseContext)
    renderer.domElement.removeEventListener('webglcontextrestored', restoreContext)
    renderer.setAnimationLoop(null)
    if (model) {
      mixer?.stopAllAction()
      mixer?.uncacheRoot(model)
      disposeModel(model)
    }
    backgroundWindow.uniforms.background.value?.dispose()
    backgroundWindow.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }
}
