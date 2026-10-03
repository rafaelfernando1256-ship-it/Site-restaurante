#!/usr/bin/env python3
"""
TESTES — rode com: python3 testes.py

Nada aqui toca a rede. O cliente do Claude, a API da Netlify e o Claude
Code entram como dublê, porque o que precisa de teste é a LÓGICA: a
máquina de estados, o classificador de presença, o briefing que proíbe
inventar, o zip com o index na raiz, e o fato de nenhuma mensagem sair
sem você aprovar.
"""
from __future__ import annotations

import json
import shutil
import pathlib
import tempfile
import traceback
import types
import zipfile
from pathlib import Path

from nucleo import a1_cacador as a1, a2_abordagem as a2, a3_estudio as a3, a4_entrega as a4
from nucleo import config, modelo as M
from nucleo.estado import (Estado, Lead, TransicaoInvalida, NOVO, RASCUNHO, ABORDADO,
                           RESPONDEU, QUER_DEMO, DEMO_PRONTA, PUBLICADO, SEM_INTERESSE,
                           DESCARTADO, FECHADO)

CASOS: list[tuple[str, callable]] = []
TMP = Path(tempfile.mkdtemp(prefix='funil-testes-'))


def teste(nome):
    def envolve(f):
        CASOS.append((nome, f))
        return f
    return envolve


def igual(a, b, o_que=''):
    if a != b:
        raise AssertionError(f'{o_que or "valor"}: esperava {b!r}, veio {a!r}')


def verdade(x, o_que=''):
    if not x:
        raise AssertionError(o_que or 'esperava verdadeiro')


def banco(nome='t') -> Estado:
    caminho = TMP / f'{nome}-{len(list(TMP.glob("*.db")))}.db'
    return Estado(caminho)


def cfg_falso(**extra):
    c = config.Config(anthropic='x', netlify='y', google_places='z',
                      banco=TMP / 'cfg.db', saida=TMP / 'saida',
                      material=TMP / 'material')
    for k, v in extra.items():
        setattr(c, k, v)
    return c


def duble(**campos):
    """Cliente falso do Claude: devolve o esquema pedido com estes campos."""
    class Msgs:
        def parse(self, **kw):
            return types.SimpleNamespace(
                parsed_output=kw['output_format'](**campos), stop_reason='end_turn')
    return types.SimpleNamespace(messages=Msgs())


def lead_exemplo(est: Estado, **extra) -> Lead:
    campos = dict(place_id=f'p{extra.pop("n", 1)}', nome='Cantina da Vó Zuleica',
                  cidade='Natal, RN', telefone='(84) 98888-7777',
                  telefone_e164='5584988887777', instagram='cantinadavo',
                  categoria='Restaurante', nota=4.6, avaliacoes=180,
                  presenca='so_rede', url_achada='https://instagram.com/cantinadavo',
                  pontuacao=9)
    campos.update(extra)
    i, _ = est.guarda_lead(**campos)
    return est.lead(i)


# ── Estado ──────────────────────────────────────────────────────────
@teste('estado: upsert pelo place_id não duplica')
def _():
    est = banco()
    i1, novo1 = est.guarda_lead(place_id='abc', nome='A', cidade='X')
    i2, novo2 = est.guarda_lead(place_id='abc', nome='A renomeado', cidade='X')
    igual((novo1, novo2), (True, False))
    igual(i1, i2)
    igual(est.lead(i1).nome, 'A renomeado')
    igual(len(est.leads()), 1)


@teste('estado: transição válida anda e registra evento')
def _():
    est = banco()
    l = lead_exemplo(est)
    est.move(l.id, RASCUNHO, 'a2')
    est.move(l.id, ABORDADO, 'a2')
    igual([(e['de'], e['para']) for e in est.historico(l.id)],
          [('novo', 'rascunho'), ('rascunho', 'abordado')])


@teste('estado: pular etapa é recusado, não corrige em silêncio')
def _():
    est = banco()
    l = lead_exemplo(est)
    try:
        est.move(l.id, PUBLICADO, 'a4')
    except TransicaoInvalida as e:
        verdade('novo' in str(e), 'a mensagem diz de onde o lead está vindo')
        igual(est.lead(l.id).estado, NOVO, 'e o lead não se mexeu')
        return
    raise AssertionError('deixou pular de novo para publicado')


@teste('estado: fechado é fim de linha')
def _():
    est = banco()
    l = lead_exemplo(est)
    for p in (RASCUNHO, ABORDADO, RESPONDEU, QUER_DEMO, DEMO_PRONTA, PUBLICADO, FECHADO):
        est.move(l.id, p, 't')
    try:
        est.move(l.id, DESCARTADO, 't')
    except TransicaoInvalida:
        return
    raise AssertionError('saiu de fechado')


@teste('estado: descartado volta para novo (lead reaproveitado)')
def _():
    est = banco()
    l = lead_exemplo(est)
    est.move(l.id, DESCARTADO, 't')
    est.move(l.id, NOVO, 't')
    igual(est.lead(l.id).estado, NOVO)


@teste('estado: slug tira acento em vez de comer a letra')
def _():
    f = lambda n: Lead(id=3, place_id='x', nome=n, estado=NOVO).slug
    igual(f('Cantina da Vó Zuleica & Cia'), 'cantina-da-vo-zuleica-cia-3')
    igual(f('Açaí do João'), 'acai-do-joao-3')
    igual(f('  '), 'lead-3')


@teste('estado: histórico de mensagens não é sobrescrito')
def _():
    est = banco()
    l = lead_exemplo(est)
    est.guarda_mensagem(l.id, 'abordagem', 'primeira')
    est.guarda_mensagem(l.id, 'retorno', 'pode mandar')
    est.guarda_mensagem(l.id, 'entrega', 'olha o link')
    igual([m['tipo'] for m in est.mensagens(lead_id=l.id)],
          ['abordagem', 'retorno', 'entrega'])


@teste('estado: resumo conta por estado')
def _():
    est = banco()
    a = lead_exemplo(est, n=1)
    b = lead_exemplo(est, n=2)
    est.move(b.id, RASCUNHO, 't')
    igual(est.resumo(), {'novo': 1, 'rascunho': 1})


# ── Agente 1 ────────────────────────────────────────────────────────
@teste('a1: classifica presença nos quatro grupos')
def _():
    igual(a1.classifica(''), 'sem_presenca')
    igual(a1.classifica('https://www.instagram.com/casadofrango/'), 'so_rede')
    igual(a1.classifica('https://linktr.ee/boteco'), 'so_rede')
    igual(a1.classifica('https://www.facebook.com/pizzaria'), 'so_rede')
    igual(a1.classifica('https://www.ifood.com.br/delivery/natal/tal'), 'so_delivery')
    igual(a1.classifica('https://pedido.anota.ai/loja/x'), 'so_delivery')
    igual(a1.classifica('https://restaurantefulano.com.br'), 'tem_site')


@teste('a1: tira o @ do Instagram e recusa link de post')
def _():
    igual(a1.instagram_de('https://www.instagram.com/graodouradocoffee/'),
          'graodouradocoffee')
    igual(a1.instagram_de('https://instagram.com/mega.express_hotel?igsh=abc'),
          'mega.express_hotel')
    igual(a1.instagram_de('https://www.instagram.com/p/C9xYz/'), '')
    igual(a1.instagram_de('https://www.instagram.com/reel/C9xYz/'), '')
    igual(a1.instagram_de('https://www.ifood.com.br/x'), '')
    igual(a1.instagram_de(''), '')


@teste('a1: e164 deixa só dígito')
def _():
    igual(a1.e164('+55 84 98765-4321'), '5584987654321')
    igual(a1.e164(''), '')


@teste('a1: pontua prefere quem tem rede e movimento')
def _():
    muita = {'userRatingCount': 400, 'rating': 4.7, 'nationalPhoneNumber': '1'}
    pouca = {'userRatingCount': 3, 'rating': 3.0}
    verdade(a1.pontua(muita, 'so_rede') > a1.pontua(muita, 'sem_presenca'),
            'rede social vale mais que nada')
    verdade(a1.pontua(muita, 'so_rede') > a1.pontua(pouca, 'so_rede'),
            'movimento conta')
    igual(a1.pontua(muita, 'so_rede'), 10, 'teto é 10')
    igual(a1.pontua({**muita, 'businessStatus': 'CLOSED_PERMANENTLY'}, 'so_rede'), 0,
          'casa fechada é zero, não lead')


# ── A ponte para o modelo ───────────────────────────────────────────
class FalsoGemini:
    """Imita o generate_content do google-genai."""

    def __init__(self, devolve):
        self.devolve = devolve
        self.chamadas: list[dict] = []
        self.models = self

    def generate_content(self, **kw):
        self.chamadas.append(kw)
        return types.SimpleNamespace(parsed=self.devolve, text='{"x": 1}')


@teste('modelo: o provedor decide o caminho, e o esquema vai junto')
def _():
    from nucleo.a2_abordagem import Abordagem
    esperado = Abordagem(gancho='g', mensagem='m', porque='p')
    cli = FalsoGemini(esperado)
    r = M.pede_json('instrução', 'conteúdo', Abordagem, modelo='gemini-x',
                    cli=cli, provedor='gemini')
    igual(r, esperado)
    kw = cli.chamadas[0]
    igual(kw['model'], 'gemini-x')
    cfg = kw['config']
    igual(cfg.system_instruction, 'instrução', 'a instrução precisa ir como sistema')
    igual(cfg.response_mime_type, 'application/json')
    igual(cfg.response_schema, Abordagem, 'sem esquema a saída não é validada')


@teste('modelo: modelo aposentado pela Google é trocado sozinho, não derruba')
def _():
    from nucleo.a2_abordagem import Abordagem
    import nucleo.modelo as Mod
    esperado = Abordagem(gancho='g', mensagem='m', porque='p')

    class Catalogo:
        def list(self):
            return [types.SimpleNamespace(name='models/gemini-3.8-flash',
                                          supported_actions=['generateContent']),
                    types.SimpleNamespace(name='models/gemini-2.0-flash',
                                          supported_actions=['generateContent']),
                    types.SimpleNamespace(name='models/embedding-001',
                                          supported_actions=['embedContent'])]

    class Cli:
        def __init__(self):
            self.pedidos = []
            self.models = self
            self._lista = Catalogo()

        def list(self):
            return self._lista.list()

        def generate_content(self, **kw):
            self.pedidos.append(kw['model'])
            if kw['model'] == 'gemini-velho':
                raise RuntimeError("404 NOT_FOUND: model models/gemini-velho is "
                                   "no longer available to new users")
            return types.SimpleNamespace(parsed=esperado, text='{}')

    Mod._substituto = ''
    try:
        cli = Cli()
        r = Mod.pede_json('i', 'c', Abordagem, modelo='gemini-velho', cli=cli,
                          provedor='gemini', tentativas=1)
        igual(r, esperado, 'devia ter respondido com o modelo substituto')
        igual(cli.pedidos, ['gemini-velho', 'gemini-3.8-flash'],
              f'escolheu mal o substituto: {cli.pedidos}')
    finally:
        Mod._substituto = ''


