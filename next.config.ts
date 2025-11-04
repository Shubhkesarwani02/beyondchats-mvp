import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  
  // Webpack configuration to handle pdf-parse
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize pdf-parse to avoid ESM issues
      config.externals = config.externals || [];
      config.externals.push('pdf-parse');
    }
    
    // Ignore node-specific modules in client bundle
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      canvas: false,
    };
    
    return config;
  },
  
  // Headers for CORS support
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  
  // Disable static optimization for API routes to ensure they run as serverless functions
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
