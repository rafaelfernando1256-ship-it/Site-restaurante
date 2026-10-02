# Funil — quatro agentes que prospectam, abordam, constroem e entregam

Quatro agentes que trabalham no mesmo funil: um acha restaurante sem
site, outro escreve e manda a primeira mensagem, o terceiro vê quem quer
a demonstração e manda o Claude Code construir o site a partir do
Instagram da casa, e o quarto publica na sua Netlify e entrega o link.

```
   AGENTE 1              AGENTE 2              AGENTE 3              AGENTE 4
   caçador               abordagem             estúdio               entrega
      │                     │                     │                     │
  Places API           escreve a 1ª          lê a resposta        sobe o .zip
  acha quem não        mensagem e            lê o Instagram       na Netlify
  tem site             envia                 chama o Claude       manda o link
      │                     │                 Code                    │
      ↓                     ↓                     ↓                     ↓
    novo  ──────────>  rascunho ──> abordado ──> quer_demo ──> demo_pronta ──> publicado
                            ↑                         ↑
                       VOCÊ LÊ                   VOCÊ COLA
                      e aprova                  a resposta dele
```

---

## O que faz disto um sistema multiagente

Não é um agente conversando com outro. É **um estado compartilhado com
uma máquina de estados explícita** (`nucleo/estado.py`): um arquivo
SQLite onde cada lead tem um estado, e cada agente só sabe fazer uma
coisa — pegar trabalho num estado, fazer a sua parte, empurrar para o
próximo. Nenhum agente sabe que os outros existem.

É isso que dá três coisas que uma função chamando outra não dá:

| | |
|---|---|
| **retomada** | travou no agente 3? Rode o agente 3 de novo. Os outros não repetem trabalho |
| **auditoria** | cada transição vira evento com carimbo de tempo. Lead sumiu? dá para ver onde |
| **independência** | cada agente roda na sua hora, no seu cron, até em máquina diferente |

E transição inválida levanta erro em vez de corromper o funil em
silêncio. Um pipeline que roda sozinho precisa de erro barulhento, não
de dado errado.

---

## Instalação

```bash
cd funil
pip install -r requirements.txt     # anthropic, google-genai e pydantic
cp .env.exemplo .env                # e preencha as chaves
cp config.exemplo.toml config.toml  # opcional
python3 testes.py                   # 49 testes, nenhum toca a rede
```

### Duas chaves, e só uma delas é obrigatória para começar

| chave | para que | sem ela |
|---|---|---|
| **Claude ou Gemini** | escrever as abordagens, triar as respostas, ler o Instagram | nada do agente 2 em diante |
| **Google Places** | achar restaurante sem site | o agente 1 não roda — mas dá para pôr lead à mão (veja abaixo) |

O cérebro sai sozinho da chave que existir no `.env`. Com as duas
preenchidas, escolha em `config.toml` → `provedor`.

### Sem a chave do Places ainda? Comece assim

```bash
python3 funil.py adicionar "Pizzaria do Marcos" \
  --telefone "+55 84 98888-7777" --instagram "@pizzariadomarcos" \
  --cidade "Natal, RN" --avaliacoes 180 --nota 4.6
```

O funil inteiro funciona a partir daí. Serve também para o cliente que
você já conhece e que não vai aparecer em busca nenhuma.

As chaves vão no `.env` — que está no `.gitignore`, junto com `dados/`,
`material/` e `saida/`. **Nome, telefone e Instagram de gente real não
vão para repositório nenhum**, nem privado.

---

## O ciclo inteiro

```bash
python3 funil.py cacar --cidade "Natal, RN"   # agente 1
# (ou: python3 funil.py adicionar "Nome do lugar" --telefone ... --instagram ...)
python3 funil.py escrever                      # agente 2 escreve
python3 funil.py painel                        # você lê
python3 funil.py aprovar --todas
python3 funil.py enviar --abrir                # dois toques por lead

python3 funil.py retorno 7 "pode mandar sim"   # cola a resposta dele
python3 funil.py triar                         # agente 3 classifica
# ponha as capturas do Instagram em material/<slug>/
python3 funil.py construir                     # agente 3 → Claude Code
python3 funil.py publicar                      # agente 4 → Netlify
python3 funil.py enviar                        # manda o link
```

`python3 funil.py resumo` a qualquer hora. `python3 funil.py lead 7`
mostra tudo de um lead: histórico, mensagens, demo, erros.

---

## O caminho totalmente automático do primeiro contato

