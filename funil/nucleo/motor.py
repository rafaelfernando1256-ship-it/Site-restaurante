"""
O MOTOR — o que roda quando você aperta "Ligar os agentes"

Um laço numa linha de execução própria. A cada volta:

  1. CAÇA      acha negócios sem site nos nichos que você marcou
               (uma vez por dia por nicho; precisa da chave da Places)
  2. PREPARA   fluxo "mensagem": o agente 2 escreve a primeira mensagem
               fluxo "prévia":   o estúdio monta o site a partir do
                                 Instagram ANTES de qualquer conversa
  3. ENVIA     o primeiro contato que VOCÊ aprovou na central
  4. CONVERSA  a vigia: lê quem escreveu, o atendente responde (preço,
               interesse, fechamento), constrói a demonstração de quem
               quis, publica, entrega o link, faz as alterações que os
               clientes pediram e avisa que está no ar
  5. DORME     o intervalo, e começa de novo

O PRIMEIRO CONTATO PASSA POR VOCÊ

O resto é sozinho. O primeiro contato com quem nunca falou com você
fica na central esperando a sua aprovação: você lê e aperta "Enviar os
aprovados". O motor manda no ritmo de gente, com teto por dia.

Isso não é zelo, é o que mantém o número vivo: disparo automático para
quem não pediu é o padrão exato que a Meta bane, e um texto errado
repetido para cinquenta donos não tem como ser recolhido. Com a Cloud API
oficial (`canal_envio = "cloud"`) o que você aprovou sai sozinho, sem o
clique de enviar.

TUDO NUMA LINHA SÓ

O Playwright (o navegador do WhatsApp Web) só pode ser usado pela linha
que o abriu, e o SQLite prefere uma conexão por linha. Então o motor abre
o próprio banco e o próprio navegador, e a central só conversa com ele
por comandos numa fila.
"""
from __future__ import annotations

import json
import queue
import threading
import time
import traceback
from collections import deque
from datetime import date, datetime
from pathlib import Path
from typing import Any

# O que dá para ajustar na central, com o valor de quem nunca mexeu.
PADRAO = {
    'fluxo': 'mensagem',        # mensagem | previa
    'cacar': False,             # buscar negócios novos sozinho (Places)
    'cidade': '',
    'nichos_caca': ['restaurante'],
    'novos_por_dia': 10,        # quantos leads novos ele prepara por dia
    'primeiros_por_dia': 15,    # teto de primeiros contatos enviados por dia
    'intervalo': 90,            # segundos entre voltas
}


class Ajustes:
    """`dados/central.json`: o que você escolheu na central e o placar do dia."""

    def __init__(self, caminho: Path):
        self.caminho = Path(caminho)

    def le(self) -> dict:
        try:
            dados = json.loads(self.caminho.read_text(encoding='utf-8'))
        except Exception:
            dados = {}
        return {**PADRAO, **dados}

    def grava(self, **campos) -> dict:
        atual = self.le()
        for k, v in campos.items():
            if k in PADRAO or k == 'hoje':
                atual[k] = v
        self.caminho.parent.mkdir(parents=True, exist_ok=True)
        self.caminho.write_text(json.dumps(atual, indent=2, ensure_ascii=False),
                                encoding='utf-8')
        return atual

    def hoje(self) -> dict:
        h = self.le().get('hoje') or {}
        if h.get('data') != date.today().isoformat():
            h = {'data': date.today().isoformat()}
        return h

    def conta(self, chave: str, quanto: int = 1) -> int:
        h = self.hoje()
        h[chave] = h.get(chave, 0) + quanto
        self.grava(hoje=h)
        return h[chave]


