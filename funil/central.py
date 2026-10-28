#!/usr/bin/env python3
"""
A CENTRAL

Uma página no seu navegador, servida pelo seu próprio computador
(http://127.0.0.1:8765), com um botão: "Ligar os agentes". Daí em diante
o motor (nucleo/motor.py) caça, prepara, conversa, constrói, publica e faz
as alterações sozinho. Na página ficam só as coisas que são suas:

  • os primeiros contatos esperando aprovação;
  • os preços de cada nicho;
  • o que precisa de você (dúvida, cliente querendo fechar...);
  • os pedidos de alteração e os clientes.

POR QUE NO SEU COMPUTADOR, E NÃO NA NETLIFY

O WhatsApp Web, o Claude Code e o banco moram na sua máquina. Uma página
na internet não alcança nenhum dos três — e se alcançasse, qualquer um com
o link mandaria mensagem do seu número.

A SEGURANÇA DE UMA PÁGINA LOCAL

Ela só escuta em 127.0.0.1 (outro aparelho da rede não entra), e todo
pedido que MUDA alguma coisa precisa de um código que só a própria página
conhece. Sem isso, qualquer site aberto no seu navegador poderia mandar
um POST para o 127.0.0.1 e disparar mensagem do seu WhatsApp.
"""
from __future__ import annotations

import json
import secrets
import sys
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from nucleo import config  # noqa: E402
from nucleo.estado import ESTADOS, Estado  # noqa: E402
from nucleo.motor import PADRAO, Motor  # noqa: E402
from nucleo.precos import Precos, eh_comida, nicho_do_lead, nichos, valor  # noqa: E402

TOKEN = secrets.token_urlsafe(24)


