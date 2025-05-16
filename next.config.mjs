/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    "dev.example.com",
    "3.unayung.cc",
    "4.unayung.cc",
    "5.unayung.cc",
  ],
};

export default nextConfig;
