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


@prova('acervo: cada um autentica do seu jeito, que é diferente dos outros')
def _():
    import json as J
    import urllib.request
    from motor import imagens as I

    visto = {}

    class Resposta:
        def __init__(self, corpo): self.corpo = corpo
        def read(self): return self.corpo
        def __enter__(self): return self
        def __exit__(self, *_): return False

    def espia(req, timeout=None):
        visto['url'] = req.full_url
        visto['cabecalhos'] = dict(req.headers)
        return Resposta(J.dumps(
            {'photos': [], 'hits': [], 'results': []}).encode())

    original, urllib.request.urlopen = urllib.request.urlopen, espia
    try:
        # Os três são DIFERENTES, e trocar um pelo outro dá 401 sem dizer
        # por quê. Pexels: chave crua no Authorization, sem "Bearer".
        I._pexels('gym', 1, 'CHAVE_PEXELS')
        igual(visto['cabecalhos'].get('Authorization'), 'CHAVE_PEXELS')
        verdade('Bearer' not in str(visto['cabecalhos']),
                'Pexels não usa Bearer — com ele dá 401')
        verdade('orientation=portrait' in visto['url'])

        # Unsplash: prefixo "Client-ID", que é só dele.
        I._unsplash('gym', 1, 'CHAVE_UNSPLASH')
        igual(visto['cabecalhos'].get('Authorization'),
              'Client-ID CHAVE_UNSPLASH')
        verdade('orientation=portrait' in visto['url'])

        # Pixabay: NÃO usa cabeçalho nenhum — a chave vai na URL.
        I._pixabay('gym', 1, 'CHAVE_PIXABAY')
        verdade('Authorization' not in visto['cabecalhos'],
                'Pixabay não tem cabeçalho de autenticação')
        verdade('key=CHAVE_PIXABAY' in visto['url'])
        # e a palavra dele para "vertical" é outra
        verdade('orientation=vertical' in visto['url'],
                'Pixabay usa vertical, não portrait')

        # Todos se identificam: o User-Agent padrão do Python já nos
        # custou uma sessão de caça com o Cloudflare do Groq.
        verdade('urllib' not in str(visto['cabecalhos'].get('User-agent', '')).lower())
    finally:
        urllib.request.urlopen = original


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


@prova('gatilhos: os dois agentes proíbem afirmar fisiologia como fato')
def _():
    from motor import gatilhos, roteiro
    # Isto saiu de um vídeo REAL gerado aqui: o roteiro afirmou que em
    # jejum o corpo usa glicogênio e não gordura, e que queima proteína
    # para se mover. É o inverso do que a literatura mostra. A instrução
    # premiava o contraintuitivo sem exigir que fosse verdade.
    for nome, i in (('roteiro', roteiro.INSTRUCAO),
                    ('gatilhos', gatilhos.INSTRUCAO)):
        baixo = i.lower()
        verdade('não invente fisiologia' in baixo,
                f'{nome}: a regra sumiu da instrução')
        for exemplo in ('cortisol', 'queima músculo', 'seu corpo usa'):
            verdade(exemplo in baixo,
                    f'{nome}: faltou o exemplo concreto "{exemplo}"')
        # e a saída honesta no lugar
        for saida in ('observa', 'controla', 'fronteira'):
            verdade(saida in baixo, f'{nome}: não diz o que usar no lugar')


@prova('gatilhos: proíbe a hesitação com a mesma força que a invenção')
def _():
    from motor import gatilhos, roteiro
    # Esta regra nasceu de eu ter exagerado na anterior: proibi mecanismo
    # inventado e o modelo passou a hesitar em tudo. "A energia que você
    # sente muda durante a sessão" é verdade e não diz nada. Trocar
    # mentira afiada por verdade vaga é trocar um problema por outro.
    for nome, i in (('roteiro', roteiro.INSTRUCAO),
                    ('gatilhos', gatilhos.INSTRUCAO)):
        baixo = i.lower()
        verdade('não fuja para a hesitação' in baixo, f'{nome}: regra ausente')
        for muleta in ('muitas pessoas relatam', 'depende de vários fatores',
                       'cada corpo é diferente'):
            verdade(muleta in baixo, f'{nome}: faltou a muleta "{muleta}"')
        verdade('verdade afiada' in baixo,
                f'{nome}: não mostra o par certo — proibir sem dar a saída '
                'é o que produziu a hesitação')


