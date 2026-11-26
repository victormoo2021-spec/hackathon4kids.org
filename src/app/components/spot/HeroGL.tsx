'use client'
import { useEffect, useRef } from 'react'
import { Pendulum, geo } from './pendulum'

// One fragment shader: a pendulum drawn as a two-ink halftone screen (ink rod + bob, blue stroboscopic echoes),
// screen angle and blue misregistration follow the pointer. Lazy, paused offscreen, DPR <= 1.5.
const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 R,P,O;uniform vec3 M;uniform float L,A,C,th[6];
float sg(vec2 p,vec2 a,vec2 b){vec2 u=p-a,v=b-a;return length(u-v*clamp(dot(u,v)/dot(v,v),0.,1.));}
float cv(float d,float r){return 1.-smoothstep(r-1.,r+1.,d);}
float fig(vec2 p,float a,float disc){
  vec2 b=P+L*vec2(sin(a),cos(a));float rr=L*.1;
  float rod=cv(sg(p,P,b),L*.008)*.9;
  vec2 n=(p-b)/rr;
  float s=clamp(.5-.5*dot(n,normalize(vec2(-.5,-.7))),0.,1.)*.7+.06;
  return max(rod,cv(length(n)*rr,rr)*s*disc);}
float ht(vec2 p,float t,float a,float C){
  if(t<.03)return 0.;
  float c=cos(a),s=sin(a);vec2 f=fract(mat2(c,-s,s,c)*p/C)-.5;
  float r=sqrt(t)*.74,w=1.2/C;return 1.-smoothstep(r-w,r+w,length(f));}
