# conteúdo — do tema ao MP4 vertical

```bash
python3 conteudo.py conferir                        # o que falta
python3 conteudo.py roteiro "treinar em jejum"      # só o texto, para ler
python3 conteudo.py revisar "treinar em jejum"      # o agente de gatilhos
python3 conteudo.py video "treinar em jejum" --biotipo ectomorfo
```

O caminho inteiro:

```
roteiro → GATILHOS → imagens licenciadas → dark → legenda → voz → mp4
```

Sai em `saida/<tema>/`: o MP4 1080x1920, a legenda do post, os quadros
soltos e os créditos das fotos.

---

## As decisões que valem conhecer

### O agente de gatilhos: retenção, não "gatilhos mentais"

Ele lê o roteiro como psicólogo de atenção e decide corte como editor.
Devolve diagnóstico quadro a quadro, o roteiro reescrito e o plano de
tempo de cada quadro.

**A pergunta errada é "quais gatilhos mentais usar".** Escassez,
urgência, prova social, autoridade, reciprocidade e compromisso são os
princípios de *conformidade* do Cialdini — explicam como se obtém um SIM
a um pedido. Um vídeo no TikTok não é pedido, é problema de ATENÇÃO.
Usar escassez num vídeo educativo gratuito é copiar o modelo errado, e é
o que faz conteúdo de guru soar igual a conteúdo de guru.

O que ele usa, com nome e origem:

| mecanismo | o que prevê |
|---|---|
| **lacuna de informação** (Loewenstein, 1994) | curiosidade nasce de distância entre o que se sabe e o que se quer saber — lacuna grande demais gera indiferença, não curiosidade |
| **ciclo aberto** (Zeigarnik, 1927) | o inacabado ocupa a memória até fechar; loop que não fecha é clickbait e a plateia pune |
| **fluência de processamento** (Reber, Schwarz) | o que é fácil de processar é julgado mais **verdadeiro** — frase curta é credibilidade, não estilo |
| **autorreferência** (Rogers, 1977) | o que a pessoa liga a si mesma é lembrado melhor |
| **aversão à perda** (Kahneman e Tversky) | perder pesa mais que ganhar o equivalente; usar pouco, ou vira perfil de reclamação |
| **quebra de padrão** | reabre a atenção por volta do segundo 10 a 15, onde a curva cai |
| **especificidade** | "suba 2 kg" lê como quem mediu; "aumente a carga" lê como quem chutou |

#### A linha que ele não cruza

Fazer uma coisa **verdadeira** ficar vívida é engenharia de atenção.
Fazer uma coisa **falsa** ficar crível é fraude. Em fitness essa é a
diferença entre vídeo que escala e vídeo que vira denúncia e reembolso.

Ele procura manipulação **no próprio roteiro** e troca, listando cada
troca:

| achou | trocou por |
|---|---|
| urgência falsa ("só hoje") | a urgência real, que já existe no problema |
| prova social inventada | o mecanismo, que é verificável |
| antes e depois | o processo, que é o que ensina |
| promessa de prazo | a variável que a pessoa controla |
| autoridade fingida | "eu errei isso por dois anos" |

#### A aposta

Toda revisão termina dizendo **qual mecanismo está carregando o vídeo**.
Isso existe para você saber o que medir quando ele for bem ou mal — sem
isso o resultado não ensina nada para o próximo.

### Imagem: acervo licenciado, não Pinterest

O Pinterest é mural — quase toda imagem ali é de terceiro, com direito
autoral de quem fez. Usar aquilo em TikTok monetizado e em e-book que
você vende é infração, e raspar o site viola os Termos. Não é
tecnicalidade: é o que derruba conta, desmonetiza e vira notificação
**depois** que você já está faturando.

Os três acervos aqui têm licença comercial explícita e API de verdade —
Pexels, Pixabay e Unsplash. Chave grátis, dois minutos. Se um cair ou a
cota acabar, o próximo responde.

O Pinterest segue útil para **referência**: monte o painel do que quer,
descreva em palavra-chave, e a busca traz o equivalente licenciado.

### Visual: quatro decisões, não um filtro

| decisão | por quê |
|---|---|
| preto **#000 puro**, não #111 | em OLED o pixel apaga e a imagem flutua; cinza vira retângulo visível |
| saturação 0.22, contraste 1.35 | foto de banco vem alegre, e é isso que denuncia estoque |
| vinheta forte | empurra o olho ao centro e é o que deixa a legenda legível sem caixa |
| **uma** cor de destaque | duas já é tema, não identidade |

Os números foram calibrados olhando três intensidades lado a lado. A
primeira versão era tímida demais (brilho 0.82) e ainda lia como foto de
banco com filtro; escurecer mais (0.52) come o assunto junto com a borda.

Trocar `destaque` em `motor/visual.py` muda a identidade inteira sem
mexer em mais nada. É o único parâmetro que vale brincar.

### Legenda: ela é o conteúdo

No TikTok a maioria assiste **sem som**. A legenda não acompanha a
narração — a narração acompanha a legenda.

- uma frase por quadro (parede de texto é rolada, não lida)
- meio ou alto, **nunca** embaixo: o rodapé é coberto por @, trilha e botões
- contorno preto grosso, não caixa — caixa tapa a foto e grita "template"
- margem de 12%, porque o app corta as bordas em telas diferentes
- `*palavra*` sai na cor de destaque

Frase longa **diminui a fonte** em vez de ser cortada. Frase cortada no
meio é o que mais faz rolar o feed.

### Fonte

Sem fonte condensada instalada o resultado cai bastante. Vale instalar
**Anton** ou **Oswald** (grátis, Google Fonts) — no Windows é baixar o
`.ttf` e clicar em Instalar. O `conferir` diz qual está em uso.

### Voz

`edge-tts`: vozes neurais da Microsoft, grátis e sem cadastro. Antonio é
a masculina grave. Velocidade −4% e tom −8Hz: narração apressada soa a
anúncio, devagar demais soa a meditação.

Uma frase por arquivo, de propósito — cada quadro dura exatamente o que a
sua frase dura. Narrar tudo de uma vez obrigaria a cortar depois, e é aí
que a sincronia se perde.

**Se a voz falhar, o vídeo sai mesmo assim**, mudo e com legenda. A voz é
a etapa mais frágil (rede, certificado, serviço de terceiro) e derrubar o
vídeo por causa dela perderia as outras quatro etapas que já deram certo.

---

## O que ele NÃO faz

**Não posta.** O arquivo fica na pasta e você sobe à mão. Postagem
automatizada no TikTok viola os Termos e é motivo de banimento — e a
conta é o ativo, não o vídeo.

---

## Provas

```bash
python3 testes.py      # 16 provas, nenhuma toca a rede
```

A primeira delas falha se alguém algum dia acrescentar um raspador ao
acervo. É de propósito.
