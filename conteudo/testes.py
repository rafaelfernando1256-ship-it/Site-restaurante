#!/usr/bin/env python3
"""
PROVAS DO CONTEÚDO — python3 testes.py

Nenhuma toca a rede: acervo, modelo e TTS entram como dublê. O que
precisa de prova aqui é o que o olho não pega num quadro só — corte,
quebra de linha, licença, e o pipeline não morrer quando uma etapa falha.
"""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
sys.path.insert(0, str(RAIZ))

from PIL import Image                                    # noqa: E402
from motor import imagens, legenda, visual               # noqa: E402

TMP = Path(tempfile.mkdtemp(prefix='conteudo-'))
CASOS = []


def prova(nome):
    def envolve(f):
        CASOS.append((nome, f))
        return f
    return envolve


def igual(a, b, o_que=''):
    if a != b:
        raise AssertionError(f'{o_que or "valor"}: esperava {b!r}, veio {a!r}')


def verdade(x, o_que=''):
    if not x:
        raise AssertionError(o_que or 'esperava verdadeiro')


def foto(largura, altura, cor=(120, 160, 200)) -> Path:
    caminho = TMP / f'f{largura}x{altura}.jpg'
    Image.new('RGB', (largura, altura), cor).save(caminho)
    return caminho


# ── imagens ─────────────────────────────────────────────────────────
@prova('acervo: só entra fonte com licença comercial — nunca raspagem')
def _():
    # Se alguém um dia acrescentar um raspador aqui, esta prova cai. É o
    # ponto: imagem de terceiro em vídeo monetizado é o que derruba conta
    # depois que ela já está faturando.
    permitidos = {'pexels', 'pixabay', 'unsplash'}
    igual(set(imagens.ACERVOS), permitidos)
    fonte = (RAIZ / 'motor' / 'imagens.py').read_text(encoding='utf-8')
    for proibido in ('pinterest.com', 'instagram.com', 'getty', 'shutterstock'):
        verdade(proibido not in fonte.lower().replace('pinterest é mural', ''),
                f'apareceu {proibido} no código do acervo')
    for nome in permitidos:
        verdade(nome in imagens.ONDE_PEGAR, f'{nome} sem instrução de chave')


@prova('acervo: sem nenhuma chave, o erro diz onde pegar cada uma')
def _():
    guarda = {v: os.environ.pop(v, None) for _, v in imagens.ACERVOS.values()}
    try:
        imagens.busca('gym')
    except imagens.SemChave as e:
        for _, var in imagens.ACERVOS.values():
            verdade(var in str(e), f'{var} não foi citada: {e}')
        verdade('grátis' in str(e))
    else:
        raise AssertionError('buscou sem chave nenhuma')
    finally:
        for var, valor in guarda.items():
            if valor is not None:
                os.environ[var] = valor


@prova('acervo: um provedor que cai não derruba a busca')
def _():
    chamados = []

    def quebrado(termo, quantas, chave):
        chamados.append('pexels')
        raise RuntimeError('cota estourada')

    def bom(termo, quantas, chave):
        chamados.append('pixabay')
        return [imagens.Foto(id='1', url='u', largura=800, altura=1200,
                             autor='A', fonte='pixabay', pagina='p')]

    originais = dict(imagens.ACERVOS)
    imagens.ACERVOS['pexels'] = (quebrado, 'PEXELS_API_KEY')
    imagens.ACERVOS['pixabay'] = (bom, 'PIXABAY_API_KEY')
    os.environ['PEXELS_API_KEY'] = 'x'
    os.environ['PIXABAY_API_KEY'] = 'y'
    try:
        achadas = imagens.busca('gym', quantas=1)
        igual(len(achadas), 1, 'desistiu no primeiro acervo que falhou')
        igual(achadas[0].fonte, 'pixabay')
        verdade('pexels' in chamados and 'pixabay' in chamados)
    finally:
        imagens.ACERVOS.update(originais)
        os.environ.pop('PEXELS_API_KEY', None)
        os.environ.pop('PIXABAY_API_KEY', None)


