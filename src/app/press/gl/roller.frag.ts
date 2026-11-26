// Roller pass fragment body (4.3). L1's press.ts prepends the header, riso.glsl (BG, W, screen(), uPaper) and `out vec4 o`.
// Uniforms: uRes (w,h device px), uLine (device px from top), uInk (rgb), uOff (device px), uDpr.
export const rollerFrag = /* glsl */ `
uniform vec2 uRes; uniform float uLine, uDpr; uniform vec3 uInk; uniform vec2 uOff;
void rollerMain(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec4 n = texture(uPaper, p/256.);
  float d = uLine - p.y;
  float tone = d > 0. ? 1. : clamp(1. + d/(120.*uDpr), 0., 1.);
  float c = screen(p - uOff, tone, 0., 12.*uDpr, .3);
  vec3 col = mix(mix(BG + vec3(.010,.014,.011)*(n.r-.5), uInk, c), W, step(abs(d), 1.5*uDpr)); // leading line is the beam
  o = vec4(col, 1.);
}`
