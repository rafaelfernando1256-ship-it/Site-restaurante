"""
AGENTE 3 — ESTÚDIO
Vê se o cliente quer a demonstração, lê o Instagram dele e manda o
Claude Code construir o site.

TRIAGEM
A resposta do dono chega no seu WhatsApp. Você cola aqui — é o único
ponto em que o funil precisa dos seus dedos, e é de propósito: ler a
resposta errado é o jeito mais rápido de mandar um site para quem pediu
para não mandar nada. O agente classifica e, quando é sim, já escreve o
"beleza, vou montar e te mando o link".

DE ONDE SAI O MATERIAL DO INSTAGRAM
De uma pasta de capturas de tela: `material/<slug>/`.

Não raspo o Instagram. Não é escrúpulo solto, são três fatos: a Meta
proíbe nos Termos, a página pública vem praticamente vazia sem sessão
(e automatizar sessão é o que faz a conta cair), e o endereço está
bloqueado no ambiente em que isto roda. Captura de tela do perfil leva
vinte segundos, é o que você já fez duas vezes neste projeto, e rende
muito mais do que o HTML público renderia: a grade, a bio, os destaques
e o cardápio dos posts fixados.

Se quiser colar texto — bio, cardápio, horário —, escreva em
`material/<slug>/notas.txt` e isso entra na leitura junto das imagens.

QUEM CONSTRÓI O SITE
O Claude Code, em modo não interativo (`claude -p`), rodando dentro da
pasta da demonstração com o briefing que este agente escreveu. O
briefing carrega as regras de honestidade inteiras — é o que impede o
site de nascer com preço inventado e depoimento falso.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import zipfile
from pathlib import Path
from typing import Any, Sequence

from pydantic import BaseModel, Field

from .modelo import pede_json
from .estado import (Estado, Lead, ABORDADO, RESPONDEU, QUER_DEMO, DEMO_PRONTA,
                     SEM_INTERESSE)

AGENTE = 'a3_estudio'
IMAGENS = ('.png', '.jpg', '.jpeg', '.webp')


# ── Triagem da resposta ─────────────────────────────────────────────
class Triagem(BaseModel):
    quer_demo: bool = Field(description='True só se a pessoa aceitou ver o exemplo.')
    certeza: float = Field(description='0 a 1. Abaixo de 0,7 é para humano decidir.')
    leitura: str = Field(description='Em uma linha, o que a pessoa quis dizer.')
    resposta: str = Field(description='O que responder agora, curto, no tom dela.')


TRIAGEM_INSTRUCAO = """Você lê a resposta de um dono de restaurante a quem foi \
oferecido um site de exemplo, de graça, sem compromisso.

Decida uma coisa só: ELE ACEITOU VER O EXEMPLO?

quer_demo = true: "pode mandar", "quero ver", "manda aí", "como funciona?", \
"quanto custa?" (perguntar preço é interesse), "me liga", "tenho interesse".
quer_demo = false: "não", "não temos interesse", "já temos site", "pare de mandar", \
"tira meu número", silêncio, ou resposta que não é dele (atendente dizendo que o \
dono não está).

Se a resposta for ambígua, ponha certeza BAIXA. Não force um sim.
Se a pessoa pediu para não ser mais contatada, quer_demo = false e a resposta \
deve ser só uma desculpa curta e o fim do contato — nunca uma nova tentativa.

