# -*- coding: utf-8 -*-
"""Artes da AUREA em SVG — alta joalheria sobre fundo escuro.

Duas ideias sustentam o realismo:

1. METAL EM BANDAS. Ouro polido não é um degradê suave: ele reflete o
   ambiente em faixas — escuro, claro, escuro, estouro de luz. O gradiente
   de cada metal alterna essas faixas em vez de interpolar.

2. PEDRA POR FACETAS. Uma gema não é um círculo colorido. Aqui cada pedra
   é montada faceta a faceta (rondiz, cunhas, mesa, estrela), com tons
   sorteados de uma paleta — é a variação entre faces vizinhas que faz
   o olho ler "lapidação".

Tudo é desenhado sobre um fundo quase preto com um facho quente atrás da
peça, que é como joia de vitrine é fotografada.
"""
import math, os, random

OUT = '/home/user/Site-restaurante/aurea/publico/assets/'
os.makedirs(OUT, exist_ok=True)

# ── paletas ───────────────────────────────────────────────────
METAIS = {
    # faixas: escuro · claro · médio · estouro · escuro
    'ouro':   ['#5A3F12', '#C6A055', '#8A6A28', '#F6E3B0', '#FFF8E4', '#9A7530', '#4E360F'],
    'branco': ['#5F646B', '#C0C6CE', '#83898F', '#EEF2F6', '#FFFFFF', '#9AA0A7', '#53585E'],
    'rose':   ['#6B3A28', '#D2A088', '#9C6046', '#F7D9C6', '#FFF1E8', '#A96F53', '#5C3122'],
}
GEMAS = {
    'diamante':  ['#FFFFFF', '#EAF2FA', '#C2D6EA', '#93AECB', '#6E8CAE'],
    'safira':    ['#A8C6F2', '#5C86D0', '#32579E', '#1B3874', '#102450'],
    'esmeralda': ['#9EE0C4', '#43AE84', '#1F7D5C', '#12583E', '#0A3A29'],
    'topazio':   ['#FFE9B8', '#F0C263', '#C89530', '#94691C', '#63450F'],
}

def _paleta_gema(nome):
    return GEMAS.get(nome, GEMAS['diamante'])

# ── defs ──────────────────────────────────────────────────────
def defs(s, giro=118, facho=(0.5, 0.44, 0.78)):
    blocos = []
    for nome, c in METAIS.items():
        blocos.append(
            f'<linearGradient id="{nome}{s}" gradientTransform="rotate({giro} .5 .5)">'
            f'<stop offset="0" stop-color="{c[0]}"/>'
            f'<stop offset="0.15" stop-color="{c[1]}"/>'
            f'<stop offset="0.31" stop-color="{c[2]}"/>'
            f'<stop offset="0.47" stop-color="{c[3]}"/>'
            f'<stop offset="0.58" stop-color="{c[4]}"/>'
            f'<stop offset="0.74" stop-color="{c[5]}"/>'
            f'<stop offset="1" stop-color="{c[6]}"/>'
            f'</linearGradient>'
            f'<linearGradient id="{nome}2{s}" gradientTransform="rotate({giro+52} .5 .5)">'
            f'<stop offset="0" stop-color="{c[2]}"/>'
            f'<stop offset="0.26" stop-color="{c[4]}"/>'
            f'<stop offset="0.52" stop-color="{c[0]}"/>'
            f'<stop offset="0.76" stop-color="{c[3]}"/>'
            f'<stop offset="1" stop-color="{c[5]}"/>'
            f'</linearGradient>')
    fx, fy, fr = facho
    blocos.append(
        f'<radialGradient id="facho{s}" cx="{fx*100:.0f}%" cy="{fy*100:.0f}%" r="{fr*100:.0f}%">'
        f'<stop offset="0" stop-color="#2C2519"/>'
        f'<stop offset="0.34" stop-color="#17150F"/>'
        f'<stop offset="0.72" stop-color="#0C0C0C"/>'
        f'<stop offset="1" stop-color="#070707"/>'
        f'</radialGradient>'
        f'<radialGradient id="halo{s}" cx="50%" cy="50%" r="50%">'
        f'<stop offset="0" stop-color="#C9A461" stop-opacity=".22"/>'
        f'<stop offset="0.55" stop-color="#C9A461" stop-opacity=".07"/>'
        f'<stop offset="1" stop-color="#C9A461" stop-opacity="0"/>'
        f'</radialGradient>'
        f'<radialGradient id="poca{s}" cx="50%" cy="50%" r="50%">'
        f'<stop offset="0" stop-color="#000000" stop-opacity=".62"/>'
        f'<stop offset="1" stop-color="#000000" stop-opacity="0"/>'
        f'</radialGradient>'
        f'<filter id="brilho{s}" x="-60%" y="-60%" width="220%" height="220%">'
        f'<feGaussianBlur stdDeviation="9"/></filter>'
        f'<filter id="suave{s}" x="-40%" y="-40%" width="180%" height="180%">'
        f'<feGaussianBlur stdDeviation="3"/></filter>')
    return '<defs>' + ''.join(blocos) + '</defs>'

