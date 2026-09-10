# Sorveteria e Lanchonete Aliança — site institucional

Site de uma página para a **Sorveteria e Lanchonete Aliança** (Piratininga - SP).
HTML5, CSS3 e JavaScript puros — sem framework, sem build, sem dependências.
Abra o `index.html` no navegador ou envie a pasta para qualquer hospedagem estática.

## Estrutura

```
index.html        conteúdo do site, comentado seção por seção
css/style.css     estilos, organizados em 14 blocos numerados
js/main.js        interações, organizadas em 10 blocos numerados
assets/           logo e imagens
```

## Identidade visual

| Elemento   | Escolha                                                                        |
|------------|--------------------------------------------------------------------------------|
| Cores      | rosa `#FF5FA2`, azul `#35BEE0`, amarelo `#FFC93C`, chocolate `#6B3F2A`, branco base |
| Títulos    | Fredoka (arredondada e amigável)                                                |
| Texto      | Nunito                                                                          |

Todas as cores são variáveis CSS no topo do `css/style.css` (bloco 1).

## Interações

Cabeçalho fixo que ganha sombra ao rolar · parallax na imagem do hero · bolinhas
que flutuam devagar no banner · entrada dos elementos em fade + slide com leve
pulo · botões com "bounce" no hover · abas coloridas do cardápio · zoom nas fotos
da galeria com lightbox · contagem animada da nota do Google · menu de celular em
tela cheia · botão flutuante de WhatsApp que surge após o hero.

Respeita `prefers-reduced-motion` e o site continua legível com o JavaScript desligado.

## As imagens são provisórias

**Não consegui usar fotos reais**: o ambiente onde o site foi montado não tem acesso
a bancos de imagem. Criei ilustrações vetoriais próprias (`assets/*.svg`) na paleta
do site — funcionam bem como placeholder, mas **foto de sorvete de verdade vende
muito mais**. Priorize trocar.

Salve a foto em `assets/` e mude o `src` da `<img>`:

| Arquivo                   | Onde é usado                    | Proporção sugerida |
|---------------------------|---------------------------------|--------------------|
| `hero.svg`                | fundo do banner principal       | 16:9, bem larga    |
| `item-*.svg` (9)          | cards do cardápio               | 4:3                |
| `galeria-*.svg` (6)       | mosaico da galeria e seção sobre| 4:3                |
| `logo.svg`                | cabeçalho, rodapé, favicon      | quadrada           |

A última foto da galeria ocupa uma faixa larga: use uma imagem panorâmica ali.

## Como editar

**WhatsApp** — procure `5514997812835` no `index.html` (7 ocorrências). Formato:
`55` + DDD + número. O telefone clicável está em `tel:+5514997812835`.

**Cardápio** — na seção `4. CARDÁPIO`, cada item é um `<article class="item">`.
Copie o bloco para adicionar, apague para remover. Para uma categoria nova, crie o
botão em `.abas` com `data-aba="nome"` e o `<div class="cardapio__grupo"
data-grupo="nome">` correspondente. **Os itens e preços atuais são exemplos.**

**Horários** — na seção `8. CONTATO`, na lista `<ul id="horarios">`. Mantenha o
formato `13:00 – 00:00` (ou escreva `Fechado`). O selo "Aberto agora / Fechado" é
calculado sozinho a partir dessa lista e já entende horários que viram a
meia-noite. Só o fechamento à meia-noite está confirmado no Google; o horário de
abertura e os dias são um ponto de partida para conferir.

**Redes sociais** — no rodapé, troque o `href="#"` de Instagram e Facebook.

## Sobre as avaliações

O site mostra a nota real (4,5 com 4 avaliações) e o link para as avaliações
verdadeiras. **Não há depoimentos inventados.** Como são só 4 avaliações, o texto
da seção assume isso com naturalidade e convida quem já foi à sorveteria a avaliar
— é mais honesto e mais útil do que esconder o número.

## SEO

Meta tags de descrição, palavras-chave e Open Graph com nome e cidade · dados
estruturados JSON-LD do tipo `IceCreamShop` (endereço, telefone, nota e formas de
atendimento) · `loading="lazy"` em todas as imagens abaixo da dobra · fontes com
`display=swap` · sem bibliotecas externas.

## Publicação

Serve qualquer hospedagem estática (GitHub Pages, Netlify, Vercel, Hostinger).
Basta enviar o conteúdo desta pasta.
