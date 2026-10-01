#!/usr/bin/env python3
"""
GERADOR DE ARTE — Grão Dourado

Desenha todas as ilustrações do site em SVG. Elas são provisórias:
site de café vive de foto de comida, e foto de verdade ganha disso
em qualquer dia da semana. Rodar: `python3 gerar-artes.py`

Duas regras aprendidas na marra em projetos anteriores deste repo:

1. A comida ocupa de 70% a 85% do quadro. Comida pequena no meio de
   muito fundo lê como ícone, não como apetite.
2. Nada de contorno fino e uniforme. O que dá volume é sombra em
   baixo, luz em cima e uma mordida de contraste na borda.
"""
import math
import random
from pathlib import Path

SAIDA = Path(__file__).parent / "publico" / "img"
SAIDA.mkdir(parents=True, exist_ok=True)

# ── paleta, tirada do logo deles ────────────────────────────────────
CAFE = "#241510"
CAFE2 = "#3A2317"
CAFE3 = "#5A3A26"
TORRA = "#7A4A2C"
DOURADO = "#C9962E"
DOURADO_CLARO = "#E3BC6A"
DOURADO_ESC = "#9A6F1C"
CREME = "#F7F0E3"
CREME2 = "#EFE4D0"
CREME3 = "#E2D3B8"
LEITE = "#FBF7EF"
VERDE = "#4A5D3A"
TERRA = "#A8452F"
MASSA = "#E8C98A"
MASSA_ESC = "#C9A05C"
QUEIJO = "#F0D08A"
VIDRO = "#FFFFFF"


def svg(w, h, corpo, fundo=None, defs=""):
    f = f'<rect width="{w}" height="{h}" fill="{fundo}"/>' if fundo else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'width="{w}" height="{h}" role="img">'
        f"<defs>{defs}</defs>{f}{corpo}</svg>"
    )


def grava(nome, conteudo):
    (SAIDA / nome).write_text(conteudo, encoding="utf-8")


def grad(id_, paradas, x1=0, y1=0, x2=0, y2=1):
    p = "".join(
        f'<stop offset="{o}" stop-color="{c}"{"" if a is None else f" stop-opacity={a!r}"}/>'
        for o, c, a in paradas
    )
    return (
        f'<linearGradient id="{id_}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{p}</linearGradient>'
    )


def radial(id_, paradas, cx=0.5, cy=0.4, r=0.7):
    p = "".join(
        f'<stop offset="{o}" stop-color="{c}"{"" if a is None else f" stop-opacity={a!r}"}/>'
        for o, c, a in paradas
    )
    return f'<radialGradient id="{id_}" cx="{cx}" cy="{cy}" r="{r}">{p}</radialGradient>'


# ── primitivas ──────────────────────────────────────────────────────
def sombra(cx, cy, rx, ry, op=0.18):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{CAFE}" opacity="{op}"/>'


def grao(cx, cy, r, ang=0, cor=CAFE2, cor2=TORRA):
    """Grão de café: oval com o sulco no meio."""
    return (
        f'<g transform="translate({cx},{cy}) rotate({ang})">'
        f'<ellipse rx="{r}" ry="{r*0.72}" fill="{cor}"/>'
        f'<ellipse rx="{r}" ry="{r*0.72}" fill="{cor2}" opacity=".35"/>'
        f'<path d="M {-r*0.86} 0 Q 0 {-r*0.3} {r*0.86} 0 Q 0 {r*0.3} {-r*0.86} 0 Z" '
        f'fill="{CAFE}" opacity=".55"/>'
        f'<ellipse cx="{-r*0.25}" cy="{-r*0.3}" rx="{r*0.4}" ry="{r*0.2}" '
        f'fill="{LEITE}" opacity=".12"/></g>'
    )


def vapor(cx, cy, n=3, h=70, op=0.3):
    """Fiapos de vapor subindo. Dá temperatura à imagem."""
    s = ""
    for i in range(n):
        x = cx + (i - (n - 1) / 2) * 26
        a = 13 + i * 3
        s += (
            f'<path d="M {x} {cy} C {x-a} {cy-h*0.3} {x+a} {cy-h*0.55} {x} {cy-h} '
            f'C {x-a*0.7} {cy-h*1.3} {x+a*0.5} {cy-h*1.5} {x} {cy-h*1.75}" '
            f'fill="none" stroke="{LEITE}" stroke-width="{7-i}" stroke-linecap="round" '
            f'opacity="{op - i*0.05:.2f}"/>'
        )
    return s


def xicara(cx, cy, larg, cor_liq=CAFE2, creme=True, pires=True, alca=True):
    """Xícara vista de três-quartos: corpo cônico, líquido, alça e pires."""
    w, h = larg, larg * 0.76
    topo_rx, base_rx = w / 2, w * 0.33
    s = ""
    if pires:
        s += sombra(cx, cy + h * 0.62, w * 0.86, w * 0.17, 0.2)
        s += (
            f'<ellipse cx="{cx}" cy="{cy+h*0.56}" rx="{w*0.82}" ry="{w*0.18}" fill="{CREME3}"/>'
            f'<ellipse cx="{cx}" cy="{cy+h*0.52}" rx="{w*0.82}" ry="{w*0.18}" fill="{LEITE}"/>'
            f'<ellipse cx="{cx}" cy="{cy+h*0.52}" rx="{w*0.52}" ry="{w*0.11}" '
            f'fill="{CREME2}" opacity=".7"/>'
        )
    if alca:
        s += (
            f'<path d="M {cx+topo_rx*0.92} {cy-h*0.1} '
            f'C {cx+topo_rx*1.72} {cy-h*0.22} {cx+topo_rx*1.72} {cy+h*0.3} '
            f'{cx+topo_rx*0.74} {cy+h*0.25}" fill="none" stroke="{LEITE}" '
            f'stroke-width="{w*0.11}" stroke-linecap="round"/>'
            f'<path d="M {cx+topo_rx*0.92} {cy-h*0.1} '
            f'C {cx+topo_rx*1.72} {cy-h*0.22} {cx+topo_rx*1.72} {cy+h*0.3} '
            f'{cx+topo_rx*0.74} {cy+h*0.25}" fill="none" stroke="{CREME3}" '
            f'stroke-width="{w*0.04}" stroke-linecap="round" opacity=".5"/>'
        )
    # corpo
    s += (
        f'<path d="M {cx-topo_rx} {cy-h*0.42} L {cx-base_rx} {cy+h*0.42} '
        f'Q {cx} {cy+h*0.56} {cx+base_rx} {cy+h*0.42} L {cx+topo_rx} {cy-h*0.42} Z" '
        f'fill="{LEITE}"/>'
        f'<path d="M {cx-topo_rx} {cy-h*0.42} L {cx-base_rx} {cy+h*0.42} '
        f'Q {cx-base_rx*0.2} {cy+h*0.52} {cx-base_rx*0.1} {cy+h*0.5} '
        f'L {cx-topo_rx*0.42} {cy-h*0.42} Z" fill="{CREME3}" opacity=".55"/>'
    )
    # líquido
    s += (
        f'<ellipse cx="{cx}" cy="{cy-h*0.42}" rx="{topo_rx}" ry="{topo_rx*0.3}" fill="{LEITE}"/>'
        f'<ellipse cx="{cx}" cy="{cy-h*0.4}" rx="{topo_rx*0.88}" ry="{topo_rx*0.26}" '
        f'fill="{cor_liq}"/>'
    )
    if creme:
        # Opacidade baixa de propósito: a .55 o dourado lavava o café
        # escuro e o líquido saía verde-oliva.
        s += (
            f'<ellipse cx="{cx}" cy="{cy-h*0.4}" rx="{topo_rx*0.86}" ry="{topo_rx*0.25}" '
            f'fill="{DOURADO_CLARO}" opacity=".3"/>'
            f'<ellipse cx="{cx-topo_rx*0.25}" cy="{cy-h*0.44}" rx="{topo_rx*0.3}" '
            f'ry="{topo_rx*0.1}" fill="{LEITE}" opacity=".3"/>'
        )
    return s


