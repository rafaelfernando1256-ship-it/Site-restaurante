"""
O BARRAMENTO

É isto que faz quatro scripts virarem um sistema multiagente: um estado
compartilhado, com uma máquina de estados explícita. Nenhum agente sabe
da existência dos outros — cada um só sabe pegar trabalho num estado,
fazer a sua parte e empurrar para o próximo.

Isso dá três coisas que um pipeline de funções encadeadas não dá:

  • RETOMADA — travou no agente 3? Rode o agente 3 de novo. Os outros
    não precisam rodar outra vez.
  • AUDITORIA — cada transição vira um evento com carimbo de tempo.
    Quando um lead some, dá para ver onde.
  • INDEPENDÊNCIA — cada agente pode rodar na sua hora, no seu cron,
    até em máquina diferente, desde que enxergue o mesmo banco.

SQLite de propósito: um arquivo, sem servidor, e aguenta muito mais
lead do que você vai prospectar.
"""
from __future__ import annotations

import json
import sqlite3
import time
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterator


# ── A máquina de estados ────────────────────────────────────────────
#
#   NOVO ──(a2 escreve)──> RASCUNHO ──(você aprova)──> ABORDADO
#                                                          │
#                      ┌───────────────────────────────────┤
#                      ↓                                   ↓
#                SEM_RESPOSTA                         RESPONDEU
#                                                          │
#                                         ┌────────────────┴───────────┐
#                                         ↓                            ↓
#                                   SEM_INTERESSE                  QUER_DEMO
#                                                                      │
#                                                   (a3: Instagram → Claude Code)
#                                                                      ↓
#                                                                 DEMO_PRONTA
#                                                                      │
#                                                        (a4: Netlify + link)
#                                                                      ↓
#                                                                 PUBLICADO ──> FECHADO
#
NOVO = 'novo'
RASCUNHO = 'rascunho'
ABORDADO = 'abordado'
SEM_RESPOSTA = 'sem_resposta'
RESPONDEU = 'respondeu'
SEM_INTERESSE = 'sem_interesse'
QUER_DEMO = 'quer_demo'
DEMO_PRONTA = 'demo_pronta'
PUBLICADO = 'publicado'
FECHADO = 'fechado'
DESCARTADO = 'descartado'

ESTADOS = [
    NOVO, RASCUNHO, ABORDADO, SEM_RESPOSTA, RESPONDEU, SEM_INTERESSE,
    QUER_DEMO, DEMO_PRONTA, PUBLICADO, FECHADO, DESCARTADO,
]

# Transições permitidas. Um agente que tenta pular etapa levanta erro em
# vez de corromper o funil em silêncio — num pipeline que roda sozinho,
# erro barulhento é melhor que dado errado.
TRANSICOES: dict[str, set[str]] = {
    NOVO: {RASCUNHO, DESCARTADO},
    RASCUNHO: {ABORDADO, NOVO, DESCARTADO},
    ABORDADO: {RESPONDEU, SEM_RESPOSTA, SEM_INTERESSE, DESCARTADO},
    SEM_RESPOSTA: {ABORDADO, RESPONDEU, DESCARTADO},
    RESPONDEU: {QUER_DEMO, SEM_INTERESSE, DESCARTADO},
    SEM_INTERESSE: {DESCARTADO, RESPONDEU},
    QUER_DEMO: {DEMO_PRONTA, DESCARTADO},
    DEMO_PRONTA: {PUBLICADO, QUER_DEMO, DESCARTADO},
    PUBLICADO: {FECHADO, SEM_INTERESSE, DESCARTADO},
    FECHADO: set(),
    DESCARTADO: {NOVO},
}


class TransicaoInvalida(ValueError):
    pass


