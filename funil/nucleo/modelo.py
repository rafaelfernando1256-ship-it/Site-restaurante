"""
A PONTE PARA O MODELO

Um lugar só para falar com o modelo, para os quatro agentes não terem
cada um a sua gambiarra — e para trocar de modelo não virar quatro
mudanças.

Quatro provedores, a mesma função. O `pede_json` recebe um esquema
Pydantic e devolve uma instância validada, venha do Claude, do Gemini, do
OpenRouter ou do Groq. Quem chama não sabe de qual.

SAÍDA VALIDADA POR ESQUEMA, sempre. "Peça JSON e dê um json.loads"
funciona em 90% das vezes — e num pipeline que roda sozinho os 10%
restantes aparecem às duas da manhã, no lead que mais valia. Os dois
provedores têm saída estruturada, e é ela que está em uso:
`messages.parse` no Claude, `response_schema` no Gemini, `response_format`
nos outros dois. No Groq a maioria dos modelos só aceita `json_object`, e
aí o esquema vai escrito na instrução e o Pydantic cobra a forma.
"""
from __future__ import annotations

import base64
import json
import mimetypes
import os
import re
import time
from pathlib import Path
from typing import Any, Sequence, TypeVar

from pydantic import BaseModel

E = TypeVar('E', bound=BaseModel)

MODELO_CLAUDE = 'claude-opus-5-5'
MODELO_GEMINI = 'gemini-3.8-flash'
MODELO_OPENROUTER = ''          # vazio = escolhe do catálogo na primeira vez
MODELO_GROQ = ''                # idem

OPENROUTER = 'https://openrouter.ai/api/v1'
GROQ = 'https://api.groq.com/openai/v1'

# Ordem de preferência quando o modelo não foi escolhido à mão. Primeiro
# os que escrevem melhor em português e seguem esquema; o resto serve.
GOSTO = ('claude', 'gemini', 'gpt-4o', 'gpt-5', 'llama', 'mistral')

# O catálogo do Groq é outro: não tem Claude nem Gemini, tem os abertos.
# Kimi e gpt-oss são os que seguem esquema sem reclamar.
GOSTO_GROQ = ('kimi', 'gpt-oss', 'llama-4', 'llama-3.3', 'qwen', 'llama')

# No mesmo catálogo moram transcritor de áudio (whisper), censor
# (guard/safeguard) e modelo de voz. Pedir JSON a um desses rende 400, e
# o 400 parece erro de código quando é só modelo errado.
EVITA = ('embed', 'moderation', 'vision-only', 'whisper', 'tts', 'guard',
         'safeguard', 'rerank', 'playai')

ACEITOS = ('image/png', 'image/jpeg', 'image/gif', 'image/webp')

_claude: Any = None
_gemini: Any = None
_modelo_or: str = ''            # o que o catálogo do OpenRouter escolheu
_modelo_groq: str = ''          # idem, no Groq

TEMPORARIOS = ('APIConnectionError', 'APITimeoutError', 'RateLimitError',
               'InternalServerError', 'APIStatusError', 'OverloadedError',
               'ServerError', 'ConnectError', 'ReadTimeout')

# O nome da exceção muda entre SDKs e entre versões; o texto do erro é mais
# estável. "Sobrecarga" e "cota" passam; chave errada, não.
TEXTO_TEMPORARIO = ('UNAVAILABLE', '503', '529', 'RESOURCE_EXHAUSTED',
                    'high demand', 'overloaded', 'try again later',
                    'DEADLINE_EXCEEDED', 'INTERNAL',
                    # No plano grátis do Groq o 429 não é acidente: são 30
                    # requisições por minuto, e o funil estoura isso num
                    # lote de leads. Esperar resolve; desistir, não.
                    '429', 'rate limit', 'rate_limit', 'Too Many Requests')


def cliente_claude(chave: str = '') -> Any:
    global _claude
    if _claude is None:
        import anthropic
        _claude = anthropic.Anthropic(api_key=chave) if chave else anthropic.Anthropic()
    return _claude


def cliente_gemini(chave: str = '') -> Any:
    global _gemini
    if _gemini is None:
        from google import genai
        _gemini = genai.Client(api_key=chave) if chave else genai.Client()
    return _gemini


# compatibilidade com quem ainda chama pelo nome antigo
cliente = cliente_claude


