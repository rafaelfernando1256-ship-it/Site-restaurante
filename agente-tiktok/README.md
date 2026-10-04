# Agente de TikTok

Lê tendência, escreve o roteiro, grava os sites deste repositório, edita
e deixa o post pronto. Vídeo vertical 1080×1920, legenda queimada,
sem precisar de câmera.

```
tendências → roteiro → captura → edição → post
```

---

## Leia isto primeiro: o que ele faz e o que não faz

| | |
|---|---|
| ✅ grava os sites do repositório em 9:16, com rolagem suave | |
| ✅ captura interação de verdade: menu abrindo, pergunta expandindo | |
| ✅ queima legenda no estilo de vídeo vertical | |
| ✅ escreve o roteiro (pela API, ou pelo Claude Code, ou você) | |
| ✅ deixa vídeo, legenda e hashtags prontos numa pasta | |
| ⚠️ **não descobre tendência sozinho** | o TikTok não tem API pública de tendências. Veja "Tendências" abaixo. |
| ⚠️ **não posta sozinho por padrão** | precisa de app aprovado no TikTok. O código está pronto; falta a sua credencial. |
| ⚠️ **não põe música no arquivo** | de propósito — o som se escolhe no app, e explico por quê abaixo. |

---

## Instalação

Precisa de **Python 3.11+**.

```bash
cd agente-tiktok
python -m pip install -r requirements.txt
python -m playwright install chromium
cp config.exemplo.toml config.toml
```

O `ffmpeg` vem junto, pelo pacote `imageio-ffmpeg` — não precisa instalar
nada no sistema nem ser root. Se você já tiver um `ffmpeg` no PATH, ele
usa o seu.

Teste:

```bash
python3 agente.py tendencias
```

---

## Uso

```bash
# 1. ver o que está em alta e quais formatos existem
python3 agente.py tendencias

# 2. escrever o roteiro (precisa de ANTHROPIC_API_KEY)
python3 agente.py roteiro --site vanta-store --gancho antes-depois

#    …ou escrever o roteiro à mão / pelo Claude Code:
python3 agente.py roteiro --site vanta-store --de meu-roteiro.json

# 3. gravar e editar
python3 agente.py gravar --roteiro saida/<id>/roteiro.json

# 4. preparar o post
python3 agente.py publicar --pasta saida/<id>

# tudo de uma vez
python3 agente.py tudo --site vanta-store
```

Os passos são separados de propósito: quando um vídeo sai ruim, quase
sempre é o roteiro. Você conserta o JSON e roda só o `gravar` de novo.

### Dentro do Claude Code

Existe um subagente em `.claude/agents/tiktok.md`. Ele faz os quatro
passos e, principalmente, **escreve o roteiro sem precisar de chave de
API** — quem escreve é o próprio Claude Code. Peça:

> faz um tiktok do vanta-store

---

## Tendências — a parte honesta

**O TikTok não tem API pública e gratuita de tendências.** O que existe:

| caminho | funciona? | custo |
|---|---|---|
| Creative Center | é página web, não API. Dá para raspar | grátis, mas raspagem |
| Research API | só com vínculo acadêmico aprovado | — |
| Apify, RapidAPI e afins | sim | pago, sua chave |
| **você olhando o app** | **sim, e é o melhor dado** | 3 min/semana |

Por isso o padrão é `manual`. Você abre o TikTok uma vez por semana,
vê o que está se repetindo no seu nicho e anota em
`dados/tendencias.json`. É o dado mais confiável que existe: é o **seu**
feed, do **seu** público, não a média do país.

A fonte `creative-center` existe e está implementada, **desligada**. Ela
raspa a página de hashtags do TikTok: cabe discutir nos Termos de Serviço
deles, quebra quando mudarem o HTML e pode bloquear seu IP. Se quiser
ligar, é em `config.toml`. A decisão é sua, e o código nunca liga sozinho.

### E uma opinião que vale mais que o módulo

