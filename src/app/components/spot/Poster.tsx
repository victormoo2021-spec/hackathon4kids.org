import { frame0 } from './pendulum'

// Frame 0 as CSS: the same six seeded exposures the GL accumulator starts with (frame0() in pendulum.ts), same geometry
// (HeroSheet writes the exact px values of geo() into --px/--py/--L/--th on mount; the cq defaults are the pre-JS match).
// Dot cell = GL cell (clamp(8, L/62, 11)); blue cell x1.15; dot radius = .72*sqrt(tone) cells. Also does the B/K load wipes when there is no GL.
const CSS = `
.poster{position:absolute;inset:0;overflow:hidden;container-type:size;pointer-events:none;
 --px:72cqw;--L:min(82cqh,115cqw);--py:-2cqh;--th:.4rad;--C:clamp(8px,calc(var(--L)/62),11px)}
@media (max-width:47.99rem){.poster{--px:50cqw;--py:calc(6rem + 3.57*min(18vw,7.6rem));--L:clamp(200px,calc(100cqh - var(--py) - 190px),110cqw)}}
.poster i{position:absolute;left:var(--px);top:var(--py);width:calc(var(--L)*.016);height:var(--L);margin-left:calc(var(--L)*-.008);
 transform-origin:50% 0;transform:rotate(calc((var(--th) - var(--k)*.07rad)*-1));
 --rt:.68;background:radial-gradient(circle,var(--c,#111114) calc(var(--C)*var(--rt)),transparent calc(var(--C)*var(--rt) + 1px)) 0 0/var(--C) var(--C);
 animation:pw 280ms steps(4) 420ms both}
.poster i::after{content:'';position:absolute;left:50%;bottom:calc(var(--L)*-.1);width:calc(var(--L)*.2);height:calc(var(--L)*.2);margin-left:calc(var(--L)*-.1);
 border-radius:50%;background:radial-gradient(circle,var(--c,#111114) calc(var(--C)*var(--rb,.45)),transparent calc(var(--C)*var(--rb,.45) + 1px)) 0 0/var(--C) var(--C)}
.poster i.b{--c:#1F3FCF;--rt:calc(.72*var(--s));--rb:calc(.72*var(--sb));--C:calc(clamp(8px,calc(var(--L)/62),11px)*1.15);translate:1.5px 1px;
 animation:pw 350ms steps(5) 280ms both,pr 350ms steps(5) 630ms both}
/* floor halftone: tone .22 ramped in from 80% height / 30% width (floorT in hero.frag.ts) */
.poster::after{content:'';position:absolute;left:30%;right:0;bottom:0;height:14%;
 background:radial-gradient(circle,#111114 calc(var(--C)*.36),transparent calc(var(--C)*.36 + 1px)) 0 0/var(--C) var(--C);
 -webkit-mask-image:linear-gradient(to right,transparent 0 15%,#000 15%);
 mask-image:linear-gradient(to right,transparent 0 15%,#000 15%);animation:pw 280ms steps(4) 420ms both}
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
        <i key={i} className="b" style={{ '--k': i, '--s': Math.sqrt(0.3 * e.w).toFixed(3), '--sb': Math.sqrt(0.85 * 0.4 * e.w).toFixed(3) } as React.CSSProperties} />
      ))}
      <i style={{ '--k': 0 } as React.CSSProperties} />
    </div>
  )
}