# ── visual ──────────────────────────────────────────────────────────
@prova('visual: qualquer proporção vira 1080x1920 exato')
def _():
    for l, a in ((1600, 1000), (1000, 1600), (1080, 1080), (4000, 900)):
        saida = visual.trata(foto(l, a), TMP / f'v{l}x{a}.jpg')
        igual(Image.open(saida).size, (visual.LARGURA, visual.ALTURA),
              f'{l}x{a} não virou vertical')


@prova('visual: foto deitada corta pelo centro-ALTO, não pelo centro')
def _():
    # Em foto de pessoa o rosto está no terço superior. Cortar pelo centro
    # geométrico decapita metade das fotos de corpo inteiro.
    marcada = Image.new('RGB', (1000, 2000), (10, 10, 10))
    for y in range(0, 300):            # faixa clara no topo = o "rosto"
        for x in range(0, 1000, 4):
            marcada.putpixel((x, y), (250, 250, 250))
    caminho = TMP / 'alta.jpg'
    marcada.save(caminho)
    saida = visual.trata(caminho, TMP / 'alta-cortada.jpg',
                         visual.Tema(vinheta=0, grao=0, brilho=1.0,
                                     contraste=1.0, saturacao=1.0))
    img = Image.open(saida)
    topo = img.crop((0, 0, visual.LARGURA, 200)).convert('L')
    verdade(max(topo.convert("L").tobytes()) > 180,
            'o corte comeu o topo — é onde fica o rosto')


@prova('visual: o tratamento escurece e dessatura de verdade')
def _():
    colorida = foto(1200, 1600, (30, 200, 60))
    saida = visual.trata(colorida, TMP / 'escura.jpg')
    import numpy as np
    a = np.asarray(Image.open(saida))
    brilho = a.mean()
    saturacao = a.max(axis=2).astype(int) - a.min(axis=2).astype(int)
    verdade(brilho < 110, f'não escureceu o bastante: brilho médio {brilho:.0f}')
    verdade(saturacao.mean() < 60,
            f'não dessaturou: diferença média {saturacao.mean():.0f}')


@prova('visual: a vinheta realmente escurece a borda')
def _():
    # A primeira versão tinha a elipse tão maior que o quadro que a
    # vinheta não aparecia: parâmetro ligado sem efeito nenhum.
    plana = foto(1080, 1920, (160, 160, 160))
    saida = visual.trata(plana, TMP / 'vinheta.jpg',
                         visual.Tema(grao=0, brilho=1.0, contraste=1.0,
                                     saturacao=1.0, vinheta=0.9))
    img = Image.open(saida).convert('L')
    canto = img.crop((0, 0, 120, 120)).resize((1, 1)).getpixel((0, 0))
    meio = img.crop((480, 900, 600, 1020)).resize((1, 1)).getpixel((0, 0))
    verdade(meio - canto > 40,
            f'a vinheta não aparece: canto {canto}, meio {meio}')


# ── legenda ─────────────────────────────────────────────────────────
@prova('legenda: frase longa diminui a fonte em vez de ser cortada')
def _():
    curta = legenda.quadro(None, 'Treine.', TMP / 'curta.jpg')
    longa = legenda.quadro(
        None,
        'Quatro dias na academia sem progressão de carga é presença, não '
        'treino, e o corpo responde a estímulo crescente e não a frequência.',
        TMP / 'longa.jpg')
    for caminho in (curta, longa):
        igual(Image.open(caminho).size, (visual.LARGURA, visual.ALTURA))
    import numpy as np
    # A longa tem mais pixel branco que a curta: o texto inteiro está lá.
    brancos = lambda p: int((np.asarray(Image.open(p).convert('L')) > 200).sum())
    verdade(brancos(longa) > brancos(curta) * 2,
            'a frase longa não foi desenhada inteira')


@prova('legenda: a palavra marcada sai na cor de destaque')
def _():
    import numpy as np
    sem = legenda.quadro(None, 'estimulo crescente', TMP / 'sem.jpg')
    com = legenda.quadro(None, '*estimulo* crescente', TMP / 'com.jpg')
    r, g, b = visual.DARK.destaque

    def tem_destaque(p) -> bool:
        a = np.asarray(Image.open(p))
        perto = ((abs(a[:, :, 0].astype(int) - r) < 40)
                 & (abs(a[:, :, 1].astype(int) - g) < 40)
                 & (abs(a[:, :, 2].astype(int) - b) < 40))
        return bool(perto.sum() > 500)

    verdade(not tem_destaque(sem), 'pintou de vermelho sem ninguém pedir')
    verdade(tem_destaque(com), 'o *asterisco* não virou cor')


