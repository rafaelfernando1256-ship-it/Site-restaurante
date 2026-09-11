# Cadeira Cheia — portfólio de sites para barbearia

Portfólio de agência especializada em criar sites para barbearias, com **três
projetos demonstrativos navegáveis**. Construído para vender: cada seção existe
para responder uma objeção e levar o dono da barbearia ao WhatsApp.

---

## Como executar localmente

Você precisa do **Node.js 20 ou superior** ([nodejs.org](https://nodejs.org)).
Para conferir o que está instalado: `node -v`.

```bash
# 1. entre na pasta do projeto
cd portfolio-barbearias

# 2. instale as dependências (só na primeira vez, leva ~30 segundos)
npm install

# 3. rode em modo de desenvolvimento
npm run dev
```

Abra **http://localhost:3000**. Qualquer arquivo que você salvar recarrega a
página sozinho.

> A primeira execução baixa as fontes do Google uma única vez e as guarda junto
> com o projeto. Por isso o **primeiro** `npm run dev` ou `npm run build` precisa
> de internet; depois disso o site funciona offline.

### Gerar a versão para publicar

```bash
npm run build     # gera a pasta out/ com o site pronto
npm run serve     # opcional: testa a pasta out/ em http://localhost:3000
```

A pasta `out/` é HTML puro. Serve em qualquer hospedagem — Netlify, Vercel,
GitHub Pages, Hostinger — sem precisar de servidor Node.

**Publicar no Netlify (mais rápido):** compacte a pasta `out/` em um .zip e
arraste em [app.netlify.com/drop](https://app.netlify.com/drop).

---

## Antes de mostrar para alguém

Um item obrigatório e dois recomendados:

1. **Troque o número de WhatsApp.** Em `content/agencia.ts`, campos `whatsapp`
   (só dígitos, com 55 e DDD) e `whatsappVisivel`. Está com um número de exemplo.
2. Ajuste os preços em `content/agencia.ts` → `planos`, se os seus forem outros.
3. Troque `metadataBase` em `app/layout.tsx` pelo seu domínio, quando tiver um.

---

## Onde mexer em cada coisa

Todo o texto do site está em `content/`. **Você não precisa abrir nenhum
componente para mudar palavra, preço ou telefone.**

```
content/
  agencia.ts              seu nome, WhatsApp, textos de venda, planos, perguntas
  demos.ts                os 3 cards de projeto da home (cores, destaques)
  demo-casa-valerio.ts    conteúdo do site demonstrativo 1
  demo-nove-e-meia.ts     conteúdo do site demonstrativo 2
  demo-dom-aurelio.ts     conteúdo do site demonstrativo 3

app/
  page.tsx                a home do portfólio (só junta as seções)
  layout.tsx              meta tags de SEO do site inteiro
  globals.css            o sistema visual do portfólio (cores e tipografia)
  projetos/<nome>/
    page.tsx              a página daquela barbearia
    <nome>.css            o visual daquela barbearia, isolado do resto

components/
  ui/                     peças reutilizáveis (botão, seção, revelar, ícone)
  site/secoes/            as seções da home, uma por arquivo
  demos/BarraDemo.tsx     a etiqueta "projeto demonstrativo" nos demos

public/arte/              ilustrações de cada projeto
public/mockups/           prints dos demos usados nos cards da home
```

### Trocar o texto de uma seção
Abra `content/agencia.ts`, procure a seção pelo nome (`hero`, `problema`,
`maquina`, `processo`, `planos`, `objecoes`, `fechamento`) e edite.

### Mudar preços
`content/agencia.ts` → `planos.lista`. Cada plano tem `setup`, `mensal`,
`equivalencia` ("menos de 3 cortes por mês") e a lista `inclui`.

### Mudar as cores do portfólio
`app/globals.css`, bloco `@theme`, no topo. O portfólio é quase monocromático de
propósito: a cor vem dos projetos, como parede de galeria.

### Mudar as cores de um demo
`app/projetos/<nome>/<nome>.css`, primeiras linhas. Cada demo tem suas variáveis
isoladas — mexer em um nunca afeta os outros.

---

## Como usar isto para prospectar

O caminho que fecha venda não é mandar o portfólio inteiro. É mandar um exemplo
**da barbearia dele**:

1. Copie a pasta do demo mais parecido com a barbearia que você vai abordar.
2. No arquivo `content/demo-*.ts`, troque nome, endereço, serviços e preços
   (tudo isso está no perfil do Google dela).
3. No `.css` do demo, troque as variáveis de cor pelas cores da marca dela.
4. `npm run build`, publique e mande o link:
   *"Fiz um exemplo de como ficaria o site da [nome]. Dá uma olhada, 1 minuto."*

O projeto foi organizado para que isso leve **cerca de 20 minutos**. É por isso
que o conteúdo está separado do código e cada demo tem o CSS só dele.

---

## Os três projetos demonstrativos

| | Casa Valério | Nove & Meia | Dom Aurélio |
|---|---|---|---|
| Arquétipo | Premium / privê | Urbana / jovem | Clássica / bairro |
| Ação principal | Reservar | Agendar | **Ligar** |
| Tipografia | Marcellus + Jost | Archivo Black + Space Grotesk | Alfa Slab + Libre Baskerville |
| Luminosidade | Escuro | Escuro com neon | **Claro** |
| Seção exclusiva | O ritual de atendimento | Escolha do barbeiro | Linha do tempo da família |
| Prova para o cliente | Faço marca de luxo | Resolvo agendamento | Desenho para o cliente dele |

As três são **barbearias fictícias**. Nenhum nome, endereço, telefone ou
avaliação corresponde a negócio real, e não há nenhum depoimento inventado —
está dito no rodapé de cada demo e na home.

---

## Decisões técnicas

**Next.js 16 com App Router, exportado como site estático.** Sem servidor, sem
banco, sem custo de infraestrutura. Cada página vira HTML pronto.

**Tailwind CSS v4 no portfólio, CSS puro nos demos.** O portfólio usa utilitários
para ir rápido; os demos usam CSS próprio e escopado, porque é o que torna a
personalização por cliente simples e sem risco de um afetar o outro.

**Fontes auto-hospedadas** via `next/font`: são baixadas no build e servidas com
o site. Em produção não há nenhuma chamada ao Google — melhor para velocidade e
para a privacidade de quem visita.

**JavaScript no cliente só onde precisa:** cabeçalho, menu de celular, sanfona de
perguntas, botão flutuante, revelação no scroll e o selo "aberto agora". Todo o
resto é HTML estático.

**Acessibilidade:** um `<h1>` por página, hierarquia de títulos sem pulos, foco
visível, `aria-expanded` nos controles que abrem e fecham, alvos de toque de no
mínimo 44px e respeito a `prefers-reduced-motion` (quem pede menos animação
recebe a página sem movimento). As animações de entrada só são aplicadas quando
há JavaScript — sem ele, nada fica invisível.

**SEO:** meta tags e Open Graph por página, `sitemap` implícito pela exportação
estática e dados estruturados JSON-LD (`ProfessionalService` na home).

### Performance medida

Medido no build de produção, em viewport de celular:

| Página | Requisições | Peso total | JS (sem compressão) | DOM pronto |
|---|---|---|---|---|
| Home | 22 | 943 KB | 477 KB | 48 ms |
| Casa Valério | 25 | 842 KB | 502 KB | 37 ms |
| Nove & Meia | 28 | 924 KB | 502 KB | 34 ms |
| Dom Aurélio | 24 | 880 KB | 505 KB | 116 ms |

O JS acima está **sem compressão** porque o servidor de teste local não comprime.
Em qualquer hospedagem real (Netlify, Vercel, GitHub Pages) ele chega comprimido
em torno de **150 KB**, que é a linha de base de um site Next.js. Se algum dia
isso importar, dá para trocar as poucas partes interativas por JavaScript puro e
derrubar esse número para menos de 10 KB.

---

## As imagens são provisórias

Não consegui usar fotos reais: o ambiente onde o projeto foi montado não tem
acesso a bancos de imagem. As ilustrações em `public/arte/` foram desenhadas para
este projeto, cada uma na paleta do seu demo.

**Troque por fotografia antes de prospectar a sério.** Site de barbearia vive de
foto — ambiente, corte, barbeiro trabalhando. Unsplash e Pexels têm ótimas fotos
de barbearia liberadas para uso comercial. Substituir é trocar o `src` da imagem
no `page.tsx` do demo.

Depois de trocar as fotos, gere de novo os prints dos cards da home — eles ficam
em `public/mockups/` e são capturas reais dos demos.
