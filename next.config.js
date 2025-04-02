/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.css': ['style-loader', 'css-loader', 'postcss-loader'],
      },
    },
  },
};

module.exports = nextConfig; 