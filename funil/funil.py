#!/usr/bin/env python3
"""
O FUNIL — quatro agentes, um banco, uma linha de comando.

    python3 funil.py resumo
    python3 funil.py cacar    --cidade "Natal, RN"
    python3 funil.py escrever
    python3 funil.py revisar
    python3 funil.py aprovar  12 13 14     (ou: aprovar --todas)
    python3 funil.py enviar
    python3 funil.py enviada  7            (confirma que você mandou)
    python3 funil.py vigiar                 (daqui em diante é sozinho)
    python3 funil.py painel
    python3 funil.py lead 7

A vigia faz o resto: lê quem respondeu, tria, responde, constrói a
demonstração e entrega o link. O único passo que continua seu é o
primeiro contato — "enviar" abre o WhatsApp com a mensagem pronta e
você clica.

    python3 funil.py retorno 7 "pode mandar sim"   (se preferir colar à mão)
    python3 funil.py triar / construir / publicar  (os passos, um a um)

Cada comando é um agente, ou o seu pedaço no meio deles. Nenhum comando
depende do anterior ter rodado agora: quem guarda o lugar é o banco.
"""
from __future__ import annotations

import argparse
import json
import sys
import textwrap
from pathlib import Path

from nucleo import config
from nucleo.estado import Estado, DESCARTADO, QUER_DEMO

ORDEM = ['novo', 'rascunho', 'abordado', 'sem_resposta', 'respondeu',
         'sem_interesse', 'quer_demo', 'demo_pronta', 'publicado', 'fechado',
         'descartado']



def diz(*coisas, **resto) -> None:
    """`print` que ajusta o comando sugerido ao sistema de quem lê."""
    print(*(config.comando(c) if isinstance(c, str) else c for c in coisas),
          **resto)

def _estado(cfg) -> Estado:
    return Estado(cfg.banco)


# ── comandos ────────────────────────────────────────────────────────
def _painel_json(cfg) -> dict:
    """
    O estado do funil num dicionário, para quem lê por programa.

    Existe porque o plugin da barra precisa disso, e fazer o plugin
    adivinhar o texto bonito do `resumo` seria combinar dois formatos que
    ninguém prometeu manter iguais. Saída de máquina é contrato; saída de
    tela é desenho.
    """
    saida: dict = {'pronto': False, 'leads': {}, 'total': 0,
                   'esperando_voce': 0, 'chaves': {}, 'colonia': None}
    saida['chaves'] = {
        'places': bool(cfg.google_places),
        'cerebro': bool({'gemini': cfg.gemini, 'openrouter': cfg.openrouter,
                         'groq': cfg.groq}.get(cfg.provedor, cfg.anthropic)),
        'netlify': bool(cfg.netlify),
        'provedor': cfg.provedor,
    }
    banco = Path(cfg.banco)
    if not banco.exists():
        return saida
    saida['pronto'] = True
    try:
        with _estado(cfg) as est:
            saida['leads'] = est.resumo()
            saida['total'] = sum(saida['leads'].values())
            # O que depende de VOCÊ para o funil andar: rascunho para ler e
            # aprovada para clicar. É o número que a barra mostra.
            saida['esperando_voce'] = (
                len(est.mensagens(situacao='rascunho'))
                + len(est.mensagens(situacao='aprovada')))
    except Exception as e:
        saida['erro'] = str(e)[:200]

    col = banco.with_suffix('.colonia.json')
    if col.exists():
        try:
            d = json.loads(col.read_text(encoding='utf-8-sig'))
            vivos = [o for o in d.get('organismos', []) if not o.get('morto')]
            saida['colonia'] = {
                'banco': int(d.get('banco', 0)),
                'vivos': len(vivos),
                'envelopes': sum(int(o.get('carteira', 0)) for o in vivos),
                'toques': sum(int(o.get('toques', 0)) for o in vivos),
            }
        except Exception:
            pass
    return saida


def cmd_resumo(a, cfg) -> int:
    if a.json:
        diz(json.dumps(_painel_json(cfg), ensure_ascii=False))
        return 0
    if not Path(cfg.banco).exists():
        diz(f'\n  banco ainda não existe — {cfg.banco}')
        diz('  comece com: python3 funil.py cacar --cidade '
              f'"{cfg.cidade or "Natal, RN"}"\n')
        return 0
    with _estado(cfg) as est:
        r = est.resumo()
        total = sum(r.values())
        diz(f'\n  {total} leads no banco — {cfg.banco}\n')
        for e in ORDEM:
            n = r.get(e, 0)
            if n:
                barra = '█' * min(40, n)
                diz(f'  {e:<14} {n:>4}  {barra}')
        if not total:
            diz('  (vazio — comece com: python3 funil.py cacar --cidade "Natal, RN")')
        diz()
    return 0


def cmd_cacar(a, cfg) -> int:
    from nucleo import a1_cacador
    cfg.exige('google_places')
    cidade = a.cidade or cfg.cidade
    if not cidade:
        diz('diga a cidade: --cidade "Natal, RN"', file=sys.stderr)
        return 2
    termos = a.termos or (config.RAMOS[a.ramo] if a.ramo else cfg.termos)
    with _estado(cfg) as est:
        diz(f'\nAgente 1 — caçando em {cidade} ({len(termos)} termos)\n')
        c = a1_cacador.caca(est, cfg.google_places, cidade, termos,
                            paginas=a.paginas, minimo=a.minimo)
        diz(f'\n  {c["achados"]} sem site · {c["novos"]} novos · '
              f'{c["atualizados"]} atualizados · {c["fracos"]} fracos demais\n')
    return 0


