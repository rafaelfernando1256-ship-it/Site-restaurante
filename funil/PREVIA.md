# Prévia antes da venda

> Em vez de pedir para mostrar uma proposta, você manda o site **já
> pronto**. A conversa começa em *"o que você achou?"* — que é uma
> pergunta que dá vontade de responder.

Este é o caminho curto do funil. Da planilha à mensagem pronta, **sem
chave de API nenhuma** e em segundos por negócio.

```
   planilha.csv          previa            publicar           oferta
   você preenche   →   site pronto   →   link no ar    →   mensagem pronta
   (5 min p/ 10)       (segundos)        (segundos)        (segundos)
                                                               ↓
                                                      VOCÊ lê, aprova e manda
```


> **No Windows, escreva `python` e não `python3`.** Os comandos abaixo
> estão com `python3` porque é o que funciona no Mac e no Linux; no
> PowerShell, `python3` abre a loja da Microsoft em vez de rodar nada.

---

## O que fica onde

```
funil/
├── planilha.csv            ← VOCÊ preenche (gerado pelo comando `planilha`)
├── modelos/                ← os três visuais, escritos à mão
│   ├── restaurante.html       lanchonete, pizzaria, bar, padaria, café…
│   ├── hotel.html             pousada, hostel, chalé, resort
│   └── negocio.html           barbearia, salão, oficina, pet shop, clínica…
├── nucleo/
│   ├── planilha.py         lê o CSV (aceita o ; e o BOM do Excel)
│   ├── previa.py           preenche o modelo e monta a pasta do site
│   ├── oferta.py           a 1ª mensagem e os 5 toques de seguimento
│   ├── estado.py           a máquina de estados (o caminho da prévia mora aqui)
│   └── …                   os quatro agentes do caminho frio, intactos
├── saida/previas/<negocio>/
│   ├── publico/index.html  o site (abra no navegador para conferir)
│   ├── publico/fotos/      fotos de acervo + creditos.json
│   └── site.zip            o que sobe na Netlify
└── painel.html             o quadro da venda, gerado pelo comando `painel`
```

---

## O passo a passo, um comando por etapa

```bash
cd funil
python -m pip install -r requirements.txt     # uma vez só
```

### 1. Criar a planilha

```bash
python3 funil.py planilha
```

Sai um `planilha.csv` **já com três exemplos preenchidos** — apague e
ponha os seus. As colunas:

| coluna | obrigatória | para quê |
|---|---|---|
| `nome` | **sim** | título do site e da mensagem |
| `tipo` | não | escolhe o modelo visual (restaurante / hotel / genérico) |
| `endereco` | não | mapa e cartão de endereço |
| `telefone` | não | botão de WhatsApp. Sem ele, o site não tem botão |
| `instagram` | não | link no rodapé. Aceita `@perfil` ou o link inteiro |
| `tem_site` | não | `sim`/`não` — quem já tem cai na pontuação |
| `cidade` | não | aparece no topo e no mapa |
| `horario` | não | sem ele, o site diz "Confirme com a casa" |
| `especialidades` | não | 3 pratos ou serviços, separados por `;` |
| `observacao` | não | só para você |

> **De onde vêm esses dados.** Do que o negócio publica: a placa, o
> perfil público, o cardápio na porta. Você digita. **Nada de raspagem**
> do Google Maps nem do Instagram — além de ser proibido pelos termos
> dos dois, é o tipo de coisa que derruba conta depois que ela começou a
> dar dinheiro. Para busca automatizada existe o agente 1, que usa a
> **API oficial** do Google Places.

### 2. Importar

```bash
python3 funil.py importar planilha.csv
```

Idempotente: reimportar a mesma linha **atualiza**, não duplica.

### 3. Gerar as prévias

```bash
python3 funil.py previa                 # todos os novos (até 10)
python3 funil.py previa --lead 3        # só o lead 3
python3 funil.py previa --sem-fotos     # mais rápido ainda
```

Abra o `index.html` que ele imprime **antes de publicar**. Trinta
segundos olhando evitam mandar um site com o nome errado.

