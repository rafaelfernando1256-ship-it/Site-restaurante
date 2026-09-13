# -*- coding: utf-8 -*-
"""VANTA STORE — arte de catálogo em SVG.

Cada produto é desenhado como uma foto de e-commerce: peça centrada,
fundo neutro chapado, luz vindo de cima à esquerda. O volume do tecido
vem de três camadas empilhadas — preto em opacidade baixa nas sombras,
branco em opacidade baixa nos realces e costuras em um tom escurecido
da própria cor da peça. É isso que separa "silhueta colorida" de
"roupa fotografada".
"""
import math, os, colorsys

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'publico', 'assets') + os.sep
os.makedirs(OUT, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

# ── utilidades de cor ─────────────────────────────────────────
def _hex(r, g, b):
    return '#%02X%02X%02X' % (max(0, min(255, int(r))), max(0, min(255, int(g))), max(0, min(255, int(b))))

def mistura(cor, alvo, t):
    c = cor.lstrip('#'); a = alvo.lstrip('#')
    return _hex(*[int(c[i:i+2], 16) * (1-t) + int(a[i:i+2], 16) * t for i in (0, 2, 4)])

escuro = lambda c, t=.22: mistura(c, '#000000', t)
claro  = lambda c, t=.22: mistura(c, '#FFFFFF', t)

# ── paleta ────────────────────────────────────────────────────
FUNDOS = {
    'osso':   '#EFEAE2', 'areia': '#E4DACA', 'pedra': '#DCDCD9',
    'fumo':   '#CFCDC8', 'sage':  '#D8DCCC', 'gelo':  '#E7EBEE',
    'barro':  '#E0CFC2', 'noite': '#191919',
}
TECIDOS = {
    'preto':    '#17171A', 'grafite': '#3B3B40', 'cinza': '#9A9AA0',
    'mescla':   '#B4B4B8', 'offwhite': '#F1EDE4', 'branco': '#FAFAF8',
    'areia':    '#CBB99A', 'caqui':   '#A8966F', 'oliva':  '#575E42',
    'indigo':   '#2F3A4E', 'marrom':  '#6D5140', 'vinho':  '#6A2E33',
}

def defs(s):
    return f'''<defs>
  <linearGradient id="vidro{s}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/>
    <stop offset="0.18" stop-color="#FFFFFF" stop-opacity=".1"/>
    <stop offset="0.5" stop-color="#000000" stop-opacity=".08"/>
    <stop offset="0.82" stop-color="#FFFFFF" stop-opacity=".22"/>
    <stop offset="1" stop-color="#000000" stop-opacity=".12"/>
  </linearGradient>
  <linearGradient id="aco{s}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FDFDFE"/><stop offset="0.2" stop-color="#C6CBD2"/>
    <stop offset="0.42" stop-color="#6E757E"/><stop offset="0.52" stop-color="#9AA1A9"/>
    <stop offset="0.72" stop-color="#EFF2F5"/><stop offset="1" stop-color="#A8AFB7"/>
  </linearGradient>
  <radialGradient id="chao{s}" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#000000" stop-opacity=".16"/>
    <stop offset="1" stop-color="#000000" stop-opacity="0"/>
  </radialGradient>
  <filter id="borra{s}" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="16"/></filter>
</defs>'''

def cena(w, h, s, corpo, rotulo, fundo='osso', chao=(0.5, 0.9, 0.3, 0.05)):
    if chao:
        cx, cy, rx, ry = chao
        sombra = (f'<ellipse cx="{cx*w:.0f}" cy="{cy*h:.0f}" rx="{rx*w:.0f}" ry="{ry*h:.0f}" '
                  f'fill="url(#chao{s})"/>')
    else:
        sombra = ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
            f'role="img" aria-label="{rotulo}">\n{defs(s)}\n'
            f'<rect width="{w}" height="{h}" fill="{FUNDOS.get(fundo, "#EFEAE2")}"/>\n'
            f'{sombra}\n{corpo}\n</svg>\n')

# ── ajudantes de tecido ───────────────────────────────────────
def sombra(d, op=.1):
    """Camada escura: some nas dobras e sob as mangas."""
    return f'<path d="{d}" fill="#000000" opacity="{op}"/>'

def _claridade(cor):
    """Luminância aproximada, 0 (preto) a 1 (branco)."""
    c = cor.lstrip('#')
    r, g, b = (int(c[i:i+2], 16) / 255 for i in (0, 2, 4))
    return .2126 * r + .7152 * g + .0722 * b

def luz(d, op=.16, cor=None):
    """Realce de tecido.

    Em peça escura, branco a 16% vira uma FAIXA PINTADA: a diferença de
    tom entre #17171A e o realce é enorme e a borda reta do caminho
    aparece. Quando se passa a cor da peça, o realce vira um tom mais
    claro dela mesma e a intensidade cai junto com a claridade — aí lê
    como reflexo, não como listra.
    """
    if cor is None:
        return f'<path d="{d}" fill="#FFFFFF" opacity="{op}"/>'
    fill = claro(cor, .34)
    return f'<path d="{d}" fill="{fill}" opacity="{op * (.42 + .58 * _claridade(cor)):.3f}"/>'

def costura(d, cor, larg=2.4, tracejado=True):
    risco = ' stroke-dasharray="7 6"' if tracejado else ''
    return (f'<path d="{d}" fill="none" stroke="{escuro(cor,.34)}" stroke-width="{larg}" '
            f'stroke-linecap="round"{risco} opacity=".8"/>')

def vinco(d, cor, larg=3):
    return (f'<path d="{d}" fill="none" stroke="{escuro(cor,.2)}" stroke-width="{larg}" '
            f'stroke-linecap="round" opacity=".55"/>')

# ══════════════════════════════════════════════════════════════
#  PEÇAS DE ROUPA
#  Coordenadas pensadas num quadro de 1000×1000 com a peça
#  centrada em (0,0). Quem chama posiciona e escala.
# ══════════════════════════════════════════════════════════════

def camiseta(cor, s, oversized=False, manga_longa=False):
    GOLA_W = 96 if oversized else 88     # meia largura do decote
    om = 40 if oversized else 0          # ombro mais largo no oversized
    ml = 150 if manga_longa else 0       # manga que desce até o punho
    ombro, gola_y = 205 + om, -258
    punho_x, punho_y = 330 + om, -155 + ml
    axila = -100 + ml*0.35
    bainha = 300 + (30 if oversized else 0)
    quadril = 192 + om*0.5

    corpo = (f'M{-ombro} {gola_y} '
             f'L{-punho_x} {punho_y - 40} L{-punho_x + 24} {punho_y + 62} '
             f'L{-ombro + 12} {axila} '
             f'L{-quadril} {bainha} L{quadril} {bainha} '
             f'L{ombro - 12} {axila} '
             f'L{punho_x - 24} {punho_y + 62} L{punho_x} {punho_y - 40} '
             f'L{ombro} {gola_y} L{GOLA_W} {gola_y} '
             f'C{GOLA_W*0.62} {gola_y + 66} {-GOLA_W*0.62} {gola_y + 66} {-GOLA_W} {gola_y} '
             f'L{-ombro} {gola_y} Z')

    g = [f'<g>', f'<path d="{corpo}" fill="{cor}"/>']
    # sombra sob as mangas e na lateral direita
    g.append(sombra(f'M{ombro - 12} {axila} L{punho_x - 24} {punho_y + 62} '
                    f'L{punho_x - 60} {punho_y + 30} L{ombro - 40} {axila - 30} Z', .12))
    g.append(sombra(f'M{quadril - 46} {bainha} L{quadril} {bainha} L{ombro - 12} {axila} '
                    f'L{ombro - 60} {axila + 10} Z', .09))
    g.append(luz(f'M{-ombro + 30} {gola_y + 30} L{-quadril + 40} {bainha - 40} '
                 f'L{-quadril + 110} {bainha - 40} L{-ombro + 100} {gola_y + 26} Z', .1, cor))
    # gola canelada
    g.append(f'<path d="M{-GOLA_W - 16} {gola_y} '
             f'C{-GOLA_W*0.62} {gola_y + 82} {GOLA_W*0.62} {gola_y + 82} {GOLA_W + 16} {gola_y} '
             f'L{GOLA_W} {gola_y} C{GOLA_W*0.62} {gola_y + 66} {-GOLA_W*0.62} {gola_y + 66} '
             f'{-GOLA_W} {gola_y} Z" fill="{escuro(cor,.16)}"/>')
    # punhos e bainha
    g.append(costura(f'M{-punho_x + 6} {punho_y - 34} L{-punho_x + 28} {punho_y + 56}', cor))
    g.append(costura(f'M{punho_x - 6} {punho_y - 34} L{punho_x - 28} {punho_y + 56}', cor))
    g.append(costura(f'M{-quadril + 6} {bainha - 18} L{quadril - 6} {bainha - 18}', cor))
    # vincos de caimento
    g.append(vinco(f'M{-72} {-160} C{-92} {-10} {-84} {130} {-100} {bainha - 40}', cor))
    g.append(vinco(f'M{78} {-150} C{96} {0} {88} {140} {104} {bainha - 40}', cor))
    return ''.join(g) + '</g>'


