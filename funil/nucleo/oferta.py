"""
A OFERTA — a mensagem que acompanha a prévia, e o seguimento de quem
não respondeu.

Por que ela é ESCRITA À MÃO e não gerada por modelo: porque é a mesma
mensagem toda vez, e a parte que personaliza (nome, tipo, cidade, o que
falta) é mecânica. Chamar um modelo aqui gastaria chave, demoraria e
traria o risco de ele inventar uma frase que você não quer assinar — e
quem vai aparecer na conversa é você, não ele.

O agente 2 (`a2_abordagem.py`) continua existindo e é melhor para o
contato frio, sem prévia pronta: lá o modelo tem o que fazer, porque
cada casa pede um gancho diferente. Aqui o gancho é o link.

O QUE ESTA MENSAGEM NÃO FAZ

  • não promete faturamento, posição no Google, número de clientes;
  • não inventa prazo nem escassez ("só hoje", "última vaga");
  • não finge que é o site dele no ar — diz que é demonstração;
  • dá uma saída fácil na última linha. Vendedor que não dá saída vira
    bloqueio, e bloqueio custa o número, não a venda.

Isso não é escrúpulo: é o que sobrevive à conferida. O dono vai abrir o
link no celular enquanto fala com você. Qualquer promessa que o site não
sustentar morre nos trinta segundos seguintes.
"""
from __future__ import annotations

from .estado import Lead

# A primeira mensagem, por tipo de negócio. Curta de propósito: no
# WhatsApp, mensagem longa de desconhecido é lida pela metade.
PRIMEIRA = {
    'restaurante': (
        'Oi! Tudo bem? Aqui é o {autor}.\n\n'
        'Eu faço site para restaurante e fiz uma prévia do {nome} para '
        'mostrar como ficaria — já está no ar, é só abrir:\n{link}\n\n'
        'É uma demonstração: as fotos são de banco de imagem e o cardápio '
        'é só um exemplo. Se você curtir, eu troco pelas fotos e pelos '
        'pratos de vocês.\n\n'
        'O que achou? Se não for o momento, me avisa que eu não insisto.'),
    'hotel': (
        'Oi! Tudo bem? Aqui é o {autor}.\n\n'
        'Eu faço site para pousada e hotel e montei uma prévia do {nome} '
        'para mostrar como ficaria — está no ar aqui:\n{link}\n\n'
        'É uma demonstração: as imagens são de banco livre e os detalhes '
        'são exemplo. Com as fotos de vocês e as diárias certas, fica no '
        'ponto de receber reserva direto pelo WhatsApp.\n\n'
        'Faz sentido para vocês? Se não for a hora, é só falar.'),
    'negocio': (
        'Oi! Tudo bem? Aqui é o {autor}.\n\n'
        'Eu faço site para negócio local e fiz uma prévia do {nome} para '
        'você ver como ficaria:\n{link}\n\n'
        'É uma demonstração — as fotos são de banco de imagem e os '
        'serviços são exemplo. Se gostar, eu ajusto com as suas '
        'informações e o botão já leva direto pro seu WhatsApp.\n\n'
        'O que você acha? Se não tiver interesse, me avisa sem problema.'),
}

# Os cinco toques de quem não respondeu. O espaçamento importa mais que
# o texto: seis toques em seis dias é perseguição, e perseguição faz o
# dono bloquear — e aí você perdeu o contato, não só a venda.
SEGUIMENTO = [
    {'dia': 3, 'nome': 'o lembrete curto',
     'porque': 'Mensagem de desconhecido some embaixo de vinte outras. '
               'A maioria das respostas vem no segundo toque, não no '
               'primeiro — e é só isto: uma linha, sem cobrança.',
     'texto': 'Oi! Só subindo aqui a prévia que te mandei, caso tenha '
              'passado batido:\n{link}'},
    {'dia': 7, 'nome': 'o detalhe que ele não viu',
     'porque': 'Toque novo precisa trazer coisa nova, senão é o mesmo '
               'toque mais chato. Aponte UMA coisa concreta da prévia.',
     'texto': 'Oi! Uma coisa da prévia que talvez você não tenha visto: '
              'o botão verde abre o WhatsApp de vocês já com a mensagem '
              'escrita — o cliente só aperta enviar, sem salvar número '
              'nem digitar nada.\n{link}'},
    {'dia': 14, 'nome': 'a pergunta que não é sobre o site',
     'porque': 'Quem não respondeu duas vezes não vai responder à '
               'terceira oferta. Vai responder a uma PERGUNTA — e a '
               'resposta dele te diz se vale continuar.',
     'texto': 'Oi! Posso te perguntar uma coisa rápida? Hoje o pessoal '
              'te acha mais pelo Instagram, pelo iFood ou no boca a '
              'boca mesmo? Pergunto porque muda o que eu te sugeriria.'},
    {'dia': 25, 'nome': 'a prova de que funciona',
     'porque': 'Aqui entra a única prova que vale: outro negócio igual '
               'ao dele que já está com o site no ar. Sem isso, pule '
               'este toque — inventar caso de sucesso é o fim da linha.',
     'texto': 'Oi! Montei um site parecido para outro {tipo_min} daqui '
              'e o resultado ficou bom. Se quiser ver como ficou o seu '
              'depois de pronto, a prévia continua aqui:\n{link}'},
    {'dia': 35, 'nome': 'a porta que fecha (de verdade)',
     'porque': 'Último toque. Ele encerra a conversa de forma limpa e, '
               'na prática, é o que mais recupera gente: tirar a '
               'cobrança devolve a liberdade de responder. Se você '
               'disser que vai parar, PARE — voltar depois disso é o '
               'que faz bloquear.',
     'texto': 'Oi! Vou parar de te incomodar com isso, prometo. Deixo a '
              'prévia no ar por mais uns dias caso queira mostrar para '
              'alguém:\n{link}\n\nSe um dia fizer sentido, é só me '
              'chamar. Sucesso aí!'},
]


def primeira(lead: Lead, link: str, autor: str, modelo: str = '',
             pendencias: list[str] | None = None) -> str:
    """A mensagem do primeiro contato, com o link da prévia dentro."""
    base = PRIMEIRA.get(modelo or _modelo_de(lead), PRIMEIRA['negocio'])
    texto = base.format(autor=autor, nome=lead.nome, link=link)
    # O que faltou na planilha vira pergunta, não vira buraco no site.
    # Perguntar pelo horário é um pedido de informação, e pedido de
    # informação é a pergunta mais fácil de responder que existe.
    if pendencias:
        texto += ('\n\nAh: me passa ' + _lista(pendencias)
                  + ' que eu já coloco na prévia.')
    return texto


def seguinte(lead: Lead, link: str, passo: int, modelo: str = '') -> dict:
    """O toque número N (1 a 5) para quem não respondeu."""
    if not 1 <= passo <= len(SEGUIMENTO):
        raise ValueError(f'o seguimento vai de 1 a {len(SEGUIMENTO)}')
    s = dict(SEGUIMENTO[passo - 1])
    s['texto'] = s['texto'].format(
        link=link, nome=lead.nome,
        tipo_min=(lead.categoria or 'negócio').lower())
    return s


def _modelo_de(lead: Lead) -> str:
    dados = lead.dados or {}
    return dados.get('modelo') or 'negocio'


def _lista(xs: list[str]) -> str:
    curtas = [x.split('(')[0].strip() for x in xs]
    if len(curtas) == 1:
        return curtas[0]
    return ', '.join(curtas[:-1]) + ' e ' + curtas[-1]
