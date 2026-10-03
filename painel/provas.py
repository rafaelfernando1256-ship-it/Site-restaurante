#!/usr/bin/env python3
"""
PROVAS DO PAINEL — python3 provas.py

Sobe um servidor, abre o painel num Chrome de verdade e clica nele. É
teste de navegador porque o painel é navegador: metade dos defeitos
desta coisa só aparece depois do terceiro redesenho de tela.

O que ele cobre, e por quê:

  • um clique faz UMA coisa. Os agentes registram ouvintes delegados no
    elemento da tela; se o elemento sobreviver ao redesenho, o segundo
    clique vira dois. Já aconteceu.
  • o código Pix fecha com o próprio CRC — dinheiro errado não volta.
  • o que você digita sobrevive a trocar de tela e recarregar.
  • nenhuma tela quebra em celular de 360px.
"""
from __future__ import annotations

import asyncio
import json
import re
import subprocess
import sys
import time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
PORTA = 8799
ENDERECO = f'http://127.0.0.1:{PORTA}'
CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

SEMENTE = {
    'versao': 1,
    'negocio': {'nome': 'Rafael Fernando', 'cidade': 'Natal, RN',
                'whatsapp': '84988887777', 'pixChave': 'teste@exemplo.com',
                'pixNome': 'Rafael Fernando', 'pixCidade': 'NATAL'},
    'precos': {'montagem': 900, 'mensalidade': 90, 'prazoDias': 5,
               'alteracoesInclusas': 2, 'paginas': 1, 'custoHora': 60,
               'horasEstimadas': 8, 'margem': 2},
    'chaves': {'gemini': ''},
    'leads': [
        {'id': 'l1', 'nome': 'Cantina da Vó Zuleica', 'cidade': 'Natal, RN',
         'telefone': '5584988887777', 'instagram': 'cantinadavo',
         'url': 'https://instagram.com/cantinadavo', 'presenca': 'so_rede',
         'pontuacao': 9, 'etapa': 'novo', 'avaliacoes': 180, 'nota': 4.6},
        {'id': 'l4', 'nome': 'Tapiocaria Dona Lita', 'cidade': 'Natal, RN',
         'telefone': '5584955554444', 'instagram': 'donalita',
         'url': 'https://instagram.com/donalita', 'presenca': 'so_rede',
         'pontuacao': 9, 'etapa': 'fechado', 'avaliacoes': 95, 'nota': 4.8},
    ],
    'cobrancas': [], 'indicacoes': [],
}

CASOS = []
def prova(nome):
    def envolve(f):
        CASOS.append((nome, f))
        return f
    return envolve


def so_espaco(texto: str) -> str:
    """
    O pt-BR do navegador separa "R$" do número com espaço ESTREITO SEM
    QUEBRA (U+202F/U+00A0), não com espaço comum. Comparar string de
    dinheiro sem normalizar isso falha sem motivo aparente.
    """
    return re.sub(r'[\u00a0\u202f\s]+', ' ', texto)


def crc16(texto: str) -> str:
    crc = 0xFFFF
    for ch in texto:
        crc ^= ord(ch) << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) & 0xFFFF if crc & 0x8000 else (crc << 1) & 0xFFFF
    return f'{crc:04X}'


async def abre(pg, aba='cacador', semear=True):
    await pg.goto(f'{ENDERECO}/index.html')
    if semear:
        await pg.evaluate("(d) => localStorage.setItem('painel-vendas-v1', JSON.stringify(d))",
                          SEMENTE)
        await pg.evaluate("() => localStorage.setItem('painel-apresentado','1')")
    # Trocar só o # NÃO recarrega a página, e o estado é lido uma vez na
    # abertura: sem o reload, a prova rodaria sobre um painel vazio.
    await pg.goto(f'{ENDERECO}/index.html#{aba}')
    await pg.reload()
    await pg.wait_for_timeout(400)