def copo(cx, cy, larg, camadas, chantilly=False, canudo=False):
    """Copo de vidro com camadas. `camadas` = [(altura_relativa, cor)]."""
    w = larg
    h = larg * 1.45
    topo, base = cy - h / 2, cy + h / 2
    rx_t, rx_b = w / 2, w * 0.40
    s = sombra(cx, base + 12, w * 0.6, w * 0.14, 0.2)

    def raio(t):  # t de 0 (topo) a 1 (base)
        return rx_t + (rx_b - rx_t) * t

    y = base
    for frac, cor in camadas:
        alt = h * frac
        t0 = (y - alt - topo) / h
        t1 = (y - topo) / h
        r0, r1 = raio(t0), raio(t1)
        s += (
            f'<path d="M {cx-r0} {y-alt} L {cx-r1} {y} Q {cx} {y+r1*0.3} {cx+r1} {y} '
            f'L {cx+r0} {y-alt} Q {cx} {y-alt+r0*0.26} {cx-r0} {y-alt} Z" fill="{cor}"/>'
        )
        y -= alt
    if chantilly:
        s += (
            f'<path d="M {cx-rx_t*0.95} {topo+6} '
            f'C {cx-rx_t*0.8} {topo-w*0.42} {cx-rx_t*0.1} {topo-w*0.3} {cx-rx_t*0.08} {topo-w*0.52} '
            f'C {cx+rx_t*0.2} {topo-w*0.34} {cx+rx_t*0.8} {topo-w*0.46} {cx+rx_t*0.95} {topo+6} Z" '
            f'fill="{LEITE}"/>'
            f'<ellipse cx="{cx-rx_t*0.3}" cy="{topo-w*0.12}" rx="{rx_t*0.3}" ry="{w*0.1}" '
            f'fill="{CREME2}" opacity=".6"/>'
        )
    # vidro: brilho e borda
    s += (
        f'<path d="M {cx-rx_t} {topo} L {cx-rx_b} {base} Q {cx} {base+rx_b*0.3} {cx+rx_b} {base} '
        f'L {cx+rx_t} {topo} Q {cx} {topo+rx_t*0.28} {cx-rx_t} {topo} Z" '
        f'fill="{VIDRO}" opacity=".12"/>'
        f'<path d="M {cx-rx_t*0.78} {topo+h*0.08} L {cx-rx_b*0.72} {base-h*0.06}" '
        f'stroke="{VIDRO}" stroke-width="{w*0.07}" stroke-linecap="round" opacity=".35"/>'
        f'<ellipse cx="{cx}" cy="{topo}" rx="{rx_t}" ry="{rx_t*0.28}" fill="none" '
        f'stroke="{VIDRO}" stroke-width="3" opacity=".5"/>'
    )
    if canudo:
        s += (
            f'<path d="M {cx+rx_t*0.3} {topo-w*0.62} L {cx+rx_t*0.05} {base-h*0.18}" '
            f'stroke="{TERRA}" stroke-width="{w*0.1}" stroke-linecap="round"/>'
        )
    return s


def massa_redonda(cx, cy, r, cor=MASSA, cor_esc=MASSA_ESC, vincos=18):
    """Base de empada/quiche: disco com borda canelada."""
    s = sombra(cx, cy + r * 0.86, r * 0.92, r * 0.2, 0.22)
    s += f'<ellipse cx="{cx}" cy="{cy}" rx="{r}" ry="{r*0.78}" fill="{cor_esc}"/>'
    s += f'<ellipse cx="{cx}" cy="{cy-r*0.05}" rx="{r}" ry="{r*0.76}" fill="{cor}"/>'
    for i in range(vincos):
        a = 2 * math.pi * i / vincos
        x, y = cx + math.cos(a) * r * 0.93, cy - r * 0.05 + math.sin(a) * r * 0.71
        s += (
            f'<ellipse cx="{x}" cy="{y}" rx="{r*0.1}" ry="{r*0.085}" '
            f'fill="{cor_esc}" opacity=".45"/>'
        )
    return s


def pontinhos(cx, cy, rx, ry, n, cor, r=3, op=0.5, semente=1):
    rnd = random.Random(semente)
    s = ""
    for _ in range(n):
        a, d = rnd.uniform(0, 6.283), math.sqrt(rnd.random())
        s += (
            f'<circle cx="{cx+math.cos(a)*rx*d:.1f}" cy="{cy+math.sin(a)*ry*d:.1f}" '
            f'r="{rnd.uniform(r*0.6, r):.1f}" fill="{cor}" opacity="{op}"/>'
        )
    return s


def fundo_quente(w, h, id_, base=CREME, canto=CREME2):
    return (
        radial(id_, [(0, base, None), (1, canto, None)], 0.42, 0.3, 0.85),
        f'<rect width="{w}" height="{h}" fill="url(#{id_})"/>',
    )


# ── itens do cardápio ───────────────────────────────────────────────
W, H = 720, 720


def item(nome, corpo, defs="", fundo_base=CREME, fundo_canto=CREME2):
    d, fundo = fundo_quente(W, H, f"f{nome}", fundo_base, fundo_canto)
    grava(f"{nome}.svg", svg(W, H, fundo + corpo, defs=d + defs))


def gerar_cafes():
    cx, cy = W / 2, H * 0.52
    item("espresso", vapor(cx, cy - 150, 3, 60, 0.26) + xicara(cx, cy, 376, CAFE, True))
    item(
        "capuccino",
        vapor(cx, cy - 160, 3, 66, 0.3)
        + xicara(cx, cy, 392, TORRA, False)
        + f'<ellipse cx="{cx}" cy="{cy-125}" rx="140" ry="42" fill="{LEITE}"/>'
        + f'<ellipse cx="{cx}" cy="{cy-133}" rx="118" ry="34" fill="{CREME}" opacity=".8"/>'
        + pontinhos(cx, cy - 130, 90, 24, 26, CAFE2, 4, 0.5, 7),
    )
    item(
        "coado",
        vapor(cx, cy - 150, 3, 62, 0.26)
        + xicara(cx, cy, 376, CAFE, False)
        + f'<ellipse cx="{cx-40}" cy="{cy-122}" rx="52" ry="14" fill="{TORRA}" opacity=".35"/>',
    )
    item(
        "latte",
        # Numa xícara larga dá para ver o desenho na espuma; no copo
        # alto da primeira versão o coração virava uma tampa marrom.
        vapor(cx, cy - 170, 3, 58, 0.24)
        + xicara(cx, cy, 390, "#C89A6B", False)
        + f'<ellipse cx="{cx}" cy="{cy-148}" rx="168" ry="50" fill="#E8D5BC"/>'
        + f'<ellipse cx="{cx}" cy="{cy-152}" rx="158" ry="45" fill="{LEITE}" opacity=".75"/>'
        # coração de latte art, achatado pela perspectiva
        + f'<path d="M {cx} {cy-130} C {cx-62} {cy-150} {cx-62} {cy-186} {cx-30} {cy-186} '
        f'C {cx-12} {cy-186} {cx} {cy-172} {cx} {cy-166} '
        f'C {cx} {cy-172} {cx+12} {cy-186} {cx+30} {cy-186} '
        f'C {cx+62} {cy-186} {cx+62} {cy-150} {cx} {cy-130} Z" fill="#B07A4E"/>'
        + f'<path d="M {cx} {cy-166} L {cx} {cy-131}" stroke="#B07A4E" stroke-width="7" '
        f'stroke-linecap="round"/>',
    )

    item(
        "mocha",
        copo(cx, cy, 250, [(0.4, "#D8B089"), (0.3, "#8A5436"), (0.3, CAFE2)], chantilly=True)
        + pontinhos(cx, cy - 232, 76, 20, 16, CAFE2, 5, 0.65, 3),
    )
    item(
        "pingado",
        vapor(cx, cy - 150, 2, 56, 0.24)
        + xicara(cx, cy, 376, "#6B4328", False)
        + f'<ellipse cx="{cx+34}" cy="{cy-124}" rx="40" ry="11" fill="{LEITE}" opacity=".7"/>',
    )
    item(
        "cafe-gelado",
        copo(cx, cy, 250, [(0.34, "#8A5436"), (0.36, CAFE2), (0.3, CAFE)], canudo=True)
        + "".join(
            f'<rect x="{cx-70+i*48}" y="{cy-150+(i%3)*54}" width="54" height="54" rx="9" '
            f'fill="{VIDRO}" opacity=".3" transform="rotate({12*i-18},{cx-70+i*48+27},{cy-150+(i%3)*54+27})"/>'
            for i in range(4)
        ),
    )
    item(
        "frappe",
        copo(cx, cy, 260, [(0.45, "#C49A72"), (0.3, "#A4714A"), (0.25, "#8A5436")], chantilly=True, canudo=True)
        + f'<path d="M {cx-60} {cy-250} q 60 -26 120 0" stroke="{TERRA}" stroke-width="7" '
        f'fill="none" stroke-linecap="round" opacity=".8"/>',
    )
    item(
        "suco",
        copo(cx, cy, 240, [(0.52, "#F2A341"), (0.26, "#E8902C"), (0.22, "#D97E1E")])
        + f'<ellipse cx="{cx}" cy="{cy-174}" rx="116" ry="32" fill="#F7B860"/>'
        + f'<path d="M {cx+96} {cy-186} a 46 46 0 1 0 2 -2 Z" fill="#F7C96A"/>'
        + f'<circle cx="{cx+118}" cy="{cy-166}" r="30" fill="#F2A341" opacity=".6"/>',
        fundo_base="#FFF8EC",
    )
    item(
        "agua",
        copo(cx, cy, 230, [(0.78, "#DFF0F4")])
        + "".join(
            f'<circle cx="{cx-50+i*32}" cy="{cy+40-(i%4)*60}" r="{8+i%3*3}" fill="{VIDRO}" opacity=".6"/>'
            for i in range(6)
        ),
        fundo_base="#F2F8FA",
        fundo_canto="#E2EEF2",
    )


