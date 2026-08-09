import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const remotePatterns = [
  { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/uploads/**' }
]

const apiUrl = process.env.NEXT_PUBLIC_API_URL
if (apiUrl) {
  try {
    const { protocol, hostname } = new URL(apiUrl)
    remotePatterns.push({ protocol: protocol.replace(':', ''), hostname, pathname: '/uploads/**' })
  } catch {}
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname)
    }
    return config
  },
  images: { remotePatterns }
}

export default nextConfig
