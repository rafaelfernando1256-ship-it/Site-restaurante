"""
O TURNO — o que um organismo faz enquanto está vivo.

A colônia é o caixa e o juiz; o trabalho em si é o funil que já existe.
Um turno é uma volta completa de um organismo pelos quatro agentes, com a
carteira sendo debitada antes de cada passo:

  1. CAÇA    paga a busca, procura na SUA cidade com os SEUS termos, e
             marca cada lead achado com o seu id.
  2. ABORDA  gasta um toque por lead e escreve a abordagem no SEU tom.
             Não envia: enfileira para você clicar.
  3. TRIA    lê quem respondeu e classifica.
  4. ENTREGA constrói a demonstração de quem quer e publica.

A ordem de cobrança é sempre a mesma: cobra, depois age. Agir e cobrar
depois é como se escreve um saldo negativo sem perceber — e aqui o saldo
negativo seria um organismo trabalhando de graça, que é exatamente o que
a colônia existe para não deixar acontecer.

QUANDO O ORGANISMO PARA

`SemDinheiro` não é tratado como erro para tentar de novo: é o fim do
turno dele. Quem não pode pagar não insiste, e `ceifa()` recolhe no fim
da volta. Insistir aqui seria gastar o teto da colônia num organismo que
já está falido.
"""
from __future__ import annotations

from typing import Any

from .colonia import Colonia, Organismo, SemDinheiro, dinheiro
from .estado import NOVO, QUER_DEMO, RESPONDEU


def caca(col: Colonia, o: Organismo, est: Any, cfg: Any,
         paginas: int = 1, minimo: int = 4) -> dict[str, int]:
    """
    Paga a busca e procura. Cada lead sai marcado com o id do organismo.

    NÃO busca sem ter toque sobrando para gastar no que achar. Não é
    economia de estimação: a busca é a única operação aqui que custa
    dinheiro de verdade, e lead que ele nunca vai poder abordar é cota da
    Places queimada por nada. Na primeira simulação um organismo juntou
    240 leads com zero toques na mão, pagando por cada busca.
    """
    from . import a1_cacador
    from .estado import NOVO
    conta = {'achados': 0, 'novos': 0, 'pulou': ''}
    if o.toques <= 0:
        conta['pulou'] = 'sem toques — achar quem não pode abordar é gasto puro'
        return conta
    fila = len(est.leads(NOVO, organismo=o.id, limite=1000))
    if fila >= o.toques:
        conta['pulou'] = (f'{fila} leads na fila e só {o.toques} toques — '
                          'buscar mais é pagar por fila')
        return conta
    for termo in o.termos:
        try:
            col.cobra(o.id, 'busca', vezes=paginas)
        except SemDinheiro as e:
            print(f'    {o.id} parou de buscar: {e}')
            break
        c = a1_cacador.caca(est, cfg.google_places, o.cidade, [termo],
                            paginas=paginas, minimo=minimo,
                            marca={'organismo': o.id, 'tom': o.tom})
        conta['achados'] += c['achados']
        conta['novos'] += c['novos']
    o.leads += conta['novos']
    return conta


def aborda(col: Colonia, o: Organismo, est: Any, cfg: Any,
           limite: int = 10, cli: Any = None) -> dict[str, int]:
    """
    Escreve as abordagens dos leads DESTE organismo, no tom dele.

    Cada lead custa um toque e o preço da abordagem. O toque é cobrado
    aqui, e não na hora de enviar, de propósito: é a reserva que decide
    quantas portas ele pode te pedir para bater, e decidir isso depois de
    o texto estar escrito seria decidir tarde.
    """
    from . import a2_abordagem

    def antes(_lead) -> bool:
        try:
            col.toca(o.id)
            col.cobra(o.id, 'abordagem')
            return True
        except SemDinheiro as e:
            print(f'    {o.id} parou de abordar: {e}')
            return False

    return a2_abordagem.escreve(
        est, limite=limite, modelo=cfg.modelo_do_cerebro, cli=cli,
        provedor=cfg.provedor, chave=cfg.chave_do_dialeto,
        tom=o.tom, organismo=o.id, antes_de_cada=antes)


