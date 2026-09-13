/**
 * VOLT — catálogo.
 *
 * Fonte única de verdade. A home, as páginas de produto, a busca, os
 * filtros, a ordenação, o carrinho, o sitemap e o JSON-LD leem daqui.
 * Marca, produtos, preços e SKUs são fictícios.
 */

export const CATEGORIAS = [
  { id: 'correntes', nome: 'Correntes', capa: 'cat-correntes.svg',
    linha: 'A peça que abre o look.' },
  { id: 'aneis',     nome: 'Anéis',     capa: 'cat-aneis.svg',
    linha: 'Volume na mão, sem exagero.' },
  { id: 'pulseiras', nome: 'Pulseiras', capa: 'cat-pulseiras.svg',
    linha: 'Peso certo no pulso.' },
  { id: 'brincos',   nome: 'Brincos',   capa: 'cat-brincos.svg',
    linha: 'Detalhe que muda o rosto.' },
  { id: 'kits',      nome: 'Kits',      capa: 'cat-kits.svg',
    linha: 'Combinação pronta, preço menor.' },
];

/** Etiquetas que dirigem as seções da home e os filtros. */
export const SELOS = {
  'mais-vendido': { nome: 'Mais vendido', classe: 'selo--top' },
  'novidade':     { nome: 'Novidade',     classe: 'selo--novo' },
  'oferta':       { nome: 'Oferta',       classe: 'selo--off' },
};

