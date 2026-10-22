import * as THREE from 'three'

const COUNT = 280
const FAR = 70
const PALETTE = [0xf2f2ef, 0xf2f2ef, 0xa8dcff, 0xa8dcff, 0xe3262f]

// Hairline light streaks rushing toward the camera. Speed is driven from scroll.
export function createStreaks(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 120)

  const positions = new Float32Array(COUNT * 6)
  const colors = new Float32Array(COUNT * 8)
  const headZ = new Float32Array(COUNT)
  const tint = new THREE.Color()

  for (let i = 0; i < COUNT; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 1.2 + Math.pow(Math.random(), 1.6) * 9
    const x = Math.cos(angle) * radius * 1.6
    const y = Math.sin(angle) * radius * 0.7
    const z = -Math.random() * FAR
    positions.set([x, y, z, x, y, z], i * 6)
    headZ[i] = z
    tint.setHex(PALETTE[Math.floor(Math.random() * PALETTE.length)])
    const a = 0.35 + Math.random() * 0.65
    colors.set([tint.r, tint.g, tint.b, a, tint.r, tint.g, tint.b, 0], i * 8)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4))

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const lines = new THREE.LineSegments(geometry, material)
  lines.frustumCulled = false
  lines.visible = false
  scene.add(lines)

  let target = 0
  let speed = 0
  let raf = 0
  let running = false
  let last = 0

  const frame = (now) => {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    speed += (target - speed) * Math.min(1, dt * 5)

    if (speed < 0.01 && target === 0) {
      if (lines.visible) {
        lines.visible = false
        renderer.clear()
      }
      return
    }

    lines.visible = true
    const vel = 3 + speed * 90
    const len = 0.4 + speed * 14
    for (let i = 0; i < COUNT; i++) {
      let z = headZ[i] + vel * dt
      if (z > -0.5) z = -FAR * (0.6 + Math.random() * 0.4)
      headZ[i] = z
      positions[i * 6 + 2] = z
      positions[i * 6 + 5] = z - len
    }
    geometry.attributes.position.needsUpdate = true
    material.opacity = Math.min(1, speed * 1.6)
    renderer.render(scene, camera)
  }

  return {
    setSpeed(v) {
      target = Math.max(0, Math.min(1, v))
    },
    resize() {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
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
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    },
  }
}