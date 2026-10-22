import * as THREE from 'three'

export const SKIN_IMAGES = [
  '/media/img/tesla-front.png',
  '/media/img/tesla-top.png',
  '/media/img/tesla-interior.png',
  '/media/img/tesla-spring.png',
  '/media/img/tesla-rear.png',
]

const N = SKIN_IMAGES.length
const GAP = 11 // distance between photos along the corridor
const W = 7.2 // photo width in world units
const H = W / 2.16 // photos are ~2.16:1
const FOV = 55

const lerp = (a, b, t) => a + (b - a) * t
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// A corridor of floating photos. The camera flies through it as getProgress() goes 0 → 1.
export function createSkinScene(canvas, getProgress) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.setClearColor(0x050506, 1)

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x050506, 8, 40)
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100)

  const disposables = []
  const loader = new THREE.TextureLoader()
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  const px = [] // x position of each photo

  SKIN_IMAGES.forEach((src, i) => {
    const tex = loader.load(src)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = aniso
    const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })
    const geo = new THREE.PlaneGeometry(W, H)
    const mesh = new THREE.Mesh(geo, mat)
    const side = i % 2 === 0 ? -1 : 1
    const x = side * 1.6
    mesh.position.set(x, side * -0.2, -i * GAP)
    mesh.rotation.y = -side * 0.2 // each photo turns slightly toward the centre
    scene.add(mesh)
    px.push(x)
    disposables.push(tex, mat, geo)
  })

  // Light rails along the corridor walls
  const zFront = 20
  const zBack = -(N - 1) * GAP - 40
  const railLen = zFront - zBack
  const railZ = (zFront + zBack) / 2
  const addRail = (x, y, color) => {
    const geo = new THREE.BoxGeometry(0.03, 0.03, railLen)
    const mat = new THREE.MeshBasicMaterial({ color })
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, y, railZ)
    scene.add(m)
    disposables.push(geo, mat)
  }
  addRail(-6.5, 3.2, 0xf2f2ef)
  addRail(6.5, 3.2, 0xe3262f)
  addRail(-6.5, -3.2, 0xe3262f)
  addRail(6.5, -3.2, 0xf2f2ef)

  // Dust drifting through the light
  const COUNT = 900
  const pos = new Float32Array(COUNT * 3)
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 20
    pos[i * 3 + 1] = (Math.random() - 0.5) * 10
    pos[i * 3 + 2] = zFront - Math.random() * railLen
  }
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const dustMat = new THREE.PointsMaterial({
    color: 0xa8dcff,
    size: 0.045,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const dust = new THREE.Points(dustGeo, dustMat)
  scene.add(dust)
  disposables.push(dustGeo, dustMat)

  // Pointer parallax
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
  const onMove = (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
  }
  window.addEventListener('pointermove', onMove, { passive: true })

  let dist = 7 // camera distance from the photo it is looking at
  let cur = 0
  let running = false
  let raf = 0
  let last = 0
  const look = new THREE.Vector3()

  const frame = (now) => {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now

    const target = Math.min(1, Math.max(0, getProgress()))
    const prev = cur
    cur += (target - cur) * Math.min(1, dt * 4)
    const vel = (cur - prev) / Math.max(dt, 0.001)

    pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 3)
    pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 3)

    // Position along the corridor, lingering on each photo
    const raw = cur * (N - 1)
    const i0 = Math.min(N - 2, Math.floor(raw))
    const f = smooth(0.2, 0.8, raw - i0)
    const t = i0 + f
    const fx = lerp(px[i0], px[i0 + 1], f)
    const camZ = dist - t * GAP

    camera.position.set(fx * 0.55 + pointer.sx * 0.5, -pointer.sy * 0.3 + 0.1, camZ)
    look.set(fx * 0.9, 0, camZ - 12)
    camera.lookAt(look)
    camera.rotation.z = Math.max(-0.05, Math.min(0.05, vel * 0.03))

    dust.rotation.z = now * 0.00002
    renderer.render(scene, camera)
  }

  return {
    resize() {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      // Fit the photo to ~52% of the width on desktop, ~92% on phones
      const frac = camera.aspect < 1 ? 0.92 : 0.52
      const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
      dist = Math.max(5.5, W / frac / (2 * tan * camera.aspect))
      scene.fog.near = dist + 1
      scene.fog.far = dist + 34
    },
    start() {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    },
    stop() {
      running = false
      cancelAnimationFrame(raf)
    },
    dispose() {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
    },
  }
}