def cena(w, h, s, corpo, rotulo, giro=118, facho=(0.5, 0.42, 0.8),
         halo=(0.5, 0.5, 0.46), poca=(0.5, 0.87, 0.3, 0.045), fundo=True):
    """Fundo quase preto, facho quente, halo atrás da peça e poça de sombra.

    `fundo=False` deixa o retângulo de fora: a arte sangra na página em vez
    de aparecer como um quadro colado sobre ela. É o que o hero e os
    editoriais usam; o que vai dentro de moldura mantém o fundo."""
    hx, hy, hr = halo
    px, py, prx, pry = poca
    chao = (f'<rect width="{w}" height="{h}" fill="url(#facho{s})"/>\n' if fundo else '')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
            f'role="img" aria-label="{rotulo}">\n{defs(s, giro, facho)}\n'
            f'{chao}'
            f'<ellipse cx="{hx*w:.0f}" cy="{hy*h:.0f}" rx="{hr*w:.0f}" ry="{hr*w*0.72:.0f}" fill="url(#halo{s})"/>\n'
            f'<ellipse cx="{px*w:.0f}" cy="{py*h:.0f}" rx="{prx*w:.0f}" ry="{pry*h:.0f}" fill="url(#poca{s})"/>\n'
            f'{corpo}\n</svg>\n')

# ── geometria ─────────────────────────────────────────────────
def _pol(r, a):
    return (r*math.cos(math.radians(a)), r*math.sin(math.radians(a)))

def _pts(lista):
    return ' '.join(f'{x:.1f},{y:.1f}' for x, y in lista)

# ── pedras ────────────────────────────────────────────────────
def brilhante(r, gema='diamante', giro=0, semente=1):
    """Lapidação brilhante vista de cima: rondiz, 16 cunhas, mesa e estrela."""
    rnd = random.Random(semente)
    c = _paleta_gema(gema)
    rt = r*0.415                      # raio da mesa
    p = [f'<g transform="rotate({giro})">',
         # Base opaca: sem ela a opacidade das cunhas deixa o fundo preto
         # passar e a pedra vira um catavento em vez de uma lapidação.
         f'<circle r="{r:.1f}" fill="{c[2]}"/>']
    # cunhas do rondiz até a mesa
    for i in range(16):
        a0, a1 = i*22.5, (i+1)*22.5
        am = (a0+a1)/2
        tom = c[(i % 4) + 1] if i % 2 else c[(i % 3)]
        p.append(f'<polygon points="{_pts([_pol(r, a0), _pol(r, a1), _pol(rt, am)])}" '
                 f'fill="{tom}" opacity="{rnd.uniform(.88, 1):.2f}"/>')
    # mesa octogonal
    mesa = [_pol(rt, i*45) for i in range(8)]
    p.append(f'<polygon points="{_pts(mesa)}" fill="{c[1]}"/>')
    # facetas estrela dentro da mesa
    for i in range(8):
        tom = c[0] if i % 2 else c[2]
        p.append(f'<polygon points="{_pts([(0,0), _pol(rt, i*45), _pol(rt, (i+1)*45)])}" '
                 f'fill="{tom}" opacity="{rnd.uniform(.55, .85):.2f}"/>')
    # rondiz e estouro de luz
    p.append(f'<circle r="{r:.1f}" fill="none" stroke="{c[0]}" stroke-width="{r*0.05:.1f}" opacity=".8"/>')
    p.append(f'<path d="M{-r*0.62:.1f} {-r*0.58:.1f} A{r*0.86:.1f} {r*0.86:.1f} 0 0 1 {r*0.1:.1f} {-r*0.85:.1f}" '
             f'fill="none" stroke="#FFFFFF" stroke-width="{r*0.1:.1f}" opacity=".85" stroke-linecap="round"/>')
    p.append(f'<circle cx="{-r*0.3:.1f}" cy="{-r*0.34:.1f}" r="{r*0.14:.1f}" fill="#FFFFFF" opacity=".9"/>')
    return ''.join(p) + '</g>'

