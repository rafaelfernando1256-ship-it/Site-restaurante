#!/usr/bin/env python3
"""
O PAINEL

Uma página HTML, gerada do banco, para você olhar o funil inteiro e
disparar o WhatsApp com um clique. Sem servidor, sem dependência: é um
arquivo que abre no navegador.

Existe por um motivo prático: ler quinze abordagens no terminal é ruim,
e é justamente a leitura que não deve ser pulada.
"""
from __future__ import annotations

import html
import time
import urllib.parse
from pathlib import Path

from nucleo.estado import Estado

ORDEM = ['rascunho', 'novo', 'abordado', 'respondeu', 'quer_demo', 'demo_pronta',
         'publicado', 'sem_resposta', 'sem_interesse', 'fechado', 'descartado']

COR = {
    'rascunho': '#d97706', 'novo': '#64748b', 'abordado': '#2563eb',
    'respondeu': '#7c3aed', 'quer_demo': '#059669', 'demo_pronta': '#0d9488',
    'publicado': '#16a34a', 'sem_resposta': '#78716c', 'sem_interesse': '#9f1239',
    'fechado': '#15803d', 'descartado': '#525252',
}

CSS = """
:root{--fundo:#f6f6f5;--cartao:#fff;--texto:#18181b;--fraco:#67676f;
  --borda:#e4e4e7;--destaque:#047857;--sombra:0 1px 2px rgb(0 0 0/.06)}
@media (prefers-color-scheme:dark){:root:not([data-tema="claro"]){
  --fundo:#121214;--cartao:#1c1c1f;--texto:#f4f4f5;--fraco:#a1a1aa;
  --borda:#2e2e33;--destaque:#34d399;--sombra:none}}
:root[data-tema="escuro"]{--fundo:#121214;--cartao:#1c1c1f;--texto:#f4f4f5;
  --fraco:#a1a1aa;--borda:#2e2e33;--destaque:#34d399;--sombra:none}
*{box-sizing:border-box}
body{margin:0;background:var(--fundo);color:var(--texto);
  font:16px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.env{max-width:860px;margin:0 auto;padding:32px 16px 80px}
h1{font-size:1.5rem;margin:0 0 4px;letter-spacing:-.02em}
.sub{color:var(--fraco);font-size:.875rem;margin:0 0 28px}
.fita{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 32px;padding:0;list-style:none}
.fita li{display:flex;align-items:center;gap:6px;background:var(--cartao);
  border:1px solid var(--borda);border-radius:999px;padding:5px 12px;font-size:.8125rem}
.bola{width:8px;height:8px;border-radius:50%;flex:none}
h2{font-size:1rem;margin:36px 0 12px;display:flex;align-items:center;gap:8px}
h2 .n{color:var(--fraco);font-weight:400;font-size:.875rem}
.lead{background:var(--cartao);border:1px solid var(--borda);border-radius:12px;
  padding:16px;margin-bottom:12px;box-shadow:var(--sombra)}
.topo{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline;
  justify-content:space-between}
.nome{font-weight:650;letter-spacing:-.01em}
.meta{color:var(--fraco);font-size:.8125rem;margin:2px 0 0}
/* O @ do Instagram é para ser tocado no celular: 15px de altura
   não é alvo, é sorte. */
.meta a{color:inherit;display:inline-block;padding:5px 0;min-height:24px}
.msg{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--fundo);
  border:1px solid var(--borda);border-radius:8px;padding:12px;margin:12px 0 0;
  font-size:.9375rem}
.acoes{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;align-items:center}
.bt{display:inline-block;background:var(--destaque);color:#fff;text-decoration:none;
  border-radius:8px;padding:8px 14px;font-size:.875rem;font-weight:600;
  min-height:40px;line-height:24px}
/* No escuro o destaque clareia, e texto branco sobre ele dá 1,8:1.
   O texto do botão vira escuro em vez de o botão virar ilegível. */
@media (prefers-color-scheme:dark){:root:not([data-tema="claro"]) .bt{color:#06281d}}
:root[data-tema="escuro"] .bt{color:#06281d}
code{background:var(--fundo);border:1px solid var(--borda);border-radius:6px;
  padding:3px 7px;font-size:.8125rem;overflow-wrap:anywhere}
.vazio{color:var(--fraco);font-size:.875rem;overflow-wrap:anywhere}
.aviso{background:var(--cartao);border:1px solid var(--borda);
  border-left:3px solid #d97706;border-radius:8px;padding:12px 14px;
  font-size:.875rem;margin:0 0 28px}
@media (max-width:480px){.env{padding:20px 14px 60px}.topo{display:block}}
"""


def _link_whats(e164: str, texto: str) -> str:
    return f'https://wa.me/{e164}?text={urllib.parse.quote(texto)}'


