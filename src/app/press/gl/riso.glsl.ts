// Shared riso include (direction 4.1). Prepended by press.ts to every fragment program.
// p: device px, top-left origin. uPaper: 256 smoothed noise, REPEAT (r fibre, g pinhole, b ink density).
export const RISO = /* glsl */ `
uniform sampler2D uPaper;
// tuned: STOCK/K as the tokens (#F2EDE1, #111114). Y is #FFD60A / STOCK so a solid yellow flood on stock prints exactly --y
// (spec Y = (1,.839,.039) printed 5% dark on stock). B*Y still equals --over (#1F3508).
const vec3 STOCK = vec3(.949, .929, .882);
const vec3 Y = vec3(1.0537, .9031, .0442);
const vec3 B = vec3(.122, .247, .812);
const vec3 K = vec3(.067, .067, .078);
float seg(vec2 p, vec2 a, vec2 b){ vec2 u = p-a, v = b-a; return length(u - v*clamp(dot(u,v)/max(dot(v,v),1e-6), 0., 1.)); }
float screen(vec2 p, float tone, float a, float C, float g){
  tone = clamp(tone + g*tone*(1.-tone)*1.6, 0., 1.);
  if(tone < .02) return 0.;
  float c=cos(a), s=sin(a); vec2 f = fract(mat2(c,-s,s,c)*p/C) - .5;
  float n = texture(uPaper, p/256.).r;
  float r = sqrt(tone)*.72 + (n-.5)*.10;
  float aa = 1.1/C;
  return max(1.-smoothstep(r-aa, r+aa, length(f)), smoothstep(.92, 1., tone));
}
vec3 print(vec2 p, float y, float b, float k){
  vec4 n = texture(uPaper, p/256.);
  float drop = step(.965, n.g);
  // tuned: paper tooth centred (1.0225 - .045 n.r, was 1 - .045 n.r) and yellow density mean-corrected (/.965) so flat ground averages the token colours
  vec3 col = STOCK * (1.0225 - .045*n.r);
  col *= mix(vec3(1.), Y, min(1., y*(.93+.07*n.b)/.965));
  col *= mix(vec3(1.), B, b*(.90+.10*n.b)*(1.-drop));
  col *= mix(vec3(1.), K, k*(.95+.05*n.b)*(1.-drop*.6));
  return col;
}
`
