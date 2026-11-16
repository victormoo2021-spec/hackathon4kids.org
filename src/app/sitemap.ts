import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/programs', '/about', '/code.org'].map((p) => ({ url: `https://hackathon4kids.org${p}` }))
}