def degrau(w, h, gema='esmeralda', giro=0):
    """Lapidação degrau (esmeralda): retângulo com cantos chanfrados."""
    c = _paleta_gema(gema)
    def caixa(k):
        ww, hh, ch = w*k, h*k, min(w, h)*0.19*k
        return _pts([(-ww+ch, -hh), (ww-ch, -hh), (ww, -hh+ch), (ww, hh-ch),
                     (ww-ch, hh), (-ww+ch, hh), (-ww, hh-ch), (-ww, -hh+ch)])
    p = [f'<g transform="rotate({giro})">',
         f'<polygon points="{caixa(1)}" fill="{c[3]}"/>',
         f'<polygon points="{caixa(.82)}" fill="{c[2]}"/>',
         f'<polygon points="{caixa(.64)}" fill="{c[1]}"/>',
         f'<polygon points="{caixa(.46)}" fill="{c[0]}" opacity=".92"/>',
         f'<polygon points="{caixa(1)}" fill="none" stroke="{c[4]}" stroke-width="{min(w,h)*0.08:.1f}" opacity=".7"/>',
         f'<path d="M{-w*0.62:.1f} {-h*0.58:.1f} L{-w*0.1:.1f} {-h*0.82:.1f}" stroke="#FFFFFF" '
         f'stroke-width="{min(w,h)*0.12:.1f}" opacity=".8" stroke-linecap="round"/>',
         '</g>']
    return ''.join(p)

def gota(r, gema='safira', giro=0, semente=3):
    """Lapidação gota: ponta em cima, barriga embaixo."""
    rnd = random.Random(semente)
    c = _paleta_gema(gema)
    alt = r*1.62
    contorno = f'M0 {-alt:.1f} C{r*0.72:.1f} {-alt*0.34:.1f} {r:.1f} {r*0.2:.1f} 0 {r:.1f} C{-r:.1f} {r*0.2:.1f} {-r*0.72:.1f} {-alt*0.34:.1f} 0 {-alt:.1f} Z'
    p = [f'<g transform="rotate({giro})">',
         f'<path d="{contorno}" fill="{c[2]}"/>']
    for i in range(10):
        a0 = -90 + i*36
        p.append(f'<polygon points="{_pts([(0, -alt*0.1), _pol(r*0.96, a0), _pol(r*0.96, a0+36)])}" '
                 f'fill="{c[(i % 4)]}" opacity="{rnd.uniform(.5, .82):.2f}"/>')
    p.append(f'<path d="{contorno}" fill="none" stroke="{c[4]}" stroke-width="{r*0.09:.1f}" opacity=".8"/>')
    p.append(f'<path d="M{-r*0.34:.1f} {-alt*0.42:.1f} L{-r*0.06:.1f} {-alt*0.76:.1f}" stroke="#FFFFFF" '
             f'stroke-width="{r*0.12:.1f}" opacity=".85" stroke-linecap="round"/>')
    return ''.join(p) + '</g>'

def faisca(x, y, r, op=.9):
    """Estrela de quatro pontas — o estouro que a gema joga na lente."""
    return (f'<g transform="translate({x:.1f} {y:.1f})" opacity="{op}">'
            f'<path d="M0 {-r:.1f} Q{r*0.14:.1f} {-r*0.14:.1f} {r:.1f} 0 '
            f'Q{r*0.14:.1f} {r*0.14:.1f} 0 {r:.1f} '
            f'Q{-r*0.14:.1f} {r*0.14:.1f} {-r:.1f} 0 '
            f'Q{-r*0.14:.1f} {-r*0.14:.1f} 0 {-r:.1f} Z" fill="#FFFFFF"/>'
            f'<circle r="{r*0.13:.1f}" fill="#FFFFFF"/></g>')

# ── engastes e peças ──────────────────────────────────────────
def pave(pontos, s, raio=5.5, metal='ouro', gema='diamante'):
    """Fileira de pedras pequenas cravadas, cada uma com sua garra."""
    saida = []
    for i, (x, y) in enumerate(pontos):
        saida.append(f'<g transform="translate({x:.1f} {y:.1f})">'
                     f'<circle r="{raio*1.18:.1f}" fill="url(#{metal}2{s})"/>'
                     f'{brilhante(raio, gema, giro=(i*37) % 90, semente=i+7)}</g>')
    return ''.join(saida)

def arco_pontos(cx, cy, raio, a0, a1, n, ry=None):
    ry = raio if ry is None else ry
    return [(cx + raio*math.cos(math.radians(a0 + (a1-a0)*i/(n-1))),
             cy + ry*math.sin(math.radians(a0 + (a1-a0)*i/(n-1)))) for i in range(n)]

