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
  // Lessons and Grammar (coming-soon stubs) became the Learn guides; keep
  // old links and rankings.
  // Pages stream: a breakdown page sends its content first and its <title>
  // (generateMetadata, which asks the API for the sentence) after. nginx holds
  // a proxied response until it is complete unless told not to, so moving from
  // the analyze form to /sentence/<id> waited on that API call before anything
  // changed. This header turns that buffering off for pages; static files are
  // unaffected. See deploy/nginx-hanbok.conf.
  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image).*)',
        headers: [{ key: 'X-Accel-Buffering', value: 'no' }],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/lessons', destination: '/learn', statusCode: 301 },
      { source: '/lessons/:path*', destination: '/learn', statusCode: 301 },
    ];
  },
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