### 4. Publicar

```bash
python3 funil.py publicar
```

Sobe na sua Netlify (precisa do `NETLIFY_TOKEN` no `.env`) e guarda o
link. Plano grátis: 100 GB/mês de banda — uma prévia consome alguns KB,
então isto não vai ser o seu gargalo.

### 5. A mensagem

```bash
python3 funil.py oferta
```

Escreve a mensagem **com o link dentro** e deixa em rascunho. Daí em
diante é o fluxo que já existia:

```bash
python3 funil.py revisar          # você lê
python3 funil.py aprovar --todas  # você aprova
python3 funil.py enviar --abrir   # abre o WhatsApp com o texto pronto
python3 funil.py enviada 12       # confirma que VOCÊ mandou
```

**Nada sai sozinho.** Os links abrem a conversa com o texto escrito;
quem aperta enviar é você, uma por uma.

### 6. Acompanhar

```bash
python3 funil.py painel           # gera painel.html, abre no celular
python3 funil.py negociando 3 --nota "pediu preço"
python3 funil.py fechado 3
python3 funil.py perdido 7 --nota "o sobrinho faz"
```

O painel abre com seis números: **prévia pronta · contatado · respondeu
· negociando · fechado · perdido**.

### 7. Quem não respondeu

```bash
python3 funil.py seguir --lead 3            # lista os cinco toques
python3 funil.py seguir --lead 3 --passo 2  # o texto do toque 2, pronto
```


### 5b. A mensagem pela comissão (o ticket de R$ 3.000)

```bash
python3 funil.py oferta --angulo comissao
```

A mesma prévia, outra conversa: em vez de "fiz um site para você", ela
abre perguntando **quanto ele paga de comissão** à Booking (hotel) ou ao
iFood (restaurante). Serve só para esses dois — nos outros tipos ela cai
na mensagem padrão sozinha, porque barbearia não paga comissão a OTA
nenhuma.

Ela **pergunta** a porcentagem em vez de afirmar: você não sabe se
aquela pousada é Preferencial da Booking nem quanto do faturamento vem
de OTA, e errar o número na primeira mensagem acaba com a conversa.
Pergunta sobre o próprio dinheiro, por outro lado, é a que mais recebe
resposta.

---

## Os cinco toques (e por que cada um existe)

O espaçamento importa mais que o texto. Cinco toques em cinco dias é
perseguição, e perseguição faz bloquear — e aí você perdeu o contato,
não só a venda.

| # | dia | o que é | por quê |
|---|---|---|---|
| 1 | 3 | o lembrete curto | mensagem de desconhecido some embaixo de vinte outras |
| 2 | 7 | o detalhe que ele não viu | toque novo precisa trazer coisa nova, senão é o mesmo toque mais chato |
| 3 | 14 | a pergunta que não é sobre o site | quem ignorou duas ofertas pode responder a uma pergunta — e a resposta te diz se vale seguir |
| 4 | 25 | a prova de que funciona | **só use se for verdade**: outro negócio igual com o site no ar. Sem caso real, pule |
| 5 | 35 | a porta que fecha | tirar a cobrança devolve a liberdade de responder. Se disser que vai parar, **pare** |

Os textos estão em `nucleo/oferta.py` — edite à vontade, é a sua voz que
vai na conversa.

---

## Quanto cobrar

Isto **não é pesquisa de mercado** — é uma régua para você começar e
ajustar com o que acontecer nas três primeiras conversas.

| faixa | o que entra | quanto |
|---|---|---|
| **Básico** | a prévia ajustada: fotos e textos dele, botão de WhatsApp, mapa, horário, publicado no seu domínio da Netlify | **R$ 300 – 500** |
| **Intermediário** | o básico + domínio próprio (`nomedacasa.com.br`, ~R$ 40/ano pago por ele) + Google Meu Negócio arrumado + cardápio em página | **R$ 700 – 1.200** |
| **Completo** | o intermediário + sessão de fotos no celular + galeria + integração com iFood/delivery + 3 meses de ajuste inclusos | **R$ 1.500 – 2.500** |

