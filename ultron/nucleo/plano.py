"""
O PLANO — a diferença entre chamar ferramenta e pensar.

Um laço de ferramentas faz isto: o modelo chama, vê o resultado, chama de
novo, até parar. Funciona para "que horas são". Não funciona para "pega
os leads do funil que responderam, monta um resumo e me manda no
WhatsApp" — ali ele chama a primeira, se perde, e responde como se
tivesse terminado.

O QUE FAZ UM PLANO SER PENSAMENTO, E NÃO CERIMÔNIA

Um plano que só lista passos é enfeite: o modelo já ia fazer aqueles
passos. O que muda tudo é UMA coluna a mais — **como eu sei que deu
certo**, escrita ANTES de agir.

Obrigar a dizer o critério antes força três coisas:

  1. decidir o que conta como pronto, que é metade do trabalho;
  2. perceber, na hora de escrever, quando um passo não tem como ser
     verificado — e esse é justamente o passo que costuma falhar calado;
  3. poder dizer NÃO DEU no fim, em vez de narrar sucesso. Assistente que
     nunca falha é assistente que você não pode usar para nada sério.

QUANDO ELE PLANEJA, E QUANDO NÃO

Planejar "que horas são" é insuportável. A regra é barata e funciona: só
planeja o que tem cheiro de mais de um passo, ou o que vai mexer em
alguma coisa. Pergunta e consulta passam direto.
"""
from __future__ import annotations

import re
from typing import Any

from pydantic import BaseModel, Field


class Passo(BaseModel):
    o_que: str = Field(description='A ação, numa frase. Concreta: "ler os '
                                   'leads em estado respondeu", não '
                                   '"analisar o funil".')
    ferramenta: str = Field(default='', description='Qual ferramenta você '
                                                    'espera usar, se souber.')
    como_sei: str = Field(description='Como você vai SABER que este passo deu '
                                      'certo — uma coisa observável. "a lista '
                                      'volta com pelo menos um lead", não '
                                      '"terá funcionado". Se você não '
                                      'consegue dizer, escreva NÃO SEI, que '
                                      'é uma resposta honesta e útil.')


class Plano(BaseModel):
    entendi: str = Field(description='O que você entendeu do pedido, com suas '
                                     'palavras. Se o pedido for ambíguo, diga '
                                     'qual leitura você escolheu e por quê.')
    passos: list[Passo]
    risco: str = Field(default='', description='O que pode dar errado de um '
                                               'jeito que não desfaz. Vazio '
                                               'se nada.')
    pergunta: str = Field(default='', description='Se faltar uma informação '
                                                  'sem a qual o plano não se '
                                                  'sustenta, a pergunta. '
                                                  'Vazio se não faltar — não '
                                                  'pergunte por educação.')


class Veredito(BaseModel):
    """O que aconteceu, confrontado com o que foi planejado."""
    cumpriu: bool = Field(description='TODOS os passos atingiram o critério?')
    falhou_em: str = Field(default='', description='Qual passo não atingiu, e '
                                                   'o que de fato aconteceu.')
    resposta: str = Field(description='O que dizer em voz alta. Curto. Se não '
                                      'cumpriu, diga isso PRIMEIRO — a pessoa '
                                      'precisa saber antes de confiar.')


INSTRUCAO_PLANO = """Você é o Ultron. Antes de agir, você planeja.

Receba o pedido e devolva um plano curto: o que você entendeu, os passos, \
e — o mais importante — COMO VOCÊ VAI SABER que cada passo deu certo.

Sobre o critério de cada passo:
- tem que ser OBSERVÁVEL. "o arquivo existe em tal lugar", "a lista volta \
com pelo menos um item", "o comando sai com código 0". Nunca "terá \
funcionado" nem "estará correto".
- se você não consegue dizer como saberia, escreva NÃO SEI. É resposta \
honesta, e um passo sem verificação é justamente o que falha calado.

Sobre o número de passos: o mínimo que resolve. Plano de oito passos para \
uma tarefa de dois é teatro, e teatro gasta o tempo de quem ouve.

Sobre perguntar: só pergunte se FALTA uma informação sem a qual o plano \
não se sustenta. Ambiguidade que você consegue resolver escolhendo e \
dizendo qual escolheu, resolva. Perguntar por educação é desperdiçar o \
turno da pessoa.

Sobre o risco: só preencha se houver algo que não desfaz — apagar, \
enviar, publicar, gastar. Risco reversível não vai aí."""


