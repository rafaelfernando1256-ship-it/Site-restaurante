"""
A VIGIA — o funil rodando sozinho DEPOIS do primeiro contato

Um comando, um laço. A cada volta ele:

  1. olha quem escreveu — prospecto, quem já recebeu o link, cliente —
     e passa para o atendente (nucleo/atendente.py);
  2. responde quem escreveu para você: interesse, preço, fechamento;
  3. constrói a demonstração de quem disse que quer, se houver material;
  4. publica e manda o link para quem pediu;
  5. faz as alterações que os clientes pediram, republica e avisa.

O QUE ELE NÃO FAZ

**Não dá o primeiro contato.** A mensagem inicial para quem nunca falou
com você sai por `funil.py enviar`: o agente escreve, você abre, lê e
clica. São três segundos por lead, e é o único passo que não é
automático — de propósito. Disparo automático para quem não pediu contato
é spam de qualquer ângulo que se olhe: para o dono do restaurante que
recebe, para a Meta que bane o número, e para você, que depende desse
número para trabalhar.

Daí em diante é tudo sozinho. Quem respondeu, respondeu para você — e
responder a quem te escreveu, entregar o que te pediram e construir o que
foi aceito não tem nada de spam.

**Não insiste.** Quem não respondeu não recebe segunda mensagem daqui.
Reabordagem é decisão sua, na mão.

**Não responde o que não entendeu.** Triagem com certeza baixa fica
parada, registrada, esperando você ler. Mandar site para quem pediu para
parar de mandar mensagem é pior que não mandar nada.

**Não para em silêncio.** Se a sessão do WhatsApp cair ou der erro em
sequência, ele encerra dizendo por quê — em vez de ficar girando sem
fazer nada parecendo que está trabalhando.
"""
from __future__ import annotations

import json
import time
import traceback
from datetime import datetime
from pathlib import Path
from typing import Any

from .atendente import CONVERSANDO
from .estado import DEMO_PRONTA, Estado, QUER_DEMO
from .whats import NaoLogado, NumeroInvalido, Ritmo, Whats, assinatura

AGENTE = 'vigia'


