import { ImageResponse } from 'next/og'

export const alt = 'Hackathon4Kids: Free coding classes for grades 3-8'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#fff', color: '#1d1d1f', padding: 80 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 36, fontWeight: 600 }}>
          <div style={{ width: 24, height: 24, borderRadius: 12, background: '#2448f5' }} />
          Hackathon4Kids
        </div>
        <div style={{ fontSize: 108, fontWeight: 700, letterSpacing: -4, lineHeight: 1.02, display: 'flex', flexWrap: 'wrap' }}>
          <span>Free coding classes for&nbsp;</span>
          <span style={{ color: '#2448f5' }}>grades 3-8</span>
        </div>
        <div style={{ fontSize: 32, color: '#6e6e73' }}>Taught by high-school students. Bay Area.</div>
      </div>
    ),
    size,
  )
}
