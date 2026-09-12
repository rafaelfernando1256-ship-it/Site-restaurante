# Prata Nobre — loja de joias em prata 925

Vitrine completa de e-commerce, feita como **peça de portfólio**.
A loja, a marca, o CNPJ, os preços e as fotos são **fictícios**: nada aqui
representa empresa, pessoa ou produto real.

HTML, CSS e JavaScript puros. Sem build, sem framework, sem dependência —
basta abrir o `index.html` ou jogar a pasta em qualquer hospedagem estática.

---

## Como ver

```bash
# jeito mais simples
open index.html            # macOS
xdg-open index.html        # Linux
start index.html           # Windows

# ou com um servidor local (recomendado)
python3 -m http.server 8000
# depois: http://localhost:8000
```

Para publicar: arraste a pasta inteira no [Netlify Drop](https://app.netlify.com/drop),
ou suba num repositório e ligue o GitHub Pages. Não há passo de build.

---

## O que a página faz

| Recurso | Onde está |
|---|---|
| **Sacola demonstrativa** | Gaveta lateral com quantidade, subtotal, barra de frete grátis e fechamento pelo WhatsApp já com o resumo do pedido montado. Guarda o que você escolheu no `localStorage`, então sobrevive ao recarregar. |
| **Filtros por categoria** | Botões da coleção e os cartões de categoria (que já chegam com o filtro aplicado). Também funcionam a partir do rodapé. |
| **Janela de produto** | Foto grande, descrição longa, medidas, seletor de tamanho/aro/comprimento navegável pelas setas e botão de adicionar. |
| **Sanfona de dúvidas** | Cinco perguntas, com altura animada e `aria-expanded` de verdade. |
| **Botão flutuante do WhatsApp** | Fixo no canto, em todas as telas. |
| **Revelação ao rolar** | `IntersectionObserver`. O conteúdo nasce visível: quem estiver sem JavaScript vê a página inteira do mesmo jeito. |

Nenhuma compra é processada — é uma vitrine de demonstração, e a própria
sacola avisa isso.

---

## Estrutura

```
prata-nobre/
├── index.html          página inteira, comentada por seção
├── css/style.css       folha única, mobile-first, com sumário no topo
├── js/main.js          comportamento, sem dependências
├── assets/             14 artes em SVG + favicon
└── README.md
```

---

## Como editar

### Trocar preço, nome ou foto de uma peça

Cada produto é um `<article class="peca">` no `index.html` e carrega os
próprios dados nos atributos `data-*`. **Não existe lista duplicada no
JavaScript** — a sacola, o filtro e a janela de detalhe leem dali.

```html
<article class="peca" data-cat="aneis" data-id="anel-alianca"
  data-nome="Anel Aliança Lisa 4 mm" data-preco="189"
  data-img="assets/anel-alianca.svg"
  data-desc="Polida espelhada, confortável para usar todo dia."
  data-detalhe="Texto longo que aparece na janela de produto."
  data-medidas="Largura 4 mm · Espessura 1,8 mm · Peso aproximado 3,4 g"
  data-opcoes="14|15|16|17|18|19|20" data-opcoes-rotulo="Aro">
```

Lembre de atualizar também o preço visível (`.peca__preco`) e o texto do
parcelamento, que ficam no corpo do cartão.

Para **acrescentar uma peça**, copie um `<article>` inteiro, troque os dados
e o `data-id` (que precisa ser único). Para uma **categoria nova**, some um
botão em `.filtros` com `data-filtro="minha-categoria"`, use o mesmo valor no
`data-cat` das peças e acrescente o nome amigável no objeto `NOME_CAT` do
`js/main.js`.

### Trocar o WhatsApp

O número aparece em dois lugares:

- `js/main.js` → constante `WHATS` (usada no link de fechar o pedido);
- `index.html` → nos `href="https://wa.me/..."` do botão flutuante, do
  fechamento e do rodapé.

### Mudar o piso do frete grátis

`js/main.js` → constante `FRETE_GRATIS`. Ajuste também os textos da barra de
aviso e da seção de benefícios.

### Mexer nas cores

Tudo sai de variáveis no topo do `css/style.css`, no bloco `:root`. A paleta é
fria de propósito — papel quase branco, tinta quase preta e cinzas de prata.

---

## Sobre as imagens

**As 14 artes são SVGs gerados sob medida para este projeto** — anéis,
correntes, pulseiras, braceletes, argolas e as capas de categoria. Não foram
usados bancos de imagem, marcas ou fotos de terceiros, e não há nenhuma
dependência externa de imagem.

Elas ficam ótimas como demonstração e pesam quase nada (todas juntas dão
~6 KB comprimidas), mas **numa loja real o lugar delas é o de fotos de
produto de verdade**. Para trocar: coloque os arquivos em `assets/` e atualize
o `src` do `<img>` e o `data-img` do `<article>` correspondente. O CSS já
recorta tudo em quadrado (`aspect-ratio: 1/1` com `object-fit: cover`), então
qualquer proporção se encaixa.

---

## Acessibilidade e qualidade

Conferido com Playwright em 360, 390, 768, 1280 e 1600 px de largura:

- zero erro de JavaScript, zero imagem quebrada, zero rolagem horizontal;
- todo texto passa em contraste **AA** (4,5:1 corrido, 3:1 em título grande);
- um só `<h1>`, hierarquia de títulos sem salto, `id`s únicos, âncoras vivas;
- alvos de toque de 44 px nos botões e controles;
- sacola e janela de produto prendem o `Tab`, fecham com `Esc` e devolvem o
  foco para onde ele estava;
- seletor de tamanho navega com as setas, como manda o padrão de *radiogroup*;
- `prefers-reduced-motion` desliga as animações e a rolagem suave;
- funciona sem JavaScript: o conteúdo todo continua visível e legível.

**Peso:** ~27 KB comprimidos no total, artes incluídas. Só carrega de fora as
duas fontes do Google (Prata e Hanken Grotesk).

---

## Tipografia

- **Prata** — títulos, preços e o nome da marca (serifa alta, de joalheria);
- **Hanken Grotesk** — todo o resto (grotesca neutra, ótima em corpo pequeno).

Ambas com pilha de fallback declarada, então a página não quebra se as fontes
não carregarem.