export const PRODUTOS = [
  {
    slug: 'corrente-cubana-8', sku: 'VLT-CO-801', nome: 'Corrente Cubana 8 mm',
    categoria: 'correntes', preco: 189.90, precoDe: 249.90,
    tags: ['mais-vendido', 'oferta'], nota: 4.8, avaliacoes: 213, imagens: 3,
    resumo: 'Elo grosso, brilho de espelho. A corrente que aparece na foto.',
    material: 'Aço inox 316L com banho de ródio',
    descricao: [
      'Oito milímetros de elo cubano em aço inox 316L — o mesmo aço de ' +
      'instrumento cirúrgico, que não enferruja no suor nem no mar. Por cima, ' +
      'banho de ródio, que é o que segura o brilho de espelho depois de meses ' +
      'de uso diário.',
      'Peso real no pescoço, sem ser incômoda: os elos são soldados um a um e ' +
      'a corrente cai reta em vez de torcer. Fecho de gaveta com trava dupla, ' +
      'que é o tipo que não abre sozinho dentro do bolso.',
    ],
    detalhes: [
      ['Material', 'Aço inox 316L com banho de ródio'],
      ['Espessura', '8 mm'],
      ['Fecho', 'Gaveta com trava dupla'],
      ['Peso', '72 g na versão 60 cm'],
      ['Antialérgico', 'Sim — sem níquel livre'],
      ['Garantia', '1 ano contra escurecimento'],
    ],
    variante: { rotulo: 'Comprimento', opcoes: ['50 cm', '60 cm', '70 cm'], padrao: 1 },
  },
  {
    slug: 'corrente-cruz', sku: 'VLT-CO-412', nome: 'Corrente Cruz Gótica',
    categoria: 'correntes', preco: 179.90, precoDe: 219.90,
    tags: ['novidade', 'oferta'], nota: 4.7, avaliacoes: 88, imagens: 3,
    resumo: 'Grumet fina com pingente de cruz. Discreta de longe, pesada de perto.',
    material: 'Aço inox 316L escovado e polido',
    descricao: [
      'Fio grumet de 4 mm com pingente de cruz de 5 cm. A cruz tem as bordas ' +
      'chanfradas e o miolo espelhado — de longe some, de perto pega a luz ' +
      'inteira.',
      'O pingente é removível: sai do fio sem ferramenta, então dá para usar a ' +
      'corrente sozinha ou trocar por outro pingente.',
    ],
    detalhes: [
      ['Material', 'Aço inox 316L escovado e polido'],
      ['Espessura do fio', '4 mm'],
      ['Pingente', 'Cruz de 50 mm · removível'],
      ['Fecho', 'Mosquetão reforçado'],
      ['Peso', '38 g com o pingente'],
      ['Garantia', '1 ano contra escurecimento'],
    ],
    variante: { rotulo: 'Comprimento', opcoes: ['50 cm', '60 cm'], padrao: 1 },
  },
  {
    slug: 'anel-signet', sku: 'VLT-AN-107', nome: 'Anel Signet Raio',
    categoria: 'aneis', preco: 99.90, precoDe: null,
    tags: ['mais-vendido'], nota: 4.9, avaliacoes: 156, imagens: 3,
    resumo: 'Face oval com o raio da marca em relevo. Unissex.',
    material: 'Aço inox 316L polido',
    descricao: [
      'Anel de brasão com face oval de 20 por 16 mm e o raio da VOLT em ' +
      'relevo fundido — não é gravação a laser que some com o tempo, é volume ' +
      'de verdade no metal.',
      'O aro é chato por dentro, o que faz ele girar menos no dedo. Funciona ' +
      'em qualquer mão e é o anel que mais volta como segundo pedido.',
    ],
    detalhes: [
      ['Material', 'Aço inox 316L polido'],
      ['Face', '20 mm por 16 mm'],
      ['Aro', '3 mm · interior chato'],
      ['Relevo', 'Fundido, não gravado'],
      ['Antialérgico', 'Sim — sem níquel livre'],
      ['Garantia', '1 ano contra escurecimento'],
    ],
    variante: { rotulo: 'Aro', opcoes: ['16', '18', '20', '22', '24'], padrao: 2 },
  },
  {
    slug: 'anel-martelado', sku: 'VLT-AN-233', nome: 'Anel Chunky Martelado',
    categoria: 'aneis', preco: 89.90, precoDe: 119.90,
    tags: ['oferta'], nota: 4.6, avaliacoes: 74, imagens: 3,
    resumo: 'Aro largo com marca de martelo. Cada um sai um pouco diferente.',
    material: 'Aço inox 316L martelado à mão',
    descricao: [
      'Aro de 8 mm batido à mão, uma marca de cada vez. Como o martelo é ' +
      'manual, duas peças nunca ficam idênticas — a que chegar na sua casa é ' +
      'a única daquele jeito.',
      'O acabamento martelado disfarça risco de uso, então é o anel certo para ' +
      'quem trabalha com a mão e não quer ficar tirando e pondo.',
    ],
    detalhes: [
      ['Material', 'Aço inox 316L'],
      ['Largura', '8 mm'],
      ['Acabamento', 'Martelado à mão, peça a peça'],
      ['Peso', '9 g'],
      ['Antialérgico', 'Sim — sem níquel livre'],
      ['Garantia', '1 ano contra escurecimento'],
    ],
    variante: { rotulo: 'Aro', opcoes: ['18', '20', '22', '24'], padrao: 1 },
  },
  {
    slug: 'pulseira-cubana-6', sku: 'VLT-PU-604', nome: 'Pulseira Cubana 6 mm',
    categoria: 'pulseiras', preco: 149.90, precoDe: null,
    tags: ['mais-vendido'], nota: 4.8, avaliacoes: 131, imagens: 3,
    resumo: 'O mesmo elo da corrente, na medida do pulso.',
    material: 'Aço inox 316L com banho de ródio',
    descricao: [
      'Elo cubano de 6 mm, feito para fechar o conjunto com a corrente de 8 mm ' +
      'sem competir com ela. Cai com peso e não fica frouxa girando no pulso.',
      'Vem com dois elos extras soltos na caixa: dá para tirar ou pôr sem ir a ' +
      'uma joalheria, só com um alicate de bico.',
    ],
    detalhes: [
      ['Material', 'Aço inox 316L com banho de ródio'],
      ['Espessura', '6 mm'],
      ['Fecho', 'Gaveta com trava dupla'],
      ['Ajuste', 'Dois elos extras inclusos'],
      ['Peso', '34 g'],
      ['Garantia', '1 ano contra escurecimento'],
    ],
    variante: { rotulo: 'Comprimento', opcoes: ['19 cm', '21 cm', '23 cm'], padrao: 1 },
  },
  {
    slug: 'bracelete-fosco', sku: 'VLT-PU-118', nome: 'Bracelete Fosco',
    categoria: 'pulseiras', preco: 139.90, precoDe: null,
    tags: ['novidade'], nota: 4.7, avaliacoes: 42, imagens: 3,
    resumo: 'Aro rígido preto fosco, sem fecho. Abre e volta sozinho.',
    material: 'Aço inox 316L com PVD preto fosco',
    descricao: [
      'Aro aberto com revestimento PVD preto fosco — o mesmo processo de ' +
      'relógio esportivo, que é muito mais duro que pintura e não descasca.',
      'Sem fecho: você abre com a mão, passa pelo pulso e ele volta à posição. ' +
      'É a peça que combina com tudo justamente por não brilhar.',
    ],
    detalhes: [
      ['Material', 'Aço inox 316L'],
      ['Acabamento', 'PVD preto fosco'],
      ['Seção', '7 mm · oval'],
      ['Abertura', 'Rígido, aro aberto ajustável'],
      ['Peso', '28 g'],
      ['Garantia', '1 ano contra descascamento'],
    ],
    variante: { rotulo: 'Tamanho', opcoes: ['P/M', 'G/GG'], padrao: 0 },
  },
  {
    slug: 'argola-tubo-12', sku: 'VLT-BR-012', nome: 'Argola Tubo 12 mm',
    categoria: 'brincos', preco: 69.90, precoDe: null,
    tags: ['mais-vendido'], nota: 4.9, avaliacoes: 198, imagens: 3,
    resumo: 'Par de argolas leves com fecho de encaixe. Unissex.',
    material: 'Aço inox 316L polido',
    descricao: [
      'Par de argolas de tubo oco: dá o diâmetro sem dar o peso, então dá para ' +
      'dormir de argola sem acordar com a orelha marcada.',
      'Fecho de encaixe por pressão, sem tarraxa para perder. É o produto de ' +
      'entrada da marca e o mais comprado em dobro.',
    ],
    detalhes: [
      ['Material', 'Aço inox 316L polido'],
      ['Diâmetro', '12 mm'],
      ['Tubo', '2,5 mm · oco'],
      ['Fecho', 'Encaixe por pressão'],
      ['Peso', '2,4 g o par'],
      ['Antialérgico', 'Sim — sem níquel livre'],
    ],
    variante: { rotulo: 'Diâmetro', opcoes: ['10 mm', '12 mm', '16 mm'], padrao: 1 },
  },
  {
    slug: 'brinco-cruz', sku: 'VLT-BR-330', nome: 'Brinco Cruz',
    categoria: 'brincos', preco: 59.90, precoDe: 79.90,
    tags: ['novidade', 'oferta'], nota: 4.6, avaliacoes: 57, imagens: 3,
    resumo: 'Par de cruzes pendentes em argola. Balança com o movimento.',
    material: 'Aço inox 316L polido',
    descricao: [
      'Argola pequena com cruz pendurada em elo articulado — a cruz se move ' +
      'sozinha quando você vira a cabeça, que é o que faz ela aparecer em ' +
      'vídeo.',
      'Vem como par, mas muita gente usa só um. A cruz é a mesma da corrente ' +
      'gótica, em escala menor, então os dois fecham conjunto.',
    ],
    detalhes: [
      ['Material', 'Aço inox 316L polido'],
      ['Cruz', '22 mm · articulada'],
      ['Argola', '10 mm'],
      ['Fecho', 'Encaixe por pressão'],
      ['Peso', '3,1 g o par'],
      ['Antialérgico', 'Sim — sem níquel livre'],
    ],
    variante: { rotulo: 'Unidade', opcoes: ['Par', 'Unidade'], padrao: 0 },
  },
  {
    slug: 'kit-rua', sku: 'VLT-KT-001', nome: 'Kit Rua',
    categoria: 'kits', preco: 269.90, precoDe: 339.80,
    tags: ['mais-vendido', 'oferta'], nota: 4.9, avaliacoes: 96, imagens: 3,
    resumo: 'Corrente cubana 8 mm + pulseira cubana 6 mm. O combo mais pedido.',
    material: 'Aço inox 316L com banho de ródio',
    descricao: [
      'A corrente de 8 mm com a pulseira de 6 mm, no mesmo elo e no mesmo ' +
      'acabamento. É a combinação que a maioria monta sozinha depois — aqui ' +
      'sai R$ 69,90 mais barato que comprar as duas separadas.',
      'As duas peças vêm em caixas individuais, então dá para dividir e dar ' +
      'uma de presente.',
    ],
    detalhes: [
      ['Contém', 'Corrente 8 mm + pulseira 6 mm'],
      ['Material', 'Aço inox 316L com banho de ródio'],
      ['Economia', 'R$ 69,90 em relação às peças avulsas'],
      ['Fecho', 'Gaveta com trava dupla nas duas'],
      ['Embalagem', 'Duas caixas individuais'],
      ['Garantia', '1 ano contra escurecimento'],
    ],
    variante: { rotulo: 'Corrente', opcoes: ['50 cm', '60 cm', '70 cm'], padrao: 1 },
  },
  {
    slug: 'kit-detalhe', sku: 'VLT-KT-002', nome: 'Kit Detalhe',
    categoria: 'kits', preco: 129.90, precoDe: 169.80,
    tags: ['novidade', 'oferta'], nota: 4.7, avaliacoes: 38, imagens: 3,
    resumo: 'Anel signet + brinco cruz. Para quem já tem corrente.',
    material: 'Aço inox 316L polido',
    descricao: [
      'Para quem já tem a corrente e quer fechar o resto: o anel signet do raio ' +
      'com o par de brincos de cruz, no mesmo polimento.',
      'Sai R$ 39,90 mais barato que as duas peças avulsas, e é o kit que mais ' +
      'sai como presente.',
    ],
    detalhes: [
      ['Contém', 'Anel signet + par de brincos cruz'],
      ['Material', 'Aço inox 316L polido'],
      ['Economia', 'R$ 39,90 em relação às peças avulsas'],
      ['Antialérgico', 'Sim — sem níquel livre'],
      ['Embalagem', 'Duas caixas individuais'],
      ['Garantia', '1 ano contra escurecimento'],
    ],
    variante: { rotulo: 'Aro do anel', opcoes: ['18', '20', '22', '24'], padrao: 1 },
  },
];

export const imagensDe = (p) =>
  Array.from({ length: p.imagens }, (_, i) =>
    `assets/${p.slug}${i === 0 ? '' : `-${i + 1}`}.svg`);

export const achar = (slug) => PRODUTOS.find((p) => p.slug === slug);
export const comTag = (tag) => PRODUTOS.filter((p) => p.tags.includes(tag));
export const daCategoria = (id) => PRODUTOS.filter((p) => p.categoria === id);
export const nomeCategoria = (id) =>
  (CATEGORIAS.find((c) => c.id === id) || {}).nome || '';

/** Desconto em pontos percentuais inteiros, ou 0. */
export const desconto = (p) =>
  p.precoDe ? Math.round((1 - p.preco / p.precoDe) * 100) : 0;

/** Relacionados: mesma categoria primeiro, depois o resto por preço. */
export function relacionados(p, quantos = 4) {
  return PRODUTOS.filter((o) => o.slug !== p.slug)
    .sort((a, b) =>
      (b.categoria === p.categoria) - (a.categoria === p.categoria) ||
      Math.abs(a.preco - p.preco) - Math.abs(b.preco - p.preco))
    .slice(0, quantos);
}