Existe, é legítimo e é a **API oficial do WhatsApp Business** (Cloud API).
Com ela o disparo inicial é automatizado dentro das regras, sem risco de
banimento — já está implementado em `nucleo/a2_abordagem.py`
(`canal_envio = "cloud"`), desligado esperando a sua conta.

O que ela exige:

1. conta no Meta Business e número verificado;
2. **template de mensagem aprovado pela Meta** — é ele que vai no primeiro
   contato, não o texto livre que o agente escreve (o texto livre só vale
   na janela de 24h depois de a pessoa te responder);
3. `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_ID` no `.env`.

O preço de automatizar de verdade é esse: a Meta lê e aprova o que você
manda no primeiro contato. Em troca, você não perde o número.

---

## O modo sozinho

```bash
python3 funil.py vigiar
```

Daí em diante ele cuida de tudo que vem **depois** do primeiro contato:
lê quem respondeu, tria, responde, constrói a demonstração de quem
aceitou e entrega o link. Deixe rodando numa janela.

```bash
python3 funil.py vigiar --seco      # mostra o que faria, sem enviar nada
python3 funil.py vigiar --intervalo 120
```

### O que ele NÃO faz, e por quê

**O primeiro contato continua sendo um clique seu.** O agente escreve a
mensagem; `funil.py enviar` abre o WhatsApp com ela pronta; você lê e
manda. São três segundos por lead.

Esse passo fica manual de propósito, e não é zelo: disparo automático
para quem nunca pediu contato é spam de qualquer ângulo que se olhe — do
dono do restaurante que recebe, da Meta que bane o número por isso, e
seu, que depende desse número para trabalhar. O resto é diferente: quem
respondeu, respondeu **para você**, e responder a quem te escreveu,
construir o que foi aceito e entregar o que te pediram não tem nada de
spam.

**Não insiste.** Quem não respondeu não recebe segunda mensagem daqui.
Reabordagem é sua, na mão.

**Não decide o que não entendeu.** Triagem com certeza abaixo de 0,7 fica
parada, registrada, esperando você ler.

**Não para em silêncio.** Sessão caída ou erro em sequência encerra o
laço dizendo por quê.

---

## Agente 1 — o caçador

Google Places API (New), oficial. Raspar o Maps viola os Termos, quebra
toda semana e dá bloqueio de IP.

**O filtro que importa** é o que ninguém olha: o campo `websiteUri` quase
nunca é "tem ou não tem site". Restaurante pequeno cadastra como "site" o
link do Instagram, do Linktree ou do iFood. Isso parte os leads em
quatro, e três deles são cliente:

| classificação | o que significa | por que é lead |
|---|---|---|
| `sem_presenca` | campo vazio | não tem nada |
| **`so_rede`** | instagram / facebook / linktree | **o melhor: já tem público e foto, só não tem onde cair quem busca no Google — e a demonstração se monta sozinha com o Instagram dele** |
| `so_delivery` | iFood, Goomer, anota.ai | paga comissão para existir |
| `tem_site` | outro domínio | descartado |

O Instagram **vem de graça** justamente no melhor caso: quando o "site"
é um link do Instagram, o `@` sai dele. Nos outros fica em branco — eu
não invento handle.

A pontuação (0–10) prefere quem tem rede social, movimento (avaliações) e
nota decente. Casa marcada como fechada vai a zero, não a lead.

**Custo:** a Places API cobra por busca e por campo pedido. O `FieldMask`
está explícito no código e pede só o necessário — pedir tudo multiplica a
conta sem servir para nada.

---

## Agente 2 — a abordagem

Escreve a primeira mensagem com o contexto real daquele lead: quantas
avaliações tem, qual a nota, e o fato concreto de o link do Google levar
para o Instagram — ou não levar para lugar nenhum. A instrução **proíbe
explicitamente** "Olá, tudo bem? Me chamo…", promessa de aumento de
vendas, urgência falsa e elogio genérico.

### Por que o envio passa por você

Disparo automático de WhatsApp para quem nunca pediu contato é o jeito
mais rápido de perder o número que você usa para vender:

- **biblioteca não oficial** (Baileys, whatsapp-web.js) é proibida nos
  Termos e é o gatilho nº 1 de banimento — o número vai junto;
- **a Cloud API oficial** exige conta Business verificada e, no primeiro
  contato, **template aprovado**. Texto livre só vale na janela de 24h
  depois de o cliente falar primeiro — ou seja, o texto que o agente
  escreveu não serve para o primeiro contato automatizado;