def camisa(cor, s, overshirt=False):
    """Camisa de botão: mesma base da camiseta, com colarinho e carcela."""
    ombro, gola_y, punho_x, punho_y = 208, -258, 318, 150
    axila, bainha, quadril = -60, 310, 196
    corpo = (f'M{-ombro} {gola_y} L{-punho_x} {punho_y - 190} L{-punho_x + 30} {punho_y + 40} '
             f'L{-ombro + 14} {axila} L{-quadril} {bainha} L{quadril} {bainha} '
             f'L{ombro - 14} {axila} L{punho_x - 30} {punho_y + 40} L{punho_x} {punho_y - 190} '
             f'L{ombro} {gola_y} L0 {gola_y + 26} Z')
    g = [f'<g>', f'<path d="{corpo}" fill="{cor}"/>']
    g.append(sombra(f'M{ombro - 14} {axila} L{punho_x - 30} {punho_y + 40} '
                    f'L{punho_x - 66} {punho_y + 10} L{ombro - 46} {axila - 26} Z', .11))
    g.append(sombra(f'M18 {gola_y + 26} L46 {bainha} L{quadril} {bainha} L{ombro - 14} {axila} Z', .07))
    g.append(luz(f'M{-ombro + 26} {gola_y + 34} L{-quadril + 34} {bainha - 30} '
                 f'L{-quadril + 96} {bainha - 30} L{-ombro + 92} {gola_y + 30} Z', .09, cor))
    # carcela central com botões
    g.append(f'<path d="M-26 {gola_y + 30} L-26 {bainha - 4} L26 {bainha - 4} L26 {gola_y + 30} Z" '
             f'fill="{escuro(cor,.07)}"/>')
    g.append(costura(f'M-26 {gola_y + 40} L-26 {bainha - 14}', cor))
    g.append(costura(f'M26 {gola_y + 40} L26 {bainha - 14}', cor))
    for i in range(5):
        y = gola_y + 96 + i * 88
        g.append(f'<circle cx="0" cy="{y}" r="10" fill="{claro(cor,.4) if cor != TECIDOS["branco"] else escuro(cor,.2)}"/>'
                 f'<circle cx="0" cy="{y}" r="10" fill="none" stroke="{escuro(cor,.3)}" stroke-width="1.6"/>')
    # colarinho
    g.append(f'<path d="M{-ombro + 6} {gola_y + 2} L-30 {gola_y + 34} L0 {gola_y + 108} '
             f'L-116 {gola_y + 46} Z" fill="{escuro(cor,.1)}"/>')
    g.append(f'<path d="M{ombro - 6} {gola_y + 2} L30 {gola_y + 34} L0 {gola_y + 108} '
             f'L116 {gola_y + 46} Z" fill="{escuro(cor,.16)}"/>')
    g.append(costura(f'M{-ombro + 10} {gola_y + 8} L-116 {gola_y + 50}', cor, 2, False))
    g.append(costura(f'M{ombro - 10} {gola_y + 8} L116 {gola_y + 50}', cor, 2, False))
    # punhos
    g.append(f'<path d="M{-punho_x + 2} {punho_y - 16} L{-punho_x + 32} {punho_y + 38} '
             f'L{-punho_x + 74} {punho_y + 14} L{-punho_x + 44} {punho_y - 40} Z" fill="{escuro(cor,.08)}"/>')
    g.append(f'<path d="M{punho_x - 2} {punho_y - 16} L{punho_x - 32} {punho_y + 38} '
             f'L{punho_x - 74} {punho_y + 14} L{punho_x - 44} {punho_y - 40} Z" fill="{escuro(cor,.12)}"/>')
    if overshirt:   # dois bolsos de peito
        for lado in (-1, 1):
            g.append(f'<path d="M{lado*72 - 46} -130 L{lado*72 + 46} -130 L{lado*72 + 46} -28 '
                     f'L{lado*72} -6 L{lado*72 - 46} -28 Z" fill="{escuro(cor,.06)}" '
                     f'stroke="{escuro(cor,.3)}" stroke-width="2.2" stroke-dasharray="6 5" opacity=".85"/>')
    g.append(costura(f'M{-quadril + 6} {bainha - 16} L{quadril - 6} {bainha - 16}', cor))
    g.append(vinco(f'M-108 -120 C-124 30 -118 160 -132 {bainha - 40}', cor))
    g.append(vinco(f'M112 -110 C128 40 122 170 136 {bainha - 40}', cor))
    return ''.join(g) + '</g>'


