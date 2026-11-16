// Pointer fluid: a small stable-fluids sim (velocity + one-channel dye) stirred by the pointer and,
// lightly, by scrolling. The dye is drawn as yellow light ink with purple edges on a screen-blended
// canvas above the page; [data-spectral] headings get a prism fringe smeared along the flow.
// Raw WebGL2, loaded on first interaction, zero frames when idle.

const VS = `#version 300 es
out vec2 v;void main(){v=vec2(gl_VertexID&1,gl_VertexID>>1)*2.;gl_Position=vec4(v*2.-1.,0,1);}`
const H = `#version 300 es
precision highp float;precision highp sampler2D;in vec2 v;out vec4 o;
`
// add uAdd along the segment uA→uB (thin continuous strokes however fast the pointer moves)
const SPLAT = `${H}uniform sampler2D uT;uniform vec2 uA,uB;uniform float uAsp,uR,uMax;uniform vec3 uAdd;
void main(){vec2 p=v-uA,d=uB-uA;p.x*=uAsp;d.x*=uAsp;
float h=clamp(dot(p,d)/max(dot(d,d),1e-9),0.,1.),r=length(p-d*h);
o=texture(uT,v)+vec4(uAdd*exp(-r*r/(uR*uR)),0);o.xyz=clamp(o.xyz,-uMax,uMax);}`
const ADVECT = `${H}uniform sampler2D uV,uS;uniform float uDt,uAsp,uK,uSub;
void main(){o=texture(uS,v-uDt*texture(uV,v).xy*vec2(1./uAsp,1.))*uK;o.x=mix(o.x,max(o.x-uSub,0.),step(1e-9,uSub));}`
const NB = `float L=texture(uT,v-vec2(uTx.x,0)).x,R=texture(uT,v+vec2(uTx.x,0)).x,B=texture(uT,v-vec2(0,uTx.y)).x,T=texture(uT,v+vec2(0,uTx.y)).x;`
// curl of velocity, then a push toward higher |curl| so small eddies survive the coarse grid
const CURL = `${H}uniform sampler2D uT;uniform vec2 uTx;
void main(){float l=texture(uT,v-vec2(uTx.x,0)).y,r=texture(uT,v+vec2(uTx.x,0)).y,b=texture(uT,v-vec2(0,uTx.y)).x,t=texture(uT,v+vec2(0,uTx.y)).x;o=vec4(.5*(r-l-t+b));}`
const VORT = `${H}uniform sampler2D uT,uV;uniform vec2 uTx;uniform float uDt,uK;
void main(){${NB}float c=texture(uT,v).x;vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L));
f=f/(length(f)+1e-4)*uK*c*vec2(1,-1);o=vec4(texture(uV,v).xy+f*uDt,0,1);}`
const DIV = `${H}uniform sampler2D uT;uniform vec2 uTx;
void main(){float l=texture(uT,v-vec2(uTx.x,0)).x,r=texture(uT,v+vec2(uTx.x,0)).x,b=texture(uT,v-vec2(0,uTx.y)).y,t=texture(uT,v+vec2(0,uTx.y)).y;o=vec4(.5*(r-l+t-b));}`
const JACOBI = `${H}uniform sampler2D uT,uD;uniform vec2 uTx;
void main(){${NB}o=vec4((L+R+B+T-texture(uD,v).x)*.25);}`
const GRAD = `${H}uniform sampler2D uT,uV;uniform vec2 uTx;
void main(){${NB}o=vec4(texture(uV,v).xy-.5*vec2(R-L,T-B),0,1);}`
const BLOOM = `${H}uniform sampler2D uT;uniform vec2 uTx;
void main(){o=.25*(texture(uT,v+uTx*vec2(1.5,.5))+texture(uT,v+uTx*vec2(-.5,1.5))+texture(uT,v+uTx*vec2(-1.5,-.5))+texture(uT,v+uTx*vec2(.5,-1.5)));}`
// uTm maps screen uv to the text texture (it covers the viewport plus a scroll margin).
// Text texture: r = [data-spectral] glyphs, b = "there is text here" shield.
const COMP = `${H}uniform sampler2D uD,uB,uV,uT;uniform vec2 uTm;uniform float uAsp,uTxt;
const vec3 P=vec3(.486,.361,1.),Y=vec3(1.,.839,.039),W=vec3(1.,.97,.86);
float lum(vec3 c){return dot(c*c,vec3(.2126,.7152,.0722));}
float tap(vec2 p,vec2 d,float k,float t0){float l=.8+1.6*k;return max(textureLod(uT,p-d*k,l).r-max(textureLod(uT,p,l).r,t0),0.);}
void main(){
float h=texture(uD,v).r,g=texture(uB,v).r;
vec2 tp=vec2(v.x,(1.-v.y)*uTm.x+uTm.y);
float s=textureLod(uT,tp,3.).b*uTxt,ot=smoothstep(.1,.5,s);
// wispier over any text, a touch stronger in empty space
h*=mix(1.12,.6,ot);g*=mix(1.12,.45,ot);
vec3 c=mix(P,Y,smoothstep(.03,.2,h)*(1.-.85*smoothstep(.75,1.,s)));c=mix(c,W,smoothstep(.5,1.,h));
c=c*(1.-exp(-h*h*9.))+mix(P,Y,.6)*g*.7;

// keep text readable: over text blocks the added light is clamped to a low luminance
float cap=mix(2.,mix(.16,.055,smoothstep(.65,1.,s)),ot);
c*=min(1.,sqrt(cap/max(lum(c),1e-5)));
if(uTxt>0.){
vec2 d=texture(uV,v).xy*.05;float mv=smoothstep(.005,.022,length(d));d*=min(1.,.045/(length(d)+1e-5))*mv;d=vec2(d.x/uAsp,-d.y*uTm.x);
float t0=texture(uT,tp).r;
// prism smear: violet travels furthest, yellow in the middle (and strongest), red hugs the glyph
// displaced minus the equally blurred original, so the blur adds no halo of its own: zero flow, zero fringe
// only the outer fringe: nothing is added where the glyph itself is, so it can never read as a second copy
c+=(vec3(.655,.545,1.)*tap(tp,d,1.,t0)*.7+Y*tap(tp,d,.62,t0)*1.35+vec3(1.,.32,.18)*tap(tp,d,.3,t0)*.6)*(1.-smoothstep(0.,.35,t0))*mv*.44;}
c+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;
o=vec4(c,1);}`

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number }
type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }

