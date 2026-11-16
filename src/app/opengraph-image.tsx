import { ImageResponse } from 'next/og'

export const alt = 'Hackathon4Kids: Free coding classes for grades 3-8'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0a0710', color: '#f4f1fa', padding: 80 }}>
        <div style={{ fontSize: 32, fontWeight: 600, color: '#9a93ad' }}>Hackathon4Kids</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 96, height: 6, borderRadius: 3, background: '#ffd60a', marginBottom: 40 }} />
          <div style={{ fontSize: 104, fontWeight: 700, letterSpacing: -4, lineHeight: 1.04, display: 'flex' }}>Free coding classes for grades 3-8</div>
        </div>
      </div>
    ),
    size,
  )
}
