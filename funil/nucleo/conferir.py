"""
O DIAGNÓSTICO — o que falta, e o que está errado sem você saber.

Existe por uma lição aprendida do jeito ruim: campo preenchido não é
chave válida. Uma chave colada pela metade, ou colada do site errado,
passa em qualquer verificação de "está vazio?" e só falha no meio do
primeiro lote — depois de você já ter esperado, e sem dizer o motivo.

Então aqui cada chave vai à rede de verdade, pelo caminho mais barato
que autentica:

  • Places API     uma busca com máscara mínima (SKU Essentials, que tem
                   10.000 chamadas grátis por mês). Não entra na cota
                   Enterprise, que é a de 1.000 e a que o caçador usa.
  • cérebro        lista de modelos no Gemini, OpenRouter e Groq;
                   `count_tokens` no Claude, que autentica e não cobra.
  • Netlify        lista das suas equipes.

E cada falha diz o que FAZER, não só que falhou. "401" não ajuda
ninguém; "a chave do Groq começa com gsk_ e essa não começa" ajuda.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

from .modelo import AGENTE_HTTP

VERDE = '\033[32m'
VERMELHO = '\033[31m'
AMARELO = '\033[33m'
CINZA = '\033[90m'
FIM = '\033[0m'


def _linha(estado: str, nome: str, detalhe: str = '') -> None:
    marca = {'ok': f'{VERDE}✓{FIM}', 'ruim': f'{VERMELHO}✗{FIM}',
             'talvez': f'{AMARELO}–{FIM}'}[estado]
    print(f'  {marca} {nome}' + (f'  {CINZA}{detalhe}{FIM}' if detalhe else ''),
          flush=True)


def _testando(o_que: str) -> None:
    if sys.stdout.isatty():
        print(f'  {CINZA}… testando {o_que}{FIM}', end='\r', flush=True)


def _limpa_linha() -> None:
    if sys.stdout.isatty():
        print(' ' * 60, end='\r')


# ── Places ──────────────────────────────────────────────────────────
def testa_places(chave: str) -> tuple[bool, str]:
    """
    Uma busca com máscara MÍNIMA. Pedir só `places.id` mantém a chamada
    no SKU Essentials (10.000 grátis por mês) em vez do Enterprise (1.000),
    que é o que o caçador gasta. Diagnóstico não deve comer a cota do
    trabalho.
    """
    if not chave:
        return False, 'falta GOOGLE_PLACES_KEY no .env'
    req = urllib.request.Request(
        'https://places.googleapis.com/v1/places:searchText',
        data=json.dumps({'textQuery': 'pizzaria em Natal, RN',
                         'languageCode': 'pt-BR', 'regionCode': 'BR',
                         'pageSize': 1}).encode(),
        headers={'Content-Type': 'application/json',
                 'X-Goog-Api-Key': chave,
                 'X-Goog-FieldMask': 'places.id',
                 'User-Agent': AGENTE_HTTP})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            d = json.loads(r.read())
        quantos = len(d.get('places', []))
        return True, f'válida · a busca de teste devolveu {quantos} lugar(es)'
    except urllib.error.HTTPError as e:
        texto = e.read().decode()[:400]
        if e.code == 403 and 'has not been used' in texto:
            return False, ('a chave existe, mas a "Places API (New)" não está '
                           'ATIVADA neste projeto. Ative em '
                           'console.cloud.google.com → APIs e Serviços → '
                           'Biblioteca → "Places API (New)" → Ativar')
        if e.code == 403 and 'blocked' in texto.lower():
            return False, ('a chave está restrita e não permite esta API. Em '
                           'Credenciais → sua chave → Restrições de API, '
                           'inclua "Places API (New)"')
        if e.code in (400, 403) and 'API key not valid' in texto:
            return False, ('O GOOGLE RECUSOU A CHAVE. Confira se copiou '
                           'inteira, sem espaço, em console.cloud.google.com '
                           '→ Credenciais')
        if e.code == 429:
            return False, 'passou da cota de hoje — a chave vale, a cota não'
        return False, f'{e.code}: {texto[:200]}'
    except urllib.error.URLError as e:
        return False, f'não consegui falar com o Google ({e.reason})'


# ── cérebro ─────────────────────────────────────────────────────────
def testa_cerebro(cfg) -> tuple[bool, str]:
    prov = cfg.provedor
    if prov in ('openrouter', 'groq'):
        chave = getattr(cfg, prov)
        if prov == 'groq' and chave and not chave.strip().startswith('gsk_'):
            return False, ('uma chave do Groq começa com gsk_ — essa não '
                           'começa. Pegue em console.groq.com/keys')
        if prov == 'openrouter' and chave and not chave.strip().startswith('sk-or-'):
            return False, ('uma chave do OpenRouter começa com sk-or- — essa '
                           'não começa. Pegue em openrouter.ai/keys')
        try:
            from .modelo import modelo_dialeto, modelos_dialeto
            nomes = modelos_dialeto(chave, prov)
            if not nomes:
                return False, 'a chave respondeu, mas sem nenhum modelo'
            alvo = modelo_dialeto(chave, getattr(cfg, f'modelo_{prov}', ''), prov)
            return True, f'válida · {len(nomes)} modelos · usando {alvo}'
        except Exception as e:
            return False, str(e)[:220]

    if prov == 'gemini':
        if not cfg.gemini:
            return False, 'falta GEMINI_API_KEY no .env'
        try:
            from google import genai      # noqa: F401
        except ImportError:
            return False, 'falta instalar: python -m pip install google-genai'
        try:
            # modelos_gemini direto, e NÃO o resolvedor: o resolvedor
            # engole a exceção de propósito, e engolir aqui faria uma
            # chave falsa passar por válida. Esse bug já aconteceu.
            from .modelo import cliente_gemini, modelos_gemini
            nomes = modelos_gemini(cliente_gemini(cfg.gemini))
            if not nomes:
                return False, 'a chave respondeu, mas sem nenhum modelo'
            return True, f'válida · {len(nomes)} modelos disponíveis'
        except Exception as e:
            texto = str(e)
            if 'API_KEY_INVALID' in texto or 'API key not valid' in texto:
                return False, ('O GOOGLE RECUSOU A CHAVE. Pegue uma em '
                               'aistudio.google.com/apikey e cole inteira')
            return False, f'{type(e).__name__}: {texto[:180]}'

    # Claude
    chave = (cfg.anthropic or '').strip()
    if not chave:
        return False, 'falta ANTHROPIC_API_KEY no .env'
    if chave.startswith('sk-ant-usr-') or chave.startswith('sk-ant-oat'):
        return False, ('isso é um token do claude.ai, não chave de API. A da '
                       'API começa com sk-ant-api03- e sai de '
                       'console.anthropic.com → API Keys (outro site)')
    if not chave.startswith('sk-ant-'):
        return False, 'uma chave da Anthropic começa com sk-ant- — essa não'
    try:
        import anthropic
        anthropic.Anthropic(api_key=chave).messages.count_tokens(
            model=cfg.modelo, messages=[{'role': 'user', 'content': 'oi'}])
        return True, 'válida'
    except Exception as e:
        texto = str(e).lower()
        if 'authentication' in texto or '401' in texto:
            return False, ('A ANTHROPIC RECUSOU A CHAVE. Confira em '
                           'console.anthropic.com → API Keys')
        if 'credit' in texto or 'billing' in texto:
            return False, 'a chave vale, mas a conta está sem crédito'
        return False, f'{type(e).__name__}: {str(e)[:180]}'


# ── Netlify ─────────────────────────────────────────────────────────
def testa_netlify(cfg) -> tuple[bool, str]:
    if not cfg.netlify:
        return False, ('falta NETLIFY_TOKEN no .env · '
                       'app.netlify.com/user/applications')
    try:
        from .a4_entrega import equipes
        times = equipes(cfg.netlify)
    except Exception as e:
        return False, str(e)[:220]
    slugs = [t.get('slug', '') for t in times]
    if not slugs:
        return False, 'o token vale, mas nenhuma equipe apareceu'
    if cfg.equipe_netlify not in slugs:
        return False, (f'o token vale, mas a equipe "{cfg.equipe_netlify}" não '
                       f'está entre as suas: {", ".join(slugs)}.\n'
                       '      Corrija equipe_netlify em config.toml')
    return True, f'válido · equipe "{cfg.equipe_netlify}" encontrada'


# ── navegador ───────────────────────────────────────────────────────
def testa_navegador() -> tuple[str, str]:
    """
    Playwright serve ao Instagram (agente 3) e ao WhatsApp Web (a vigia).
    Sem ele os dois ainda funcionam, só não sozinhos — e é isso que a
    mensagem precisa dizer, em vez de parecer instalação quebrada.
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return 'talvez', ('não instalado — o agente tira print do Instagram e '
                          'lê o WhatsApp com ele. Sem isso: python -m pip install '
                          'playwright && python -m playwright install chromium')
    try:
        with sync_playwright() as p:
            nav = p.chromium.launch(headless=True)
            nav.close()
        return 'ok', 'Chromium abre'
    except Exception as e:
        return 'talvez', (f'instalado, mas o Chromium não abre: {str(e)[:120]}'
                          ' · rode: python -m playwright install chromium')


