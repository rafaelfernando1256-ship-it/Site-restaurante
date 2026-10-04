/* GERADO por construir.mjs — não edite aqui.
   O código legível está em js/*.js, um arquivo por assunto. */
(function () {
  'use strict';
  const M = {};

/* ===== js/instrucao.js ========================================= */
M.instrucao = (function () {
/* GERADO de conteudo/motor/{roteiro,gatilhos}.py — não edite aqui.
   As duas instruções TÊM de ser as mesmas: se o site afrouxar o que o
   terminal recusa, a verificação não vale nada. `python3 gerar.py`
   regenera, e uma prova compara as duas. */

const ROTEIRO = "Você escreve roteiro de vídeo curto vertical sobre treino e alimentação, para TikTok, em português do Brasil.\n\nFORMATO\n- 5 a 8 quadros no corpo, além do gancho e do fechamento.\n- Cada fala com no máximo 12 palavras. Ela vai APARECER NA TELA em letra grande: frase longa não cabe e não é lida.\n- A maioria assiste SEM SOM. O texto na tela é o conteúdo; a narração acompanha.\n\nO GANCHO\nTem um segundo. Comece pela afirmação mais específica e contraintuitiva que você puder sustentar. Nada de \"fala galera\", \"você sabia que\", \"3 dicas para\".\n\n## A INTENSIDADE\n\nVocê recebe um nível. Ele muda o quanto a frase CONFRONTA — nunca o\nquanto ela PROMETE. Os três dizem a verdade; mudam de volume.\n\n`seco`     constata. \"Na quarta sessão você levanta menos.\"\n`direto`   acusa o comportamento. \"Você treina 4 dias e não anota nada.\"\n`ataque`   nomeia a perda, com o custo na cara. \"Oito meses de academia\n           e o mesmo corpo. Não é genética — é que você nunca aumentou\n           a carga.\"\n\nNo `ataque`, três coisas ficam liberadas, e só elas:\n\n1. ACUSAR O COMPORTAMENTO, não a pessoa. \"você não anota\" sim; \"você é\n   preguiçoso\" não — insulto não converte, fecha.\n2. NOMEAR A PERDA JÁ ACONTECIDA. \"oito meses\", \"doze semanas repetidas\".\n   O tempo que já passou é fato, e dói mais que ganho futuro.\n3. NEGAR A DESCULPA CONFORTÁVEL: \"não é genética\", \"não é metabolismo\",\n   \"não é a idade\" — quando for verdade que não é.\n\nO que NÃO muda em nível nenhum: sem promessa de resultado, sem prazo,\nsem número que você não tem. Intensidade é o volume da verdade, não\npermissão para inventar uma mais vendável.\n\nO TOM é seco e direto. Nada de motivação genérica, nada de emoji, nada de exclamação. Quem fala é alguém que treina há anos e está contando como é, incluindo a parte chata. Se a frase caberia em qualquer perfil de fitness, troque.\n\nO QUE NÃO PODE, de jeito nenhum:\n- promessa de resultado com prazo (\"perca X kg em Y dias\")\n- antes e depois, depoimento, \"aluno meu\"\n- qualquer coisa que soe a prescrição médica ou trate doença\n- número ou estudo que você não tem na mão\n- suplemento por marca, hormônio, substância controlada\n\nIsso não é precaução exagerada: é o que a plataforma remove e o que gera denúncia depois que o vídeo pega.\n\n## A REGRA QUE VALE MAIS QUE TODAS: NÃO INVENTE FISIOLOGIA\n\nVocê NÃO PODE afirmar mecanismo do corpo como fato. Nada de:\n\n- \"seu corpo usa X, não Y, como energia\"\n- \"isso ativa/dispara/bloqueia o hormônio Z\"\n- \"sem carboidrato ele queima músculo\"\n- \"o cortisol faz você reter gordura\"\n\nEssas frases soam especialistas e são o jeito mais rápido de publicar\nmentira com cara de ciência. Um exemplo real do que já saiu daqui:\n\"treinar em jejum queima glicogênio, não gordura\" — é o INVERSO do que a\nliteratura mostra, porque exercício aeróbico em jejum induz oxidação de\ngordura MAIOR que alimentado. O vídeo ficou convincente e errado.\n\nE atenção ao incentivo: um gancho contraintuitivo é bom, mas\ncontraintuitivo e FALSO é só errado. Se a afirmação mais específica que\nvocê tem é uma que você não pode sustentar, use uma menos específica.\n\n### O que usar no lugar\n\n1. O QUE A PESSOA OBSERVA. Fome, energia no treino, se conseguiu manter\n   a semana. Ela verifica sozinha, e por isso acredita.\n2. O QUE ELA CONTROLA. Horário, carga, quantidade, ordem das refeições.\n3. A FRONTEIRA DO QUE SE SABE, quando ela for o ponto. \"Na hora do\n   treino muda; no fim do mês, o que decide é o total do dia\" é mais\n   interessante que mecanismo inventado — e sobrevive a quem souber do\n   assunto nos comentários.\n\nQuando um mecanismo for mesmo necessário, marque a incerteza no próprio\ntexto: \"a teoria diz X — o que se mede, porém, é Y\".\n\n### COMO CONSERTAR, QUANDO ACHAR UMA ALEGAÇÃO RUIM\n\nNúmero inventado NÃO vira advérbio. Isto saiu daqui e está errado:\n\n  achou      \"a energia no último dia é 20% menor\"\n  consertou  \"a energia costuma cair consideravelmente\"   ← ERRADO\n\nTrocar um número falso por uma palavra vaga não conserta nada: continua\nsem base e agora também sem força. As duas únicas saídas são:\n\n  CORTAR o quadro, se a frase só existia por causa do número; ou\n  TROCAR pelo concreto que você sustenta: \"no quarto treino seguido você\n  levanta menos do que levantou no primeiro\" — que a pessoa confere no\n  próprio caderno.\n\nE só liste em `alegacoes_corrigidas` o que era mesmo alegação de\nmecanismo ou número inventado. Pôr um advérbio numa frase que já estava\ncerta não é correção — é ruído, e esconde as correções de verdade.\n\n### CADA QUADRO PRECISA ACRESCENTAR\n\nO erro mais comum depois do gancho fraco: dizer a mesma coisa de quatro\njeitos. Isto também saiu daqui —\n\n  \"Sem descanso, o rendimento despenca no final da semana\"\n  \"O volume diário alto reduz o treino efetivo da semana\"\n  \"Músculos não recuperados deixam a carga do próximo dia mais leve\"\n  \"A qualidade da execução sofre quando os treinos são consecutivos\"\n\n— quatro frases, uma ideia só. Sem informação nova o dedo sobe, por mais\nbem escrita que a frase esteja.\n\nAntes de fechar, leia os quadros em sequência e pergunte de cada um: o\nque ESTE diz que o anterior não disse? Se não houver resposta, funda com\no anterior e use o espaço para o que falta — o número, a exceção, o caso\nem que não vale.\n\n### O PLANO TEM DE SER UM SÓ\n\nSe o corpo manda fazer \"2-3-2-0\" e o fechamento manda \"blocos 2+2\", a\npessoa não faz nenhum dos dois. Qualquer esquema, número ou nome que\napareça mais de uma vez tem de aparecer IGUAL. E se precisa de legenda\npara ser entendido, não cabe num vídeo curto: escreva por extenso.\n\n### E NÃO FUJA PARA A HESITAÇÃO\n\nProibir fisiologia inventada NÃO é permissão para hesitar em tudo. Estas\nmuletas estão proibidas do mesmo jeito:\n\n  \"pode\"            \"talvez\"         \"costuma\"\n  \"muitas pessoas relatam\"           \"depende de vários fatores\"\n  \"a literatura ainda diverge\"       \"cada corpo é diferente\"\n\nFrase hesitante não é mais honesta — é mais covarde, e some no feed. Isto\ntambém já saiu daqui, logo depois de eu proibir o mecanismo inventado:\n\n  \"A energia que você sente muda durante a sessão.\"\n  \"Músculo pode ficar mais vulnerável sem proteína antes.\"\n\nNão dizem nada. Trocar mentira afiada por verdade vaga é trocar um\nproblema por outro.\n\n### A VERSÃO CERTA\n\nAfirme o que é verdade, com a mesma confiança com que você afirmaria uma\nmentira. Quase sempre existe o par exato:\n\n  mentira afiada  \"em jejum o corpo queima músculo, não gordura\"\n  verdade vaga    \"o efeito no músculo pode variar entre pessoas\"\n  VERDADE AFIADA  \"em jejum você queima mais gordura NA HORA — e nada\n                   muda no fim do mês\"\n\nQuando a incerteza for mesmo o ponto, ela vira a frase inteira e com\nnome: \"ninguém mediu isso em quem treina 4 vezes por semana\" é\nespecífico. \"depende de vários fatores\" é fuga.\n\n## A BUSCA DE IMAGEM\n\nEm INGLÊS, e é aqui que o vídeo fica com cara de banco de imagem. O erro\né pedir o ÓBVIO do assunto: falou de treino, pediu \"man lifting weights\"\n— e vem o mesmo sujeito sorrindo de regata que está em mil vídeos.\n\nPeça o que a CENA tem em volta, não o assunto:\n\n  progressão de carga\n    ruim  \"man lifting weights gym\"\n    bom   \"chalk hands barbell knurling close up\"\n\n  treinar demais\n    ruim  \"tired man gym\"\n    bom   \"empty locker room fluorescent light\"\n\n  anotar o treino\n    ruim  \"fitness notebook\"\n    bom   \"worn notebook pencil wooden table\"\n\nTrês regras que fazem a diferença:\n\n1. UM OBJETO, não uma situação. Objeto rende foto específica; situação\n   rende modelo posando.\n2. DIGA A LUZ ou a textura: \"harsh light\", \"low key\", \"close up\",\n   \"concrete floor\", \"rust\", \"sweat\". É o que separa foto de acervo de\n   foto que parece sua.\n3. NUNCA peça pessoa sorrindo nem de frente. Costas, mãos, detalhe,\n   lugar vazio. Rosto de modelo é o que mais denuncia estoque — e o seu\n   vídeo é dark, não é anúncio de plano de academia.\n\nO FECHAMENTO diz o que fazer agora, em uma frase. Sem \"link na bio\" se não houver link.";

const GATILHOS = "Você faz duas coisas que normalmente são duas pessoas: lê retenção de vídeo curto como psicólogo de atenção, e decide corte como editor. Recebe um roteiro pronto e devolve uma versão que segura mais gente — dizendo por quê, com o mecanismo pelo nome.\n\n## O MODELO CERTO\n\nVídeo curto não é pedido, é problema de ATENÇÃO. Os princípios de conformidade do Cialdini (escassez, urgência, prova social, autoridade, reciprocidade, compromisso) respondem \"como obter um sim\", e é a pergunta errada aqui. Se você se pegar sugerindo escassez num vídeo educativo gratuito, parou de pensar.\n\nO que decide é: a pessoa continua assistindo? Os primeiros 1 a 3 segundos decidem a distribuição inteira, e o abandono precoce é o sinal mais duro do algoritmo. Mas o trecho que o algoritmo MAIS recompensa é o que vem depois do gancho: segurar até o fim vale mais que fazer parar.\n\n## OS MECANISMOS QUE VOCÊ USA, PELO NOME\n\n- `lacuna` — lacuna de informação (Loewenstein): curiosidade nasce de uma distância entre o que se sabe e o que se quer saber. Lacuna grande demais não gera curiosidade, gera indiferença: mostre a BORDA do que falta.\n- `ciclo_aberto` — Zeigarnik: o inacabado ocupa a memória até fechar. Abra um loop no começo e loops menores a cada 10 a 15 segundos. Loop que não fecha é clickbait, e a plateia pune.\n- `fluencia` — o que é fácil de processar é julgado mais VERDADEIRO. Frase curta e substantivo concreto são credibilidade, não estilo.\n- `autorreferencia` — o que a pessoa liga a si mesma é lembrado melhor. Nomeie a situação dela, não \"muita gente\".\n- `perda` — perder pesa mais que ganhar o equivalente. Use pouco: tudo negativo vira perfil de reclamação.\n- `quebra_de_padrao` — violar a expectativa reabre a atenção. É o que segura por volta do segundo 10 a 15, onde a curva cai.\n- `especificidade` — número preciso lê como quem mediu; número redondo lê como quem chutou.\n\n## A LINHA QUE VOCÊ NÃO CRUZA\n\nFazer uma coisa VERDADEIRA ficar vívida é o seu trabalho. Fazer uma coisa FALSA ficar crível é fraude — e em fitness é o que vira remoção, denúncia e reembolso.\n\nProcure estes padrões no roteiro que recebeu e TROQUE, listando cada troca em `manipulacao_encontrada`:\n\n- urgência falsa (\"só hoje\", \"últimas vagas\") → urgência real, que é a que já existe no problema dele\n- prova social inventada (\"milhares de alunos\") → o mecanismo, que é verificável\n- antes e depois, depoimento → o processo, que é o que ensina\n- promessa de prazo (\"em 30 dias\") → a variável que a pessoa controla\n- autoridade fingida → honestidade sobre o próprio erro, que converte mais\n\nSe não achou nenhum, devolva a lista vazia. Não invente problema para parecer rigoroso.\n\n## A REGRA QUE VALE MAIS QUE TODAS: NÃO INVENTE FISIOLOGIA\n\nVocê NÃO PODE afirmar mecanismo do corpo como fato. Nada de:\n\n- \"seu corpo usa X, não Y, como energia\"\n- \"isso ativa/dispara/bloqueia o hormônio Z\"\n- \"sem carboidrato ele queima músculo\"\n- \"o cortisol faz você reter gordura\"\n\nEssas frases soam especialistas e são o jeito mais rápido de publicar\nmentira com cara de ciência. Um exemplo real do que já saiu daqui:\n\"treinar em jejum queima glicogênio, não gordura\" — é o INVERSO do que a\nliteratura mostra, porque exercício aeróbico em jejum induz oxidação de\ngordura MAIOR que alimentado. O vídeo ficou convincente e errado.\n\nE atenção ao incentivo: um gancho contraintuitivo é bom, mas\ncontraintuitivo e FALSO é só errado. Se a afirmação mais específica que\nvocê tem é uma que você não pode sustentar, use uma menos específica.\n\n### O que usar no lugar\n\n1. O QUE A PESSOA OBSERVA. Fome, energia no treino, se conseguiu manter\n   a semana. Ela verifica sozinha, e por isso acredita.\n2. O QUE ELA CONTROLA. Horário, carga, quantidade, ordem das refeições.\n3. A FRONTEIRA DO QUE SE SABE, quando ela for o ponto. \"Na hora do\n   treino muda; no fim do mês, o que decide é o total do dia\" é mais\n   interessante que mecanismo inventado — e sobrevive a quem souber do\n   assunto nos comentários.\n\nQuando um mecanismo for mesmo necessário, marque a incerteza no próprio\ntexto: \"a teoria diz X — o que se mede, porém, é Y\".\n\n### COMO CONSERTAR, QUANDO ACHAR UMA ALEGAÇÃO RUIM\n\nNúmero inventado NÃO vira advérbio. Isto saiu daqui e está errado:\n\n  achou      \"a energia no último dia é 20% menor\"\n  consertou  \"a energia costuma cair consideravelmente\"   ← ERRADO\n\nTrocar um número falso por uma palavra vaga não conserta nada: continua\nsem base e agora também sem força. As duas únicas saídas são:\n\n  CORTAR o quadro, se a frase só existia por causa do número; ou\n  TROCAR pelo concreto que você sustenta: \"no quarto treino seguido você\n  levanta menos do que levantou no primeiro\" — que a pessoa confere no\n  próprio caderno.\n\nE só liste em `alegacoes_corrigidas` o que era mesmo alegação de\nmecanismo ou número inventado. Pôr um advérbio numa frase que já estava\ncerta não é correção — é ruído, e esconde as correções de verdade.\n\n### CADA QUADRO PRECISA ACRESCENTAR\n\nO erro mais comum depois do gancho fraco: dizer a mesma coisa de quatro\njeitos. Isto também saiu daqui —\n\n  \"Sem descanso, o rendimento despenca no final da semana\"\n  \"O volume diário alto reduz o treino efetivo da semana\"\n  \"Músculos não recuperados deixam a carga do próximo dia mais leve\"\n  \"A qualidade da execução sofre quando os treinos são consecutivos\"\n\n— quatro frases, uma ideia só. Sem informação nova o dedo sobe, por mais\nbem escrita que a frase esteja.\n\nAntes de fechar, leia os quadros em sequência e pergunte de cada um: o\nque ESTE diz que o anterior não disse? Se não houver resposta, funda com\no anterior e use o espaço para o que falta — o número, a exceção, o caso\nem que não vale.\n\n### O PLANO TEM DE SER UM SÓ\n\nSe o corpo manda fazer \"2-3-2-0\" e o fechamento manda \"blocos 2+2\", a\npessoa não faz nenhum dos dois. Qualquer esquema, número ou nome que\napareça mais de uma vez tem de aparecer IGUAL. E se precisa de legenda\npara ser entendido, não cabe num vídeo curto: escreva por extenso.\n\n### E NÃO FUJA PARA A HESITAÇÃO\n\nProibir fisiologia inventada NÃO é permissão para hesitar em tudo. Estas\nmuletas estão proibidas do mesmo jeito:\n\n  \"pode\"            \"talvez\"         \"costuma\"\n  \"muitas pessoas relatam\"           \"depende de vários fatores\"\n  \"a literatura ainda diverge\"       \"cada corpo é diferente\"\n\nFrase hesitante não é mais honesta — é mais covarde, e some no feed. Isto\ntambém já saiu daqui, logo depois de eu proibir o mecanismo inventado:\n\n  \"A energia que você sente muda durante a sessão.\"\n  \"Músculo pode ficar mais vulnerável sem proteína antes.\"\n\nNão dizem nada. Trocar mentira afiada por verdade vaga é trocar um\nproblema por outro.\n\n### A VERSÃO CERTA\n\nAfirme o que é verdade, com a mesma confiança com que você afirmaria uma\nmentira. Quase sempre existe o par exato:\n\n  mentira afiada  \"em jejum o corpo queima músculo, não gordura\"\n  verdade vaga    \"o efeito no músculo pode variar entre pessoas\"\n  VERDADE AFIADA  \"em jejum você queima mais gordura NA HORA — e nada\n                   muda no fim do mês\"\n\nQuando a incerteza for mesmo o ponto, ela vira a frase inteira e com\nnome: \"ninguém mediu isso em quem treina 4 vezes por semana\" é\nespecífico. \"depende de vários fatores\" é fuga.\n\nProcure estas afirmações no roteiro que recebeu e TROQUE, listando cada\ntroca em `alegacoes_corrigidas`. Esta passagem vem ANTES da de retenção:\nnão adianta segurar a pessoa num vídeo errado.\n\n## O QUE VOCÊ DEVOLVE\n\n1. `diagnostico`: onde este roteiro perde a pessoa. Sem suavizar e sem elogio de cortesia. Se o gancho é fraco, diga que é fraco.\n2. `riscos`: quadro a quadro, a chance de abandono e o motivo CONCRETO. Não \"pouco envolvente\": o que exatamente faz o dedo subir ali.\n3. O roteiro reescrito, com as mesmas regras do original: 12 palavras por fala, sem promessa de resultado, sem alegação médica, sem número inventado, sem depoimento, sem suplemento por marca.\n4. `cortes`: um por quadro. Gancho curto (1.2 a 1.8s). Quadro de virada pede respiro (3.5s ou mais). Texto no `meio` no gancho, na virada e no fechamento; `alto` quando a imagem precisa aparecer.\n5. `aposta`: qual mecanismo está carregando este vídeo. Isso existe para você saber O QUE MEDIR quando ele for bem ou mal — sem isso o resultado não ensina nada para o próximo.\n\n## COMO VOCÊ ESCREVE\n\nSeco. Você é o editor que fala a verdade sobre o corte, não o coach que anima. Nenhuma fala sua pode caber em qualquer outro roteiro: se couber, está genérica, e genérico é o que não retém.";

  return { ROTEIRO, GATILHOS };
})();

/* ===== js/gatilhos.js ========================================== */
M.gatilhos = (function () {
/* ------------------------------------------------------------------
   OS GATILHOS — a verificação, em código.

   Tradução direta de motor/gatilhos.py: `problemas()`. Existe porque
   proibir em prosa não bastou — "costuma" voltou duas vezes num roteiro
   real, duas rodadas DEPOIS de a palavra ser proibida na instrução. O
   modelo obedece umas regras e esquece outras; o que a máquina pode
   cobrar, ela cobra.

   Mesma lista dos dois lados, de propósito: o site e o terminal têm de
   reprovar exatamente o mesmo roteiro, senão um vira a porta de saída
   para o que o outro recusa.
   ------------------------------------------------------------------ */

const MULETAS = [
  'costuma', 'costumam', 'talvez', 'geralmente', 'normalmente',
  'tende a', 'tendem a', 'muitas pessoas', 'algumas pessoas',
  'depende de vários', 'depende de muitos', 'cada corpo',
  'cada pessoa é', 'pode variar', 'podem variar',
];

/* "pode" sozinho é legítimo ("você pode registrar a carga"). Vira muleta
   quando enfraquece uma AFIRMAÇÃO — e são estas as combinações que
   aparecem de verdade. */
const MULETAS_COMPOSTAS = [
  'pode ajudar', 'pode melhorar', 'pode reduzir', 'pode aumentar',
  'pode ficar', 'pode cair', 'pode mudar', 'pode não',
];

const ESQUEMA = /\b\d+\s*[-+]\s*\d+\s*(?:[-+]\s*\d+)?\b/g;

const EXPLICA = ['dias seguidos', 'dias de treino', 'dias de',
                 'significa', 'ou seja', 'dias e'];

function problemas(roteiro) {
  const falas = [['gancho', roteiro.gancho || '']];
  (roteiro.quadros || []).forEach((q, i) =>
    falas.push([`quadro ${i + 1}`, q.fala || '']));
  falas.push(['fechamento', roteiro.fechamento || '']);

  const achados = [];
  for (const [onde, fala] of falas) {
    const baixo = fala.toLowerCase();
    const muleta = [...MULETAS, ...MULETAS_COMPOSTAS].find(m => baixo.includes(m));
    if (muleta) {
      achados.push(`${onde}: "${fala}" usa a muleta "${muleta}". Afirme ou `
        + 'corte — frase hesitante não é mais honesta, é mais fraca.');
    }
  }

  const tudo = falas.map(([, f]) => f).join(' ');
  const baixoTudo = tudo.toLowerCase();
  const explicado = EXPLICA.some(p => baixoTudo.includes(p));
  for (const achado of new Set(tudo.match(ESQUEMA) || [])) {
    if (!explicado) {
      achados.push(`o esquema "${achado}" aparece sem explicação. Em vídeo `
        + 'curto ninguém decifra sigla: escreva por extenso ("dois dias de '
        + 'treino, dois de descanso").');
    }
  }

  const aposta = (roteiro.aposta || '').trim();
  if (aposta && aposta.split(/\s+/).length < 5) {
    achados.push(`a aposta "${aposta}" é uma palavra solta. Escreva a frase `
      + 'inteira: qual mecanismo carrega o vídeo e por quê — é o que se mede '
      + 'quando ele for bem ou mal.');
  }
  return achados;
}

/* O aviso que volta para o modelo na segunda tentativa. Diz o quadro, a
   palavra e a saída: é isso que faz a segunda acertar em vez de repetir. */
function avisoDeCorrecao(achados) {
  return '\n\n## O QUE VOCÊ ACABOU DE ERRAR\n\n'
    + achados.map(a => `- ${a}`).join('\n')
    + '\n\nRefaça corrigindo exatamente isto, sem mexer no resto do que já '
    + 'estava bom.';
}

  return { MULETAS, MULETAS_COMPOSTAS, problemas, avisoDeCorrecao };
})();

/* ===== js/quadro.js ============================================ */
M.quadro = (function () {
/* ------------------------------------------------------------------
   O QUADRO — o tratamento dark e a legenda, em Canvas.

   É a tradução do motor/visual.py e motor/legenda.py para o navegador,
   com os MESMOS números, calibrados olhando três intensidades lado a
   lado: saturação 0.22, contraste 1.35, brilho 0.62, vinheta forte.

   O PROBLEMA QUE DECIDE O DESENHO: CANVAS CONTAMINADO

   Desenhar foto de outro domínio no canvas é permitido. LER os pixels de
   volta — que é o que `toBlob` faz, e é como a pessoa baixa o quadro —
   não é, a menos que o servidor da foto mande `Access-Control-Allow-
   Origin`. O canvas fica "contaminado" e o download falha.

   Por isso aqui:

     • a imagem é pedida com `crossOrigin = 'anonymous'` ANTES do `src`.
       A ordem importa de verdade: no Safari e em vários navegadores de
       celular, src antes de crossOrigin contamina do mesmo jeito.
     • o tratamento usa `ctx.filter`, que NÃO lê pixel. Funciona até em
       canvas contaminado, então a prévia sempre aparece.
     • o download é testado antes de ser oferecido. Se contaminou, a
       pessoa é avisada e tem a saída: usar foto do próprio celular, que
       é mesma origem e nunca contamina.
   ------------------------------------------------------------------ */

const LARGURA = 1080;
const ALTURA = 1920;

const TEMA = {
  fundo: '#000000',          // preto PURO: em OLED o pixel apaga e a
  texto: '#ffffff',          // imagem flutua; #111 vira retângulo visível
  destaque: '#dc2626',
  saturacao: 0.22,
  contraste: 1.35,
  brilho: 0.62,
  vinheta: 0.92,
  grao: 7,
};

/* A fonte. Impact existe em todo Windows; as outras entram se a pessoa
   tiver instalado. A lista vai da melhor para a que sempre existe. */
const FONTES =
  '"Anton", "Oswald", Impact, "Haettenschweiler", "Arial Black", sans-serif';

function carrega(url) {
  return new Promise((ok, erro) => {
    const img = new Image();
    // ANTES do src, sempre. Depois não adianta.
    img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = () => erro(new Error('não consegui carregar a imagem'));
    img.src = url;
  });
}

/* Corta 9:16 pelo centro-ALTO. Em foto de pessoa o rosto está no terço
   superior; cortar pelo centro geométrico decapita metade delas. */
function recorte(img) {
  const alvo = LARGURA / ALTURA;
  const { width: l, height: a } = img;
  if (l / a > alvo) {
    const nl = Math.round(a * alvo);
    return { sx: Math.round((l - nl) / 2), sy: 0, sl: nl, sa: a };
  }
  const na = Math.round(l / alvo);
  return { sx: 0, sy: Math.round((a - na) * 0.15), sl: l, sa: na };
}

function vinheta(ctx, forca) {
  if (!forca) return;
  const g = ctx.createRadialGradient(
    LARGURA / 2, ALTURA / 2, Math.min(LARGURA, ALTURA) * 0.25,
    LARGURA / 2, ALTURA / 2, Math.max(LARGURA, ALTURA) * 0.62);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${forca})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, LARGURA, ALTURA);
}

/* Grão: desenhado como ruído, não lido do canvas — ler contaminaria. */
function grao(ctx, forca) {
  if (!forca) return;
  const n = 5200;
  ctx.save();
  ctx.globalAlpha = 0.055;
  for (let i = 0; i < n; i++) {
    const v = Math.random() < 0.5 ? 0 : 255;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * LARGURA, Math.random() * ALTURA, 2, 2);
  }
  ctx.restore();
}

/* Quebra por palavra, medindo de verdade. */
function quebra(ctx, texto, larguraMax) {
  const linhas = [];
  let atual = '';
  for (const palavra of texto.split(/\s+/)) {
    const tenta = atual ? `${atual} ${palavra}` : palavra;
    if (ctx.measureText(tenta).width <= larguraMax || !atual) atual = tenta;
    else { linhas.push(atual); atual = palavra; }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/* Entrelinha apertada: legenda de vídeo curto é bloco, não parágrafo, e
   o espaço entre linhas é espaço em que o olho escapa. */
const ENTRELINHA = 1.02;
const MAX_LINHAS = 4;

/* Acha o maior corpo que cabe EM ATÉ 4 LINHAS. Caber na altura não
   basta: seis linhas de caixa alta cabem e afogam o quadro — o olho lê
   como texto, e texto se rola. */
function corpoQueCabe(ctx, texto, larguraMax, alturaMax) {
  for (let tam = 128; tam >= 38; tam -= 4) {
    ctx.font = `700 ${tam}px ${FONTES}`;
    const linhas = quebra(ctx, texto, larguraMax);
    if (linhas.length * Math.round(tam * ENTRELINHA) <= alturaMax
        && linhas.length <= MAX_LINHAS) {
      return { tam, linhas };
    }
  }
  ctx.font = `700 38px ${FONTES}`;
  return { tam: 38, linhas: quebra(ctx, texto, larguraMax) };
}

const MARCA = /\*([^*]+)\*/g;

function desenha(canvas, { imagem = null, texto = '', posicao = 'meio',
                                  tema = TEMA, caixaAlta = false } = {}) {
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = tema.fundo;
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  if (imagem) {
    const { sx, sy, sl, sa } = recorte(imagem);
    // `filter` não lê pixel: funciona mesmo em canvas contaminado, e é o
    // que garante que a prévia sempre aparece.
    ctx.filter = `saturate(${tema.saturacao}) contrast(${tema.contraste}) `
               + `brightness(${tema.brilho})`;
    ctx.drawImage(imagem, sx, sy, sl, sa, 0, 0, LARGURA, ALTURA);
    ctx.filter = 'none';
    vinheta(ctx, tema.vinheta);
    grao(ctx, tema.grao);
  }

  if (!texto.trim()) return canvas;

  const margem = Math.round(LARGURA * 0.12);
  const larguraMax = LARGURA - 2 * margem;
  let limpo = texto.replace(MARCA, '$1');
  if (caixaAlta) limpo = limpo.toUpperCase();
  const { tam, linhas } = corpoQueCabe(ctx, limpo, larguraMax, ALTURA * 0.42);
  const passo = Math.round(tam * ENTRELINHA);
  const alto = linhas.length * passo;

  // O centro ÓTICO fica acima do geométrico: o olho lê o quadro como se
  // o meio fosse uns 6% mais alto, e texto no centro exato parece caído.
  let y = posicao === 'alto' ? Math.round(ALTURA * 0.15)
        : posicao === 'baixo' ? Math.round(ALTURA * 0.62)
        : Math.round((ALTURA - alto) / 2 - ALTURA * 0.06);

  const marcadas = new Set();
  for (const m of texto.matchAll(MARCA)) {
    for (const p of m[1].split(/\s+/)) marcadas.add(limpa(p));
  }

  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(5, Math.round(tam / 9));
  ctx.strokeStyle = '#000';
  const folgaX = Math.max(8, Math.round(tam / 7));
  const folgaY = Math.max(4, Math.round(tam / 12));
  const raio = Math.max(6, Math.round(tam / 10));

  for (const linha of linhas) {
    let x = Math.round((LARGURA - ctx.measureText(linha).width) / 2);
    for (const palavra of linha.split(' ')) {
      const largura = ctx.measureText(palavra + ' ').width;
      if (marcadas.has(limpa(palavra))) {
        // BLOCO sólido atrás, não só cor. Texto colorido some sobre foto;
        // bloco não some sobre nada, e é o que o olho acha primeiro no
        // feed — a maior diferença entre legenda amadora e de perfil
        // grande, por quatro linhas de código.
        const l = ctx.measureText(palavra).width;
        bloco(ctx, x - folgaX, y - folgaY,
              l + folgaX * 2, tam + folgaY * 2, raio, tema.destaque);
        ctx.fillStyle = tema.texto;
        ctx.fillText(palavra, x, y);
        x += largura + folgaX;
        continue;
      }
      // Contorno grosso em vez de caixa: legível sobre qualquer foto, sem
      // tapar a imagem nem parecer template.
      ctx.strokeText(palavra, x, y);
      ctx.fillStyle = tema.texto;
      ctx.fillText(palavra, x, y);
      x += largura;
    }
    y += passo;
  }
  return canvas;
}

function bloco(ctx, x, y, l, a, r, cor) {
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, l, a, r)
                : ctx.rect(x, y, l, a);     // navegador antigo: canto reto
  ctx.fill();
}

function limpa(p) {
  return p.replace(/[.,!?:;]/g, '').toLowerCase();
}

/* Dá o PNG, ou null quando o canvas está contaminado. Quem chama
   decide o que dizer — a mensagem certa depende de onde veio a foto. */
function paraBlob(canvas) {
  return new Promise(ok => {
    try {
      canvas.toBlob(b => ok(b), 'image/png');
    } catch {
      ok(null);
    }
  });
}

  return { LARGURA, ALTURA, TEMA, FONTES, carrega, ENTRELINHA, MAX_LINHAS, desenha, paraBlob };
})();

