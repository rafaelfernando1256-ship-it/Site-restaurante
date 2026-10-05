#!/usr/bin/env python3
"""
ULTRON

    python ultron.py                 modo voz: diga "Hey Ultron" e fale
    python ultron.py --texto         modo teclado: digita em vez de falar
    python ultron.py "abre o chrome" um comando só e sai
    python ultron.py --checar        diz o que está instalado e o que falta
    python ultron.py --ferramentas   lista tudo que ele sabe fazer

No modo voz ele fica quieto até você chamar. A palavra de ativação roda
na sua máquina; o áudio não sai daqui — só o texto do que você falou, e
só depois que você chamou.
"""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from ferramentas import FALTANDO, REGISTRO, Contexto, carrega_tudo       # noqa: E402
from nucleo import config                                                # noqa: E402
from nucleo.cerebro import monta as monta_cerebro                        # noqa: E402
from nucleo.permissao import Porteiro                            # noqa: E402
from nucleo.registro import Diario                                       # noqa: E402
from nucleo.voz import Voz                                               # noqa: E402

SIM = {'sim', 'pode', 'pode sim', 'confirmo', 'confirma', 'isso', 'claro', 'manda',
       'vai', 'ok', 'okay', 'beleza', 'positivo', 'autorizo', 'faz', 'faça', 'certo'}
NAO = {'não', 'nao', 'para', 'pare', 'cancela', 'cancelar', 'negativo', 'deixa',
       'esquece', 'nem', 'espera'}

SEMPRE = {'sempre', 'pode sempre', 'não precisa perguntar', 'nao precisa perguntar'}

PARAR = {'para', 'pare', 'cala', 'calado', 'silêncio', 'silencio', 'chega', 'para tudo'}
SAIR = {'tchau', 'até logo', 'sair', 'desliga', 'fecha o ultron', 'bom descanso'}


def faixa(texto: str = '', cor: str = '36') -> None:
    print(f'\033[{cor}m{texto}\033[0m')


# ── montagem ────────────────────────────────────────────────────────
def monta(cfg, modo_voz: bool):
    diario = Diario(config.DADOS / 'ultron.db')
    voz = Voz(cfg, motor='auto' if modo_voz else 'imprime')
    carrega_tudo()

    estado = {'ouvido': None}

    def pergunta_voz(texto: str) -> str:
        """Pergunta falando e ouve a resposta. Só vale para nível CUIDADO."""
        ouvido = estado['ouvido']
        if ouvido is None:
            return pergunta_teclado(texto)
        voz.fala(texto)
        voz.espera(20)
        resposta = (ouvido.ouve() or '').strip().lower().rstrip('.!?')
        print(f'  você: {resposta or "(nada)"}')
        if not resposta:
            return 'nao'
        if any(p in resposta for p in SEMPRE):
            return 'sempre'
        if any(p in resposta.split() for p in NAO):
            return 'nao'
        return 'sim' if any(p in resposta for p in SIM) else 'nao'

    def pergunta_teclado(texto: str) -> str:
        voz.cale()
        print(f'\n  {texto}')
        print('  \033[90m[enter = sim · n = não · sempre = não perguntar mais '
              'nesta sessão]\033[0m')
        try:
            r = input('  > ').strip().lower()
        except (EOFError, KeyboardInterrupt):
            return 'nao'
        if r in ('sempre', 'sempre sim', 'a'):
            return 'sempre'
        if r in ('', 'sim', 's', 'y', 'yes', 'ok'):
            return 'sim'
        return 'nao'

    porteiro = Porteiro(cfg, diario, perguntar_voz=pergunta_voz,
                        perguntar_teclado=pergunta_teclado)
    ctx = Contexto(cfg=cfg, diario=diario, porteiro=porteiro, falar=voz.fala)

    if cfg.provedor == 'gemini':
        # Uma consulta ao catálogo evita um 404 no meio da primeira frase.
        try:
            from nucleo.modelos import gemini, resolve_modelo_gemini
            escolhido, aviso = resolve_modelo_gemini(gemini(cfg.gemini), cfg.modelo_gemini)
            cfg.modelo_gemini = escolhido
            if aviso:
                faixa(f'  {aviso}', '33')
        except Exception:
            pass

    cerebro = monta_cerebro(cfg, diario=diario, porteiro=porteiro, falar=voz.fala, ctx=ctx)
    return cerebro, voz, diario, ctx, estado


