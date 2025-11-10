/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Avoid overriding internal App Router API routes under /api/* during build
    // Enable proxy only when explicitly requested via env
    if (process.env.NEXT_ENABLE_BACKEND_PROXY === 'true') {
      return [
        {
          source: '/backend/:path*',
          destination: 'http://localhost:8000/api/:path*',
        },
      ];
    }
    return [];
  },
  webpack: (config) => {
    config.externals.push({
      "@ffmpeg-installer/ffmpeg": "@ffmpeg-installer/ffmpeg",
    });
    return config;
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
