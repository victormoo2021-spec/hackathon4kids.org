// Hero strobe sheet (direction 4.2). Two programs: accumulate (half-res ping-pong, r channel) and composite (full-res riso print).
// Acc texture is stored top-left origin: texel (x,y) <-> sheet px (2x,2y), so composite samples it with p/uR directly.
const BOB = /* glsl */ `
uniform vec2 uR, uP; uniform float uL, uTh;
float bob(vec2 q, float th){ vec2 b = uP + uL*vec2(sin(th), cos(th)); float rr = uL*.10; vec2 n = (q-b)/rr;
  float shade = clamp(.5 - .5*dot(n, normalize(vec2(-.5,-.7))), 0., 1.)*.7 + .06;
  float rod = (1.-smoothstep(uL*.008-1., uL*.008+1., seg(q, uP, b)))*.35;
  return max(rod, (1.-smoothstep(rr-1., rr+1., length(q-b)))*shade); }
`
export const accFrag = /* glsl */ `${BOB}
uniform sampler2D uPrev; uniform vec2 uAccR; uniform float uDecay, uSub, uClr;
void accMain(){
  vec2 q = gl_FragCoord.xy * (uR/uAccR);
  float v = max(texture(uPrev, gl_FragCoord.xy/uAccR).r*uDecay - uSub, bob(q, uTh)*.85) * step(uClr*uR.y, q.y);
  o = vec4(v, v, v, 1.);
}`

export const heroFrag = /* glsl */ `${BOB}
uniform sampler2D uAcc; uniform float uC, uDpr, uA, uGain, uSep; uniform vec2 uOff; uniform vec3 uLens, uPass;
float fig(vec2 p, float th){
  vec2 b = uP + uL*vec2(sin(th), cos(th)); float rr = uL*.10; vec2 n = (p-b)/rr;
  float shade = clamp(.5 - .5*dot(n, normalize(vec2(-.5,-.7))), 0., 1.)*.7 + .06;
  float rod = (1.-smoothstep(uL*.008-1., uL*.008+1., seg(p, uP, b)))*.9;
  float pv = 1.-smoothstep(uL*.022-1., uL*.022+1., length(p-uP));
  return max(max(rod, pv), (1.-smoothstep(rr-1., rr+1., length(p-b)))*shade); }
float floorT(vec2 p){ return .22*smoothstep(.8,1.,p.y/uR.y)*smoothstep(.3,.6,p.x/uR.x); }
// 2px ring with 12 tick marks just inside it
float lensRing(vec2 d, float r){
  if(r < 1.) return 0.;
  float l = length(d), w = uDpr;
  float ring = step(abs(l-r), w);
  float f = fract(atan(d.y, d.x)/6.2831853*12.); float arc = min(f, 1.-f)*6.2831853*l/12.;
  return max(ring, step(arc, w*.8) * step(r-9.*uDpr, l) * step(l, r));
}
void heroMain(){
  vec2 p = vec2(gl_FragCoord.x, uR.y - gl_FragCoord.y);
  vec2 d = p - uLens.xy; float inL = uLens.z > 1. ? 1.-smoothstep(uLens.z, uLens.z*1.04, length(d)) : 0.;
  vec2 sep = normalize(d + 1e-4)*uSep*inL; float C = uC*mix(1., .5, inL), aB = radians(15.)+uA, aK = radians(45.)+uA;
  float bGate = step(p.y, uPass.y*uR.y);
  float bT = texture(uAcc, (p - uOff - sep)/uR).r*bGate, bReg = texture(uAcc, p/uR).r*bGate;   // printed vs registered
  float kT = max(fig(p + sep, uTh), max(floorT(p), inL*.10)) * step(p.y, uPass.z*uR.y);
  float b = screen(p - uOff - sep, bT, aB, C*1.15, uGain);
  // tuned: the Y plate edge is a 40px halftone ramp at the roller line (spec step(p.y, uPass.x*uR.y) = hard edge); uPass.x>=1 is a solid flood as written
  float yT = uPass.x >= 1. ? 1. : screen(p, clamp((uPass.x*uR.y - p.y)/(40.*uDpr), 0., 1.), 0., 10.*uDpr, .3);
  float y = yT * (1. - screen(p, bReg, aB, C*1.15, uGain));    // knockout
  float k = max(screen(p + sep, kT, aK, C, uGain), lensRing(d, uLens.z));
  o = vec4(print(p, y, b, k), 1.);
}`
