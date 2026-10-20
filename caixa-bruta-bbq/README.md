# Caixa Bruta BBQ — site oficial

Catálogo interativo de combos de churrasco sob encomenda, com agendamento
que respeita as **8 horas de antecedência** e fechamento pelo WhatsApp
(44) 99878-0479. Next.js + React + TypeScript + Tailwind, exportado como
site estático: não precisa de servidor.

## Publicar na Netlify

1. `npm install`
2. `npm run build && npm run zip`
3. Em [app.netlify.com/drop](https://app.netlify.com/drop), arraste o
   `caixa-bruta-bbq-netlify.zip` (ou a pasta `out/`).
4. Em *Site configuration → Change site name*, use `caixabrutabbq`. É o
   endereço que está em `content/negocio.ts` (campo `url`), usado no
   sitemap e na prévia do link no WhatsApp. Com outro nome ou domínio
   próprio, troque o `url` lá e gere o zip de novo.

## Onde mexer

| Quero mudar | Arquivo |
|---|---|
| Preços, combos, adicionais | `content/cardapio.ts` |
| WhatsApp, dias, horário das entregas, antecedência, taxa | `content/negocio.ts` |
| Cores e tamanhos de letra | `app/globals.css` (bloco `@theme`) |

**Horário de encerramento das entregas.** A empresa ainda não definiu,
então `ultimaEntrega` está em `null` e o site oferece de 20h a 23h30, de
meia em meia hora, sempre como *solicitação* que o atendimento confirma.
Quando houver um horário final, escreva-o ali (ex.: `'22:30'`).

**Fotos dos combos.** O site não tem fotos de verdade ainda: cada combo
aparece como o desenho da caixa vista de cima, com o espaço de cada carne
proporcional ao peso do cardápio. Para pôr a foto de um combo, salve a
imagem em `public/fotos/` (de preferência 1280×840, JPG) e preencha
`foto: '/fotos/nome.jpg'` no combo em `content/cardapio.ts`. A brasa do
topo e do fim é desenhada ao vivo (WebGL, `components/Brasa.tsx`); o
`public/brasa.jpg` é o quadro de espera dela.

## A regra das 8 horas

Toda a lógica mora em `lib/agenda.ts`, em funções puras que recebem a
hora atual de fora:

- os dias e horários são sempre do fuso `America/Sao_Paulo`, não do
  aparelho do cliente;
- a antecedência é contada em milissegundos reais, entre agora e o
  instante da entrega;
- o horário é conferido no seletor (sem 8 horas, aparece riscado), ao
  revisar e de novo no clique final, com a hora daquele segundo;
- a página atualiza a disponibilidade a cada 30 segundos e quando a aba
  volta a ficar visível.

Abrir o WhatsApp **não** confirma a encomenda: a tela final diz isso, e
a mensagem termina pedindo a confirmação da equipe.

## Taxa de entrega

Sarandi: grátis. Maringá até 10 km: grátis. Demais regiões: R$ 15,00.
Sem cálculo de rota, o site não sabe se um endereço de Maringá passa de
10 km; por isso, para Maringá, a revisão mostra "a confirmar" e o total
nas duas hipóteses, em vez de um total que pode estar errado.

## Testes

- `npm test`: 46 testes da agenda e do pedido (casos do enunciado,
  horários-limite, fuso, preços conferidos com o folheto, mensagem do
  WhatsApp).
- `npm run testar:navegador`: percorre a encomenda inteira num navegador
  de celular, com o relógio fixado, até o link do WhatsApp. Instruções
  no topo de `tests/navegador.mjs`.