@teste('modelo: a troca de modelo vale para as chamadas seguintes')
def _():
    import nucleo.modelo as Mod
    Mod._substituto = ''
    try:
        igual(Mod._melhor_gemini(types.SimpleNamespace(models=types.SimpleNamespace(
            list=lambda: [types.SimpleNamespace(name='models/gemini-3.8-flash',
                                                supported_actions=['generateContent']),
                          types.SimpleNamespace(name='models/gemini-10.1-flash',
                                                supported_actions=['generateContent'])]))),
              'gemini-10.1-flash', 'tem que pegar a versão maior, não a alfabética')
    finally:
        Mod._substituto = ''


@teste('modelo: sobrecarga de um modelo cai para outro em vez de desistir')
def _():
    from nucleo.a2_abordagem import Abordagem
    import nucleo.modelo as Mod
    esperado = Abordagem(gancho='g', mensagem='m', porque='p')

    class Cli:
        def __init__(self):
            self.pedidos = []
            self.models = self

        def list(self):
            # O catálogo de verdade é assim: texto misturado com voz e imagem.
            return [types.SimpleNamespace(name=f'models/{n}',
                                          supported_actions=['generateContent'])
                    for n in ('gemini-3.8-flash', 'gemini-3.8-flash-tts',
                              'gemini-3.8-flash-image', 'gemini-3.2-flash',
                              'gemini-3.8-pro', 'gemini-2.0-flash-lite')]

        def generate_content(self, **kw):
            self.pedidos.append(kw['model'])
            if kw['model'] == 'gemini-3.8-flash':
                raise RuntimeError("503 UNAVAILABLE: {'message': 'This model is "
                                   "currently experiencing high demand.'}")
            return types.SimpleNamespace(parsed=esperado, text='{}')

    Mod._substituto = ''
    try:
        cli = Cli()
        r = Mod.pede_json('i', 'c', Abordagem, modelo='gemini-3.8-flash', cli=cli,
                          provedor='gemini', tentativas=1)
        igual(r, esperado)
        igual(cli.pedidos, ['gemini-3.8-flash', 'gemini-3.2-flash'],
              f'devia trocar por outro flash: {cli.pedidos}')
    finally:
        Mod._substituto = ''


@teste('modelo: nunca cai num modelo de voz ou de imagem')
def _():
    import types as _t

    import nucleo.modelo as Mod
    catalogo = _t.SimpleNamespace(models=_t.SimpleNamespace(list=lambda: [
        _t.SimpleNamespace(name=f'models/{n}', supported_actions=['generateContent'])
        for n in ('gemini-3.8-flash', 'gemini-3.8-flash-tts',
                  'gemini-3.8-flash-image', 'gemini-3.8-flash-live',
                  'text-embedding-004', 'veo-3.0-generate', 'imagen-4.0',
                  'gemma-3-27b-it', 'gemini-3.2-flash')]))
    fila = Mod._candidatos(catalogo, 'gemini-3.8-flash')
    for ruim in ('tts', 'image', 'live', 'embedding', 'veo', 'imagen', 'gemma'):
        verdade(not any(ruim in n for n in fila),
                f'a fila trouxe um modelo de {ruim}: {fila}')
    igual(fila[0], 'gemini-3.2-flash')


@teste('modelo: se o primeiro substituto recusar, tenta o seguinte')
def _():
    from nucleo.a2_abordagem import Abordagem
    import nucleo.modelo as Mod
    esperado = Abordagem(gancho='g', mensagem='m', porque='p')

    class Cli:
        def __init__(self):
            self.pedidos = []
            self.models = self

        def list(self):
            return [types.SimpleNamespace(name=f'models/{n}',
                                          supported_actions=['generateContent'])
                    for n in ('gemini-3.8-flash', 'gemini-3.5-flash',
                              'gemini-3.2-flash')]

        def generate_content(self, **kw):
            self.pedidos.append(kw['model'])
            if kw['model'] == 'gemini-3.8-flash':
                raise RuntimeError('503 UNAVAILABLE: high demand')
            if kw['model'] == 'gemini-3.5-flash':
                raise RuntimeError('400 INVALID_ARGUMENT: Developer instruction '
                                   'is not enabled for this model')
            return types.SimpleNamespace(parsed=esperado, text='{}')

    Mod._substituto = ''
    try:
        cli = Cli()
        r = Mod.pede_json('i', 'c', Abordagem, modelo='gemini-3.8-flash', cli=cli,
                          provedor='gemini', tentativas=1)
        igual(r, esperado)
        igual(cli.pedidos, ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.2-flash'],
              f'não percorreu a fila: {cli.pedidos}')
    finally:
        Mod._substituto = ''


@teste('modelo: erro de chave NÃO é tratado como sobrecarga')
def _():
    from nucleo.a2_abordagem import Abordagem
    import nucleo.modelo as Mod

    class Cli:
        def __init__(self):
            self.tentativas = 0
            self.models = self

        def list(self):
            return []

        def generate_content(self, **kw):
            self.tentativas += 1
            raise RuntimeError('400 INVALID_ARGUMENT: API key not valid')

    Mod._substituto = ''
    cli = Cli()
    try:
        Mod.pede_json('i', 'c', Abordagem, cli=cli, provedor='gemini', tentativas=4)
    except RuntimeError as e:
        verdade('API key not valid' in str(e))
        igual(cli.tentativas, 1, 'insistiu numa chave errada')
        return
    finally:
        Mod._substituto = ''
    raise AssertionError('não propagou o erro de chave')


@teste('openrouter: escolhe o melhor modelo do catálogo pela ordem de gosto')
def _():
    import nucleo.modelo as Mod
    original = Mod._or_pede
    Mod._or_pede = lambda caminho, chave, corpo=None, tempo=180: {'data': [
        {'id': 'meta-llama/llama-3.1-8b'},
        {'id': 'anthropic/claude-sonnet-4.5'},
        {'id': 'anthropic/claude-haiku-3'},
        {'id': 'google/gemini-2.0-flash'},
    ]}
    Mod._modelo_or = ''
    try:
        igual(Mod.modelo_openrouter('k'), 'anthropic/claude-sonnet-4.5')
        # escolhido à mão sempre vence
        igual(Mod.modelo_openrouter('k', 'openai/gpt-4o'), 'openai/gpt-4o')
    finally:
        Mod._or_pede = original
        Mod._modelo_or = ''


@teste('openrouter: devolve o esquema validado e insiste quando o JSON vem torto')
def _():
    from nucleo.a2_abordagem import Abordagem
    import nucleo.modelo as Mod
    pedidos = []

    def falso(caminho, chave, corpo=None, tempo=180):
        if caminho == '/models':
            return {'data': [{'id': 'anthropic/claude-sonnet-4.5'}]}
        pedidos.append(corpo)
        texto = ('nao e json' if len(pedidos) == 1
                 else '{"gancho":"g","mensagem":"m","porque":"p"}')
        return {'choices': [{'message': {'content': texto}}]}

    original, Mod._or_pede = Mod._or_pede, falso
    Mod._modelo_or = ''
    try:
        r = Mod.pede_json('instrução', 'conteúdo', Abordagem, cli='sk-or-x',
                          provedor='openrouter', tentativas=1)
        igual(r.gancho, 'g')
        igual(len(pedidos), 2, 'não tentou de novo depois do JSON torto')
        verdade('não passou na validação' in pedidos[1]['messages'][0]['content'],
                'a segunda tentativa precisa dizer o que deu errado')
        verdade(pedidos[0]['response_format']['type'] == 'json_schema',
                'tem que pedir JSON pelo esquema')
    finally:
        Mod._or_pede = original
        Mod._modelo_or = ''


@teste('openrouter: chave errada e falta de crédito falam português')
def _():
    import urllib.error
    import io
    import nucleo.modelo as Mod

    def erro(codigo):
        def falso(*a, **k):
            raise urllib.error.HTTPError('u', codigo, 'x', {}, io.BytesIO(b'{}'))
        return falso

    import urllib.request
    original = urllib.request.urlopen
    try:
        for codigo, pedaco in ((401, 'recusou a chave'), (402, 'sem crédito')):
            urllib.request.urlopen = erro(codigo)
            try:
                Mod._or_pede('/models', 'k')
            except RuntimeError as e:
                verdade(pedaco in str(e), f'{codigo}: {e}')
            else:
                raise AssertionError(f'{codigo} não virou erro')
    finally:
        urllib.request.urlopen = original


@teste('openrouter: imagem vai como data URL, do jeito que a API espera')
def _():
    import nucleo.modelo as Mod
    foto = TMP / 'or.png'
    foto.write_bytes(b'\x89PNG\r\n\x1a\n' + b'0' * 30)
    partes = Mod._or_partes('texto', [foto])
    igual(len(partes), 2)
    igual(partes[0]['type'], 'image_url')
    verdade(partes[0]['image_url']['url'].startswith('data:image/png;base64,'))
    igual(partes[1]['text'], 'texto')
    igual(Mod._or_partes('só texto', []), 'só texto')


@teste('groq: escolhe modelo de texto do catálogo e pula whisper e guard')
def _():
    import nucleo.modelo as Mod
    original = Mod._groq_pede
    Mod._groq_pede = lambda caminho, chave, corpo=None, tempo=180: {'data': [
        {'id': 'whisper-large-v3'},
        {'id': 'meta-llama/llama-guard-4-12b'},
        {'id': 'llama-3.1-8b-instant'},
        {'id': 'llama-3.3-70b-versatile'},
        {'id': 'moonshotai/kimi-k2-instruct-0905'},
        {'id': 'playai-tts'},
    ]}
    Mod._modelo_groq = ''
    try:
        # kimi vem antes na ordem de gosto do Groq
        igual(Mod.modelo_dialeto('gsk_x', provedor='groq'),
              'moonshotai/kimi-k2-instruct-0905')
        # escolhido à mão sempre vence
        igual(Mod.modelo_dialeto('gsk_x', 'llama-3.1-8b-instant', 'groq'),
              'llama-3.1-8b-instant')
    finally:
        Mod._groq_pede = original
        Mod._modelo_groq = ''


@teste('groq: pede json_object e leva o esquema na instrução')
def _():
    from nucleo.a2_abordagem import Abordagem
    import nucleo.modelo as Mod
    pedidos = []

    def falso(caminho, chave, corpo=None, tempo=180):
        if caminho == '/models':
            return {'data': [{'id': 'llama-3.3-70b-versatile'}]}
        pedidos.append(corpo)
        return {'choices': [{'message': {
            'content': '{"gancho":"g","mensagem":"m","porque":"p"}'}}]}

    original, Mod._groq_pede = Mod._groq_pede, falso
    Mod._modelo_groq = ''
    try:
        r = Mod.pede_json('instrução', 'conteúdo', Abordagem, cli='gsk_x',
                          provedor='groq', tentativas=1)
        igual(r.gancho, 'g')
        # a maioria dos modelos do Groq não aceita json_schema: mandar
        # esquema ali é 400, e é esse erro que este teste trava.
        igual(pedidos[0]['response_format']['type'], 'json_object')
        sistema = pedidos[0]['messages'][0]['content']
        verdade('"gancho"' in sistema,
                'sem esquema na API, a forma tem que ir na instrução')
    finally:
        Mod._groq_pede = original
        Mod._modelo_groq = ''


