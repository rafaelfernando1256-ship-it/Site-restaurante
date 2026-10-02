"""
Seleciona e recorta as fotos do perfil do Mega Express para o site.

Geometria das peças deles, medida nas capturas:
  • rodapé "Reservas / Mega Express I e II" ....... y 80%–95%
  • tarja vermelha de legenda (quando existe) ..... y 62%–80%
  • foto aproveitável ............................. y 0%–79% (sem tarja)
                                                    y 0%–62% (com tarja)
"""
from PIL import Image
from pathlib import Path
import os

REC = Path(os.environ.get('RECORTES', 'hotel/recortes'))
DEST = Path(__file__).parent / 'publico' / 'img' / 'foto'
DEST.mkdir(parents=True, exist_ok=True)
for v in DEST.glob('*.jpg'): v.unlink()

# As peças deles têm uma moldura vermelha fina por dentro da borda.
# Começar em 2,5% da altura tira a linha de cima; sem isso ela aparece
# como um risco vermelho no topo de toda foto da galeria.
A = 0.025  # começo
L = 0.79   # fim, sem tarja
T = 0.62   # fim, com tarja

SELECAO = {
    # ── fachada e identidade ──────────────────────────────────────
    'fachada':        ('e15d-30', (0, A, 1, L), 1000),
    'fachada-ceu':    ('992e-40', (0, A, 1, L), 1000),
    'fachada-palmei': ('5359-40', (0, A, 1, L), 1000),
    'fachada-sol':    ('fa83-31', (0, A, 1, L), 1000),
    'totem':          ('992e-31', (0, A, 1, L), 1000),
    # ── piscina e lazer ───────────────────────────────────────────
    'piscina':        ('2080-21', (0, A, 1, L), 1000),
    'piscina-fonte':  ('e15d-21', (0, A, 1, T), 1000),
    'piscina-cascata':('fa83-20', (0, A, 1, L), 1000),
    'espreguicadeira':('2080-31', (0, A, 1, T), 1000),
    'lazer':          ('1a25-31', (0, A, 1, T), 1000),
    # ── quartos ───────────────────────────────────────────────────
    'quarto':         ('2080-32', (0, A, 1, L), 1000),
    'quarto-tv':      ('1a25-22', (0, A, 1, L), 1000),
    'quarto-cama':    ('fa83-22', (0, A, 1, L), 1000),
    # ── café da manhã ─────────────────────────────────────────────
    'cafe':           ('2080-42', (0, A, 1, T), 1000),
    'cafe-frutas':    ('e15d-32', (0, A, 1, T), 1000),
    'cafe-bar':       ('1a25-32', (0, A, 1, L), 1000),
    'cafe-buffet':    ('3581-22', (0, A, 1, L), 1000),
    # ── recepção ──────────────────────────────────────────────────
    'recepcao':       ('992e-42', (0, A, 1, .80), 1000),
    'recepcao-vasos': ('3581-41', (0, A, 1, L), 1000),
    'lobby':          ('35f5-32', (0, A, 1, T), 1000),
    # ── Serra da Capivara ─────────────────────────────────────────
    'rupestre':       ('e15d-31', (0, A, 1, L), 1100),
    'pedra-furada':   ('3581-31', (0, A, 1, T), 1100),
    'canion':         ('fa83-12', (0, A, 1, T), 1100),
    'canion-2':       ('fa83-30', (0, A, 1, T), 1100),
    'serra':          ('992e-32', (0, A, 1, T), 1100),
    'paredao':        ('e15d-20', (0, A, 1, L), 1100),
    'cacto':          ('2080-40', (0, A, 1, L), 1000),
    'por-do-sol':     ('2080-22', (0, A, 1, L), 1100),
    'serra-cactos':   ('35f5-21', (0, A, 1, L), 1100),
    # ── eventos da região ─────────────────────────────────────────
    'opera':          ('5359-20', (0, A, 1, T), 1000),
}

for nome, (fonte, (x0, y0, x1, y1), larg) in SELECAO.items():
    arq = REC / f'{fonte}.png'
    if not arq.exists():
        print(f'  ⚠ {fonte} não existe — pulando {nome}'); continue
    im = Image.open(arq).convert('RGB')
    W, H = im.size
    c = im.crop((int(W*x0), int(H*y0), int(W*x1), int(H*y1)))
    if c.width < larg:
        c = c.resize((larg, round(c.height*larg/c.width)), Image.LANCZOS)
    c.save(DEST/f'{nome}.jpg', 'JPEG', quality=84, optimize=True, progressive=True)

fs = sorted(DEST.glob('*.jpg'))
print(f'{len(fs)} fotos · {sum(p.stat().st_size for p in fs)/1024:.0f} KB')