def _cartao_lead(est: Estado, l, incluir_msg: str = '') -> str:
    partes = [f'<article class="lead"><div class="topo">'
              f'<div><div class="nome">#{l.id} {html.escape(l.nome)}</div>'
              f'<p class="meta">{html.escape(l.categoria or "—")} · '
              f'{html.escape(l.cidade)}'
              + (f' · {l.avaliacoes} avaliações' if l.avaliacoes else '')
              + (f' · nota {l.nota:.1f}' if l.nota else '')
              + f' · presença: {html.escape(l.presenca or "—")}</p>'
              f'<p class="meta">'
              + (f'<a href="https://instagram.com/{html.escape(l.instagram)}" '
                 f'target="_blank" rel="noopener">@{html.escape(l.instagram)}</a> · '
                 if l.instagram else '')
              + (html.escape(l.telefone) if l.telefone else 'sem telefone')
              + '</p></div>'
              f'<span class="meta">pontuação {l.pontuacao}/10</span></div>']

    if incluir_msg:
        partes.append(f'<div class="msg">{html.escape(incluir_msg)}</div>')

    d = est.demo(l.id)
    if d and d['url']:
        partes.append(f'<div class="acoes"><a class="bt" href="{html.escape(d["url"])}" '
                      f'target="_blank" rel="noopener">ver o site publicado</a>'
                      f'<code>{html.escape(d["url"])}</code></div>')
    elif d and d['erro']:
        partes.append(f'<p class="meta">demo {html.escape(d["situacao"])}: '
                      f'{html.escape(d["erro"][:200])}</p>')
    partes.append('</article>')
    return ''.join(partes)


def gera(est: Estado, cfg) -> Path:
    resumo = est.resumo()
    total = sum(resumo.values())
    fita = ''.join(
        f'<li><span class="bola" style="background:{COR.get(e, "#999")}"></span>'
        f'{e.replace("_", " ")} <strong>{resumo[e]}</strong></li>'
        for e in ORDEM if resumo.get(e))

    blocos = []

    # Rascunhos primeiro: é o que espera decisão sua.
    rascunhos = est.mensagens(situacao='rascunho', tipo='abordagem')
    aprovadas = est.mensagens(situacao='aprovada', tipo='abordagem')
    entregas = [m for m in est.mensagens(tipo='entrega') if m['situacao'] != 'enviada']

    if rascunhos:
        itens = []
        for m in rascunhos:
            l = est.lead(m['lead_id'])
            cartao = _cartao_lead(est, l, m['texto'])
            acao = (f'<div class="acoes">'
                    f'<code>python3 funil.py aprovar {m["id"]}</code></div>')
            itens.append(cartao.replace('</article>', acao + '</article>'))
        blocos.append(('Esperando você ler', len(rascunhos), ''.join(itens),
                       'Leia antes de aprovar. É a única etapa que não dá para automatizar '
                       'sem queimar o seu número.'))

    if aprovadas:
        itens = []
        for m in aprovadas:
            l = est.lead(m['lead_id'])
            cartao = _cartao_lead(est, l, m['texto'])
            if m['telefone_e164']:
                acao = (f'<div class="acoes">'
                        f'<a class="bt" target="_blank" rel="noopener" '
                        f'href="{html.escape(_link_whats(m["telefone_e164"], m["texto"]))}">'
                        f'abrir no WhatsApp</a>'
                        f'<code>python3 funil.py enviada {m["id"]}</code></div>')
            else:
                acao = '<p class="meta">sem telefone — não dá para enviar</p>'
            itens.append(cartao.replace('</article>', acao + '</article>'))
        blocos.append(('Aprovadas, prontas para mandar', len(aprovadas), ''.join(itens),
                       'Clique, confira no WhatsApp, envie — e confirme com o comando.'))

    if entregas:
        itens = []
        for m in entregas:
            l = est.lead(m['lead_id'])
            cartao = _cartao_lead(est, l, m['texto'])
            if m['telefone_e164']:
                acao = (f'<div class="acoes">'
                        f'<a class="bt" target="_blank" rel="noopener" '
                        f'href="{html.escape(_link_whats(m["telefone_e164"], m["texto"]))}">'
                        f'mandar o link</a></div>')
            else:
                acao = '<p class="meta">sem telefone</p>'
            itens.append(cartao.replace('</article>', acao + '</article>'))
        blocos.append(('Site pronto — mande o link', len(entregas), ''.join(itens), ''))

    for estado in ('quer_demo', 'novo', 'abordado', 'respondeu', 'publicado'):
        leads = est.leads(estado, limite=60)
        if not leads:
            continue
        dica = {
            'quer_demo': 'Ponha as capturas do Instagram em '
                         f'{cfg.material}/&lt;slug&gt;/ e rode: python3 funil.py construir',
            'novo': 'Rode: python3 funil.py escrever',
        }.get(estado, '')
        blocos.append((estado.replace('_', ' '), len(leads),
                       ''.join(_cartao_lead(est, l) for l in leads), dica))

    corpo = ''
    for titulo, n, conteudo, dica in blocos:
        corpo += (f'<h2>{html.escape(titulo)} <span class="n">{n}</span></h2>'
                  + (f'<p class="vazio">{dica}</p>' if dica else '')
                  + conteudo)
    if not corpo:
        corpo = ('<p class="vazio">Banco vazio. Comece com:<br>'
                 '<code>python3 funil.py cacar --cidade "Natal, RN"</code></p>')

    agora = time.strftime('%d/%m/%Y %H:%M')
    pagina = f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Funil</title><style>{CSS}</style></head>
<body><div class="env">
<h1>Funil</h1>
<p class="sub">{total} leads · gerado em {agora} · {html.escape(str(est.caminho))}</p>
<p class="aviso"><strong>Nada daqui dispara sozinho.</strong> Os botões abrem o
WhatsApp com a mensagem escrita; quem aperta enviar é você. Depois de enviar,
rode o comando que aparece embaixo do botão para o funil andar.</p>
<ul class="fita">{fita}</ul>
{corpo}
</div></body></html>"""

    destino = Path(cfg.banco).parent / 'painel.html'
    destino.write_text(pagina, encoding='utf-8')
    return destino