A resposta que você escreve vai no WhatsApp, no tom dele, no máximo 2 linhas, \
sem jargão e sem promessa nova."""


def anota_retorno(est: Estado, lead_id: int, texto: str) -> None:
    """Você cola a resposta do dono. O lead vai para RESPONDEU."""
    est.guarda_mensagem(lead_id, 'retorno', texto.strip())
    l = est.lead(lead_id)
    if l and l.estado == ABORDADO:
        est.move(lead_id, RESPONDEU, AGENTE, 'respondeu no WhatsApp')


def tria(est: Estado, limite: int = 20, modelo: str | None = None,
         cli: Any = None, certeza_minima: float = 0.7,
         provedor: str = 'claude') -> dict[str, int]:
    """Classifica quem respondeu. Dúvida fica parada para você ler."""
    conta = {'quer': 0, 'nao_quer': 0, 'duvida': 0, 'falhas': 0}
    for l in est.leads(RESPONDEU, limite=limite):
        retornos = [m for m in est.mensagens(tipo='retorno', lead_id=l.id)]
        if not retornos:
            continue
        try:
            r: Triagem = pede_json(
                instrucao=TRIAGEM_INSTRUCAO,
                conteudo=f'Mensagem que você mandou para ele:\n'
                         f'{_ultima(est, l.id, "abordagem")}\n\n'
                         f'Resposta dele:\n{retornos[-1]["texto"]}',
                esquema=Triagem, modelo=modelo, cli=cli, provedor=provedor,
            )
        except Exception as e:
            conta['falhas'] += 1
            est.anota(AGENTE, 'erro', l.id, str(e)[:300])
            continue

        if r.certeza < certeza_minima:
            conta['duvida'] += 1
            est.anota(AGENTE, 'duvida', l.id, f'{r.leitura} (certeza {r.certeza:.2f})')
            print(f'  ? {l.nome}: {r.leitura} — decida você')
            continue

        est.guarda_mensagem(l.id, 'resposta', r.resposta.strip())
        if r.quer_demo:
            est.move(l.id, QUER_DEMO, AGENTE, r.leitura[:200])
            conta['quer'] += 1
            print(f'  ✓ {l.nome} quer ver — {r.leitura}')
        else:
            est.move(l.id, SEM_INTERESSE, AGENTE, r.leitura[:200])
            conta['nao_quer'] += 1
            print(f'  — {l.nome}: {r.leitura}')
    return conta


def _ultima(est: Estado, lead_id: int, tipo: str) -> str:
    ms = est.mensagens(tipo=tipo, lead_id=lead_id)
    return ms[-1]['texto'] if ms else '(não registrada)'


# ── Leitura do Instagram ────────────────────────────────────────────
class Prato(BaseModel):
    nome: str
    descricao: str = ''
    preco: str = Field(default='', description='Só se estiver ESCRITO na imagem. Senão vazio.')


class Leitura(BaseModel):
    nome_exibido: str = Field(description='Como a casa se chama no perfil.')
    uma_linha: str = Field(description='O que é esta casa, em uma frase.')
    especialidades: list[str] = Field(description='3 a 6 coisas pelas quais ela é conhecida.')
    pratos: list[Prato] = Field(description='O que aparece nos posts. Nada inventado.')
    tom: str = Field(description='Como a casa fala: formal, caseira, jovem, sofisticada...')
    paleta: list[str] = Field(description='3 a 5 cores em hex, tiradas das fotos dela.')
    endereco: str = Field(default='', description='Só se estiver visível.')
    horarios: str = Field(default='', description='Só se estiver visível.')
    telefone_visivel: str = Field(default='', description='Só se estiver visível no perfil.')
    secoes: list[str] = Field(description='Que seções o site dela deve ter, em ordem.')
    fotos_boas: list[str] = Field(description='Nomes dos arquivos que valem ir para o site.')
    nao_sei: list[str] = Field(
        description='O que NÃO está público e por isso não pode ser inventado no site. '
                    'Preço, horário, política de entrega, CNPJ, prêmio.')


LEITURA_INSTRUCAO = """Você está olhando capturas de tela do Instagram de um \
restaurante para montar o site dele.

Extraia SÓ o que está visível. Esta é a regra que vale mais que todas as outras: \
o que você não vê, você NÃO PREENCHE — vai para `nao_sei`.

Em particular:
- preço só se estiver escrito na imagem;
- horário de funcionamento só se estiver escrito;
- endereço só se estiver escrito;
- nenhuma avaliação, nenhum depoimento, nenhum prêmio, nenhuma certificação;
- nenhum número de clientes, nenhum "desde 1998" que você não leu.

