// Three.js scene for the Ignition preloader.
// Light particles drift in 3D and assemble into the Roadster's light signature
// (full-width light blade + two triangle headlights) as loading progresses.

const VERT = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uBlade;
  uniform float uWarp;
  uniform float uPixelRatio;
  uniform float uSize;
  attribute vec3 aStart;
  attribute vec3 aTarget;
  attribute float aRand;
  attribute float aTint;
  varying float vAlpha;
  varying float vTint;

  void main() {
    // Each particle arrives at a slightly different time
    float t = clamp((uProgress - aRand * 0.35) / 0.65, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);

    vec3 target = vec3(aTarget.xy * uBlade, 0.0);
    vec3 drift = vec3(
      sin(uTime * 0.6 + aRand * 40.0),
      cos(uTime * 0.5 + aRand * 25.0),
      sin(uTime * 0.4 + aRand * 13.0)
    ) * 0.35;
    vec3 pos = mix(aStart + drift, target, t);

    // Ignition: everything streaks toward (and past) the camera
    pos.z += uWarp * (4.0 + aRand * 14.0);
    pos.xy *= 1.0 + uWarp * aRand * 0.8;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = 10.0 / max(0.5, -mv.z);
    gl_PointSize = uSize * uPixelRatio * (0.6 + aRand * 0.9) * depth;

    vAlpha = mix(0.25, 1.0, t) * (1.0 - uWarp * 0.9);
    vTint = aTint;
  }
`

const FRAG = /* glsl */ `
  varying float vAlpha;
  varying float vTint;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    vec3 white = vec3(0.95, 0.95, 0.94);
    vec3 cryo = vec3(0.66, 0.86, 1.0);
    vec3 red = vec3(0.89, 0.15, 0.18);
    vec3 col = vTint > 1.5 ? red : mix(white, cryo, vTint * 0.7);
    gl_FragColor = vec4(col, a * vAlpha);
  }
`

// Random point inside the headlight triangle (measured outward from the blade end)
function trianglePoint(width, halfHeight) {
  let r1 = Math.random()
  let r2 = Math.random()
  if (r1 + r2 > 1) {
    r1 = 1 - r1
    r2 = 1 - r2
  }
  // A = (0, -h), B = (0, h), C = (w, 0)
  const x = r2 * width
  const y = -halfHeight + r1 * 2 * halfHeight - r2 * halfHeight
  return [x, y]
}

export async function createBladeScene(canvas, getProgress) {
  const THREE = await import('three')

  const small = window.innerWidth < 768
  const COUNT = small ? 1400 : 2600

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0, 10)

  // Particle data
  const start = new Float32Array(COUNT * 3)
  const target = new Float32Array(COUNT * 3)
  const rand = new Float32Array(COUNT)
  const tint = new Float32Array(COUNT)

  const TRI_W = 0.075
  const TRI_H = 0.035
  const TRI_GAP = 0.02

  for (let i = 0; i < COUNT; i++) {
    // Start: a wide 3D cloud around the scene
    const u = Math.random() * 2 - 1
    const th = Math.random() * Math.PI * 2
    const r = 3 + Math.random() * 9
    const s = Math.sqrt(1 - u * u)
    start[i * 3] = s * Math.cos(th) * r * 1.6
    start[i * 3 + 1] = u * r * 0.7
    start[i * 3 + 2] = s * Math.sin(th) * r - 3

    // Target: blade (x from -1 to 1), soft halo, and two triangles at the ends
    const k = i / COUNT
    let tx
    let ty
    if (k < 0.74) {
      tx = Math.random() * 2 - 1
      ty = (Math.random() - 0.5) * 0.006
    } else if (k < 0.82) {
      tx = Math.random() * 2 - 1
      ty = (Math.random() - 0.5) * 0.05
    } else {
      const [px, py] = trianglePoint(TRI_W, TRI_H)
      const left = k < 0.91
      tx = left ? -(1 + TRI_GAP + px) : 1 + TRI_GAP + px
      ty = py
    }
    target[i * 3] = tx
    target[i * 3 + 1] = ty
    target[i * 3 + 2] = 0

    rand[i] = Math.random()
    tint[i] = Math.random() < 0.05 ? 2 : Math.random()
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(target, 3))
  geometry.setAttribute('aStart', new THREE.BufferAttribute(start, 3))
  geometry.setAttribute('aTarget', new THREE.BufferAttribute(target, 3))
  geometry.setAttribute('aRand', new THREE.BufferAttribute(rand, 1))
  geometry.setAttribute('aTint', new THREE.BufferAttribute(tint, 1))

  const uniforms = {
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uBlade: { value: 3 },
    uWarp: { value: 0 },
    uPixelRatio: { value: 1 },
    uSize: { value: small ? 2.2 : 2.6 },
  }

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  scene.add(points)

  // Match the particle blade to the CSS blade width: min(56rem, 78vw)
  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth
    const h = canvas.clientHeight || window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    renderer.setPixelRatio(dpr)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()

    const visibleH = 2 * 10 * Math.tan(THREE.MathUtils.degToRad(22.5))
    const visibleW = visibleH * camera.aspect
    const bladePx = Math.min(56 * 16, 0.78 * w)
    uniforms.uBlade.value = (bladePx / 2 / w) * visibleW
    uniforms.uPixelRatio.value = dpr
  }
  resize()
  window.addEventListener('resize', resize)

  let raf = 0
  let running = true
  let last = performance.now()
  let smooth = 0
  let ignitedAt = 0

  const frame = (now) => {
    if (!running) return
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now

    smooth += (getProgress() - smooth) * Math.min(1, dt * 4)
    uniforms.uProgress.value = smooth
    uniforms.uTime.value = now / 1000

    if (ignitedAt) {
      const w = Math.min(1, (now - ignitedAt) / 900)
      uniforms.uWarp.value = w * w
    }

    // Camera drifts around the cloud, then locks dead-centre as loading completes
    const settle = smooth * smooth * (3 - 2 * smooth)
    const a = (1 - settle) * 0.55 * Math.sin(now * 0.00025)
    camera.position.set(Math.sin(a) * 10, (1 - settle) * 0.9 * Math.cos(now * 0.0002), Math.cos(a) * 10)
    camera.lookAt(0, 0, 0)

    renderer.render(scene, camera)
    raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)

  return {
    ignite() {
      if (!ignitedAt) ignitedAt = performance.now()
    },
    destroy() {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}