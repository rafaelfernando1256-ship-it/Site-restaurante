# Matilha — no seu notebook, com WhatsApp Web

Os agentes e um painel que rodam **na sua máquina**. O WhatsApp Web
abre numa janela de verdade, com a sua sessão.

```
  OS CAÇADORES       O VENDEDOR           O ESTÚDIO
  1 a 7, cada um     o Claude (pela sua   Claude Code faz o
  na sua janela      assinatura) ou o     site, e a Netlify
  de Chrome          Groq conduzem a      publica
  site? zap?         conversa até o
  instagram?         fechamento
      │                  │                     │
      └──────────────────┴─────────────────────┘
                    O FLUXO
         liga uma vez, trabalha sozinho
                       │
              painel em 127.0.0.1
```

## Vindo do Órbita

A Matilha é o Órbita com outro nome, outro painel e agentes novos.
Instale do jeito de sempre (os três passos de **Instalar**, mais abaixo).
Na primeira vez, o instalador acha a pasta do Órbita pelo atalho
"Orbita" da área de trabalho e **copia** os clientes, os ajustes, as
chaves (`.env`) e a sessão do WhatsApp. A pasta antiga fica intacta:
confira tudo e só então apague. O atalho "Orbita" é trocado pelo
"Matilha".

Feche o Órbita antes. Com ele aberto, o Chrome dele segura a sessão do
WhatsApp, e você talvez precise ler o QR Code de novo.

## As telas, cada coisa no seu lugar

| Tela | O que tem |
|---|---|
| **Começar** | O que falta configurar, numa lista só, com o botão de cada passo. Abre sozinha enquanto falta o indispensável |
| **Escritório** | A sala dos agentes vista de cima: uma mesa para cada um, acesa quando está trabalhando, e o **chefe**, com quem você conversa |
| **Hoje** | O botão **Soltar a matilha**, a meta, os números do dia, **a matilha agora** (o que cada agente faz neste instante, e cada janela de caçador com a busca dela) e, à direita, **o que precisa de você** |
| **Caçada** | Ramos e cidades, quantos caçadores, a meta e os freios, e "caçar agora, sem abordar" |
| **WhatsApp** | **Conectar Claude para WhatsApp**, a conexão com o WhatsApp Web e quem respondeu |
| **Clientes** | Os projetos: o funil em abas por estágio, mais **Em produção**, **Finalizados** e **Arquivados**, e a ficha de cada negócio (com Arquivar e Encerrar) |
| **Estúdio** | Cada cliente com o site dele (sem site, na fila, fazendo, no ar, falhou) e o botão **Fazer site de demonstração** do lado: o site na hora, com a matilha ligada ou parada |
| **Rede de agentes** | O mapa dos agentes (Agent Network): o que cada um faz agora, o que está na caixa, quem está com erro, e o Jarvis no centro com tudo o que ele executou |
| **Financeiro** | O Revenue Guardian: quem paga mensalidade, quanto soma por mês e o que está pendente |
| **Ofertas** | O Offer Architect: as propostas de cada cliente, os pacotes e os resultados |
| **Value Intelligence** | O que cada produto entrega de verdade, por que isso importa para cada restaurante (com evidência), a pontuação dos benefícios e o Value Brief que vai para o vendedor |
| **Ajustes** | Negócio e preços, horários, chaves, celular, avançado e os seus dados, cada um na sua aba |

No computador as telas ficam na coluna da esquerda; no celular, na
barra de baixo. Cada tela tem endereço próprio (`#hoje`, `#whatsapp`,
`#ajustes/chaves`…), então o botão voltar do navegador funciona.

**Para saber se a matilha está trabalhando** não é preciso procurar: a
barra de cima mostra o estado em qualquer tela. Verde é **Matilha
solta**, âmbar é **fora do horário** e cinza é **Matilha recolhida**. A
tela Hoje se atualiza sozinha a cada 5 segundos.

## O escritório

Tela **Escritório** (e **Tela cheia**, para deixar aberta num monitor ou
numa TV). A sala tem quatro setores: **Caçada** (uma mesa por janela de
caçador, até 7), **Vendas** (o vendedor e o observador), **Estúdio** (o
estúdio e o publicador) e a **sala do chefe**. Só tem mesa quem existe
de verdade: a mesa acende e o boneco se mexe quando o agente está
trabalhando **agora**. Quando uma tarefa passa de um setor para outro,
um papel voa de uma mesa para a outra. Clique numa mesa para ver o que
ela está fazendo e o que fez por último.

**O chefe** entende pedidos em português, na caixa de baixo: "como foi
hoje?", "quem está esperando?", "solta a matilha em hamburgueria
Maringá", "recolhe a matilha", "libera os contatos", "tenta de novo o
que travou", "caça pousada em Marialva sem abordar ninguém". Ele lê o
estado real e só usa os mesmos botões do painel. O que manda mensagem
para alguém (soltar a matilha, liberar contatos) ele **pergunta antes**,
com um botão para confirmar. Mandar mensagem a um cliente, mudar preço
ou apagar: isso ele não faz, e diz onde você faz. Usa o Claude quando
ele está conectado; sem ele, o Groq; sem os dois, entende o básico.

## Conectar Claude para WhatsApp

Tela **WhatsApp**, primeiro cartão. Com ele ligado, quem escreve a
primeira mensagem e as respostas aos clientes é o **Claude**, com a
**sua assinatura** do Claude (Pro ou Max). Não precisa de chave de API.

O caminho é o **Claude Code** instalado neste computador, o mesmo que o
estúdio já usa para montar os sites. O chat do claude.ai não pode ser
usado por robô: os termos da Anthropic proíbem acessar o claude.ai por
automação. O Claude Code, sim, existe para ser chamado por programa, e
entra com a sua conta.

O cartão mostra três passos e sempre diz qual é o próximo:

1. **Claude Code instalado.** Se não estiver, o botão **Instalar o
   Claude Code** abre uma janela que instala e já pede o login.
2. **Conectado à sua conta.** O botão **Abrir o login do Claude** abre
   uma janela, e o login acontece no navegador. O cartão confere
   sozinho quando você termina.
3. **Uma mensagem de teste.** **Testar com uma abordagem** pede ao
   Claude uma primeira mensagem para o cliente mais recente do funil, e
   mostra como ela chegaria no WhatsApp. **Nada é enviado.**

Aí é só **Conectar Claude para WhatsApp**. Para voltar ao Groq,
**Desligar o Claude**.

**O que não muda.** As regras continuam valendo para o Claude como
valiam para o Groq: preço só os que você escreveu em Ajustes, nada de
promessa de Google, de vaga inventada nem de depoimento falso. Mensagem
reprovada é reescrita uma vez e, se continuar errada, não sai.

**O modelo.** O padrão é o do seu Claude Code. O **Haiku** responde em
uns 6 segundos e gasta pouco do plano. O **Opus** escreve melhor e
gasta mais.

**O limite do plano.** A assinatura tem limite de uso a cada poucas
horas. Quando ele acaba, a Matilha lê a hora em que volta e para de
chamar o Claude até lá. Se você tem a chave do Groq e deixou marcado
"o Groq escreve até ele voltar", as conversas seguem pelo Groq. Sem
isso, as mensagens ficam em **Esperando a hora** (tela Hoje) e saem
quando o plano volta, sem gastar as tentativas da tarefa.

## O botão "Soltar a matilha"

Na tela **Caçada** você põe a **meta de hoje** (quantos clientes
precisam dizer "quero o site"), os ramos e as cidades. Depois é
**Soltar a matilha**, ali ou na tela Hoje. A partir daí:

```
  caçador acha um  →  caixa do vendedor  →  vendedor aborda
        ↑                                        ↓
  próxima busca  ←──────────  cliente topa a demonstração
                                               ↓
                              estúdio monta → publicador põe no ar
                                               ↓
                                 vendedor manda o link ao cliente
```

Ninguém espera sinal de ninguém. O caçador acha **um** negócio e põe
na caixa do vendedor **na hora**, ainda no meio da busca — não espera
a busca acabar. O vendedor, que já está girando, pega quando pegar.
Acabou uma busca, o caçador põe a seguinte na própria caixa e segue.

**Para quando a meta fechar.** Fechou, ele para de caçar e de abordar
gente nova — mas continua respondendo quem já estava conversando.
Largar no meio da conversa alguém que você abordou há dez minutos é
pior do que não ter abordado.

### Os freios do dia

Ninguém controla quem compra. Meta de 10 num dia que rende 2, sem
limite nenhum, significa caçar a madrugada toda e mandar mensagem para
mil negócios — e terminar o dia com o número bloqueado, sem ter batido
a meta do mesmo jeito. Por isso existem três freios, todos seus para
mexer em **Os freios do dia**:

| Freio | Padrão | O que faz |
|---|---|---|
| Primeiros contatos no dia | 30 | Batido, ninguém novo é abordado |
| Espaço entre um contato e outro | 90s | Evita o padrão de disparo em massa |
| Negócios caçados no dia | 300 | O Google também conta |

E o **horário de falar** continua valendo por cima: de madrugada ele
caça e monta site, mas não manda mensagem.

**O que o botão faz de verdade:** manda mensagem para gente que nunca
falou com você, sozinho, sem você ver antes. É contra os termos do
WhatsApp e o risco é do seu número.

## Acompanhar de qualquer lugar

**Ajustes → Celular → Acompanhar pelo celular.** Um QR que abre a tela
`/ao-vivo`: a meta, quanto já vendeu hoje, o que cada setor está
fazendo agora e as últimas falas, atualizando sozinha a cada 5
segundos. Com o caminho de fora de casa aberto, funciona da rua.

## Como os agentes trabalham

Cada agente tem a **própria caixa de tarefas** e fica girando nela.
**Ninguém espera sinal de ninguém**: quem termina um trabalho põe a
próxima tarefa na caixa do setor seguinte e já volta para a sua fila.

```
  OBSERVADOR        VENDEDOR        ESTÚDIO       PUBLICADOR
  olha o mundo      caixa dele      caixa dele    caixa dele
  e põe tarefas
       │                │               │              │
       └──► responder ──┤               │              │
                        ├──► fazer site─┤              │
                        │               ├──► publicar ─┤
                        │◄─── avisar o cliente ────────┘
```

