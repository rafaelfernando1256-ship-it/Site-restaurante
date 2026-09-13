# VOLT — acessórios de rua

Loja demonstrativa de uma marca **fictícia** de acessórios em aço inox,
criada para portfólio. Marca, produtos, preços, SKUs, avaliações e telefone
são inventados. Nenhuma marca real aparece em nenhum ponto do projeto.

HTML, CSS e JavaScript puros, gerados por um build **sem nenhuma
dependência**. A saída é estática: sobe em qualquer hospedagem.

---

## Como ver

```bash
cd publico && python3 -m http.server 8000
# depois: http://localhost:8000
```

Para publicar, arraste **a pasta `publico/`** no [Netlify Drop](https://app.netlify.com/drop)
ou aponte o GitHub Pages para ela.

> Abrir o `index.html` com dois cliques funciona, mas os links entre a home e
> as páginas de produto só se comportam servindo por HTTP. Use o comando acima.

---

## Estrutura

```
volt/
├── conteudo/
│   ├── produtos.js     10 produtos, categorias e selos — fonte única
│   └── site.js         textos, FAQ, WhatsApp, avaliações de demonstração
├── modelos/
│   ├── ui.js           componentes: botão, card, seção, sanfona, estrelas
│   ├── base.js         casca: <head>, topo, busca, sacola, rodapé, SEO
│   ├── home.js         monta a home
│   └── produto.js      monta cada página de produto
├── construir.mjs       lê o conteúdo, monta tudo, escreve em publico/
├── gerar-artes.py      gera os 37 SVGs
└── publico/            ← isto é o site; é esta pasta que você publica
    ├── index.html      (gerado)
    ├── produtos/*.html (gerado: uma página por produto)
    ├── sitemap.xml · robots.txt   (gerados)
    ├── css/volt.css · js/volt.js
    └── assets/         37 artes em SVG
```

**Nada de conteúdo mora no HTML.** Os produtos vivem em
`conteudo/produtos.js` e alimentam ao mesmo tempo os cards da home, as
páginas individuais, a busca, os filtros, a ordenação, o carrinho, os
relacionados, o `sitemap.xml` e o JSON-LD. Não existe uma segunda lista para
manter em sincronia — nem no build, nem no JavaScript do navegador: cada
card carrega os próprios dados em atributos `data-*`, e o script lê dali.

---

## O que a loja faz

| Recurso | Onde está |
|---|---|
| **Busca** | Dois lugares: a lupa do topo abre a busca em tela cheia (atalho `/`), e a loja tem campo próprio. Varre nome, descrição, categoria e material, ignorando acento — "aneis" acha "Anéis". |
| **Filtros** | Chips por categoria e por "em oferta", acionados também pelos cards de categoria e pelo menu. |
| **Ordenação** | Relevância, menor preço, maior preço, maior desconto, melhor avaliados e A–Z. Reordena o DOM de verdade, então a ordem visual e a do teclado batem. |
| **Carrinho demonstrativo** | Gaveta com quantidade, subtotal, barra de frete grátis, persistência em `localStorage` e fechamento pelo WhatsApp com o pedido já montado. |
| **Página de produto** | Galeria de 3 vistas (clique ou seta), seletor de variação, quantidade, ficha técnica, garantias e relacionados. |
| **Menu mobile**, **newsletter**, **WhatsApp flutuante** | Em todas as páginas. |

Nenhum pagamento é processado: o carrinho monta o pedido e manda para o
WhatsApp. Isso está escrito no próprio carrinho e no FAQ.

---

## Como editar

### Mexer num produto

`conteudo/produtos.js`, depois `node construir.mjs`. Preço promocional é só
preencher `precoDe` — o desconto em % e o selo saem sozinhos.

### Acrescentar um produto

Copie um objeto inteiro dentro de `PRODUTOS`, troque `slug` e `sku`. Ponha as
imagens em `publico/assets/` como `<slug>.svg`, `<slug>-2.svg`, `<slug>-3.svg`.
Rode a build: a página nova, a busca, os filtros, o sitemap e os relacionados
se atualizam sozinhos.

### Trocar o WhatsApp

Em dois lugares: `conteudo/site.js` (objeto `MARCA`, usado em todos os links
gerados) e a constante `WHATS` no topo de `publico/js/volt.js`, usada pelo
carrinho.

### Cores, espaçamento e velocidade das animações

Variáveis no topo de `publico/css/volt.css`, bloco `:root`.

---

## Decisões de projeto

**As avaliações são declaradas como demonstração, não disfarçadas de reais.**
Os depoimentos usam "Perfil de exemplo" e dizem no próprio texto que são
exemplo; cada card leva a tarja "Exemplo"; a seção abre com um aviso; e o
rodapé repete. As notas com estrela também são inventadas — por isso ficam
**fora do JSON-LD**: marcar avaliação fictícia como `aggregateRating` é
exatamente o que o Google pune, e seria o tipo de coisa que estraga o domínio
de um cliente real.

**Uma página por produto, não um modal.** Cada uma com URL, `<h1>`,
`meta description`, migalhas com `BreadcrumbList` e JSON-LD `Product` com
preço e ficha técnica.

**Carrossel no celular, grade no desktop.** As faixas curadas (mais vendidos,
novidades, ofertas) correm com o dedo em vez de empilhar — no telefone isso
economiza rolagem e é o gesto que o público já usa no feed.

**Animação rápida de propósito.** 140 ms nas transições e 240 ms nos painéis.
Site de rua não tem cadência de galeria.

---

## Sobre as imagens

**As 37 artes são SVGs gerados sob medida** (`gerar-artes.py`) — correntes,
anéis, pulseiras, brincos, kits e capas de categoria. Sem banco de imagens,
sem marca de terceiros, sem dependência externa de imagem.

Duas ideias sustentam o visual:

- **Cromo, não prata.** O gradiente imita o horizonte refletido — céu claro em
  cima, chão escuro no meio, estouro embaixo — em paradas duras. Cromo não
  tem meio-tom.
- **Fundo chapado de cor.** Cada produto aparece sobre um fundo cheio, com
  contorno preto e disco de contraste. É assim que catálogo de streetwear é
  fotografado, e é o que funciona no feed.

As 37 juntas dão 8,4 KB comprimidas, e cada página carrega só as que aparecem.
Numa loja publicada, o lugar delas é o de fotografia de produto: ponha os
arquivos em `publico/assets/` com os mesmos nomes e rode a build. O CSS já
recorta tudo em quadrado.

---

## Verificação

Duas suítes com Playwright, rodadas a cada alteração.

**Varredura de página** (5 páginas × 5 larguras — 360, 390, 768, 1280 e 1600 px):
zero erro de JavaScript, zero imagem quebrada, nenhuma caixa estourando,
um só `<h1>` por página, hierarquia de títulos sem salto, `id`s únicos,
âncoras vivas, alvos de toque de 44 px e JSON-LD válido.

**Suíte funcional — 83 verificações**, entre elas: as 10 seções do briefing;
os 10 produtos com foto, nome, preço, promoção, descrição e "Ver produto";
busca sem acento; os seis critérios de ordenação conferidos valor a valor;
a ordem do DOM batendo com a ordem visual; carrinho somando, removendo e
sobrevivendo ao recarregar; galeria por clique e por seta; newsletter
recusando e-mail inválido; o menu fechando ao escolher item; e a página
continuando legível com o JavaScript desligado.

**Contraste:** todo texto passa em AA.

**Peso e velocidade:** a home abre com 8 requisições e ~105 KB,
`DOMContentLoaded` em 147 ms; uma página de produto, 4 requisições e ~65 KB,
em 33 ms. Comprimido, o site todo (HTML da home + CSS + JS + as 37 artes) dá
cerca de 35 KB. As fontes (Archivo Black e Space Grotesk) são o único recurso
externo, com pilha de fallback declarada.