def tria(col: Colonia, o: Organismo, est: Any, cfg: Any,
         limite: int = 10, cli: Any = None) -> dict[str, int]:
    """Lê quem respondeu a ESTE organismo."""
    from .a3_estudio import tria as tria_agente
    quantos = len(est.leads(RESPONDEU, limite=limite, organismo=o.id))
    if not quantos:
        return {'quer': 0, 'nao_quer': 0, 'duvida': 0, 'falhas': 0}
    try:
        col.cobra(o.id, 'triagem', vezes=quantos)
    except SemDinheiro as e:
        print(f'    {o.id} não triou: {e}')
        return {'quer': 0, 'nao_quer': 0, 'duvida': 0, 'falhas': 0}
    return tria_agente(est, limite=limite, modelo=cfg.modelo_do_cerebro,
                       cli=cli, provedor=cfg.provedor,
                       chave=cfg.chave_do_dialeto)


def turno(col: Colonia, o: Organismo, est: Any, cfg: Any,
          paginas: int = 1, limite: int = 10, cli: Any = None,
          so_leitura: bool = False) -> dict[str, Any]:
    """
    Uma volta de vida. `so_leitura` não gasta nem toca na rede — é o modo
    de olhar a colônia sem mexer nela.
    """
    relato: dict[str, Any] = {'organismo': o.id, 'turno': {}}
    if so_leitura:
        relato['turno'] = {'seco': True,
                           'leads_novos': len(est.leads(NOVO, organismo=o.id)),
                           'querem': len(est.leads(QUER_DEMO, organismo=o.id))}
        return relato
    if not o.vivo:
        relato['turno'] = {'morto': o.causa}
        return relato

    print(f'  {o.id} · {o.cidade} · {o.tom} · '
          f'carteira {dinheiro(o.carteira)} · {o.toques} toques')
    relato['turno']['caca'] = caca(col, o, est, cfg, paginas=paginas)
    if relato['turno']['caca'].get('pulou'):
        print(f'    não buscou: {relato["turno"]["caca"]["pulou"]}')
    relato['turno']['aborda'] = aborda(col, o, est, cfg, limite=limite, cli=cli)
    relato['turno']['tria'] = tria(col, o, est, cfg, limite=limite, cli=cli)
    return relato


def volta(col: Colonia, est: Any, cfg: Any, paginas: int = 1,
          limite: int = 10, cli: Any = None,
          sorteio=None) -> dict[str, Any]:
    """
    Um turno para cada vivo, depois a ceifa, depois a reprodução.

    A ordem importa. Ceifar antes de reproduzir evita que um organismo que
    acabou de falir gere um filho no mesmo instante; reproduzir por último
    garante que o filho nasce num mundo onde o teto de vivos já considerou
    quem morreu nesta volta.
    """
    saida: dict[str, Any] = {'turnos': [], 'mortos': [], 'nasceram': []}
    for o in list(col.vivos()):
        saida['turnos'].append(turno(col, o, est, cfg, paginas=paginas,
                                     limite=limite, cli=cli))

    for morto in col.ceifa():
        print(f'  † {morto.id} morreu: {morto.causa}')
        saida['mortos'].append(morto.id)

    cidades = sorted({o.cidade for o in col.bichos.values() if o.cidade}
                     | ({cfg.cidade} if cfg.cidade else set()))
    for o in list(col.vivos()):
        filho = col.reproduz(o.id, cidades, sorteio)
        if filho:
            print(f'  ✚ {o.id} gerou {filho.id} · {filho.cidade} · '
                  f'{filho.tom} · {dinheiro(filho.preco)}')
            saida['nasceram'].append(filho.id)
    col.salva()
    return saida
