import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import useActiveChapter from '../hooks/useActiveChapter'
import { CHAPTERS } from '../lib/chapters'

const DURATION = 1.1 // seconds

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

const FRAG = `
varying vec2 vUv;
uniform float uProg;
uniform float uDir;
uniform float uTime;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void main() {
  vec2 uv = vUv;
  float x = uDir > 0.0 ? uv.x : 1.0 - uv.x;
  float head = uProg * 1.7 - 0.35;
  float wob = (noise(vec2(uv.y * 5.0, uTime * 0.8)) - 0.5) * 0.14
            + (noise(vec2(uv.y * 40.0, uTime * 2.0)) - 0.5) * 0.02;
  float d = x - head + wob; // > 0 ahead of the edge, < 0 behind it

  float core = exp(-pow(d * 30.0, 2.0));
  float trail = d < 0.0 ? exp(d * 5.5) : 0.0;
  float streaks = smoothstep(0.55, 1.0, noise(vec2(uv.y * 120.0, x * 3.0 - uTime * 6.0)));
  float env = pow(sin(3.14159 * clamp(uProg, 0.0, 1.0)), 0.7);

  vec3 cryo = vec3(0.66, 0.86, 1.0);
  vec3 red = vec3(0.89, 0.15, 0.18);
  vec3 col = mix(red, cryo, smoothstep(-0.35, 0.0, d));
  col = mix(col, vec3(1.0), core);

  float a = (core * 0.95 + trail * streaks * 0.55 + trail * 0.08) * env;
  gl_FragColor = vec4(col, a);
}`

function createTransition(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })
  renderer.setPixelRatio(0.6) // soft band, so a low resolution is fine and keeps it fast
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.Camera()
  const geometry = new THREE.PlaneGeometry(2, 2)
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uProg: { value: 0 },
      uDir: { value: 1 },
      uTime: { value: 0 },
    },
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.frustumCulled = false
  scene.add(mesh)

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let raf = 0
  let t0 = 0
  let running = false

  const resize = () => renderer.setSize(window.innerWidth, window.innerHeight, false)
  resize()
  window.addEventListener('resize', resize)

  const tick = (now) => {
    const p = (now - t0) / 1000 / DURATION
    if (p >= 1) {
      running = false
      material.uniforms.uProg.value = 0
      renderer.clear()
      return
    }
    material.uniforms.uProg.value = p
    material.uniforms.uTime.value = now / 1000
    renderer.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }

  return {
    play(dir) {
      if (reduce) return
      material.uniforms.uDir.value = dir
      t0 = performance.now()
      if (!running) {
        running = true
        raf = requestAnimationFrame(tick)
      }
    },
    dispose() {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    },
  }
}

// Plays a light-sweep whenever the active chapter changes
export default function ChapterTransition() {
  const active = useActiveChapter()
  const canvasRef = useRef(null)
  const apiRef = useRef(null)
  const prevRef = useRef(null)

  useEffect(() => {
    try {
      apiRef.current = createTransition(canvasRef.current)
    } catch {
      apiRef.current = null
    }
    return () => {
      apiRef.current?.dispose()
      apiRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!active?.id) return
    if (prevRef.current === null) {
      prevRef.current = active.id
      return
    }
    if (prevRef.current === active.id) return
    const from = CHAPTERS.findIndex((c) => c.id === prevRef.current)
    const to = CHAPTERS.findIndex((c) => c.id === active.id)
    prevRef.current = active.id
    if (from < 0 || to < 0) return
    apiRef.current?.play(to >= from ? 1 : -1)
  }, [active?.id])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[55] h-full w-full"
    />
  )
}