class Central:
    """O que a página pode pedir. Cada pedido abre o seu próprio banco."""

    def __init__(self, cfg, motor: Motor | None = None):
        self.cfg = cfg
        self.motor = motor or Motor(cfg)
        self.precos_arq = Path(cfg.banco).parent / 'precos.json'

    def _est(self) -> Estado:
        return Estado(self.cfg.banco)

    # ── o retrato da tela ───────────────────────────────────────────
    def estado(self) -> dict:
        from shutil import which
        precos = Precos(self.precos_arq)
        aj = self.motor.ajustes.le()
        with self._est() as est:
            resumo = est.resumo()
            primeiros = [dict(id=m['id'], lead_id=m['lead_id'], nome=m['lead_nome'],
                              cidade=m['cidade'], texto=m['texto'],
                              situacao=m['situacao'], erro=m['erro'],
                              telefone=m['telefone_e164'])
                         for m in est.mensagens(tipo='abordagem')
                         if m['situacao'] in ('rascunho', 'aprovada')]
            avisos = [dict(id=a['id'], tipo=a['tipo'], texto=a['texto'],
                           nome=a['lead_nome'] or '', lead_id=a['lead_id'])
                      for a in est.avisos()]
            pedidos = [dict(id=p['id'], nome=p['lead_nome'], texto=p['texto'],
                            situacao=p['situacao'], resultado=p['resultado'])
                       for p in est.pedidos()][-30:][::-1]
            clientes = []
            for l in est.leads('fechado', limite=500):
                d = est.demo(l.id)
                clientes.append(dict(id=l.id, nome=l.nome, telefone=l.telefone_e164,
                                     nicho=nicho_do_lead(l), url=(d['url'] if d else ''),
                                     pasta=(d['pasta'] if d else '')))
            negociando = [dict(id=l.id, nome=l.nome, estado=l.estado)
                          for l in est.leads(['negociando', 'publicado'], limite=200)]
        extras = [k for k in precos.dados if k not in {n['nome'] for n in nichos()}]
        return {
            'motor': {'situacao': self.motor.situacao, 'ligado': self.motor.ligado(),
                      'ultima_volta': self.motor.ultima_volta,
                      'log': list(self.motor.log)[-150:]},
            'resumo': {e: resumo.get(e, 0) for e in ESTADOS},
            'primeiros': primeiros,
            'avisos': avisos,
            'pedidos': pedidos,
            'clientes': clientes,
            'negociando': negociando,
            'nichos': nichos(extras),
            'precos': precos.dados,
            'ajustes': {k: aj[k] for k in PADRAO},
            'hoje': self.motor.ajustes.hoje(),
            'canal': self.cfg.canal_envio,
            'pronto': {
                'cerebro': bool(self._tem_cerebro()),
                'provedor': self.cfg.provedor,
                'netlify': bool(self.cfg.netlify),
                'places': bool(self.cfg.google_places),
                'claude_code': which('claude') is not None,
                'playwright': self._tem_playwright(),
            },
        }

    def _tem_cerebro(self) -> bool:
        return bool({'claude': self.cfg.anthropic, 'gemini': self.cfg.gemini,
                     'openrouter': self.cfg.openrouter,
                     'groq': self.cfg.groq}.get(self.cfg.provedor))

    @staticmethod
    def _tem_playwright() -> bool:
        import importlib.util
        return importlib.util.find_spec('playwright') is not None

    # ── as ações ────────────────────────────────────────────────────
    def faz(self, acao: str, d: dict) -> dict:
        f = getattr(self, f'a_{acao}', None)
        if f is None:
            raise ValueError(f'ação "{acao}" não existe')
        return f(d) or {}

    def a_ligar(self, d):
        if not self.motor.liga():
            return {'aviso': 'já está ligado'}

    def a_parar(self, d):
        self.motor.para()

    def a_ajustes(self, d):
        limpo = {}
        for k, padrao in PADRAO.items():
            if k not in d:
                continue
            v = d[k]
            if isinstance(padrao, bool):
                v = bool(v)
            elif isinstance(padrao, int):
                v = max(0, int(v))
            elif isinstance(padrao, list):
                v = [str(x) for x in v if str(x).strip()]
            else:
                v = str(v).strip()
            limpo[k] = v
        if limpo.get('fluxo', 'mensagem') not in ('mensagem', 'previa'):
            raise ValueError('fluxo é "mensagem" ou "previa"')
        if 'intervalo' in limpo:
            limpo['intervalo'] = max(30, limpo['intervalo'])
        self.motor.ajustes.grava(**limpo)

    def a_preco(self, d):
        from nucleo.atendente import libera_sem_preco
        nicho = str(d.get('nicho', '')).strip()
        modo = d.get('modo') or 'fazer_e_manutencao'
        if not eh_comida(nicho):
            modo = 'fazer_e_manutencao'
        Precos(self.precos_arq).define(nicho, modo, fazer=valor(d.get('fazer')),
                                       manutencao=valor(d.get('manutencao')),
                                       mensalidade=valor(d.get('mensalidade')))
        with self._est() as est:
            n = libera_sem_preco(est)
        return {'aviso': f'{n} conversa(s) que esperavam preço voltaram para a fila'
                if n else ''}

    def a_preco_apagar(self, d):
        Precos(self.precos_arq).apaga(str(d.get('nicho', '')))

    def a_mensagem(self, d):
        acao = d.get('acao')
        with self._est() as est:
            if d.get('id') == 'todas' and acao == 'aprovar':
                for m in est.mensagens(situacao='rascunho', tipo='abordagem'):
                    est.marca_mensagem(m['id'], 'aprovada')
                return
            msg_id = int(d['id'])
            m = next((x for x in est.mensagens(tipo='abordagem') if x['id'] == msg_id), None)
            if m is None:
                raise ValueError('mensagem não encontrada')
            if acao == 'editar':
                texto = str(d.get('texto', '')).strip()
                if not texto:
                    raise ValueError('mensagem vazia')
                with est._tx() as cx:
                    cx.execute('UPDATE mensagens SET texto=? WHERE id=?', (texto, msg_id))
            elif acao == 'aprovar':
                est.marca_mensagem(msg_id, 'aprovada')
            elif acao == 'voltar':
                est.marca_mensagem(msg_id, 'rascunho')
            elif acao == 'descartar':
                est.marca_mensagem(msg_id, 'recusada', '', 'descartada por você')
                from nucleo.estado import DESCARTADO
                l = est.lead(m['lead_id'])
                if l and l.estado != DESCARTADO:
                    est.move(l.id, DESCARTADO, 'voce', 'descartado na central')
            else:
                raise ValueError(f'ação "{acao}" não existe')

    def a_enviar(self, d):
        if not self.motor.ligado():
            raise ValueError('ligue os agentes primeiro: quem envia é o motor, '
                             'pelo WhatsApp Web que ele abriu')
        self.motor.pede('enviar_aprovados')

    def a_aviso(self, d):
        with self._est() as est:
            est.resolve_aviso(int(d['id']))

    def a_fechou(self, d):
        from nucleo.clientes import fecha
        with self._est() as est:
            fecha(est, int(d['lead_id']))

    def a_cliente(self, d):
        from nucleo.clientes import cadastra
        with self._est() as est:
            i = cadastra(est, self.cfg, nome=str(d.get('nome', '')),
                         telefone=str(d.get('telefone', '')),
                         nicho=str(d.get('nicho', '')), pasta=str(d.get('pasta', '')),
                         url=str(d.get('url', '')), site_id=str(d.get('site_id', '')))
        return {'aviso': f'cliente #{i} cadastrado'}

    def a_pedido(self, d):
        texto = str(d.get('texto', '')).strip()
        if not texto:
            raise ValueError('escreva o que mudar')
        with self._est() as est:
            i = est.guarda_pedido(int(d['lead_id']), texto)
        return {'aviso': f'pedido #{i} na fila do estúdio'}

    def a_pedido_refazer(self, d):
        with self._est() as est:
            est.marca_pedido(int(d['id']), 'novo')


