// Light-painting fragment shader: long-exposure ribbons built from fibre bundles,
// plus one "guide" streak that runs down the page beside the copy.
export const VERT = `#version 300 es
in vec2 a; void main(){ gl_Position = vec4(a,0.,1.); }`

export const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes, uOrigin, uScreenHalf, uMouse;
uniform vec4 uShield, uShield2;
uniform vec3 uColA, uColB;
uniform vec4 uPts[8];          // guide path in p-space: x, y, width, brightness (y descending)
uniform float uVis[8];
uniform float uT, uFlow, uGlow, uIntensity, uPage, uSparkle, uBend, uHeadY, uCalm, uStatic, uFlare, uMax, uParallax;

float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y);
}
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
float sdBox(vec2 p, vec2 b){ vec2 d = abs(p)-b; return length(max(d,0.))+min(max(d.x,d.y),0.); }

struct R { float th, a1, k1, a2, k2, w, len, seed; };
const R RB[8] = R[8](
  R(3.5779, .10, 2.6, .03, 7., .030, 1.5, .11),
  R(1.0821, .14, 2.1, .03, 6., .055, 1.1, .37),
  R(-.3142, .08, 3.4, .02, 9., .034, .9, .62),
  R(2.2340, .12, 1.9, .02, 8., .022, 1.3, .83),
  R(-1.0821,.09, 3.0, .03, 7., .042, 1.0, .29),
  R(1.6580, .05, 4.0, .015,9., .013, .8, .55),
  R(3.0020, .05, 4.0, .015,9., .013, .8, .71),
  R(-1.7450,.05, 4.0, .015,9., .013, .8, .93)
);

float fy(R r, float x){ return r.a1*sin(r.k1*x+r.seed*6.28) + r.a2*sin(r.k2*x+r.seed*17.+uT*.05*(1.-uCalm)); }

vec3 ribbon(R r, vec2 p, float vis, vec3 base, vec3 hot){
  vec2 q = rot(-r.th)*(p-uOrigin); float s = q.x;
  if (s < -.1 || s > r.len+.2) return vec3(0.);
  float e = .002, y = fy(r,s), dy = (fy(r,s+e)-y)/e;
  float d = (q.y-y)/sqrt(1.+dy*dy);
  float head = r.len*mix(vis, 1.25, uCalm);
  float fade = mix(1., vis, uCalm);
  float along = smoothstep(0.,.08,s)*smoothstep(head,head-.18,s);
  float w = r.w*(.45+.55*sin(3.1416*clamp(s/r.len,0.,1.)))*(.8+.2*sin(s*5.+r.seed*9.));
  float u = d/w;
  if (abs(u) > 9.) return vec3(0.);
  float fl = s*.7-uFlow*.6;
  // strands: coarse bundle + fine filaments stretched along the stroke, so it reads as dragged tube light, not a blur
  float fiber = (.3+.7*vnoise(vec2(u*9.+r.seed*31., fl))) * (.4+.6*vnoise(vec2(u*38.+r.seed*7., fl*1.5+3.)));
  float body = exp(-u*u*1.6)*fiber*2.1;
  float core = exp(-u*u*14.)*(.75+.25*vnoise(vec2(s*9.-uFlow, r.seed*20.)));
  float halo = .030/(1.+u*u*1.8);
  float hs = mix(fract(r.seed*3.7+uFlow*.11), .5+.3*r.seed, uCalm)*r.len - s;
  float tw = mix(pow(max(0.,sin(uT*.8+r.seed*40.)),12.), .4*pow(max(0.,sin(uT*3.1416+r.seed*40.)),4.), uCalm);
  float glint = (hs>0. ? exp(-hs*7.) : exp(hs*70.))*exp(-u*u*5.)*tw*uSparkle;
  float drawHead = exp(-abs(s-head)*30.)*exp(-u*u*3.)*(1.-uCalm)*(1.-step(.999,vis));
  return fade*along*(base*(halo+body*1.35) + hot*(core*2.4+glint*5.+drawHead*4.));
}

