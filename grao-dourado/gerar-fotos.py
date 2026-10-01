"""
Seleciona, limpa e exporta as fotos do perfil para o site.

Cada entrada diz de qual recorte vem e qual pedaço aproveitar, em fração
da célula — é assim que o texto das artes promocionais fica de fora e
sobra só a comida.

Regra de honestidade: foto real só entra no item quando dá para ter
certeza do que é. Onde eu não sei, fica o desenho.
"""
import os
from PIL import Image
from pathlib import Path

# Pasta com os recortes da grade do Instagram. As capturas originais e os
# recortes não vão para o repositório — o que fica versionado é o
# resultado, em publico/img/foto/. Para refazer, aponte RECORTES para a
# pasta onde eles estiverem:
#   RECORTES=/caminho/para/recortes python3 gerar-fotos.py
REC = Path(os.environ.get('RECORTES', 'recortes'))
DEST = Path(__file__).parent / 'publico' / 'img' / 'foto'
DEST.mkdir(parents=True, exist_ok=True)

# destino : (recorte, (x0,y0,x1,y1) em fração, largura final)
# destino : (recorte, (x0,y0,x1,y1) em fração, largura final)
#
# Os cortes tiram dois enfeites do Instagram que não são da foto:
#   • o selo de vídeo, no canto superior direito  → fora os 7% do topo
#   • o botão flutuante "Mensagem", embaixo à direita → fora os 15% do pé
SELECAO = {
    # ── produtos ──────────────────────────────────────────────────
    'capuccino':   ('4-01', (0, .07, 1, 1), 760),
    'pudim':       ('5-13', (0, 0, 1, .85), 760),
    'quiche':      ('2-13', (0, .57, 1, .90), 760),
    'esfiha':      ('3-02', (0, .51, 1, .86), 760),
    'bolo-milho':  ('5-02', (.47, .28, 1, .76), 760),
    # Só a faixa de cima da peça: a arte inteira traz um texto enorme
    # que domina o card. Duas molduras diferentes para as duas empadas
    # não aparecerem idênticas lado a lado no cardápio.
    # A peça da empada entra INTEIRA. A foto por trás dela é boa, mas o
    # painel marrom cobre tudo menos uma faixa estreita à direita, e
    # recortada essa faixa sai pequena e borrada. A arte completa é dos
    # próprios donos, mostra o produto e diz os recheios — vale mais
    # como card do que um recorte ruim.
    'empada-arte': ('3-01', (0, 0, 1, 1), 760),
    'graos':       ('5-10', (0, .07, 1, 1), 760),
    # Recorte apertado na taça: o fundo da arte é a palavra "Capuccino"
    # repetida, e qualquer enquadramento mais largo traz o texto junto.
    'mocha':       ('3-00', (.30, .33, .80, .74), 620),
    'doces-natal': ('2-03', (0, .58, 1, 1), 760),
    # ── ambiente ──────────────────────────────────────────────────
    'salao':       ('4-12', (0, .07, 1, 1), 900),
    'balcao':      ('5-00', (0, .07, 1, 1), 900),
    'balcao-neon': ('5-03', (0, .07, 1, 1), 900),
    'mesa':        ('4-13', (0, 0, 1, .84), 900),
    'cafe-mao':    ('5-01', (0, .07, 1, 1), 900),
    'provando':    ('5-11', (0, .07, 1, 1), 900),
    # ── eventos ───────────────────────────────────────────────────
    # O cartaz do Café com Tango vem cortado na captura (falta o "C"),
    # então o evento usa a foto do lounge cheio, que é a mesma casa.
    'ev-arabe':    ('4-02', (0, .07, 1, 1), 860),
    'ev-brinde':   ('4-11', (0, .07, 1, 1), 860),
    'ev-lounge':   ('2-01', (0, .07, 1, 1), 860),
    # ── pessoas ───────────────────────────────────────────────────
    'dono':        ('2-12', (0, .08, 1, .54), 900),
    'familia':     ('4-10', (0, 0, 1, .70), 900),
}


for nome, (fonte, (fx0, fy0, fx1, fy1), larg) in SELECAO.items():
    arq = REC / f'{fonte}.png'
    if not arq.exists():
        print(f'  ⚠ {fonte} não existe — pulando {nome}'); continue
    im = Image.open(arq).convert('RGB')
    W, H = im.size
    cx = im.crop((int(W * fx0), int(H * fy0), int(W * fx1), int(H * fy1)))
    if cx.width < larg:
        alt = round(cx.height * larg / cx.width)
        cx = cx.resize((larg, alt), Image.LANCZOS)
    cx.save(DEST / f'{nome}.jpg', 'JPEG', quality=84, optimize=True, progressive=True)
    print(f'{nome:14} ← {fonte}  {cx.width}x{cx.height}  {(DEST/f"{nome}.jpg").stat().st_size/1024:.0f} KB')

total = sum(p.stat().st_size for p in DEST.glob('*.jpg'))
print(f'\n{len(list(DEST.glob("*.jpg")))} fotos · {total/1024:.0f} KB')
