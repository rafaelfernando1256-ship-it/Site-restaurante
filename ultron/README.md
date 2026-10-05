# Ultron

Um assistente de voz que mora dentro do seu notebook e faz as coisas de
verdade: abre programa, mexe no navegador, lê o seu WhatsApp, cria
projeto inteiro sozinho, monta apresentação e responde quanto você
faturou hoje.

```
  você fala  ─→  ele ouve        (na sua máquina, offline)
                 ele entende     (Claude Opus 5.5)
                 ele pede licença quando precisa      ← a peça que importa
                 ele faz         (51 ferramentas)
                 ele responde    (falando, enquanto ainda trabalha)
```

---

## Instalar

No Windows, dois cliques:

```
instalar.bat
```

Ele instala tudo, baixa o navegador e o modelo da palavra de ativação,
monta o `config.toml` **com os caminhos da sua máquina** e abre o
bloco de notas para você colar a chave. Depois:

```
ultron.bat --checar     diz o que está pronto e o que falta
ultron.bat              liga o modo voz
ultron.bat --texto      modo teclado, para testar sem microfone
```

Precisa de Python 3.10 ou mais novo (na instalação dele, marque **"Add
python.exe to PATH"**) e de **uma** chave de modelo.

### Qual chave

Você escolhe quem é o cérebro — quem decide e usa as 51 ferramentas:

| | onde pegar | começa com | custo |
|---|---|---|---|
| **Claude** | console.anthropic.com → API Keys | `sk-ant-api03-` | pago por uso, **à parte da assinatura do claude.ai** |
| **Gemini** | aistudio.google.com/apikey | `AQ.` ou `AIza` | tem camada gratuita |

Preencha uma das duas no `.env` e pronto: sem dizer mais nada, ele usa a
que existir. Com as duas preenchidas, escolha em `config.toml`:

```toml
[geral]
provedor = "gemini"     # ou "claude"
```

A que não for cérebro continua servindo de consultor: *"o que o Gemini
acha disso?"*.

> **Atenção à chave do Claude:** `sk-ant-usr-...` é o token do claude.ai e
> **não funciona** na API. A da API começa com `sk-ant-api03-` e sai de um
> site diferente (console.anthropic.com).

O ChatGPT (`OPENAI_API_KEY`) é só consultor, nunca cérebro — é opcional.

---

## Como se fala com ele

Diga **"Hey Ultron"** e fale. Ele fica quieto até ser chamado.

```
"Hey Ultron"  ...  abre o YouTube e toca Tim Maia
                   quantos clientes estão em negociação?
                   quanto a gente faturou hoje?
                   lê a última mensagem do grupo Pedidos
                   cria um site de uma página para a pizzaria do Marcos
                   monta uns slides sobre a proposta do Grão Dourado
                   fecha essa aba e volta pra anterior
                   qual o estado da máquina? a bateria tá em quanto?
                   o que o Gemini acha dessa ideia?
                   lembra que o contador é o Edson
                   o que você fez hoje?
```

Pode cortar ele no meio: diga **"para"** e ele cala na hora.

---

## O cérebro: ele pensa antes, e confere depois

Um assistente comum é um laço de ferramentas: o modelo chama uma, vê o
resultado, chama outra, e no fim diz que terminou. Isso funciona para
"que horas são" e falha exatamente onde dói — *"pega os leads que
responderam, monta um resumo e me manda no WhatsApp"*: ele faz o
primeiro passo, se perde, e **responde como se tivesse feito tudo**.

O Ultron faz três coisas num pedido desses:

```
  você pede  ─→  1. PLANO      o que entendi, os passos, e — a coluna que
                               muda tudo — COMO EU VOU SABER que cada
                               passo deu certo. Escrito ANTES de agir.
                 2. AÇÃO       o laço das 51 ferramentas, calado
                 3. VEREDITO   o que aconteceu, confrontado com o critério
                               que ele mesmo escreveu
```

A coluna **"como eu sei"** é o projeto inteiro. Obrigar a dizer o
critério antes de agir força três coisas que nenhuma instrução educada
consegue:

1. **decidir o que conta como pronto** — que é metade do trabalho;
2. **perceber na hora** quando um passo não tem como ser verificado. Esse
   é justamente o passo que falha calado, e o Ultron o anota no diário
   mesmo que ninguém pergunte;
3. **poder dizer "não deu"** no fim. Assistente que nunca falha é
   assistente que você não pode usar para nada sério.

No veredito, "quase" conta como **não cumpriu** — e a frase que ele fala
começa pela falha, porque descobrir depois que não foi feito é pior que
ouvir agora que falhou.

Duas decisões que valem dizer:

- **Pergunta simples não vira cerimônia.** Planejar "que horas são" é
  insuportável. A regra está em `nucleo/plano.py` e é barata: só planeja
  o que mexe em alguma coisa, o que tem conjunção ("e depois"), ou o que
  é longo demais para ser uma pergunta.
- **Planejar e agir são chamadas separadas.** O plano é pedido *sem
  ferramenta nenhuma na mesa* — com as 51 disponíveis, o modelo começa a
  usá-las em vez de pensar, e o plano vira o trabalho feito às pressas.
- **Se o planejamento falhar, ele age de qualquer jeito.** Plano é ajuda,
  não portão. Transformar um erro de rede em recusa de atender seria
  piorar o assistente para ele parecer cuidadoso.

Falta informação sem a qual o plano não se sustenta? Ele **pergunta e
para** — em vez de escolher no escuro e você descobrir depois.

---

## Ele acorda com o notebook

```
python ultron.py despertar --ligar       sobe quando você entra na conta
python ultron.py despertar --desligar    para de subir
python ultron.py despertar               diz como está
```

Três decisões que custam caro se forem erradas:

- **Na sua conta, não como serviço do sistema.** Serviço roda como
  SYSTEM: sem o seu microfone, sem o seu navegador logado, sem o seu
  WhatsApp Web. Um Ultron sem as suas sessões é um Ultron inútil.
- **Sem janela preta.** Ele usa o `pythonw.exe`; senão aparece um
  terminal que você vai querer fechar — e fechar mata o Ultron.
- **O microfone não abre sozinho.** Ele sobe esperando a palavra de
  ativação. Microfone aberto por padrão numa máquina que vai para a mesa
  de qualquer lugar é decisão sua, não minha: `config.toml` →
  `voz.escuta_sempre`.

O atalho é um `.vbs` de três linhas na pasta Inicializar, de propósito:
um `.lnk` precisa de COM e de `pywin32`, e um arquivo de texto você abre,
lê e apaga quando quiser. Transparência vale mais que elegância aqui.

---

## A peça que importa: a permissão

Você pediu acesso a tudo. Acesso a tudo é a parte fácil. A parte difícil
é acesso a tudo **sem destruir a máquina num mal-entendido** — e aqui o
mal-entendido não é hipótese, é rotina: reconhecimento de voz troca
palavra parecida, a TV ao fundo entra no microfone, alguém falando na
sala vira comando.

Então tudo que ele faz cai em um de três níveis:

| nível | o que é | o que acontece |
|---|---|---|
| **livre** | lê e olha, nada muda | faz na hora, sem perguntar |
| **cuidado** | muda algo seu, e dá para desfazer | confirma por voz (ou "sempre") |
| **perigo** | não desfaz, ou sai da sua máquina | **você digita a confirmação** |

E a regra que vale mais que todas:

> **Voz sozinha nunca autoriza coisa irreversível.**

Apagar arquivo, mandar mensagem no WhatsApp, `rm -rf`, `format`, `sudo`,
`git push --force`, mexer no registro do Windows, instalar pacote — tudo
isso pede confirmação **digitada no teclado**, sempre, mesmo com
`modo_livre` ligado, mesmo que você já tenha dito "sempre" para aquela
ferramenta. Se ele ouviu errado, o pior que acontece é você ler uma
pergunta na tela.

Isso está testado, não prometido: há um teste que verifica que a voz
**nem é consultada** quando a ação é irreversível.

### O que é "fora das pastas liberadas"

No `config.toml`, `raizes_seguras` são as pastas onde ele escreve sem
pedir — por padrão Desktop, Documentos e Downloads. Escrever em qualquer
outro lugar é nível **perigo**. `C:\Windows`, `Program Files` e
equivalentes nunca são seguros, mesmo que você os coloque na lista.

### Tudo fica escrito

Cada ação vai para um diário em `dados/ultron.db`: hora, ferramenta,
argumentos, nível, decisão e resultado. Pergunte **"o que você fez
hoje?"** e ele lê de lá. Nada é apagado antes de 90 dias.

---

## O que ele sabe fazer

`ultron.bat --ferramentas` lista as 51 com o nível de cada uma.

| grupo | o que dá para pedir |
|---|---|
| **computador** | rodar comando, abrir terminal, abrir e fechar programa, digitar, atalho de teclado, clicar, print da tela, área de transferência, volume e mídia, estado da máquina, rede e wi-fi |
| **arquivos** | ler, escrever, listar, procurar dentro dos arquivos, achar pelo nome, mover, copiar, apagar |
| **navegador** | abrir site, listar/trocar/fechar abas, ler a página, clicar por texto, preencher formulário, rolar, voltar, buscar na web |
| **whatsapp** | ver conversas, ler, procurar, enviar (com confirmação digitada), extrair faturamento |
| **clientes** | resumo do funil, quem está em cada fase, situação de um cliente |
| **projetos** | criar projeto inteiro com o Claude Code, acompanhar, mandar alterar |
| **slides** | montar .pptx com nota do apresentador |
| **música** | tocar arquivo seu ou YouTube Music, listar o que tem na máquina |
| **conhecimento** | perguntar ao ChatGPT, ao Gemini ou ao Claude — quem não é o cérebro vira consultor |
| **memória** | lembrar fato, esquecer, contar o que fez hoje |

---

## "Quanto faturamos hoje?"

Você escolheu tirar isso do WhatsApp. Funciona assim:

1. ele abre as conversas que você marcou em `whatsapp_chats`;
2. lê as mensagens do período;
3. separa **venda paga** de orçamento, proposta e negociação em aberto;
4. guarda cada venda num banco, **com o trecho exato da mensagem de onde
   o valor saiu**;
5. responde do banco.

Três decisões que fazem esse número valer alguma coisa:

**Ele não inventa.** A instrução é explícita: orçamento não conta,
"quanto custa" não conta, promessa de pagar não conta, dinheiro que
*você* pagou não conta. Na dúvida, não soma — fica numa lista de
pendências que ele te mostra.

**Ele não conta duas vezes.** Cada venda entra com uma impressão digital
do trecho que a originou. Perguntar de novo relê o WhatsApp sem dobrar o
total — porque faturamento que muda de valor quando você pergunta outra
vez não é faturamento.

**Ele mostra a origem.** Cada linha vem com a mensagem de onde saiu. Se o
total parecer estranho, dá para ver de onde veio cada centavo. E o que
ficou com pouca certeza vem marcado com ⚠.

Dá para lançar na mão também: *"Ultron, lança uma venda de mil e duzentos
do Grão Dourado"*.

> **Dinheiro é inteiro, em centavos.** E o leitor de valores distingue
> `1.200` (mil e duzentos) de `1.20` (um e vinte) pelo último separador —
> errar isso é errar por cem vezes, e já aconteceu em sistema sério.

---

## "Quantos clientes em negociação?"

Essa pergunta **não é do WhatsApp** — é do banco do projeto `funil/`, que
já sabe em que ponto cada cliente está. O WhatsApp sabe o que foi dito; o
funil sabe o que aquilo significa.

A tradução do seu jeito de falar para o jeito que o banco guarda:

| você diz | ele olha |
|---|---|
| prospecção, novos, frios | `novo`, `rascunho` |
| abordados, contactados | `abordado`, `sem_resposta` |
| **negociação**, negociando, quentes | `respondeu`, `quer_demo`, `demo_pronta` |
| fechados, ganhos | `fechado` |
| perdidos | `sem_interesse`, `descartado` |

Aponte o caminho em `config.toml` → `integracoes.funil_db` (o instalador
já tenta achar sozinho).

---

## O WhatsApp — o risco, escrito

Eu avisei que automatizar WhatsApp pessoal é contra os Termos da Meta e
que o número pode ser banido. Você reafirmou. Está implementado. O que eu
fiz para reduzir o risco **dentro da sua decisão**:

- **não usei Baileys nem whatsapp-web.js.** Essas bibliotecas falam o
  protocolo por fora, com impressão digital de cliente estranho — é o que
  a Meta detecta primeiro, e é o caminho que mais derruba número. Aqui é
  o **seu próprio WhatsApp Web**, num Chrome de verdade, com a sua
  sessão. Do lado do servidor, é indistinguível de você usando o
  computador;
- **ler é o padrão, enviar é exceção**: enviar é nível perigo e exige
  confirmação digitada;
- **nada de disparo em lista.** Uma mensagem por vez, ditada por você.

Na primeira vez ele abre o WhatsApp Web e você lê o QR code com o celular
(WhatsApp → Aparelhos conectados). Uma vez só: a sessão fica no perfil
dele.

Se um dia quiser o caminho sem risco nenhum, é a API oficial do WhatsApp
Business — e aí troca-se `ferramentas/whatsapp.py`, não o Ultron inteiro.

---

## Privacidade: o que sai da sua máquina

| | fica aqui | vai para a nuvem |
|---|---|---|
| áudio do microfone | **depende do motor — veja abaixo** | |
| palavra de ativação | **sempre** | nunca |
| transcrição do que você falou | motor local (faster-whisper) | motor do Gemini |
| conteúdo de arquivo que ele leu | — | vai, quando ele precisa ler para responder |
| conversas do WhatsApp | — | o trecho lido vai, para extrair as vendas |
| diário, vendas, memória | **sempre** | nunca |

Ele só manda alguma coisa depois que você chama. Antes disso, o
microfone está rodando um modelo de 1 MB procurando duas palavras, e mais
nada.

### Os dois motores de transcrição

| | onde roda | o áudio sai da máquina? |
|---|---|---|
| **local** (faster-whisper) | na sua CPU | **não** |
| **gemini** | na nuvem do Google | **sim** |

O padrão é `auto`: usa o local e só cai no Gemini se o local não carregar.
Para fixar um deles, `config.toml` → `[voz]` → `motor_escuta`.

**Por que o local pode não carregar:** ele depende de bibliotecas
compiladas sem assinatura digital, e o **Controle de Aplicativo do
Windows 11** (Smart App Control) bloqueia exatamente isso. O erro aparece
como `DLL load failed ... política de Controle de Aplicativo bloqueou
este arquivo` e parece falha de instalação — não é, e reinstalar não
resolve.

Quando isso acontece, o Ultron avisa na tela e usa o Gemini. A troca é
real e você precisa saber dela: o áudio passa a sair da máquina. O que
não muda é o destino — **o texto do que você fala já ia para o modelo de
qualquer jeito**, porque é ele que o cérebro recebe. O que muda é o
formato.

Se preferir manter tudo local, aí sim a saída é desligar o Smart App
Control (Segurança do Windows → Controle de aplicativo e navegador). Mas
é **de mão única**: depois de desligado, só volta reinstalando o Windows.
Eu não faria isso por causa de um microfone.

---

## Como está montado

```
ultron.py            a entrada: modo voz, modo teclado, um comando só
primeira_vez.py      monta config.toml com os caminhos da sua máquina
instalar.bat         instalação Windows em dois cliques
ultron.bat           atalho para rodar

nucleo/
  permissao.py       OS TRÊS NÍVEIS — leia este primeiro
  cerebro.py         o laço: pensa → escolhe → pede licença → faz → responde
  ouvido.py          palavra de ativação e transcrição, locais
  voz.py             a fala, em fluxo, com cale()
  registro.py        o diário de tudo que ele fez
  vendas.py          o caixa, em centavos, sem contar duas vezes
  modelos.py         Claude (cérebro), GPT e Gemini (consultores)
  config.py          chaves e caminhos

ferramentas/
  __init__.py        o registro: cada ferramenta declara nível e resumo
  computador.py      terminal, teclado, mouse, janelas, som, rede
  arquivos.py        ler, escrever, procurar, mover, apagar
  navegador.py       Chrome com perfil próprio, abas, cliques
  whatsapp.py        conversas, envio e faturamento
  funil.py           as perguntas de cliente
  projetos.py        Claude Code construindo projeto sozinho
  slides.py          .pptx
  musica.py          tocar
  conhecimento.py    GPT e Gemini
  memoria.py         lembrar, esquecer, o que fez hoje
```

### Três decisões de projeto

**Um cérebro, dois consultores.** Um modelo decide e usa as ferramentas;
os outros entram **como ferramenta**, quando você pede a opinião deles.
Três modelos decidindo o que fazer na sua máquina é três vezes a chance
de alguém decidir errado e ninguém responsável pelo resultado.

**Trocar de cérebro não afrouxa nenhuma trava.** O Claude e o Gemini
falam protocolos diferentes — formato de histórico, de chamada de função,
de resultado —, mas a classe `Motor` em `nucleo/cerebro.py` guarda a
permissão, a execução, o diário e o teto de voltas num lugar só. Os dois
SDKs sabem executar a função sozinhos, e **nos dois isso fica desligado**:
se o SDK executa, a permissão nunca é consultada.

**O laço é escrito à mão.** Porque a permissão precisa ser avaliada com
os argumentos já preenchidos: `rodar_comando("ls")` e
`rodar_comando("rm -rf /")` são a mesma ferramenta e níveis opostos. Isso
só dá para decidir depois que o modelo escolheu e antes de a mão se
mexer.

**Falado é curto, escrito é inteiro.** O que sai pelo alto-falante é o
resumo, em duas ou três frases; a lista, a tabela e o caminho do arquivo
ficam na tela. E ele começa a falar na primeira frase pronta, enquanto
ainda está trabalhando no resto — esperar o texto inteiro são cinco
segundos de silêncio que parecem travamento.

---

## Mudar o comportamento

| quero | onde |
|---|---|
| trocar o cérebro (Claude ↔ Gemini) | `config.toml` → `provedor` |
| ele me chamar de outro jeito | `config.toml` → `tratamento` |
| trocar a palavra de ativação | `config.toml` → `palavra_chave` |
| ele entender melhor o que eu falo | `modelo_escuta = "medium"` (mais lento) |
| forçar transcrição local ou pelo Gemini | `config.toml` → `[voz]` → `motor_escuta` |
| voz melhor | instale `edge-tts` e deixe `modelo_voz` neural |
| parar de me perguntar tanto | `modo_livre = true` (o nível **perigo** continua perguntando) |
| liberar outra pasta para escrita | `raizes_seguras` |
| mudar a personalidade dele | `nucleo/cerebro.py` → `PERSONA` |
| ensinar uma habilidade nova | crie um arquivo em `ferramentas/` com `@ferramenta(...)` — ele entra sozinho no catálogo |

---

## O que foi verificado, e o que não deu

**53 testes, 53 passando** — rode com `python testes.py`.
Nenhum toca a rede, o microfone ou a sua máquina: a API do Claude entra
como dublê, os arquivos vão para pasta temporária, o navegador não abre.

O que eles garantem:

- **a permissão** — comando destrutivo é perigo mesmo soando inocente;
  `/etc` e `C:\Windows` nunca são seguros; livre não pergunta; **a voz
  nem é consultada para o que é irreversível**; `modo_livre` não abre a
  porta do perigo; "sempre" vale para o reversível e não vale para o
  resto;
- **os dois laços, Claude e Gemini** — a chamada automática do SDK fica
  desligada nos dois (se o SDK executasse, a permissão não seria
  consultada), o pensamento do modelo não é falado, e as 51 ferramentas
  viram declaração válida nos dois formatos;
- **o laço** — ferramenta é executada e o resultado volta ao modelo;
  permissão negada vira resposta honesta com ordem explícita de não
  tentar outro caminho; ferramenta inexistente, argumento inválido e
  ferramenta que explode não derrubam nada e chegam ao modelo como erro
  real; o teto de voltas interrompe tarefa que não termina; cortar
  conversa antiga **não deixa resultado órfão** (um `tool_result` sem o
  `tool_use` faz a API recusar a conversa inteira);
- **o dinheiro** — formato brasileiro e americano, mesma mensagem lida
  duas vezes não soma duas vezes, confiança baixa fica marcada;
- **os slides** — .pptx válido, nenhuma forma fora da área do slide, e
  todo tema acima de 4,5:1 de contraste;
- **a fala** — sai frase por frase; `cale()` esvazia a fila em vez de só
  parar o que está tocando.

### O que eu não pude testar daqui

Isto foi escrito e testado num contêiner Linux sem placa de som e sem
tela. Então:

| | |
|---|---|
| **microfone, palavra de ativação e transcrição** | código escrito, **não exercitado com áudio real**. É a primeira coisa a conferir com `ultron.bat --checar` e depois falando com ele. O empacotamento do áudio em WAV e a escolha do motor têm teste; a captura e o reconhecimento, não |
| **voz (SAPI do Windows)** | idem — a lógica de fila e corte está testada, o som não |
| **teclado e mouse (pyautogui)** | sem tela aqui; roda na sua |
| **WhatsApp Web** | os seletores foram escritos a partir da estrutura conhecida do app. **O WhatsApp muda o HTML sem avisar** — se um dia ele não achar a lista de conversas, é em `ferramentas/whatsapp.py`, e só ali, que se mexe |
| **Netlify, Spotify e afins** | bloqueados neste ambiente |

O navegador **foi** testado de verdade (abas abertas, trocadas, lidas,
fechadas) e os slides também (arquivo gerado e reaberto).

---

## Uma coisa que eu faria no primeiro dia

Rode `ultron.bat --texto` antes de ligar o microfone. Peça umas dez
coisas digitando. Você vai ver exatamente o que ele escolhe fazer, qual
nível cada ação tem e onde ele pergunta — sem a camada de incerteza do
reconhecimento de voz no meio. Quando o comportamento estiver do seu
gosto, aí sim ligue a voz.

E comece com `raizes_seguras` apertado. É mais fácil liberar uma pasta
depois do que descobrir que ele tinha permissão para uma que você não
lembrava que existia.