@dataclass
class Lead:
    id: int
    place_id: str
    nome: str
    estado: str
    telefone: str = ''
    telefone_e164: str = ''
    instagram: str = ''
    endereco: str = ''
    cidade: str = ''
    categoria: str = ''
    nota: float = 0.0
    avaliacoes: int = 0
    presenca: str = ''        # sem_presenca | so_rede | so_delivery | tem_site
    url_achada: str = ''
    pontuacao: int = 0
    dados: dict[str, Any] = None

    @property
    def slug(self) -> str:
        """Nome de pasta seguro. Tira o acento em vez de comer a letra:
        sem isso, "Cantina da Vó" virava "cantina-da-v"."""
        import re
        import unicodedata
        plano = unicodedata.normalize('NFKD', self.nome).encode('ascii', 'ignore').decode()
        base = re.sub(r'[^a-z0-9]+', '-', plano.lower()).strip('-')
        return f'{base or "lead"}-{self.id}'


ESQUEMA = """
CREATE TABLE IF NOT EXISTS leads (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id        TEXT UNIQUE NOT NULL,
  nome            TEXT NOT NULL,
  estado          TEXT NOT NULL DEFAULT 'novo',
  telefone        TEXT DEFAULT '',
  telefone_e164   TEXT DEFAULT '',
  instagram       TEXT DEFAULT '',
  endereco        TEXT DEFAULT '',
  cidade          TEXT DEFAULT '',
  categoria       TEXT DEFAULT '',
  nota            REAL DEFAULT 0,
  avaliacoes      INTEGER DEFAULT 0,
  presenca        TEXT DEFAULT '',
  url_achada      TEXT DEFAULT '',
  pontuacao       INTEGER DEFAULT 0,
  dados           TEXT DEFAULT '{}',
  criado_em       INTEGER NOT NULL,
  mexido_em       INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_estado ON leads(estado);
CREATE INDEX IF NOT EXISTS idx_leads_cidade ON leads(cidade);

-- Mensagens ficam separadas do lead: um lead recebe a abordagem, depois
-- a entrega do link, e às vezes um retorno. Guardar só a última apagaria
-- o histórico justamente de quem já respondeu.
CREATE TABLE IF NOT EXISTS mensagens (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id     INTEGER NOT NULL REFERENCES leads(id),
  tipo        TEXT NOT NULL,              -- abordagem | entrega | retorno
  texto       TEXT NOT NULL,
  situacao    TEXT NOT NULL DEFAULT 'rascunho',  -- rascunho | aprovada | enviada | recusada
  canal       TEXT DEFAULT '',            -- link | cloud
  erro        TEXT DEFAULT '',
  criado_em   INTEGER NOT NULL,
  enviado_em  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_msg_lead ON mensagens(lead_id);
CREATE INDEX IF NOT EXISTS idx_msg_situacao ON mensagens(situacao);

CREATE TABLE IF NOT EXISTS demos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id     INTEGER NOT NULL REFERENCES leads(id),
  pasta       TEXT DEFAULT '',
  zip         TEXT DEFAULT '',
  url         TEXT DEFAULT '',
  site_id     TEXT DEFAULT '',
  situacao    TEXT NOT NULL DEFAULT 'pendente', -- pendente | construido | publicado | falhou
  erro        TEXT DEFAULT '',
  criado_em   INTEGER NOT NULL,
  mexido_em   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_demo_lead ON demos(lead_id);

-- Trilha de auditoria. Nenhum agente apaga daqui.
CREATE TABLE IF NOT EXISTS eventos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id    INTEGER,
  agente     TEXT NOT NULL,
  acao       TEXT NOT NULL,
  de         TEXT DEFAULT '',
  para       TEXT DEFAULT '',
  detalhe    TEXT DEFAULT '',
  quando     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ev_lead ON eventos(lead_id);
"""


