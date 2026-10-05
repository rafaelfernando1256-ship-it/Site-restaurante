"""
A PRÉVIA — o site de demonstração, pronto em segundos e sem chamar modelo.

O agente 3 (`a3_estudio.py`) lê o Instagram e manda o Claude Code
construir um site sob medida. Fica melhor. Mas custa uma chamada de
modelo por site, demora minutos e, pior, não é igual duas vezes.

Isto aqui é o outro extremo, e é o que faz CINCO PRÉVIAS POR SEMANA
caberem em quem estuda e trabalha: três templates escritos à mão, de
verdade, e um preenchimento determinístico. Mesmo dado, mesmo site. Sem
chave de API nenhuma, sem rede (fora as fotos, que são opcionais).

QUAL DOS DOIS USAR

  planilha → prévia (isto)   abordagem fria, em lote, 30 segundos cada
  Instagram → Claude Code    quando ele JÁ respondeu que quer ver

Não compete: um abre a porta, o outro fecha a venda.

AS TRÊS REGRAS QUE NÃO SE QUEBRAM AQUI

  1. NADA INVENTADO. Preço, horário, avaliação, "20 anos de tradição" —
     se não está na planilha, não entra. O que falta aparece como lugar
     para o dono preencher e vai na sua mensagem como pendência.
  2. É PRÉVIA, E ESTÁ ESCRITO. Faixa no topo e aviso no rodapé, em todas
     as três. O dono precisa saber em dois segundos que aquilo é uma
     demonstração feita por você, não o site dele no ar.
  3. FOTO COM LICENÇA. Só acervo livre (Pixabay/Unsplash), com crédito
     gravado ao lado do arquivo. Nunca a foto do Instagram dele num site
     que vai para o ar — mesmo sendo dele, não é sua para publicar.

SEM CHAVE DE FOTO, ELE NÃO FICA FEIO

Cai num hero de CSS puro (gradiente + textura), que é melhor que foto
genérica ruim de banco de imagem. Vazio proposital em vez de enfeite
sofrível.
"""
from __future__ import annotations

import html
import json
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

MODELOS = Path(__file__).resolve().parent.parent / 'modelos'

# Termo de busca de foto por modelo. Em inglês porque os acervos
# indexam em inglês — "lanchonete" devolve três fotos e duas erradas.
TERMOS_FOTO = {
    'restaurante': 'restaurant food table rustic',
    'hotel': 'hotel room bed window sea',
    'negocio': 'small business shop interior',
}

AVISO_RODAPE = (
    'Esta página é uma <strong>prévia de demonstração</strong> criada por '
    '{autor} para apresentar uma proposta de site a {nome}. Não é o site '
    'oficial do estabelecimento e não tem vínculo com ele. As fotos são de '
    'acervo livre e servem como exemplo. Textos, fotos e informações são '
    'ajustados com o dono antes de qualquer publicação definitiva.')


@dataclass
class Previa:
    """O que saiu: a pasta, o arquivo e o que ficou faltando."""
    pasta: Path
    indice: Path
    modelo: str
    pendencias: list[str]
    fotos: int = 0


# ── o preenchedor ───────────────────────────────────────────────────
#
# Um template engine de 20 linhas em vez de Jinja: uma dependência a
# menos para você instalar, e o que ele faz cabe na cabeça.
#
#   {{chave}}            troca pelo valor, já escapado
#   {{&chave}}           troca sem escapar (para HTML que EU gerei)
#   {{#chave}}...{{/}}   mantém o trecho se o valor for verdadeiro
#   {{^chave}}...{{/}}   mantém o trecho se for FALSO (o plano B)
#
# O par #/^ é o que faz o template não precisar de duas versões: "tem
# foto" e "não tem foto" moram no mesmo arquivo, lado a lado.
BLOCO = re.compile(r'\{\{([#^])(\w+)\}\}(.*?)\{\{/\2\}\}', re.S)


def preenche(molde: str, dados: dict) -> str:
    def um(m: re.Match) -> str:
        quer = bool(dados.get(m.group(2)))
        positivo = m.group(1) == '#'
        return m.group(3) if quer == positivo else ''

    saida, anterior = molde, None
    while anterior != saida:              # blocos dentro de blocos
        anterior = saida
        saida = BLOCO.sub(um, saida)
    saida = re.sub(r'\{\{&(\w+)\}\}',
                   lambda m: str(dados.get(m.group(1), '')), saida)
    saida = re.sub(r'\{\{(\w+)\}\}',
                   lambda m: html.escape(str(dados.get(m.group(1), ''))), saida)
    return saida


def link_whats(e164: str, nome_negocio: str) -> str:
    """O botão do site abre a conversa COM O NEGÓCIO — é o cliente dele
    que vai clicar, não você."""
    if not e164:
        return ''
    texto = f'Olá! Vi o site de {nome_negocio} e queria falar com vocês.'
    from urllib.parse import quote
    return f'https://wa.me/{e164}?text={quote(texto)}'


def _cardapio(itens: list[str]) -> str:
    """
    A vitrine. Sem preço — preço que ninguém me deu eu não escrevo, e
    "a combinar" num cardápio fica pior que nada.
    """
    return '\n'.join(
        f'        <li><span class="item">{html.escape(i)}</span></li>'
        for i in itens)


def _galeria(fotos: list[str], nome: str) -> str:
    return '\n'.join(
        f'        <img src="{html.escape(f)}" alt="Imagem de exemplo — '
        f'{html.escape(nome)}" loading="lazy">' for f in fotos)


