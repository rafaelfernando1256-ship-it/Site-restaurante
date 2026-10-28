"""
O ATENDENTE — quem conversa com quem escreveu para você

A triagem antiga respondia uma pergunta só: "ele quer ver o exemplo?".
Servia até o link ser entregue. Depois disso a conversa continuava — "gostei,
quanto fica?", "fechado, como pago?", "tira a lasanha do cardápio" — e
ninguém lia. O atendente lê TUDO que chega de quem já está no funil, em
qualquer estado, e decide o que fazer com cada mensagem:

  quer_demo        constrói o exemplo (se ainda não existe — se existe, não
                   constrói de novo: ele já viu)
  pergunta_preco   responde com o SEU preço do nicho, lido da central
  quer_fechar      avisa você, e o lead vai para "negociando"
  alteracao        anota o pedido e manda para o estúdio fazer
  sem_interesse    agradece e para
  outro            responde, se souber; se não souber, passa para você

O QUE ELE NÃO FAZ

**Não inventa preço.** O preço sai de `dados/precos.json`, que você
preenche na central. Nicho sem preço configurado = a conversa vem para
você, com aviso dizendo qual nicho falta precificar. E se o modelo
escrever um "R$" que não é o seu, a resposta é trocada pela frase pronta,
em código, antes de sair.

**Não decide o que não entendeu.** Certeza abaixo de 0,7 fica parada e
vira aviso para você.

**Não manda link que não existe.** O único link que pode sair é o do site
dele. Qualquer outro endereço na resposta derruba a frase inteira.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

from .a3_estudio import tira_buracos
from .estado import (ABORDADO, DEMO_PRONTA, Estado, FECHADO, Lead, NEGOCIANDO,
                     PUBLICADO, QUER_DEMO, RESPONDEU, SEM_INTERESSE, SEM_RESPOSTA,
                     TRANSICOES)
from .modelo import pede_json
from .precos import Precos, nicho_do_lead

AGENTE = 'atendente'

INTENCOES = ('quer_demo', 'pergunta_preco', 'quer_fechar', 'alteracao',
             'sem_interesse', 'outro')

# Quem ele lê: todo mundo que já falou com você. Fica de fora só quem
# nunca recebeu nada (novo, rascunho) e quem você tirou do funil.
CONVERSANDO = [ABORDADO, SEM_RESPOSTA, RESPONDEU, QUER_DEMO, DEMO_PRONTA,
               PUBLICADO, NEGOCIANDO, FECHADO, SEM_INTERESSE]

# O que é mensagem SUA (saiu de você para ele). Usado para saber se a
# última palavra da conversa é dele — aí é a vez do atendente.
SAIDAS = ('abordagem', 'entrega', 'resposta', 'alteracao')


class Atendimento(BaseModel):
    intencao: str = Field(description='Uma de: ' + ', '.join(INTENCOES))
    certeza: float = Field(description='0 a 1. Abaixo de 0,7 vai para o humano.')
    leitura: str = Field(description='Em uma linha, o que a pessoa quis dizer.')
    resposta: str = Field(description='O que responder no WhatsApp, curto, no tom dela. '
                                      'Vazio se não for para responder.')
    pedido: str = Field(default='', description='Só em "alteracao": o que mudar no site, '
                                                'claro o bastante para um programador fazer.')
    pedido_completo: bool = Field(default=False, description='Só em "alteracao": true se '
                                  'dá para fazer sem perguntar mais nada.')
    nao_contatar: bool = Field(default=False, description='True se pediu para não ser '
                                                          'mais contatado.')
    precisa_de_voce: bool = Field(default=False, description='True se a pergunta pede algo '
                                  'que não está nos fatos que te dei.')


INSTRUCAO = """Você atende, pelo WhatsApp, os clientes de um desenvolvedor \
que faz sites para pequenos negócios. Você recebe a conversa inteira e a \
mensagem nova, e decide UMA intenção:

- quer_demo: aceitou ver um site de exemplo, ou demonstrou interesse \
("pode mandar", "como funciona?", "tenho interesse").
- pergunta_preco: perguntou quanto custa, valor, mensalidade, forma de pagamento.
- quer_fechar: decidiu contratar ("fechado", "vamos fazer", "como pago?", \
"pode fazer o meu").
- alteracao: quer mudar algo no site que JÁ TEM (cardápio, preço de prato, \
foto, horário, telefone, texto, cor).
- sem_interesse: não quer, já tem site, pediu para parar.
- outro: qualquer outra coisa (saudação, pergunta solta, agradecimento).

COMO RESPONDER
- No máximo 3 linhas, português do Brasil falado, no tom dela. Sem \
"atenciosamente", sem emoji em excesso, sem jargão técnico.
- Use SÓ os fatos que eu te dou. Preço: copie o texto de preço exatamente \
como veio, sem arredondar, sem desconto, sem parcelamento que não está lá. \
Se não veio preço, NÃO fale número nenhum.
- Link: o único link que existe é o do site dele, se eu passar. Nunca escreva \
"[link]", "segue o link" sem o link, nem endereço inventado.
- Se a pessoa pediu para parar: só uma desculpa curta, nao_contatar = true, \
e nada de nova tentativa.
- Se a pergunta pede algo que você não sabe pelos fatos (prazo exato, domínio \
próprio, nota fiscal...), responda que vai confirmar e já volta, e marque \
precisa_de_voce = true.

