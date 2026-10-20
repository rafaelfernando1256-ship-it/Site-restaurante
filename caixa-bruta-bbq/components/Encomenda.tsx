'use client';

/**
 * A GAVETA DA ENCOMENDA: itens → entrega → revisão → WhatsApp.
 *
 * Fica montada o tempo todo (só escondida), para o cliente fechar,
 * voltar ao cardápio e reabrir sem perder o que já preencheu.
 *
 * O horário é conferido três vezes: no seletor (horário sem as 8 horas
 * nem aparece como opção), ao revisar, e de novo no clique final, com a
 * hora daquele segundo. Página esquecida aberta não fura a regra.
 */
import { ArrowLeft, Loader2, Minus, Plus, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';

import { negocio } from '@/content/negocio';
import { produtos } from '@/content/cardapio';
import {
  dataCurta, dataPorExtenso, diaCurto, diasDoCalendario, horaFalada, horariosDoDia, validaAgendamento,
} from '@/lib/agenda';
import { useLoja, type Etapa } from '@/lib/loja';
import {
  linkDoWhatsapp, mensagemDoPedido, MAX_POR_ITEM, NOME_DA_REGIAO, NOME_DO_PAGAMENTO, reais, subtotal,
  taxaDeEntrega, totalEstimado, type Dados,
} from '@/lib/pedido';
import { atualizaAgora, useAgora } from '@/lib/useAgora';

/* ── o formulário ─────────────────────────────────────────────── */

const soDigitos = (v: string) => v.replace(/\D/g, '');

const esquema = z.object({
  data: z.string().min(1, 'Escolha o dia da entrega.'),
  hora: z.string().min(1, 'Escolha o horário da entrega.'),
  nome: z.string().trim().min(2, 'Diga o seu nome.'),
  whatsapp: z.string().refine((v) => [10, 11].includes(soDigitos(v).length), 'Escreva o WhatsApp com DDD, ex.: (44) 99999-0000.'),
  regiao: z.enum(['sarandi', 'maringa', 'outra'], { message: 'Escolha a cidade da entrega.' }),
  cidade: z.string().trim(),
  endereco: z.string().trim().min(5, 'Escreva a rua e o número.'),
  bairro: z.string().trim().min(2, 'Escreva o bairro.'),
  referencia: z.string().trim().optional(),
  pagamento: z.enum(['pix', 'dinheiro', 'cartao'], { message: 'Escolha a forma de pagamento.' }),
  troco: z.string().trim().optional(),
  observacoes: z.string().trim().max(500, 'Use até 500 caracteres.').optional(),
}).superRefine((d, ctx) => {
  if (d.regiao === 'outra' && d.cidade.length < 2) {
    ctx.addIssue({ code: 'custom', path: ['cidade'], message: 'Escreva a cidade.' });
  }
});

type Formulario = z.infer<typeof esquema>;

/** O zod falando com o react-hook-form, sem pacote a mais. */
const resolvedor: Resolver<Formulario> = async (valores) => {
  const r = esquema.safeParse(valores);
  if (r.success) return { values: r.data, errors: {} };
  const errors: Record<string, { type: string; message: string }> = {};
  for (const e of r.error.issues) {
    const campo = String(e.path[0]);
    if (!errors[campo]) errors[campo] = { type: e.code, message: e.message };
  }
  return { values: {}, errors } as never;
};

function mascaraTelefone(v: string) {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/* ── pedaços ──────────────────────────────────────────────────── */

const PASSOS: { etapa: Etapa; nome: string }[] = [
  { etapa: 'itens', nome: 'Itens' },
  { etapa: 'dados', nome: 'Entrega' },
  { etapa: 'revisao', nome: 'Revisão' },
];

function AvisoOitoHoras() {
  return (
    <p className="bg-dourado px-4 py-3 font-bold leading-snug text-carvao">
      Encomendas com no mínimo 8 horas de antecedência. O horário é sempre uma solicitação: a equipe confirma pelo WhatsApp.
    </p>
  );
}

function Erro({ texto, id }: { texto?: string; id?: string }) {
  return texto ? <p className="erro" id={id} role="alert">{texto}</p> : null;
}

/* ── a gaveta ─────────────────────────────────────────────────── */

export default function Encomenda() {
  const loja = useLoja();
  const agora = useAgora(30_000);
  const gaveta = useRef<HTMLDivElement>(null);
  const corpo = useRef<HTMLDivElement>(null);
  const ultimoFoco = useRef<HTMLElement | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [link, setLink] = useState('');
  const [avisoHorario, setAvisoHorario] = useState('');

  const form = useForm<Formulario>({
    resolver: resolvedor,
    // Valida ao revisar e, dali em diante, enquanto o cliente digita.
    // Validar ao sair do campo fazia a mensagem de erro sumir no meio do
    // clique seguinte: a tela subia e o toque caía no lugar errado.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      data: '', hora: '', nome: '', whatsapp: '', regiao: undefined, cidade: '', endereco: '', bairro: '',
      referencia: '', pagamento: undefined, troco: '', observacoes: '',
    },
  });
  const { register, watch, setValue, formState: { errors }, clearErrors, setError } = form;
  const valores = watch();

  // A última versão da loja, para os efeitos abaixo não reiniciarem a
  // cada mudança na encomenda (o que roubaria o foco do cliente).
  const lojaAtual = useRef(loja);
  lojaAtual.current = loja;

  const dias = useMemo(() => (agora ? diasDoCalendario(agora) : []), [agora]);
  const horarios = useMemo(() => (agora && valores.data ? horariosDoDia(valores.data, agora) : []), [agora, valores.data]);

  // A página ficou aberta e o horário escolhido perdeu as 8 horas: avisa e solta.
  useEffect(() => {
    if (!agora || !valores.data || !valores.hora) return;
    const r = validaAgendamento(valores.data, valores.hora, agora);
    if (!r.ok) {
      setAvisoHorario(`O horário das ${horaFalada(valores.hora)} de ${dataPorExtenso(valores.data)} não está mais disponível. ${r.mensagem}`);
      setValue('hora', '');
      if (lojaAtual.current.etapa === 'revisao') lojaAtual.current.vaiPara('dados');
    }
  }, [agora, valores.data, valores.hora, setValue]);

  // Abrir: guarda quem tinha o foco, trava a rolagem; fechar devolve.
  useEffect(() => {
    if (!loja.aberta) return;
    ultimoFoco.current = document.activeElement as HTMLElement;
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => gaveta.current?.querySelector<HTMLElement>('[data-foco-inicial]')?.focus(), 60);
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') lojaAtual.current.fecha();
      if (e.key !== 'Tab' || !gaveta.current) return;
      const focaveis = [...gaveta.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea')]
        .filter((el) => el.offsetParent !== null);
      if (!focaveis.length) return;
      const [primeiro, ultimo] = [focaveis[0], focaveis[focaveis.length - 1]];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    };
    document.addEventListener('keydown', tecla);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = antes;
      document.removeEventListener('keydown', tecla);
      ultimoFoco.current?.focus?.();
    };
  }, [loja.aberta]);

  // Trocar de passo leva ao topo da gaveta e ao título do passo.
  useEffect(() => {
    corpo.current?.scrollTo({ top: 0 });
    if (loja.aberta) gaveta.current?.querySelector<HTMLElement>('[data-foco-inicial]')?.focus();
  }, [loja.etapa]); // eslint-disable-line react-hooks/exhaustive-deps

  const vazia = loja.linhas.length === 0;
  const taxa = valores.regiao ? taxaDeEntrega(valores.regiao) : null;

  async function revisar() {
    setAvisoHorario('');
    let ok = false;
    // handleSubmit (e não só trigger) para o formulário contar como
    // enviado e passar a revalidar enquanto o cliente corrige.
    await form.handleSubmit(() => { ok = true; }, () => { ok = false; })();
    if (!agora) return;
    const r = validaAgendamento(valores.data, valores.hora, new Date());
    if (valores.data && valores.hora && !r.ok) {
      setError('hora', { type: 'antecedencia', message: r.mensagem });
      setValue('hora', '');
      atualizaAgora();
    }
    if (!ok || !r.ok) {
      window.setTimeout(() => {
        const primeiro = gaveta.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-erro-grupo]');
        primeiro?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        (primeiro as HTMLElement | null)?.focus?.();
      }, 30);
      return;
    }
    loja.vaiPara('revisao');
  }

  function confirmar() {
    // A última conferência, com o relógio deste segundo.
    const r = validaAgendamento(valores.data, valores.hora, new Date());
    if (!r.ok) {
      setValue('hora', '');
      setError('hora', { type: 'antecedencia', message: r.mensagem });
      atualizaAgora(); // os horários vencidos já aparecem riscados
      loja.vaiPara('dados');
      return;
    }
    const dados: Dados = { ...valores, whatsapp: mascaraTelefone(valores.whatsapp) } as Dados;
    const url = linkDoWhatsapp(mensagemDoPedido(loja.linhas, dados));
    setLink(url);
    setEnviando(true);
    // Sem 'noopener' nos recursos: com ele o navegador devolve null e não
    // dá para saber se a janela abriu. O opener é cortado logo em seguida.
    const janela = window.open(url, '_blank');
    if (janela) janela.opener = null;
    window.setTimeout(() => {
      setEnviando(false);
      loja.vaiPara('enviado');
      // Bloqueador de janela: vai na mesma aba.
      if (!janela) window.location.href = url;
    }, 500);
  }

  const passoAtual = PASSOS.findIndex((p) => p.etapa === loja.etapa);

  return (
    <>
      <AnimatePresence>
        {loja.aberta && (
          <motion.div key="fundo" className="fixed inset-0 z-50 bg-black/70" onClick={() => loja.fecha()}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} aria-hidden />
        )}
      </AnimatePresence>

      <div ref={gaveta} role="dialog" aria-modal="true" aria-labelledby="titulo-encomenda"
        inert={!loja.aberta} aria-hidden={!loja.aberta}
        className={`gaveta fixed inset-y-0 right-0 z-50 flex w-full max-w-[560px] flex-col bg-profundo ${loja.aberta ? 'aberta' : ''}`}>

        <div className="flex items-center gap-3 px-5 pt-5 sm:px-8 sm:pt-7">
          {passoAtual > 0 && loja.etapa !== 'enviado' && (
            <button type="button" onClick={() => loja.vaiPara(PASSOS[passoAtual - 1].etapa)}
              className="grid h-11 w-11 place-items-center bg-grafite hover:bg-[#2c2c2c]" aria-label="Voltar um passo">
              <ArrowLeft size={20} aria-hidden />
            </button>
          )}
          <h2 id="titulo-encomenda" className="titulo flex-1 text-sub" tabIndex={-1} data-foco-inicial>
            {loja.etapa === 'enviado' ? 'Solicitação aberta' : 'Minha encomenda'}
          </h2>
          <button type="button" onClick={() => loja.fecha()} className="grid h-11 w-11 place-items-center bg-grafite hover:bg-[#2c2c2c]"
            aria-label="Fechar a encomenda">
            <X size={20} aria-hidden />
          </button>
        </div>

        {loja.etapa !== 'enviado' && !vazia && (
          <ol className="mt-5 flex gap-1 px-5 sm:px-8" aria-label="Passos da encomenda">
            {PASSOS.map((p, i) => (
              <li key={p.etapa} className="flex-1" aria-current={i === passoAtual ? 'step' : undefined}>
                <span className={`block h-1.5 ${i <= passoAtual ? 'bg-dourado' : 'bg-grafite'}`} aria-hidden />
                <span className={`mt-2 block text-nota font-semibold ${i === passoAtual ? 'text-tinta' : 'text-cinza'}`}>{p.nome}</span>
              </li>
            ))}
          </ol>
        )}

        <div ref={corpo} className="mt-5 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-8">
          {/* ── 1. itens ── */}
          {loja.etapa === 'itens' && (
            vazia ? (
              <div className="grid gap-5 pt-6">
                <p className="text-destaque">A encomenda está vazia.</p>
                <p className="text-cinza">Escolha um combo no cardápio para começar.</p>
                <a href="#cardapio" onClick={() => loja.fecha()} className="bt bt-acao">Ver o cardápio</a>
              </div>
            ) : (
              <div className="grid gap-6">
                <ul className="grid gap-1">
                  {loja.linhas.map((l) => {
                    const p = produtos[l.id];
                    return (
                      <li key={l.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 bg-carvao/60 p-4">
                        <div className="min-w-0">
                          <p className="font-bold leading-snug">{p.nome}</p>
                          <p className="numeros text-nota text-cinza">{p.detalhe} · {reais(p.preco)} cada</p>
                        </div>
                        <p className="numeros text-right font-extrabold text-dourado">{reais(p.preco * l.quantidade)}</p>
                        <div className="passo" role="group" aria-label={`Quantidade de ${p.nome}`}>
                          <button type="button" onClick={() => loja.muda(l.id, l.quantidade - 1)} aria-label="Diminuir">
                            <Minus size={18} aria-hidden />
                          </button>
                          <output aria-live="polite">{l.quantidade}</output>
                          <button type="button" onClick={() => loja.muda(l.id, l.quantidade + 1)}
                            disabled={l.quantidade >= MAX_POR_ITEM} aria-label="Aumentar"><Plus size={18} aria-hidden /></button>
                        </div>
                        <button type="button" onClick={() => loja.tira(l.id)}
                          className="flex items-center justify-self-end gap-2 px-2 py-2 text-nota font-semibold text-cinza hover:text-tinta">
                          <Trash2 size={16} aria-hidden /> Remover
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <a href="#cardapio" onClick={() => loja.fecha()} className="font-semibold text-dourado underline">
                  Continuar escolhendo no cardápio
                </a>
                <AvisoOitoHoras />
              </div>
            )
          )}

          {/* ── 2. entrega e dados ── */}
          {loja.etapa === 'dados' && (
            <form className="grid gap-9" noValidate onSubmit={(e) => { e.preventDefault(); revisar(); }}>
              <fieldset className="grid gap-4">
                <legend className="titulo mb-1 text-sub">Quando entregar</legend>
                <AvisoOitoHoras />
                {avisoHorario && <p className="erro" role="alert">{avisoHorario}</p>}

                <div className="grid gap-2" role="radiogroup" aria-label="Dia da entrega" data-erro-grupo={errors.data ? '' : undefined}
                  tabIndex={errors.data ? -1 : undefined}>
                  <span className="font-semibold">Dia</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {!agora && [0, 1, 2].map((i) => <span key={i} className="h-[64px] bg-grafite" aria-hidden />)}
                    {dias.slice(0, 9).map((d) => (
                      <button key={d.data} type="button" role="radio" aria-checked={valores.data === d.data}
                        disabled={!d.temHorario} className="escolha leading-tight"
                        onClick={() => { setValue('data', d.data); setValue('hora', ''); clearErrors(['data', 'hora']); setAvisoHorario(''); }}>
                        <span className="block capitalize">{diaCurto(d.data)}</span>
                        <span className="numeros block text-nota opacity-80">{dataCurta(d.data)}</span>
                      </button>
                    ))}
                  </div>
                  <Erro texto={errors.data?.message} />
                </div>

                <div className="grid gap-2" role="radiogroup" aria-label="Horário da entrega" data-erro-grupo={errors.hora ? '' : undefined}
                  tabIndex={errors.hora ? -1 : undefined}>
                  <span className="font-semibold">Horário</span>
                  {!valores.data
                    ? <p className="bg-grafite px-4 py-3 text-cinza">Escolha o dia para ver os horários.</p>
                    : (
                      <div className="grid grid-cols-4 gap-1.5">
                        {horarios.map((h) => (
                          <button key={h.hora} type="button" role="radio" aria-checked={valores.hora === h.hora}
                            disabled={!h.disponivel} className="escolha numeros text-center"
                            aria-label={h.disponivel ? horaFalada(h.hora) : `${horaFalada(h.hora)}, indisponível: menos de 8 horas`}
                            onClick={() => { setValue('hora', h.hora); clearErrors('hora'); setAvisoHorario(''); }}>
                            {horaFalada(h.hora)}
                          </button>
                        ))}
                      </div>
                    )}
                  {valores.data && horarios.some((h) => !h.disponivel) && (
                    <p className="text-nota text-cinza">Horários riscados não têm as 8 horas de antecedência.</p>
                  )}
                  <Erro texto={errors.hora?.message} />
                </div>
              </fieldset>

              <fieldset className="grid gap-4">
                <legend className="titulo mb-1 text-sub">Seus dados</legend>
                <label className="campo">
                  <span>Nome</span>
                  <input autoComplete="name" {...register('nome')} aria-invalid={!!errors.nome} />
                  <Erro texto={errors.nome?.message} />
                </label>
                <label className="campo">
                  <span>WhatsApp para contato</span>
                  <input type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(44) 99999-0000"
                    {...register('whatsapp', { onChange: (e) => setValue('whatsapp', mascaraTelefone(e.target.value)) })}
                    aria-invalid={!!errors.whatsapp} />
                  <Erro texto={errors.whatsapp?.message} />
                </label>
              </fieldset>

              <fieldset className="grid gap-4">
                <legend className="titulo mb-1 text-sub">Endereço</legend>
                <div className="grid gap-2" role="radiogroup" aria-label="Cidade da entrega" data-erro-grupo={errors.regiao ? '' : undefined}
                  tabIndex={errors.regiao ? -1 : undefined}>
                  <span className="font-semibold">Cidade</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['sarandi', 'maringa', 'outra'] as const).map((r) => (
                      <button key={r} type="button" role="radio" aria-checked={valores.regiao === r} className="escolha text-center"
                        onClick={() => { setValue('regiao', r); clearErrors('regiao'); }}>
                        {NOME_DA_REGIAO[r]}
                      </button>
                    ))}
                  </div>
                  {taxa && (
                    <p className="text-nota">
                      <span className="font-bold text-dourado">Entrega: {taxa.texto}.</span>
                      {taxa.aviso && <span className="text-cinza"> {taxa.aviso}</span>}
                    </p>
                  )}
                  <Erro texto={errors.regiao?.message} />
                </div>
                {valores.regiao === 'outra' && (
                  <label className="campo">
                    <span>Qual cidade?</span>
                    <input autoComplete="address-level2" {...register('cidade')} aria-invalid={!!errors.cidade} />
                    <Erro texto={errors.cidade?.message} />
                  </label>
                )}
                <label className="campo">
                  <span>Rua e número</span>
                  <input autoComplete="street-address" placeholder="Rua, número, complemento" {...register('endereco')}
                    aria-invalid={!!errors.endereco} />
                  <Erro texto={errors.endereco?.message} />
                </label>
                <label className="campo">
                  <span>Bairro</span>
                  <input autoComplete="address-level3" {...register('bairro')} aria-invalid={!!errors.bairro} />
                  <Erro texto={errors.bairro?.message} />
                </label>
                <label className="campo">
                  <span>Referência <span className="font-normal text-cinza">(opcional)</span></span>
                  <input placeholder="Ex.: portão verde, ao lado da padaria" {...register('referencia')} />
                </label>
              </fieldset>

              <fieldset className="grid gap-4">
                <legend className="titulo mb-1 text-sub">Pagamento</legend>
                <div className="grid gap-2" role="radiogroup" aria-label="Forma de pagamento" data-erro-grupo={errors.pagamento ? '' : undefined}
                  tabIndex={errors.pagamento ? -1 : undefined}>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['pix', 'dinheiro', 'cartao'] as const).map((p) => (
                      <button key={p} type="button" role="radio" aria-checked={valores.pagamento === p} className="escolha text-center"
                        onClick={() => { setValue('pagamento', p); clearErrors('pagamento'); }}>
                        {NOME_DO_PAGAMENTO[p]}
                      </button>
                    ))}
                  </div>
                  <Erro texto={errors.pagamento?.message} />
                </div>
                {valores.pagamento === 'pix' && (
                  <p className="bg-grafite px-4 py-3 text-cinza">
                    Os dados para o Pix são passados pelo atendimento, no WhatsApp, depois da confirmação.
                  </p>
                )}
                {valores.pagamento === 'dinheiro' && (
                  <label className="campo">
                    <span>Troco para quanto? <span className="font-normal text-cinza">(deixe em branco se não precisar)</span></span>
                    <input inputMode="decimal" placeholder="Ex.: R$ 200" {...register('troco')} />
                  </label>
                )}
              </fieldset>

              <label className="campo">
                <span>Observações <span className="font-normal text-cinza">(opcional)</span></span>
                <textarea placeholder="Ex.: ponto da carne, interfone, alguma restrição" {...register('observacoes')}
                  aria-invalid={!!errors.observacoes} />
                <Erro texto={errors.observacoes?.message} />
              </label>
              <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
            </form>
          )}

          {/* ── 3. revisão ── */}
          {loja.etapa === 'revisao' && (
            <div className="grid gap-7">
              <AvisoOitoHoras />
              <section aria-label="Itens" className="grid gap-2">
                <h3 className="titulo text-sub">Itens</h3>
                <ul className="grid gap-1.5">
                  {loja.linhas.map((l) => (
                    <li key={l.id} className="flex justify-between gap-4">
                      <span>{l.quantidade}x {produtos[l.id].nome}</span>
                      <span className="numeros font-bold">{reais(produtos[l.id].preco * l.quantidade)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 grid gap-1.5 bg-carvao/60 p-4">
                  <div className="flex justify-between gap-4"><dt>Subtotal</dt><dd className="numeros font-bold">{reais(subtotal(loja.linhas))}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Entrega</dt><dd className="text-right font-bold">{taxa?.texto}</dd></div>
                  <div className="flex justify-between gap-4 text-destaque">
                    <dt className="font-extrabold">Total estimado</dt>
                    <dd className="numeros text-right font-extrabold text-dourado">{valores.regiao && totalEstimado(loja.linhas, valores.regiao)}</dd>
                  </div>
                  {taxa?.aviso && <p className="mt-1 text-nota text-cinza">{taxa.aviso}</p>}
                </dl>
              </section>
              <dl className="grid gap-4">
                <div><dt className="font-semibold text-cinza">Entrega</dt>
                  <dd className="text-destaque font-bold">{valores.data && dataPorExtenso(valores.data)}, às {valores.hora && horaFalada(valores.hora)}</dd></div>
                <div><dt className="font-semibold text-cinza">Endereço</dt>
                  <dd>{[valores.endereco, valores.bairro, valores.regiao === 'outra' ? valores.cidade : valores.regiao && NOME_DA_REGIAO[valores.regiao]].filter(Boolean).join(', ')}
                    {valores.referencia ? ` (${valores.referencia})` : ''}</dd></div>
                <div><dt className="font-semibold text-cinza">Contato</dt><dd>{valores.nome}, {valores.whatsapp}</dd></div>
                <div><dt className="font-semibold text-cinza">Pagamento</dt>
                  <dd>{valores.pagamento && NOME_DO_PAGAMENTO[valores.pagamento]}
                    {valores.pagamento === 'dinheiro' && (valores.troco ? `, troco para ${valores.troco}` : ', sem troco')}</dd></div>
                {valores.observacoes && <div><dt className="font-semibold text-cinza">Observações</dt><dd>{valores.observacoes}</dd></div>}
              </dl>
              <p className="text-cinza">
                Ao confirmar, o WhatsApp abre com a mensagem pronta para {negocio.whatsapp.exibicao}. Envie por lá: a
                encomenda só fica confirmada quando a equipe responder.
              </p>
            </div>
          )}

          {/* ── 4. enviada para o WhatsApp ── */}
          {loja.etapa === 'enviado' && (
            <div className="grid gap-5 pt-2">
              <p className="text-destaque leading-[1.45]">
                A mensagem da sua encomenda foi aberta no WhatsApp. Toque em enviar por lá.
              </p>
              <p className="bg-dourado p-4 font-bold text-carvao">
                A encomenda ainda não está confirmada: a equipe da Caixa Bruta BBQ responde confirmando a disponibilidade.
              </p>
              <a href={link} target="_blank" rel="noopener" className="bt bt-acao">Abrir o WhatsApp de novo</a>
              <button type="button" className="bt bt-calmo" onClick={() => { loja.esvazia(); form.reset(); loja.fecha(); }}>
                Começar outra encomenda
              </button>
            </div>
          )}
        </div>

        {/* o rodapé da gaveta, sempre à mão do polegar */}
        {!vazia && loja.etapa !== 'enviado' && (
          <div className="grid gap-3 bg-carvao px-5 py-4 sm:px-8">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">Subtotal</span>
              <span className="numeros text-destaque font-extrabold">{reais(loja.subtotal)}</span>
            </div>
            {loja.etapa === 'itens' && (
              <button type="button" className="bt bt-acao w-full" onClick={() => loja.vaiPara('dados')}>Escolher dia e entrega</button>
            )}
            {loja.etapa === 'dados' && (
              <button type="button" className="bt bt-acao w-full" onClick={revisar}>Revisar encomenda</button>
            )}
            {loja.etapa === 'revisao' && (
              <button type="button" className="bt bt-acao w-full" onClick={confirmar} disabled={enviando} aria-busy={enviando}>
                {enviando ? <><Loader2 size={18} className="girando" aria-hidden /> Abrindo o WhatsApp…</> : 'Confirmar encomenda pelo WhatsApp'}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
