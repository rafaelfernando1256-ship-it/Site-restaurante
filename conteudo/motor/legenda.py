"""
A LEGENDA — o texto que carrega o vídeo.

No TikTok a maioria assiste SEM SOM. A legenda não é acessório da
narração: ela é o conteúdo, e a narração é que acompanha. Por isso ela é
grande, fica no meio, e uma frase por quadro.

Quatro decisões que vêm da tela do celular, não de gosto:

  • UMA FRASE POR QUADRO. Parede de texto no feed não é lida — é rolada.
  • MEIO DA TELA, não embaixo. O rodapé do TikTok é coberto por @, trilha
    e botões. Texto ali some atrás da interface do app.
  • CONTORNO PRETO, não caixa. Caixa atrás do texto tapa a foto e grita
    "template". Contorno grosso dá legibilidade sobre qualquer imagem.
  • MARGEM DE 12% dos lados. O app corta as bordas em telas diferentes, e
    texto encostado no limite aparece cortado em metade dos aparelhos.

A palavra marcada com *asterisco* sai na cor de destaque. É o único
recurso de ênfase — negrito dentro de negrito não se vê.
"""
from __future__ import annotations

import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from .visual import ALTURA, LARGURA, Tema, DARK

# Nenhuma condensada bonita vem instalada por padrão em Linux nem em
# Windows limpo. A ordem vai da melhor para a que sempre existe, e o
# LEIAME diz como instalar uma de verdade — muda bastante o resultado.
FONTES = [
    '/usr/share/fonts/truetype/anton/Anton-Regular.ttf',
    '/usr/share/fonts/truetype/oswald/Oswald-Bold.ttf',
    'C:/Windows/Fonts/impact.ttf',
    'C:/Windows/Fonts/arialbd.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
]

MARGEM = int(LARGURA * 0.12)
DESTAQUE = re.compile(r'\*([^*]+)\*')


def acha_fonte(tamanho: int) -> ImageFont.FreeTypeFont:
    for caminho in FONTES:
        if Path(caminho).exists():
            return ImageFont.truetype(caminho, tamanho)
    return ImageFont.load_default(tamanho)


def _quebra(texto: str, fonte, largura_max: int, desenho) -> list[str]:
    """Quebra por palavra, medindo de verdade — não por contagem de letra."""
    linhas, atual = [], ''
    for palavra in texto.split():
        tentativa = f'{atual} {palavra}'.strip()
        if desenho.textlength(tentativa, font=fonte) <= largura_max or not atual:
            atual = tentativa
        else:
            linhas.append(atual)
            atual = palavra
    if atual:
        linhas.append(atual)
    return linhas


def _cabe(texto: str, desenho, largura_max: int, altura_max: int,
          maior: int = 110, menor: int = 46) -> tuple[ImageFont.FreeTypeFont, list[str]]:
    """
    Acha o maior corpo que cabe. Diminuir a fonte até caber é melhor que
    cortar a frase: frase cortada no meio é o que mais faz rolar o feed.
    """
    for tamanho in range(maior, menor - 1, -4):
        fonte = acha_fonte(tamanho)
        linhas = _quebra(texto, fonte, largura_max, desenho)
        alto = len(linhas) * int(tamanho * 1.18)
        if alto <= altura_max:
            return fonte, linhas
    fonte = acha_fonte(menor)
    return fonte, _quebra(texto, fonte, largura_max, desenho)


def _escreve_linha(d, x: int, y: int, texto: str, fonte, tema: Tema,
                   realcado: bool) -> None:
    cor = tema.destaque if realcado else tema.texto
    # Contorno grosso em vez de caixa: legível sobre qualquer foto, sem
    # tapar a imagem nem parecer template.
    d.text((x, y), texto, font=fonte, fill=cor,
           stroke_width=max(4, fonte.size // 14), stroke_fill=(0, 0, 0))


def escreve(fundo: Image.Image, texto: str, tema: Tema = DARK,
            posicao: str = 'meio') -> Image.Image:
    """
    Põe a frase no quadro. `*palavra*` sai na cor de destaque.

    `posicao`: meio (padrão), alto ou baixo. Baixo é arriscado no TikTok —
    a interface do app cobre o rodapé.
    """
    img = fundo.copy()
    d = ImageDraw.Draw(img)
    largura_max = LARGURA - 2 * MARGEM
    altura_max = int(ALTURA * 0.42)

    limpo = DESTAQUE.sub(r'\1', texto)
    fonte, linhas = _cabe(limpo, d, largura_max, altura_max)
    passo = int(fonte.size * 1.18)
    alto = len(linhas) * passo
    y = {'alto': int(ALTURA * 0.17),
         'baixo': int(ALTURA * 0.62),
         }.get(posicao, (ALTURA - alto) // 2)

    # Quais trechos eram destacados, para recolorir palavra a palavra.
    marcadas = {p.lower() for m in DESTAQUE.finditer(texto)
                for p in m.group(1).split()}

    for linha in linhas:
        largura = d.textlength(linha, font=fonte)
        x = int((LARGURA - largura) / 2)
        if marcadas:
            for palavra in linha.split():
                nu = palavra.strip('.,!?:;').lower()
                _escreve_linha(d, x, y, palavra, fonte, tema, nu in marcadas)
                x += int(d.textlength(palavra + ' ', font=fonte))
        else:
            _escreve_linha(d, x, y, linha, fonte, tema, False)
        y += passo
    return img


def quadro(imagem: Path | None, texto: str, destino: Path,
           tema: Tema = DARK, posicao: str = 'meio') -> Path:
    """Um quadro pronto: imagem tratada (ou preto puro) + a frase."""
    from .visual import quadro_vazio
    fundo = (Image.open(imagem).convert('RGB') if imagem
             else quadro_vazio(tema))
    if fundo.size != (LARGURA, ALTURA):
        fundo = fundo.resize((LARGURA, ALTURA), Image.LANCZOS)
    saida = escreve(fundo, texto, tema, posicao)
    destino.parent.mkdir(parents=True, exist_ok=True)
    saida.save(destino, 'JPEG', quality=92)
    return destino