async def estado(pg):
    return await pg.evaluate(
        "() => JSON.parse(localStorage.getItem('painel-vendas-v1') || '{}')")


# ── as provas ───────────────────────────────────────────────────────
@prova('um clique gera UMA cobrança, mesmo depois de rodar as telas')
async def _(pg):
    await abre(pg, 'receber')
    # Passeia por todas as telas: é o que empilhava ouvinte.
    for aba in ('cacador', 'abordagem', 'demo', 'preco', 'receber',
                'cacador', 'receber'):
        await pg.goto(f'{ENDERECO}/index.html#{aba}')
        await pg.wait_for_timeout(120)
    await pg.fill('[name=valor]', '1200')
    await pg.fill('[name=descricao]', 'Montagem')
    await pg.click('[data-fazer="gerar"]')
    await pg.wait_for_timeout(500)
    e = await estado(pg)
    assert len(e['cobrancas']) == 1, f'criou {len(e["cobrancas"])} cobranças num clique'


@prova('o código Pix fecha com o próprio CRC')
async def _(pg):
    await abre(pg, 'receber')
    await pg.fill('[name=valor]', '899.90')
    await pg.click('[data-fazer="gerar"]')
    await pg.wait_for_timeout(500)
    codigo = (await estado(pg))['cobrancas'][0]['codigo']
    assert codigo.startswith('000201'), 'não começa com 000201'
    assert 'br.gov.bcb.pix' in codigo
    assert '5406899.90' in codigo, f'o valor não entrou: {codigo}'
    assert crc16(codigo[:-4]) == codigo[-4:], 'o CRC não confere'


@prova('a tabela e os números acompanham a cobrança nova')
async def _(pg):
    await abre(pg, 'receber')
    await pg.fill('[name=valor]', '450')
    await pg.fill('[name=descricao]', 'Ajuste')
    await pg.click('[data-fazer="gerar"]')
    await pg.wait_for_timeout(500)
    texto = so_espaco(await pg.inner_text('#tela'))
    assert 'Ajuste' in texto, 'a cobrança nova não apareceu na tabela'
    assert 'R$ 450,00' in texto, f'o valor não apareceu'


@prova('colar uma lista vira leads com telefone e Instagram prontos')
async def _(pg):
    await abre(pg, 'cacador')
    await pg.fill('[name=colar]',
                  'Pizzaria Teste, 84 98888-1111, @pizzariateste, Natal\n'
                  'Boteco Dois; 84 97777-2222; ; Natal')
    await pg.click('[data-fazer="importar"]')
    await pg.wait_for_timeout(400)
    leads = (await estado(pg))['leads']
    novos = [l for l in leads if l['nome'].startswith(('Pizzaria Teste', 'Boteco Dois'))]
    assert len(novos) == 2, f'importou {len(novos)}'
    p = next(l for l in novos if l['nome'] == 'Pizzaria Teste')
    assert p['telefone'] == '5584988881111', p['telefone']
    assert p['instagram'] == 'pizzariateste', p['instagram']
    assert p['presenca'] == 'so_rede', p['presenca']


@prova('o que você digita sobrevive a trocar de tela e recarregar')
async def _(pg):
    await abre(pg, 'abordagem')
    await pg.fill('textarea[data-msg]', 'Mensagem escrita à mão')
    await pg.wait_for_timeout(300)
    await pg.goto(f'{ENDERECO}/index.html#preco')
    await pg.wait_for_timeout(200)
    await pg.reload()
    await pg.goto(f'{ENDERECO}/index.html#abordagem')
    await pg.wait_for_timeout(350)
    valor = await pg.input_value('textarea[data-msg]')
    assert valor == 'Mensagem escrita à mão', f'perdeu o texto: {valor!r}'