@prova('legenda: o texto respeita a margem lateral do app')
def _():
    import numpy as np
    p = legenda.quadro(None, 'Uma frase razoavelmente longa para o quadro',
                       TMP / 'margem.jpg')
    a = np.asarray(Image.open(p).convert('L'))
    borda = visual.LARGURA // 14     # ~7%, mais apertado que a margem de 12%
    esquerda = a[:, :borda].max()
    direita = a[:, -borda:].max()
    verdade(esquerda < 60 and direita < 60,
            f'texto encostou na borda e o app vai cortar '
            f'(esq {esquerda}, dir {direita})')


@prova('legenda: sem imagem o quadro sai preto PURO, não cinza')
def _():
    import numpy as np
    p = legenda.quadro(None, 'x', TMP / 'preto.jpg')
    a = np.asarray(Image.open(p))
    cantos = [a[5, 5], a[5, -5], a[-5, 5], a[-5, -5]]
    for c in cantos:
        # Em tela OLED o preto puro apaga o pixel e a imagem flutua sem
        # moldura. Cinza #111 vira um retângulo visível no feed.
        verdade(int(c.max()) <= 6, f'canto não é preto puro: {c}')


# ── gatilhos ────────────────────────────────────────────────────────
def duble_revisao(**campos):
    """Modelo falso: devolve a Revisao que o teste pedir, sem rede."""
    from motor.gatilhos import Revisao

    class Msgs:
        def parse(self, **kw):
            class R:
                parsed_output = Revisao(**campos)
                stop_reason = 'end_turn'
            return R()

    class Cli:
        messages = Msgs()

    return Cli()


def revisao_exemplo(**troca):
    from motor.gatilhos import Corte, Risco
    from motor.roteiro import Quadro
    base = dict(
        diagnostico='O gancho não abre lacuna: afirma algo que todos já sabem.',
        riscos=[Risco(quadro=0, risco='alto', porque='afirmação óbvia',
                      mecanismo='lacuna'),
                Risco(quadro=2, risco='baixo', porque='fecha o loop',
                      mecanismo='ciclo_aberto')],
        manipulacao_encontrada=['"só hoje" → urgência real: cada semana sem '
                                'progressão é repetida'],
        gancho='Você não treina pouco. Treina *disperso*.',
        quadros=[Quadro(fala='Quatro dias, zero progressão.', busca='empty gym'),
                 Quadro(fala='Anote o peso. Suba *2 kg*.', busca='notebook gym')],
        fechamento='Comece hoje: uma série a mais.',
        legenda_post='Progressão > frequência. #treino',
        cortes=[Corte(quadro=0, segundos=1.4, posicao='meio', razao='gancho'),
                Corte(quadro=1, segundos=3.0, posicao='alto', razao='corpo'),
                Corte(quadro=2, segundos=4.0, posicao='alto', razao='virada'),
                Corte(quadro=3, segundos=2.5, posicao='meio', razao='fecha')],
        aposta='lacuna no gancho + especificidade no 2 kg',
    )
    base.update(troca)
    return base


@prova('gatilhos: a instrução recusa o modelo errado (Cialdini) por escrito')
def _():
    from motor import gatilhos
    i = gatilhos.INSTRUCAO.lower()
    # A versão fuleira disto é recitar escassez/urgência/prova social. A
    # instrução precisa dizer POR QUE aquilo é o modelo errado aqui, não
    # só deixar de citar.
    verdade('cialdini' in i and 'pergunta errada' in i,
            'a instrução não explica por que conformidade é o modelo errado')
    # cada mecanismo que o esquema aceita precisa estar documentado na
    # instrução — identificador que o modelo pode devolver sem o agente
    # saber o que é vira rótulo decorativo
    from motor.gatilhos import MECANISMOS
    for mecanismo in MECANISMOS:
        if mecanismo == 'nenhum':
            continue
        verdade(mecanismo in i, f'faltou o mecanismo: {mecanismo}')
    # e as origens, que é o que separa isto de lista de guru
    for fonte in ('loewenstein', 'zeigarnik', 'reber', 'rogers', 'kahneman'):
        verdade(fonte in gatilhos.__doc__.lower(),
                f'o mecanismo não tem origem citada: {fonte}')
    # e a linha ética em termos operacionais, não morais
    verdade('verdadeira' in i and 'falsa' in i,
            'a instrução não distingue tornar vívido de tornar crível')