def cmd_adicionar(a, cfg) -> int:
    """
    Põe um lead à mão. Existe por um motivo prático: a chave da Places API
    leva uns minutos para sair, e dá para exercitar o funil inteiro antes
    disso — inclusive com clientes que você já conhece e que não vão
    aparecer em busca nenhuma.
    """
    with _estado(cfg) as est:
        from nucleo.a1_cacador import classifica, e164, instagram_de
        url = a.url or (f'https://instagram.com/{a.instagram.lstrip("@")}'
                        if a.instagram else '')
        presenca = classifica(url)
        _id, novo_lead = est.guarda_lead(
            place_id=a.place_id or f'mao:{a.nome.lower().replace(" ", "-")}',
            nome=a.nome, cidade=a.cidade or cfg.cidade or '',
            telefone=a.telefone, telefone_e164=e164(a.telefone),
            instagram=a.instagram.lstrip('@') or instagram_de(url),
            categoria=a.categoria, nota=a.nota, avaliacoes=a.avaliacoes,
            presenca=presenca, url_achada=url, pontuacao=a.pontuacao,
            dados={'origem': 'mão'})
        diz(f'\n  {"criado" if novo_lead else "atualizado"}: #{_id} {a.nome}'
              f' · {presenca}'
              + (f' · @{a.instagram.lstrip("@")}' if a.instagram else '')
              + (f' · {a.telefone}' if a.telefone else ' · SEM TELEFONE'))
        diz('  próximo: python3 funil.py escrever\n')
    return 0


def cmd_escrever(a, cfg) -> int:
    from nucleo import a2_abordagem
    cfg.exige_cerebro()
    with _estado(cfg) as est:
        diz(f'\nAgente 2 — escrevendo as abordagens ({cfg.modelo_do_cerebro})\n')
        c = a2_abordagem.escreve(est, limite=a.limite, modelo=cfg.modelo_do_cerebro,
                                 cidade=a.cidade or '', provedor=cfg.provedor,
                                 chave=cfg.chave_do_dialeto)
        diz(f'\n  {c["escritos"]} escritas · {c["falhas"]} falhas')
        diz('  revise com: python3 funil.py revisar\n')
    return 0


def cmd_revisar(a, cfg) -> int:
    with _estado(cfg) as est:
        ms = est.mensagens(situacao='rascunho', tipo='abordagem')
        if not ms:
            diz('\n  nada em rascunho.\n')
            return 0
        diz(f'\n  {len(ms)} abordagens esperando você\n')
        for m in ms:
            diz(f'  ── #{m["id"]} · {m["lead_nome"]} · {m["cidade"]}'
                  + (f' · @{m["instagram"]}' if m['instagram'] else '')
                  + (f' · {m["telefone_e164"]}' if m['telefone_e164'] else ' · SEM TELEFONE'))
            diz(textwrap.indent(m['texto'], '     '))
            diz()
        diz('  aprovar: python3 funil.py aprovar ' + ' '.join(str(m['id']) for m in ms[:3])
              + ('  (ou --todas)' if len(ms) > 1 else '') + '\n')
    return 0


def cmd_aprovar(a, cfg) -> int:
    with _estado(cfg) as est:
        ids = a.ids
        if a.todas:
            ids = [m['id'] for m in est.mensagens(situacao='rascunho', tipo='abordagem')]
        if not ids:
            diz('diga quais: aprovar 12 13  (ou --todas)', file=sys.stderr)
            return 2
        for i in ids:
            est.marca_mensagem(int(i), 'aprovada')
        diz(f'\n  {len(ids)} aprovadas. enviar: python3 funil.py enviar\n')
    return 0


def cmd_enviar(a, cfg) -> int:
    from nucleo import a2_abordagem
    canal = a.canal or cfg.canal_envio
    with _estado(cfg) as est:
        c = a2_abordagem.envia(est, canal=canal, limite=a.limite, pausa=a.pausa)
        if canal != 'link':
            diz(f'\n  {c["enviadas"]} enviadas · {c["falhas"]} falhas\n')
            return 0
        if not c['links']:
            diz('\n  nada aprovado para enviar.\n')
            return 0

        if a.abrir:
            return _enfileira(est, c['links'])

        diz(f'\n  {len(c["links"])} para mandar. Abra, confira, envie —'
              ' e confirme com o número do fim da linha:\n')
        for x in c['links']:
            diz(f'  {x["lead"]} ({x["cidade"]})')
            diz(f'    {x["url"]}')
            diz(f'    confirmar:  python3 funil.py enviada {x["msg_id"]}\n')
        diz('  dica: "enviar --abrir" abre um por um e já confirma sozinho.\n')
    return 0