def responde(cerebro, voz, pedido: str, falando: bool) -> str:
    inicio = time.time()
    # `atende` e não `responde`: é o turno com plano antes e conferência
    # depois. Vale nos dois modos — no teclado o plano aparece escrito,
    # o que também serve de prévia antes de ele mexer em alguma coisa.
    if falando:
        dizer = voz.fala
    else:
        def dizer(t: str) -> None:
            print(f'\n  {cerebro.cfg.nome}: {t}')
    resposta = cerebro.atende(pedido, ao_falar=dizer)
    print(f'\033[90m  ({time.time() - inicio:.1f}s)\033[0m')
    return resposta


# ── modos ───────────────────────────────────────────────────────────
def modo_texto(cerebro, voz, cfg) -> int:
    faixa(f'\n  {cfg.nome} — modo teclado. Escreva o que quer. '
          '"sair" encerra, "esquece" limpa a conversa.\n')
    while True:
        try:
            pedido = input('  você> ').strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return 0
        if not pedido:
            continue
        if pedido.lower() in SAIR or pedido.lower() == 'sair':
            return 0
        if pedido.lower() in ('esquece', 'limpa', 'nova conversa'):
            cerebro.esquece_conversa()
            print('  (conversa limpa)')
            continue
        try:
            responde(cerebro, voz, pedido, falando=False)
        except KeyboardInterrupt:
            print('\n  (cortado)')
        except Exception as e:
            print(f'  erro: {type(e).__name__}: {e}')


def modo_voz(cerebro, voz, cfg, estado) -> int:
    from nucleo.ouvido import Ouvido
    ok, aviso = Ouvido.checa_com(cfg)
    if not ok:
        faixa(f'  {aviso}', '33')
        faixa('  Caindo no modo teclado.', '33')
        return modo_texto(cerebro, voz, cfg)
    if 'Gemini' in aviso:
        faixa(f'  {aviso}', '33')

    ouvido = Ouvido(cfg)
    estado['ouvido'] = ouvido
    faixa(f'\n  {cfg.nome} acordado. Medindo o barulho da sala...')
    piso = ouvido.calibra()
    faixa(f'  pronto. Diga "{cfg.palavra_chave}" para falar comigo. '
          f'(ruído de fundo: {piso:.0f})\n')
    voz.fala(f'Pronto, {cfg.tratamento}.')

    while True:
        try:
            if not ouvido.espera_chamado():
                continue
            voz.cale()                       # se eu estava falando, calo
            print('\n  🎙  ouvindo...')
            pedido = ouvido.ouve()
            if not pedido:
                continue
            print(f'  você: {pedido}')
            baixo = pedido.lower().strip(' .!?')
            if baixo in PARAR:
                voz.cale()
                continue
            if baixo in SAIR:
                voz.fala('Até logo.')
                voz.espera(6)
                return 0
            if baixo in ('esquece', 'esqueça', 'nova conversa'):
                cerebro.esquece_conversa()
                voz.fala('Conversa limpa.')
                continue
            responde(cerebro, voz, pedido, falando=True)
        except KeyboardInterrupt:
            print('\n  tchau.')
            return 0
        except Exception as e:
            print(f'  erro: {type(e).__name__}: {e}')
            voz.fala('Deu um erro aqui. Está escrito na tela.')


# ── diagnóstico ─────────────────────────────────────────────────────
def _linha(bem: bool, nome: str, detalhe: str = '') -> None:
    marca = '\033[32m✓\033[0m' if bem else '\033[31m✗\033[0m'
    print(f'  {marca} {nome}' + (f'  \033[90m{detalhe}\033[0m' if detalhe else ''),
          flush=True)


def _testa_chave_dialeto(cfg, provedor: str) -> tuple[bool, str]:
    """OpenRouter e Groq: a própria lista de modelos já autentica."""
    try:
        from nucleo.modelos import modelo_dialeto, modelos_dialeto
        chave = getattr(cfg, provedor)
        nomes = modelos_dialeto(chave, provedor)
        if not nomes:
            return False, 'a chave respondeu, mas nenhum modelo ficou disponível'
        escolhido = modelo_dialeto(chave, getattr(cfg, f'modelo_{provedor}', ''),
                                   provedor)
        return True, f'válida · {len(nomes)} modelos · usando {escolhido}'
    except RuntimeError as e:
        return False, str(e)
    except Exception as e:
        return False, f'{type(e).__name__}: {str(e)[:160]}'


def _testa_chave_rota(cfg) -> tuple[bool, str]:
    return _testa_chave_dialeto(cfg, 'openrouter')