Em `paleta`, tire as cores das fotos e da identidade dele, não do seu gosto.
Em `fotos_boas`, use o nome do arquivo exatamente como está na lista que te dei."""


def material_de(lead: Lead, raiz: Path) -> Path:
    return raiz / lead.slug


def reune(pasta: Path) -> tuple[list[Path], str]:
    if not pasta.exists():
        return [], ''
    imagens = sorted(p for p in pasta.iterdir() if p.suffix.lower() in IMAGENS)
    notas = pasta / 'notas.txt'
    return imagens, (notas.read_text(encoding='utf-8') if notas.exists() else '')


def le(lead: Lead, imagens: Sequence[Path], notas: str = '',
       modelo: str | None = None, cli: Any = None,
       provedor: str = 'claude') -> Leitura:
    lista = '\n'.join(f'- {p.name}' for p in imagens)
    texto = (f'Restaurante: {lead.nome}\nCidade: {lead.cidade}\n'
             f'Instagram: @{lead.instagram or "(não sei)"}\n'
             f'Categoria no Google: {lead.categoria}\n\n'
             f'Arquivos que te mandei, nesta ordem:\n{lista}\n')
    if notas:
        texto += f'\nNotas colhidas à mão:\n{notas}\n'
    # 20 imagens é o teto prático de um pedido; o perfil inteiro não cabe
    # e as primeiras capturas são as que têm bio, destaques e grade.
    return pede_json(instrucao=LEITURA_INSTRUCAO, conteudo=texto, esquema=Leitura,
                     modelo=modelo, imagens=list(imagens)[:20], cli=cli,
                     max_tokens=12000, provedor=provedor)


# ── O briefing que vai para o Claude Code ───────────────────────────
REGRAS = """## Regras que não se negociam

Este site é uma DEMONSTRAÇÃO, feita de fora, sem a casa ter contratado nada.

1. **Não invente nada.** Sem preço que você não leu, sem depoimento, sem nota
   média, sem "mais de X clientes", sem prêmio, sem certificação, sem data de
   fundação. O que falta vira um lugar óbvio para o dono preencher, nunca um
   número bonito.
2. **Nenhuma avaliação fictícia.** Se não houver avaliação real com autor, a
   seção não existe. Nada de `aggregateRating` nos dados estruturados.
3. **Nenhum pagamento.** Não existe checkout. Pedido e reserva montam a
   mensagem e abrem o WhatsApp da casa.
4. **Telefone** é o que aparece público no perfil dele, num único lugar do
   código, fácil de trocar. Se não houver, use `+55 00 00000-0000` e deixe
   escrito no README que é placeholder.
5. **O site se declara demonstração**: `<meta name="robots" content="noindex">`
   em toda página, `robots.txt` com `Disallow: /`, e uma faixa visível dizendo
   que é um exemplo e não o site oficial. Isso existe para o exemplo nunca
   roubar busca do negócio de verdade.
6. **As fotos são as dele.** Use as imagens que estão em `fotos/`. Nenhuma
   foto de banco de imagem fingindo ser a comida dele.
7. **Só a marca dele.** Nenhuma marca, logo ou nome de terceiro.

## Qualidade

Padrão igual ao de `grao-dourado/` e `mega-express/` neste mesmo repositório —
leia um deles antes de começar, é o molde:

- gerador estático em Node puro, sem dependência: `conteudo/` (todo o texto),
  `modelos/` (HTML), `construir.mjs`, saída em `publico/`;
- **nenhuma palavra do site dentro de um template** — texto mora em `conteudo/`;
- mobile primeiro, funcionando em 360px; sem rolagem lateral;
- contraste WCAG AA em todo texto;
- `alt` em toda imagem, `<h1>` único, hierarquia de heading sem salto;
- CSS e JS em arquivo próprio, sem framework;
- um `README.md` que diga o que é demonstração, o que foi deixado em branco e
  onde se troca cada coisa."""


def briefing(lead: Lead, leitura: Leitura, fotos: list[str]) -> str:
    def lista(xs):
        return '\n'.join(f'- {x}' for x in xs) if xs else '- (nada registrado)'

    pratos = '\n'.join(
        f'- **{p.nome}**' + (f' — {p.descricao}' if p.descricao else '')
        + (f' — {p.preco}' if p.preco else '')
        for p in leitura.pratos) or '- (nenhum identificado)'

    return f"""# Site de demonstração — {leitura.nome_exibido}