@teste('groq: imagem troca para um modelo com olhos e respeita o teto de 5')
def _():
    import nucleo.modelo as Mod
    foto = TMP / 'groq.png'
    foto.write_bytes(b'\x89PNG\r\n\x1a\n' + b'0' * 30)

    def falso(caminho, chave, corpo=None, tempo=180):
        return {'data': [
            {'id': 'llama-3.3-70b-versatile'},
            {'id': 'meta-llama/llama-4-scout-17b-16e-instruct'},
        ]}

    original, Mod._groq_pede = Mod._groq_pede, falso
    try:
        alvo, imagens = Mod._com_olhos('gsk_x', 'llama-3.3-70b-versatile',
                                       [foto] * 9, 'groq')
        verdade('llama-4' in alvo, f'trocou para um modelo sem olhos: {alvo}')
        igual(len(imagens), 5, 'o Groq aceita 5 imagens por pedido')
        # quem já vê imagem fica onde está
        alvo2, _ = Mod._com_olhos('gsk_x', 'meta-llama/llama-4-scout-17b-16e-instruct',
                                  [foto], 'groq')
        igual(alvo2, 'meta-llama/llama-4-scout-17b-16e-instruct')
    finally:
        Mod._groq_pede = original


@teste('groq: sem nenhum modelo com olhos, diz o que fazer em vez de dar 400')
def _():
    import nucleo.modelo as Mod
    foto = TMP / 'groq2.png'
    foto.write_bytes(b'\x89PNG\r\n\x1a\n' + b'0' * 30)
    original = Mod._groq_pede
    Mod._groq_pede = lambda *a, **k: {'data': [{'id': 'llama-3.1-8b-instant'}]}
    try:
        Mod._com_olhos('gsk_x', 'llama-3.1-8b-instant', [foto], 'groq')
    except RuntimeError as e:
        verdade('gemini' in str(e).lower(), f'tem que dizer a saída: {e}')
        return
    finally:
        Mod._groq_pede = original
    raise AssertionError('deixou passar um modelo sem olhos')


@teste('groq: o 429 do plano grátis é passageiro, e a chave errada não é')
def _():
    import io
    import urllib.error
    import urllib.request
    import nucleo.modelo as Mod

    def erro(codigo, cabecalhos=None):
        def falso(*a, **k):
            raise urllib.error.HTTPError('u', codigo, 'x', cabecalhos or {},
                                         io.BytesIO(b'{}'))
        return falso

    original = urllib.request.urlopen
    try:
        urllib.request.urlopen = erro(429, {'retry-after': '12'})
        try:
            Mod._groq_pede('/models', 'gsk_x')
        except RuntimeError as e:
            verdade('tente em 12s' in str(e), f'tem que repassar o retry-after: {e}')
            verdade(Mod._passageiro(e),
                    'o 429 tem que ser tratado como passageiro, não como aborto')
        else:
            raise AssertionError('429 não virou erro')

        urllib.request.urlopen = erro(401)
        try:
            Mod._groq_pede('/models', 'gsk_x')
        except RuntimeError as e:
            verdade('console.groq.com/keys' in str(e), f'diz onde pegar a chave: {e}')
            verdade(not Mod._passageiro(e), 'chave errada não melhora esperando')
        else:
            raise AssertionError('401 não virou erro')
    finally:
        urllib.request.urlopen = original


@teste('modelo: JSON cortado pela metade não vira resposta vazia silenciosa')
def _():
    from nucleo.a2_abordagem import Abordagem
    cli = FalsoGemini(None)
    try:
        M.pede_json('i', 'c', Abordagem, cli=cli, provedor='gemini', tentativas=1)
    except RuntimeError as e:
        verdade('não devolveu o JSON' in str(e))
        verdade('veio:' in str(e), 'precisa mostrar o que chegou, para dar para depurar')
        return
    raise AssertionError('engoliu a resposta inválida')


@teste('modelo: imagem vira anexo nos dois provedores')
def _():
    from nucleo.a3_estudio import Leitura
    foto = TMP / 'foto.png'
    foto.write_bytes(b'\x89PNG\r\n\x1a\n' + b'0' * 40)
    cli = FalsoGemini(Leitura(nome_exibido='X', uma_linha='y', especialidades=[],
                              pratos=[], tom='t', paleta=[], secoes=[],
                              fotos_boas=[], nao_sei=[]))
    M.pede_json('i', 'c', Leitura, cli=cli, imagens=[foto], provedor='gemini')
    partes = cli.chamadas[0]['contents'][0].parts
    igual(len(partes), 2, 'imagem + texto')
    verdade(partes[0].inline_data is not None, 'a foto não virou anexo')
    igual(partes[0].inline_data.mime_type, 'image/png')


@teste('modelo: formato de imagem que a API não aceita falha dizendo qual')
def _():
    from nucleo.a3_estudio import Leitura
    ruim = TMP / 'foto.bmp'
    ruim.write_bytes(b'BM')
    for provedor in ('claude', 'gemini'):
        try:
            M.pede_json('i', 'c', Leitura, cli=FalsoGemini(None), imagens=[ruim],
                        provedor=provedor, tentativas=1)
        except ValueError as e:
            verdade('foto.bmp' in str(e))
            continue
        raise AssertionError(f'aceitou .bmp no provedor {provedor}')


@teste('adicionar: lead posto à mão nasce pronto para o agente 2')
def _():
    import funil as F
    est = banco()
    cfg = cfg_falso(banco=est.caminho)
    est.fechar()
    argumentos = types.SimpleNamespace(
        nome='Cantina da Vó', telefone='+55 84 98888-7777', instagram='@cantinadavo',
        cidade='Natal, RN', categoria='Restaurante', url='', nota=4.6,
        avaliacoes=180, pontuacao=8, place_id='')
    F.cmd_adicionar(argumentos, cfg)
    est2 = Estado(cfg.banco)
    l = est2.leads()[0]
    igual(l.nome, 'Cantina da Vó')
    igual(l.estado, NOVO, 'tem que cair em novo, para o agente 2 pegar')
    igual(l.telefone_e164, '5584988887777', 'o telefone precisa sair pronto para o wa.me')
    igual(l.instagram, 'cantinadavo', 'o @ não entra no handle')
    igual(l.presenca, 'so_rede', 'quem só tem Instagram é o melhor lead')
    est2.fechar()


# ── Agente 2 ────────────────────────────────────────────────────────
@teste('a2: escreve deixa em rascunho, nunca em abordado')
def _():
    est = banco()
    l = lead_exemplo(est)
    c = a2.escreve(est, cli=duble(gancho='g', mensagem='Oi, tudo certo?', porque='p'))
    igual(c, {'escritos': 1, 'falhas': 0})
    igual(est.lead(l.id).estado, RASCUNHO)
    m = est.mensagens(lead_id=l.id)[0]
    igual(m['situacao'], 'rascunho', 'mensagem nasce em rascunho')


@teste('a2: escreve igual pelo Gemini')
def _():
    est = banco()
    l = lead_exemplo(est)
    from nucleo.a2_abordagem import Abordagem
    cli = FalsoGemini(Abordagem(gancho='g', mensagem='Oi, vi seu Instagram', porque='p'))
    c = a2.escreve(est, cli=cli, provedor='gemini', modelo='gemini-2.5-flash')
    igual(c, {'escritos': 1, 'falhas': 0})
    igual(est.lead(l.id).estado, RASCUNHO)
    igual(cli.chamadas[0]['model'], 'gemini-2.5-flash')


@teste('a2: contexto diz a verdade sobre a presença do lead')
def _():
    est = banco()
    l = lead_exemplo(est)
    t = a2._contexto(l)
    verdade('instagram.com/cantinadavo' in t, 'passa a URL que achou')
    verdade('180' in t, 'passa a contagem real de avaliações')
    verdade('@cantinadavo' in t)


@teste('a2: envio por link NÃO dispara nada')
def _():
    est = banco()
    l = lead_exemplo(est)
    a2.escreve(est, cli=duble(gancho='g', mensagem='Oi!', porque='p'))
    m = est.mensagens(lead_id=l.id)[0]
    est.marca_mensagem(m['id'], 'aprovada')
    c = a2.envia(est, canal='link')
    igual(c['enviadas'], 0, 'nada enviado sozinho')
    igual(len(c['links']), 1)
    verdade(c['links'][0]['url'].startswith('https://wa.me/5584988887777?text=Oi'))
    igual(est.lead(l.id).estado, RASCUNHO, 'o lead só anda depois da sua confirmação')
    a2.marca_enviada(est, m['id'], l.id)
    igual(est.lead(l.id).estado, ABORDADO)


@teste('a2: rascunho não aprovado não entra na fila de envio')
def _():
    est = banco()
    lead_exemplo(est)
    a2.escreve(est, cli=duble(gancho='g', mensagem='Oi!', porque='p'))
    igual(a2.envia(est, canal='link')['links'], [])


@teste('a2: lead sem telefone é recusado, não silenciado')
def _():
    est = banco()
    l = lead_exemplo(est, telefone_e164='', telefone='')
    a2.escreve(est, cli=duble(gancho='g', mensagem='Oi!', porque='p'))
    m = est.mensagens(lead_id=l.id)[0]
    est.marca_mensagem(m['id'], 'aprovada')
    c = a2.envia(est, canal='link')
    igual(c['falhas'], 1)
    igual([x['situacao'] for x in est.mensagens(lead_id=l.id)], ['recusada'])


@teste('a2: link do WhatsApp escapa o texto')
def _():
    u = a2.link_whats('5584988887777', 'Oi & tudo bem? 100% livre')
    verdade('%26' in u and '%3F' in u and '%25' in u, f'texto cru vazou: {u}')


@teste('a2: a instrução proíbe o que faz bloquear')
def _():
    t = a2.INSTRUCAO.lower()
    for proibido in ('tudo bem? me chamo', 'aumento de 30%', 'última vaga'):
        verdade(proibido in t, f'a instrução deveria barrar "{proibido}"')


@teste('a2: canal cloud sem credencial falha explicando')
def _():
    import os
    for k in ('WHATSAPP_TOKEN', 'WHATSAPP_PHONE_ID'):
        os.environ.pop(k, None)
    ok, detalhe = a2._envia_cloud('5584988887777', 'oi')
    igual(ok, False)
    verdade('WHATSAPP_TOKEN' in detalhe, 'diz qual variável falta')


# ── A vigia ─────────────────────────────────────────────────────────
class FalsoWhats:
    """Imita o WhatsApp Web sem abrir navegador nenhum."""

    def __init__(self, conversas=(), mensagens=()):
        self._conversas = list(conversas)
        self._mensagens = list(mensagens)
        self.enviadas: list[tuple[str, str]] = []
        self.abertas: list[str] = []

    def abre(self, **kw): return self
    def fecha(self): pass
    def vivo(self): return True
    def conversas(self, quantas=40): return self._conversas

    def abre_conversa(self, e164):
        self.abertas.append(e164)
        return True

    def mensagens(self, quantas=20): return self._mensagens

    def envia(self, e164, texto):
        self.enviadas.append((e164, texto))
        return texto


def monta_vigia(est, cfg=None, whats=None, seco=False):
    from nucleo.vigia import Vigia
    cfg = cfg or cfg_falso(banco=est.caminho)
    return Vigia(est, cfg, whats=whats or FalsoWhats(), seco=seco)