def moletom(cor, s, capuz=True):
    ombro, gola_y = 232, -250
    punho_x, punho_y = 344, 140
    axila, bainha, quadril = -70, 300, 222
    corpo = (f'M{-ombro} {gola_y} L{-punho_x} {punho_y - 200} L{-punho_x + 34} {punho_y + 44} '
             f'L{-ombro + 16} {axila} L{-quadril} {bainha} L{quadril} {bainha} '
             f'L{ombro - 16} {axila} L{punho_x - 34} {punho_y + 44} L{punho_x} {punho_y - 200} '
             f'L{ombro} {gola_y} L98 {gola_y} C58 {gola_y + 78} -58 {gola_y + 78} -98 {gola_y} '
             f'L{-ombro} {gola_y} Z')
    g = [f'<g>']
    if capuz:
        # Capuz aberto sobre os ombros: MAIS LARGO QUE ALTO e descendo
        # abaixo da gola, senão vira um cogumelo cinza flutuando em cima
        # do moletom — que era exatamente o que acontecia.
        g.append(f'<path d="M-202 {gola_y + 62} '
                 f'C-216 {gola_y - 72} -146 {gola_y - 150} 0 {gola_y - 150} '
                 f'C146 {gola_y - 150} 216 {gola_y - 72} 202 {gola_y + 62} '
                 f'C124 {gola_y + 100} -124 {gola_y + 100} -202 {gola_y + 62} Z" '
                 f'fill="{escuro(cor,.16)}"/>')
        # boca do capuz: forro estreito, para sobrar aba de capuz em volta
        g.append(f'<path d="M-112 {gola_y + 34} '
                 f'C-120 {gola_y - 82} 120 {gola_y - 82} 112 {gola_y + 34} '
                 f'C64 {gola_y + 66} -64 {gola_y + 66} -112 {gola_y + 34} Z" '
                 f'fill="{escuro(cor,.34)}"/>')
        g.append(luz(f'M-192 {gola_y + 44} C-202 {gola_y - 64} -144 {gola_y - 132} -44 {gola_y - 142} '
                     f'L-38 {gola_y - 104} C-124 {gola_y - 94} -172 {gola_y - 30} -164 {gola_y + 50} Z', .11, cor))
    g.append(f'<path d="{corpo}" fill="{cor}"/>')
    g.append(sombra(f'M{ombro - 16} {axila} L{punho_x - 34} {punho_y + 44} '
                    f'L{punho_x - 74} {punho_y + 8} L{ombro - 52} {axila - 30} Z', .12))
    g.append(sombra(f'M{quadril - 60} {bainha} L{quadril} {bainha} L{ombro - 16} {axila} L{ombro - 70} {axila + 16} Z', .08))
    g.append(luz(f'M{-ombro + 34} {gola_y + 40} L{-quadril + 40} {bainha - 60} '
                 f'L{-quadril + 118} {bainha - 60} L{-ombro + 112} {gola_y + 36} Z', .1, cor))
    # canelado do punho e da barra
    for lado in (-1, 1):
        g.append(f'<path d="M{lado*(punho_x - 4)} {punho_y - 10} L{lado*(punho_x - 36)} {punho_y + 40} '
                 f'L{lado*(punho_x - 84)} {punho_y + 14} L{lado*(punho_x - 52)} {punho_y - 36} Z" '
                 f'fill="{escuro(cor,.14)}"/>')
    g.append(f'<path d="M{-quadril} {bainha - 54} L{quadril} {bainha - 54} L{quadril} {bainha} '
             f'L{-quadril} {bainha} Z" fill="{escuro(cor,.14)}"/>')
    for i in range(13):   # textura do canelado
        x = -quadril + 14 + i * (2*quadril - 28) / 12
        g.append(f'<line x1="{x:.0f}" y1="{bainha - 48}" x2="{x:.0f}" y2="{bainha - 6}" '
                 f'stroke="{escuro(cor,.28)}" stroke-width="1.6" opacity=".5"/>')
    if capuz:   # cordão
        for lado in (-1, 1):
            g.append(f'<path d="M{lado*52} {gola_y + 46} C{lado*58} {gola_y + 120} '
                     f'{lado*40} {gola_y + 150} {lado*46} {gola_y + 196}" fill="none" '
                     f'stroke="{claro(cor,.5)}" stroke-width="7" stroke-linecap="round"/>')
            g.append(f'<circle cx="{lado*46}" cy="{gola_y + 200}" r="7" fill="{escuro(cor,.4)}"/>')
        # bolso canguru
        g.append(f'<path d="M-150 96 L150 96 L166 220 L-166 220 Z" fill="{escuro(cor,.07)}" '
                 f'stroke="{escuro(cor,.3)}" stroke-width="2.4" stroke-dasharray="7 6" opacity=".85"/>')
    else:
        g.append(f'<path d="M-116 {gola_y} C-64 {gola_y + 96} 64 {gola_y + 96} 116 {gola_y} '
                 f'L98 {gola_y} C58 {gola_y + 78} -58 {gola_y + 78} -98 {gola_y} Z" '
                 f'fill="{escuro(cor,.18)}"/>')
    g.append(vinco(f'M-96 -40 C-114 90 -108 170 -120 {bainha - 70}', cor))
    g.append(vinco(f'M100 -30 C118 100 112 180 124 {bainha - 70}', cor))
    return ''.join(g) + '</g>'


def jaqueta(cor, s):
    """Bomber: gola, punho e barra canelados, zíper central."""
    ombro, gola_y = 226, -240
    punho_x, punho_y = 338, 120
    axila, bainha, quadril = -66, 280, 210
    corpo = (f'M{-ombro} {gola_y} L{-punho_x} {punho_y - 190} L{-punho_x + 32} {punho_y + 42} '
             f'L{-ombro + 16} {axila} L{-quadril} {bainha} L{quadril} {bainha} '
             f'L{ombro - 16} {axila} L{punho_x - 32} {punho_y + 42} L{punho_x} {punho_y - 190} '
             f'L{ombro} {gola_y} Z')
    g = [f'<g>', f'<path d="{corpo}" fill="{cor}"/>']
    g.append(sombra(f'M{ombro - 16} {axila} L{punho_x - 32} {punho_y + 42} '
                    f'L{punho_x - 72} {punho_y + 6} L{ombro - 50} {axila - 28} Z', .12))
    g.append(sombra(f'M14 {gola_y} L40 {bainha} L{quadril} {bainha} L{ombro - 16} {axila} L{ombro} {gola_y} Z', .07))
    g.append(luz(f'M{-ombro + 30} {gola_y + 30} L{-quadril + 36} {bainha - 60} '
                 f'L{-quadril + 110} {bainha - 60} L{-ombro + 104} {gola_y + 26} Z', .1, cor))
    # canelados
    def canela(x1, y1, x2, y2, n=8):
        saida = [f'<path d="M{x1} {y1} L{x2} {y1} L{x2} {y2} L{x1} {y2} Z" fill="{escuro(cor,.16)}"/>']
        for i in range(n):
            x = x1 + (x2 - x1) * (i + .5) / n
            saida.append(f'<line x1="{x:.0f}" y1="{y1 + 6}" x2="{x:.0f}" y2="{y2 - 6}" '
                         f'stroke="{escuro(cor,.3)}" stroke-width="1.6" opacity=".55"/>')
        return ''.join(saida)
    g.append(canela(-quadril, bainha - 52, quadril, bainha, 16))
    g.append(f'<path d="M{-ombro + 10} {gola_y - 44} L{ombro - 10} {gola_y - 44} '
             f'L{ombro - 22} {gola_y + 12} L{-ombro + 22} {gola_y + 12} Z" fill="{escuro(cor,.2)}"/>')
    for i in range(10):
        x = -ombro + 30 + i * (2*ombro - 60) / 9
        g.append(f'<line x1="{x:.0f}" y1="{gola_y - 38}" x2="{x:.0f}" y2="{gola_y + 6}" '
                 f'stroke="{escuro(cor,.34)}" stroke-width="1.6" opacity=".5"/>')
    # zíper
    g.append(f'<line x1="0" y1="{gola_y + 12}" x2="0" y2="{bainha - 52}" '
             f'stroke="{escuro(cor,.42)}" stroke-width="7"/>')
    g.append(f'<line x1="0" y1="{gola_y + 12}" x2="0" y2="{bainha - 52}" '
             f'stroke="url(#aco{s})" stroke-width="3.4"/>')
    g.append(f'<rect x="-9" y="{gola_y + 30}" width="18" height="30" rx="5" fill="url(#aco{s})"/>')
    # bolsos embutidos
    for lado in (-1, 1):
        g.append(f'<path d="M{lado*80} 120 L{lado*170} 150" stroke="{escuro(cor,.36)}" '
                 f'stroke-width="6" stroke-linecap="round" opacity=".8" fill="none"/>')
    g.append(vinco(f'M-104 -40 C-120 80 -114 150 -126 {bainha - 70}', cor))
    return ''.join(g) + '</g>'


