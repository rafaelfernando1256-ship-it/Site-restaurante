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

  email: "contato@cadeiracheia.com.br",
  cidade: "Bauru e região · atendo o Brasil inteiro",
} as const;

/** Monta o link do WhatsApp com a mensagem já escrita. */
export function linkWhats(mensagem: string) {
  return `https://wa.me/${agencia.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}

/* ─── Hero ─────────────────────────────────────────────────── */
export const hero = {
  etiqueta: "Trabalho com um único tipo de negócio: barbearia",
  titulo: "Sites de barbearia que enchem cadeira",
  subtitulo:
    "Seu cliente procura barbearia no Google às 21h de uma quinta. Quem aparece primeiro, com preço na tela e botão de agendar, leva o corte. Eu construo esse site.",
  ctaPrimario: "Quero ver o meu de graça",
  ctaSecundario: "Ver os projetos",
  mensagemWhats:
    "Olá! Vi o portfólio e quero um site para minha barbearia.\n\nNome da barbearia: \nCidade: ",
  provas: [
    { valor: "3 dias", rotulo: "do primeiro alô ao site no ar" },
    { valor: "R$ 0", rotulo: "para ver o seu antes de decidir" },
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
  titulo: "As cinco peças de todo site que eu faço",
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

/* ─── A conta ──────────────────────────────────────────────────
   O barbeiro pensa em corte e em real, não em conversão. Esta
   seção deixa ele mesmo fazer a conta, com os números dele.
   Nada aqui é promessa: os valores saem do que ele digita.        */
export const conta = {
  etiqueta: "A conta",
  titulo: "Quanto vale um cliente novo por semana?",
  texto:
    "Mexa nos números abaixo com a sua realidade. A conta considera só a primeira visita de cada cliente novo — sem contar o retorno, que é onde a barbearia ganha de verdade.",
  campos: {
    preco: { rotulo: "Preço do seu corte", min: 20, max: 150, passo: 5, padrao: 45, prefixo: "R$ " },
    novos: { rotulo: "Clientes novos por semana", min: 1, max: 20, passo: 1, padrao: 3, prefixo: "" },
  },
  resultado: {
    rotuloMes: "por mês",
    rotuloAno: "por ano",
  },
  nota: "Não é promessa de resultado: é a conta que você mesmo acabou de fazer. O que eu garanto é o site pronto para receber esse cliente quando ele aparecer.",
  comparacao: { antes: "E o site sai por", valor: "R$ 423", depois: "uma vez só, no modelo Clássico." },
  cta: "Quero ver o meu de graça",
  mensagemWhats:
    "Olá! Fiz a conta no seu site e quero ver um exemplo do site da minha barbearia.\n\nNome da barbearia: \nCidade: ",
};

/* ─── Quem faz ─────────────────────────────────────────────────
   ⚠️ ESTA É A SEÇÃO MAIS IMPORTANTE PARA VOCÊ PERSONALIZAR.
   Serviço local comprado de um estranho pelo WhatsApp: a primeira
   pergunta na cabeça do dono é "quem é essa pessoa?". Sem nome,
   rosto e cidade, essa dúvida fica sem resposta e ele não chama.
   Troque tudo abaixo pelos seus dados reais.                      */
export const quemFaz = {
  etiqueta: "Quem faz",
  titulo: "Você fala comigo, não com atendimento",
  /* ⚠️ TROQUE: seu nome */
  nome: "Rafael Fernando",
  /* ⚠️ TROQUE: sua função, do jeito que você se apresentaria */
  papel: "Desenvolvedor · Bauru, SP",
  /* ⚠️ TROQUE: coloque uma foto sua em public/quem-faz.jpg.
     Foto de rosto, olhando para a câmera, sem óculos escuros.
     Enquanto não tiver, fica a inicial no lugar. */
  foto: "",
  /* ⚠️ TROQUE: três parágrafos, na sua voz. Diga por que barbearia,
     como você trabalha e o que o cliente pode esperar de você. */
  paragrafos: [
    "Eu escolhi trabalhar só com barbearia porque é um negócio que vive de duas coisas que um site resolve bem: ser achado no Google e facilitar o agendamento. Em vez de aprender dez ramos pela metade, prefiro conhecer um de verdade.",
    "Não tenho equipe nem atendimento. Quem responde o WhatsApp sou eu, quem desenha sou eu e quem ajusta depois também. Você não precisa repetir a sua história para três pessoas diferentes.",
    "Se eu achar que a sua barbearia não precisa de site agora, eu falo. Prefiro perder uma venda a entregar algo que não vai te trazer cliente.",
  ],
  /* ⚠️ TROQUE ou remova: compromissos que você consegue cumprir */
  compromissos: [
    "Respondo em até 1 hora, de segunda a sábado",
    "Você vê o site pronto antes de pagar qualquer coisa",
    "Pagamento único: sem mensalidade e sem contrato de fidelidade",
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

/* ─── Chamada logo após os projetos ────────────────────────────
   É o ponto de maior interesse da página: ele acabou de ver três
   sites funcionando. Deixar esse trecho sem ação era desperdício. */
export const chamadaProjetos = {
  titulo: "Quer ver a sua barbearia nesse formato?",
  texto: "Me manda o nome e a cidade. Em até 24 horas eu te devolvo o link do seu site pronto, de graça.",
  cta: "Quero ver o meu de graça",
  mensagemWhats:
    "Olá! Vi os projetos e quero ver um exemplo do site da minha barbearia.\n\nNome da barbearia: \nCidade: ",
};

/* ─── Planos ───────────────────────────────────────────────────
   Os preços são por modelo, não por pacote abstrato: o dono
   escolhe o demo com que se parece e já vê quanto custa aquele.
   Cobrança única — não há mensalidade em nenhum modelo.
   ═══ Para editar um preço, mude só o campo `preco`. ═══         */
export const planos = {
  etiqueta: "Investimento",
  titulo: "Escolha o modelo e saiba o preço",
  texto:
    "Pagamento único pelo site pronto, publicado e no ar. Sem mensalidade, sem fidelidade e sem taxa escondida. O que você vê nos projetos é exatamente o que você leva.",
  lista: [
    {
      slug: "dom-aurelio",
      nome: "Clássico",
      modelo: "Como a Barbearia Dom Aurélio",
      preco: "R$ 423",
      resumo:
        "Para barbearia de bairro, com clientela fiel e cliente que prefere ligar a agendar pelo app.",
      destaque: false,
      inclui: [
        "Site de uma página, sob medida",
        "Telefone como ação principal, com botão de ligar",
        "Tabela de serviços e preços",
        "Mapa, horários e como chegar",
        "Botão de WhatsApp em todas as seções",
        "Ficha do Google Meu Negócio ligada ao site",
        "30 dias de ajustes inclusos",
      ],
      cta: "Quero o Clássico",
    },
    {
      slug: "nove-e-meia",
      nome: "Urbano",
      modelo: "Como a Nove & Meia",
      preco: "R$ 573",
      resumo:
        "Para barbearia com equipe, público jovem e agenda que precisa parar de ser anotada no caderno.",
      destaque: true,
      selo: "Mais escolhido",
      inclui: [
        "Tudo do Clássico",
        "Página de equipe com perfil de cada barbeiro",
        "Agendamento ligado ao app que você já usa",
        "Galeria de trabalhos",
        "Horários livres do dia em destaque",
        "Integração com o seu Instagram",
      ],
      cta: "Quero o Urbano",
    },
    {
      slug: "casa-valerio",
      nome: "Premium",
      modelo: "Como a Casa Valério",
      preco: "R$ 670",
      resumo:
        "Para barbearia de ticket alto que vende plano mensal e precisa parecer o que cobra.",
      destaque: false,
      inclui: [
        "Tudo do Urbano",
        "Seção de planos de assinatura",
        "Vale-presente para compra por terceiros",
        "Identidade visual: paleta e tipografia próprias",
        "Textos do site escritos por mim",
        "60 dias de ajustes inclusos",
      ],
      cta: "Quero o Premium",
    },
  ],
  /* Custos recorrentes que não são meus — dito na cara, para não
     virar surpresa depois. */
  rodape: {
    titulo: "O que não está no preço",
    itens: [
      "Domínio .com.br: cerca de R$ 40 por ano, registrado no seu nome direto no Registro.br. É seu e vai com você.",
      "Hospedagem: configuro em serviço gratuito, sem custo mensal para você.",
      "Mudanças depois do prazo de ajustes: combinadas na hora, sem contrato.",
    ],
  },
};

/* ─── Garantia ─────────────────────────────────────────────── */
export const garantia = {
  titulo: "Você vê antes de pagar",
  texto:
    "Eu monto o site da sua barbearia e te mando o link. Se você não gostar, não paga nada e a gente se despede sem constrangimento. O risco é todo meu.",
  /* O mecanismo, dito em três passos: garantia sem explicação de
     como funciona soa a promessa de vendedor. */
  passos: [
    { numero: "01", texto: "Você me manda o nome da barbearia e a cidade." },
    { numero: "02", texto: "Em até 24 horas eu te devolvo o link do seu site pronto." },
    { numero: "03", texto: "Gostou, a gente fecha. Não gostou, você não deve nada." },
  ],
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
        "Você não precisa mexer. Nos primeiros 30 dias, mudou preço, entrou barbeiro novo ou mudou o horário? Me manda no WhatsApp e eu altero no mesmo dia, sem cobrar. Depois desse prazo a gente combina na hora — costuma ser coisa de minutos.",
    },
    {
      pergunta: "Tem mensalidade? Fico preso em algum contrato?",
      resposta:
        "Não e não. Você paga uma vez pelo site e ele é seu. A única conta que continua é o domínio, cerca de R$ 40 por ano, pago por você direto no Registro.br e registrado no seu nome. Se um dia quiser trocar de fornecedor, leva tudo.",
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
  cta: "Quero ver o meu de graça",
  mensagemWhats:
    "Olá! Quero o exemplo gratuito do site da minha barbearia.\n\nNome da barbearia: \nCidade: \nInstagram: ",
};
