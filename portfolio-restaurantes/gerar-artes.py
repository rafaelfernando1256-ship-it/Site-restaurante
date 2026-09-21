# -*- coding: utf-8 -*-
"""FULL HOUSE — arte dos projetos demonstrativos, em SVG.

Não há banco de imagens alcançável deste ambiente, então cada prato é
desenhado por código. A regra que separa "forma colorida" de "comida":
três passagens empilhadas — sombra em opacidade baixa, realce em
opacidade baixa e uma borda escurecida da própria cor do alimento.
É a mesma lógica de luz em todos os arquivos, o que faz os três
restaurantes parecerem fotografados pelo mesmo estúdio.
"""
import math, os, random

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "arte") + os.sep

# ── cor ───────────────────────────────────────────────────────
def _hex(r, g, b):
    return "#%02X%02X%02X" % (max(0, min(255, int(r))), max(0, min(255, int(g))), max(0, min(255, int(b))))

def mistura(cor, alvo, t):
    c, a = cor.lstrip("#"), alvo.lstrip("#")
    return _hex(*[int(c[i:i+2], 16) * (1 - t) + int(a[i:i+2], 16) * t for i in (0, 2, 4)])

escuro = lambda c, t=.22: mistura(c, "#000000", t)
claro  = lambda c, t=.22: mistura(c, "#FFFFFF", t)

FUNDOS = {
    "char":  "#12120F", "char2": "#1B1B17", "musgo": "#2C3A2A",
    "comal": "#141210", "comal2": "#1E1A16",
    "creme": "#F6F0E2", "creme2": "#EFE6D0", "azul": "#1D3557",
}

def cena(w, h, s, corpo, rotulo, fundo="char", vinheta=True):
    fill = FUNDOS.get(fundo, fundo)
    vin = (f'<radialGradient id="vin{s}" cx="50%" cy="46%" r="72%">'
           f'<stop offset="55%" stop-color="#000" stop-opacity="0"/>'
           f'<stop offset="100%" stop-color="#000" stop-opacity=".34"/></radialGradient>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
            f'role="img" aria-label="{rotulo}">\n'
            f'<defs>{vin}<filter id="bl{s}" x="-30%" y="-30%" width="160%" height="160%">'
            f'<feGaussianBlur stdDeviation="14"/></filter></defs>\n'
            f'<rect width="{w}" height="{h}" fill="{fill}"/>\n{corpo}\n'
            + (f'<rect width="{w}" height="{h}" fill="url(#vin{s})"/>\n' if vinheta else "")
            + "</svg>\n")

def sombra(d, op=.16): return f'<path d="{d}" fill="#000" opacity="{op}"/>'
def luz(d, op=.16):    return f'<path d="{d}" fill="#FFF" opacity="{op}"/>'

