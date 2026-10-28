"""
OS CLIENTES — quem já fechou e pode pedir alteração pelo WhatsApp

Um cliente é um lead em FECHADO com o site no computador. Chega aqui de
dois jeitos:

  • pelo funil: o lead que negociou e fechou — `fecha()`;
  • por fora: o cliente que você já tinha antes do funil — `cadastra()`.

A partir daí a vigia lê a conversa dele, o atendente reconhece o pedido
de alteração e o estúdio faz e republica.

POR QUE "CLIENTE DESDE"

A vigia só lê o que chegou DEPOIS que ele virou cliente. Sem esse corte,
a primeira leitura da conversa de um cliente antigo transformaria o
histórico inteiro — "muda o preço do X-Tudo", de seis meses atrás — em
pedido novo.
"""
from __future__ import annotations

import shutil
import time
from pathlib import Path

from .a1_cacador import e164
from .estado import (DEMO_PRONTA, Estado, FECHADO, NEGOCIANDO, NOVO, PUBLICADO,
                     TRANSICOES)

AGENTE = 'voce'


def _caminho_ate_fechado(est: Estado, lead_id: int) -> None:
    """Anda pelas transições que existem até FECHADO, sem pular etapa."""
    for _ in range(4):
        atual = est.lead(lead_id).estado
        if atual == FECHADO:
            return
        if FECHADO in TRANSICOES[atual]:
            est.move(lead_id, FECHADO, AGENTE, 'fechou')
        elif NEGOCIANDO in TRANSICOES[atual]:
            est.move(lead_id, NEGOCIANDO, AGENTE, 'a caminho de fechado')
        elif atual == NOVO:
            est.move(lead_id, DEMO_PRONTA, AGENTE, 'cliente cadastrado à mão')
        elif PUBLICADO in TRANSICOES[atual]:
            est.move(lead_id, PUBLICADO, AGENTE, 'cliente cadastrado à mão')
        else:
            raise ValueError(f'não há caminho de "{atual}" até fechado')


def fecha(est: Estado, lead_id: int) -> None:
    """O lead fechou: vira cliente, e a vigia passa a atender os pedidos dele."""
    _caminho_ate_fechado(est, lead_id)
    est.muda_dados(lead_id, cliente_desde=int(time.time()))
    for a in est.avisos():
        if a['lead_id'] == lead_id and a['tipo'] == 'fechar':
            est.resolve_aviso(a['id'])


def prepara_pasta(origem: Path, destino: Path) -> Path:
    """
    O estúdio trabalha numa pasta com `publico/index.html`. Pasta que já
    está nesse formato é usada como está; pasta com o `index.html` na raiz
    é copiada para `destino/publico/`.
    """
    origem = Path(origem).expanduser()
    if (origem / 'publico' / 'index.html').exists():
        return origem
    if (origem / 'index.html').exists():
        if (destino / 'publico').exists():
            shutil.rmtree(destino / 'publico')
        shutil.copytree(origem, destino / 'publico',
                        ignore=shutil.ignore_patterns('.git', 'node_modules'))
        return destino
    raise ValueError(f'não achei index.html em {origem} nem em {origem / "publico"}')


def cadastra(est: Estado, cfg, nome: str, telefone: str, nicho: str = '',
             pasta: str = '', url: str = '', site_id: str = '',
             cidade: str = '') -> int:
    """Cliente que você já tinha antes do funil."""
    numero = e164(telefone)
    if len(numero) in (10, 11):
        numero = '55' + numero          # digitado sem o +55, como todo mundo digita
    if len(numero) < 12:
        raise ValueError('telefone com DDD, ex.: +55 11 91234-5678')
    lead_id, _ = est.guarda_lead(
        place_id=f'cliente:{numero}', nome=nome.strip(), telefone=telefone,
        telefone_e164=numero, cidade=cidade or cfg.cidade or '',
        categoria=nicho, dados={'origem': 'cliente', 'nicho': nicho} if nicho
        else {'origem': 'cliente'})
    if pasta:
        lead = est.lead(lead_id)
        pronta = prepara_pasta(Path(pasta), Path(cfg.saida) / lead.slug)
        est.guarda_demo(lead_id, pasta=str(pronta), url=url, site_id=site_id,
                        situacao='publicado', erro='')
    elif url or site_id:
        est.guarda_demo(lead_id, url=url, site_id=site_id, situacao='publicado', erro='')
    fecha(est, lead_id)
    return lead_id
