/**
 * AS CHAVES, SEM ABRIR ARQUIVO.
 *
 * Antes você tinha que achar o .env, abrir no Notepad e colar as chaves
 * no lugar certo sem estragar o resto. Agora o painel escreve o arquivo
 * por você.
 *
 * Duas regras que o código cumpre, não só promete:
 *
 * 1. O painel nunca recebe o valor de uma chave de volta. O GET responde
 *    só "essa aí está preenchida" — assim uma aba esquecida aberta, ou
 *    um print de tela, não entrega a sua chave do Netlify.
 *
 * PAINEL_SENHA de propósito NÃO está na lista: gravá-la pelo painel
 * passaria a valer na hora, e o próximo clique seu levaria 401 — você
 * trancaria a si mesmo do lado de fora. Essa uma continua sendo no
 * arquivo, à mão, por quem sabe o que está fazendo.
 *
 * 2. Só estas chaves podem ser escritas. Sem isso, um POST qualquer
 *    poderia enfiar PATH ou NODE_OPTIONS no .env, e o .env é lido pelo
 *    servidor — ou seja, viraria execução de código.
 */
import { readFile, rename, writeFile } from 'node:fs/promises';

export const PERMITIDAS = {
  GROQ_API_KEY: {
    nome: 'Groq',
    descricao: 'Quem escreve as mensagens e o texto dos sites. Grátis em console.groq.com/keys',
  },
  NETLIFY_TOKEN: {
    nome: 'Netlify',
    descricao: 'Quem publica os sites. app.netlify.com → User settings → Applications → Personal access tokens',
  },
  GOOGLE_PLACES_KEY: {
    nome: 'Google Places',
    descricao: 'Opcional. O caçador pelo navegador não usa esta chave — só a busca por API usa',
  },
  ELEVENLABS_API_KEY: {
    nome: 'ElevenLabs',
    descricao: 'Opcional. As vozes mais naturais para o Jarvis (o plano grátis dá uns 10 minutos de fala por mês). elevenlabs.io → Developers → API Keys',
  },
  GROQ_MODELO: {
    nome: 'Modelo do Groq',
    descricao: 'Opcional. Em branco, ele usa o padrão (openai/gpt-oss-120b)',
  },
};

/** Só o que não quebra o formato CHAVE=valor de uma linha. */
const limpa = (valor) => String(valor ?? '').replace(/[\r\n]/g, '').trim();

export async function leChaves(caminho) {
  let texto = '';
  try { texto = await readFile(caminho, 'utf8'); } catch { /* sem .env ainda */ }
  const saida = {};
  for (const chave of Object.keys(PERMITIDAS)) {
    const achou = texto.match(new RegExp(`^${chave}=(.*)$`, 'm'));
    const doAmbiente = (process.env[chave] || '').trim();
    const noArquivo = achou ? achou[1].trim().replace(/^["']|["']$/g, '') : '';
    saida[chave] = {
      nome: PERMITIDAS[chave].nome,
      descricao: PERMITIDAS[chave].descricao,
      preenchida: Boolean(noArquivo || doAmbiente),
      // Dá para reconhecer a chave sem revelá-la: o fim dela basta para
      // você saber se é a certa.
      fim: noArquivo ? noArquivo.slice(-4) : '',
    };
  }
  return saida;
}

/**
 * Grava mexendo só nas linhas das chaves enviadas. Os comentários do
 * .env.exemplo, e qualquer coisa que você tenha posto à mão, ficam.
 * Escreve em arquivo temporário e renomeia: se faltar luz no meio, você
 * fica com o .env antigo inteiro, não com meio arquivo.
 */
export async function gravaChaves(caminho, novas) {
  const recusadas = Object.keys(novas).filter((c) => !(c in PERMITIDAS));
  if (recusadas.length) {
    return { erro: `Não escrevo estas chaves: ${recusadas.join(', ')}.` };
  }

  let texto = '';
  try { texto = await readFile(caminho, 'utf8'); } catch { /* vai nascer agora */ }
  if (texto && !texto.endsWith('\n')) texto += '\n';

  const mexidas = [];
  for (const [chave, bruto] of Object.entries(novas)) {
    const valor = limpa(bruto);
    // Campo em branco no painel quer dizer "não mexe nessa" — assim
    // você salva uma chave sem reescrever as outras às cegas.
    if (!valor) continue;
    const linha = `${chave}=${valor}`;
    const existente = new RegExp(`^${chave}=.*$`, 'm');
    texto = existente.test(texto) ? texto.replace(existente, linha) : `${texto}${linha}\n`;
    process.env[chave] = valor; // vale já, sem reiniciar o painel
    mexidas.push(chave);
  }

  if (mexidas.length) {
    const temporario = `${caminho}.escrevendo`;
    await writeFile(temporario, texto, { encoding: 'utf8', mode: 0o600 });
    await rename(temporario, caminho);
  }
  return { gravadas: mexidas };
}