@teste('vigia: NÃO existe disparo automático de primeiro contato')
def _():
    from nucleo import vigia as V
    verdade(not hasattr(V.Vigia, 'manda_abordagens'),
            'o primeiro contato automático voltou — ele tem que ser um clique seu')
    fonte = (pathlib.Path(__file__).parent / 'nucleo' / 'vigia.py').read_text(encoding='utf-8')
    verdade('Não dá o primeiro contato' in fonte,
            'o arquivo precisa dizer por que esse passo é manual')


@teste('vigia: lê a resposta de quem escreveu e passa para a triagem')
def _():
    import time as _t
    est = banco()
    l = lead_exemplo(est)
    est.move(l.id, RASCUNHO, 't'); est.move(l.id, ABORDADO, 't')
    agora = int(_t.time())
    w = FalsoWhats(
        conversas=[{'nome': '+55 84 98888-7777', 'texto': 'oi | manda aí',
                    'nao_lidas': 1}],
        mensagens=[{'quando': agora, 'autor': 'Marcos', 'texto': 'pode mandar sim',
                    'minha': False}])
    v = monta_vigia(est, whats=w, seco=True)
    igual(v.colhe_respostas(), 1)
    igual(est.lead(l.id).estado, RESPONDEU)
    igual(est.mensagens(tipo='retorno', lead_id=l.id)[0]['texto'], 'pode mandar sim')


@teste('vigia: a própria mensagem não é lida como resposta do cliente')
def _():
    import time as _t
    est = banco()
    l = lead_exemplo(est)
    est.move(l.id, RASCUNHO, 't'); est.move(l.id, ABORDADO, 't')
    w = FalsoWhats(
        conversas=[{'nome': '5584988887777', 'texto': 'x', 'nao_lidas': 1}],
        mensagens=[{'quando': int(_t.time()), 'autor': 'eu',
                    'texto': 'Oi! Vi que o link do Google...', 'minha': True}])
    v = monta_vigia(est, whats=w, seco=True)
    igual(v.colhe_respostas(), 0, 'leu a própria mensagem como resposta')
    igual(est.lead(l.id).estado, ABORDADO)


@teste('vigia: não relê a mesma resposta duas vezes')
def _():
    import time as _t
    est = banco()
    l = lead_exemplo(est)
    est.move(l.id, RASCUNHO, 't'); est.move(l.id, ABORDADO, 't')
    w = FalsoWhats(
        conversas=[{'nome': '5584988887777', 'texto': 'x', 'nao_lidas': 1}],
        mensagens=[{'quando': int(_t.time()), 'autor': 'M', 'texto': 'quero ver',
                    'minha': False}])
    v = monta_vigia(est, whats=w, seco=True)
    igual(v.colhe_respostas(), 1)
    igual(v.colhe_respostas(), 0, 'contou a mesma resposta de novo')


@teste('vigia: em modo seco não envia nada')
def _():
    import time as _t
    est = banco()
    l = lead_exemplo(est)
    for p_ in (RASCUNHO, ABORDADO, RESPONDEU, QUER_DEMO, DEMO_PRONTA):
        est.move(l.id, p_, 't')
    est.guarda_mensagem(l.id, 'entrega', 'olha o link')
    w = FalsoWhats()
    v = monta_vigia(est, whats=w, seco=True)
    v.constroi_e_entrega()
    igual(w.enviadas, [], 'mandou mensagem em modo seco')


# ── Agente 3 ────────────────────────────────────────────────────────
@teste('a3: retorno move abordado para respondeu')
def _():
    est = banco()
    l = lead_exemplo(est)
    est.move(l.id, RASCUNHO, 't'); est.move(l.id, ABORDADO, 't')
    a3.anota_retorno(est, l.id, 'pode mandar sim')
    igual(est.lead(l.id).estado, RESPONDEU)
    igual(est.mensagens(tipo='retorno', lead_id=l.id)[0]['texto'], 'pode mandar sim')


@teste('a3: sim com certeza alta vai para quer_demo')
def _():
    est = banco()
    l = lead_exemplo(est)
    est.move(l.id, RASCUNHO, 't'); est.move(l.id, ABORDADO, 't')
    a3.anota_retorno(est, l.id, 'manda aí')
    c = a3.tria(est, cli=duble(quer_demo=True, certeza=0.95, leitura='aceitou',
                               resposta='Fechado, te mando hoje'))
    igual(c['quer'], 1)
    igual(est.lead(l.id).estado, QUER_DEMO)


@teste('a3: não vai para sem_interesse')
def _():
    est = banco()
    l = lead_exemplo(est)
    est.move(l.id, RASCUNHO, 't'); est.move(l.id, ABORDADO, 't')
    a3.anota_retorno(est, l.id, 'não temos interesse')
    a3.tria(est, cli=duble(quer_demo=False, certeza=0.99, leitura='recusou',
                           resposta='Sem problema, obrigado'))
    igual(est.lead(l.id).estado, SEM_INTERESSE)


@teste('a3: dúvida fica parada para humano, não vira sim')
def _():
    est = banco()
    l = lead_exemplo(est)
    est.move(l.id, RASCUNHO, 't'); est.move(l.id, ABORDADO, 't')
    a3.anota_retorno(est, l.id, 'quem é?')
    c = a3.tria(est, cli=duble(quer_demo=True, certeza=0.4, leitura='ambíguo',
                               resposta='?'))
    igual(c['duvida'], 1)
    igual(est.lead(l.id).estado, RESPONDEU, 'não andou')
    verdade(any(e['acao'] == 'duvida' for e in est.historico(l.id)),
            'ficou registrado para você achar')


@teste('a3: "[link]" nunca chega ao cliente')
def _():
    from nucleo.a3_estudio import tira_buracos
    igual(tira_buracos('Show! Segue o link: [link]. Me fala o que achou!'),
          'Show! Me fala o que achou!')
    for buraco in ('[link]', '{url}', '<seu link>', 'LINK_AQUI', '______'):
        igual(tira_buracos(f'Olha aqui: {buraco}'), '',
              f'passou o buraco {buraco}')
    # frase sem buraco não é tocada
    boa = 'Combinado. Te mando o link assim que ficar pronto.'
    igual(tira_buracos(boa), boa)


@teste('a3: resposta que vira vazia é trocada por uma frase verdadeira')
def _():
    est = banco()
    l = lead_exemplo(est)
    est.move(l.id, RASCUNHO, 't'); est.move(l.id, ABORDADO, 't')
    a3.anota_retorno(est, l.id, 'manda aí')
    a3.tria(est, cli=duble(quer_demo=True, certeza=0.95, leitura='aceitou',
                           resposta='Segue o link: [link]'))
    resposta = [m for m in est.mensagens(lead_id=l.id) if m['tipo'] == 'resposta'][0]
    verdade('[link]' not in resposta['texto'], 'o buraco foi enviado')
    verdade('assim que ficar pronto' in resposta['texto'],
            f'a frase de reserva precisa ser verdadeira: {resposta["texto"]}')
    verdade(any(e['acao'] == 'resposta_trocada' for e in est.historico(l.id)),
            'a troca precisa ficar registrada')


@teste('a3: a instrução proíbe prometer link que ainda não existe')
def _():
    t = a3.TRIAGEM_INSTRUCAO.lower()
    verdade('não existe link ainda' in t)
    for proibido in ('[link]', 'segue o link', 'link_aqui'):
        verdade(proibido in t, f'deveria barrar "{proibido}"')


@teste('insta: material existente não é recapturado')
def _():
    from nucleo.insta import ja_tem_material
    pasta = TMP / 'insta-cheia'
    pasta.mkdir(exist_ok=True)
    igual(ja_tem_material(pasta), False)
    (pasta / 'leia.txt').write_text('x')
    igual(ja_tem_material(pasta), False, 'txt não é captura')
    (pasta / '01-capa.png').write_bytes(b'x')
    igual(ja_tem_material(pasta), True)
    igual(ja_tem_material(TMP / 'nao-existe'), False)


@teste('a3: captura sozinho quando falta material, e segue se falhar')
def _():
    from nucleo import insta as I
    est = banco()
    cfg = cfg_falso(banco=est.caminho)
    cfg.capturar_sozinho = True
    l = lead_exemplo(est)
    for p_ in (RASCUNHO, ABORDADO, RESPONDEU, QUER_DEMO):
        est.move(l.id, p_, 't')

    chamadas = []

    class OlhoFalso:
        def __init__(self, *a, **k): pass
        def fecha(self): chamadas.append('fechou')
        def captura(self, handle, destino, posts=3):
            chamadas.append(handle)
            raise I.SemAcesso('o Instagram pediu login')

    original, I.Insta = I.Insta, OlhoFalso
    try:
        c = a3.roda(est, cfg)
    finally:
        I.Insta = original
    igual(chamadas[0], 'cantinadavo', 'não tentou capturar')
    verdade('fechou' in chamadas, 'deixou o navegador aberto')
    igual(c['sem_material'], 1, 'falha de captura tem que virar "sem material"')
    igual(est.lead(l.id).estado, QUER_DEMO, 'o lead não pode andar sem material')
    verdade(any(e['acao'] == 'erro_captura' for e in est.historico(l.id)),
            'a falha precisa ficar registrada')


@teste('a3: reune lê imagens e notas da pasta do lead')
def _():
    pasta = TMP / 'material' / 'casa-1'
    pasta.mkdir(parents=True, exist_ok=True)
    (pasta / 'b.png').write_bytes(b'x')
    (pasta / 'a.jpg').write_bytes(b'x')
    (pasta / 'leia.txt').write_text('ignora')
    (pasta / 'notas.txt').write_text('bio: comida caseira')
    imagens, notas = a3.reune(pasta)
    igual([p.name for p in imagens], ['a.jpg', 'b.png'], 'em ordem, só imagem')
    igual(notas, 'bio: comida caseira')
    igual(a3.reune(TMP / 'material' / 'nao-existe'), ([], ''))


@teste('a3: briefing carrega as regras de honestidade e o que não se sabe')
def _():
    l = Lead(id=1, place_id='p', nome='Casa X', estado=QUER_DEMO,
             cidade='Natal, RN', instagram='casax')
    leitura = a3.Leitura(
        nome_exibido='Casa X', uma_linha='comida caseira', especialidades=['baião'],
        pratos=[a3.Prato(nome='Baião de dois', descricao='com queijo coalho')],
        tom='caseira', paleta=['#8b1d1d'], secoes=['capa', 'cardápio'],
        fotos_boas=['a.jpg'], nao_sei=['preço dos pratos', 'horário de domingo'])
    t = a3.briefing(l, leitura, ['a.jpg'])
    for exigido in ('Não invente nada', 'noindex', 'Disallow: /',
                    'Nenhuma avaliação fictícia', 'aggregateRating',
                    'preço dos pratos', 'horário de domingo', 'WCAG AA'):
        verdade(exigido in t, f'o briefing precisa dizer "{exigido}"')
    verdade('R$' not in t, 'nenhum preço inventado entrou no briefing')


