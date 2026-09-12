/**
 * AUREA — catálogo.
 *
 * Esta é a ÚNICA fonte de verdade sobre as peças. A home, as páginas de
 * produto, os relacionados, o JSON-LD e os links de WhatsApp saem todos
 * daqui. Para mexer no catálogo, mexa só neste arquivo e rode a build.
 *
 * Tudo é fictício: marca, peças, preços e referências foram inventados
 * para um projeto de portfólio.
 */

export const CATEGORIAS = [
  { id: 'aneis',     nome: 'Anéis',     titulo: 'Anéis',     capa: 'cat-aneis.svg',
    linha: 'O gesto mais direto da joalheria: um aro, uma pedra, uma decisão.' },
  { id: 'colares',   nome: 'Colares',   titulo: 'Colares',   capa: 'cat-colares.svg',
    linha: 'Peças que trabalham a distância entre o pescoço e a luz.' },
  { id: 'brincos',   nome: 'Brincos',   titulo: 'Brincos',   capa: 'cat-brincos.svg',
    linha: 'O movimento da cabeça vira parte do desenho.' },
  { id: 'pulseiras', nome: 'Pulseiras', titulo: 'Pulseiras', capa: 'cat-pulseiras.svg',
    linha: 'O peso certo no pulso — a peça que você esquece que está usando.' },
];

export const COLECOES = [
  { id: 'primeira-luz', nome: 'Primeira Luz', capa: 'cole-luz.svg', ano: '2024',
    texto: 'Estudos sobre o primeiro reflexo do dia. Ouro amarelo polido, ' +
           'volumes cheios e pedras engastadas altas, para pegar a luz de longe.' },
  { id: 'noturno', nome: 'Noturno', capa: 'cole-noturno.svg', ano: '2025',
    texto: 'Ouro branco e diamantes graduados sobre fio quase invisível. ' +
           'Desenhada para ser vista com pouca luz, quando só a pedra aparece.' },
  { id: 'arquivo', nome: 'Arquivo', capa: 'cole-arquivo.svg', ano: 'Permanente',
    texto: 'Peças remontadas a partir de desenhos do nosso acervo. ' +
           'Produção limitada, cada uma com a data do croqui original.' },
];

/**
 * @typedef {Object} Peca
 * @property {string} slug        endereço da página (/pecas/<slug>.html)
 * @property {string} ref         referência interna, aparece na consulta
 * @property {string} nome
 * @property {number} preco       em reais
 * @property {string} categoria   id em CATEGORIAS
 * @property {string} [colecao]   id em COLECOES
 * @property {string} resumo      uma linha, para o cartão
 * @property {string[]} descricao parágrafos da página de produto
 * @property {string} material    resposta curta, aparece no cartão
 * @property {[string,string][]} especificacoes
 * @property {number} imagens     quantas vistas existem em /assets
 * @property {boolean} [destaque] entra em "Coleção em destaque"
 */
