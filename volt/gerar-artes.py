# -*- coding: utf-8 -*-
"""Artes da VOLT em SVG — acessórios de rua, visual de lookbook.

A lógica aqui é o contrário da joalheria clássica: nada de estúdio
suave. Cada peça aparece sobre um fundo chapado de cor, com sombra
sólida e contorno preto — é assim que catálogo de streetwear é
fotografado, e é o que funciona no feed.

O metal é CROMO, não prata polida: o gradiente imita o horizonte
refletido (céu claro em cima, chão escuro no meio, estouro embaixo).
São paradas duras, sem interpolação macia — cromo não tem meio-tom.
"""
import math, os

OUT = '/home/user/Site-restaurante/volt/publico/assets/'
os.makedirs(OUT, exist_ok=True)

# ── cores da marca ────────────────────────────────────────────
VOLT   = '#D6FF2E'
BRASA  = '#FF4D2E'
AZUL   = '#2E6BFF'
ROXO   = '#9B5CFF'
GELO   = '#E8EAEE'
BREU   = '#121214'
TINTA  = '#0A0A0B'

FUNDOS = {
    'volt':  VOLT, 'brasa': BRASA, 'azul': AZUL,
    'roxo':  ROXO, 'gelo':  GELO,  'breu': BREU,
}

# ── defs ──────────────────────────────────────────────────────
def defs(s, giro=0):
    return f'''<defs>
  <linearGradient id="cromo{s}" x1="0" y1="0" x2="0" y2="1" gradientTransform="rotate({giro} .5 .5)">
    <stop offset="0"    stop-color="#FFFFFF"/>
    <stop offset="0.18" stop-color="#D2D8DF"/>
    <stop offset="0.33" stop-color="#7C848D"/>
    <stop offset="0.47" stop-color="#2B3036"/>
    <stop offset="0.50" stop-color="#3A4048"/>
    <stop offset="0.55" stop-color="#9AA2AB"/>
    <stop offset="0.68" stop-color="#F4F7FA"/>
    <stop offset="0.84" stop-color="#AEB6BE"/>
    <stop offset="1"    stop-color="#EDF1F5"/>
  </linearGradient>
  <linearGradient id="cromo2{s}" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate({giro+28} .5 .5)">
    <stop offset="0"    stop-color="#EFF3F7"/>
    <stop offset="0.28" stop-color="#8F979F"/>
    <stop offset="0.44" stop-color="#31363C"/>
    <stop offset="0.58" stop-color="#C9D0D7"/>
    <stop offset="0.8"  stop-color="#5E666E"/>
    <stop offset="1"    stop-color="#E4E9EE"/>
  </linearGradient>
  <linearGradient id="fosco{s}" x1="0" y1="0" x2="0" y2="1" gradientTransform="rotate({giro} .5 .5)">
    <stop offset="0"    stop-color="#4A4F55"/>
    <stop offset="0.38" stop-color="#24282D"/>
    <stop offset="0.62" stop-color="#33383E"/>
    <stop offset="1"    stop-color="#1A1D21"/>
  </linearGradient>
  <linearGradient id="volt{s}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#EBFF7A"/>
    <stop offset="0.5" stop-color="{VOLT}"/>
    <stop offset="1" stop-color="#A8CC18"/>
  </linearGradient>
</defs>'''

def cena(w, h, s, corpo, rotulo, fundo='volt', giro=0, bolha=None, chapado=True):
    """Fundo chapado, um disco de contraste atrás da peça e a peça.
    O disco dá profundidade sem sombra difusa — é recorte, não luz.

    `chapado=False` tira o retângulo: a arte sangra na página em vez de
    virar um quadro colado sobre ela. É o que o hero usa."""
    cor = FUNDOS.get(fundo, VOLT)
    disco = ''
    if bolha:
        bx, by, br, bc = bolha
        disco = f'<circle cx="{bx*w:.0f}" cy="{by*h:.0f}" r="{br*w:.0f}" fill="{bc}"/>'
    chao = f'<rect width="{w}" height="{h}" fill="{cor}"/>\n' if chapado else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
            f'role="img" aria-label="{rotulo}">\n{defs(s, giro)}\n'
            f'{chao}{disco}\n{corpo}\n</svg>\n')

# ── geometria ─────────────────────────────────────────────────
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

