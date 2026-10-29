/**
 * O DIAGNÓSTICO DO WHATSAPP, EM UM LUGAR SÓ.
 *
 * Antes isto vivia dentro de `testes/whatsapp.mjs` — um programa de
 * terminal. Mas você não quer terminal, e tem razão: é o painel que
 * tem que responder "a ponte funciona?".
 *
 * Então a lógica mudou de casa. Quem chama é:
 *   · o painel, pelo botão "Conferir o WhatsApp";
 *   · `testes/whatsapp.mjs`, para quem preferir o terminal.
 *
 * Os dois rodam EXATAMENTE o mesmo código. Diagnóstico que difere do
 * que o programa faz de verdade é pior que nenhum.
 */
import { ONDE } from './navegador.mjs';

/** As formas de achar uma LINHA da lista de conversas. */
export const LINHAS_DA_LISTA = [
  '#pane-side [role="listitem"]',
  '#pane-side div[role="row"]',
  '#pane-side [data-testid="cell-frame-container"]',
  '#pane-side [role="gridcell"]',
  '#pane-side [role="grid"] > div',
  '#pane-side [role="listbox"] > div',
  '#pane-side span[title]',
  '#pane-side a[href^="/"]',
];

/**
 * Olha a tela e devolve um relatório em linhas de texto.
 *
 * Não envia nada, não clica em botão de enviar: só abre a primeira
 * conversa para conseguir ver a caixa de escrever.
 */
export async function diagnostica(pagina) {
  const fora = [];
  const diz = (texto = '') => fora.push(texto);
  let tudoOk = true;

  const conta = async (alvo) => pagina.locator(alvo).count().catch(() => 0);

  const confere = async (titulo, alvos) => {
    diz(titulo);
    let algum = false;
    for (const alvo of alvos) {
      const quantos = await conta(alvo);
      if (quantos) algum = true;
      diz(`   ${quantos ? '✓' : '·'}  ${String(quantos).padStart(3)}  ${alvo}`);
    }
    diz('');
    return algum;
  };

  const conectado = await confere('A lista de conversas (precisa estar conectado):',
    ONDE.pronto);
  if (!conectado) {
    diz('⚠ Não achei a lista de conversas. Ou não está conectado (leia o QR),');
    diz('  ou a tela do WhatsApp mudou. O print abaixo mostra o que havia.');
    diz('');
    return { linhas: fora, ok: false, conectado: false, melhorLinha: '' };
  }

  diz('Procurando as linhas da lista de conversas:');
  let melhorLinha = '';
  for (const alvo of LINHAS_DA_LISTA) {
    const quantas = await conta(alvo);
    diz(`   ${quantas ? '✓' : '·'}  ${String(quantas).padStart(3)}  ${alvo}`);
    if (quantas && !melhorLinha) melhorLinha = alvo;
  }
  diz('');

  if (!melhorLinha) {
    tudoOk = false;
    diz('Nenhuma bateu. O que existe dentro de #pane-side:');
    diz('');
    const retrato = await pagina.evaluate(() => {
      const lista = document.querySelector('#pane-side');
      if (!lista) return ['(não achei #pane-side)'];
      const linhas = [];
      const anda = (no, nivel) => {
        if (nivel > 6 || linhas.length > 40) return;
        for (const filho of no.children) {
          const partes = [
            '  '.repeat(nivel) + filho.tagName.toLowerCase(),
            filho.getAttribute('role') ? `role=${filho.getAttribute('role')}` : '',
            filho.dataset?.testid ? `testid=${filho.dataset.testid}` : '',
            filho.getAttribute('aria-label')
              ? `aria="${filho.getAttribute('aria-label').slice(0, 40)}"` : '',
            filho.dataset?.id ? `data-id="${filho.dataset.id.slice(0, 34)}"` : '',
            filho.className && typeof filho.className === 'string'
              ? `class="${filho.className.slice(0, 44)}"` : '',
            (filho.textContent || '').trim()
              ? `texto="${filho.textContent.trim().replace(/\s+/g, ' ').slice(0, 32)}"` : '',
          ].filter(Boolean);
          linhas.push(partes.join(' '));
          anda(filho, nivel + 1);
        }
      };
      anda(lista, 0);
      return linhas.slice(0, 40);
    }).catch((e) => [`(erro ao olhar: ${e.message})`]);
    for (const linha of retrato) diz(`   ${linha}`);
    diz('');

    const vazio = await conta('text=/nenhuma conversa|no chats|comece a conversar/i');
    if (vazio) {
      diz('⚠ A tela diz que a lista está VAZIA. Mande uma mensagem para');
      diz('  você mesmo pelo celular e confira de novo.');
      diz('');
    }
    return { linhas: fora, ok: false, conectado: true, melhorLinha: '' };
  }

  diz('Abrindo a primeira conversa para olhar a caixa de escrever…');
  diz('');
  const primeira = pagina.locator(melhorLinha).first();
  await primeira.click().catch(() => {});
  await pagina.waitForTimeout(2500);

  tudoOk = await confere('A caixa de escrever:', ONDE.caixa) && tudoOk;
  tudoOk = await confere('O botão de enviar:', ONDE.enviar) && tudoOk;

  const entrando = await conta('div.message-in');
  const saindo = await conta('div.message-out');
  diz(`Mensagens na conversa aberta: ${entrando} recebidas, ${saindo} enviadas`);
  diz(`   ${entrando + saindo > 0 ? '✓' : '⚠'} `
    + 'é por estas classes que a Matilha confere se a mensagem saiu');
  diz('');
  if (entrando + saindo === 0) tudoOk = false;

  const naoLidas = await conta(
    '#pane-side [aria-label*="não lida" i], #pane-side [aria-label*="unread" i]',
  );
  diz(`Conversas não lidas detectadas: ${naoLidas}`);
  diz('   (é assim que o fluxo descobre quem respondeu)');
  diz('');

  return { linhas: fora, ok: tudoOk, conectado: true, melhorLinha };
}
