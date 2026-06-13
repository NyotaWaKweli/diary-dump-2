/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Next.js 15 enables the app/ directory by default,
  // so we removed the invalid experimental.appDir flag.

  // SWC minification is enabled by default, but you can keep this line
  // if you want to be explicit:
  swcMinify: true,

  // Configure external image domains if needed:
  images: {
    domains: ['yourdomain.com'], // replace with any external image hosts
  },

  // If you need output file tracing for serverless functions, use:
  // outputFileTracingIncludes: { '/api/**': ['./extra'] },
};

module.exports = nextConfig;
