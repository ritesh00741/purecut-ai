/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'res.cloudinary.com'],
  },
  experimental: {
    // Next.js 14 key for keeping packages server-side only (not bundled by webpack)
    serverComponentsExternalPackages: ['@huggingface/transformers', 'sharp', 'onnxruntime-node'],
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Tell webpack to treat @huggingface/transformers as an external (use require() at runtime)
      // This prevents webpack from trying to bundle WASM files, .node.mjs files, etc.
      if (!config.externals) config.externals = [];
      const externals = Array.isArray(config.externals) ? config.externals : [config.externals];
      externals.push(
        ({ request }, callback) => {
          if (
            request &&
            (request.startsWith('@huggingface/transformers') ||
              request.startsWith('onnxruntime') ||
              request.startsWith('sharp'))
          ) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        }
      );
      config.externals = externals;
    }
    return config;
  },
};

export default nextConfig;
