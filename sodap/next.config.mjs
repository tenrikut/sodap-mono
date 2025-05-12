/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure SWC compiler is used
  compiler: {
    // ssr and displayName are configured by default
    styledComponents: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
