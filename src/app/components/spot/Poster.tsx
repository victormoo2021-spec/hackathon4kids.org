import { INK } from '../../press/ink'
import { LOAD_MS, frame0 } from './pendulum'

// Frame 0 as CSS: the same six seeded exposures the GL accumulator starts with (frame0() in pendulum.ts), same geometry
// (HeroSheet writes the exact px values of geo() into --px/--py/--L/--th on mount; the cq defaults are the pre-JS match).
// Dot cell = GL cell (clamp(8, L/62, 11)); trail cell x1.15; dot radius = .66*sqrt(tone) cells. Also does the B/K load wipes when there is no GL.
const K = encodeURIComponent(INK.text), B = encodeURIComponent(INK.accent), A = encodeURIComponent(INK.glow)
const wipe = ([a, b, n]: readonly [number, number, number]) => `pw ${b - a}ms steps(${n}) ${a}ms both` // same steps as plate() in pendulum.ts
// one dot per cell as an SVG tile (url(), not a gradient); r in cells, the tile clips it like the old radial stop did
const tile = (r: number, c: string) => c === B ? tile0(r, c) : tile45(r, c)
// beam and afterglow screens are a 45deg lattice: centred-square tile of side C*sqrt2, dots at corners + centre (nearest-neighbour spacing C)
const tile45 = (r: number, c: string) => { const q = ((r / Math.SQRT2) * 100).toFixed(1); return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cg fill='${c}'%3E%3Ccircle cx='50' cy='50' r='${q}'/%3E%3Ccircle cx='0' cy='0' r='${q}'/%3E%3Ccircle cx='100' cy='0' r='${q}'/%3E%3Ccircle cx='0' cy='100' r='${q}'/%3E%3Ccircle cx='100' cy='100' r='${q}'/%3E%3C/g%3E%3C/svg%3E")` }
const tile0 = (r: number, c: string) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Ccircle cx='50' cy='50' r='${(r * 100).toFixed(1)}' fill='${c}'/%3E%3C/svg%3E")`
// floor halftone: tone .5*smoothstep(.8,1,y)*smoothstep(.3,.6,x) (floorT in hero.frag.ts), stepped into bands, radius .66*sqrt(tone) cells, afterglow colour
const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const XB = [...Array.from({ length: 6 }, (_, i) => [0.3 + i * 0.05, 0.35 + i * 0.05]), [0.6, 1]], YB = Array.from({ length: 5 }, (_, i) => [0.8 + i * 0.04, 0.84 + i * 0.04])
const floor = YB.flatMap(([y0, y1]) => XB.map(([x0, x1]) => ({ x0, x1, y0, y1, r: 0.66 * Math.sqrt(0.5 * ss(0.8, 1, (y0 + y1) / 2) * ss(0.3, 0.6, (x0 + x1) / 2)) }))).filter((f) => f.r > 0.04)
const CSS = `
.poster{position:absolute;inset:0;overflow:hidden;container-type:size;pointer-events:none;
 --px:72cqw;--L:min(82cqh,115cqw);--py:-2cqh;--th:.4rad;--C:clamp(8px,calc(var(--L)/62),11px)}
@media (max-width:47.99rem){.poster{--px:50cqw;--py:calc(6rem + 3.57*min(18vw,7.6rem));--L:clamp(200px,calc(100cqh - var(--py) - 190px),110cqw)}}
.poster i{position:absolute;left:var(--px);top:var(--py);width:calc(var(--L)*.016);height:var(--L);margin-left:calc(var(--L)*-.008);
 transform-origin:50% 0;transform:rotate(calc((var(--th) - var(--pk)*.07rad)*-1));
 background:var(--pd) 0 0/var(--Ck,var(--C)) var(--Ck,var(--C));
 animation:${wipe(LOAD_MS.k)}}
.poster i .dot{position:absolute;left:50%;bottom:calc(var(--L)*-.1);width:calc(var(--L)*.2);height:calc(var(--L)*.2);margin-left:calc(var(--L)*-.1);transform:rotate(calc(var(--th) - var(--pk)*.07rad + var(--ang,0deg)));
 border-radius:50%;background:var(--pdb) 0 0/var(--Ck,var(--C)) var(--Ck,var(--C))}
.poster i.b{--C:calc(clamp(8px,calc(var(--L)/62),11px)*1.15);translate:1.5px 1px;--ang:15deg;
 animation:${wipe(LOAD_MS.b)},pr 350ms steps(5) ${LOAD_MS.b[1]}ms both}
/* floor halftone: tone .5 ramped in from 80% height / 30% width (floorT in hero.frag.ts) */
.poster .floor{position:absolute;inset:0;animation:${wipe(LOAD_MS.k)}}
.poster{--Ck:calc(var(--C)*1.4142)}
.poster .floor s{position:absolute;background-size:var(--Ck) var(--Ck)}
.poster i.b,.poster i.b .dot{--Ck:var(--C)}
/* tuned: inset(0 0 100% 0) -> inset(0) clipped the bob disc (it overhangs the rod box) for good under fill-mode both; the clip now overhangs by 30vmax */
@keyframes pw{from{clip-path:inset(0 -30vmax 100% -30vmax)}to{clip-path:inset(0 -30vmax -30vmax -30vmax)}}
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
        // trail exposures: rod tone .47w (--s; tuned: .30 -> .47 = bob() rod .55 x acc .85, the poster fan read thinner than GL frame 0), disc tone .85*.4w (--sb, .4 = mean shade); dot radius .66*sqrt(tone) as in GL screen()
        <i key={i} className="b" style={{ '--pk': i, '--pd': tile(0.66 * Math.sqrt(0.47 * e.w), B), '--pdb': tile(0.66 * Math.sqrt(0.85 * 0.4 * e.w), B) } as React.CSSProperties}><b className="dot" /></i>
      ))}
      <div className="floor">
        {floor.map((f, i) => <s key={i} style={{ left: f.x0 * 100 + '%', width: (f.x1 - f.x0) * 100 + '%', top: f.y0 * 100 + '%', height: (f.y1 - f.y0) * 100 + '%', backgroundImage: tile(f.r, A) }} />)}
      </div>
      <i style={{ '--pk': 0, '--pd': tile(0.63, K), '--pdb': tile(0.42, K) } as React.CSSProperties}><b className="dot" /></i>
    </div>
  )
}
