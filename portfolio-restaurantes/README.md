# Full House — portfólio de sites para restaurante (EUA)

Portfólio de agência especializada em criar sites para restaurantes, com **três
projetos demonstrativos navegáveis**. Construído para vender: cada seção existe
para responder uma objeção e levar o dono do restaurante ao telefone.

> **O site é em inglês americano.** Todo o texto visível está em inglês dos EUA e
> ambientado lá: preços em dólar, endereços de Portland, Austin e Dayton, e
> telefones da faixa `555-0100`–`555-0199` que o North American Numbering Plan
> reserva para ficção — nenhum número toca na casa de ninguém. Os nomes de
> arquivo, variáveis e comentários do código continuam em português, que é a
> convenção do resto deste repositório.

> **Nos EUA não se fecha venda por WhatsApp.** Por isso este portfólio usa
> **ligação, SMS e e-mail** no lugar dele — o botão flutuante disca, os CTAs
> abrem o app de mensagens com o texto já escrito. É a diferença mais importante
> em relação ao portfólio de barbearias, que é britânico.

---

## Como executar localmente

Você precisa do **Node.js 20 ou superior** ([nodejs.org](https://nodejs.org)).
Para conferir o que está instalado: `node -v`.

```bash
# 1. entre na pasta do projeto
cd portfolio-restaurantes

# 2. instale as dependências (só na primeira vez, leva ~30 segundos)
npm install

# 3. rode em modo de desenvolvimento
npm run dev
```

Abra **http://localhost:3000**. Qualquer arquivo que você salvar recarrega a
página sozinho.

> A primeira execução baixa as fontes do Google uma única vez e as guarda junto
> com o projeto. Por isso o **primeiro** `npm run dev` ou `npm run build` precisa
> de internet; depois disso o site funciona offline.

### Gerar a versão para publicar

```bash
npm run build     # gera a pasta out/ com o site pronto
npm run serve     # opcional: testa a pasta out/ em http://localhost:3000
```

A pasta `out/` é HTML puro. Serve em qualquer hospedagem — Netlify, Vercel,
GitHub Pages, Hostinger — sem precisar de servidor Node.

**Publicar no Netlify (mais rápido):** compacte a pasta `out/` em um .zip e
arraste em [app.netlify.com/drop](https://app.netlify.com/drop).

---

## Antes de mostrar para alguém

Quatro itens — os dois primeiros são obrigatórios:

1. **Troque o telefone.** Em `content/agencia.ts`, campos `telefone` (só dígitos,
   com `+1`) e `telefoneVisivel`. O que está lá é número reservado para ficção;
   se você mostrar assim, ninguém consegue te ligar.
2. **Preencha a seção "Who builds it".** Em `content/agencia.ts` → `quemFaz`:
   seu nome, sua cidade, três parágrafos na sua voz e uma foto sua em
   `public/quem-faz.jpg` — com o campo `foto` apontando para `"/quem-faz.jpg"`,
   senão fica só a sua inicial.
   **É a mudança que mais muda conversão nesta página.** Serviço
   local comprado de um desconhecido: a primeira pergunta na cabeça do dono é
   "quem é essa pessoa?". Sem nome e rosto, ela fica sem resposta e ele não liga.
3. Confira o preço em `content/agencia.ts` → `planos.lista` (campo `preco`) e em
   `planos.destaque`.
4. Troque `metadataBase` em `app/layout.tsx` e o `email` em `agencia` pelo seu
   domínio, quando tiver um.

---

## Como a página vende

A ordem das seções não é de portfólio, é de venda:

| | Seção | O que faz |
|---|---|---|
| — | Hero | promessa e a oferta de graça |
| 01 | Problema | o espelho: onde ele perde cliente hoje |
| 02 | O que está incluso | o que eu faço a respeito |
| 03 | Projetos | a prova, com chamada no pico de interesse |
| 04 | **A conta** | o benefício vira dinheiro, com os números dele |
| 05 | **Preço** | o valor, logo depois da conta que o justifica |
| 06 | Quem faz | quem está do outro lado da ligação |
| 07 | Como funciona | o que acontece depois que ele ligar |
| 08 | Perguntas | o que trava o fechamento |
| 09 | Garantia | tira o risco e leva ao contato |

**A conta** (seção 04) é a peça que faz o preço parar de assustar. O dono mexe em
dois controles — ticket médio por pessoa e quantas pessoas naquela mesa a mais —
e vê quanto isso dá por mês. No padrão ($28 × 3 pessoas) dá **$2.184 por mês**,
exibido ao lado de **$1.200** do site. Nada ali é promessa: os números são os que
ele mesmo digitou, e a página diz isso com todas as letras.

A conta multiplica por **26 serviços no mês** (seis noites por semana × 4,33
semanas). Se você for prospectar restaurante que abre sete dias, troque a
constante `SERVICOS_NO_MES` em `components/site/secoes/Conta.tsx` para 30 — e
ajuste a frase da nota, que hoje diz "six nights a week".

### O preço é único; o que muda é o modelo

| Modelo | Preço | Baseado em | Para quem |
|---|---|---|---|
| Classic | $1,200 | Blue Plate Diner | restaurante de bairro, onde o cliente liga antes |
| Counter | $1,200 | Comal Street Tacos | fast casual, onde o dinheiro está no pedido online |
| Reservation | $1,200 | Larkspur | cozinha autoral, onde a reserva vem antes da mesa |

**Cobrança única, os três pelo mesmo valor.** O dono escolhe pela sala que ele
tem, não pelo que cabe no orçamento — isso tira a conversa de "qual é o mais
barato" e coloca em "qual é o meu". Cada cartão carrega a cor de marca do seu
projeto e leva ao demo correspondente.

O selo do modelo do meio diz **"Recommended"**, não "mais vendido": número de
vendas é dado que você ainda não tem, e recomendação é opinião sua — pode dizer
no primeiro dia.

A seção "What isn't in the price" diz na cara o que é recorrente: domínio (~$15
por ano, no nome dele, em qualquer registrador), hospedagem (gratuita) e o que o
POS ou o sistema de reserva dele já cobra. Dizer isso antes evita a discussão
depois.

**Um só rótulo de CTA** se repete na página inteira: *"Show me mine, free"*. Os
botões dos planos são a exceção proposital — cada um manda um SMS diferente,
então você sabe de qual modelo veio o contato sem instalar nenhum analytics.

Os demos abrem em **nova aba**, de propósito: se abrissem na mesma, o visitante
entraria no demo e o seu portfólio sumiria.

---

## Onde mexer em cada coisa

Todo o texto do site está em `content/`. **Você não precisa abrir nenhum
componente para mudar palavra, preço ou telefone.**

```
content/
  agencia.ts                 seu nome, telefone, textos de venda, preços, perguntas
  demos.ts                   os 3 cards de projeto da home (cores, destaques)
  demo-larkspur.ts           conteúdo do site demonstrativo 1
  demo-comal-taqueria.ts     conteúdo do site demonstrativo 2
  demo-blue-plate-diner.ts   conteúdo do site demonstrativo 3

app/
  page.tsx                   a home do portfólio (só junta as seções)
  layout.tsx                 meta tags de SEO do site inteiro
  globals.css                o sistema visual do portfólio (cores e tipografia)
  projects/<slug>/           larkspur · comal-taqueria · blue-plate-diner
    page.tsx                 a página daquele restaurante
    <nome>.css               o visual daquele restaurante, isolado do resto
    Topo<Nome>.tsx           o cabeçalho daquele restaurante

components/
  ui/                        peças reutilizáveis (botão, seção, revelar, ícone)
  site/secoes/               as seções da home, uma por arquivo
  demos/BarraDemo.tsx        a etiqueta "Demo project" nos demos

lib/
  fontes.ts                  fontes do portfólio
  fontes-larkspur.ts         fontes de cada demo, em arquivos separados
  fontes-comal.ts            (ver "Decisões técnicas" — não junte tudo num só)
  fontes-diner.ts

public/arte/                 ilustrações de cada projeto
public/mockups/              prints dos demos usados nos cards da home
gerar-artes.py               script que desenha as ilustrações
```

### Trocar o texto de uma seção
Abra `content/agencia.ts`, procure a seção pelo nome (`hero`, `problema`,
`maquina`, `conta`, `planos`, `quemFaz`, `processo`, `objecoes`, `garantia`,
`fechamento`) e edite.

### Trocar o telefone, o SMS e o e-mail
`content/agencia.ts`, bloco `agencia`: `telefone` (o que disca), `telefoneVisivel`
(o que aparece escrito) e `email`. As funções `linkTel`, `linkTexto` e `linkEmail`
logo abaixo montam os links — você não precisa mexer nelas.

Os telefones dos demos ficam em cada `content/demo-*.ts`, nos mesmos dois campos.

### Mudar o preço
`content/agencia.ts` → `planos.lista` (campo `preco` de cada modelo) e
`planos.destaque`. Os preços dos pratos ficam em `content/demo-*.ts`.

### Trocar a moeda
Dois lugares: `components/site/secoes/Conta.tsx` (função `moeda`, que usa
`en-US` e `USD`) e `content/agencia.ts` → `conta.campos.preco.prefixo`.

### Trocar o país
Endereços e telefones ficam em `content/demo-*.ts` (campos `endereco`,
`telefone`, `telefoneVisivel`) e em `content/agencia.ts` (bloco `agencia`). O
idioma do documento está em `app/layout.tsx` (`lang` e `locale`).

### Mudar as cores do portfólio
`app/globals.css`, bloco `@theme`, no topo. O portfólio é quase monocromático de
propósito: a cor vem dos projetos, como parede de galeria.

### Mudar as cores de um demo
`app/projects/<slug>/<nome>.css`, primeiras linhas. Cada demo tem suas variáveis
isoladas — mexer em um nunca afeta os outros.

A cor de marca que aparece **na tabela de preços** é outra: é o campo `acento` em
`content/demos.ts`. Ela é separada da paleta porque precisa ter contraste sobre o
fundo escuro do portfólio (mínimo 4,5:1 sobre `#1a1a1d`) — nem toda cor da paleta
tem. O cartão do projeto decide sozinho se o texto fica claro ou escuro, pela
luminância de `corCard`.

---

## Como usar isto para prospectar

O caminho que fecha venda não é mandar o portfólio inteiro. É mandar um exemplo
**do restaurante dele**:

1. Copie a pasta do demo mais parecido com o restaurante que você vai abordar.
2. No arquivo `content/demo-*.ts`, troque nome, endereço, horários, pratos e
   preços (tudo isso está no perfil do Google dele).
3. No `.css` do demo, troque as variáveis de cor pelas cores da marca dele.
4. `npm run build`, publique e mande o link ou o SMS:
   *"Made an example of what [nome]'s site could look like. One minute, take a look."*

O projeto foi organizado para que isso leve **cerca de 20 minutos**. É por isso
que o conteúdo está separado do código e cada demo tem o CSS só dele.

---

## Os três projetos demonstrativos

| | Larkspur | Comal Street Tacos | Blue Plate Diner |
|---|---|---|---|
| Cidade | Portland, OR | Austin, TX | Dayton, OH |
| Arquétipo | Cozinha autoral | Fast casual / balcão | Clássico de bairro |
| Ação principal | **Reservar** | **Pedir antes** | **Ligar** |
| Tipografia | Playfair Display + Karla | Archivo Black + Space Grotesk | Alfa Slab One + Libre Baskerville |
| Luminosidade | Escuro | Escuro com cor quente | **Claro** |
| Seção exclusiva | Menu degustação com harmonização | Especiais do dia, editáveis | Linha do tempo da família |
| Prova para o cliente | Faço marca de ticket alto | Tiro o pedido dos apps de entrega | Desenho para o público dele |

Os três são **restaurantes fictícios**. Nenhum nome, endereço, telefone ou
avaliação corresponde a negócio real, e não há nenhum depoimento inventado. Isso
está dito no rodapé de cada demo, na etiqueta flutuante "Demo project", no título
da aba e — no caso da nota de avaliação do Blue Plate Diner — na própria seção
onde o número aparece.

---

## Decisões técnicas

**Next.js 16 com App Router, exportado como site estático.** Sem servidor, sem
banco, sem custo de infraestrutura. Cada página vira HTML pronto.

**Tailwind CSS v4 no portfólio, CSS puro nos demos.** O portfólio usa utilitários
para ir rápido; os demos usam CSS próprio e escopado, porque é o que torna a
personalização por cliente simples e sem risco de um afetar o outro.

**Fontes auto-hospedadas** via `next/font`: são baixadas no build e servidas com
o site. Em produção não há nenhuma chamada ao Google — melhor para velocidade e
para a privacidade de quem visita.

**Um arquivo de fontes por site.** O `next/font` registra *toda* fonte declarada
no módulo que a rota importa. Quando as oito famílias moravam num `lib/fontes.ts`
só, cada página carregava as oito: 214 KB de fonte numa página que usa duas.
Separando em `fontes-larkspur.ts`, `fontes-comal.ts` e `fontes-diner.ts`, a home
passou a pré-carregar 2 arquivos em vez de 8. **Ao criar um demo novo, crie
também o arquivo de fontes dele.**

**JavaScript no cliente só onde precisa:** cabeçalho, menu de celular, a
calculadora, sanfona de perguntas, botão flutuante e revelação no scroll. Todo o
resto é HTML estático.

**Acessibilidade:** um `<h1>` por página, hierarquia de títulos sem pulos, foco
visível, `aria-expanded` nos controles que abrem e fecham, alvos de toque de no
mínimo 40px e respeito a `prefers-reduced-motion`. A calculadora é operável só
pelo teclado. Todo texto passa em AA de contraste (4,5:1 para corpo, 3:1 para
título grande). As animações de entrada só são aplicadas quando há JavaScript —
sem ele, nada fica invisível.

**SEO:** meta tags e Open Graph por página e dados estruturados JSON-LD
(`ProfessionalService` na home). As notas de avaliação dos demos ficam **fora**
do JSON-LD de propósito: são fictícias, e marcar ficção como dado estruturado é
o tipo de coisa que rende punição de buscador.

### O que foi verificado

Tudo abaixo rodou contra o build de produção, não contra o modo de desenvolvimento:

- **Varredura de layout e acessibilidade** — 4 páginas × 5 larguras (360, 390,
  768, 1280, 1600): rolagem lateral, caixa estourada, imagem quebrada ou sem
  `alt`, id duplicado, âncora morta, alvo de toque pequeno, salto de heading,
  erro de JS e requisição falha. **Zero achados.**
- **Suíte funcional** — 45 testes: menu de celular (abre, trava a rolagem, fecha
  por link e por Esc), calculadora pelo teclado, moeda, todas as âncoras,
  telefones dentro da faixa fictícia, ausência de qualquer link de WhatsApp,
  botão flutuante, e por demo: sem erro de JS, barra de demonstração, âncoras da
  nav, `h1` único, topo reagindo à rolagem. **45/45.**
- **Auditoria de contraste WCAG** em todo texto visível das 4 páginas. O único
  item que o auditor de CSS acusa é a barra "Demo project", que ele não consegue
  ler porque o Tailwind v4 escreve a cor em `oklab` com alfa; medida por
  **amostragem de pixel** ela dá 10,5:1 e 17:1.
- **Varredura de idioma** — detector de português (acentos e sufixos) e de
  britanismos (`centre`, `colour`, `enquiry`, `maths`…) sobre o HTML gerado.
  Zero, fora os estrangeirismos culinários corretos (*taquería*, *consomé*,
  *à la mode*, *tajín*).

### Performance medida

Build de produção, viewport de celular (390px):

| Página | Requisições | Peso total | Nós no DOM | FCP |
|---|---|---|---|---|
| Home | 15 | 934 KB | 708 | 140 ms |
| Larkspur | 19 | 817 KB | 229 | 100 ms |
| Comal Street Tacos | 19 | 788 KB | 266 | 104 ms |
| Blue Plate Diner | 19 | 796 KB | 288 | 88 ms |

O peso acima está **sem compressão** porque o servidor de teste local não
comprime. Em qualquer hospedagem real (Netlify, Vercel, GitHub Pages) o HTML da
home chega em **26 KB** e o dos demos em **7 KB**; o JavaScript, que é a maior
fatia, fica em torno de **150 KB** comprimido — a linha de base de um site
Next.js. Se algum dia isso importar, dá para trocar as poucas partes interativas
por JavaScript puro e derrubar esse número para menos de 10 KB.

---

## As imagens são provisórias

Não consegui usar fotos reais: o ambiente onde o projeto foi montado não tem
acesso a bancos de imagem. As ilustrações em `public/arte/` foram **desenhadas
para este projeto** pelo script `gerar-artes.py`, cada uma na paleta do seu demo.

**Troque por fotografia antes de prospectar a sério.** Site de restaurante vive
de foto de comida — é a única categoria em que a foto *é* o produto na tela.
Unsplash e Pexels têm fotos de comida liberadas para uso comercial. Substituir é
trocar o `src` da imagem no `page.tsx` do demo.

Depois de trocar as fotos, gere de novo os prints dos cards da home — eles ficam
em `public/mockups/` e são capturas reais dos demos.