Construa o site inteiro nesta pasta. Tudo que você precisa saber está aqui.

## A casa

- **Nome:** {leitura.nome_exibido}
- **Cidade:** {lead.cidade}
- **Instagram:** @{lead.instagram or '(não sei)'}
- **É:** {leitura.uma_linha}
- **Tom de voz:** {leitura.tom}
- **Telefone público:** {leitura.telefone_visivel or '(não aparece — use placeholder)'}
- **Endereço:** {leitura.endereco or '(não aparece — deixe em branco e avise no README)'}
- **Horários:** {leitura.horarios or '(não aparece — deixe em branco e avise no README)'}

### Conhecida por
{lista(leitura.especialidades)}

### O que aparece no Instagram dela
{pratos}

### Paleta tirada das fotos dela
{lista(leitura.paleta)}

### Seções do site, nesta ordem
{lista(leitura.secoes)}

## As fotos

Estão em `fotos/`, já recortadas do Instagram dele:

{lista(fotos)}

Use as melhores em tamanho grande e as outras em grade. Toda imagem com `alt`
descrevendo o que é — não "foto 1".

## O QUE EU NÃO SEI — e você também não

Nada disto está público. **Não preencha.** Deixe o lugar pronto e liste no
README para o dono completar:

{lista(leitura.nao_sei)}

{REGRAS}

## Quando terminar

