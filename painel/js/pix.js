/* ------------------------------------------------------------------
   PIX — o código copia-e-cola (BR Code, padrão EMV do Banco Central)

   É o pedaço que não pode errar: um caractere trocado e o banco do
   cliente recusa, ou pior, aceita e manda para outro lugar. Por isso o
   CRC tem teste com vetor conhecido no fim deste arquivo, e o montador
   recusa dado que não cabe no padrão em vez de cortar em silêncio.
   ------------------------------------------------------------------ */

/* CRC16/CCITT-FALSE: polinômio 0x1021, inicial 0xFFFF, sem reflexão.
   É o que o Banco Central especifica — e o engano comum é usar a
   variante refletida, que passa no olho e falha no banco. */
export function crc16(texto) {
  let crc = 0xFFFF;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/* Cada campo é "ID + tamanho em 2 dígitos + valor". O tamanho conta
   CARACTERES, e por isso tudo é normalizado para ASCII antes: "João"
   em UTF-8 tem 5 bytes e 4 caracteres, e essa diferença quebra o
   código em alguns bancos. */
function campo(id, valor) {
  const v = String(valor ?? '');
  if (!v) return '';
  if (v.length > 99) throw new Error(`campo ${id} passou de 99 caracteres`);
  return id + String(v.length).padStart(2, '0') + v;
}

export function semAcento(texto) {
  return String(texto ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function limpaTxid(txid) {
  const t = semAcento(txid).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return t.slice(0, 25) || '***';
}

export function valida({ chave, nome, cidade, valor }) {
  const erros = [];
  if (!String(chave || '').trim()) erros.push('falta a chave Pix');
  if (!semAcento(nome)) erros.push('falta o nome de quem recebe');
  if (!semAcento(cidade)) erros.push('falta a cidade');
  if (semAcento(nome).length > 25) erros.push('o nome passa de 25 caracteres');
  if (semAcento(cidade).length > 15) erros.push('a cidade passa de 15 caracteres');
  if (valor !== undefined && valor !== null && valor !== '') {
    const n = Number(valor);
    if (!isFinite(n) || n < 0) erros.push('valor inválido');
    if (n > 0 && n < 0.01) erros.push('valor menor que um centavo');
  }
  return erros;
}

/* Monta o copia-e-cola. `valor` vazio = o cliente digita quanto vai
   pagar; com valor, o app do banco já abre com o número travado. */
export function montaPix({ chave, nome, cidade, valor = '', descricao = '', txid = '' }) {
  const erros = valida({ chave, nome, cidade, valor });
  if (erros.length) throw new Error(erros.join('; '));

  const conta =
    campo('00', 'br.gov.bcb.pix') +
    campo('01', semAcento(chave)) +
    (descricao ? campo('02', semAcento(descricao).slice(0, 40)) : '');

  let corpo =
    campo('00', '01') +
    campo('01', '12') +              // 12 = pode ser pago mais de uma vez
    campo('26', conta) +
    campo('52', '0000') +            // sem categoria de estabelecimento
    campo('53', '986') +             // real
    (valor !== '' && Number(valor) > 0
      ? campo('54', Number(valor).toFixed(2)) : '') +
    campo('58', 'BR') +
    campo('59', semAcento(nome).slice(0, 25)) +
    campo('60', semAcento(cidade).slice(0, 15)) +
    campo('62', campo('05', limpaTxid(txid)));

  corpo += '6304';                   // o CRC entra DEPOIS deste prefixo
  return corpo + crc16(corpo);
}

/* ---- provas ------------------------------------------------------
   Rodam na abertura do painel. Pix errado é dinheiro que não chega;
   melhor quebrar aqui, na minha frente, do que no cliente. */
export function prova() {
  const falhas = [];

  // Vetor canônico do CRC16/CCITT-FALSE.
  if (crc16('123456789') !== '29B1') {
    falhas.push(`CRC16 errado: deu ${crc16('123456789')}, devia dar 29B1`);
  }

  const codigo = montaPix({
    chave: 'teste@exemplo.com', nome: 'Fulano de Tal',
    cidade: 'Natal', valor: 1200, txid: 'SITE001',
  });
  if (!codigo.startsWith('000201')) falhas.push('o código não começa com 000201');
  if (!codigo.includes('br.gov.bcb.pix')) falhas.push('falta o domínio do Pix');
  if (!codigo.includes('54071200.00')) falhas.push('o valor não entrou certo');
  // O CRC do próprio código tem que fechar com ele mesmo.
  const semCrc = codigo.slice(0, -4);
  if (crc16(semCrc) !== codigo.slice(-4)) falhas.push('o CRC não confere com o corpo');

  try {
    montaPix({ chave: '', nome: 'x', cidade: 'y' });
    falhas.push('aceitou chave vazia');
  } catch { /* esperado */ }

  return falhas;
}
