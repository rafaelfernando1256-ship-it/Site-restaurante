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
                          r'nfp_[0-9A-Za-z]{20,})')
    for f in list(raiz.glob('*.py')) + list((raiz / 'nucleo').glob('*.py')):
        achado = suspeito.search(f.read_text(encoding='utf-8'))
        verdade(not achado, f'{f.name} tem chave escrita: {achado}')


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