def gerar_salgados():
    cx, cy = W / 2, H * 0.52

    def empada(recheio, pontos_cor, tampa=MASSA):
        """
        Empada brasileira: potinho de massa com parede canelada e
        tampa menor por cima. A primeira versão era um disco raso e
        ficava idêntica à quiche três cards adiante — na vitrine da
        home as duas apareciam lado a lado e liam como o mesmo produto.
        """
        rx, alt = 230, 150        # raio e altura da parede
        yb = cy + 120             # base
        yt = yb - alt             # borda de cima
        s = sombra(cx, yb + 28, rx * 0.95, 40, 0.22)
        # parede com caneluras verticais
        s += (
            f'<path d="M {cx-rx} {yt} L {cx-rx*0.9} {yb} Q {cx} {yb+42} {cx+rx*0.9} {yb} '
            f'L {cx+rx} {yt} Z" fill="{MASSA_ESC}"/>'
        )
        for i in range(13):
            t = i / 12
            x = cx - rx + 2 * rx * t
            xb = cx - rx * 0.9 + 1.8 * rx * t
            s += (
                f'<path d="M {x:.0f} {yt} L {xb:.0f} {yb + 34*math.sin(math.pi*t):.0f}" '
                f'stroke="{MASSA}" stroke-width="22" stroke-linecap="round" opacity=".55"/>'
            )
        # boca e recheio
        s += (
            f'<ellipse cx="{cx}" cy="{yt}" rx="{rx}" ry="{rx*0.3}" fill="{MASSA}"/>'
            f'<ellipse cx="{cx}" cy="{yt}" rx="{rx*0.88}" ry="{rx*0.26}" fill="{recheio}"/>'
            + pontinhos(cx, yt, rx * 0.68, rx * 0.17, 18, pontos_cor, 7, 0.5, 11)
        )
        # tampinha, deslocada para mostrar o recheio
        s += (
            f'<ellipse cx="{cx+16}" cy="{yt-50}" rx="{rx*0.62}" ry="{rx*0.2}" '
            f'fill="{MASSA_ESC}"/>'
            f'<ellipse cx="{cx+16}" cy="{yt-58}" rx="{rx*0.62}" ry="{rx*0.2}" fill="{tampa}"/>'
            f'<ellipse cx="{cx-16}" cy="{yt-66}" rx="{rx*0.26}" ry="{rx*0.08}" '
            f'fill="{LEITE}" opacity=".3"/>'
        )
        return s

    item("empada-frango", empada("#EADFAE", "#B8763A"))
    item("empada-carne", empada("#D9B88A", "#7A3A1E", tampa="#E8C98A"))
    item(
        "quiche",
        massa_redonda(cx, cy + 20, 262, vincos=22)
        + f'<ellipse cx="{cx}" cy="{cy-10}" rx="196" ry="142" fill="#D9A758"/>'
        + f'<ellipse cx="{cx}" cy="{cy-22}" rx="190" ry="136" fill="{QUEIJO}"/>'
        + pontinhos(cx, cy - 22, 150, 104, 30, "#C98B3A", 9, 0.4, 5)
        + f'<ellipse cx="{cx-54}" cy="{cy-62}" rx="56" ry="30" fill="{LEITE}" opacity=".25"/>'
        + f'<path d="M {cx-130} {cy-40} q 60 -34 130 -8" stroke="#B8763A" stroke-width="6" '
        f'fill="none" opacity=".35" stroke-linecap="round"/>',
    )
    item(
        "esfiha",
        # Borda de massa arredondada e irregular, não moldura reta: a
        # primeira versão era um retângulo dentro de outro e lia como
        # quadro pendurado na parede.
        sombra(cx, cy + 200, 266, 42, 0.22)
        + f'<path d="M {cx-282} {cy-130} q 282 -58 564 0 q 42 160 0 320 '
        f'q -282 58 -564 0 q -42 -160 0 -320 Z" fill="{MASSA_ESC}"/>'
        + f'<path d="M {cx-282} {cy-150} q 282 -58 564 0 q 42 160 0 320 '
        f'q -282 58 -564 0 q -42 -160 0 -320 Z" fill="{MASSA}"/>'
        + f'<path d="M {cx-224} {cy-104} q 224 -46 448 0 q 32 128 0 254 '
        f'q -224 46 -448 0 q -32 -128 0 -254 Z" fill="#B8402A"/>'
        + f'<path d="M {cx-224} {cy-104} q 224 -46 448 0 q 32 128 0 254 '
        f'q -224 46 -448 0 q -32 -128 0 -254 Z" fill="{TERRA}" opacity=".7"/>'
        + pontinhos(cx, cy + 24, 190, 106, 44, QUEIJO, 13, 0.8, 13)
        + "".join(
            f'<ellipse cx="{cx-130+i*88}" cy="{cy-30+(i%2)*74}" rx="34" ry="25" '
            f'fill="#7A2616" opacity=".6" transform="rotate({i*23},{cx-130+i*88},{cy-30+(i%2)*74})"/>'
            for i in range(5)
        )
        + f'<path d="M {cx-160} {cy+124} q 160 30 320 0" stroke="{VERDE}" stroke-width="9" '
        f'fill="none" opacity=".55" stroke-linecap="round"/>'
        + f'<ellipse cx="{cx-110}" cy="{cy-70}" rx="70" ry="28" fill="{LEITE}" opacity=".14"/>',
    )

    def croissant(recheado=False):
        """
        Arco espesso com os gomos cortados por DENTRO.

        Duas tentativas falharam antes: elipses empilhadas viraram uma
        concha, e retângulos girados sobre a linha do arco viraram uma
        coroa de dedos espetando para cima. O que funciona é desenhar o
        corpo como anel grosso e marcar os gomos com traços curvos
        recortados nele — a silhueta fica inteira.
        """
        R, r = 236, 118          # raio da linha do arco e espessura
        s = sombra(cx, cy + 148, 250, 38, 0.22)
        yc = cy + 62             # centro do arco, abaixo do quadro visível

        def ponto(ang, raio):
            return cx + math.cos(ang) * raio, yc - math.sin(ang) * raio

        # corpo: faixa entre dois arcos, com as pontas afinando
        a0, a1 = math.radians(186), math.radians(-6)
        passos = 40
        ext, int_ = [], []
        for i in range(passos + 1):
            t = i / passos
            a = a0 + (a1 - a0) * t
            # afina nas pontas: o miolo é grosso, as beiradas são finas
            esp = r * (0.34 + 0.66 * math.sin(math.pi * t) ** 0.6)
            ext.append(ponto(a, R + esp / 2))
            int_.append(ponto(a, R - esp / 2))
        caminho = (
            "M " + " L ".join(f"{x:.0f} {y:.0f}" for x, y in ext)
            + " L " + " L ".join(f"{x:.0f} {y:.0f}" for x, y in reversed(int_)) + " Z"
        )
        s += f'<path d="{caminho}" fill="{MASSA}"/>'
        s += f'<path d="{caminho}" fill="{MASSA_ESC}" opacity=".3"/>'
        # gomos: traços curvos atravessando a faixa
        for i in range(1, 7):
            t = i / 7
            a = a0 + (a1 - a0) * t
            esp = r * (0.34 + 0.66 * math.sin(math.pi * t) ** 0.6)
            xa, ya = ponto(a, R + esp / 2 - 4)
            xb, yb = ponto(a, R - esp / 2 + 4)
            s += (
                f'<path d="M {xa:.0f} {ya:.0f} Q {(xa+xb)/2+22:.0f} {(ya+yb)/2:.0f} '
                f'{xb:.0f} {yb:.0f}" stroke="{MASSA_ESC}" stroke-width="7" fill="none" '
                f'opacity=".55" stroke-linecap="round"/>'
            )
        # luz na crista do arco
        xs = [ponto(a0 + (a1 - a0) * (i / 20), R + r * 0.2)[0] for i in range(21)]
        ys = [ponto(a0 + (a1 - a0) * (i / 20), R + r * 0.2)[1] for i in range(21)]
        s += (
            '<path d="M ' + " L ".join(f"{x:.0f} {y:.0f}" for x, y in zip(xs, ys))
            + f'" stroke="{DOURADO_CLARO}" stroke-width="16" fill="none" opacity=".35" '
            f'stroke-linecap="round"/>'
        )
        if recheado:
            s += (
                f'<path d="M {cx-180} {cy+20} q 180 46 360 0" stroke="{QUEIJO}" '
                f'stroke-width="28" fill="none" stroke-linecap="round"/>'
                f'<path d="M {cx-148} {cy+30} q 148 38 296 0" stroke="#E79A86" '
                f'stroke-width="15" fill="none" stroke-linecap="round"/>'
            )
        return s

    item("croissant", croissant())
    item("croissant-queijo", croissant(True))
    item(
        "tapioca",
        # Quarta tentativa, e a lição ficou: o que fazia ler como redoma
        # era a ALTURA, não a cor. Domo alto é cúpula; meia-lua baixa e
        # opaca, com queijo escapando pela dobra, é comida.
        sombra(cx, cy + 128, 290, 36, 0.2)
        + f'<ellipse cx="{cx}" cy="{cy+110}" rx="314" ry="62" fill="{CREME3}"/>'
        + f'<ellipse cx="{cx}" cy="{cy+102}" rx="310" ry="58" fill="{LEITE}"/>'
        # queijo escapando por baixo da dobra, desenhado ANTES da goma
        + f'<path d="M {cx-230} {cy+86} q 70 46 150 30 q 70 -14 140 -34 '
        f'q -18 60 -140 68 q -124 8 -150 -64 Z" fill="#E0A63E"/>'
        + f'<path d="M {cx-150} {cy+104} q 10 42 -10 58" stroke="#E0A63E" stroke-width="15" '
        f'fill="none" stroke-linecap="round"/>'
        + f'<path d="M {cx+134} {cy+98} q 14 38 -4 56" stroke="#E0A63E" stroke-width="13" '
        f'fill="none" stroke-linecap="round"/>'
        # a goma: meia-lua baixa, opaca
        + f'<path d="M {cx-288} {cy+92} A 288 168 0 0 1 {cx+288} {cy+92} Z" fill="#E6DAC4"/>'
        + f'<path d="M {cx-288} {cy+80} A 290 170 0 0 1 {cx+288} {cy+80} Z" fill="#F6EFE1"/>'
        + pontinhos(cx, cy + 10, 230, 56, 60, "#DCCDB2", 8, 0.7, 17)
        + f'<path d="M {cx-288} {cy+80} A 290 170 0 0 1 {cx+288} {cy+80}" fill="none" '
        f'stroke="#D8C7A8" stroke-width="10"/>'
        + f'<path d="M {cx-288} {cy+80} L {cx+288} {cy+80}" stroke="#D8C7A8" stroke-width="10" '
        f'stroke-linecap="round"/>'
        # dourado de frigideira na crista
        + f'<path d="M {cx-150} {cy-48} q 150 -34 300 6" stroke="{DOURADO_CLARO}" '
        f'stroke-width="14" fill="none" opacity=".4" stroke-linecap="round"/>',
    )


