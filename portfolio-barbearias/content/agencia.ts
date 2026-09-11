/* ═══════════════════════════════════════════════════════════════
   DADOS DA AGÊNCIA
   Este é o arquivo que você mais vai editar. Nome, telefone,
   preços e textos de venda ficam todos aqui.
   ═══════════════════════════════════════════════════════════════ */

export const agencia = {
  nome: "Cadeira Cheia",
  descritor: "Sites para barbearia",

  /* ⚠️ TROQUE PELO SEU NÚMERO: 55 + DDD + número, só dígitos. */
  whatsapp: "5514999999999",
  whatsappVisivel: "(14) 99999-9999",

  /* Promessa de resposta — aparece embaixo dos botões. */
  tempoResposta: "Respondo em até 1 hora, de segunda a sábado",

  email: "contato@cadeiacheia.com.br",
  cidade: "Bauru e região · atendo o Brasil inteiro",
} as const;

/** Monta o link do WhatsApp com a mensagem já escrita. */
export function linkWhats(mensagem: string) {
  return `https://wa.me/${agencia.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}

/* ─── Hero ─────────────────────────────────────────────────── */
export const hero = {
  etiqueta: "Especialistas em um único negócio: barbearia",
  titulo: "Sites de barbearia que enchem cadeira",
  subtitulo:
    "Seu cliente procura barbearia no Google às 21h de uma quinta. Quem aparece primeiro, com preço na tela e botão de agendar, leva o corte. Eu construo esse site.",
  ctaPrimario: "Ver como ficaria a minha",
  ctaSecundario: "Ver os projetos",
  mensagemWhats:
    "Olá! Vi o portfólio e quero um site para minha barbearia.\n\nNome da barbearia: \nCidade: ",
  provas: [
    { valor: "3 dias", rotulo: "do briefing ao site no ar" },
    { valor: "100%", rotulo: "feito para celular primeiro" },
    { valor: "1 nicho", rotulo: "só barbearia, mais nada" },
  ],
};

/* ─── Seção "o espelho": o problema do dono ────────────────── */
export const problema = {
  etiqueta: "O problema",
  titulo: "Você não perde cliente na cadeira. Perde antes dele chegar.",
  texto:
    "Quem procura barbearia decide em menos de um minuto, no celular, comparando três resultados do Google. Se o seu não tem preço, endereço fácil e um botão que funciona, ele vai no de baixo.",
  itens: [
    {
      titulo: "Só Instagram não resolve",
      texto:
        "O Instagram mostra o seu trabalho para quem já te segue. O site aparece para quem ainda não te conhece e está procurando agora, a três quarteirões de você.",
    },
    {
      titulo: "Preço escondido faz o cliente desistir",
      texto:
        "A primeira dúvida de todo mundo é quanto custa. Sem resposta na tela, ele não manda mensagem para perguntar — ele fecha e abre o concorrente.",
    },
    {
      titulo: "Google Maps sozinho é pouco",
      texto:
        "O perfil do Google é a vitrine. O site é a loja. Um alimenta o outro: quem tem site bem feito sobe no mapa e converte mais quem clica.",
    },
    {
      titulo: "Horário perdido é dinheiro perdido",
      texto:
        "Cada janela vazia na agenda é um corte que não volta. Um botão de agendar bem colocado preenche buraco de terça à tarde.",
    },
  ],
};

/* ─── O que todo site inclui ───────────────────────────────── */
export const maquina = {
  etiqueta: "A máquina",
  titulo: "As cinco peças que todo site meu tem",
  texto:
    "Muda o visual, muda o público, muda o preço. Essas cinco peças não mudam — são elas que transformam visita em cliente sentado.",
  pecas: [
    {
      numero: "01",
      titulo: "Uma ação principal sempre à mão",
      texto:
        "Agendar, ligar ou chamar no WhatsApp — uma só, fixa na tela, alcançável com o polegar. Sem menu de opções para o cliente pensar.",
    },
    {
      numero: "02",
      titulo: "Serviços com preço na cara",
      texto:
        "Tabela clara, sem 'consulte valores'. Preço visível filtra curioso e traz quem já decidiu pagar.",
    },
    {
      numero: "03",
      titulo: "Prova social ligada ao Google",
      texto:
        "Sua nota e suas avaliações reais, com link para o perfil. Nunca depoimento inventado — isso queima na primeira checada.",
    },
    {
      numero: "04",
      titulo: "Seus barbeiros com nome e rosto",
      texto:
        "Cliente não escolhe estabelecimento, escolhe quem passa a máquina. Quem aparece na tela vira preferência.",
    },
    {
      numero: "05",
      titulo: "Como chegar sem pensar",
      texto:
        "Mapa, ponto de referência, estacionamento e horário. Decisão de bairro é decisão de deslocamento.",
    },
  ],
};

/* ─── Processo ─────────────────────────────────────────────── */
export const processo = {
  etiqueta: "Como funciona",
  titulo: "Do primeiro alô ao site no ar",
  passos: [
    {
      numero: "01",
      titulo: "Conversa de 15 minutos",
      prazo: "Dia 1",
      texto:
        "No WhatsApp mesmo. Quero saber seu público, seus preços e o que te diferencia da barbearia da esquina.",
    },
    {
      numero: "02",
      titulo: "Eu monto e te mostro",
      prazo: "Dia 2",
      texto:
        "Você recebe o link do seu site pronto para ver no celular. Não é rascunho nem desenho: é o site funcionando.",
    },
    {
      numero: "03",
      titulo: "Ajustes finos",
      prazo: "Dia 3",
      texto:
        "Você aponta o que quer diferente, eu ajusto na hora. Cor, texto, foto, preço — até ficar do seu jeito.",
    },
    {
      numero: "04",
      titulo: "No ar, no seu domínio",
      prazo: "Dia 3",
      texto:
        "Publico, ligo no seu perfil do Google e te explico como funciona. A partir daí é comigo manter no ar.",
    },
  ],
};

/* ─── Planos ───────────────────────────────────────────────── */
export const planos = {
  etiqueta: "Investimento",
  titulo: "Três formas de começar",
  texto:
    "Setup à vista e mensalidade que cobre hospedagem, domínio, manutenção e suporte. Sem fidelidade e sem letra miúda.",
  lista: [
    {
      nome: "Essencial",
      resumo: "Para quem precisa existir no Google e receber pedido no WhatsApp.",
      setup: "R$ 897",
      mensal: "R$ 97",
      equivalencia: "menos de 2 cortes por mês",
      destaque: false,
      inclui: [
        "Site de página única, sob medida",
        "Botão de WhatsApp em todas as seções",
        "Tabela de serviços e preços",
        "Mapa e horário de funcionamento",
        "Domínio e hospedagem inclusos",
        "Ficha do Google Meu Negócio ligada ao site",
      ],
      cta: "Quero o Essencial",
    },
    {
      nome: "Profissional",
      resumo: "Para barbearia com equipe e agenda cheia que quer parar de anotar horário no caderno.",
      setup: "R$ 1.897",
      mensal: "R$ 147",
      equivalencia: "menos de 3 cortes por mês",
      destaque: true,
      selo: "Mais escolhido",
      inclui: [
        "Tudo do Essencial",
        "Agendamento online integrado",
        "Página de equipe com perfil de cada barbeiro",
        "Galeria de trabalhos",
        "Google Meu Negócio otimizado",
        "2 alterações de conteúdo por mês",
        "Relatório simples de visitas",
      ],
      cta: "Quero o Profissional",
    },
    {
      nome: "Assinatura",
      resumo: "Para barbearia premium que vende plano mensal e precisa parecer o que cobra.",
      setup: "R$ 3.497",
      mensal: "R$ 247",
      equivalencia: "menos de 2 assinaturas de cliente",
      destaque: false,
      inclui: [
        "Tudo do Profissional",
        "Planos de assinatura e vale-presente no site",
        "Identidade visual completa",
        "Direção de fotografia (roteiro do que fotografar)",
        "Campanha de lançamento para o Instagram",
        "Alterações ilimitadas",
      ],
      cta: "Quero a Assinatura",
    },
  ],
};

/* ─── Garantia ─────────────────────────────────────────────── */
export const garantia = {
  titulo: "Você vê antes de pagar",
  texto:
    "Eu monto o site da sua barbearia e te mando o link. Se você não gostar, não paga nada e a gente se despede sem constrangimento. O risco é todo meu.",
  cta: "Quero ver o meu de graça",
  mensagemWhats:
    "Olá! Quero ver um exemplo do site da minha barbearia antes de fechar.\n\nNome da barbearia: \nCidade: ",
};

/* ─── Objeções ─────────────────────────────────────────────── */
export const objecoes = {
  etiqueta: "Perguntas diretas",
  titulo: "O que todo dono pergunta antes de fechar",
  lista: [
    {
      pergunta: "Eu já tenho Instagram. Preciso de site?",
      resposta:
        "Instagram e site fazem coisas diferentes. O Instagram conversa com quem já te segue. O site aparece para quem está procurando barbearia agora e ainda não te conhece — e é ele que faz seu perfil subir no Google Maps. Um não substitui o outro; juntos eles se puxam.",
    },
    {
      pergunta: "Não entendo nada de site. Vou conseguir mexer?",
      resposta:
        "Você não precisa mexer. Mudou o preço do corte, entrou barbeiro novo, mudou o horário? Me manda no WhatsApp e eu altero no mesmo dia. Está incluso na mensalidade.",
    },
    {
      pergunta: "E se eu quiser parar depois de alguns meses?",
      resposta:
        "Sem fidelidade. Você avisa e a gente encerra no mês seguinte. O domínio é seu e vai com você.",
    },
    {
      pergunta: "Quanto tempo demora para ficar pronto?",
      resposta:
        "Três dias úteis do briefing ao site no ar, quando você me manda as fotos e os preços rápido. O que costuma atrasar é foto, não código.",
    },
    {
      pergunta: "Meu site vai aparecer no Google?",
      resposta:
        "Vai ser construído para isso: endereço e serviços marcados do jeito que o Google entende, carregamento rápido e ligação com a sua ficha do Google Meu Negócio. Não prometo primeiro lugar — quem promete está mentindo. Prometo o site tecnicamente certo para competir.",
    },
    {
      pergunta: "Já tenho um site. Vale trocar?",
      resposta:
        "Me manda o link. Se ele estiver rápido, bonito no celular e convertendo, eu digo para você não gastar. Se estiver lento ou de 2015, eu mostro exatamente o que está te custando cliente.",
    },
  ],
};

/* ─── Chamada final ────────────────────────────────────────── */
export const fechamento = {
  titulo: "Manda o nome da sua barbearia",
  texto:
    "Em até 24 horas eu te devolvo um exemplo do seu site, com as suas cores, os seus serviços e os seus preços. De graça, sem compromisso e sem conversa de vendedor.",
  cta: "Chamar no WhatsApp agora",
  mensagemWhats:
    "Olá! Quero o exemplo gratuito do site da minha barbearia.\n\nNome da barbearia: \nCidade: \nInstagram: ",
};
