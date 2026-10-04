"""
O CÉREBRO

O laço: você fala → ele pensa → escolhe ferramentas → **pede permissão
quando precisa** → executa → olha o resultado → decide de novo → responde.

Dois cérebros, a mesma cabeça. O Claude e o Gemini falam protocolos
diferentes — formato de histórico, formato de chamada de função, formato
de resultado —, mas a parte que importa é idêntica nos dois: a classe
`Motor` guarda o contexto, a permissão, a execução, o diário e o teto de
voltas. Trocar de modelo não pode afrouxar nenhuma trava, e a única
maneira de garantir isso é a trava existir em um lugar só.

Por que o laço é escrito à mão e não com o executor pronto do SDK: a
permissão precisa ser avaliada com os ARGUMENTOS já preenchidos —
`rodar_comando("ls")` e `rodar_comando("rm -rf /")` são a mesma
ferramenta e níveis opostos. Isso só dá para decidir depois que o modelo
escolheu e antes de a mão se mexer. Os dois SDKs oferecem executar a
função sozinhos; os dois ficam de fora por isso.

E ele fala enquanto trabalha: a resposta sai frase por frase, em fluxo,
e cada frase vai para a voz assim que fecha.
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

NEGADO = ('VOCÊ NÃO AUTORIZOU esta ação. Ela não foi executada. '
          'Não tente outro caminho para fazer a mesma coisa.')


class Motor:
    """O que não muda quando o modelo muda."""

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
        self.historico: list[Any] = []
        self.ultimo_detalhe = ''

    # ── o que o modelo precisa saber antes de decidir ───────────────
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
        return PERSONA.format(nome=self.cfg.nome, tratamento=self.cfg.tratamento,
                              contexto='\n'.join(linhas))

    # ── executar uma ferramenta, com permissão ──────────────────────
    def executa(self, nome: str, bruto: dict) -> tuple[str, bool]:
        """Devolve (texto, deu_erro). É aqui que a permissão acontece."""
        inicio = time.time()
        f = REGISTRO.get(nome)
        if f is None:
            return f'não existe a ferramenta "{nome}"', True

        try:
            args = f.args(**(bruto or {}))
        except Exception as e:
            return f'argumentos inválidos para {nome}: {e}', True

        veredito = f.veredito(args, self.ctx)
        descricao = f.descreve(args)

        if not veredito.livre:
            print(f'\n  ⚠ {descricao}  [{veredito.nivel}]')
            if self.porteiro is None:
                return 'sem porteiro configurado; ação não autorizada', True
            if not self.porteiro.autoriza(nome, veredito, descricao):
                self._anota(nome, bruto, veredito.nivel, 'recusado', descricao, inicio)
                return NEGADO, True

        try:
            saida = f.funcao(args, self.ctx)
            texto = saida if isinstance(saida, str) else json.dumps(saida, ensure_ascii=False)
            self._anota(nome, bruto, veredito.nivel, 'feito', texto, inicio)
            self.ultimo_detalhe = texto
            return texto[:30000], False
        except Exception as e:
            falha = f'{type(e).__name__}: {e}'
            self._anota(nome, bruto, veredito.nivel, 'erro', falha, inicio)
            return f'a ferramenta falhou — {falha}', True

    def _anota(self, nome, args, nivel, decisao, resultado, inicio):
        if self.diario:
            self.diario.acao(nome, args, nivel, decisao, str(resultado)[:3000],
                             self.ctx.pedido, round(time.time() - inicio, 2))

    # ── falar enquanto o texto chega ────────────────────────────────
    @staticmethod
    def _frases(acumulado: str, fecha: bool = False) -> tuple[list[str], str]:
        """Tira do acumulado as frases já completas. Devolve (frases, resto)."""
        saiu = []
        while True:
            m = re.search(r'[.!?…](\s|$)|\n', acumulado)
            if not m:
                break
            frase, acumulado = acumulado[:m.end()].strip(), acumulado[m.end():]
            if frase:
                saiu.append(frase)
        if fecha and acumulado.strip():
            saiu.append(acumulado.strip())
            acumulado = ''
        return saiu, acumulado

    def _abre_conversa(self, pedido: str) -> None:
        self.ctx.pedido = pedido
        if self.diario:
            self.diario.fala('voce', pedido)

    def _fecha_conversa(self, resposta: str) -> str:
        if self.diario:
            self.diario.fala('jarvis', resposta)
        self._encolhe()
        return resposta

    def _encolhe(self, teto: int = 40) -> None:
        if len(self.historico) > teto:
            self.historico = self.historico[-teto:]

    def esquece_conversa(self) -> None:
        self.historico.clear()


# ══ Claude ══════════════════════════════════════════════════════════
class CerebroClaude(Motor):
    @property
    def cliente(self):
        if self._cli is None:
            from nucleo.modelos import claude
            self._cli = claude(self.cfg.anthropic)
        return self._cli

    def responde(self, pedido: str, ao_falar: Callable[[str], None] | None = None) -> str:
        self._abre_conversa(pedido)
        self.historico.append({'role': 'user', 'content': pedido})

        resposta = ''
        for _ in range(self.cfg.voltas_maximas):
            msg = self._chama(ao_falar)
            self.historico.append({'role': 'assistant', 'content': msg.content})

            usos = [b for b in msg.content if getattr(b, 'type', '') == 'tool_use']
            texto = '\n'.join(b.text for b in msg.content
                              if getattr(b, 'type', '') == 'text').strip()
            if texto:
                resposta = texto
            if msg.stop_reason != 'tool_use' or not usos:
                break

            devolve = []
            for u in usos:
                saida, erro = self.executa(u.name, u.input or {})
                devolve.append({'type': 'tool_result', 'tool_use_id': u.id,
                                'content': saida, 'is_error': erro})
            self.historico.append({'role': 'user', 'content': devolve})
        else:
            resposta = resposta or 'parei: a tarefa deu muitas voltas sem terminar.'
        return self._fecha_conversa(resposta)

    def _chama(self, ao_falar):
        pendente = ''
        with self.cliente.messages.stream(
            model=self.cfg.modelo, max_tokens=8000, system=self._sistema(),
            thinking={'type': 'adaptive'}, tools=catalogo(), messages=self.historico,
        ) as fluxo:
            for evento in fluxo:
                if getattr(evento, 'type', '') == 'text':
                    pendente += evento.text
                    frases, pendente = self._frases(pendente)
                    for f in frases:
                        if ao_falar:
                            ao_falar(f)
            final = fluxo.get_final_message()
        frases, _ = self._frases(pendente, fecha=True)
        for f in frases:
            if ao_falar:
                ao_falar(f)
        return final

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


# ══ Gemini ══════════════════════════════════════════════════════════
class CerebroGemini(Motor):
    """
    Mesmo laço, outro protocolo.

    Três diferenças que custam caro se forem ignoradas:

    • **O esquema das ferramentas vai como JSON Schema puro**
      (`parameters_json_schema`). Converter para o formato antigo da
      Google perderia `default` e tipos aninhados.
    • **A chamada automática fica DESLIGADA.** O SDK sabe executar a
      função sozinho; se ele executar, a permissão nunca é consultada.
      Essa linha é a diferença entre ter e não ter trava.
    • **O histórico é `Content`, não dicionário**, e o resultado da
      ferramenta volta como `function_response` com papel de usuário.
    """

    @property
    def cliente(self):
        if self._cli is None:
            from nucleo.modelos import gemini
            self._cli = gemini(self.cfg.gemini)
        return self._cli

    def _config(self):
        from google.genai import types
        decls = [types.FunctionDeclaration(name=e['name'], description=e['description'],
                                           parameters_json_schema=e['input_schema'])
                 for e in catalogo()]
        return types.GenerateContentConfig(
            system_instruction=self._sistema(),
            tools=[types.Tool(function_declarations=decls)],
            # Sem isto o SDK executaria a ferramenta sozinho, e a permissão
            # nunca seria consultada.
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            max_output_tokens=8000,
        )

    def responde(self, pedido: str, ao_falar: Callable[[str], None] | None = None) -> str:
        from google.genai import types
        self._abre_conversa(pedido)
        self.historico.append(types.Content(role='user', parts=[types.Part(text=pedido)]))

        resposta = ''
        for _ in range(self.cfg.voltas_maximas):
            texto, chamadas, partes = self._chama(ao_falar)
            if partes:
                self.historico.append(types.Content(role='model', parts=partes))
            if texto:
                resposta = texto
            if not chamadas:
                break

            devolve = []
            for c in chamadas:
                saida, erro = self.executa(c.name, dict(c.args or {}))
                devolve.append(types.Part.from_function_response(
                    name=c.name,
                    response={'erro': saida} if erro else {'resultado': saida}))
            self.historico.append(types.Content(role='user', parts=devolve))
        else:
            resposta = resposta or 'parei: a tarefa deu muitas voltas sem terminar.'
        return self._fecha_conversa(resposta)

    def _chama(self, ao_falar):
        from google.genai import types
        pendente, texto_todo, chamadas = '', '', []
        fluxo = self.cliente.models.generate_content_stream(
            model=self.cfg.modelo_gemini, contents=self.historico, config=self._config())
        for pedaco in fluxo:
            for p in self._partes(pedaco):
                if getattr(p, 'thought', False):
                    continue                      # pensamento não se fala
                if getattr(p, 'function_call', None):
                    chamadas.append(p.function_call)
                elif getattr(p, 'text', None):
                    texto_todo += p.text
                    pendente += p.text
                    frases, pendente = self._frases(pendente)
                    for f in frases:
                        if ao_falar:
                            ao_falar(f)
        frases, _ = self._frases(pendente, fecha=True)
        for f in frases:
            if ao_falar:
                ao_falar(f)

        partes = ([types.Part(text=texto_todo)] if texto_todo.strip() else [])
        partes += [types.Part(function_call=c) for c in chamadas]
        return texto_todo.strip(), chamadas, partes

    @staticmethod
    def _partes(pedaco) -> list:
        candidatos = getattr(pedaco, 'candidates', None) or []
        if not candidatos:
            return []
        conteudo = getattr(candidatos[0], 'content', None)
        return list(getattr(conteudo, 'parts', None) or [])


# ══ OpenRouter e Groq ═══════════════════════════════════════════════
class CerebroRota(Motor):
    """
    Mesmo laço, protocolo da OpenAI — que é o que os dois falam.

    A vantagem prática: uma chave alcança Claude, GPT, Gemini e os
    abertos. A desvantagem: nem todo modelo do catálogo sabe chamar
    ferramenta, e o que não sabe responde texto onde devia agir. Por isso
    a escolha automática prefere os que dirigem ferramenta bem, e a
    primeira resposta sem `tool_calls` numa tarefa que claramente precisa
    de uma não é escondida: vira a resposta, e você vê que ele só falou.

    Três detalhes que custam caro se passarem batido:

    • os argumentos vêm como STRING de JSON, não como objeto;
    • o resultado volta numa mensagem de papel `tool`, amarrada pelo
      `tool_call_id` — errar o id faz a conversa inteira ser recusada;
    • a resposta é lida em fluxo (SSE) para ele começar a falar antes de
      terminar de pensar.
    """

    DIALETO = 'openrouter'

    @property
    def dialeto(self) -> dict:
        from nucleo.modelos import DIALETOS
        return DIALETOS[self.DIALETO]

    @property
    def chave(self) -> str:
        return getattr(self.cfg, self.DIALETO)

    @property
    def modelo_pedido(self) -> str:
        return getattr(self.cfg, f'modelo_{self.DIALETO}', '')

    def _ferramentas(self) -> list[dict]:
        return [{'type': 'function',
                 'function': {'name': e['name'], 'description': e['description'],
                              'parameters': e['input_schema']}}
                for e in catalogo()]

    def responde(self, pedido: str, ao_falar: Callable[[str], None] | None = None) -> str:
        from nucleo.modelos import modelo_dialeto
        self._abre_conversa(pedido)
        if not self.historico or self.historico[0].get('role') != 'system':
            self.historico.insert(0, {'role': 'system', 'content': self._sistema()})
        else:
            self.historico[0] = {'role': 'system', 'content': self._sistema()}
        self.historico.append({'role': 'user', 'content': pedido})

        alvo = modelo_dialeto(self.chave, self.modelo_pedido, self.DIALETO)
        resposta = ''
        for _ in range(self.cfg.voltas_maximas):
            texto, chamadas = self._chama(alvo, ao_falar)
            msg: dict = {'role': 'assistant', 'content': texto or None}
            if chamadas:
                msg['tool_calls'] = chamadas
            self.historico.append(msg)
            if texto:
                resposta = texto
            if not chamadas:
                break

            for c in chamadas:
                nome = c['function']['name']
                bruto = c['function'].get('arguments') or '{}'
                try:
                    args = json.loads(bruto) if isinstance(bruto, str) else dict(bruto)
                except json.JSONDecodeError:
                    saida, erro = f'argumentos ilegíveis para {nome}: {bruto[:200]}', True
                else:
                    saida, erro = self.executa(nome, args)
                self.historico.append({
                    'role': 'tool', 'tool_call_id': c.get('id', ''),
                    'name': nome,
                    'content': ('ERRO: ' + saida) if erro else saida,
                })
        else:
            resposta = resposta or 'parei: a tarefa deu muitas voltas sem terminar.'
        return self._fecha_conversa(resposta)

    def _chama(self, alvo: str, ao_falar) -> tuple[str, list[dict]]:
        import urllib.error
        import urllib.request

        from nucleo.modelos import AGENTE_HTTP

        corpo = {
            'model': alvo,
            'messages': self.historico,
            'tools': self._ferramentas(),
            'max_tokens': 8000,
            'stream': True,
        }
        req = urllib.request.Request(
            f'{self.dialeto["base"]}/chat/completions',
            data=json.dumps(corpo).encode(),
            headers={'Authorization': f'Bearer {self.chave}',
                     'Content-Type': 'application/json',
                     # sem isto o Cloudflare do Groq devolve 403/1010
                     'User-Agent': AGENTE_HTTP,
                     'X-Title': 'Jarvis'})

        texto, pendente = '', ''
        chamadas: dict[int, dict] = {}
        try:
            with urllib.request.urlopen(req, timeout=300) as fluxo:
                for linha in fluxo:
                    linha = linha.decode('utf-8', 'replace').strip()
                    if not linha.startswith('data:'):
                        continue
                    dado = linha[5:].strip()
                    if dado == '[DONE]':
                        break
                    try:
                        pedaco = json.loads(dado)
                    except json.JSONDecodeError:
                        continue
                    delta = (pedaco.get('choices') or [{}])[0].get('delta') or {}
                    if delta.get('content'):
                        texto += delta['content']
                        pendente += delta['content']
                        frases, pendente = self._frases(pendente)
                        for f in frases:
                            if ao_falar:
                                ao_falar(f)
                    for tc in delta.get('tool_calls') or []:
                        i = tc.get('index', 0)
                        alvo_c = chamadas.setdefault(
                            i, {'id': '', 'type': 'function',
                                'function': {'name': '', 'arguments': ''}})
                        if tc.get('id'):
                            alvo_c['id'] = tc['id']
                        f = tc.get('function') or {}
                        if f.get('name'):
                            alvo_c['function']['name'] += f['name']
                        if f.get('arguments'):
                            # Os argumentos chegam em pedaços; concatenar é
                            # obrigatório, e é aqui que quase todo mundo erra.
                            alvo_c['function']['arguments'] += f['arguments']
        except urllib.error.HTTPError as e:
            detalhe = e.read().decode()[:300]
            nome = self.dialeto['nome']
            if e.code == 401:
                raise RuntimeError(f'o {nome} recusou a chave — '
                                   f'{self.dialeto["chaves"]}') from e
            if e.code == 402:
                raise RuntimeError(f'sem crédito no {nome}') from e
            if e.code == 429:
                espera = (getattr(e, 'headers', None) or {}).get('retry-after', '')
                raise RuntimeError(
                    f'o {nome} limitou as requisições.'
                    + (f' Tente em {espera}s.' if espera else '')
                    + (' No plano grátis são 30 por minuto.'
                       if self.DIALETO == 'groq' else '')) from e
            raise RuntimeError(f'{nome} {e.code}: {detalhe}') from e

        frases, _ = self._frases(pendente, fecha=True)
        for f in frases:
            if ao_falar:
                ao_falar(f)
        return texto.strip(), [chamadas[i] for i in sorted(chamadas)]

    def _encolhe(self, teto: int = 40) -> None:
        """
        Corta sem deixar `tool` órfão: mensagem de ferramenta sem a
        chamada que a gerou faz a API recusar a conversa inteira. E a
        primeira mensagem, que é o sistema, nunca sai.
        """
        if len(self.historico) <= teto:
            return
        sistema = self.historico[0] if self.historico[0].get('role') == 'system' else None
        corpo = self.historico[1:] if sistema else self.historico
        corte = max(0, len(corpo) - teto)
        while corte < len(corpo) and corpo[corte].get('role') == 'tool':
            corte += 1
        self.historico = ([sistema] if sistema else []) + corpo[corte:]


class CerebroGroq(CerebroRota):
    """
    O mesmo laço, no Groq.

    Vale por dois motivos: é o mais rápido dos quatro (hardware próprio,
    centenas de tokens por segundo) e tem plano grátis sem cartão. O
    preço disso aparece em dois lugares:

    • 30 requisições por minuto no plano grátis. Uma conversa com muitas
      voltas de ferramenta gasta uma requisição por volta, então o 429
      chega — e aqui ele vira frase em português, com o tempo de espera
      que o próprio servidor mandou, em vez de traceback.
    • o catálogo é de modelos abertos, e nem todos chamam ferramenta. A
      ordem de preferência em `modelos.py` existe para isso: pega quem
      dirige ferramenta, não quem só conversa.
    """

    DIALETO = 'groq'


# ══ a escolha ═══════════════════════════════════════════════════════
Cerebro = CerebroClaude          # nome antigo, para não quebrar quem importa


def monta(cfg, **kw) -> Motor:
    """Devolve o cérebro do provedor configurado."""
    return {'gemini': CerebroGemini,
            'openrouter': CerebroRota,
            'groq': CerebroGroq}.get(cfg.provedor, CerebroClaude)(cfg, **kw)
