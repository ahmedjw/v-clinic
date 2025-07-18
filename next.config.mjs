/** @type {import('next').NextConfig} */
const nextConfig = {
experimental: {
  swcMinify: true,
},
eslint: {
  ignoreDuringBuilds: false,
},
typescript: {
  ignoreBuildErrors: false,
},
images: {
  unoptimized: true,
},
// PWA configuration headers are no longer strictly needed as there's no server-side API
// but keeping them doesn't hurt for client-side PWA functionality.
// If you want to remove them completely, you can delete this `headers` block.
async headers() {
  return [
    {
      source: '/manifest.json',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/manifest+json',
        },
      ],
    },
    {
      source: '/sw.js',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/javascript',
        },
        {
          key: 'Service-Worker-Allowed',
          value: '/',
        },
      ],
    },
  ];
},
};

export default nextConfig;
