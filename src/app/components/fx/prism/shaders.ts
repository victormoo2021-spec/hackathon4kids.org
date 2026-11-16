// GLSL3 sources for the prism canvas (RawShaderMaterial, three adds the #version line).
// Everything is linear light until COMPOSITE, which tone-maps, encodes sRGB and adds grain.

const HEAD = /* glsl */ `precision highp float;
`

/** Fullscreen triangle. */
export const FS_VERT = /* glsl */ `${HEAD}
in vec3 position;
out vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

/** Warping gradient. Ground is #0a0710 everywhere; light gathers only around the ring (uC, uR). */
export const BG_FRAG = /* glsl */ `${HEAD}
in vec2 vUv;
out vec4 o;
uniform float uT, uAsp, uR, uGlow, uPage, uScroll;
uniform vec2 uC;
uniform vec3 uF;
uniform vec3 uColA, uColB;
const vec3 BASE = vec3(0.00304, 0.00214, 0.00518);
void main() {
  vec2 p = (vUv - uC) * vec2(uAsp, 1.0) / max(uR, 0.02);
  vec2 q = p + 0.32 * vec2(
    sin(p.y * 1.3 + uT * 0.11) + sin(p.x * 0.7 - uT * 0.07),
    cos(p.x * 1.1 - uT * 0.09) + sin(p.y * 0.9 + uT * 0.05));
  float d = length(q);
  float halo = exp(-d * d * 0.8);
  float band = exp(-(d - 1.0) * (d - 1.0) * 5.0);
  vec2 a1 = 0.75 * vec2(cos(uT * 0.05 + 2.2), sin(uT * 0.07 + 2.2));
  vec2 a2 = -0.85 * vec2(cos(uT * 0.04 + 0.4), sin(uT * 0.06 + 0.4));
  float lobeA = exp(-dot(q - a1, q - a1) * 1.5);
  float lobeB = exp(-dot(q - a2, q - a2) * 2.2);
  float hint = exp(-dot(q - a2 * 1.15, q - a2 * 1.15) * 14.0);
  vec3 c = uColA * (0.04 * halo + 0.035 * band + 0.17 * lobeA * halo)
         + uColB * (0.04 * lobeB * band + 0.07 * lobeB * halo + 0.12 * hint * band);
  // a breath of colour across the whole page so the ground is not dead flat
  c += uColA * 0.0012 * (0.5 + 0.5 * sin(vUv.x * 2.1 + vUv.y * 1.4 + uT * 0.03));
  // page mode: a very dim violet / warm wash that drifts with the scroll, so long sections are not flat black
  vec2 s = vUv * vec2(uAsp, 1.0) + vec2(0.0, uScroll * 0.25);
  float n1 = 0.5 + 0.5 * sin(s.x * 1.7 + sin(s.y * 1.3 + uT * 0.04) * 1.5);
  float n2 = 0.5 + 0.5 * sin(s.y * 2.1 - s.x * 0.8 + uT * 0.03 + 1.7);
  c += uPage * (uColA * 0.012 * n1 * n2 + vec3(1.0, 0.6, 0.1) * 0.006 * (1.0 - n1) * n2 * n2);
  // soft gold flash behind the final button
  vec2 pf = (vUv - uF.xy) * vec2(uAsp, 1.0) / 0.17;
  vec3 flash = vec3(1.0, 0.67, 0.02) * uF.z * exp(-dot(pf, pf)) * 0.22;
  o = vec4(BASE + c * uGlow + flash, 1.0);
}`

export const BAR_VERT = /* glsl */ `${HEAD}
in vec3 position;
in vec3 normal;
uniform mat4 modelViewMatrix, projectionMatrix;
uniform mat3 normalMatrix;
out vec3 vN, vP, vO, vNb;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalMatrix * normal;
  // bulged normal (as if the plank were a rod): gives the lights a thin streak along the long faces
  vNb = normalMatrix * normalize(normal + vec3(0.0, position.y, position.z) * 6.0);
  vP = mv.xyz;
  vO = position;
  gl_Position = projectionMatrix * mv;
}`

/** Back faces: view-space normal, alpha marks coverage. */
export const BACK_FRAG = /* glsl */ `${HEAD}
in vec3 vN;
out vec4 o;
void main() { o = vec4(normalize(vN) * 0.5 + 0.5, 1.0); }`

/** Front faces: 6-band refraction of the captured background + a procedural light rig. */
export const GLASS_FRAG = /* glsl */ `${HEAD}
in vec3 vN, vP, vO, vNb;
out vec4 o;
uniform sampler2D tBg;
uniform sampler2D tBack;
uniform vec2 uRes;
uniform float uT, uAsp, uRefr, uGlow, uSat, uSparkle, uVis, uSeed;
uniform vec3 uColA, uColB;

// R, Y, G, C, B, P: each channel is covered by exactly three bands
const vec3 BAND[6] = vec3[6](vec3(1,0,0), vec3(1,1,0), vec3(0,1,0), vec3(0,1,1), vec3(0,0,1), vec3(1,0,1));
const float IOR[6] = float[6](1.33, 1.39, 1.46, 1.54, 1.63, 1.74);
const vec3 L1 = vec3(-0.30, 0.45, 0.84);
const vec3 L2 = vec3(0.45, -0.25, 0.86);

float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

// studio rig seen through / on the glass: two slanted strip lights and a soft key
float strips(vec2 k) {
  float s1 = smoothstep(0.07, 0.0, abs(k.y - 0.30 + 0.35 * k.x));
  float s2 = smoothstep(0.045, 0.0, abs(k.x + 0.42 + 0.20 * k.y)) * 0.7;
  return s1 + s2;
}
float ggx(float nh, float a) { float a2 = a * a; float d = nh * nh * (a2 - 1.0) + 1.0; return a2 / (3.14159 * d * d); }

