import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    // Para trocar um placeholder por uma foto de verdade, basta colar a
    // URL do Unsplash em content/site.ts — o domínio já está liberado aqui.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default config;
