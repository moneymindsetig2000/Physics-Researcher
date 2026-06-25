"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function WebGLShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene | null
    camera: THREE.OrthographicCamera | null
    renderer: THREE.WebGLRenderer | null
    mesh: THREE.Mesh | null
    uniforms: any
    animationId: number | null
  }>({
    scene: null,
    camera: null,
    renderer: null,
    mesh: null,
    uniforms: null,
    animationId: null,
  })

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const { current: refs } = sceneRef
    let isVisible = true
    let isPageVisible = !document.hidden

    let resizeId: number | null = null

    const vertexShader = `
      attribute vec3 position;
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `

    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float distortion;

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
        
        float d = length(p) * distortion;
        
        float rx = p.x * (1.0 + d);
        float gx = p.x;
        float bx = p.x * (1.0 - d);

        float r = 0.05 / abs(p.y + sin((rx + time) * xScale) * yScale);
        float g = 0.05 / abs(p.y + sin((gx + time) * xScale) * yScale);
        float b = 0.05 / abs(p.y + sin((bx + time) * xScale) * yScale);
        
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `

    const initScene = () => {
      try {
        refs.scene = new THREE.Scene()
        refs.renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: false,
          antialias: false,
          depth: false,
          stencil: false,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false
        })
        refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        refs.renderer.setClearColor(new THREE.Color(0x000000), 1)

        refs.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1)

        refs.uniforms = {
          resolution: { value: [window.innerWidth, window.innerHeight] },
          time: { value: 0.0 },
          xScale: { value: 1.0 },
          yScale: { value: 0.5 },
          distortion: { value: 0.05 },
        }

        const position = new Float32Array([
          -1.0, -1.0, 0.0,
          1.0, -1.0, 0.0,
          -1.0, 1.0, 0.0,
          1.0, -1.0, 0.0,
          -1.0, 1.0, 0.0,
          1.0, 1.0, 0.0,
        ])

        const positions = new THREE.BufferAttribute(position, 3)
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute("position", positions)

        const material = new THREE.RawShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: refs.uniforms,
          side: THREE.DoubleSide,
          depthTest: false,
          depthWrite: false,
        })

        refs.mesh = new THREE.Mesh(geometry, material)
        refs.scene.add(refs.mesh)

        handleResize()
      } catch (error) {
        console.warn("WebGLShader WebGL initialization failed:", error)
        refs.renderer = null
      }
    }

    const animate = () => {
      if (!isVisible || !isPageVisible || !refs.renderer) {
        refs.animationId = null
        return
      }
      if (refs.uniforms) refs.uniforms.time.value += 0.01
      if (refs.renderer && refs.scene && refs.camera) {
        refs.renderer.render(refs.scene, refs.camera)
      }
      refs.animationId = requestAnimationFrame(animate)
    }

    const tryStart = () => {
      if (isVisible && isPageVisible && !refs.animationId && refs.renderer) {
        refs.animationId = requestAnimationFrame(animate)
      }
    }

    const tryStop = () => {
      if (refs.animationId) {
        cancelAnimationFrame(refs.animationId)
        refs.animationId = null
      }
    }

    const handleResize = () => {
      if (resizeId) cancelAnimationFrame(resizeId)
      resizeId = requestAnimationFrame(() => {
        if (!refs.renderer || !refs.uniforms) return
        const width = window.innerWidth
        const height = window.innerHeight
        refs.renderer.setSize(width, height, false)
        refs.uniforms.resolution.value = [width, height]
        resizeId = null
      })
    }

    const handleContextLost = (event: Event) => {
      event.preventDefault()
      console.warn("WebGLShader: WebGL context lost. Cleaning up resources.")
      tryStop()

      if (refs.mesh) {
        refs.scene?.remove(refs.mesh)
        refs.mesh.geometry.dispose()
        if (refs.mesh.material instanceof THREE.Material) {
          refs.mesh.material.dispose()
        }
        refs.mesh = null
      }
      if (refs.renderer) {
        try {
          refs.renderer.dispose()
        } catch (e) {
          console.warn("Error disposing renderer during context loss:", e)
        }
        refs.renderer = null
      }
      refs.scene = null;
      refs.camera = null;
      refs.uniforms = null;
    }

    const handleContextRestored = () => {
      console.log("WebGLShader: WebGL context restored. Re-initializing scene.")
      initScene()
      tryStart()
    }

    canvas.addEventListener("webglcontextlost", handleContextLost, false)
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false)

    initScene()
    tryStart()

    window.addEventListener("resize", handleResize, { passive: true })

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting
        isVisible ? tryStart() : tryStop()
      },
      { threshold: 0 }
    )
    observer.observe(canvas)

    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden
      isPageVisible ? tryStart() : tryStop()
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      tryStop()
      if (resizeId) cancelAnimationFrame(resizeId)
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      observer.disconnect()

      canvas.removeEventListener("webglcontextlost", handleContextLost)
      canvas.removeEventListener("webglcontextrestored", handleContextRestored)

      if (refs.mesh) {
        refs.scene?.remove(refs.mesh)
        refs.mesh.geometry.dispose()
        if (refs.mesh.material instanceof THREE.Material) {
          refs.mesh.material.dispose()
        }
      }
      if (refs.renderer) {
        try {
          refs.renderer.dispose()
        } catch (e) {
          console.warn("Error during renderer disposal:", e)
        }
      }

      refs.scene = null
      refs.camera = null
      refs.renderer = null
      refs.mesh = null
      refs.uniforms = null
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full block"
      style={{ transform: 'translateZ(0)', willChange: 'auto' }}
    />
  )
}