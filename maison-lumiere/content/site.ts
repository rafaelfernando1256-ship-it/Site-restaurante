/**
 * ═══════════════════════════════════════════════════════════════════
 *  TODO O CONTEÚDO DO SITE ESTÁ NESTE ARQUIVO.
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Textos, telefones, procedimentos, perguntas, fotos — tudo aqui.
 *  Para mudar qualquer coisa do site você mexe NESTE arquivo e em mais
 *  nenhum. Nenhum componente tem texto escrito dentro dele.
 *
 *  ─────────────────────────────────────────────────────────────────
 *  AS FOTOS
 *  ─────────────────────────────────────────────────────────────────
 *  Todo campo `foto` aceita duas coisas:
 *
 *    foto: ''                             → placeholder elegante da casa
 *    foto: 'https://images.unsplash.com/photo-XXXX?w=1600&q=80'
 *
 *  O domínio do Unsplash já está liberado no next.config.ts, então é
 *  só colar a URL e salvar. Enquanto estiver vazio, entra um
 *  placeholder em degradê na paleta do site — nada quebra, nada fica
 *  com cara de erro.
 *
 *  Como pegar a URL: abra a foto no unsplash.com, clique com o botão
 *  direito na imagem → "Copiar endereço da imagem".
 *
 *  ─────────────────────────────────────────────────────────────────
 *  ISTO É UM PROJETO CONCEITUAL
 *  ─────────────────────────────────────────────────────────────────
 *  A Maison Lumière não existe. Nome, endereço, telefone, números,
 *  depoimentos e a profissional são FICTÍCIOS, criados para portfólio.
 *  O rodapé diz isso em letra legível, e os depoimentos são
 *  identificados um a um.
 *
 *  Se você for usar este site para um cliente de verdade: troque tudo
 *  aqui, inclusive os dados estruturados (`seo`), e tire as marcações
 *  de "fictício" só depois de pôr informação real no lugar.
 */

