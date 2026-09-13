# VANTA STORE

E-commerce demonstrativo de uma loja multimarcas fictícia — roupas, tênis,
perfumes e acessórios. 35 páginas: home, 4 categorias + ofertas, 24 páginas de
produto, carrinho, checkout e conta.

**É uma demonstração de interface.** Nenhum pagamento é processado, nenhum
pedido é enviado e nenhum dado sai do navegador. Marcas, produtos, preços,
prazos e o CNPJ são inventados.

---

## Como rodar

Precisa só de **Node 18 ou mais novo**. Não tem `npm install`, não tem
dependência, não tem build tool.

```bash
cd vanta-store
node construir.mjs          # gera tudo dentro de publico/
```

Para ver no navegador, sirva a pasta `publico/` (abrir o arquivo direto com
`file://` quebra os caminhos):

```bash
cd publico
python3 -m http.server 4000
# abre http://localhost:4000
```

Para publicar: arraste **a pasta `publico/`** (ou o zip feito de dentro dela,
com o `index.html` na raiz do zip) para o Netlify, Vercel, GitHub Pages ou
qualquer hospedagem estática.

### Como o projeto se monta

```
conteudo/     os dados — é aqui que você edita
  site.js       nome da loja, WhatsApp, textos, cupons, FAQ
  produtos.js   os 24 produtos, categorias, marcas, tamanhos, cores
modelos/      as peças de HTML (funções que devolvem string)
  ui.js         botões, cartão de produto, filtros, sanfona
  base.js       topo, menu, busca, gavetas, rodapé, <head>
  home.js       a página inicial
  produto.js    a página de produto
  categoria.js  as páginas de categoria
  lojinhas.js   carrinho, checkout e conta
construir.mjs  junta tudo e escreve publico/
gerar-artes.py gera os 82 SVGs de publico/assets/ (opcional, veja "Imagens")
publico/      o site pronto — NÃO edite aqui, é sobrescrito a cada build
  css/vanta.css
  js/vanta.js
  assets/
```

Regra prática: **você edita `conteudo/`, `modelos/`, `publico/css/` e
`publico/js/`; nunca os `.html` de `publico/`**, porque o `construir.mjs`
reescreve todos.

---

## O que editar para trocar cada coisa

### Nome da loja

`conteudo/site.js`, bloco `LOJA` (primeiras linhas do arquivo):

```js
export const LOJA = {
  nome: 'VANTA',          // primeira palavra do logotipo (em negrito)
  sobrenome: 'STORE',     // segunda palavra (cinza, espaçada)
  assinatura: 'Moda · Sneakers · Fragrâncias',
  descricao: 'Loja multimarcas de moda e lifestyle: …',
  ...
};
```

O nome aparece sozinho no topo, no rodapé, no `<title>` de todas as páginas,
nas mensagens do WhatsApp e no JSON-LD de SEO. Trocar aqui troca em tudo.

### Logo

O logotipo é feito de texto + um quadrado com a inicial, não é imagem —
por isso fica nítido em qualquer tela.

- **O texto**: `LOJA.nome` e `LOJA.sobrenome` em `conteudo/site.js`.
- **A letra do quadrado**: `modelos/base.js`, função `marca()`, linha
  `<span class="logo__v" aria-hidden="true">V</span>` — troque o `V`.
- **O visual do quadrado** (cor, cantos, tamanho): `publico/css/vanta.css`,
  regras `.logo`, `.logo__v` e `.logo__texto`.
- **Se você tiver um logo em arquivo**, troque o conteúdo de `marca()` por
  `<img src="${raiz}assets/logo.svg" alt="${LOJA.nome}" width="…" height="…">`
  e ponha o arquivo em `publico/assets/`.
- **Favicon**: `publico/assets/favicon.svg` (o `V` branco no quadrado preto).

### Produtos

`conteudo/produtos.js`, array `PRODUTOS`. Um produto é um objeto assim:

```js
{
  slug: 'camiseta-essential',       // vira produto/camiseta-essential.html
  sku: 'VS-CAM-001',
  nome: 'Camiseta Essential',
  marca: 'norte',                   // id de MARCAS, no topo do arquivo
  categoria: 'roupas',              // roupas | tenis | perfumes | acessorios
  tipo: 'Camisetas',                // vira filtro e migalha de pão
  preco: 89.90,
  precoDe: 129.90,                  // null se não estiver em promoção
  tags: ['mais-vendido', 'oferta'], // mais-vendido | novo | oferta
  estoque: true,                    // false → "Esgotado", compra bloqueada
  tamanhos: T_ROUPA,                // T_ROUPA | T_NUM | T_CALCADO | T_UNICO
  cores: cores('preto', 'offwhite', 'oliva'),   // chaves do mapa C
  resumo: 'Uma linha, aparece no cartão.',
  descricao: ['Parágrafo 1…', 'Parágrafo 2…'],  // aba "Descrição"
  ficha: [['Composição', '100% algodão'], …],   // aba "Ficha técnica"
}
```

Para **adicionar** um produto basta acrescentar o objeto e rodar
`node construir.mjs` — a página dele, os filtros, a busca, a contagem, o
sitemap e os relacionados se ajustam sozinhos. Para **remover**, apague o
objeto (e o arquivo velho em `publico/produto/`).

Os filtros de tipo, marca, tamanho e cor são montados a partir dos produtos
que existem: não há lista a atualizar em outro lugar.

Ainda no mesmo arquivo:

- `CATEGORIAS` — as quatro categorias, com título, chamada e texto do banner.
- `MARCAS` — as seis marcas fictícias da loja e a descrição de cada uma.
- `T_ROUPA`, `T_NUM`, `T_CALCADO`, `T_UNICO` — as grades de tamanho.
- `C` — o mapa de cores (nome visível + hex do disquinho no cartão).
- `FAIXAS` — as faixas de preço do filtro.

### Preços

No próprio produto: `preco` e `precoDe`. O desconto em % , o parcelamento e o
preço no Pix são calculados, não digitados. Quem manda no cálculo é
`conteudo/site.js`:

```js
parcelas: 10,        // parcelamento máximo sem juros
parcelaMinima: 30,   // não parcela abaixo disso
freteGratis: 299,    // piso do frete grátis
```

O desconto do Pix (5%) está em `modelos/ui.js`, função `pix()`.

### Imagens

Todas as imagens são **SVG gerados por código** — não são fotos. Ficam em
`publico/assets/`, três vistas por produto (`slug.svg`, `slug-2.svg`,
`slug-3.svg`), mais o hero, os banners de categoria e o favicon.

**Para usar fotos de verdade** (é o que você vai querer numa loja real):

1. Ponha os arquivos em `publico/assets/` com os mesmos nomes
   (`camiseta-essential.jpg`, `camiseta-essential-2.jpg`, …).
2. Em `conteudo/produtos.js`, na função `imagensDe`, troque a extensão
   `.svg` por `.jpg`.
3. Rode `node construir.mjs`.

Use imagens quadradas (1:1) de uns 1000×1000 px. O hero é 2000×1250, os
banners largos de categoria 2000×1100 e os retratos dos cartões da home
1200×1500.

Se quiser mexer nos desenhos em vez de trocá-los, o gerador é
`gerar-artes.py` (só Python 3, sem bibliotecas):

```bash
python3 gerar-artes.py    # reescreve publico/assets/
```

### WhatsApp

`conteudo/site.js`, bloco `LOJA`:

```js
whatsapp: '5511900000000',          // ← só dígitos, com 55 na frente
whatsappVisivel: '(11) 90000-0000', // ← como aparece escrito no rodapé
```

O número de fábrica é um **placeholder** (`5511900000000`) e não pertence a
ninguém. Trocando essas duas linhas você acerta de uma vez o botão verde
flutuante, o botão da página de produto, o link do rodapé e o do menu.

As mensagens que já vão escritas na conversa ficam logo abaixo, no bloco
`MSG` — inclusive a do produto, que cita nome e preço.

### Cores

`publico/css/vanta.css`, bloco `:root` no topo do arquivo:

```css
--papel:   #FFFFFF;   /* fundo geral */
--creme:   #F6F4F0;   /* fundo das seções alternadas */
--tinta:   #131316;   /* texto principal, botões, rodapé */
--tinta-2: #45454C;   /* texto de apoio */
--tinta-3: #6A6A73;   /* legendas */
--oferta:  #C1372A;   /* selo de desconto */
--novo:    #1F5F43;   /* selo de novidade */
--whats:   #0F7B41;   /* verde do WhatsApp */
```

Trocar aqui repinta o site inteiro. **Se mudar as cores de texto ou de fundo,
confira o contraste**: os pares atuais passam em WCAG AA (a proporção está
anotada em comentário ao lado de cada token).

As fontes são do Google Fonts e estão declaradas em `modelos/base.js`, na
tag `<link>` do `<head>`: **Archivo** para títulos e **Instrument Sans** para
o resto.

### Informações da empresa

| O quê | Onde |
|---|---|
| E-mail, Instagram, domínio | `conteudo/site.js` → `LOJA` |
| Frase do rodapé, redes sociais | `modelos/base.js` → `rodape()` |
| CNPJ e linha de copyright | `modelos/base.js`, no fim de `rodape()` — hoje é um CNPJ zerado de propósito |
| Prazos e regras de entrega | `conteudo/site.js` → `ENTREGA` |
| Política de troca | `conteudo/site.js` → `TROCA` |
| Perguntas frequentes | `conteudo/site.js` → `FAQ` |
| Cupons de demonstração | `conteudo/site.js` → `CUPONS` |
| Textos de cada seção da home | `conteudo/site.js` → `SECOES` e `HERO` |
| Avisos de "isto é demonstração" | `conteudo/site.js` → `AVISO_DEMO` |
| Frases da tarja que rola no topo | `conteudo/site.js` → `TARJA` |

**Antes de publicar como loja real**, troque o CNPJ, apague os avisos de
demonstração (`AVISO_DEMO`, `tarja-demo`, `rodape__demo`) e ligue o checkout a
um meio de pagamento de verdade — hoje ele só mostra a interface.

---

## O que já está pronto

**Loja**: busca por nome, tipo e marca (ignora acento e maiúscula); filtros por
categoria, tipo, marca, preço, tamanho, cor e disponibilidade, combináveis;
ordenação por relevância, novidade, menor preço, maior preço e maior desconto;
chips mostrando os filtros ligados; contagem viva; estado vazio com saída.

**Produto**: galeria de três vistas com zoom, seleção de cor e de tamanho pelo
teclado (setas), quantidade, "comprar agora", "adicionar ao carrinho",
favoritos, botão de WhatsApp, abas de descrição/ficha/entrega/trocas,
relacionados e barra de compra fixa no celular. **O tamanho não vem marcado de
fábrica** — quem não escolhe recebe um aviso, em vez de levar o tamanho errado.

**Carrinho e checkout**: gaveta lateral e página cheia, quantidade, remoção,
barra de "faltam X para o frete grátis", cupom com validação e regra de valor
mínimo, resumo com subtotal, desconto, frete e total, total impresso no próprio
botão de finalizar, formulário com máscara de CEP e telefone, validação campo a
campo com foco no primeiro erro, Pix/cartão/boleto e confirmação de pedido
fictício. Carrinho, favoritos e cupom sobrevivem ao recarregar (localStorage).

**Acessibilidade**: navegação inteira por teclado, foco preso e devolvido em
menus e gavetas, `Esc` fecha tudo, rótulos em todo controle, regiões `aria-live`
para as mudanças, respeito a `prefers-reduced-motion`, e o site continua legível
e navegável **com o JavaScript desligado**.

**SEO**: `<title>` e `<meta description>` por página, Open Graph, JSON-LD de
`OnlineStore`, `Product`, `BreadcrumbList`, `FAQPage` e `CollectionPage`,
`sitemap.xml` e `robots.txt`.

### Como foi verificado

- 57 testes funcionais (Playwright) — 57 passando.
- Varredura de layout e acessibilidade nas 35 páginas × 5 larguras
  (360, 390, 768, 1280, 1600) — zero apontamentos.
- Auditoria de contraste WCAG, inclusive medindo o pixel real por trás dos
  textos sobre imagem.
- Peso: home com 449 KB e 16 requisições, primeiro desenho em ~230 ms no
  celular emulado.
