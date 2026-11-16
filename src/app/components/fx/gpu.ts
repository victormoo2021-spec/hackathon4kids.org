// One WebGL2 probe for the whole page (each probe is a real context; on software GL the first one is slow).
export type GpuTier = 'gpu' | 'soft' | 'none'

let tier: GpuTier | undefined

/** 'gpu' = real hardware, 'soft' = SwiftShader / llvmpipe, 'none' = no WebGL2. Memoised; client only. */
export function gpuTier(): GpuTier {
  if (tier) return tier
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    const dbg = gl?.getExtension('WEBGL_debug_renderer_info')
    const name = gl && dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : ''
    tier = !gl ? 'none' : /swiftshader|llvmpipe|software/i.test(name) ? 'soft' : 'gpu'
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    tier = 'none'
  }
  return tier
}
