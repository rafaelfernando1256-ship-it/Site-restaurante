#!/usr/bin/env python3
"""
PROVAS DO ESTÚDIO — python3 provas.py

Teste de navegador porque o estúdio é navegador: o tratamento da imagem é
Canvas, o download depende de CORS, e nada disso aparece em teste de
unidade.

O modelo e o acervo entram como dublê — o que precisa de prova aqui é a
tela, não a rede.
"""
from __future__ import annotations

import asyncio
import json
import subprocess
import sys
import time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
PORTA = 8801
ENDERECO = f'http://127.0.0.1:{PORTA}'
CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

CASOS = []
def prova(nome):
    def envolve(f):
        CASOS.append((nome, f))
        return f
    return envolve


ROTEIRO_FALSO = {
    'gancho': 'Seu quarto treino é o mais *fraco* da semana.',
    'quadros': [
        {'fala': 'Na quarta sessão você levanta menos que na primeira.',
         'busca': 'empty gym night'},
        {'fala': 'Dois dias de treino, dois de descanso.', 'busca': 'calendar'},
    ],
    'fechamento': 'Registre a *carga* e compare na semana que vem.',
    'legenda_post': 'Progressão > frequência. #treino #academia',
    'aposta': 'lacuna no gancho, fechada pelo teste do caderno',
    'diagnostico': 'O gancho original afirmava sem base.',
}

ROTEIRO_SUJO = dict(ROTEIRO_FALSO, gancho='A carga costuma cair no fim.',
                    aposta='lacuna')


async def abre(pg, resposta=None, chaves=None):
    """Abre o estúdio com o modelo dublado."""
    await pg.goto(f'{ENDERECO}/index.html')
    await pg.evaluate(
        "(d) => localStorage.setItem('estudio-v1', JSON.stringify(d))",
        {'chaves': {'groq': 'gsk_de_teste', **(chaves or {})}, 'tema': '', 'biotipo': ''})
    if resposta is not None:
        # Dubla o fetch ANTES de a página rodar: nenhuma chamada sai daqui.
        await pg.add_init_script("""
          window.__pedidos = [];
          const real = window.fetch;
          window.fetch = async (u, o) => {
            window.__pedidos.push(String(u));
            if (String(u).includes('groq') || String(u).includes('openrouter')
                || String(u).includes('generativelanguage')) {
              return new Response(JSON.stringify({ choices: [{ message:
                { content: window.__resposta } }] }), { status: 200 });
            }
            return real(u, o);
          };
        """)
        await pg.goto(f'{ENDERECO}/index.html')
        await pg.evaluate('(r) => { window.__resposta = r; }',
                          json.dumps(resposta))
    await pg.wait_for_timeout(250)


async def escreve(pg, tema='por que voce nao progride'):
    await pg.fill('#tema', tema)
    await pg.click('#escrever')
    await pg.wait_for_timeout(700)


# ── as provas ───────────────────────────────────────────────────────
@prova('sem chave, avisa em vez de quebrar')
async def _(pg):
    await pg.goto(f'{ENDERECO}/index.html')
    await pg.evaluate("() => localStorage.removeItem('estudio-v1')")
    await pg.reload()
    await pg.wait_for_timeout(250)
    await pg.fill('#tema', 'qualquer coisa')
    await pg.click('#escrever')
    await pg.wait_for_timeout(300)
    texto = await pg.inner_text('#recado')
    assert 'chave' in texto.lower(), f'não avisou: {texto!r}'


@prova('o roteiro vira quadros, e cada quadro é 1080x1920')
async def _(pg):
    await abre(pg, ROTEIRO_FALSO)
    await escreve(pg)
    quadros = await pg.query_selector_all('[data-canvas]')
    # gancho + 2 corpos + fechamento
    assert len(quadros) == 4, f'{len(quadros)} quadros'
    tam = await pg.evaluate("""() => {
      const c = document.querySelector('[data-canvas="0"]');
      return [c.width, c.height];
    }""")
    assert tam == [1080, 1920], tam


@prova('editar a frase redesenha o quadro na hora')
async def _(pg):
    await abre(pg, ROTEIRO_FALSO)
    await escreve(pg)
    antes = await pg.evaluate(
        """() => document.querySelector('[data-canvas="1"]').toDataURL().length""")
    await pg.fill('[data-fala="1"]',
                  'Uma frase completamente diferente e bem mais longa que a outra')
    await pg.wait_for_timeout(300)
    depois = await pg.evaluate(
        """() => document.querySelector('[data-canvas="1"]').toDataURL().length""")
    assert antes != depois, 'o quadro não acompanhou o texto'


@prova('sem imagem o quadro é preto PURO, não cinza')
async def _(pg):
    await abre(pg, ROTEIRO_FALSO)
    await escreve(pg)
    cantos = await pg.evaluate("""() => {
      const c = document.querySelector('[data-canvas="0"]');
      const x = c.getContext('2d');
      return [[4,4],[c.width-4,4],[4,c.height-4]].map(([a,b]) =>
        Array.from(x.getImageData(a,b,1,1).data).slice(0,3));
    }""")
    # Em OLED o preto puro apaga o pixel e a imagem flutua sem moldura;
    # #111 vira um retângulo visível no feed.
    for c in cantos:
        assert max(c) <= 6, f'canto não é preto puro: {c}'


