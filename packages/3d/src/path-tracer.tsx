"use client"

import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js"
import { WebGLPathTracer } from "three-gpu-pathtracer"

/** How long the view and the scene must hold still before tracing starts. */
const SETTLE_MS = 250

/** Width of the environment copy the tracer samples light from. */
const ENVIRONMENT_WIDTH = 1024

export type PathTracerStats = {
  samples: number
  buildMs: number
  /** Milliseconds from the start of tracing to 1, 16 and 64 samples. */
  at: Record<number, number>
}

/**
 * Traces the scene once it holds still, a sample a frame, noisy at first and
 * cleaner with each one, up to `maxSamples`; then it stops drawing. Any change
 * to the view or the scene hands the frame back to the raster renderer until
 * things settle again.
 */
export default function PathTracer({
  version,
  background,
  maxSamples,
  onTracing,
}: {
  /** Changes whenever the scene does: the tracer rebuilds once it settles. */
  version: unknown
  /** The staging background color, shown behind the traced frame. */
  background: string
  maxSamples: number
  onTracing: (tracing: boolean) => void
}) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)
  const state = useRef({
    tracer: null as WebGLPathTracer | null,
    dirty: true,
    tracing: false,
    settled: false,
    timer: 0 as ReturnType<typeof setTimeout> | 0,
    view: new THREE.Matrix4(),
    lens: new THREE.Matrix4(),
    started: 0,
    stats: { samples: 0, buildMs: 0, at: {} } as PathTracerStats,
  })

  const settleLater = () => {
    const current = state.current
    current.settled = false
    clearTimeout(current.timer)
    current.timer = setTimeout(() => {
      current.settled = true
      invalidate()
    }, SETTLE_MS)
  }

  const stop = () => {
    const current = state.current
    if (!current.tracing) return
    current.tracing = false
    gl.domElement.style.background = ""
    onTracing(false)
  }

  useEffect(() => {
    const tracer = new WebGLPathTracer(gl)
    tracer.tiles.set(1, 1)
    tracer.minSamples = 1
    tracer.fadeDuration = 0
    tracer.renderDelay = 0
    tracer.rasterizeScene = false
    tracer.filterGlossyFactor = 0.5
    state.current.tracer = tracer
    return () => {
      tracer.dispose()
      state.current.tracer = null
    }
  }, [gl])

  useEffect(() => {
    state.current.dirty = true
    stop()
    settleLater()
    // stop and settleLater only touch refs and stable callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  useEffect(() => {
    const current = state.current
    return () => clearTimeout(current.timer)
  }, [])

  useFrame(() => {
    const current = state.current
    const tracer = current.tracer
    if (!tracer) return
    camera.updateMatrixWorld()
    if (
      !current.view.equals(camera.matrixWorld) ||
      !current.lens.equals(camera.projectionMatrix)
    ) {
      current.view.copy(camera.matrixWorld)
      current.lens.copy(camera.projectionMatrix)
      stop()
      settleLater()
      return
    }
    if (!current.settled) return
    if (!current.tracing) {
      if (current.dirty) {
        const start = performance.now()
        build(gl, scene, camera, tracer)
        current.dirty = false
        current.stats = {
          samples: 0,
          buildMs: Math.round(performance.now() - start),
          at: {},
        }
      } else {
        tracer.updateCamera()
        current.stats = { ...current.stats, samples: 0, at: {} }
      }
      current.tracing = true
      current.started = performance.now()
      gl.domElement.style.background = background
      onTracing(true)
    }
    tracer.renderSample()
    const samples = Math.floor(tracer.samples)
    current.stats.samples = samples
    for (const mark of [1, 16, 64])
      if (samples >= mark && !(mark in current.stats.at))
        current.stats.at[mark] = Math.round(performance.now() - current.started)
    ;(window as { __pathTracer?: PathTracerStats }).__pathTracer =
      current.stats
    if (samples < maxSamples) invalidate()
  }, 2)

  return null
}

/**
 * Hands the scene to the tracer with an environment it can sample: three's
 * reflection map lives only on the GPU, so the tracer gets a smaller copy of
 * the source panorama, read back once. The scene is put back as it was.
 */
function build(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  tracer: WebGLPathTracer
) {
  const source = scene.userData.equirect as THREE.Texture | undefined
  const environment = scene.environment
  const background = scene.background
  const copy = source ? readableCopy(gl, source) : null
  scene.environment = copy
  scene.background = background && copy ? copy : null
  try {
    tracer.setScene(scene, camera)
  } finally {
    scene.environment = environment
    scene.background = background
  }
}

/** The panorama as a DataTexture, which the tracer can read on the CPU. */
function readableCopy(gl: THREE.WebGLRenderer, source: THREE.Texture) {
  if ((source.image as { data?: unknown } | undefined)?.data) return source
  const width = ENVIRONMENT_WIDTH
  const height = width / 2
  const target = new THREE.WebGLRenderTarget(width, height, {
    type: THREE.HalfFloatType,
  })
  const quad = new FullScreenQuad(new THREE.MeshBasicMaterial({ map: source }))
  const previous = gl.getRenderTarget()
  gl.setRenderTarget(target)
  quad.render(gl)
  gl.setRenderTarget(previous)
  const data = new Uint16Array(width * height * 4)
  gl.readRenderTargetPixels(target, 0, 0, width, height, data)
  quad.dispose()
  ;(quad.material as THREE.Material).dispose()
  target.dispose()
  const texture = new THREE.DataTexture(
    data,
    width,
    height,
    THREE.RGBAFormat,
    THREE.HalfFloatType
  )
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}
