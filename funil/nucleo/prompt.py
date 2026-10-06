"""
O PROMPT — quando você quer o site PENSADO, não preenchido.

`previa.py` preenche um dos três modelos: sai em segundos, de graça, e é
igual toda vez. Isso é o certo para mandar cinco por semana.

Isto aqui é o outro extremo: em vez de decidir o layout, o funil escreve
um briefing completo do negócio e **você cola num modelo** (ChatGPT,
Claude Code, o que preferir). Quem desenha é ele; o funil garante que o
briefing chegue inteiro e com as regras que não podem cair.

POR QUE O FUNIL ESCREVE O PROMPT E NÃO VOCÊ

Porque a parte que quebra não é a criatividade — é o que falta. Prompt
escrito na pressa esquece o telefone, esquece o aviso de prévia, esquece
de proibir preço inventado. Aí volta um site bonito com um horário que
ninguém informou, e você só descobre quando o dono lê.

O QUE O PROMPT CARREGA SEMPRE

  • só os dados da planilha, e a ordem explícita de não inventar o resto;
  • o aviso de prévia no topo e no rodapé, e o noindex;
  • as fotos que o funil já baixou, pelo caminho exato;
  • o formato da resposta: um arquivo, nada de explicação em volta.

E depois: `funil.py site` recebe o HTML de volta, CONFERE essas regras e
conserta o que faltar. Instrução no prompt é pedido; o que não pode cair
é checado no código, porque modelo esquece — foi assim que a legenda do
vídeo voltou com muleta duas vezes depois de proibida.
"""
from __future__ import annotations

import re
import urllib.parse
from pathlib import Path

# O jeito da casa, por tipo. Uma linha só: parágrafo de direção de arte
# faz o modelo escrever sobre o estilo em vez de aplicar o estilo.
ESTILO = {
    'restaurante': 'escuro e quente (fundo quase preto, um laranja '
                   'queimado de destaque, serifada nos títulos). Comida '
                   'aparece melhor em fundo escuro — é por isso que quase '
                   'todo cardápio impresso é preto.',
    'hotel': 'claro e arejado, com muito espaço em branco (areia, um '
             'verde-mar fundo de destaque, serifada fina nos títulos). '
             'Hospedagem se vende pela sensação de descanso, e tela cheia '
             'de informação é o oposto disso.',
    'negocio': 'claro, sóbrio e direto, uma cor forte só, sem serifa. '
               'Aqui o que vende é confiança e facilidade de marcar: o '
               'contato fica sempre a um toque e nada de enfeite no meio.',
}

CABECA = ('Claude Code: crie um site de uma página para {nome}'
          '{tipo_frase}{cidade_frase}.')