def _tipo(caminho: Path) -> str:
    tipo = mimetypes.guess_type(caminho.name)[0] or 'image/png'
    if tipo not in ACEITOS:
        raise ValueError(f'{caminho.name}: formato que a API não aceita ({tipo})')
    return tipo


def _bloco_imagem(caminho: Path) -> dict:
    return {
        'type': 'image',
        'source': {'type': 'base64', 'media_type': _tipo(caminho),
                   'data': base64.standard_b64encode(caminho.read_bytes()).decode()},
    }


# ── Claude ──────────────────────────────────────────────────────────
def _json_claude(instrucao, conteudo, esquema, modelo, imagens, cli, max_tokens):
    c = cli or cliente_claude()
    partes: list[Any] = [_bloco_imagem(Path(i)) for i in imagens]
    partes.append({'type': 'text', 'text': conteudo})
    r = c.messages.parse(
        model=modelo or MODELO_CLAUDE, max_tokens=max_tokens, system=instrucao,
        thinking={'type': 'adaptive'}, output_format=esquema,
        messages=[{'role': 'user', 'content': partes}])
    saida = r.parsed_output
    if saida is None:
        raise RuntimeError(f'o modelo parou sem resposta (stop_reason={r.stop_reason})')
    return saida


# ── Gemini ──────────────────────────────────────────────────────────
_substituto: str = ''        # modelo achado no catálogo, quando o pedido sumiu


def modelos_gemini(cli: Any) -> list[str]:
    nomes = []
    for m in cli.models.list():
        acoes = getattr(m, 'supported_actions', None) or []
        if acoes and 'generateContent' not in acoes:
            continue
        nome = (getattr(m, 'name', '') or '').replace('models/', '')
        if nome:
            nomes.append(nome)
    return nomes


# O catálogo mistura modelos de texto com modelos de voz, imagem, vídeo e
# embedding — e vários deles declaram "generateContent" mesmo assim. Pegar
# um desses como substituto rende um 400 ("Developer instruction is not
# enabled for this model") que parece erro de código e não é.
ESPECIALIZADOS = ('tts', 'image', 'imagen', 'veo', 'embedding', 'embed', 'aqa',
                  'live', 'audio', 'rerank', 'vision', 'learnlm', 'gemma',
                  'computer-use', 'robotics', 'guard')


def _versao(nome: str) -> list[float]:
    """Ordena por número, não por letra: 10.1 vem depois de 3.8."""
    import re
    nums = re.findall(r'\d+(?:\.\d+)?', nome)
    return [float(x) for x in nums] or [0.0]


def _de_texto(nome: str) -> bool:
    baixo = nome.lower()
    return not any(marca in baixo for marca in ESPECIALIZADOS)


def _candidatos(cli: Any, atual: str = '') -> list[str]:
    """Modelos de texto que esta chave pode usar, do melhor para o pior."""
    nomes = [n for n in modelos_gemini(cli) if n != atual and _de_texto(n)]
    if not nomes:
        return []
    familia = 'pro' if 'pro' in (atual or '') else 'flash'
    primeiros = [n for n in nomes if familia in n and 'lite' not in n]
    resto = [n for n in nomes if n not in primeiros]
    return (sorted(primeiros, key=_versao, reverse=True)
            + sorted(resto, key=_versao, reverse=True))


def _melhor_gemini(cli: Any) -> str:
    """O modelo de texto mais novo que esta chave pode usar."""
    nomes = _candidatos(cli)
    if not nomes:
        raise RuntimeError('nenhum modelo de texto do Gemini disponível para esta chave')
    return nomes[0]


def _sumiu(e: Exception) -> bool:
    texto = str(e)
    return ('NOT_FOUND' in texto or 'no longer available' in texto
            or 'is not found' in texto)


def _passageiro(e: Exception) -> bool:
    texto = str(e)
    return (type(e).__name__ in TEMPORARIOS
            or any(m in texto for m in TEXTO_TEMPORARIO))


def _reserva(cli: Any, atual: str) -> list[str]:
    """
    Outros modelos que esta chave pode usar, para quando o primeiro está
    congestionado. Sobrecarga costuma ser de um modelo, não da conta — e
    esperar por um flash lotado enquanto outro está livre é tempo jogado
    fora. Devolve uma fila, não um palpite: o primeiro substituto também
    pode recusar.
    """
    try:
        return _candidatos(cli, atual)[:3]
    except Exception:
        return []