def aro(cx, cy, raio, esp, s, metal='ouro', incl=-24, achata=0.46):
    """Aro de anel em perspectiva."""
    rx, ry = raio, raio*achata
    ry2 = max(2.0, ry - esp*0.62)
    return (f'<g transform="translate({cx} {cy}) rotate({incl})">'
            f'<path fill-rule="evenodd" fill="url(#{metal}{s})" d="'
            f'M{-rx} 0 a{rx} {ry:.1f} 0 1 0 {rx*2} 0 a{rx} {ry:.1f} 0 1 0 {-rx*2} 0 Z'
            f'M{-rx+esp} 0 a{rx-esp} {ry2:.1f} 0 1 1 {(rx-esp)*2} 0 '
            f'a{rx-esp} {ry2:.1f} 0 1 1 {-(rx-esp)*2} 0 Z"/>'
            f'{_brilho_aro(rx, ry, esp)}'
            f'</g>')

def _brilho_aro(rx, ry, esp, a0=202, a1=338):
    """Estouro de luz correndo SOBRE a linha média do aro.

    Precisa usar a mesma elipse da peça: um arco com raios próprios
    descola do metal e fica boiando no fundo."""
    Rx, Ry = rx - esp*0.5, ry - esp*0.31
    x0, y0 = Rx*math.cos(math.radians(a0)), Ry*math.sin(math.radians(a0))
    x1, y1 = Rx*math.cos(math.radians(a1)), Ry*math.sin(math.radians(a1))
    return (f'<path d="M{x0:.1f} {y0:.1f} A{Rx:.1f} {Ry:.1f} 0 0 1 {x1:.1f} {y1:.1f}" '
            f'fill="none" stroke="#FFF8E4" stroke-width="{esp*0.2:.1f}" '
            f'opacity=".45" stroke-linecap="round"/>')

def garras(r, s, metal='ouro', n=4, giro=45):
    """Garras que seguram a pedra. Ficam encostadas na borda e avançam
    só um fio sobre a mesa — garra que se projeta demais lê como pétala."""
    rc = r*0.94
    return ''.join(
        f'<ellipse cx="{_pol(rc, giro + i*360/n)[0]:.1f}" cy="{_pol(rc, giro + i*360/n)[1]:.1f}" '
        f'rx="{r*0.13:.1f}" ry="{r*0.17:.1f}" fill="url(#{metal}2{s})" '
        f'transform="rotate({giro + i*360/n:.0f} {_pol(rc, giro + i*360/n)[0]:.1f} {_pol(rc, giro + i*360/n)[1]:.1f})"/>'
        for i in range(n))

def elo(x, y, larg, alt, s, rot=0, grosso=8, metal='ouro'):
    return (f'<g transform="translate({x:.1f} {y:.1f}) rotate({rot:.1f})">'
            f'<rect x="{-larg/2:.1f}" y="{-alt/2:.1f}" width="{larg:.1f}" height="{alt:.1f}" '
            f'rx="{alt/2:.1f}" fill="none" stroke="url(#{metal}{s})" stroke-width="{grosso}"/>'
            f'<path d="M{-larg/2+grosso*0.6:.1f} {-alt*0.2:.1f} a{alt*0.3:.1f} {alt*0.3:.1f} 0 0 1 {alt*0.5:.1f} {-alt*0.28:.1f}" '
            f'fill="none" stroke="#FFF6DC" stroke-width="{grosso*0.3:.1f}" opacity=".5" stroke-linecap="round"/></g>')

def curva(t, p0, p1, p2):
    x = (1-t)**2*p0[0] + 2*(1-t)*t*p1[0] + t**2*p2[0]
    y = (1-t)**2*p0[1] + 2*(1-t)*t*p1[1] + t**2*p2[1]
    dx = 2*(1-t)*(p1[0]-p0[0]) + 2*t*(p2[0]-p1[0])
    dy = 2*(1-t)*(p1[1]-p0[1]) + 2*t*(p2[1]-p1[1])
    return x, y, math.degrees(math.atan2(dy, dx))

def comprimento(p0, p1, p2, passos=240):
    total, ant = 0.0, curva(0, p0, p1, p2)[:2]
    for i in range(1, passos+1):
        x, y, _ = curva(i/passos, p0, p1, p2)
        total += math.hypot(x-ant[0], y-ant[1]); ant = (x, y)
    return total

def corrente(p0, p1, p2, s, larg=40, alt=22, grosso=6, aperto=0.44, metal='ouro'):
    """Elos sobrepostos ao longo de uma curva. É a sobreposição — e o giro
    de 90° a cada elo — que faz ler corrente, não contas enfileiradas."""
    n = max(6, int(comprimento(p0, p1, p2) / (larg * aperto)))
    return ''.join(
        elo(*curva(i/n, p0, p1, p2)[:2], larg, alt, s,
            curva(i/n, p0, p1, p2)[2] + (0 if i % 2 == 0 else 90), grosso, metal)
        for i in range(n+1))

