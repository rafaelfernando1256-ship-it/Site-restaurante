import type { NextConfig } from 'next';

/**
 * O site é um catálogo com agendamento e fechamento pelo WhatsApp: não
 * precisa de servidor. `npm run build` gera tudo em `out/`, pronto para
 * arrastar na Netlify (ou `npm run zip` para o .zip).
 */
const config: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  agentRules: false,
};

export default config;
