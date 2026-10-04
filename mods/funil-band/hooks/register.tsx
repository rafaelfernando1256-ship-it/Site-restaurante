/*
 * A BARRA DO FUNIL — o estado do negócio acima do prompt.
 *
 * Mostra duas coisas diferentes conforme a fase:
 *
 *   • ANTES do primeiro lead, quais chaves já estão configuradas. É a
 *     pergunta que se faz dez vezes durante a instalação, e ter a
 *     resposta à vista poupa dez `conferir`.
 *   • DEPOIS, os leads por etapa e — em destaque — quantas mensagens
 *     esperam o SEU clique. Esse número é o único que trava o funil:
 *     nada sai sozinho para quem nunca te procurou, por projeto.
 *
 * Por que lê por processo e não do SQLite direto: o módulo roda sem Node
 * e sem driver de banco. `funil.py resumo --json` é um contrato de
 * saída; adivinhar o texto bonito do `resumo` seria combinar dois
 * formatos que ninguém prometeu manter iguais.
 *
 * Quando atualiza: na abertura da sessão, e depois de QUALQUER comando
 * do funil — que é exatamente quando o estado muda. Sem relógio, sem
 * pesquisa de fundo: um processo por mudança real.
 */
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Painel } from '../types'

const painel = atom({ plugin: 'funil-band', key: 'painel' } as const, null)
const escondido = atom({ plugin: 'funil-band', key: 'escondido' } as const, false)

/** Centavos inteiros → "R$ 25,00". Dinheiro nunca passa por float. */
const dinheiro = (centavos: number): string => {
  const c = Math.abs(Math.trunc(centavos))
  return `${centavos < 0 ? '-' : ''}R$ ${Math.floor(c / 100)},${String(c % 100).padStart(2, '0')}`
}

/** Pergunta ao funil como ele está. Devolve null quando não dá para saber. */
const olha = async ($: EngineInterface): Promise<Painel | null> => {
  try {
    const { exitCode, stdout } = await $.process.run(
      ['python3', 'funil.py', 'resumo', '--json'],
      { cwd: 'funil', timeoutMs: 15000 },
    )
    if (exitCode !== 0) return null
    return JSON.parse(stdout.trim()) as Painel
  } catch {
    // Sem Python, fora do repositório, ou o funil nem instalado: a barra
    // simplesmente não aparece. Ela é informação, não dependência.
    return null
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'funil',
      description: 'Atualiza a barra com o estado do funil agora',
    })
    void (async () => {
      const agora = await olha($)
      if (agora) await update($, painel, () => agora)
    })()

    return next(e)
  })

  on('command.run', { command: 'funil' }, async $ => {
    const agora = await olha($)
    if (!agora) {
      return { text: 'não consegui ler o funil daqui — rode dentro do repositório.' }
    }
    await update($, painel, () => agora)
    await update($, escondido, () => false)

    if (!agora.pronto) {
      const falta = [
        agora.chaves.places ? null : 'GOOGLE_PLACES_KEY',
        agora.chaves.cerebro ? null : `a chave do ${agora.chaves.provedor}`,
      ].filter(Boolean)
      return {
        text: falta.length
          ? `Funil ainda não rodou. Falta: ${falta.join(', ')}.`
          : 'Chaves prontas, banco ainda vazio. Comece com: funil.py cacar',
      }
    }
    const etapas = Object.entries(agora.leads)
      .map(([etapa, n]) => `${etapa} ${n}`)
      .join(' · ')
    return {
      text: `${agora.total} leads — ${etapas}\n`
        + `${agora.esperando_voce} mensagem(ns) esperando o seu clique.`,
    }
  })

  // Depois de qualquer comando do funil o estado mudou: vale reler.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    if (/funil\.py/.test(e.command)) {
      const agora = await olha($)
      if (agora) await update($, painel, () => agora)
    }

    return ran
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const agora = await read($, painel)
    if (e.props.hasSurvey || agora === null || (await read($, escondido))) {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)
    const esconder = (
      <Button
        key="esconder"
        label="ocultar"
        onPress={() => update($, escondido, () => true)}
      />
    )

    // Fase 1: ainda instalando. Mostra o que falta, não o que já foi.
    if (!agora.pronto) {
      const marca = (ok: boolean) => (ok ? '✓' : '✗')
      return (
        <Box>
          <Text dimColor>
            funil · places {marca(agora.chaves.places)} · {agora.chaves.provedor}{' '}
            {marca(agora.chaves.cerebro)} · netlify {marca(agora.chaves.netlify)} ·
            sem leads ainda{' '}
          </Text>
          {esconder}
        </Box>
      )
    }

    // Fase 2: rodando. O número que importa vem primeiro e sem cor
    // apagada — é o que trava o funil se você não olhar.
    const c = agora.colonia
    return (
      <Box>
        {agora.esperando_voce > 0 ? (
          <Text bold>
            {agora.esperando_voce} esperando o seu clique{' '}
          </Text>
        ) : (
          <Text dimColor>nada esperando você </Text>
        )}
        <Text dimColor>
          · {agora.total} leads
          {c ? ` · colônia ${c.vivos} vivos, ${dinheiro(c.banco)}, ${c.toques} toques` : ''}{' '}
        </Text>
        {esconder}
      </Box>
    )
  })
}
