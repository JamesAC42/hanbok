const apiUrl = process.env.API_INTERNAL_URL || 'http://localhost:5666';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Baked in at build time (like the rewrite below) so server-rendered pages
  // reach the same API at runtime. See src/lib/seo.js.
  env: {
    API_INTERNAL_URL: apiUrl,
  },
  // Deploys build into a side directory (NEXT_DIST_DIR) while the live site
  // keeps serving from .next, then swap it in. See scripts/deploy.sh.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
    });
    return config;
  },
};

export default nextConfig;