def _testa_chave_groq(cfg) -> tuple[bool, str]:
    # A chave do Groq começa com gsk_, e dá para dizer isso antes de
    # gastar uma ida à rede — é o erro mais comum depois de colar errado.
    chave = (cfg.groq or '').strip()
    if chave and not chave.startswith('gsk_'):
        return False, ('uma chave do Groq começa com gsk_ — essa não começa. '
                       'Pegue em console.groq.com/keys')
    return _testa_chave_dialeto(cfg, 'groq')


def _testa_chave_gemini(cfg) -> tuple[bool, str]:
    try:
        from nucleo.modelos import gemini, resolve_modelo_gemini
    except ImportError:
        return False, 'falta instalar: python -m pip install google-genai'
    try:
        # modelos_gemini e NÃO resolve_modelo_gemini: o resolvedor engole a
        # exceção de propósito (para não derrubar o Ultron por causa do
        # catálogo), e engolir aqui faria uma chave falsa passar por válida.
        from nucleo.modelos import modelos_gemini
        cli = gemini(cfg.gemini)
        nomes = modelos_gemini(cli)
        if not nomes:
            return False, 'a chave respondeu, mas nenhum modelo ficou disponível para ela'
        escolhido, aviso = resolve_modelo_gemini(cli, cfg.modelo_gemini)
        return True, f'válida · modelo {escolhido}' + (f' — {aviso}' if aviso else '')
    except Exception as e:
        texto = str(e)
        if 'API_KEY_INVALID' in texto or 'API key not valid' in texto:
            return False, ('O GOOGLE RECUSOU ESTA CHAVE. Pegue uma em '
                           'aistudio.google.com/apikey e cole inteira no .env')
        if 'PERMISSION_DENIED' in texto or '403' in texto:
            return False, 'a chave existe mas não tem acesso à API Generative Language'
        if type(e).__name__ in ('ConnectError', 'ConnectTimeout', 'APIConnectionError'):
            return False, 'não consegui falar com o Google — é a sua internet'
        return False, f'{type(e).__name__}: {texto[:160]}'


def _testa_chave(cfg) -> tuple[bool, str]:
    """
    Pergunta à API se a chave vale. Conferir se o campo está preenchido não
    serve de nada: chave errada passa nesse teste e só falha na primeira
    frase que você fala. Usa contagem de tokens, que autentica e não cobra.
    """
    if cfg.provedor == 'gemini':
        return _testa_chave_gemini(cfg)
    if cfg.provedor == 'openrouter':
        return _testa_chave_rota(cfg)
    if cfg.provedor == 'groq':
        return _testa_chave_groq(cfg)
    # Antes de gastar uma ida à rede: a forma da chave já denuncia o erro
    # mais comum, que é copiar o token do claude.ai (sk-ant-usr-...) achando
    # que é a chave da API. Os dois começam com sk-ant- e são coisas
    # diferentes, de sites diferentes.
    chave = cfg.anthropic.strip()
    if chave.startswith('sk-ant-usr-') or chave.startswith('sk-ant-oat'):
        return False, ('isso é um token do claude.ai, não uma chave de API. '
                       'A chave da API começa com sk-ant-api03- e sai de '
                       'console.anthropic.com → API Keys (site diferente do claude.ai)')
    if not chave.startswith('sk-ant-'):
        return False, 'uma chave da Anthropic começa com sk-ant- — essa não começa'

    try:
        import anthropic
        cli = anthropic.Anthropic(api_key=chave)
        cli.messages.count_tokens(model=cfg.modelo,
                                  messages=[{'role': 'user', 'content': 'oi'}])
        return True, 'válida'
    except Exception as e:
        nome, texto = type(e).__name__, str(e)
        if 'authentication' in texto.lower() or '401' in texto:
            return False, ('A ANTHROPIC RECUSOU ESTA CHAVE. Confira se você copiou '
                           'ela inteira (começa com sk-ant-) e sem espaço sobrando, '
                           'em console.anthropic.com → API Keys')
        if 'credit' in texto.lower() or 'billing' in texto.lower():
            return False, 'a chave é válida mas a conta está sem crédito'
        if 'not_found' in texto.lower() or '404' in texto:
            return False, f'a chave vale, mas o modelo "{cfg.modelo}" não existe para ela'
        if nome in ('APIConnectionError', 'APITimeoutError'):
            return False, 'não consegui falar com a Anthropic — é a sua internet'
        return False, f'{nome}: {texto[:160]}'


