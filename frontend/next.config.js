const webpack = require('webpack');

const serverOnlyRemotionPackages = [
  '@remotion/lambda',
  '@remotion/bundler',
  '@remotion/cli',
  '@remotion/studio-server',
  '@remotion/renderer',
  '@remotion/compositor-darwin-x64',
  '@remotion/compositor-darwin-arm64',
  '@remotion/compositor-linux-x64-musl',
  '@remotion/compositor-linux-x64-gnu',
  '@remotion/compositor-linux-arm64-musl',
  '@remotion/compositor-win32-x64-msvc',
];

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
          serverOnlyRemotionPackages.some(pkg => request?.startsWith(pkg)) ||
          request === 'esbuild' ||
          request === 'prettier' ||
          request?.startsWith('esbuild/')
        ) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      });

      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: new RegExp(`^(${serverOnlyRemotionPackages.map(pkg => pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`),
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /^esbuild$/,
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /^prettier$/,
        })
      );
    }

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
