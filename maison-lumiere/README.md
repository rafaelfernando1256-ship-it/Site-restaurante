# Maison Lumière — Estética Avançada

Site institucional de uma clínica de estética **fictícia**, feito como peça
de portfólio.

> **Projeto conceitual.** A Maison Lumière não existe. Nome, endereço,
> telefone, números, depoimentos, imagens e a profissional foram criados
> para demonstração e não correspondem a nenhuma empresa ou pessoa real.
> O rodapé do site diz isso em letra legível, e cada parte fictícia é
> identificada na própria seção.

---

## Rodar

```bash
npm install
npm run dev
```

Abre em http://localhost:3000.

```bash
npm run build && npm start   # o build de produção, que é o que vai para o ar
```

---

## Mudar o conteúdo — um arquivo só

**Todo o texto do site está em `content/site.ts`.** Nenhum componente tem
frase escrita dentro dele. Para trocar qualquer coisa — telefone,
procedimento, pergunta do FAQ, depoimento — você mexe nesse arquivo e em
mais nenhum.

### As fotos

Todo campo `foto` aceita duas coisas:

```ts
foto: ''                                              // placeholder da casa
foto: 'https://images.unsplash.com/photo-XXXX?w=1600&q=80'
```

O domínio do Unsplash já está liberado no `next.config.ts` — é só colar a
URL e salvar. Enquanto o campo estiver vazio entra um placeholder em
degradê na paleta do site: nada quebra, nada fica com cara de erro.

Para pegar a URL: abra a foto no unsplash.com → botão direito na imagem →
*Copiar endereço da imagem*.

> Os placeholders vieram assim porque **não consegui acessar o Unsplash do
> ambiente onde construí o site** — então não pude conferir se as URLs que
> eu escrevesse existiam de verdade, e site de portfólio com seis imagens
> quebradas não serve para nada. O `components/Foto.tsx` trata os dois
> casos pelo mesmo caminho.

### As fotos de antes e depois

Ficam de propósito como placeholder. Imagem de resultado é assunto sério:
numa clínica real, cada uma exige **autorização por escrito da paciente**,
mesma luz, mesmo ângulo e nenhum retoque.

---

## O que foi medido

Lighthouse, build de produção:

| | Desempenho | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|---|
| **Celular** | **92** / 90 | 100 | 100 | 100 |
| **Desktop** (sem WebGL) | **98** | 100 | 100 | 100 |
| **Desktop** (WebGL por software) | 63 | 100 | 100 | 100 |

As duas primeiras linhas são as que valem. A terceira é o ambiente onde
construí: uma máquina **sem placa de vídeo**, onde o Chrome desenha o 3D
na CPU. No seu computador, com GPU, esse custo não existe — **mas eu não
tinha como medir isso daqui, então está escrito em vez de prometido.**
Rode você mesmo: `npm run build && npm start`, depois Lighthouse no
Chrome.

### O que foi feito para chegar nesses números

- **O 3D não existe abaixo de 1024px.** No celular ele custava 10,4 s de
  thread bloqueada e derrubava a nota para 41 — e lá a forma aparece a 45%
  de opacidade atrás do texto, onde um degradê em CSS faz o mesmo papel
  por zero. Abaixo dessa largura o three.js **nem é baixado**.
- **O canvas só monta depois da página ficar interativa**
  (`requestIdleCallback`). Primeiro o botão responde ao clique, depois a
  decoração aparece.
- **O 3D para quando sai da tela.** Sem isso ele seguiria renderizando a
  60 quadros por segundo enquanto você lê o FAQ dez telas abaixo.
- **O GSAP foi removido.** Eram 70 KB de biblioteca para contar quatro
  números; a contagem agora usa o `animate` do framer-motion, que já
  estava no pacote.
- **O Lenis entra por import dinâmico e só no desktop.** Ele suaviza a
  roda do mouse, e celular não tem roda.
- **Fontes pelo `next/font`**, servidas do próprio domínio: sem requisição
  ao Google no navegador de quem acessa, sem pulo de layout.
- **O ambiente do 3D é construído em cena**, com `<Lightformer>`, em vez
  de `<Environment preset="...">` — que baixaria um HDR de ~2 MB de um CDN
  de terceiros a cada visita.

---

## Acessibilidade

Nota 100 no Lighthouse, mas isso é o piso. O que foi feito à mão:

- **`prefers-reduced-motion` é levado a sério.** Quem pede menos movimento
  não recebe "animação mais curta": não recebe o preloader, não recebe o
  Lenis, não recebe o canvas 3D. Rolagem sequestrada é gatilho real de
  enjoo para quem tem sensibilidade vestibular.
- **O antes/depois funciona no teclado.** É o controle que mais costuma
  ficar de fora: aqui o divisor é um `role="slider"` de verdade — recebe
  foco, anda com as setas, pula com PageUp/PageDown, vai aos extremos com
  Home/End, e anuncia a posição em porcentagem.
- **Atalho de pular para o conteúdo** como primeiro elemento focável.
- **A sanfona do FAQ é feita de `<button>`**, com `aria-expanded` e
  `aria-controls`. As respostas fechadas continuam no documento — para
  leitor de tela, para busca, e para bater com o `FAQPage` dos dados
  estruturados.