@prova('marcar o checklist de entrega guarda, e completar move para entregue')
async def _(pg):
    await abre(pg, 'entregar')
    caixas = pg.locator('input[data-marcar]')
    n = await caixas.count()
    assert n >= 8, f'só {n} itens no checklist'
    for i in range(n):
        await caixas.nth(i).check()
        await pg.wait_for_timeout(60)
    await pg.wait_for_timeout(400)
    e = await estado(pg)
    lead = next(l for l in e['leads'] if l['id'] == 'l4')
    assert lead['etapa'] == 'entregue', f'ficou em {lead["etapa"]}'


@prova('o preço muda a resposta pronta na hora')
async def _(pg):
    await abre(pg, 'preco')
    await pg.fill('[name=montagem]', '1500')
    await pg.wait_for_timeout(300)
    resposta = so_espaco(await pg.inner_text('#resposta'))
    assert 'R$ 1.500,00' in resposta, f'a resposta não acompanhou: {resposta[:80]}'


@prova('nenhuma tela quebra em celular de 360px')
async def _(pg):
    await pg.set_viewport_size({'width': 360, 'height': 780})
    for aba in ('cacador', 'abordagem', 'demo', 'preco', 'receber',
                'entregar', 'manter', 'crescer', 'ajustes'):
        await abre(pg, aba)
        largura = await pg.evaluate(
            '() => [document.documentElement.scrollWidth, window.innerWidth]')
        assert largura[0] <= largura[1] + 1, f'#{aba} rola de lado: {largura}'
        texto = await pg.inner_text('#tela')
        assert 'Essa tela quebrou' not in texto, f'#{aba} quebrou'
        assert len(texto) > 40, f'#{aba} veio vazia'
    await pg.set_viewport_size({'width': 1180, 'height': 900})


@prova('a página se recusa a trabalhar com o Pix quebrado')
async def _(pg):
    await abre(pg, 'ajustes')
    # Sem chave Pix, gerar tem que falhar com recado, não criar cobrança torta.
    await pg.evaluate("""() => {
      const d = JSON.parse(localStorage.getItem('painel-vendas-v1'));
      d.negocio.pixChave = '';
      localStorage.setItem('painel-vendas-v1', JSON.stringify(d));
    }""")
    await pg.goto(f'{ENDERECO}/index.html#receber')
    await pg.reload()
    await pg.wait_for_timeout(400)
    await pg.click('[data-fazer="gerar"]')
    await pg.wait_for_timeout(400)
    e = await estado(pg)
    assert not e['cobrancas'], 'criou cobrança sem chave Pix'


@prova('sem a chave do Gemini o painel avisa em vez de quebrar')
async def _(pg):
    await abre(pg, 'abordagem')
    texto = await pg.inner_text('#tela')
    assert 'chave do Gemini' in texto, 'não avisou que falta a chave'
    await pg.click('[data-escrever]')
    await pg.wait_for_timeout(600)
    valor = await pg.input_value('textarea[data-msg]')
    assert len(valor) > 60, f'não escreveu a mensagem de reserva: {valor!r}'


async def principal() -> int:
    from playwright.async_api import async_playwright
    servidor = subprocess.Popen(
        [sys.executable, '-m', 'http.server', str(PORTA)], cwd=RAIZ,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.2)
    ok = falhas = 0
    try:
        async with async_playwright() as p:
            nav = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
            print()
            for nome, f in CASOS:
                ctx = await nav.new_context(viewport={'width': 1180, 'height': 900})
                pg = await ctx.new_page()
                quebras = []
                pg.on('pageerror', lambda e: quebras.append(str(e)))
                try:
                    await f(pg)
                    if quebras:
                        raise AssertionError('erro de JS: ' + quebras[0])
                    ok += 1
                    print(f'  ✓ {nome}')
                except Exception as e:
                    falhas += 1
                    print(f'  ✗ {nome}\n      {type(e).__name__}: {e}')
                await ctx.close()
            await nav.close()
    finally:
        servidor.terminate()
    print(f'\n  {ok + falhas} provas · {ok} passando · {falhas} falhando\n')
    return 1 if falhas else 0


if __name__ == '__main__':
    raise SystemExit(asyncio.run(principal()))