def _json_gemini(instrucao, conteudo, esquema, modelo, imagens, cli, max_tokens):
    from google.genai import types
    global _substituto
    c = cli or cliente_gemini()
    partes: list[Any] = [
        types.Part.from_bytes(data=Path(i).read_bytes(), mime_type=_tipo(Path(i)))
        for i in imagens]
    partes.append(types.Part(text=conteudo))

    config = types.GenerateContentConfig(
        system_instruction=instrucao,
        response_mime_type='application/json',
        response_schema=esquema,
        max_output_tokens=max_tokens,
        # Aqui não existe ferramenta nenhuma; declarar isso desligado tira
        # um aviso do SDK que só assusta quem está lendo a saída.
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True))

    alvo = _substituto or modelo or MODELO_GEMINI
    conteudos = [types.Content(role='user', parts=partes)]
    try:
        r = c.models.generate_content(model=alvo, contents=conteudos, config=config)
    except Exception as e:
        # Duas falhas diferentes resolvem do mesmo jeito: trocar de modelo.
        #   • o nome sumiu do catálogo (conta nova não vê modelo antigo);
        #   • o modelo está congestionado agora (503).
        # Em ambos, perguntar o que existe e refazer é melhor que desistir.
        if _sumiu(e):
            motivo = f'o modelo "{alvo}" não existe para esta chave'
        elif _passageiro(e):
            motivo = f'"{alvo}" está sobrecarregado agora'
        else:
            raise

        fila = _reserva(c, alvo)
        if not fila:
            raise
        r = ultimo = None
        for tentativa in fila:
            print(f'    ({motivo}; tentando "{tentativa}")')
            try:
                r = c.models.generate_content(model=tentativa, contents=conteudos,
                                              config=config)
                _substituto = tentativa
                print(f'    (funcionou com "{tentativa}" — '
                      f'fixe modelo_gemini = "{tentativa}" em config.toml)')
                break
            except Exception as falha:
                ultimo = falha
                continue
        if r is None:
            raise ultimo or e

    saida = getattr(r, 'parsed', None)
    if saida is None:
        # Acontece quando o modelo é cortado por limite de saída: o JSON
        # vem pela metade e o SDK não consegue validar. Dizer "não
        # respondeu" esconderia a causa.
        bruto = (getattr(r, 'text', '') or '')[:300]
        raise RuntimeError('o Gemini não devolveu o JSON esperado'
                           + (f' — veio: {bruto}' if bruto else ''))
    return saida


# ── OpenRouter e Groq: o dialeto da OpenAI ──────────────────────────
#
# Os dois falam o mesmo protocolo, então é um código só. Aqui não entra
# SDK nenhum: é HTTPS puro da biblioteca padrão, e menos uma dependência
# para quebrar.
#
# Onde eles diferem, diferem de verdade:
#
#   • OpenRouter revende Claude, GPT e Gemini. Aceita `response_format`
#     por ESQUEMA, então a forma do JSON é cobrada pela API.
#   • Groq roda modelo aberto em hardware próprio, muito rápido e com
#     plano grátis de verdade. Mas a maioria dos modelos dele NÃO aceita
#     esquema — só `json_object`. Aí o esquema vai escrito na instrução
#     e quem cobra a forma é o Pydantic, embaixo.
#
# Essa diferença é o motivo de `esquema_nativo` existir. Mandar
# `json_schema` para um modelo do Groq que não suporta dá 400 na cara.

DIALETOS: dict[str, dict[str, Any]] = {
    'openrouter': {
        'base': OPENROUTER,
        'nome': 'OpenRouter',
        'env': 'OPENROUTER_API_KEY',
        'chaves': 'openrouter.ai/keys',
        'gosto': GOSTO,
        'esquema_nativo': True,
        # O catálogo dele é cheio de modelo que lê imagem, e o modelo
        # escolhido pelo gosto quase sempre é um. Sem checagem.
        've_imagem': (),
        'max_imagens': 0,
        # O OpenRouter pede estes dois para identificar quem chama; sem
        # eles a conta funciona, mas fica sem rosto no painel dele.
        'cabecalhos': {
            'HTTP-Referer': 'https://github.com/rafaelfernando1256-ship-it/Site-restaurante',
            'X-Title': 'Funil de prospeccao',
        },
    },
    'groq': {
        'base': GROQ,
        'nome': 'Groq',
        'env': 'GROQ_API_KEY',
        'chaves': 'console.groq.com/keys',
        'gosto': GOSTO_GROQ,
        'esquema_nativo': False,
        # Aqui a checagem é obrigatória: no Groq só a família Llama 4 lê
        # imagem, e ela aceita 5 por pedido. O agente 3 manda as capturas
        # do Instagram — mandar 20 para um modelo de texto é 400 na hora.
        've_imagem': ('llama-4', 'scout', 'maverick'),
        'max_imagens': 5,
        'cabecalhos': {},
    },
}