def fio(p0, p1, p2, s, grosso=5, metal='ouro'):
    """Fio veneziano: um traço contínuo com brilho por cima."""
    d = f'M{p0[0]} {p0[1]} Q{p1[0]} {p1[1]} {p2[0]} {p2[1]}'
    return (f'<path d="{d}" fill="none" stroke="url(#{metal}{s})" stroke-width="{grosso}" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="#FFF6DC" stroke-width="{grosso*0.28:.1f}" '
            f'opacity=".45" stroke-linecap="round"/>')

def riviera(p0, p1, p2, s, n=24, raio=11, metal='branco', gema='diamante'):
    """Pulseira riviera: pedras idênticas lado a lado ao longo da curva."""
    saida = []
    for i in range(n):
        x, y, ang = curva(i/(n-1), p0, p1, p2)
        saida.append(f'<g transform="translate({x:.1f} {y:.1f}) rotate({ang:.1f})">'
                     f'<rect x="{-raio*1.3:.1f}" y="{-raio*1.3:.1f}" width="{raio*2.6:.1f}" height="{raio*2.6:.1f}" '
                     f'rx="{raio*0.42:.1f}" fill="url(#{metal}2{s})"/>'
                     f'{brilhante(raio, gema, giro=(i*29) % 90, semente=i+21)}</g>')
    return ''.join(saida)

def argola(cx, cy, raio, s, grosso=13, metal='ouro', cravada=False, gema='diamante'):
    g = [f'<g transform="translate({cx} {cy})">',
         f'<circle r="{raio}" fill="none" stroke="url(#{metal}{s})" stroke-width="{grosso}"/>',
         f'<path d="M{-raio*0.68:.0f} {-raio*0.64:.0f} a{raio*0.94:.0f} {raio*0.94:.0f} 0 0 1 {raio*0.52:.0f} {-raio*0.3:.0f}" '
         f'fill="none" stroke="#FFF6DC" stroke-width="{grosso*0.3:.1f}" opacity=".6" stroke-linecap="round"/>']
    if cravada:
        g.append(pave(arco_pontos(0, 0, raio, 20, 200, 13), s, grosso*0.3, metal, gema))
    g.append(f'<circle cx="0" cy="{-raio:.0f}" r="{grosso*0.6:.1f}" fill="url(#{metal}2{s})"/>')
    return ''.join(g) + '</g>'

def bracelete(cx, cy, raio, s, grosso=18, metal='ouro', incl=-16):
    return (f'<g transform="translate({cx} {cy}) rotate({incl})">'
            f'<path d="M{-raio} 0 a{raio} {raio*0.88:.0f} 0 1 1 {raio*0.56:.0f} {raio*0.74:.0f}" '
            f'fill="none" stroke="url(#{metal}{s})" stroke-width="{grosso}" stroke-linecap="round"/>'
            f'<path d="M{-raio} 0 a{raio} {raio*0.88:.0f} 0 0 1 {raio*0.66:.0f} {-raio*0.7:.0f}" '
            f'fill="none" stroke="#FFF6DC" stroke-width="{grosso*0.2:.1f}" opacity=".5" stroke-linecap="round"/></g>')

# ══════════════════════════════════════════════════════════════
#  AS PEÇAS
#  Cada função devolve o corpo já centrado em (0,0); quem chama
#  posiciona e escala. `s` é a semente que escolhe o giro da luz.
# ══════════════════════════════════════════════════════════════

def p_solsticio(s):
    """Anel solitário em ouro amarelo com brilhante de peito alto."""
    return (aro(0, 40, 210, 34, s, 'ouro', -22)
            + f'<g transform="translate(0 -108)">'
            + garras(62, s, 'ouro', 6)
            + brilhante(58, 'diamante', 12, 5)
            + '</g>'
            + faisca(-34, -150, 30) + faisca(40, -86, 18, .7))

def p_vertice(s):
    """Aro em ouro branco todo cravado, pedra baixa e discreta."""
    return (aro(0, 40, 205, 26, s, 'branco', -22)
            + pave(arco_pontos(0, 40, 205-13, 188, 352, 16, ry=(205*0.46)-9), s, 7, 'branco')
            + f'<g transform="translate(0 -55)">'
            + garras(40, s, 'branco', 4)
            + brilhante(36, 'diamante', 22, 9)
            + '</g>'
            + faisca(-22, -86, 20))

