"""
AGENTE 2 — ABORDAGEM
Lê o que o caçador achou, escreve a primeira mensagem e envia.

POR QUE O ENVIO PASSA POR VOCÊ (e por que isso é engenharia, não medo)

Disparo automático de WhatsApp para quem nunca pediu contato é o jeito
mais rápido de perder o número que você usa para vender:

  • Biblioteca não oficial (Baileys, whatsapp-web.js) é proibida nos
    Termos e é o gatilho nº 1 de banimento. O número vai junto.
  • A Cloud API oficial exige conta Business verificada e, no PRIMEIRO
    contato, um TEMPLATE APROVADO. Texto livre só vale na janela de 24h
    depois de o cliente falar primeiro.
  • LGPD: o WhatsApp de restaurante pequeno quase sempre é o celular
    pessoal do dono. Isso é dado pessoal, não dado de empresa.

Então o padrão é `link`: o agente escreve, você abre a lista, lê e
clica. São uns três segundos por lead, e o número continua vivo.

O modo `cloud` existe, implementado contra a API oficial com template,
e sai desligado. Ligar é decisão sua, com conta aprovada.
"""
from __future__ import annotations

import os
import time
import urllib.parse
from typing import Any

from pydantic import BaseModel, Field

from .modelo import AGENTE_HTTP, pede_json
from .estado import Estado, Lead, NOVO, RASCUNHO, ABORDADO

AGENTE = 'a2_abordagem'


class Abordagem(BaseModel):
    """O que o modelo precisa devolver. Validado por esquema, não por fé."""
    gancho: str = Field(description='A primeira frase. É ela que decide se ele lê o resto.')
    mensagem: str = Field(description='A mensagem inteira, pronta para enviar no WhatsApp.')
    porque: str = Field(description='Em uma linha, por que esta abordagem para ESTE lead.')


INSTRUCAO = """Você escreve a primeira mensagem de WhatsApp de um desenvolvedor solo \
brasileiro que faz site para restaurante. Ele manda a mensagem para o dono, \
na mão, uma por vez.

O QUE NÃO PODE, de jeito nenhum:
- Nada de "Olá, tudo bem? Me chamo..." — é a abertura que mais faz bloquear.
- Nada de promessa que você não pode provar: nada de "aumento de 30% nas vendas", \
nada de "centenas de clientes", nada de número inventado.
- Nada de pressão, urgência falsa, "última vaga", "promoção só hoje".
- Nada de elogio genérico ("vi que vocês fazem um trabalho incrível").

O QUE FUNCIONA:
- Diga em uma frase que você viu o negócio dele e O QUE especificamente notou. \
Use o dado real que te passaram: a quantidade de avaliações, a nota, \
o fato de o link do Google levar para o Instagram, ou de não levar para lugar nenhum.
- Ofereça o exemplo PRONTO e de graça, sem compromisso. É a oferta, não um gancho.
- Termine com uma pergunta curta de sim ou não. Pergunta fácil é a que é respondida.
- No máximo 4 linhas. Português do Brasil falado, sem jargão de marketing \
e sem jargão de programador.
- Trate por "você". Nada de "prezado" nem de "sr.".

Responda só com o JSON pedido."""


# Os tons que a colônia faz variar entre organismos. Nenhum deles afrouxa
# as regras acima: mudam o jeito de abrir a conversa, não o que pode ser
# prometido. É o eixo mais barato de testar — mesma lista de leads, mesma
# oferta, e você descobre qual abertura faz o dono responder.
TONS = {
    'direto': 'TOM: vá ao ponto na primeira linha. Diga o que você viu e o que '
              'você fez, sem rodeio e sem aquecimento.',
    'curioso': 'TOM: abra com uma pergunta curta sobre o negócio dele — algo que '
               'só quem olhou o perfil saberia perguntar.',
    'prestativo': 'TOM: abra pelo que já está pronto e de graça para ele, antes '
                  'de falar de você.',
    'numerico': 'TOM: abra pelo número real que te passaram (quantidade de '
                'avaliações, nota) e o que ele significa. Nenhum número que '
                'não esteja nos dados.',
}


def instrucao_com_tom(tom: str = '') -> str:
    """A instrução base mais a linha do tom, quando a colônia pede um."""
    extra = TONS.get(tom, '')
    return f'{INSTRUCAO}\n\n{extra}' if extra else INSTRUCAO


def _contexto(l: Lead) -> str:
    notas = [f'Nome: {l.nome}', f'Cidade: {l.cidade}']
    if l.categoria:
        notas.append(f'Tipo: {l.categoria}')
    if l.avaliacoes:
        notas.append(f'Avaliações no Google: {l.avaliacoes}'
                     + (f' · nota {l.nota:.1f}' if l.nota else ''))
    rotulo = {
        'sem_presenca': 'No Google NÃO existe nenhum link de site. Quem procura não acha nada.',
        'so_rede': f'O "site" no Google é a rede social dele ({l.url_achada}). '
                   'Ou seja: tem público e tem foto, mas não tem onde cair quem busca no Google.',
        'so_delivery': f'O "site" no Google é um app de delivery ({l.url_achada}). '
                       'Ele paga comissão para ter presença.',
    }.get(l.presenca, '')
    if rotulo:
        notas.append(rotulo)
    if l.instagram:
        notas.append(f'Instagram: @{l.instagram}')
    return '\n'.join(notas)