void main(){
  vec2 p=vec2(gl_FragCoord.x,R.y-gl_FragCoord.y);
  float ink=max(fig(p,th[0],1.),cv(length(p-P),L*.022));
  vec2 q=p-O;float bl=fig(q,th[0],.7)*.8;
  for(int i=1;i<6;i++)bl=max(bl,fig(q,th[i],.8)*(1.-float(i)/6.)*.9);
  vec2 u=p/R;
  ink=max(ink,.22*smoothstep(.8,1.,u.y)*smoothstep(.3,.6,u.x));
  vec3 col=vec3(1.,.839,.039);
  float inL=1.-smoothstep(M.z,M.z*1.04+.001,length(p-M.xy));
  ink=max(ink,inL*.10*step(1.,M.z)); // paper dot-screen tone so the lens reads over flat yellow
  float Cc=C*mix(1.,.5,inL);
  col=mix(col,vec3(.122,.247,.812),ht(p,bl,A+.52,Cc)*.96);
  col*=mix(vec3(1.),vec3(.067,.067,.078),ht(p,ink,A,Cc));
  vec2 g=floor(p/vec2(2.,11.));float fb=fract(sin(dot(g,vec2(127.1,311.7)))*43758.5);
  col*=1.-.04*smoothstep(.9,1.,fb);
  col=mix(col,vec3(.067,.067,.078),step(abs(length(p-M.xy)-M.z),1.6)*step(1.,M.z));
  col*=1.+(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)*.06;
  gl_FragColor=vec4(col,1.);}`

export default function HeroGL() {
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = cv.current!
    const host = canvas.parentElement!
    let dead = false, raf = 0, cleanup = () => {}
    const boot = () => {
      if (dead) return
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
      if (!gl) return
      const sh = (t: number, s: string) => { const o = gl.createShader(t)!; gl.shaderSource(o, s); gl.compileShader(o); return o }
      const pr = gl.createProgram()!
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS))
      gl.linkProgram(pr)
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return
      gl.useProgram(pr)
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
      const U = (n: string) => gl.getUniformLocation(pr, n)
      const u = { M: U('M'), R: U('R'), P: U('P'), O: U('O'), L: U('L'), A: U('A'), C: U('C'), th: U('th[0]') }

      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
      const slabY = () => { const e = host.querySelector('.slab'); return e ? e.getBoundingClientRect().bottom - host.getBoundingClientRect().top + 32 : undefined }
      const sim = new Pendulum(geo(host.clientWidth, host.clientHeight, slabY()).amp)
      const hist: number[] = []
      for (let i = 0; i < 6; i++) hist.push(sim.th - i * 0.07) // frozen strobe for the static case
      let W = 0, H = 0, dpr = 1
      let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5, lastX = -1, px = 0, py = 0
      let jolt = reduce ? 0 : 26 // set again at boot, which is keyed to the first headline animationstart
      const fine = matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce
      let lr = 0, lt = 0, lx = 0, ly = 0, smear = 0, held = false, lastMove = 0, nextBlip = 0
      let acc = 0, last = 0, visible = true, running = false, dirty = true

      const size = () => {
        const r = host.getBoundingClientRect(); W = r.width; H = r.height
        dpr = Math.min(devicePixelRatio || 1, 1.5)
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
        gl.viewport(0, 0, canvas.width, canvas.height)
      }
      const draw = () => {
        const g = geo(W, H, slabY())
        sim.amp = g.amp
        gl.uniform2f(u.R, canvas.width, canvas.height)
        gl.uniform2f(u.P, g.px * dpr, g.py * dpr)
        gl.uniform1f(u.L, g.len * dpr)
        gl.uniform1f(u.A, 0.26 + (mx - 0.5) * 0.9)
        gl.uniform1f(u.C, Math.max(8, Math.min(11, g.len / 62)) * dpr)
        gl.uniform2f(u.O, ((mx - 0.5) * 18 + jolt + smear) * dpr, ((my - 0.5) * 12 + jolt * 0.5) * dpr)
        gl.uniform3f(u.M, lx * dpr, ly * dpr, lr * dpr)
        gl.uniform1fv(u.th, hist)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
      }
      const tick = (t: number) => {
        raf = 0
        if (!running) return
        const dt = Math.min(0.05, (t - last) / 1000); last = t
        if (!held) sim.step(dt) // holding the press stops the swing
        mx += (tx - mx) * 0.12; my += (ty - my) * 0.12
        lx += (px - lx) * 0.25; ly += (py - ly) * 0.25
        if (Math.abs(tx - mx) * W > 0.2 || Math.abs(ty - my) * H > 0.2 || (lt && (Math.abs(px - lx) > 0.2 || Math.abs(py - ly) > 0.2))) dirty = true // lerps still settling
        acc += dt
        if (acc > 1 / 15) { // print-like: the pendulum is re-exposed 15 times a second
          acc = 0; dirty = true; if (!held) hist.unshift(sim.th); hist.length = 6
          jolt = jolt > 0.5 ? jolt * 0.55 : 0
          smear = Math.abs(smear) > 0.5 ? smear * 0.8 : 0
          lr = lt > lr ? Math.min(lt, lr + lt / 4) : Math.max(lt, lr - 30) // loupe opens in 4 frames, closes in 3
          if (t > nextBlip && t - lastMove > 3000 && document.hasFocus()) { jolt = 7; nextBlip = t + 8000 + Math.random() * 3000 } // press check
        }
        if (dirty) { dirty = false; draw() } // scene only changes at 15Hz or while a lerp settles
        raf = requestAnimationFrame(tick)
      }
      const run = () => {
        const want = visible && !document.hidden && !reduce
        if (want && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(tick) }
        if (!want) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0 }
      }
      const onMove = (e: PointerEvent) => {
        const r = host.getBoundingClientRect()
        tx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); ty = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
        const inside = e.clientY >= r.top && e.clientY < r.bottom
        px = e.clientX - r.left; py = e.clientY - r.top
        if (lastX < 0) { lx = px; ly = py }
        lt = fine && inside ? 90 : 0
        lastMove = performance.now()
        if (lastX >= 0 && inside) {
          if (!held) sim.kick((e.clientX - lastX) * 0.0035)
          smear = Math.max(-14, Math.min(14, smear + (e.clientX - lastX) * 0.35))
        }
        lastX = e.clientX
      }
      const onDown = (e: PointerEvent) => {
        const r = host.getBoundingClientRect()
        if (reduce || e.clientY < r.top || e.clientY > r.bottom || (e.target as Element).closest('a,button')) return
        held = true
      }
      const release = () => { if (held) { held = false; jolt = 18 } }
      const leave = () => { lt = 0; dirty = true }
      const hide = () => { if (document.hidden) release() }
      const ro = new ResizeObserver(() => { size(); draw() })
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; document.documentElement.toggleAttribute('data-hero', visible); run() })
      size(); draw(); ro.observe(host); io.observe(host)
      canvas.classList.add('on')
      if (!reduce) { addEventListener('pointermove', onMove, { passive: true }); addEventListener('pointerdown', onDown); addEventListener('pointerup', release); addEventListener('pointercancel', release); addEventListener('blur', release); addEventListener('scroll', leave, { passive: true }); document.documentElement.addEventListener('pointerleave', leave); document.addEventListener('visibilitychange', hide) }
      document.addEventListener('visibilitychange', run)
      run()
      cleanup = () => {
        running = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect()
        removeEventListener('pointermove', onMove); removeEventListener('pointerdown', onDown); removeEventListener('pointerup', release); removeEventListener('pointercancel', release); removeEventListener('blur', release); removeEventListener('scroll', leave); document.documentElement.removeEventListener('pointerleave', leave); document.removeEventListener('visibilitychange', hide); document.documentElement.removeAttribute('data-hero')
        document.removeEventListener('visibilitychange', run)
        gl.getExtension('WEBGL_lose_context')?.loseContext()
      }
    }
    // boot on the first headline animationstart so the GL plate and the CSS plates share one clock (600ms failsafe)
    let started = false
    const go = () => { if (started) return; started = true; clearTimeout(t); host.removeEventListener('animationstart', go); requestAnimationFrame(boot) }
    const t = setTimeout(go, 600)
    host.addEventListener('animationstart', go)
    return () => { dead = true; clearTimeout(t); host.removeEventListener('animationstart', go); cleanup() }
  }, [])
  return <canvas ref={cv} className="spot-gl" aria-hidden />
}
