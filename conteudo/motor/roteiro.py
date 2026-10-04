"""
O ROTEIRO — o que falar, e em que ordem.

Reaproveita a ponte de modelo do funil (`funil/nucleo/modelo.py`): mesma
chave, mesmos quatro provedores, mesma saída validada por esquema. Não
faz sentido manter duas pontes para a mesma coisa.

O QUE ESTE PROMPT EVITA

Vídeo de fitness no TikTok morre por três motivos, nesta ordem:

  1. o primeiro segundo não disse nada
  2. prometeu resultado que o algoritmo derruba e o espectador não crê
  3. terminou sem dizer o que fazer agora

A instrução trata os três, e proíbe o que a plataforma remove: promessa
de emagrecimento com prazo, antes e depois, e qualquer coisa que soe a
prescrição médica.
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

# A ponte do funil, que já sabe falar com Claude, Gemini, OpenRouter e
# Groq. O pacote deste projeto se chama `motor` e não `nucleo` justamente
# por isso: dois pacotes `nucleo` no mesmo sys.path fazem um esconder o
# outro, e o erro sai como "cannot import name" num arquivo que existe.
RAIZ = Path(__file__).resolve().parent.parent.parent
if str(RAIZ / 'funil') not in sys.path:
    sys.path.insert(0, str(RAIZ / 'funil'))


class Quadro(BaseModel):
    """Um quadro do vídeo: uma frase na tela, uma imagem por trás."""
    fala: str = Field(description='A frase na tela E narrada. Uma só, curta. '
                                  'Marque UMA palavra com *asterisco* para '
                                  'sair na cor de destaque.')
    busca: str = Field(description='2 a 4 palavras EM INGLÊS para buscar a '
                                   'imagem de fundo no acervo. Concreto e '
                                   'fotografável: "barbell deadlift gym", '
                                   'não "determinação".')


class Roteiro(BaseModel):
    gancho: str = Field(description='O primeiro quadro. Tem 1 segundo para '
                                    'fazer parar o dedo. Sem "fala galera".')
    quadros: list[Quadro] = Field(description='Os quadros do corpo, em ordem.')
    fechamento: str = Field(description='O último quadro: o que fazer agora.')
    legenda_post: str = Field(description='A legenda do post, com 3 a 5 '
                                          'hashtags no fim.')


INSTRUCAO = """Você escreve roteiro de vídeo curto vertical sobre treino e \
alimentação, para TikTok, em português do Brasil.

FORMATO
- 5 a 8 quadros no corpo, além do gancho e do fechamento.
- Cada fala com no máximo 12 palavras. Ela vai APARECER NA TELA em letra \
grande: frase longa não cabe e não é lida.
- A maioria assiste SEM SOM. O texto na tela é o conteúdo; a narração \
acompanha.

O GANCHO
Tem um segundo. Comece pela afirmação mais específica e contraintuitiva \
que você puder sustentar. Nada de "fala galera", "você sabia que", \
"3 dicas para".

O TOM é seco e direto. Nada de motivação genérica, nada de emoji, nada \
de exclamação. Quem fala é alguém que treina há anos e está contando \
como é, incluindo a parte chata. Se a frase caberia em qualquer perfil \
de fitness, troque.

O QUE NÃO PODE, de jeito nenhum:
- promessa de resultado com prazo ("perca X kg em Y dias")
- antes e depois, depoimento, "aluno meu"
- qualquer coisa que soe a prescrição médica ou trate doença
- número ou estudo que você não tem na mão
- suplemento por marca, hormônio, substância controlada

Isso não é precaução exagerada: é o que a plataforma remove e o que gera \
denúncia depois que o vídeo pega.

## A REGRA QUE VALE MAIS QUE TODAS: NÃO INVENTE FISIOLOGIA

Você NÃO PODE afirmar mecanismo do corpo como fato. Nada de:

- "seu corpo usa X, não Y, como energia"
- "isso ativa/dispara/bloqueia o hormônio Z"
- "sem carboidrato ele queima músculo"
- "o cortisol faz você reter gordura"

Essas frases soam especialistas e são o jeito mais rápido de publicar
mentira com cara de ciência. Um exemplo real do que já saiu daqui:
"treinar em jejum queima glicogênio, não gordura" — é o INVERSO do que a
literatura mostra, porque exercício aeróbico em jejum induz oxidação de
gordura MAIOR que alimentado. O vídeo ficou convincente e errado.

E atenção ao incentivo: um gancho contraintuitivo é bom, mas
contraintuitivo e FALSO é só errado. Se a afirmação mais específica que
você tem é uma que você não pode sustentar, use uma menos específica.

### O que usar no lugar

1. O QUE A PESSOA OBSERVA. Fome, energia no treino, se conseguiu manter
   a semana. Ela verifica sozinha, e por isso acredita.
2. O QUE ELA CONTROLA. Horário, carga, quantidade, ordem das refeições.
3. A FRONTEIRA DO QUE SE SABE, quando ela for o ponto. "Na hora do
   treino muda; no fim do mês, o que decide é o total do dia" é mais
   interessante que mecanismo inventado — e sobrevive a quem souber do
   assunto nos comentários.

Quando um mecanismo for mesmo necessário, marque a incerteza no próprio
texto: "a teoria diz X — o que se mede, porém, é Y".

A BUSCA DE IMAGEM é em INGLÊS, concreta e fotografável. Pense no que uma \
câmera veria. "barbell deadlift gym", "man eating rice kitchen", \
"empty gym night" — nunca "foco", "disciplina", "jornada".

O FECHAMENTO diz o que fazer agora, em uma frase. Sem "link na bio" se \
não houver link."""


def escreve(tema: str, biotipo: str = '', provedor: str = 'groq',
            modelo: str = '', chave: str = '', cli: Any = None) -> Roteiro:
    from nucleo.modelo import pede_json
    conteudo = f'Tema do vídeo: {tema}'
    if biotipo:
        conteudo += (f'\n\nO público é quem se identifica como {biotipo}. '
                     'Use isso para falar a língua dele, mas NÃO baseie '
                     'nenhuma recomendação no biotipo em si: somatotipo é '
                     'classificação descritiva dos anos 1940 e não prediz '
                     'resposta a treino ou dieta. O conselho sai da situação '
                     'real (dias de treino, rotina, o que já tentou).')
    return pede_json(instrucao=INSTRUCAO, conteudo=conteudo, esquema=Roteiro,
                     modelo=modelo or None, cli=cli or (chave or None),
                     provedor=provedor, max_tokens=4000)
