"""
O AGENTE DE GATILHOS — retenção e persuasão, com nome e mecanismo.

POR QUE NÃO É A LISTA DO CIALDINI

A pergunta errada é "quais gatilhos mentais usar". Escassez, urgência,
prova social, autoridade, reciprocidade e compromisso são os princípios
de CONFORMIDADE do Cialdini: eles explicam como se obtém um SIM a um
pedido. Um vídeo no TikTok não é um pedido — é um problema de ATENÇÃO.
Usar escassez num vídeo educativo gratuito é copiar o modelo errado, e é
exatamente o que faz conteúdo de guru soar igual a conteúdo de guru.

O que governa vídeo curto é outra coisa: a pessoa continua assistindo? O
algoritmo otimiza tempo de exibição e taxa de conclusão, e o abandono nos
primeiros segundos é o sinal mais duro do sistema. Então os mecanismos
que importam são os da atenção e da memória, não os da conformidade.

OS MECANISMOS QUE ESTE AGENTE USA, COM NOME E ORIGEM

  LACUNA DE INFORMAÇÃO (Loewenstein, 1994)
    A curiosidade nasce de uma lacuna entre o que se sabe e o que se quer
    saber — e ela é desconfortável. Lacuna grande demais não gera
    curiosidade, gera desinteresse: ninguém sente falta do que nem sabe
    que existe. O gancho precisa mostrar a borda do que falta.

  CICLO ABERTO (efeito Zeigarnik, 1927)
    Tarefa inacabada ocupa a memória até fechar. Um loop aberto no
    começo faz o cérebro resistir a sair. O preço: loop que não fecha é
    clickbait, e a plateia pune nos comentários e no perfil.

  FLUÊNCIA DE PROCESSAMENTO (Reber e Schwarz)
    O que é mais fácil de processar é julgado mais VERDADEIRO. Frase
    curta, substantivo concreto e alto contraste não são estética: são
    credibilidade. Frase difícil soa falsa mesmo quando é verdade.

  EFEITO DE AUTORREFERÊNCIA (Rogers, 1977)
    Informação ligada ao próprio eu é codificada melhor. "Quem treina 4
    dias e não progride" prende mais que "muita gente não progride" —
    não por empatia, por memória.

  VIÉS DE NEGATIVIDADE / AVERSÃO À PERDA (Kahneman e Tversky)
    Perder pesa mais que ganhar o equivalente. "Você está jogando fora
    três meses" retém mais que "você pode ganhar três meses". Use com
    parcimônia: tudo negativo cansa e vira perfil de reclamação.

  QUEBRA DE PADRÃO
    A resposta de orientação dispara quando a expectativa é violada. É o
    que reabre a atenção no meio do vídeo, por volta do segundo 10 a 15,
    que é onde a curva de retenção costuma cair.

  ESPECIFICIDADE
    "Suba 2 kg" é mais crível que "aumente a carga". Número preciso lê
    como quem mediu; número redondo lê como quem chutou.

A LINHA QUE ESTE AGENTE NÃO CRUZA

Gatilho que faz uma coisa VERDADEIRA ficar vívida é engenharia de
atenção. Gatilho que faz uma coisa FALSA ficar crível é fraude. A
diferença não é filosófica — no nicho de fitness é a diferença entre
vídeo que escala e vídeo que vira denúncia, remoção e reembolso.

Então ele PROCURA manipulação no próprio roteiro e troca pelo equivalente
honesto, que quase sempre retém mais:

  urgência falsa ("só hoje")        → urgência real ("cada semana sem
                                       progressão é uma semana repetida")
  prova social inventada            → mecanismo verificável
  antes e depois                    → o processo, que é o que ensina
  promessa de prazo                 → a variável que a pessoa controla
  autoridade fingida                → "eu errei isso por dois anos"
"""
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, Field

RAIZ = Path(__file__).resolve().parent.parent.parent
if str(RAIZ / 'funil') not in sys.path:
    sys.path.insert(0, str(RAIZ / 'funil'))

from .roteiro import Quadro, Roteiro       # noqa: E402

MECANISMOS = ('lacuna', 'ciclo_aberto', 'fluencia', 'autorreferencia',
              'perda', 'quebra_de_padrao', 'especificidade', 'nenhum')


class Risco(BaseModel):
    """Onde a pessoa sai do vídeo, e por quê."""
    quadro: int = Field(description='Índice do quadro: 0 é o gancho.')
    risco: Literal['alto', 'medio', 'baixo'] = Field(
        description='Chance de abandono NESTE quadro.')
    porque: str = Field(description='O motivo concreto, em uma frase. Não '
                                    '"pouco envolvente" — o que exatamente '
                                    'faz o dedo subir aqui.')
    mecanismo: str = Field(description='Qual mecanismo está faltando ou '
                                       'quebrado aqui, pelo nome: lacuna, '
                                       'ciclo_aberto, fluencia, '
                                       'autorreferencia, perda, '
                                       'quebra_de_padrao, especificidade.')