const SHIELD = 'p,li,h1,h2,h3,h4,dt,dd,label,blockquote,figcaption,a,button,input,textarea,summary,[data-spectral]'
const SIM = 128, DYE = 512, MARGIN = 0.25

declare global {
  interface Window { __fluid?: { active: () => boolean; frames: () => number } }
}

export function createFluid(canvas: HTMLCanvasElement): (() => void) | null {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' })
  if (!gl) return null
  const dbg = gl.getExtension('WEBGL_debug_renderer_info')
  if (/swiftshader|llvmpipe|software/i.test(dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '')) return null
  if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) return null
  const par = gl.getExtension('KHR_parallel_shader_compile')
  const mq = matchMedia('(prefers-reduced-motion: reduce)')

  const compile = (fs: string): Prog => {
    const p = gl.createProgram()!
    for (const [type, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]] as const) {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src); gl.compileShader(s); gl.attachShader(p, s)
    }
    gl.linkProgram(p)
    return { p, u: {} }
  }
  const progs = { splat: compile(SPLAT), advect: compile(ADVECT), curl: compile(CURL), vort: compile(VORT), div: compile(DIV), jacobi: compile(JACOBI), grad: compile(GRAD), bloom: compile(BLOOM), comp: compile(COMP) }
  const all = Object.values(progs)

  const target = (w: number, h: number, ifmt: number, fmt: number): Target => {
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, gl.HALF_FLOAT, null)
    for (const [k, val] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, val)
    const fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT)
    return { tex, fbo, w, h }
  }
  let vel: [Target, Target], prs: [Target, Target], dye: [Target, Target], div: Target, bloom: Target
  let targets: Target[] = []
  let vw = 0, vh = 0, asp = 1

  const size = () => {
    if (vw === innerWidth && vh === innerHeight) return
    vw = innerWidth; vh = innerHeight; asp = vw / vh
    const dpr = Math.min(devicePixelRatio || 1, 1.25)
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr)
    targets.forEach((t) => { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo) })
    const sw = Math.max(8, Math.round(SIM * asp)), dw = Math.max(8, Math.round(DYE * asp))
    const two = (w: number, h: number, i: number, f: number): [Target, Target] => [target(w, h, i, f), target(w, h, i, f)]
    vel = two(sw, SIM, gl.RG16F, gl.RG); prs = two(sw, SIM, gl.R16F, gl.RED); dye = two(dw, DYE, gl.R16F, gl.RED)
    div = target(sw, SIM, gl.R16F, gl.RED); bloom = target(dw >> 2, DYE >> 2, gl.R16F, gl.RED)
    targets = [...vel, ...prs, ...dye, div, bloom]
    sig = ''
  }

  // draw one pass; `set` binds uniforms, textures are given as [name, texture] pairs
  const pass = (pr: Prog, dst: Target | null, tex: [string, WebGLTexture][], set?: (u: Prog['u']) => void) => {
    gl.useProgram(pr.p)
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fbo : null)
    gl.viewport(0, 0, dst ? dst.w : canvas.width, dst ? dst.h : canvas.height)
    tex.forEach(([n, t], i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(pr.u[n], i) })
    set?.(pr.u)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
  const swap = (t: [Target, Target]) => { t.reverse() }
  const splat = (t: [Target, Target], a: number[], b: number[], r: number, add: number[], max: number) => {
    pass(progs.splat, t[1], [['uT', t[0].tex]], (u) => {
      gl.uniform2f(u.uA, a[0], a[1]); gl.uniform2f(u.uB, b[0], b[1])
      gl.uniform1f(u.uAsp, asp); gl.uniform1f(u.uR, r); gl.uniform1f(u.uMax, max); gl.uniform3f(u.uAdd, add[0], add[1], 0)
    })
    swap(t)
  }

  // --- text texture: spectral glyphs (red) + text shield (blue), in viewport space with a scroll margin
  const tcan = document.createElement('canvas')
  const ctx = tcan.getContext('2d')!
  const ttex = gl.createTexture()!
  let sig = '', rasterY = 0, hasText = false
  type Word = { s: string; x: number; y: number; h: number; font: string; ls: string; clip: number[] }
  const range = document.createRange()
  const re = /\S+/g
  // Every active frame: where is each visible word right now, and what clips it? Headings animate
  // (scroll-scrubbed line masks, reveals), so a stale raster would show as a ghost copy of the text.
  const measure = (m: number): Word[] => {
    const seen = new Map<Element, { op: number; clip: number[] }>()
    // opacity product and overflow-clip rect accumulated from the element up to <body>
    const chain = (el: Element): { op: number; clip: number[] } => {
      const hit = seen.get(el)
      if (hit) return hit
      const up = el.parentElement && el !== document.body ? chain(el.parentElement) : { op: 1, clip: [-1e5, -1e5, 1e5, 1e5] }
      const cs = getComputedStyle(el)
      let clip = up.clip
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible' || cs.clip !== 'auto') {
        const r = el.getBoundingClientRect()
        clip = [Math.max(clip[0], r.left), Math.max(clip[1], r.top), Math.min(clip[2], r.right), Math.min(clip[3], r.bottom)]
      }
      const out = { op: cs.visibility === 'hidden' ? 0 : up.op * +cs.opacity, clip }
      seen.set(el, out)
      return out
    }
    const words: Word[] = []
    document.querySelectorAll<HTMLElement>('[data-spectral]').forEach((el) => {
      const b = el.getBoundingClientRect()
      if (b.bottom < -m || b.top > vh + m) return
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
        const p = n.parentElement
        if (!p) continue
        const { op, clip } = chain(p)
        // mid-fade text is left alone: a fringe is only honest around fully shown glyphs
        if (op < 0.99 || clip[2] - clip[0] < 2 || clip[3] - clip[1] < 2) continue
        const cs = getComputedStyle(p)
        const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, ls = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing
        const tt = cs.textTransform
        // ponytail: one rect per word, so a word broken across lines (hyphenation) is drawn unbroken; go per-character if that ever shows
        for (let w = re.exec(n.data); w; w = re.exec(n.data)) {
          range.setStart(n, w.index); range.setEnd(n, w.index + w[0].length)
          const r = range.getClientRects()[0]
          if (!r || r.bottom <= clip[1] || r.top >= clip[3] || r.right <= clip[0] || r.left >= clip[2]) continue
          words.push({ s: tt === 'uppercase' ? w[0].toUpperCase() : tt === 'lowercase' ? w[0].toLowerCase() : w[0], x: r.left, y: r.top, h: r.height, font, ls, clip })
        }
      }
    })
    return words
  }
  const raster = () => {
    const m = Math.round(vh * MARGIN), k = Math.min(1, 2048 / vw)
    const words = measure(m)
    const q = (n: number) => Math.round(n * 2) // half-pixel steps
    let s = `${vw}x${vh}`
    for (const w of words) s += `|${w.s},${q(w.x)},${q(w.y + scrollY)},${q(w.h)},${q(w.clip[1] + scrollY)},${q(w.clip[3] + scrollY)},${w.font}`
    if (s === sig && Math.abs(scrollY - rasterY) < vh * MARGIN * 0.6) return
    sig = s; rasterY = scrollY
    tcan.width = Math.round(vw * k); tcan.height = Math.round((vh + 2 * m) * k)
    ctx.setTransform(k, 0, 0, k, 0, m * k)
    ctx.fillStyle = '#000'; ctx.fillRect(0, -m, vw, vh + 2 * m)
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = '#00f'
    document.querySelectorAll(`main :is(${SHIELD}),footer :is(${SHIELD})`).forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width < 2 || r.height < 2 || r.bottom < -m || r.top > vh + m) return
      // large headings only need 3:1, so they tolerate more light than body copy
      ctx.globalAlpha = el.matches("h1,h2,[data-spectral],[data-spectral] *") ? 0.6 : 1
      ctx.fillRect(r.left - 8, r.top - 8, r.width + 16, r.height + 16)
    })
    ctx.globalAlpha = 1; ctx.fillStyle = '#f00'; ctx.textBaseline = 'alphabetic'
    hasText = words.length > 0
    for (const w of words) {
      ctx.save()
      ctx.beginPath(); ctx.rect(w.clip[0], w.clip[1], w.clip[2] - w.clip[0], w.clip[3] - w.clip[1]); ctx.clip()
      ctx.font = w.font; ctx.letterSpacing = w.ls
      const mt = ctx.measureText(w.s)
      ctx.fillText(w.s, w.x, w.y + (w.h - mt.fontBoundingBoxAscent - mt.fontBoundingBoxDescent) / 2 + mt.fontBoundingBoxAscent)
      ctx.restore()
    }
    ctx.globalCompositeOperation = 'source-over'
    gl.bindTexture(gl.TEXTURE_2D, ttex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tcan)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  }

  // --- input
  let px = 0.5, py = 0.5, lx = 0.5, ly = 0.5, moved = false, fresh = true, sdy = 0, lastScroll = scrollY
  let lastInput = -1e9, raf = 0, last = 0, ready = false, dead = false, frames = 0
  const wake = () => {
    lastInput = performance.now()
    if (raf || !ready || dead || document.hidden) return
    canvas.style.visibility = 'visible'
    last = 0
    raf = requestAnimationFrame(frame)
  }
  const point = (x: number, y: number) => {
    px = x / innerWidth; py = 1 - y / innerHeight
    // a new stroke (first move, or first after the sim went to sleep) starts where the pointer is
    if (fresh || !raf) { lx = px; ly = py; fresh = false }
    moved = true
    wake()
  }
  const onPointer = (e: PointerEvent) => { if (e.pointerType !== 'touch') point(e.clientX, e.clientY) }
  const onTouchStart = () => { fresh = true }
  const onTouch = (e: TouchEvent) => { const t = e.touches[0]; if (t) point(t.clientX, t.clientY) }
  const onScroll = () => {
    sdy += scrollY - lastScroll; lastScroll = scrollY
    // scrolling alone paints no ink, so it only needs frames when a heading can show the fringe (or ink is still live)
    if (raf || document.querySelector('[data-spectral]')) wake()
  }
  const onVis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0 } else if (performance.now() - lastInput < 400) wake() }

  const sleep = () => {
    gl.clearColor(0, 0, 0, 1)
    for (const t of [...targets, null]) { gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.fbo : null); gl.clear(gl.COLOR_BUFFER_BIT) }
    canvas.style.visibility = 'hidden' // no blend layer to composite while idle
    sdy = 0
  }

  const frame = (t: number) => {
    raf = 0
    if (dead || document.hidden) return
    const rm = mq.matches
    // ponytail: idle is decided by time since the last input rather than by reading velocity energy back
    // from the GPU (readPixels stalls); decay is exponential, so by then the field is below 1/255.
    if (t - lastInput > (rm ? 1200 : 2200)) return sleep()
    raf = requestAnimationFrame(frame)
    frames++
    size()
    const dt = last ? Math.min((t - last) / 1000, 1 / 30) : 1 / 60
    last = t
    raster()
    const k = rm ? 0.3 : 1 // reduced motion: same response, gentler and shorter-lived
    const tx = (u: Prog['u']) => gl.uniform2f(u.uTx, 1 / vel[0].w, 1 / vel[0].h)

    if (moved) {
      moved = false
      let vx = ((px - lx) * asp) / dt, vy = (py - ly) / dt // viewport-heights per second
      const sp = Math.hypot(vx, vy), c = Math.min(1, 5 / (sp || 1))
      vx *= c; vy *= c
      splat(vel, [lx, ly], [px, py], 0.035, [vx * 0.55 * k, vy * 0.55 * k], 8)
      splat(dye, [lx, ly], [px, py], 0.0065, [Math.min(0.12 + sp * 0.28, 0.8) * (rm ? 0.6 : 1), 0], 1.4)
      lx = px; ly = py
    }
    if (sdy) {
      splat(vel, [px, py], [px, py], 0.6, [0, Math.max(-3, Math.min(3, sdy / vh / dt)) * 0.1 * k], 8)
      sdy = 0
    }

    pass(progs.curl, div, [['uT', vel[0].tex]], tx)
    pass(progs.vort, vel[1], [['uT', div.tex], ['uV', vel[0].tex]], (u) => { tx(u); gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uK, 14) })
    swap(vel)
    pass(progs.advect, vel[1], [['uV', vel[0].tex], ['uS', vel[0].tex]], (u) => { gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uAsp, asp); gl.uniform1f(u.uK, Math.exp(-dt * (rm ? 4 : 1.8))); gl.uniform1f(u.uSub, 0) })
    swap(vel)
    pass(progs.div, div, [['uT', vel[0].tex]], tx)
    for (let i = 0; i < 8; i++) { pass(progs.jacobi, prs[1], [['uT', prs[0].tex], ['uD', div.tex]], tx); swap(prs) }
    pass(progs.grad, vel[1], [['uT', prs[0].tex], ['uV', vel[0].tex]], tx)
    swap(vel)
    pass(progs.advect, dye[1], [['uV', vel[0].tex], ['uS', dye[0].tex]], (u) => { gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uAsp, asp); gl.uniform1f(u.uK, Math.exp(-dt * (rm ? 4.5 : 3.2))); gl.uniform1f(u.uSub, dt * 0.05) })
    swap(dye)
    pass(progs.bloom, bloom, [['uT', dye[0].tex]], (u) => gl.uniform2f(u.uTx, 1 / dye[0].w, 1 / dye[0].h))
    const span = vh * (1 + 2 * MARGIN)
    pass(progs.comp, null, [['uD', dye[0].tex], ['uB', bloom.tex], ['uV', vel[0].tex], ['uT', ttex]], (u) => {
      gl.uniform2f(u.uTm, vh / span, (scrollY - rasterY + vh * MARGIN) / span)
      gl.uniform1f(u.uAsp, asp); gl.uniform1f(u.uTxt, hasText ? 1 : 0)
    })
  }

  // --- start once the shaders have linked (off the main thread where the driver allows)
  const poll = () => {
    if (dead) return
    if (par && all.some((pr) => !gl.getProgramParameter(pr.p, par.COMPLETION_STATUS_KHR))) return void setTimeout(poll, 16)
    for (const pr of all) {
      if (!gl.getProgramParameter(pr.p, gl.LINK_STATUS)) { console.error('fluid:', gl.getProgramInfoLog(pr.p)); dead = true; return }
      const n = gl.getProgramParameter(pr.p, gl.ACTIVE_UNIFORMS) as number
      for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(pr.p, i)!.name; pr.u[name] = gl.getUniformLocation(pr.p, name) }
    }
    gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST)
    size()
    gl.bindTexture(gl.TEXTURE_2D, ttex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
    ready = true
    if (performance.now() - lastInput < 400) wake()
  }
  // ponytail: a lost GL context just ends the effect until the next page load; rebuild targets/programs if that ever matters
  const onLost = (e: Event) => { e.preventDefault(); dead = true; cancelAnimationFrame(raf); raf = 0; canvas.style.visibility = 'hidden' }

  const opt = { passive: true } as const
  addEventListener('pointermove', onPointer, opt)
  addEventListener('touchstart', onTouchStart, opt)
  addEventListener('touchmove', onTouch, opt)
  addEventListener('scroll', onScroll, opt)
  document.addEventListener('visibilitychange', onVis)
  canvas.addEventListener('webglcontextlost', onLost)
  window.__fluid = { active: () => !!raf, frames: () => frames }
  poll()

  return () => {
    dead = true
    cancelAnimationFrame(raf)
    removeEventListener('pointermove', onPointer)
    removeEventListener('touchstart', onTouchStart)
    removeEventListener('touchmove', onTouch)
    removeEventListener('scroll', onScroll)
    document.removeEventListener('visibilitychange', onVis)
    canvas.removeEventListener('webglcontextlost', onLost)
    canvas.style.visibility = 'hidden'
    delete window.__fluid
  }
}