@prova('gatilhos: a muleta é pega em CÓDIGO, não confiada ao modelo')
def _():
    from motor import gatilhos
    from motor.roteiro import Quadro
    # "costuma" voltou duas vezes num roteiro real, DUAS rodadas depois de
    # a palavra ser proibida na instrução. Empilhar proibição em prosa faz
    # o modelo obedecer umas e esquecer outras; o que dá para checar na
    # máquina não se pede, se cobra.
    sujo = gatilhos.Revisao(**revisao_exemplo(
        quadros=[Quadro(fala='Na última sessão a carga costuma cair.',
                        busca='gym'),
                 Quadro(fala='Trocar um treino pode ajudar na recuperação.',
                        busca='gym')]))
    achados = gatilhos.problemas(sujo)
    verdade(any('costuma' in a for a in achados), achados)
    verdade(any('pode ajudar' in a for a in achados), achados)
    # a mensagem é escrita para VOLTAR ao modelo: diz onde, o quê e a saída
    for a in achados:
        verdade('quadro' in a or 'gancho' in a or 'fechamento' in a or
                'aposta' in a or 'esquema' in a, f'sem localização: {a}')

    limpo = gatilhos.Revisao(**revisao_exemplo(
        quadros=[Quadro(fala='Na quarta sessão você levanta menos.',
                        busca='gym')],
        aposta='lacuna no gancho, sustentada pela especificidade do número'))
    igual(gatilhos.problemas(limpo), [])


@prova('gatilhos: "pode" legítimo não é confundido com hesitação')
def _():
    from motor import gatilhos
    from motor.roteiro import Quadro
    # "você pode registrar a carga" é instrução, não fuga. Marcar isso
    # obrigaria o modelo a escrever torto para passar na verificação.
    ok = gatilhos.Revisao(**revisao_exemplo(
        quadros=[Quadro(fala='Você pode registrar a carga no caderno.',
                        busca='notebook')],
        aposta='autorreferência: nomeia a situação de quem treina 4 dias'))
    igual(gatilhos.problemas(ok), [])


@prova('gatilhos: sigla sem explicação é pega; explicada, passa')
def _():
    from motor import gatilhos
    from motor.roteiro import Quadro
    cripto = gatilhos.Revisao(**revisao_exemplo(
        quadros=[Quadro(fala='Use a sequência 2-2-0 na semana.', busca='gym')],
        fechamento='Teste 2-2-0 por duas semanas.',
        aposta='quebra de padrão no meio, com a lacuna aberta no gancho'))
    verdade(any('2-2-0' in a for a in gatilhos.problemas(cripto)))

    claro = gatilhos.Revisao(**revisao_exemplo(
        quadros=[Quadro(fala='Dois dias de treino, dois de descanso.',
                        busca='gym')],
        fechamento='Teste duas semanas e compare a carga.',
        aposta='quebra de padrão no meio, com a lacuna aberta no gancho'))
    igual(gatilhos.problemas(claro), [])