Para quem vende serviço local, **hashtag em alta importa pouco**. O que
carrega vídeo desse nicho é o **formato**: o gancho nos três primeiros
segundos, o ritmo do corte, a promessa concreta. Isso está em
`biblioteca/ganchos.json` — oito formatos com a primeira frase, a divisão
de tempo e o fechamento de cada um. Não depende de dado ao vivo e
envelhece muito mais devagar que hashtag.

---

## Por que não tem música no arquivo

Duas razões, e a primeira é a que importa:

1. **Som escolhido dentro do app entra na distribuição daquele som.**
   Áudio embutido no MP4 não entra. Você perde metade do alcance do
   vídeo para economizar trinta segundos.
2. Música comercial embutida é problema de direito autoral esperando
   acontecer.

Então: renderize mudo, suba, escolha o som no app. A ficha
`postar/COMO-POSTAR.txt` lembra você disso toda vez.

Se mesmo assim quiser trilha no arquivo (vinheta sua, som livre), passe
o caminho em `edicao.finaliza(audio=...)`.

---

## Postar pela API do TikTok

O código está escrito e testado contra a documentação em
`nucleo/publicar.py`. Falta só a sua credencial. O que você precisa saber
antes de querer isso:

1. **App sem auditoria não publica em público.** O TikTok força
   `SELF_ONLY` até auditar o seu app.
2. **São dois caminhos, com escopos diferentes:**
   - `video.upload` → cai no seu **rascunho**, você termina no app. É o
     que um app sem auditoria consegue fazer de útil.
   - `video.publish` → publica direto. **Exige auditoria aprovada.**
3. **Postar pela API custa o seletor de som.** Veja a seção acima. Na
   maioria dos dias, `preparar` continua sendo a escolha certa — não por
   limitação do código, mas porque rende mais alcance.

Para ligar:

```bash
# 1. registre o app em developers.tiktok.com e peça o produto
#    "Content Posting API"
# 2. ponha no .env (que já está no .gitignore):
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
# 3. faça o OAuth uma vez:
python3 -c "
from nucleo.config import carrega; from nucleo import publicar
print(publicar.url_de_autorizacao(carrega(), 'https://seu-dominio/retorno'))"
#    abra o link, autorize, pegue o ?code= da URL de retorno e troque:
python3 -c "
from nucleo.config import carrega; from nucleo import publicar
print(publicar.troca_codigo(carrega(), 'CODIGO', 'https://seu-dominio/retorno'))"
# 4. guarde o access_token no .env como TIKTOK_ACCESS_TOKEN
# 5. publicar:
python3 agente.py publicar --pasta saida/<id> --api
```

---

## O roteiro

É um JSON — o contrato entre "decidir" e "gravar". O esquema completo
está em `nucleo/roteiro.py`, constante `ESQUEMA`. O essencial:

```json
{
  "id": "2026-10-01-minha-loja",
  "site": "vanta-store",
  "cenas": [
    { "tipo": "rolagem",  "pagina": "/", "de": "topo", "ate": "secao:ofertas",
      "duracao": 3.5, "legenda": "ESSA LOJA VENDE PELO CELULAR" },
    { "tipo": "estatico", "pagina": "/", "em": "secao:ofertas",
      "duracao": 2.5, "zoom": 1.09, "legenda": "*TUDO LEGÍVEL SEM ZOOM" },
    { "tipo": "interacao", "pagina": "/", "duracao": 3.0,
      "acoes": [{ "tipo": "clicar", "seletor": "[aria-controls]" }],
      "legenda": "UM TOQUE ABRE O MENU" }
  ],
  "legenda_post": "...", "hashtags": ["#..."], "som": "", "cta": "..."
}
```

**`"secao:<id>"` em vez de pixel.** O roteiro diz *"mostra os preços"* e o
agente mede onde isso está na hora de gravar. Quando o site mudar de
tamanho, o roteiro continua valendo. `*` no começo da legenda pinta na
cor de destaque.

A validação roda antes de qualquer gravação e rejeita legenda longa
demais, cena fora de 0,5–8s e vídeo fora de 15–34s. Erro ali custa
segundos; erro na gravação custa minutos.

---

