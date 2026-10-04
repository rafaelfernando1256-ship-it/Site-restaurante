#!/usr/bin/env python3
"""
Copia as instruções do terminal para o site.

As duas TÊM de ser as mesmas. Se o site afrouxar o que o terminal recusa,
a pessoa descobre que basta usar o site para publicar o que a verificação
recusou — e aí a verificação não vale nada.

Rode depois de mexer em conteudo/motor/roteiro.py ou gatilhos.py:

    python3 gerar.py && node construir.mjs
"""
import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
sys.path.insert(0, str(RAIZ.parent / 'conteudo'))

from motor import gatilhos, roteiro      # noqa: E402

destino = RAIZ / 'js' / 'instrucao.js'
destino.write_text(
    '/* GERADO de conteudo/motor/{roteiro,gatilhos}.py — não edite aqui.\n'
    '   As duas instruções TÊM de ser as mesmas: se o site afrouxar o que o\n'
    '   terminal recusa, a verificação não vale nada. `python3 gerar.py`\n'
    '   regenera, e uma prova compara as duas. */\n\n'
    f'export const ROTEIRO = {json.dumps(roteiro.INSTRUCAO, ensure_ascii=False)};\n\n'
    f'export const GATILHOS = {json.dumps(gatilhos.INSTRUCAO, ensure_ascii=False)};\n',
    encoding='utf-8')
print(f'  {destino.relative_to(RAIZ)} · '
      f'{destino.stat().st_size // 1024} KB')