void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(-vP);
  vec2 uv = gl_FragCoord.xy / uRes;
  vec4 b = texture(tBack, uv);
  vec3 Nr = b.a > 0.5 ? normalize(N - normalize(b.rgb * 2.0 - 1.0) * 0.6) : N;
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float edge = 1.0 - ndv;
  float fres = 0.04 + 0.96 * pow(edge, 5.0);

  vec3 through = vec3(0.0), lit = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    vec2 dev = refract(-V, Nr, 1.0 / IOR[i]).xy + V.xy;
    vec2 off = dev * uRefr;
    off.x /= uAsp;
    through += BAND[i] * texture(tBg, uv + off).rgb;
    // strip lights seen through the glass, only where the bend is steep, so the spectrum stays in narrow bands
    lit += BAND[i] * strips(dev * 4.0 + vec2(vO.x * 0.55, vO.x * 0.2 + vO.y)) * smoothstep(0.04, 0.26, length(dev));
  }
  through /= 3.0;
  lit /= 3.0;

  float w = 0.5 + 0.5 * sin(vO.x * 2.4 + ndv * 3.0 + uT * 0.21 + uSeed);
  vec3 irid = mix(uColA, uColB, smoothstep(0.25, 0.9, w));

  // clear body: tinted transmission of the bent background, no fill of its own
  vec3 col = through * mix(vec3(0.84, 0.82, 1.0), irid + 0.25, 0.22) * 1.3 + lit * 0.9;
  // soft clip, so a bar can never wash out the text that sits on top of it; only thin lines below stay hot
  col /= 1.0 + dot(col, vec3(0.2126, 0.7152, 0.0722)) * 2.0;
  // rims: Fresnel on the bevels
  col += (irid * 0.9 + 0.3) * (fres * 1.3 + pow(edge, 3.0) * 0.45);
  vec3 R = reflect(-V, N);
  col += fres * strips(R.xy * 1.3 + vec2(vO.x * 0.5, vO.y)) * 0.6;
  // two lights, streaked along the bar by the bulged normal
  vec3 Ns = normalize(vNb);
  float sp = ggx(max(dot(Ns, normalize(L1 + V)), 0.0), 0.06) * 0.006
           + ggx(max(dot(Ns, normalize(L2 + V)), 0.0), 0.09) * 0.004;
  col += min(sp, 2.5) * mix(vec3(1.0, 0.97, 1.0), vec3(1.0, 0.84, 0.4), 0.3) * (1.0 + 1.2 * uSparkle);

  // glints: small twinkling points on the faces
  vec2 g = (vO.xy + vO.zx * vec2(1.7, 0.6)) * 26.0;
  float h = hash(floor(g) + uSeed);
  float tw = pow(0.5 + 0.5 * sin(uT * 4.0 + h * 50.0), 10.0);
  vec3 spc = smoothstep(0.2, 0.0, length(fract(g) - 0.5)) * step(0.93, h) * tw * uSparkle * vec3(3.2, 2.9, 2.2);

  col = (col * uGlow) + spc * (0.25 + 0.75 * uGlow);
  col = mix(vec3(dot(col, vec3(0.2126, 0.7152, 0.0722))), col, uSat);
  o = vec4(mix(texture(tBg, uv).rgb, col, clamp(uVis, 0.0, 1.0)), 1.0);
}`

/** Background blit used as the first draw of the scene pass. */
export const COPY_FRAG = /* glsl */ `${HEAD}
in vec2 vUv;
out vec4 o;
uniform sampler2D tMap;
void main() { o = texture(tMap, vUv); }`

export const BRIGHT_FRAG = /* glsl */ `${HEAD}
in vec2 vUv;
out vec4 o;
uniform sampler2D tMap;
void main() {
  vec3 c = texture(tMap, vUv).rgb;
  float l = max(c.r, max(c.g, c.b));
  o = vec4(min(c, vec3(4.0)) * smoothstep(0.32, 0.9, l), 1.0);
}`

export const BLUR_FRAG = /* glsl */ `${HEAD}
in vec2 vUv;
out vec4 o;
uniform sampler2D tMap;
uniform vec2 uDir;
void main() {
  vec3 c = texture(tMap, vUv).rgb * 0.227;
  c += (texture(tMap, vUv + uDir * 1.385).rgb + texture(tMap, vUv - uDir * 1.385).rgb) * 0.316;
  c += (texture(tMap, vUv + uDir * 3.231).rgb + texture(tMap, vUv - uDir * 3.231).rgb) * 0.070;
  o = vec4(c, 1.0);
}`

export const COMPOSITE_FRAG = /* glsl */ `${HEAD}
in vec2 vUv;
out vec4 o;
uniform sampler2D tMap, tBloom;
uniform float uT, uBloom, uAsp;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 c = texture(tMap, vUv).rgb + texture(tBloom, vUv).rgb * uBloom;
  vec2 v = (vUv - 0.5) * vec2(min(uAsp, 1.6) / 1.6, 1.0);
  c *= 1.0 - 0.28 * smoothstep(0.35, 0.95, length(v) * 1.5);
  c = c / (1.0 + c * 0.55);
  c = mix(c * 12.92, 1.055 * pow(max(c, vec3(1e-5)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
  float n = hash(gl_FragCoord.xy + fract(uT) * 61.0) - 0.5;
  c += n * (0.012 + 0.03 * dot(c, vec3(0.33)));
  o = vec4(c, 1.0);
}`