def _creditos(pasta: Path) -> str:
    """Crédito das fotos no rodapé. Licença que dispensa atribuição não
    impede dar: é o que te protege se alguém reclamar."""
    arquivo = pasta / 'fotos' / 'creditos.json'
    if not arquivo.exists():
        return ''
    try:
        tudo = json.loads(arquivo.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return ''
    nomes = sorted({f'{v.get("autor") or "autor desconhecido"} '
                    f'({v.get("fonte", "")})' for v in tudo.values()})
    return 'Fotos de exemplo: ' + ' · '.join(nomes) if nomes else ''


# ── as fotos ────────────────────────────────────────────────────────
def _acervo():
    """
    Empresta o acervo de fotos do projeto `conteudo`, se ele estiver aí.

    Importar por caminho em vez de copiar o código: o acervo já sabe
    tentar três bancos em ordem, já grava crédito e já aprendeu a mandar
    User-Agent (sem isso o Cloudflare devolve 403 antes de olhar a
    chave). Duas cópias dessa lição é uma cópia para esquecer de
    corrigir.
    """
    raiz = Path(__file__).resolve().parent.parent.parent / 'conteudo'
    if not (raiz / 'motor' / 'imagens.py').exists():
        return None
    if str(raiz) not in sys.path:
        sys.path.insert(0, str(raiz))
    try:
        from motor import imagens
        return imagens
    except Exception:
        return None


def baixa_fotos(modelo: str, destino: Path, quantas: int = 3) -> list[str]:
    """Devolve os caminhos relativos das fotos baixadas. Lista vazia é
    resultado válido: o template tem um plano B de CSS."""
    acervo = _acervo()
    if acervo is None:
        return []
    try:
        if not acervo.chaves_configuradas():
            return []
        achadas = acervo.busca(TERMOS_FOTO.get(modelo, TERMOS_FOTO['negocio']),
                               quantas=quantas, orientacao='landscape')
        saiu = []
        for f in achadas[:quantas]:
            caminho = acervo.baixa(f, destino / 'fotos')
            saiu.append(f'fotos/{caminho.name}')
        return saiu
    except Exception:
        # Cota estourada às onze da noite é rotina. Prévia sem foto sai;
        # prévia que não sai não vira venda.
        return []


# ── o que vai para o molde ──────────────────────────────────────────
def contexto(linha, autor: str, fotos: list[str], pasta: Path) -> dict:
    from urllib.parse import quote_plus
    e164 = re.sub(r'\D', '', linha.telefone or '')
    endereco_busca = ', '.join(x for x in (linha.endereco, linha.cidade) if x)
    insta = (linha.instagram or '').lstrip('@')
    return {
        'nome': linha.nome,
        'tipo': (linha.tipo or 'negócio').capitalize(),
        'cidade': linha.cidade,
        'endereco': linha.endereco,
        'tem_endereco': bool(linha.endereco),
        'telefone': linha.telefone,
        'tem_telefone': bool(e164),
        'whats': link_whats(e164, linha.nome),
        'tel_link': f'tel:+{e164}' if e164 else '',
        'instagram': f'@{insta}' if insta else '',
        'instagram_url': f'https://instagram.com/{insta}' if insta else '',
        'tem_instagram': bool(insta),
        'horario': linha.horario or 'Confirme com a casa',
        'tem_horario': bool(linha.horario),
        'mapa_busca': (f'https://www.google.com/maps/search/?api=1&query='
                       f'{quote_plus(endereco_busca)}' if endereco_busca else ''),
        # Sem chave de propósito: a Embed API pede uma, e chave colada
        # num HTML publicado é fatura aberta na conta de quem publicou.
        'mapa_embed': (f'https://www.google.com/maps?q={quote_plus(endereco_busca)}'
                       f'&output=embed' if endereco_busca else ''),
        'tem_mapa': bool(endereco_busca),
        'itens': bool(linha.especialidades),
        'cardapio_html': _cardapio(linha.especialidades),
        'hero': fotos[0] if fotos else '',
        'tem_hero': bool(fotos),
        'tem_galeria': len(fotos) > 1,
        'galeria_html': _galeria(fotos[1:], linha.nome),
        'creditos': _creditos(pasta),
        'aviso': AVISO_RODAPE.format(autor=html.escape(autor),
                                     nome=html.escape(linha.nome)),
        'autor': autor,
    }


def monta(linha, saida: Path, autor: str = 'um desenvolvedor local',
          com_fotos: bool = True) -> Previa:
    """
    Planilha → pasta com o site dentro. É o passo 2 do fluxo.

    A pasta sai no formato que o agente 4 já sabe publicar, então
    `funil.py publicar` funciona sem mudar nada.
    """
    pasta = saida / linha.place_id.replace('manual:', '')
    if pasta.exists():
        shutil.rmtree(pasta)
    # `publico/` e não a pasta direto: é a convenção que o agente 4 já
    # usa para zipar só o site e não o que sobrou em volta. Uma
    # convenção obedecida é um comando a menos para você aprender.
    publico = pasta / 'publico'
    publico.mkdir(parents=True, exist_ok=True)

    molde = (MODELOS / f'{linha.modelo}.html').read_text(encoding='utf-8')
    fotos = baixa_fotos(linha.modelo, publico) if com_fotos else []
    indice = publico / 'index.html'
    indice.write_text(preenche(molde, contexto(linha, autor, fotos, publico)),
                      encoding='utf-8')
    (publico / 'LEIA.txt').write_text(
        f'Prévia de demonstração de "{linha.nome}", feita por {autor}.\n'
        'Não é o site oficial. Fotos de acervo livre, como exemplo.\n', encoding='utf-8')
    return Previa(pasta=pasta, indice=indice, modelo=linha.modelo,
                  pendencias=linha.pontua_vazios(), fotos=len(fotos))
