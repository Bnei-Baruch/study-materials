import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${process.env.API_URL || 'http://backend:8080'}/api/:path*`
        }
      ]
    }
  }
  // ... any other config you have
}

export default nextConfig