def _fala(dialeto: dict, caminho: str, chave: str, corpo: dict | None = None,
          tempo: int = 180) -> dict:
    import urllib.error
    import urllib.request
    nome = dialeto['nome']
    req = urllib.request.Request(
        f'{dialeto["base"]}{caminho}',
        data=json.dumps(corpo).encode() if corpo is not None else None,
        headers={'Authorization': f'Bearer {chave}',
                 'Content-Type': 'application/json',
                 **dialeto['cabecalhos']},
        method='POST' if corpo is not None else 'GET')
    try:
        with urllib.request.urlopen(req, timeout=tempo) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        detalhe = e.read().decode()[:400]
        if e.code == 401:
            raise RuntimeError(f'o {nome} recusou a chave. Pegue uma em '
                               f'{dialeto["chaves"]}') from e
        if e.code == 402:
            raise RuntimeError(f'sem crédito no {nome}. Pode usar um modelo '
                               'grátis: openrouter.ai/models?q=free') from e
        if e.code == 429:
            # Esperar quanto o servidor pediu, e não um palpite. No plano
            # grátis do Groq isto chega todo dia: 30 por minuto, 1.000 por
            # dia. O texto diz "429", e é por isso que o laço de tentativas
            # trata como passageiro em vez de abortar o lote.
            espera = (getattr(e, 'headers', None) or {}).get('retry-after', '')
            quanto = f' (tente em {espera}s)' if espera else ''
            raise RuntimeError(f'{nome} 429: limite de requisições '
                               f'estourado{quanto}. {detalhe}') from e
        raise RuntimeError(f'{nome} {e.code}: {detalhe}') from e
    except urllib.error.URLError as e:
        raise RuntimeError(f'não consegui falar com o {nome} — '
                           f'confira a sua internet ({e.reason})') from e


def _or_pede(caminho: str, chave: str, corpo: dict | None = None,
             tempo: int = 180) -> dict:
    return _fala(DIALETOS['openrouter'], caminho, chave, corpo, tempo)


def _groq_pede(caminho: str, chave: str, corpo: dict | None = None,
               tempo: int = 180) -> dict:
    return _fala(DIALETOS['groq'], caminho, chave, corpo, tempo)


def _canal(provedor: str):
    """
    A função de rede do provedor. Resolvida na HORA da chamada, de
    propósito: é o que deixa o teste trocar `_or_pede` por um falso e
    rodar o caminho inteiro sem tocar na internet.
    """
    return _groq_pede if provedor == 'groq' else _or_pede


def _versao_id(nome: str) -> list[float]:
    nums = re.findall(r'\d+(?:\.\d+)?', nome)
    return [float(x) for x in nums] or [0.0]


def modelos_dialeto(chave: str, provedor: str = 'openrouter') -> list[str]:
    d = _canal(provedor)('/models', chave)
    return [m['id'] for m in d.get('data', []) if m.get('id')]


def _escolhe_dialeto(chave: str, provedor: str) -> str:
    """O melhor modelo disponível nesta chave, pela ordem de gosto."""
    dialeto = DIALETOS[provedor]
    nomes = modelos_dialeto(chave, provedor)
    if not nomes:
        raise RuntimeError(f'nenhum modelo disponível nesta chave do {dialeto["nome"]}')
    uteis = [n for n in nomes if not any(x in n.lower() for x in EVITA)]
    for marca_ in dialeto['gosto']:
        candidatos = [n for n in uteis if marca_ in n.lower()]
        if candidatos:
            # Entre os da mesma marca, o de maior versão.
            return max(candidatos, key=_versao_id)
    return (uteis or nomes)[0]


def modelo_dialeto(chave: str, preferido: str = '',
                   provedor: str = 'openrouter') -> str:
    """
    O id do modelo, perguntado ao catálogo uma vez por execução. Id de
    modelo muda de nome e desaparece nos dois provedores; fixar um na
    unha é marcar hora para o funil parar sozinho.
    """
    global _modelo_or, _modelo_groq
    if preferido:
        return preferido
    if provedor == 'groq':
        if not _modelo_groq:
            _modelo_groq = _escolhe_dialeto(chave, 'groq')
        return _modelo_groq
    if not _modelo_or:
        _modelo_or = _escolhe_dialeto(chave, 'openrouter')
    return _modelo_or