- **O botão flutuante invisível é inalcançável** pelo Tab. Sem isso, o
  foco pararia num botão que ninguém está vendo.
- **O menu do celular** fecha com Esc e trava a rolagem do fundo.

---

## Quando não há WebGL

Máquina antiga, driver na lista de bloqueio do Chrome, máquina virtual,
navegador corporativo com WebGL desligado — tudo isso existe, e o site
precisa continuar de pé.

Durante a medição, com a GPU desligada, o three.js lançou erro **durante a
renderização**. Em React 19 isso derrubou a árvore inteira e o React
refez o documento, apagando o `<title>`, o `lang` e a meta description
que o Next tinha posto. Ou seja: uma máquina sem aceleração gráfica não
perdia só a animação — perdia a página, e com ela a nota de SEO.

Duas defesas, em `components/SemWebGL.tsx`:

1. `temWebGL()` pergunta antes de montar, com um canvas descartável.
2. Uma fronteira de erro pega o que escapar.

Nos dois casos entra o plano de fundo em CSS. E os dados estruturados
saíram do `<head>` escrito à mão — eles vivem no `<body>`, onde valem
igual e não disputam com a metadata do Next.

---

## Publicar na Vercel

### Pelo site, sem terminal (o caminho mais curto)

1. Suba esta pasta para um repositório no GitHub.
2. Entre em [vercel.com](https://vercel.com) e crie a conta com o GitHub.
3. **Add New… → Project** → escolha o repositório.
4. Se o `maison-lumiere` estiver dentro de um repositório maior, abra
   **Root Directory** e aponte para a pasta `maison-lumiere`. Esse é o
   único ajuste que costuma faltar.
5. Não mexa em mais nada: a Vercel reconhece Next.js sozinha, e este
   projeto **não tem variável de ambiente nenhuma**.
6. **Deploy.** Leva uns dois minutos e sai um endereço
   `…vercel.app`.

Dali em diante, todo `git push` publica de novo sozinho.

### Pelo terminal

```bash
npm i -g vercel
cd maison-lumiere
vercel          # primeira vez: ele pergunta e cria o projeto
vercel --prod   # publica em produção
```

### Antes de apontar um domínio de verdade

Em **Settings → Domains** você liga o domínio próprio. Mas antes disso,
duas coisas neste projeto precisam de atenção — e a segunda não é detalhe:

1. **`site.seo.url`** em `content/site.ts` tem que virar o endereço real.
   É dele que saem a URL canônica, o Open Graph e o `sitemap.xml`.

2. **Os dados estruturados.** O `app/layout.tsx` publica um bloco
   `BeautySalon` com endereço, telefone e horário — é o que faz o Google
   mostrar o negócio no mapa e na busca local. **Com os dados fictícios
   que estão aí, isso é informação falsa sobre um negócio local.**
   Enquanto o site for portfólio, tudo bem: o rodapé declara que é
   conceitual. Mas se um dia ele virar o site de um cliente, troque cada
   campo pelos dados verdadeiros **antes** de ligar o domínio — e só
   então tire as marcações de "fictício".

---

## Como está montado

```
maison-lumiere/
├── content/site.ts        ← TODO o conteúdo do site
├── app/
│   ├── layout.tsx         fontes, metadata, dados estruturados
│   ├── page.tsx           a ordem das seções
│   ├── globals.css        a paleta e as peças que se repetem
│   ├── icon.svg · robots.ts · sitemap.ts
├── components/
│   ├── Hero.tsx           a abertura (texto)
│   ├── HeroCanvas.tsx     a forma 3D
│   ├── SemWebGL.tsx       a rede embaixo do 3D
│   ├── Preloader.tsx · Nav.tsx · SuaveScroll.tsx · Revelar.tsx
│   ├── Sobre.tsx · Procedimentos.tsx · Diferenciais.tsx
│   ├── AntesDepois.tsx · Profissional.tsx · Depoimentos.tsx
│   ├── FAQ.tsx · CTA.tsx · Rodape.tsx · WhatsAppFlutuante.tsx
│   └── Foto.tsx           foto de verdade ou placeholder
└── lib/movimento.ts       prefers-reduced-motion e tamanho de tela
```

A ordem das seções é a de uma conversa: quem somos, o que fazemos, por
que aqui, prove, quem atende, o que dizem, e as dúvidas que ficaram — só
então o pedido de agendamento.

Repare na alternância de fundo (areia, grafite, areia, areia, areia,
grafite, areia, dourado, grafite): o escuro entra onde o olho já está
cansando de bege, e é ele que dá ritmo à rolagem.

---

## A paleta

| | |
|---|---|
| `#FAF7F3` · `#F5EFE8` | areia — os fundos claros |
| `#C9A97C` · `#A8884F` | dourado — detalhes, linhas, sobretítulos |
| `#1C1C1C` | grafite — texto e as seções escuras |

Fontes: **Cormorant Garamond** nos títulos, **Inter** no texto corrido.

Tudo isso está em `app/globals.css`, no bloco `@theme`. Trocar o dourado
numa linha troca no site inteiro.

---

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
React Three Fiber + drei · Framer Motion · Lenis