/* ===== js/acervo.js ============================================ */
M.acervo = (function () {
/* ------------------------------------------------------------------
   O ACERVO — imagem com licença comercial, buscada do navegador.

   Pixabay e Unsplash. Sem Pexels: eles suspenderam a emissão de chaves
   novas em out/2026. Sem Pinterest: é mural de imagem de terceiro, e
   usar aquilo em vídeo monetizado é o que derruba conta depois que ela
   já está faturando.

   A FOTO DO CELULAR É A PRIMEIRA OPÇÃO, NÃO O PLANO B

   Foto que você tirou não tem pergunta de licença, não depende de cota,
   não contamina o canvas (arquivo local é mesma origem) — e é mais
   autêntica que banco de imagem, que é justamente o que o tratamento
   dark existe para disfarçar. O acervo entra quando você não tem a foto.
   ------------------------------------------------------------------ */

const PIXABAY = 'https://pixabay.com/api/';
const UNSPLASH = 'https://api.unsplash.com/search/photos';

const ONDE_PEGAR = {
  pixabay: {
    nome: 'Pixabay',
    url: 'https://pixabay.com/api/docs/',
    dica: 'a chave aparece na própria página quando você está logado',
  },
  unsplash: {
    nome: 'Unsplash',
    url: 'https://unsplash.com/developers',
    dica: 'New Application → copie a Access Key (não a Secret)',
  },
};

async function pede(url, cabecalhos = {}) {
  let r;
  try {
    r = await fetch(url, { headers: cabecalhos });
  } catch {
    // fetch que falha sem status é quase sempre o navegador barrando a
    // resposta, e a mensagem dele ("Failed to fetch") não explica nada.
    throw new Error('não consegui falar com o acervo daqui. Pode ser a sua '
      + 'internet, ou o provedor não liberar chamada direta de página. '
      + 'Nesse caso use a foto do celular, que sempre funciona.');
  }
  if (r.ok) return r.json();
  if (r.status === 401 || r.status === 403) {
    throw new Error('a chave foi recusada. Confira se copiou inteira.');
  }
  if (r.status === 429) throw new Error('passou da cota deste acervo agora.');
  throw new Error(`o acervo respondeu ${r.status}.`);
}

async function pixabay(termo, quantas, chave) {
  const q = new URLSearchParams({
    key: chave, q: termo, per_page: String(Math.max(3, quantas)),
    orientation: 'vertical',     // a palavra do Pixabay; no Unsplash é portrait
    image_type: 'photo', safesearch: 'true',
  });
  const d = await pede(`${PIXABAY}?${q}`);
  return (d.hits || []).map(f => ({
    id: String(f.id), url: f.largeImageURL,
    largura: f.imageWidth, altura: f.imageHeight,
    autor: f.user || '', fonte: 'pixabay', pagina: f.pageURL || '',
  }));
}

async function unsplash(termo, quantas, chave) {
  const q = new URLSearchParams({
    query: termo, per_page: String(quantas), orientation: 'portrait',
  });
  // "Client-ID" é o prefixo só do Unsplash; sem ele é 401 sem explicação.
  const d = await pede(`${UNSPLASH}?${q}`, { Authorization: `Client-ID ${chave}` });
  return (d.results || []).map(f => ({
    id: f.id, url: f.urls.regular, largura: f.width, altura: f.height,
    autor: f.user?.name || '', fonte: 'unsplash',
    pagina: f.links?.html || '',
  }));
}

const ACERVOS = { pixabay, unsplash };

function configurados(chaves) {
  return Object.keys(ACERVOS).filter(n => (chaves?.[n] || '').trim());
}

/* Busca nos acervos que tiverem chave, até juntar o pedido. Não para no
   primeiro que falha: cota estourada às onze da noite é rotina, e o
   ponto de ter dois é esse. */
async function busca(termo, quantas, chaves) {
  const quais = configurados(chaves);
  if (!quais.length) {
    throw new Error('nenhum acervo configurado — ponha uma chave em Ajustes, '
      + 'ou use a foto do celular.');
  }
  const achadas = [];
  const problemas = [];
  for (const nome of quais) {
    if (achadas.length >= quantas) break;
    try {
      achadas.push(...await ACERVOS[nome](
        termo, quantas - achadas.length, chaves[nome].trim()));
    } catch (e) {
      problemas.push(`${nome}: ${e.message}`);
    }
  }
  if (!achadas.length && problemas.length) throw new Error(problemas.join(' · '));
  return achadas.slice(0, quantas);
}

  return { ONDE_PEGAR, configurados, busca };
})();