@teste('a3: prato sem preço na foto fica sem preço')
def _():
    p = a3.Prato(nome='Baião de dois')
    igual(p.preco, '')
    l = Lead(id=1, place_id='p', nome='Casa X', estado=QUER_DEMO)
    leitura = a3.Leitura(nome_exibido='Casa X', uma_linha='x', especialidades=[],
                         pratos=[p], tom='x', paleta=[], secoes=[], fotos_boas=[],
                         nao_sei=[])
    verdade('Baião de dois' in a3.briefing(l, leitura, []))


@teste('a3: empacota põe o index na raiz do zip')
def _():
    pasta = TMP / 'saida' / 'casa-1'
    (pasta / 'publico' / 'css').mkdir(parents=True, exist_ok=True)
    (pasta / 'publico' / 'index.html').write_text('<!doctype html><title>x</title>')
    (pasta / 'publico' / 'css' / 'e.css').write_text('body{}')
    z = a3.empacota(pasta)
    with zipfile.ZipFile(z) as f:
        nomes = f.namelist()
    igual(sorted(nomes), ['css/e.css', 'index.html'],
          'index fora da raiz = Netlify publica pasta vazia')


@teste('a3: empacota recusa pasta sem index')
def _():
    pasta = TMP / 'saida' / 'vazia'
    (pasta / 'publico').mkdir(parents=True, exist_ok=True)
    try:
        a3.empacota(pasta)
    except RuntimeError as e:
        verdade('index.html' in str(e))
        return
    raise AssertionError('zipou sem index')


@teste('a3: lead sem capturas não constrói e diz onde pôr')
def _():
    est = banco()
    cfg = cfg_falso()
    l = lead_exemplo(est)
    for p in (RASCUNHO, ABORDADO, RESPONDEU, QUER_DEMO):
        est.move(l.id, p, 't')
    c = a3.roda(est, cfg)
    igual(c['sem_material'], 1)
    igual(est.lead(l.id).estado, QUER_DEMO, 'não andou sem material')
    verdade(l.slug in est.demo(l.id)['erro'], 'o erro diz a pasta exata')


@teste('construtor: recusa página sem noindex, sem WhatsApp ou cortada')
def _():
    from nucleo.construtor import valida
    igual(valida('<!doctype html><html>' + 'x' * 3000
                 + '<meta name="robots" content="noindex"><a href="https://wa.me/55">x</a>'
                 + '</html>'), [])
    problemas = valida('<!doctype html><html>' + 'x' * 3000 + '</html>')
    verdade(any('noindex' in p for p in problemas))
    verdade(any('WhatsApp' in p for p in problemas))
    cortada = valida('<!doctype html><html>' + 'x' * 3000)
    verdade(any('cortada' in p for p in cortada), 'resposta truncada tem que ser pega')


@teste('construtor: tira a cerca de código que o modelo põe em volta')
def _():
    from nucleo.construtor import _limpa
    igual(_limpa('```html\n<!doctype html><html>a</html>\n```'),
          '<!doctype html><html>a</html>')
    igual(_limpa('Claro! Aqui está:\n<!doctype html><html>a</html>\nEspero ter ajudado'),
          '<!doctype html><html>a</html>')


@teste('construtor: escreve o site e insiste quando a página volta ruim')
def _():
    from nucleo import construtor as C
    from nucleo.a3_estudio import Leitura, Prato
    boa = ('<!doctype html><html><head><meta name="robots" content="noindex">'
           '</head><body>' + 'conteudo ' * 400
           + '<a href="https://wa.me/5584988887777">Pedir</a></body></html>')
    chamadas = []

    def falso(instrucao, conteudo, modelo=None, cli=None, max_tokens=8000,
              provedor='claude'):
        chamadas.append(conteudo)
        return '<!doctype html><html></html>' if len(chamadas) == 1 else boa

    original, C.pede_texto = C.pede_texto, falso
    try:
        pasta = TMP / 'site'
        foto = TMP / 'p.png'
        foto.write_bytes(b'\x89PNG\r\n\x1a\n' + b'0' * 40)
        leitura = Leitura(nome_exibido='Pizzaria', uma_linha='pizza',
                          especialidades=['pizza'], pratos=[Prato(nome='Marguerita')],
                          tom='caseiro', paleta=['#aa0000'], secoes=['capa'],
                          fotos_boas=['p.png'], nao_sei=['preço das pizzas'])
        l = Lead(id=1, place_id='p', nome='Pizzaria do Marcos', estado=QUER_DEMO,
                 cidade='Natal, RN', telefone_e164='5584988887777')
        publico, pendencias = C.monta_site(l, leitura, [foto], pasta, cfg_falso())
        verdade((publico / 'index.html').exists())
        verdade((publico / 'robots.txt').read_text().startswith('User-agent'))
        verdade((publico / 'img' / 'p.png').exists(), 'a foto não foi copiada')
        igual(pendencias, ['preço das pizzas'])
        igual(len(chamadas), 2, 'não insistiu depois da página ruim')
        verdade('problemas' in chamadas[1], 'a segunda tentativa precisa dizer o que corrigir')
        verdade('PREÇO NÃO INFORMADO' in chamadas[0],
                'o que falta precisa chegar ao modelo como falta')
    finally:
        C.pede_texto = original


# ── Agente 4 ────────────────────────────────────────────────────────
@teste('a4: nome de projeto é válido e único por lead')
def _():
    l1 = Lead(id=1, place_id='abc', nome='Cantina da Vó Zuleica & Cia', estado=DEMO_PRONTA)
    l2 = Lead(id=2, place_id='xyz', nome='Cantina da Vó Zuleica & Cia', estado=DEMO_PRONTA)
    n1, n2 = a4.nome_projeto(l1), a4.nome_projeto(l2)
    verdade(n1.startswith('cantina-da-vo-zuleica-cia-'))
    verdade(n1 != n2, 'dois leads com o mesmo nome não colidem')
    for n in (n1, n2):
        verdade(n == n.lower() and ' ' not in n and len(n) <= 40, f'nome inválido: {n}')


@teste('a4: equipe errada falha listando as que existem')
def _():
    orig = a4._pede
    a4._pede = lambda *a_, **k: [{'slug': 'outra-conta'}, {'slug': 'pessoal'}]
    try:
        a4.confere_equipe('t', 'conta5197-99')
    except RuntimeError as e:
        verdade('outra-conta' in str(e) and 'pessoal' in str(e))
        return
    finally:
        a4._pede = orig
    raise AssertionError('aceitou equipe inexistente')


@teste('a4: espera o deploy ficar ready antes de existir link')
def _():
    estados = iter([{'state': 'uploading'}, {'state': 'processing'},
                    {'state': 'ready', 'ssl_url': 'https://x.netlify.app'}])
    orig = a4._pede
    a4._pede = lambda *a_, **k: next(estados)
    try:
        r = a4.espera_pronto('t', 'd1', limite=30)
        igual(r['ssl_url'], 'https://x.netlify.app')
    finally:
        a4._pede = orig


@teste('a4: deploy com erro levanta em vez de mandar link quebrado')
def _():
    orig = a4._pede
    a4._pede = lambda *a_, **k: {'state': 'error', 'error_message': 'build falhou'}
    try:
        a4.espera_pronto('t', 'd1', limite=10)
    except RuntimeError as e:
        verdade('build falhou' in str(e))
        return
    finally:
        a4._pede = orig
    raise AssertionError('engoliu o erro da Netlify')


@teste('a4: publica cria o projeto na equipe certa e devolve a url')
def _():
    chamadas = []

    def falso(token, caminho, metodo='GET', corpo=None, tipo='application/json', **k):
        chamadas.append((metodo, caminho))
        if caminho.endswith('/sites') and metodo == 'POST':
            return {'id': 'site1'}
        if '/deploys' in caminho and metodo == 'POST':
            return {'id': 'dep1'}
        return {'state': 'ready', 'ssl_url': 'https://casa.netlify.app'}

    orig = a4._pede
    a4._pede = falso
    try:
        z = TMP / 'site.zip'
        with zipfile.ZipFile(z, 'w') as f:
            f.writestr('index.html', '<title>x</title>')
        l = Lead(id=1, place_id='p', nome='Casa X', estado=DEMO_PRONTA)
        url, site_id = a4.publica('t', l, z, 'conta5197-99')
        igual(url, 'https://casa.netlify.app')
        igual(site_id, 'site1')
        verdade(('POST', '/conta5197-99/sites') in chamadas,
                f'não criou na equipe pedida: {chamadas}')
    finally:
        a4._pede = orig


@teste('a4: entrega enfileira o link e não envia sozinha')
def _():
    est = banco()
    cfg = cfg_falso()
    l = lead_exemplo(est)
    for p in (RASCUNHO, ABORDADO, RESPONDEU, QUER_DEMO, DEMO_PRONTA):
        est.move(l.id, p, 't')
    pasta = TMP / 'saida' / l.slug
    pasta.mkdir(parents=True, exist_ok=True)
    (pasta / 'leitura.json').write_text(json.dumps({'nao_sei': ['preço', 'horário']}))
    z = pasta / 'site.zip'
    with zipfile.ZipFile(z, 'w') as f:
        f.writestr('index.html', '<title>x</title>')
    est.guarda_demo(l.id, pasta=str(pasta), zip=str(z), situacao='construido')

    # O despachante precisa olhar o MÉTODO: '/deploys/dep1' também casa com
    # '/deploys', e um stub que só olha o caminho deixa espera_pronto em
    # laço eterno — foi exatamente o que aconteceu na primeira versão.
    def falso(token, caminho, metodo='GET', corpo=None, **k):
        if caminho == '/accounts':
            return [{'slug': 'conta5197-99'}]
        if metodo == 'POST' and caminho.endswith('/sites'):
            return {'id': 'site1'}
        if metodo == 'POST' and '/deploys' in caminho:
            return {'id': 'dep1'}
        return {'state': 'ready', 'ssl_url': 'https://casa.netlify.app'}

    orig = a4._pede
    a4._pede = falso
    try:
        c = a4.entrega(est, cfg, cli=duble(mensagem='Olha o exemplo: link'))
    finally:
        a4._pede = orig
    igual(c['publicadas'], 1)
    igual(est.lead(l.id).estado, PUBLICADO)
    igual(est.demo(l.id)['url'], 'https://casa.netlify.app')
    m = [x for x in est.mensagens(lead_id=l.id) if x['tipo'] == 'entrega'][0]
    igual(m['situacao'], 'rascunho', 'a entrega também espera você')


@teste('a4: zip que não existe mais não vira deploy vazio')
def _():
    est = banco()
    cfg = cfg_falso()
    l = lead_exemplo(est)
    for p in (RASCUNHO, ABORDADO, RESPONDEU, QUER_DEMO, DEMO_PRONTA):
        est.move(l.id, p, 't')
    est.guarda_demo(l.id, zip=str(TMP / 'nao-existe.zip'), situacao='construido')
    orig = a4._pede
    a4._pede = lambda *a_, **k: [{'slug': 'conta5197-99'}]
    try:
        c = a4.entrega(est, cfg)
    finally:
        a4._pede = orig
    igual(c['falhas'], 1)
    igual(est.lead(l.id).estado, DEMO_PRONTA)


