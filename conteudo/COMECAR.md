# Instalar o conteúdo — do zero ao primeiro vídeo

Cada passo termina com um comando que **confirma**, para o erro do passo
2 não aparecer no passo 6.

Tempo: 20 minutos, sendo metade espera de cadastro.

---

## Passo 1 — Pegar o código e as dependências (5 min)

No **PowerShell**:

```powershell
cd "$env:USERPROFILE\Documents\Site-restaurante"
git pull origin claude/tempero-familia-website-nzqgb4
cd conteudo
python -m pip install -r requirements.txt
```

São cinco pacotes, nenhum precisa de compilador. O `imageio-ffmpeg` traz
o ffmpeg junto — sem ele, instalar ffmpeg no Windows é baixar um zip,
descompactar e mexer no PATH, que é onde a maioria desiste.

**Confirme:**

```powershell
python conteudo.py conferir
```

Tem de imprimir o diagnóstico. Se der erro de módulo, o `python -m pip install`
não terminou.

---

## Passo 2 — O cérebro: você já tem (1 min)

O projeto lê o `.env` **desta pasta e o do funil**. Como você já pôs a
chave do Groq lá, não precisa fazer nada.

**Confirme:** no `conferir`, a linha `cérebro` diz `groq`.

Se disser "nenhuma chave de modelo", crie `conteudo\.env` com:

```
GROQ_API_KEY=gsk_sua_chave
```

---

## Passo 3 — Uma chave de imagem (3 min)

**Sem ela os vídeos saem em preto puro.** Funciona — e preto puro é o
fundo mais dark que existe — mas é metade do produto.

Basta **uma**. Vá de **Pixabay**, que é a mais rápida:

1. **https://pixabay.com/** → crie conta ou entre
2. **https://pixabay.com/api/docs/** → role até **Parameters**; no campo
   `key` a sua chave já aparece preenchida
3. Copie

Em `conteudo\.env`:

```
PIXABAY_API_KEY=sua_chave_aqui
```

Quer folga para quando a cota apertar? Ele usa em cascata, então vale
pegar uma segunda:

- **https://unsplash.com/developers** → Register as a developer → New
  Application → copie a **Access Key** (não a Secret)
- ~~Pexels~~ — **suspendeu a emissão de chaves novas em out/2026.** O
  código continua suportando, para quem já tem uma de antes.

**Confirme:** a linha `acervo de imagem` fica verde e lista o que achou.

---

## Passo 4 — A fonte (2 min, e muda bastante)

O Windows já tem **Impact**, e o código a encontra sozinha — então isto
funciona sem você fazer nada.

Mas uma condensada moderna fica bem melhor. **Anton** é a que eu usaria:

1. **https://fonts.google.com/specimen/Anton** → **Get font** → **Download all**
2. Descompacte, clique com o botão direito no `Anton-Regular.ttf` →
   **Instalar**

**Confirme:** no `conferir`, a linha `fonte` passa a mostrar `Anton` em
vez de `impact.ttf`.

---

## Passo 5 — O primeiro vídeo (5 min)

Comece pelo roteiro sozinho, para ler antes de gastar tempo com imagem e
voz:

```powershell
python conteudo.py roteiro "treinar em jejum emagrece mais"
```

Ele imprime o gancho, os quadros e a busca de imagem de cada um. **Leia.**
Se o gancho for fraco, os outros passos não salvam.

Agora o agente de gatilhos, que é o que separa isto de um slideshow:

```powershell
python conteudo.py revisar "treinar em jejum emagrece mais"
```

Ele devolve o diagnóstico, onde o vídeo perde a pessoa quadro a quadro,
a manipulação que achou e trocou, e a **aposta** — qual mecanismo está
carregando o vídeo. Guarde essa frase: é o que você mede quando o vídeo
for bem ou mal.

E então o vídeo:

```powershell
python conteudo.py video "treinar em jejum emagrece mais" --pular-roteiro
```

**Confirme:** abra o MP4 em `saida\treinar-em-jejum-emagrece-mais\`. Se
abrir, estiver vertical e der para ler a legenda no celular, funcionou.

---

## O caminho normal, depois que estiver de pé

Um comando só faz tudo:

```powershell
python conteudo.py video "seu tema" --biotipo ectomorfo
```

```
1/6 roteiro → 2/6 gatilhos → 3/6 imagem → 4/6 legenda → 5/6 voz → 6/6 vídeo
```

Sai em `saida\<tema>\`:

| arquivo | o que é |
|---|---|
| `<tema>.mp4` | o vídeo, 1080x1920 |
| `legenda-do-post.txt` | a legenda com hashtags, para colar |
| `revisao.json` | o diagnóstico e a aposta |
| `cruas/creditos.json` | autor e link de cada foto |
| `quadros/` | os quadros soltos, se quiser trocar algum |

---

## Quando algo der errado

```powershell
python conteudo.py conferir
```

| o que você vê | o que é |
|---|---|
| `nenhuma chave de modelo` | passo 2 |
| `nenhum — os quadros saem em preto puro` | passo 3; o vídeo sai mesmo assim |
| `falta instalar: ... edge-tts` | passo 1 não terminou |
| `'pip' não é reconhecido` | use `python -m pip`, que não depende do PATH |
| `sem ffmpeg` | `python -m pip install imageio-ffmpeg` |
| voz falha e o vídeo sai mudo | normal; a voz é a etapa mais frágil e não derruba o resto |
| 429 ou "limite" | cota do Groq (30/min); espere um minuto |

**Não gostou do roteiro?** Edite `saida\<tema>\roteiro.json` na mão e
rode com `--pular-roteiro`. É o arquivo que o resto do caminho consome.

---

## O que ele NÃO faz

**Não posta.** O arquivo fica na pasta e você sobe à mão. Postagem
automatizada no TikTok viola os Termos e é motivo de banimento — e a
conta é o ativo, não o vídeo.

O caminho oficial existe (Content Posting API), e o que vale ali é o
modo **Inbox**: o vídeo cai nos seus rascunhos e você toca em publicar.
Ainda não está construído — me diga se quer.