def _enfileira(est, links: list[dict]) -> int:
    """
    Abre as conversas uma a uma, já com a mensagem escrita. Você lê, dá
    Enter no WhatsApp e Enter aqui. Dois toques por lead.

    O envio continua sendo seu — e isso não é cerimônia: é você olhando
    para quem vai receber antes de a mensagem sair. É o que separa
    prospecção de disparo.
    """
    import webbrowser

    from nucleo import a2_abordagem
    diz(f'\n  {len(links)} na fila. Para cada um: confira no WhatsApp, envie,'
          ' e volte aqui.')
    diz('  [enter] = enviei · [p] = pulo este · [s] = paro por aqui\n')
    enviados = 0
    for i, x in enumerate(links, 1):
        diz(f'  ── {i}/{len(links)}  {x["lead"]} ({x["cidade"]})')
        webbrowser.open(x['url'])
        try:
            r = input('     enviou? ').strip().lower()
        except (EOFError, KeyboardInterrupt):
            diz()
            break
        if r in ('s', 'sair', 'q'):
            break
        if r in ('p', 'pular'):
            diz('     pulado\n')
            continue
        a2_abordagem.marca_enviada(est, x['msg_id'], x['lead_id'])
        enviados += 1
        diz('     ✓ marcado como enviado\n')
    diz(f'\n  {enviados} enviados. A vigia cuida do resto:'
          ' python3 funil.py vigiar\n')
    return 0


def cmd_enviada(a, cfg) -> int:
    from nucleo import a2_abordagem
    with _estado(cfg) as est:
        for msg_id in a.ids:
            m = [x for x in est.mensagens() if x['id'] == int(msg_id)]
            if not m:
                diz(f'  mensagem {msg_id} não existe', file=sys.stderr)
                continue
            a2_abordagem.marca_enviada(est, int(msg_id), m[0]['lead_id'])
            diz(f'  ✓ {m[0]["lead_nome"]} marcado como abordado')
    return 0


def cmd_retorno(a, cfg) -> int:
    from nucleo import a3_estudio
    with _estado(cfg) as est:
        a3_estudio.anota_retorno(est, a.lead_id, a.texto)
        diz('\n  anotado. triar: python3 funil.py triar\n')
    return 0


def cmd_triar(a, cfg) -> int:
    from nucleo import a3_estudio
    cfg.exige_cerebro()
    with _estado(cfg) as est:
        diz('\nAgente 3 — lendo as respostas\n')
        c = a3_estudio.tria(est, limite=a.limite, modelo=cfg.modelo_do_cerebro,
                            provedor=cfg.provedor, chave=cfg.chave_do_dialeto)
        diz(f'\n  {c["quer"]} querem · {c["nao_quer"]} não · '
              f'{c["duvida"]} em dúvida (decida você) · {c["falhas"]} falhas\n')
    return 0


def cmd_construir(a, cfg) -> int:
    from nucleo import a3_estudio
    cfg.exige_cerebro()
    with _estado(cfg) as est:
        diz('\nAgente 3 — Instagram → Claude Code → site\n')
        c = a3_estudio.roda(est, cfg, limite=a.limite)
        diz(f'\n  {c["prontas"]} prontas · {c["sem_material"]} esperando capturas · '
              f'{c["falhas"]} falhas\n')
    return 0


def cmd_publicar(a, cfg) -> int:
    from nucleo import a4_entrega
    cfg.exige('netlify')
    cfg.exige_cerebro()
    with _estado(cfg) as est:
        diz(f'\nAgente 4 — publicando na equipe {cfg.equipe_netlify}\n')
        c = a4_entrega.entrega(est, cfg, limite=a.limite)
        for x in c['links']:
            diz(f'\n  {x["lead"]}: {x["url"]}')
            diz('    mande o link:  python3 funil.py enviar')
        diz(f'\n  {c["publicadas"]} publicadas · {c["falhas"]} falhas\n')
    return 0


def cmd_capturar(a, cfg) -> int:
    """Tira os prints do Instagram de um lead (ou de todos que querem demo)."""
    from nucleo.a3_estudio import material_de
    from nucleo.insta import Insta, ja_tem_material
    with _estado(cfg) as est:
        if a.lead_id:
            alvos = [est.lead(a.lead_id)]
            if not alvos[0]:
                diz(f'lead {a.lead_id} não existe', file=sys.stderr)
                return 2
        else:
            alvos = [l for l in est.leads(QUER_DEMO, limite=a.limite)]
        alvos = [l for l in alvos if l and l.instagram]
        if not alvos:
            diz('\n  ninguém com Instagram para capturar.\n')
            return 0

        olho = Insta(Path(cfg.perfil_instagram
                          or Path(cfg.banco).parent / 'instagram'))
        if not olho.logado():
            diz('\n  Você não está logado no Instagram nesta janela.')
            diz('  Entre na conta na janela que abriu — é uma vez só — e rode de novo.')
            diz('  (sem login o Instagram tapa a tela e a captura sai pela metade)\n')
        try:
            for l in alvos:
                pasta = material_de(l, cfg.material)
                if ja_tem_material(pasta) and not a.refazer:
                    diz(f'  {l.nome}: já tem material em {pasta}')
                    continue
                try:
                    feitos = olho.captura(l.instagram, pasta, posts=a.posts)
                    diz(f'  ✓ {l.nome}: {len(feitos)} capturas em {pasta}')
                except Exception as e:
                    diz(f'  ✗ {l.nome}: {e}')
        finally:
            olho.fecha()
        diz('\n  próximo: python3 funil.py construir\n')
    return 0