# nomes antigos, para não quebrar quem já importa
def modelos_openrouter(chave: str) -> list[str]:
    return modelos_dialeto(chave, 'openrouter')


def modelo_openrouter(chave: str, preferido: str = '') -> str:
    return modelo_dialeto(chave, preferido, 'openrouter')


def _or_partes(conteudo: str, imagens: Sequence[Path]) -> Any:
    if not imagens:
        return conteudo
    partes: list[dict] = []
    for i in imagens:
        caminho = Path(i)
        dados = base64.standard_b64encode(caminho.read_bytes()).decode()
        partes.append({'type': 'image_url',
                       'image_url': {'url': f'data:{_tipo(caminho)};base64,{dados}'}})
    partes.append({'type': 'text', 'text': conteudo})
    return partes


def _or_conversa(chave, modelo, instrucao, conteudo, imagens, max_tokens,
                 extra=None, provedor='openrouter'):
    corpo = {
        'model': modelo,
        'messages': [{'role': 'system', 'content': instrucao},
                     {'role': 'user', 'content': _or_partes(conteudo, imagens)}],
        'max_tokens': max_tokens,
    }
    corpo.update(extra or {})
    d = _canal(provedor)('/chat/completions', chave, corpo)
    escolhas = d.get('choices') or []
    if not escolhas:
        raise RuntimeError(f'o {DIALETOS[provedor]["nome"]} respondeu sem '
                           f'conteúdo: {str(d)[:200]}')
    return (escolhas[0].get('message', {}).get('content') or '').strip()


def _molde(esquema: type[BaseModel]) -> str:
    """O esquema escrito na instrução, para quem não aceita esquema na API."""
    return ('\n\nResponda SÓ com um JSON, sem cerca de código, que obedeça '
            'exatamente a este esquema:\n'
            + json.dumps(esquema.model_json_schema(), ensure_ascii=False, indent=2))


def _com_olhos(chave: str, alvo: str, imagens: Sequence[Path],
               provedor: str) -> tuple[str, list[Path]]:
    """
    Troca o modelo quando o pedido leva imagem e o escolhido não vê.

    Vale a pena ser explícito aqui porque o erro contrário é horrível de
    ler: a API devolve um 400 sobre `image_url` e quem está do outro lado
    acha que o código está quebrado, quando o que falta é um modelo com
    olhos. Melhor trocar, avisar, e seguir.
    """
    dialeto = DIALETOS[provedor]
    marcas = dialeto['ve_imagem']
    imagens = list(imagens)
    if marcas and not any(m in alvo.lower() for m in marcas):
        candidatos = [n for n in modelos_dialeto(chave, provedor)
                      if any(m in n.lower() for m in marcas)
                      and not any(x in n.lower() for x in EVITA)]
        if not candidatos:
            raise RuntimeError(
                f'nenhum modelo do {dialeto["nome"]} nesta chave lê imagem, e '
                'este passo manda as capturas do Instagram.\n'
                'Para construir o site use provedor = "gemini" (ou "claude") '
                'em config.toml; o Groq continua servindo para escrever as '
                'abordagens e triar as respostas, que são só texto.')
        alvo = max(candidatos, key=_versao_id)
        print(f'    (este passo manda imagem; usando "{alvo}")')
    teto = dialeto['max_imagens']
    if teto and len(imagens) > teto:
        print(f'    (o {dialeto["nome"]} aceita {teto} imagens por pedido; '
              f'mandando as {teto} primeiras)')
        imagens = imagens[:teto]
    return alvo, imagens


