/**
 * Página "Projetos para Joias & Acessórios".
 *
 * ┌───────────────────────────────────────────────────────────┐
 * │  PREENCHA ESTE BLOCO ANTES DE PUBLICAR                     │
 * │  É o único lugar com dados seus. Todo o resto da página    │
 * │  se monta a partir daqui.                                  │
 * └───────────────────────────────────────────────────────────┘
 */
export const EU = {
  nome: 'Rafael',                      // ← seu nome como quer ser chamado
  papel: 'Desenvolvedor de sites',
  cidade: 'São Paulo',                 // ← sua cidade (ou "atendo todo o Brasil")

  whatsapp: '5511999999999',           // ← SEU NÚMERO, só dígitos, com 55
  whatsappVisivel: '(11) 99999-9999',  // ← como aparece na tela
  email: 'seu@email.com',              // ← seu e-mail
  instagram: '@seu.instagram',         // ← seu perfil
  instagramUrl: '#',                   // ← link do perfil

  dominio: 'https://seusite.com.br',   // ← domínio onde esta página vai morar
};

/** Mensagem já escrita, para o cliente só apertar enviar. */
export const linkWhats = (texto) =>
  `https://wa.me/${EU.whatsapp}?text=${encodeURIComponent(texto)}`;

export const CONTATO = {
  geral: `Olá, ${EU.nome}! Vi sua página de projetos para joias e acessórios ` +
         `e quero um site para a minha marca.`,
  orcamento: `Olá, ${EU.nome}! Quero um orçamento de site para a minha marca ` +
             `de joias/acessórios.`,
  duvida: `Olá, ${EU.nome}! Tenho uma dúvida antes de pedir orçamento.`,
  projeto: (p) => `Olá, ${EU.nome}! Vi o projeto ${p} e gostei do estilo. ` +
                  `Quero algo parecido para a minha marca.`,
};

export const HERO = {
  sobretitulo: 'Sites sob medida para marcas de joias e acessórios',
  titulo: 'Sites que transformam sua coleção em uma vitrine que vende.',
  texto: `Sou ${EU.nome}, ${EU.papel.toLowerCase()} especializado em lojas de prata, ` +
         `joalherias, semijoias, acessórios e marcas de moda. Cada projeto é ` +
         `desenhado do zero para a sua coleção — não é tema pronto com o seu ` +
         `logo por cima.`,
  cta: 'Quero meu site',
  ctaSecundario: 'Ver os projetos',
  /* Provas verificáveis: são medidas dos três projetos desta página,
     não números inventados de clientes. */
  provas: [
    'Projetos completos, não telas soltas',
    'Feitos para o celular primeiro',
    'Atendimento por WhatsApp integrado',
  ],
};

export const PARA_QUEM = {
  n: '01', etiqueta: 'Para quem eu faço',
  titulo: 'Se a sua marca é uma destas, esta página é para você',
  texto: 'São cinco tipos de negócio com o mesmo problema: peça bonita que ' +
         'ninguém vê direito na tela.',
  segmentos: [
    ['Lojas de prata', 'Prata 925, catálogo grande, preço acessível e giro rápido.'],
    ['Joalherias', 'Peça de alto valor, decisão demorada, atendimento pessoal.'],
    ['Semijoias', 'Revenda, coleção que muda toda estação, foto que precisa vender.'],
    ['Acessórios', 'Público jovem, Instagram e TikTok, compra por impulso.'],
    ['Marcas de moda', 'Coleção com identidade própria e uma história para contar.'],
  ],
};

export const PORQUE = {
  n: '03', etiqueta: 'Por que investir nisso',
  titulo: 'Por que sua marca precisa de uma loja online profissional?',
  texto: 'Não é sobre "estar na internet". É sobre parar de perder venda em ' +
         'seis pontos específicos.',
  itens: [
    {
      n: '01', titulo: 'Apresentação dos produtos',
      dor: 'Foto pequena, cortada e comprimida faz uma peça de R$ 400 parecer de R$ 40.',
      solucao: 'Imagem grande, recorte consistente, fundo que valoriza o metal e ' +
               'descrição que responde o que o cliente ia perguntar: material, ' +
               'medida, peso, acabamento.',
    },
    {
      n: '02', titulo: 'Catálogo organizado',
      dor: 'No Instagram, a peça de ontem já sumiu. O cliente rola trinta posts ' +
           'e desiste.',
      solucao: 'Categorias, busca e filtros. Em dois toques o cliente chega ' +
               'exatamente no anel que ele quer, com o preço na tela.',
    },
    {
      n: '03', titulo: 'Atendimento pelo WhatsApp',
      dor: 'O cliente manda "oi, quanto é?" e você responde a mesma coisa vinte ' +
           'vezes por dia.',
      solucao: 'Cada botão abre a conversa com a peça, a referência e o preço já ' +
               'escritos. Você começa do "vou querer", não do zero.',
    },
    {
      n: '04', titulo: 'Experiência no celular',
      dor: 'Nove em cada dez clientes chegam pelo telefone. Site que só funciona ' +
           'no computador perde esses nove.',
      solucao: 'Desenho pensado primeiro para a tela pequena: botão no alcance ' +
               'do dedo, texto legível sem pinçar, carregamento rápido no 4G.',
    },
    {
      n: '05', titulo: 'Credibilidade',
      dor: 'Peça cara sem site é desconfiança. O cliente pensa duas vezes antes ' +
           'de mandar Pix para um perfil.',
      solucao: 'Site próprio, com domínio seu, política de troca, garantia e ' +
               'procedência escritas. É o que separa marca de revenda improvisada.',
    },
    {
      n: '06', titulo: 'Facilidade para encontrar e conhecer',
      dor: 'Quem procura "anel de prata" no Google não acha você. Acha o concorrente.',
      solucao: 'Cada peça com página própria, endereço próprio e texto que o ' +
               'buscador entende. É assim que a coleção aparece na busca.',
    },
  ],
};