@teste('a4: a mensagem de entrega recebe o que ficou em branco')
def _():
    pasta = TMP / 'pend'
    pasta.mkdir(exist_ok=True)
    (pasta / 'leitura.json').write_text(json.dumps({'nao_sei': ['preço', 'horário']}))
    igual(a4._pendencias(pasta), ['preço', 'horário'])
    igual(a4._pendencias(TMP / 'nao-existe'), [])


@teste('a4: a instrução de entrega manda assumir o que falta')
def _():
    t = a4.ENTREGA_INSTRUCAO.lower()
    verdade('não tinha o dado' in t or 'ficou em branco' in t)
    verdade('nada de preço' in t, 'preço é a conversa seguinte')


# ── Config e painel ─────────────────────────────────────────────────
@teste('config: o provedor sai da chave que existe')
def _():
    for anthropic, gemini_, esperado in (('a', '', 'claude'), ('', 'g', 'gemini'),
                                         ('a', 'g', 'claude'), ('', '', 'claude')):
        c = config.Config(anthropic=anthropic, gemini=gemini_)
        c.provedor = 'gemini' if (c.gemini and not c.anthropic) else 'claude'
        igual(c.provedor, esperado, f'{anthropic!r}/{gemini_!r}')
    c = config.Config(provedor='gemini', modelo='claude-x', modelo_gemini='gemini-y')
    igual(c.modelo_do_cerebro, 'gemini-y')
    try:
        c.exige_cerebro()
    except SystemExit as e:
        verdade('GEMINI_API_KEY' in str(e), 'tem que cobrar a chave do provedor certo')
        return
    raise AssertionError('passou sem chave do Gemini')


@teste('config: o groq entra na escolha automática e recebe a chave na mão')
def _():
    import os
    pasta = TMP / 'cfg_groq'
    pasta.mkdir(parents=True, exist_ok=True)
    vazio = pasta / 'nao_existe.toml'

    guarda = {k: os.environ.get(k) for k in
              ('ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'OPENROUTER_API_KEY',
               'GROQ_API_KEY')}
    try:
        for k in guarda:
            os.environ.pop(k, None)
        os.environ['GROQ_API_KEY'] = 'gsk_falsa'
        c = config.carrega(vazio)
        igual(c.provedor, 'groq', 'só a chave do Groq no ambiente')
        igual(c.chave_do_dialeto, 'gsk_falsa')

        # com Claude também presente, o Claude manda — o Groq é o último
        os.environ['ANTHROPIC_API_KEY'] = 'sk-ant-falsa'
        igual(config.carrega(vazio).provedor, 'claude')
    finally:
        for k, v in guarda.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v

    # Claude e Gemini não recebem chave por argumento: o SDK deles lê o
    # ambiente, e uma string onde o código espera um cliente quebra feio.
    igual(config.Config(provedor='claude', anthropic='a').chave_do_dialeto, '')
    igual(config.Config(provedor='gemini', gemini='g').chave_do_dialeto, '')

    c = config.Config(provedor='groq', modelo_groq='kimi-x')
    igual(c.modelo_do_cerebro, 'kimi-x')
    try:
        c.exige_cerebro()
    except SystemExit as e:
        verdade('GROQ_API_KEY' in str(e), f'tem que cobrar a chave certa: {e}')
        return
    raise AssertionError('passou sem chave do Groq')


@teste('config: cobra a variável que falta pelo nome real')
def _():
    c = config.Config()
    try:
        c.exige('google_places', 'netlify')
    except SystemExit as e:
        verdade('GOOGLE_PLACES_KEY' in str(e) and 'NETLIFY_TOKEN' in str(e))
        return
    raise AssertionError('passou sem chave')


@teste('config: nenhuma chave escrita no código')
def _():
    import re
    raiz = Path(__file__).parent
    suspeito = re.compile(r'(AIza[0-9A-Za-z_\-]{20,}|sk-ant-[0-9A-Za-z_\-]{20,}|'
                          r'nfp_[0-9A-Za-z]{20,}|sk-or-v1-[0-9a-f]{20,}|'
                          r'gsk_[0-9A-Za-z]{20,})')
    for f in list(raiz.glob('*.py')) + list((raiz / 'nucleo').glob('*.py')):
        achado = suspeito.search(f.read_text(encoding='utf-8'))
        verdade(not achado, f'{f.name} tem chave escrita: {achado}')


# ── a colônia ───────────────────────────────────────────────────────
def colonia_falsa(**extra):
    """
    Colônia de teste. O banco vem folgado por padrão porque a maioria dos
    testes é sobre vida, morte e reprodução — quem testa o banco declara
    o número que quer.
    """
    from nucleo.colonia import Colonia
    caminho = TMP / f'col-{len(list(TMP.glob("col-*.json")))}.json'
    extra.setdefault('banco', 1_000_000)
    return Colonia(caminho, **extra)


@teste('colônia: dinheiro é centavo inteiro, do começo ao fim')
def _():
    from nucleo.colonia import dinheiro
    igual(dinheiro(0), 'R$ 0,00')
    igual(dinheiro(5), 'R$ 0,05')
    igual(dinheiro(500), 'R$ 5,00')
    igual(dinheiro(90000), 'R$ 900,00')
    igual(dinheiro(123456), 'R$ 1234,56')
    igual(dinheiro(-250), '-R$ 2,50')
    # Nenhum float em nenhum campo de dinheiro: 0,1 + 0,2 em float não dá
    # 0,3, e aqui é esse número que decide quem vive.
    col = colonia_falsa()
    o = col.nascer('Natal, RN', ['pizzaria'])
    for campo in ('carteira', 'ganho', 'gasto', 'preco'):
        verdade(isinstance(getattr(o, campo), int),
                f'{campo} não é inteiro: {type(getattr(o, campo))}')


@teste('colônia: zerar a carteira mata, e morte não tem volta')
def _():
    from nucleo.colonia import PRECOS, SemDinheiro
    col = colonia_falsa(semente=40)
    o = col.nascer('Natal, RN', ['pizzaria'])
    # força a busca a custar: as primeiras mil do mês são grátis
    col.buscas_pagas = 10_000
    custo = col.preco_de('busca')
    verdade(custo > 0, 'a busca tinha que custar depois do grátis')

    gastou = 0
    while o.pode_pagar(custo):
        gastou += col.cobra(o.id, 'busca')
    igual(gastou, o.gasto)
    verdade(o.carteira < custo, f'sobrou dinheiro: {o.carteira}')

    try:
        col.cobra(o.id, 'busca')
    except SemDinheiro:
        pass
    else:
        raise AssertionError('deixou gastar o que não tinha')

    mortos = col.ceifa()
    igual([m.id for m in mortos], [o.id])
    verdade(not o.vivo, 'não morreu')
    verdade(o.causa, 'morreu sem causa anotada')

    # E morto não age nunca mais, nem depois de você creditar dinheiro.
    col.recebe(o.id, 100_000, de='tarde demais')
    try:
        col.cobra(o.id, 'busca')
    except SemDinheiro as e:
        verdade('morto' in str(e), f'mensagem errada: {e}')
        return
    raise AssertionError('um morto voltou a trabalhar')


@teste('colônia: queimar os toques sem fechar nada também mata')
def _():
    col = colonia_falsa()
    o = col.nascer('Natal, RN', ['pizzaria'])
    verdade(o.toques > 0)
    for _i in range(o.toques):
        col.toca(o.id)
    igual(o.toques, 0)
    # Carteira cheia, e mesmo assim morre: a reserva escassa de verdade é
    # quantas portas ele pode te pedir para bater.
    verdade(o.carteira > 0, 'o teste tem que provar morte COM dinheiro')
    mortos = col.ceifa()
    igual([m.id for m in mortos], [o.id])
    verdade('toques' in o.causa, o.causa)


@teste('colônia: quem fechou não morre por falta de toque')
def _():
    col = colonia_falsa()
    o = col.nascer('Natal, RN', ['pizzaria'])
    col.recebe(o.id, 90_000, de='cliente 1')
    for _i in range(o.toques):
        col.toca(o.id)
    igual(col.ceifa(), [], 'matou quem já provou que funciona')
    verdade(o.vivo)


@teste('colônia: só se reproduz quem RECEBEU dinheiro de cliente')
def _():
    col = colonia_falsa(teto_vivos=4)
    o = col.nascer('Natal, RN', ['pizzaria'])

    # Carteira gorda sem nenhuma venda: não reproduz. Sem esta regra a
    # colônia se multiplicaria sem nunca ter provado nada.
    o.carteira = 1_000_000
    verdade(not o.pode_reproduzir, 'reproduziu sem ter vendido')
    igual(col.reproduz(o.id, ['Natal, RN']), None)

    o.carteira = 500
    col.recebe(o.id, 90_000, de='cliente')
    verdade(o.pode_reproduzir, f'carteira {o.carteira}, ganho {o.ganho}')
    antes = o.carteira
    filho = col.reproduz(o.id, ['Natal, RN', 'Parnamirim, RN'])
    verdade(filho is not None, 'não reproduziu com lucro')
    igual(filho.carteira, col.semente)
    igual(filho.pai, o.id)
    igual(filho.geracao, 1)
    igual(filho.ganho, 0, 'o filho tem que começar devendo o seu sustento')
    # O pai PAGA a semente do próprio bolso: a colônia não cria dinheiro.
    igual(o.carteira, antes - col.semente)
    igual(o.filhos, [filho.id])


@teste('colônia: o filho muda UM eixo, e o teto de vivos não é furado')
def _():
    import random
    col = colonia_falsa(teto_vivos=2)
    pai = col.nascer('Natal, RN', ['pizzaria', 'açaí', 'cafeteria'])

    eixos = set()
    for semente in range(40):
        plano = col.muta(pai, ['Natal, RN', 'Parnamirim, RN'],
                         random.Random(semente))
        eixos.add(plano['eixo'])
        mudou = sum([plano['cidade'] != pai.cidade, plano['tom'] != pai.tom,
                     plano['preco'] != pai.preco,
                     plano['termos'] != pai.termos])
        verdade(mudou <= 1, f'mudou {mudou} eixos de uma vez: {plano}')
    verdade(len(eixos) >= 3, f'a mutação não varia o suficiente: {eixos}')

    # teto: 2 vivos, então o segundo filho não nasce
    col.recebe(pai.id, 500_000, de='cliente')
    verdade(col.reproduz(pai.id, ['Natal, RN']) is not None)
    igual(len(col.vivos()), 2)
    igual(col.reproduz(pai.id, ['Natal, RN']), None, 'furou o teto de vivos')


@teste('colônia: teto de gasto trava a colônia inteira')
def _():
    from nucleo.colonia import SemDinheiro
    col = colonia_falsa(teto_gasto=30, semente=10_000)
    o = col.nascer('Natal, RN', ['pizzaria'])
    col.buscas_pagas = 10_000           # tira do grátis
    custo = col.preco_de('busca')
    while col.gasto_total < col.teto_gasto:
        col.cobra(o.id, 'busca')
    verdade(o.carteira > custo, 'o teste precisa de carteira sobrando')
    try:
        col.cobra(o.id, 'busca')
    except SemDinheiro as e:
        verdade('teto de gasto' in str(e), f'mensagem errada: {e}')
        return
    raise AssertionError('passou do teto de gasto da colônia')