def _json_dialeto(instrucao, conteudo, esquema, modelo, imagens, cli, max_tokens,
                  provedor='openrouter'):
    dialeto = DIALETOS[provedor]
    chave = cli if isinstance(cli, str) else os.environ.get(dialeto['env'], '')
    alvo = modelo_dialeto(chave, modelo or '', provedor)
    if imagens:
        alvo, imagens = _com_olhos(chave, alvo, imagens, provedor)

    if dialeto['esquema_nativo']:
        # Pede JSON pelo esquema. `strict` fica desligado de propósito: o
        # modo estrito exige TODO campo em `required`, e vários campos
        # nossos têm padrão. O que garante a forma é o Pydantic, abaixo.
        extra = {'response_format': {
            'type': 'json_schema',
            'json_schema': {'name': esquema.__name__.lower(), 'strict': False,
                            'schema': esquema.model_json_schema()}}}
        instrucao_base = instrucao
    else:
        # O Groq aceita `json_object` em praticamente todo modelo, e
        # `json_schema` em quase nenhum. Então a API garante que é JSON
        # válido e a instrução carrega a forma.
        extra = {'response_format': {'type': 'json_object'}}
        instrucao_base = instrucao + _molde(esquema)

    aviso = ''
    for tentativa in range(2):
        bruto = _or_conversa(chave, alvo, instrucao_base + aviso, conteudo,
                             imagens, max_tokens, extra, provedor)
        texto = re.sub(r'^```[a-zA-Z]*\s*|\s*```$', '', bruto.strip())
        try:
            return esquema.model_validate_json(texto)
        except Exception as e:
            if tentativa:
                raise RuntimeError(
                    f'o modelo não devolveu o JSON esperado — veio: {texto[:200]}') from e
            # Segunda chance com o erro na mão: é o que mais resolve.
            aviso = ('\n\nA sua resposta anterior não passou na validação: '
                     f'{str(e)[:300]}\nResponda SÓ com o JSON, no formato pedido.')
    raise RuntimeError(f'o {dialeto["nome"]} não respondeu')


def _json_openrouter(instrucao, conteudo, esquema, modelo, imagens, cli, max_tokens):
    return _json_dialeto(instrucao, conteudo, esquema, modelo, imagens, cli,
                         max_tokens, 'openrouter')


def _json_groq(instrucao, conteudo, esquema, modelo, imagens, cli, max_tokens):
    return _json_dialeto(instrucao, conteudo, esquema, modelo, imagens, cli,
                         max_tokens, 'groq')


# ── o que os agentes chamam ─────────────────────────────────────────
def pede_json(instrucao: str, conteudo: str, esquema: type[E],
              modelo: str | None = None, imagens: Sequence[Path] = (),
              cli: Any = None, max_tokens: int = 8000, tentativas: int = 4,
              provedor: str = 'claude') -> E:
    """
    Instrução + conteúdo (+ imagens) → instância do esquema, validada.

    `cli` existe para teste: qualquer objeto com a interface do SDK serve,
    e aí nada sai para a rede.
    """
    faz = {'gemini': _json_gemini, 'openrouter': _json_openrouter,
           'groq': _json_groq}.get(provedor, _json_claude)
    espera = 3.0
    for t in range(tentativas):
        try:
            return faz(instrucao, conteudo, esquema, modelo, imagens, cli, max_tokens)
        except Exception as e:
            # Sobrecarga e limite de taxa passam; chave errada ou pedido
            # mal formado não melhora esperando.
            if _passageiro(e) and t < tentativas - 1:
                print(f'    (tentativa {t + 1} falhou: {str(e)[:90]} — '
                      f'esperando {espera:.0f}s)')
                time.sleep(espera)
                espera *= 2
                continue
            raise
    raise RuntimeError('o modelo não respondeu')


def pede_texto(instrucao: str, conteudo: str, modelo: str | None = None,
               cli: Any = None, max_tokens: int = 8000,
               provedor: str = 'claude') -> str:
    if provedor in DIALETOS:
        chave = (cli if isinstance(cli, str)
                 else os.environ.get(DIALETOS[provedor]['env'], ''))
        return _or_conversa(chave, modelo_dialeto(chave, modelo or '', provedor),
                            instrucao, conteudo, (), max_tokens,
                            provedor=provedor)
    if provedor == 'gemini':
        from google.genai import types
        c = cli or cliente_gemini()
        r = c.models.generate_content(
            model=modelo or MODELO_GEMINI, contents=conteudo,
            config=types.GenerateContentConfig(system_instruction=instrucao,
                                               max_output_tokens=max_tokens))
        return (getattr(r, 'text', '') or '').strip()

    c = cli or cliente_claude()
    with c.messages.stream(
        model=modelo or MODELO_CLAUDE, max_tokens=max_tokens, system=instrucao,
        thinking={'type': 'adaptive'}, messages=[{'role': 'user', 'content': conteudo}],
    ) as fluxo:
        final = fluxo.get_final_message()
    return '\n'.join(b.text for b in final.content
                     if getattr(b, 'type', '') == 'text').strip()
