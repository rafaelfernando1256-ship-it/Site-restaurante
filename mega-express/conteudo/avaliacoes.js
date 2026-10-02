/* ═══════════════════════════════════════════════════════════════
   AVALIAÇÕES

   ⚠️ NENHUMA FOI INVENTADA.
   Todas foram transcritas dos posts do próprio Instagram do hotel,
   onde a casa publica as avaliações que recebe no Google e no
   TripAdvisor, com o nome de quem escreveu. É material público,
   divulgado por eles.

   O que eu NÃO faço aqui, e você também não deveria:
   • não invento avaliação nova;
   • não invento nota média nem quantidade total de avaliações —
     eu não tenho esse número, e chutar seria mentir num lugar em
     que mentir custa caro;
   • não marco nada disso como `aggregateRating` nos dados
     estruturados. Marcar avaliação não verificada como dado
     estruturado é motivo de punição de buscador.

   Antes de publicar: confirme com a casa que pode reproduzir os
   textos no site e confira se algum hóspede pediu remoção.

   `unidade` fica vazio quando a avaliação não diz em qual das duas
   a pessoa ficou.
   ═══════════════════════════════════════════════════════════════ */

export const AVALIACOES = [
  {
    texto:
      'O Mega Hotel foi nossa opção nas duas vezes em que estivemos em São Raimundo Nonato. Hotel novo, quartos confortáveis e a equipe é muito simpática e atenciosa. Nas duas oportunidades ficamos na unidade do centro da cidade, que fica em uma praça muito agradável, que à noite espalham suas mesas pela praça. O hotel não tem café da manhã, mas há várias opções para a refeição por perto. Ótimo custo-benefício.',
    autor: 'Anna Pink',
    origem: 'Google',
    unidade: 'mega-express-i',
    destaque: true,
  },
  {
    texto:
      'Ótimo custo benefício pra quem vem da serra da capivara e região. Ótimas instalações e café da manhã muito bom. Após um dia de atividade no parque a piscina ajuda a muito. Refrescar',
    autor: 'Guia Edim Soares',
    origem: 'Google',
    unidade: 'mega-express-ii',
    destaque: true,
  },
  {
    texto:
      'A piscina e o café da manhã são os diferenciais desse hotel. Sem falar na simpatia dos funcionários. Fiquei 15 dias hospedado e foi maravilhoso',
    autor: 'João Veras Filho',
    origem: 'Google',
    unidade: 'mega-express-ii',
    destaque: true,
  },
  {
    texto:
      'Fica no centro da cidade, ótima localização. Preço excelente, inclusive menor que outros hotéis da cidade. Possui estacionamento próprio. Internet Wifi excelente e gratuita.',
    autor: 'Irapuan Barros',
    origem: 'Google',
    unidade: 'mega-express-i',
    destaque: true,
  },
  {
    texto:
      'Quarto espaçoso, camas confortáveis, banheiro com bom chuveiro. Café da manhã excelente e piscina para se refrescar no final do dia',
    autor: 'M Cris Kam',
    origem: 'Google',
    unidade: 'mega-express-ii',
  },
  {
    texto:
      'O Mega Express II é bem limpo, com café farto e nutritivo, atendimento muito atencioso, piscina gostosa.',
    autor: 'Ivanam',
    origem: 'Google',
    unidade: 'mega-express-ii',
  },
  {
    texto:
      'Ótima acomodação. Em frente a uma praça super aprazível e próximo de excelentes lojas. Tem estacionamento. Recomendo.',
    autor: 'Sáskia S Hermes',
    origem: 'Google',
    unidade: 'mega-express-i',
  },
  {
    texto:
      'Acho que é uma das melhores opções da cidade. É um hotel simples, mas com boa estrutura e excelente localização. O atendimento também era ótimo.',
    autor: 'Janaina Nascimento',
    origem: 'Google',
    unidade: '',
  },
  {
    texto:
      'Excelente hotel, recomendo a todos. Além do ótimo preço é um local muito aconchegante, os funcionários muito educados e gentis.',
    autor: 'Sérgio',
    origem: 'Google',
    unidade: '',
  },
  {
    texto: 'Gosto muito de ficar neste hotel. Recepção e quartos excelentes. Preço justo.',
    autor: 'João Pinto',
    origem: 'Google',
    unidade: '',
  },
  {
    texto:
      'Hotel simples, bem limpo e café da manhã muito bom. Atendentes bastante atenciosos. Bom custo benefício.',
    autor: 'Maria Longo',
    origem: 'Google',
    unidade: 'mega-express-ii',
  },
  {
    texto:
      'Funcionários muito receptivos, quartos novos, bem limpos, café da manhã ótimo',
    autor: 'Elisa Matar',
    origem: 'Google',
    unidade: 'mega-express-ii',
  },
  {
    texto: 'Excelente hotel. Instalações novas e super completo. Recomendo.',
    autor: 'Airton Ribeiro',
    origem: 'Google',
    unidade: '',
  },
  {
    texto: 'Ótima opção para quem vai visitar serra da capivara, confortável e limpo.',
    autor: 'CamilaS',
    origem: 'Google',
    unidade: '',
  },
  {
    texto:
      'Local bem aconchegante, o recepcionista super educado e prestativo, recomendo a hospedagem.',
    autor: 'Velton Nascimento Costa',
    origem: 'Google',
    unidade: '',
  },
  {
    texto: 'Adorei o atendimento dos funcionários, muito educados e prestativos.',
    autor: 'Claudia Alves',
    origem: 'Google',
    unidade: '',
  },
  {
    texto:
      'Hotel novo, com ótimos quartos, tudo novo e bem cuidado. Ótimo café da manhã e preço justo.',
    autor: 'AntonioFerreira2012',
    origem: 'TripAdvisor',
    unidade: '',
  },
];

export const avaliacoesDe = (slug) =>
  AVALIACOES.filter((a) => a.unidade === slug || !a.unidade);

export const destacadas = () => AVALIACOES.filter((a) => a.destaque);
