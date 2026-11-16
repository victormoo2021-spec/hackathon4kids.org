// Pointer fluid: a small stable-fluids sim (velocity + one-channel dye) stirred by the pointer and,
// lightly, by scrolling. The dye is drawn as yellow light ink with purple edges on a canvas BEHIND
// the page content. A [data-spectral] heading the pointer stirs is handed over to the canvas for a
// moment (class is-prism clears its DOM glyphs) and drawn through fine vertical glass slits that bend it
// along the flow near the pointer's path with six-band dispersion, then settles back onto the exact DOM glyphs.
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
// uTm maps screen uv to the text textures (they cover the viewport plus a scroll margin).
// uS: b = "there is text here" shield (low res, mipmapped). uG: premultiplied glyphs of the headings
// currently handed to the canvas, at device resolution. uHr/uHs: their boxes (css px) and (bend, opacity, font px).
// uPt: the pointer and a point trailing it (css px); the bend lives around that segment.
const COMP = `${H}uniform sampler2D uD,uB,uV,uS,uG;uniform vec2 uTm,uRes;uniform vec4 uPt,uHr[4],uHs[4];
const vec3 P=vec3(.486,.361,1.),Y=vec3(1.,.87,.48),W=vec3(1.,.97,.9),V=vec3(.62,.5,1.);
float lum(vec3 c){return dot(c*c,vec3(.2126,.7152,.0722));}
void main(){
float h=texture(uD,v).r,g=texture(uB,v).r;
vec2 tp=vec2(v.x,(1.-v.y)*uTm.x+uTm.y);
float s=textureLod(uS,tp,5.3).b,ot=smoothstep(.12,.6,s);
// wispier behind any text, stronger in empty space
h*=mix(1.,.6,ot);g*=mix(1.,.45,ot);
// pale gold core thinning out to violet, no hard edge
vec3 c=mix(P,Y,smoothstep(.04,.32,h)*(1.-.85*smoothstep(.75,1.,s)));c=mix(c,W,smoothstep(.6,1.1,h));
c=c*(1.-exp(-h*h*4.5))+mix(P,Y,.4)*g*.6;
// keep text readable: behind text blocks the light is clamped to a low luminance
float cap=mix(2.,mix(.16,.055,smoothstep(.65,1.,s)),ot);
c*=min(1.,sqrt(cap/max(lum(c),1e-5)));
c+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.*min(1.,(h+g)*40.);
vec2 px=vec2(v.x,1.-v.y)*uRes;float e=0.,op=0.,em=16.;
for(int i=0;i<4;i++){vec2 q=min(px-uHr[i].xy,uHr[i].zw-px);float ins=min(q.x,q.y);if(ins>0.){e=uHs[i].x*smoothstep(0.,14.,ins);op=uHs[i].y;em=uHs[i].z;}}
vec4 t=vec4(0);
if(op>0.){
// local: the bend fades with distance from the pointer's recent path, the rest of the line stays put
vec2 pa=px-uPt.xy,ba=uPt.zw-uPt.xy;float dl=length(pa-ba*clamp(dot(pa,ba)/max(dot(ba,ba),1e-4),0.,1.))/(1.4*em);
vec2 d=texture(uV,v).xy*uRes.y*.03*e*exp(-dl*dl);
if(length(d)>.04){
// fine reeded glass, ribs a tenth of an em wide: across each rib the view slides sideways and eases back
// (soft edges, no hard steps), a little along the flow vertically. The slide stays under a rib's width, so
// letters are never folded over themselves and stay readable.
float x=fract(px.x/(.1*em)),f=smoothstep(0.,.75,x)*(1.-smoothstep(.75,1.,x)),m=length(d);
vec2 cap=vec2(.05,.012)*em,D=cap*(1.-exp(-vec2(m,abs(d.y))/cap))*d/(abs(d)+vec2(.15*m+.3,.3))*f;D=vec2(D.x/uRes.x,-D.y/uRes.y*uTm.x);
// six bands, red bends least and purple most, two taps each for a soft glassy edge;
// the weights add back up to the untouched glyph, so it only shows as thin rainbow edges
#define S(k) (texture(uG,tp-D*k)+texture(uG,tp-D*(k+.08)))*.5
vec4 r=S(.4),y=S(.7),gr=S(.95),cy=S(1.2),b=S(1.5),p=S(1.85),sum=r+y+gr+cy+b+p;
vec3 col=sum.rgb/max(sum.a,1e-4),a=vec3(.42*r.a+.3*y.a+.28*p.a,.3*y.a+.4*gr.a+.3*cy.a,.3*cy.a+.42*b.a+.28*p.a);
// a coloured glyph (the yellow words) keeps its colour and gets a white edge on one side, violet on the other
float lo=(r.a+y.a)*.5,mid=(gr.a+cy.a)*.5,hi=(b.a+p.a)*.5,mx=max(col.r,max(col.g,col.b)),mn=min(col.r,min(col.g,col.b));
vec3 ce=col*mid+W*max(lo-mid,0.)+V*max(hi-mid,0.);
t=vec4(mix(col*a,ce,(mx-mn)/max(mx,1e-4)),max(max(a.r,max(a.g,a.b)),max(lo,hi)));
}else t=texture(uG,tp);
t*=op;}
o=vec4(c*(1.-t.a)+t.rgb,t.a);}`

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number }
type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }

const SHIELD = 'p,li,h1,h2,h3,h4,dt,dd,label,blockquote,figcaption,a,button,input,textarea,summary,[data-spectral]'
const SIM = 128, DYE = 512, MARGIN = 0.25, PAD = 72
// identity transform: a heading still animating into place is left to the DOM
const IDENT = /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/, CLEAR = /^(transparent|rgba\(0, 0, 0, 0\))$/

declare global {
  interface Window { __fluid?: { active: () => boolean; frames: () => number; prisms: () => number } }
}

export function createFluid(canvas: HTMLCanvasElement): (() => void) | null {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true, depth: false, stencil: false, powerPreference: 'high-performance' })
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
    const dpr = Math.min(devicePixelRatio || 1, 2, 4096 / vw) // device resolution: settled glyphs have to match the DOM's
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

  // --- text textures, in viewport space with a scroll margin: shield (low res) + prism glyphs (device res)
  const tcan = document.createElement('canvas'), gcan = document.createElement('canvas')
  const ctx = tcan.getContext('2d')!, gctx = gcan.getContext('2d')!
  const ttex = gl.createTexture()!, gtex = gl.createTexture()!
  let sig = '', rasterY = 0
  type Word = { s: string; x: number; y: number; h: number; font: string; fs: number; ls: string; col: string; clip: number[] }
  // a heading the canvas is drawing instead of the DOM: e = bend envelope, op = canvas glyph opacity,
  // out = when the DOM glyphs started fading back in, cols = real colours (the DOM's are transparent meanwhile)
  type Prism = { e: number; op: number; hot: number; out: number; cols: Map<Element, string>; words: Word[] }
  const prisms = new Map<HTMLElement, Prism>()
  const hr = new Float32Array(16), hs = new Float32Array(16), pt = new Float32Array(4)
  const range = document.createRange()
  const re = /\S+/g
  type Chain = { op: number; clip: number[]; bg: boolean }
  const seen = new Map<Element, Chain>()
  // opacity product, overflow-clip rect and "something is painted behind this" accumulated up to <body>
  const chain = (el: Element): Chain => {
    const hit = seen.get(el)
    if (hit) return hit
    const up = el.parentElement && el !== document.body ? chain(el.parentElement) : { op: 1, clip: [-1e5, -1e5, 1e5, 1e5], bg: false }
    const cs = getComputedStyle(el)
    let clip = up.clip
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible' || cs.clip !== 'auto') {
      const r = el.getBoundingClientRect()
      clip = [Math.max(clip[0], r.left), Math.max(clip[1], r.top), Math.min(clip[2], r.right), Math.min(clip[3], r.bottom)]
    }
    const out = { op: cs.visibility === 'hidden' ? 0 : up.op * +cs.opacity, clip, bg: up.bg || cs.backgroundImage !== 'none' || !CLEAR.test(cs.backgroundColor) }
    seen.set(el, out)
    return out
  }
  // Where is each word of this heading right now, and what clips it? Run every frame the heading is
  // on the canvas (headings move), so the canvas copy never lags the DOM. null = leave it to the DOM:
  // mid-fade or mid-reveal, hidden, or on a painted surface the canvas (behind everything) can't show through.
  const measure = (el: HTMLElement, cols: Map<Element, string>): Word[] | null => {
    const words: Word[] = []
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
      const p = n.parentElement
      if (!p || !/\S/.test(n.data)) continue
      const { op, clip, bg } = chain(p)
      if (op < 0.99 || bg) return null
      for (let a: Element | null = p; a; a = a === el ? null : a.parentElement) if (!IDENT.test(getComputedStyle(a).transform)) return null
      const cs = getComputedStyle(p)
      let col = cols.get(p)
      if (!col) cols.set(p, (col = cs.color))
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, ls = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing
      const tt = cs.textTransform
      // ponytail: one rect per word, so a word broken across lines (hyphenation) is drawn unbroken; go per-character if that ever shows
      for (let w = re.exec(n.data); w; w = re.exec(n.data)) {
        range.setStart(n, w.index); range.setEnd(n, w.index + w[0].length)
        const r = range.getClientRects()[0]
        if (!r) continue
        if (r.bottom <= clip[1] || r.top >= clip[3] || r.right <= clip[0] || r.left >= clip[2]) { re.lastIndex = 0; return null }
        words.push({ s: tt === 'uppercase' ? w[0].toUpperCase() : tt === 'lowercase' ? w[0].toLowerCase() : w[0], x: r.left, y: r.top, h: r.height, font, fs: parseFloat(cs.fontSize), ls, col, clip })
      }
    }
    return words.length ? words : null
  }
  const drop = (el: HTMLElement) => { el.classList.remove('is-prism', 'is-prism-out'); prisms.delete(el) }
  const dropAll = () => { prisms.forEach((_, el) => drop(el)) }
  // Hand headings to the canvas while the pointer stirs them, and back once the bend has died away.
  // ponytail: at most 4 headings at once (uniform slots); the pointer can't reach more
  const prism = (t: number, dt: number, stirred: boolean) => {
    seen.clear()
    if (stirred) document.querySelectorAll<HTMLElement>('[data-spectral]').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (cx < r.left - 28 || cx > r.right + 28 || cy < r.top - 28 || cy > r.bottom + 28) return
      const st = prisms.get(el)
      if (st) { st.hot = t; if (st.out) { st.out = 0; el.classList.remove('is-prism-out') } return }
      if (prisms.size >= 4) return
      const cols = new Map<Element, string>(), words = measure(el, cols)
      if (!words) return
      prisms.set(el, { e: 0, op: 0, hot: t, out: 0, cols, words })
      el.classList.add('is-prism') // css fades the DOM glyphs out over 150ms
    })
    hr.fill(0); hs.fill(0)
    // a point trailing the pointer: the segment between them is the path the bend follows
    const lag = 1 - Math.exp(-dt * 6)
    pt[2] += (cx - pt[2]) * lag; pt[3] += (cy - pt[3]) * lag; pt[0] = cx; pt[1] = cy
    let i = 0
    prisms.forEach((st, el) => {
      const words = el.isConnected ? measure(el, st.cols) : null
      if (!words) return drop(el)
      st.words = words
      if (st.out) {
        // the DOM glyphs are opaque again after 150ms; only then does the identical canvas copy leave
        if (t - st.out > 150) st.op = Math.max(0, st.op - dt / 0.08)
        if (st.op === 0) return drop(el)
      } else {
        st.op = Math.min(1, st.op + dt / 0.08)
        if (t - st.hot < 140) st.e += (1 - st.e) * (1 - Math.exp(-dt * 9))
        else if ((st.e *= Math.exp(-dt * 8)) < 0.004) { st.e = 0; st.out = t; el.classList.add('is-prism-out') }
      }
      const r = el.getBoundingClientRect()
      hr.set([r.left - PAD, r.top - PAD, r.right + PAD, r.bottom + PAD], i * 4); hs.set([st.e, st.op, Math.max(...words.map((w) => w.fs))], i * 4)
      i++
    })
  }
  const raster = () => {
    const m = Math.round(vh * MARGIN), k = Math.min(1, 2048 / vw), kd = canvas.width / vw
    const q = (n: number) => Math.round(n * 2) // half-pixel steps
    let s = `${vw}x${vh}`
    prisms.forEach((st) => { for (const w of st.words) s += `|${w.s},${q(w.x)},${q(w.y + scrollY)},${q(w.h)},${q(w.clip[1] + scrollY)},${q(w.clip[3] + scrollY)},${w.font},${w.col}` })
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
      ctx.fillRect(r.left - 28, r.top - 28, r.width + 56, r.height + 56)
    })
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'
    const wrap = (min: number) => {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }
    gl.bindTexture(gl.TEXTURE_2D, ttex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tcan)
    gl.generateMipmap(gl.TEXTURE_2D)
    wrap(gl.LINEAR_MIPMAP_LINEAR)
    // glyphs exactly as the DOM draws them: same font, tracking, colour, clip, at device pixels
    gl.bindTexture(gl.TEXTURE_2D, gtex)
    if (!prisms.size) return void gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
    gcan.width = canvas.width; gcan.height = Math.round((vh + 2 * m) * kd) // resizing also clears it
    gctx.setTransform(kd, 0, 0, kd, 0, m * kd)
    gctx.textBaseline = 'alphabetic'; gctx.textRendering = 'optimizeLegibility'
    prisms.forEach((st) => st.words.forEach((w) => {
      gctx.save()
      gctx.beginPath(); gctx.rect(w.clip[0], w.clip[1], w.clip[2] - w.clip[0], w.clip[3] - w.clip[1]); gctx.clip()
      gctx.font = w.font; gctx.letterSpacing = w.ls; gctx.fillStyle = w.col
      const mt = gctx.measureText(w.s)
      gctx.fillText(w.s, w.x, w.y + (w.h - mt.fontBoundingBoxAscent - mt.fontBoundingBoxDescent) / 2 + mt.fontBoundingBoxAscent)
      gctx.restore()
    }))
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gcan)
    wrap(gl.LINEAR)
  }

  // --- input
  let cx = -1e5, cy = -1e5, px = 0.5, py = 0.5, lx = 0.5, ly = 0.5, moved = false, fresh = true, sdy = 0, lastScroll = scrollY
  let lastInput = -1e9, raf = 0, last = 0, ready = false, dead = false, frames = 0
  const wake = () => {
    lastInput = performance.now()
    if (raf || !ready || dead || document.hidden) return
    canvas.style.visibility = 'visible'
    last = 0
    raf = requestAnimationFrame(frame)
  }
  const point = (x: number, y: number) => {
    cx = x; cy = y
    px = x / innerWidth; py = 1 - y / innerHeight
    // a new stroke (first move, or first after the sim went to sleep) starts where the pointer is
    if (fresh || !raf) { lx = px; ly = py; pt[2] = x; pt[3] = y; fresh = false }
    moved = true
    wake()
  }
  const onPointer = (e: PointerEvent) => { if (e.pointerType !== 'touch') point(e.clientX, e.clientY) }
  const onTouchStart = () => { fresh = true }
  const onTouch = (e: TouchEvent) => { const t = e.touches[0]; if (t) point(t.clientX, t.clientY) }
  const onScroll = () => {
    sdy += scrollY - lastScroll; lastScroll = scrollY
    // scrolling alone paints no ink, so it only stirs what is already live
    if (raf) wake()
  }
  const onVis = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; dropAll() } else if (performance.now() - lastInput < 400) wake() }

  const sleep = () => {
    dropAll()
    gl.clearColor(0, 0, 0, 0)
    for (const t of [...targets, null]) { gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.fbo : null); gl.clear(gl.COLOR_BUFFER_BIT) }
    canvas.style.visibility = 'hidden' // no layer to composite while idle
    sdy = 0
  }

  const frame = (t: number) => {
    raf = 0
    if (dead || document.hidden) return
    const rm = mq.matches
    // ponytail: idle is decided by time since the last input rather than by reading velocity energy back
    // from the GPU (readPixels stalls); decay is exponential, so by then the field is below 1/255.
    if (t - lastInput > (rm ? 1200 : 2200) && !prisms.size) return sleep()
    raf = requestAnimationFrame(frame)
    frames++
    size()
    const dt = last ? Math.min((t - last) / 1000, 1 / 30) : 1 / 60
    last = t
    prism(t, dt, moved)
    raster()
    const k = rm ? 0.3 : 1 // reduced motion: same response, gentler and shorter-lived
    const tx = (u: Prog['u']) => gl.uniform2f(u.uTx, 1 / vel[0].w, 1 / vel[0].h)

    if (moved) {
      moved = false
      let vx = ((px - lx) * asp) / dt, vy = (py - ly) / dt // viewport-heights per second
      const sp = Math.hypot(vx, vy), c = Math.min(1, 5 / (sp || 1))
      vx *= c; vy *= c
      splat(vel, [lx, ly], [px, py], 0.035, [vx * 0.45 * k, vy * 0.45 * k], 8)
      splat(dye, [lx, ly], [px, py], 0.0048, [Math.min(0.1 + sp * 0.2, 0.5) * (rm ? 0.6 : 1), 0], 1)
      lx = px; ly = py
    }
    if (sdy) {
      splat(vel, [px, py], [px, py], 0.6, [0, Math.max(-3, Math.min(3, sdy / vh / dt)) * 0.1 * k], 8)
      sdy = 0
    }

    pass(progs.curl, div, [['uT', vel[0].tex]], tx)
    pass(progs.vort, vel[1], [['uT', div.tex], ['uV', vel[0].tex]], (u) => { tx(u); gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uK, 5) }) // light: strong confinement curls the ink into a hooked head
    swap(vel)
    pass(progs.advect, vel[1], [['uV', vel[0].tex], ['uS', vel[0].tex]], (u) => { gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uAsp, asp); gl.uniform1f(u.uK, Math.exp(-dt * (rm ? 4 : 1.8))); gl.uniform1f(u.uSub, 0) })
    swap(vel)
    pass(progs.div, div, [['uT', vel[0].tex]], tx)
    for (let i = 0; i < 8; i++) { pass(progs.jacobi, prs[1], [['uT', prs[0].tex], ['uD', div.tex]], tx); swap(prs) }
    pass(progs.grad, vel[1], [['uT', prs[0].tex], ['uV', vel[0].tex]], tx)
    swap(vel)
    pass(progs.advect, dye[1], [['uV', vel[0].tex], ['uS', dye[0].tex]], (u) => { gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uAsp, asp); gl.uniform1f(u.uK, Math.exp(-dt * (rm ? 6 : 5))); gl.uniform1f(u.uSub, dt * 0.05) })
    swap(dye)
    pass(progs.bloom, bloom, [['uT', dye[0].tex]], (u) => gl.uniform2f(u.uTx, 1 / dye[0].w, 1 / dye[0].h))
    const span = vh * (1 + 2 * MARGIN)
    // whole device pixels, so settled glyphs land on the same pixels the DOM's do
    const off = Math.round((scrollY - rasterY) * canvas.width / vw) * vw / canvas.width
    pass(progs.comp, null, [['uD', dye[0].tex], ['uB', bloom.tex], ['uV', vel[0].tex], ['uS', ttex], ['uG', gtex]], (u) => {
      gl.uniform2f(u.uTm, vh / span, (off + Math.round(vh * MARGIN)) / span)
      gl.uniform2f(u.uRes, vw, vh); gl.uniform4fv(u.uPt, pt)
      gl.uniform4fv(u['uHr[0]'], hr); gl.uniform4fv(u['uHs[0]'], hs)
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
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    for (const tx of [ttex, gtex]) { gl.bindTexture(gl.TEXTURE_2D, tx); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)) }
    ready = true
    if (performance.now() - lastInput < 400) wake()
  }
  // ponytail: a lost GL context just ends the effect until the next page load; rebuild targets/programs if that ever matters
  const onLost = (e: Event) => { e.preventDefault(); dead = true; cancelAnimationFrame(raf); raf = 0; dropAll(); canvas.style.visibility = 'hidden' }

  const opt = { passive: true } as const
  addEventListener('pointermove', onPointer, opt)
  addEventListener('touchstart', onTouchStart, opt)
  addEventListener('touchmove', onTouch, opt)
  addEventListener('scroll', onScroll, opt)
  document.addEventListener('visibilitychange', onVis)
  canvas.addEventListener('webglcontextlost', onLost)
  window.__fluid = { active: () => !!raf, frames: () => frames, prisms: () => prisms.size }
  poll()

  return () => {
    dead = true
    cancelAnimationFrame(raf)
    dropAll()
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