class Estado:
    def __init__(self, caminho: Path):
        self.caminho = Path(caminho)
        self.caminho.parent.mkdir(parents=True, exist_ok=True)
        self._cx = sqlite3.connect(self.caminho, timeout=30)
        self._cx.row_factory = sqlite3.Row
        # WAL para um agente poder ler enquanto outro escreve — é o que
        # permite rodar os quatro em paralelo no mesmo banco.
        self._cx.execute('PRAGMA journal_mode=WAL')
        self._cx.execute('PRAGMA foreign_keys=ON')
        self._cx.executescript(ESQUEMA)
        self._cx.commit()

    def fechar(self) -> None:
        self._cx.close()

    def __enter__(self): return self
    def __exit__(self, *_): self.fechar()

    @contextmanager
    def _tx(self) -> Iterator[sqlite3.Connection]:
        try:
            yield self._cx
            self._cx.commit()
        except Exception:
            self._cx.rollback()
            raise

    # ── leads ───────────────────────────────────────────────────────
    def guarda_lead(self, **campos) -> tuple[int, bool]:
        """Insere ou atualiza pelo place_id. Devolve (id, era_novo)."""
        agora = int(time.time())
        dados = json.dumps(campos.pop('dados', {}), ensure_ascii=False)
        place_id = campos['place_id']
        com = self._cx.execute('SELECT id FROM leads WHERE place_id=?', (place_id,)).fetchone()
        colunas = [c for c in (
            'place_id', 'nome', 'telefone', 'telefone_e164', 'instagram', 'endereco',
            'cidade', 'categoria', 'nota', 'avaliacoes', 'presenca', 'url_achada', 'pontuacao'
        ) if c in campos]
        with self._tx() as cx:
            if com:
                sets = ', '.join(f'{c}=?' for c in colunas)
                cx.execute(
                    f'UPDATE leads SET {sets}, dados=?, mexido_em=? WHERE id=?',
                    [campos[c] for c in colunas] + [dados, agora, com['id']],
                )
                return com['id'], False
            cols = colunas + ['dados', 'estado', 'criado_em', 'mexido_em']
            cur = cx.execute(
                f"INSERT INTO leads ({','.join(cols)}) VALUES ({','.join('?' * len(cols))})",
                [campos[c] for c in colunas] + [dados, NOVO, agora, agora],
            )
            return cur.lastrowid, True

    def lead(self, lead_id: int) -> Lead | None:
        r = self._cx.execute('SELECT * FROM leads WHERE id=?', (lead_id,)).fetchone()
        return self._para_lead(r) if r else None

    def leads(self, estado: str | list[str] | None = None, limite: int = 500,
              cidade: str = '', organismo: str = '') -> list[Lead]:
        onde, args = [], []
        if estado:
            est = [estado] if isinstance(estado, str) else estado
            onde.append(f"estado IN ({','.join('?' * len(est))})")
            args += est
        if cidade:
            onde.append('cidade=?')
            args.append(cidade)
        if organismo:
            # Quem achou o lead fica dentro de `dados`, não numa coluna: a
            # colônia é uma camada por cima do funil, e o funil roda sem
            # ela. Coluna nova obrigaria migração de banco de quem já tem
            # lead guardado.
            onde.append("json_extract(dados,'$.organismo')=?")
            args.append(organismo)
        sql = 'SELECT * FROM leads'
        if onde:
            sql += ' WHERE ' + ' AND '.join(onde)
        sql += ' ORDER BY pontuacao DESC, id ASC LIMIT ?'
        args.append(limite)
        return [self._para_lead(r) for r in self._cx.execute(sql, args)]

    @staticmethod
    def _para_lead(r: sqlite3.Row) -> Lead:
        d = dict(r)
        d['dados'] = json.loads(d.get('dados') or '{}')
        d.pop('criado_em', None)
        d.pop('mexido_em', None)
        return Lead(**d)

    def move(self, lead_id: int, para: str, agente: str, detalhe: str = '') -> None:
        """Avança o estado de um lead, recusando transição inválida."""
        r = self._cx.execute('SELECT estado FROM leads WHERE id=?', (lead_id,)).fetchone()
        if not r:
            raise ValueError(f'lead {lead_id} não existe')
        de = r['estado']
        if para not in ESTADOS:
            raise TransicaoInvalida(f'estado "{para}" não existe')
        if para != de and para not in TRANSICOES.get(de, set()):
            raise TransicaoInvalida(
                f'lead {lead_id}: não dá para ir de "{de}" para "{para}". '
                f'De "{de}" só dá para ir a: {", ".join(sorted(TRANSICOES[de])) or "lugar nenhum"}'
            )
        agora = int(time.time())
        with self._tx() as cx:
            cx.execute('UPDATE leads SET estado=?, mexido_em=? WHERE id=?', (para, agora, lead_id))
            cx.execute(
                'INSERT INTO eventos (lead_id,agente,acao,de,para,detalhe,quando) '
                'VALUES (?,?,?,?,?,?,?)',
                (lead_id, agente, 'move', de, para, detalhe, agora),
            )

    def anota(self, agente: str, acao: str, lead_id: int | None = None, detalhe: str = '') -> None:
        with self._tx() as cx:
            cx.execute(
                'INSERT INTO eventos (lead_id,agente,acao,detalhe,quando) VALUES (?,?,?,?,?)',
                (lead_id, agente, acao, detalhe, int(time.time())),
            )

    # ── mensagens ───────────────────────────────────────────────────
    def guarda_mensagem(self, lead_id: int, tipo: str, texto: str) -> int:
        with self._tx() as cx:
            cur = cx.execute(
                'INSERT INTO mensagens (lead_id,tipo,texto,criado_em) VALUES (?,?,?,?)',
                (lead_id, tipo, texto, int(time.time())),
            )
            return cur.lastrowid

    def mensagens(self, situacao: str | None = None, tipo: str | None = None,
                  lead_id: int | None = None) -> list[sqlite3.Row]:
        onde, args = [], []
        for campo, valor in (('situacao', situacao), ('tipo', tipo), ('lead_id', lead_id)):
            if valor is not None:
                onde.append(f'm.{campo}=?')
                args.append(valor)
        sql = ('SELECT m.*, l.nome AS lead_nome, l.telefone_e164, l.instagram, l.cidade '
               'FROM mensagens m JOIN leads l ON l.id=m.lead_id')
        if onde:
            sql += ' WHERE ' + ' AND '.join(onde)
        return list(self._cx.execute(sql + ' ORDER BY m.id', args))

    def marca_mensagem(self, msg_id: int, situacao: str, canal: str = '', erro: str = '') -> None:
        enviado = int(time.time()) if situacao == 'enviada' else None
        with self._tx() as cx:
            cx.execute(
                'UPDATE mensagens SET situacao=?, canal=?, erro=?, enviado_em=? WHERE id=?',
                (situacao, canal, erro, enviado, msg_id),
            )

    # ── demos ───────────────────────────────────────────────────────
    def guarda_demo(self, lead_id: int, **campos) -> int:
        agora = int(time.time())
        com = self._cx.execute(
            'SELECT id FROM demos WHERE lead_id=? ORDER BY id DESC LIMIT 1', (lead_id,)
        ).fetchone()
        cols = [c for c in ('pasta', 'zip', 'url', 'site_id', 'situacao', 'erro') if c in campos]
        with self._tx() as cx:
            if com:
                sets = ', '.join(f'{c}=?' for c in cols)
                cx.execute(f'UPDATE demos SET {sets}, mexido_em=? WHERE id=?',
                           [campos[c] for c in cols] + [agora, com['id']])
                return com['id']
            todas = cols + ['lead_id', 'criado_em', 'mexido_em']
            cur = cx.execute(
                f"INSERT INTO demos ({','.join(todas)}) VALUES ({','.join('?' * len(todas))})",
                [campos[c] for c in cols] + [lead_id, agora, agora],
            )
            return cur.lastrowid

    def demo(self, lead_id: int) -> sqlite3.Row | None:
        return self._cx.execute(
            'SELECT * FROM demos WHERE lead_id=? ORDER BY id DESC LIMIT 1', (lead_id,)
        ).fetchone()

    # ── leitura ─────────────────────────────────────────────────────
    def resumo(self) -> dict[str, int]:
        return {r['estado']: r['n'] for r in self._cx.execute(
            'SELECT estado, COUNT(*) n FROM leads GROUP BY estado')}

    def historico(self, lead_id: int) -> list[sqlite3.Row]:
        return list(self._cx.execute(
            'SELECT * FROM eventos WHERE lead_id=? ORDER BY id', (lead_id,)))