@teste('colônia: as primeiras mil buscas do mês são de graça, a 1.001 não')
def _():
    from nucleo.colonia import BUSCAS_GRATIS_MES, PRECOS
    col = colonia_falsa()
    o = col.nascer('Natal, RN', ['pizzaria'])
    igual(col.preco_de('busca'), 0, 'cobrou dentro da cota grátis')
    igual(col.cobra(o.id, 'busca'), 0)
    igual(o.carteira, col.semente, 'debitou dentro do grátis')
    col.buscas_pagas = BUSCAS_GRATIS_MES
    igual(col.preco_de('busca'), PRECOS['busca'])
    verdade(col.cobra(o.id, 'busca') > 0, 'não cobrou depois do grátis')


@teste('colônia: receita só entra por você, e nunca negativa')
def _():
    col = colonia_falsa()
    o = col.nascer('Natal, RN', ['pizzaria'])
    for ruim in (0, -1, -90_000):
        try:
            col.recebe(o.id, ruim)
        except ValueError:
            continue
        raise AssertionError(f'aceitou receita de {ruim}')
    col.recebe(o.id, 90_000, de='cliente')
    igual(o.ganho, 90_000)
    igual(o.fechados, 1)
    # Nenhum método do organismo credita a si mesmo: a única entrada é
    # Colonia.recebe, chamada pelo comando que VOCÊ roda.
    verdade(not any(n for n in dir(o) if 'receb' in n.lower()),
            'o organismo ganhou um jeito de creditar a si mesmo')


@teste('colônia: o livro-caixa sobrevive a fechar e abrir, sem perder centavo')
def _():
    from nucleo.colonia import Colonia
    col = colonia_falsa(teto_vivos=3)
    pai = col.nascer('Natal, RN', ['pizzaria'], tom='curioso', preco=120_000)
    col.recebe(pai.id, 90_000, de='cliente')
    col.buscas_pagas = 10_000
    col.cobra(pai.id, 'busca')
    col.toca(pai.id)
    filho = col.reproduz(pai.id, ['Natal, RN', 'Parnamirim, RN'])
    col.salva()

    outra = Colonia(col.caminho, teto_vivos=3)
    igual(len(outra.bichos), 2)
    a, b = outra.bichos[pai.id], outra.bichos[filho.id]
    igual(a.carteira, pai.carteira)
    igual(a.gasto, pai.gasto)
    igual(a.ganho, pai.ganho)
    igual(a.toques, pai.toques)
    igual(a.tom, 'curioso')
    igual(a.preco, 120_000)
    igual(b.pai, pai.id)
    igual(outra.gasto_total, col.gasto_total)
    igual(outra.buscas_pagas, col.buscas_pagas)
    # O diário é trilha de auditoria: o que aconteceu continua lá.
    verdade(any(e['o_que'] == 'nasceu' for e in outra.diario))
    verdade(any(e['o_que'] == 'recebeu' for e in outra.diario))
    verdade(any(e['o_que'] == 'reproduziu' for e in outra.diario))


@teste('colônia: o turno marca o lead com quem o achou, e o tom vai no texto')
def _():
    from nucleo import vida
    from nucleo.a2_abordagem import TONS, instrucao_com_tom
    import nucleo.a1_cacador as A1

    est = banco()
    cfg = cfg_falso(banco=est.caminho, cidade='Natal, RN', termos=['pizzaria'])
    col = colonia_falsa()
    o = col.nascer('Natal, RN', ['pizzaria'], tom='curioso')

    # a Places API trocada por um falso: nenhuma chamada sai daqui
    original = A1._pede
    A1._pede = lambda chave, corpo, tentativas=3: {'places': [{
        'id': 'p-colonia', 'displayName': {'text': 'Pizzaria do Teste'},
        'formattedAddress': 'Rua 1', 'nationalPhoneNumber': '84 98888-7777',
        'internationalPhoneNumber': '+55 84 98888-7777',
        'websiteUri': 'https://instagram.com/pizzariadoteste',
        'rating': 4.5, 'userRatingCount': 120,
        'primaryTypeDisplayName': {'text': 'Pizzaria'},
        'businessStatus': 'OPERATIONAL', 'googleMapsUri': 'https://maps/x',
    }]}
    try:
        vida.caca(col, o, est, cfg, paginas=1)
        achados = est.leads(organismo=o.id)
        igual(len(achados), 1, 'o lead não ficou marcado com o organismo')
        igual(achados[0].dados['organismo'], o.id)
        igual(achados[0].dados['tom'], 'curioso')
        igual(o.leads, 1)
        # e um organismo de OUTRO id não vê esse lead
        igual(est.leads(organismo='g9-99'), [])

        antes_toques, antes_carteira = o.toques, o.carteira
        conta = vida.aborda(col, o, est, cfg, limite=5,
                            cli=duble(gancho='g', mensagem='m', porque='p'))
        igual(conta['escritos'], 1)
        igual(o.toques, antes_toques - 1, 'não gastou o toque')
        verdade(o.carteira <= antes_carteira)
    finally:
        A1._pede = original

    # o tom entra na instrução, sem afrouxar as regras
    com = instrucao_com_tom('curioso')
    verdade(TONS['curioso'] in com)
    verdade('Nada de promessa que você não pode provar' in com,
            'o tom não pode comer as regras de honestidade')
    igual(instrucao_com_tom(''), instrucao_com_tom('tom_que_nao_existe'))


@teste('colônia: sem toque, o organismo para de abordar em vez de continuar')
def _():
    from nucleo import vida
    est = banco()
    cfg = cfg_falso(banco=est.caminho)
    col = colonia_falsa()
    o = col.nascer('Natal, RN', ['pizzaria'])
    for i in range(3):
        est.guarda_lead(place_id=f'p{i}', nome=f'Casa {i}', cidade='Natal, RN',
                        telefone_e164='5584988887777', presenca='so_rede',
                        pontuacao=9, dados={'organismo': o.id})
    o.toques = 1
    conta = vida.aborda(col, o, est, cfg, limite=10,
                        cli=duble(gancho='g', mensagem='m', porque='p'))
    igual(conta['escritos'], 1, 'escreveu mais do que tinha toque')
    igual(conta['sem_recurso'], 1)
    igual(o.toques, 0)


@teste('colônia: a volta ceifa ANTES de reproduzir')
def _():
    from nucleo import vida
    import random
    est = banco()
    cfg = cfg_falso(banco=est.caminho, cidade='Natal, RN', termos=[])
    col = colonia_falsa(teto_vivos=2)

    falido = col.nascer('Natal, RN', [])
    rico = col.nascer('Natal, RN', [])
    falido.toques = 0                       # morre nesta volta
    col.recebe(rico.id, 90_000, de='cliente')

    saida = vida.volta(col, est, cfg, sorteio=random.Random(7))
    igual(saida['mortos'], [falido.id])
    # A vaga aberta pela morte é o que deixa o filho nascer dentro do teto.
    igual(len(saida['nasceram']), 1, saida)
    igual(len(col.vivos()), 2)
    verdade(not col.bichos[falido.id].vivo)


@teste('colônia: nada é enviado sozinho — a abordagem fica em rascunho')
def _():
    from nucleo import vida
    est = banco()
    cfg = cfg_falso(banco=est.caminho)
    col = colonia_falsa()
    o = col.nascer('Natal, RN', ['pizzaria'])
    est.guarda_lead(place_id='pz', nome='Casa', cidade='Natal, RN',
                    telefone_e164='5584988887777', presenca='so_rede',
                    pontuacao=9, dados={'organismo': o.id})
    vida.aborda(col, o, est, cfg, limite=5,
                cli=duble(gancho='g', mensagem='m', porque='p'))
    rascunhos = est.mensagens(situacao='rascunho', tipo='abordagem')
    igual(len(rascunhos), 1)
    igual(est.mensagens(situacao='enviada'), [],
          'a colônia enviou algo sozinha')
    igual(est.mensagens(situacao='aprovada'), [],
          'a colônia aprovou algo sozinha')


@teste('banco: o envelope é um pedaço do SEU dinheiro, e a soma nunca passa')
def _():
    col = colonia_falsa(banco=2_500, semente=500, teto_vivos=8)
    igual(col.banco, 2_500)
    igual(col.livre, 2_500)

    # R$ 25,00 de banco e envelope de R$ 5,00: cabem cinco, e só cinco.
    nascidos = []
    for _i in range(5):
        nascidos.append(col.nascer('Natal, RN', ['pizzaria']))
    igual(col.reservado, 2_500)
    igual(col.livre, 0)
    igual(len(nascidos), 5)

    from nucleo.colonia import SemBanco
    try:
        col.nascer('Natal, RN', ['pizzaria'])
    except SemBanco as e:
        # A mensagem precisa dizer quanto falta declarar, senão "não
        # nasceu" manda você mexer no lugar errado.
        verdade('--banco 3000' in str(e), f'não disse quanto falta: {e}')
    else:
        raise AssertionError('nasceu um sexto organismo sem banco para ele')

    col.confere()


@teste('banco: envelope de R$ 5 não gasta R$ 6, nem com o banco cheio')
def _():
    from nucleo.colonia import SemDinheiro
    col = colonia_falsa(banco=100_000, semente=500)
    o = col.nascer('Natal, RN', ['pizzaria'])
    col.buscas_pagas = 10_000                 # fora do grátis: a busca dói
    custo = col.preco_de('busca')

    while o.pode_pagar(custo):
        col.cobra(o.id, 'busca')
    igual(o.gasto, 500 - o.carteira)

    # ESTE é o pedido: o banco tem quase mil reais e ele não encosta.
    verdade(col.banco > 90_000, f'banco: {col.banco}')
    try:
        col.cobra(o.id, 'busca')
    except SemDinheiro as e:
        verdade(o.id in str(e), e)
    else:
        raise AssertionError('o organismo furou o envelope e comeu o banco')
    col.confere()


@teste('banco: gastar sai do envelope E do banco, no mesmo centavo')
def _():
    col = colonia_falsa(banco=10_000, semente=500)
    o = col.nascer('Natal, RN', ['pizzaria'])
    col.buscas_pagas = 10_000
    banco_antes, envelope_antes = col.banco, o.carteira
    saiu = col.cobra(o.id, 'busca')
    verdade(saiu > 0)
    igual(col.banco, banco_antes - saiu, 'o banco não acompanhou o gasto')
    igual(o.carteira, envelope_antes - saiu, 'o envelope não acompanhou')
    # e o livre não se mexeu: o que saiu saiu dos dois lados juntos
    igual(col.livre, banco_antes - envelope_antes)
    col.confere()


@teste('banco: receber aumenta o banco e o envelope de quem trouxe')
def _():
    col = colonia_falsa(banco=2_500, semente=500)
    o = col.nascer('Natal, RN', ['pizzaria'])
    igual(col.livre, 2_000)
    col.recebe(o.id, 90_000, de='cliente')
    igual(col.banco, 92_500, 'o dinheiro do cliente não entrou no banco')
    igual(o.carteira, 90_500)
    igual(col.livre, 2_000, 'o livre mudou sem motivo')
    col.confere()