ALTERAÇÃO
- Escreva em `pedido` o que mudar, completo e sem ambiguidade, juntando o \
que ela disse nas últimas mensagens ("Trocar o preço do X-Tudo de R$ 25 para \
R$ 28 na seção do cardápio").
- pedido_completo = false se faltar informação para fazer (ex.: "quero mudar o \
cardápio" sem dizer o quê). Aí a resposta PERGUNTA o que mudar.
- pedido_completo = true quando dá para fazer. Aí a resposta diz que vai fazer \
e avisa quando estiver no ar — sem prometer prazo em horas.
- Se ela mandou foto ("[mídia]") com o pedido, diga no `pedido` que a foto \
foi mandada no WhatsApp.

Se estiver em dúvida entre duas intenções, ponha certeza baixa."""


def pendentes(est: Estado, lead_id: int) -> list:
    """
    As mensagens dele que ainda não tiveram resposta: os retornos em
    rascunho que chegaram DEPOIS da última mensagem sua.
    """
    msgs = est.mensagens(lead_id=lead_id)
    ultima_saida = max((m['id'] for m in msgs
                        if m['tipo'] in SAIDAS and m['situacao'] == 'enviada'),
                       default=0)
    return [m for m in msgs if m['tipo'] == 'retorno' and m['situacao'] == 'rascunho'
            and m['id'] > ultima_saida]


def conversa(est: Estado, lead_id: int, ate: int = 12) -> str:
    linhas = []
    for m in est.mensagens(lead_id=lead_id)[-ate:]:
        if m['tipo'] == 'retorno':
            quem = 'ELE'
        elif m['situacao'] == 'enviada':
            quem = 'VOCÊ'
        else:
            continue          # rascunho que nunca saiu não é conversa
        linhas.append(f'{quem}: {m["texto"]}')
    return '\n'.join(linhas) or '(nenhuma mensagem registrada)'


def fatos(lead: Lead, est: Estado, precos: Precos) -> tuple[str, str, str]:
    """(fatos para o modelo, texto do preço, url do site)."""
    nicho = nicho_do_lead(lead)
    preco = precos.texto(nicho) if nicho else ''
    d = est.demo(lead.id)
    url = (d['url'] if d and d['url'] else '')
    cliente = lead.estado == FECHADO
    linhas = [
        f'Negócio: {lead.nome} ({lead.cidade or "cidade não informada"})',
        f'Nicho: {nicho or "(não sei)"}',
        f'Situação: {"JÁ É CLIENTE — o site é dele" if cliente else lead.estado}',
        f'Site dele: {url}' if url else 'Site dele: ainda não existe',
        f'Preço: {preco}' if preco else 'Preço: NÃO CONFIGURADO — não fale número',
    ]
    return '\n'.join(linhas), preco, url


VALOR = re.compile(r'R\$\s*\d[\d.]*(?:,\d{2})?')
ENDERECO = re.compile(r'https?://\S+|www\.\S+|\b[\w-]+\.netlify\.app\S*', re.I)


def confere_resposta(texto: str, preco: str, url: str) -> tuple[str, list[str]]:
    """
    O que não pode sair, conferido em código — pedir ao modelo não basta,
    e a resposta sai sozinha pela vigia. Devolve (texto, o que foi tirado).
    """
    tirado = []
    texto = tira_buracos(texto or '')
    frases = re.split(r'(?<=[.!?])\s+', texto.strip())
    boas = []
    for f in frases:
        for v in VALOR.findall(f):
            if not preco or v.replace(' ', '') not in preco.replace(' ', ''):
                tirado.append(f'valor que não é o seu: {v}')
                f = ''
                break
        if f:
            for e in ENDERECO.findall(f):
                limpo = e.rstrip('.,;:!?)')
                if not url or limpo.rstrip('/') != url.rstrip('/'):
                    tirado.append(f'link que não existe: {limpo}')
                    f = ''
                    break
        if f.strip():
            boas.append(f.strip())
    return ' '.join(boas).strip(), tirado


def _move(est: Estado, lead: Lead, para: str, detalhe: str) -> bool:
    """Anda se a transição existe; se não existe, fica onde está."""
    atual = est.lead(lead.id).estado
    if atual == para:
        return True
    if para in TRANSICOES.get(atual, set()):
        est.move(lead.id, para, AGENTE, detalhe[:200])
        return True
    return False


def atende(est: Estado, cfg, limite: int = 20, cli: Any = None,
           certeza_minima: float = 0.7) -> dict[str, int]:
    """Lê quem tem mensagem sem resposta e decide o que fazer com cada um."""
    precos = Precos(Path(cfg.banco).parent / 'precos.json')
    conta = {i: 0 for i in INTENCOES}
    conta.update({'duvida': 0, 'falhas': 0, 'pedidos': 0})
    feitos = 0
    for lead in est.leads(CONVERSANDO, limite=500):
        if feitos >= limite:
            break
        novas = pendentes(est, lead.id)
        if not novas:
            continue
        feitos += 1
        texto_fatos, preco, url = fatos(lead, est, precos)
        try:
            r: Atendimento = pede_json(
                instrucao=INSTRUCAO,
                conteudo=(f'FATOS\n{texto_fatos}\n\nCONVERSA ATÉ AGORA\n'
                          f'{conversa(est, lead.id)}\n\nMENSAGEM NOVA DELE\n'
                          + '\n'.join(m['texto'] for m in novas)),
                esquema=Atendimento, modelo=cfg.modelo_do_cerebro,
                cli=cli or (cfg.chave_do_dialeto or None), provedor=cfg.provedor)
        except Exception as e:
            conta['falhas'] += 1
            est.anota(AGENTE, 'erro', lead.id, str(e)[:300])
            print(f'  ✗ {lead.nome}: {e}')
            continue

        intencao = r.intencao.strip().lower() if r.intencao else 'outro'
        if intencao not in INTENCOES:
            intencao = 'outro'

        def fecha(situacao='lida'):
            for m in novas:
                est.marca_mensagem(m['id'], situacao)

        if r.certeza < certeza_minima:
            conta['duvida'] += 1
            fecha('duvida')
            est.avisa('duvida', f'{r.leitura} (certeza {r.certeza:.2f}) — '
                      f'"{novas[-1]["texto"][:160]}"', lead.id)
            print(f'  ? {lead.nome}: {r.leitura} — decida você')
            continue

        if intencao == 'pergunta_preco' and not preco:
            fecha('sem_preco')
            est.avisa('sem_preco', f'perguntou o preço e o nicho "{nicho_do_lead(lead) or "?"}" '
                      'não tem preço na central. Configure e ele responde sozinho.',
                      lead.id)
            print(f'  $ {lead.nome}: perguntou preço, e o nicho não tem preço configurado')
            continue

        resposta, tirado = confere_resposta(r.resposta, preco, url)
        if tirado:
            est.anota(AGENTE, 'resposta_conferida', lead.id, '; '.join(tirado)[:300])
            if intencao == 'pergunta_preco' and preco:
                resposta = f'Fica {preco}. Quer que eu te explique o que entra?'

        demo = est.demo(lead.id)
        tem_site = bool(demo and demo['url'])

        if intencao in ('quer_demo', 'pergunta_preco') and not tem_site:
            # Perguntar preço sem ter visto nada também é interesse: o
            # exemplo é o que transforma número em decisão.
            _move(est, lead, RESPONDEU, r.leitura)
            _move(est, lead, QUER_DEMO, r.leitura)
        elif intencao in ('quer_demo', 'pergunta_preco', 'quer_fechar') and tem_site:
            if lead.estado != FECHADO:
                _move(est, lead, RESPONDEU, r.leitura)
                _move(est, lead, NEGOCIANDO, r.leitura)

        if intencao == 'quer_fechar':
            est.avisa('fechar', f'quer fechar: "{novas[-1]["texto"][:160]}"', lead.id)
            if not tem_site:
                _move(est, lead, RESPONDEU, r.leitura)
                _move(est, lead, NEGOCIANDO, r.leitura)

        if intencao == 'alteracao':
            if not tem_site:
                est.avisa('alteracao_sem_site', f'pediu alteração, mas não achei o site '
                          f'dele no funil: "{r.pedido or novas[-1]["texto"]}"', lead.id)
            elif r.pedido_completo and r.pedido.strip():
                pid = est.guarda_pedido(lead.id, r.pedido)
                conta['pedidos'] += 1
                if any('[mídia]' in m['texto'] for m in novas):
                    est.avisa('foto', f'pedido #{pid} veio com foto no WhatsApp. Se a '
                              'foto for necessária, salve em material/'
                              f'{lead.slug}/alteracao-{pid}/', lead.id)
                print(f'  ✎ {lead.nome}: pedido #{pid} — {r.pedido[:90]}')

        if intencao == 'sem_interesse':
            _move(est, lead, RESPONDEU, r.leitura)
            _move(est, lead, SEM_INTERESSE, r.leitura)
        if r.nao_contatar:
            est.muda_dados(lead.id, nao_contatar=True)
        if r.precisa_de_voce:
            est.avisa('pergunta', f'{r.leitura} — "{novas[-1]["texto"][:160]}"', lead.id)

        fecha()
        conta[intencao] += 1
        if resposta:
            est.guarda_mensagem(lead.id, 'resposta', resposta)
        print(f'  ↪ {lead.nome}: {intencao} — {r.leitura}')
    return conta


def libera_sem_preco(est: Estado) -> int:
    """Você configurou um preço: quem perguntou volta para a fila."""
    n = 0
    for m in est.mensagens(situacao='sem_preco', tipo='retorno'):
        est.marca_mensagem(m['id'], 'rascunho')
        n += 1
    for a in est.avisos():
        if a['tipo'] == 'sem_preco':
            est.resolve_aviso(a['id'])
    return n