def calca(cor, s, cargo=False, curta=False):
    """Calça desenhada como UMA peça só, com o gancho como entalhe em V.

    Duas pernas separadas deixavam o fundo aparecer entre elas — de longe
    virava um pregador de roupa. Um caminho único resolve na geometria."""
    cintura, quadril = 176, 202
    y_cint, y_quadril, y_gancho = -300, -140, -18
    y_bar = 110 if curta else 342
    ext = 152 if curta else 116        # barra externa
    ints = 66 if curta else 26         # barra interna

    corpo = (f'M{-cintura} {y_cint} L{cintura} {y_cint} '
             f'C{quadril} {y_cint + 60} {quadril} {y_quadril} {quadril - 4} {y_quadril + 40} '
             f'L{ext} {y_bar} L{ints} {y_bar} '
             f'C{ints - 4} {y_bar - 140} 8 {y_gancho + 90} 0 {y_gancho} '
             f'C{-8} {y_gancho + 90} {-ints + 4} {y_bar - 140} {-ints} {y_bar} '
             f'L{-ext} {y_bar} '
             f'C{-quadril + 4} {y_quadril + 40} {-quadril} {y_quadril} {-cintura} {y_cint} Z')

    g = [f'<g>', f'<path d="{corpo}" fill="{cor}"/>']
    # volume: perna direita mais escura, esquerda com realce
    g.append(sombra(f'M{ints + 10} {y_bar - 10} L{ext - 8} {y_bar - 10} '
                    f'C{quadril - 20} {y_quadril + 40} {quadril - 30} {y_quadril} {cintura - 40} {y_cint + 30} '
                    f'L{cintura - 96} {y_cint + 40} C{quadril - 86} {y_quadril + 20} {ext - 60} {y_bar - 120} '
                    f'{ints + 40} {y_bar - 10} Z', .09))
    g.append(luz(f'M{-ext + 16} {y_bar - 20} C{-quadril + 40} {y_quadril + 30} '
                 f'{-quadril + 46} {y_quadril - 40} {-cintura + 42} {y_cint + 34} '
                 f'L{-cintura + 96} {y_cint + 40} C{-quadril + 96} {y_quadril} '
                 f'{-ext + 76} {y_bar - 140} {-ext + 70} {y_bar - 20} Z', .09, cor))
    # sombra do gancho
    g.append(sombra(f'M-34 {y_gancho - 120} L34 {y_gancho - 120} L14 {y_gancho + 10} '
                    f'L0 {y_gancho - 16} L-14 {y_gancho + 10} Z', .13))
    # cós, passadores e botão
    g.append(f'<path d="M{-cintura} {y_cint} L{cintura} {y_cint} '
             f'C{cintura + 8} {y_cint + 28} {cintura + 10} {y_cint + 44} {cintura + 10} {y_cint + 56} '
             f'L{-cintura - 10} {y_cint + 56} C{-cintura - 10} {y_cint + 44} '
             f'{-cintura - 8} {y_cint + 28} {-cintura} {y_cint} Z" fill="{escuro(cor,.13)}"/>')
    for x in (-140, -72, 0, 72, 140):
        g.append(f'<rect x="{x-7}" y="{y_cint + 46}" width="14" height="32" rx="3" fill="{escuro(cor,.2)}"/>')
    g.append(f'<circle cx="0" cy="{y_cint + 28}" r="12" fill="url(#aco{s})"/>')
    g.append(costura(f'M{-cintura + 6} {y_cint + 50} L{cintura - 6} {y_cint + 50}', cor))
    g.append(costura(f'M-15 {y_cint + 62} C-24 {y_cint + 150} -22 {y_gancho - 110} -5 {y_gancho - 40}', cor))
    # bolsos dianteiros
    for lado in (-1, 1):
        g.append(costura(f'M{lado*(cintura - 4)} {y_cint + 64} '
                         f'C{lado*(quadril - 24)} {y_cint + 118} {lado*(quadril - 40)} {y_cint + 154} '
                         f'{lado*(quadril - 66)} {y_cint + 178}', cor))
    if cargo:
        for lado in (-1, 1):
            bx = lado * (quadril - 26)
            g.append(f'<path d="M{bx - lado*52} -16 L{bx + lado*16} -16 L{bx + lado*6} 150 '
                     f'L{bx - lado*58} 150 Z" fill="{escuro(cor,.1)}" stroke="{escuro(cor,.36)}" '
                     f'stroke-width="3" stroke-dasharray="8 6" opacity=".95"/>')
            g.append(f'<path d="M{bx - lado*52} -16 L{bx + lado*16} -16 L{bx + lado*12} 34 '
                     f'L{bx - lado*54} 34 Z" fill="{escuro(cor,.18)}"/>')
    # vincos e barras
    for lado in (-1, 1):
        g.append(vinco(f'M{lado*88} {y_gancho + 40} C{lado*96} {y_bar*0.4} '
                       f'{lado*((ext+ints)/2 + 6)} {y_bar*0.7} {lado*((ext+ints)/2)} {y_bar - 26}', cor, 3.4))
        g.append(costura(f'M{lado*(ints + 6)} {y_bar - 22} L{lado*(ext - 8)} {y_bar - 22}', cor))
    return ''.join(g) + '</g>'


# ══════════════════════════════════════════════════════════════
#  TÊNIS, PERFUMES E ACESSÓRIOS
# ══════════════════════════════════════════════════════════════