def checar(cfg) -> int:
    import platform
    carrega_tudo()
    print(f'\n  {cfg.nome} — diagnóstico\n', flush=True)
    print(f'  sistema: {config.sistema()} · Python {platform.python_version()}', flush=True)
    print(f'  pastas liberadas: {", ".join(cfg.raizes_seguras)}', flush=True)
    cerebro = {'gemini': 'Gemini (Google)', 'openrouter': 'OpenRouter',
               'groq': 'Groq'}.get(cfg.provedor, 'Claude (Anthropic)')
    print(f'  cérebro: {cerebro} · modelo {cfg.modelo_do_cerebro}\n', flush=True)

    faltam_pip, quebrados = [], []
    tela = sys.stdout.isatty()      # só apaga a linha quando há terminal de verdade

    dono = {'gemini': 'Gemini', 'openrouter': 'OpenRouter',
            'groq': 'Groq'}.get(cfg.provedor, 'Claude')
    variavel = {'gemini': 'GEMINI_API_KEY', 'openrouter': 'OPENROUTER_API_KEY',
                'groq': 'GROQ_API_KEY'}.get(cfg.provedor, 'ANTHROPIC_API_KEY')
    if not cfg.chave_do_cerebro:
        _linha(False, f'chave do {dono} (obrigatória)',
               f'preencha {variavel} no arquivo .env')
    else:
        if tela:
            print(f'  \033[90m… testando a chave do {dono}\033[0m', end='\r', flush=True)
        bem, detalhe = _testa_chave(cfg)
        if tela:
            print(' ' * 46, end='\r')
        _linha(bem, f'chave do {dono} (obrigatória)', detalhe)
    for outro, chave in (('Claude', cfg.anthropic), ('ChatGPT', cfg.openai),
                         ('Gemini', cfg.gemini), ('OpenRouter', cfg.openrouter),
                         ('Groq', cfg.groq)):
        if outro != dono:
            _linha(bool(chave), f'chave do {outro} (opcional, para consultar)')

    # Cada import é impresso ANTES de acontecer: o primeiro carregamento do
    # motor de transcrição leva dezenas de segundos, e uma tela parada sem
    # explicação parece travamento.
    pacotes = [('anthropic', 'falar com o Claude', 'anthropic'),
               ('google.genai', 'falar com o Gemini', 'google-genai'),
               ('playwright', 'navegador e WhatsApp', 'playwright'),
               ('pptx', 'slides', 'python-pptx'),
               ('pyautogui', 'teclado e mouse', 'pyautogui'),
               ('pyperclip', 'copiar e colar', 'pyperclip'),
               ('psutil', 'bateria, memória, disco', 'psutil'),
               ('pyttsx3', 'voz do Windows', 'pyttsx3'),
               ('sounddevice', 'microfone', 'sounddevice'),
               ('openwakeword', 'palavra de ativação', 'openwakeword'),
               ('faster_whisper', 'entender o que você fala', 'faster-whisper')]
    for pacote, para_que, no_pip in pacotes:
        if tela:
            print(f'  \033[90m… carregando {pacote}\033[0m', end='\r', flush=True)
        motivo = ''
        try:
            __import__(pacote)
            bem = True
        except ImportError as e:
            bem = False
            if 'No module named' in str(e) and pacote in str(e):
                faltam_pip.append(no_pip)
                motivo = f'({para_que}) — não instalado'
            else:
                # Está instalado e quebra ao carregar: mandar reinstalar aqui
                # só faz o pip responder "already satisfied".
                quebrados.append((pacote, f'{type(e).__name__}: {e}'))
                motivo = f'({para_que}) — INSTALADO, mas não carrega'
        except Exception as e:
            bem = False
            quebrados.append((pacote, f'{type(e).__name__}: {e}'))
            motivo = f'({para_que}) — INSTALADO, mas não carrega'
        if tela:
            print(' ' * 46, end='\r')
        _linha(bem, f'{pacote}', motivo or f'({para_que})')

    from nucleo.ouvido import Ouvido
    ouve, como = Ouvido.checa_com(cfg)
    _linha(ouve, 'ouvir você', como)

    funil = Path(cfg.funil_db).expanduser()
    if funil.exists():
        _linha(True, 'banco de clientes (funil)', str(funil))
    else:
        print('  \033[90m·\033[0m banco de clientes (funil)  \033[90m'
              'ainda não existe — nasce quando você rodar o projeto funil/. '
              'Só afeta perguntas de cliente.\033[0m', flush=True)

    if FALTANDO:
        print('\n  ferramentas que não carregaram:')
        for m, por in FALTANDO.items():
            print(f'    {m}: {por}')

    print(f'\n  {len(REGISTRO)} ferramentas prontas.')
    if faltam_pip:
        print('\n  Para completar, rode:')
        print(f'    .\\.venv\\Scripts\\python.exe -m pip install {" ".join(faltam_pip)}')
    for pacote, erro in quebrados:
        print(f'\n  \033[33m{pacote} está instalado mas quebra ao carregar:\033[0m')
        print(f'    {erro[:400]}')
        print(f'    Para ver o erro inteiro:')
        print(f'    .\\.venv\\Scripts\\python.exe -c "import {pacote}"')
    if not cfg.chave_do_cerebro:
        print(f'\n  Sem a chave do {dono} ele não liga. É a única coisa obrigatória.')
    print(flush=True)
    return 0


