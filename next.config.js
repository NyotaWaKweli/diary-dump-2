/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // SWC minification is enabled by default in Next.js 15,
  // but keeping it explicit is fine:
  swcMinify: true,

  // Configure external image domains if your app loads images
  // from outside sources (replace with your actual domains):
  images: {
    domains: ['yourdomain.com'],
  }
};

module.exports = nextConfig;