def monta(linha, autor: str, fotos: list[str] | None = None) -> str:
    """O briefing inteiro, pronto para colar."""
    fotos = fotos or []
    e164 = re.sub(r'\D', '', linha.telefone or '')
    endereco_completo = ', '.join(x for x in (linha.endereco, linha.cidade) if x)

    dados = [f'nome: {linha.nome}']
    if linha.tipo:
        dados.append(f'tipo de negócio: {linha.tipo}')
    if linha.cidade:
        dados.append(f'cidade: {linha.cidade}')
    if linha.endereco:
        dados.append(f'endereço: {linha.endereco}')
    if linha.telefone:
        dados.append(f'telefone: {linha.telefone}')
        dados.append(f'link de WhatsApp: https://wa.me/{e164}')
    if linha.instagram:
        dados.append(f'instagram: {linha.instagram} '
                     f'(https://instagram.com/{linha.instagram.lstrip("@")})')
    if linha.horario:
        dados.append(f'horário: {linha.horario}')
    if linha.especialidades:
        dados.append('o que a casa faz: ' + '; '.join(linha.especialidades))
    if linha.observacao:
        dados.append(f'observação minha: {linha.observacao}')

    falta = linha.pontua_vazios()
    bloco_falta = ''
    if falta:
        bloco_falta = (
            '\n\nO QUE NÃO ME INFORMARAM (e por isso NÃO pode aparecer '
            'inventado)\n'
            + '\n'.join(f'- {x}' for x in falta)
            + '\nCada um desses vira um lugar visível para o dono '
              'preencher, com o texto "a combinar" ou "confirme com a '
              'casa". Nunca um número bonito no lugar.')

    if fotos:
        bloco_fotos = (
            'AS FOTOS (já estão na pasta, use exatamente estes caminhos)\n'
            + '\n'.join(f'- {f}' for f in fotos)
            + '\nSão de acervo livre e servem de exemplo. A primeira é a '
              'capa; as outras, galeria.')
    else:
        bloco_fotos = (
            'AS FOTOS\n'
            '- Não há foto nenhuma. Faça a capa com CSS (gradiente, '
            'tipografia grande) em vez de caixa cinza de placeholder. '
            'Vazio proposital fica melhor que enfeite sofrível.')

    tipo_frase = f', um(a) {linha.tipo}' if linha.tipo else ''
    cidade_frase = f' em {linha.cidade}' if linha.cidade else ''

    return f"""{CABECA.format(nome=linha.nome, tipo_frase=tipo_frase,
                              cidade_frase=cidade_frase)}

É uma PRÉVIA DE DEMONSTRAÇÃO: eu, {autor}, vou mandar o link para o dono
para ele ver como ficaria o site dele. Ele ainda não é meu cliente.

O ARQUIVO
- Um único index.html. CSS dentro de <style>, JavaScript (se precisar)
  dentro de <script>. Sem build, sem framework, sem dependência externa —
  fora fonte do Google Fonts, que pode.
- Celular primeiro: tem que abrir bem a 360px de largura, sem rolagem
  horizontal. O dono vai abrir no telefone, em pé, no meio do serviço.

OS DADOS (são os únicos que existem)
{chr(10).join('- ' + d for d in dados)}{bloco_falta}

O QUE NÃO PODE, DE JEITO NENHUM
- Inventar preço, horário, avaliação, nota, prêmio, "x anos de
  tradição", número de clientes, depoimento ou nome de prato que não
  está na lista acima. O dono vai conferir em trinta segundos, e um dado
  inventado derruba a venda inteira.
- Lorem ipsum. Se faltou texto, escreva uma frase curta e verdadeira ou
  deixe o lugar marcado para o dono preencher.
- Logo, marca ou foto do estabelecimento. Não tenho os arquivos dele.

O QUE TEM QUE TER
- No topo, grudada ao rolar, uma faixa dizendo "Prévia · site de
  demonstração".
- Botão de WhatsApp flutuante no canto inferior{' (só se houver telefone — e há)' if e164 else ' — NÃO inclua, não há telefone'}.
- Cartões com endereço, horário e contato (só os que existem acima).
{f'- Mapa: <iframe> com src="https://www.google.com/maps?q={urllib.parse.quote_plus(endereco_completo)}&output=embed", mais um link "Abrir no Google Maps" embaixo, porque o iframe às vezes não carrega.' if endereco_completo else '- Sem endereço: não ponha mapa nenhum.'}
- <meta name="robots" content="noindex, nofollow"> — a prévia não pode
  competir com ele na busca.
- No rodapé, este aviso, com estas palavras: "Esta página é uma prévia de
  demonstração criada por {autor} para apresentar uma proposta de site a
  {linha.nome}. Não é o site oficial do estabelecimento e não tem vínculo
  com ele. As fotos são de acervo livre e servem como exemplo."

{bloco_fotos}

O JEITO
{ESTILO.get(linha.modelo, ESTILO['negocio'])}
Capriche: isto vai ser a primeira impressão que um dono de negócio vai
ter do meu trabalho.

A SUA RESPOSTA
Só o HTML. Comece em <!doctype html> e termine em </html>. Sem crase, sem
```html, sem explicação antes nem depois.
"""


def para_clipboard(texto: str) -> bool:
    """
    Põe no ctrl+V. Devolve se conseguiu — e não explode se não conseguir:
    o prompt já foi gravado em arquivo antes de chegar aqui.
    """
    import subprocess
    import sys
    alvos = ([['clip']] if sys.platform == 'win32'
             else [['pbcopy']] if sys.platform == 'darwin'
             else [['xclip', '-selection', 'clipboard'], ['wl-copy']])
    for alvo in alvos:
        try:
            p = subprocess.run(alvo, input=texto.encode('utf-8'),
                               capture_output=True, timeout=10)
            if p.returncode == 0:
                return True
        except (OSError, subprocess.SubprocessError):
            continue
    return False