def p_aurora(s):
    """Colar de fio fino com gota de safira.

    A alça é posicionada a partir da ponta da gota, e o grupo inteiro é
    deslocado até que o topo da alça encoste no ponto mais baixo do fio —
    pingente que flutua solto entrega o desenho na hora."""
    P0, P1, P2 = (-330, -250), (0, 160), (330, -250)
    fundo = 0.25*P0[1] + 0.5*P1[1] + 0.25*P2[1]      # y da bezier em t=0,5
    r = 86
    alca_cy = -(r*1.62) - 22                          # logo acima da ponta da gota
    ty = fundo - (alca_cy - 22)
    return (fio(P0, P1, P2, s, 6, 'ouro')
            + f'<g transform="translate(0 {ty:.0f})">'
            + f'<ellipse rx="15" ry="22" cy="{alca_cy:.0f}" fill="none" stroke="url(#ouro2{s})" stroke-width="8"/>'
            + gota(r, 'safira', 0, 4)
            + '</g>'
            + faisca(-58, fundo + 40, 24) + faisca(58, ty + 120, 16, .6))

def p_meridiano(s):
    """Veneziana em ouro branco com um brilhante pendurado no fio."""
    P0, P1, P2 = (-320, -240), (0, 150), (320, -240)
    fundo = 0.25*P0[1] + 0.5*P1[1] + 0.25*P2[1]
    r, cy = 40, 0
    cy = fundo + r*0.9
    return (fio(P0, P1, P2, s, 5, 'branco')
            + f'<g transform="translate(0 {cy:.0f})">'
            + f'<ellipse rx="11" ry="15" cy="{-r-11:.0f}" fill="none" stroke="url(#branco2{s})" stroke-width="6"/>'
            + garras(r, s, 'branco')
            + brilhante(r, 'diamante', 8, 11)
            + '</g>'
            + faisca(-34, cy - 30, 24))

def p_eclipse(s):
    """Par de argolas em ouro cravadas na face externa."""
    return (argola(-150, 0, 128, s, 24, 'ouro', True)
            + argola(160, 44, 96, s, 20, 'ouro', True)
            + faisca(-150, 148, 26, .75) + faisca(160, -70, 18, .55))

def p_cascata(s):
    """Brincos de gotas em degradê, ouro branco."""
    def lado(dx, esc):
        g = [f'<g transform="translate({dx} 0) scale({esc})">',
             f'<circle cx="0" cy="-210" r="17" fill="none" stroke="url(#branco{s})" stroke-width="9"/>',
             f'<line x1="0" y1="-193" x2="0" y2="-150" stroke="url(#branco2{s})" stroke-width="6"/>']
        for i, (dy, r) in enumerate([(-120, 26), (-26, 34)]):
            g.append(f'<g transform="translate(0 {dy})">'
                     f'{garras(r, s, "branco")}{brilhante(r, "diamante", i*24, i+13)}</g>')
            g.append(f'<line x1="0" y1="{dy+r+2}" x2="0" y2="{dy+r+24}" '
                     f'stroke="url(#branco2{s})" stroke-width="6"/>')
        g.append(f'<g transform="translate(0 138)">'
                 f'<ellipse rx="11" ry="15" cy="-96" fill="none" stroke="url(#branco2{s})" stroke-width="6"/>'
                 f'{gota(50, "diamante", 0, 19)}</g>')
        return ''.join(g) + '</g>'
    return lado(-168, 1) + lado(168, .86) + faisca(-168, 168, 30) + faisca(168, 60, 18, .7)

def p_riviera(s):
    """Pulseira riviera: linha contínua de diamantes."""
    return (riviera((-360, 96), (0, -170), (360, 96), s, 26, 13, 'branco')
            + faisca(-240, 6, 26) + faisca(96, -78, 20, .7) + faisca(300, 54, 16, .6))

def p_orbita(s):
    """Bracelete rígido liso em ouro — o volume é o desenho."""
    return (bracelete(0, 0, 240, s, 34, 'ouro', -14)
            + faisca(-186, -134, 24, .7))

def p_heranca(s):
    """Anel com esmeralda em lapidação degrau, ombros cravados."""
    return (aro(0, 48, 205, 30, s, 'ouro', -22)
            + pave(arco_pontos(0, 48, 205-15, 196, 232, 5, ry=(205*0.46)-10), s, 6.5, 'ouro')
            + pave(arco_pontos(0, 48, 205-15, 308, 344, 5, ry=(205*0.46)-10), s, 6.5, 'ouro')
            + f'<g transform="translate(0 -100)">'
            + f'<rect x="-72" y="-92" width="144" height="184" rx="14" fill="url(#ouro2{s})"/>'
            + degrau(58, 76, 'esmeralda', 0)
            + '</g>'
            + faisca(-44, -148, 24))

