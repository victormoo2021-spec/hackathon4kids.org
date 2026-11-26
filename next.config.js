const withMDX = require('@next/mdx')()
 
/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  outputFileTracingRoot: __dirname,
  images: { formats: ['image/avif', 'image/webp'] },
  experimental: {
    mdxRs: true,
    optimizePackageImports: ['@radix-ui/react-icons', '@radix-ui/react-navigation-menu'],
  },
}
 
module.exports = withMDX(nextConfig)