def cmd_vigiar(a, cfg) -> int:
    """
    O funil rodando sozinho DEPOIS do primeiro contato: lê quem respondeu,
    tria, responde, constrói a demonstração e entrega o link.
    """
    from nucleo.vigia import Vigia
    cfg.exige_cerebro()
    with _estado(cfg) as est:
        diz(f'\nVigia — acompanhando as conversas (a cada {a.intervalo}s)\n')
        v = Vigia(est, cfg, seco=a.seco)
        return v.roda(intervalo=a.intervalo, voltas_max=a.voltas)


def cmd_lead(a, cfg) -> int:
    with _estado(cfg) as est:
        l = est.lead(a.lead_id)
        if not l:
            diz(f'lead {a.lead_id} não existe', file=sys.stderr)
            return 2
        diz(f'\n  #{l.id} {l.nome}  [{l.estado}]')
        diz(f'  {l.categoria or "—"} · {l.cidade} · nota {l.nota or "—"} '
              f'({l.avaliacoes} avaliações) · pontuação {l.pontuacao}')
        diz(f'  telefone: {l.telefone or "—"}  ({l.telefone_e164 or "sem e164"})')
        diz(f'  instagram: @{l.instagram}' if l.instagram else '  instagram: —')
        diz(f'  presença: {l.presenca}  {l.url_achada or ""}')
        d = est.demo(l.id)
        if d:
            diz(f'  demo: {d["situacao"]}  {d["url"] or d["zip"] or d["pasta"] or ""}')
            if d['erro']:
                diz(f'        erro: {d["erro"]}')
        diz('\n  histórico:')
        for e in est.historico(l.id):
            diz(f'    {e["agente"]:<14} {e["de"] or "—":>12} → {e["para"] or "—":<12} '
                  f'{e["detalhe"] or ""}')
        diz('\n  mensagens:')
        for m in est.mensagens(lead_id=l.id):
            diz(f'    #{m["id"]} {m["tipo"]} [{m["situacao"]}]')
            diz(textwrap.indent(m['texto'], '      '))
        diz()
    return 0


def cmd_painel(a, cfg) -> int:
    import painel
    with _estado(cfg) as est:
        destino = painel.gera(est, cfg)
    diz(f'\n  {destino}\n  abra no navegador: file://{destino}\n')
    return 0


def cmd_descartar(a, cfg) -> int:
    with _estado(cfg) as est:
        for i in a.ids:
            try:
                est.move(int(i), DESCARTADO, 'voce', a.motivo)
                diz(f'  ✓ {i} descartado')
            except Exception as e:
                diz(f'  ✗ {i}: {e}', file=sys.stderr)
    return 0


# ── CLI ─────────────────────────────────────────────────────────────
def cmd_conferir(a, cfg) -> int:
    from nucleo.conferir import confere
    return confere(cfg, com_rede=not a.seco)


def _colonia(cfg):
    from nucleo.colonia import Colonia
    return Colonia(Path(cfg.banco).with_suffix('.colonia.json'),
                   teto_vivos=cfg.colonia_teto_vivos,
                   teto_gasto=cfg.colonia_teto_gasto,
                   semente=cfg.colonia_semente,
                   toques=cfg.colonia_toques,
                   banco=cfg.colonia_banco)


