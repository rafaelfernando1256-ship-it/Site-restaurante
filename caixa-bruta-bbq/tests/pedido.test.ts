import { describe, expect, it } from 'vitest';

import { adicionais, combos } from '@/content/cardapio';
import {
  limpaCarrinho, linkDoWhatsapp, mensagemDoPedido, reais, subtotal, taxaDeEntrega, totalEstimado,
  type Dados,
} from '@/lib/pedido';

const precoDe = (id: string) => [...combos, ...adicionais].find((p) => p.id === id)!.preco;

describe('o cardápio confere com o folheto', () => {
  const esperado: Record<string, number> = {
    'combo-da-casa': 12500,
    'combo-alcatra': 15000,
    'combo-familia': 15990,
    'combo-campeao-de-vendas': 10999,
    'rei-da-brasa': 24990,
    'imperador-bruto': 17990,
    'combo-costela-suina-bbq': 12990,
    'carnivoro-bruto-bbq': 14990,
    'carnivoro-bruto-bbq-sem-pao': 13990,
    'add-alcatra': 3390,
    'add-coxinha': 2490,
    'add-linguica': 1690,
    'add-costela': 2490,
    'add-farofa': 500,
    'add-arroz': 700,
    'add-vinagrete': 500,
  };
  it.each(Object.entries(esperado))('%s custa %i centavos', (id, preco) => {
    expect(precoDe(id)).toBe(preco);
  });
  it('são nove combos e sete adicionais', () => {
    expect(combos).toHaveLength(9);
    expect(adicionais).toHaveLength(7);
  });
});

describe('o carrinho', () => {
  it('soma em centavos sem erro de arredondamento', () => {
    expect(subtotal([{ id: 'combo-campeao-de-vendas', quantidade: 3 }, { id: 'add-farofa', quantidade: 1 }]))
      .toBe(10999 * 3 + 500);
    expect(reais(10999 * 3 + 500)).toBe('R$ 334,97');
  });

  it('descarta o que não existe e quantidades absurdas', () => {
    expect(limpaCarrinho([
      { id: 'combo-da-casa', quantidade: 2 },
      { id: 'cerveja', quantidade: 1 },
      { id: 'add-arroz', quantidade: 0 },
      { id: 'rei-da-brasa', quantidade: 99 },
      { id: 'combo-da-casa', quantidade: 5 },
    ])).toEqual([{ id: 'combo-da-casa', quantidade: 2 }, { id: 'rei-da-brasa', quantidade: 20 }]);
    expect(limpaCarrinho('lixo')).toEqual([]);
  });
});

describe('a taxa de entrega', () => {
  const linhas = [{ id: 'combo-da-casa', quantidade: 1 }];
  it('Sarandi é grátis', () => {
    expect(taxaDeEntrega('sarandi').valor).toBe(0);
    expect(totalEstimado(linhas, 'sarandi')).toBe('R$ 125,00');
  });
  it('Maringá fica a confirmar, sem prometer grátis', () => {
    expect(taxaDeEntrega('maringa').valor).toBeNull();
    expect(totalEstimado(linhas, 'maringa')).toBe('R$ 125,00 (ou R$ 140,00 se passar de 10 km)');
  });
  it('demais regiões pagam R$ 15,00', () => {
    expect(totalEstimado(linhas, 'outra')).toBe('R$ 140,00');
  });
});

describe('a mensagem do WhatsApp', () => {
  const dados: Dados = {
    nome: 'Ana Souza', whatsapp: '(44) 99999-0000', endereco: 'Rua das Flores, 120',
    bairro: 'Centro', regiao: 'outra', cidade: 'Paiçandu', referencia: 'Portão verde',
    data: '2026-10-23', hora: '20:30', observacoes: '', pagamento: 'dinheiro', troco: 'R$ 200',
  };
  const linhas = [{ id: 'rei-da-brasa', quantidade: 1 }, { id: 'add-vinagrete', quantidade: 2 }];
  const texto = mensagemDoPedido(linhas, dados);

  it('traz tudo o que o atendimento precisa', () => {
    expect(texto).toContain('Olá, CAIXA BRUTA BBQ! Gostaria de solicitar uma encomenda.');
    expect(texto).toContain('• 1x Rei da Brasa — R$ 249,90');
    expect(texto).toContain('• 2x Vinagrete (200 g) — R$ 10,00');
    expect(texto).toContain('Subtotal: R$ 259,90');
    expect(texto).toContain('Entrega: R$ 15,00');
    expect(texto).toContain('Total estimado: R$ 274,90');
    expect(texto).toContain('DATA SOLICITADA: sexta-feira, 23 de outubro');
    expect(texto).toContain('HORÁRIO SOLICITADO: 20h30');
    expect(texto).toContain('ENDEREÇO: Rua das Flores, 120, Centro, Paiçandu');
    expect(texto).toContain('FORMA DE PAGAMENTO: Dinheiro (troco para R$ 200)');
    expect(texto).toContain('OBSERVAÇÕES: Nenhuma');
    expect(texto).toContain('pelo menos 8 horas de antecedência');
    expect(texto).toContain('Aguardo confirmação da disponibilidade e do pedido.');
  });

  it('o Pix não inventa chave', () => {
    expect(mensagemDoPedido(linhas, { ...dados, pagamento: 'pix' }))
      .toContain('FORMA DE PAGAMENTO: Pix (aguardo os dados para pagamento)');
  });

  it('o link vai para o número oficial e volta ao texto original', () => {
    const link = linkDoWhatsapp(texto);
    expect(link.startsWith('https://wa.me/5544998780479?text=')).toBe(true);
    expect(decodeURIComponent(link.split('?text=')[1])).toBe(texto);
  });
});
