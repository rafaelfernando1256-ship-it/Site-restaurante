# Projetos para Joias & Acessórios

Página de portfólio feita para **conseguir cliente**, não para exibir galeria.
Apresenta os três projetos (PRATA NOBRE, AUREA e VOLT) para donos de loja de
prata, joalheria, semijoias, acessórios e marcas de moda, e conduz o visitante
até uma conversa no WhatsApp.

HTML, CSS e JavaScript puros, gerados por um build sem dependências.

---

## ⚠ Antes de publicar: preencha seus dados

Abra **`conteudo/site.js`** e complete o bloco `EU` no topo. É o único lugar
com informação sua — o resto da página se monta a partir dele:

| Campo | O que é | Valor atual |
|---|---|---|
| `nome` | Como você quer ser chamado | `Rafael` |
| `cidade` | Sua cidade | `São Paulo` |
| `whatsapp` | **Seu número**, só dígitos, com 55 | `5511999999999` ← trocar |
| `whatsappVisivel` | Como aparece na tela | `(11) 99999-9999` ← trocar |
| `email` | Seu e-mail | `seu@email.com` ← trocar |
| `instagram` / `instagramUrl` | Seu perfil | `@seu.instagram` ← trocar |
| `dominio` | Onde a página vai morar | `https://seusite.com.br` ← trocar |

Depois rode `node construir.mjs`. **Enquanto o WhatsApp estiver com o número
de exemplo, nenhum botão da página funciona** — é o primeiro item a trocar.

---

## Como ver e como publicar

```bash
node construir.mjs          # monta a página e copia os três projetos
cd publico && python3 -m http.server 8000
# depois: http://localhost:8000
```

A pasta `publico/` já sai com os três projetos dentro, em `publico/demos/`.
Arraste **só essa pasta** no [Netlify Drop](https://app.netlify.com/drop): a
página e os três sites sobem juntos, e os botões "Ver projeto" funcionam.

---

## Estrutura

```
vitrine-joias/
├── conteudo/
│   ├── site.js         seus dados, textos, motivos, processo e dúvidas
│   └── projetos.js     os três projetos
├── modelos/
│   ├── ui.js           componentes: botão, seção, sanfona, cabeçalho
│   ├── base.js         casca: <head>, topo, rodapé, barra fixa, SEO
│   └── pagina.js       monta a página
├── construir.mjs       gera publico/ e copia os demos
└── publico/            ← isto é o site; é esta pasta que você publica
    ├── index.html      (gerado)
    ├── css/ · js/ · assets/
    └── demos/          (copiado de ../prata-nobre, ../aurea, ../volt)
```

O `construir.mjs` copia os três projetos das pastas irmãs. Se você mexer em
algum deles, rode a build de novo para a cópia publicada ficar igual. Se uma
pasta estiver faltando, o build avisa em vez de gerar um link quebrado.

---

## Como a página foi pensada para converter

Uma galeria bonita mostra trabalho. Esta página tenta fechar negócio, e cada
seção existe por um motivo:

1. **Hero** — headline com a promessa, e logo abaixo quem eu atendo. O visitante
   descobre em cinco segundos se a página é para ele.
2. **Para quem eu faço** — os cinco segmentos nomeados, cada um com a dor
   específica dele. Quem se reconhece continua lendo.
3. **Projetos** — prova. Não é imagem de mockup: são capturas reais, e os
   botões abrem os sites funcionando, inclusive no celular. Cada projeto tem
   um segundo botão, "Quero um assim", que já leva o nome do projeto na
   mensagem — quem gostou de um estilo não precisa explicar qual.
4. **Por que investir** — os seis pontos do briefing, cada um no formato
   *sem site → com site*. Argumento de venda precisa mostrar a perda, não só
   o benefício.
5. **O que você recebe** — tira a incerteza do que está incluído.
6. **Como funciona** — quatro passos, para quem nunca contratou site e tem
   medo de processo confuso.
7. **Dúvidas** — as seis objeções reais que travam a decisão, inclusive as
   incômodas ("eu já vendo pelo Instagram", "quanto custa", "vou depender de
   você?").
8. **Chamada final** — o pedido, com alternativa por e-mail para quem não
   gosta de WhatsApp.

Além disso: **barra fixa no celular** que aparece depois do hero e some na
chamada final (duas chamadas competindo atrapalham), botão flutuante do
WhatsApp e **mensagem pronta em cada botão**, para o cliente só apertar enviar.

---

## Sobre honestidade — leia antes de publicar

Esta página **não tem depoimento de cliente, número de projetos entregues,
nota de avaliação nem anos de experiência**. Nada disso foi inventado, porque
é exatamente o tipo de coisa que derruba a confiança quando o cliente descobre.

A prova aqui são os três projetos, que qualquer um pode abrir e testar.
Quando você tiver cliente real, o melhor acréscimo a esta página é um bloco
de depoimentos verdadeiros — e aí ele vale mais que qualquer número.

As três marcas são declaradas como fictícias em dois lugares: na seção de
projetos e no rodapé.

---

## Atualizar as capturas dos projetos

As imagens em `publico/assets/*.jpg` são telas reais. Se você mexer em algum
projeto, gere de novo com Playwright: sirva a pasta `publico/` e capture
`demos/<projeto>/index.html` em 1440×900 (desktop) e 390×780 (celular),
salvando como `<projeto>-desk.jpg` e `<projeto>-cel.jpg`.

---

## Verificação

**Varredura de página** (5 larguras — 360, 390, 768, 1280 e 1600 px): zero erro
de JavaScript, zero imagem quebrada, nenhuma caixa estourando, um só `<h1>`,
hierarquia de títulos sem salto, `id`s únicos, âncoras vivas e alvos de toque
de 44 px.

**Suíte funcional — 54 verificações**, entre elas: a headline e a chamada final
exatas do briefing; os cinco segmentos citados já no topo; os três projetos com
imagem, nome, descrição, estilo e "Ver projeto"; **os três links de demo
respondendo 200 de verdade**; os seis motivos presentes; a mensagem do WhatsApp
já escrita e citando o projeto certo; a barra fixa aparecendo e sumindo na hora
certa; e a página inteira legível com o JavaScript desligado.

**Contraste:** todo texto passa em AA. O verde do WhatsApp foi escurecido de
`#128C4A` (4,31:1 — reprovava) para `#0F7B41` (5,3:1).

**Peso:** 3 requisições e ~61 KB no primeiro carregamento, `DOMContentLoaded`
em 105 ms. As previews são carregadas sob demanda (`loading="lazy"`).
