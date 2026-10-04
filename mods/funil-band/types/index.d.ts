export type Chaves = {
  places: boolean
  cerebro: boolean
  netlify: boolean
  provedor: string
}

export type Colonia = {
  banco: number
  vivos: number
  envelopes: number
  toques: number
}

export type Painel = {
  pronto: boolean
  leads: Record<string, number>
  total: number
  esperando_voce: number
  chaves: Chaves
  colonia: Colonia | null
  erro?: string
}

declare module 'claude-code' {
  interface PluginState {
    'funil-band': { painel: Painel | null; escondido: boolean }
  }
}