# ── a volta: o HTML que o modelo devolveu ───────────────────────────
#
# Instrução no prompt é PEDIDO. O que não pode cair é conferido aqui, em
# código, porque modelo esquece — e o que ele esquece é justamente a
# parte chata: a faixa de prévia, o aviso de rodapé, o noindex.
FAIXA = 'Prévia · site de demonstração'
AVISO = ('Esta página é uma prévia de demonstração criada por {autor} para '
         'apresentar uma proposta de site a {nome}. Não é o site oficial do '
         'estabelecimento e não tem vínculo com ele. As fotos são de acervo '
         'livre e servem como exemplo.')

ESTILO_FAIXA = (
    '<div style="position:sticky;top:0;z-index:9999;background:#c2410c;'
    'color:#fff;font:600 12.5px/1.4 system-ui,sans-serif;letter-spacing:.08em;'
    'text-transform:uppercase;text-align:center;padding:8px 14px">'
    f'{FAIXA}</div>')
ESTILO_AVISO = (
    '<footer style="padding:28px 16px 40px;font:400 13px/1.6 '
    'system-ui,sans-serif;color:#6b7280;background:#f5f5f4;'
    'text-align:center">{texto}</footer>')
META = '<meta name="robots" content="noindex, nofollow">'


def limpa(bruto: str) -> str:
    """Tira a crase que o modelo põe mesmo quando você pede para não pôr."""
    t = bruto.strip()
    t = re.sub(r'^```[a-zA-Z]*\s*', '', t)
    t = re.sub(r'\s*```$', '', t)
    # Às vezes vem uma frase antes do doctype ("Aqui está o site:").
    i = t.lower().find('<!doctype')
    if i == -1:
        i = t.lower().find('<html')
    return t[i:].strip() if i > 0 else t


def confere(html: str, linha, autor: str) -> tuple[str, list[str], list[str]]:
    """
    Devolve (html_corrigido, o_que_eu_consertei, o_que_você_precisa_ver).

    Conserta o que dá para consertar sozinho e AVISA o resto. Não recusa
    o arquivo: recusar deixaria você sem site nenhum por causa de um
    rodapé, e o rodapé eu sei escrever.
    """
    consertos: list[str] = []
    avisos: list[str] = []
    e164 = re.sub(r'\D', '', linha.telefone or '')

    if '<html' not in html.lower():
        avisos.append('isto não parece um HTML inteiro — confira o arquivo')
        return html, consertos, avisos

    # 1. a faixa de prévia, no topo
    if 'demonstração' not in html.lower().split('</head>')[-1][:4000]:
        html = re.sub(r'(<body[^>]*>)', r'\1\n' + ESTILO_FAIXA, html,
                      count=1, flags=re.I)
        consertos.append('faltava a faixa de prévia no topo — pus')

    # 2. o aviso do rodapé
    if 'não é o site oficial' not in html.lower():
        texto = AVISO.format(autor=autor, nome=linha.nome)
        html = html.replace('</body>', ESTILO_AVISO.format(texto=texto)
                            + '\n</body>', 1)
        consertos.append('faltava o aviso de prévia no rodapé — pus')

    # 3. noindex: prévia que indexa concorre com o cliente na busca
    if 'noindex' not in html.lower():
        html = re.sub(r'(<head[^>]*>)', r'\1\n' + META, html, count=1, flags=re.I)
        consertos.append('faltava o noindex — pus')

    # 4. o que eu NÃO conserto, porque exige decisão sua
    if e164 and e164 not in re.sub(r'\D', '', html):
        avisos.append('o telefone não aparece no site — confira o botão '
                      'de WhatsApp')
    if re.search(r'R\$\s*\d', html) :
        avisos.append('apareceu PREÇO no site. Você não passou preço '
                      'nenhum — confira se o modelo inventou')
    if not linha.horario and re.search(r'\b\d{1,2}h(?:\d{2})?\s*(?:às|-|a)\s*\d',
                                       html):
        avisos.append('apareceu HORÁRIO e você não informou nenhum — '
                      'confira se o modelo inventou')
    if 'lorem ipsum' in html.lower():
        avisos.append('sobrou lorem ipsum no texto')
    return html, consertos, avisos
