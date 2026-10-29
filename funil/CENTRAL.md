# A Central — um botão liga os agentes

```
dois cliques em CENTRAL.bat      (ou: python funil.py central)
```

Abre no navegador `http://127.0.0.1:8765`. Aperte **▶ Ligar os agentes**
e deixe a janela preta aberta. Na primeira vez abre um Chrome com o
WhatsApp Web: leia o QR code com o celular (WhatsApp → Aparelhos
conectados). Depois disso ele fica logado.

---

## O que roda sozinho

```
 caça ──> prepara ──> [VOCÊ aprova] ──> envia ──> conversa ──> estúdio ──> publica
                                                      │                        │
                                                      └── alteração do cliente ┘
```

| passo | quem | o que faz |
|---|---|---|
| caça | agente 1 | busca no Google os nichos que você marcou (uma vez por dia por nicho) |
| prepara | agente 2 ou estúdio | **mensagem**: escreve a primeira mensagem · **prévia**: monta o site pelo Instagram antes |
| envia | motor | manda os primeiros contatos que **você aprovou**, no ritmo de gente, com teto por dia |
| conversa | vigia + atendente | lê quem escreveu e responde: interesse, **preço**, fechamento, dúvida |
| estúdio | Claude Code | monta a demonstração de quem quis ver e faz as **alterações** dos clientes |
| publica | agente 4 | sobe na Netlify e manda o link |

A única coisa que espera você é o **primeiro contato** com quem nunca
falou com você: aparece em "Primeiros contatos", você lê, aprova e aperta
**Enviar os aprovados**. Disparo automático para quem não pediu é o padrão
exato que a Meta bane — e o número é o seu. Todo o resto (responder,
construir, publicar, entregar, alterar) é sozinho.

## Preços por nicho

Escolha o nicho e digite os valores.

- **Comida** (restaurante, pizzaria, lanchonete, açaí, cafeteria, bar...):
  aparecem duas opções — **Valor para fazer + manutenção** ou **Valor
  somente da mensalidade/manutenção**.
- **Os outros** (clínica de estética, barbearia, hotel e pousada, salão...):
  valor para fazer + manutenção por mês.
- Nicho que não está na lista: escolha **Outro…** e digite o nome.

Quando um cliente pergunta "quanto fica?", o atendente responde com o
valor daquele nicho — **exatamente** o que você digitou. Se o modelo
escrever um R$ diferente, a frase é trocada em código antes de sair.
Nicho sem preço: a pergunta não é respondida, vira aviso em "Precisa de
você", e quando você salva o preço ele responde sozinho.

## O estúdio — como nasce a demonstração

1. os prints do Instagram do negócio vão para `material/<nome>/`
   (o agente tira sozinho, ou você põe os do celular);
2. a **ficha do Google Maps** da empresa vira `GOOGLE_MAPS.md`: nota,
   número de avaliações, as avaliações com o nome de quem escreveu,
   endereço, horário de cada dia, telefone, faixa de preço, o resumo do
   Google e as marcações (entrega, retirada, cartão, estacionamento,
   acessibilidade, pet...). Vem pela API oficial, com a mesma
   `GOOGLE_PLACES_KEY` do caçador;
3. o **Claude Code com Sonnet, esforço alto**, lê a ficha do Maps, olha
   todos os prints e escreve o `PROMPT_MASTER.md` — o prompt mestre:
   cores, seções, textos e cardápio dos prints, onde recortar cada foto,
   tudo o que interessa do Maps (avaliações inteiras com autor, horário,
   mapa, selos) e as regras de não inventar nada;
4. o **Claude Code com Opus 5.5, esforço alto**, recebe o prompt mestre e
   os prints do Instagram e constrói o site em `saida/<nome>/publico/`.

Sem a chave da Places (ou se a empresa não for achada no Maps), o site
sai só com os prints, e o `DADOS.md` diz ao Sonnet por que não há ficha.

Usa a **sua conta do Claude Code** (a assinatura), não a chave de API — e
funciona com Groq ou Gemini como cérebro do resto. Modelo e esforço de
cada etapa ficam em `config.toml`, seção `[estudio]`.

### A área do Estúdio — o botão

Na central, a seção **Estúdio** lista os leads com o que cada um tem:
nicho, cidade, em que pé está, o @ do Instagram, quantos prints, e o site
(sem site, construindo, no ar com o link, ou falhou com o motivo).

Do lado de cada um, **Fazer site de demonstração** (ou **Refazer site**,
ou **Tentar de novo**). O botão faz o mesmo caminho acima — ficha do
Maps, Sonnet, Opus — e depois:

- publica na Netlify (refazer publica no MESMO endereço, e o site
  anterior fica guardado em `versoes/`);
- quem **já conversou** com você recebe o link sozinho;
- quem **nunca falou** com você ganha a mensagem com o link em
  "Primeiros contatos", esperando a sua aprovação (a mensagem fria que
  estava lá é trocada por ela).

Funciona com os agentes ligados ou desligados. É uma fila: um site por
vez. O **automático continua**: quem pede para ver no WhatsApp ganha o
site sozinho, e o botão e o automático nunca constroem o mesmo lead ao
mesmo tempo. Cliente (quem fechou) não tem botão: mudança no site dele é
pedido de alteração, para não apagar o site que está no ar.

## Alteração pedida no WhatsApp

```
cliente: "tira a lasanha e põe o X-Tudo a R$ 28"
atendente: entende, anota o pedido, responde "deixa comigo"
estúdio:  guarda uma cópia do site, Claude Code (Opus 5.5, alto) faz SÓ o pedido
publica:  no MESMO endereço da Netlify
cliente recebe: "Pronto! ... Já está no ar: <link>"
```

- Pedido vago ("quero mudar o cardápio") → o atendente pergunta o quê,
  antes de mandar para o estúdio.
- Se a alteração falha, o site volta como estava e você recebe um aviso.
- Só funciona para **cliente** — quem fechou. Na central: "Negociando →
  Fechou", ou "Cadastrar um cliente que já tem site" (nome, WhatsApp,
  pasta do site no computador e o ID do site na Netlify, para republicar
  no mesmo endereço).
- Foto mandada no WhatsApp não é baixada: o aviso diz em que pasta salvar.

## Ajustes do motor

| ajuste | padrão |
|---|---|
| primeiro uma mensagem / primeiro o site | mensagem |
| buscar negócios novos sozinho | desligado (precisa da chave da Places) |
| novos preparados por dia | 10 |
| primeiros contatos por dia | 15 |
| segundos entre voltas | 90 |

Os horários de envio e o teto de respostas por dia continuam em
`config.toml`, seção `[vigia]`.

## O que fica onde

| arquivo | o quê |
|---|---|
| `dados/precos.json` | os preços por nicho |
| `dados/central.json` | os ajustes do motor e o placar do dia |
| `dados/funil.db` | leads, mensagens, pedidos, avisos |
| `saida/<nome>/` | o site: `PROMPT_MASTER.md`, `publico/`, `versoes/` |

Tudo em `dados/` fica fora do git — tem nome e telefone de gente real.

A página só abre no seu computador (127.0.0.1) e todo botão exige um
código que só ela conhece: outro site aberto no seu navegador não
consegue disparar nada.