@prova('gatilhos: devolve diagnóstico, riscos e plano de corte')
def _():
    from motor import gatilhos
    from motor.roteiro import Quadro, Roteiro
    cru = Roteiro(gancho='Fala galera, só hoje!', quadros=[
        Quadro(fala='Treino é importante.', busca='gym')],
        fechamento='Link na bio.', legenda_post='#treino')

    # provedor='claude' porque é o único caminho da ponte que aceita um
    # CLIENTE dublê; Groq e OpenRouter são HTTPS puro e leem a chave do
    # ambiente, então ali o dublê seria a função de rede, não o cliente.
    rev = gatilhos.revisa(cru, provedor='claude',
                          cli=duble_revisao(**revisao_exemplo()))
    igual(len(rev.riscos), 2)
    igual(rev.riscos[0].risco, 'alto')
    verdade(rev.manipulacao_encontrada, 'não trocou o "só hoje"')
    verdade('só hoje' in rev.manipulacao_encontrada[0])
    verdade(rev.aposta, 'sem aposta não dá para medir o resultado depois')


@prova('gatilhos: a revisão volta no formato que o pipeline consome')
def _():
    from motor import gatilhos
    from motor.roteiro import Roteiro
    rev = gatilhos.Revisao(**revisao_exemplo())
    r = gatilhos.para_roteiro(rev)
    verdade(isinstance(r, Roteiro))
    igual(r.gancho, rev.gancho)
    igual(len(r.quadros), 2)
    igual(r.legenda_post, rev.legenda_post)


@prova('gatilhos: corte faltando vira padrão, não erro no meio da montagem')
def _():
    from motor import gatilhos
    # O modelo às vezes devolve corte a menos. Isso NÃO pode estourar: a
    # essa altura voz e imagens já foram geradas, e perder tudo por um
    # índice faltando seria perder minutos de trabalho por nada.
    rev = gatilhos.Revisao(**revisao_exemplo(cortes=[
        gatilhos.Corte(quadro=0, segundos=1.4, posicao='meio', razao='x')]))
    plano = gatilhos.plano_de_corte(rev, 4)
    igual(len(plano), 4)
    igual(plano[0], (1.4, 'meio'))
    igual(plano[3][1], 'meio', 'o último quadro centraliza')
    verdade(all(s > 0 for s, _ in plano))


@prova('gatilhos: duração absurda é contida em vez de aceita')
def _():
    from motor import gatilhos
    rev = gatilhos.Revisao(**revisao_exemplo(cortes=[
        gatilhos.Corte(quadro=0, segundos=0.05, posicao='meio', razao='x'),
        gatilhos.Corte(quadro=1, segundos=900, posicao='alto', razao='y')]))
    plano = gatilhos.plano_de_corte(rev, 2)
    verdade(plano[0][0] >= 0.8, f'quadro ilegível de {plano[0][0]}s')
    verdade(plano[1][0] <= 12, f'quadro de {plano[1][0]}s no TikTok')


def principal() -> int:
    ok = falhas = 0
    print()
    for nome, f in CASOS:
        try:
            f()
            ok += 1
            print(f'  \033[32m✓\033[0m {nome}')
        except Exception as e:
            falhas += 1
            print(f'  \033[31m✗\033[0m {nome}')
            print(f'      {type(e).__name__}: {e}')
    print(f'\n  {ok + falhas} provas · {ok} passando · {falhas} falhando\n')
    return 1 if falhas else 0


if __name__ == '__main__':
    raise SystemExit(principal())