def tenis(cor, s, sola='#F4F2ED', detalhe=None, chunky=False, cano_alto=False):
    """Perfil lateral com a ponta à esquerda.

    O que fazia o desenho anterior não ler como tênis: o cabedal era uma
    cunha reta. Sapato tem UMA linha de perfil característica — baixo na
    biqueira, subindo no peito do pé e estourando no colarinho, atrás.
    É essa curva que o olho reconhece, não a cor nem o solado.
    """
    d = detalhe or escuro(cor, .3)
    alt = 30 if chunky else 0          # entressola mais alta
    chao = 152
    topo_col = -214 if cano_alto else -152     # altura do colarinho
    g = ['<g>']

    # ── entressola ──
    mid = (f'M-318 {88 - alt} C-338 {100 - alt} -344 {132} -314 {chao - 4} '
           f'L254 {chao} C294 {chao} 314 {132} 308 {96 - alt} '
           f'L300 {56 - alt*1.5} L-308 {80 - alt} Z')
    g.append(f'<path d="{mid}" fill="{sola}"/>')
    g.append(sombra(f'M-314 {chao - 30} L306 {chao - 34} L302 {chao - 2} L-312 {chao - 2} Z', .13))
    g.append(f'<path d="M-306 {92 - alt} C-60 {104 - alt} 160 {96 - alt} 304 {74 - alt}" fill="none" '
             f'stroke="{escuro(sola,.16)}" stroke-width="3.4" opacity=".75"/>')
    for i in range(12):
        x = -284 + i * 52
        g.append(f'<line x1="{x}" y1="{chao - 26}" x2="{x - 12}" y2="{chao - 2}" '
                 f'stroke="{escuro(sola,.2)}" stroke-width="5" stroke-linecap="round" opacity=".5"/>')

    # ── cabedal: a linha de perfil ──
    cab = (f'M-308 {80 - alt} '
           f'C-330 {36 - alt} -300 {-8} -236 {-24} '                 # biqueira sobe
           f'C-150 {-46} -60 {-62} 10 {-90} '                        # peito do pé
           f'C74 {-116} 116 {-152} 144 {-196} '                      # rampa até a garganta
           f'C162 {-224} 206 {topo_col - 22} 248 {topo_col} '        # boca do colarinho
           f'C286 {topo_col + 18} 306 {topo_col + 80} 302 {-40} '    # contraforte desce
           f'L300 {56 - alt*1.5} Z')
    g.append(f'<path d="{cab}" fill="{cor}"/>')
    g.append(luz(f'M-228 {-16} C-140 {-40} -50 {-56} 14 {-82} L26 {-46} '
                 f'C-44 {-20} -136 {-4} -222 {18} Z', .13, cor))
    g.append(sombra(f'M-306 {76 - alt} C-322 {40 - alt} -298 {0} -240 {-16} '
                    f'L-226 {26} C-274 {38} -300 {54 - alt} -296 {78 - alt} Z', .1))

    # biqueira
    g.append(f'<path d="M-308 {80 - alt} C-328 {36 - alt} -298 {-8} -236 {-24} '
             f'C-208 {-30} -186 {-32} -168 {-34} L-150 {34} '
             f'C-206 {40} -268 {56 - alt} -296 {78 - alt} Z" fill="{d}" opacity=".92"/>')
    # painel de quarto: acompanha a curva, não é um losango solto
    g.append(f'<path d="M-96 {-4} C-10 {-36} 66 {-74} 118 {-132} L160 {-96} '
             f'C104 {-34} 16 {12} -74 {46} Z" fill="{d}" opacity=".88"/>')
    # contraforte do calcanhar
    g.append(f'<path d="M232 {topo_col - 4} C280 {topo_col + 16} 306 {topo_col + 80} 302 {-40} '
             f'L300 {50 - alt} L216 {46 - alt} C222 {-40} 226 {-118} 232 {topo_col - 4} Z" '
             f'fill="{d}" opacity=".85"/>')
    g.append(f'<path d="M258 {-96} L284 {-96} L284 {-28} L258 {-28} Z" fill="{claro(cor,.5)}" opacity=".6"/>')

    # ── gáspea, ilhoses e cadarço ──
    # Tudo é medido A PARTIR da borda superior do cabedal e deslocado para
    # DENTRO. Foi o que faltou antes: com deslocamento fixo para fora, a
    # gáspea passava por cima do colarinho e o tênis virava colagem.
    import math as _m
    ax, ay, bx, by = 6.0, -92.0, 138.0, -188.0          # borda da garganta
    dx, dy = bx - ax, by - ay
    ln = _m.hypot(dx, dy)
    nx, ny = -dy / ln, dx / ln                          # normal apontando para dentro
    if ny < 0:
        nx, ny = -nx, -ny

    def _p(t, off):
        return (ax + dx * t + nx * off, ay + dy * t + ny * off)

    A = [_p(t, 20) for t in (0.06, 0.29, 0.52, 0.75, 0.96)]   # fileira de cima
    B = [_p(t, 74) for t in (0.06, 0.29, 0.52, 0.75, 0.96)]   # fileira de baixo

    g.append(f'<path d="M{A[0][0]:.0f} {A[0][1]:.0f} L{A[-1][0]:.0f} {A[-1][1]:.0f} '
             f'L{B[-1][0]:.0f} {B[-1][1]:.0f} L{B[0][0]:.0f} {B[0][1]:.0f} Z" '
             f'fill="{escuro(cor,.16)}"/>')

    # Cadarço em barra, não cruzado: com cinco ilhoses o cruzado desenha
    # quatro X soltos e grandes — de longe o tênis preto lia "XXXX".
    laco = claro(cor, .66) if cor != TECIDOS['branco'] else '#CFCAC1'
    for i in range(5):
        ax_, ay_ = A[i]
        bx_, by_ = B[i]
        mx, my = (ax_ + bx_) / 2 - nx * 7, (ay_ + by_) / 2 - ny * 7   # barriga da barra
        g.append(f'<path d="M{ax_:.0f} {ay_:.0f} Q{mx:.0f} {my:.0f} {bx_:.0f} {by_:.0f}" '
                 f'fill="none" stroke="{laco}" stroke-width="10" stroke-linecap="round"/>')
    for (fx, fy) in A + B:                               # ilhoses por cima
        g.append(f'<circle cx="{fx:.0f}" cy="{fy:.0f}" r="7" fill="{escuro(cor,.52)}"/>')

    # Língua: sai do alto da garganta INCLINADA PARA O CALCANHAR, que é
    # para onde ela cai no pé. Apontada para o outro lado virava uma
    # barbatana saindo do bico.
    tx, ty = _p(1.0, 26)
    g.append(f'<path d="M{tx - 22:.0f} {ty:.0f} '
             f'C{tx + 6:.0f} {ty - 46:.0f} {tx + 52:.0f} {ty - 62:.0f} {tx + 74:.0f} {ty - 54:.0f} '
             f'L{tx + 62:.0f} {ty - 16:.0f} '
             f'C{tx + 30:.0f} {ty - 18:.0f} {tx + 6:.0f} {ty + 4:.0f} {tx - 6:.0f} {ty + 16:.0f} Z" '
             f'fill="{escuro(cor,.24)}"/>')

    # colarinho acolchoado
    g.append(f'<path d="M150 {-200} C176 {-230} 214 {topo_col - 26} 252 {topo_col - 4} '
             f'C286 {topo_col + 14} 302 {topo_col + 58} 300 {topo_col + 86} '
             f'L262 {topo_col + 80} C262 {topo_col + 40} 244 {topo_col + 24} 226 {topo_col + 18} '
             f'C198 {topo_col + 12} 178 {-190} 168 {-182} Z" fill="{claro(cor,.22)}" opacity=".9"/>')
    g.append(costura(f'M-196 {24} C-90 {0} 30 {-40} 140 {-104}', cor, 2.4))
    return ''.join(g) + '</g>'


def perfume(cor_liq, s, tampa='#1A1A1C', alto=False):
    lx, ly = 168, (300 if alto else 250)       # meia largura e meia altura do vidro
    g = [f'<g>']
    # tampa
    g.append(f'<rect x="-78" y="{-ly - 190}" width="156" height="150" rx="9" fill="{tampa}"/>')
    g.append(luz(f'M-66 {-ly - 182} L-30 {-ly - 182} L-30 {-ly - 52} L-66 {-ly - 52} Z', .14))
    g.append(f'<rect x="-52" y="{-ly - 54}" width="104" height="34" rx="5" fill="url(#aco{s})"/>')
    g.append(f'<rect x="-40" y="{-ly - 26}" width="80" height="30" fill="{escuro(tampa,.1)}"/>')
    # vidro
    g.append(f'<path d="M{-lx} {-ly} C{-lx} {-ly - 26} {-lx + 30} {-ly - 30} {-lx + 54} {-ly - 30} '
             f'L{lx - 54} {-ly - 30} C{lx - 30} {-ly - 30} {lx} {-ly - 26} {lx} {-ly} '
             f'L{lx} {ly - 22} C{lx} {ly} {lx - 22} {ly} {lx - 40} {ly} '
             f'L{-lx + 40} {ly} C{-lx + 22} {ly} {-lx} {ly} {-lx} {ly - 22} Z" '
             f'fill="{claro(cor_liq,.72)}" opacity=".5"/>')
    # líquido
    g.append(f'<path d="M{-lx + 6} {-ly + 96} L{lx - 6} {-ly + 96} L{lx - 6} {ly - 24} '
             f'C{lx - 6} {ly - 4} {lx - 26} {ly - 4} {lx - 42} {ly - 4} '
             f'L{-lx + 42} {ly - 4} C{-lx + 26} {ly - 4} {-lx + 6} {ly - 4} {-lx + 6} {ly - 24} Z" '
             f'fill="{cor_liq}" opacity=".9"/>')
    g.append(f'<path d="M{-lx} {-ly} L{lx} {-ly} L{lx} {ly - 22} '
             f'C{lx} {ly} {lx - 22} {ly} {lx - 40} {ly} L{-lx + 40} {ly} '
             f'C{-lx + 22} {ly} {-lx} {ly} {-lx} {ly - 22} Z" fill="url(#vidro{s})"/>')
    g.append(f'<rect x="{-lx}" y="{-ly}" width="{lx*2}" height="{ly*2 - 2}" rx="26" fill="none" '
             f'stroke="rgba(255,255,255,.45)" stroke-width="3"/>')
    # etiqueta
    g.append(f'<rect x="-104" y="-44" width="208" height="128" rx="4" fill="#F6F3EC" opacity=".94"/>')
    g.append(f'<text x="0" y="8" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" '
             f'font-size="34" font-weight="700" letter-spacing="9" fill="#1A1A1C">VANTA</text>')
    g.append(f'<line x1="-64" y1="26" x2="64" y2="26" stroke="#1A1A1C" stroke-width="2" opacity=".5"/>')
    g.append(f'<text x="0" y="60" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" '
             f'font-size="19" letter-spacing="6" fill="#5A5A5E">EAU DE PARFUM</text>')
    return ''.join(g) + '</g>'


