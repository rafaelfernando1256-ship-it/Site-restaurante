# Chácara Casa da Sogra — site institucional

Site de uma página para a **Chácara Casa da Sogra** (Santana de Parnaíba - SP).
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

| Elemento   | Escolha                                                                 |
|------------|-------------------------------------------------------------------------|
| Cores      | mata `#1F3A2E`, folha `#2F5E45`, terracota `#B5603C`, areia `#F2EADC`, dourado `#C8A96A` |
| Títulos    | Cormorant Garamond (serifada leve, com itálico nos destaques)            |
| Texto e UI | Manrope (limpa, com versaletes espaçados nos rótulos)                    |

Todas as cores são variáveis CSS no topo do `css/style.css` (bloco 1).

## Interações

Cabeçalho transparente que ganha fundo sólido ao rolar · parallax na imagem do hero ·
entrada dos elementos em fade + slide · galeria com filtro por categoria e lightbox ·
contagem animada da nota do Google · menu de celular em tela cheia ·
botão flutuante de WhatsApp que surge após o hero.

Respeita `prefers-reduced-motion` e o site continua legível com o JavaScript desligado.

## Formulário "Consulte disponibilidade"

**Não existe servidor por trás.** Ao enviar, o formulário valida os três campos e
abre o WhatsApp com a mensagem já escrita:

> Olá! Meu nome é *Rafael*. Gostaria de consultar a disponibilidade da Chácara Casa
> da Sogra para o dia *15/10/2026*. Meu telefone para contato: *(11) 99999-8888*.

Vantagem: funciona em hospedagem estática, sem custo e sem back-end. A conversa
chega direto no WhatsApp, que é onde a reserva acontece de qualquer jeito.
O número usado fica na constante `WHATSAPP`, no topo do `js/main.js`.

## As imagens são provisórias

**Não consegui usar fotos reais**: o ambiente onde o site foi montado não tem acesso
a bancos de imagem. Criei ilustrações vetoriais próprias (`assets/*.svg`) seguindo a
paleta do site — servem como placeholder apresentável, mas **fotos reais da chácara
vão fazer muito mais diferença aqui do que em qualquer outro tipo de site**: quem
procura espaço para evento decide olhando foto.

Para trocar, salve a foto em `assets/` e mude o `src` da `<img>`:

| Arquivo                   | Onde é usado              | Proporção sugerida |
|---------------------------|---------------------------|--------------------|
| `hero.svg`                | fundo do banner principal | 16:9, bem larga    |
| `sobre.svg`               | seção "A chácara"         | retrato, 4:5       |
| `galeria-piscina-1/2.svg` | galeria — piscina         | 4:3                |
| `galeria-quarto-1/2.svg`  | galeria — quartos         | 4:3                |
| `galeria-externa-1/2.svg` | galeria — área externa    | 4:3                |
| `galeria-refeicao-1/2.svg`| galeria — refeições       | 4:3                |
| `logo.svg`                | cabeçalho, rodapé, favicon| quadrada           |

A última foto da galeria ocupa uma faixa larga: use uma imagem panorâmica ali.

## O que ainda falta confirmar

Marquei no site os pontos que você não confirmou, para não publicar informação errada:

- **Estacionamento** e **espaço gourmet** aparecem com a etiqueta "A confirmar".
  Confirme e apague a `<span class="tag">`, ou remova o item inteiro.
- **Ocasiões**: as quatro primeiras vieram do seu texto; a quinta é um bloco vazio
  ("Sua ocasião aqui") pronto para você preencher ou apagar.
- **Redes sociais**: no rodapé, troque o `href="#"` de Instagram e Facebook.
- **Avaliações**: o botão leva a uma busca no Google Maps. Para apontar direto ao
  perfil do Google Meu Negócio, substitua a URL pela do perfil.

## Sobre as avaliações

O site **não traz depoimentos com nome** — só a nota real (5,0 com 63 avaliações) e
uma lista resumindo os pontos que mais se repetem nas avaliações verdadeiras, com
link para elas. Nada foi inventado.

## SEO

Meta tags de descrição, palavras-chave e Open Graph com nome e cidade · dados
estruturados JSON-LD do tipo `LodgingBusiness` (endereço, telefone, nota e
comodidades, o que ajuda na busca local) · `loading="lazy"` em todas as imagens
abaixo da dobra · fontes com `display=swap` · sem bibliotecas externas.

## Publicação

Serve qualquer hospedagem estática (GitHub Pages, Netlify, Vercel, Hostinger).
Basta enviar o conteúdo desta pasta.
