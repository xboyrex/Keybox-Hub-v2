/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static — no server runtime required.
  output: 'export',
  // Cloudflare Pages serves /path/index.html cleanly with trailing slashes.
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: false
  }
};

export default nextConfig;