class Vigia:
    def __init__(self, est: Estado, cfg, whats: Whats | None = None,
                 seco: bool = False):
        self.est = est
        self.cfg = cfg
        self.seco = seco                  # True = não envia nada, só mostra
        self.whats = whats or Whats(Path(cfg.perfil_whatsapp or
                                         (Path(cfg.banco).parent / 'whatsapp')))
        self.ritmo = Ritmo(cfg)
        self.marcas = Marcas(Path(cfg.banco).with_suffix('.vigia.json'))
        self.erros_seguidos = 0
        self.voltas = 0

    # ── 1. ver quem escreveu ────────────────────────────────────────
    def colhe_respostas(self, varredura: bool = False) -> int:
        """
        Lê quem escreveu. Antes só olhava quem tinha recebido a primeira
        mensagem; quem já tinha o link (e respondia "quanto fica?") e quem
        já era cliente (e pedia uma alteração) ficavam sem leitura nenhuma.
        """
        from .a3_estudio import anota_retorno
        esperando = [l for l in self.est.leads(CONVERSANDO, limite=500)
                     if l.telefone_e164]
        if not esperando:
            return 0

        if varredura:
            alvos = esperando
        else:
            # Caminho rápido: só quem aparece com não lida no painel. O
            # contato salvo aparece pelo NOME, não pelo número — por isso
            # o nome também casa.
            alvos = []
            try:
                for c in self.whats.conversas():
                    if not c['nao_lidas']:
                        continue
                    lead = casa_conversa(c['nome'], esperando)
                    if lead and lead not in alvos:
                        alvos.append(lead)
            except Exception as e:
                self._diz(f'não consegui ler o painel ({e}); varrendo um a um')
                alvos = esperando

        novas = 0
        for l in alvos:
            try:
                if not self.whats.abre_conversa(l.telefone_e164):
                    continue
                msgs = self.whats.mensagens(20)
                for m in msgs:
                    m.setdefault('chave', assinatura(str(m.get('quando', '')), m['texto']))
            except NaoLogado:
                raise
            except Exception as e:
                self.est.anota(AGENTE, 'erro_leitura', l.id, str(e)[:200])
                continue

            dele = self.novas_dele(l, msgs)
            self.marcas.marca(l.id, msgs)
            if not dele:
                continue
            texto = ' '.join(m['texto'] for m in dele)[:2000]
            anota_retorno(self.est, l.id, texto)
            novas += 1
            self._diz(f'↩ {l.nome} escreveu: "{texto[:90]}"')
            if not self.seco:
                time.sleep(2)
        return novas

    def novas_dele(self, lead, msgs: list[dict]) -> list[dict]:
        """
        As mensagens dele que ainda não foram lidas.

        A identidade de cada mensagem é a assinatura (carimbo + texto), não
        o carimbo: ele tem precisão de minuto e às vezes nem vem. Marcar
        "li até 20:31" perdia a mensagem que chegava no mesmo minuto, e
        ignorava toda resposta sem carimbo.

        Na PRIMEIRA leitura de uma conversa ainda não há assinatura
        guardada, e aí vale o corte pelo tempo — só o que chegou depois da
        sua última mensagem para ele —, para o histórico antigo de um
        cliente não virar pedido de alteração.
        """
        vistas = self.marcas.vistas(lead.id)
        dele = [m for m in msgs if not m['minha']]
        if vistas:
            return [m for m in dele if m.get('chave') not in vistas]
        desde = self.marcas.ultima(lead.id) or self._linha_de_corte(lead)
        if not desde:
            return dele
        # Sem carimbo na primeira leitura não dá para saber se é antiga:
        # melhor perder uma do que reprocessar o histórico inteiro.
        return [m for m in dele if m['quando'] and m['quando'] >= desde]

    def _linha_de_corte(self, lead) -> int:
        """Desde quando vale ler: a sua última mensagem enviada a ele."""
        enviados = [m['enviado_em'] for m in self.est.mensagens(lead_id=lead.id)
                    if m['situacao'] == 'enviada' and m['enviado_em']]
        cliente_desde = int((lead.dados or {}).get('cliente_desde', 0) or 0)
        # Um minuto de folga: o carimbo do WhatsApp é truncado no minuto.
        return max([cliente_desde, *(e - 60 for e in enviados)], default=0)

    # ── 2. atender e responder ──────────────────────────────────────
    def tria_e_responde(self) -> dict[str, int]:
        from .atendente import atende
        conta = atende(self.est, self.cfg, limite=20)
        if not self.cfg.responder_sozinho:
            return conta
        self.manda_rascunhos('resposta', '→ respondi')
        return conta

    def manda_rascunhos(self, tipo: str, rotulo: str) -> int:
        """Manda as mensagens deste tipo que estão prontas, no ritmo."""
        mandadas = 0
        for m in self.est.mensagens(situacao='rascunho', tipo=tipo):
            if not m['telefone_e164']:
                continue
            if tipo != 'resposta' and (self.est.lead(m['lead_id']).dados or {}).get(
                    'nao_contatar'):
                # Pediu para parar: a resposta àquilo que ELE escreveu ainda
                # sai; link, entrega e aviso, não.
                self.est.marca_mensagem(m['id'], 'recusada', 'web', 'pediu para não contatar')
                continue
            pode, por_que = self.ritmo.pode_agora()
            if not pode:
                self._diz(f'resposta a {m["lead_nome"]} na fila: {por_que}')
                break
            try:
                if self.seco:
                    # seco é seco: nada sai e nada é marcado como enviado
                    self._diz(f'[seco] mandaria a {m["lead_nome"]}: {m["texto"][:70]}')
                    continue
                time.sleep(self.ritmo.espera() / 3)   # resposta vem mais rápido
                self.whats.envia(m['telefone_e164'], m['texto'])
                self.est.marca_mensagem(m['id'], 'enviada', 'web')
                self.ritmo.contou()
                mandadas += 1
                self._diz(f'{rotulo} {m["lead_nome"]}')
            except Exception as e:
                self.est.marca_mensagem(m['id'], 'aprovada', 'web', str(e)[:200])
                self.est.avisa('envio', f'não consegui mandar a mensagem ({tipo}): '
                               f'"{m["texto"][:120]}" — {str(e)[:120]}', m['lead_id'])
                self._diz(f'✗ não mandei para {m["lead_nome"]}: {e}')
        return mandadas

    # ── 4 e 5. construir, publicar, entregar ────────────────────────
    def constroi_e_entrega(self) -> dict[str, int]:
        feito = {'construidas': 0, 'publicadas': 0}
        if self.seco:
            # Construir chama o Claude Code e publicar chama a Netlify.
            # "Seco" tem que ser seco de verdade, inclusive de rede.
            for estado, o_que in ((QUER_DEMO, 'construiria a demonstração de'),
                                  (DEMO_PRONTA, 'publicaria e entregaria para')):
                for l in self.est.leads(estado, limite=5):
                    self._diz(f'[seco] {o_que} {l.nome}')
            return feito
        querem = self.est.leads(QUER_DEMO, limite=3)
        if querem:
            from .a3_estudio import roda
            c = roda(self.est, self.cfg, limite=3)
            feito['construidas'] = c.get('prontas', 0)

        prontas = self.est.leads(DEMO_PRONTA, limite=5)
        if prontas and self.cfg.netlify:
            from .a4_entrega import entrega
            c = entrega(self.est, self.cfg, limite=5)
            feito['publicadas'] = c.get('publicadas', 0)
            # a entrega deixa a mensagem com o link em rascunho; manda —
            # mas só para quem pediu. Prévia de quem nunca falou com você
            # é PRIMEIRO CONTATO, e primeiro contato passa por você.
            for m in self.est.mensagens(situacao='rascunho', tipo='entrega'):
                if not m['telefone_e164']:
                    continue
                if not self.ja_conversou(m['lead_id']):
                    self.vira_primeiro_contato(m)
                    continue
                try:
                    if self.seco:
                        self._diz(f'[seco] entregaria a {m["lead_nome"]}')
                    else:
                        self.whats.envia(m['telefone_e164'], m['texto'])
                    self.est.marca_mensagem(m['id'], 'enviada', 'web')
                    self._diz(f'🎁 entreguei o link a {m["lead_nome"]}')
                except Exception as e:
                    self.est.marca_mensagem(m['id'], 'aprovada', 'web', str(e)[:200])
        elif prontas:
            self._diz(f'{len(prontas)} demo(s) pronta(s), mas falta NETLIFY_TOKEN')
        return feito

    def ja_conversou(self, lead_id: int) -> bool:
        """Ele já escreveu para você alguma vez?"""
        return bool(self.est.mensagens(tipo='retorno', lead_id=lead_id))

    def vira_primeiro_contato(self, m) -> None:
        """
        A entrega de quem nunca pediu nada vira abordagem em rascunho, com
        o texto de prévia (que diz que é demonstração e dá saída), e espera
        a sua aprovação na central como qualquer primeiro contato.
        """
        from .a4_entrega import _pendencias
        from .estado import RASCUNHO
        from .precos import nicho_do_lead
        l = self.est.lead(m['lead_id'])
        d = self.est.demo(l.id)
        pendencias = _pendencias(Path(d['pasta'])) if d and d['pasta'] else []
        texto = texto_previa(self.cfg.autor, l.nome, nicho_do_lead(l),
                             d['url'] if d else '', pendencias)
        self.est.marca_mensagem(m['id'], 'recusada', '',
                                'primeiro contato: virou abordagem para você aprovar')
        self.est.guarda_mensagem(l.id, 'abordagem', texto)
        if l.estado != RASCUNHO:
            self.est.move(l.id, RASCUNHO, AGENTE, 'prévia pronta, esperando aprovação')
        self._diz(f'✉ prévia de {l.nome} pronta — aprove o primeiro contato na central')

    # ── 6. as alterações que os clientes pediram ───────────────────
    def faz_alteracoes(self) -> dict[str, int]:
        if not self.est.pedidos('novo'):
            return {}
        if self.seco:
            for p in self.est.pedidos('novo'):
                self._diz(f'[seco] faria o pedido #{p["id"]} de {p["lead_nome"]}: '
                          f'{p["texto"][:70]}')
            return {}
        from .alteracoes import faz
        c = faz(self.est, self.cfg, limite=3)
        if self.cfg.responder_sozinho:
            c['avisados'] = self.manda_rascunhos('alteracao', '✎ avisei')
        return c

    # ── o laço ──────────────────────────────────────────────────────
    def volta(self) -> dict[str, Any]:
        self.voltas += 1
        varredura = self.voltas % max(1, self.cfg.varredura_a_cada) == 0
        r: dict[str, Any] = {'respostas': 0}
        r['respostas'] = self.colhe_respostas(varredura=varredura)
        # Sempre, e não só quando chegou mensagem nova: a pergunta de preço
        # que esperava você configurar o nicho volta para a fila sem
        # mensagem nova nenhuma, e a resposta que ficou fora do horário
        # precisa sair na volta seguinte. Sem pendência, não chama o modelo.
        r.update(self.tria_e_responde())
        r.update(self.constroi_e_entrega())
        r.update(self.faz_alteracoes())
        return r

    def roda(self, intervalo: int = 90, voltas_max: int = 0) -> int:
        self._diz(f'vigiando. Ctrl+C para parar.'
                  + ('  [MODO SECO: não envia nada]' if self.seco else ''))
        try:
            while True:
                if not self.seco and not self.whats.vivo():
                    try:
                        self.whats.abre(espera_login=180)
                    except NaoLogado as e:
                        self._diz(str(e))
                        return 2
                r = self.volta()
                resumo = ' · '.join(f'{k}: {v}' for k, v in r.items() if v)
                if resumo:
                    self._diz(f'volta {self.voltas} — {resumo}')
                if voltas_max and self.voltas >= voltas_max:
                    return 0
                time.sleep(intervalo)
        except KeyboardInterrupt:
            self._diz('parado por você.')
            return 0
        except NaoLogado as e:
            self._diz(str(e))
            return 2
        except Exception as e:
            self._diz(f'parei: {type(e).__name__}: {e}')
            traceback.print_exc()
            return 1
        finally:
            if not self.seco:
                self.whats.fecha()

    @staticmethod
    def _so_digitos(texto: str) -> str:
        import re
        return re.sub(r'\D', '', texto or '')

    def _diz(self, texto: str) -> None:
        print(f'  [{datetime.now():%H:%M:%S}] {texto}', flush=True)


