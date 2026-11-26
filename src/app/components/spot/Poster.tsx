import { frame0 } from './pendulum'

// Frame 0 as CSS: the same six seeded exposures the GL accumulator starts with (frame0() in pendulum.ts), same geometry
// (HeroSheet writes the exact px values of geo() into --px/--py/--L/--th on mount; the cq defaults are the pre-JS match).
// Dot cell = GL cell (clamp(8, L/62, 11)); blue cell x1.15; dot radius = .72*sqrt(tone) cells. Also does the B/K load wipes when there is no GL.
const K = '%23111114', B = '%231F3FCF'
// one dot per cell as an SVG tile (url(), not a gradient); r in cells, the tile clips it like the old radial stop did
const tile = (r: number, c: string) => c === K ? tile45(r) : tile0(r, c)
// K screen is a 45deg lattice: centred-square tile of side C*sqrt2, dots at corners + centre (nearest-neighbour spacing C)
const tile45 = (r: number) => { const q = ((r / Math.SQRT2) * 100).toFixed(1); return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cg fill='${K}'%3E%3Ccircle cx='50' cy='50' r='${q}'/%3E%3Ccircle cx='0' cy='0' r='${q}'/%3E%3Ccircle cx='100' cy='0' r='${q}'/%3E%3Ccircle cx='0' cy='100' r='${q}'/%3E%3Ccircle cx='100' cy='100' r='${q}'/%3E%3C/g%3E%3C/svg%3E")` }
const tile0 = (r: number, c: string) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Ccircle cx='50' cy='50' r='${(r * 100).toFixed(1)}' fill='${c}'/%3E%3C/svg%3E")`
// floor halftone: tone .22*smoothstep(.8,1,y)*smoothstep(.3,.6,x) (floorT in hero.frag.ts), stepped into bands, radius .72*sqrt(tone) cells
const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const XB = [...Array.from({ length: 6 }, (_, i) => [0.3 + i * 0.05, 0.35 + i * 0.05]), [0.6, 1]], YB = Array.from({ length: 5 }, (_, i) => [0.8 + i * 0.04, 0.84 + i * 0.04])
const floor = YB.flatMap(([y0, y1]) => XB.map(([x0, x1]) => ({ x0, x1, y0, y1, r: 0.72 * Math.sqrt(0.22 * ss(0.8, 1, (y0 + y1) / 2) * ss(0.3, 0.6, (x0 + x1) / 2)) }))).filter((f) => f.r > 0.04)
const CSS = `
.poster{position:absolute;inset:0;overflow:hidden;container-type:size;pointer-events:none;
 --px:72cqw;--L:min(82cqh,115cqw);--py:-2cqh;--th:.4rad;--C:clamp(8px,calc(var(--L)/62),11px)}
@media (max-width:47.99rem){.poster{--px:50cqw;--py:calc(6rem + 3.57*min(18vw,7.6rem));--L:clamp(200px,calc(100cqh - var(--py) - 190px),110cqw)}}
.poster i{position:absolute;left:var(--px);top:var(--py);width:calc(var(--L)*.016);height:var(--L);margin-left:calc(var(--L)*-.008);
 transform-origin:50% 0;transform:rotate(calc((var(--th) - var(--k)*.07rad)*-1));
 background:var(--d) 0 0/var(--Ck,var(--C)) var(--Ck,var(--C));
 animation:pw 280ms steps(4) 420ms both}
.poster i .dot{position:absolute;left:50%;bottom:calc(var(--L)*-.1);width:calc(var(--L)*.2);height:calc(var(--L)*.2);margin-left:calc(var(--L)*-.1);transform:rotate(calc(var(--th) - var(--k)*.07rad + var(--ang,0deg)));
 border-radius:50%;background:var(--db) 0 0/var(--Ck,var(--C)) var(--Ck,var(--C))}
.poster i.b{--C:calc(clamp(8px,calc(var(--L)/62),11px)*1.15);translate:1.5px 1px;--ang:15deg;
 animation:pw 350ms steps(5) 280ms both,pr 350ms steps(5) 630ms both}
/* floor halftone: tone .22 ramped in from 80% height / 30% width (floorT in hero.frag.ts) */
.poster .floor{position:absolute;inset:0;animation:pw 280ms steps(4) 420ms both}
.poster{--Ck:calc(var(--C)*1.4142)}
.poster .floor s{position:absolute;background-size:var(--Ck) var(--Ck)}
.poster i.b,.poster i.b .dot{--Ck:var(--C)}
@keyframes pw{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0)}}
@keyframes pr{from{translate:26px 1px}}
@media (prefers-reduced-motion:reduce){.poster i{animation:none}}
.hs[data-gl] .poster{visibility:hidden}
`
export default function Poster() {
  const ex = frame0(1).exposures
  return (
    <div className="poster" aria-hidden>
      <style>{CSS}</style>
      {ex.map((e, i) => (
        // blue exposures: rod tone .30w (--s), disc tone .85*.4w (--sb, .4 = mean shade); dot radius .72*sqrt(tone) as in GL screen()
        <i key={i} className="b" style={{ '--k': i, '--d': tile(0.72 * Math.sqrt(0.3 * e.w), B), '--db': tile(0.72 * Math.sqrt(0.85 * 0.4 * e.w), B) } as React.CSSProperties}><b className="dot" /></i>
      ))}
      <div className="floor">
        {floor.map((f, i) => <s key={i} style={{ left: f.x0 * 100 + '%', width: (f.x1 - f.x0) * 100 + '%', top: f.y0 * 100 + '%', height: (f.y1 - f.y0) * 100 + '%', backgroundImage: tile(f.r, K) }} />)}
      </div>
      <i style={{ '--k': 0, '--d': tile(0.68, K), '--db': tile(0.45, K) } as React.CSSProperties}><b className="dot" /></i>
    </div>
  )
}
