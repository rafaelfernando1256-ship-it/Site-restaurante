import { describe, expect, test } from 'claude-code/testing'

const BARRA = { component: 'AbovePrompt' as const, props: {} }

/** O funil dublado: nenhum processo de verdade roda num teste. */
const funilDiz = (painel: unknown) => ({
  value: { exitCode: 0, stdout: JSON.stringify(painel), stderr: '' },
})

/** E quando não há funil para ler. */
const semFunil = () => ({ value: { exitCode: 1, stdout: '', stderr: 'sem python' } })

/** A base do desenho: sem ela nada responde ui.render debaixo do mod. */
const nada = ($: any, e: any) => {
  const { Box } = $.ui.resolve(e)
  return <Box />
}

const INSTALANDO = {
  pronto: false, leads: {}, total: 0, esperando_voce: 0,
  chaves: { places: true, cerebro: false, netlify: false, provedor: 'groq' },
  colonia: null,
}

const RODANDO = {
  pronto: true, leads: { novo: 12, rascunho: 3, abordado: 7 }, total: 22,
  esperando_voce: 3,
  chaves: { places: true, cerebro: true, netlify: true, provedor: 'groq' },
  colonia: { banco: 2500, vivos: 2, envelopes: 1000, toques: 61 },
}

describe('a barra do funil', () => {
  test('sem conseguir ler o funil, a barra não aparece', async ($, on) => {
    on('ui.render', nada)
    on('process.run', semFunil)

    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({ plugin: 'funil-band', surface, ...BARRA })
      // Ela é informação, não dependência: aparecer vazia seria ruído
      // permanente em toda sessão fora do repositório.
      expect(await ui.find({ type: 'Text' })).toBeUndefined()
      await ui.unmount()
    }
  })

  test('instalando, mostra quais chaves faltam', async ($, on) => {
    on('ui.render', nada)
    on('process.run', () => funilDiz(INSTALANDO))

    await $.command.run({ command: 'funil' })
    const ui = await $.ui.mount({ plugin: 'funil-band', surface: 'terminal', ...BARRA })
    const texto = (await ui.find({ type: 'Text', text: /places/ }))?.text ?? ''
    expect(texto).toContain('places ✓')
    expect(texto).toContain('groq ✗')
    await ui.unmount()
  })

  test('rodando, o que espera o seu clique vem primeiro e em negrito', async ($, on) => {
    on('ui.render', nada)
    on('process.run', () => funilDiz(RODANDO))

    await $.command.run({ command: 'funil' })
    const ui = await $.ui.mount({ plugin: 'funil-band', surface: 'terminal', ...BARRA })

    // Este é o número que trava o funil: nada sai sozinho para quem nunca
    // te procurou. Se ele se perder no meio do resto, a barra falhou.
    const aviso = await ui.find({ type: 'Text', text: /esperando o seu clique/ })
    expect(aviso?.text).toContain('3')
    // Em negrito, e não apagado: o resto da barra é dimColor de propósito,
    // e este número tem de romper esse cinza.
    expect(aviso?.props.bold).toBe(true)
    expect(aviso?.props.dimColor).toBeUndefined()
    await ui.unmount()
  })

  test('o caixa da colônia sai em reais, nunca em centavos crus', async ($, on) => {
    on('ui.render', nada)
    on('process.run', () => funilDiz(RODANDO))

    await $.command.run({ command: 'funil' })
    const ui = await $.ui.mount({ plugin: 'funil-band', surface: 'terminal', ...BARRA })
    const texto = (await ui.find({ type: 'Text', text: /colônia/ }))?.text ?? ''
    expect(texto).toContain('R$ 25,00')
    expect(texto).not.toContain('2500 ')
    await ui.unmount()
  })

  test('o botão ocultar cala a barra', async ($, on) => {
    on('ui.render', nada)
    on('process.run', () => funilDiz(RODANDO))

    await $.command.run({ command: 'funil' })
    const ui = await $.ui.mount({ plugin: 'funil-band', surface: 'terminal', ...BARRA })
    expect(await ui.find({ type: 'Text' })).toBeDefined()
    await ui.press({ key: 'esconder' })
    expect(await ui.find({ type: 'Text' })).toBeUndefined()
    await ui.unmount()
  })

  test('fora do repositório, o comando explica em vez de estourar', async ($, on) => {
    on('process.run', semFunil)
    const dito = await $.command.run({ command: 'funil' })
    expect(dito.text).toContain('repositório')
  })
})
