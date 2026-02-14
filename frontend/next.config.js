const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      
      config.externals.push(({ request }, callback) => {
        if (
          request?.startsWith('@remotion/') ||
          request === 'esbuild' ||
          request === 'prettier' ||
          request?.startsWith('esbuild/') ||
          request?.includes('@remotion')
        ) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      });
    }

    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@remotion\//,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^esbuild$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^prettier$/,
      })
    );

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
};

module.exports = nextConfig;