export const PECAS = [
  {
    slug: 'anel-solsticio', ref: 'AU-AN-011', nome: 'Anel Solstício', preco: 18900,
    categoria: 'aneis', colecao: 'primeira-luz', destaque: true,
    resumo: 'Solitário de peito alto em ouro amarelo, diamante de 0,80 ct.',
    material: 'Ouro amarelo 18k · diamante 0,80 ct',
    descricao: [
      'O Solstício nasceu de um pedido simples: um solitário que não desaparecesse ' +
      'na mão. A solução foi levantar o engaste. A pedra fica acima da linha do aro, ' +
      'com as garras recuadas, e recebe luz por baixo — é isso que faz o brilho ' +
      'aparecer de longe, e não o tamanho do diamante.',
      'O aro é liso, de seção levemente abaulada, sem nenhum detalhe que dispute ' +
      'atenção com a pedra. Polimento espelhado em três etapas, feito à mão.',
    ],
    especificacoes: [
      ['Metal', 'Ouro amarelo 18k (750)'],
      ['Pedra central', 'Diamante lapidação brilhante, 0,80 ct'],
      ['Classificação', 'Cor G · Pureza VS1'],
      ['Engaste', 'Seis garras em peito alto'],
      ['Aro', '2,4 mm de largura · seção abaulada'],
      ['Tamanhos', '12 ao 24, ajuste sem custo na primeira compra'],
      ['Certificação', 'Laudo gemológico independente'],
    ],
    imagens: 3,
  },
  {
    slug: 'anel-vertice', ref: 'AU-AN-024', nome: 'Anel Vértice', preco: 12400,
    categoria: 'aneis', destaque: true,
    resumo: 'Aro cravejado em ouro branco, com pedra baixa e discreta.',
    material: 'Ouro branco 18k · 28 diamantes',
    descricao: [
      'O Vértice é o oposto do solitário: em vez de uma pedra grande, 28 pequenas ' +
      'acompanhando a curva do aro até um ponto central quase rente ao dedo. ' +
      'De longe lê como uma linha de luz contínua; de perto, cada pedra aparece.',
      'É o anel que se usa sozinho e também empilhado — a altura baixa foi ' +
      'calculada justamente para conviver com outras peças sem enroscar.',
    ],
    especificacoes: [
      ['Metal', 'Ouro branco 18k (750) com banho de ródio'],
      ['Pedras', '28 diamantes, 0,46 ct no total'],
      ['Classificação', 'Cor G-H · Pureza VS'],
      ['Engaste', 'Cravação grão, garra a garra'],
      ['Aro', '2,1 mm · altura total 3,4 mm'],
      ['Tamanhos', '12 ao 24'],
      ['Certificação', 'Laudo gemológico independente'],
    ],
    imagens: 3,
  },
  {
    slug: 'anel-heranca', ref: 'AU-AN-003', nome: 'Anel Herança', preco: 28400,
    categoria: 'aneis', colecao: 'arquivo',
    resumo: 'Esmeralda em lapidação degrau, ombros cravejados em ouro amarelo.',
    material: 'Ouro amarelo 18k · esmeralda 1,60 ct',
    descricao: [
      'Remontagem de um croqui de 2011 do nosso acervo. A esmeralda em lapidação ' +
      'degrau é montada em caixa fechada, protegida nas quatro laterais — ' +
      'esmeralda é uma pedra macia, e a caixa existe para isso, não por estilo.',
      'Os ombros levam cinco diamantes de cada lado, em tamanho decrescente, ' +
      'conduzindo o olho até o centro. Produção limitada a doze unidades por ano.',
    ],
    especificacoes: [
      ['Metal', 'Ouro amarelo 18k (750)'],
      ['Pedra central', 'Esmeralda lapidação degrau, 1,60 ct'],
      ['Pedras laterais', '10 diamantes, 0,22 ct no total'],
      ['Engaste', 'Caixa fechada com ombros em grão'],
      ['Aro', '2,8 mm de largura'],
      ['Tamanhos', '12 ao 24'],
      ['Edição', 'Limitada · doze peças por ano'],
    ],
    imagens: 3,
  },
  {
    slug: 'colar-aurora', ref: 'AU-CL-007', nome: 'Colar Aurora', preco: 24700,
    categoria: 'colares', destaque: true,
    resumo: 'Safira em lapidação gota suspensa em fio de ouro amarelo.',
    material: 'Ouro amarelo 18k · safira 3,10 ct',
    descricao: [
      'Uma safira azul de 3,10 ct, lapidação gota, presa por uma alça mínima — ' +
      'o mínimo de metal possível, para que a pedra pareça flutuar sobre a pele. ' +
      'O fio tem 1,1 mm, fino o bastante para sumir e forte o bastante para o peso.',
      'A cor é o ponto: azul saturado, sem tratamento térmico declarado, com ' +
      'aquele tom que muda conforme a luz da sala.',
    ],
    especificacoes: [
      ['Metal', 'Ouro amarelo 18k (750)'],
      ['Pedra', 'Safira azul lapidação gota, 3,10 ct'],
      ['Origem', 'Declarada no laudo que acompanha a peça'],
      ['Fio', 'Veneziana 1,1 mm'],
      ['Comprimento', '42 cm com extensor de 3 cm'],
      ['Fecho', 'Mosquetão com trava dupla'],
      ['Certificação', 'Laudo gemológico independente'],
    ],
    imagens: 3,
  },
  {
    slug: 'colar-meridiano', ref: 'AU-CL-015', nome: 'Colar Meridiano', preco: 9800,
    categoria: 'colares',
    resumo: 'Diamante solitário em fio veneziano de ouro branco.',
    material: 'Ouro branco 18k · diamante 0,42 ct',
    descricao: [
      'O colar mais discreto do ateliê, e o mais vendido. Um único diamante de ' +
      '0,42 ct em quatro garras, sobre veneziana de ouro branco. Serve para usar ' +
      'todo dia, inclusive sob a camisa.',
      'É também a peça com que a maioria das pessoas começa uma coleção: ' +
      'entra em qualquer combinação e não briga com nada.',
    ],
    especificacoes: [
      ['Metal', 'Ouro branco 18k (750) com banho de ródio'],
      ['Pedra', 'Diamante lapidação brilhante, 0,42 ct'],
      ['Classificação', 'Cor G · Pureza VS2'],
      ['Engaste', 'Quatro garras'],
      ['Fio', 'Veneziana 0,9 mm'],
      ['Comprimento', '40 cm com extensor de 5 cm'],
      ['Certificação', 'Laudo gemológico independente'],
    ],
    imagens: 3,
  },
  {
    slug: 'colar-constelacao', ref: 'AU-CL-001', nome: 'Colar Constelação', preco: 41200,
    categoria: 'colares', colecao: 'noturno', destaque: true,
    resumo: 'Cinco diamantes graduados sobre fio quase invisível de ouro branco.',
    material: 'Ouro branco 18k · 5 diamantes, 2,35 ct',
    descricao: [
      'A peça que abre a coleção Noturno. Cinco diamantes de tamanhos diferentes ' +
      'distribuídos ao longo do fio, do menor ao maior e de volta ao menor, com ' +
      'espaçamento irregular de propósito — constelação não é simétrica.',
      'O fio tem 0,7 mm e desaparece com pouca luz. O efeito pretendido é que ' +
      'as pedras pareçam soltas sobre a pele.',
    ],
    especificacoes: [
      ['Metal', 'Ouro branco 18k (750) com banho de ródio'],
      ['Pedras', '5 diamantes graduados, 2,35 ct no total'],
      ['Classificação', 'Cor F-G · Pureza VVS-VS'],
      ['Engaste', 'Quatro garras por pedra'],
      ['Fio', 'Cabo 0,7 mm'],
      ['Comprimento', '44 cm com extensor de 4 cm'],
      ['Certificação', 'Laudo individual por pedra central'],
    ],
    imagens: 3,
  },
  {
    slug: 'brinco-eclipse', ref: 'AU-BR-009', nome: 'Brincos Eclipse', preco: 15600,
    categoria: 'brincos', colecao: 'primeira-luz',
    resumo: 'Par de argolas em ouro amarelo, cravejadas na face externa.',
    material: 'Ouro amarelo 18k · 52 diamantes',
    descricao: [
      'Argolas de tubo oco — leves o bastante para usar o dia inteiro, apesar do ' +
      'diâmetro. A cravação ocupa só a metade externa, que é a que aparece de frente; ' +
      'o resto fica liso, e isso derruba o preço sem tirar nada do efeito.',
      'Fecho de encaixe por pressão, sem rosca e sem tarraxa para perder.',
    ],
    especificacoes: [
      ['Metal', 'Ouro amarelo 18k (750)'],
      ['Pedras', '52 diamantes, 0,74 ct no total'],
      ['Classificação', 'Cor G-H · Pureza VS'],
      ['Diâmetro', '26 mm'],
      ['Tubo', '3,2 mm · oco'],
      ['Fecho', 'Encaixe por pressão'],
      ['Peso', '4,1 g o par'],
    ],
    imagens: 3,
  },
  {
    slug: 'brinco-cascata', ref: 'AU-BR-002', nome: 'Brincos Cascata', preco: 21300,
    categoria: 'brincos', colecao: 'noturno', destaque: true,
    resumo: 'Três diamantes em degradê terminando em gota, ouro branco.',
    material: 'Ouro branco 18k · diamantes 1,88 ct',
    descricao: [
      'Dois brilhantes crescentes e uma gota na ponta, articulados um a um. ' +
      'A articulação é o ponto da peça: cada pedra se move sozinha, e o brinco ' +
      'acompanha o movimento da cabeça em vez de ficar duro.',
      'Comprimento total de 46 mm — presença de peça de noite, com peso de ' +
      'peça de dia.',
    ],
    especificacoes: [
      ['Metal', 'Ouro branco 18k (750) com banho de ródio'],
      ['Pedras', '2 brilhantes e 1 gota por brinco, 1,88 ct no total'],
      ['Classificação', 'Cor F-G · Pureza VS'],
      ['Comprimento', '46 mm'],
      ['Articulação', 'Três pontos independentes'],
      ['Fecho', 'Pino com borboleta de segurança'],
      ['Peso', '5,6 g o par'],
    ],
    imagens: 3,
  },
  {
    slug: 'pulseira-riviera', ref: 'AU-PU-004', nome: 'Pulseira Riviera', preco: 32500,
    categoria: 'pulseiras', destaque: true,
    resumo: 'Linha contínua de 26 diamantes calibrados em ouro branco.',
    material: 'Ouro branco 18k · 26 diamantes, 3,90 ct',
    descricao: [
      'Riviera é o nome que se dá à pulseira de pedras iguais em linha contínua. ' +
      'A dificuldade dela não é o diamante: é calibrar 26 pedras para que não ' +
      'exista nenhuma diferença visível de tamanho ou de cor entre vizinhas.',
      'Cada engaste é articulado, o que faz a pulseira cair no pulso como tecido ' +
      'em vez de ficar rígida. Fecho embutido com trava de segurança dupla.',
    ],
    especificacoes: [
      ['Metal', 'Ouro branco 18k (750) com banho de ródio'],
      ['Pedras', '26 diamantes calibrados, 3,90 ct no total'],
      ['Classificação', 'Cor F-G · Pureza VS'],
      ['Engaste', 'Quatro garras, articulado entre si'],
      ['Comprimento', '17 cm · elos removíveis para ajuste'],
      ['Fecho', 'Embutido com trava dupla'],
      ['Certificação', 'Laudo gemológico independente'],
    ],
    imagens: 3,
  },
  {
    slug: 'bracelete-orbita', ref: 'AU-PU-018', nome: 'Bracelete Órbita', preco: 14900,
    categoria: 'pulseiras', colecao: 'arquivo',
    resumo: 'Aro rígido liso em ouro amarelo, sem fecho e sem ornamento.',
    material: 'Ouro amarelo 18k maciço',
    descricao: [
      'Sem pedra, sem fecho, sem gravação. O Órbita é um exercício de volume: ' +
      'um aro aberto de seção oval que abre o suficiente para passar pelo pulso ' +
      'e volta sozinho à posição.',
      'É a peça que mais usamos para explicar o que é acabamento. Não há onde ' +
      'esconder um polimento mal feito numa superfície lisa deste tamanho.',
    ],
    especificacoes: [
      ['Metal', 'Ouro amarelo 18k (750) maciço'],
      ['Seção', 'Oval, 6,4 mm por 4,8 mm'],
      ['Abertura', 'Rígido, aro aberto ajustável'],
      ['Diâmetro interno', '58 mm · também em 62 mm'],
      ['Acabamento', 'Polimento espelhado ou acetinado'],
      ['Peso', '22 g'],
      ['Edição', 'Coleção Arquivo · croqui de 2013'],
    ],
    imagens: 3,
  },
];

/** Caminhos das imagens de uma peça: a primeira é a capa. */
export function imagensDe(peca) {
  return Array.from({ length: peca.imagens }, (_, i) =>
    `assets/${peca.slug}${i === 0 ? '' : `-${i + 1}`}.svg`);
}

export const acharPeca = (slug) => PECAS.find((p) => p.slug === slug);
export const pecasDaCategoria = (id) => PECAS.filter((p) => p.categoria === id);
export const pecasDaColecao = (id) => PECAS.filter((p) => p.colecao === id);
export const destaques = () => PECAS.filter((p) => p.destaque);

/** Relacionados: mesma coleção primeiro, depois mesma categoria. */
export function relacionadas(peca, quantas = 3) {
  const pontos = (o) =>
    (o.colecao && o.colecao === peca.colecao ? 2 : 0) +
    (o.categoria === peca.categoria ? 1 : 0);
  return PECAS.filter((o) => o.slug !== peca.slug)
    .sort((a, b) => pontos(b) - pontos(a) || a.preco - b.preco)
    .slice(0, quantas);
}