# ── peças ─────────────────────────────────────────────────────
def elo_cubano(x, y, larg, alt, s, rot=0, borda=6):
    """Elo cubano: achatado, cheio, com contorno preto para recortar
    do fundo colorido. Dois elos vizinhos se encaixam pela sobreposição."""
    rx = alt/2
    return (f'<g transform="translate({x:.1f} {y:.1f}) rotate({rot:.1f})">'
            f'<rect x="{-larg/2:.1f}" y="{-alt/2:.1f}" width="{larg:.1f}" height="{alt:.1f}" '
            f'rx="{rx:.1f}" fill="none" stroke="{TINTA}" stroke-width="{borda*1.9:.1f}"/>'
            f'<rect x="{-larg/2:.1f}" y="{-alt/2:.1f}" width="{larg:.1f}" height="{alt:.1f}" '
            f'rx="{rx:.1f}" fill="none" stroke="url(#cromo{s})" stroke-width="{borda:.1f}"/>'
            f'</g>')

def cubana(p0, p1, p2, s, larg=118, alt=60, borda=20, aperto=0.3, tombo=28):
    """Elo cubano é oval ALONGADO e inclinado, alternando o lado, com
    sobreposição alta. Elo redondo demais ou girado 90° lê como arruela
    enfileirada — o que faz parecer corrente é o encaixe em diagonal."""
    n = max(5, int(comprimento(p0, p1, p2) / (larg * aperto)))
    saida = []
    for i in range(n+1):
        x, y, ang = curva(i/n, p0, p1, p2)
        saida.append(elo_cubano(x, y, larg, alt, s, ang + (tombo if i % 2 == 0 else -tombo), borda))
    return ''.join(saida)

def elo_grumet(x, y, r, s, rot=0, borda=9):
    return (f'<g transform="translate({x:.1f} {y:.1f}) rotate({rot:.1f})">'
            f'<ellipse rx="{r:.1f}" ry="{r*0.66:.1f}" fill="none" stroke="{TINTA}" stroke-width="{borda*1.9:.1f}"/>'
            f'<ellipse rx="{r:.1f}" ry="{r*0.66:.1f}" fill="none" stroke="url(#cromo2{s})" stroke-width="{borda:.1f}"/>'
            f'</g>')

def grumet(p0, p1, p2, s, r=40, borda=13, aperto=0.5):
    n = max(6, int(comprimento(p0, p1, p2) / (r*2 * aperto)))
    return ''.join(
        elo_grumet(*curva(i/n, p0, p1, p2)[:2], r, s,
                   curva(i/n, p0, p1, p2)[2] + (0 if i % 2 == 0 else 78), borda)
        for i in range(n+1))

def cruz(cx, cy, alt, s, esc=1.0, giro=0, gradiente=None):
    """Cruz gótica: braços afunilados, ponta inferior alongada."""
    g = gradiente or f'cromo{s}'
    a = alt/2
    l = a*0.27           # meia largura da haste
    b = a*0.60           # meia largura do braço
    yb = -a*0.26         # altura do braço
    d = (f'M{-l:.1f} {-a:.1f} L{l:.1f} {-a:.1f} L{l:.1f} {yb-l:.1f} '
         f'L{b:.1f} {yb-l:.1f} L{b:.1f} {yb+l:.1f} L{l:.1f} {yb+l:.1f} '
         f'L{l*0.72:.1f} {a:.1f} L{-l*0.72:.1f} {a:.1f} L{-l:.1f} {yb+l:.1f} '
         f'L{-b:.1f} {yb+l:.1f} L{-b:.1f} {yb-l:.1f} L{-l:.1f} {yb-l:.1f} Z')
    return (f'<g transform="translate({cx} {cy}) rotate({giro}) scale({esc})">'
            f'<path d="{d}" fill="{TINTA}" stroke="{TINTA}" stroke-width="{alt*0.09:.1f}" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="url(#{g})"/>'
            f'<path d="M{-l*0.55:.1f} {-a*0.82:.1f} L{-l*0.55:.1f} {a*0.7:.1f}" stroke="#FFFFFF" '
            f'stroke-width="{alt*0.035:.1f}" opacity=".65" stroke-linecap="round"/>'
            f'</g>')

