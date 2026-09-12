# AUREA — alta joalheria

Site demonstrativo de uma joalheria **fictícia**, criado para portfólio.
A marca, as peças, os preços, as referências e o telefone foram inventados.
Nenhuma marca real é usada em nenhum ponto do projeto.

HTML, CSS e JavaScript puros, gerados por um build de ~90 linhas **sem uma
única dependência**. A saída é estática: sobe em qualquer hospedagem.

---

## Como ver

```bash
# a pasta publico/ já vem construída
cd publico && python3 -m http.server 8000
# depois: http://localhost:8000
```

Para publicar, arraste **a pasta `publico/`** no [Netlify Drop](https://app.netlify.com/drop)
ou suba num repositório e aponte o GitHub Pages para ela.

> Abrir o `index.html` com dois cliques funciona, mas os links entre a home e
> as páginas de peça só se comportam direito servindo por HTTP. Use o comando
> acima.

---

## Como o projeto está organizado

```
aurea/
├── conteudo/
│   ├── produtos.js     10 peças, categorias e coleções — fonte única
│   └── site.js         textos das seções, FAQ, WhatsApp, dados da marca
├── modelos/
│   ├── ui.js           componentes: botão, cartão, seção, sanfona, figura
│   ├── base.js         casca da página: <head>, cabeçalho, rodapé, SEO
│   ├── home.js         monta a home a partir dos componentes
│   └── produto.js      monta cada página de peça
├── construir.mjs       lê o conteúdo, monta tudo, escreve em publico/
└── publico/            ← isto é o site; é esta pasta que você publica
    ├── index.html      (gerado)
    ├── pecas/*.html    (gerado: uma página por peça)
    ├── sitemap.xml     (gerado)
    ├── robots.txt      (gerado)
    ├── css/aurea.css
    ├── js/aurea.js
    └── assets/         42 artes em SVG
```

O ponto da separação: **nada de conteúdo mora no HTML**. Os produtos vivem em
`conteudo/produtos.js` e alimentam, ao mesmo tempo, os cartões da home, as
páginas individuais, as peças relacionadas, o `sitemap.xml`, os links de
WhatsApp e os dados estruturados. Não existe uma segunda lista para manter em
sincronia.

---

## Como editar

### Mexer numa peça (preço, descrição, especificações)

Abra `conteudo/produtos.js`, altere o objeto da peça e rode a build:

```bash
node construir.mjs
```

### Acrescentar uma peça

Copie um objeto inteiro dentro de `PECAS`, troque `slug`, `ref` e os dados.
Coloque as imagens em `publico/assets/` com os nomes `<slug>.svg`,
`<slug>-2.svg`, `<slug>-3.svg` e ajuste o campo `imagens`. Rode a build: a
página nova, o sitemap e os relacionados aparecem sozinhos.

### Trocar o WhatsApp, o e-mail e os textos

Tudo em `conteudo/site.js`, no objeto `MARCA` e nos blocos `HERO`, `SECOES`
e `FAQ`.

### Mexer nas cores e no espaçamento

Variáveis no topo de `publico/css/aurea.css`, bloco `:root`.

---

## Decisões de projeto

**O WhatsApp é canal de atendimento, nunca de pagamento.** Isso está escrito
em três lugares do site (seção de atendimento, ficha de cada peça e chamada
final), e é um teste automatizado: a suíte falha se aparecer no HTML qualquer
variação de "pagar/finalizar/comprar pelo WhatsApp". Cada link de consulta já
sai com a mensagem montada e a referência da peça — `AU-AN-011`, por exemplo.

**Preço é "valor de referência".** Alta joalheria acompanha cotação de metal
e pedra; o site diz isso, e o FAQ explica que o valor firme é confirmado na
consulta e vale sete dias.

**Uma página por peça, não um modal.** Cada peça tem URL própria, `<h1>`
próprio, `meta description` própria, migalhas com `BreadcrumbList` e JSON-LD
`Product` com preço, material e especificações. É o que faz a peça aparecer
na busca.

**A didone só em corpo grande.** Bodoni Moda tem traço fino demais para texto
corrido sobre fundo escuro: aqui ela fica nos títulos, preços e no nome da
marca. O resto é Jost, que aguenta corpo pequeno em fundo preto.

**O dourado entra em fio, nunca em área.** Ouro chapado em bloco lê como
banner de promoção. No site ele aparece só em traço de 1 px, numeral de seção,
borda de botão e moldura da miniatura ativa.

---

## Sobre as imagens

**As 42 artes são SVGs gerados sob medida para este projeto** — anéis,
colares, brincos, pulseiras, capas de categoria, capas de coleção e três
editoriais. Não há banco de imagens, marca de terceiros nem nenhuma
dependência externa de imagem.

Duas técnicas fazem a joia parecer joia:

- **Metal em bandas.** Ouro polido não é um degradê suave — ele reflete o
  ambiente em faixas (escuro, claro, escuro, estouro). Os gradientes alternam
  essas faixas em vez de interpolar.
- **Pedra por facetas.** Cada gema é montada faceta a faceta (rondiz, cunhas,
  mesa, estrela), com tons sorteados de uma paleta. É a variação entre faces
  vizinhas que faz o olho ler "lapidação".

As 42 juntas dão 67 KB comprimidas, e cada página carrega só as que aparecem
(o resto é `loading="lazy"`), mas **numa joalheria
real o lugar delas é o de fotografia de produto**. Para trocar, coloque os
arquivos em `publico/assets/` com os mesmos nomes e rode a build. O CSS já
recorta tudo em quadrado (`aspect-ratio` com `object-fit: cover`), então
qualquer proporção se encaixa.

---

## Verificação

Duas suítes automatizadas com Playwright, rodadas a cada alteração.

**Varredura de página** (5 páginas × 5 larguras — 360, 390, 768, 1280 e 1600 px):
zero erro de JavaScript, zero imagem quebrada, zero rolagem horizontal, um só
`<h1>` por página, hierarquia de títulos sem salto, `id`s únicos, âncoras
vivas, alvos de toque de 44 px e JSON-LD válido em todas.

**Suíte funcional — 47 verificações**, entre elas: as 12 seções do briefing
presentes; as 10 peças com foto, nome, preço, descrição, material e botão de
consulta; a consulta carregando a referência certa; a galeria trocando de
vista por clique e por seta; a sanfona abrindo e fechando de verdade; o menu
do celular fechando ao escolher um item; `sitemap.xml` com 11 URLs; e a página
continuando legível com o JavaScript desligado.

**Contraste:** todo texto passa em AA, com folga — o pior caso do site é
6,1:1, contra os 4,5:1 exigidos.

**Acessibilidade:** foco visível em tudo, `prefers-reduced-motion` desligando
animações e rolagem suave, galeria navegável pelo teclado no padrão de abas,
sanfona com `aria-expanded` de verdade e link de pular para o conteúdo.

**Peso:** a home abre com 4 requisições e ~94 KB, `DOMContentLoaded` em 44 ms
e `load` em 69 ms; uma página de peça, com 4 requisições e ~60 KB. As fontes
(Bodoni Moda e Jost) são o único recurso externo, com pilha de fallback
declarada para o caso de não carregarem.
