#!/usr/bin/env python3
"""
CONTEÚDO — do tema ao MP4 vertical, pronto para postar.

    python3 conteudo.py video "treinar em jejum" --biotipo ectomorfo

O caminho inteiro, em ordem:

    roteiro → imagens licenciadas → tratamento dark → legenda → voz → mp4

Cada etapa escreve em `saida/<slug>/`, e cada uma pode ser refeita
sozinha. Isso importa porque a parte que você vai querer refeita é
sempre a mesma: o roteiro. Imagem e voz raramente saem erradas; o
gancho sai.

O QUE ELE NÃO FAZ

Não posta. O arquivo fica na pasta e você sobe à mão. Postagem
automatizada no TikTok viola os Termos e é motivo de banimento da conta
— e a conta é o ativo, não o vídeo.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
sys.path.insert(0, str(RAIZ))
sys.path.insert(0, str(RAIZ.parent / 'funil'))

from motor import imagens, legenda, visual, voz  # noqa: E402

SAIDA = RAIZ / 'saida'

VERDE, VERMELHO, AMARELO, CINZA, FIM = (
    '\033[32m', '\033[31m', '\033[33m–\033[0m', '\033[90m', '\033[0m')


def _carrega_env() -> None:
    """Lê o .env desta pasta e o do funil — as chaves de modelo moram lá."""
    for arquivo in (RAIZ / '.env', RAIZ.parent / 'funil' / '.env'):
        if not arquivo.exists():
            continue
        for linha in arquivo.read_text(encoding='utf-8-sig').splitlines():
            linha = linha.strip()
            if not linha or linha.startswith('#') or '=' not in linha:
                continue
            k, v = linha.split('=', 1)
            k, v = k.strip(), v.strip().strip('"').strip("'")
            if k and v and k not in __import__('os').environ:
                __import__('os').environ[k] = v


def slug(texto: str) -> str:
    plano = unicodedata.normalize('NFKD', texto).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', plano.lower()).strip('-')[:50] or 'video'


def _provedor() -> tuple[str, str]:
    """O mesmo cérebro do funil, pela chave que existir."""
    import os
    for prov, var in (('groq', 'GROQ_API_KEY'),
                      ('gemini', 'GEMINI_API_KEY'),
                      ('openrouter', 'OPENROUTER_API_KEY'),
                      ('claude', 'ANTHROPIC_API_KEY')):
        if os.environ.get(var):
            return prov, os.environ[var] if prov in ('groq', 'openrouter') else ''
    raise SystemExit(
        'nenhuma chave de modelo. Ponha UMA no .env (do funil serve):\n'
        '  GROQ_API_KEY=       console.groq.com/keys (grátis, sem cartão)\n'
        '  GEMINI_API_KEY=     aistudio.google.com/apikey')


def cmd_roteiro(a) -> int:
    from motor import roteiro as R
    prov, chave = _provedor()
    pasta = SAIDA / slug(a.tema)
    pasta.mkdir(parents=True, exist_ok=True)
    print(f'\n  escrevendo o roteiro ({prov})...\n')
    r = R.escreve(a.tema, biotipo=a.biotipo, provedor=prov, chave=chave)
    (pasta / 'roteiro.json').write_text(
        r.model_dump_json(indent=2), encoding='utf-8')

    print(f'  GANCHO  {r.gancho}')
    for i, q in enumerate(r.quadros, 1):
        print(f'  {i:>2}.     {q.fala}')
        print(f'          \033[90m[{q.busca}]\033[0m')
    print(f'  FECHA   {r.fechamento}\n')
    print(f'  legenda: {r.legenda_post}\n')
    print(f'  salvo em {pasta / "roteiro.json"}')
    print(f'  não gostou do gancho? edite o json e rode: '
          f'python3 conteudo.py video "{a.tema}" --pular-roteiro\n')
    return 0


def _mostra_revisao(rev) -> None:
    cor = {'alto': VERMELHO, 'medio': '\033[33m', 'baixo': VERDE}
    print(f'\n  DIAGNÓSTICO\n  {rev.diagnostico}\n')
    print('  ONDE ELE PERDE A PESSOA')
    for r in sorted(rev.riscos, key=lambda x: x.quadro):
        print(f'    {cor.get(r.risco, "")}{r.risco:<5}{FIM} q{r.quadro}  '
              f'{r.porque}')
        print(f'          {CINZA}mecanismo: {r.mecanismo}{FIM}')
    if rev.manipulacao_encontrada:
        print(f'\n  MANIPULAÇÃO TROCADA')
        for m in rev.manipulacao_encontrada:
            print(f'    • {m}')
    print(f'\n  ROTEIRO REVISADO')
    print(f'    GANCHO  {rev.gancho}')
    for i, q in enumerate(rev.quadros, 1):
        print(f'    {i:>2}.     {q.fala}')
    print(f'    FECHA   {rev.fechamento}')
    print(f'\n  APOSTA  {rev.aposta}')
    print(f'  {CINZA}(é isso que você mede quando o vídeo for bem ou mal){FIM}\n')


def cmd_revisar(a) -> int:
    from motor import gatilhos
    prov, chave = _provedor()
    pasta = SAIDA / slug(a.tema)
    r = _le_roteiro(pasta)
    print(f'\n  revisando ({prov})...')
    rev = gatilhos.revisa(r, tema=a.tema, biotipo=a.biotipo,
                          provedor=prov, chave=chave)
    (pasta / 'revisao.json').write_text(
        rev.model_dump_json(indent=2), encoding='utf-8')
    # O roteiro revisado VIRA o roteiro: o pipeline consome um só arquivo.
    (pasta / 'roteiro.json').write_text(
        gatilhos.para_roteiro(rev).model_dump_json(indent=2), encoding='utf-8')
    _mostra_revisao(rev)
    print(f'  salvo · agora: python3 conteudo.py video "{a.tema}" '
          '--pular-roteiro\n')
    return 0


def _le_roteiro(pasta: Path):
    from motor.roteiro import Roteiro
    arquivo = pasta / 'roteiro.json'
    if not arquivo.exists():
        raise SystemExit(f'não existe {arquivo} — rode sem --pular-roteiro')
    return Roteiro.model_validate_json(arquivo.read_text(encoding='utf-8'))


def cmd_video(a) -> int:
    from motor import video as V
    pasta = SAIDA / slug(a.tema)
    pasta.mkdir(parents=True, exist_ok=True)

    cortes = None
    if a.pular_roteiro:
        r = _le_roteiro(pasta)
        print(f'\n  usando o roteiro que já estava em {pasta.name}/\n')
        viva = pasta / 'revisao.json'
        if viva.exists():
            from motor.gatilhos import Revisao, plano_de_corte
            rev = Revisao.model_validate_json(viva.read_text(encoding='utf-8'))
            cortes = plano_de_corte(rev, len(r.quadros) + 2)
            print(f'  {CINZA}usando o plano de corte da revisão{FIM}')
    else:
        from motor import roteiro as R
        prov, chave = _provedor()
        print(f'\n  1/6 roteiro ({prov})...')
        r = R.escreve(a.tema, biotipo=a.biotipo, provedor=prov, chave=chave)
        (pasta / 'roteiro.json').write_text(
            r.model_dump_json(indent=2), encoding='utf-8')

        if not a.sem_revisao:
            from motor import gatilhos
            print('  2/6 gatilhos: retenção e corte...')
            rev = gatilhos.revisa(r, tema=a.tema, biotipo=a.biotipo,
                                  provedor=prov, chave=chave)
            (pasta / 'revisao.json').write_text(
                rev.model_dump_json(indent=2), encoding='utf-8')
            r = gatilhos.para_roteiro(rev)
            (pasta / 'roteiro.json').write_text(
                r.model_dump_json(indent=2), encoding='utf-8')
            altos = sum(1 for x in rev.riscos if x.risco == 'alto')
            print(f'      {altos} quadro(s) de risco alto consertado(s)'
                  + (f' · {len(rev.manipulacao_encontrada)} manipulação(ões) '
                     'trocada(s)' if rev.manipulacao_encontrada else ''))
            print(f'      {CINZA}aposta: {rev.aposta}{FIM}')
            cortes = gatilhos.plano_de_corte(rev, len(r.quadros) + 2)

    falas = [r.gancho] + [q.fala for q in r.quadros] + [r.fechamento]
    buscas = [r.quadros[0].busca if r.quadros else 'dark gym'] \
        + [q.busca for q in r.quadros] \
        + [r.quadros[-1].busca if r.quadros else 'dark gym']

    print(f'  3/6 imagens ({", ".join(imagens.chaves_configuradas()) or "—"})...')
    cruas = pasta / 'cruas'
    tratadas = pasta / 'tratadas'
    fundos: list[Path | None] = []
    for i, termo in enumerate(buscas):
        try:
            achadas = imagens.busca(termo, quantas=1)
            if not achadas:
                fundos.append(None)
                continue
            crua = imagens.baixa(achadas[0], cruas)
            fundos.append(visual.trata(crua, tratadas / f'{i:02d}.jpg'))
        except imagens.SemChave as e:
            print(f'\n  {e}\n')
            print('  (sem acervo, os quadros saem em preto puro — que também '
                  'funciona, e é o fundo mais dark que existe)\n')
            fundos += [None] * (len(buscas) - len(fundos))
            break
        except RuntimeError as e:
            print(f'    ⚠ "{termo}": {e}')
            fundos.append(None)

    print('  4/6 legendas...')
    quadros_prontos = []
    for i, (fundo, fala) in enumerate(zip(fundos, falas)):
        # Com imagem, o texto sobe: deixa a foto respirar embaixo. SEM
        # imagem ele centraliza — texto no alto sobre preto puro deixa
        # 60% da tela vazia e lê como erro de carregamento.
        posicao = ('meio' if fundo is None or i in (0, len(falas) - 1)
                   else 'alto')
        if cortes and fundo is not None:
            posicao = cortes[i][1]
        quadros_prontos.append(
            legenda.quadro(fundo, fala, pasta / 'quadros' / f'{i:02d}.jpg',
                           posicao=posicao))

    audios: list[Path | None] = [None] * len(falas)
    # O plano de corte da revisão manda; sem ele, tudo com a mesma duração.
    duracoes = ([c[0] for c in cortes] if cortes
                else [a.segundos] * len(falas))
    if not a.sem_voz:
        pode, falta = voz.disponivel()
        if not pode:
            print(f'  5/6 voz — pulando: {falta}')
        else:
            print('  5/6 voz...')
            for i, fala in enumerate(falas):
                limpo = fala.replace('*', '')
                try:
                    audios[i] = voz.narra(limpo, pasta / 'audio' / f'{i:02d}.mp3')
                    # O quadro dura o que a frase dura, mais um respiro.
                    # A fala define o piso; o corte da revisão pode
                    # pedir mais respiro, nunca menos — cortar a narração
                    # no meio da palavra é o pior defeito possível aqui.
                    duracoes[i] = max(
                        duracoes[i] if cortes else 0,
                        voz.duracao(audios[i]) + voz.ESCURA.pausa_entre_frases)
                except Exception as e:
                    # A voz é a etapa mais frágil: depende de rede, de
                    # certificado e de um serviço de terceiro. Derrubar o
                    # vídeo inteiro por causa dela seria perder as outras
                    # quatro etapas que já deram certo — e vídeo mudo com
                    # legenda ainda é vídeo postável, que é o ponto.
                    print(f'    ⚠ quadro {i}: {str(e)[:120]}')
                    audios[i] = None
                    duracoes[i] = max(a.segundos, len(limpo.split()) * 0.42)
            mudos = sum(1 for x in audios if x is None)
            if mudos == len(falas):
                print('    a voz não saiu em nenhum quadro — o vídeo sai mudo, '
                      'com legenda.')
                print('    se for certificado/proxy, é só aqui; na sua '
                      'máquina costuma funcionar.')
            elif mudos:
                print(f'    {mudos} quadro(s) sem voz; o resto saiu.')
    else:
        print('  5/6 voz — pulada (--sem-voz)')

    print('  6/6 montando...')
    destino = pasta / f'{slug(a.tema)}.mp4'
    V.monta(list(zip(quadros_prontos, audios, duracoes)), destino)

    (pasta / 'legenda-do-post.txt').write_text(r.legenda_post, encoding='utf-8')
    total = sum(duracoes)
    print(f'\n  ✓ {destino}')
    print(f'    {len(falas)} quadros · {total:.0f}s')
    print(f'    legenda do post: {pasta / "legenda-do-post.txt"}')
    if (pasta / 'cruas' / 'creditos.json').exists():
        print(f'    créditos das fotos: {pasta / "cruas" / "creditos.json"}')
    print('\n  suba à mão no TikTok. Nada aqui posta sozinho — postagem '
          'automatizada\n  viola os Termos, e a conta é o ativo.\n')
    return 0


def cmd_conferir(a) -> int:
    import os
    print('\n  CONTEÚDO — diagnóstico\n')
    acervos = imagens.chaves_configuradas()

    def marca(ok: bool) -> str:
        return f'{VERDE}✓{FIM}' if ok else f'{VERMELHO}✗{FIM}'

    print(f'  {marca(bool(acervos))} acervo de imagem  '
          f'{CINZA}{", ".join(acervos) if acervos else "nenhum — os quadros saem em preto puro"}{FIM}')
    for nome, (_, var) in imagens.ACERVOS.items():
        if not os.environ.get(var):
            print(f'      {var}  {CINZA}{imagens.ONDE_PEGAR[nome]}{FIM}')

    try:
        prov, _ = _provedor()
        print(f'  {marca(True)} cérebro  {CINZA}{prov}{FIM}')
    except SystemExit:
        print(f'  {marca(False)} cérebro  {CINZA}nenhuma chave de modelo{FIM}')

    pode, falta = voz.disponivel()
    print(f'  {marca(pode)} voz  {CINZA}{"edge-tts" if pode else falta}{FIM}')

    try:
        from motor.video import ffmpeg
        print(f'  {marca(True)} ffmpeg  {CINZA}{ffmpeg()}{FIM}')
    except RuntimeError as e:
        print(f'  {marca(False)} ffmpeg  {CINZA}{e}{FIM}')

    fonte = legenda.acha_fonte(60)
    nome_fonte = Path(str(getattr(fonte, 'path', 'padrao-do-pillow'))).name
    boa = any(m in nome_fonte.lower() for m in ('anton', 'oswald', 'impact'))
    sinal = marca(True) if boa else AMARELO
    dica = '' if boa else ' — instale Anton ou Oswald, muda bastante'
    print(f'  {sinal} fonte  {CINZA}{nome_fonte}{dica}{FIM}')
    print()
    return 0


def principal(argv=None) -> int:
    _carrega_env()
    p = argparse.ArgumentParser(prog='conteudo')
    sub = p.add_subparsers(dest='cmd', required=True)

    for nome, ajuda in (('roteiro', 'só o roteiro, para você ler antes'),
                        ('video', 'o caminho inteiro até o MP4')):
        s = sub.add_parser(nome, help=ajuda)
        s.add_argument('tema')
        s.add_argument('--biotipo', default='',
                       help='ectomorfo | mesomorfo | endomorfo')
        if nome == 'video':
            s.add_argument('--pular-roteiro', action='store_true',
                           help='usa o roteiro.json que já está na pasta')
            s.add_argument('--sem-revisao', action='store_true',
                           help='pula o agente de gatilhos (não recomendado: '
                                'é ele que decide gancho e tempo de corte)')
            s.add_argument('--sem-voz', action='store_true')
            s.add_argument('--segundos', type=float, default=3.0,
                           help='duração do quadro quando não há voz nem '
                                'plano de corte')

    s = sub.add_parser('revisar', help='o agente de gatilhos: diagnostica a '
                                       'retenção e reescreve o roteiro')
    s.add_argument('tema')
    s.add_argument('--biotipo', default='')

    sub.add_parser('conferir', help='o que está pronto e o que falta')

    a = p.parse_args(argv)
    return {'roteiro': cmd_roteiro, 'video': cmd_video, 'revisar': cmd_revisar,
            'conferir': cmd_conferir}[a.cmd](a)


if __name__ == '__main__':
    raise SystemExit(principal())