def lista_ferramentas() -> int:
    carrega_tudo()
    por_modulo: dict[str, list] = {}
    for f in REGISTRO.values():
        por_modulo.setdefault(f.funcao.__module__.split('.')[-1], []).append(f)
    print()
    for modulo, fs in sorted(por_modulo.items()):
        print(f'  \033[1m{modulo}\033[0m')
        for f in fs:
            marca = ('~' if f.avalia else
                     {'livre': ' ', 'cuidado': '!', 'perigo': '‼'}.get(f.nivel, ' '))
            print(f'    {marca} {f.nome:<26} {f.descricao.splitlines()[0][:78]}')
        print()
    print('  ! pede confirmação   ‼ pede confirmação digitada   '
          '~ depende do que for pedido\n')
    return 0


# ── entrada ─────────────────────────────────────────────────────────
def comanda_despertar(ligar: bool, desligar: bool) -> int:
    """`ultron.py despertar [--ligar|--desligar]`."""
    import despertar
    raiz = Path(__file__).resolve().parent
    if ligar and desligar:
        faixa('  escolha um: --ligar ou --desligar.', '31')
        return 2
    if ligar:
        bem, recado = despertar.liga(raiz)
    elif desligar:
        bem, recado = despertar.desliga()
    else:
        bem, recado = despertar.estado()
    faixa(f'  {recado}', '32' if bem else '33')
    return 0 if bem or not (ligar or desligar) else 1


def principal(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog='ultron', description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('pedido', nargs='*', help='um comando só, sem entrar no laço')
    p.add_argument('--texto', action='store_true', help='teclado em vez de voz')
    p.add_argument('--voz', action='store_true', help='força o modo voz')
    p.add_argument('--checar', action='store_true', help='o que está instalado')
    p.add_argument('--ferramentas', action='store_true', help='lista o que ele sabe fazer')
    p.add_argument('--config', type=Path, help='outro config.toml')
    p.add_argument('--ligar', action='store_true',
                   help='com "despertar": sobe junto com o notebook')
    p.add_argument('--desligar', action='store_true',
                   help='com "despertar": para de subir junto')
    a = p.parse_args(argv)

    # Duas palavras reservadas no lugar do pedido. "ouvir" é o que o
    # atalho da inicialização chama, e tem que cair no modo voz em vez
    # de virar um pedido de uma palavra.
    primeira = a.pedido[0].lower() if a.pedido else ''
    if primeira == 'despertar':
        return comanda_despertar(a.ligar, a.desligar)
    if primeira == 'ouvir' and len(a.pedido) == 1:
        a.pedido, a.voz = [], True

    cfg = config.carrega(a.config)

    if a.ferramentas:
        return lista_ferramentas()
    if a.checar:
        return checar(cfg)

    cfg.exige_cerebro()
    um_comando = ' '.join(a.pedido).strip()
    falando = a.voz or (not a.texto and not um_comando)
    cerebro, voz, diario, ctx, estado = monta(cfg, modo_voz=falando)

    try:
        if um_comando:
            responde(cerebro, voz, um_comando, falando=False)
            return 0
        if falando:
            return modo_voz(cerebro, voz, cfg, estado)
        return modo_texto(cerebro, voz, cfg)
    finally:
        nav = ctx.partilha.get('navegador')
        if nav:
            try:
                nav.desliga()
            except Exception:
                pass
        voz.cale()
        diario.fechar()


if __name__ == '__main__':
    raise SystemExit(principal())
