"""
O DIÁRIO

Tudo que o Jarvis faz fica escrito: hora, ferramenta, argumentos,
decisão da permissão e o que voltou. Dois motivos, nenhum burocrático:

  • quando algo der errado, você precisa saber EXATAMENTE o que ele
    rodou — e voz é um canal que erra: "apaga o cache" e "apaga o carro"
    soam parecido às duas da manhã;
  • ele mesmo lê o diário. "O que você fez hoje?" é uma consulta.

Não apaga nada. Roda sozinho uma limpeza só depois de 90 dias.
"""
from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path
from typing import Any

ESQUEMA = """
CREATE TABLE IF NOT EXISTS acoes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  quando     INTEGER NOT NULL,
  pedido     TEXT DEFAULT '',     -- a frase que você falou
  ferramenta TEXT NOT NULL,
  argumentos TEXT DEFAULT '{}',
  nivel      TEXT DEFAULT '',     -- livre | cuidado | perigo
  decisao    TEXT DEFAULT '',     -- feito | recusado | cancelado | erro
  resultado  TEXT DEFAULT '',
  segundos   REAL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_acoes_quando ON acoes(quando);

CREATE TABLE IF NOT EXISTS conversas (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  quando  INTEGER NOT NULL,
  quem    TEXT NOT NULL,          -- voce | jarvis
  texto   TEXT NOT NULL
);

-- O que ele deve lembrar entre sessões. Fato, não transcrição.
CREATE TABLE IF NOT EXISTS lembretes (
  chave   TEXT PRIMARY KEY,
  valor   TEXT NOT NULL,
  quando  INTEGER NOT NULL
);
"""


class Diario:
    def __init__(self, caminho: Path):
        self.caminho = Path(caminho)
        self.caminho.parent.mkdir(parents=True, exist_ok=True)
        self.cx = sqlite3.connect(self.caminho, timeout=30, check_same_thread=False)
        self.cx.row_factory = sqlite3.Row
        self.cx.execute('PRAGMA journal_mode=WAL')
        self.cx.executescript(ESQUEMA)
        self.cx.commit()

    def fechar(self) -> None:
        self.cx.close()

    def __enter__(self): return self
    def __exit__(self, *_): self.fechar()

    # ── escrita ─────────────────────────────────────────────────────
    def acao(self, ferramenta: str, argumentos: dict, nivel: str, decisao: str,
             resultado: str = '', pedido: str = '', segundos: float = 0) -> int:
        cur = self.cx.execute(
            'INSERT INTO acoes (quando,pedido,ferramenta,argumentos,nivel,decisao,'
            'resultado,segundos) VALUES (?,?,?,?,?,?,?,?)',
            (int(time.time()), pedido[:500], ferramenta,
             json.dumps(argumentos, ensure_ascii=False)[:4000], nivel, decisao,
             str(resultado)[:4000], segundos))
        self.cx.commit()
        return cur.lastrowid

    def fala(self, quem: str, texto: str) -> None:
        self.cx.execute('INSERT INTO conversas (quando,quem,texto) VALUES (?,?,?)',
                        (int(time.time()), quem, texto[:8000]))
        self.cx.commit()

    def lembra(self, chave: str, valor: str) -> None:
        self.cx.execute(
            'INSERT INTO lembretes (chave,valor,quando) VALUES (?,?,?) '
            'ON CONFLICT(chave) DO UPDATE SET valor=excluded.valor, quando=excluded.quando',
            (chave, valor, int(time.time())))
        self.cx.commit()

    def esquece(self, chave: str) -> bool:
        cur = self.cx.execute('DELETE FROM lembretes WHERE chave=?', (chave,))
        self.cx.commit()
        return cur.rowcount > 0

    # ── leitura ─────────────────────────────────────────────────────
    def lembretes(self) -> dict[str, str]:
        return {r['chave']: r['valor'] for r in self.cx.execute('SELECT * FROM lembretes')}

    def ultimas(self, quantas: int = 30, desde: int = 0) -> list[sqlite3.Row]:
        return list(self.cx.execute(
            'SELECT * FROM acoes WHERE quando>=? ORDER BY id DESC LIMIT ?',
            (desde, quantas)))

    def conversa(self, quantas: int = 20) -> list[sqlite3.Row]:
        linhas = list(self.cx.execute(
            'SELECT * FROM conversas ORDER BY id DESC LIMIT ?', (quantas,)))
        return list(reversed(linhas))

    def resumo_do_dia(self) -> dict[str, Any]:
        inicio = int(time.mktime(time.localtime()[:3] + (0, 0, 0, 0, 0, -1)))
        linhas = list(self.cx.execute(
            'SELECT ferramenta, decisao, COUNT(*) n FROM acoes WHERE quando>=? '
            'GROUP BY ferramenta, decisao', (inicio,)))
        return {'desde': inicio,
                'por_ferramenta': [dict(r) for r in linhas],
                'total': sum(r['n'] for r in linhas)}

    def limpa_antigo(self, dias: int = 90) -> int:
        corte = int(time.time()) - dias * 86400
        cur = self.cx.execute('DELETE FROM acoes WHERE quando<?', (corte,))
        self.cx.execute('DELETE FROM conversas WHERE quando<?', (corte,))
        self.cx.commit()
        return cur.rowcount