def aro(cx, cy, raio, esp, s, incl=-22, achata=0.44, grad=None, borda=True):
    g = grad or f'cromo{s}'
    rx, ry = raio, raio*achata
    ry2 = max(2.0, ry - esp*0.6)
    corpo = (f'M{-rx} 0 a{rx} {ry:.1f} 0 1 0 {rx*2} 0 a{rx} {ry:.1f} 0 1 0 {-rx*2} 0 Z'
             f'M{-rx+esp} 0 a{rx-esp} {ry2:.1f} 0 1 1 {(rx-esp)*2} 0 '
             f'a{rx-esp} {ry2:.1f} 0 1 1 {-(rx-esp)*2} 0 Z')
    contorno = (f'<path fill-rule="evenodd" fill="none" stroke="{TINTA}" stroke-width="14" d="{corpo}"/>'
                if borda else '')
    return (f'<g transform="translate({cx} {cy}) rotate({incl})">'
            f'{contorno}<path fill-rule="evenodd" fill="url(#{g})" d="{corpo}"/></g>')

def signet(cx, cy, s, esc=1.0, giro=-18):
    """Anel de brasão: face oval chapada, o desenho é o volume."""
    return (f'<g transform="translate({cx} {cy}) scale({esc})">'
            + aro(0, 40, 200, 40, s, giro)
            + f'<g transform="translate(0 -104) rotate(-8)">'
            f'<ellipse rx="118" ry="96" fill="{TINTA}"/>'
            f'<ellipse rx="108" ry="86" fill="url(#cromo2{s})"/>'
            f'<ellipse rx="80" ry="62" fill="none" stroke="{TINTA}" stroke-width="7" opacity=".55"/>'
            f'<path d="M-38 34 L0 -44 L38 34 L20 34 L0 -8 L-20 34 Z" fill="{TINTA}" opacity=".75"/>'
            f'<path d="M-96 -48 A104 84 0 0 1 -14 -84" fill="none" stroke="#FFFFFF" '
            f'stroke-width="11" opacity=".7" stroke-linecap="round"/>'
            f'</g></g>')

def martelado(cx, cy, s, esc=1.0):
    """Aro grosso com marcas de martelo — as facetas são o acabamento."""
    marcas = []
    for i in range(18):
        a = i*20
        rx, ry = 172*math.cos(math.radians(a)), 172*0.44*math.sin(math.radians(a))
        marcas.append(f'<ellipse cx="{rx:.1f}" cy="{ry:.1f}" rx="24" ry="15" '
                      f'fill="{"#FFFFFF" if i % 2 else TINTA}" '
                      f'opacity="{0.3 if i % 2 else 0.22:.2f}" '
                      f'transform="rotate({a*1.4:.0f} {rx:.1f} {ry:.1f})"/>')
    return (f'<g transform="translate({cx} {cy}) scale({esc})">'
            + aro(0, 0, 215, 92, s, -20)
            + f'<g transform="rotate(-20)">' + ''.join(marcas) + '</g></g>')

def bracelete(cx, cy, raio, s, grosso=54, incl=-14, grad=None):
    g = grad or f'fosco{s}'
    d = f'M{-raio} 0 a{raio} {raio*0.86:.0f} 0 1 1 {raio*0.58:.0f} {raio*0.74:.0f}'
    return (f'<g transform="translate({cx} {cy}) rotate({incl})">'
            f'<path d="{d}" fill="none" stroke="{TINTA}" stroke-width="{grosso+16}" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="url(#{g})" stroke-width="{grosso}" stroke-linecap="round"/>'
            f'<path d="M{-raio} 0 a{raio} {raio*0.86:.0f} 0 0 1 {raio*0.5:.0f} {-raio*0.62:.0f}" '
            f'fill="none" stroke="#FFFFFF" stroke-width="{grosso*0.16:.1f}" opacity=".35" stroke-linecap="round"/>'
            f'</g>')

def argola(cx, cy, raio, s, grosso=38, grad=None):
    g = grad or f'cromo{s}'
    return (f'<g transform="translate({cx} {cy})">'
            f'<circle r="{raio}" fill="none" stroke="{TINTA}" stroke-width="{grosso+16}"/>'
            f'<circle r="{raio}" fill="none" stroke="url(#{g})" stroke-width="{grosso}"/>'
            f'<path d="M{-raio*0.68:.0f} {-raio*0.66:.0f} a{raio*0.95:.0f} {raio*0.95:.0f} 0 0 1 {raio*0.55:.0f} {-raio*0.3:.0f}" '
            f'fill="none" stroke="#FFFFFF" stroke-width="{grosso*0.28:.1f}" opacity=".8" stroke-linecap="round"/></g>')