def gerar_doces():
    cx, cy = W / 2, H * 0.52

    def fatia(cor_massa, cor_recheio, cobertura=None):
        """
        Fatia vista de frente-lado: face frontal em cunha, face lateral
        com as camadas. A primeira versão era um trapézio mais largo em
        cima — lia como balde, não como bolo.
        """
        s = sombra(cx, cy + 210, 240, 34, 0.2)
        topo, base = cy - 170, cy + 196
        pf, pt = cx - 250, cx + 196   # ponta de trás (alta) e da frente
        # face lateral (a que mostra as camadas)
        s += (
            f'<path d="M {pf} {topo} L {pt} {topo+28} L {pt} {base-18} L {pf} {base} Z" '
            f'fill="{cor_massa}"/>'
        )
        for i in range(3):
            y = topo + 74 + i * 76
            s += (
                f'<path d="M {pf} {y} L {pt} {y+28} L {pt} {y+50} L {pf} {y+22} Z" '
                f'fill="{cor_recheio}"/>'
            )
        # face frontal, mais escura: é o que dá o volume
        s += (
            f'<path d="M {pt} {topo+28} L {pt+116} {topo+70} L {pt+116} {base+10} '
            f'L {pt} {base-18} Z" fill="{cor_massa}"/>'
            f'<path d="M {pt} {topo+28} L {pt+116} {topo+70} L {pt+116} {base+10} '
            f'L {pt} {base-18} Z" fill="{CAFE}" opacity=".16"/>'
        )
        if cobertura:
            s += (
                f'<path d="M {pf} {topo} L {pt} {topo+28} L {pt+116} {topo+70} '
                f'L {pt+116} {topo+112} L {pt} {topo+70} L {pf} {topo+42} Z" fill="{cobertura}"/>'
            )
        return s

    item("bolo-moca", fatia("#F0DCAC", "#FBF3DF", "#FDF6E6"))
    item("bolo-milho", fatia("#F2CE6E", "#E8BE56"))
    item(
        "torta-limao",
        fatia("#E0C089", "#F6F0C2", "#FBFBF2")
        + f'<path d="M {cx-140} {cy-150} q 34 -40 70 0 q 34 -40 70 0 q 34 -40 70 0" '
        f'fill="{LEITE}" opacity=".9"/>'
        + f'<path d="M {cx-90} {cy-172} q 26 -22 52 0" stroke="{DOURADO}" stroke-width="7" '
        f'fill="none" opacity=".5"/>',
    )
    item(
        "pudim",
        sombra(cx, cy + 196, 250, 40, 0.22)
        + f'<ellipse cx="{cx}" cy="{cy+180}" rx="268" ry="62" fill="#9A5A1E"/>'
        + f'<ellipse cx="{cx}" cy="{cy+170}" rx="258" ry="58" fill="#B86A24"/>'
        + f'<path d="M {cx-208} {cy-70} q 0 -92 208 -92 q 208 0 208 92 l 0 190 '
        f'q 0 56 -208 56 q -208 0 -208 -56 Z" fill="#D89A3E"/>'
        + f'<path d="M {cx-208} {cy-70} q 0 -92 208 -92 q 208 0 208 92 l 0 190 '
        f'q 0 56 -208 56 q -208 0 -208 -56 Z" fill="{DOURADO_CLARO}" opacity=".55"/>'
        + f'<ellipse cx="{cx}" cy="{cy-70}" rx="208" ry="88" fill="#E9BE72"/>'
        + f'<ellipse cx="{cx}" cy="{cy-70}" rx="74" ry="30" fill="#B86A24"/>'
        + f'<ellipse cx="{cx}" cy="{cy-74}" rx="70" ry="27" fill="#8A4A14"/>'
        + f'<path d="M {cx-190} {cy+20} q 24 70 -6 120" stroke="#8A4A14" stroke-width="16" '
        f'fill="none" opacity=".45" stroke-linecap="round"/>'
        + f'<ellipse cx="{cx-120}" cy="{cy-96}" rx="60" ry="22" fill="{LEITE}" opacity=".25"/>',
    )
    item(
        "brownie",
        sombra(cx, cy + 170, 230, 36, 0.24)
        + f'<path d="M {cx-220} {cy-110} L {cx+220} {cy-110} L {cx+220} {cy+150} '
        f'L {cx-220} {cy+150} Z" fill="#3A2016"/>'
        + f'<path d="M {cx-220} {cy-110} L {cx+220} {cy-110} L {cx+250} {cy-160} '
        f'L {cx-190} {cy-160} Z" fill="#54301F"/>'
        + f'<path d="M {cx+220} {cy-110} L {cx+250} {cy-160} L {cx+250} {cy+102} '
        f'L {cx+220} {cy+150} Z" fill="#2A160E"/>'
        + f'<path d="M {cx-190} {cy-160} L {cx+250} {cy-160} L {cx+250} {cy-146} '
        f'L {cx-190} {cy-146} Z" fill="#6B4030" opacity=".8"/>'
        + "".join(
            f'<path d="M {cx-150+i*70} {cy-158} q {18} {12} {4} {26}" stroke="#8A5A42" '
            f'stroke-width="5" fill="none" opacity=".55"/>'
            for i in range(5)
        )
        + pontinhos(cx + 20, cy - 154, 190, 6, 10, "#1A0E08", 6, 0.5, 23),
    )
    item(
        "cookie",
        sombra(cx, cy + 180, 250, 36, 0.22)
        + f'<ellipse cx="{cx}" cy="{cy+20}" rx="276" ry="252" fill="#C98B3A"/>'
        + f'<ellipse cx="{cx}" cy="{cy}" rx="272" ry="248" fill="#E0A552"/>'
        + f'<ellipse cx="{cx-70}" cy="{cy-80}" rx="130" ry="92" fill="#EFBD72" opacity=".5"/>'
        + "".join(
            f'<ellipse cx="{cx+dx}" cy="{cy+dy}" rx="{r}" ry="{r*0.84}" fill="#3A2016" '
            f'transform="rotate({a},{cx+dx},{cy+dy})"/>'
            f'<ellipse cx="{cx+dx-r*0.3}" cy="{cy+dy-r*0.3}" rx="{r*0.34}" ry="{r*0.22}" '
            f'fill="#6B4030" opacity=".7"/>'
            for dx, dy, r, a in [
                (-110, -60, 38, 12), (40, -120, 34, -20), (130, -10, 40, 30),
                (-40, 40, 36, -8), (80, 110, 32, 18), (-150, 70, 30, 40),
                (-10, -200, 28, 0), (180, 130, 26, -30),
            ]
        ),
    )