// guide path: x, width, brightness at p-space height y (smooth between points)
vec3 gAt(float y){
  vec4 a = uPts[0]; vec3 r = vec3(a.x,a.z,a.w);
  if (y >= uPts[0].y) return r;
  for (int i=0;i<7;i++){
    vec4 p0 = uPts[i], p1 = uPts[i+1];
    if (y <= p0.y && y >= p1.y){
      // Catmull-Rom through the points (non-uniform spacing in y), so the guide flows instead of stair-stepping
      vec4 pm = uPts[max(i-1,0)], p2 = uPts[min(i+2,7)];
      float h = max(p0.y - p1.y, 1e-4), t = (p0.y - y) / h;
      vec3 v0 = vec3(p0.x,p0.z,p0.w), v1 = vec3(p1.x,p1.z,p1.w);
      vec3 m0 = (v1 - vec3(pm.x,pm.z,pm.w)) / max(pm.y - p1.y, h) * h;
      vec3 m1 = (vec3(p2.x,p2.z,p2.w) - v0) / max(p0.y - p2.y, h) * h;
      float t2 = t*t, t3 = t2*t;
      vec3 v = (2.*t3-3.*t2+1.)*v0 + (t3-2.*t2+t)*m0 + (-2.*t3+3.*t2)*v1 + (t3-t2)*m1;
      return vec3(v.x, max(v.yz, 0.));
    }
    r = vec3(p1.x,p1.z,p1.w);
  }
  return r;
}
vec3 guide(vec2 p, vec3 base, vec3 hot){
  vec3 g = gAt(p.y); float e = .004;
  float dx = clamp((gAt(p.y+e).x - gAt(p.y-e).x)/(2.*e), -5., 5.);
  float u = (p.x-g.x)/sqrt(1.+dx*dx)/g.y;
  if (abs(u) > 9.) return vec3(0.);
  float above = max(p.y-uHeadY, 0.);
  float tail = mix(exp(-above*1.6), .7, uStatic);
  float front = mix(smoothstep(uHeadY-.02, uHeadY, p.y), 1., uStatic);
  float fl = p.y*2.-uFlow*.6;
  float fiber = (.3+.7*vnoise(vec2(u*9.+3., fl))) * (.4+.6*vnoise(vec2(u*38., fl*1.5+3.)));
  float body = exp(-u*u*1.6)*fiber*2.1;
  float core = exp(-u*u*14.)*min(g.z,.6)*(.8+.2*vnoise(vec2(p.y*12.-uFlow,1.)));
  float halo = .030/(1.+u*u*1.8);
  float hd = exp(-abs(p.y-uHeadY)*34.)*exp(-u*u*3.)*(1.-uStatic)*(1.+uFlare*2.5);
  return g.z*tail*front*(base*(halo+body*1.35) + hot*(core*2.4)) + hot*hd*(2.+uFlare*6.);
}

vec3 enc(vec3 c){ return mix(c*12.92, 1.055*pow(max(c,0.),vec3(1./2.4))-.055, step(.0031308,c)); }

void main(){
  vec2 p = (gl_FragCoord.xy-.5*uRes)/uRes.y;
  vec2 v = p-uMouse; p += v*.55*uBend*exp(-dot(v,v)/.08);
  vec3 col = vec3(0.);
  const vec3 HOT[8] = vec3[8](vec3(1.,.82,.25), vec3(1.,.9,.45), vec3(1.,.93,.6), vec3(1.,.95,.7), vec3(1.,.9,.55), vec3(1.,.93,.6), vec3(1.,.9,.5), vec3(1.,.93,.6));
  if (uPage < .999){
    for (int i=0;i<8;i++){
      if (float(i) >= uMax) break;
      float vis = uVis[i]; if (vis <= 0.) continue;
      vec3 base = (i==1 || i==3) ? vec3(1.,.67,.02) : (i==0 ? uColA : mix(uColA, uColB, .55));
      col += ribbon(RB[i], p, vis, base, HOT[i])*(1.-uPage);
    }
  }
  if (uPage > .001) col += guide(p, vec3(.39,.26,1.), vec3(1.,.93,.6))*uPage;
  float halo = dot(col, vec3(.33));
  // screen spill (not a blob): hugs the laptop screen and falls off fast
  float sd = sdBox(p-uOrigin, uScreenHalf);
  col += uColA*.22*exp(-max(sd,0.)*max(sd,0.)*70.)*(1.-uPage*.7);
  // sparks only near existing light
  vec2 pq = p+vec2(0.,uParallax); vec2 cell = floor(pq/.06); float h = hash(cell);
  vec2 sp = (cell+.2+.6*vec2(hash(cell+7.3),hash(cell+3.1)))*.06;
  float sparkle = exp(-dot(pq-sp,pq-sp)*9000.)*pow(max(0.,sin(uT*3.*(1.-.8*uCalm)+h*6.28)),16.)*min(halo*4.,1.);
  col += vec3(1.,.8,.2)*sparkle*uSparkle*1.4;
  col *= 1.-.82*(1.-smoothstep(0.,.22,sdBox(p-uShield.xy,uShield.zw)));
  col *= 1.-.82*(1.-smoothstep(0.,.22,sdBox(p-uShield2.xy,uShield2.zw)));
  col *= uGlow*uIntensity;
  col = 1.-exp(-col*1.25);
  col = enc(col) + vec3(10.,7.,16.)/255.; // true ground: exact #0a0710 where there is no light
  col += (hash(gl_FragCoord.xy+fract(uT)*61.)-.5)*(.022+1./255.);
  o = vec4(col,1.);
}`