- **LGPD**: o WhatsApp de restaurante pequeno quase sempre é o celular
  pessoal do dono. É dado pessoal, não dado de empresa.

Então o padrão é `link`: o agente escreve, você abre o painel, lê e
clica. **São uns três segundos por lead**, e o número continua vivo. O
modo `cloud` está implementado contra a API oficial e sai **desligado** —
ligar é decisão sua, com conta aprovada.

---

## Agente 3 — o estúdio

**Triagem.** Você cola a resposta do dono (`funil.py retorno 7 "..."`) e o
agente classifica: quer ver ou não. Quando a certeza fica abaixo de 0,7,
**ele não decide** — marca dúvida e deixa para você. Mandar site para
quem pediu para não mandar nada é pior que não mandar.

**O material do Instagram** vive em `material/<slug>/`, e chega lá de
dois jeitos:

```bash
python3 funil.py capturar 7      # o agente tira os prints
```

Ele abre o perfil num Chrome com a **sua** sessão e captura a capa, a
grade e os primeiros posts — que é onde mora o cardápio. Ritmo de gente
olhando perfil: um por vez, rolagem com pausa, poucos posts, e nenhuma
mídia baixada (são capturas da sua própria janela).

> **O risco.** Os Termos do Instagram proíbem acesso automatizado, e o
> que está em jogo é a **sua** conta: checkpoint, limite temporário, no
> limite suspensão. É um risco menor que o do WhatsApp — ninguém recebe
> mensagem, você só abre uma página que já abriria na mão —, mas existe.
> Para risco zero, `capturar_sozinho = false` e mande os prints do
> celular para a mesma pasta: o agente usa os dois caminhos igual.

Texto colado em `material/<slug>/notas.txt` entra junto.

**A leitura** é feita com visão, e tem uma regra acima de todas: *o que
você não vê, você não preenche*. Preço só se estiver escrito na imagem.
Horário só se estiver escrito. Nada de avaliação, prêmio ou "desde 1998".
Tudo que falta vai para uma lista `nao_sei` — e essa lista vira texto no
briefing, lugar em branco no site e assunto na mensagem de entrega.

**A construção** tem dois caminhos, escolhidos sozinho:

| quando | como | resultado |
|---|---|---|
| você usa o Claude **e** tem o Claude Code instalado | `claude -p` dentro da pasta, com `BRIEFING.md` e `grao-dourado/` como molde | projeto completo, com build |
| qualquer outro caso | o próprio modelo escreve a página inteira (`nucleo/construtor.py`) | arquivo único, sem dependência |

Nos dois, as regras de honestidade vão junto: preço que não estava na
foto, horário que ninguém publicou e avaliação que não existe **não são
preenchidos** — viram um lugar visível para o dono completar, e a lista
do que faltou entra na mensagem de entrega.

A página única não é um atalho preguiçoso: a demonstração vai por
WhatsApp para alguém decidir em trinta segundos, no celular. Um arquivo
sem build carrega na hora e não quebra por caminho de CSS. Projeto com
estrutura é para depois que ele fechar.

E ela é conferida antes de sair: sem `noindex`, sem botão de WhatsApp ou
cortada no meio, volta para o modelo com a lista do que corrigir.

**O empacotamento** zipa `publico/`, com o `index.html` **na raiz do
zip**. Zip com o index dentro de uma subpasta faz a Netlify publicar uma
pasta vazia.

---

## Agente 4 — a entrega

Publica na equipe **`conta5197-99`** (ajustável em `config.toml`), em
três passos: cria o projeto na equipe certa, envia o zip, e **espera o
deploy virar `ready`**. Esse terceiro passo é o que mais gente pula: a
resposta do upload volta na hora, com o deploy ainda em `processing` —
mandar o link nesse instante é mandar o cliente para uma página que ainda
não existe.

O nome do projeto leva um sufixo curto derivado do lead, porque nome de
projeto é único em toda a Netlify e `cantina-da-vo` já é de alguém.

Depois escreve a mensagem de entrega — que **diz o que ficou em branco**,
lendo a lista `nao_sei` do agente 3. Isso não é fraqueza: é a prova de
que nada foi inventado, e é o motivo mais concreto que o dono tem para
responder.

E essa mensagem também espera você aprovar.

---

## O que não roda nesta máquina

Este projeto foi escrito e testado num contêiner na nuvem, onde:

| endereço | aqui | na sua máquina |
|---|---|---|
| `places.googleapis.com` | responde | responde |
| `api.anthropic.com` | responde | responde |
| `api.netlify.com` | **bloqueado** | responde |
| `graph.facebook.com` (WhatsApp) | **bloqueado** | responde |
| `www.instagram.com` | **bloqueado** | (e eu não raspo mesmo) |

Ou seja: **os agentes 1, 2 e 3 dá para exercitar aqui; o 4 só roda na sua
máquina.** Por isso a Netlify e a Cloud API estão cobertas por teste com
dublê — a lógica (equipe certa, espera do `ready`, erro de deploy, zip
sumido) está verificada; o que não dá para verificar daqui é a rede.

---

## O que foi verificado

**69 testes, 69 passando** (`python3 testes.py`). Nenhum toca a rede: o
cliente do Claude, a API da Netlify e o Claude Code entram como dublê,
porque o que precisa de teste é a lógica.

O que eles garantem, em grupos:

- **a máquina de estados** — upsert não duplica lead, transição válida
  registra evento, **pular etapa é recusado e o lead não se mexe**,
  `fechado` é fim de linha, `descartado` volta para `novo`, histórico de
  mensagens não é sobrescrito;
- **o caçador** — os quatro grupos de presença, o `@` extraído de perfil
  e **recusado** em link de post e de reel, telefone em E.164, casa
  fechada pontuando zero;
- **nada sai sem você** — rascunho nasce em `rascunho`, rascunho não
  aprovado não entra na fila, envio por link **não envia nada** e o lead
  só anda depois da sua confirmação, lead sem telefone é recusado e não
  silenciado, o texto é escapado na URL e no HTML;
- **a triagem** — sim vai para `quer_demo`, não vai para `sem_interesse`,
  e **dúvida fica parada**, registrada para você achar;
- **a honestidade** — o briefing contém as regras inteiras, a lista do
  que não se sabe e **nenhum preço inventado**; prato sem preço na foto
  continua sem preço;
- **a entrega** — index na raiz do zip, pasta sem index é recusada,
  equipe errada falha listando as que existem, deploy só vira link
  quando está `ready`, deploy com erro levanta, zip sumido não vira
  deploy vazio;
- **os segredos** — uma varredura por chave do Google, da Anthropic e da
  Netlify escrita em qualquer `.py` do projeto.

**O painel** passou por varredura em 4 larguras (360, 390, 768, 1280) ×
tema claro e escuro: rolagem lateral, caixa estourada, alvo de toque
pequeno, contraste WCAG AA e erro de console. **Zero achados** — depois
de três correções reais: o caminho longo da pasta `material/` não
quebrava linha e estourava 9px em tela de 360; o `@` do Instagram era um
alvo de 15px de altura; e o cinza do subtítulo dava 4,47:1, abaixo do
mínimo de 4,5.

---

## Onde mexer

```
funil.py              a linha de comando (um comando por agente)
painel.py             a tela de revisão em HTML

nucleo/
  estado.py           O BARRAMENTO: estados, transições, banco, eventos
  config.py           chaves e caminhos (nada escrito em código)
  claude.py           a ponte para o modelo (saída validada por esquema)
  a1_cacador.py       Places API e o classificador de presença
  a2_abordagem.py     escreve a abordagem; envia por link ou Cloud API
  a3_estudio.py       triagem, leitura do Instagram, Claude Code, zip
  a4_entrega.py       Netlify e a mensagem com o link

material/<slug>/      VOCÊ põe aqui as capturas do Instagram do lead
saida/<slug>/         o site construído, com BRIEFING.md e site.zip
dados/funil.db        o banco (e painel.html ao lado)
```

| quero | onde |
|---|---|
| mudar o tom da abordagem | `nucleo/a2_abordagem.py` → `INSTRUCAO` |
| mudar os termos de busca | `config.toml` → `termos` |
| exigir leads melhores | `funil.py cacar --minimo 6` |
| mudar as regras do site | `nucleo/a3_estudio.py` → `REGRAS` |
| trocar a equipe da Netlify | `config.toml` → `equipe_netlify` |
| ligar o envio automático | leia o topo de `a2_abordagem.py` primeiro |

---

## Uma coisa que eu faria antes de rodar em volume

Comece por **uma cidade e dez leads**, com `--minimo 6`. Leia as dez
mensagens no painel antes de aprovar qualquer uma. O que o modelo escreve
é bom, mas é você que conhece a praça — e as duas ou três correções que
você fizer nas primeiras dez cabem direto na `INSTRUCAO`, valendo para
todas as próximas.