Três coisas que valem mais que a tabela:

- **Nos três primeiros, cobre pouco e peça o depoimento.** O que você
  está comprando com o desconto é portfólio e prova social — e sem isso
  o toque 4 do seguimento não existe.
- **Preço não se manda na primeira mensagem.** A prévia abre a conversa;
  o preço entra quando ele perguntar. Quem manda preço antes de o outro
  perguntar está respondendo uma pergunta que ninguém fez.
- **Entrada de 50% antes de começar o ajuste.** Não é desconfiança: é o
  que separa quem quer de quem está passando o tempo.

---

## Virar renda fixa (o que paga o mês que vem)

Um site vendido é um dinheiro. Um site mantido é uma renda. As três que
cabem no que você já construiu:

### 1. Manutenção mensal — **R$ 50 a 150/mês**
Hospedagem, domínio renovado, pequenas alterações (até 3 por mês),
backup. **Como vender:** já na proposta, como linha separada — "o site
sai por X e fica no ar por Y por mês". Depois que ele aceitou o site,
voltar para cobrar manutenção é uma segunda venda, e segunda venda é
sempre mais difícil que uma linha a mais na primeira.
**Seu trabalho real:** quase zero nos meses em que nada muda.

### 2. Google Meu Negócio — **R$ 150 a 300 na montagem + R$ 80/mês**
Perfil criado e verificado, fotos, horário certo, categorias, responder
avaliação. **Por que vende fácil:** é o que coloca o negócio no mapa
quando alguém procura "pizzaria perto de mim" — e muito dono simplesmente
nunca reivindicou o perfil dele. É grátis de criar, e você cobra pelo
serviço de fazer e manter, o que é honesto e você diz na cara.
**Seu trabalho real:** uma hora na montagem, minutos por mês.

### 3. Atualização de cardápio / tabela — **R$ 60 a 120 por atualização, ou R$ 100/mês ilimitado**
Preço mudou, prato saiu, promoção entrou. **Onde está o ouro:** restaurante
muda preço várias vezes por ano, e quem não tem com quem falar deixa o
site desatualizado — e site desatualizado é pior que site nenhum, o que
te dá o argumento sem precisar inventar nada.
**Dica:** venda o pacote mensal, não a avulsa. A avulsa faz ele pensar
duas vezes antes de te chamar; a mensal faz ele te chamar.

---

## O que este sistema NÃO faz (de propósito)

- **Não dispara mensagem em massa.** Gera o link, você manda. Automação
  de primeiro contato no WhatsApp pessoal é o caminho mais curto para
  perder o número — e o número é o seu negócio.
- **Não raspa Google Maps nem Instagram.** Planilha à mão, ou a API
  oficial do Places.
- **Não inventa dado no site.** Preço, horário, nota, "20 anos de
  tradição": se não está na planilha, não entra. O que falta vira lugar
  para o dono preencher e pergunta na sua mensagem.
- **Não usa foto nem logo do negócio sem avisar.** As imagens são de
  acervo livre (Pixabay/Unsplash), com crédito gravado em
  `publico/fotos/creditos.json`, e o rodapé diz que são exemplo.
- **Não guarda nada pessoal do dono.** Só dado comercial público: nome
  do negócio, endereço, telefone comercial, perfil público. É o que a
  LGPD pede e é o que você precisa.
- **Não deixa a prévia ser confundida com o site dele.** Faixa no topo,
  aviso no rodapé, `noindex` para não aparecer no Google.

---

## Dois caminhos, não um

| | prévia antes da venda | contato frio (agentes 1 a 4) |
|---|---|---|
| **entra** | sua planilha | Places API |
| **constrói** | template preenchido, segundos, sem chave | Instagram + Claude Code, minutos, com chave |
| **quando** | abordagem em lote, 5 por semana | quando ele JÁ disse que quer ver |
| **custo** | zero | uma chamada de modelo por site |

Um abre a porta, o outro fecha a venda. Os dois usam o mesmo banco, o
mesmo painel e o mesmo envio.