def pontinnhos_cat(cw, ch):
    return pontinhos(cw * 0.73, ch * 0.52, cw * 0.1, ch * 0.13, 26, QUEIJO, 11, 0.85, 13)


def gerar_categorias():
    """Capas das categorias: horizontais, com o fundo escuro da marca."""
    cw, ch = 900, 620
    d = grad("gcat", [(0, CAFE2, None), (1, CAFE, None)], 0, 0, 1, 1)
    base = f'<rect width="{cw}" height="{ch}" fill="url(#gcat)"/>'

    rnd = random.Random(4)
    graos = "".join(
        grao(rnd.uniform(40, cw - 40), rnd.uniform(40, ch - 40), rnd.uniform(16, 30),
             rnd.uniform(0, 360), CAFE3, TORRA)
        for _ in range(16)
    )
    grava("cat-cafes.svg", svg(cw, ch, base + f'<g opacity=".3">{graos}</g>'
          + vapor(cw / 2, ch * 0.3, 3, 60, 0.22)
          + xicara(cw / 2, ch * 0.56, 290, CAFE, True), defs=d))

    # A capa de salgados usava o croissant antigo, que já tinha sido
    # refeito nos itens — ficou um borrão. Agora usa empada e esfiha,
    # que são o que a casa mais mostra no Instagram.
    def cat_empada(x, y, e):
        rx, alt = 230 * e, 150 * e
        yb, yt = y + 60 * e, y + 60 * e - alt
        return (
            sombra(x, yb + 18 * e, rx * 0.95, 24 * e, 0.3)
            + f'<path d="M {x-rx} {yt} L {x-rx*0.9} {yb} Q {x} {yb+26*e} {x+rx*0.9} {yb} '
            f'L {x+rx} {yt} Z" fill="{MASSA_ESC}"/>'
            + "".join(
                f'<path d="M {x-rx+2*rx*(i/10):.0f} {yt} L {x-rx*0.9+1.8*rx*(i/10):.0f} '
                f'{yb+26*e*math.sin(math.pi*i/10):.0f}" stroke="{MASSA}" '
                f'stroke-width="{20*e:.0f}" stroke-linecap="round" opacity=".55"/>'
                for i in range(11))
            + f'<ellipse cx="{x}" cy="{yt}" rx="{rx}" ry="{rx*0.3}" fill="{MASSA}"/>'
            + f'<ellipse cx="{x}" cy="{yt}" rx="{rx*0.86}" ry="{rx*0.25}" fill="#EADFAE"/>'
            + f'<ellipse cx="{x+10*e}" cy="{yt-32*e}" rx="{rx*0.6}" ry="{rx*0.2}" fill="{MASSA}"/>'
        )

    grava("cat-salgados.svg", svg(cw, ch, base
          + cat_empada(cw * 0.3, ch * 0.5, 0.78)
          + f'<path d="M {cw*0.56} {ch*0.3} q {cw*0.17} {-ch*0.08} {cw*0.34} 0 '
            f'q {cw*0.03} {ch*0.2} 0 {ch*0.4} q {-cw*0.17} {ch*0.08} {-cw*0.34} 0 '
            f'q {-cw*0.03} {-ch*0.2} 0 {-ch*0.4} Z" fill="{MASSA}"/>'
          + f'<path d="M {cw*0.60} {ch*0.36} q {cw*0.13} {-ch*0.06} {cw*0.26} 0 '
            f'q {cw*0.02} {ch*0.16} 0 {ch*0.32} q {-cw*0.13} {ch*0.06} {-cw*0.26} 0 '
            f'q {-cw*0.02} {-ch*0.16} 0 {-ch*0.32} Z" fill="{TERRA}"/>'
          + pontinnhos_cat(cw, ch)
          , defs=d))

    grava("cat-doces.svg", svg(cw, ch, base
          + sombra(cw / 2, ch * 0.82, 230, 32, 0.3)
          + f'<ellipse cx="{cw/2}" cy="{ch*0.76}" rx="236" ry="52" fill="#B86A24"/>'
          + f'<path d="M {cw/2-186} {ch*0.38} q 0 -78 186 -78 q 186 0 186 78 l 0 160 '
            f'q 0 48 -186 48 q -186 0 -186 -48 Z" fill="#D89A3E"/>'
          + f'<ellipse cx="{cw/2}" cy="{ch*0.38}" rx="186" ry="76" fill="#E9BE72"/>'
          + f'<ellipse cx="{cw/2}" cy="{ch*0.38}" rx="64" ry="26" fill="#8A4A14"/>'
          , defs=d))

    grava("cat-geladas.svg", svg(cw, ch, base
          + copo(cw / 2, ch * 0.54, 230, [(0.4, "#C49A72"), (0.3, "#A4714A"), (0.3, "#8A5436")],
                 chantilly=True, canudo=True), defs=d))