def bone(cor, s, trucker=False):
    g = [f'<g>']
    # aba
    g.append(f'<path d="M-30 96 C-200 96 -330 132 -330 176 C-330 206 -190 206 -20 196 '
             f'L10 120 Z" fill="{escuro(cor,.18)}"/>')
    g.append(luz(f'M-40 110 C-180 112 -300 140 -304 172 C-306 150 -190 122 -36 122 Z', .18))
    # copa
    g.append(f'<path d="M-34 110 C-40 -78 96 -168 218 -142 C314 -122 348 -22 330 108 '
             f'C240 130 60 132 -34 110 Z" fill="{cor}"/>')
    g.append(sombra(f'M188 -152 C300 -132 344 -30 330 108 C290 120 250 126 214 128 '
                    f'C244 20 236 -84 188 -152 Z', .12))
    g.append(luz(f'M-24 96 C-30 -60 76 -150 178 -140 C96 -112 30 -20 34 104 Z', .12))
    for a in (0.28, 0.56, 0.84):               # gomos
        x1 = -34 + (364 * a)
        g.append(f'<path d="M{x1:.0f} 118 C{x1 - 16:.0f} 20 {x1 - 4:.0f} -84 {150 + a*80:.0f} -144" '
                 f'fill="none" stroke="{escuro(cor,.3)}" stroke-width="2.6" '
                 f'stroke-dasharray="8 6" opacity=".7"/>')
    if trucker:                                 # tela atrás
        g.append(f'<path d="M196 -140 C302 -120 344 -26 330 108 C290 120 254 126 220 128 Z" '
                 f'fill="{claro(cor,.5)}" opacity=".55"/>')
        for i in range(9):
            g.append(f'<line x1="{206 + i*14}" y1="-132" x2="{206 + i*14}" y2="126" '
                     f'stroke="{escuro(cor,.2)}" stroke-width="1.4" opacity=".4"/>')
    g.append(f'<circle cx="152" cy="-158" r="15" fill="{escuro(cor,.24)}"/>')
    g.append(f'<path d="M-34 104 C60 126 240 124 330 102" fill="none" '
             f'stroke="{escuro(cor,.32)}" stroke-width="3" stroke-dasharray="9 7" opacity=".8"/>')
    return ''.join(g) + '</g>'


def _curva(t, p0, p1, p2):
    x = (1-t)**2*p0[0] + 2*(1-t)*t*p1[0] + t**2*p2[0]
    y = (1-t)**2*p0[1] + 2*(1-t)*t*p1[1] + t**2*p2[1]
    dx = 2*(1-t)*(p1[0]-p0[0]) + 2*t*(p2[0]-p1[0])
    dy = 2*(1-t)*(p1[1]-p0[1]) + 2*t*(p2[1]-p1[1])
    return x, y, math.degrees(math.atan2(dy, dx))

def corrente(s, p0=(-330, -90), p1=(0, 210), p2=(330, -90), larg=96, alt=54, grosso=17):
    n, saida = 16, []
    for i in range(n + 1):
        x, y, ang = _curva(i/n, p0, p1, p2)
        rot = ang + (24 if i % 2 == 0 else -24)
        saida.append(f'<g transform="translate({x:.1f} {y:.1f}) rotate({rot:.1f})">'
                     f'<rect x="{-larg/2:.0f}" y="{-alt/2:.0f}" width="{larg}" height="{alt}" '
                     f'rx="{alt/2:.0f}" fill="none" stroke="#2A2D31" stroke-width="{grosso*1.7:.0f}"/>'
                     f'<rect x="{-larg/2:.0f}" y="{-alt/2:.0f}" width="{larg}" height="{alt}" '
                     f'rx="{alt/2:.0f}" fill="none" stroke="url(#aco{s})" stroke-width="{grosso}"/></g>')
    return '<g>' + ''.join(saida) + '</g>'


def relogio(s, mostrador='#17171A', pulseira='aco'):
    g = [f'<g>']
    for lado in (-1, 1):                        # pulseira
        y0 = lado * 150
        if pulseira == 'aco':
            for i in range(4):
                y = y0 + lado * i * 76
                g.append(f'<rect x="-92" y="{y - 32}" width="184" height="64" rx="12" '
                         f'fill="url(#aco{s})" stroke="#3A3F45" stroke-width="3"/>')
        else:
            g.append(f'<path d="M-88 {y0 - 30} L88 {y0 - 30} L{lado*0 + 72} {y0 + lado*268} '
                     f'L-72 {y0 + lado*268} Z" fill="{pulseira}" stroke="{escuro(pulseira,.3)}" stroke-width="3"/>')
    g.append(f'<circle r="196" fill="url(#aco{s})"/>')            # caixa
    g.append(f'<circle r="196" fill="none" stroke="#3A3F45" stroke-width="4"/>')
    g.append(f'<circle r="164" fill="{escuro(mostrador,.05)}"/>')  # aro
    g.append(f'<circle r="150" fill="{mostrador}"/>')
    for i in range(12):                          # índices
        a = math.radians(i * 30 - 90)
        r1, r2 = 128, (104 if i % 3 == 0 else 116)
        g.append(f'<line x1="{r1*math.cos(a):.1f}" y1="{r1*math.sin(a):.1f}" '
                 f'x2="{r2*math.cos(a):.1f}" y2="{r2*math.sin(a):.1f}" '
                 f'stroke="{claro(mostrador,.78)}" stroke-width="{7 if i % 3 == 0 else 4}" stroke-linecap="round"/>')
    g.append(f'<line x1="0" y1="14" x2="-44" y2="-70" stroke="{claro(mostrador,.9)}" '
             f'stroke-width="10" stroke-linecap="round"/>')
    g.append(f'<line x1="0" y1="14" x2="78" y2="-56" stroke="{claro(mostrador,.9)}" '
             f'stroke-width="8" stroke-linecap="round"/>')
    g.append(f'<line x1="0" y1="20" x2="-30" y2="108" stroke="#C2603A" stroke-width="4" stroke-linecap="round"/>')
    g.append(f'<circle r="10" fill="{claro(mostrador,.9)}"/>')
    g.append(f'<rect x="192" y="-26" width="34" height="52" rx="7" fill="url(#aco{s})" '
             f'stroke="#3A3F45" stroke-width="3"/>')               # coroa
    g.append(luz(f'M-150 -110 A190 190 0 0 1 -20 -186 L-40 -150 A150 150 0 0 0 -120 -92 Z', .3))
    return ''.join(g) + '</g>'


def oculos(cor, s, lente='#2B2F36'):
    g = [f'<g>']
    for lado in (-1, 1):                         # hastes
        g.append(f'<path d="M{lado*300} -34 L{lado*392} -8 L{lado*386} 22 L{lado*296} 8 Z" '
                 f'fill="{escuro(cor,.18)}"/>')
    for lado in (-1, 1):                         # lentes
        cx = lado * 172
        g.append(f'<rect x="{cx - 132}" y="-88" width="264" height="164" rx="26" fill="{lente}" opacity=".92"/>')
        g.append(f'<rect x="{cx - 132}" y="-88" width="264" height="164" rx="26" fill="none" '
                 f'stroke="{cor}" stroke-width="20"/>')
        g.append(luz(f'M{cx - 112} 54 L{cx - 46} -68 L{cx - 4} -68 L{cx - 70} 54 Z', .22))
        g.append(f'<circle cx="{lado*296}" cy="-18" r="11" fill="{escuro(cor,.3)}"/>')
    g.append(f'<path d="M-40 -46 C-14 -72 14 -72 40 -46 L40 -16 C14 -40 -14 -40 -40 -16 Z" fill="{cor}"/>')
    return ''.join(g) + '</g>'


