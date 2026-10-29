/**
 * "BOM DIA, JARVIS" — o resumo do que aconteceu desde ontem.
 *
 * Tudo sai dos dados da Matilha (os leads, o que os agentes fizeram, as
 * mensalidades) e dos projetos do Jarvis. Nada é estimado: se um número
 * não está nos dados, ele não aparece. O modelo só transforma isto em
 * fala; os números vão para a tela como estão aqui.
 */
import { situacaoDaMensalidade } from './cobranca.mjs';

const DIA = 24 * 3600_000;

/**
 * `leads`: os leads da Matilha. `matilha`: o resumo do chefe (quem chamou
 * você, o que travou). `projetos`: os projetos do Jarvis.
 */
export function resumoDoDia({ leads = [], matilha = null, projetos = [], agora = Date.now(), horas = 24 }) {
  const desde = agora - horas * 3600_000;
  const recente = (t) => typeof t === 'number' && t >= desde && t <= agora + 60_000;
  const abordados = leads.filter((l) => recente(l.abordado_em));
  const responderam = leads.filter((l) => (l.conversa || []).some((m) => m.quem === 'dono' && recente(m.quando)));
  const fecharam = leads.filter((l) => recente(l.vendeu_em));
  const noAr = leads.filter((l) => recente(l.sites?.oficial?.quando) || recente(l.dominio?.no_ar_em));
  const mensalidades = leads.map((l) => ({ l, s: l.aprovado_em ? situacaoDaMensalidade(l, agora) : null }))
    .filter(({ s }) => s && s.dias_de_atraso >= -3)
    .map(({ l, s }) => ({ cliente: l.nome, mes: s.nome_do_mes, situacao: s.dias_de_atraso > 0 ? `${s.dias_de_atraso} dia(s) de atraso` : s.dias_de_atraso === 0 ? 'vence hoje' : `vence em ${-s.dias_de_atraso} dia(s)` }));
  const pendencias = leads.flatMap((l) => (l.pendencias || []).filter((p) => !p.feito).map((p) => `${l.nome}: ${p.texto}`));
  const prontos = projetos.filter((p) => p.estado === 'pronto' && recente(p.fim)).map((p) => p.nome);
  const nomes = (lista) => lista.slice(0, 6).map((l) => l.nome);
  return {
    periodo: `últimas ${horas} horas`,
    numeros: { abordados: abordados.length, responderam: responderam.length, fecharam: fecharam.length, sites_no_ar: noAr.length },
    quem_respondeu: nomes(responderam),
    quem_fechou: nomes(fecharam),
    precisam_de_voce: [...(matilha?.chamaram_voce || []), ...pendencias].slice(0, 8),
    esperando_voce_liberar: (matilha?.esperando_liberar || []).length,
    mensalidades,
    projetos_prontos: prontos,
    matilha_solta: Boolean(matilha?.operacao?.ligada),
    whatsapp: matilha?.whatsapp || null,
  };
}

/** Os números do resumo, no formato da tela (números de destaque). */
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
export function visualDoDia(r) {
  const f = r.numeros.fecharam;
  return {
    tipo: 'numeros',
    titulo: f ? `${plural(f, 'cliente fechou', 'clientes fecharam')} nas ${r.periodo}` : `As ${r.periodo} da Matilha`,
    subtitulo: [r.precisam_de_voce.length ? `${plural(r.precisam_de_voce.length, 'coisa esperando', 'coisas esperando')} você` : 'Nada esperando você',
      r.mensalidades.length ? `${plural(r.mensalidades.length, 'mensalidade', 'mensalidades')} para olhar` : ''].filter(Boolean).join('. '),
    unidade: '',
    numeros: [
      { rotulo: 'Abordados', valor: r.numeros.abordados },
      { rotulo: 'Responderam', valor: r.numeros.responderam, detalhe: r.quem_respondeu.slice(0, 3).join(', ') },
      { rotulo: 'Fecharam', valor: r.numeros.fecharam, detalhe: r.quem_fechou.slice(0, 3).join(', ') },
      { rotulo: 'Sites no ar', valor: r.numeros.sites_no_ar },
    ],
    destaque: 'Fecharam',
    fontes: [{ nome: 'Dados da Matilha' }],
  };
}
export { DIA };