/* ===== js/ia.js ================================================ */
M.ia = (function () {
/* ------------------------------------------------------------------
   O CÉREBRO — Groq, Gemini ou OpenRouter, do navegador.

   A chave fica no localStorage DESTE navegador. Não está no código do
   site: quem abrir o link não vê a sua chave.

   O roteirista e o agente de gatilhos são os MESMOS do terminal — as
   instruções foram copiadas inteiras de motor/roteiro.py e
   motor/gatilhos.py. Se divergirem, o site vira a porta de saída para o
   que o terminal recusa, e aí a verificação não vale nada.
   ------------------------------------------------------------------ */
  const { avisoDeCorrecao, problemas } = M.gatilhos;

const ENDERECOS = {
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
};
const MODELOS = {
  groq: 'openai/gpt-oss-120b',
  openrouter: '',
};
const GEMINI = 'https://generativelanguage.googleapis.com/v1beta';

function provedor(chaves) {
  if (chaves?.provedor) return chaves.provedor;
  if (chaves?.groq?.trim()) return 'groq';
  if (chaves?.gemini?.trim()) return 'gemini';
  if (chaves?.openrouter?.trim()) return 'openrouter';
  return 'groq';
}

function nomeDoProvedor(chaves) {
  return { groq: 'Groq', gemini: 'Gemini',
           openrouter: 'OpenRouter' }[provedor(chaves)] || 'Groq';
}

function temChave(chaves) {
  return Boolean((chaves?.[provedor(chaves)] || '').trim());
}

const ESQUEMA_ROTEIRO = {
  type: 'object',
  properties: {
    gancho: { type: 'string' },
    quadros: {
      type: 'array',
      items: {
        type: 'object',
        properties: { fala: { type: 'string' }, busca: { type: 'string' } },
        required: ['fala', 'busca'],
      },
    },
    fechamento: { type: 'string' },
    legenda_post: { type: 'string' },
    aposta: { type: 'string' },
    diagnostico: { type: 'string' },
  },
  required: ['gancho', 'quadros', 'fechamento', 'legenda_post'],
};

async function fala(instrucao, conteudo, chaves) {
  const p = provedor(chaves);
  const chave = (chaves[p] || '').trim();
  if (!chave) throw new Error(`falta a chave do ${nomeDoProvedor(chaves)}.`);

  if (p === 'gemini') return falaGemini(instrucao, conteudo, chave, chaves);

  const corpo = {
    model: (chaves.modelo || '').trim() || MODELOS[p] || 'openai/gpt-oss-120b',
    messages: [{ role: 'system', content: instrucao },
               { role: 'user', content: conteudo }],
    max_tokens: 6000,
    // json_object e não json_schema: a maioria dos modelos do Groq não
    // aceita esquema, e mandar esquema ali é 400 na cara. Quem cobra a
    // forma é a validação abaixo.
    response_format: { type: 'json_object' },
  };
  let r;
  try {
    r = await fetch(ENDERECOS[p], {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`,
                 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
  } catch {
    throw new Error(`não consegui falar com o ${nomeDoProvedor(chaves)} daqui `
      + 'do navegador. Pode ser a sua internet, ou o provedor não liberar '
      + 'chamada direta de página.');
  }
  if (!r.ok) {
    if (r.status === 401) throw new Error('a chave foi recusada.');
    if (r.status === 429) {
      throw new Error('passou do limite agora. No plano grátis do Groq são '
        + '30 pedidos por minuto.');
    }
    throw new Error(`o modelo respondeu ${r.status}.`);
  }
  const d = await r.json();
  return (d?.choices?.[0]?.message?.content || '').trim();
}

async function falaGemini(instrucao, conteudo, chave, chaves) {
  const modelo = (chaves.modelo || '').trim() || 'gemini-3.8-flash';
  const r = await fetch(
    `${GEMINI}/models/${modelo}:generateContent?key=${encodeURIComponent(chave)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instrucao }] },
        contents: [{ role: 'user', parts: [{ text: conteudo }] }],
        generationConfig: { responseMimeType: 'application/json',
                            maxOutputTokens: 6000 },
      }) });
  if (!r.ok) throw new Error(`o Gemini respondeu ${r.status}.`);
  const d = await r.json();
  return (d?.candidates?.[0]?.content?.parts || [])
    .map(p => p.text || '').join('').trim();
}

