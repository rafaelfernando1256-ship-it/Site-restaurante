"""
O CÉREBRO

O laço: você fala → ele pensa → escolhe ferramentas → **pede permissão
quando precisa** → executa → olha o resultado → decide de novo → responde.

Por que o laço é escrito à mão e não com o executor pronto do SDK:
três coisas aqui não são padrão e são o que faz a diferença entre um
chatbot e um Jarvis.

  1. **Permissão no meio do laço.** Cada ferramenta é avaliada com os
     ARGUMENTOS já preenchidos — `rodar_comando("ls")` e
     `rodar_comando("rm -rf /")` são a mesma ferramenta e níveis
     opostos. A avaliação tem que acontecer depois de o modelo escolher
     e antes de a mão se mexer.
  2. **Ele fala enquanto trabalha.** A resposta sai frase por frase, em
     fluxo, e cada frase vai para a voz assim que fecha. Esperar o texto
     inteiro para começar a falar são cinco segundos de silêncio que
     fazem parecer travado.
  3. **Falado é curto, escrito é inteiro.** O que sai pelo alto-falante
     é o resumo; o detalhe fica no terminal, onde dá para ler com calma.

Os blocos de pensamento voltam inteiros para a conversa seguinte. Cortar
o pensamento no meio de uma tarefa com ferramenta faz o modelo perder o
fio do que já tentou.
"""
from __future__ import annotations

import json
import re
import time
from datetime import datetime
from typing import Any, Callable

from ferramentas import REGISTRO, Contexto, catalogo

PERSONA = """Você é o {nome}, assistente do {tratamento}, rodando DENTRO do \
computador dele e com acesso real à máquina. Você não simula ações: você usa \
ferramentas e elas acontecem de verdade.

COMO FALAR
- Português do Brasil, direto, como alguém competente que trabalha com ele \
há anos. Sem bajulação, sem "claro!", sem "com certeza!", sem emoji.
- A sua resposta vai ser FALADA em voz alta. Então: curta. Duas ou três frases \
na maior parte das vezes. Número redondo quando der ("mil e duzentos" em vez de \
"mil duzentos e trinta e sete e cinquenta").
- Se a resposta tem lista longa ou tabela, FALE o resumo e diga que o detalhe \
está na tela. Não leia lista em voz alta.
- Quando não souber, diga que não sabe. Quando não tiver certeza, diga a dúvida \
junto com a resposta.

COMO AGIR
- Prefira fazer a perguntar. Se ele disse "abre o YouTube", abra — não pergunte \
qual navegador.
- Pergunte só quando a escolha errada custa caro e não dá para desfazer.
- Use quantas ferramentas precisar numa tarefa só. Encadeie: procure o arquivo, \
leia, depois responda.
- **Nunca diga que fez algo que você não fez.** Se a ferramenta falhou, diga o \
que falhou e o que você tentou. Inventar sucesso é o pior erro possível aqui.
- Se uma permissão for negada, não insista nem tente outro caminho para a mesma \
coisa: diga que não foi autorizado e siga.
- Para dinheiro e números do negócio, use as ferramentas e cite a origem. Não \
estime, não arredonde para cima, não complete de cabeça.

O QUE VOCÊ SABE AGORA
{contexto}"""