def texto_previa(autor: str, nome: str, nicho: str, link: str,
                 pendencias: list[str]) -> str:
    """O primeiro contato de quem recebe a prévia feita do Instagram dele."""
    texto = (f'Oi! Tudo bem? Aqui é o {autor}.\n\n'
             f'Eu faço site para {nicho or "negócio local"} e montei uma prévia do '
             f'site do {nome} a partir do Instagram de vocês — está no ar aqui:\n'
             f'{link}\n\n'
             'É uma demonstração, sem compromisso: não aparece no Google e dá '
             'para mudar tudo. O que achou? Se não tiver interesse, me avisa que '
             'eu não insisto.')
    if pendencias:
        curtas = [p.split('(')[0].strip() for p in pendencias[:3]]
        texto += '\n\nAh: me passa ' + (', '.join(curtas[:-1]) + ' e ' + curtas[-1]
                                         if len(curtas) > 1 else curtas[0]) \
                 + ' que eu já coloco no site.'
    return texto


class Marcas:
    """
    Até onde cada conversa já foi lida: o último carimbo e as assinaturas
    das mensagens vistas. Arquivo simples, legível.

    O formato antigo guardava só o carimbo (`{"7": 1790000000}`); ele
    ainda é lido, e vira o novo na primeira gravação.
    """

    GUARDA = 60          # assinaturas por conversa — a janela lida é de 20

    def __init__(self, caminho: Path):
        self.caminho = Path(caminho)
        try:
            self.dados = json.loads(self.caminho.read_text(encoding='utf-8'))
        except Exception:
            self.dados = {}

    def _de(self, lead_id: int) -> dict:
        v = self.dados.get(str(lead_id), {})
        return {'t': int(v), 'vistas': []} if isinstance(v, (int, float)) else v

    def ultima(self, lead_id: int) -> int:
        return int(self._de(lead_id).get('t', 0))

    def vistas(self, lead_id: int) -> set[str]:
        return set(self._de(lead_id).get('vistas', []))

    def marca(self, lead_id: int, msgs: list[dict]) -> None:
        if not msgs:
            return
        atual = self._de(lead_id)
        vistas = [*atual.get('vistas', []),
                  *(m['chave'] for m in msgs if m.get('chave'))]
        # sem repetir, mantendo a ordem, só as mais novas
        unicas = list(dict.fromkeys(vistas))[-self.GUARDA:]
        quando = max([atual.get('t', 0), *(m['quando'] for m in msgs)])
        self.dados[str(lead_id)] = {'t': int(quando), 'vistas': unicas}
        self.caminho.parent.mkdir(parents=True, exist_ok=True)
        self.caminho.write_text(json.dumps(self.dados, indent=1), encoding='utf-8')


def casa_conversa(nome_no_painel: str, leads: list) -> Any:
    """
    A conversa do painel é de qual lead? Pelo número (contato não salvo)
    ou pelo nome (contato salvo com o nome do negócio).
    """
    import re
    import unicodedata

    def simples(t):
        t = unicodedata.normalize('NFKD', t or '').encode('ascii', 'ignore').decode()
        return re.sub(r'[^a-z0-9]+', ' ', t.lower()).strip()

    digitos = re.sub(r'\D', '', nome_no_painel or '')
    nome = simples(nome_no_painel)
    for l in leads:
        d = re.sub(r'\D', '', l.telefone_e164 or '')
        if len(digitos) >= 8 and d and (digitos.endswith(d[-8:]) or d.endswith(digitos[-8:])):
            return l
    for l in leads:
        alvo = simples(l.nome)
        if nome and alvo and len(nome) >= 4 and (nome == alvo or nome in alvo or alvo in nome):
            return l
    return None
