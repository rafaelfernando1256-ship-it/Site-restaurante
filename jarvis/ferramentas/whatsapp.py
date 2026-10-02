"""
O WHATSAPP

Lê as suas conversas, procura, manda mensagem que você ditou e extrai o
faturamento do dia dos comprovantes que chegam.

> **O risco, escrito, porque você pediu assim.** Automatizar o WhatsApp
> pessoal é contra os Termos da Meta. O número pode ser banido, e quando
> é, é o seu número — o mesmo que você usa para vender. Eu te avisei,
> você decidiu, e está implementado. O que eu fiz para reduzir o risco,
> dentro da sua decisão:
>
> • **não uso Baileys nem whatsapp-web.js.** Essas bibliotecas falam o
>   protocolo por fora, com impressão digital de cliente estranho — é o
>   que a Meta detecta primeiro. Aqui é o **seu próprio WhatsApp Web**,
>   num Chrome de verdade, com a sua sessão. Do lado do servidor, é
>   indistinguível de você usando o computador;
> • **leitura é o padrão, envio é exceção**: mandar mensagem é nível
>   PERIGO e exige confirmação digitada, nunca só a voz;
> • **nada de disparo em lista.** Uma mensagem por vez, ditada por você.
>
> Se um dia quiser o caminho sem risco, é a API oficial do WhatsApp
> Business — e aí é trocar este arquivo, não o Jarvis inteiro.

Sobre os seletores: o WhatsApp Web muda o HTML sem avisar. Por isso cada
coisa é procurada por VÁRIOS caminhos, e o último recurso é ler o texto
da tela. Se um dia parar de achar a lista de conversas, é aqui que se
mexe, e só aqui.
"""
from __future__ import annotations

import re
import time
from datetime import datetime

from pydantic import BaseModel, Field

from nucleo.config import DADOS
from nucleo.modelos import pede_json
from nucleo.permissao import LIVRE, PERIGO
from nucleo.vendas import Caixa, centavos, inicio_do_dia, reais
from . import Contexto, ferramenta
from .navegador import _nav

ENDERECO = 'https://web.whatsapp.com/'

PAINEL = ['#pane-side', 'div[data-testid="chat-list"]', 'div[aria-label*="Lista de conversas"]']
BUSCA = ['div[contenteditable="true"][data-tab="3"]',
         'div[title="Caixa de pesquisa"]', 'p.selectable-text[contenteditable="true"]']
ESCRITA = ['div[contenteditable="true"][data-tab="10"]',
           'div[contenteditable="true"][data-tab="6"]',
           'footer div[contenteditable="true"]']


def _caixa(ctx: Contexto) -> Caixa:
    c = ctx.partilha.get('caixa')
    if c is None:
        c = Caixa(DADOS / 'vendas.db')
        ctx.partilha['caixa'] = c
    return c


def _primeiro(p, seletores: list[str], tempo: int = 8000):
    for s in seletores:
        try:
            alvo = p.locator(s).first
            alvo.wait_for(state='visible', timeout=tempo)
            return alvo
        except Exception:
            continue
    return None


def _abre(ctx: Contexto):
    """Devolve a aba do WhatsApp Web, abrindo se precisar. None = não logado."""
    n = _nav(ctx)
    aba = next((p for p in n.abas() if 'web.whatsapp.com' in p.url), None)
    if aba is None:
        aba = n.nova(ENDERECO)
    else:
        aba.bring_to_front()
        n.atual = aba
    try:
        aba.wait_for_load_state('domcontentloaded', timeout=20000)
    except Exception:
        pass
    if _primeiro(aba, PAINEL, tempo=20000) is None:
        return None
    n.atual = aba
    return aba


NAO_LOGADO = ('O WhatsApp Web não está conectado nesta janela. Abri a página: '
              'leia o QR code com o celular (WhatsApp > Aparelhos conectados > '
              'Conectar aparelho). É uma vez só — depois ele fica logado.')


# ── ler ─────────────────────────────────────────────────────────────
class ConversasArgs(BaseModel):
    quantas: int = Field(default=15, description='Quantas conversas listar.')
    so_nao_lidas: bool = False


@ferramenta('whatsapp_conversas',
            'Lista as conversas recentes do WhatsApp, com quem, última mensagem e não lidas.',
            ConversasArgs, nivel=LIVRE, resumo=lambda a: 'olhar as conversas do WhatsApp')