## Como funciona por dentro

**A rolagem não é gravada — é construída.** Gravar 300 quadros de
navegador para um clipe de 5 segundos é lento e sai trêmulo. Em vez
disso: um único print da página inteira (uma imagem de 1080×21756 px,
por exemplo) e depois uma janela 9:16 descendo por ela com suavização
cúbica. Cada quadro é um recorte em memória, enviado cru pelo pipe do
ffmpeg, sem passar por disco.

Medido neste repositório, num clipe de 5 segundos a 60 fps:

| caminho | tempo |
|---|---|
| ffmpeg recortando a imagem alta a cada quadro | **60,4 s** |
| recorte em Pillow + pipe cru | **4,3 s** |

Catorze vezes mais rápido, e a curva de suavização fica em Python
legível em vez de uma expressão de ffmpeg.

**Cena `interacao` é o caminho lento, e existe por um motivo:** menu
abrindo, pergunta expandindo e clique só acontecem com o navegador vivo.
Custa cerca de 12× o tempo da cena (3 s de interação ≈ 35 s de
gravação). Use onde ela prova alguma coisa.

**Antes de qualquer print, a página é rolada até o fim e de volta.** Sem
isso, tudo que aparece com `IntersectionObserver` — quase toda animação
de entrada moderna — sai invisível. E elementos `position: fixed` são
neutralizados no print alto: senão o cabeçalho apareceria grudado em
cada fatia, trinta vezes, descendo a tela.

**A legenda é ASS, não `drawtext`:** dá contorno, sombra e cor de
destaque, e sai queimada no arquivo (o TikTok não lê faixa de legenda
embutida). Atrás dela entra uma faixa escura em degradê — sem ela, num
teste real a frase "tudo legível sem zoom" pousou exatamente em cima do
preço que estava elogiando.

---

## Estrutura

```
agente.py                 CLI: tendencias | roteiro | gravar | publicar | tudo
config.toml               suas medidas, sua marca, seus sites  (não vai pro git)
nucleo/
  config.py               caminhos, medidas, segredos do ambiente
  tendencias.py           fontes de tendência (manual, creative-center, apify)
  roteiro.py              esquema, validação e geração do roteiro
  captura.py              Playwright: print alto e captura ao vivo
  edicao.py               Pillow + ffmpeg: clipes, legenda ASS, montagem
  publicar.py             preparar para o app, ou Content Posting API
biblioteca/
  ganchos.json            8 formatos de vídeo para o nicho
  fontes/                 Anton e Archivo Black (OFL, redistribuição livre)
dados/
  tendencias.json         o que você anotou do app          (não vai pro git)
saida/<id>/               roteiro, vídeo e pasta postar/    (não vai pro git)
```

---

## Ajustes comuns

| quero | mexo em |
|---|---|
| legenda maior ou mais baixa | `config.toml` → `[marca]` `corpo_legenda`, `altura_legenda` |
| outra cor de destaque | `[marca] cor_destaque` — formato ASS `&HBBGGRR&`, invertido em relação ao hex da web |
| outra fonte | ponha o `.ttf` em `biblioteca/fontes/` e mude `[marca] fonte` para o nome da **família** |
| adicionar um site | `[sites]` → `slug = "pasta/com/index.html"` |
| vídeo mais leve | `[video] crf` maior (23–26) ou `fps = 30` |
| novos formatos de vídeo | `biblioteca/ganchos.json` |
| tirar a faixa escura | `edicao.finaliza(com_scrim=False)` |

---

## Limites conhecidos

- **Não roda em container sem acesso ao TikTok.** O modo `--api` precisa
  alcançar `open.tiktokapis.com`. Rode na sua máquina ou numa VPS sua.
- **Cena `interacao` é lenta** (~12× o tempo da cena).
- **Seletor de interação quebra quando o site muda.** A ação falha com
  aviso e a cena continua — não derruba a gravação, mas confira o
  resultado.
- **`sonda()` não reporta dimensões** quando não há `ffprobe` no sistema
  (o binário do pip não traz). A duração e o tamanho saem certos.