# ── peças de comida ───────────────────────────────────────────
def prato(cx, cy, r, cor="#EFEAE0", aro=True):
    """Prato visto de cima, com aro e sombra projetada."""
    g = [f'<ellipse cx="{cx}" cy="{cy + r*0.09:.0f}" rx="{r*1.03:.0f}" ry="{r*0.99:.0f}" '
         f'fill="#000" opacity=".3" filter="url(#bl7)"/>',
         f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{cor}"/>',
         f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{escuro(cor,.1)}" stroke-width="2"/>']
    if aro:
        g.append(f'<circle cx="{cx}" cy="{cy}" r="{r*0.74:.0f}" fill="none" '
                 f'stroke="{escuro(cor,.07)}" stroke-width="1.6"/>')
    g.append(f'<path d="M{cx-r*0.72:.0f} {cy-r*0.38:.0f} A {r*0.82:.0f} {r*0.82:.0f} 0 0 1 '
             f'{cx-r*0.1:.0f} {cy-r*0.8:.0f}" fill="none" stroke="#FFF" stroke-width="{r*0.07:.0f}" '
             f'stroke-linecap="round" opacity=".5"/>')
    return "".join(g)

def borrao(cx, cy, rx, ry, cor, giro=0, op=.9):
    """Pincelada de molho no prato."""
    return (f'<g transform="rotate({giro} {cx} {cy})" opacity="{op}">'
            f'<path d="M{cx-rx} {cy} C{cx-rx} {cy-ry*1.1} {cx+rx*0.2} {cy-ry*1.25} {cx+rx*0.62} {cy-ry*0.45} '
            f'C{cx+rx*0.95} {cy+ry*0.1} {cx+rx*0.4} {cy+ry*0.95} {cx-rx*0.1} {cy+ry*0.8} '
            f'C{cx-rx*0.62} {cy+ry*0.66} {cx-rx} {cy+ry*0.4} {cx-rx} {cy} Z" fill="{cor}"/></g>')

def filete(cx, cy, w, h, cor, giro=-8):
    """Posta de peixe selada.

    Retângulo arredondado não lê como peixe. O que o olho reconhece
    é o contorno: uma ponta afilada, o dorso mais alto que a barriga,
    as lascas abrindo em leque e a pele dourada só de um lado.
    """
    W, H = w / 2, h / 2
    g = [f'<g transform="rotate({giro} {cx} {cy})">']
    # silhueta: afila à esquerda, encorpa à direita
    corpo = (f'M{cx-W:.0f} {cy+H*0.16:.0f} '
             f'C{cx-W*0.92:.0f} {cy-H*0.52:.0f} {cx-W*0.34:.0f} {cy-H:.0f} {cx+W*0.22:.0f} {cy-H*0.92:.0f} '
             f'C{cx+W*0.76:.0f} {cy-H*0.86:.0f} {cx+W:.0f} {cy-H*0.42:.0f} {cx+W*0.96:.0f} {cy+H*0.2:.0f} '
             f'C{cx+W*0.92:.0f} {cy+H*0.78:.0f} {cx+W*0.3:.0f} {cy+H:.0f} {cx-W*0.3:.0f} {cy+H*0.86:.0f} '
             f'C{cx-W*0.72:.0f} {cy+H*0.74:.0f} {cx-W:.0f} {cy+H*0.54:.0f} {cx-W:.0f} {cy+H*0.16:.0f} Z')
    g.append(f'<path d="{corpo}" fill="{cor}"/>')
    # lascas em leque, acompanhando o corpo
    for i in range(6):
        t = 0.1 + i * 0.15
        x = cx - W + w * t
        inc = (t - 0.5) * H * 0.5
        g.append(f'<path d="M{x:.0f} {cy-H*0.74+inc:.0f} C{x+10:.0f} {cy-H*0.2:.0f} {x-10:.0f} '
                 f'{cy+H*0.24:.0f} {x-6:.0f} {cy+H*0.72-inc*0.5:.0f}" fill="none" '
                 f'stroke="{escuro(cor,.17)}" stroke-width="4" stroke-linecap="round" opacity=".75"/>')
    # pele selada: faixa dourada só na borda de cima
    g.append(f'<path d="M{cx-W*0.92:.0f} {cy-H*0.5:.0f} '
             f'C{cx-W*0.4:.0f} {cy-H*1.02:.0f} {cx+W*0.5:.0f} {cy-H*0.98:.0f} {cx+W*0.97:.0f} {cy-H*0.3:.0f} '
             f'C{cx+W*0.6:.0f} {cy-H*0.62:.0f} {cx-W*0.4:.0f} {cy-H*0.66:.0f} {cx-W*0.92:.0f} {cy-H*0.5:.0f} Z" '
             f'fill="{escuro("#C98A3E",.05)}"/>')
    g.append(f'<path d="M{cx-W*0.6:.0f} {cy-H*0.66:.0f} C{cx-W*0.1:.0f} {cy-H*0.88:.0f} '
             f'{cx+W*0.4:.0f} {cy-H*0.84:.0f} {cx+W*0.8:.0f} {cy-H*0.48:.0f}" fill="none" '
             f'stroke="#E8B468" stroke-width="7" stroke-linecap="round" opacity=".85"/>')
    # realce úmido
    g.append(f'<ellipse cx="{cx-W*0.2:.0f}" cy="{cy-H*0.1:.0f}" rx="{W*0.34:.0f}" ry="{H*0.22:.0f}" '
             f'fill="#FFF" opacity=".14"/>')
    g.append("</g>")
    return "".join(g)

def ervas(cx, cy, n, cor, espalha=60, semente=1):
    r = random.Random(semente)
    g = []
    for _ in range(n):
        x, y = cx + r.uniform(-espalha, espalha), cy + r.uniform(-espalha*0.6, espalha*0.6)
        a = r.uniform(0, 360)
        g.append(f'<g transform="rotate({a:.0f} {x:.0f} {y:.0f})">'
                 f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{r.uniform(5,11):.0f}" ry="{r.uniform(2.5,4.5):.1f}" '
                 f'fill="{cor}" opacity="{r.uniform(.7,1):.2f}"/></g>')
    return "".join(g)

def pontos(cx, cy, n, cor, espalha, semente=2, rmin=3, rmax=7):
    r = random.Random(semente)
    return "".join(f'<circle cx="{cx + r.uniform(-espalha,espalha):.0f}" cy="{cy + r.uniform(-espalha*.7,espalha*.7):.0f}" '
                   f'r="{r.uniform(rmin,rmax):.1f}" fill="{cor}" opacity="{r.uniform(.6,1):.2f}"/>' for _ in range(n))

def tortilha(cx, cy, r, cor="#E8C88A"):
    g = [f'<ellipse cx="{cx}" cy="{cy}" rx="{r}" ry="{r*0.86:.0f}" fill="{cor}"/>',
         f'<ellipse cx="{cx}" cy="{cy}" rx="{r}" ry="{r*0.86:.0f}" fill="none" '
         f'stroke="{escuro(cor,.16)}" stroke-width="2.5"/>']
    rr = random.Random(int(cx + cy))
    for _ in range(7):
        a = rr.uniform(0, 6.28); d = rr.uniform(0.2, 0.78) * r
        g.append(f'<ellipse cx="{cx + math.cos(a)*d:.0f}" cy="{cy + math.sin(a)*d*0.86:.0f}" '
                 f'rx="{rr.uniform(6,13):.0f}" ry="{rr.uniform(4,8):.0f}" fill="{escuro(cor,.2)}" opacity=".5"/>')
    return "".join(g)

def taco(cx, cy, esc, recheio, semente=3):
    """Taco de frente: tortilha dobrada, recheio, cebola e coentro."""
    g = [f'<g transform="translate({cx} {cy}) scale({esc})">']
    g.append(f'<path d="M-150 60 C-150 -60 150 -60 150 60 C150 76 -150 76 -150 60 Z" fill="#E8C88A"/>')
    g.append(f'<path d="M-150 60 C-150 -60 150 -60 150 60 C150 76 -150 76 -150 60 Z" fill="none" '
             f'stroke="{escuro("#E8C88A",.2)}" stroke-width="3"/>')
    g.append(f'<path d="M-124 44 C-118 -34 118 -34 124 44 C90 58 -90 58 -124 44 Z" fill="{recheio}"/>')
    g.append(f'<path d="M-124 44 C-118 -34 118 -34 124 44 C90 58 -90 58 -124 44 Z" fill="none" '
             f'stroke="{escuro(recheio,.26)}" stroke-width="2.5" opacity=".8"/>')
    g.append(pontos(0, 16, 16, "#F2F0E6", 104, semente, 3.5, 6.5))       # cebola
    g.append(ervas(0, 6, 13, "#7FA84B", 100, semente + 5))                # coentro
    g.append(f'<path d="M-146 58 C-120 30 -60 18 0 18" fill="none" stroke="#FFF" stroke-width="5" '
             f'stroke-linecap="round" opacity=".18"/>')
    g.append("</g>")
    return "".join(g)

def ovo(cx, cy, esc=1.0):
    return (f'<g transform="translate({cx} {cy}) scale({esc})">'
            f'<ellipse cx="0" cy="0" rx="86" ry="66" fill="#FAF6EA"/>'
            f'<ellipse cx="-8" cy="6" rx="66" ry="50" fill="#FDFBF4"/>'
            f'<circle cx="4" cy="-4" r="31" fill="#E8A72C"/>'
            f'<circle cx="4" cy="-4" r="31" fill="none" stroke="{escuro("#E8A72C",.18)}" stroke-width="2"/>'
            f'<circle cx="-7" cy="-14" r="10" fill="#F7C862" opacity=".85"/></g>')

def bacon(cx, cy, giro=0, esc=1.0):
    return (f'<g transform="translate({cx} {cy}) rotate({giro}) scale({esc})">'
            f'<path d="M-100 -14 C-60 -30 -20 4 20 -12 C56 -26 84 -2 104 -14 L104 16 '
            f'C84 28 56 4 20 18 C-20 34 -60 0 -100 16 Z" fill="#9E4A32"/>'
            f'<path d="M-100 -8 C-60 -24 -20 10 20 -6 C56 -20 84 4 104 -8 L104 2 '
            f'C84 14 56 -10 20 4 C-20 20 -60 -14 -100 2 Z" fill="#F0DED0" opacity=".75"/></g>')

def panqueca(cx, cy, n=3, esc=1.0):
    g = [f'<g transform="translate({cx} {cy}) scale({esc})">']
    for i in range(n):
        y = -i * 30
        g.append(f'<ellipse cx="0" cy="{y}" rx="108" ry="30" fill="#D8A45C"/>')
        g.append(f'<ellipse cx="0" cy="{y-7}" rx="108" ry="28" fill="#E8BE7C"/>')
        g.append(f'<ellipse cx="-24" cy="{y-12}" rx="42" ry="12" fill="#F2D6A0" opacity=".7"/>')
    g.append(f'<rect x="-30" y="{-n*30-22}" width="60" height="22" rx="5" fill="#F4E3B0"/>')
    g.append(f'<path d="M-96 {-n*30-6} C-40 {-n*30+16} 40 {-n*30+16} 96 {-n*30-6} '
             f'L96 {-n*30+10} C40 {-n*30+32} -40 {-n*30+32} -96 {-n*30+10} Z" fill="#B0702A" opacity=".8"/>')
    g.append("</g>")
    return "".join(g)

def xicara(cx, cy, esc=1.0, cor="#F2EEE4"):
    return (f'<g transform="translate({cx} {cy}) scale({esc})">'
            f'<ellipse cx="0" cy="96" rx="104" ry="20" fill="#000" opacity=".22"/>'
            f'<path d="M-82 -40 L-70 76 C-68 92 68 92 70 76 L82 -40 Z" fill="{cor}"/>'
            f'<path d="M78 -22 C126 -22 126 46 74 44" fill="none" stroke="{cor}" stroke-width="15" stroke-linecap="round"/>'
            f'<ellipse cx="0" cy="-40" rx="82" ry="22" fill="{escuro(cor,.08)}"/>'
            f'<ellipse cx="0" cy="-38" rx="70" ry="17" fill="#4A2C18"/>'
            f'<ellipse cx="-18" cy="-42" rx="26" ry="7" fill="#7A4A2C" opacity=".7"/>'
            f'<path d="M-72 -14 L-62 62" stroke="#FFF" stroke-width="8" opacity=".45" stroke-linecap="round"/></g>')

def fatia_torta(cx, cy, esc=1.0):
    return (f'<g transform="translate({cx} {cy}) scale({esc})">'
            f'<path d="M-120 60 L0 -70 L120 60 Z" fill="#E3C084"/>'
            f'<path d="M-120 60 L0 -70 L120 60 Z" fill="none" stroke="{escuro("#E3C084",.22)}" stroke-width="3"/>'
            f'<path d="M-96 46 L0 -42 L96 46 Z" fill="#B23A3A"/>'
            f'<path d="M-96 46 L0 -42 L96 46 Z" fill="none" stroke="{escuro("#B23A3A",.25)}" stroke-width="2"/>'
            f'<path d="M-120 60 L120 60 L120 84 C60 96 -60 96 -120 84 Z" fill="#D8B074"/>'
            f'<path d="M-60 30 L-22 -10 M10 -12 L52 34" stroke="#EBD0A0" stroke-width="9" '
            f'stroke-linecap="round" opacity=".8"/></g>')

def copo(cx, cy, cor, esc=1.0):
    return (f'<g transform="translate({cx} {cy}) scale({esc})">'
            f'<ellipse cx="0" cy="118" rx="70" ry="16" fill="#000" opacity=".2"/>'
            f'<path d="M-62 -84 L-50 104 C-48 118 48 118 50 104 L62 -84 Z" fill="{cor}" opacity=".92"/>'
            f'<path d="M-62 -84 L-50 104 C-48 118 48 118 50 104 L62 -84 Z" fill="none" '
            f'stroke="#FFF" stroke-width="3" opacity=".3"/>'
            f'<ellipse cx="0" cy="-84" rx="62" ry="15" fill="{claro(cor,.25)}"/>'
            f'<path d="M-52 -60 L-44 70" stroke="#FFF" stroke-width="9" opacity=".35" stroke-linecap="round"/>'
            f'<rect x="14" y="-118" width="11" height="128" rx="5" fill="#E8503A" transform="rotate(12 20 -54)"/></g>')

def retrato(cx, cy, esc, aro, chapeu=None):
    """Retrato abstrato: silhueta de ombros e cabeça, sem rosto.
       Sem rosto de propósito — rosto inventado em site de negócio
       real vira mentira; aqui fica claramente ilustração."""
    g = [f'<g transform="translate({cx} {cy}) scale({esc})">']
    g.append(f'<circle cx="0" cy="-40" r="150" fill="{aro}" opacity=".9"/>')
    g.append(f'<path d="M-168 250 C-168 110 -80 62 0 62 C80 62 168 110 168 250 Z" fill="#2A2A24"/>')
    g.append(f'<ellipse cx="0" cy="-34" rx="92" ry="106" fill="#3A382F"/>')
    if chapeu == "toque":
        g.append(f'<path d="M-96 -108 C-96 -190 96 -190 96 -108 C96 -92 -96 -92 -96 -108 Z" fill="#EFEAE0"/>')
        g.append(f'<rect x="-96" y="-112" width="192" height="30" rx="8" fill="#E2DCD0"/>')
    elif chapeu == "boina":
        g.append(f'<path d="M-98 -96 C-98 -168 98 -168 98 -110 C98 -86 -98 -78 -98 -96 Z" fill="#26261F"/>')
    g.append(f'<path d="M-168 250 C-168 150 -96 104 -40 88 L0 150 L40 88 C96 104 168 150 168 250 Z" '
             f'fill="#33322B"/>')
    g.append("</g>")
    return "".join(g)


# ══════════════════════════════════════════════════════════════
#  CENAS
# ══════════════════════════════════════════════════════════════
def grava(caminho, svg):
    destino = OUT + caminho
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    open(destino, "w").write(svg)

contagem = 0

# ── Larkspur ─────────────────────────────────────────────────
corpo = (prato(450, 500, 392, "#EFEAE0")
         + borrao(408, 566, 214, 104, "#3E5C34", giro=-12, op=.9)
         + borrao(560, 448, 128, 66, "#C8A85E", giro=22, op=.55)
         + filete(432, 452, 344, 182, "#E8DCC6", giro=-9)
         + ervas(470, 572, 20, "#6F9440", 172, 11)
         + pontos(596, 420, 14, "#C9B27E", 92, 12, 6, 13)
         + pontos(322, 476, 11, "#8FAF5E", 74, 13, 5, 9)
         + pontos(452, 372, 9, "#F2EEE2", 128, 14, 3, 6))
grava("larkspur/hero.svg", cena(900, 1000, 7, corpo, "Plated halibut with brown butter and green almond", "char"))
contagem += 1

for i, (aro, chapeu) in enumerate([("#2C3A2A", "toque"), ("#3A3128", None), ("#2E2A34", "boina")], 1):
    grava(f"larkspur/retrato-{i}.svg",
          cena(600, 700, 20 + i, retrato(300, 230, 1.05, aro, chapeu),
               "Illustrated portrait of a member of the Larkspur team", "char2", vinheta=False))
    contagem += 1

# ── Comal Street Tacos ───────────────────────────────────────
corpo = (f'<ellipse cx="500" cy="700" rx="400" ry="70" fill="#000" opacity=".34" filter="url(#bl7)"/>'
         + f'<circle cx="450" cy="516" r="392" fill="#2A2621"/>'
         + f'<circle cx="450" cy="516" r="392" fill="none" stroke="#3E382F" stroke-width="12"/>'
         + f'<circle cx="450" cy="516" r="322" fill="#221F1B"/>'
         + taco(268, 462, 1.14, "#B4532A", 31)
         + taco(632, 462, 1.14, "#8E6B33", 32)
         + taco(450, 650, 1.3, "#A8452C", 33)
         + pontos(450, 300, 16, "#9BBF3F", 250, 34, 4, 9))
grava("comal/hero.svg", cena(900, 1000, 7, corpo, "Three street tacos on a hot comal", "comal"))
contagem += 1

PRATOS_COMAL = [
    ("taco-pastor", lambda: taco(350, 366, 1.92, "#B4532A", 41) + pontos(350, 182, 14, "#E9B44C", 210, 42, 5, 11),
     "Al pastor taco with pineapple and onion"),
    ("elote", lambda: (f'<g transform="translate(350 350) rotate(-28)">'
                       f'<rect x="-98" y="-250" width="196" height="500" rx="98" fill="#D8A93C"/>'
                       + "".join(f'<ellipse cx="{-66 + (k%5)*33}" cy="{-216 + (k//5)*40}" rx="15" ry="17" '
                                 f'fill="{claro("#E9C452",.3) if (k+k//5)%2 else "#E9C452"}"/>'
                                 for k in range(60))
                       + "".join(f'<ellipse cx="{-66 + (k*37)%166}" cy="{-200 + (k*83)%420}" rx="14" ry="16" '
                                 f'fill="#8A5A22" opacity=".8"/>' for k in range(9))
                       + f'<rect x="-98" y="-250" width="62" height="500" rx="31" fill="#FFF" opacity=".16"/>'
                       + f'</g>'
                       + pontos(350, 330, 30, "#F4F1E8", 168, 43, 5, 10)
                       + pontos(350, 344, 20, "#D6402A", 158, 44, 3, 6)
                       + ervas(350, 360, 12, "#7FA84B", 150, 45)),
     "Elote off the cob with crema, cotija and chile"),
    ("quesadilla", lambda: (
        # meia-lua assada, com bolhas e uma cunha puxada para fora
        f'<g transform="translate(300 392) scale(1.3)">'
        f'<path d="M-230 106 A 230 230 0 0 1 230 106 Z" fill="#E4C084"/>'
        f'<path d="M-230 106 A 230 230 0 0 1 230 106 Z" fill="none" stroke="{escuro("#E4C084",.24)}" stroke-width="5"/>'
        + "".join(f'<ellipse cx="{-150 + k*52}" cy="{18 - (k % 3) * 34}" rx="{16 + (k % 4) * 5}" ry="{11 + (k % 3) * 4}" '
                  f'fill="{escuro("#E4C084",.2)}" opacity=".7"/>' for k in range(7))
        + f'<path d="M-96 106 L-62 -104 M14 106 L14 -122" stroke="{escuro("#E4C084",.2)}" '
          f'stroke-width="5" opacity=".65"/>'
        f'</g>'
        # a cunha separada: é o queijo derretido à mostra que faz ler como quesadilla
        + f'<g transform="translate(546 486) rotate(28) scale(1.34)">'
          f'<path d="M0 -150 L112 44 L-112 44 Z" fill="#E4C084"/>'
          f'<path d="M0 -150 L112 44 L-112 44 Z" fill="none" stroke="{escuro("#E4C084",.24)}" stroke-width="5"/>'
          f'<path d="M-96 34 C-56 6 -20 52 18 22 C52 -4 78 30 98 34 L98 44 L-96 44 Z" fill="#E9B44C"/>'
          f'<path d="M-70 44 C-58 78 -30 74 -22 46 M26 44 C36 84 66 78 72 48" fill="none" '
          f'stroke="#E9B44C" stroke-width="9" stroke-linecap="round"/>'
          f'</g>'
        + pontos(350, 190, 10, "#F2EDE4", 170, 45, 3, 7)),
     "Quesadilla with a wedge pulled away, cheese showing"),
    ("agua-fresca", lambda: copo(350, 336, "#C8305A", 1.95) + pontos(350, 596, 10, "#E9B44C", 190, 46, 4, 8),
     "Agua fresca in a tall glass"),
    ("salsas", lambda: (f'<ellipse cx="350" cy="470" rx="250" ry="52" fill="#000" opacity=".26" filter="url(#bl7)"/>'
                        + "".join(f'<g transform="translate({190 + k*160} 400)">'
                                  f'<ellipse cx="0" cy="0" rx="86" ry="70" fill="#2E2A24"/>'
                                  f'<ellipse cx="0" cy="-8" rx="70" ry="54" fill="{c}"/>'
                                  f'<ellipse cx="-20" cy="-22" rx="24" ry="13" fill="#FFF" opacity=".2"/></g>'
                                  for k, c in enumerate(["#4E7A2E", "#B03526", "#D98A2B"]))
                        + "".join(f'<g transform="translate({168 + k*74} {572 + (k%2)*14}) rotate({-22 + k*17})">'
                                  f'<path d="M-52 34 Q-6 -46 52 30 Q0 54 -52 34 Z" fill="#E8C88A"/>'
                                  f'<path d="M-52 34 Q-6 -46 52 30 Q0 54 -52 34 Z" fill="none" '
                                  f'stroke="{escuro("#E8C88A",.22)}" stroke-width="3"/>'
                                  f'<path d="M-30 30 Q-4 -18 26 28" fill="none" stroke="{escuro("#E8C88A",.12)}" '
                                  f'stroke-width="3" opacity=".8"/></g>' for k in range(5))),
     "Three salsas with tortilla chips"),
    ("barbacoa", lambda: (prato(350, 368, 300, "#E4DFD4")
                          + f'<ellipse cx="350" cy="366" rx="210" ry="142" fill="#7A3A22"/>'
                          + pontos(350, 360, 26, "#94492C", 128, 47, 8, 17)
                          + ervas(350, 366, 14, "#7FA84B", 118, 48)
                          + pontos(350, 370, 12, "#F2F0E6", 122, 49, 4, 7)),
     "Barbacoa plate with cilantro and onion"),
]
for i, (nome, fn, rot) in enumerate(PRATOS_COMAL, 1):
    fundo = "comal2" if i % 2 else "comal"
    grava(f"comal/food-{i}.svg", cena(700, 700, 50 + i, fn(), rot, fundo))
    contagem += 1

# ── Blue Plate Diner ─────────────────────────────────────────
corpo = (prato(450, 500, 400, "#FBF8F1")
         + ovo(336, 396, 1.34) + ovo(556, 414, 1.26)
         + bacon(430, 596, -6, 1.44) + bacon(456, 658, 5, 1.36)
         + pontos(636, 556, 18, "#C8A24E", 120, 61, 8, 17))
grava("diner/hero.svg", cena(900, 1000, 7, corpo, "The Blue Plate: two eggs, bacon and home fries", "creme", vinheta=False))
contagem += 1

PRATOS_DINER = [
    ("gallery-1", lambda: panqueca(350, 470, 3, 1.72), "A short stack of buttermilk pancakes with butter and syrup"),
    ("gallery-2", lambda: xicara(350, 352, 1.92), "A cup of diner coffee"),
    ("gallery-3", lambda: fatia_torta(350, 366, 1.95), "A slice of cherry pie"),
    ("gallery-4", lambda: (prato(350, 366, 300, "#FBF8F1")
                           + f'<g transform="translate(350 340) rotate(-8) scale(1.42)">'
                           f'<rect x="-150" y="-70" width="300" height="140" rx="12" fill="#D8A45C"/>'
                           f'<rect x="-150" y="-70" width="300" height="34" rx="12" fill="#E8BE7C"/>'
                           f'<rect x="-140" y="-16" width="280" height="22" fill="#8E4A2E"/>'
                           f'<rect x="-140" y="8" width="280" height="18" fill="#E8B84C"/></g>'
                           + pontos(350, 500, 16, "#E0B871", 130, 62, 7, 14)),
     "A patty melt on rye with fries"),
]
for nome, fn, rot in PRATOS_DINER:
    grava(f"diner/{nome}.svg", cena(700, 700, 70 + len(nome), fn(), rot, "creme2", vinheta=False))
    contagem += 1

for i, aro in enumerate(["#1D3557", "#6B4A2F", "#C0362C"], 1):
    grava(f"diner/familia-{i}.svg",
          cena(600, 700, 80 + i, retrato(300, 230, 1.05, aro, None),
               "Illustrated portrait of a member of the Blue Plate family", "creme2", vinheta=False))
    contagem += 1

print(f"geradas {contagem} artes")