def gerar_combos():
    """
    Os combos reaproveitam os desenhos dos itens em miniatura. A
    primeira versão redesenhava formas simplificadas e dois combos
    saíram ilegíveis — uma fatia virou trapézio liso e um salgado
    virou um quadrado laranja.
    """
    cw, ch = 900, 560
    d, fundo = fundo_quente(cw, ch, "fcombo", CREME, CREME3)

    def mini_empada(x, y, e=0.52):
        rx, alt = 230 * e, 150 * e
        yb = y + 60 * e
        yt = yb - alt
        return (
            sombra(x, yb + 16 * e, rx * 0.95, 20 * e, 0.2)
            + f'<path d="M {x-rx} {yt} L {x-rx*0.9} {yb} Q {x} {yb+22*e} {x+rx*0.9} {yb} '
            f'L {x+rx} {yt} Z" fill="{MASSA_ESC}"/>'
            + f'<ellipse cx="{x}" cy="{yt}" rx="{rx}" ry="{rx*0.3}" fill="{MASSA}"/>'
            + f'<ellipse cx="{x}" cy="{yt}" rx="{rx*0.86}" ry="{rx*0.25}" fill="#EADFAE"/>'
            + f'<ellipse cx="{x+8}" cy="{yt-26*e}" rx="{rx*0.6}" ry="{rx*0.2}" fill="{MASSA}"/>'
        )

    def mini_fatia(x, y, e=0.5):
        topo, base = y - 170 * e, y + 196 * e
        pf, pt = x - 250 * e, x + 196 * e
        frente = pt + 116 * e
        s = sombra(x, base + 14 * e, 230 * e, 22 * e, 0.2)
        s += (f'<path d="M {pf} {topo} L {pt} {topo+28*e} L {pt} {base-18*e} L {pf} {base} Z" '
              f'fill="#F0DCAC"/>')
        for i in range(3):
            yy = topo + (74 + i * 76) * e
            s += (f'<path d="M {pf} {yy} L {pt} {yy+28*e} L {pt} {yy+50*e} L {pf} {yy+22*e} Z" '
                  f'fill="{LEITE}"/>')
        s += (f'<path d="M {pt} {topo+28*e} L {frente} {topo+70*e} L {frente} {base+10*e} '
              f'L {pt} {base-18*e} Z" fill="#E4CD9A"/>')
        s += (f'<path d="M {pf} {topo} L {pt} {topo+28*e} L {frente} {topo+70*e} '
              f'L {frente} {topo+106*e} L {pt} {topo+66*e} L {pf} {topo+38*e} Z" fill="#FDF6E6"/>')
        return s

    def mini_esfiha(x, y, e=0.46):
        s = sombra(x, y + 96 * e, 240 * e, 24 * e, 0.2)
        s += (f'<path d="M {x-262*e} {y-120*e} q {262*e} {-52*e} {524*e} 0 '
              f'q {38*e} {148*e} 0 {296*e} q {-262*e} {52*e} {-524*e} 0 '
              f'q {-38*e} {-148*e} 0 {-296*e} Z" fill="{MASSA}"/>')
        s += (f'<path d="M {x-208*e} {y-78*e} q {208*e} {-42*e} {416*e} 0 '
              f'q {28*e} {118*e} 0 {236*e} q {-208*e} {42*e} {-416*e} 0 '
              f'q {-28*e} {-118*e} 0 {-236*e} Z" fill="{TERRA}"/>')
        s += pontinhos(x, y + 20 * e, 170 * e, 92 * e, 22, QUEIJO, 10 * e, 0.8, 13)
        return s

    grava("combo-manha.svg", svg(cw, ch, fundo
          + xicara(cw * 0.33, ch * 0.5, 250, CAFE, False)
          + mini_empada(cw * 0.72, ch * 0.5), defs=d))

    grava("combo-tarde.svg", svg(cw, ch, fundo
          + xicara(cw * 0.32, ch * 0.5, 256, TORRA, False)
          + f'<ellipse cx="{cw*0.32}" cy="{ch*0.5-98}" rx="110" ry="32" fill="{LEITE}"/>'
          + mini_fatia(cw * 0.74, ch * 0.52), defs=d))

    grava("combo-dois.svg", svg(cw, ch, fundo
          + xicara(cw * 0.22, ch * 0.52, 186, CAFE, False)
          + xicara(cw * 0.44, ch * 0.52, 186, CAFE, False)
          + mini_esfiha(cw * 0.72, ch * 0.46)
          + mini_empada(cw * 0.86, ch * 0.66, 0.4), defs=d))


def gerar_encomendas():
    cw, ch = 860, 620
    d, fundo = fundo_quente(cw, ch, "fenc", CREME, CREME3)
    rnd = random.Random(9)
    bandeja = (
        f'<ellipse cx="{cw/2}" cy="{ch*0.72}" rx="330" ry="78" fill="{CREME3}"/>'
        f'<ellipse cx="{cw/2}" cy="{ch*0.70}" rx="326" ry="74" fill="{LEITE}"/>'
    )
    minis = "".join(
        f'<g transform="translate({cw/2-240+ (i%5)*120},{ch*0.52+(i//5)*74})">'
        f'<ellipse rx="54" ry="40" fill="{MASSA_ESC}"/>'
        f'<ellipse cy="-6" rx="52" ry="37" fill="{MASSA}"/>'
        f'<ellipse cy="-16" rx="24" ry="16" fill="{DOURADO_CLARO}" opacity=".6"/></g>'
        for i in range(10)
    )
    grava("enc-salgados.svg", svg(cw, ch, fundo + bandeja + minis, defs=d))

    grava("enc-bolo.svg", svg(cw, ch, fundo
          + sombra(cw / 2, ch * 0.8, 250, 36, 0.2)
          + f'<ellipse cx="{cw/2}" cy="{ch*0.76}" rx="290" ry="56" fill="{CREME3}"/>'
          + f'<path d="M {cw/2-220} {ch*0.3} L {cw/2+220} {ch*0.3} L {cw/2+220} {ch*0.72} '
            f'q -220 36 -440 0 Z" fill="#F0DCAC"/>'
          + f'<path d="M {cw/2-220} {ch*0.44} L {cw/2+220} {ch*0.44} L {cw/2+220} {ch*0.5} '
            f'L {cw/2-220} {ch*0.5} Z" fill="{LEITE}"/>'
          + f'<path d="M {cw/2-224} {ch*0.3} q 40 -30 80 0 q 40 -30 80 0 q 40 -30 80 0 '
            f'q 40 -30 80 0 q 40 -30 80 0 q 28 -20 52 2 l 0 18 l -452 0 Z" fill="{LEITE}"/>'
          + "".join(grao(cw / 2 - 160 + i * 80, ch * 0.265, 18, rnd.uniform(0, 360))
                    for i in range(5)), defs=d))

    grava("enc-quiche.svg", svg(cw, ch, fundo
          + massa_redonda(cw / 2, ch * 0.54, 280, vincos=26)
          + f'<ellipse cx="{cw/2}" cy="{ch*0.52}" rx="208" ry="152" fill="{QUEIJO}"/>'
          + pontinhos(cw / 2, ch * 0.52, 160, 112, 30, "#C98B3A", 9, 0.4, 31)
          + f'<path d="M {cw/2} {ch*0.52-150} L {cw/2} {ch*0.52+150}" stroke="{MASSA_ESC}" '
            f'stroke-width="5" opacity=".4"/>'
          + f'<path d="M {cw/2-205} {ch*0.52} L {cw/2+205} {ch*0.52}" stroke="{MASSA_ESC}" '
            f'stroke-width="5" opacity=".4"/>', defs=d))

    grava("enc-coffee.svg", svg(cw, ch, fundo
          + f'<rect x="{cw*0.1}" y="{ch*0.26}" width="150" height="250" rx="22" fill="{CAFE2}"/>'
          + f'<rect x="{cw*0.1+16}" y="{ch*0.3}" width="118" height="70" rx="10" fill="{DOURADO}" opacity=".8"/>'
          + f'<rect x="{cw*0.1+44}" y="{ch*0.2}" width="62" height="46" rx="10" fill="{CAFE3}"/>'
          + "".join(xicara(cw * 0.46 + i * 118, ch * 0.6, 108, CAFE, False, pires=True, alca=False)
                    for i in range(3))
          + f'<path d="M {cw*0.42} {ch*0.3} L {cw*0.92} {ch*0.3} L {cw*0.92} {ch*0.4} '
            f'L {cw*0.42} {ch*0.4} Z" fill="{MASSA}"/>'
          + f'<path d="M {cw*0.42} {ch*0.3} L {cw*0.92} {ch*0.3} L {cw*0.92} {ch*0.33} '
            f'L {cw*0.42} {ch*0.33} Z" fill="{LEITE}" opacity=".7"/>', defs=d))