export const site = {
  /* ── identidade ────────────────────────────────────────────── */
  marca: {
    nome: 'Maison Lumière',
    complemento: 'Estética Avançada',
    assinatura: 'Jardins · São Paulo',
    conceitual: 'Projeto conceitual — clínica fictícia',
  },

  /* ── contato ───────────────────────────────────────────────────
     TROQUE ESTES DADOS. O telefone é um placeholder proposital:
     nenhum número real aparece neste projeto.                     */
  contato: {
    // Só dígitos, com DDI e DDD — é o que o link do WhatsApp usa.
    whatsapp: '5511900000000',
    telefoneVisivel: '+55 11 90000-0000',
    mensagemWhatsapp:
      'Olá! Vim pelo site e gostaria de agendar uma avaliação.',
    email: 'contato@exemplo.com.br',
    endereco: {
      rua: 'Rua Exemplo, 000 — conj. 00',
      bairro: 'Jardins',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01400-000',
    },
    horarios: [
      { dias: 'Segunda a sexta', horas: '9h às 20h' },
      { dias: 'Sábado', horas: '9h às 15h' },
      { dias: 'Domingo', horas: 'fechado' },
    ],
    instagram: 'https://instagram.com/exemplo',
  },

  /* ── navegação ─────────────────────────────────────────────── */
  nav: [
    { rotulo: 'A casa', href: '#sobre' },
    { rotulo: 'Protocolos', href: '#procedimentos' },
    { rotulo: 'Resultados', href: '#resultados' },
    { rotulo: 'Quem atende', href: '#profissional' },
    { rotulo: 'Dúvidas', href: '#duvidas' },
  ],
  navBotao: { rotulo: 'Agendar avaliação', href: '#agendar' },

  /* ── 1 · abertura ──────────────────────────────────────────── */
  hero: {
    sobretitulo: 'Estética avançada · Jardins',
    titulo: ['Beleza que', 'não grita.'],
    texto:
      'Protocolos desenhados um a um, com tecnologia de ponta e a mão de quem entende que o melhor resultado é aquele que ninguém consegue apontar.',
    botaoPrimario: { rotulo: 'Agendar avaliação', href: '#agendar' },
    botaoSecundario: { rotulo: 'Ver protocolos', href: '#procedimentos' },
    rolar: 'role para descobrir',
  },

  /* ── 2 · a casa ────────────────────────────────────────────── */
  sobre: {
    sobretitulo: 'A casa',
    titulo: 'Um endereço, não uma esteira.',
    paragrafos: [
      'A Maison Lumière nasceu de uma inconformidade: a de ver estética séria sendo vendida como pacote fechado, igual para todo mundo, com meta de volume na parede.',
      'Aqui é o contrário. Uma avaliação longa antes de qualquer proposta, um protocolo escrito para a sua pele e o seu tempo, e a liberdade de dizer que não é hora — ou que não é necessário.',
      'O espaço foi pensado para isso: poucos atendimentos por dia, sala única, silêncio de verdade. Luz natural o dia inteiro e nenhuma sala de espera cheia.',
    ],
    foto: '',
    fotoAlt:
      'Ambiente da clínica, com luz natural e acabamento em tons de areia',
    selos: [
      { numero: '01', titulo: 'Avaliação primeiro', texto: 'Nenhum protocolo é proposto antes de uma consulta completa.' },
      { numero: '02', titulo: 'Agenda curta', texto: 'Poucos atendimentos por dia, para que nenhum seja apressado.' },
      { numero: '03', titulo: 'Plano escrito', texto: 'Você sai com o protocolo, os prazos e o custo no papel.' },
    ],
  },

  /* ── 3 · protocolos ────────────────────────────────────────── */
  procedimentos: {
    sobretitulo: 'Protocolos',
    titulo: 'O que fazemos aqui.',
    texto:
      'Cada protocolo abaixo é um ponto de partida. O desenho final sai da sua avaliação — incluindo a possibilidade de fazer menos do que você veio pedir.',
    itens: [
      {
        nome: 'Bioestimuladores',
        resumo: 'Firmeza que volta devagar',
        texto:
          'Estímulo de colágeno próprio para recuperar sustentação do terço médio e inferior. Resultado progressivo, pensado para parecer tempo bem vivido, não procedimento.',
        duracao: 'Sessão de 60 min',
        foto: '',
      },
      {
        nome: 'Preenchimento',
        resumo: 'Volume no lugar certo',
        texto:
          'Reposição pontual de volume com ácido hialurônico, respeitando a sua anatomia. Desenhado para equilibrar proporções, nunca para mudar o rosto.',
        duracao: 'Sessão de 45 min',
        foto: '',
      },
      {
        nome: 'Toxina botulínica',
        resumo: 'Expressão preservada',
        texto:
          'Aplicação conservadora, calculada para suavizar linhas dinâmicas sem apagar a expressão. Você continua conseguindo franzir a testa — de propósito.',
        duracao: 'Sessão de 30 min',
        foto: '',
      },
      {
        nome: 'Skinbooster',
        resumo: 'Pele hidratada por dentro',
        texto:
          'Hidratação profunda com microinjeções de ácido hialurônico não reticulado. Melhora textura, viço e aquele aspecto cansado que creme nenhum resolve.',
        duracao: 'Sessão de 45 min',
        foto: '',
      },
      {
        nome: 'Lasers e luzes',
        resumo: 'Manchas e vermelhidão',
        texto:
          'Protocolos a laser para melasma, manchas solares, vasos e textura. Parâmetros ajustados ao seu fototipo, sempre com teste antes da sessão cheia.',
        duracao: 'Sessão de 50 min',
        foto: '',
      },
      {
        nome: 'Protocolo corporal',
        resumo: 'Firmeza e contorno',
        texto:
          'Combinação de tecnologias para flacidez, gordura localizada e textura da pele. Montado em ciclos, com reavaliação a cada etapa.',
        duracao: 'Sessão de 75 min',
        foto: '',
      },
    ],
  },

  /* ── 4 · diferenciais (os números animam na rolagem) ───────────
     Números ILUSTRATIVOS de uma clínica fictícia. Se for usar para
     um cliente real, ponha os números dele — ou tire a seção.      */
  diferenciais: {
    sobretitulo: 'Por que aqui',
    titulo: 'O que a gente conta, e o que a gente não conta.',
    texto:
      'Os números abaixo são ilustrativos — fazem parte do projeto conceitual. Numa clínica de verdade, eles só entram se forem verificáveis.',
    itens: [
      { numero: 12, sufixo: '', rotulo: 'anos de casa', detalhe: 'Desde 2013 no mesmo endereço.' },
      { numero: 6, sufixo: '', rotulo: 'atendimentos por dia', detalhe: 'Teto propositalmente baixo.' },
      { numero: 40, sufixo: 'min', rotulo: 'de avaliação', detalhe: 'Antes de qualquer proposta.' },
      { numero: 100, sufixo: '%', rotulo: 'de protocolos escritos', detalhe: 'Você leva o plano por escrito.' },
    ],
  },

  /* ── 5 · antes e depois (arraste o divisor) ────────────────────
     As fotos de antes e depois são, de propósito, placeholders.
     Imagem de resultado é assunto sério: use só foto própria, com
     autorização escrita da pessoa, e sem retoque.                  */
  resultados: {
    sobretitulo: 'Resultados',
    titulo: 'Arraste e compare.',
    texto:
      'Neste projeto conceitual os pares são ilustrativos. Numa clínica real, cada imagem aqui exige autorização por escrito da paciente, mesma luz, mesmo ângulo e nenhum retoque.',
    aviso: 'Imagens ilustrativas — projeto conceitual',
    pares: [
      { titulo: 'Terço médio · bioestimulador', legenda: '3 sessões · 6 meses', antes: '', depois: '' },
      { titulo: 'Textura · laser', legenda: '4 sessões · 4 meses', antes: '', depois: '' },
      { titulo: 'Contorno · protocolo corporal', legenda: '8 sessões · 5 meses', antes: '', depois: '' },
    ],
    rotuloAntes: 'antes',
    rotuloDepois: 'depois',
  },

  /* ── 6 · quem atende ──────────────────────────────────────────
     Pessoa FICTÍCIA. O registro profissional fica como campo a
     preencher de propósito: inventar número de conselho seria
     grave, inclusive num portfólio.                               */
  profissional: {
    sobretitulo: 'Quem atende',
    nome: 'Dra. Helena Viscardi',
    cargo: 'Responsável técnica',
    registro: 'Registro profissional: a preencher',
    foto: '',
    fotoAlt: 'Retrato da responsável técnica da clínica',
    paragrafos: [
      'Formada em medicina e dedicada à estética há mais de uma década, com formação continuada em harmonização facial, lasers e protocolos combinados.',
      'Atende pessoalmente todas as avaliações. Acredita que metade do trabalho é saber o que não fazer — e que isso se aprende errando pouco e observando muito.',
    ],
    citacao:
      'O melhor elogio que recebo é quando perguntam se a paciente mudou o corte de cabelo.',
    marcacaoFicticia: 'Profissional fictícia, criada para este projeto conceitual.',
  },

  /* ── 7 · depoimentos ──────────────────────────────────────────
     FICTÍCIOS, e identificados como tal na própria seção.         */
  depoimentos: {
    sobretitulo: 'Vozes',
    titulo: 'O que dizem por aí.',
    aviso: 'Depoimentos fictícios, escritos para este projeto conceitual.',
    itens: [
      {
        texto:
          'Fui com uma lista de coisas para fazer e saí com três riscadas. Foi a primeira vez que alguém me disse que eu não precisava de alguma coisa.',
        nome: 'C. M.',
        detalhe: 'paciente desde 2021',
      },
      {
        texto:
          'O que me ganhou foi o tempo. Quarenta minutos conversando antes de encostar em mim, e o plano inteiro escrito no fim.',
        nome: 'R. A.',
        detalhe: 'paciente desde 2023',
      },
      {
        texto:
          'Minha mãe achou que eu tinha voltado a dormir bem. Era exatamente o que eu queria ouvir.',
        nome: 'L. F.',
        detalhe: 'paciente desde 2022',
      },
    ],
  },

  /* ── 8 · dúvidas ───────────────────────────────────────────── */
  faq: {
    sobretitulo: 'Dúvidas',
    titulo: 'Perguntas que chegam sempre.',
    itens: [
      {
        pergunta: 'A primeira consulta já é o procedimento?',
        resposta:
          'Não. A primeira consulta é só avaliação: histórico, exame da pele, fotos e conversa. O protocolo sai depois, por escrito, e você decide com calma. Em muitos casos a primeira indicação é esperar.',
      },
      {
        pergunta: 'Quanto custa?',
        resposta:
          'Depende inteiramente do protocolo, e por isso não publicamos tabela. O valor fecha na avaliação, com tudo discriminado, antes de qualquer agendamento. Você não é cobrado por nada que não tenha aprovado antes.',
      },
      {
        pergunta: 'Dói?',
        resposta:
          'Varia com o procedimento. A maioria usa anestésico tópico e é descrita como desconfortável, não dolorosa. O que dói mais é dito na avaliação, sem suavizar — surpresa na cadeira não é experiência boa para ninguém.',
      },
      {
        pergunta: 'Em quanto tempo eu vejo resultado?',
        resposta:
          'Toxina botulínica mostra efeito entre o terceiro e o décimo quarto dia. Preenchimento é imediato, com o resultado real depois que o inchaço baixa. Bioestimulador é o mais lento: de dois a seis meses, porque quem constrói é o seu colágeno.',
      },
      {
        pergunta: 'Posso voltar a trabalhar no mesmo dia?',
        resposta:
          'Na maioria dos protocolos, sim. Pode haver vermelhidão ou pequeno inchaço por algumas horas. Os procedimentos com recuperação mais visível são avisados com antecedência, para você escolher a semana.',
      },
      {
        pergunta: 'E se eu não gostar do resultado?',
        resposta:
          'A reavaliação faz parte do protocolo e já vem agendada. Ajustes dentro do plano estão previstos. E há casos em que o melhor caminho é reverter — isso também é conversado antes, não depois.',
      },
    ],
  },

  /* ── 9 · chamada final ─────────────────────────────────────── */
  cta: {
    sobretitulo: 'Agendar',
    titulo: 'Comece pela conversa.',
    texto:
      'A avaliação dura cerca de quarenta minutos e não compromete você a nada. Se o melhor caminho for não fazer nada agora, é isso que você vai ouvir.',
    botao: { rotulo: 'Falar no WhatsApp' },
    alternativa: 'ou ligue para',
  },

  /* ── 10 · rodapé ───────────────────────────────────────────── */
  rodape: {
    sobre:
      'Estética avançada com agenda curta, avaliação longa e protocolo escrito. Jardins, São Paulo.',
    colunas: [
      { titulo: 'Navegar', tipo: 'nav' as const },
      { titulo: 'Contato', tipo: 'contato' as const },
      { titulo: 'Horários', tipo: 'horarios' as const },
    ],
    // O rodapé já imprime `marca.conceitual` em negrito antes desta
    // frase — então ela continua de onde aquela parou, sem repetir.
    conceitual:
      'Nome, endereço, telefone, números, depoimentos, imagens e profissional foram criados para demonstração de portfólio e não correspondem a nenhuma empresa ou pessoa real.',
    assinatura: 'Site de demonstração',
  },

  /* ── SEO e dados estruturados ─────────────────────────────────
     Trocar TUDO antes de publicar para um cliente real.           */
  seo: {
    titulo: 'Maison Lumière · Estética Avançada nos Jardins, São Paulo',
    descricao:
      'Clínica de estética avançada nos Jardins, São Paulo. Avaliação de 40 minutos, protocolo escrito e agenda curta. Bioestimuladores, preenchimento, toxina botulínica, lasers e protocolos corporais. Projeto conceitual.',
    url: 'https://maison-lumiere.exemplo.com.br',
    idioma: 'pt-BR',
    palavras: [
      'estética avançada jardins',
      'harmonização facial são paulo',
      'bioestimulador de colágeno jardins',
      'clínica de estética jardins sp',
      'preenchimento labial são paulo',
    ],
    faixaPreco: '$$$',
  },
} as const;

export type Site = typeof site;

/** Link do WhatsApp montado a partir do número e da mensagem acima. */
export const linkWhatsapp = () =>
  `https://wa.me/${site.contato.whatsapp}?text=${encodeURIComponent(
    site.contato.mensagemWhatsapp,
  )}`;

/** Endereço numa linha, do jeito que se escreve num rodapé. */
export const enderecoEmLinha = () => {
  const e = site.contato.endereco;
  return `${e.rua} · ${e.bairro} · ${e.cidade}/${e.estado}`;
};