def bolsa(cor, s):
    g = [f'<g>']
    g.append(f'<path d="M-236 -110 C-236 -300 236 -300 236 -110" fill="none" '
             f'stroke="{escuro(cor,.16)}" stroke-width="26" stroke-linecap="round"/>')   # alça
    g.append(f'<rect x="-250" y="-120" width="500" height="330" rx="22" fill="{cor}"/>')  # corpo
    g.append(sombra(f'M130 -120 L250 -120 L250 210 L130 210 Z', .1))
    g.append(luz(f'M-236 -104 L-150 -104 L-150 196 L-236 196 Z', .08))
    g.append(f'<path d="M-250 -120 L250 -120 L250 34 C160 62 -160 62 -250 34 Z" '
             f'fill="{escuro(cor,.12)}"/>')                                               # lapela
    g.append(costura(f'M-232 -104 L232 -104', cor))
    g.append(costura(f'M-238 22 C-150 50 150 50 238 22', cor))
    g.append(f'<rect x="-42" y="8" width="84" height="58" rx="9" fill="url(#aco{s})" '
             f'stroke="#3A3F45" stroke-width="3"/>')                                      # fecho
    g.append(f'<rect x="-22" y="26" width="44" height="22" rx="5" fill="{escuro(cor,.4)}"/>')
    g.append(costura(f'M-232 194 L232 194', cor))
    return ''.join(g) + '</g>'


# ══════════════════════════════════════════════════════════════
#  CATÁLOGO
#  Cada produto: função de desenho, cores disponíveis, fundo,
#  escala e deslocamento vertical dentro do quadro 1000×1000.
# ══════════════════════════════════════════════════════════════
T = TECIDOS

CATALOGO = {
 # ── roupas ──
 'camiseta-essential':  dict(fn=lambda c, s: camiseta(c, s), cores=[T['preto'], T['offwhite'], T['oliva']],
                             fundo='osso', esc=.82, y=500, rot='Camiseta de malha pesada, vista de frente'),
 'camiseta-oversized':  dict(fn=lambda c, s: camiseta(c, s, oversized=True), cores=[T['offwhite'], T['areia'], T['preto']],
                             fundo='areia', esc=.78, y=500, rot='Camiseta oversized, vista de frente'),
 'camisa-slim':         dict(fn=lambda c, s: camisa(c, s), cores=[T['branco'], T['indigo'], T['preto']],
                             fundo='fumo', esc=.78, y=500, rot='Camisa de manga longa, vista de frente'),
 'camisa-overshirt':    dict(fn=lambda c, s: camisa(c, s, overshirt=True), cores=[T['caqui'], T['oliva'], T['preto']],
                             fundo='sage', esc=.76, y=500, rot='Overshirt de manga longa, vista de frente'),
 'calca-cargo':         dict(fn=lambda c, s: calca(c, s, cargo=True), cores=[T['preto'], T['oliva'], T['areia']],
                             fundo='fumo', esc=.74, y=520, rot='Calça cargo, vista de frente'),
 'calca-jeans':         dict(fn=lambda c, s: calca(c, s), cores=[T['indigo'], T['preto'], T['cinza']],
                             fundo='gelo', esc=.74, y=520, rot='Calça jeans reta, vista de frente'),
 'bermuda-sarja':       dict(fn=lambda c, s: calca(c, s, curta=True), cores=[T['areia'], T['preto'], T['oliva']],
                             fundo='areia', esc=.9, y=520, rot='Bermuda de sarja, vista de frente'),
 'moletom-capuz':       dict(fn=lambda c, s: moletom(c, s), cores=[T['mescla'], T['preto'], T['oliva']],
                             fundo='areia', esc=.74, y=520, rot='Moletom com capuz, vista de frente'),
 'moletom-crew':        dict(fn=lambda c, s: moletom(c, s, capuz=False), cores=[T['preto'], T['areia'], T['vinho']],
                             fundo='osso', esc=.78, y=500, rot='Moletom gola careca, vista de frente'),
 'jaqueta-bomber':      dict(fn=lambda c, s: jaqueta(c, s), cores=[T['oliva'], T['preto'], T['marrom']],
                             fundo='sage', esc=.78, y=500, rot='Jaqueta bomber, vista de frente'),
 # ── tênis ──
 'tenis-runner':        dict(fn=lambda c, s: tenis(c, s, sola='#F2F0EB', detalhe='#C9C4BA'),
                             cores=[T['branco'], T['cinza'], T['preto']],
                             fundo='gelo', esc=1.24, y=520, rot='Tênis runner, perfil lateral'),
 'tenis-court':         dict(fn=lambda c, s: tenis(c, s, sola='#F4F2ED', detalhe='#2A2A2E'),
                             cores=[T['preto'], T['branco'], T['indigo']],
                             fundo='osso', esc=1.24, y=520, rot='Tênis court, perfil lateral'),
 'tenis-chunky':        dict(fn=lambda c, s: tenis(c, s, sola='#EDE7DB', detalhe='#8D8577', chunky=True),
                             cores=[T['areia'], T['branco'], T['grafite']],
                             fundo='areia', esc=1.18, y=520, rot='Tênis chunky, perfil lateral'),
 'tenis-skate':         dict(fn=lambda c, s: tenis(c, s, sola='#E9E6DF', detalhe='#3B3B40', cano_alto=True),
                             cores=[T['cinza'], T['preto'], T['oliva']],
                             fundo='fumo', esc=1.2, y=530, rot='Tênis de cano alto, perfil lateral'),
 # ── perfumes ──
 'perfume-noir':        dict(fn=lambda c, s: perfume(c, s, tampa='#141416'), cores=['#3A2E2A', '#25201E'],
                             fundo='noite', esc=.86, y=520, rot='Frasco de perfume, vista de frente'),
 'perfume-ambar':       dict(fn=lambda c, s: perfume(c, s, tampa='#7A5A2E'), cores=['#B2803A', '#C9954A'],
                             fundo='barro', esc=.86, y=520, rot='Frasco de perfume âmbar, vista de frente'),
 'perfume-citrus':      dict(fn=lambda c, s: perfume(c, s, tampa='#C8C4BC', alto=False), cores=['#CBC25E', '#D8D27F'],
                             fundo='osso', esc=.9, y=520, rot='Frasco de perfume cítrico, vista de frente'),
 # ── acessórios ──
 'bone-aba-curva':      dict(fn=lambda c, s: bone(c, s), cores=[T['preto'], T['areia'], T['oliva']],
                             fundo='pedra', esc=1.02, y=520, rot='Boné de aba curva, perfil lateral'),
 'bone-trucker':        dict(fn=lambda c, s: bone(c, s, trucker=True), cores=[T['areia'], T['preto'], T['indigo']],
                             fundo='areia', esc=1.02, y=520, rot='Boné trucker, perfil lateral'),
 'corrente-cubana':     dict(fn=lambda c, s: corrente(s), cores=[None],
                             fundo='noite', esc=1.05, y=500, rot='Corrente cubana em aço'),
 'pulseira-elos':       dict(fn=lambda c, s: corrente(s, (-250, 20), (0, 230), (250, 20), 76, 44, 14), cores=[None],
                             fundo='fumo', esc=1.2, y=480, rot='Pulseira de elos em aço'),
 'relogio-aco':         dict(fn=lambda c, s: relogio(s, mostrador=c), cores=['#17171A', '#22303F', '#2E3A30'],
                             fundo='gelo', esc=.92, y=500, rot='Relógio de pulso com pulseira de aço'),
 'oculos-retangular':   dict(fn=lambda c, s: oculos(c, s), cores=[T['preto'], T['marrom'], T['grafite']],
                             fundo='osso', esc=1.06, y=500, rot='Óculos de sol retangular, vista de frente'),
 'bolsa-crossbody':     dict(fn=lambda c, s: bolsa(c, s), cores=[T['preto'], T['marrom'], T['oliva']],
                             fundo='barro', esc=.94, y=490, rot='Bolsa transversal, vista de frente'),
}

