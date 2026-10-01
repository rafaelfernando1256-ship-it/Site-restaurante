# Grão Dourado — site demonstrativo

Site completo para o **Grão Dourado Coffee Shop**, café que fica no lounge
da Evidance, em Natal/RN. Montado de fora, a partir do que está público no
Instagram [@graodouradocoffee](https://instagram.com/graodouradocoffee).

> ## ⚠️ Leia antes de qualquer coisa
>
> **Este não é o site oficial do Grão Dourado.** É um exemplo, feito sem a
> casa ter pedido, para mostrar como o negócio deles ficaria na web.
>
> Tudo que eu não consegui confirmar está marcado com `CONFERIR` no código
> e precisa ser checado com a casa antes de qualquer publicação:
>
> | o que | onde conferir |
> |---|---|
> | **telefone** | é `(84) 9 0000-0000`, um número que não existe |
> | **preços** | estimados para a praça de Natal, item por item |
> | **horário** | nenhum horário está público no perfil deles |
> | **endereço completo** | o perfil só diz "Lounge da Evidance Natal" |
> | **datas dos eventos** | o Café com Tango é real; a periodicidade é exemplo |
> | **nota de avaliação** | não existe no site. Não inventei nenhuma |
| **as fotos** | são as do Instagram deles. Peça autorização antes de publicar |
>
> O aviso aparece em três lugares na própria página: barra fixa no canto,
> rodapé e `robots.txt` com `Disallow: /`. Aparecer no Google buscando por
> "Grão Dourado" confundiria cliente de verdade.

---

## Como rodar

Precisa de **Node.js 18 ou superior**. Nenhuma dependência para instalar.

```bash
cd grao-dourado
node construir.mjs          # gera o HTML em publico/
cd publico && python3 -m http.server 4600
```

Abra **http://localhost:4600**.

Para redesenhar as ilustrações (só se você mexer no `gerar-artes.py`):

```bash
python3 gerar-artes.py      # precisa só da biblioteca padrão
```

### Publicar

A pasta `publico/` é HTML puro. Arraste em
[app.netlify.com/drop](https://app.netlify.com/drop) ou suba em qualquer
hospedagem. Não precisa de Node no servidor.

---

## O que o site tem

| seção | o que resolve |
|---|---|
| Primeira tela | o que é, onde fica, se está aberto agora, e dois caminhos: cardápio ou WhatsApp |
| **Cardápio** | 23 itens com foto, descrição e preço. Página própria, com filtro por categoria |
| **Pedido** | monta a lista na página e manda escrita pelo WhatsApp. Sobrevive a recarregar |
| Combinações | três combos, com a economia calculada sozinha a partir dos preços dos itens |
| **Encomendas** | cento de salgado, bolo de festa, quiche inteira e coffee break — é o ticket alto de um café, e no Instagram isso vive em story que some em 24h |
| **Agenda** | Café com Tango, noite árabe, sábado no lounge. É o diferencial real deles |
| O espaço | Wi-Fi, tomada, ar, mesa grande. Responde "dá para trabalhar aí?" antes de perguntarem |
| Quem faz | a história, no tom do Instagram deles |
| Como chegar | mapa, referência ("é dentro da academia"), estacionamento e horário com o dia de hoje em destaque |
| Perguntas | sete objeções. A primeira — "preciso ser aluno da Evidance?" — é a que mais trava visita |

### As três decisões que mais mudam resultado

**O cardápio tem preço e tem página própria.** Um café que esconde o preço
perde o cliente que estava decidindo entre ele e o da esquina. E o link
`/cardapio.html` é o que se manda no WhatsApp — página separada carrega
mais rápido e entra no Google sozinha.

**"Preciso ser aluno da Evidance para entrar?" é a primeira pergunta do
FAQ.** Estar dentro de outro negócio faz muita gente achar que não pode
entrar. Essa dúvida custa visita todo dia, e nenhum story resolve.

**A agenda é seção, não story.** Café com Tango, noite árabe e sábado no
lounge são o que esse café tem e a padaria da esquina não tem. Em story
isso vive 24 horas; aqui vive enquanto o site estiver no ar.

---

## O que mexer

Todo o texto está em `conteudo/`. **Nenhuma palavra do site mora dentro de
um template.**

```
conteudo/
  marca.js       nome, telefone, endereço, horário, redes
  cardapio.js    itens, preços, categorias, combos, selos
  pagina.js      textos de todas as seções, encomendas, agenda, perguntas

modelos/
  base.js        <head>, topo, menu de celular, rodapé, dados estruturados
  home.js        a home
  cardapio.js    a página de cardápio
  ui.js          botão, cabeçalho de seção, card de item, selos

publico/
  css/grao.css   folha única
  js/grao.js     comportamento, sem framework
  img/           46 desenhos em SVG (reserva)
  img/foto/      20 fotos, recortadas do Instagram da casa

conteudo/fotos.js  dimensões das fotos (gerado, não edite)
construir.mjs      o build
gerar-artes.py     desenha os SVG de reserva
gerar-fotos.py     recorta as fotos das capturas do Instagram
```

| quero | onde |
|---|---|
| **trocar o telefone** | `conteudo/marca.js` → `whatsapp` e `whatsappVisivel` |
| mudar um preço | `conteudo/cardapio.js`, campo `preco` do item |
| adicionar um item | copie um bloco em `ITENS`, ponha a arte em `publico/img/` |
| mudar o horário | `conteudo/marca.js` → `horarios`, em minutos desde a meia-noite |
| mudar as cores | `publico/css/grao.css`, bloco `:root` no topo |
| trocar texto de seção | `conteudo/pagina.js` |
| tirar um evento | `conteudo/pagina.js` → `AGENDA.eventos` |
| **virar o site oficial** | tire o `noindex` em `modelos/base.js`, troque o `robots.txt` em `construir.mjs`, apague o bloco `.demo` em `base.js` e o `AVISO` em `pagina.js` |

---

## Como funciona por dentro

**Gerador estático sem dependência.** `conteudo/` → `modelos/` →
`construir.mjs` → `publico/`. Não há framework, não há `npm install`, não
há servidor Node em produção. Duas páginas de HTML puro.

**Aberto agora é calculado no cliente.** O selo roda no navegador de quem
visita, não no build: o que vale é o relógio de quem está decidindo se
sai de casa. Ele diz "Aberto até 20h", "Fecha em 40 min" ou "Abre amanhã
às 8h", e atualiza sozinho a cada minuto.

**O pedido vira mensagem, não transação.** Não há pagamento e não há
servidor: o carrinho monta a lista e abre o WhatsApp com tudo escrito, que
é onde a casa já atende. O estado sobrevive a recarregar, e o `localStorage`
está dentro de `try/catch` — em aba anônima ele estoura, e o pedido precisa
continuar funcionando na memória.

**O menu de celular fica fora do `<header>`.** O topo tem `backdrop-filter`,
e `backdrop-filter` cria bloco de contenção para descendente
`position: fixed` — dentro do header, o menu colapsaria para a altura da
barra. Foi bug real em outro projeto deste repositório; aqui já nasceu
resolvido, com teste que mede a altura em vez de só ler o texto.

**Foto onde dá, desenho onde não dá.** O ajudante `imagem()` em
`modelos/ui.js` prefere o campo `foto` e cai no `arte` quando ele não
existe — então um item sem foto continua funcionando, e acrescentar uma
foto depois é preencher um campo. As dimensões saem de
`conteudo/fotos.js`, gerado junto com as fotos, para o HTML já nascer com
`width` e `height` e a página não dar salto enquanto carrega.

---

## O que foi verificado

Tudo contra o build de produção:

- **Varredura de layout e acessibilidade** — 2 páginas × 5 larguras (360,
  390, 768, 1280, 1600): rolagem lateral, caixa estourada, imagem quebrada
  ou sem `alt`, id duplicado, âncora morta, alvo de toque pequeno, salto de
  heading, erro de JS. **Zero achados.**
- **Suíte funcional — 50 testes, 50 passando.** Menu de celular (abre em
  tela cheia, trava a rolagem, fecha por link e por Esc, sai do caminho do
  teclado), selo de horário, sanfona, filtro do cardápio, deep-link por
  hash, e o pedido inteiro: adicionar, somar, subtrair, zerar linha, total
  conferido contra a soma dos itens, persistência e a mensagem do WhatsApp.
- **Contraste WCAG AA** em todo texto das duas páginas. Os itens da
  primeira tela que o auditor de CSS acusa são falso positivo — ele não lê
  `linear-gradient`. Medidos por **amostragem de pixel**, dão de 7,3:1 a
  15,9:1.
- **Colisão das camadas flutuantes** (barra de demonstração × bolha do
  pedido) de 320px a 1280px. Sem toque em nenhuma largura.
- **Auditor de classe sem CSS**: nenhuma classe usada no HTML ficou sem
  regra.

### Peso

| página | requisições | peso | nós no DOM | FCP |
|---|---|---|---|---|
| Home | 9 | 309 KB | 571 | 276 ms |
| Cardápio | 10 | 302 KB | 489 | 176 ms |

Sem compressão, no servidor de teste. Em hospedagem real chega bem abaixo
disso. Para comparar: os portfólios em Next.js deste mesmo repositório
pesam 934 KB na home.

---

## As imagens

O site usa **duas fontes**, e a regra é simples: foto quando existe,
desenho quando não.

### As 20 fotos

Vieram do Instagram da própria casa, recortadas das capturas do perfil
por `gerar-fotos.py`. Ficam em `publico/img/foto/`.

O script tira os enfeites que são do Instagram e não da foto — o selo de
vídeo no canto, o botão flutuante "Mensagem" — e, nas peças
promocionais, recorta só o pedaço onde não há texto por cima.

**Foto de produto só entra quando dá para ter certeza do que é.** O
capuccino, o pudim, a quiche, a esfiha, o bolo de milho e os grãos no
porta-filtro estão lá porque são inequívocos. Onde a foto é ambígua ou o
texto cobre o prato, fica o desenho — é melhor um desenho honesto que uma
foto de outra coisa com o nome errado embaixo.

A peça da empada entra **inteira**, com o texto e tudo: a foto por trás
dela é boa, mas o painel marrom cobre tudo menos uma faixa estreita, e
recortada essa faixa sai pequena e borrada. A arte completa é deles,
mostra o produto e diz os recheios.

> ⚠️ **As fotos são da casa, não suas.** Para um exemplo que você mostra
> a eles, usar o material deles é o que faz sentido — é o negócio deles
> que você está mostrando. Mas antes de deixar o site no ar em qualquer
> endereço público, peça autorização. E peça os **originais**: estas
> saíram de captura de tela de navegador, então estão em 700–900px e um
> pouco moles. Em arquivo original ficariam bem melhores.

Para refazer os recortes você precisa das capturas do perfil:

```bash
RECORTES=/caminho/para/os/recortes python3 gerar-fotos.py
```

### Os 46 desenhos

Estão em `publico/img/` e cobrem o que não tem foto: os itens de cardápio
sem imagem inequívoca, os três combos (são composições que não existem
como foto) e o mapa. Foram desenhados por `gerar-artes.py`.

**Troque por foto sempre que conseguir.** Para apontar um item para uma
foto nova, ponha o arquivo em `publico/img/foto/` e preencha o campo
`foto` do item em `conteudo/cardapio.js` — sem extensão. O campo `arte`
continua lá como reserva.

---

## Se for mostrar para a casa

O caminho curto: suba em um link temporário, mande no direct do Instagram
deles e diga o que é — um exemplo, feito de fora, sem compromisso. O site
já diz isso sozinho em três lugares, mas vindo de você soa melhor.

Antes de mandar, conserte o que está na tabela do topo. Um dono de café
que abre o link e vê o horário errado para de ler ali.