def whatsapp_conversas(a: ConversasArgs, ctx: Contexto) -> str:
    p = _abre(ctx)
    if p is None:
        return NAO_LOGADO
    time.sleep(1.0)
    linhas = p.evaluate("""() => {
        const pane = document.querySelector('#pane-side') || document.body;
        const itens = pane.querySelectorAll('[role="listitem"], [role="row"]');
        return [...itens].slice(0, 40).map(i => i.innerText.replace(/\\n+/g, ' | '));
    }""")
    linhas = [l.strip() for l in linhas if l and l.strip()]
    if a.so_nao_lidas:
        linhas = [l for l in linhas if re.search(r'\|\s*\d+\s*$', l)]
    if not linhas:
        return 'não consegui ler a lista de conversas (o WhatsApp Web pode ter mudado o layout)'
    return '\n'.join(f'{i + 1}. {l[:200]}' for i, l in enumerate(linhas[:a.quantas]))


def _abre_conversa(p, nome: str) -> bool:
    busca = _primeiro(p, BUSCA)
    if busca is None:
        return False
    try:
        busca.click()
        p.keyboard.press('Control+A')
        p.keyboard.press('Backspace')
        busca.type(nome, delay=35)
        time.sleep(1.6)
        p.keyboard.press('Enter')
        time.sleep(1.4)
        return True
    except Exception:
        return False


def _mensagens(p, quantas: int) -> list[dict]:
    try:
        cru = p.evaluate("""(n) => {
            const sel = 'div.message-in, div.message-out, [data-id]';
            const rows = document.querySelectorAll(sel);
            return [...rows].slice(-n).map(r => {
              const pre = r.querySelector('[data-pre-plain-text]');
              const t = r.innerText || '';
              return {
                meta: pre ? pre.getAttribute('data-pre-plain-text') : '',
                texto: t.replace(/\\n+/g, ' ').trim().slice(0, 600),
                minha: r.className.includes('message-out')
              };
            }).filter(m => m.texto);
        }""", quantas)
    except Exception:
        return []
    saida = []
    for m in cru:
        quando, autor = _quebra_meta(m.get('meta', ''))
        saida.append({'quando': quando, 'autor': autor,
                      'texto': m['texto'], 'minha': bool(m.get('minha'))})
    return saida


def _quebra_meta(meta: str) -> tuple[int, str]:
    """'[20:31, 02/10/2026] Fulano: ' → (timestamp, 'Fulano')."""
    m = re.match(r'\[(\d{1,2}):(\d{2}),\s*(\d{1,2})/(\d{1,2})/(\d{4})\]\s*(.*?):\s*$',
                 meta or '')
    if not m:
        return 0, ''
    h, mi, d, mes, ano, autor = m.groups()
    try:
        return int(datetime(int(ano), int(mes), int(d), int(h), int(mi)).timestamp()), autor
    except ValueError:
        return 0, autor


class LerArgs(BaseModel):
    conversa: str = Field(description='Nome do contato ou do grupo.')
    quantas: int = Field(default=30, description='Quantas mensagens recentes.')


@ferramenta('whatsapp_ler', 'Abre uma conversa do WhatsApp e lê as mensagens recentes.',
            LerArgs, nivel=LIVRE, resumo=lambda a: f'ler a conversa com {a.conversa}')
def whatsapp_ler(a: LerArgs, ctx: Contexto) -> str:
    p = _abre(ctx)
    if p is None:
        return NAO_LOGADO
    if not _abre_conversa(p, a.conversa):
        return f'não consegui abrir a conversa "{a.conversa}"'
    msgs = _mensagens(p, a.quantas)
    if not msgs:
        return f'abri "{a.conversa}" mas não li mensagem nenhuma'
    linhas = []
    for m in msgs:
        hora = datetime.fromtimestamp(m['quando']).strftime('%d/%m %H:%M') if m['quando'] else ''
        quem = 'eu' if m['minha'] else (m['autor'] or a.conversa)
        linhas.append(f'[{hora}] {quem}: {m["texto"]}')
    return f'Conversa com {a.conversa} — {len(msgs)} mensagens\n' + '\n'.join(linhas)


class BuscarArgs(BaseModel):
    termo: str = Field(description='O que procurar nas conversas.')


@ferramenta('whatsapp_buscar', 'Procura um texto nas conversas do WhatsApp.', BuscarArgs,
            nivel=LIVRE, resumo=lambda a: f'procurar "{a.termo}" no WhatsApp')
def whatsapp_buscar(a: BuscarArgs, ctx: Contexto) -> str:
    p = _abre(ctx)
    if p is None:
        return NAO_LOGADO
    busca = _primeiro(p, BUSCA)
    if busca is None:
        return 'não achei a caixa de pesquisa do WhatsApp'
    busca.click()
    p.keyboard.press('Control+A')
    p.keyboard.press('Backspace')
    busca.type(a.termo, delay=35)
    time.sleep(2.0)
    texto = p.locator('#pane-side').inner_text()[:6000]
    return f'Resultados para "{a.termo}":\n{texto}'


