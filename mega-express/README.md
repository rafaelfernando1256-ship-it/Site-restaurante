# Mega Express Hotel — site demonstrativo

Site completo para o **Mega Express Hotel**, duas unidades em São Raimundo
Nonato (PI), a cidade que é a porta de entrada do Parque Nacional Serra da
Capivara. Montado de fora, a partir do que está público no Instagram
[@megaexpresshotel](https://instagram.com/megaexpresshotel).

> ## ⚠️ Leia antes de qualquer coisa
>
> **Este não é o site oficial do Mega Express Hotel.** É um exemplo, feito
> sem a casa ter pedido, para mostrar como o negócio deles ficaria na web.
>
> | o que | situação |
> |---|---|
> | **telefones** | **são os números reais deles**, publicados nos posts fixados do próprio perfil. Veja a nota abaixo |
> | **fotos** | são do Instagram deles |
> | **avaliações** | são reais, publicadas por eles, com o nome de quem escreveu |
> | **diária** | não tenho o valor e **não inventei nenhum** |
> | **horários e políticas** | não estão públicos. Confirme com o hotel |
> | **distâncias ao parque** | aproximadas. Confirme antes de publicar |
>
> ### Sobre os telefones
>
> Mantive os números reais porque um site de hotel sem caminho de reserva
> não serve para mostrar a ninguém, e porque são os números certos deste
> negócio. Em troca, o site inteiro está em `noindex`, o `robots.txt` tem
> `Disallow: /` e o aviso de demonstração aparece em todas as páginas —
> para que ele nunca apareça na busca por "Mega Express Hotel" e tire
> reserva de verdade do lugar certo.
>
> **Se preferir trocar por um número de teste**, é um campo em
> `conteudo/marca.js` por unidade (`telefone` e `telefoneVisivel`). Nada
> mais quebra.

---

## Como rodar

Precisa de **Node.js 18 ou superior**. Nenhuma dependência para instalar.

```bash
cd mega-express
node construir.mjs          # gera o HTML em publico/
cd publico && python3 -m http.server 4700
```

Abra **http://localhost:4700**.

A pasta `publico/` é HTML puro: arraste em
[app.netlify.com/drop](https://app.netlify.com/drop) ou suba em qualquer
hospedagem. Não precisa de Node no servidor.

---

## As quatro páginas

| página | para quem |
|---|---|
| `index.html` | quem chegou pelo nome do hotel e precisa escolher a unidade |
| `unidade/mega-express-i.html` | quem já escolheu o centro — é o link que a recepção manda no WhatsApp |
| `unidade/mega-express-ii.html` | quem já escolheu a piscina |
| `serra-da-capivara.html` | **quem ainda não escolheu hotel nenhum** — está pesquisando o parque |

### As três decisões que mais mudam resultado

**O site inteiro gira em torno de "qual das duas".** Quem chega não quer
"o hotel": quer saber onde dormir. A comparação lado a lado é a primeira
coisa depois da capa, e cada unidade tem página própria — com o seu
telefone, as suas fotos e as avaliações de quem ficou nela.

**O site diz o que cada unidade NÃO tem.** A unidade do centro não serve
café da manhã; está escrito na home, na página dela e no FAQ. Isso saiu
de uma avaliação real no Google — um hóspede descobriu no balcão e
escreveu lá. Quem lê antes não se decepciona; quem descobre depois
escreve de novo.

**A Serra da Capivara tem página própria.** Hotel de cidade pequena não
concorre por "hotel em São Raimundo Nonato" — concorre pela pessoa que
está pesquisando o parque e ainda não decidiu onde dormir. Essa é a
página com mais chance de ser achada, e ela termina mandando para as
duas unidades.

---

## A reserva

Não existe motor de reservas e não existe pagamento. O formulário monta a
mensagem e abre o **WhatsApp da unidade escolhida** — mandar para a
central errada é o jeito mais rápido de perder a reserva.

O que ele faz:

- escolher a entrada já empurra a saída para o dia seguinte;
- conta as noites e soma as pessoas num resumo ao vivo;
- recusa saída antes da entrada e data no passado;
- escreve a mensagem pronta, com datas por extenso, noites, pessoas e a
  observação.

As datas são lidas como **data local**. `new Date('2026-10-02')` é
interpretado como UTC e, a oeste de Greenwich, volta um dia — o hóspede
pediria a diária errada.

---

## As avaliações

As 17 avaliações em `conteudo/avaliacoes.js` **não foram inventadas**.
Foram transcritas dos posts do próprio Instagram do hotel, onde a casa
publica o que recebe no Google e no TripAdvisor, com o nome de quem
escreveu. Nome e origem aparecem sempre — é o que separa avaliação real
de frase bonita.

O que o site **não** faz, e você também não deveria:

- não inventa avaliação nova;
- não inventa nota média nem quantidade total — eu não tenho esse número;
- não marca nada disso como `aggregateRating` nos dados estruturados.
  Marcar avaliação não verificada assim é motivo de punição de buscador.

**Antes de publicar:** confirme com a casa que pode reproduzir os textos.

---

## O aviso de golpe

O hotel publicou um aviso fixado dizendo que estão usando o nome deles
para aplicar golpes no Telegram, oferecendo vagas falsas e recompensas
por avaliação. Isso virou uma **faixa vermelha** no site, não um recado
de rodapé: num hotel, esse aviso protege o hóspede antes de ele mandar
dinheiro para o lugar errado, e é o tipo de coisa que o site faz melhor
que o story, porque não some em 24 horas.

---

## O que mexer

Todo o texto está em `conteudo/`. **Nenhuma palavra do site mora dentro
de um template.**

```
conteudo/
  marca.js        as duas unidades, telefones, comodidades, aviso de golpe
  avaliacoes.js   as 17 avaliações reais, com autor e origem
  regiao.js       Serra da Capivara: atrações, dicas, galeria
  pagina.js       textos de todas as seções, formulário, FAQ
  fotos.js        dimensões das fotos (gerado, não edite)

modelos/
  base.js         <head>, topo, menu, rodapé, faixa de golpe, dados estruturados
  home.js         a home
  unidade.js      a página de uma unidade (serve as duas)
  regiao.js       a página da Serra da Capivara
  ui.js           botão, cabeçalho, comodidades, cartão de avaliação

publico/
  css/mega.css    folha única
  js/mega.js      menu, sanfona e o formulário de reserva
  img/foto/       30 fotos, recortadas do Instagram do hotel

construir.mjs     o build
gerar-fotos.py    recorta as fotos das capturas do Instagram
```

| quero | onde |
|---|---|
| **trocar um telefone** | `conteudo/marca.js` → `UNIDADES[].telefone` e `telefoneVisivel` |
| adicionar o preço da diária | hoje não existe no site. Acrescente em `UNIDADES[]` e mostre na página da unidade |
| mudar uma comodidade | `conteudo/marca.js` → `COMODIDADES` (o texto sai daí em todas as páginas) |
| tirar ou trocar avaliação | `conteudo/avaliacoes.js` |
| mudar as cores | `publico/css/mega.css`, bloco `:root` |
| mexer nas atrações | `conteudo/regiao.js` |
| **virar o site oficial** | tire o `noindex` em `modelos/base.js`, troque o `robots.txt` em `construir.mjs`, apague o bloco `.demo` em `base.js` e o `AVISO` em `pagina.js` |

---

## As fotos

30 fotos recortadas da grade do Instagram deles por `gerar-fotos.py`.

A grade do app estava em **modo escuro**: as calhas entre as células são
pretas, não brancas, e o detector precisou procurar o oposto do que
procura numa captura clara. Célula de 407×542 px — 3:4 retrato.

O script também tira o que é do Instagram e não da foto:

- o rodapé "Reservas / Mega Express I e II", em 80–95% da altura;
- a tarja vermelha de legenda, quando existe, em 62–80%;
- a moldura vermelha fina do template deles, nos 2,5% do topo.

> **Peça os originais.** Estas saíram de captura de tela de celular,
> então estão em 1000–1100px e um pouco moles. Em arquivo original
> ficariam bem melhores. Trocar é substituir o arquivo em
> `publico/img/foto/` mantendo o nome.

Para refazer os recortes você precisa das capturas do perfil:

```bash
RECORTES=/caminho/para/os/recortes python3 gerar-fotos.py
```

---

## O que foi verificado

Tudo contra o build de produção:

- **Varredura de layout e acessibilidade** — 4 páginas × 5 larguras (360,
  390, 768, 1280, 1600): rolagem lateral, caixa estourada, imagem
  quebrada ou sem `alt`, id duplicado, âncora morta, alvo de toque
  pequeno, salto de heading, erro de JS. **Zero achados.**
- **Suíte funcional — 65 testes, 65 passando.** Menu de celular, sanfona,
  âncoras, e o formulário inteiro: empurrão automático da saída, contagem
  de noites, soma de pessoas, recusa de data inválida, e — o mais
  importante — **a mensagem indo para o WhatsApp da unidade certa**,
  conferido nas duas. Mais a honestidade: toda avaliação com autor e
  origem visíveis, nenhuma nota média, nenhum `aggregateRating`,
  `noindex` e `robots.txt` bloqueando.
- **Contraste WCAG AA** em todo texto das 4 páginas. Uma falha real
  corrigida: o vermelho claro do rodapé dava 4,40:1 sobre o preto.

### Peso

| página | requisições | peso | nós no DOM | FCP |
|---|---|---|---|---|
| Home | 8 | 390 KB | 481 | 264 ms |
| Serra da Capivara | 9 | 543 KB | 255 | 152 ms |
| Mega Express I | 7 | 261 KB | 306 | 176 ms |
| Mega Express II | 8 | 327 KB | 308 | 156 ms |

Sem compressão, no servidor de teste. O HTML sozinho são 131 KB nas
quatro páginas somadas — o resto é foto.

---

## Se for mostrar para a casa

Mande no direct do Instagram deles e diga o que é: um exemplo, feito de
fora, sem compromisso. O site já diz isso em três lugares, mas vindo de
você soa melhor.

Antes de mandar, resolva o que está na tabela do topo — principalmente o
**valor da diária**, que é a primeira coisa que o dono vai procurar e a
única que eu não pude preencher.