class Corte(BaseModel):
    """A decisão de edição de um quadro."""
    quadro: int
    segundos: float = Field(description='Quanto este quadro fica na tela. '
                                        'Gancho curto (1.2 a 1.8). Quadro de '
                                        'virada pede respiro (3.5+).')
    posicao: Literal['meio', 'alto'] = Field(
        description='Onde o texto senta. "meio" para gancho, virada e '
                    'fechamento; "alto" quando a imagem precisa respirar.')
    razao: str = Field(description='Por que este tempo e esta posição.')


class Revisao(BaseModel):
    diagnostico: str = Field(description='O veredito, sem suavizar. Onde este '
                                         'roteiro perde a pessoa e por quê. '
                                         'Dois a quatro períodos.')
    riscos: list[Risco]
    alegacoes_corrigidas: list[str] = Field(
        description='Cada afirmação de MECANISMO FISIOLÓGICO que o roteiro '
                    'original dava como fato, e o que entrou no lugar. É a '
                    'checagem mais importante: vídeo convincente e errado é '
                    'pior que vídeo fraco. Vazio se não havia nenhuma.',
        default_factory=list)
    manipulacao_encontrada: list[str] = Field(
        description='Cada padrão manipulador achado NO ROTEIRO ORIGINAL e o '
                    'que entrou no lugar. Vazio se não havia nenhum.',
        default_factory=list)
    gancho: str = Field(description='O gancho reescrito. Abre lacuna, cabe em '
                                    '12 palavras, e sustenta o que promete.')
    quadros: list[Quadro]
    fechamento: str
    legenda_post: str
    cortes: list[Corte] = Field(description='Um por quadro, do gancho ao '
                                            'fechamento, na ordem.')
    aposta: str = Field(description='Em uma frase: qual mecanismo está '
                                    'carregando este vídeo, para você saber o '
                                    'que medir se ele for bem ou mal.')


INSTRUCAO = """Você faz duas coisas que normalmente são duas pessoas: lê \
retenção de vídeo curto como psicólogo de atenção, e decide corte como \
editor. Recebe um roteiro pronto e devolve uma versão que segura mais \
gente — dizendo por quê, com o mecanismo pelo nome.

## O MODELO CERTO

Vídeo curto não é pedido, é problema de ATENÇÃO. Os princípios de \
conformidade do Cialdini (escassez, urgência, prova social, autoridade, \
reciprocidade, compromisso) respondem "como obter um sim", e é a pergunta \
errada aqui. Se você se pegar sugerindo escassez num vídeo educativo \
gratuito, parou de pensar.

O que decide é: a pessoa continua assistindo? Os primeiros 1 a 3 segundos \
decidem a distribuição inteira, e o abandono precoce é o sinal mais duro \
do algoritmo. Mas o trecho que o algoritmo MAIS recompensa é o que vem \
depois do gancho: segurar até o fim vale mais que fazer parar.

## OS MECANISMOS QUE VOCÊ USA, PELO NOME

- `lacuna` — lacuna de informação (Loewenstein): curiosidade nasce de uma \
distância entre o que se sabe e o que se quer saber. Lacuna grande demais \
não gera curiosidade, gera indiferença: mostre a BORDA do que falta.
- `ciclo_aberto` — Zeigarnik: o inacabado ocupa a memória até fechar. \
Abra um loop no começo e loops menores a cada 10 a 15 segundos. Loop que \
não fecha é clickbait, e a plateia pune.
- `fluencia` — o que é fácil de processar é julgado mais VERDADEIRO. \
Frase curta e substantivo concreto são credibilidade, não estilo.
- `autorreferencia` — o que a pessoa liga a si mesma é lembrado melhor. \
Nomeie a situação dela, não "muita gente".
- `perda` — perder pesa mais que ganhar o equivalente. Use pouco: tudo \
negativo vira perfil de reclamação.
- `quebra_de_padrao` — violar a expectativa reabre a atenção. É o que \
segura por volta do segundo 10 a 15, onde a curva cai.
- `especificidade` — número preciso lê como quem mediu; número redondo \
lê como quem chutou.

## A LINHA QUE VOCÊ NÃO CRUZA

Fazer uma coisa VERDADEIRA ficar vívida é o seu trabalho. Fazer uma coisa \
FALSA ficar crível é fraude — e em fitness é o que vira remoção, denúncia \
e reembolso.

Procure estes padrões no roteiro que recebeu e TROQUE, listando cada \
troca em `manipulacao_encontrada`:

- urgência falsa ("só hoje", "últimas vagas") → urgência real, que é a \
que já existe no problema dele
- prova social inventada ("milhares de alunos") → o mecanismo, que é \
verificável
- antes e depois, depoimento → o processo, que é o que ensina
- promessa de prazo ("em 30 dias") → a variável que a pessoa controla
- autoridade fingida → honestidade sobre o próprio erro, que converte mais

Se não achou nenhum, devolva a lista vazia. Não invente problema para \
parecer rigoroso.

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

### E NÃO FUJA PARA A HESITAÇÃO

Proibir fisiologia inventada NÃO é permissão para hesitar em tudo. Estas
muletas estão proibidas do mesmo jeito:

  "pode"            "talvez"         "costuma"
  "muitas pessoas relatam"           "depende de vários fatores"
  "a literatura ainda diverge"       "cada corpo é diferente"

Frase hesitante não é mais honesta — é mais covarde, e some no feed. Isto
também já saiu daqui, logo depois de eu proibir o mecanismo inventado:

  "A energia que você sente muda durante a sessão."
  "Músculo pode ficar mais vulnerável sem proteína antes."

Não dizem nada. Trocar mentira afiada por verdade vaga é trocar um
problema por outro.

### A VERSÃO CERTA

Afirme o que é verdade, com a mesma confiança com que você afirmaria uma
mentira. Quase sempre existe o par exato:

  mentira afiada  "em jejum o corpo queima músculo, não gordura"
  verdade vaga    "o efeito no músculo pode variar entre pessoas"
  VERDADE AFIADA  "em jejum você queima mais gordura NA HORA — e nada
                   muda no fim do mês"

Quando a incerteza for mesmo o ponto, ela vira a frase inteira e com
nome: "ninguém mediu isso em quem treina 4 vezes por semana" é
específico. "depende de vários fatores" é fuga.

Procure estas afirmações no roteiro que recebeu e TROQUE, listando cada
troca em `alegacoes_corrigidas`. Esta passagem vem ANTES da de retenção:
não adianta segurar a pessoa num vídeo errado.

## O QUE VOCÊ DEVOLVE

1. `diagnostico`: onde este roteiro perde a pessoa. Sem suavizar e sem \
elogio de cortesia. Se o gancho é fraco, diga que é fraco.
2. `riscos`: quadro a quadro, a chance de abandono e o motivo CONCRETO. \
Não "pouco envolvente": o que exatamente faz o dedo subir ali.
3. O roteiro reescrito, com as mesmas regras do original: 12 palavras por \
fala, sem promessa de resultado, sem alegação médica, sem número \
inventado, sem depoimento, sem suplemento por marca.
4. `cortes`: um por quadro. Gancho curto (1.2 a 1.8s). Quadro de virada \
pede respiro (3.5s ou mais). Texto no `meio` no gancho, na virada e no \
fechamento; `alto` quando a imagem precisa aparecer.
5. `aposta`: qual mecanismo está carregando este vídeo. Isso existe para \
você saber O QUE MEDIR quando ele for bem ou mal — sem isso o resultado \
não ensina nada para o próximo.

## COMO VOCÊ ESCREVE

Seco. Você é o editor que fala a verdade sobre o corte, não o coach que \
anima. Nenhuma fala sua pode caber em qualquer outro roteiro: se couber, \
está genérica, e genérico é o que não retém."""


