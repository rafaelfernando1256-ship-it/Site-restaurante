# Site — Tempero D' Família

Site institucional do restaurante **Tempero D' Família** (Várzea Paulista - SP).
Feito em HTML, CSS e JavaScript puros — sem frameworks, sem build, sem dependências.
Basta abrir o `index.html` no navegador ou subir os arquivos em qualquer hospedagem.

## Estrutura

```
index.html          → todo o conteúdo do site (comentado seção por seção)
css/styles.css      → estilos (mobile-first, comentado por blocos)
js/script.js        → menu mobile, filtro do cardápio, selo "Aberto agora"
assets/logo.svg     → logo provisório
assets/hero.svg     → imagem provisória do banner
```

## Como editar as coisas mais comuns

**Trocar o número de WhatsApp**
Procure por `5511914197612` no `index.html` (aparece nos botões do topo, do banner,
do cardápio, do contato, do rodapé e no botão flutuante) e substitua pelo novo número
no formato `55` + DDD + número, sem espaços ou símbolos. O telefone clicável fica em
`tel:+5511914197612`.

**Trocar o logo e a foto do banner**
Substitua `assets/logo.svg` e `assets/hero.svg`. Se usar uma foto (`.jpg`/`.webp`),
salve em `assets/` e atualize o `src` da tag `<img>` correspondente no `index.html`.

**Editar o cardápio**
No `index.html`, na seção `CARDÁPIO`, cada prato é um bloco `<li class="menu-item">`.
Copie um bloco inteiro para criar um item novo, ou apague para remover.
Para criar uma categoria nova: adicione um botão em `.filters` com
`data-filter="nome"` e uma `div class="menu-group" data-category="nome"` logo abaixo.
**Os preços atuais são exemplos** — ajuste para os valores reais.

**Editar os horários**
Na seção `CONTATO`, na lista `<ul id="hours">`. Mantenha o formato `11:00 – 23:00`
(ou escreva `Fechado`). O selo "Aberto agora / Fechado" é calculado sozinho a partir
dessa lista — não precisa mexer no JavaScript.
Hoje só o fechamento às 23h está confirmado pelo Google; os demais horários são um
ponto de partida para você conferir e corrigir.

**Redes sociais**
No rodapé, troque o `href="#"` dos ícones de Instagram e Facebook pelos links reais.

**Avaliações do Google**
O botão "Ver avaliações no Google" leva a uma busca pelo restaurante no Google Maps.
Se quiser apontar direto para o perfil do Google Meu Negócio, copie o link do perfil
e substitua a URL no `href`. Por opção, o site **não traz depoimentos escritos** —
apenas a nota real (4,5 com 15 avaliações) e o link para as avaliações verdadeiras.

**Cores**
No topo do `css/styles.css`, no bloco `:root`. Mudando `--vermelho`, `--laranja` e
`--amarelo` o site inteiro muda de tom.

## Publicação

Qualquer hospedagem de arquivos estáticos serve (GitHub Pages, Netlify, Vercel,
Hostinger, hospedagem compartilhada). É só enviar a pasta inteira.
