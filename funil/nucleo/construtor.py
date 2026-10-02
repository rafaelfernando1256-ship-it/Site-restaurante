"""
O CONSTRUTOR

Transforma a leitura do Instagram num site pronto, sem depender de
nenhuma ferramenta externa: uma chamada ao modelo devolve a página
inteira, e o resto é copiar foto e escrever arquivo.

POR QUE UMA PÁGINA SÓ, E NÃO UM PROJETO

Isto é uma DEMONSTRAÇÃO que vai por WhatsApp para alguém decidir em
trinta segundos se gostou. Um arquivo único, sem build e sem
dependência, carrega rápido, abre em qualquer lugar e nunca quebra por
caminho errado de CSS. Projeto com estrutura vem depois, quando ele
fechar — e aí vale o Claude Code.

O QUE O MODELO NÃO PODE INVENTAR

A mesma regra do resto do funil: preço que não estava na foto, horário
que ninguém publicou, avaliação que não existe. O que falta vira um
lugar óbvio para o dono preencher, e a lista do que faltou vai junto na
mensagem de entrega. Site de demonstração com dado inventado é a forma
mais rápida de perder a venda na primeira conferida.
"""
from __future__ import annotations

import re
import shutil
from pathlib import Path
from typing import Any, Sequence

from .modelo import pede_texto

INSTRUCAO = """Você escreve o HTML completo de um site de uma página para um \
restaurante, a partir dos dados que vou te dar.

FORMATO DA SUA RESPOSTA
Só o HTML. Comece com <!doctype html> e termine com </html>. Sem crase, \
sem ```html, sem explicação antes ou depois. CSS dentro de <style> e, se \
precisar, JavaScript dentro de <script>. Arquivo único.

O QUE NÃO PODE, DE JEITO NENHUM
- Inventar preço, horário, endereço, telefone, avaliação, nota, prêmio, \
tempo de casa ou número de clientes. Use SÓ o que está nos dados.
- O que faltar vira um lugar visível para o dono preencher, com o texto \
exato "a combinar" ou "confirmar com a casa" — nunca um número bonito.
- Nada de depoimento. Nada de estrelas. Nada de "desde 1998".
- Nada de banco de imagem: as únicas fotos são as que eu listar.

O QUE TEM QUE TER
- <meta name="robots" content="noindex,nofollow"> no <head>. É uma \
demonstração; ela não pode aparecer na busca e roubar o lugar do negócio real.
- Uma faixa no topo, discreta mas legível, dizendo que é um exemplo e não \
o site oficial.
- Um botão de WhatsApp que abre https://wa.me/<numero> com uma mensagem \
pronta de pedido. O número vem nos dados.
- As fotos que eu listar, com alt descrevendo o que é (nunca "foto 1").
- Funcionar em celular de 360px de largura, sem rolagem lateral.
- Contraste alto: texto escuro em fundo claro ou o contrário. Nada de \
cinza-claro sobre branco.

COMO TEM QUE PARECER
- Use a paleta que eu passar, tirada das fotos da própria casa.
- Tipografia grande, espaçamento generoso, poucas cores.
- Nada de animação além de transições curtas.
- A primeira tela precisa dizer O QUE É e ONDE FICA, e ter o botão de pedido.
"""


def _limpa(bruto: str) -> str:
    """Tira cerca de código e texto solto que o modelo às vezes põe em volta."""
    t = (bruto or '').strip()
    t = re.sub(r'^```[a-zA-Z]*\s*', '', t)
    t = re.sub(r'\s*```$', '', t)
    inicio = t.lower().find('<!doctype')
    if inicio == -1:
        inicio = t.lower().find('<html')
    if inicio > 0:
        t = t[inicio:]
    fim = t.lower().rfind('</html>')
    if fim != -1:
        t = t[:fim + 7]
    return t.strip()


def valida(html: str) -> list[str]:
    """O que está errado nesta página. Lista vazia = pode entregar."""
    problemas = []
    baixo = html.lower()
    if not baixo.startswith('<!doctype') and not baixo.startswith('<html'):
        problemas.append('não começa com <!doctype html>')
    if '</html>' not in baixo:
        problemas.append('não termina com </html> (resposta cortada?)')
    if 'noindex' not in baixo:
        problemas.append('falta o noindex — a demonstração apareceria na busca')
    if 'wa.me/' not in baixo:
        problemas.append('falta o botão de WhatsApp')
    if len(html) < 2000:
        problemas.append(f'página curta demais ({len(html)} letras)')
    return problemas


def _dados(lead, leitura, fotos: Sequence[str]) -> str:
    pratos = '\n'.join(
        f'- {p.nome}' + (f': {p.descricao}' if p.descricao else '')
        + (f' — {p.preco}' if p.preco else ' — PREÇO NÃO INFORMADO')
        for p in leitura.pratos) or '- (nenhum identificado)'
    lista = lambda xs: '\n'.join(f'- {x}' for x in xs) if xs else '- (nada)'
    return f"""NOME: {leitura.nome_exibido}
CIDADE: {lead.cidade}
O QUE É: {leitura.uma_linha}
TOM DE VOZ: {leitura.tom}
INSTAGRAM: @{lead.instagram or '(não sei)'}
WHATSAPP (para o wa.me): {lead.telefone_e164 or '(não informado)'}
TELEFONE VISÍVEL: {leitura.telefone_visivel or '(não informado)'}
ENDEREÇO: {leitura.endereco or 'NÃO INFORMADO — deixe para o dono preencher'}
HORÁRIOS: {leitura.horarios or 'NÃO INFORMADO — deixe para o dono preencher'}

CONHECIDA POR:
{lista(leitura.especialidades)}

O QUE APARECE NO INSTAGRAM:
{pratos}

PALETA (tirada das fotos dela):
{lista(leitura.paleta)}

SEÇÕES, NESTA ORDEM:
{lista(leitura.secoes)}

FOTOS DISPONÍVEIS (use exatamente estes caminhos, em src="img/NOME"):
{lista(fotos)}

O QUE EU NÃO SEI — NÃO PREENCHA, deixe o lugar pronto para o dono:
{lista(leitura.nao_sei)}
"""


def monta_site(lead, leitura, imagens: Sequence[Path], pasta: Path, cfg,
               tentativas: int = 2) -> tuple[Path, list[str]]:
    """
    Escreve o site em `pasta/publico/`. Devolve (pasta_publico, avisos).
    """
    publico = pasta / 'publico'
    imgs = publico / 'img'
    imgs.mkdir(parents=True, exist_ok=True)

    nomes = []
    for p in imagens:
        destino = imgs / p.name
        if not destino.exists():
            shutil.copy2(p, destino)
        nomes.append(p.name)

    pedido = _dados(lead, leitura, nomes)
    problemas: list[str] = []
    html = ''
    for t in range(tentativas):
        extra = ''
        if problemas:
            extra = ('\n\nA sua resposta anterior teve estes problemas. '
                     'Corrija TODOS e mande a página inteira de novo:\n'
                     + '\n'.join(f'- {x}' for x in problemas))
        html = _limpa(pede_texto(INSTRUCAO, pedido + extra,
                                 modelo=cfg.modelo_do_cerebro,
                                 max_tokens=32000, provedor=cfg.provedor))
        problemas = valida(html)
        if not problemas:
            break

    if problemas:
        raise RuntimeError('a página saiu com problema: ' + '; '.join(problemas))

    (publico / 'index.html').write_text(html, encoding='utf-8')
    (publico / 'robots.txt').write_text('User-agent: *\nDisallow: /\n', encoding='utf-8')
    return publico, leitura.nao_sei