def gerar_eventos():
    cw, ch = 860, 560
    d = grad("gev", [(0, CAFE2, None), (1, CAFE, None)], 0, 0, 1, 1)
    base = f'<rect width="{cw}" height="{ch}" fill="url(#gev)"/>'

    # Tango: duas silhuetas dançando
    grava("ev-tango.svg", svg(cw, ch, base
          + f'<circle cx="{cw*0.5}" cy="{ch*0.45}" r="200" fill="{DOURADO}" opacity=".10"/>'
          + f'<g fill="{DOURADO}" opacity=".85">'
            f'<circle cx="{cw*0.42}" cy="{ch*0.24}" r="30"/>'
            f'<path d="M {cw*0.42-30} {ch*0.32} q 30 -16 60 0 l 18 130 l -30 10 '
            f'l -14 -80 l -14 80 l -30 -10 Z"/>'
            f'<path d="M {cw*0.40} {ch*0.56} l -34 130 l 26 10 l 40 -118 Z"/>'
            f'<path d="M {cw*0.46} {ch*0.56} l 42 126 l 26 -12 l -36 -120 Z"/>'
            f'<path d="M {cw*0.46} {ch*0.36} q 70 -26 120 -50 l 10 24 q -56 30 -124 52 Z"/></g>'
          + f'<g fill="{DOURADO_CLARO}" opacity=".7">'
            f'<circle cx="{cw*0.63}" cy="{ch*0.2}" r="28"/>'
            f'<path d="M {cw*0.63-28} {ch*0.27} q 28 -14 56 0 l 10 100 '
            f'q -34 14 -74 0 Z"/>'
            f'<path d="M {cw*0.60} {ch*0.49} q 40 10 76 0 l 36 180 l -150 0 Z"/>'
            f'<path d="M {cw*0.60} {ch*0.32} q -58 -16 -96 -34 l -8 24 q 44 22 102 38 Z"/></g>'
          + "".join(f'<circle cx="{cw*0.12+i*40}" cy="{ch*0.14+ (i%3)*22}" r="4" '
                    f'fill="{DOURADO_CLARO}" opacity=".5"/>' for i in range(5)), defs=d))

    # Noite árabe
    grava("ev-arabe.svg", svg(cw, ch, base
          + f'<path d="M {cw*0.5-170} {ch*0.78} q 0 -250 170 -250 q 170 0 170 250 Z" '
            f'fill="{DOURADO}" opacity=".14"/>'
          + f'<g fill="{DOURADO}" opacity=".8">'
            f'<circle cx="{cw*0.5}" cy="{ch*0.24}" r="32"/>'
            f'<path d="M {cw*0.5-32} {ch*0.33} q 32 -18 64 0 l 14 112 q -46 16 -92 0 Z"/>'
            f'<path d="M {cw*0.5-46} {ch*0.56} q 46 16 92 0 l 24 150 l -140 0 Z"/>'
            f'<path d="M {cw*0.5-34} {ch*0.37} q -70 -30 -110 -70 l -18 22 q 46 48 122 78 Z"/>'
            f'<path d="M {cw*0.5+34} {ch*0.37} q 70 -30 110 -70 l 18 22 q -46 48 -122 78 Z"/></g>'
          + "".join(f'<circle cx="{cw*0.5-120+i*48}" cy="{ch*0.70}" r="7" '
                    f'fill="{DOURADO_CLARO}" opacity=".8"/>' for i in range(6))
          + xicara(cw * 0.17, ch * 0.74, 118, CAFE, True, pires=True, alca=False), defs=d))

    # Sábado no lounge
    grava("ev-sabado.svg", svg(cw, ch, base
          + f'<rect x="{cw*0.1}" y="{ch*0.34}" width="{cw*0.8}" height="14" rx="7" fill="{DOURADO}" opacity=".5"/>'
          + "".join(
              f'<g transform="translate({cw*0.2+i*160},{ch*0.52})">'
              f'<rect x="-56" y="0" width="112" height="12" rx="6" fill="{CAFE3}"/>'
              f'<rect x="-6" y="12" width="12" height="90" fill="{CAFE3}"/>'
              f'<ellipse cy="104" rx="46" ry="10" fill="{CAFE3}"/>'
              + xicara(0, -36, 84, CAFE, True, pires=False, alca=True)
              + "</g>" for i in range(4))
          + vapor(cw * 0.2, ch * 0.36, 2, 40, 0.18)
          + vapor(cw * 0.52, ch * 0.36, 2, 40, 0.18), defs=d))


def gerar_espaco():
    cw, ch = 900, 680
    d = grad("gesp", [(0, "#4A2E1E", None), (1, "#2A1810", None)], 0, 0, 0.4, 1)
    tijolo = ""
    for linha in range(14):
        y = linha * 48
        off = 0 if linha % 2 == 0 else 54
        for col in range(10):
            x = -54 + off + col * 108
            tijolo += (
                f'<rect x="{x}" y="{y}" width="100" height="40" rx="4" '
                f'fill="{"#5A3A26" if (linha+col) % 3 else "#64412A"}" opacity=".55"/>'
            )

    grava("esp-salao.svg", svg(cw, ch,
          f'<rect width="{cw}" height="{ch}" fill="url(#gesp)"/>' + tijolo
          + f'<rect y="{ch*0.72}" width="{cw}" height="{ch*0.28}" fill="#3A2317"/>'
          + "".join(
              f'<g transform="translate({cw*0.22+i*260},{ch*0.6})">'
              f'<ellipse rx="112" ry="26" fill="#7A4A2C"/>'
              f'<ellipse cy="-8" rx="112" ry="26" fill="#8A5634"/>'
              f'<rect x="-8" y="10" width="16" height="92" fill="#5A3A26"/>'
              f'<ellipse cy="104" rx="60" ry="12" fill="#4A2E1E"/>'
              + xicara(0, -40, 74, CAFE, True, pires=True, alca=False) + "</g>"
              for i in range(3))
          + "".join(f'<g transform="translate({cw*0.1+i*170},{ch*0.14})">'
                    f'<path d="M 0 0 l 0 60" stroke="{DOURADO}" stroke-width="3" opacity=".5"/>'
                    f'<circle cy="74" r="20" fill="{DOURADO_CLARO}" opacity=".9"/>'
                    f'<circle cy="74" r="38" fill="{DOURADO}" opacity=".16"/></g>'
                    for i in range(5)), defs=d))

    grava("esp-balcao.svg", svg(cw, ch,
          f'<rect width="{cw}" height="{ch}" fill="url(#gesp)"/>' + tijolo
          + f'<rect y="{ch*0.62}" width="{cw}" height="{ch*0.38}" fill="#2A1810"/>'
          + f'<rect y="{ch*0.6}" width="{cw}" height="26" rx="6" fill="#6B4430"/>'
          # Máquina de espresso: corpo baixo e largo, grupo saindo na
          # frente e dois botões. A primeira versão era um retângulo
          # alto com uma tela escura e lia como monitor de computador.
          + f'<rect x="{cw*0.1}" y="{ch*0.36}" width="268" height="24" rx="8" fill="#9AA0A6"/>'
          + f'<rect x="{cw*0.1+16}" y="{ch*0.36+24}" width="236" height="118" rx="10" fill="#C4C8CC"/>'
          + f'<rect x="{cw*0.1+16}" y="{ch*0.36+24}" width="236" height="40" rx="10" fill="#DDE1E4"/>'
          + f'<circle cx="{cw*0.1+70}" cy="{ch*0.36+100}" r="13" fill="#5A6066"/>'
          + f'<circle cx="{cw*0.1+110}" cy="{ch*0.36+100}" r="13" fill="#5A6066"/>'
          + f'<rect x="{cw*0.1+176}" y="{ch*0.36+74}" width="20" height="58" rx="6" fill="#8A9095"/>'
          # grupo e porta-filtro
          + f'<rect x="{cw*0.1+58}" y="{ch*0.36+142}" width="74" height="26" rx="6" fill="#8A9095"/>'
          + f'<rect x="{cw*0.1+84}" y="{ch*0.36+168}" width="22" height="20" fill="#6A7075"/>'
          + f'<rect x="{cw*0.1+128}" y="{ch*0.36+150}" width="62" height="11" rx="5" fill="#6A7075"/>'
          + xicara(cw * 0.1 + 95, ch * 0.36 + 218, 92, CAFE, True, pires=False, alca=False)
          + f'<g transform="translate({cw*0.68},{ch*0.26})">'
            f'<rect x="-110" y="-44" width="220" height="88" rx="16" fill="{TERRA}" opacity=".2"/>'
            f'<text x="0" y="14" text-anchor="middle" font-family="Georgia,serif" '
            f'font-size="54" fill="#FF6B4A" opacity=".95">CAFÉ</text></g>'
          + "".join(grao(cw * 0.62 + i * 46, ch * 0.56, 16, i * 37) for i in range(5)), defs=d))

    grava("esp-vitrine.svg", svg(cw, ch,
          f'<rect width="{cw}" height="{ch}" fill="#F2E8D6"/>'
          + f'<rect x="40" y="60" width="{cw-80}" height="{ch-140}" rx="18" fill="{LEITE}"/>'
          + f'<rect x="40" y="60" width="{cw-80}" height="{ch-140}" rx="18" fill="none" '
            f'stroke="{CREME3}" stroke-width="8"/>'
          + "".join(
              f'<rect x="70" y="{120+p*170}" width="{cw-140}" height="12" rx="6" fill="{CREME3}"/>'
              for p in range(3))
          + "".join(
              f'<g transform="translate({140+i*150},{104+p*170})">'
              f'<ellipse rx="56" ry="40" fill="{MASSA_ESC}"/><ellipse cy="-6" rx="54" ry="37" '
              f'fill="{MASSA if (i+p)%2 else QUEIJO}"/>'
              f'<ellipse cy="-16" rx="26" ry="17" fill="{DOURADO_CLARO}" opacity=".6"/></g>'
              for p in range(3) for i in range(5))
          + f'<path d="M 40 60 L {cw*0.4} 60 L {cw*0.12} {ch-80} L 40 {ch-80} Z" '
            f'fill="{VIDRO}" opacity=".3"/>'))

    grava("esp-mesa.svg", svg(cw, ch,
          f'<rect width="{cw}" height="{ch}" fill="#8A5634"/>'
          + "".join(f'<rect y="{i*58}" width="{cw}" height="30" fill="#7A4A2C" opacity=".5"/>'
                    for i in range(12))
          + f'<ellipse cx="{cw*0.5}" cy="{ch*0.56}" rx="330" ry="200" fill="{CAFE}" opacity=".16"/>'
          + xicara(cw * 0.38, ch * 0.5, 250, CAFE, True)
          + vapor(cw * 0.38, ch * 0.5 - 130, 3, 54, 0.3)
          + f'<ellipse cx="{cw*0.72}" cy="{ch*0.62}" rx="150" ry="36" fill="{LEITE}"/>'
          + f'<path d="M {cw*0.72-130} {ch*0.6} C {cw*0.72-116} {ch*0.46} {cw*0.72-40} {ch*0.42} '
            f'{cw*0.72} {ch*0.44} C {cw*0.72+40} {ch*0.42} {cw*0.72+116} {ch*0.46} '
            f'{cw*0.72+130} {ch*0.6} C {cw*0.72+70} {ch*0.56} {cw*0.72-70} {ch*0.56} '
            f'{cw*0.72-130} {ch*0.6} Z" fill="{MASSA}"/>'))

    # Sobre: o balcão, mais largo
    grava("sobre-balcao.svg", svg(1000, 760,
          f'<rect width="1000" height="760" fill="url(#gesp)"/>' + tijolo
          + f'<rect y="500" width="1000" height="260" fill="#2A1810"/>'
          + f'<rect y="486" width="1000" height="28" rx="8" fill="#6B4430"/>'
          + xicara(300, 380, 230, CAFE, True)
          + vapor(300, 260, 3, 64, 0.3)
          + f'<g transform="translate(700,330)">'
            f'<ellipse rx="150" ry="36" fill="#5A3A26"/><ellipse cy="-10" rx="150" ry="36" '
            f'fill="#6B4430"/>'
            + "".join(grao(-96 + i * 48, -16 - (i % 2) * 14, 21, i * 53) for i in range(5))
            + "</g>"
          + "".join(f'<g transform="translate({120+i*190},70)">'
                    f'<path d="M 0 0 l 0 54" stroke="{DOURADO}" stroke-width="3" opacity=".5"/>'
                    f'<circle cy="68" r="19" fill="{DOURADO_CLARO}" opacity=".95"/>'
                    f'<circle cy="68" r="38" fill="{DOURADO}" opacity=".18"/></g>'
                    for i in range(5)), defs=d))


