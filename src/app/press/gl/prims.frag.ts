// Course-proof fragment body (4.4). L1's press.ts prepends the header, riso.glsl (BG, screen(), uPaper) and `out vec4 o`, and calls primsMain().
// Space: unit = tile HEIGHT (u = p / uRes.y), so discs stay round on non-square sheets (the crowd).
// uPa[i] = (x1,y1,x2,y2) seg | (cx,cy,ringR,0) ring/disc; uPb[i] = (type 0 seg|1 disc|2 ring, width or r, tone, shaded 0|1|2). shaded 2 = flat accent flood (instructor dot, no screen).
// Uniforms (device px): uSolid 0|1 flat ink instead of halftone (crowd); uRes, uOff (blue plate offset), uDpr; uDev develop gain, uAng screen-angle delta (rad), uGain dot gain, uN prim count.
export const primsFrag = /* glsl */ `
uniform vec2 uRes, uOff; uniform float uDpr, uDev, uAng, uGain, uSolid; uniform int uN;
uniform vec4 uPa[24]; uniform vec4 uPb[24]; uniform vec3 uInk, uPaperCol, uGhost, uYel;
float pseg(vec2 p, vec2 a, vec2 b){ vec2 pa = p-a, ba = b-a; return length(pa - ba*clamp(dot(pa,ba)/max(dot(ba,ba),1e-6), 0., 1.)); }
// tuned: edge .008 -> mix(.008,.003,uSolid) so crowd discs print crisp; proofs unchanged
float cov(float d, float r){ return clamp((r-d)/mix(.008, .003, uSolid) + .5, 0., 1.); }
vec2 field(vec2 u){ float t = 0., yv = 0.;
  float pol = step(dot(uPaperCol, vec3(.3,.6,.1)), dot(uInk, vec3(.3,.6,.1)));   // 1 = light ink on dark paper: the lit side is the brighter one
  for(int i=0;i<24;i++){ if(i>=uN) break; vec4 a = uPa[i], m = uPb[i]; float v;
  if(m.x < .5) v = cov(pseg(u, a.xy, a.zw), m.y*.5);
  else if(m.x < 1.5){ vec2 n = (u-a.xy)/m.y; float d = dot(n, vec2(-.58,-.81)); v = cov(length(u-a.xy), m.y)*mix(1., .2+.8*clamp(mix(.5-.5*d, .5+.5*d, pol), 0., 1.), (m.w > 1.5 ? 0. : m.w)); }
  else v = cov(abs(length(u-a.xy) - a.z), m.y*.5);
  if(m.w > 1.5) yv = max(yv, v); else t = max(t, v*m.z); } return vec2(t, yv); }
void primsMain(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 u = p/uRes.y, uo = uOff/uRes.y; float C = uRes.x/34.;
  float g = uSolid > .5 ? 0. : screen(p - uOff, field(u - uo).x*.55*uDev, radians(15.)+uAng, C*1.15, uGain);
  float k = uSolid > .5 ? field(u).x : screen(p, field(u).x*uDev, radians(45.)+uAng, C, uGain); // uSolid: crowd discs print flat
  vec3 col = mix(mix(uPaperCol + vec3(.010,.011,.016)*(texture(uPaper, p/256.).r-.5)*(1.-uSolid), uGhost, g*.9), uInk, k*.96);
  o = vec4(mix(col, uYel, field(u).y), 1.);
}`