class Motor:
    def __init__(self, cfg, whats: Any = None, executor: Any = None):
        self.cfg = cfg
        self.ajustes = Ajustes(Path(cfg.banco).parent / 'central.json')
        self.log: deque[str] = deque(maxlen=500)
        self.situacao = 'parado'          # parado | ligando | rodando | parando
        self.ultima_volta = ''
        self._comandos: queue.Queue = queue.Queue()
        self._parar = threading.Event()
        self._linha: threading.Thread | None = None
        self._whats = whats                # dublê nos testes
        self._executor = executor          # dublê do Claude Code nos testes

    # ── a central fala com o motor por aqui ─────────────────────────
    def liga(self) -> bool:
        if self._linha and self._linha.is_alive():
            return False
        Eco.instala(self)
        self._parar.clear()
        self.situacao = 'ligando'
        self._linha = threading.Thread(target=self._roda, name='motor', daemon=True)
        self._linha.start()
        return True

    def para(self) -> None:
        if self._linha and self._linha.is_alive():
            self.situacao = 'parando'
            self.diz('parando no fim do passo atual...')
        self._parar.set()

    def pede(self, comando: str) -> None:
        """Comandos que precisam do navegador: rodam na linha do motor."""
        self._comandos.put(comando)
        self.diz(f'pedido recebido: {comando}')

    def ligado(self) -> bool:
        return bool(self._linha and self._linha.is_alive())

    def diz(self, texto: str) -> None:
        linha = f'[{datetime.now():%H:%M:%S}] {texto}'
        self.log.append(linha)
        print(linha, flush=True)

    # ── o laço ──────────────────────────────────────────────────────
    def _roda(self) -> None:
        from .estado import Estado
        from .vigia import Vigia
        est = Estado(self.cfg.banco)
        vigia = None
        try:
            try:
                self.cfg.exige_cerebro()
            except SystemExit as e:
                self.diz(f'não dá para ligar: {e}')
                return
            vigia = Vigia(est, self.cfg, whats=self._whats)
            vigia._diz = self.diz
            self.situacao = 'rodando'
            self.diz('agentes ligados.')
            while not self._parar.is_set():
                self.volta(est, vigia)
                self.ultima_volta = f'{datetime.now():%H:%M:%S}'
                espera = max(20, int(self.ajustes.le()['intervalo']))
                # Acorda antes se você pedir alguma coisa na central.
                fim = time.time() + espera
                while time.time() < fim and not self._parar.is_set():
                    if not self._comandos.empty():
                        break
                    self._parar.wait(1)
        except Exception as e:
            self.diz(f'o motor parou: {type(e).__name__}: {e}')
            traceback.print_exc()
        finally:
            if vigia is not None:
                try:
                    vigia.whats.fecha()
                except Exception:
                    pass
            est.fechar()
            self.situacao = 'parado'
            self.diz('agentes desligados.')

    def volta(self, est, vigia) -> None:
        """Uma volta inteira. Cada passo falha sozinho, sem derrubar os outros."""
        aj = self.ajustes.le()
        self._passo('comandos', lambda: self._atende_comandos(est, vigia))
        if aj['cacar']:
            self._passo('caça', lambda: self.caca(est, aj))
        if aj['fluxo'] == 'previa':
            self._passo('prévias', lambda: self.previas(est, aj))
        else:
            self._passo('primeiras mensagens', lambda: self.escreve(est, aj))
        if self.cfg.canal_envio == 'cloud':
            self._passo('envio (Cloud API)', lambda: self.envia_cloud(est, aj))
        if self._parar.is_set():
            return
        self._passo('conversas', lambda: self._conversa(vigia))

    def _passo(self, nome: str, f) -> None:
        if self._parar.is_set():
            return
        try:
            f()
        except Exception as e:
            self.diz(f'✗ {nome}: {type(e).__name__}: {e}')

    def _atende_comandos(self, est, vigia) -> None:
        while not self._comandos.empty():
            c = self._comandos.get_nowait()
            if c == 'enviar_aprovados':
                self.envia_aprovados(est, vigia)

    def _conversa(self, vigia) -> None:
        if not self._garante_whats(vigia):
            return
        r = vigia.volta()
        resumo = ' · '.join(f'{k}: {v}' for k, v in r.items() if v)
        if resumo:
            self.diz(f'volta — {resumo}')

    def _garante_whats(self, vigia) -> bool:
        w = vigia.whats
        try:
            if w.vivo() and getattr(w, 'logado', lambda: True)():
                return True
            w.abre(espera_login=90)
            return True
        except Exception as e:
            self.diz('WhatsApp Web não conectado: leia o QR code na janela que '
                     f'abriu (WhatsApp → Aparelhos conectados). [{type(e).__name__}]')
            return False

    # ── 1. caça ─────────────────────────────────────────────────────
    def caca(self, est, aj: dict) -> None:
        if not self.cfg.google_places:
            self.diz('caça ligada, mas falta GOOGLE_PLACES_KEY no .env — pulando')
            return
        cidade = aj['cidade'] or self.cfg.cidade
        if not cidade:
            self.diz('caça ligada, mas sem cidade — preencha na central')
            return
        from .a1_cacador import caca
        from .precos import termos_de_busca
        feitos = self.ajustes.hoje().get('cacados', [])
        for nicho in aj['nichos_caca']:
            chave = f'{nicho}|{cidade}'
            if chave in feitos or self._parar.is_set():
                continue
            self.diz(f'caçando {nicho} em {cidade}...')
            c = caca(est, self.cfg.google_places, cidade, termos_de_busca(nicho),
                     paginas=1, minimo=4, marca={'nicho': nicho})
            self.diz(f'  {nicho}: {c["novos"]} novos, {c["atualizados"]} já conhecidos')
            feitos.append(chave)
            h = self.ajustes.hoje()
            h['cacados'] = feitos
            self.ajustes.grava(hoje=h)

    # ── 2. prepara ──────────────────────────────────────────────────
    def _restam(self, chave: str, teto: int) -> int:
        return max(0, int(teto) - int(self.ajustes.hoje().get(chave, 0)))

    def escreve(self, est, aj: dict) -> None:
        from .a2_abordagem import escreve
        from .estado import NOVO
        restam = self._restam('preparados', aj['novos_por_dia'])
        novos = [l for l in est.leads(NOVO, limite=200) if l.telefone_e164]
        if not restam or not novos:
            return
        c = escreve(est, limite=restam, modelo=self.cfg.modelo_do_cerebro,
                    provedor=self.cfg.provedor, chave=self.cfg.chave_do_dialeto)
        if c['escritos']:
            self.ajustes.conta('preparados', c['escritos'])
            self.diz(f'{c["escritos"]} primeira(s) mensagem(ns) escrita(s) — '
                     'esperando a sua aprovação na central')

    def previas(self, est, aj: dict) -> None:
        """Monta o site antes da conversa, para quem tem Instagram."""
        from .a3_estudio import roda
        from .estado import NOVO
        restam = self._restam('preparados', aj['novos_por_dia'])
        if not restam:
            return
        hoje = date.today().isoformat()
        alvos = [l for l in est.leads(NOVO, limite=200)
                 if l.telefone_e164 and l.instagram
                 and (l.dados or {}).get('previa_tentada') != hoje][:min(restam, 2)]
        if not alvos:
            return
        for l in alvos:
            est.muda_dados(l.id, previa_tentada=hoje)
        self.diz(f'montando prévia de {", ".join(l.nome for l in alvos)}...')
        c = roda(est, self.cfg, leads=[est.lead(l.id) for l in alvos],
                 executor=self._executor)
        if c.get('prontas'):
            self.ajustes.conta('preparados', c['prontas'])

    # ── 3. envia o primeiro contato ─────────────────────────────────
    def envia_aprovados(self, est, vigia) -> None:
        """
        Manda o que você aprovou, pelo WhatsApp Web, no ritmo de gente e
        dentro do teto do dia. Só roda quando você pede.
        """
        from .a2_abordagem import marca_enviada
        from .whats import NumeroInvalido
        aj = self.ajustes.le()
        fila = est.mensagens(situacao='aprovada', tipo='abordagem')
        if not fila:
            self.diz('nenhum primeiro contato aprovado para enviar')
            return
        if self.cfg.canal_envio == 'cloud':
            self.envia_cloud(est, aj)
            return
        if not self._garante_whats(vigia):
            return
        ritmo = vigia.ritmo
        for i, m in enumerate(fila):
            if self._parar.is_set():
                break
            if not self._restam('primeiros', aj['primeiros_por_dia']):
                self.diz(f'teto de {aj["primeiros_por_dia"]} primeiros contatos hoje — '
                         f'{len(fila) - i} ficam para amanhã')
                break
            pode, por_que = ritmo.pode_agora()
            if not pode:
                self.diz(f'primeiros contatos parados: {por_que}')
                break
            if not m['telefone_e164']:
                est.marca_mensagem(m['id'], 'recusada', 'web', 'lead sem telefone')
                continue
            if i:
                espera = ritmo.espera()
                self.diz(f'  próximo envio em {int(espera)}s')
                if self._parar.wait(espera):
                    break
            try:
                vigia.whats.envia(m['telefone_e164'], m['texto'])
                marca_enviada(est, m['id'], m['lead_id'])
                est.marca_mensagem(m['id'], 'enviada', 'web')
                ritmo.contou()
                self.ajustes.conta('primeiros')
                self.diz(f'✉ primeiro contato enviado: {m["lead_nome"]}')
            except NumeroInvalido as e:
                est.marca_mensagem(m['id'], 'recusada', 'web', str(e))
                self.diz(f'✗ {m["lead_nome"]}: {e}')
            except Exception as e:
                est.marca_mensagem(m['id'], 'aprovada', 'web', str(e)[:200])
                self.diz(f'✗ {m["lead_nome"]}: {e} — parei o lote')
                break

    def envia_cloud(self, est, aj: dict) -> None:
        from .a2_abordagem import envia
        restam = self._restam('primeiros', aj['primeiros_por_dia'])
        if not restam:
            return
        c = envia(est, canal='cloud', limite=restam)
        if c['enviadas']:
            self.ajustes.conta('primeiros', c['enviadas'])
            self.diz(f'{c["enviadas"]} primeiro(s) contato(s) pela Cloud API')


class Eco:
    """
    O que os agentes imprimem na linha do motor aparece também no registro
    da central. Os agentes escrevem com `print` (é o que o terminal usa);
    trocar todos por um registro próprio mexeria em tudo por nada.
    """

    def __init__(self, original, motor: Motor):
        self.original = original
        self.motor = motor
        self._meio = ''

    @classmethod
    def instala(cls, motor: Motor) -> None:
        import sys
        if isinstance(sys.stdout, cls):
            sys.stdout.motor = motor
            return
        sys.stdout = cls(sys.stdout, motor)

    def write(self, texto: str) -> int:
        try:
            self.original.write(texto)
        except Exception:
            pass
        if threading.current_thread().name == 'motor':
            self._meio += texto
            *linhas, self._meio = self._meio.split('\n')
            for l in linhas:
                l = l.rstrip()
                # o próprio `diz` já registrou com hora
                if l.strip() and not l.startswith('['):
                    self.motor.log.append(f'           {l.strip()}')
        return len(texto)

    def flush(self) -> None:
        try:
            self.original.flush()
        except Exception:
            pass

    def __getattr__(self, nome):
        return getattr(self.original, nome)