# ── a função ────────────────────────────────────────────────────────
def testa_fotos() -> tuple[str, str]:
    """
    A prévia usa o acervo de fotos do projeto `conteudo`. Sem chave ela
    sai com uma capa de CSS — o que é aceitável e proposital, mas tem
    que estar ESCRITO aqui. Sair sem foto e sem explicação é o jeito
    mais fácil de você achar que o gerador está quebrado.
    """
    import sys as _sys
    raiz = Path(__file__).resolve().parent.parent.parent / 'conteudo'
    if not (raiz / 'motor' / 'imagens.py').exists():
        return 'talvez', (f'não achei {raiz} — a prévia sai com capa de '
                         'CSS em vez de foto')
    if str(raiz) not in _sys.path:
        _sys.path.insert(0, str(raiz))
    try:
        from motor import imagens
    except Exception as e:
        return 'talvez', f'não consegui carregar o acervo ({e}) — capa de CSS'
    tem = imagens.chaves_configuradas()
    if not tem:
        return 'talvez', ('nenhuma chave de foto — a prévia sai com capa de '
                         'CSS. Para ter foto, ponha PIXABAY_API_KEY ou '
                         'UNSPLASH_ACCESS_KEY no .env (deste projeto ou do '
                         'conteudo)')
    return 'ok', ', '.join(tem) + ' — a capa da prévia sai com foto'