def gerar_hero_e_logo():
    # Hero: vertical, para a coluna de imagem da primeira tela
    hw, hh = 900, 1100
    d = grad("ghero", [(0, "#3A2317", None), (1, "#1A0F0A", None)], 0, 0, 0.3, 1)
    rnd = random.Random(12)
    graos = "".join(
        grao(rnd.uniform(40, hw - 40), rnd.uniform(700, hh - 40), rnd.uniform(14, 26),
             rnd.uniform(0, 360), CAFE3, TORRA)
        for _ in range(22)
    )
    grava("hero.svg", svg(hw, hh,
          f'<rect width="{hw}" height="{hh}" fill="url(#ghero)"/>'
          + f'<circle cx="{hw*0.5}" cy="{hh*0.38}" r="330" fill="{DOURADO}" opacity=".09"/>'
          + f'<circle cx="{hw*0.5}" cy="{hh*0.38}" r="240" fill="{DOURADO}" opacity=".07"/>'
          + f'<g opacity=".5">{graos}</g>'
          + vapor(hw * 0.5, hh * 0.28, 3, 92, 0.3)
          + xicara(hw * 0.5, hh * 0.44, 420, CAFE, True)
          + f'<ellipse cx="{hw*0.5}" cy="{hh*0.78}" rx="300" ry="54" fill="{CAFE}" opacity=".4"/>'
          , defs=d))

    # Logo: o emblema, em SVG, para o topo e o favicon
    lw = 240
    emblema = (
        f'<circle cx="{lw/2}" cy="{lw/2}" r="{lw/2-4}" fill="{CAFE}"/>'
        f'<circle cx="{lw/2}" cy="{lw/2}" r="{lw/2-14}" fill="none" stroke="{DOURADO}" '
        f'stroke-width="3" opacity=".7"/>'
        # folhas
        f'<path d="M {lw/2} {lw*0.42} C {lw*0.26} {lw*0.3} {lw*0.2} {lw*0.46} {lw*0.3} {lw*0.5} '
        f'C {lw*0.4} {lw*0.54} {lw*0.46} {lw*0.48} {lw/2} {lw*0.42} Z" fill="{DOURADO}"/>'
        f'<path d="M {lw/2} {lw*0.42} C {lw*0.74} {lw*0.3} {lw*0.8} {lw*0.46} {lw*0.7} {lw*0.5} '
        f'C {lw*0.6} {lw*0.54} {lw*0.54} {lw*0.48} {lw/2} {lw*0.42} Z" fill="{DOURADO}"/>'
        # grão central
        f'<ellipse cx="{lw/2}" cy="{lw*0.58}" rx="{lw*0.14}" ry="{lw*0.19}" fill="{DOURADO_CLARO}"/>'
        f'<path d="M {lw/2} {lw*0.40} C {lw*0.44} {lw*0.5} {lw*0.44} {lw*0.66} {lw/2} {lw*0.77} '
        f'C {lw*0.56} {lw*0.66} {lw*0.56} {lw*0.5} {lw/2} {lw*0.40} Z" fill="{CAFE}" opacity=".8"/>'
    )
    grava("logo.svg", svg(lw, lw, emblema))
    grava("favicon.svg", svg(lw, lw, emblema))


def gerar_mapa():
    """Mapa estilizado. Não é mapa real — é orientação visual."""
    mw, mh = 900, 520
    ruas = ""
    for i, y in enumerate([110, 240, 380]):
        ruas += f'<rect y="{y}" width="{mw}" height="{26+i*6}" fill="{CREME3}"/>'
    for i, x in enumerate([160, 420, 700]):
        ruas += f'<rect x="{x}" width="{24+i*4}" height="{mh}" fill="{CREME3}"/>'
    quadras = "".join(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{CREME2}"/>'
        for x, y, w, h in [
            (0, 0, 160, 110), (184, 0, 236, 110), (448, 0, 252, 110), (728, 0, 172, 110),
            (0, 136, 160, 104), (184, 136, 236, 104), (448, 136, 252, 104), (728, 136, 172, 104),
            (0, 272, 160, 108), (184, 272, 236, 108), (448, 272, 252, 108), (728, 272, 172, 108),
        ]
    )
    pino = (
        f'<g transform="translate(540,250)">'
        f'<ellipse cy="48" rx="34" ry="10" fill="{CAFE}" opacity=".25"/>'
        f'<path d="M 0 44 C -34 2 -34 -16 -34 -22 A 34 34 0 1 1 34 -22 C 34 -16 34 2 0 44 Z" '
        f'fill="{TERRA}"/>'
        f'<circle cy="-22" r="15" fill="{LEITE}"/></g>'
    )
    grava("mapa.svg", svg(mw, mh,
          f'<rect width="{mw}" height="{mh}" fill="{CREME}"/>' + quadras + ruas + pino
          + f'<text x="540" y="340" text-anchor="middle" font-family="Georgia,serif" '
            f'font-size="26" fill="{CAFE2}">Grão Dourado</text>'))


if __name__ == "__main__":
    gerar_cafes()
    gerar_salgados()
    gerar_doces()
    gerar_categorias()
    gerar_combos()
    gerar_encomendas()
    gerar_eventos()
    gerar_espaco()
    gerar_hero_e_logo()
    gerar_mapa()
    arquivos = sorted(SAIDA.glob("*.svg"))
    total = sum(a.stat().st_size for a in arquivos)
    print(f"{len(arquivos)} arquivos · {total/1024:.0f} KB em {SAIDA.relative_to(SAIDA.parent.parent)}")
