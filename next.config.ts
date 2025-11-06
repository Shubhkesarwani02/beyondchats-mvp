import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  
  // Webpack configuration for serverless PDF processing
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize canvas and other native modules
      config.externals = config.externals || [];
      // Note: pdfjs-dist/legacy doesn't need canvas
      
      // Prevent webpack from trying to bundle worker files
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdfjs-dist/build/pdf.worker.js': false,
        'pdfjs-dist/build/pdf.worker.mjs': false,
      };
    }
    
    // Ignore node-specific modules in client bundle
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      canvas: false,
      // pdfjs-dist specific fallbacks
      path: false,
      stream: false,
      crypto: false,
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