@teste('banco: o envelope de quem morre volta para o livre')
def _():
    col = colonia_falsa(banco=2_500, semente=500)
    a = col.nascer('Natal, RN', ['pizzaria'])
    col.nascer('Natal, RN', ['açaí'])
    igual(col.livre, 1_500)

    col.mata(a.id, 'teste')
    # O dinheiro é SEU, não dele: enterrar R$ 5,00 com o organismo seria
    # perder dinheiro de verdade para manter uma metáfora.
    igual(a.carteira, 0, 'o morto continuou segurando o envelope')
    igual(col.livre, 2_000, 'o envelope do morto não voltou para o livre')
    igual(col.banco, 2_500, 'morrer não gasta dinheiro')
    # e agora cabe um novo no lugar dele
    col.nascer('Natal, RN', ['cafeteria'])
    igual(col.livre, 1_500)
    col.confere()


@teste('banco: reproduzir move dinheiro de envelope, sem mexer no banco')
def _():
    col = colonia_falsa(banco=2_500, semente=500, teto_vivos=4)
    pai = col.nascer('Natal, RN', ['pizzaria', 'açaí'])
    col.recebe(pai.id, 90_000, de='cliente')
    banco_antes, reservado_antes = col.banco, col.reservado

    filho = col.reproduz(pai.id, ['Natal, RN'])
    verdade(filho is not None)
    igual(col.banco, banco_antes, 'a reprodução criou ou queimou dinheiro')
    igual(col.reservado, reservado_antes, 'mudou o total reservado')
    igual(filho.carteira, 500)
    igual(pai.carteira, 90_500 - 500)
    col.confere()


@teste('banco: declarar menos do que já está reservado é recusado')
def _():
    from nucleo.colonia import ContaErrada
    col = colonia_falsa(banco=2_500, semente=500)
    a = col.nascer('Natal, RN', ['pizzaria'])
    col.nascer('Natal, RN', ['açaí'])
    igual(col.reservado, 1_000)

    try:
        col.declara_banco(500)
    except ContaErrada as e:
        verdade('--matar' in str(e), f'não disse como resolver: {e}')
    else:
        raise AssertionError('confiscou envelope já prometido')
    igual(col.banco, 2_500, 'mexeu no banco mesmo recusando')

    # mata um, e aí o número menor passa
    col.mata(a.id, 'para abrir espaço')
    col.declara_banco(500)
    igual(col.banco, 500)
    col.confere()


@teste('banco: a invariante levanta em vez de se ajustar em silêncio')
def _():
    from nucleo.colonia import ContaErrada
    col = colonia_falsa(banco=1_000, semente=500)
    o = col.nascer('Natal, RN', ['pizzaria'])
    col.confere()

    # Simula arquivo editado à mão (ele é JSON justamente para isso) com
    # um envelope maior que o banco.
    o.carteira = 999_999
    try:
        col.confere()
    except ContaErrada as e:
        verdade('criou dinheiro que não existe' in str(e), e)
    else:
        raise AssertionError('a conta não fechava e ninguém reclamou')

    o.carteira = -1
    try:
        col.confere()
    except ContaErrada as e:
        verdade('negativo' in str(e), e)
        return
    raise AssertionError('envelope negativo passou')


@teste('banco: pagamento que chega depois da morte vai para o banco, não para o morto')
def _():
    col = colonia_falsa(banco=1_000, semente=500)
    o = col.nascer('Natal, RN', ['pizzaria'])
    col.mata(o.id, 'morreu esperando o cliente pagar')
    igual(col.livre, 1_000)

    # Acontece de verdade: o cliente demora e o organismo morre no meio.
    col.recebe(o.id, 90_000, de='cliente atrasado')
    igual(col.banco, 91_000, 'o dinheiro não entrou na sua conta')
    igual(o.carteira, 0, 'ressuscitou o envelope de um morto')
    igual(o.ganho, 90_000, 'perdeu o registro de qual estratégia vendeu')
    igual(col.livre, 91_000, 'o dinheiro sumiu do livre')
    col.confere()


@teste('banco: o livro-caixa guarda o saldo corrente, não o declarado')
def _():
    from nucleo.colonia import Colonia
    col = colonia_falsa(banco=10_000, semente=500)
    o = col.nascer('Natal, RN', ['pizzaria'])
    col.buscas_pagas = 10_000
    col.cobra(o.id, 'busca')
    col.salva()
    banco_gravado = col.banco
    verdade(banco_gravado < 10_000, 'o gasto não baixou o banco')

    # Reabrir com o número do config NÃO pode ressuscitar o que foi gasto.
    outra = Colonia(col.caminho, semente=500, banco=10_000)
    igual(outra.banco, banco_gravado,
          'o banco do config venceu o saldo do arquivo e inventou dinheiro')
    igual(outra.reservado, col.reservado)
    outra.confere()


@teste('colônia: a mutação nunca gera clone idêntico ao pai')
def _():
    import random
    col = colonia_falsa()
    # Organismo de UM termo: antes, o eixo "termos" copiava a lista igual
    # e o filho nascia clone — contra o que a reprodução promete.
    magro = col.nascer('Natal, RN', ['pizzaria'], tom='direto')
    for semente in range(60):
        plano = col.muta(magro, ['Natal, RN'], random.Random(semente))
        igual(plano['termos'], magro.termos, 'cortou o único termo que ele tinha')
        verdade(plano['tom'] != magro.tom or plano['preco'] != magro.preco,
                f'filho idêntico ao pai: {plano}')
    gordo = col.nascer('Natal, RN', ['pizzaria', 'açaí'], tom='direto')
    for semente in range(60):
        plano = col.muta(gordo, ['Natal, RN'], random.Random(semente))
        mudou = (plano['tom'] != gordo.tom or plano['preco'] != gordo.preco
                 or plano['termos'] != gordo.termos
                 or plano['cidade'] != gordo.cidade)
        verdade(mudou, f'filho idêntico ao pai: {plano}')


@teste('colônia: sem toque sobrando, ele NÃO paga busca para encher fila')
def _():
    from nucleo import vida
    import nucleo.a1_cacador as A1
    est = banco()
    cfg = cfg_falso(banco=est.caminho)
    col = colonia_falsa()
    col.buscas_pagas = 10_000           # fora do grátis: agora a busca dói
    o = col.nascer('Natal, RN', ['pizzaria'])

    bateu = []
    original, A1._pede = A1._pede, lambda *a, **k: bateu.append(1) or {'places': []}
    try:
        # 1) sem nenhum toque: nem tenta
        o.toques = 0
        antes = o.carteira
        r = vida.caca(col, o, est, cfg)
        verdade('sem toques' in r['pulou'], r)
        igual(bateu, [], 'pagou busca sem ter toque para usar')
        igual(o.carteira, antes, 'gastou dinheiro sem poder abordar ninguém')

        # 2) com fila maior que a reserva de toques: também não busca
        o.toques = 2
        for i in range(3):
            est.guarda_lead(place_id=f'fila{i}', nome=f'Casa {i}',
                            cidade='Natal, RN', presenca='so_rede',
                            pontuacao=9, dados={'organismo': o.id})
        antes = o.carteira
        r = vida.caca(col, o, est, cfg)
        verdade('fila' in r['pulou'], r)
        igual(bateu, [])
        igual(o.carteira, antes)

        # 3) com toque sobrando e fila curta: busca normalmente
        o.toques = 10
        vida.caca(col, o, est, cfg)
        igual(len(bateu), 1, 'deixou de buscar quando havia toque de sobra')
        verdade(o.carteira < antes, 'buscou sem pagar')
    finally:
        A1._pede = original


@teste('colônia: o extrato não esconde quem está vivo e parado')
def _():
    col = colonia_falsa()
    o = col.nascer('Natal, RN', ['pizzaria'], preco=120_000)
    col.recebe(o.id, 90_000, de='cliente')       # fechou, então a ceifa poupa
    o.toques = 0
    igual(col.ceifa(), [], 'matou quem já tinha fechado')
    verdade(o.parado, 'não marcou como parado')
    texto = col.extrato()
    verdade('PARADO' in texto, f'o extrato diz que está tudo bem: {texto}')
    # e o preço que ele cobra aparece: é eixo de estratégia, não detalhe
    verdade('R$ 1200,00' in texto, f'o preço não aparece no extrato: {texto}')


@teste('colônia: o teto de código não pode ser furado pela configuração')
def _():
    from nucleo import colonia as C
    folgado = colonia_falsa(teto_vivos=9999, teto_gasto=99_999_999)
    igual(folgado.teto_vivos, C.TETO_VIVOS)
    igual(folgado.teto_gasto, C.TETO_GASTO)
    # e geração tem fim: nenhuma linhagem corre para sempre
    col = colonia_falsa(teto_vivos=C.TETO_VIVOS)
    pai = col.nascer('Natal, RN', ['x'], geracao=C.TETO_GERACOES)
    col.recebe(pai.id, 500_000, de='cliente')
    igual(col.reproduz(pai.id, ['Natal, RN']), None,
          'passou do teto de gerações')


@teste('painel: mostra o lead, avisa que nada dispara e não indexa')
def _():
    import painel
    est = banco()
    cfg = cfg_falso(banco=est.caminho)
    l = lead_exemplo(est)
    a2.escreve(est, cli=duble(gancho='g', mensagem='Oi & tudo certo?', porque='p'))
    destino = painel.gera(est, cfg)
    t = destino.read_text(encoding='utf-8')
    verdade('Cantina da Vó Zuleica' in t, 'o nome aparece com acento')
    verdade('noindex' in t, 'painel local não vai para busca')
    verdade('Nada daqui dispara sozinho' in t)
    verdade('python3 funil.py aprovar' in t, 'diz o próximo passo')
    verdade('wa.me' not in t, 'rascunho não aprovado não ganha botão de envio')


@teste('painel: aprovada ganha botão com o texto escapado')
def _():
    import painel
    est = banco()
    cfg = cfg_falso(banco=est.caminho)
    l = lead_exemplo(est)
    a2.escreve(est, cli=duble(gancho='g', mensagem='Oi & tudo certo?', porque='p'))
    m = est.mensagens(lead_id=l.id)[0]
    est.marca_mensagem(m['id'], 'aprovada')
    t = painel.gera(est, cfg).read_text(encoding='utf-8')
    verdade('wa.me/5584988887777' in t)
    verdade('Oi%20%26%20tudo' in t, 'o & foi para a URL escapado')
    verdade('&amp;' in t, 'e escapado no HTML também')


# ── corrida ─────────────────────────────────────────────────────────
def main() -> int:
    import contextlib
    import io
    import sys
    ok = falhas = 0
    print()
    for nome, f in CASOS:
        # O que o agente imprime fica guardado: só sai se o teste falhar.
        barulho = io.StringIO()
        try:
            with contextlib.redirect_stdout(barulho):
                f()
            ok += 1
            print(f'  ✓ {nome}')
        except Exception as e:
            falhas += 1
            print(f'  ✗ {nome}\n      {type(e).__name__}: {e}')
            if barulho.getvalue():
                print('      saída do agente:')
                for linha in barulho.getvalue().splitlines():
                    print(f'      | {linha}')
            if '-v' in sys.argv:
                traceback.print_exc()
    shutil.rmtree(TMP, ignore_errors=True)
    print(f'\n  {ok + falhas} testes · {ok} passando · {falhas} falhando\n')
    return 1 if falhas else 0


if __name__ == '__main__':
    raise SystemExit(main())