def cmd_colonia(a, cfg) -> int:
    from nucleo.colonia import (ColoniaCheia, ContaErrada, SemBanco, dinheiro)
    col = _colonia(cfg)

    # A invariante é checada na abertura também: se o arquivo foi editado
    # à mão (e ele é JSON justamente para poder ser), é aqui que a conta
    # errada aparece — antes de alguém gastar em cima dela.
    try:
        col.confere()
    except ContaErrada as e:
        diz(f'\n  A CONTA NÃO FECHA\n\n  {e}\n')
        diz(f'  o livro-caixa está em {col.caminho}\n')
        return 1

    if a.banco is not None:
        try:
            col.declara_banco(a.banco)
        except ContaErrada as e:
            diz(f'\n  {e}\n')
            return 1
        col.salva()
        cabem = col.livre // col.semente
        diz(f'\n  banco: {dinheiro(col.banco)} · '
              f'envelopes {dinheiro(col.reservado)} · '
              f'livre {dinheiro(col.livre)}')
        diz(f'  cabem mais {cabem} organismo(s) de {dinheiro(col.semente)}\n')
        return 0

    if a.recebi:
        ident, centavos = a.recebi[0], int(a.recebi[1])
        if ident not in col.bichos:
            diz(f'\n  não existe organismo "{ident}". Veja: '
                  'python3 funil.py colonia --extrato\n')
            return 1
        col.recebe(ident, centavos, de='confirmado à mão')
        col.salva()
        o = col.bichos[ident]
        diz(f'\n  {ident} recebeu {dinheiro(centavos)}. '
              f'Envelope: {dinheiro(o.carteira)} · saldo {dinheiro(o.saldo)}')
        diz(f'  banco {dinheiro(col.banco)} · livre {dinheiro(col.livre)}')
        if not o.vivo:
            diz('  (ele já estava morto: o dinheiro entrou no banco, '
                  'não no envelope dele)')
        if o.pode_reproduzir:
            diz('  Ele já pode se reproduzir — sai na próxima '
                  '"colonia --viver".')
        diz()
        return 0

    if a.matar:
        if a.matar not in col.bichos:
            diz(f'\n  não existe organismo "{a.matar}"\n')
            return 1
        sobrou = col.bichos[a.matar].carteira
        col.mata(a.matar, 'morto à mão por você')
        col.salva()
        diz(f'\n  † {a.matar} morto. Não há como reviver.')
        if sobrou:
            diz(f'  {dinheiro(sobrou)} do envelope dele voltaram para o livre.')
        diz(f'  livre agora: {dinheiro(col.livre)}\n')
        return 0

    if a.recarregar:
        ident, quantos = a.recarregar[0], int(a.recarregar[1])
        o = col.bichos.get(ident)
        if not o:
            diz(f'\n  não existe organismo "{ident}"\n')
            return 1
        if o.fechados == 0:
            # Recarregar quem nunca fechou é furar a seleção por dentro: a
            # reserva de toques só filtra se acabar de verdade.
            diz(f'\n  {ident} nunca fechou nada. Recarregar toques aí é '
                  'pagar para repetir o que não funcionou.\n')
            return 1
        o.toques += max(0, quantos)
        o.recarregados += max(0, quantos)
        col._anota(ident, 'recarregou', 0, f'+{quantos} toques')
        col.salva()
        diz(f'\n  {ident} agora tem {o.toques} toques.\n')
        return 0

    if a.nascer:
        cidade = a.cidade or cfg.cidade
        if not cidade:
            diz('\n  falta a cidade: --cidade "Natal, RN", ou cidade = em '
                  'config.toml\n')
            return 1
        try:
            o = col.nascer(cidade=cidade, termos=cfg.termos, tom=a.tom,
                           preco=a.preco)
        except (ColoniaCheia, SemBanco) as e:
            diz(f'\n  {e}\n')
            return 1
        col.salva()
        diz(f'\n  nasceu {o.id} com um envelope de {dinheiro(o.carteira)} '
              f'e {o.toques} toques.')
        diz(f'  banco {dinheiro(col.banco)} · '
              f'envelopes {dinheiro(col.reservado)} · '
              f'livre {dinheiro(col.livre)}')
        diz(f'  {o.cidade} · tom {o.tom} · cobra {dinheiro(o.preco)}')
        diz('\n  para ele trabalhar: python3 funil.py colonia --viver\n')
        return 0

    if a.viver:
        from nucleo import vida
        if not col.vivos():
            diz('\n  nenhum organismo vivo. Comece com: '
                  'python3 funil.py colonia --nascer\n')
            return 1
        cfg.exige_cerebro()
        cfg.exige('google_places')
        diz(f'\n  COLÔNIA · uma volta com {len(col.vivos())} vivos\n')
        with _estado(cfg) as est:
            saida = vida.volta(col, est, cfg, paginas=a.paginas, limite=a.limite)
        diz(col.extrato())
        if saida['mortos'] or saida['nasceram']:
            diz(f'  nesta volta: {len(saida["mortos"])} morreram, '
                  f'{len(saida["nasceram"])} nasceram\n')
        diz('  as abordagens ficaram em RASCUNHO. Nenhuma saiu sozinha:')
        diz('    python3 funil.py revisar')
        diz('    python3 funil.py enviar --abrir\n')
        return 0

    diz(col.extrato())
    if not col.bichos:
        diz('  colônia vazia. Comece com: python3 funil.py colonia --nascer\n')
    return 0


# ══ PRÉVIA ANTES DA VENDA ═══════════════════════════════════════════
#
# Os quatro comandos abaixo são o caminho curto: planilha → site →
# link no ar → mensagem pronta. Nenhum deles chama modelo de linguagem,
# então rodam em segundos, de graça, e dão o mesmo resultado toda vez.
def cmd_planilha(a, cfg) -> int:
    from nucleo.planilha import escreve_modelo
    alvo = a.arquivo or Path('planilha.csv')
    if alvo.exists() and not a.forcar:
        diz(f'\n  {alvo} já existe. Use --forcar para sobrescrever '
              '(e perder o que estiver lá dentro).\n')
        return 1
    escreve_modelo(alvo)
    diz(f'\n  planilha criada: {alvo}')
    diz('  Abra no Excel ou no Google Planilhas, apague os três exemplos')
    diz('  e ponha os seus. Depois:\n')
    diz(f'    python3 funil.py importar {alvo}\n')
    return 0


def cmd_importar(a, cfg) -> int:
    from nucleo.planilha import le
    if not a.arquivo.exists():
        diz(f'\n  não achei {a.arquivo}. Gere o modelo com: '
              'python3 funil.py planilha\n')
        return 1
    linhas = le(a.arquivo)
    if not linhas:
        diz('\n  a planilha não tem nenhuma linha com nome preenchido.\n')
        return 1
    novos = atualizados = 0
    diz()
    with _estado(cfg) as est:
        for l in linhas:
            _id, era_novo = est.guarda_lead(**l.para_lead())
            novos += era_novo
            atualizados += not era_novo
            falta = l.pontua_vazios()
            diz(f'  {"＋" if era_novo else "↻"} #{_id} {l.nome} · '
                  f'{l.modelo} · {l.pontuacao()}/10'
                  + (f'  (falta: {", ".join(x.split("(")[0].strip() for x in falta)})'
                     if falta else ''))
            for p in l.problemas:
                diz(f'      ⚠ {p}')
    diz(f'\n  {novos} novos, {atualizados} atualizados.')
    diz('  próximo: python3 funil.py previa\n')
    return 0


