// Shared phosphor include (direction 6.0). Prepended by press.ts to every fragment program.
// p: device px, top-left origin. uPaper: 256 smoothed noise, REPEAT (r tube grain, g dead cells, b emission density).
export const RISO = /* glsl */ `
uniform sampler2D uPaper;
const vec3 BG = vec3(.0196, .0275, .0471);  // --bg
// light colours are pre-compensated, L' = (token - BG) / (1 - BG), so a solid screen-blend on BG lands exactly on the token
const vec3 G  = vec3(1.0, .8347, 0.);          // --accent (yellow; b clamps: token b is 2/255 under BG)
const vec3 A  = vec3(.1480, .2137, 1.0);  // --glow
const vec3 W  = vec3(.9520, .9597, .9794);  // --text
float seg(vec2 p, vec2 a, vec2 b){ vec2 u = p-a, v = b-a; return length(u - v*clamp(dot(u,v)/max(dot(v,v),1e-6), 0., 1.)); }
float screen(vec2 p, float tone, float a, float C, float g){
  tone = clamp(tone + g*tone*(1.-tone)*1.6, 0., 1.);
  if(tone < .02) return 0.;
  float c=cos(a), s=sin(a); vec2 f = fract(mat2(c,-s,s,c)*p/C) - .5;
  float n = texture(uPaper, p/256.).r;
  float r = sqrt(tone)*.66 + (n-.5)*.10;
  float aa = 1.1/C;
  return max(1.-smoothstep(r-aa, r+aa, length(f)), smoothstep(.92, 1., tone));
}
vec3 lit(vec3 c, vec3 l){ return 1. - (1. - c)*(1. - l); }           // screen blend
// g: accent coverage, a: afterglow coverage, w: beam coverage (all 0..1, already halftoned), bloom: un-screened 0..1
vec3 emit(vec2 p, float g, float a, float w, float bloom){
  vec4 n = texture(uPaper, p/256.);
  float dead = step(.965, n.g);                                       // dead cells (were paper pinholes)
  vec3 col = BG + vec3(.010,.011,.016)*(n.r - .5);                  // tube grain; also dithers the bloom
  col = lit(col, A * bloom * (1. - g));                                // bloom is blue now: keep it out from under the yellow dots so they land on the token
  col = lit(col, A * a * (.90 + .10*n.b) * (1. - dead));
  // tuned: accent density (.93 + .07 n.b) -> min(1, (.96 + .04 n.b)/.98), mean-corrected and narrowed: dot interiors measured
  // (47,203,87) with a 196..210 green spread on Metal; the acceptance is the token +-4 per channel
  col = lit(col, G * min(1., g * (.96 + .04*n.b)/.98) * (1. - dead));
  col = lit(col, W * w * (1. - dead*.6));
  return col;
}
`
