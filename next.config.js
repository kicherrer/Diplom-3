/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['zhnjccpwicpzhpvbsimx.supabase.co'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'bufferutil': false,
        'utf-8-validate': false,
      };
    }
    return config;
  },
  reactStrictMode: true,
  swcMinify: true,
  // Удаляем experimental.serverComponents, так как это теперь включено по умолчанию в Next.js 13+
};

module.exports = nextConfig;
