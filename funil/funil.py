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
import sys
import textwrap
from pathlib import Path

from nucleo import config
from nucleo.estado import Estado, DESCARTADO, QUER_DEMO

ORDEM = ['novo', 'rascunho', 'abordado', 'sem_resposta', 'respondeu',
         'sem_interesse', 'quer_demo', 'demo_pronta', 'publicado', 'fechado',
         'descartado']


def _estado(cfg) -> Estado:
    return Estado(cfg.banco)


# ── comandos ────────────────────────────────────────────────────────
def cmd_resumo(a, cfg) -> int:
    with _estado(cfg) as est:
        r = est.resumo()
        total = sum(r.values())
        print(f'\n  {total} leads no banco — {cfg.banco}\n')
        for e in ORDEM:
            n = r.get(e, 0)
            if n:
                barra = '█' * min(40, n)
                print(f'  {e:<14} {n:>4}  {barra}')
        if not total:
            print('  (vazio — comece com: python3 funil.py cacar --cidade "Natal, RN")')
        print()
    return 0


def cmd_cacar(a, cfg) -> int:
    from nucleo import a1_cacador
    cfg.exige('google_places')
    cidade = a.cidade or cfg.cidade
    if not cidade:
        print('diga a cidade: --cidade "Natal, RN"', file=sys.stderr)
        return 2
    termos = a.termos or cfg.termos
    with _estado(cfg) as est:
        print(f'\nAgente 1 — caçando em {cidade} ({len(termos)} termos)\n')
        c = a1_cacador.caca(est, cfg.google_places, cidade, termos,
                            paginas=a.paginas, minimo=a.minimo)
        print(f'\n  {c["achados"]} sem site · {c["novos"]} novos · '
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
        print(f'\n  {"criado" if novo_lead else "atualizado"}: #{_id} {a.nome}'
              f' · {presenca}'
              + (f' · @{a.instagram.lstrip("@")}' if a.instagram else '')
              + (f' · {a.telefone}' if a.telefone else ' · SEM TELEFONE'))
        print('  próximo: python3 funil.py escrever\n')
    return 0


def cmd_escrever(a, cfg) -> int:
    from nucleo import a2_abordagem
    cfg.exige_cerebro()
    with _estado(cfg) as est:
        print(f'\nAgente 2 — escrevendo as abordagens ({cfg.modelo_do_cerebro})\n')
        c = a2_abordagem.escreve(est, limite=a.limite, modelo=cfg.modelo_do_cerebro,
                                 cidade=a.cidade or '', provedor=cfg.provedor)
        print(f'\n  {c["escritos"]} escritas · {c["falhas"]} falhas')
        print('  revise com: python3 funil.py revisar\n')
    return 0


def cmd_revisar(a, cfg) -> int:
    with _estado(cfg) as est:
        ms = est.mensagens(situacao='rascunho', tipo='abordagem')
        if not ms:
            print('\n  nada em rascunho.\n')
            return 0
        print(f'\n  {len(ms)} abordagens esperando você\n')
        for m in ms:
            print(f'  ── #{m["id"]} · {m["lead_nome"]} · {m["cidade"]}'
                  + (f' · @{m["instagram"]}' if m['instagram'] else '')
                  + (f' · {m["telefone_e164"]}' if m['telefone_e164'] else ' · SEM TELEFONE'))
            print(textwrap.indent(m['texto'], '     '))
            print()
        print('  aprovar: python3 funil.py aprovar ' + ' '.join(str(m['id']) for m in ms[:3])
              + ('  (ou --todas)' if len(ms) > 1 else '') + '\n')
    return 0


def cmd_aprovar(a, cfg) -> int:
    with _estado(cfg) as est:
        ids = a.ids
        if a.todas:
            ids = [m['id'] for m in est.mensagens(situacao='rascunho', tipo='abordagem')]
        if not ids:
            print('diga quais: aprovar 12 13  (ou --todas)', file=sys.stderr)
            return 2
        for i in ids:
            est.marca_mensagem(int(i), 'aprovada')
        print(f'\n  {len(ids)} aprovadas. enviar: python3 funil.py enviar\n')
    return 0


def cmd_enviar(a, cfg) -> int:
    from nucleo import a2_abordagem
    canal = a.canal or cfg.canal_envio
    with _estado(cfg) as est:
        c = a2_abordagem.envia(est, canal=canal, limite=a.limite, pausa=a.pausa)
        if canal == 'link':
            if not c['links']:
                print('\n  nada aprovado para enviar.\n')
                return 0
            print(f'\n  {len(c["links"])} para mandar. Abra, confira, envie —'
                  ' e confirme com o número do fim da linha:\n')
            for x in c['links']:
                print(f'  {x["lead"]} ({x["cidade"]})')
                print(f'    {x["url"]}')
                print(f'    confirmar:  python3 funil.py enviada {x["msg_id"]}\n')
        else:
            print(f'\n  {c["enviadas"]} enviadas · {c["falhas"]} falhas\n')
    return 0


def cmd_enviada(a, cfg) -> int:
    from nucleo import a2_abordagem
    with _estado(cfg) as est:
        for msg_id in a.ids:
            m = [x for x in est.mensagens() if x['id'] == int(msg_id)]
            if not m:
                print(f'  mensagem {msg_id} não existe', file=sys.stderr)
                continue
            a2_abordagem.marca_enviada(est, int(msg_id), m[0]['lead_id'])
            print(f'  ✓ {m[0]["lead_nome"]} marcado como abordado')
    return 0


def cmd_retorno(a, cfg) -> int:
    from nucleo import a3_estudio
    with _estado(cfg) as est:
        a3_estudio.anota_retorno(est, a.lead_id, a.texto)
        print('\n  anotado. triar: python3 funil.py triar\n')
    return 0


def cmd_triar(a, cfg) -> int:
    from nucleo import a3_estudio
    cfg.exige_cerebro()
    with _estado(cfg) as est:
        print('\nAgente 3 — lendo as respostas\n')
        c = a3_estudio.tria(est, limite=a.limite, modelo=cfg.modelo_do_cerebro,
                            provedor=cfg.provedor)
        print(f'\n  {c["quer"]} querem · {c["nao_quer"]} não · '
              f'{c["duvida"]} em dúvida (decida você) · {c["falhas"]} falhas\n')
    return 0


def cmd_construir(a, cfg) -> int:
    from nucleo import a3_estudio
    cfg.exige_cerebro()
    with _estado(cfg) as est:
        print('\nAgente 3 — Instagram → Claude Code → site\n')
        c = a3_estudio.roda(est, cfg, limite=a.limite)
        print(f'\n  {c["prontas"]} prontas · {c["sem_material"]} esperando capturas · '
              f'{c["falhas"]} falhas\n')
    return 0


def cmd_publicar(a, cfg) -> int:
    from nucleo import a4_entrega
    cfg.exige('netlify')
    cfg.exige_cerebro()
    with _estado(cfg) as est:
        print(f'\nAgente 4 — publicando na equipe {cfg.equipe_netlify}\n')
        c = a4_entrega.entrega(est, cfg, limite=a.limite)
        for x in c['links']:
            print(f'\n  {x["lead"]}: {x["url"]}')
            print('    mande o link:  python3 funil.py enviar')
        print(f'\n  {c["publicadas"]} publicadas · {c["falhas"]} falhas\n')
    return 0


def cmd_capturar(a, cfg) -> int:
    """Tira os prints do Instagram de um lead (ou de todos que querem demo)."""
    from nucleo.a3_estudio import material_de
    from nucleo.insta import Insta, ja_tem_material
    with _estado(cfg) as est:
        if a.lead_id:
            alvos = [est.lead(a.lead_id)]
            if not alvos[0]:
                print(f'lead {a.lead_id} não existe', file=sys.stderr)
                return 2
        else:
            alvos = [l for l in est.leads(QUER_DEMO, limite=a.limite)]
        alvos = [l for l in alvos if l and l.instagram]
        if not alvos:
            print('\n  ninguém com Instagram para capturar.\n')
            return 0

        olho = Insta(Path(cfg.perfil_instagram
                          or Path(cfg.banco).parent / 'instagram'))
        if not olho.logado():
            print('\n  Você não está logado no Instagram nesta janela.')
            print('  Entre na conta na janela que abriu — é uma vez só — e rode de novo.')
            print('  (sem login o Instagram tapa a tela e a captura sai pela metade)\n')
        try:
            for l in alvos:
                pasta = material_de(l, cfg.material)
                if ja_tem_material(pasta) and not a.refazer:
                    print(f'  {l.nome}: já tem material em {pasta}')
                    continue
                try:
                    feitos = olho.captura(l.instagram, pasta, posts=a.posts)
                    print(f'  ✓ {l.nome}: {len(feitos)} capturas em {pasta}')
                except Exception as e:
                    print(f'  ✗ {l.nome}: {e}')
        finally:
            olho.fecha()
        print('\n  próximo: python3 funil.py construir\n')
    return 0


def cmd_vigiar(a, cfg) -> int:
    """
    O funil rodando sozinho DEPOIS do primeiro contato: lê quem respondeu,
    tria, responde, constrói a demonstração e entrega o link.
    """
    from nucleo.vigia import Vigia
    cfg.exige_cerebro()
    with _estado(cfg) as est:
        print(f'\nVigia — acompanhando as conversas (a cada {a.intervalo}s)\n')
        v = Vigia(est, cfg, seco=a.seco)
        return v.roda(intervalo=a.intervalo, voltas_max=a.voltas)


def cmd_lead(a, cfg) -> int:
    with _estado(cfg) as est:
        l = est.lead(a.lead_id)
        if not l:
            print(f'lead {a.lead_id} não existe', file=sys.stderr)
            return 2
        print(f'\n  #{l.id} {l.nome}  [{l.estado}]')
        print(f'  {l.categoria or "—"} · {l.cidade} · nota {l.nota or "—"} '
              f'({l.avaliacoes} avaliações) · pontuação {l.pontuacao}')
        print(f'  telefone: {l.telefone or "—"}  ({l.telefone_e164 or "sem e164"})')
        print(f'  instagram: @{l.instagram}' if l.instagram else '  instagram: —')
        print(f'  presença: {l.presenca}  {l.url_achada or ""}')
        d = est.demo(l.id)
        if d:
            print(f'  demo: {d["situacao"]}  {d["url"] or d["zip"] or d["pasta"] or ""}')
            if d['erro']:
                print(f'        erro: {d["erro"]}')
        print('\n  histórico:')
        for e in est.historico(l.id):
            print(f'    {e["agente"]:<14} {e["de"] or "—":>12} → {e["para"] or "—":<12} '
                  f'{e["detalhe"] or ""}')
        print('\n  mensagens:')
        for m in est.mensagens(lead_id=l.id):
            print(f'    #{m["id"]} {m["tipo"]} [{m["situacao"]}]')
            print(textwrap.indent(m['texto'], '      '))
        print()
    return 0


def cmd_painel(a, cfg) -> int:
    import painel
    with _estado(cfg) as est:
        destino = painel.gera(est, cfg)
    print(f'\n  {destino}\n  abra no navegador: file://{destino}\n')
    return 0


def cmd_descartar(a, cfg) -> int:
    with _estado(cfg) as est:
        for i in a.ids:
            try:
                est.move(int(i), DESCARTADO, 'voce', a.motivo)
                print(f'  ✓ {i} descartado')
            except Exception as e:
                print(f'  ✗ {i}: {e}', file=sys.stderr)
    return 0


# ── CLI ─────────────────────────────────────────────────────────────
def principal(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        prog='funil', description='Quatro agentes: caça, aborda, constrói, entrega.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__)
    p.add_argument('--config', type=Path, help='outro config.toml')
    sub = p.add_subparsers(dest='cmd', required=True)

    sub.add_parser('resumo', help='quantos leads em cada estado')

    s = sub.add_parser('cacar', help='AGENTE 1 — acha restaurante sem site')
    s.add_argument('--cidade', help='"Natal, RN"')
    s.add_argument('--termos', nargs='*', help='sobrepõe os termos do config')
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

    a = p.parse_args(argv)
    cfg = config.carrega(a.config)
    return {
        'resumo': cmd_resumo, 'cacar': cmd_cacar, 'escrever': cmd_escrever,
        'adicionar': cmd_adicionar,
        'revisar': cmd_revisar, 'aprovar': cmd_aprovar, 'enviar': cmd_enviar,
        'enviada': cmd_enviada, 'retorno': cmd_retorno, 'triar': cmd_triar,
        'construir': cmd_construir, 'publicar': cmd_publicar, 'lead': cmd_lead,
        'painel': cmd_painel, 'descartar': cmd_descartar, 'vigiar': cmd_vigiar,
        'capturar': cmd_capturar,
    }[a.cmd](a, cfg)


if __name__ == '__main__':
    raise SystemExit(principal())
