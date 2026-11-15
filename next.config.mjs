/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    workerThreads: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "nextjs.org" },
    ],
  },
};

export default nextConfig;