INSTRUCAO_VEREDITO = """Você é o Ultron, conferindo o próprio trabalho.

Você vai receber o plano que fez e o que de fato aconteceu em cada passo. \
Compare com honestidade brutal.

Se algum passo não atingiu o critério que VOCÊ escreveu, `cumpriu` é \
false — mesmo que o resultado tenha ficado bom por outro caminho, e \
mesmo que tenha sido quase. "Quase" é false.

Na `resposta`, se não cumpriu, diga isso na PRIMEIRA frase. A pessoa vai \
agir em cima do que você falar; descobrir depois que não foi feito é pior \
que ouvir agora que falhou.

Fale como quem conta o que fez, não como quem apresenta relatório. Sem \
"realizei com sucesso", sem "espero ter ajudado"."""


# Verbos que sozinhos não merecem plano: pergunta e consulta. O resto —
# qualquer coisa que MEXA — passa pelo plano.
SO_CONSULTA = re.compile(
    r'^\s*(que horas|qual|quais|quanto|quantos|quantas|quem|onde|como est|'
    r'me diz|me fala|diga|fala a[ií]|lembra|vc sabe|você sabe|o que é|'
    r'tem alguma|existe)\b', re.I)

# Palavras que garantem plano mesmo em frase curta: tudo que escreve,
# manda, apaga ou gasta.
SEMPRE_PLANEJA = re.compile(
    r'\b(cria|criar|cri[ae]|apaga|apagar|deleta|remove|manda|mandar|envia|'
    r'enviar|publica|publicar|posta|postar|instala|instalar|baixa|baixar|'
    r'move|mover|renomeia|escreve|escrever|conserta|consertar|arruma|'
    r'corrige|corrigir|roda|rodar|executa|compra|comprar|paga|pagar)\b', re.I)


def merece_plano(pedido: str) -> bool:
    """
    Vale a pena planejar isto?

    Erra para o lado de planejar: um plano a mais custa dois segundos, um
    plano a menos custa uma ação errada que você só descobre depois.
    """
    texto = pedido.strip()
    if SEMPRE_PLANEJA.search(texto):
        return True
    if SO_CONSULTA.match(texto):
        return False
    # "e depois", "e manda", "aí você" — conjunção é sinal de dois passos.
    if re.search(r'\b(e depois|depois|em seguida|a[ií] voc[eê]|e ent[ãa]o)\b',
                 texto, re.I):
        return True
    return len(texto.split()) > 14


def fala_o_plano(p: Plano) -> str:
    """O plano dito em voz alta. Curto: ninguém ouve lista numerada longa."""
    if p.pergunta:
        return p.pergunta
    corpo = '; '.join(passo.o_que for passo in p.passos[:4])
    frase = f'{p.entendi}. Vou {corpo}'
    if len(p.passos) > 4:
        frase += f'; e mais {len(p.passos) - 4}'
    if p.risco:
        frase += f'. Atenção: {p.risco}'
    return frase + '.'


def sem_verificacao(p: Plano) -> list[Passo]:
    """
    Os passos que ele mesmo disse não saber verificar.

    Isto é informação de ouro e some se ninguém olhar: é a lista dos
    passos que vão falhar sem avisar.
    """
    return [s for s in p.passos
            if not s.como_sei.strip() or 'não sei' in s.como_sei.lower()
            or 'nao sei' in s.como_sei.lower()]