function leJson(bruto) {
  const limpo = bruto.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(limpo);
  } catch {
    // Às vezes vem prosa em volta do JSON. Pega do primeiro { ao último }.
    const i = limpo.indexOf('{');
    const f = limpo.lastIndexOf('}');
    if (i < 0 || f <= i) throw new Error('o modelo não devolveu JSON.');
    return JSON.parse(limpo.slice(i, f + 1));
  }
}

function valida(r) {
  if (!r || typeof r.gancho !== 'string' || !Array.isArray(r.quadros)) {
    throw new Error('o modelo devolveu JSON fora do formato.');
  }
  r.quadros = r.quadros
    .filter(q => q && typeof q.fala === 'string')
    .map(q => ({ fala: q.fala, busca: String(q.busca || 'dark gym') }));
  r.fechamento = String(r.fechamento || '');
  r.legenda_post = String(r.legenda_post || '');
  r.aposta = String(r.aposta || '');
  r.diagnostico = String(r.diagnostico || '');
  return r;
}

async function roteiro(tema, biotipo, chaves, instrucao) {
  let conteudo = `Tema do vídeo: ${tema}`;
  if (biotipo) {
    conteudo += `\n\nO público é quem se identifica como ${biotipo}. Use isso `
      + 'para falar a língua dele, mas NÃO baseie nenhuma recomendação no '
      + 'biotipo em si: somatotipo é classificação descritiva dos anos 1940 '
      + 'e não prediz resposta a treino ou dieta.';
  }
  conteudo += `\n\nDevolva SÓ um JSON com: ${JSON.stringify(ESQUEMA_ROTEIRO)}`;

  // Mesmo laço do terminal: se a verificação achar muleta, refaz UMA vez
  // com os achados escritos de volta. Se a segunda também vier suja,
  // entrega a primeira — roteiro imperfeito vale mais que roteiro nenhum.
  let aviso = '';
  let primeiro = null;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const r = valida(leJson(await fala(instrucao + aviso, conteudo, chaves)));
    const achados = problemas(r);
    if (!achados.length) return { roteiro: r, achados: [] };
    primeiro = primeiro || r;
    if (tentativa) return { roteiro: primeiro, achados: problemas(primeiro) };
    aviso = avisoDeCorrecao(achados);
  }
  return { roteiro: primeiro, achados: problemas(primeiro) };
}

  return { provedor, nomeDoProvedor, temChave, roteiro };
})();