def p_constelacao(s):
    """Corrente fina com brilhantes espalhados, como estrelas."""
    corpo = [fio((-350, -210), (0, 130), (350, -210), s, 4, 'branco')]
    for i, (t, r) in enumerate([(0.16, 16), (0.32, 24), (0.5, 40), (0.68, 26), (0.84, 15)]):
        x, y, _ = curva(t, (-350, -210), (0, 130), (350, -210))
        corpo.append(f'<g transform="translate({x:.1f} {y:.1f})">'
                     f'{garras(r*1.12, s, "branco", 4)}{brilhante(r, "diamante", i*31, i+17)}</g>')
    corpo.append(faisca(0, -10, 34) + faisca(-160, 6, 18, .6) + faisca(178, 10, 16, .55))
    return ''.join(corpo)

PECAS = {
    'anel-solsticio':    (p_solsticio,   'Anel Solstício em ouro amarelo 18k com diamante central'),
    'anel-vertice':      (p_vertice,     'Anel Vértice em ouro branco 18k cravejado de diamantes'),
    'colar-aurora':      (p_aurora,      'Colar Aurora em ouro amarelo 18k com safira em lapidação gota'),
    'colar-meridiano':   (p_meridiano,   'Colar Meridiano em ouro branco 18k com diamante solitário'),
    'brinco-eclipse':    (p_eclipse,     'Brincos Eclipse em ouro amarelo 18k com argolas cravejadas'),
    'brinco-cascata':    (p_cascata,     'Brincos Cascata em ouro branco 18k com diamantes em degradê'),
    'pulseira-riviera':  (p_riviera,     'Pulseira Riviera em ouro branco 18k com diamantes alinhados'),
    'bracelete-orbita':  (p_orbita,      'Bracelete Órbita em ouro amarelo 18k de aro rígido'),
    'anel-heranca':      (p_heranca,     'Anel Herança em ouro amarelo 18k com esmeralda lapidação degrau'),
    'colar-constelacao': (p_constelacao, 'Colar Constelação em ouro branco 18k com diamantes graduados'),
}

# Três vistas por peça: (escala, giro da peça, giro da luz, posição do facho)
VISTAS = [
    (1.00,   0, 118, (0.50, 0.42)),
    (1.34,  -9,  64, (0.38, 0.34)),
    (0.86,  14, 162, (0.62, 0.50)),
]

def render_peca(slug, vista):
    fn, rotulo = PECAS[slug]
    esc, giro, luz, facho = VISTAS[vista]
    s = abs(hash((slug, vista))) % 900 + 10
    corpo = (f'<g transform="translate(500 500) rotate({giro}) scale({esc})">'
             f'{fn(s)}</g>')
    return cena(1000, 1000, s, corpo, rotulo, giro=luz,
                facho=(facho[0], facho[1], 0.82), halo=(0.5, 0.48, 0.4),
                poca=(0.5, 0.86, 0.3, 0.05))

contagem = 0
for slug in PECAS:
    for v in range(3):
        sufixo = '' if v == 0 else f'-{v+1}'
        open(OUT + f'{slug}{sufixo}.svg', 'w').write(render_peca(slug, v))
        contagem += 1

# ── hero: composição editorial larga ──────────────────────────
# Uma joia só, grande. Todas as peças compartilham a semente da cena:
# cada `s` gera um conjunto próprio de gradientes, e usar duas sementes
# num SVG só deixaria metade dos `url(#ouroNN)` apontando para o vazio.
_SH = 41
hero = ('<g transform="translate(1500 300) scale(.62) rotate(6)">' + p_constelacao(_SH) + '</g>'
        + '<g transform="translate(760 600) scale(2.05) rotate(-6)">' + p_solsticio(_SH) + '</g>'
        + faisca(1320, 760, 22, .45) + faisca(300, 360, 18, .35))
open(OUT + 'hero.svg', 'w').write(
    cena(1800, 1100, _SH, hero, 'Anel Solstício em ouro amarelo 18k com diamante central, sobre fundo escuro',
         giro=104, facho=(0.42, 0.5, 0.86), halo=(0.42, 0.54, 0.46),
         poca=(0.42, 0.92, 0.28, 0.045), fundo=False))
contagem += 1

