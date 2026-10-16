import type { NextConfig } from 'next';

/**
 * `SITE_ESTATICO=1 npm run build` gera uma versão 100% estática em
 * `out/`, com os caminhos relativos — é o que dá para hospedar em
 * qualquer lugar que sirva arquivos, sem Node rodando.
 *
 * Para a Vercel você NÃO usa isto: lá o build normal é melhor, porque
 * mantém a otimização de imagem do next/image.
 */
const estatico = process.env.SITE_ESTATICO === '1';

const config: NextConfig = {
  reactStrictMode: true,
  ...(estatico ? { output: 'export' as const, assetPrefix: './', trailingSlash: true } : {}),
  images: {
    // Exportação estática não tem servidor para otimizar imagem.
    unoptimized: estatico,
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