@prova('gatilhos: roteiro sujo é refeito; se a segunda vier ruim, entrega a 1ª')
def _():
    from motor import gatilhos
    from motor.roteiro import Quadro, Roteiro

    sujo = revisao_exemplo(
        quadros=[Quadro(fala='A carga costuma cair.', busca='gym')])
    limpo = revisao_exemplo(
        quadros=[Quadro(fala='Na quarta sessão você levanta menos.',
                        busca='gym')],
        aposta='lacuna no gancho, fechada pelo teste do caderno')

    entregues = []

    def duble(sequencia):
        class Msgs:
            def parse(self, **kw):
                campos = sequencia[min(len(entregues), len(sequencia) - 1)]
                entregues.append(1)
                class R:
                    parsed_output = gatilhos.Revisao(**campos)
                    stop_reason = 'end_turn'
                return R()
        class Cli:
            messages = Msgs()
        return Cli()

    cru = Roteiro(gancho='g', quadros=[Quadro(fala='f', busca='b')],
                  fechamento='f', legenda_post='l')

    # sujo → limpo: entrega o limpo, e foram duas idas
    entregues.clear()
    r = gatilhos.revisa(cru, provedor='claude', cli=duble([sujo, limpo]))
    igual(len(entregues), 2, 'não tentou de novo com o roteiro sujo')
    igual(gatilhos.problemas(r), [], 'entregou o sujo')

    # sujo → sujo: não fica tentando para sempre, e entrega algo
    entregues.clear()
    r = gatilhos.revisa(cru, provedor='claude', cli=duble([sujo, sujo]))
    igual(len(entregues), 2, 'tentou mais de duas vezes')
    verdade(r is not None, 'devolveu nada porque a regra não foi cumprida')

    # já limpo: uma ida só, sem gastar chamada à toa
    entregues.clear()
    gatilhos.revisa(cru, provedor='claude', cli=duble([limpo]))
    igual(len(entregues), 1, 'refez um roteiro que já estava bom')


@prova('gatilhos: as três regras que nasceram de roteiros reais ruins')
def _():
    from motor import gatilhos, roteiro
    # Cada uma destas saiu de um roteiro que o pipeline produziu de
    # verdade. São o registro do que já deu errado, e por isso ficam
    # travadas: instrução que perde um caso volta a produzi-lo.
    casos = (
        # 1. o conserto virou muleta: número falso trocado por advérbio
        ('número inventado não vira advérbio', '20%'),
        # 2. quatro frases dizendo a mesma coisa
        ('cada quadro precisa acrescentar', 'o que este diz que o anterior'),
        # 3. o corpo manda 2-3-2-0 e o fecho manda 2+2
        ('o plano tem de ser um só', '2-3-2-0'),
    )
    import re
    for nome, i in (('roteiro', roteiro.INSTRUCAO),
                    ('gatilhos', gatilhos.INSTRUCAO)):
        # A instrução é texto quebrado em linhas de 72 colunas, e a quebra
        # cai no meio das frases. Procurar sem normalizar o espaço testa a
        # largura do parágrafo, não o conteúdo.
        baixo = re.sub(r'\s+', ' ', i.lower())
        for regra, exemplo in casos:
            verdade(regra in baixo, f'{nome}: sumiu a regra "{regra}"')
            verdade(exemplo in baixo,
                    f'{nome}: a regra "{regra}" perdeu o exemplo concreto; '
                    'regra sem o caso que a gerou vira conselho vago')
    # e as duas saídas honestas para um número inventado
    for saida in ('cortar', 'troCAR pelo concreto'.lower()):
        verdade(saida in gatilhos.INSTRUCAO.lower(), saida)


@prova('gatilhos: a correção de fisiologia aparece separada da manipulação')
def _():
    from motor import gatilhos
    rev = gatilhos.Revisao(**revisao_exemplo(
        alegacoes_corrigidas=['"queima proteína" → removido: a degradação '
                              'de proteína cai no exercício em jejum']))
    verdade(rev.alegacoes_corrigidas)
    verdade(rev.manipulacao_encontrada)
    # São coisas DIFERENTES: uma é mentira sobre o mundo, a outra é
    # pressão indevida sobre a pessoa. Misturar esconde a primeira.
    verdade(rev.alegacoes_corrigidas != rev.manipulacao_encontrada)
    igual(gatilhos.Revisao(**revisao_exemplo()).alegacoes_corrigidas, [],
          'o campo tem que sair vazio quando não há o que corrigir')


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
