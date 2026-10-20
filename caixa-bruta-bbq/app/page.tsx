import Cabecalho from '@/components/Cabecalho';
import Cardapio from '@/components/Cardapio';
import ComoFunciona from '@/components/ComoFunciona';
import Encomenda from '@/components/Encomenda';
import Essencia from '@/components/Essencia';
import Final from '@/components/Final';
import Hero from '@/components/Hero';
import Movimento from '@/components/Movimento';
import Prazo from '@/components/Prazo';
import Qualidade from '@/components/Qualidade';
import Recado from '@/components/Recado';
import { adicionais, combos } from '@/content/cardapio';
import { negocio } from '@/content/negocio';
import { LojaProvider } from '@/lib/loja';

/**
 * Os dados estruturados dizem ao Google o que é o negócio e o cardápio
 * com preço. Só o que é verdade: nada de nota, avaliação ou endereço de
 * rua que a empresa não informou.
 */
function dadosEstruturados() {
  const preco = (centavos: number) => (centavos / 100).toFixed(2);
  return {
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: negocio.nome,
    slogan: negocio.slogan,
    url: negocio.url,
    image: `${negocio.url}/og.jpg`,
    telephone: '+55 44 99878-0479',
    servesCuisine: ['Churrasco', 'Brasileira'],
    priceRange: 'R$ 109,99 a R$ 249,90',
    address: { '@type': 'PostalAddress', addressLocality: negocio.cidade, addressRegion: negocio.estado, addressCountry: 'BR' },
    areaServed: [
      { '@type': 'City', name: 'Sarandi' },
      { '@type': 'City', name: 'Maringá' },
    ],
    acceptsReservations: false,
    hasMenu: {
      '@type': 'Menu',
      name: 'Cardápio Caixa Bruta BBQ',
      hasMenuSection: [
        {
          '@type': 'MenuSection',
          name: 'Combos',
          hasMenuItem: combos.map((c) => ({
            '@type': 'MenuItem',
            name: c.nome,
            description: c.itens.map((i) => i.texto).join(', '),
            offers: { '@type': 'Offer', price: preco(c.preco), priceCurrency: 'BRL' },
          })),
        },
        {
          '@type': 'MenuSection',
          name: 'Adicionais',
          hasMenuItem: adicionais.map((a) => ({
            '@type': 'MenuItem',
            name: `${a.nome} (${a.porcao})`,
            offers: { '@type': 'Offer', price: preco(a.preco), priceCurrency: 'BRL' },
          })),
        },
      ],
    },
  };
}

export default function Pagina() {
  return (
    <LojaProvider>
      <a href="#cardapio" className="bt bt-claro fixed left-3 top-3 z-[60] -translate-y-24 focus:translate-y-0">
        Pular para o cardápio
      </a>
      <Cabecalho />
      <main>
        <Hero />
        <Essencia />
        <Prazo />
        <Cardapio />
        <ComoFunciona />
        <Qualidade />
        <Final ano={new Date().getFullYear()} />
      </main>
      <Encomenda />
      <Recado />
      <Movimento />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados()) }} />
    </LojaProvider>
  );
}
