/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.css': ['style-loader', 'css-loader', 'postcss-loader'],
      },
    },
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
    });
    return config;
  },
};

module.exports = nextConfig; 