// Tiny SVG world: robot walks the dotted path to a star. No gradients/ids so it
// can safely appear twice. `loop` adds the calm CSS-only walk (static fallback).
export default function GameScene({ loop = false }: { loop?: boolean }) {
  const spark = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <svg className={`game-svg${loop ? ' is-loop' : ''}`} viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden focusable="false">
      <rect width="400" height="250" fill="#eaf0ff" />
      <circle cx="330" cy="46" r="26" fill="#fff3d6" />
      <rect y="196" width="400" height="54" fill="#d5defc" />
      <path d="M0 196h400" stroke="#b9c7f7" strokeWidth="3" />
      <path d="M60 176H230V76" fill="none" stroke="#2448f5" strokeOpacity=".45" strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" />
      <g transform="translate(230 62)">
        <g className="gs-star">
          <polygon fill="#ffb81c" stroke="#e59a00" strokeWidth="2" strokeLinejoin="round" points="0,-18 5,-6 18,-5 8,4 11,17 0,10 -11,17 -8,4 -18,-5 -5,-6" />
        </g>
        {spark.map((a) => (
          <circle key={a} className="gs-spark" r="3.5" fill={a % 90 ? '#ff7a59' : '#7a5af8'} opacity="0" />
        ))}
      </g>
      <g className="gs-robot">
        <g transform="translate(60 150)">
          <rect x="-16" y="-8" width="32" height="26" rx="8" fill="#2448f5" />
          <rect x="-13" y="-34" width="26" height="22" rx="8" fill="#fff" stroke="#2448f5" strokeWidth="3" />
          <circle cx="-5" cy="-23" r="3" fill="#1d1d1f" />
          <circle cx="5" cy="-23" r="3" fill="#1d1d1f" />
          <path d="M0-34v-8" stroke="#2448f5" strokeWidth="3" strokeLinecap="round" />
          <circle cy="-45" r="3.5" fill="#ff7a59" />
          <rect x="-12" y="18" width="8" height="8" rx="3" fill="#1d1d1f" />
          <rect x="4" y="18" width="8" height="8" rx="3" fill="#1d1d1f" />
        </g>
      </g>
    </svg>
  )
}