# ── enviar ──────────────────────────────────────────────────────────
class EnviarArgs(BaseModel):
    conversa: str = Field(description='Para quem.')
    mensagem: str = Field(description='O texto exato que vai ser enviado.')


# Sai da sua máquina e chega em outra pessoa: não existe desfazer de
# verdade, e voz sozinha nunca manda mensagem em nome de ninguém.
@ferramenta('whatsapp_enviar',
            'Envia uma mensagem de WhatsApp. Sempre pede confirmação digitada.',
            EnviarArgs, nivel=PERIGO,
            resumo=lambda a: f'ENVIAR para {a.conversa}: "{a.mensagem[:120]}"')
def whatsapp_enviar(a: EnviarArgs, ctx: Contexto) -> str:
    p = _abre(ctx)
    if p is None:
        return NAO_LOGADO
    if not _abre_conversa(p, a.conversa):
        return f'não consegui abrir a conversa "{a.conversa}" — nada foi enviado'
    campo = _primeiro(p, ESCRITA)
    if campo is None:
        return 'não achei a caixa de escrever — nada foi enviado'
    campo.click()
    for pedaco in a.mensagem.split('\n'):
        campo.type(pedaco, delay=18)
        if pedaco != a.mensagem.split('\n')[-1]:
            p.keyboard.press('Shift+Enter')
    time.sleep(0.4)
    p.keyboard.press('Enter')
    time.sleep(0.8)
    return f'enviado para {a.conversa}: "{a.mensagem[:100]}"'


# ── faturamento ─────────────────────────────────────────────────────
class Lancamento(BaseModel):
    valor: str = Field(description='O valor como apareceu na mensagem, ex: "R$ 1.200,50".')
    cliente: str = Field(description='Quem pagou. Vazio se não der para saber.')
    descricao: str = Field(description='Do que foi a venda, em poucas palavras.')
    confianca: float = Field(description='0 a 1. Quanto você tem certeza de que é venda PAGA.')
    trecho: str = Field(description='A mensagem exata de onde você tirou isso.')


class Extracao(BaseModel):
    vendas: list[Lancamento] = Field(description='Só dinheiro que ENTROU, confirmado.')
    duvidas: list[str] = Field(
        description='O que parecia dinheiro mas você NÃO contou, e por quê.')


EXTRACAO = """Você lê conversas de WhatsApp de um negócio e separa o que é \
VENDA PAGA do que não é.

CONTA como venda (dinheiro que entrou):
- comprovante de pagamento, "pix feito", "paguei", "transferi", "caiu aí?"
  com valor;
- "fechado por R$ X" seguido de confirmação de pagamento;
- pedido entregue com o valor cobrado e confirmação.

NÃO CONTA, e vai para `duvidas`:
- orçamento, proposta, tabela de preço, "quanto custa", "quanto fica";
- "vou pensar", "me passa o valor", negociação em aberto;
- valor que VOCÊ pagou a alguém (saída, não entrada);
- promessa de pagar depois, sem confirmação;
- parcelamento: conte só a parcela que foi confirmada agora.

Na dúvida, NÃO CONTE — ponha em `duvidas` e explique. Um faturamento \
que inventa R$ 500 é pior que um faturamento que deixa R$ 500 de fora, \
porque o que falta você percebe e o que sobra você não.

`confianca` abaixo de 0,7 significa "achei, mas confira". Seja honesto nela.
Copie o `trecho` literalmente da conversa — é a prova que a pessoa vai ler \
quando o total parecer estranho."""


class FaturamentoArgs(BaseModel):
    periodo: str = Field(default='hoje', description='hoje | ontem | semana | mes')
    conversas: list[str] = Field(
        default_factory=list,
        description='Quais conversas ler. Vazio = as configuradas, ou as recentes.')
    reler: bool = Field(default=False,
                        description='True relê o WhatsApp. False responde do que já foi lido.')


def _janela(periodo: str) -> tuple[int, str]:
    agora = time.time()
    hoje = inicio_do_dia(agora)
    return {
        'hoje': (hoje, 'hoje'),
        'ontem': (hoje - 86400, 'ontem'),
        'semana': (hoje - 6 * 86400, 'nos últimos 7 dias'),
        'mes': (hoje - 29 * 86400, 'nos últimos 30 dias'),
    }.get(periodo, (hoje, 'hoje'))


@ferramenta('faturamento',
            'Responde quanto foi faturado num período, lendo os comprovantes do WhatsApp. '
            'Mostra de qual mensagem saiu cada valor.',
            FaturamentoArgs, nivel=LIVRE,
            resumo=lambda a: f'calcular o faturamento de {a.periodo}')
