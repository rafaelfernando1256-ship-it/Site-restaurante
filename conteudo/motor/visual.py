"""
O VISUAL DARK — o que faz o feed parecer um só, e não um banco de imagens.

A identidade é feita de quatro decisões, e são elas que o olho reconhece
antes de ler qualquer palavra:

  1. PRETO DE VERDADE, não cinza-escuro. #000 puro. Em tela OLED de
     celular — que é onde o TikTok é visto — o preto puro apaga o pixel,
     e a imagem parece flutuar sem moldura. Cinza #111 vira um retângulo
     visível. Essa diferença é a maior de todas, e custa zero.
  2. DESSATURAR E ABRIR O CONTRASTE. Foto de banco de imagem vem colorida
     e alegre; é isso que denuncia estoque. Puxar a saturação para ~35% e
     abrir o contraste faz foto de origens diferentes parecerem da mesma
     sessão.
  3. VINHETA. Escurece a borda e empurra o olho para o centro — e, na
     prática, é o que deixa a legenda legível sem caixa atrás dela.
  4. UMA COR DE DESTAQUE SÓ. Tudo em branco e preto, e uma cor para o que
     importa. Duas cores de destaque já é tema, não identidade.

Sem gradiente, sem brilho, sem sombra colorida. Tudo que parece "efeito"
envelhece em três meses e some no feed.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

# TikTok, Reels, Shorts: todos 1080x1920.
LARGURA, ALTURA = 1080, 1920


@dataclass
class Tema:
    """
    O tema dark. Trocar `destaque` muda a identidade inteira sem mexer em
    mais nada — é o único parâmetro que vale brincar.
    """
    fundo: tuple[int, int, int] = (0, 0, 0)
    texto: tuple[int, int, int] = (255, 255, 255)
    destaque: tuple[int, int, int] = (220, 38, 38)   # vermelho seco

    # Estes quatro números foram calibrados OLHANDO três intensidades
    # lado a lado, não por palpite. Os valores tímidos da primeira versão
    # (0.35 / 1.25 / 0.82) deixavam a foto ainda clara e colorida — lia
    # como banco de imagens com filtro, que é o que se quer evitar.
    # Escurecer mais que isto (brilho 0.52) come o assunto junto com a
    # borda: o rosto some e sobra textura.
    saturacao: float = 0.22       # 0 = cinza puro, 1 = como veio
    contraste: float = 1.35
    brilho: float = 0.62          # escurece: o texto branco precisa de chão
    vinheta: float = 0.92         # quanto a borda escurece (0 a 1)
    grao: int = 7                 # ruído leve; 0 desliga


DARK = Tema()


def _corta_vertical(img: Image.Image) -> Image.Image:
    """
    Corta para 9:16 pelo CENTRO-ALTO, não pelo centro.

    Em foto de pessoa o assunto é o tronco e o rosto, que ficam no terço
    superior. Cortar pelo centro geométrico decapita metade das fotos de
    corpo inteiro — e é o erro que faz o corte automático parecer burro.
    """
    alvo = LARGURA / ALTURA
    l, a = img.size
    if l / a > alvo:
        nova_l = int(a * alvo)
        esquerda = (l - nova_l) // 2
        img = img.crop((esquerda, 0, esquerda + nova_l, a))
    else:
        nova_a = int(l / alvo)
        # 15% do que sobra sai de cima, 85% de baixo
        topo = int((a - nova_a) * 0.15)
        img = img.crop((0, topo, l, topo + nova_a))
    return img.resize((LARGURA, ALTURA), Image.LANCZOS)


def _vinheta(img: Image.Image, forca: float) -> Image.Image:
    if forca <= 0:
        return img
    l, a = img.size
    mascara = Image.new('L', (l, a), 0)
    d = ImageDraw.Draw(mascara)
    # A elipse mal pode passar do quadro. A primeira versão usava
    # -35%/+135%, tão maior que o quadro que o borrão não alcançava a
    # borda e a vinheta simplesmente não aparecia — parâmetro ligado que
    # não fazia nada, que é pior que parâmetro desligado.
    d.ellipse((-l * 0.10, a * 0.02, l * 1.10, a * 0.98), fill=255)
    mascara = mascara.filter(ImageFilter.GaussianBlur(min(l, a) // 4))
    escuro = Image.new('RGB', (l, a), (0, 0, 0))
    return Image.composite(img, Image.blend(img, escuro, forca), mascara)


def _grao(img: Image.Image, forca: int) -> Image.Image:
    """
    Ruído leve. Parece detalhe bobo e não é: é o que tira o aspecto de
    banco de imagens e aproxima de foto tirada, não comprada.
    """
    if forca <= 0:
        return img
    import numpy as np
    a = np.asarray(img).astype(np.int16)
    ruido = np.random.default_rng(42).integers(-forca, forca + 1, a.shape[:2])
    a = np.clip(a + ruido[:, :, None], 0, 255)
    return Image.fromarray(a.astype('uint8'))


def trata(origem: Path, destino: Path, tema: Tema = DARK) -> Path:
    """Foto crua → quadro 9:16 com a identidade aplicada."""
    img = Image.open(origem).convert('RGB')
    img = _corta_vertical(img)
    img = ImageEnhance.Color(img).enhance(tema.saturacao)
    img = ImageEnhance.Contrast(img).enhance(tema.contraste)
    img = ImageEnhance.Brightness(img).enhance(tema.brilho)
    img = _vinheta(img, tema.vinheta)
    img = _grao(img, tema.grao)
    destino.parent.mkdir(parents=True, exist_ok=True)
    img.save(destino, 'JPEG', quality=92)
    return destino


def quadro_vazio(tema: Tema = DARK) -> Image.Image:
    """Um quadro só de fundo — para capa, corte seco e cartela de fim."""
    return Image.new('RGB', (LARGURA, ALTURA), tema.fundo)
