import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5666/api/:path*',
      },
    ];
  },
  webpack(config) {
    config.plugins.push(new CaseSensitivePathsPlugin());
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
    });
    return config;
  },
};

export default nextConfig;
