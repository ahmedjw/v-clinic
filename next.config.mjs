/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Enables static HTML export for PWA
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Required for static export with Next/Image
  },
  webpack: (config, { isServer }) => {
    // Polyfill 'path' module for client-side if needed by any dependency
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        path: require.resolve("path-browserify"),
      };
    }
    return config;
  },
};

export default nextConfig;