@prova('a palavra marcada sai na cor de destaque')
async def _(pg):
    await abre(pg, ROTEIRO_FALSO)
    await escreve(pg)
    tem = await pg.evaluate("""() => {
      const c = document.querySelector('[data-canvas="0"]');
      const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 170 && d[i+1] < 90 && d[i+2] < 90) n++;
      }
      return n;
    }""")
    assert tem > 400, f'o *asterisco* não virou cor: {tem} pixels'


@prova('a verificação reprova o mesmo roteiro que o terminal reprova')
async def _(pg):
    await abre(pg, ROTEIRO_SUJO)
    await escreve(pg)
    texto = await pg.inner_text('#roteiro')
    # "costuma" e a aposta de uma palavra: os dois achados que o
    # motor/gatilhos.py também pega. Se o site afrouxar o que o terminal
    # recusa, a verificação não vale nada.
    assert 'costuma' in texto, 'não pegou a muleta'
    assert 'Ainda torto' in texto, 'não mostrou os achados'


@prova('roteiro sujo é refeito uma vez, e não mais que uma')
async def _(pg):
    await abre(pg, ROTEIRO_SUJO)
    await escreve(pg)
    idas = await pg.evaluate(
        """() => (window.__pedidos||[]).filter(u => u.includes('groq')).length""")
    assert idas == 2, f'{idas} chamadas ao modelo (esperava 2: a 1ª e a correção)'


@prova('roteiro limpo não gasta uma segunda chamada')
async def _(pg):
    await abre(pg, ROTEIRO_FALSO)
    await escreve(pg)
    idas = await pg.evaluate(
        """() => (window.__pedidos||[]).filter(u => u.includes('groq')).length""")
    assert idas == 1, f'{idas} chamadas — refez um roteiro que já estava bom'


@prova('a foto do celular desenha e não contamina o canvas')
async def _(pg):
    await abre(pg, ROTEIRO_FALSO)
    await escreve(pg)
    # Um PNG de 2x2 entregue como arquivo local: mesma origem, nunca
    # contamina — é por isso que a foto do celular é a saída quando o
    # acervo não libera leitura.
    await pg.set_input_files('[data-arquivo="1"]', {
        'name': 'foto.png', 'mimeType': 'image/png',
        'buffer': bytes.fromhex(
            '89504e470d0a1a0a0000000d49484452000000020000000208060000'
            '00f478d4fa0000001649444154789c6360f8cfc0f01f8c0a0c0c0c8a'
            '0100b0aa05fd4a4f0a7c0000000049454e44ae426082')})
    await pg.wait_for_timeout(400)
    pode = await pg.evaluate("""() => {
      const c = document.querySelector('[data-canvas="1"]');
      try { c.toDataURL(); return true; } catch { return false; }
    }""")
    assert pode, 'o canvas contaminou com um arquivo local'


@prova('nenhuma tela quebra em celular de 360px')
async def _(pg):
    await pg.set_viewport_size({'width': 360, 'height': 760})
    await abre(pg, ROTEIRO_FALSO)
    await escreve(pg)
    largura = await pg.evaluate(
        '() => [document.documentElement.scrollWidth, window.innerWidth]')
    assert largura[0] <= largura[1] + 1, f'rolagem lateral: {largura}'


@prova('a página diz que não posta sozinha')
async def _(pg):
    await pg.goto(f'{ENDERECO}/index.html')
    texto = await pg.inner_text('body')
    assert 'posta sozinho' in texto, 'sumiu o aviso de postagem'


async def principal() -> int:
    from playwright.async_api import async_playwright
    servidor = subprocess.Popen(
        [sys.executable, '-m', 'http.server', str(PORTA)], cwd=RAIZ,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.2)
    ok = falhas = 0
    try:
        async with async_playwright() as p:
            nav = await p.chromium.launch(executable_path=CHROME,
                                          args=['--no-sandbox'])
            print()
            for nome, f in CASOS:
                ctx = await nav.new_context(viewport={'width': 1100, 'height': 900})
                pg = await ctx.new_page()
                quebras = []
                pg.on('pageerror', lambda e: quebras.append(str(e)))
                try:
                    await f(pg)
                    if quebras:
                        raise AssertionError('erro de JS: ' + quebras[0])
                    ok += 1
                    print(f'  \033[32m✓\033[0m {nome}')
                except Exception as e:
                    falhas += 1
                    print(f'  \033[31m✗\033[0m {nome}')
                    print(f'      {type(e).__name__}: {str(e)[:200]}')
                finally:
                    await ctx.close()
            await nav.close()
    finally:
        servidor.terminate()
    print(f'\n  {ok + falhas} provas · {ok} passando · {falhas} falhando\n')
    return 1 if falhas else 0


if __name__ == '__main__':
    raise SystemExit(asyncio.run(principal()))