/* ===== js/app.js =============================================== */
M.app = (function () {
/* ------------------------------------------------------------------
   O ESTÚDIO — a tela.

   Um fluxo só, de cima para baixo: tema → roteiro → quadros → baixar.
   Sem menu, sem abas: no celular, menu é mais um toque entre você e o
   vídeo, e este site existe para você postar todo dia.
   ------------------------------------------------------------------ */
  const Acervo = M.acervo;
  const IA = M.ia;
  const Quadro = M.quadro;
  const { GATILHOS, ROTEIRO } = M.instrucao;
  const { problemas } = M.gatilhos;

const CHAVE_GUARDADA = 'estudio-v1';

const E = {
  chaves: { groq: '', gemini: '', openrouter: '', modelo: '', provedor: '',
            pixabay: '', unsplash: '' },
  tema: '', biotipo: '', roteiro: null, achados: [],
  fundos: [],        // {url|File|null} por quadro
};

/* ── guardar ─────────────────────────────────────────────────────── */
function carrega() {
  try {
    const d = JSON.parse(localStorage.getItem(CHAVE_GUARDADA) || '{}');
    Object.assign(E.chaves, d.chaves || {});
    E.tema = d.tema || '';
    E.biotipo = d.biotipo || '';
  } catch { /* primeira vez, ou armazenamento bloqueado */ }
}
function salva() {
  try {
    localStorage.setItem(CHAVE_GUARDADA, JSON.stringify(
      { chaves: E.chaves, tema: E.tema, biotipo: E.biotipo }));
  } catch { /* janela anônima: funciona, só não lembra */ }
}

/* ── utilidades de tela ──────────────────────────────────────────── */
const $ = s => document.querySelector(s);
const escapa = t => String(t).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function recado(texto, tipo = 'ok') {
  const el = $('#recado');
  el.className = `recado ${tipo}`;
  el.textContent = texto;
  el.hidden = !texto;
}

function ocupado(ligado, texto = '') {
  $('#escrever').disabled = ligado;
  $('#escrever').textContent = ligado ? (texto || 'escrevendo…') : 'Escrever roteiro';
}

/* ── o roteiro ───────────────────────────────────────────────────── */
async function escrever() {
  E.tema = $('#tema').value.trim();
  E.biotipo = $('#biotipo').value;
  salva();
  if (!E.tema) return recado('escreva o tema do vídeo', 'ruim');
  if (!IA.temChave(E.chaves)) {
    return recado(`falta a chave do ${IA.nomeDoProvedor(E.chaves)} em Ajustes`,
                  'ruim');
  }
  ocupado(true);
  recado('');
  try {
    // A mesma instrução do terminal, e o mesmo laço de segunda chance.
    const r = await IA.roteiro(E.tema, E.biotipo, E.chaves,
                               `${ROTEIRO}\n\n${GATILHOS}`);
    E.roteiro = r.roteiro;
    E.achados = r.achados;
    E.fundos = new Array(falas().length).fill(null);
    desenhaRoteiro();
    recado(E.achados.length
      ? `roteiro pronto, mas ${E.achados.length} ponto(s) ainda torto(s)`
      : 'roteiro pronto', E.achados.length ? 'aviso' : 'ok');
  } catch (e) {
    recado(e.message, 'ruim');
  } finally {
    ocupado(false);
  }
}

function falas() {
  if (!E.roteiro) return [];
  return [E.roteiro.gancho, ...E.roteiro.quadros.map(q => q.fala),
          E.roteiro.fechamento];
}
function buscas() {
  if (!E.roteiro) return [];
  const qs = E.roteiro.quadros;
  const primeira = qs[0]?.busca || 'dark gym';
  return [primeira, ...qs.map(q => q.busca),
          qs[qs.length - 1]?.busca || primeira];
}

function desenhaRoteiro() {
  const alvo = $('#roteiro');
  if (!E.roteiro) { alvo.innerHTML = ''; return; }
  const r = E.roteiro;

  alvo.innerHTML = `
    ${r.diagnostico ? `<p class="diagnostico">${escapa(r.diagnostico)}</p>` : ''}
    ${E.achados.length ? `
      <div class="achados">
        <b>Ainda torto</b>
        <ul>${E.achados.map(a => `<li>${escapa(a)}</li>`).join('')}</ul>
        <p class="ajuda">A segunda tentativa não limpou. Edite a frase à mão
        abaixo — o quadro redesenha sozinho.</p>
      </div>` : ''}
    ${r.aposta ? `<p class="aposta"><b>Aposta</b> ${escapa(r.aposta)}</p>` : ''}
    <div class="quadros">
      ${falas().map((fala, i) => `
        <div class="quadro" data-i="${i}">
          <div class="tela"><canvas data-canvas="${i}"></canvas></div>
          <textarea data-fala="${i}" rows="3">${escapa(fala)}</textarea>
          <div class="linha-bt">
            <button class="bt fraco" data-buscar="${i}">buscar imagem</button>
            <label class="bt fraco">
              foto do celular
              <input type="file" accept="image/*" data-arquivo="${i}" hidden>
            </label>
            <button class="bt fraco" data-limpar="${i}">só preto</button>
          </div>
          <p class="busca">${escapa(buscas()[i] || '')}</p>
        </div>`).join('')}
    </div>
    <div class="linha-bt rodape">
      <button class="bt" data-fazer="baixar">Baixar os quadros</button>
      <button class="bt fraco" data-fazer="legenda">Copiar a legenda</button>
    </div>`;

  falas().forEach((_, i) => redesenha(i));
}

/* ── os quadros ──────────────────────────────────────────────────── */
async function redesenha(i) {
  const canvas = document.querySelector(`[data-canvas="${i}"]`);
  if (!canvas) return;
  const texto = document.querySelector(`[data-fala="${i}"]`)?.value ?? '';
  const total = falas().length;
  // Com imagem o texto sobe e deixa a foto respirar; sem imagem ele
  // centraliza, senão sobra 60% de preto e lê como erro de carregamento.
  const fundo = E.fundos[i];
  const posicao = (!fundo || i === 0 || i === total - 1) ? 'meio' : 'alto';
  // Gancho e fechamento em CAIXA ALTA: são os dois que precisam ser lidos
  // de relance — um para parar o dedo, o outro para dizer o que fazer.
  Quadro.desenha(canvas, { imagem: fundo, texto, posicao,
                           caixaAlta: i === 0 || i === total - 1 });
}

async function buscarImagem(i) {
  const termo = buscas()[i];
  recado(`procurando "${termo}"…`);
  try {
    const achadas = await Acervo.busca(termo, 1, E.chaves);
    if (!achadas.length) return recado('nada achado para esse termo', 'aviso');
    E.fundos[i] = await Quadro.carrega(achadas[0].url);
    E.fundos[i].dataset.credito =
      `${achadas[0].autor} · ${achadas[0].fonte}`;
    await redesenha(i);
    recado('');
  } catch (e) {
    recado(e.message, 'ruim');
  }
}

function fotoDoCelular(i, arquivo) {
  const url = URL.createObjectURL(arquivo);
  const img = new Image();
  img.onload = () => { E.fundos[i] = img; redesenha(i); URL.revokeObjectURL(url); };
  img.src = url;     // arquivo local: mesma origem, nunca contamina
}

/* ── baixar ──────────────────────────────────────────────────────── */
async function baixar() {
  const total = falas().length;
  let contaminados = 0;
  for (let i = 0; i < total; i++) {
    const canvas = document.querySelector(`[data-canvas="${i}"]`);
    const blob = await Quadro.paraBlob(canvas);
    if (!blob) { contaminados++; continue; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${String(i).padStart(2, '0')}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
    await new Promise(r => setTimeout(r, 120));   // o navegador engasga sem isto
  }
  if (contaminados) {
    recado(`${contaminados} quadro(s) não puderam ser baixados: o servidor `
      + 'da foto não libera leitura. Use a foto do celular nesses — ela '
      + 'sempre baixa.', 'aviso');
  } else {
    recado(`${total} quadros baixados. Monte no CapCut na ordem do nome.`);
  }
}

async function copiarLegenda() {
  const t = E.roteiro?.legenda_post || '';
  try {
    await navigator.clipboard.writeText(t);
    recado('legenda copiada');
  } catch {
    recado('não consegui copiar — selecione e copie: ' + t, 'aviso');
  }
}

/* ── ajustes ─────────────────────────────────────────────────────── */
function abreAjustes() {
  const d = $('#ajustes');
  d.querySelectorAll('input[name]').forEach(i => {
    i.value = E.chaves[i.name] || '';
  });
  d.querySelector('select[name=provedor]').value = E.chaves.provedor || '';
  d.showModal();
}

/* ── ligar ───────────────────────────────────────────────────────── */
function liga() {
  carrega();
  $('#tema').value = E.tema;
  $('#biotipo').value = E.biotipo;

  $('#escrever').addEventListener('click', escrever);
  $('#abrir-ajustes').addEventListener('click', abreAjustes);

  $('#ajustes').addEventListener('input', e => {
    const campo = e.target.name;
    if (campo) { E.chaves[campo] = e.target.value.trim(); salva(); }
  });
  $('#ajustes').addEventListener('change', e => {
    if (e.target.name === 'provedor') { E.chaves.provedor = e.target.value; salva(); }
  });

  // Um ouvinte só, delegado no documento: redesenhar a lista a cada
  // roteiro novo apagaria ouvintes presos nos quadros, e empilhar
  // ouvintes é o defeito que já custou cobrança dupla no outro painel.
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-buscar]');
    if (b) return buscarImagem(Number(b.dataset.buscar));
    const l = e.target.closest('[data-limpar]');
    if (l) { E.fundos[Number(l.dataset.limpar)] = null;
             return redesenha(Number(l.dataset.limpar)); }
    const f = e.target.closest('[data-fazer]');
    if (f?.dataset.fazer === 'baixar') return baixar();
    if (f?.dataset.fazer === 'legenda') return copiarLegenda();
  });
  document.addEventListener('input', e => {
    const t = e.target.closest('[data-fala]');
    if (t) redesenha(Number(t.dataset.fala));
  });
  document.addEventListener('change', e => {
    const a = e.target.closest('[data-arquivo]');
    if (a?.files?.[0]) fotoDoCelular(Number(a.dataset.arquivo), a.files[0]);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', liga);
} else {
  liga();
}



  return { E, escapa, falas, problemas };
})();
})();
