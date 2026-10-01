/* ═══════════════════════════════════════════════════════════════
   GRÃO DOURADO — DADOS DA CASA

   É o arquivo que mais muda. Nome, contato, endereço e horário
   moram todos aqui; nenhum deles está escrito dentro de template.

   ⚠️ PROJETO DEMONSTRATIVO
   Montado a partir do que está público no Instagram @graodouradocoffee.
   Tudo que eu NÃO consegui confirmar está marcado com `CONFERIR`
   logo acima — telefone, endereço exato, horário e preços. Confira
   com a casa antes de publicar.
   ═══════════════════════════════════════════════════════════════ */

export const MARCA = {
  nome: 'Grão Dourado',
  nomeCompleto: 'Grão Dourado Coffee Shop',
  descritor: 'Coffee & Shop',
  /* A frase é da bio deles. É boa demais para trocar. */
  lema: 'Unindo o café aos melhores sentimentos',
  cidade: 'Natal, RN',

  /* ⚠️ CONFERIR — número de exemplo, não toca em lugar nenhum.
     Troque pelos dígitos reais: 55 + DDD + número, sem símbolo. */
  whatsapp: '5584900000000',
  whatsappVisivel: '(84) 9 0000-0000',

  /* ⚠️ CONFERIR — endereço de e-mail não confirmado. */
  email: 'contato@graodourado.com.br',

  instagram: 'graodouradocoffee',
  threads: 'graodouradocoffee',

  /* A casa fica dentro do lounge da Evidance — é informação da bio
     deles, e é o que mais confunde quem procura pela primeira vez.
     Por isso a referência aparece em toda seção de endereço. */
  unidade: 'Unidade I',
  anfitriao: { nome: 'Evidance Natal', instagram: 'evidancenatal' },

  /* ⚠️ CONFERIR — endereço completo não está público no perfil. */
  endereco: {
    linha1: 'Lounge da Evidance Natal',
    linha2: 'Natal · RN',
    referencia: 'Dentro da academia de dança — o café fica no lounge, logo na entrada',
    estacionamento: 'Estacionamento na frente',
    mapa: 'https://www.google.com/maps/search/?api=1&query=Evidance+Natal',
  },

  /* ⚠️ CONFERIR — horário não confirmado.
     `abre` e `fecha` em minutos desde a meia-noite; `null` = fechado.
     É daqui que sai o selo "aberto agora" no topo do site. */
  horarios: [
    { dia: 'Domingo', curto: 'dom', n: 0, abre: null, fecha: null },
    { dia: 'Segunda', curto: 'seg', n: 1, abre: 8 * 60, fecha: 20 * 60 },
    { dia: 'Terça', curto: 'ter', n: 2, abre: 8 * 60, fecha: 20 * 60 },
    { dia: 'Quarta', curto: 'qua', n: 3, abre: 8 * 60, fecha: 20 * 60 },
    { dia: 'Quinta', curto: 'qui', n: 4, abre: 8 * 60, fecha: 20 * 60 },
    { dia: 'Sexta', curto: 'sex', n: 5, abre: 8 * 60, fecha: 22 * 60 },
    { dia: 'Sábado', curto: 'sáb', n: 6, abre: 9 * 60, fecha: 22 * 60 },
  ],

  /* Aparecem na faixa logo abaixo do topo. Três, no máximo:
     a quarta ninguém lê. */
  promessas: [
    { titulo: 'Feito na hora', texto: 'Salgado sai do forno, não da estufa' },
    { titulo: 'Receita de família', texto: 'A massa e o recheio são de casa' },
    { titulo: 'Café de verdade', texto: 'Grão moído na hora, extração na frente de você' },
  ],
};

/* ── Links prontos ─────────────────────────────────────────────── */

export const wa = (mensagem = '') =>
  `https://wa.me/${MARCA.whatsapp}` +
  (mensagem ? `?text=${encodeURIComponent(mensagem)}` : '');

export const insta = (perfil = MARCA.instagram) => `https://instagram.com/${perfil}`;

/* ── Horário ───────────────────────────────────────────────────── */

export const horarioDe = (n) => MARCA.horarios.find((h) => h.n === n);

export const hhmm = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}h${min % 60 ? String(min % 60).padStart(2, '0') : ''}`;

/** Agrupa dias seguidos com o mesmo horário: "Seg a Qui · 8h às 20h". */
export function horariosAgrupados() {
  const linhas = [];
  for (const h of MARCA.horarios.slice(1).concat(MARCA.horarios[0])) {
    const chave = h.abre === null ? 'fechado' : `${h.abre}-${h.fecha}`;
    const ultima = linhas[linhas.length - 1];
    if (ultima && ultima.chave === chave) ultima.dias.push(h);
    else linhas.push({ chave, dias: [h], abre: h.abre, fecha: h.fecha });
  }
  return linhas.map((l) => ({
    ns: l.dias.map((d) => d.n),
    dias:
      l.dias.length === 1
        ? l.dias[0].dia
        : `${l.dias[0].dia} a ${l.dias[l.dias.length - 1].dia}`,
    horas: l.abre === null ? 'Fechado' : `${hhmm(l.abre)} às ${hhmm(l.fecha)}`,
    fechado: l.abre === null,
  }));
}