def cmd_previa(a, cfg) -> int:
    """Gera o site de demonstração. É o passo que não precisa de chave."""
    from nucleo.estado import DEMO_PRONTA, NOVO
    from nucleo.planilha import Linha
    from nucleo.previa import monta
    with _estado(cfg) as est:
        if a.lead:
            alvos = [l for l in (est.lead(i) for i in a.lead) if l]
        else:
            alvos = est.leads(NOVO, limite=a.limite)
        if not alvos:
            diz('\n  nenhum lead em NOVO. Importe a planilha primeiro:'
                  '\n    python3 funil.py importar planilha.csv\n')
            return 1
        diz()
        feitos = 0
        for l in alvos:
            d = l.dados or {}
            linha = Linha(
                nome=l.nome, tipo=l.categoria, endereco=l.endereco,
                telefone=l.telefone, instagram=l.instagram,
                tem_site=(l.presenca == 'tem_site'), cidade=l.cidade,
                horario=d.get('horario', ''),
                especialidades=d.get('especialidades') or [],
                observacao=d.get('observacao', ''))
            try:
                p = monta(linha, cfg.saida / 'previas', autor=a.autor or cfg.autor,
                          com_fotos=not a.sem_fotos)
            except Exception as e:
                est.anota('previa', 'erro', l.id, str(e)[:300])
                diz(f'  ✗ {l.nome}: {e}')
                continue
            from nucleo.a3_estudio import empacota
            zip_ = empacota(p.pasta)
            est.guarda_demo(l.id, pasta=str(p.pasta), zip=str(zip_),
                            situacao='pronta')
            if l.estado != DEMO_PRONTA:
                est.move(l.id, DEMO_PRONTA, 'previa',
                         f'modelo {p.modelo}, {p.fotos} fotos')
            feitos += 1
            diz(f'  ✓ {l.nome} · modelo {p.modelo} · {p.fotos} fotos'
                  + (f' · falta: {", ".join(x.split("(")[0].strip() for x in p.pendencias)}'
                     if p.pendencias else ''))
            diz(f'      abra para conferir: {p.indice}')
    diz(f'\n  {feitos} prévia(s) prontas.')
    diz('  próximo: python3 funil.py publicar\n')
    return 0


def cmd_oferta(a, cfg) -> int:
    """A mensagem com o link, para quem já está publicado."""
    from nucleo.estado import PUBLICADO, RASCUNHO
    from nucleo.oferta import primeira
    from nucleo.planilha import Linha
    with _estado(cfg) as est:
        alvos = ([l for l in (est.lead(i) for i in a.lead) if l] if a.lead
                 else est.leads(PUBLICADO, limite=a.limite))
        if not alvos:
            diz('\n  ninguém publicado esperando mensagem. '
                  'Rode: python3 funil.py publicar\n')
            return 1
        diz()
        escritas = 0
        for l in alvos:
            d = est.demo(l.id)
            link = (d['url'] if d else '') or ''
            if not link:
                diz(f'  ✗ {l.nome}: sem link publicado ainda')
                continue
            dados = l.dados or {}
            falta = Linha(nome=l.nome, tipo=l.categoria, endereco=l.endereco,
                          telefone=l.telefone, cidade=l.cidade,
                          horario=dados.get('horario', ''),
                          especialidades=dados.get('especialidades') or []
                          ).pontua_vazios()
            texto = primeira(l, link, a.autor or cfg.autor,
                             modelo=dados.get('modelo', ''), pendencias=falta,
                             angulo=a.angulo)
            est.guarda_mensagem(l.id, 'abordagem', texto)
            if l.estado != RASCUNHO:
                est.move(l.id, RASCUNHO, 'oferta', 'mensagem com o link')
            escritas += 1
            diz(f'  ✓ {l.nome}\n{_recuado(texto)}\n')
    diz(f'  {escritas} mensagem(ns) em rascunho. Nenhuma saiu sozinha.')
    diz('  você lê, aprova e manda:')
    diz('    python3 funil.py revisar')
    diz('    python3 funil.py aprovar --todas')
    diz('    python3 funil.py enviar --abrir\n')
    return 0


def cmd_seguir(a, cfg) -> int:
    """O toque N de quem não respondeu. Imprime para você copiar."""
    from nucleo.oferta import SEGUIMENTO, seguinte
    with _estado(cfg) as est:
        l = est.lead(a.lead)
        if not l:
            diz(f'\n  não achei o lead #{a.lead}\n')
            return 1
        d = est.demo(l.id)
        link = (d['url'] if d else '') or '(sem link publicado)'
        if a.passo:
            s = seguinte(l, link, a.passo, (l.dados or {}).get('modelo', ''))
            diz(f'\n  TOQUE {a.passo} · dia {s["dia"]} · {s["nome"]}')
            diz(f'  \033[90m{s["porque"]}\033[0m\n')
            diz(_recuado(s['texto']))
            diz(f'\n  mandar agora: {_link_whats(l, s["texto"])}\n')
            return 0
        diz(f'\n  SEGUIMENTO de {l.nome} — cinco toques, contados do dia '
              'em que você mandou a primeira:\n')
        for i, s in enumerate(SEGUIMENTO, 1):
            diz(f'  {i}. dia {s["dia"]:>2} · {s["nome"]}')
        diz(f'\n  o texto de um deles: python3 funil.py seguir '
              f'--lead {l.id} --passo 2\n')
    return 0