Os quatro laços são independentes. Enquanto o estúdio passa 40
segundos montando um site no Claude Code, **o vendedor responde outros
clientes no mesmo intervalo** — coisa impossível no desenho anterior,
que era um laço só passando por todo mundo em fila.

Com tarefa na caixa, o agente emenda uma na outra sem pausa. Com a
caixa vazia, dá uma espiada por segundo.

### O mural sobrevive a desligar o notebook

As tarefas ficam em `dados/mural.json`, gravado a cada mudança. Se a
luz cair no meio de uma, ela **volta para a fila** quando a Matilha
subir de novo — em vez de sumir.

Tarefa que falha volta para a fila com espera progressiva (30s, 2min,
10min, 30min). Depois de esgotar, fica **travada** e aparece no painel
com o motivo, e você manda tentar de novo com um botão. Nada é
descartado em silêncio.

## O horário de trabalho

São **duas janelas, de propósito** (Ajustes → Horários):

| | padrão | por quê |
|---|---|---|
| **Falar com cliente** | 09:00–19:00, seg a sáb | Mensagem às 3 da manhã é a melhor forma de ser bloqueado e de parecer robô. |
| **Caçar, montar site, publicar** | 07:00–23:00, todos os dias | Não incomoda ninguém. Pode rodar de madrugada. |

Assim o trabalho pesado roda à noite e, quando abre o comercial, o
vendedor acorda com tudo pronto para mandar.

Se o horário de parar for **menor** que o de começar (22:00 às 06:00),
a janela atravessa a madrugada — e o dia marcado é o dia em que ela
**começou**, senão um turno da noite seria cortado na virada.

O relógio é o **do seu computador**. Sem fuso para configurar.

Fora do horário, o agente não some: ele dorme e acorda quando abrir, e
as tarefas ficam esperando na caixa. O painel mostra quanto falta.

## Onde o fluxo começa e onde ele para

Dois pontos, e só dois:

**COMEÇA quando você solta a matilha.** Com ela solta, o primeiro
contato sai sozinho, um de cada vez, com o espaço e o teto do dia que
você escolheu em Caçada. Recolhida, quem a matilha achou fica na fila
esperando você liberar, em lote. Mensagem não pedida em massa é o
caminho mais curto para o número ser bloqueado, e número raspado é
dado pessoal: na LGPD o problema é seu.

**PARA na sua vez.** Quando o cliente fecha, o vendedor confirma o
combinado, marca o cliente como *sua vez* e continua só respondendo
as perguntas dele, sem vender de novo. O site final é seu. Depois que você entrega pelo painel, os
agentes retomam sozinhos para publicar e avisar.

Entre esses dois pontos: **zero clique seu.**

| o que acontece | quem faz | precisa de você? |
|---|---|---|
| achar negócios sem site | os caçadores | você solta a matilha |
| **primeiro contato** | o vendedor | com a matilha solta, sai sozinho; recolhida, você libera |
| responder, tratar objeção | o vendedor | não |
| fazer o site de demonstração | o estúdio | não |
| publicar na Netlify | o publicador | não |
| mandar o link da demo | o vendedor | não |
| lembrar quem ficou calado | o vendedor | não (desligável) |
| dizer o preço, com a mensalidade | o vendedor | não |
| confirmar o fechamento | o vendedor | não |
| fazer o site oficial a partir da demo | o estúdio | não |
| **conferir e publicar o oficial** | **você** | **sim, um clique** |
| pedir a aprovação, e o Pix só depois | o vendedor | não |
| alterações que o cliente pede | estúdio, publicador e vendedor | não |
| **comprar o domínio e confirmar o Pix** | **você** | **sim** |

## O estúdio: como a demonstração é feita

### A ficha do Maps, o print do Instagram, o Sonnet e o Opus

Para cada demonstração, o estúdio faz assim, sozinho:

1. **Tira o print do perfil do Instagram do negócio** (como aparece no
   computador e no celular), num Chrome invisível e **sem login**: fecha a
   janela de "entre no Instagram" para o print não sair coberto, e guarda
   também o texto da bio e a foto do perfil (quase sempre o logo). Nunca usa
   a sua conta do Instagram.
2. **Junta a ficha do Google Maps** em `_maps/GOOGLE_MAPS.md`: nota, número
   de avaliações, **as avaliações com o nome de quem escreveu**, endereço,
   horário de cada dia, telefone, faixa de preço, o resumo do Google e as
   marcações (entrega, retirada, cartão, estacionamento, acessível, pet...).
   Com a `GOOGLE_PLACES_KEY` vem a ficha inteira, pela API oficial (um
   pedido por site feito). Sem a chave, vai o que o caçador leu da tela —
   sem o texto das avaliações.
3. **O Sonnet, com esforço alto**, recebe a ficha do Maps, os prints do
   Instagram, os fatos, as fotos da ficha e os prints de referência, usa as
   **skills instaladas**, e escreve o **PROMPT-MASTER.md**: a identidade
   tirada do Instagram (cores, logo, tipo de foto, jeito de falar), as
   seções, os textos, e tudo o que importa do Maps copiado para dentro
   (as avaliações inteiras com autor, o horário, o mapa, os selos). Ele só
   escreve o prompt; não faz o site.
4. **O Opus 5.5, com esforço alto**, recebe o prompt master e os prints do
   Instagram e faz o site. Se o prompt master e o print discordarem num
   texto ou num preço, vale o print.
5. Vem a revisão de sempre: o site é fotografado no computador e no
   celular, e o Claude Code compara com o prompt master e com o print do
   Instagram e corrige.

O prompt master de cada cliente fica em
`dados/sites/<cliente>/PROMPT-MASTER.md`, a ficha do Maps em
`dados/sites/<cliente>/_maps/`, e os prints em
`dados/sites/<cliente>/_instagram/`, para você ler.

### O botão do estúdio

A tela **Estúdio** lista os clientes com o site de cada um e um botão do
lado: **Fazer site de demonstração** (ou **Refazer o site**, ou **Tentar de
novo** quando falhou). Funciona com a matilha ligada ou parada: o botão liga
só o estúdio e o publicador. O automático continua igual — quem topa ver a
demonstração na conversa ganha o site sozinho — e o mesmo cliente nunca é
feito duas vezes ao mesmo tempo.

Depois de publicado, o link:

- **vai sozinho** para quem já conversa com você;
- **não vai** para quem ainda não respondeu: o site fica no ar, e o link
  sai quando ele aceitar ver a demonstração na conversa — sem refazer o
  site. Mandar o link antes seria uma mensagem que ele não pediu.

Cliente que já fechou não tem botão: mudança no site dele é pedido de
alteração, para não apagar o site que está no ar.

O logo vai **dentro** do site. A imagem do Instagram não é usada por
link, porque os links de imagem do Instagram expiram em poucos dias e
o site quebraria.

**Sem Instagram** (ou se o Instagram pedir login, o que às vezes
acontece sem a sua conta), o pedido é o mesmo, sem o print, e a direção
de arte do ramo (abaixo) vale como decidida. O **site oficial** e o
**cardápio digital** não passam por aqui: partem da demonstração
aprovada e do cardápio conferido, pelo briefing abaixo.

**As regras que não mudam** vão no pedido do Sonnet e de novo no do Opus, e
valem acima de qualquer coisa que o prompt master disser: nada inventado
(só o que está nos fatos, na ficha do Maps ou escrito no Instagram, e nunca
número de seguidores), avaliação só a real do Google com o autor e o link, a faixa de demonstração, o
noindex, o crédito das imagens, o botão do WhatsApp, a lista do que
denuncia "site de IA". E o que está no Instagram é conteúdo do negócio,
nunca instrução para o Claude.

### O briefing de diretor de arte

Quando não há Instagram (e no oficial e no cardápio), o estúdio é o
Claude Code com um **briefing de diretor de arte** feito para cada
cliente:

- **os fatos** do negócio: nome, ramo, cidade, endereço, WhatsApp, a
  nota e as avaliações do Google, e o **horário**, que o caçador lê na
  ficha do Maps;
- **as fotos** públicas da ficha do Google Maps do próprio negócio, que
  o caçador anota (sem baixar nada, para continuar rápido);