def faturamento(a: FaturamentoArgs, ctx: Contexto) -> str:
    caixa = _caixa(ctx)
    desde, rotulo = _janela(a.periodo)
    novas = achadas = 0
    aviso = ''

    if a.reler or not caixa.periodo(desde):
        conversas = a.conversas or ctx.cfg.whatsapp_chats
        if not conversas:
            aviso = ('\n\nNenhuma conversa configurada: li só as 5 mais recentes. '
                     'Diga quais conversas trazem pagamento e eu fixo em config.toml '
                     '(integracoes.whatsapp_chats).')
            conversas = _recentes(ctx, 5)
        for nome in conversas:
            texto = whatsapp_ler(LerArgs(conversa=nome, quantas=60), ctx)
            if texto.startswith('não consegui') or texto.startswith('O WhatsApp'):
                continue
            try:
                r: Extracao = pede_json(EXTRACAO, texto, Extracao, ctx.cfg.modelo)
            except Exception as e:
                aviso += f'\n(não consegui analisar "{nome}": {e})'
                continue
            for v in r.vendas:
                achadas += 1
                cent = centavos(v.valor)
                if cent <= 0:
                    continue
                quando = _quando_do_trecho(texto, v.trecho) or int(time.time())
                if caixa.guarda(cent, quando, v.cliente, v.descricao, nome,
                                v.trecho, v.confianca):
                    novas += 1

    total, quantas = caixa.total(desde)
    linhas = [f'Faturamento {rotulo}: {reais(total)} em {quantas} '
              f'{"venda" if quantas == 1 else "vendas"}']
    if novas or achadas:
        linhas.append(f'(li o WhatsApp agora: {achadas} encontradas, {novas} novas — '
                      'as repetidas não somam duas vezes)')

    for l in caixa.periodo(desde):
        hora = datetime.fromtimestamp(l['quando']).strftime('%d/%m %H:%M')
        marca = ' ⚠ confira' if l['confianca'] < 0.7 else ''
        linhas.append(f'  {hora}  {reais(l["centavos"]):>14}  '
                      f'{l["cliente"] or "(sem nome)"} — {l["descricao"]}{marca}')
        if l['trecho']:
            linhas.append(f'            de: "{l["trecho"][:110]}"')

    duvidosas = caixa.duvidosas(desde)
    if duvidosas:
        linhas.append(f'\n{len(duvidosas)} lançamento(s) com pouca certeza — '
                      'confira antes de usar esse total.')
    return '\n'.join(linhas) + aviso


def _recentes(ctx: Contexto, quantas: int) -> list[str]:
    bruto = whatsapp_conversas(ConversasArgs(quantas=quantas), ctx)
    nomes = []
    for linha in bruto.splitlines():
        m = re.match(r'\s*\d+\.\s*([^|]+)\|', linha)
        if m:
            nomes.append(m.group(1).strip())
    return nomes[:quantas]


def _quando_do_trecho(conversa: str, trecho: str) -> int:
    """Acha a hora da mensagem de onde o valor saiu, para a venda cair no dia certo."""
    chave = (trecho or '').strip()[:40]
    if not chave:
        return 0
    for linha in conversa.splitlines():
        if chave and chave in linha:
            m = re.match(r'\[(\d{2})/(\d{2}) (\d{2}):(\d{2})\]', linha)
            if m:
                d, mes, h, mi = (int(x) for x in m.groups())
                hoje = datetime.now()
                try:
                    return int(datetime(hoje.year, mes, d, h, mi).timestamp())
                except ValueError:
                    return 0
    return 0


class LancarArgs(BaseModel):
    valor: str = Field(description='Ex: "1200" ou "R$ 1.200,50".')
    cliente: str = ''
    descricao: str = ''


@ferramenta('lancar_venda',
            'Registra uma venda à mão, quando você dita o valor em vez de ler do WhatsApp.',
            LancarArgs, resumo=lambda a: f'lançar venda de {a.valor} '
                                         f'{("para " + a.cliente) if a.cliente else ""}')
def lancar_venda(a: LancarArgs, ctx: Contexto) -> str:
    cent = centavos(a.valor)
    if cent <= 0:
        return f'não entendi o valor "{a.valor}"'
    caixa = _caixa(ctx)
    agora = int(time.time())
    caixa.guarda(cent, agora, a.cliente, a.descricao, 'ditado por você',
                 f'ditado {datetime.now():%d/%m %H:%M}', 1.0)
    total, n = caixa.total(inicio_do_dia())
    return (f'lançado: {reais(cent)}'
            + (f' de {a.cliente}' if a.cliente else '')
            + f'. Hoje já são {reais(total)} em {n} vendas.')
