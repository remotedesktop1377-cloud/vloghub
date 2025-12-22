/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Avoid overriding internal App Router API routes under /api/* during build
    // Enable proxy only when explicitly requested via env
    if (process.env.NEXT_ENABLE_BACKEND_PROXY === 'true') {
      return [
        {
          source: '/backend/:path*',
          destination: `${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL}/api/:path*`,
        },
      ];
    }
    return [];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
    ],
  },
};

module.exports = nextConfig;