# ── o servidor ──────────────────────────────────────────────────────
def servidor(central: Central, porta: int) -> ThreadingHTTPServer:
    class Pedido(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _host_ok(self) -> bool:
            # DNS rebinding: um site malicioso que aponta o próprio nome
            # para 127.0.0.1 chega aqui com outro Host.
            host = (self.headers.get('Host') or '').split(':')[0]
            return host in ('127.0.0.1', 'localhost')

        def _manda(self, codigo: int, corpo: bytes, tipo: str) -> None:
            self.send_response(codigo)
            self.send_header('Content-Type', tipo)
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Referrer-Policy', 'no-referrer')
            self.end_headers()
            self.wfile.write(corpo)

        def _json(self, codigo: int, dados: dict) -> None:
            self._manda(codigo, json.dumps(dados, ensure_ascii=False).encode(),
                        'application/json; charset=utf-8')

        def do_GET(self):
            if not self._host_ok():
                return self._json(403, {'erro': 'host'})
            if self.path in ('/', '/index.html'):
                return self._manda(200, PAGINA.replace('__TOKEN__', TOKEN).encode(),
                                   'text/html; charset=utf-8')
            if self.path == '/api/estado':
                if self.headers.get('X-Central') != TOKEN:
                    return self._json(403, {'erro': 'código'})
                try:
                    return self._json(200, central.estado())
                except Exception as e:
                    return self._json(500, {'erro': f'{type(e).__name__}: {e}'})
            return self._json(404, {'erro': 'não existe'})

        def do_POST(self):
            if not self._host_ok() or self.headers.get('X-Central') != TOKEN:
                return self._json(403, {'erro': 'pedido recusado'})
            if not self.path.startswith('/api/'):
                return self._json(404, {'erro': 'não existe'})
            try:
                tamanho = min(int(self.headers.get('Content-Length') or 0), 200_000)
                dados = json.loads(self.rfile.read(tamanho) or b'{}')
                r = central.faz(self.path[5:], dados)
                return self._json(200, {'ok': True, **r})
            except (ValueError, KeyError) as e:
                return self._json(400, {'erro': str(e)})
            except Exception as e:
                return self._json(500, {'erro': f'{type(e).__name__}: {e}'})

    return ThreadingHTTPServer(('127.0.0.1', porta), Pedido)


def principal(porta: int = 8765, abrir: bool = True, ligar: bool = False,
              cfg=None) -> int:
    cfg = cfg or config.carrega()
    central = Central(cfg)
    try:
        srv = servidor(central, porta)
    except OSError:
        print(f'\n  A porta {porta} já está em uso — a central provavelmente já está '
              f'aberta.\n  Abra no navegador: http://127.0.0.1:{porta}\n')
        if abrir:
            webbrowser.open(f'http://127.0.0.1:{porta}')
        return 1
    url = f'http://127.0.0.1:{porta}'
    print(f'\n  Central no ar: {url}\n  Deixe esta janela aberta. Ctrl+C desliga tudo.\n')
    if ligar:
        central.motor.liga()
    if abrir:
        webbrowser.open(url)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print('\n  desligando...')
    finally:
        central.motor.para()
        srv.server_close()
    return 0


PAGINA = r"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Central dos agentes</title>
<style>
:root{--fundo:#f5f5f3;--cartao:#fff;--texto:#18181b;--fraco:#5f5f68;--borda:#e2e2e6;
  --verde:#047857;--verde-fundo:#ecfdf5;--vermelho:#b91c1c;--ambar:#b45309;
  --ambar-fundo:#fffbeb;--campo:#fff;--sombra:0 1px 2px rgb(0 0 0/.06)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --fundo:#111113;--cartao:#1b1b1e;--texto:#f4f4f5;--fraco:#a1a1aa;--borda:#2e2e33;
  --verde:#34d399;--verde-fundo:#062b1f;--vermelho:#f87171;--ambar:#fbbf24;
  --ambar-fundo:#2a1f05;--campo:#141416;--sombra:none}}
:root[data-theme="dark"]{--fundo:#111113;--cartao:#1b1b1e;--texto:#f4f4f5;--fraco:#a1a1aa;
  --borda:#2e2e33;--verde:#34d399;--verde-fundo:#062b1f;--vermelho:#f87171;--ambar:#fbbf24;
  --ambar-fundo:#2a1f05;--campo:#141416;--sombra:none}
*{box-sizing:border-box}
[hidden]{display:none!important}
body{margin:0;background:var(--fundo);color:var(--texto);
  font:16px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.env{max-width:920px;margin:0 auto;padding:24px 16px 80px}
h1{font-size:1.4rem;margin:0;letter-spacing:-.02em}
h2{font-size:1.05rem;margin:0 0 12px;display:flex;flex-wrap:wrap;column-gap:8px;align-items:baseline}
a{color:var(--verde)}
h2 small{color:var(--fraco);font-weight:400;font-size:.85rem}
.cartao{background:var(--cartao);border:1px solid var(--borda);border-radius:14px;
  padding:18px;margin:0 0 16px;box-shadow:var(--sombra)}
.topo{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between}
.botao{appearance:none;border:1px solid var(--borda);background:var(--cartao);color:var(--texto);
  border-radius:10px;padding:10px 16px;font:inherit;font-weight:600;cursor:pointer;min-height:44px}
.botao:hover{border-color:var(--fraco)}
.botao.principal{background:var(--verde);border-color:var(--verde);color:#fff;
  font-size:1.1rem;padding:14px 26px}
:root[data-theme="dark"] .botao.principal{color:#04130d}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .botao.principal{color:#04130d}}
.botao.parar{background:var(--vermelho);border-color:var(--vermelho);color:#fff}
.botao.pequeno{padding:6px 12px;min-height:36px;font-size:.875rem}
.botao:disabled{opacity:.5;cursor:default}
.situacao{color:var(--fraco);font-size:.9rem;margin:4px 0 0}
.bola{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--fraco);
  margin-right:6px}
.bola.on{background:var(--verde);box-shadow:0 0 0 4px var(--verde-fundo)}
.checks{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 0;padding:0;list-style:none}
.checks li{font-size:.8rem;border:1px solid var(--borda);border-radius:999px;padding:3px 10px}
.checks li.nao{color:var(--ambar);border-color:var(--ambar)}
.fita{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.fita li{font-size:.8rem;background:var(--fundo);border-radius:8px;padding:4px 10px}
.fita b{font-variant-numeric:tabular-nums}
.item{border-top:1px solid var(--borda);padding:12px 0}
.item:first-of-type{border-top:0;padding-top:0}
.item .nome{font-weight:650}
.item .meta{color:var(--fraco);font-size:.85rem}
.acoes{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
textarea,input,select{font:inherit;color:var(--texto);background:var(--campo);
  border:1px solid var(--borda);border-radius:8px;padding:9px 10px;width:100%;min-height:44px}
textarea{min-height:120px;resize:vertical}
label{display:block;font-size:.85rem;color:var(--fraco);margin:10px 0 4px}
.linha{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}
.opcoes{display:flex;flex-direction:column;gap:8px;margin:10px 0}
.opcao{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--borda);
  border-radius:10px;padding:10px 12px;cursor:pointer;color:var(--texto);font-size:1rem;margin:0}
.opcao input{width:auto;min-height:auto;margin-top:4px}
.opcao small{display:block;color:var(--fraco);font-size:.82rem}
.aviso{background:var(--ambar-fundo);border:1px solid var(--ambar);border-radius:10px;
  padding:10px 12px;margin:0 0 8px;display:flex;gap:10px;justify-content:space-between;
  align-items:flex-start}
.aviso p{margin:0}
.vazio{color:var(--fraco);font-size:.9rem;margin:0}
.tag{font-size:.75rem;border-radius:999px;padding:2px 8px;border:1px solid var(--borda);
  white-space:nowrap}
.tag.aprovada,.tag.feito{color:var(--verde);border-color:var(--verde)}
.tag.falhou{color:var(--vermelho);border-color:var(--vermelho)}
.tag.fazendo,.tag.esperando{color:var(--ambar);border-color:var(--ambar)}
table{width:100%;border-collapse:collapse;font-size:.9rem}
td,th{text-align:left;padding:8px 6px;border-top:1px solid var(--borda);vertical-align:top}
th{color:var(--fraco);font-weight:500;border-top:0}
.registro{background:#0c0c0e;color:#d4d4d8;border-radius:10px;padding:12px;
  font:12px/1.55 ui-monospace,Consolas,monospace;max-height:340px;overflow:auto;
  white-space:pre-wrap;word-break:break-word}
.recado{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);
  background:var(--texto);color:var(--fundo);border-radius:10px;padding:10px 16px;
  max-width:calc(100% - 32px);font-size:.9rem;opacity:0;transition:opacity .2s;pointer-events:none}
.recado.ve{opacity:1}
details summary{cursor:pointer;font-weight:600;min-height:44px;display:flex;align-items:center}
.quebra{overflow-wrap:anywhere}
</style>
</head>
<body>
<main class="env">

<section class="cartao">
  <div class="topo">
    <div>
      <h1>Central dos agentes</h1>
      <p class="situacao" id="situacao"><span class="bola"></span>carregando…</p>
    </div>
    <button class="botao principal" id="liga">▶ Ligar os agentes</button>
  </div>
  <ul class="checks" id="checks"></ul>
</section>

<section class="cartao" id="caixa-avisos" hidden>
  <h2>Precisa de você <small id="n-avisos"></small></h2>
  <div id="avisos"></div>
</section>

<section class="cartao">
  <h2>Primeiros contatos <small>quem nunca falou com você — você lê e aprova</small></h2>
  <div class="acoes" style="margin:0 0 12px">
    <button class="botao pequeno" id="aprovar-todas">Aprovar todos</button>
    <button class="botao pequeno" id="enviar">Enviar os aprovados</button>
  </div>
  <div id="primeiros"></div>
</section>

<section class="cartao">
  <h2>Preços por nicho <small>o atendente usa quando o cliente pergunta</small></h2>
  <label for="nicho">Nicho</label>
  <select id="nicho"></select>
  <div id="nicho-outro-caixa" hidden>
    <label for="nicho-outro">Nome do nicho</label>
    <input id="nicho-outro" placeholder="ex.: escola de inglês">
  </div>
  <div id="opcoes-comida" class="opcoes" hidden>
    <label class="opcao"><input type="radio" name="modo" value="fazer_e_manutencao" checked>
      <span>Valor para fazer + manutenção<small>um valor para fazer o site e uma mensalidade</small></span></label>
    <label class="opcao"><input type="radio" name="modo" value="so_mensalidade">
      <span>Valor somente da mensalidade/manutenção<small>o site sai sem custo de criação</small></span></label>
  </div>
  <div class="linha" id="campos-fazer">
    <div><label for="fazer">Valor para fazer o site (R$)</label>
      <input id="fazer" inputmode="decimal" placeholder="ex.: 1500"></div>
    <div><label for="manutencao">Manutenção por mês (R$)</label>
      <input id="manutencao" inputmode="decimal" placeholder="ex.: 120"></div>
  </div>
  <div class="linha" id="campos-mensal" hidden>
    <div><label for="mensalidade">Mensalidade (R$)</label>
      <input id="mensalidade" inputmode="decimal" placeholder="ex.: 150"></div>
  </div>
  <div class="acoes"><button class="botao" id="salva-preco">Salvar preço</button></div>
  <div style="overflow-x:auto;margin-top:14px"><table id="tabela-precos"></table></div>
</section>

<section class="cartao">
  <h2>Pedidos de alteração <small>o cliente pede no WhatsApp, o estúdio faz</small></h2>
  <div id="pedidos"></div>
  <details style="margin-top:10px"><summary>Fazer um pedido à mão</summary>
    <label for="pedido-cliente">Cliente</label><select id="pedido-cliente"></select>
    <label for="pedido-texto">O que mudar</label>
    <textarea id="pedido-texto" style="min-height:80px"
      placeholder="ex.: trocar o preço do X-Tudo para R$ 28"></textarea>
    <div class="acoes"><button class="botao" id="faz-pedido">Mandar para o estúdio</button></div>
  </details>
</section>

<section class="cartao">
  <h2>Clientes <small>quem fechou — os pedidos deles viram alteração</small></h2>
  <div id="clientes"></div>
  <details style="margin-top:10px"><summary>Negociando — marcar quem fechou</summary>
    <div id="negociando"></div></details>
  <details><summary>Cadastrar um cliente que já tem site</summary>
    <div class="linha">
      <div><label for="c-nome">Nome do negócio</label><input id="c-nome"></div>
      <div><label for="c-telefone">WhatsApp do dono</label>
        <input id="c-telefone" inputmode="tel" placeholder="11 91234-5678"></div>
    </div>
    <label for="c-nicho">Nicho</label><select id="c-nicho"></select>
    <label for="c-pasta">Pasta do site neste computador</label>
    <input id="c-pasta" placeholder="C:\Users\voce\Documents\Site-restaurante\aurea">
    <div class="linha">
      <div><label for="c-url">Endereço do site</label><input id="c-url" placeholder="https://…"></div>
      <div><label for="c-site">ID do site na Netlify</label>
        <input id="c-site" placeholder="Site configuration → Site ID"></div>
    </div>
    <div class="acoes"><button class="botao" id="cadastra">Cadastrar cliente</button></div>
  </details>
</section>

<section class="cartao">
  <details><summary>Ajustes do motor</summary>
    <div class="opcoes">
      <label class="opcao"><input type="radio" name="fluxo" value="mensagem">
        <span>Primeiro uma mensagem<small>pergunta se quer ver o exemplo; o site só é feito para quem aceitar</small></span></label>
      <label class="opcao"><input type="radio" name="fluxo" value="previa">
        <span>Primeiro o site<small>o estúdio monta a prévia pelo Instagram e a mensagem já vai com o link</small></span></label>
    </div>
    <label class="opcao"><input type="checkbox" id="a-cacar">
      <span>Buscar negócios novos sozinho<small>Google Places, uma vez por dia por nicho</small></span></label>
    <label for="a-cidade">Cidade</label><input id="a-cidade" placeholder="Natal, RN">
    <label>Nichos para buscar</label>
    <div id="a-nichos" class="linha"></div>
    <div class="linha">
      <div><label for="a-novos">Novos preparados por dia</label><input id="a-novos" type="number" min="0"></div>
      <div><label for="a-primeiros">Primeiros contatos por dia</label><input id="a-primeiros" type="number" min="0"></div>
      <div><label for="a-intervalo">Segundos entre voltas</label><input id="a-intervalo" type="number" min="30"></div>
    </div>
    <div class="acoes"><button class="botao" id="salva-ajustes">Salvar ajustes</button></div>
  </details>
</section>

<section class="cartao">
  <h2>O funil <small id="hoje"></small></h2>
  <ul class="fita" id="fita"></ul>
  <h2 style="margin-top:18px">Registro</h2>
  <div class="registro" id="registro" aria-live="polite"></div>
</section>
</main>
<div class="recado" id="recado" role="status"></div>

<script>
const TOKEN = '__TOKEN__';
let E = null, editando = new Set(), ajustesCarregados = false;
const $ = s => document.querySelector(s);
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reais = v => v ? 'R$ ' + Number(v).toLocaleString('pt-BR', {minimumFractionDigits: Number.isInteger(+v) ? 0 : 2}) : '—';

function recado(t) { const r = $('#recado'); r.textContent = t; r.classList.add('ve');
  clearTimeout(recado.t); recado.t = setTimeout(() => r.classList.remove('ve'), 3500); }

async function api(acao, dados = {}) {
  const r = await fetch('/api/' + acao, {method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-Central': TOKEN},
    body: JSON.stringify(dados)});
  const j = await r.json().catch(() => ({erro: 'resposta inválida'}));
  if (!r.ok) { recado('✗ ' + (j.erro || r.status)); throw new Error(j.erro); }
  if (j.aviso) recado(j.aviso);
  await atualiza();
  return j;
}

async function atualiza() {
  try {
    const r = await fetch('/api/estado', {headers: {'X-Central': TOKEN}});
    E = await r.json();
    if (!r.ok) throw new Error(E.erro);
    desenha();
  } catch (e) { $('#situacao').innerHTML = '<span class="bola"></span>a central não responde — a janela preta foi fechada?'; }
}

const NOMES = {novo:'novos', rascunho:'esperando você', abordado:'contatados', sem_resposta:'sem resposta',
  respondeu:'responderam', quer_demo:'querem ver', demo_pronta:'site pronto', publicado:'link entregue',
  negociando:'negociando', fechado:'clientes', sem_interesse:'sem interesse', descartado:'descartados'};
const AVISO = {duvida:'Dúvida', sem_preco:'Sem preço', fechar:'Quer fechar', pergunta:'Pergunta',
  alteracao:'Alteração', alteracao_sem_site:'Alteração', foto:'Foto'};

function desenha() {
  const m = E.motor;
  const b = $('#liga');
  b.textContent = m.ligado ? '■ Parar os agentes' : '▶ Ligar os agentes';
  b.className = 'botao principal' + (m.ligado ? ' parar' : '');
  b.disabled = m.situacao === 'parando' || m.situacao === 'ligando';
  $('#situacao').innerHTML = `<span class="bola ${m.ligado ? 'on' : ''}"></span>` +
    ({parado:'parados', ligando:'ligando…', rodando:'trabalhando', parando:'parando…'}[m.situacao] || m.situacao) +
    (m.ultima_volta ? ` · última volta ${esc(m.ultima_volta)}` : '');

  const p = E.pronto;
  const ck = [[p.cerebro, `cérebro (${p.provedor})`], [p.playwright, 'WhatsApp Web'],
    [p.claude_code, 'Claude Code'], [p.netlify, 'Netlify'], [p.places, 'busca Google']];
  $('#checks').innerHTML = ck.map(([ok, n]) => `<li class="${ok ? '' : 'nao'}">${ok ? '✓' : '✗'} ${esc(n)}</li>`).join('');

  $('#caixa-avisos').hidden = !E.avisos.length;
  $('#n-avisos').textContent = E.avisos.length;
  $('#avisos').innerHTML = E.avisos.map(a => `<div class="aviso"><p><b>${esc(AVISO[a.tipo] || a.tipo)}</b>
    ${a.nome ? '· ' + esc(a.nome) : ''}<br>${esc(a.texto)}</p>
    <span class="acoes" style="margin:0">${a.tipo === 'fechar' && a.lead_id ?
      `<button class="botao pequeno" data-fechou="${a.lead_id}">Fechou</button>` : ''}
    <button class="botao pequeno" data-aviso="${a.id}">Resolvido</button></span></div>`).join('');

  const aprovadas = E.primeiros.filter(x => x.situacao === 'aprovada').length;
  $('#enviar').textContent = `Enviar os aprovados (${aprovadas})` + (E.canal === 'cloud' ? ' · Cloud API' : '');
  $('#enviar').disabled = !aprovadas;
  $('#aprovar-todas').disabled = !E.primeiros.some(x => x.situacao === 'rascunho');
  const lista = $('#primeiros');
  if (!E.primeiros.length) lista.innerHTML = '<p class="vazio">Nada esperando. Com os agentes ligados, as primeiras mensagens aparecem aqui.</p>';
  else if (!editando.size) lista.innerHTML = E.primeiros.map(x => `<div class="item">
    <div class="nome">${esc(x.nome)} <span class="tag ${x.situacao}">${x.situacao === 'aprovada' ? 'aprovada' : 'para ler'}</span></div>
    <div class="meta">${esc(x.cidade)} · ${x.telefone ? esc(x.telefone) : 'SEM TELEFONE'}${x.erro ? ' · ⚠ ' + esc(x.erro) : ''}</div>
    <textarea data-texto="${x.id}" aria-label="mensagem para ${esc(x.nome)}">${esc(x.texto)}</textarea>
    <div class="acoes">${x.situacao === 'aprovada'
      ? `<button class="botao pequeno" data-msg="${x.id}" data-acao="voltar">Desaprovar</button>`
      : `<button class="botao pequeno" data-msg="${x.id}" data-acao="aprovar">Aprovar</button>`}
      <button class="botao pequeno" data-msg="${x.id}" data-acao="editar">Salvar texto</button>
      <button class="botao pequeno" data-msg="${x.id}" data-acao="descartar">Descartar lead</button></div></div>`).join('');

  desenhaNichos();
  const pr = Object.entries(E.precos);
  $('#tabela-precos').innerHTML = pr.length ? '<tr><th>Nicho</th><th>Como cobra</th><th>Valores</th><th></th></tr>' +
    pr.map(([n, v]) => `<tr><td>${esc(n)}</td><td>${v.modo === 'so_mensalidade' ? 'só mensalidade' : 'fazer + manutenção'}</td>
      <td>${v.modo === 'so_mensalidade' ? reais(v.mensalidade) + '/mês'
        : reais(v.fazer) + ' + ' + reais(v.manutencao) + '/mês'}</td>
      <td><button class="botao pequeno" data-apaga-preco="${esc(n)}">Apagar</button></td></tr>`).join('')
    : '<tr><td class="vazio">Nenhum preço ainda. Sem preço, quem perguntar vem para você.</td></tr>';

  $('#pedidos').innerHTML = E.pedidos.length ? E.pedidos.map(x => `<div class="item">
    <div class="nome">#${x.id} · ${esc(x.nome)} <span class="tag ${x.situacao}">${esc(x.situacao)}</span></div>
    <div class="quebra">${esc(x.texto)}</div>${x.resultado ? `<div class="meta quebra">${esc(x.resultado)}</div>` : ''}
    ${['falhou', 'esperando'].includes(x.situacao) ? `<div class="acoes"><button class="botao pequeno" data-refaz="${x.id}">Tentar de novo</button></div>` : ''}
    </div>`).join('') : '<p class="vazio">Nenhum pedido ainda.</p>';

  $('#clientes').innerHTML = E.clientes.length ? '<div style="overflow-x:auto"><table><tr><th>Cliente</th><th>Nicho</th><th>Site</th></tr>' +
    E.clientes.map(c => `<tr><td>${esc(c.nome)}<div class="meta">${esc(c.telefone)}</div></td><td>${esc(c.nicho)}</td>
      <td class="quebra">${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.url)}</a>` : '—'}
      ${c.pasta ? '' : '<div class="meta">⚠ sem pasta: alteração não roda</div>'}</td></tr>`).join('') + '</table></div>'
    : '<p class="vazio">Nenhum cliente ainda.</p>';
  $('#negociando').innerHTML = E.negociando.length ? E.negociando.map(l => `<div class="item"><span class="nome">${esc(l.nome)}</span>
    <span class="meta">· ${esc(NOMES[l.estado] || l.estado)}</span>
    <div class="acoes"><button class="botao pequeno" data-fechou="${l.id}">Fechou — virou cliente</button></div></div>`).join('')
    : '<p class="vazio">Ninguém negociando.</p>';
  const sel = $('#pedido-cliente'), atual = sel.value;
  sel.innerHTML = E.clientes.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('') || '<option value="">(nenhum cliente)</option>';
  if (atual) sel.value = atual;

  if (!ajustesCarregados) carregaAjustes();
  $('#fita').innerHTML = Object.entries(E.resumo).filter(([, n]) => n)
    .map(([e, n]) => `<li>${esc(NOMES[e] || e)} <b>${n}</b></li>`).join('') || '<li>funil vazio</li>';
  const h = E.hoje;
  $('#hoje').textContent = `hoje: ${h.preparados || 0} preparados · ${h.primeiros || 0} primeiros contatos`;
  const reg = $('#registro'), noFim = reg.scrollTop + reg.clientHeight >= reg.scrollHeight - 20;
  reg.textContent = m.log.join('\n') || 'nada ainda.';
  if (noFim) reg.scrollTop = reg.scrollHeight;
}

function opcoesNicho(sel, comOutro) {
  const atual = sel.value;
  sel.innerHTML = '<optgroup label="Comida">' + E.nichos.filter(n => n.comida).map(n => `<option>${esc(n.nome)}</option>`).join('') +
    '</optgroup><optgroup label="Outros">' + E.nichos.filter(n => !n.comida).map(n => `<option>${esc(n.nome)}</option>`).join('') +
    '</optgroup>' + (comOutro ? '<option value="__outro">Outro…</option>' : '');
  if (atual) sel.value = atual;
}

function desenhaNichos() {
  if (document.activeElement !== $('#nicho')) opcoesNicho($('#nicho'), true);
  if (document.activeElement !== $('#c-nicho')) opcoesNicho($('#c-nicho'), false);
  mostraCampos();
}

function nichoEscolhido() {
  return $('#nicho').value === '__outro' ? $('#nicho-outro').value.trim() : $('#nicho').value;
}

function mostraCampos() {
  const v = $('#nicho').value, outro = v === '__outro';
  $('#nicho-outro-caixa').hidden = !outro;
  const comida = !outro && E && E.nichos.some(n => n.nome === v && n.comida);
  $('#opcoes-comida').hidden = !comida;
  const modo = comida ? document.querySelector('input[name=modo]:checked').value : 'fazer_e_manutencao';
  $('#campos-fazer').hidden = modo !== 'fazer_e_manutencao';
  $('#campos-mensal').hidden = modo !== 'so_mensalidade';
}

function preencheValores() {
  const p = E && E.precos[nichoEscolhido()];
  $('#fazer').value = p && p.fazer || ''; $('#manutencao').value = p && p.manutencao || '';
  $('#mensalidade').value = p && p.mensalidade || '';
  if (p && p.modo) document.querySelector(`input[name=modo][value=${p.modo}]`).checked = true;
  mostraCampos();
}

function carregaAjustes() {
  const a = E.ajustes; ajustesCarregados = true;
  document.querySelector(`input[name=fluxo][value=${a.fluxo}]`).checked = true;
  $('#a-cacar').checked = a.cacar; $('#a-cidade').value = a.cidade;
  $('#a-novos').value = a.novos_por_dia; $('#a-primeiros').value = a.primeiros_por_dia;
  $('#a-intervalo').value = a.intervalo;
  $('#a-nichos').innerHTML = E.nichos.map(n => `<label class="opcao" style="margin:0"><input type="checkbox" value="${esc(n.nome)}"
    ${a.nichos_caca.includes(n.nome) ? 'checked' : ''}><span>${esc(n.nome)}</span></label>`).join('');
}

document.addEventListener('click', async ev => {
  const t = ev.target.closest('button'); if (!t) return;
  try {
    if (t.id === 'liga') await api(E.motor.ligado ? 'parar' : 'ligar');
    else if (t.id === 'aprovar-todas') await api('mensagem', {id: 'todas', acao: 'aprovar'});
    else if (t.id === 'enviar') await api('enviar');
    else if (t.dataset.msg) {
      const d = {id: +t.dataset.msg, acao: t.dataset.acao};
      if (d.acao === 'editar') d.texto = document.querySelector(`[data-texto="${d.id}"]`).value;
      if (d.acao === 'descartar' && !confirm('Descartar este lead? Ele sai do funil.')) return;
      editando.delete(String(d.id));
      await api('mensagem', d);
      if (d.acao === 'editar') recado('texto salvo');
    }
    else if (t.dataset.aviso) await api('aviso', {id: +t.dataset.aviso});
    else if (t.dataset.fechou) { if (confirm('Marcar como cliente? Os pedidos dele no WhatsApp viram alteração no site.')) await api('fechou', {lead_id: +t.dataset.fechou}); }
    else if (t.dataset.apagaPreco) await api('preco_apagar', {nicho: t.dataset.apagaPreco});
    else if (t.dataset.refaz) await api('pedido_refazer', {id: +t.dataset.refaz});
    else if (t.id === 'salva-preco') {
      const comida = !$('#opcoes-comida').hidden;
      await api('preco', {nicho: nichoEscolhido(),
        modo: comida ? document.querySelector('input[name=modo]:checked').value : 'fazer_e_manutencao',
        fazer: $('#fazer').value, manutencao: $('#manutencao').value, mensalidade: $('#mensalidade').value});
      recado('preço salvo');
    }
    else if (t.id === 'faz-pedido') { await api('pedido', {lead_id: +$('#pedido-cliente').value, texto: $('#pedido-texto').value}); $('#pedido-texto').value = ''; }
    else if (t.id === 'cadastra') await api('cliente', {nome: $('#c-nome').value, telefone: $('#c-telefone').value,
      nicho: $('#c-nicho').value, pasta: $('#c-pasta').value, url: $('#c-url').value, site_id: $('#c-site').value});
    else if (t.id === 'salva-ajustes') {
      await api('ajustes', {fluxo: document.querySelector('input[name=fluxo]:checked').value,
        cacar: $('#a-cacar').checked, cidade: $('#a-cidade').value,
        nichos_caca: [...document.querySelectorAll('#a-nichos input:checked')].map(i => i.value),
        novos_por_dia: +$('#a-novos').value, primeiros_por_dia: +$('#a-primeiros').value,
        intervalo: +$('#a-intervalo').value});
      recado('ajustes salvos');
    }
  } catch (e) {}
});
document.addEventListener('input', ev => {
  if (ev.target.dataset.texto) editando.add(ev.target.dataset.texto);
});
$('#nicho').addEventListener('change', preencheValores);
$('#nicho-outro').addEventListener('input', preencheValores);
document.querySelectorAll('input[name=modo]').forEach(r => r.addEventListener('change', mostraCampos));

atualiza().then(preencheValores);
setInterval(atualiza, 3000);
</script>
</body>
</html>
"""

if __name__ == '__main__':
    raise SystemExit(principal())
