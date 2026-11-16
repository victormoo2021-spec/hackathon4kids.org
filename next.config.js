const withMDX = require('@next/mdx')()
 
/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  outputFileTracingRoot: __dirname,
  experimental: {
    mdxRs: true,
    viewTransition: true,
  },
}
 
module.exports = withMDX(nextConfig)