def fio(p0, p1, p2, s, grosso=13, grad=None):
    g = grad or f'cromo2{s}'
    d = f'M{p0[0]} {p0[1]} Q{p1[0]} {p1[1]} {p2[0]} {p2[1]}'
    return (f'<path d="{d}" fill="none" stroke="{TINTA}" stroke-width="{grosso+12}" stroke-linecap="round"/>'
            f'<path d="{d}" fill="none" stroke="url(#{g})" stroke-width="{grosso}" stroke-linecap="round"/>')

# ══════════════════════════════════════════════════════════════
#  OS PRODUTOS
#  Cada função devolve o corpo centrado em (0,0).
# ══════════════════════════════════════════════════════════════

def p_cubana8(s):
    return cubana((-400, -120), (0, 300), (400, -120), s, 96, 64, 19, 0.38)

def p_cruz_gotica(s):
    # A haste sai do ponto mais baixo da bezier e encosta no topo da cruz.
    # Sem essa conta o pingente flutua solto e o desenho se entrega.
    P0, P1, P2 = (-380, -250), (0, 120), (380, -250)
    fundo = 0.25*P0[1] + 0.5*P1[1] + 0.25*P2[1]
    alt = 330
    topo = fundo + 66
    return (grumet(P0, P1, P2, s, 40, 13, 0.5)
            + fio((0, fundo), (0, fundo + 33), (0, topo), s, 13)
            + cruz(0, topo + alt/2, alt, s))

def p_signet(s):
    return signet(0, 0, s, 1.0)

def p_martelado(s):
    return martelado(0, 0, s, 1.0)

def p_pulseira_cubana(s):
    return cubana((-360, 40), (0, 290), (360, 40), s, 96, 50, 17, 0.3, 26)

def p_bracelete(s):
    return bracelete(0, 0, 250, s, 58, -14)

def p_argola(s):
    return (argola(-160, -10, 130, s, 40)
            + argola(168, 46, 106, s, 34))

def p_cruz_pendente(s):
    def lado(dx, esc):
        return (f'<g transform="translate({dx} 0) scale({esc})">'
                + argola(0, -238, 70, s, 26)
                + fio((0, -168), (0, -150), (0, -128), s, 11)
                + cruz(0, 30, 270, s)
                + '</g>')
    return lado(-175, 1.0) + lado(175, 0.88)

def p_kit_rua(s):
    return ('<g transform="translate(0 -170) scale(.82)">' + p_cubana8(s) + '</g>'
            + '<g transform="translate(0 240) scale(.72)">' + p_pulseira_cubana(s) + '</g>')

def p_kit_detalhe(s):
    return ('<g transform="translate(-215 -40) scale(.86) rotate(-8)">' + signet(0, 0, s) + '</g>'
            + '<g transform="translate(225 60) scale(.92) rotate(6)">'
            + argola(0, -238, 70, s, 26) + fio((0, -168), (0, -150), (0, -128), s, 11)
            + cruz(0, 30, 270, s) + '</g>')

PRODUTOS = {
    'corrente-cubana-8':   (p_cubana8,        'Corrente cubana de 8 mm em aço cromado', 'volt'),
    'corrente-cruz':       (p_cruz_gotica,    'Corrente com pingente de cruz gótica em aço cromado', 'breu'),
    'anel-signet':         (p_signet,         'Anel signet de brasão em aço cromado', 'brasa'),
    'anel-martelado':      (p_martelado,      'Anel chunky com acabamento martelado em aço cromado', 'azul'),
    'pulseira-cubana-6':   (p_pulseira_cubana,'Pulseira cubana de 6 mm em aço cromado', 'roxo'),
    'bracelete-fosco':     (p_bracelete,      'Bracelete rígido com acabamento fosco', 'gelo'),
    'argola-tubo-12':      (p_argola,         'Par de argolas tubo de 12 mm em aço cromado', 'volt'),
    'brinco-cruz':         (p_cruz_pendente,  'Par de brincos com pingente de cruz em aço cromado', 'azul'),
    'kit-rua':             (p_kit_rua,        'Kit com corrente cubana e pulseira cubana em aço cromado', 'brasa'),
    'kit-detalhe':         (p_kit_detalhe,    'Kit com anel signet e brinco de cruz em aço cromado', 'roxo'),
}