# ── capas de categoria e editoriais ───────────────────────────
CAPAS = {
    'cat-aneis':      (lambda s: '<g transform="translate(500 580) scale(1.72)">' + p_solsticio(s) + '</g>', 'Anéis AUREA'),
    'cat-colares':    (lambda s: '<g transform="translate(500 470) scale(1.42)">' + p_aurora(s) + '</g>', 'Colares AUREA'),
    'cat-brincos':    (lambda s: '<g transform="translate(500 560) scale(1.32)">' + p_cascata(s) + '</g>', 'Brincos AUREA'),
    'cat-pulseiras':  (lambda s: '<g transform="translate(500 600) scale(1.12) rotate(-4)">' + p_riviera(s) + '</g>', 'Pulseiras AUREA'),
    'cole-arquivo':   (lambda s: '<g transform="translate(462 580) scale(1.58)">' + p_heranca(s) + '</g>', 'Coleção Arquivo'),
    'cole-noturno':   (lambda s: '<g transform="translate(500 560) scale(1.22)">' + p_constelacao(s) + '</g>', 'Coleção Noturno'),
    'cole-luz':       (lambda s: '<g transform="translate(500 590) scale(1.5)">' + p_eclipse(s) + '</g>', 'Coleção Primeira Luz'),
}
for i, (nome, (fn, rotulo)) in enumerate(CAPAS.items()):
    s = 200 + i*7
    open(OUT + f'{nome}.svg', 'w').write(
        cena(1000, 1200, s, fn(s), rotulo, giro=100 + i*11,
             facho=(0.5, 0.44, 0.84), halo=(0.5, 0.47, 0.5), poca=(0.5, 0.86, 0.32, 0.04)))
    contagem += 1

# ── editoriais da marca ───────────────────────────────────────
def ed_atelie(s):
    """Bancada: três peças em estágios diferentes, uma linha de luz."""
    return ('<g transform="translate(340 560) scale(.72) rotate(-6)">' + p_vertice(s) + '</g>'
            + '<g transform="translate(760 460) scale(.6) rotate(9)">' + p_orbita(s) + '</g>'
            + '<g transform="translate(620 820) scale(.52)">' + p_meridiano(s) + '</g>'
            + f'<line x1="120" y1="980" x2="980" y2="980" stroke="#C9A461" stroke-width="2" opacity=".28"/>')

def ed_certificado(s):
    """Lupa de ourives sobre uma pedra — o gesto da conferência."""
    return (f'<g transform="translate(560 620)">'
            f'<circle r="230" fill="none" stroke="url(#ouro{s})" stroke-width="16" opacity=".92"/>'
            f'<circle r="212" fill="#0E0E0F" opacity=".55"/>'
            f'<g transform="rotate(38) translate(250 0)">'
            f'<rect x="0" y="-26" width="300" height="52" rx="26" fill="url(#ouro2{s})"/></g>'
            f'{brilhante(118, "diamante", 10, 33)}'
            f'</g>' + faisca(470, 500, 40, .8) + faisca(690, 720, 22, .5))

def ed_atendimento(s):
    """Duas peças apresentadas lado a lado, como numa bandeja."""
    return ('<g transform="translate(380 600) scale(.86) rotate(-5)">' + p_heranca(s) + '</g>'
            + '<g transform="translate(760 660) scale(.74) rotate(7)">' + p_solsticio(s) + '</g>'
            + f'<ellipse cx="560" cy="960" rx="420" ry="42" fill="#C9A461" opacity=".07"/>')

EDITORIAIS = {
    'ed-atelie':      (ed_atelie, 'Peças em acabamento na bancada do ateliê', 1100, 1200),
    'ed-certificado': (ed_certificado, 'Lupa de ourives sobre um diamante', 1120, 1240),
    'ed-atendimento': (ed_atendimento, 'Duas joias apresentadas lado a lado', 1120, 1240),
}
for i, (nome, (fn, rotulo, w, h)) in enumerate(EDITORIAIS.items()):
    s = 300 + i*13
    open(OUT + f'{nome}.svg', 'w').write(
        cena(w, h, s, fn(s), rotulo, giro=96 + i*17,
             facho=(0.48, 0.4, 0.86), halo=(0.5, 0.46, 0.5),
             poca=(0.5, 0.88, 0.3, 0.035), fundo=False))
    contagem += 1

# ── favicon ───────────────────────────────────────────────────
open(OUT + 'favicon.svg', 'w').write('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><linearGradient id="o" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#8A6420"/><stop offset=".3" stop-color="#F6E3B0"/>
<stop offset=".52" stop-color="#C6A055"/><stop offset=".76" stop-color="#FFF8E4"/>
<stop offset="1" stop-color="#8A6420"/></linearGradient></defs>
<rect width="64" height="64" rx="10" fill="#0B0B0C"/>
<path fill="url(#o)" d="M32 13 41.6 51h-6.9l-1.8-7.6h-9.4L21.7 51h-6.9L24.4 13h7.6Zm-3.8 9.4-3.3 14.6h6.6l-3.3-14.6Z"/>
<path fill="url(#o)" d="M44 13h6.2v24.6c0 5.2-1 8.9-3.1 11.2l-4.4-4c1.1-1.6 1.6-4 1.6-7.2V13Z" opacity=".55"/>
</svg>
''')
contagem += 1

print('geradas', contagem, 'artes')