def escreve(est: Estado, limite: int = 20, modelo: str | None = None,
            cidade: str = '', cli: Any = None,
            provedor: str = 'claude', chave: str = '',
            tom: str = '', organismo: str = '',
            antes_de_cada=None) -> dict[str, int]:
    """
    Pega leads NOVO, escreve a abordagem e deixa em RASCUNHO.

    `antes_de_cada` existe para a colônia: ela cobra a carteira ANTES de
    o lead ser trabalhado, e desiste do resto do lote se o organismo não
    tem com que pagar. Cobrar depois gastaria o que não existe.
    """
    conta = {'escritos': 0, 'falhas': 0}
    # A chave só aparece quando a colônia está dirigindo: o funil sozinho
    # continua devolvendo o mesmo dicionário de sempre.
    if antes_de_cada is not None:
        conta['sem_recurso'] = 0
    for l in est.leads(NOVO, limite=limite, cidade=cidade, organismo=organismo):
        if antes_de_cada is not None and not antes_de_cada(l):
            conta['sem_recurso'] += 1
            break
        try:
            r: Abordagem = pede_json(
                instrucao=instrucao_com_tom(tom),
                conteudo=f'Dados do restaurante:\n\n{_contexto(l)}',
                esquema=Abordagem,
                modelo=modelo,
                cli=cli or (chave or None),
                provedor=provedor,
            )
            est.guarda_mensagem(l.id, 'abordagem', r.mensagem.strip())
            est.move(l.id, RASCUNHO, AGENTE, r.porque[:200])
            conta['escritos'] += 1
            print(f'  ✓ {l.nome} — "{r.gancho[:60]}"')
        except Exception as e:
            conta['falhas'] += 1
            est.anota(AGENTE, 'erro', l.id, str(e)[:300])
            print(f'  ✗ {l.nome}: {e}')
    return conta


# ── Envio ────────────────────────────────────────────────────────────
def link_whats(telefone_e164: str, texto: str) -> str:
    return f'https://wa.me/{telefone_e164}?text={urllib.parse.quote(texto)}'


def _envia_cloud(telefone_e164: str, texto: str) -> tuple[bool, str]:
    """
    Cloud API oficial. Só funciona dentro da janela de 24 horas depois
    de o cliente ter falado com você; para o PRIMEIRO contato é preciso
    um template aprovado pela Meta — e aí o texto livre que o agente
    escreveu não serve, o template é que manda.
    """
    import json
    import urllib.request

    token = os.environ.get('WHATSAPP_TOKEN')
    numero = os.environ.get('WHATSAPP_PHONE_ID')
    if not token or not numero:
        return False, 'WHATSAPP_TOKEN ou WHATSAPP_PHONE_ID não definidos'
    req = urllib.request.Request(
        f'https://graph.facebook.com/v21.0/{numero}/messages',
        data=json.dumps({
            'messaging_product': 'whatsapp',
            'to': telefone_e164,
            'type': 'text',
            'text': {'body': texto},
        }).encode(),
        headers={'Authorization': f'Bearer {token}',
                 'Content-Type': 'application/json',
                 'User-Agent': AGENTE_HTTP},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return True, str(json.loads(r.read()).get('messages', [{}])[0].get('id', ''))
    except Exception as e:
        detalhe = getattr(e, 'read', lambda: b'')().decode()[:300] or str(e)
        return False, detalhe


def envia(est: Estado, canal: str = 'link', limite: int = 50,
          pausa: float = 0.0) -> dict[str, Any]:
    """
    Envia as mensagens APROVADAS. No canal `link` não dispara nada:
    imprime a lista para você clicar — que é o padrão, e por quê está
    explicado no topo deste arquivo.
    """
    conta = {'enviadas': 0, 'falhas': 0, 'links': []}
    aprovadas = [m for m in est.mensagens(situacao='aprovada', tipo='abordagem')][:limite]
    for m in aprovadas:
        if not m['telefone_e164']:
            est.marca_mensagem(m['id'], 'recusada', canal, 'lead sem telefone')
            conta['falhas'] += 1
            continue

        if canal == 'link':
            conta['links'].append({
                'lead': m['lead_nome'],
                'cidade': m['cidade'],
                'url': link_whats(m['telefone_e164'], m['texto']),
                'msg_id': m['id'],
                'lead_id': m['lead_id'],
            })
            continue

        ok, detalhe = _envia_cloud(m['telefone_e164'], m['texto'])
        if ok:
            est.marca_mensagem(m['id'], 'enviada', canal)
            est.move(m['lead_id'], ABORDADO, AGENTE, f'cloud · {detalhe}')
            conta['enviadas'] += 1
        else:
            est.marca_mensagem(m['id'], 'aprovada', canal, detalhe)
            conta['falhas'] += 1
            print(f'  ✗ {m["lead_nome"]}: {detalhe}')
        if pausa:
            time.sleep(pausa)
    return conta


def marca_enviada(est: Estado, msg_id: int, lead_id: int) -> None:
    """Você clicou no link e mandou. Confirma aqui para o funil andar."""
    est.marca_mensagem(msg_id, 'enviada', 'link')
    est.move(lead_id, ABORDADO, AGENTE, 'enviada à mão pelo link')
