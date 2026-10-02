"""
AS VENDAS

Você disse que o faturamento vem do WhatsApp. Então o caminho é:
ler as conversas → extrair o que é venda → **guardar num banco** →
responder a partir do banco.

Por que não responder direto da leitura, sem guardar:

  • perguntar duas vezes no mesmo dia releria tudo e gastaria o dobro;
  • e, pior, cada leitura poderia dar um número diferente. Faturamento
    que muda de valor quando você pergunta de novo não é faturamento.

Por isso cada venda entra com uma **impressão digital** do trecho que a
originou. Reprocessar a mesma conversa não soma de novo. E cada linha
guarda o pedaço exato da mensagem de onde o número saiu — quando o total
parecer estranho, dá para ver de onde veio cada centavo.

Dinheiro é inteiro, em centavos. Float para dinheiro erra no centésimo,
e erro de centavo em soma de mês vira discussão.
"""
from __future__ import annotations

import hashlib
import re
import sqlite3
import time
from datetime import date, datetime, timedelta
from pathlib import Path

ESQUEMA = """
CREATE TABLE IF NOT EXISTS vendas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  quando      INTEGER NOT NULL,          -- quando a venda aconteceu
  centavos    INTEGER NOT NULL,
  cliente     TEXT DEFAULT '',
  descricao   TEXT DEFAULT '',
  origem      TEXT DEFAULT '',           -- conversa de onde saiu
  trecho      TEXT DEFAULT '',           -- a mensagem exata
  confianca   REAL DEFAULT 1.0,
  digital     TEXT UNIQUE,               -- impede contar duas vezes
  criado_em   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vendas_quando ON vendas(quando);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON vendas(cliente);
"""


def centavos(texto: str) -> int:
    """
    'R$ 1.200,50' → 120050. 'R$ 1,200.50' → 120050. '80' → 8000.

    O separador decimal é decidido pelo ÚLTIMO separador que aparece com
    duas casas depois — é o que distingue 1.200 (mil e duzentos) de
    1.20 (um e vinte), e errar isso é errar por cem vezes.
    """
    t = re.sub(r'[^\d.,]', '', str(texto or '')).strip()
    if not t:
        return 0
    if ',' in t and '.' in t:
        decimal = ',' if t.rindex(',') > t.rindex('.') else '.'
        milhar = '.' if decimal == ',' else ','
        t = t.replace(milhar, '').replace(decimal, '.')
    elif ',' in t:
        # vírgula com 1 ou 2 dígitos depois é decimal; 3 é milhar (1,200)
        depois = len(t) - t.rindex(',') - 1
        t = t.replace(',', '.' if depois <= 2 else '')
    elif '.' in t:
        depois = len(t) - t.rindex('.') - 1
        if depois == 3:
            t = t.replace('.', '')
    try:
        return int(round(float(t) * 100))
    except ValueError:
        return 0


def reais(cent: int) -> str:
    return f'R$ {cent / 100:,.2f}'.replace(',', '§').replace('.', ',').replace('§', '.')


def inicio_do_dia(quando: float | None = None) -> int:
    d = datetime.fromtimestamp(quando or time.time())
    return int(datetime(d.year, d.month, d.day).timestamp())


class Caixa:
    def __init__(self, caminho: Path):
        self.caminho = Path(caminho)
        self.caminho.parent.mkdir(parents=True, exist_ok=True)
        self.cx = sqlite3.connect(self.caminho, timeout=30, check_same_thread=False)
        self.cx.row_factory = sqlite3.Row
        self.cx.execute('PRAGMA journal_mode=WAL')
        self.cx.executescript(ESQUEMA)
        self.cx.commit()

    def fechar(self): self.cx.close()
    def __enter__(self): return self
    def __exit__(self, *_): self.fechar()

    def guarda(self, centavos_: int, quando: int, cliente: str = '', descricao: str = '',
               origem: str = '', trecho: str = '', confianca: float = 1.0) -> bool:
        """True se entrou; False se já estava lá (mesma origem e mesmo valor)."""
        digital = hashlib.sha1(
            f'{origem}|{trecho.strip()[:200]}|{centavos_}'.encode()).hexdigest()
        try:
            self.cx.execute(
                'INSERT INTO vendas (quando,centavos,cliente,descricao,origem,trecho,'
                'confianca,digital,criado_em) VALUES (?,?,?,?,?,?,?,?,?)',
                (quando, centavos_, cliente, descricao, origem, trecho[:500],
                 confianca, digital, int(time.time())))
            self.cx.commit()
            return True
        except sqlite3.IntegrityError:
            return False

    def apaga(self, venda_id: int) -> bool:
        cur = self.cx.execute('DELETE FROM vendas WHERE id=?', (venda_id,))
        self.cx.commit()
        return cur.rowcount > 0

    # ── leitura ─────────────────────────────────────────────────────
    def periodo(self, desde: int, ate: int = 0) -> list[sqlite3.Row]:
        ate = ate or int(time.time()) + 86400
        return list(self.cx.execute(
            'SELECT * FROM vendas WHERE quando>=? AND quando<? ORDER BY quando',
            (desde, ate)))

    def total(self, desde: int, ate: int = 0) -> tuple[int, int]:
        linhas = self.periodo(desde, ate)
        return sum(l['centavos'] for l in linhas), len(linhas)

    def por_cliente(self, desde: int, ate: int = 0) -> list[tuple[str, int, int]]:
        agrupado: dict[str, list[int]] = {}
        for l in self.periodo(desde, ate):
            agrupado.setdefault(l['cliente'] or '(sem nome)', []).append(l['centavos'])
        return sorted(((c, sum(v), len(v)) for c, v in agrupado.items()),
                      key=lambda x: -x[1])

    def por_dia(self, dias: int = 7) -> list[tuple[str, int]]:
        hoje = date.today()
        saida = []
        for i in range(dias - 1, -1, -1):
            d = hoje - timedelta(days=i)
            ini = int(datetime(d.year, d.month, d.day).timestamp())
            saida.append((d.strftime('%d/%m'), self.total(ini, ini + 86400)[0]))
        return saida

    def duvidosas(self, desde: int, minimo: float = 0.7) -> list[sqlite3.Row]:
        return [l for l in self.periodo(desde) if l['confianca'] < minimo]