Rode `node construir.mjs` e confira que `publico/` abre sem erro de console.
"""


# ── A construção ────────────────────────────────────────────────────
def constroi(lead: Lead, leitura: Leitura, imagens: Sequence[Path], saida: Path,
             referencia: Path, modelo: str | None = None,
             tempo_limite: int = 3600) -> tuple[Path, str]:
    """
    Monta a pasta, chama o Claude Code e devolve (pasta, saida_do_cli).
    O zip é separado: se o build falhar, a pasta fica para você olhar.
    """
    pasta = saida / lead.slug
    fotos = pasta / 'fotos'
    fotos.mkdir(parents=True, exist_ok=True)
    nomes = []
    for p in imagens:
        destino = fotos / p.name
        if not destino.exists():
            shutil.copy2(p, destino)
        nomes.append(p.name)

    texto = briefing(lead, leitura, nomes)
    (pasta / 'BRIEFING.md').write_text(texto, encoding='utf-8')
    (pasta / 'leitura.json').write_text(
        leitura.model_dump_json(indent=2), encoding='utf-8')

    comando = [
        'claude', '-p',
        'Leia BRIEFING.md nesta pasta e construa o site exatamente como ele pede. '
        f'Use {referencia} como molde de estrutura e de qualidade. '
        'Quando terminar, rode o build e diga em uma linha o que ficou pendente.',
        '--permission-mode', 'acceptEdits',
        '--output-format', 'json',
        '--add-dir', str(referencia),
    ]
    if modelo:
        comando += ['--model', modelo]

    r = subprocess.run(comando, cwd=pasta, capture_output=True, text=True,
                       timeout=tempo_limite,
                       env={**os.environ, 'CLAUDE_CODE_MAX_OUTPUT_TOKENS': '32000'})
    relato = r.stdout.strip() or r.stderr.strip()
    try:
        relato = json.loads(relato).get('result', relato)
    except Exception:
        pass
    if r.returncode != 0:
        raise RuntimeError(f'o Claude Code saiu com código {r.returncode}: {relato[:500]}')
    if not (pasta / 'publico').exists():
        raise RuntimeError('o build não gerou a pasta publico/. '
                           f'O Claude Code disse: {relato[:500]}')
    return pasta, relato


def empacota(pasta: Path) -> Path:
    """
    Zipa `publico/` — o que vai para a Netlify é o site pronto, não o
    gerador. O index tem que ficar na RAIZ do zip, senão a Netlify
    publica uma pasta vazia.
    """
    publico = pasta / 'publico'
    if not (publico / 'index.html').exists():
        raise RuntimeError(f'não achei {publico / "index.html"}')
    destino = pasta / 'site.zip'
    with zipfile.ZipFile(destino, 'w', zipfile.ZIP_DEFLATED) as z:
        for arquivo in sorted(publico.rglob('*')):
            if arquivo.is_file():
                z.write(arquivo, arquivo.relative_to(publico))
    return destino


def tem_claude_code() -> bool:
    from shutil import which
    return which('claude') is not None


def constroi_rapido(lead: Lead, leitura: Leitura, imagens: Sequence[Path],
                    saida: Path, cfg) -> tuple[Path, str]:
    """
    O caminho sem Claude Code: o próprio modelo escreve a página inteira.
    Uma demonstração que vai por WhatsApp não precisa de projeto com
    build — precisa abrir rápido no celular de quem vai decidir.
    """
    from .construtor import monta_site
    pasta = saida / lead.slug
    pasta.mkdir(parents=True, exist_ok=True)
    (pasta / 'leitura.json').write_text(leitura.model_dump_json(indent=2),
                                        encoding='utf-8')
    monta_site(lead, leitura, imagens, pasta, cfg)
    return pasta, f'página única escrita pelo {cfg.modelo_do_cerebro}'


def roda(est: Estado, cfg, limite: int = 3, cli: Any = None) -> dict[str, int]:
    """Pega quem disse que quer, lê o Instagram e constrói."""
    conta = {'prontas': 0, 'sem_material': 0, 'falhas': 0}
    # O molde é um site pronto deste repositório, não cfg.saida — que o
    # usuário pode ter apontado para qualquer lugar.
    from . import config as _cfg
    referencia = _cfg.RAIZ.parent / 'grao-dourado'
    if not referencia.exists():
        referencia = _cfg.RAIZ.parent
    for l in est.leads(QUER_DEMO, limite=limite):
        pasta_material = material_de(l, cfg.material)
        imagens, notas = reune(pasta_material)
        if not imagens:
            conta['sem_material'] += 1
            est.guarda_demo(l.id, situacao='pendente',
                            erro=f'sem capturas em {pasta_material}')
            print(f'  ⏸ {l.nome}: ponha as capturas do Instagram em {pasta_material}/'
                  + (f' (@{l.instagram})' if l.instagram else ''))
            continue
        try:
            print(f'  lendo o Instagram de {l.nome} ({len(imagens)} imagens)...')
            leitura = le(l, imagens, notas, modelo=cfg.modelo_do_cerebro, cli=cli,
                         provedor=cfg.provedor)
            if tem_claude_code() and cfg.provedor == 'claude':
                print(f'  construindo o site de {l.nome} com o Claude Code... '
                      '(isto demora minutos)')
                pasta, relato = constroi(l, leitura, imagens, cfg.saida, referencia)
            else:
                print(f'  escrevendo o site de {l.nome}...')
                pasta, relato = constroi_rapido(l, leitura, imagens, cfg.saida, cfg)
            zip_ = empacota(pasta)
            est.guarda_demo(l.id, pasta=str(pasta), zip=str(zip_),
                            situacao='construido', erro='')
            est.move(l.id, DEMO_PRONTA, AGENTE, relato[:200])
            conta['prontas'] += 1
            print(f'  ✓ {l.nome}: {zip_}')
        except Exception as e:
            conta['falhas'] += 1
            est.guarda_demo(l.id, situacao='falhou', erro=str(e)[:500])
            est.anota(AGENTE, 'erro', l.id, str(e)[:300])
            print(f'  ✗ {l.nome}: {e}')
    return conta
