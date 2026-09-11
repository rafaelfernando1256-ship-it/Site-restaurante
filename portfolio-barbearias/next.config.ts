import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exporta HTML estático: roda em qualquer hospedagem (Netlify, Vercel,
  // GitHub Pages, Hostinger) sem servidor Node.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