# Três vistas: cheia, aproximada e deitada. Cada uma troca o fundo e o
# giro da luz, para a galeria não parecer a mesma foto repetida.
CICLO = ['volt', 'breu', 'brasa', 'azul', 'roxo', 'gelo']
BOLHA = {'volt': '#C2EB1E', 'breu': '#1D1D21', 'brasa': '#E8401F',
         'azul': '#1F57E0', 'roxo': '#8747F0', 'gelo': '#D6DAE0'}

def vista(slug, i):
    fn, rotulo, base = PRODUTOS[slug]
    fundo = base if i == 0 else CICLO[(CICLO.index(base) + (2 if i == 1 else 4)) % len(CICLO)]
    esc, giro, luz = [(1.0, 0, 0), (1.42, -8, 26), (0.84, 11, -22)][i]
    s = abs(hash((slug, i))) % 900 + 10
    corpo = f'<g transform="translate(500 500) rotate({giro}) scale({esc})">{fn(s)}</g>'
    return cena(1000, 1000, s, corpo, rotulo, fundo, luz,
                bolha=(0.5, 0.5, 0.38, BOLHA[fundo]))

contagem = 0
for slug in PRODUTOS:
    for i in range(3):
        sufixo = '' if i == 0 else f'-{i+1}'
        open(OUT + f'{slug}{sufixo}.svg', 'w').write(vista(slug, i))
        contagem += 1

# ── hero: pilha de correntes, bem grande ──────────────────────
hero_s = 77
# Enche o quadro e deixa sangrar nas laterais: corte é linguagem de
# lookbook, peça miúda no meio do fundo é catálogo de papelaria.
hero = ('<g transform="translate(900 330) scale(1.95)">' + p_cubana8(hero_s) + '</g>'
        + '<g transform="translate(900 830) scale(1.45)">'
        + grumet((-380, -150), (0, 110), (380, -150), hero_s, 40, 13, 0.5) + '</g>'
        + '<g transform="translate(900 1120) scale(1.25)">'
        + cruz(0, 0, 330, hero_s) + '</g>')
open(OUT + 'hero.svg', 'w').write(
    cena(1800, 1300, hero_s, hero, 'Correntes cubana e grumet e pingente de cruz em aço cromado',
         'breu', 0, bolha=(0.5, 0.44, 0.36, '#17171B'), chapado=False))
contagem += 1

# ── capas de categoria ────────────────────────────────────────
CAPAS = {
    'cat-correntes': (lambda s: '<g transform="translate(500 520) scale(1.18)">' + p_cubana8(s) + '</g>', 'Correntes VOLT', 'volt'),
    'cat-aneis':     (lambda s: '<g transform="translate(500 520) scale(1.25)">' + p_signet(s) + '</g>', 'Anéis VOLT', 'brasa'),
    'cat-pulseiras': (lambda s: '<g transform="translate(500 520) scale(1.2)">' + p_bracelete(s) + '</g>', 'Pulseiras VOLT', 'azul'),
    'cat-brincos':   (lambda s: '<g transform="translate(500 520) scale(1.15)">' + p_argola(s) + '</g>', 'Brincos VOLT', 'roxo'),
    'cat-kits':      (lambda s: '<g transform="translate(500 520) scale(.98)">' + p_kit_rua(s) + '</g>', 'Kits VOLT', 'gelo'),
}
for i, (nome, (fn, rotulo, fundo)) in enumerate(CAPAS.items()):
    s = 400 + i*9
    open(OUT + f'{nome}.svg', 'w').write(
        cena(1000, 1000, s, fn(s), rotulo, fundo, i*14, bolha=(0.5, 0.5, 0.4, BOLHA[fundo])))
    contagem += 1

# ── favicon ───────────────────────────────────────────────────
open(OUT + 'favicon.svg', 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="12" fill="{TINTA}"/>
<path fill="{VOLT}" d="M35 6 16 36h12l-5 22 21-32H31l4-20Z"/>
</svg>
''')
contagem += 1

print('geradas', contagem, 'artes')
