/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'res.cloudinary.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@huggingface/transformers', 'sharp', 'onnxruntime-node', 'onnxruntime-common'],
    outputFileTracingIncludes: {
      '/api/**/*': [
        './node_modules/onnxruntime-node/**/*',
        './node_modules/onnxruntime-common/**/*',
        './node_modules/@huggingface/transformers/**/*',
      ],
      '/*': [
        './node_modules/onnxruntime-node/**/*',
        './node_modules/onnxruntime-common/**/*',
      ],
    },
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
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