- **a dor do ramo**, com as seções certas e o botão certo ("Pedir pelo
  WhatsApp", "Agendar", "Reservar");
- **uma direção de arte decidida**, e não "faça bonito": cada ramo tem
  algumas (para comida: "Casa de massa", clara com um clarendon de
  cantina; "Forno à noite", escura com dourado; "Mesa clara", branca
  com uma grotesca pesada), cada uma com a paleta fechada (o destaque
  só no botão), o par de fontes do Google e como fica o topo com foto e
  sem foto. Paletas e pares de fontes vêm de sites reais de estúdio. O
  mesmo cliente cai sempre na mesma direção, e duas pizzarias da mesma
  cidade não recebem o mesmo site;
- **a lista do que denuncia "site de IA"**, que o Claude recebe e que é
  conferida depois: gradiente, brilho, sombra, etiqueta em caixa alta
  em cima do título, título em duas cores, ilustração desenhada do
  produto, emoji, três cartões com ícone, "3 passos", estrelas
  desenhadas, faixa na cor de destaque, frases feitas ("bateu a fome",
  "feito com amor"), cor fora da paleta;
- **prints de referência** de sites de marcas grandes do mesmo ramo
  (Outback, Madero, Coco Bambu, Drybar, Fasano, Smart Fit…). O Claude
  abre cada print antes de começar, para saber o nível que se espera.
  É **referência**: o briefing proíbe copiar logo, nome, texto, foto ou
  cor de qualquer marca. Os prints são tirados por um Chrome invisível,
  guardados em `dados/referencias/` e refeitos a cada 30 dias. A lista
  de cada ramo fica em **Ajustes › Avançado › Sites de referência**, para
  você trocar, e lá dá para ver os prints;
- **o conferente e a revisão**: depois da primeira versão, um
  programa lê o HTML procurando cada item daquela lista, a Matilha
  fotografa o site no computador e no celular, e o Claude Code abre os
  prints com a lista de achados e corrige. Se ainda sobrar algo grave,
  vai uma terceira passada só para isso.

Nada é inventado: preço, horário, depoimento, prêmio, tempo de casa.
Faltou um dado, o site escreve em volta dele ("confira os sabores pelo
WhatsApp"). Sem foto boa, o site fica bonito pela tipografia, pela cor e
pelo conteúdo real (ilustração desenhada do produto é proibida: é a marca
mais óbvia de site gerado).

## Depois da venda

1. **Fechou**: o vendedor confirma a opção e o valor, e o estúdio já
   começa o **site oficial** a partir da demonstração: tira a faixa,
   tira o noindex, e faz os pedidos de mudança que o cliente fez na
   conversa.
2. Em **Hoje › Fazer o site final**, você clica em **Conferir** e depois
   em **Publicar e entregar**. Se preferir o seu próprio HTML, **Colar
   HTML** continua lá.
3. O vendedor manda o link e pede a **aprovação**. O combinado é: **o
   cliente só paga depois de aprovar**. É o gatilho de risco zero, e é
   verdade.
4. **Aprovou**: o vendedor manda a sua chave Pix (Ajustes › Negócio e
   preços) ou avisa que você manda. Em **Depois da venda** aparecem três
   tarefas: conferir o Pix, **ligar o domínio** (você compra no
   Registro.br, porque a compra exige o seu CPF ou CNPJ, digita o
   domínio no painel, e a Matilha liga na Netlify e diz o que apontar no
   DNS) e **a ficha do Google** (o texto pronto para mandar ao cliente).
5. **Alterações sem limite**: o cliente pede no WhatsApp ("troca o
   telefone", "põe a pizza de chocolate"), o estúdio altera o site, o
   publicador republica e o vendedor avisa que está no ar. Pedido vago
   ("põe as sobremesas", sem dizer quais): o estúdio não inventa, e o
   vendedor pergunta ao cliente o que falta.

## O Jarvis

O assistente do seu notebook, com os agentes da Matilha debaixo do braço.
Todo em azul: o núcleo muda de tom conforme o que ele está fazendo (azul
ouvindo, índigo pensando, celeste falando, ciano trabalhando, azul-gelo
esperando o seu sim). Abre pela tela **Jarvis** do painel, ou em tela cheia em
http://127.0.0.1:8899/jarvis.html.

**Como falar com ele.** Toque no microfone (ou **Ctrl+Espaço**), fale, e
pare: ele percebe o silêncio sozinho. Também dá para digitar. Ele responde
em voz alta, na voz que você escolher (desligue em "Responder em voz
alta"). Com **Conversa contínua**, depois de responder ele volta a ouvir.
No celular, o microfone só funciona pelo link seguro (o túnel, https).

**Quem pensa e quem faz.**
- Quem pensa é o **Claude**, pela sua assinatura (o mesmo Claude Code dos
  projetos, no Sonnet 5.5). Ele fica aberto o tempo todo, com a conversa
  inteira na memória (e ela sobrevive a fechar a Matilha). Também pesquisa
  na web de verdade antes de responder o que muda com o tempo: notícia,
  preço, resultado, clima. Usa as mesmas ferramentas e as mesmas
  confirmações de sempre. Cada pergunta gasta um pouco do limite da sua
  assinatura.
- Você escolhe o modo do Claude em **Voz e cérebro**. O modelo pode ser
  o **Haiku 5.5** (o mais rápido), o **Sonnet 5.5** (o equilíbrio, o
  padrão) ou o **Opus 5.5** (o mais inteligente: mais lento, e gasta mais
  do limite). O esforço pode ser **baixo** (responde logo, o padrão),
  **médio** ou **alto** (pensa bastante antes). A troca vale da próxima
  fala em diante, na mesma conversa.
- Sem o Claude (não instalado, sem login, limite do plano acabou), quem
  pensa é o **Groq**, sozinho, até o Claude voltar. Dá para escolher o
  Groq de propósito em **Voz e cérebro** (mais rápido, mais limitado).
- Quem ouve é o Whisper do **Groq**, com a sua chave (Ajustes › Chaves):
  é ele que transforma a sua voz em texto.
- Os **projetos** (apresentação, slides, PowerPoint, Word, planilha com
  gráficos, resumo, pesquisa a fundo, site) vão para o **Claude Code**,
  entrando pela sua assinatura (o login da web, `claude auth login`), nunca
  por chave de API: a Matilha tira a ANTHROPIC_API_KEY do caminho antes de
  chamar. Roda no Opus 5.5 com esforço alto, em segundo plano, numa pasta
  em Documentos › Jarvis, e escreve um RESUMO.md no fim. Quando termina,
  o Jarvis avisa. Dá para pedir mudanças no mesmo projeto ("muda o slide 3")
  e publicar ("publica a apresentação": sobe a pasta na Netlify e devolve o
  link).

**A voz dele.** A voz padrão é a **George** (bm_george), do **Kokoro**:
britânica, grave e elegante, como o mordomo do filme, falando português
com sotaque britânico. O Kokoro (github.com/hexgrad/kokoro) roda no próprio
notebook, sem internet e sem chave. Na primeira vez que a Matilha abre, ela
instala sozinha, numa pasta só dela (dados/vozes-locais), em uns minutos:
- o motor de voz, pelo npm;
- o modelo e as vozes, do Hugging Face;
- ao todo, uns 200 MB.

Enquanto instala, ele fala com a voz da Microsoft. Gerar a fala usa o
processador do notebook: a primeira frase leva uns segundos, e as próximas
vão sendo feitas enquanto ele fala.

Em **Voz e cérebro** (embaixo da conversa) tem as outras vozes para ouvir e
escolher:
- outras do **Kokoro**: Lewis, Daniel e Fable (britânicas), Michael e Onyx
  (americanas), Alex e Dora (brasileiras). Nelas só a velocidade se ajusta;
- as da **Microsoft**, grátis e sem chave, as mesmas do "Ler em voz alta"
  do Edge. O **Jarvis clássico** é o Antônio mais grave e calmo. Tem
  também o Antônio, o Macério, a Francisca, a Thalita, e as
  "multilíngues": Andrew, Brian, Rémy, Florian, Ava e Seraphina, que falam
  português com sotaque americano, francês ou alemão;
- as da **ElevenLabs**, as mais naturais, se você puser a chave em
  Ajustes › Chaves. O plano grátis dá uns 10 minutos de fala por mês.
  Aparecem as vozes da sua conta (dá para adicionar mais na biblioteca
  deles);
- a **voz do navegador**, a de antes: funciona sem internet.

Tom e velocidade se ajustam ali mesmo. A mesma voz sai no notebook, no
celular e no atalho Ctrl+Alt+Espaço. Se o serviço de voz não responder, ele
fala com a voz do navegador naquela vez.

**O que ele faz no computador.** Abrir sites e abas no Chrome, pesquisar e
ler páginas, abrir programas (Chrome, Edge, Word, Excel, PowerPoint, VS Code,
Spotify, WhatsApp, calculadora, configurações…), abrir arquivos e pastas,
listar, ler, criar, mover e apagar arquivos, rodar comandos no PowerShell,
tocar e pausar música e mexer no volume. E comandar a Matilha: os números
de agora, soltar e recolher a matilha, liberar contatos, caçar sem abordar.

**O perigoso espera o seu sim.** Para estas coisas, ele diz o que vai
fazer e pergunta "Posso?":
- apagar (vai para a Lixeira), mover ou sobrescrever arquivo;
- rodar comando no terminal;
- publicar na internet;
- soltar a matilha e liberar contatos.

Qualquer sim serve, não precisa de palavra certa: "sim", "pode", "manda
ver", "ok", "beleza", "tá certo", "pode apagar". Também aparecem os botões
**Sim** e **Não** junto da barra. "Não" ou "cancela" descarta. Um pedido
novo ("pode abrir o YouTube?") não conta como sim, e o que estava esperando
fica sem fazer. Quem segura
é o servidor: o modelo não tem como pular essa etapa, e o que vem de
página da internet é tratado como dado, nunca como ordem.
Outro site aberto no seu Chrome também não consegue mandar pedidos para o
painel (nem para o Jarvis): o servidor recusa tudo o que não vem da própria
tela da Matilha.

**Plano grátis do Groq.** O plano grátis tem limite de uso por minuto. Para
caber nele, cada pedido ao Groq leva só as ferramentas do assunto da sua
fala. Se faltar alguma, o próprio Jarvis pede o grupo que precisa. Quando o
Groq pede uma pausa (muitos pedidos seguidos), o Jarvis espera alguns
segundos e tenta de novo sozinho. Se ainda assim não der, ele avisa que é
o limite do plano.

**A tela dele é só o núcleo.** Fora da imersão aparecem só o núcleo e a
barra para falar ou digitar. Os agentes, os projetos e a
conversa inteira ficam escondidos em três botões discretos lá em cima
(**Agentes**, **Conversa**, **Projetos**): abrem como uma gaveta e fecham no
mesmo botão, no Esc ou clicando fora.

**Sem legendas.** O que você fala e o que ele responde não aparecem
escritos embaixo do núcleo: ele só fala. Para ler, abra **Conversa**, ou
marque **Legendas** embaixo da barra. Se você desligar "Responder em voz
alta", as legendas voltam sozinhas, senão a resposta não chegaria.

**Primeira fala do dia.** Na primeira vez que você fala com ele depois de
abrir a Matilha (ou no primeiro papo do dia), se a fala não traz uma
missão, só um "oi" ou um "bom dia", ele responde e pergunta se você quer
continuar com o que estava fazendo antes, falando o nome do projeto ou do
assunto. Se a fala já traz uma missão, ele faz a missão e não pergunta.

**Imersão total.** Diga "Jarvis, imersão total" (ou "tela cheia", ou
clique em **Imersão total**): a tela inteira vira o Jarvis, com o núcleo no
centro. Peça algo com números, por exemplo "quem está na frente no segundo
turno?". Ele pesquisa, responde em voz e mostra o gráfico ao lado do núcleo.
Pedidos de gráfico, de tabela ou de uma apresentação rápida entram em tela
cheia sozinhos. Projetos com página também: quando o Claude Code termina uma
apresentação, ela já aparece na tela.
- **Nos slides:** diga "próximo" e "volta", ou use as setas do teclado.
- **Fechar só o gráfico:** "fecha o gráfico".
- **Soltar o gráfico:** "solta o gráfico" (ou o botão **Soltar na tela**).
- **Sair:** **Esc**, o botão **Sair da imersão**, ou "sai da imersão".
- **Ver os números escritos:** o botão **Ver como tabela**.
- **Tela cheia de verdade, sem a barra do Chrome:** quando você pede por
  voz, o Chrome não deixa a página fazer isso sozinha, então o Jarvis aperta
  F11 por você. Isso só funciona no notebook e com a janela do Jarvis na
  frente. No celular, a imersão ocupa a tela do navegador.

**Gráficos profissionais.** Os gráficos são do **Apache ECharts**, a
biblioteca de gráficos de código aberto da Apache
(github.com/apache/echarts). Ela vem instalada dentro da Matilha e funciona
sem internet. O Jarvis não desenha nada: ele escolhe o tipo e manda os
dados, e o gráfico sai sempre com o mesmo visual. Os tipos são:
- barras, colunas e colunas empilhadas;
- linha e área;
- pizza (até 6 fatias), funil e medidor (um valor contra a meta);
- radar e dispersão.

As cores foram conferidas para quem tem daltonismo e para o fundo escuro.
Passando o mouse aparece o valor, e **Ver como tabela** mostra todos os
números.

**Gráfico solto.** Peça "põe o gráfico solto", "numa janela", "que eu
possa mover", ou peça vários para comparar. Cada gráfico vira uma janela
por cima do Jarvis:
- **Mover:** arraste pela barra de cima.
- **Mudar o tamanho:** arraste o canto de baixo; o gráfico acompanha.
- **Quantas:** até 6 ao mesmo tempo. Se a página recarregar, elas voltam no
  mesmo lugar.
- **Destacar:** abre o gráfico numa janela própria do navegador, que você
  leva para qualquer lugar da tela, até para outro monitor.
- **Tela cheia:** manda o gráfico de volta para a imersão.
- **Fechar todas:** "fecha os gráficos".

**"Bom dia, Jarvis."** Pergunte "bom dia", "como estão as coisas" ou "o que
aconteceu desde ontem". Ele começa pela **previsão do tempo** da sua cidade:
a temperatura agora, a mínima e a máxima, e a chuva quando a chance passa
de 30%, dizendo se é de manhã, à tarde ou à noite. Na primeira vez, ele
pergunta em que cidade você está e guarda. Depois mostra na tela os números
das últimas 24 horas (abordados, quem respondeu, quem fechou e sites no ar),
com o tempo numa linha em cima. Por fim fala o que precisa de você, com os
nomes, e as mensalidades para olhar. Os números vêm dos dados da Matilha, e
a previsão vem do Open-Meteo (grátis, sem chave). Nada é estimado. Também dá
para perguntar só do tempo: "vai chover amanhã?".

**Atalhos em qualquer programa (Windows).** Com a Matilha aberta, mesmo
sem a página do Jarvis:
- **Segure Ctrl+Alt+Espaço e fale**: é o Jarvis de qualquer tela. Ele
  responde pela voz do Windows. No instante em que você aperta, ele tira
  um print da tela, para poder responder "o que é esse erro?".
- **Segure Ctrl+Alt+D e fale**: é o ditado. Quando você solta, o texto
  aparece onde o cursor está (Word, e-mail, WhatsApp Web…).
Um bipe avisa que começou a gravar e outro que parou. Se outro programa já
usar uma dessas teclas, o Jarvis avisa em Ligações.

**Ver a tela.** "O que é esse erro?", "o que aparece no notebook?". Quem lê
o print é o Groq, em uns 2 segundos. Se ele não der conta, ou se você disser
"olha com calma", o Claude Code olha, com a sua assinatura. O print só sai
do notebook quando você pergunta sobre a tela, e é apagado depois de um
dia. Pelo celular, o print aparece na sua tela junto com a resposta.

**Escrever em outro programa.** "Escreve no Word: …" faz o Jarvis escrever
lá como se você tivesse digitado. Num terminal ele só escreve depois do seu
sim, e nunca aperta Enter.

**O Jarvis apresenta para você.** Com uma apresentação na tela (as rápidas,
ou as que o Claude Code faz), diga "apresenta para mim" ou toque em
**Apresentar para mim**. Ele fala cada slide e passa sozinho. A barra de
espaço pausa e continua; Esc para.

**Faxina do computador.** "O que está ocupando espaço?" mostra um gráfico
com o espaço livre, as pastas maiores, os maiores arquivos, o que está
velho em Downloads, os temporários e a Lixeira. Depois ele sugere o que
tirar. Esvaziar a Lixeira, limpar os temporários e apagar qualquer coisa
esperam o seu sim. Ele nunca mexe em Windows, Program Files ou
na pasta da Matilha.

**O Jarvis no celular, de qualquer lugar.** No notebook, na tela do Jarvis,
toque em **Ligar o celular** e escaneie o QR code. No celular, use
"Adicionar à tela inicial" e o Jarvis vira um ícone. É uma vez só: quando o
endereço do notebook mudar (ele muda a cada vez que a Matilha reinicia), o
celular acompanha sozinho. Funciona assim:
- o celular guarda um endereço fixo, um site pequeno na sua conta da
  Netlify;
- a Matilha atualiza ali o endereço novo a cada mudança;
- esse endereço fica embaralhado, e a chave para abrir vai só dentro do QR
  e fica só no seu celular. Nem a Netlify consegue ler.
Se perder o celular, gere um QR novo: o antigo para de abrir. O notebook
precisa estar ligado, com a Matilha aberta e com internet. Sem o
NETLIFY_TOKEN, o QR vale até a Matilha reiniciar.

No celular, a conversa ocupa a tela, e **Agentes** e **Projetos** sobem de
baixo. Segure o botão do microfone para falar, como num áudio de WhatsApp,
ou toque uma vez e ele para quando você ficar em silêncio. O que você pede
no celular aparece também na tela do notebook, e o contrário também.

**3D: o Jarvis monta e apresenta.** Peça, por exemplo, "faz uma academia
3D e me apresenta". Há três níveis:
- **Simples** (o padrão, ou "3D simples"): fica pronto na hora, com peças
  prontas no tamanho certo. Serve para entender o espaço. As mudanças também
  são na hora: "coloque espelhos nas paredes", "tira o supino", "piso de
  madeira", "mais 4 esteiras". Cada peça encontra seu lugar sozinha: o espelho
  não cobre a porta, a esteira fica virada para a parede e o meio é arrumado
  em fileiras, com espaço para passar. Se algo não couber, ele avisa.
- **Médio** ("3D médio", "mais caprichado"): o Claude Code faz, em alguns
  minutos, com mais detalhe, materiais e luz realistas. Se havia um 3D
  simples na tela, ele vira o ponto de partida.
- **Construção** ("para construir", "projeto de verdade"): o Claude Code faz
  tudo em escala e sem limite de detalhe: paredes com espessura, vãos de porta
  e janela, pontos de luz, tomada e água, e equipamentos com o espaço de uso.
  Junto vem o **planta-baixa.pdf**, com todas as medidas, cortes e a fachada.
  Medida que você não disse vira a medida mais comum, marcada **"a
  confirmar"**. Leva bem mais tempo (até 2 horas). É um estudo preliminar: não
  substitui o projeto assinado por arquiteto ou engenheiro (RRT/ART).

Com o 3D na tela, a câmera obedece à voz: "mostra de cima", "entra", "dá
uma volta", "olha a parede do fundo", "olha os espelhos". Também dá para
arrastar com o mouse. Ele abre com uma visita guiada: uma volta por fora e
depois entra pela porta. A parede que está entre você e a sala some,
passando o mouse numa peça aparece o nome dela, e há uma pessoa de 1,75 m
na entrada para dar a noção do tamanho. O 3D usa o three.js que já vem
dentro da Matilha, então funciona sem internet.

**Apresentações rápidas.** Cada slide escolhe o próprio formato pelo
conteúdo: capa, gráfico grande, números em destaque, ou texto ao lado do
gráfico. Nas apresentações que o Claude Code
faz, "próximo" e "volta" também passam os slides.

**Os números do gráfico são conferidos.** Cada número só vai para a tela se
aparecer no que foi lido na conversa: a pesquisa, a página da fonte, a sua
fala ou os números da Matilha. Se o Groq inventar ou "lembrar" um número, o
gráfico não aparece. Ele precisa ler a fonte de novo ou dizer que não achou.
A fonte aparece embaixo do gráfico. Pesquisa eleitoral aparece como
pesquisa, com instituto e data, e nunca como resultado.

**A página do projeto fica numa caixa de areia.** Ela abre na tela do
Jarvis por um endereço com uma ficha sorteada e não consegue falar com o
painel nem com o Jarvis. Assim, uma página com código estranho não vira
ordem para o seu computador.

**O pacote de skills.** Na primeira vez, clique em **Instalar o pacote de
skills** (na coluna da esquerda do Jarvis). Ele instala no seu Claude Code:
- **Anthropic (oficial)**: Word, PowerPoint, Excel, PDF, design de páginas,
  temas visuais, arte e teste de sites;
- **Superpowers**: planejar projetos grandes, executar em etapas, depurar
  e revisar;
- **Frontend Slides**: apresentações em HTML animadas, prontas para publicar.
- **Three.js** (cloudai-x) e **Three.js para arquitetura** (OpenAEC
  Foundation): 3D na web, montagem de cena, modelos BIM (IFC) e desempenho;
- **ECharts**: gráficos interativos de mais de 20 tipos, com regras de design;
- **Layout de apresentação** (ui-ux-pro-max): onde pôr cada gráfico e cada
  texto no slide (25 layouts), qual gráfico usar para cada dado e a estrutura
  da apresentação.
- **Equipe de vendas** (AI Sales Team, zubair-trabzada, MIT): 14 skills e 5
  agentes de vendas dentro do Claude Code. O principal é
  `/sales prospect <site>`: pesquisa a empresa, dá uma nota ao lead (BANT e
  MEDDIC), acha quem decide e escreve a sequência de abordagem. Também
  prepara reunião, monta proposta, responde objeções, faz follow-up e
  relatório. Para o Jarvis, peça "pesquisa a empresa tal para eu vender" ou
  "faz uma proposta para o cliente tal", e ele manda para o Claude Code. Os
  textos saem em inglês, a não ser que você peça em português. O relatório
  em PDF precisa do Python com o reportlab (`pip install reportlab`).
  Quem já tinha o pacote ganha esta sozinho na próxima vez que a Matilha
  abrir. Um agente seu com o mesmo nome não é trocado.
- **Marketing** (Marketing Skills, coreyhaines31, MIT): só as 7 que servem
  para ofertas: `offers`, `pricing`, `copywriting`, `marketing-psychology`,
  `sales-enablement`, `customer-research` e `ab-testing`. São a base das
  técnicas do Offer Architect (abaixo), e ficam disponíveis no seu Claude
  Code para qualquer coisa.

As copiadas não são baixadas da versão mais nova: vem sempre a mesma
versão que eu li e conferi. Se o autor mudar alguma coisa depois, a mudança
não chega até você sem uma revisão nova. E se você já tiver uma skill sua
com o mesmo nome, ela fica como está.

As skills servem para tudo o que o seu Claude Code fizer, não só para o
Jarvis. Escolhi só repositórios conhecidos, porque uma skill pode rodar
código no seu computador.

## O Jarvis no comando (controle total do painel e dos agentes)

O Jarvis não só responde: ele **opera o sistema**. Abre telas, fecha
janelas, filtra, abre e arquiva projetos, pausa e retoma agentes, pede
trabalho a eles e consulta os números de verdade. Dá para pedir de
três jeitos: pela tela do Jarvis, pela voz (atalho Ctrl+Alt+Espaço) ou
pelo **Jarvis Command Center**, o botão azul **Jarvis** no canto de
baixo de qualquer tela do painel (ou **Alt+J**).

**O Command Center** mostra o campo de comando, o microfone, se ele
está ouvindo ou processando, o **plano** (cada passo, com o que está
sendo feito agora), o resultado de cada passo, os erros em vermelho, o
histórico e a lista de ações disponíveis. Quando uma ação precisa do
seu sim, os botões **Sim** e **Não** aparecem ali mesmo.

**Exemplos que funcionam** (e muitos outros jeitos de dizer):

- "Abra Restaurant Sales" / "volte para o painel principal" / "volta"
- "Abra o Revenue Guardian" / "mostra o financeiro" / "mostre as mensalidades pendentes"
- "Abre a rede de agentes" / "mostre como os agentes estão se comunicando"
- "Qual agente está apresentando erros?" / "mostre as tarefas pendentes"
- "Pause o agente vendedor" / "pause a prospecção" / "retome a prospecção" / "coloque os vendedores para trabalhar"
- "Quantos restaurantes encontramos hoje?"
- "Abra o projeto da Pizzaria Bella" / "feche o painel de detalhes" / "fecha isso"
- "Arquive este projeto" / "encerra o projeto da Pizzaria Bella"
- "Mostre os projetos em produção" / "mostre os projetos finalizados"
- "Peça ao Brand Strategist um briefing para este restaurante"
- Vários de uma vez: "abre Restaurant Sales, mostra os agentes com erro e pausa o vendedor"

**Fechar, arquivar e encerrar são três coisas diferentes**, e fechar
nunca apaga nada:

- **Fechar** ("fecha essa janela", "fecha isso", "fecha o projeto" com ele
  aberto na tela) só fecha a janela. O projeto continua como estava.
- **Arquivar** tira o projeto da lista dos ativos (ele vai para a aba
  Arquivados). Nada é apagado, e "desarquiva" traz de volta.
- **Encerrar** marca o trabalho como acabado: entregue vira "concluído";
  antes da entrega, o que estava na fila dele é cancelado e os agentes
  param de trabalhar nele. Se há pendência (tarefas na fila, site não
  entregue, mensalidade), ele diz qual e pede o seu sim. A mensalidade
  **não** é cancelada por isso: cancelar cobrança é outra decisão.
- "Fecha o projeto da Pizzaria Bella" com ela fechada na tela: ele
  pergunta se é para arquivar ou encerrar, em vez de adivinhar.

**O que ele faz direto e o que pede o seu sim.** Navegar, abrir, fechar,
filtrar, consultar, pausar agente, arquivar e pedir briefing ele faz
sem perguntar. Pede o sim antes do que tem consequência para fora ou é
difícil de desfazer: soltar a matilha, religar os agentes (eles voltam
a mandar mensagem), liberar contatos, aprovar ou enviar uma oferta,
encerrar projeto com pendência, clicar num botão que manda mensagem,
publica ou cobra. **Apagar não existe para ele**, nem com sim, e ele não
preenche senha, chave nem Pix.

**Nada de "feito" de mentira.** Cada ação de tela só conta como feita
quando o painel devolve o estado novo (a tela que abriu, a ficha que
fechou, o filtro que ficou). Se um passo falha, ele diz qual e por quê,
e para ali: os passos seguintes ficam como "não executados".

**Por dentro:** cada coisa que ele sabe fazer é uma ação registrada
(`navigation.open`, `panel.close`, `project.archive`, `project.close`,
`agent.pause`, `agent.resume`, `agent.request`, `task.list`,
`campaign.start`, `offer.approve`, `data.query`…), com parâmetros
conferidos, permissão e registro. Os comandos de sempre são entendidos
na hora, sem gastar o seu plano; o resto o Claude (ou o Groq) entende
e chama as mesmas ações. Para o que não tem ação própria há uma camada
visual que acha o botão ou o campo **pelo nome que aparece na tela**
(nunca por posição) e só dentro do painel da Matilha. Os agentes são
os de sempre, pelo mesmo mural: **Brand Strategist** é o briefing de
marca do estúdio, **Revenue Guardian** é o cobrador, **Operations
Commander** é a operação do dia (soltar e recolher), e **Produção** é
o estúdio com o publicador.

**Tudo fica registrado** em `dados/jarvis-execucoes.json`: cada comando
ganha um correlation id, e a **Rede de agentes** mostra o que ele
executou, com cada passo, o agente acionado, a tarefa criada no mural,
o tempo, o resultado e o erro. Clique numa linha para ver o histórico
completo. A pausa de um agente fica em `dados/agentes-pausados.json` e
vale mesmo depois de reiniciar.

## Value Intelligence (o especialista em valor)

Fica entre o caçador e o Offer Architect:

```
  CAÇADOR ──► VALUE INTELLIGENCE ──► OFFER ARCHITECT ──► você aprova ──► VENDEDOR
  acha o       o que vale para ele,    monta a proposta     (Ofertas e      usa o brief e
  negócio      com evidência           com esses benefícios  Value Intel.)  pede apoio nas objeções
```

**A base de produtos é a fonte da verdade.** Cada funcionalidade do site
completo e do cardápio digital está lá com o estado (entregue, feito por
nós, ou não existe), a vantagem, o benefício, o valor para o cliente e a
evidência (a demonstração, a revisão no celular, o relatório de cliques…).
O que não existe nunca vira argumento; vira limitação. Hoje **não existem**:
painel para o dono editar sozinho, pedido/pagamento online e reserva. Por
isso o preço novo do cardápio é "manda pelo WhatsApp que a gente atualiza",
e nunca "vocês mesmos atualizam pelo painel" (esse texto é bloqueado no
brief e na oferta).

**Para cada restaurante** ele separa o que é fato (com a fonte: Google Maps,
o cardápio em PDF, a conversa) do que é hipótese ("pergunte antes de
afirmar"), pontua cada benefício (relevância 30, intensidade do problema 25,
evidência 20, diferenciação real 15, clareza 10; 85+ prioritário, 70+
relevante, 50+ complementar) e escolhe os três que mais pesam. É heurística
de prioridade, não previsão de venda.

**O Value Brief** (o resumo de valor) é gravado em disco antes de criar a
tarefa do Offer Architect; se a Matilha cair no meio, ao subir ela cria só
a tarefa que faltou. O vendedor só usa brief **aprovado** e **enviado**
(botões na página, ou pelo Jarvis). No meio da conversa, quando o dono diz
"tá caro", "já tenho Instagram", "o outro é mais barato" ou "aumenta as
vendas?", o vendedor pede apoio ao Value Intelligence pela fila e espera
alguns segundos; a resposta é honesta: preço só o aprovado no catálogo,
nada de desconto inventado, e quando não há vantagem real ela diz isso.

**Mudou o produto?** Na página, no mapa de valor, troque o estado da
funcionalidade (pede o seu sim). A versão do produto sobe e os briefs
antigos são refeitos sozinhos.

Pelo Jarvis (ou pelo Command Center):

| Você diz | O que acontece |
|---|---|
| "qual o valor do nosso cardápio digital?" | os benefícios mais fortes, com a evidência, e o que o produto não tem |
| "explique por que essa pizzaria precisaria de um site" | o valor do site para o restaurante aberto na tela |
| "mostre os três maiores benefícios" | os três do brief, com pontos e evidência |
| "peça ao Value Intelligence uma análise deste restaurante" | tarefa no mural, brief gravado, e a página abre com ele |
| "aprova o resumo de valor" | pede o seu sim e aprova |
| "envie o resumo de valor para o vendedor" | o vendedor passa a usar (só se estiver aprovado) |
| "compare o valor do site completo com o cardápio mensal" | o que só um tem, o que os dois têm, e para quem cada um serve |
| "abre o Value Intelligence" / "pausa o Value Intelligence" | abre a página / pausa o agente |

Na **Rede de agentes**, o nó do Value Intelligence mostra o rastro de cada
brief: restaurante, versão do produto, benefícios, a tarefa que foi para o
Offer Architect, a oferta ligada e se já está com o vendedor. Os dados
ficam em `dados/valor.json`.

## Ofertas inteligentes (Offer Architect, o agente 4)

Fica entre o caçador e o vendedor:

```
  CAÇADOR ──► OFFER ARCHITECT ──► você aprova ──► VENDEDOR ──► ESTÚDIO
  acha o       monta a proposta     (aba Ofertas)    aborda com     monta o
  negócio      (caixa "ofertas")                     a proposta     site
```

Tudo pelo mesmo mural: depois do Value Brief gravado, o Value Intelligence
põe `offer.generate` na caixa das ofertas; o agente monta a proposta e espera você. Sem a oferta aprovada,
o vendedor **não aborda** (o "Liberar" manual em Hoje continua valendo,
porque aí a decisão já foi sua). Desligável em Ofertas › Pacotes e preços.

**O que ele monta**, para cada cliente: o problema verificado (com a
fonte de cada fato: a nota do Google, "não encontrei site", "cardápio em
PDF"…), a solução, a proposta de valor, o pacote recomendado e uma
alternativa, como apresentar o preço, os bônus permitidos, a mensagem de
abertura, as respostas para as objeções prováveis e o próximo passo. Em
até 3 versões, cada uma com um ângulo, e uma nota de 0 a 100 (relevância
25, clareza 20, diferenciação 15, preço 15, credibilidade 15, simplicidade
10, pesos editáveis). A nota é uma heurística para você priorizar a
revisão, não previsão de venda; abaixo de 75, fica marcada para revisar.

**O que ele não pode fazer**, e é conferido por programa, não por pedido:
preço fora do catálogo ou abaixo do mínimo; bônus, grátis, desconto ou
teste que você não autorizou; funcionalidade que o pacote não tem;
depoimento inventado; escassez simulada; resultado garantido ("vai dobrar
suas vendas", "mais pedidos"); "vocês estão perdendo clientes" sem prova;
falar mal de concorrente; esconder taxa obrigatória; garantia que não
existe; pressão. A versão que quebra uma regra volta **uma vez** para ser
reescrita. Se continuar errada, fica bloqueada até você editar. Não há
laço de refinamento: são no máximo 2 chamadas ao modelo por oferta.

**A aba Ofertas** (menu da esquerda):

- **Propostas**: escolha o cliente e **Gerar oferta** (funciona mesmo com
  a matilha parada), ou **Gerar para quem espera o primeiro contato**. Em
  cada proposta: as versões, **Comparar versões** lado a lado, **Editar**
  (volta a ser conferida e a precisar de aprovação), **Aprovar**,
  **Rejeitar** e, depois de aprovada, **Enviar ao vendedor**: o pacote e o
  preço aprovados ficam gravados no cliente, e o vendedor e o cobrador
  passam a usar exatamente esses.
- **Pacotes e preços**: Cardápio Essencial (R$ 49,90/mês) e Profissional
  (R$ 79,90/mês) vêm **de exemplo**, não de pesquisa de mercado; o Site
  Profissional vem com o preço que você já tinha. Confira preço, preço
  mínimo, custo (aparece a margem), prazo e funcionalidades, e **aprove**
  cada pacote: oferta com pacote não aprovado não pode ser aprovada. Mexer
  no preço de um pacote aprovado tira a aprovação dele. Os bônus
  (implantação sem custo, migração assistida, desconto temporário, pacote
  anual, período experimental…) começam desligados, menos a demonstração,
  que a Matilha já faz. Desconto que leva um pacote abaixo do mínimo é
  barrado. A aprovação pode ficar "sempre por você" (padrão) ou automática
  só para oferta impecável (sem problema, pacote aprovado, nota acima do
  limite).
- **Resultados**: por ângulo e por pacote, quantos foram contatados,
  responderam e fecharam, o valor contratado e as objeções que apareceram
  (preço, "agora não", "já tenho", ver com o sócio, desconfiança). Ele só
  diz que uma oferta é melhor com pelo menos 30 contatos em cada e
  diferença que passa no teste estatístico (95%): 30 contatos com 2
  fechamentos contra 30 com 3 é "amostra pequena". As **sugestões** dele
  ficam esperando você; nunca mudam preço nem promessa sozinhas.

Ele escreve com o mesmo motor do vendedor: o Claude pela sua assinatura,
se estiver ligado em WhatsApp › Conectar Claude (com o Groq de reserva),
ou o Groq. As ofertas ficam em `dados/ofertas.json`.

## O endereço .com.br (agente do domínio)

A demonstração fica na Netlify e some. O site final tem endereço próprio,
.com.br, registrado **no seu nome** (uns R$ 40 por ano, que você embute na
mensalidade). A Netlify continua guardando os arquivos, mas ninguém vê
"netlify" no endereço.

1. Quando o cliente fecha, o **agente do domínio** procura nomes .com.br
   livres a partir do nome do negócio (consulta pública do Registro.br) e
   o vendedor manda os nomes no WhatsApp para ele escolher.
2. Em **Depois da venda** aparecem os nomes, o escolhido e o botão
   **Comprar no Registro.br** (o link já abre com o nome). A compra é sua:
   o Registro.br exige CPF ou CNPJ e pagamento, e não vende por programa.
3. Comprou: clique em **Comprei**. A Matilha liga o domínio ao site na
   Netlify e mostra os dois registros para criar no Registro.br (DNS →
   Editar zona): um **A** para 75.2.60.5 e um **CNAME** do www.
4. O agente confere sozinho a cada 15 minutos. Quando o endereço abre com
   cadeado, a entrega sai para o cliente já com o .com.br (e a plaquinha
   do QR Code também usa ele). Dois dias sem abrir: ele chama você.
5. Pressa? Em Fazer o site final, **Entregar com o link provisório** manda
   o link da Netlify sem esperar.

## O cobrador, o relatório do mês e o analista

- **Mensalidade**: todo mês, no dia em que o cliente aprovou o site (dia
  29 a 31 vira 28), o vendedor manda o valor e a sua chave Pix. Três dias
  depois, um lembrete gentil ("se já pagou, desconsidere"). Aos sete dias,
  nenhuma mensagem a mais: chama você. Se ele disser "paguei", você é
  chamado para conferir. Quem marca **Pagou** é você, no cartão
  Mensalidades. Liga e desliga em Ajustes › Negócio e preços › Lembretes.
- **Relatório do mês**: nos três primeiros dias do mês, uma mensagem curta
  com quantas pessoas clicaram em pedir pelo WhatsApp no site dele, as
  mudanças feitas e quando o cardápio foi atualizado. Os cliques são
  contados no **Netlify Forms** da sua conta: o site final leva um
  formulário escondido, e o botão continua indo direto ao WhatsApp. O
  plano grátis conta até 100 por mês por site (passou, vira "mais de 100").
  Se o relatório sair sem cliques, ligue a detecção de formulários na
  Netlify: Site configuration → Forms → Enable form detection.
- **O analista** (tela Caçada › O que está funcionando): quantos
  responderam, viram a demo e fecharam, por ramo, por cidade e por
  **abertura do primeiro contato**. Metade dos negócios recebe a abertura A
  (começa pela nota do Google) e metade a B (começa com uma pergunta). Ele
  só aponta um vencedor com 10 contatos ou mais no grupo.

## O WhatsApp só lê leads

O observador só abre conversas de quem é lead (pelo número ou pelo nome).
Conversa de amigo, família, fornecedor ou grupo nem é aberta: continua não
lida no seu celular, e nada dela é lido.

## O estúdio usa o Opus 5.5 (e o Sonnet no prompt master)

Tudo o que o estúdio faz (demonstração, oficial, cardápio, alterações e a
leitura das fotos do cardápio) roda no **Claude Opus 5.5 com esforço
alto** — menos o prompt master da demonstração, que é escrito pelo
**Sonnet com esforço alto**. Se a sua conta ainda não tiver o Opus 5.5, o estúdio avisa uma vez
e segue com o modelo padrão da conta. O vendedor continua com o modelo
escolhido em WhatsApp › Conectar Claude.

## Restaurantes: o cardápio digital

Para quem vende comida (a lista de ramos está em Ajustes › Negócio e
preços), o vendedor apresenta **duas opções**: o site completo e **só o
cardápio digital**, com o preço que você puser lá (em branco, o cardápio
não é oferecido). Quem escolhe é o dono.

1. **A demonstração já vem com o cardápio dele.** Antes de montar, o
   estúdio abre a ficha do restaurante no Google Maps (aba Cardápio) e o
   Instagram dele, baixa as fotos que parecem cardápio, e o Claude Code
   transcreve os pratos e os preços. Nada é inventado: o que não dá para
   ler fica de fora, e a demo diz em letra pequena que os preços são os
   das fotos publicadas. Sem foto de cardápio (ou se o Instagram pedir
   login), a demo sai sem a lista, como antes.
2. **Ele escolhe.** O vendedor anota a opção ("quero só o cardápio" vira
   venda de cardápio digital). Venda sem opção escolhida não conta: ele
   pergunta qual.
3. **A foto de hoje.** No fechamento, o vendedor pede uma foto do
   cardápio atual, com os preços. Quando ela chega no WhatsApp, a
   Matilha guarda (dados/recebidas/) e o estúdio lê.
4. **Você confere.** Em Hoje › **Conferir cardápio** aparecem a foto e a
   lista, uma linha por item (`nome | descrição | preço`, categoria com
   `#`). Corrija o que precisar e clique em **Está certo, usar este
   cardápio**. Só então o oficial é feito. Se o cliente não mandar a
   foto, **Digitar eu mesmo** deixa você escrever a lista.
5. **O oficial.** Site completo: a demo vira o oficial com o cardápio
   conferido. Só o cardápio: o estúdio faz uma página de cardápio para
   o celular (categorias no topo, nome e preço na mesma linha, botão de
   pedir pelo WhatsApp), com a mesma cara da demonstração.
6. **A plaquinha da mesa.** Depois que ele aprova, em Depois da venda
   aparece **Abrir a plaquinha para imprimir**: o nome do restaurante e
   o QR Code do cardápio no ar. Imprima ou salve em PDF e mande a ele.
7. **Preço mudou?** Ele manda a foto nova ou escreve no WhatsApp; você
   confere de novo e o estúdio troca no ar.

**As vagas são de verdade.** Em Ajustes › Negócio e preços você diz
quantos sites oficiais pega por semana (3, se não mudar). A Matilha
conta as vendas desde segunda. O vendedor só fala de vaga depois que o
cliente viu a demonstração e gostou, com o número real, e quando acaba,
diz que o dele começa na segunda seguinte.

## O caminho da conversa

Cada momento tem **um** objetivo, e o vendedor sabe em qual está:

| momento | objetivo |
|---|---|
| primeiro contato | um "pode mandar" para a demonstração. **Sem preço, sem link, sem prazo** |
| antes da demonstração | o mesmo "pode mandar", respondendo a dúvida ou a desconfiança dele |
| demonstração enviada | ele abrir e dizer o que achou de uma parte específica |
| depois da demonstração | ele decidir deixar oficial, já sabendo o preço e a mensalidade |
| cliente | atender bem quem fechou, sem vender de novo |

**O preço não vai no primeiro contato.** Testado: com preço logo na
primeira mensagem, ela vira anúncio, e anúncio de quem você não
conhece se ignora. O preço sai quando o dono pergunta, ou depois que
ele viu o site dele pronto.

**Perguntar o preço não é fechar.** "Quanto custa?" e "como faço para
pagar?" recebem a tabela e a pergunta "qual das duas?". A venda só é
registrada (e só conta na meta) quando o dono, **depois de ver a
demonstração e de saber o valor**, diz qual quer. Aí sai **uma**
mensagem confirmando a opção, o valor com a mensalidade, o prazo e o
pagamento.

**O que convence**, e que o vendedor usa:

- **um detalhe real** do negócio: a nota e o número de avaliações no
  Google ("4,7 com 183 avaliações"), que o caçador lê no Maps;
- **a dor do ramo**: a pizzaria perde o pedido para quem mostra o
  cardápio; a barbearia, o cliente novo que queria ver os cortes; a
  pousada paga comissão para a plataforma de reserva. Os ângulos de
  cada ramo estão em `agentes/roteiro.mjs`;
- **a demonstração**: trabalho pronto, grátis, sem compromisso. A
  faixa no topo dela diz "Gostou? Responda a mensagem no WhatsApp para
  deixar este site no ar";
- **de onde veio o número** (a ficha pública do Google Maps), que tira
  a cara de golpe.

**As objeções de sempre** ("é golpe?", "já tenho Instagram", "não
preciso", "tá caro", "vou pensar", "meu sobrinho faz", "me liga") têm
um caminho honesto cada uma, também em `agentes/roteiro.mjs`. "Me
liga" põe o cliente em **Chamaram você**, na tela Hoje.

**Os lembretes.** Um para quem não respondeu o primeiro contato (dois
dias depois). Dois para quem recebeu a demonstração e ficou calado (um
dia depois, e um dia antes de ela sair do ar, com a data real). Param
no primeiro sinal do cliente. Desligáveis em Ajustes › Negócio e
preços › Lembretes.

**O conferidor** roda em cima de toda mensagem antes de ela sair, e
devolve para reescrever a que tiver: valor que você não configurou,
preço no primeiro contato, link que não existe, pedido de foto ou de
cardápio (anexo não é lido), promessa de Google ou de faturamento,
urgência sem fato, "presença digital" e outras frases de robô, ou a
mesma mensagem repetida. Reprovada duas vezes, ela **não sai**: vai
para **Mensagens seguradas**, na tela Hoje, e abre na ficha do cliente
para você corrigir e mandar.

## Os gatilhos do vendedor

Gatilho mental e escassez estão lá. Só os que **se sustentam se o
cliente cobrar**:

| gatilho | como ele é verdade aqui |
|---|---|
| prova | o site já está pronto e no ar, verificável num clique |
| especificidade | a nota e as avaliações dele, o ramo, a cidade |
| reciprocidade | o trabalho vem antes do dinheiro |
| custo de oportunidade | quem procura e não acha, acha o concorrente |
| **escassez** | só as **vagas** que você põe no painel e a **validade da prévia**, que o sistema cumpre, derrubando o site no dia |

"Só hoje", "última chance", "não perca" sem fato por trás: o conferidor
**descarta a mensagem** e manda reescrever.

## Preços: como cobrar e o que oferecer

**Ajustes → Negócio e preços.**

**Como você cobra**, duas formas:

| Modo | O cliente ouve |
|---|---|
| Para fazer + manutenção | "R$ 350 para fazer + R$ 127 por mês" |
| Só mensalidade | "R$ 127 por mês — fazer está incluído" |

**O que oferecer.** Para a maioria dos ramos, o site completo. Para
quem **vende comida**, o vendedor apresenta **as duas opções** — o
site completo (com o cardápio dentro) e o cardápio digital sozinho,
mais barato — e deixa o dono escolher. Preço de cada um é seu.

Deixe o cardápio em branco para não oferecer. A lista de ramos que
contam como "comida" é editável; em branco vale a padrão (restaurante,
pizzaria, lanchonete, hamburgueria, açaí, padaria, bar, sushi…).

O cartão mostra **a frase que o cliente vai ouvir**, montada com o
mesmo código que o vendedor usa — não é um exemplo escrito à mão.

### O validador de dinheiro

Os valores do painel são os **únicos** que o agente pode dizer.
Qualquer outro número em reais na mensagem — desconto inventado,
"preço especial", arredondamento — faz a mensagem ser **rejeitada e
reescrita** antes de sair. Número que não é preço ("abrimos às 9",
"10 fotos") não é confundido com valor.

Isso está provado nos testes: uma resposta com "faço por R$ 200" não
chega ao cliente.

## A mensalidade sai antes do "sim"

Você pediu que o agente avise dos R$ 127/mês **na entrega**. Ele avisa —
e avisa **antes** também, na mesma mensagem em que diz o preço, quando o
cliente fala que quer o site final.

Mensalidade que aparece só no fim é o motivo nº 1 de arrependimento e
estorno, e o Código de Defesa do Consumidor pede preço claro antes do
negócio fechado. Dizer antes custa uma frase; dizer depois custa o
cliente.

O valor é editável em **Ajustes → Negócio e preços → Por mês**.

## Quantos caçadores soltar

Tela **Caçada → Os caçadores → Caçadores ao mesmo tempo**: de 1 a 7.
Vale a partir da próxima vez que você soltar a matilha.

**Cada caçador abre o próprio Chrome**: um Chrome separado, não uma
aba nem uma janela dentro do Chrome dos outros. Cada um tem o seu
perfil, com os próprios cookies, guardado em
`dados/navegador-matilha/cacador-1/`, `cacador-2/`…, e trabalha ao
mesmo tempo que os outros. As janelas abrem em escada, para dar para
ver todas. Na tela Hoje, em **A matilha agora**, cada caçador aparece
numerado com a busca que está fazendo. O que está caçando acende em
laranja. Separados, um caçador não espera o outro carregar a página;
fechar (ou travar) o Chrome de um não derruba os outros, e ele reabre
sozinho na próxima busca; e um "Google pediu verificação" num não
para os outros.

Cada caçador pega uma busca da roda (um ramo numa cidade), e as janelas
correm juntas. Quem já foi lido numa volta anterior é pulado sem
clique, quem mostra o botão "Site" na lista é descartado sem clique, e
as imagens e as fontes do Maps nem são baixadas. Quando a lista de uma
busca acaba, ela sai da roda até o dia seguinte; se todas acabarem, a
caçada para e pede mais ramos ou cidades.

Cada caçador é um Chrome inteiro e usa uns 200 a 300 MB de memória.
Sete terminam antes que três, até o ponto em que o notebook não dá
conta. Se ele travar durante a caçada, baixe o número. Nunca abrem mais
Chromes do que buscas: dois
ramos numa cidade são duas buscas, então sete caçadores viram dois. As
janelas ficam abertas entre uma caçada e outra, e **Fechar as janelas**
(tela Caçada) fecha todas. Elas abrem de novo sozinhas.

## As três fontes do caçador

| fonte | chave? | como acha |
|---|---|---|
| **Navegador** (padrão no painel) | não | abre o Google Maps numa janela visível e lê a lista, como você faria à mão |
| **OpenStreetMap** | não | dado aberto, consulta pública. Acha menos no Brasil |
| **Google Places** | sim, com cartão | API oficial. Acha mais, 1.000 buscas grátis por mês |

## Instalar (ou atualizar): três passos

1. Deixe o **matilha.zip** na pasta **Downloads** (é onde o navegador já
   salva). Não precisa extrair nem desbloquear.
2. Aperte **Windows + X** → **Terminal** (no Windows 10: Windows
   PowerShell).
3. Cole esta linha e aperte **Enter**:

```
$z=(Get-ChildItem "$((New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path)\matilha*.zip"|Sort-Object LastWriteTime|Select-Object -Last 1).FullName;if(!$z){Write-Host 'Nao achei o matilha.zip na pasta Downloads.' -ForegroundColor Red}else{$t="$env:TEMP\matilha-novo";Remove-Item $t -Recurse -Force -ErrorAction SilentlyContinue;Expand-Archive $z $t;$MatilhaOrigem="$t\matilha";Invoke-Expression (Get-Content -Raw -Encoding UTF8 "$t\matilha\instalar.ps1")}
```

A linha acha o zip mais novo em Downloads e chama o `instalar.ps1`. Ele:
- atualiza a Matilha no mesmo lugar, se você já tem (descobre pelo atalho
  da área de trabalho), sem tocar nos clientes, nas chaves e no WhatsApp;
  senão, instala na pasta **Matilha**, dentro da sua pasta de usuário;
- tira a marca de "veio da internet" da pasta;
- instala o **Node.js**, pelo winget ou pelo instalador oficial, e o
  **Claude Code**, se faltarem. O Windows pede permissão uma vez;
- chama o `INSTALAR.mjs`, que baixa o resto, cria o atalho **Matilha** na
  área de trabalho e abre o painel.

O painel abre na tela **Começar**: a lista do que falta configurar, com o
botão de cada passo. São a chave do Groq, a sua conta do Claude, o
WhatsApp, a chave da Netlify, o pacote de skills, a voz e o celular. As
chaves são testadas de verdade antes de aparecerem como prontas.

**Da segunda vez em diante**: duplo clique no atalho **Matilha**.

**Por que colar uma linha.** O Controle de Aplicativo Inteligente do
Windows 11 bloqueia instalador, `.bat`, `.cmd` e roteiro que vieram da
internet, e não tem lista de exceção. Desligá-lo é caminho sem volta. Uma
linha colada não "veio da internet": é você digitando. E o atalho da área
de trabalho chama o `node.exe` direto (um programa assinado), então
também não tem o que bloquear.

> **Não desligue o Controle de Aplicativo Inteligente** por causa
> disto. Nada aqui precisa.

**Já tinha extraído o zip?** Abra a pasta extraída, clique na barra de
endereço, digite `powershell` e Enter. Na janela que abrir, cole
`Invoke-Expression (Get-Content -Raw -Encoding UTF8 .\instalar.ps1)`.

### Quando um passo falha

O instalador não cospe erro de Node na sua cara. Ele para, diz **qual**
passo falhou e **o que fazer** — em português. Exemplo real, quando o
download do Chromium é cortado:

```
  ✗ O Chromium não ficou instalado.

     O comando terminou sem reclamar, mas o arquivo não está lá —
     quase sempre é antivírus ou proxy cortando o download.

     Tente na mão, nesta pasta:
        npx playwright install chromium
```

Repare: ele **confere o arquivo no disco**, não acredita no comando. O
`npx playwright install chromium` costuma terminar calado mesmo quando
não baixou nada — foi exatamente o que aconteceu contigo.

### As chaves — no painel, não no Bloco de Notas

**Ajustes → Chaves**. Cole, clique em **Gravar chaves**, e já valem,
sem reiniciar. A Matilha escreve o `.env` por você, mexendo só nas linhas
das chaves que você preencheu.

| chave | onde pegar | precisa? |
|---|---|---|
| **Groq** | console.groq.com/keys | para o vendedor escrever as mensagens quando o Claude não está conectado, e de reserva quando o limite do plano acaba |
| **Netlify** | app.netlify.com → User settings → Applications | para publicar os sites |
| **Google Places** | console.cloud.google.com → Places API (New) | não — o caçador pelo navegador não usa |

**Nenhuma é obrigatória para começar**: o caçador pelo navegador e o
WhatsApp Web funcionam sem chave nenhuma.

Duas coisas que o código garante, não só promete:

- **O painel nunca recebe uma chave de volta.** O servidor responde
  "essa aí está preenchida" e os quatro últimos caracteres, nada mais.
  Print de tela e aba esquecida aberta não entregam a sua chave.
- **Só as chaves da lista podem ser escritas.** Sem isso, um `POST`
  qualquer poria `NODE_OPTIONS` no `.env` — e o `.env` é lido pelo
  servidor, ou seja, viraria execução de código. `PAINEL_SENHA` fica
  **de fora de propósito**: gravá-la pelo painel passaria a valer na
  hora e trancaria você do lado de fora. Essa continua à mão, no
  arquivo.

## Conferir se a ponte do WhatsApp funciona

Tela **WhatsApp** → **"Conferir se a ponte
funciona"**.

Ele abre o WhatsApp Web, olha a tela e escreve na própria página um
relatório linha a linha: o que achou, o que não achou, e — quando não
acha — **um retrato do que existe de verdade** ali dentro. Tem um
botão para copiar tudo.

Não envia mensagem nenhuma. Só abre, olha e conta.

É assim que eu conserto um seletor que mudou sem ficar adivinhando: o
relatório me diz o que tem na SUA tela.

(Quem preferir terminal: `node testes/whatsapp.mjs` faz o mesmo, com o
mesmo código.)

## Ligar o WhatsApp

Tela **WhatsApp** → **Abrir o WhatsApp Web**. Abre uma janela do Chromium;
leia o QR Code com o celular. A sessão fica guardada em
`dados/navegador/` — da próxima vez já entra direto.

### O que a Matilha faz para o seu número durar

- **A janela fica visível.** Você vê cada mensagem sair. Modo escondido
  é o que transforma um errinho em cinquenta mensagens erradas antes de
  alguém perceber.
- **Pausa entre 12 e 35 segundos** entre envios, e **teto de 40 por dia**.
- **Nada de disparo em massa.** Uma mensagem por clique seu, depois de
  você ler o rascunho.
- **O envio é conferido.** Depois de mandar, ele procura a mensagem na
  conversa. Se não achar, devolve erro — e **não registra no histórico**.
  Histórico com mensagem que talvez não saiu é pior que histórico nenhum.

### O risco, escrito

Automatizar o WhatsApp Web é **contra os termos do WhatsApp**, e o risco
é do seu número. As travas acima diminuem; não zeram. Se o número é o
seu negócio, pense nisso antes — e o botão **"Abrir no WhatsApp"**
continua ali, que é o caminho sem automação nenhuma.

### Antes de confiar: rode o diagnóstico

```
node testes/whatsapp.mjs
```

Abre o WhatsApp Web, espera você ler o QR, e diz **caminho por
caminho** o que achou na tela: a lista de conversas, a caixa de
escrever, o botão de enviar, as classes que a Matilha usa para conferir
se a mensagem saiu, e quantas conversas não lidas ele enxerga.

**Não manda mensagem para ninguém.** Só olha e conta.

Se algum caminho vier com `⚠ NENHUM caminho funcionou aqui`, me mande
a saída e o print que ele salva em `dados/falhas/`. Com isso eu
conserto o seletor sem chutar.

### Quando quebrar

O WhatsApp muda o HTML dele sem avisar, e aí os seletores param de
funcionar. **Eu não consegui testar esta parte contra o WhatsApp real** —
não tenho a sua conta. Quando quebrar, a Matilha tira um print em
`dados/falhas/` e diz o que não achou. Me mande o print e eu conserto o
seletor.

## O dia a dia, à mão

O normal é a matilha solta fazer tudo isto sozinha. À mão, cliente
por cliente:

1. Tela **Caçada → Caçar agora, sem abordar**: escolha a fonte e
   clique. Volta só quem não tem site, pontuado. **Pôr no funil**.
   Sem abrir o painel: `node testes/cacador-google.mjs pizzaria Natal`
   (navegador) ou `node testes/cacador-openstreetmap.mjs pizzaria Natal`.
2. Tela **Clientes** → abra o cliente → complete o que souber → **Salvar dados**.
3. **Gerar a prévia** → olhe o site ali mesmo → **Publicar a prévia**.
4. **Escrever a abordagem** → leia o rascunho → **Enviar pelo WhatsApp Web**.
5. Tela **WhatsApp → Quem respondeu → Ver agora** → copie a resposta →
   na ficha, **Colar a resposta dele** → **Responder o que ele mandou**.
6. Fechou? **Gerar o site oficial** → **Publicar o oficial** → estágio **fechado**.

## Ver pelo celular

Os agentes continuam rodando no notebook. O celular só **olha** — e,
se você quiser, mexe: é o mesmo painel.

1. No notebook: **Ajustes → Celular → O painel inteiro no celular**.
2. Aponte a câmera do celular para o QR. Ele abre já destrancado.
3. Prefere digitar? O endereço (`http://192.168.x.x:8899`) e o PIN de
   seis dígitos estão do lado do QR.

O celular lembra do acesso por 30 dias. Para derrubar todos os
aparelhos de uma vez — perdeu o celular, emprestou para alguém —,
**Trocar o PIN**.

**O que isto é, sem enfeite.** O painel passa a atender na sua rede
local. Quem está no seu wi-fi consegue bater na porta; sem o PIN, não
passa dali, e os dados não saem. Quem está fora da sua rede não
alcança nada: isto **não** é um site na internet, e o endereço
`192.168.x.x` só existe dentro da sua casa. Dentro do wi-fi o PIN
viaja sem criptografia — na rede de casa tudo bem; num wi-fi público
eu não abriria. Oito PINs errados deixam aquele aparelho 15 minutos
de fora.

## Ver de fora de casa

O QR acima só vale dentro do seu wi-fi. Para olhar da rua:

**Ajustes → Celular → Ver de fora de casa → Abrir para fora.** Marque também
**"Abrir sozinho toda vez que a Matilha ligar"** — senão você precisa
lembrar de clicar antes de sair, e é exatamente disso que ninguém
lembra.

O notebook abre um caminho **de dentro para fora** com a Cloudflare, e
ela devolve um endereço `https` que funciona de qualquer lugar. O seu
roteador não muda nada, e nada de fora consegue iniciar conversa com o
seu computador — é sempre ele que puxa.

**O que isso custa.** O endereço é público: quem souber dele chega na
porta do painel, e aí o PIN é a **única** tranca. Por isso tudo que
entra por esse caminho pede PIN, sempre — inclusive o que chega
parecendo vir do próprio notebook (é o cloudflared que entrega os
pedidos aqui dentro; a Matilha separa isso por uma segunda porta, não
por cabeçalho, que qualquer um forja). Em troca, o trânsito vai
criptografado de ponta a ponta.

**O endereço muda** toda vez que a Matilha reinicia. Endereço fixo
exige conta e domínio na Cloudflare — dá para fazer depois. Na
primeira vez ele baixa um programa da Cloudflare, uns 40 MB.

## Onde ficam os dados

`dados/dados.json`, no seu notebook. Gravação atômica, e cada gravação
guarda a anterior em `dados/antes.json`. Ainda assim: **Ajustes →
Exportar tudo**, de vez em quando, para fora da pasta.

Diferente da versão da Netlify, aqui os dados não dependem do navegador:
abra em qualquer navegador da máquina que os clientes são os mesmos.

## Conferir o estúdio sem gastar a sua conta

    node testes/estudio.mjs

Roda o estúdio com um Claude Code falso e um Google falso, e confere a
ordem (ficha do Maps → Sonnet → Opus), o que cada etapa recebe, o botão,
e que o link não sai para quem ainda não respondeu. Não toca a rede.

## As regras que estão no código

- **Nada inventado no site.** Se o modelo escrever preço, horário, "há
  20 anos" ou "o melhor da cidade", o campo é **descartado** e entra a
  frase neutra. Sem horário, o site diz "confirme com a casa".
- **A prévia se identifica**: faixa, aviso no rodapé, `noindex`,
  `robots.txt`. O publicador recoloca o `noindex` se tiver sumido.
- **A mensagem é revisada** antes de você mandar: "garanto", "primeiro
  lugar no Google", "só hoje", "vocês não têm site" acendem alerta.
- **O caçador pelo navegador lê a tela, e você vê.** Janela visível, uma
  busca por clique seu, pausa de 1 a 2,5 s entre os cartões, teto por
  busca. Ler o Maps por automação é contra os termos do Google e o risco
  é da sua conta — foi escolha sua, e fica escrito aqui para não virar
  surpresa. As outras duas fontes não têm esse problema.
- **Nada de burlar verificação.** Se o Google pedir consentimento ou
  "não sou um robô", a busca **para** e avisa; resolver na janela é com
  você. Nenhum robô entra em Instagram, ChatGPT ou claude.ai.
- **O servidor só escuta em 127.0.0.1.** Nada no seu wi-fi alcança o
  painel. `PAINEL_SENHA` no `.env` é uma segunda tranca, opcional.