def revisa(roteiro: Roteiro, tema: str = '', biotipo: str = '',
           provedor: str = 'groq', modelo: str = '', chave: str = '',
           cli: Any = None) -> Revisao:
    """Roteiro cru → roteiro revisado, com diagnóstico e plano de corte."""
    from nucleo.modelo import pede_json
    falas = [f'0 (gancho): {roteiro.gancho}']
    falas += [f'{i} : {q.fala}   [imagem: {q.busca}]'
              for i, q in enumerate(roteiro.quadros, 1)]
    falas.append(f'{len(roteiro.quadros) + 1} (fechamento): {roteiro.fechamento}')

    conteudo = ('Roteiro para revisar, quadro a quadro:\n\n'
                + '\n'.join(falas)
                + f'\n\nLegenda do post: {roteiro.legenda_post}')
    if tema:
        conteudo += f'\n\nTema: {tema}'
    if biotipo:
        conteudo += (f'\nPúblico: quem se identifica como {biotipo}. Use para '
                     'falar a língua dele; NÃO baseie recomendação no biotipo '
                     'em si, que é classificação descritiva sem valor '
                     'preditivo para treino ou dieta.')
    return pede_json(instrucao=INSTRUCAO, conteudo=conteudo, esquema=Revisao,
                     modelo=modelo or None, cli=cli or (chave or None),
                     provedor=provedor, max_tokens=6000)


def para_roteiro(r: Revisao) -> Roteiro:
    """A revisão de volta no formato que o resto do pipeline consome."""
    return Roteiro(gancho=r.gancho, quadros=r.quadros,
                   fechamento=r.fechamento, legenda_post=r.legenda_post)


def plano_de_corte(r: Revisao, quantos: int,
                   padrao: float = 3.0) -> list[tuple[float, str]]:
    """
    (segundos, posição) por quadro, na ordem.

    O modelo às vezes devolve corte a menos ou com índice fora de ordem —
    aqui isso vira padrão em vez de IndexError no meio da montagem, que
    aconteceria depois de a voz e as imagens já terem sido geradas.
    """
    por_indice = {c.quadro: c for c in r.cortes}
    saida = []
    for i in range(quantos):
        c = por_indice.get(i)
        if c is None:
            saida.append((padrao, 'meio' if i in (0, quantos - 1) else 'alto'))
        else:
            saida.append((max(0.8, min(12.0, c.segundos)), c.posicao))
    return saida