def cmd_estagio(a, cfg) -> int:
    """Move o lead na parte comercial: negociando, fechado, perdido."""
    from nucleo.estado import FECHADO, NEGOCIANDO, SEM_INTERESSE
    destino = {'negociando': NEGOCIANDO, 'fechado': FECHADO,
               'perdido': SEM_INTERESSE}[a.cmd]
    with _estado(cfg) as est:
        for i in a.lead:
            l = est.lead(i)
            if not l:
                diz(f'  não achei o lead #{i}')
                continue
            try:
                est.move(l.id, destino, 'você', a.nota)
                diz(f'  #{l.id} {l.nome}: {l.estado} → {destino}')
            except Exception as e:
                diz(f'  #{l.id} {l.nome}: {e}')
    diz()
    return 0


def _recuado(texto: str) -> str:
    return '\n'.join('      ' + x for x in texto.splitlines())


def _link_whats(lead, texto: str) -> str:
    from nucleo.a2_abordagem import link_whats
    return (link_whats(lead.telefone_e164, texto) if lead.telefone_e164
            else '(lead sem telefone)')



def principal(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        prog='funil', description='Quatro agentes: caça, aborda, constrói, entrega.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__)
    p.add_argument('--config', type=Path, help='outro config.toml')
    sub = p.add_subparsers(dest='cmd', required=True)

    s = sub.add_parser('conferir', help='testa as chaves de verdade e diz o '
                                       'que falta para o funil rodar')
    s.add_argument('--seco', action='store_true',
                   help='só olha se está preenchido, sem tocar na rede')

    s = sub.add_parser('resumo', help='quantos leads em cada estado')
    s.add_argument('--json', action='store_true',
                   help='saída para programa (é o que a barra do plugin lê)')

    s = sub.add_parser('cacar', help='AGENTE 1 — acha restaurante sem site')
    s.add_argument('--cidade', help='"Natal, RN"')
    s.add_argument('--termos', nargs='*', help='sobrepõe os termos do config')
    s.add_argument('--ramo', choices=['comida', 'hospedagem'], default='',
                   help='"hospedagem" caça pousada e hotel — é onde mora a '
                        'conversa da comissão de OTA')
    s.add_argument('--paginas', type=int, default=3)
    s.add_argument('--minimo', type=int, default=4, help='pontuação mínima (0-10)')

    s = sub.add_parser('adicionar', help='põe um lead à mão, sem a Places API')
    s.add_argument('nome')
    s.add_argument('--telefone', default='', help='+55 84 98888-7777')
    s.add_argument('--instagram', default='', help='@perfil')
    s.add_argument('--cidade', default='')
    s.add_argument('--categoria', default='Restaurante')
    s.add_argument('--url', default='', help='o link que ele usa hoje, se tiver')
    s.add_argument('--nota', type=float, default=0.0)
    s.add_argument('--avaliacoes', type=int, default=0)
    s.add_argument('--pontuacao', type=int, default=8)
    s.add_argument('--place-id', dest='place_id', default='')

    # ── prévia antes da venda ───────────────────────────────────────
    s = sub.add_parser('planilha', help='cria a planilha CSV que você preenche')
    s.add_argument('arquivo', nargs='?', type=Path, default=None)
    s.add_argument('--forcar', action='store_true',
                   help='sobrescreve uma planilha que já existe')

    s = sub.add_parser('importar', help='põe no funil os negócios da planilha')
    s.add_argument('arquivo', type=Path)

    s = sub.add_parser('previa', help='PRÉVIA — gera o site de demonstração '
                                      '(sem chave, em segundos)')
    s.add_argument('--lead', type=int, nargs='*', default=[],
                   help='só estes; sem isto, pega quem está em NOVO')
    s.add_argument('--limite', type=int, default=10)
    s.add_argument('--sem-fotos', action='store_true',
                   help='não baixa foto de acervo (mais rápido; o modelo '
                        'tem um plano B de CSS)')
    s.add_argument('--autor', default='', help='seu nome na mensagem e no aviso')

    s = sub.add_parser('oferta', help='escreve a mensagem COM o link da prévia')
    s.add_argument('--lead', type=int, nargs='*', default=[])
    s.add_argument('--limite', type=int, default=10)
    s.add_argument('--autor', default='')
    s.add_argument('--angulo', default='', choices=['', 'comissao'],
                   help='"comissao" abre pela comissão que ele paga à '
                        'Booking/iFood em vez de pelo site. Serve para '
                        'hotel e restaurante; nos outros cai no padrão')

    s = sub.add_parser('seguir', help='os cinco toques de quem não respondeu')
    s.add_argument('--lead', type=int, required=True)
    s.add_argument('--passo', type=int, help='1 a 5; sem isto, lista os cinco')

    for nome, ajuda in (('negociando', 'ele respondeu e está conversando preço'),
                        ('fechado', 'ele pagou — parabéns'),
                        ('perdido', 'ele disse não, ou sumiu de vez')):
        s = sub.add_parser(nome, help=ajuda)
        s.add_argument('lead', type=int, nargs='+')
        s.add_argument('--nota', default='', help='por quê, para você lembrar')

    s = sub.add_parser('escrever', help='AGENTE 2 — escreve as abordagens')
    s.add_argument('--limite', type=int, default=20)
    s.add_argument('--cidade')

    sub.add_parser('revisar', help='mostra os rascunhos para você ler')

    s = sub.add_parser('aprovar', help='libera rascunho para envio')
    s.add_argument('ids', nargs='*')
    s.add_argument('--todas', action='store_true')

    s = sub.add_parser('enviar', help='AGENTE 2 — entrega o que você aprovou')
    s.add_argument('--canal', choices=['link', 'cloud'])
    s.add_argument('--limite', type=int, default=50)
    s.add_argument('--pausa', type=float, default=0.0, help='segundos entre envios (cloud)')
    s.add_argument('--abrir', action='store_true',
                   help='abre um por um e confirma com enter (dois toques por lead)')

    s = sub.add_parser('enviada', help='confirma que VOCÊ mandou pelo link')
    s.add_argument('ids', nargs='+')

    s = sub.add_parser('retorno', help='cola a resposta que o dono te mandou')
    s.add_argument('lead_id', type=int)
    s.add_argument('texto')

    s = sub.add_parser('triar', help='AGENTE 3 — quem quer ver a demonstração')
    s.add_argument('--limite', type=int, default=20)

    s = sub.add_parser('construir', help='AGENTE 3 — Instagram → Claude Code → site')
    s.add_argument('--limite', type=int, default=3)

    s = sub.add_parser('publicar', help='AGENTE 4 — Netlify e o link para o cliente')
    s.add_argument('--limite', type=int, default=10)

    s = sub.add_parser('capturar', help='tira os prints do Instagram do lead')
    s.add_argument('lead_id', nargs='?', type=int, default=0)
    s.add_argument('--posts', type=int, default=3, help='quantos posts abrir')
    s.add_argument('--limite', type=int, default=5)
    s.add_argument('--refazer', action='store_true', help='mesmo já tendo material')

    s = sub.add_parser('vigiar', help='acompanha as conversas sozinho (respostas, '
                                      'triagem, demonstração e entrega)')
    s.add_argument('--intervalo', type=int, default=90, help='segundos entre as voltas')
    s.add_argument('--voltas', type=int, default=0, help='0 = sem fim')
    s.add_argument('--seco', action='store_true',
                   help='mostra o que faria, sem enviar nada')

    s = sub.add_parser('lead', help='tudo sobre um lead')
    s.add_argument('lead_id', type=int)

    sub.add_parser('painel', help='gera a tela de revisão em HTML')

    s = sub.add_parser('descartar', help='tira leads do funil')
    s.add_argument('ids', nargs='+')
    s.add_argument('--motivo', default='descartado à mão')

    s = sub.add_parser('colonia', help='a colônia: agentes com carteira, que '
                                       'morrem sem dinheiro e se reproduzem com lucro')
    s.add_argument('--nascer', action='store_true',
                   help='cria o primeiro organismo (ou mais um, dentro do teto)')
    s.add_argument('--viver', action='store_true',
                   help='uma volta: cada vivo trabalha, os falidos morrem, '
                        'os lucrativos geram filho')
    s.add_argument('--extrato', action='store_true', help='o livro-caixa (padrão)')
    s.add_argument('--recebi', nargs=2, metavar=('ID', 'CENTAVOS'),
                   help='confirma um pagamento que CAIU na sua conta. '
                        'Em centavos: 90000 = R$ 900,00')
    s.add_argument('--banco', type=int, metavar='CENTAVOS',
                   help='declara quanto você tem disponível para a colônia '
                        'gastar. 2500 = R$ 25,00. Os envelopes dos '
                        'organismos saem daqui e nunca somam mais que isto.')
    s.add_argument('--matar', metavar='ID',
                   help='mata um organismo à mão. Não tem volta. O envelope '
                        'dele volta para o livre.')
    s.add_argument('--recarregar', nargs=2, metavar=('ID', 'TOQUES'),
                   help='devolve toques a quem já fechou alguma coisa')
    s.add_argument('--tom', default='direto',
                   help='direto | curioso | prestativo | numerico')
    s.add_argument('--cidade', default='')
    s.add_argument('--preco', type=int, default=90_000,
                   help='em centavos, o que ele cobra pela montagem')
    s.add_argument('--paginas', type=int, default=1)
    s.add_argument('--limite', type=int, default=10)

    a = p.parse_args(argv)
    cfg = config.carrega(a.config)
    return {
        'conferir': cmd_conferir, 'resumo': cmd_resumo, 'cacar': cmd_cacar, 'escrever': cmd_escrever,
        'adicionar': cmd_adicionar,
        'revisar': cmd_revisar, 'aprovar': cmd_aprovar, 'enviar': cmd_enviar,
        'enviada': cmd_enviada, 'retorno': cmd_retorno, 'triar': cmd_triar,
        'construir': cmd_construir, 'publicar': cmd_publicar, 'lead': cmd_lead,
        'painel': cmd_painel, 'descartar': cmd_descartar, 'vigiar': cmd_vigiar,
        'capturar': cmd_capturar, 'colonia': cmd_colonia,
        'planilha': cmd_planilha, 'importar': cmd_importar,
        'previa': cmd_previa, 'oferta': cmd_oferta, 'seguir': cmd_seguir,
        'negociando': cmd_estagio, 'fechado': cmd_estagio,
        'perdido': cmd_estagio,
    }[a.cmd](a, cfg)


if __name__ == '__main__':
    raise SystemExit(principal())
