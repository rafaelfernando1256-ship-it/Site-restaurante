import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';

import { enderecoEmLinha, site } from '@/content/site';

import './globals.css';

/* As fontes vêm pelo next/font: baixadas no build e servidas do mesmo
   domínio. Sem requisição ao Google no navegador de quem acessa, sem
   o pulo de layout de quem carrega fonte por <link>. */
const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--fonte-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--fonte-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.seo.url),
  title: {
    default: site.seo.titulo,
    template: `%s · ${site.marca.nome}`,
  },
  description: site.seo.descricao,
  keywords: [...site.seo.palavras],
  authors: [{ name: site.marca.nome }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: site.seo.url,
    siteName: site.marca.nome,
    title: site.seo.titulo,
    description: site.seo.descricao,
  },
  twitter: {
    card: 'summary_large_image',
    title: site.seo.titulo,
    description: site.seo.descricao,
  },
  alternates: { canonical: site.seo.url },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#faf7f3',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Os dados estruturados.
 *
 * ATENÇÃO, e isto está escrito aqui de propósito: este bloco descreve
 * um negócio local para o Google — endereço, telefone, horário. A
 * Maison Lumière é fictícia, então enquanto o site for portfólio, isto
 * é um exemplo preenchido com dados de exemplo, e o rodapé diz isso em
 * letra legível.
 *
 * Antes de publicar para um cliente real: troque TODOS os campos
 * abaixo pelos dados verdadeiros dele. Publicar schema de negócio
 * local com dado inventado é pedir para o Google desconfiar do site, e
 * é informação falsa para quem procura um endereço.
 */
function dadosEstruturados() {
  const e = site.contato.endereco;

  const clinica = {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: `${site.marca.nome} ${site.marca.complemento}`,
    description: site.seo.descricao,
    url: site.seo.url,
    telephone: site.contato.telefoneVisivel,
    email: site.contato.email,
    priceRange: site.seo.faixaPreco,
    address: {
      '@type': 'PostalAddress',
      streetAddress: e.rua,
      addressLocality: e.cidade,
      addressRegion: e.estado,
      postalCode: e.cep,
      addressCountry: 'BR',
    },
    areaServed: { '@type': 'City', name: e.cidade },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '09:00',
        closes: '15:00',
      },
    ],
    makesOffer: site.procedimentos.itens.map((p) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: p.nome, description: p.texto },
    })),
  };

  // O FAQ em schema é o que faz as perguntas aparecerem direto na
  // busca. As respostas são as mesmas do site — tem que ser.
  const perguntas = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: site.faq.itens.map((item) => ({
      '@type': 'Question',
      name: item.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: item.resposta },
    })),
  };

  return [clinica, perguntas];
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={site.seo.idioma} className={`${display.variable} ${sans.variable}`}>
      <body>
        {/* Os dados estruturados ficam no <body>, e não num <head>
            escrito à mão.

            Motivo: com um <head> manual aqui, qualquer erro de
            renderização fazia o React refazer o documento usando ESTE
            head — que só tem os scripts abaixo — e varria o <title>,
            o lang e a meta description que o Next injeta. Foi assim
            que o Lighthouse, rodando sem GPU, acusou um site sem
            título. O JSON-LD vale igual no corpo da página; o head é
            do Next. */}
        {dadosEstruturados().map((bloco, i) => (
          <script
            key={i}
            type="application/ld+json"
            // O conteúdo vem do nosso arquivo de conteúdo, não de
            // entrada de usuário.
            dangerouslySetInnerHTML={{ __html: JSON.stringify(bloco) }}
          />
        ))}
        {/* Primeiro elemento focável da página: quem usa teclado pula
            o menu inteiro com um Tab e um Enter. */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-grafite focus:px-5 focus:py-3 focus:text-sm focus:text-areia"
        >
          Pular para o conteúdo
        </a>
        {children}
        <span className="sr-only">{enderecoEmLinha()}</span>
      </body>
    </html>
  );
}
