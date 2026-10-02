"""
A VIGIA — o funil rodando sozinho DEPOIS do primeiro contato

Um comando, um laço. A cada volta ele:

  1. olha quem respondeu, lê a resposta e passa para a triagem;
  2. responde quem escreveu para você;
  3. constrói a demonstração de quem disse que quer, se houver material;
  4. publica e manda o link para quem pediu.

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

from .estado import (ABORDADO, DEMO_PRONTA, Estado, PUBLICADO, QUER_DEMO,
                     RESPONDEU, SEM_RESPOSTA)
from .whats import NaoLogado, NumeroInvalido, Ritmo, Whats

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

    # ── 2. ver quem respondeu ───────────────────────────────────────
    def colhe_respostas(self, varredura: bool = False) -> int:
        from .a3_estudio import anota_retorno
        esperando = self.est.leads([ABORDADO, SEM_RESPOSTA], limite=200)
        if not esperando:
            return 0

        if varredura:
            alvos = esperando
        else:
            # Caminho rápido: só quem aparece com não lida no painel.
            digitos = {self._so_digitos(l.telefone_e164): l for l in esperando
                       if l.telefone_e164}
            alvos = []
            try:
                for c in self.whats.conversas():
                    if not c['nao_lidas']:
                        continue
                    chave = self._so_digitos(c['nome'])
                    for d, lead in digitos.items():
                        if chave and (chave.endswith(d[-8:]) or d.endswith(chave[-8:])):
                            alvos.append(lead)
                            break
            except Exception as e:
                self._diz(f'não consegui ler o painel ({e}); varrendo um a um')
                alvos = esperando

        novas = 0
        for l in alvos:
            if not l.telefone_e164:
                continue
            try:
                if not self.whats.abre_conversa(l.telefone_e164):
                    continue
                msgs = self.whats.mensagens(20)
            except NaoLogado:
                raise
            except Exception as e:
                self.est.anota(AGENTE, 'erro_leitura', l.id, str(e)[:200])
                continue

            desde = self.marcas.ultima(l.id)
            dele = [m for m in msgs if not m['minha'] and m['quando'] > desde]
            if not dele:
                continue
            texto = ' '.join(m['texto'] for m in dele)[:2000]
            anota_retorno(self.est, l.id, texto)
            self.marcas.marca(l.id, max(m['quando'] for m in dele))
            novas += 1
            self._diz(f'↩ {l.nome} respondeu: "{texto[:90]}"')
            if not self.seco:
                time.sleep(2)
        return novas

    # ── 3. triar e responder ────────────────────────────────────────
    def tria_e_responde(self) -> dict[str, int]:
        from .a3_estudio import tria
        conta = tria(self.est, limite=20, modelo=self.cfg.modelo_do_cerebro,
                     provedor=self.cfg.provedor)
        if not self.cfg.responder_sozinho:
            return conta

        for m in self.est.mensagens(situacao='rascunho', tipo='resposta'):
            if not m['telefone_e164']:
                continue
            pode, por_que = self.ritmo.pode_agora()
            if not pode:
                self._diz(f'resposta a {m["lead_nome"]} na fila: {por_que}')
                break
            try:
                if self.seco:
                    self._diz(f'[seco] responderia {m["lead_nome"]}: {m["texto"][:70]}')
                else:
                    time.sleep(self.ritmo.espera() / 3)   # resposta vem mais rápido
                    self.whats.envia(m['telefone_e164'], m['texto'])
                self.est.marca_mensagem(m['id'], 'enviada', 'web')
                self.ritmo.contou()
                self._diz(f'→ respondi {m["lead_nome"]}')
            except Exception as e:
                self.est.marca_mensagem(m['id'], 'aprovada', 'web', str(e)[:200])
                self._diz(f'✗ não respondi {m["lead_nome"]}: {e}')
        return conta

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
            # a entrega deixa a mensagem com o link em rascunho; manda.
            for m in self.est.mensagens(situacao='rascunho', tipo='entrega'):
                if not m['telefone_e164']:
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

    # ── o laço ──────────────────────────────────────────────────────
    def volta(self) -> dict[str, Any]:
        self.voltas += 1
        varredura = self.voltas % max(1, self.cfg.varredura_a_cada) == 0
        r: dict[str, Any] = {'respostas': 0}
        r['respostas'] = self.colhe_respostas(varredura=varredura)
        if r['respostas']:
            r.update(self.tria_e_responde())
        r.update(self.constroi_e_entrega())
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


class Marcas:
    """Até onde cada conversa já foi lida. Arquivo simples, legível."""

    def __init__(self, caminho: Path):
        self.caminho = Path(caminho)
        try:
            self.dados = json.loads(self.caminho.read_text(encoding='utf-8'))
        except Exception:
            self.dados = {}

    def ultima(self, lead_id: int) -> int:
        return int(self.dados.get(str(lead_id), 0))

    def marca(self, lead_id: int, quando: int) -> None:
        self.dados[str(lead_id)] = int(quando)
        self.caminho.parent.mkdir(parents=True, exist_ok=True)
        self.caminho.write_text(json.dumps(self.dados, indent=1), encoding='utf-8')