class Cerebro:
    def __init__(self, cfg, diario=None, porteiro=None,
                 falar: Callable[[str], None] | None = None,
                 cliente: Any = None, ctx: Contexto | None = None):
        self.cfg = cfg
        self.diario = diario
        self.porteiro = porteiro
        self.falar = falar or (lambda t: None)
        self._cli = cliente
        self.ctx = ctx or Contexto(cfg=cfg, diario=diario, porteiro=porteiro,
                                   falar=self.falar)
        self.historico: list[dict] = []
        self.ultimo_detalhe = ''

    # ── conexão ─────────────────────────────────────────────────────
    @property
    def cliente(self):
        if self._cli is None:
            from nucleo.modelos import claude
            self._cli = claude(self.cfg.anthropic)
        return self._cli

    def _sistema(self) -> str:
        from nucleo.config import sistema
        agora = datetime.now()
        linhas = [
            f'Agora: {agora:%A, %d de %B de %Y, %H:%M}',
            f'Sistema: {sistema()}',
            f'Pastas liberadas para escrever: {", ".join(self.cfg.raizes_seguras)}',
        ]
        if self.diario:
            fatos = self.diario.lembretes()
            if fatos:
                linhas.append('O que você já sabe dele:')
                linhas += [f'  - {k}: {v}' for k, v in fatos.items()]
        return '\n'.join(linhas)

    # ── o laço ──────────────────────────────────────────────────────
    def responde(self, pedido: str, ao_falar: Callable[[str], None] | None = None) -> str:
        self.ctx.pedido = pedido
        if self.diario:
            self.diario.fala('voce', pedido)
        self.historico.append({'role': 'user', 'content': pedido})

        resposta_final = ''
        for volta in range(self.cfg.voltas_maximas):
            msg = self._chama(ao_falar)
            self.historico.append({'role': 'assistant', 'content': msg.content})

            usos = [b for b in msg.content if getattr(b, 'type', '') == 'tool_use']
            texto = '\n'.join(b.text for b in msg.content
                              if getattr(b, 'type', '') == 'text').strip()
            if texto:
                resposta_final = texto

            if msg.stop_reason != 'tool_use' or not usos:
                break

            resultados = [self._executa(u) for u in usos]
            self.historico.append({'role': 'user', 'content': resultados})
        else:
            resposta_final = (resposta_final
                              or 'parei: a tarefa deu muitas voltas sem terminar.')

        if self.diario:
            self.diario.fala('jarvis', resposta_final)
        self._encolhe()
        return resposta_final

    def _chama(self, ao_falar):
        """Uma ida ao modelo, em fluxo, falando frase por frase."""
        pendente = ''

        def despeja(fecha: bool = False):
            nonlocal pendente
            while True:
                m = re.search(r'[.!?…](\s|$)|\n', pendente)
                if not m:
                    break
                frase, pendente = pendente[:m.end()].strip(), pendente[m.end():]
                if frase and ao_falar:
                    ao_falar(frase)
            if fecha and pendente.strip() and ao_falar:
                ao_falar(pendente.strip())
                pendente = ''

        with self.cliente.messages.stream(
            model=self.cfg.modelo,
            max_tokens=8000,
            system=PERSONA.format(nome=self.cfg.nome, tratamento=self.cfg.tratamento,
                                  contexto=self._sistema()),
            thinking={'type': 'adaptive'},
            tools=catalogo(),
            messages=self.historico,
        ) as fluxo:
            for evento in fluxo:
                if getattr(evento, 'type', '') == 'text':
                    pendente += evento.text
                    despeja()
            final = fluxo.get_final_message()
        despeja(fecha=True)
        return final

    # ── executar uma ferramenta ─────────────────────────────────────
    def _executa(self, uso) -> dict:
        nome, bruto = uso.name, (uso.input or {})
        f = REGISTRO.get(nome)
        inicio = time.time()

        if f is None:
            return _resultado(uso.id, f'não existe a ferramenta "{nome}"', erro=True)

        try:
            args = f.args(**bruto)
        except Exception as e:
            return _resultado(uso.id, f'argumentos inválidos para {nome}: {e}', erro=True)

        veredito = f.veredito(args, self.ctx)
        descricao = f.descreve(args)

        if not veredito.livre:
            print(f'\n  ⚠ {descricao}  [{veredito.nivel}]')
        if veredito.livre is False and self.porteiro is None:
            return _resultado(uso.id, 'sem porteiro configurado; ação não autorizada',
                              erro=True)

        if not veredito.livre:
            autorizado = self.porteiro.autoriza(nome, veredito, descricao)
            if not autorizado:
                self._anota(nome, bruto, veredito.nivel, 'recusado', descricao, inicio)
                return _resultado(uso.id,
                                  'VOCÊ NÃO AUTORIZOU esta ação. Ela não foi executada. '
                                  'Não tente outro caminho para fazer a mesma coisa.',
                                  erro=True)

        try:
            saida = f.funcao(args, self.ctx)
            texto = saida if isinstance(saida, str) else json.dumps(saida, ensure_ascii=False)
            self._anota(nome, bruto, veredito.nivel, 'feito', texto, inicio)
            self.ultimo_detalhe = texto
            return _resultado(uso.id, texto)
        except Exception as e:
            falha = f'{type(e).__name__}: {e}'
            self._anota(nome, bruto, veredito.nivel, 'erro', falha, inicio)
            return _resultado(uso.id, f'a ferramenta falhou — {falha}', erro=True)

    def _anota(self, nome, args, nivel, decisao, resultado, inicio):
        if self.diario:
            self.diario.acao(nome, args, nivel, decisao, str(resultado)[:3000],
                             self.ctx.pedido, round(time.time() - inicio, 2))

    # ── memória curta ───────────────────────────────────────────────
    def _encolhe(self, teto: int = 40) -> None:
        """
        Corta a conversa antiga sem quebrar o par ferramenta/resultado —
        um `tool_result` órfão faz a API recusar a conversa inteira.
        """
        if len(self.historico) <= teto:
            return
        corte = len(self.historico) - teto
        while corte < len(self.historico):
            m = self.historico[corte]
            conteudo = m.get('content')
            tem_resultado = isinstance(conteudo, list) and any(
                (b.get('type') if isinstance(b, dict) else getattr(b, 'type', '')) == 'tool_result'
                for b in conteudo)
            if m['role'] == 'user' and not tem_resultado:
                break
            corte += 1
        self.historico = self.historico[corte:]

    def esquece_conversa(self) -> None:
        self.historico.clear()


def _resultado(uso_id: str, texto: str, erro: bool = False) -> dict:
    return {'type': 'tool_result', 'tool_use_id': uso_id,
            'content': texto[:30000], 'is_error': erro}