export const ENTREGA = {
  n: '04', etiqueta: 'O que você recebe',
  titulo: 'O que está incluído em todo projeto',
  itens: [
    ['Site completo', 'Todas as páginas prontas: início, catálogo, página de cada peça e contato.'],
    ['Código seu', 'Você recebe os arquivos. Não fica preso a mim nem a plataforma nenhuma.'],
    ['Sem mensalidade de sistema', 'O site é estático: hospedagem gratuita resolve, e não há licença para pagar.'],
    ['Catálogo fácil de editar', 'Um arquivo só com os produtos. Trocar preço ou acrescentar peça não exige programador.'],
    ['WhatsApp integrado', 'Em cada peça, com a mensagem pronta e a referência dentro.'],
    ['Preparado para o Google', 'Título, descrição e dados estruturados em cada página.'],
  ],
};

export const PROCESSO = {
  n: '05', etiqueta: 'Como funciona',
  titulo: 'Do primeiro "oi" ao site no ar',
  etapas: [
    ['01', 'Conversa', 'Você me conta o que vende, para quem e o que já tentou. ' +
      'Sem formulário e sem compromisso — de vinte a trinta minutos no WhatsApp.'],
    ['02', 'Proposta', 'Mando escopo, prazo e valor por escrito. Se não fizer ' +
      'sentido, a gente para aqui e ninguém perdeu nada.'],
    ['03', 'Criação', 'Faço o site com as suas peças e a sua identidade. Você ' +
      'acompanha por um link e pede ajuste enquanto está sendo feito.'],
    ['04', 'No ar', 'Publico, configuro o domínio e te ensino a mexer no catálogo. ' +
      'Depois disso o site é seu, inteiro.'],
  ],
};

export const DUVIDAS = {
  n: '06', etiqueta: 'Antes de me chamar',
  titulo: 'O que sempre me perguntam',
  itens: [
    ['Eu já vendo bem pelo Instagram. Preciso de site?',
     'O Instagram é ótimo para ser descoberto e péssimo para ser consultado. ' +
     'Quem já te conhece e quer comprar de novo não vai rolar o feed até achar ' +
     'a peça de três meses atrás. O site é onde a coleção fica parada, ' +
     'organizada e pesquisável — os dois trabalham juntos, não um no lugar do outro.'],
    ['Quanto custa e quanto tempo leva?',
     'Depende do tamanho do catálogo e de quantas páginas a marca precisa. ' +
     'Mando o valor fechado por escrito depois da primeira conversa, e ele não ' +
     'muda no meio do caminho. Prazo típico: de duas a quatro semanas.'],
    ['Não tenho foto boa das peças. Isso trava o projeto?',
     'Não. A gente começa pelo que existe e eu te oriento no que dá para melhorar ' +
     'com o celular mesmo — fundo, luz e enquadramento resolvem quase tudo. ' +
     'Trocar as fotos depois é simples: os arquivos ficam numa pasta só.'],
    ['Vou depender de você para mexer no site?',
     'Não. O catálogo fica num arquivo único, comentado em português, e eu te ' +
     'mostro como trocar preço, descrição e foto. Se preferir que eu cuide, ' +
     'combinamos à parte — mas é escolha sua, não amarra.'],
    ['O site aceita pagamento?',
     'Os três projetos desta página fecham pelo WhatsApp, que é o que funciona ' +
     'para a maioria das marcas pequenas: menos taxa e mais conversa. Se a sua ' +
     'operação pedir checkout com cartão e Pix automático, isso entra no escopo ' +
     'e a gente conversa sobre o custo.'],
    ['E se eu não gostar do resultado?',
     'Você aprova o desenho antes de eu escrever o site, e acompanha por um link ' +
     'enquanto ele é feito. Ajuste faz parte do processo, não é extra.'],
  ],
};

export const FINAL = {
  etiqueta: 'Próximo passo',
  titulo: 'Quer uma vitrine online para sua marca?',
  texto: 'Me manda uma mensagem contando o que você vende. Respondo com uma ' +
         'ideia do que dá para fazer, sem compromisso e sem cobrar pela conversa.',
  cta: 'Quero meu site',
  nota: 'Resposta no mesmo dia útil.',
};

export const AVISO_DEMO =
  'PRATA NOBRE, AUREA e VOLT são marcas fictícias, criadas por mim para ' +
  'demonstrar o trabalho. Produtos, preços e avaliações são inventados, e os ' +
  'três projetos deixam isso escrito nas próprias páginas.';
