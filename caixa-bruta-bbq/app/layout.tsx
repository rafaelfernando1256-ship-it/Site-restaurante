import type { Metadata, Viewport } from 'next';
import { Anton, Manrope } from 'next/font/google';

import { negocio } from '@/content/negocio';
import './globals.css';

const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });

const titulo = 'Caixa Bruta BBQ | Churrasco sob encomenda em Sarandi e Maringá';
const descricao = 'Combos de churrasco preparados sob encomenda: alcatra, coxinha da asa, linguiça '
  + 'toscana e costela suína. Entregas quinta, sexta e sábado a partir das 20h em Sarandi e '
  + 'região. Encomende com no mínimo 8 horas de antecedência.';

export const metadata: Metadata = {
  metadataBase: new URL(negocio.url),
  title: titulo,
  description: descricao,
  applicationName: negocio.nome,
  keywords: ['churrasco delivery Sarandi', 'churrasco Maringá', 'combo de churrasco', 'churrasco sob encomenda',
    'Caixa Bruta BBQ', 'costela suína barbecue', 'alcatra'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: negocio.nome,
    title: titulo,
    description: descricao,
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Caixa Bruta BBQ: brasa acesa sob a grelha' }],
  },
  twitter: { card: 'summary_large_image', title: titulo, description: descricao, images: ['/og.jpg'] },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#080808',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        {/* Marca que há JavaScript: só então as entradas escondem o conteúdo. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
