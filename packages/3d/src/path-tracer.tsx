"use client"

import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js"
import { WebGLPathTracer } from "three-gpu-pathtracer"

import { OVERLAY } from "./overlay"

/** How long the view and the scene must hold still before tracing starts. */
const SETTLE_MS = 250

/** Width of the environment copy the tracer samples light from. */
const ENVIRONMENT_WIDTH = 1024

const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false })

/**
 * Traces the scene once it holds still, a sample a frame, noisy at first and
 * cleaner with each one, up to `maxSamples`; then it stops drawing. Any change
 * to the view or the scene hands the frame back to the raster renderer until
 * things settle again. The canvas carries the sample count in
 * `data-samples`, for tests and agents.
 *
 * `onReady` fires once, at the first traced sample, when the shader has
 * compiled and the environment and the scene are in; or at once when this
 * browser can't trace, which leaves the raster frame in place for good.
 */
export default function PathTracer({
  version,
  background,
  maxSamples,
  onTracing,
  onReady,
}: {
  /** Changes whenever the scene does: the tracer rebuilds once it settles. */
  version: unknown
  /** The staging background color, shown behind the traced frame. */
  background: string
  maxSamples: number
  /** True while the traced frame is on screen, so the composer can stand aside. */
  onTracing: (tracing: boolean) => void
  onReady?: () => void
}) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)
  const state = useRef({
    tracer: null as WebGLPathTracer | null,
    failed: false,
    ready: false,
    built: null as THREE.Texture | null | undefined,
    dirty: true,
    tracing: false,
    shown: false,
    settled: false,
    timer: 0 as ReturnType<typeof setTimeout> | 0,
    position: new THREE.Vector3(NaN, NaN, NaN),
    rotation: new THREE.Quaternion(),
    lens: new THREE.Matrix4(),
  })
  // The latest callbacks, without restarting effects when they change.
  const callbacks = useRef({ onTracing, onReady })
  callbacks.current = { onTracing, onReady }

  const ready = () => {
    const current = state.current
    if (current.ready) return
    current.ready = true
    callbacks.current.onReady?.()
  }

  const stop = () => {
    const current = state.current
    current.tracing = false
    gl.domElement.dataset.samples = "0"
    if (!current.shown) return
    current.shown = false
    gl.domElement.style.background = ""
    callbacks.current.onTracing(false)
  }

  const fail = (error?: unknown) => {
    if (error) console.warn("Path tracing is off:", error)
    state.current.failed = true
    stop()
    ready()
  }

  const settleLater = () => {
    const current = state.current
    current.settled = false
    clearTimeout(current.timer)
    current.timer = setTimeout(() => {
      current.settled = true
      invalidate()
    }, SETTLE_MS)
  }

  useEffect(() => {
    if (!canTrace(gl)) {
      fail()
      return
    }
    let tracer: WebGLPathTracer
    try {
      tracer = new WebGLPathTracer(gl)
    } catch (error) {
      fail(error)
      return
    }
    tracer.tiles.set(1, 1)
    tracer.minSamples = 1
    tracer.fadeDuration = 0
    tracer.renderDelay = 0
    tracer.rasterizeScene = false
    tracer.filterGlossyFactor = 0.5
    state.current.tracer = tracer
    const current = state.current
    return () => {
      clearTimeout(current.timer)
      tracer.dispose()
      current.tracer = null
    }
    // fail only touches refs and the latest callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl])

  useEffect(() => {
    state.current.dirty = true
    stop()
    settleLater()
    // stop and settleLater only touch refs and stable values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  useFrame(() => {
    const current = state.current
    const tracer = current.tracer
    if (!tracer || current.failed) return
    if (
      moved(current.position, current.rotation, camera) ||
      !current.lens.equals(camera.projectionMatrix)
    ) {
      current.position.copy(camera.position)
      current.rotation.copy(camera.quaternion)
      current.lens.copy(camera.projectionMatrix)
      stop()
      settleLater()
      return
    }
    if (!current.settled) return
    const source = scene.userData.equirect as THREE.Texture | undefined
    // The environment is still loading; its arrival asks for a frame.
    if (!source) return
    try {
      if (!current.tracing) {
        if (current.dirty || current.built !== source) {
          build(gl, scene, camera, tracer, source)
          current.built = source
          current.dirty = false
        } else {
          tracer.updateCamera()
        }
        current.tracing = true
      }
      tracer.renderSample()
    } catch (error) {
      fail(error)
      return
    }
    const samples = Math.floor(tracer.samples)
    gl.domElement.dataset.samples = String(samples)
    if (samples >= 1) {
      if (!current.shown) {
        current.shown = true
        gl.domElement.style.background = background
        callbacks.current.onTracing(true)
      }
      drawOverlays(gl, scene, camera)
      ready()
    }
    if (samples < maxSamples) invalidate()
  }, 2)

  return null
}

/** The orbit controls' own threshold for a change worth a frame. */
const MOVED = 1e-6

/**
 * Whether the camera moved, by the orbit controls' own measure. Damped
 * controls never settle exactly: below this they stop asking for frames,
 * but each frame drawn still nudges the camera, so a stricter test would
 * never see the view hold still.
 */
function moved(
  position: THREE.Vector3,
  rotation: THREE.Quaternion,
  camera: THREE.Camera
) {
  return (
    !(position.distanceToSquared(camera.position) <= MOVED) ||
    8 * (1 - rotation.dot(camera.quaternion)) > MOVED
  )
}

/** Float render targets with linear filtering: what the tracer accumulates in. */
function canTrace(gl: THREE.WebGLRenderer) {
  return (
    gl.capabilities.isWebGL2 &&
    gl.extensions.has("EXT_color_buffer_float") &&
    gl.extensions.has("OES_texture_float_linear")
  )
}

/** The overlay meshes, and every other mesh, which may hide them. */
function splitMeshes(scene: THREE.Scene) {
  const overlays: THREE.Mesh[] = []
  const solids: THREE.Mesh[] = []
  scene.traverseVisible((object) => {
    if (!(object instanceof THREE.Mesh)) return
    if (object.userData[OVERLAY]) overlays.push(object)
    else solids.push(object)
  })
  return { overlays, solids }
}

/**
 * Draws the overlays over the traced frame, hidden where the shape stands in
 * front of them: the shape's depth first, then the overlays against it.
 */
function drawOverlays(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera
) {
  const { overlays, solids } = splitMeshes(scene)
  if (overlays.length === 0) return
  const background = scene.background
  const autoClear = gl.autoClear
  scene.background = null
  gl.autoClear = false
  gl.clearDepth()
  for (const mesh of overlays) mesh.visible = false
  scene.overrideMaterial = depthOnly
  gl.render(scene, camera)
  scene.overrideMaterial = null
  for (const mesh of overlays) mesh.visible = true
  for (const mesh of solids) mesh.visible = false
  gl.render(scene, camera)
  for (const mesh of solids) mesh.visible = true
  gl.autoClear = autoClear
  scene.background = background
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
  tracer: WebGLPathTracer,
  source: THREE.Texture
) {
  const environment = scene.environment
  const background = scene.background
  const { overlays } = splitMeshes(scene)
  const copy = readableCopy(gl, source)
  scene.environment = copy
  scene.background = background ? copy : null
  for (const mesh of overlays) mesh.visible = false
  try {
    tracer.setScene(scene, camera)
  } finally {
    for (const mesh of overlays) mesh.visible = true
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
  const material = new THREE.MeshBasicMaterial({ map: source })
  const quad = new FullScreenQuad(material)
  const previous = gl.getRenderTarget()
  gl.setRenderTarget(target)
  quad.render(gl)
  gl.setRenderTarget(previous)
  const data = new Uint16Array(width * height * 4)
  gl.readRenderTargetPixels(target, 0, 0, width, height, data)
  quad.dispose()
  material.dispose()
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