# Três vistas: cheia, aproximada e cor alternativa.
VISTAS = [
    dict(zoom=1.00, dy=0,    fundo=None,   cor=0),
    dict(zoom=1.62, dy=-110, fundo='fumo', cor=0),
    dict(zoom=0.94, dy=10,   fundo='pedra', cor=1),
]

def render(slug, i):
    p = CATALOGO[slug]
    v = VISTAS[i]
    s = abs(hash((slug, i))) % 900 + 10
    cor = p['cores'][min(v['cor'], len(p['cores']) - 1)]
    esc = p['esc'] * v['zoom']
    y = p['y'] + v['dy']
    fundo = v['fundo'] or p['fundo']
    if p['fundo'] == 'noite' and i > 0:
        fundo = 'noite'                        # metal só lê bem em fundo escuro
    corpo = f'<g transform="translate(500 {y}) scale({esc:.3f})">{p["fn"](cor, s)}</g>'
    chao = None if p['fundo'] == 'noite' else (0.5, 0.9, 0.3, 0.045)
    return cena(1000, 1000, s, corpo, p['rot'], fundo, chao)

contagem = 0
for slug in CATALOGO:
    for i in range(3):
        sufixo = '' if i == 0 else f'-{i+1}'
        open(OUT + f'{slug}{sufixo}.svg', 'w').write(render(slug, i))
        contagem += 1

# ── hero: cena de campanha ────────────────────────────────────
hs = 7
# Tudo tem de caber DENTRO do quadro: a arte do hero aparece inteira
# (width:100%, sem object-fit), então peça que passa de x=2000 sai cortada.
hero = (f'<g transform="translate(640 700) scale(1.26)">{moletom(T["mescla"], hs)}</g>'
        f'<g transform="translate(1230 590) scale(.96) rotate(-6)">{jaqueta(T["oliva"], hs)}</g>'
        f'<g transform="translate(1640 940) scale(.9) rotate(-4)">{tenis(T["branco"], hs, sola="#F2F0EB", detalhe="#C9C4BA")}</g>'
        f'<g transform="translate(280 1010) scale(.72)">{bone(T["preto"], hs)}</g>'
        f'<g transform="translate(1780 330) scale(.58)">{perfume("#3A2E2A", hs, tampa="#141416")}</g>')
open(OUT + 'hero.svg', 'w').write(
    cena(2000, 1250, hs, hero, 'Moletom, jaqueta, tênis, boné e perfume da coleção VANTA',
         'osso', chao=(0.5, 0.93, 0.42, 0.05)))
contagem += 1

# ── banners de categoria ──────────────────────────────────────
BANNERS = {
 'cat-roupas':    (lambda s: f'<g transform="translate(430 560) scale(.96)">{camiseta(T["preto"], s)}</g>'
                             f'<g transform="translate(980 520) scale(.86) rotate(-4)">{camisa(T["branco"], s)}</g>'
                             f'<g transform="translate(1520 580) scale(.9)">{calca(T["indigo"], s)}</g>',
                   'Camiseta, camisa e calça da categoria Roupas', 'osso'),
 'cat-tenis':     (lambda s: f'<g transform="translate(560 620) scale(1.18) rotate(-3)">{tenis(T["branco"], s, sola="#F2F0EB", detalhe="#C9C4BA")}</g>'
                             f'<g transform="translate(1420 640) scale(1.18) rotate(3)">{tenis(T["preto"], s, sola="#F4F2ED", detalhe="#2A2A2E")}</g>',
                   'Dois pares de tênis da categoria Tênis', 'gelo'),
 'cat-perfumes':  (lambda s: f'<g transform="translate(620 640) scale(.84)">{perfume("#3A2E2A", s, tampa="#141416")}</g>'
                             f'<g transform="translate(1000 660) scale(.74)">{perfume("#B2803A", s, tampa="#7A5A2E")}</g>'
                             f'<g transform="translate(1360 650) scale(.8)">{perfume("#CBC25E", s, tampa="#C8C4BC")}</g>',
                   'Três frascos de perfume da categoria Perfumes', 'noite'),
 'cat-acessorios':(lambda s: f'<g transform="translate(520 560) scale(.82)">{relogio(s)}</g>'
                             f'<g transform="translate(1010 600) scale(.8)">{oculos(T["preto"], s)}</g>'
                             f'<g transform="translate(1500 580) scale(.76)">{bolsa(T["marrom"], s)}</g>',
                   'Relógio, óculos e bolsa da categoria Acessórios', 'pedra'),
}
for i, (nome, (fn, rot, fundo)) in enumerate(BANNERS.items()):
    s = 300 + i * 11
    chao = None if fundo == 'noite' else (0.5, 0.92, 0.38, 0.04)
    open(OUT + f'{nome}.svg', 'w').write(cena(2000, 1100, s, fn(s), rot, fundo, chao))
    contagem += 1

# ── versão retrato dos banners (cartão 4:5 da home) ───────────
# O cartão da home corta pelos lados: arte deitada perde metade da
# composição. Estas são desenhadas já em pé, uma por categoria.
ALTOS = {
 # A tarja de texto come os ~300px de baixo do cartão: nada de peça
 # abaixo de y≈1150. E peça clara em fundo claro some — por isso a
 # camisa aqui é índigo, não branca.
 'cat-roupas-alto':    (lambda s: f'<g transform="translate(600 470) scale(.84)">{camisa(T["indigo"], s)}</g>'
                                  f'<g transform="translate(370 1000) scale(.62) rotate(-5)">{camiseta(T["preto"], s)}</g>'
                                  f'<g transform="translate(870 1020) scale(.58) rotate(4)">{calca(T["areia"], s)}</g>',
                        'Camisa, camiseta e calça da categoria Roupas', 'osso'),
 'cat-tenis-alto':     (lambda s: f'<g transform="translate(600 450) scale(1.1) rotate(-4)">{tenis(T["branco"], s, sola="#F2F0EB", detalhe="#C9C4BA")}</g>'
                                  f'<g transform="translate(600 950) scale(1.1) rotate(3)">{tenis(T["preto"], s, sola="#F4F2ED", detalhe="#2A2A2E")}</g>',
                        'Dois pares de tênis da categoria Tênis', 'gelo'),
 'cat-perfumes-alto':  (lambda s: f'<g transform="translate(410 560) scale(.72)">{perfume("#3A2E2A", s, tampa="#141416")}</g>'
                                  f'<g transform="translate(800 600) scale(.64)">{perfume("#CBC25E", s, tampa="#C8C4BC")}</g>'
                                  f'<g transform="translate(600 1000) scale(.8)">{perfume("#B2803A", s, tampa="#7A5A2E")}</g>',
                        'Três frascos de perfume da categoria Perfumes', 'noite'),
 'cat-acessorios-alto':(lambda s: f'<g transform="translate(560 430) scale(.72)">{relogio(s)}</g>'
                                  f'<g transform="translate(600 810) scale(.68)">{oculos(T["preto"], s)}</g>'
                                  f'<g transform="translate(600 1080) scale(.62)">{bolsa(T["marrom"], s)}</g>',
                        'Relógio, óculos e bolsa da categoria Acessórios', 'pedra'),
}
for i, (nome, (fn, rot, fundo)) in enumerate(ALTOS.items()):
    s = 340 + i * 13
    chao = None if fundo == 'noite' else (0.5, 0.94, 0.42, 0.03)
    open(OUT + f'{nome}.svg', 'w').write(cena(1200, 1500, s, fn(s), rot, fundo, chao))
    contagem += 1

# ── favicon ───────────────────────────────────────────────────
open(OUT + 'favicon.svg', 'w').write('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="13" fill="#131316"/>
<path d="M14 17h9.2l8.8 22.6L40.8 17H50L36.5 49h-9L14 17Z" fill="#F5F2EC"/>
</svg>
''')
contagem += 1
print('geradas', contagem, 'artes')