def confere(cfg, com_rede: bool = True) -> int:
    """Devolve 0 quando dá para trabalhar, 1 quando falta o essencial."""
    print(f'\n  FUNIL — diagnóstico\n')
    print(f'  Python {sys.version.split()[0]} · cérebro: {cfg.provedor} '
          f'({cfg.modelo_do_cerebro})', flush=True)
    print(f'  banco de dados: {cfg.banco}', flush=True)
    print(f'  cidade padrão: {cfg.cidade or "(não definida)"}\n', flush=True)

    if not com_rede:
        chave_cerebro = {'gemini': cfg.gemini, 'openrouter': cfg.openrouter,
                         'groq': cfg.groq}.get(cfg.provedor, cfg.anthropic)
        var_cerebro = {'gemini': 'GEMINI_API_KEY',
                       'openrouter': 'OPENROUTER_API_KEY',
                       'groq': 'GROQ_API_KEY'}.get(cfg.provedor,
                                                   'ANTHROPIC_API_KEY')
        for nome, valor, var in (
                ('Places API', cfg.google_places, 'GOOGLE_PLACES_KEY'),
                (f'cérebro ({cfg.provedor})', chave_cerebro, var_cerebro),
                ('Netlify', cfg.netlify, 'NETLIFY_TOKEN')):
            _linha('ok' if valor else 'ruim', nome,
                   'preenchida' if valor else f'falta {var} no .env')
        # O acervo de foto não precisa de rede para ser conferido: a
        # pergunta é se existe chave, não se o site responde.
        estado, detalhe = testa_fotos()
        _linha(estado, 'acervo de fotos (capa da prévia)', detalhe)
        print('\n  (modo --seco: só olhei se está preenchido. Sem --seco eu '
              'testo as chaves de verdade.)\n')
        return 0

    essencial_falhou = False

    _testando('a chave da Places API')
    bem, detalhe = testa_places(cfg.google_places)
    _limpa_linha()
    _linha('ok' if bem else 'ruim', 'Places API (agente 1 — achar leads)', detalhe)
    essencial_falhou |= not bem

    _testando(f'a chave do {cfg.provedor}')
    bem, detalhe = testa_cerebro(cfg)
    _limpa_linha()
    _linha('ok' if bem else 'ruim',
           f'cérebro: {cfg.provedor} (agentes 2, 3 e 4)', detalhe)
    essencial_falhou |= not bem

    _testando('o token da Netlify')
    bem, detalhe = testa_netlify(cfg)
    _limpa_linha()
    _linha('ok' if bem else 'ruim', 'Netlify (agente 4 — publicar)', detalhe)
    publicar_falhou = not bem

    estado, detalhe = testa_navegador()
    _linha(estado, 'navegador (Instagram e WhatsApp Web)', detalhe)

    estado, detalhe = testa_fotos()
    _linha(estado, 'acervo de fotos (capa da prévia)', detalhe)

    # As chaves dos OUTROS provedores. Valem como reserva: se o seu cair
    # (503, cota, modelo aposentado), trocar é uma linha em config.toml.
    donos = {'claude': 'Claude', 'gemini': 'Gemini',
             'openrouter': 'OpenRouter', 'groq': 'Groq'}
    chaves = {'claude': cfg.anthropic, 'gemini': cfg.gemini,
              'openrouter': cfg.openrouter, 'groq': cfg.groq}
    guardadas = [donos[p] for p, v in chaves.items()
                 if v and p != cfg.provedor]
    if guardadas:
        _linha('ok', 'chaves de reserva', ', '.join(guardadas)
               + ' — se o seu provedor cair, troque em config.toml')

    print()
    if essencial_falhou:
        print(f'  {VERMELHO}Falta o essencial.{FIM} Resolva as linhas com ✗ '
              'acima e rode de novo.\n')
        return 1
    if publicar_falhou:
        print(f'  {AMARELO}Dá para trabalhar até construir o site; publicar '
              f'ainda não.{FIM}')
        print('  Os agentes 1, 2 e 3 estão prontos.\n')
        return 0
    print(f'  {VERDE}Tudo pronto.{FIM} O ciclo inteiro roda:\n')
    print('    python3 funil.py cacar --cidade "'
          + (cfg.cidade or 'Natal, RN') + '"')
    print('    python3 funil.py escrever')
    print('    python3 funil.py revisar')
    print('    python3 funil.py enviar --abrir\n')
    return 0
