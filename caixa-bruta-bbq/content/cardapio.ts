/**
 * O CARDÁPIO, num lugar só.
 *
 * Preços em centavos (12500 = R$ 125,00), para a soma nunca errar por
 * causa de vírgula. Cada item da caixa diz o que é (`tipo`, que decide
 * como ele aparece no desenho) e quanto vai: em gramas, em unidades,
 * ou sem quantidade quando o cardápio não informa.
 *
 * Para pôr a foto de um combo: salve a imagem em public/fotos/ e
 * preencha `foto` com o caminho, ex.: '/fotos/combo-da-casa.jpg'. Com
 * foto, o cartão mostra a foto; sem foto, mostra o desenho da caixa.
 */

export type Tipo =
  | 'alcatra' | 'contrafile' | 'coxinha' | 'linguica' | 'costela'
  | 'arroz' | 'farofa' | 'vinagrete' | 'pao' | 'molho';

export type ItemDaCaixa = {
  tipo: Tipo;
  /** Como aparece na lista, já escrito por extenso. */
  texto: string;
  gramas?: number;
  unidades?: number;
};

export type Combo = {
  id: string;
  nome: string;
  /** Uma linha que distingue o combo, só quando o cardápio diz algo. */
  nota?: string;
  preco: number;
  itens: ItemDaCaixa[];
  foto?: string;
};

export type Adicional = {
  id: string;
  nome: string;
  porcao: string;
  preco: number;
};

const arrozFarofaVinagrete: ItemDaCaixa[] = [
  { tipo: 'arroz', texto: 'Arroz' },
  { tipo: 'farofa', texto: 'Farofa' },
  { tipo: 'vinagrete', texto: 'Vinagrete' },
];

export const combos: Combo[] = [
  {
    id: 'combo-da-casa',
    nome: 'Combo da Casa',
    preco: 12500,
    itens: [
      { tipo: 'alcatra', texto: '300 g de alcatra', gramas: 300 },
      { tipo: 'coxinha', texto: '300 g de coxinha da asa', gramas: 300 },
      { tipo: 'linguica', texto: '200 g de linguiça toscana', gramas: 200 },
      { tipo: 'arroz', texto: '300 g de arroz', gramas: 300 },
      { tipo: 'farofa', texto: '200 g de farofa', gramas: 200 },
      { tipo: 'vinagrete', texto: '200 g de vinagrete', gramas: 200 },
      { tipo: 'pao', texto: '2 pães de alho', unidades: 2 },
    ],
  },
  {
    id: 'combo-alcatra',
    nome: 'Combo Alcatra',
    preco: 15000,
    itens: [
      { tipo: 'alcatra', texto: '400 g de alcatra', gramas: 400 },
      { tipo: 'coxinha', texto: '300 g de coxinha da asa', gramas: 300 },
      { tipo: 'linguica', texto: '4 linguiças toscanas', unidades: 4 },
      { tipo: 'arroz', texto: '300 g de arroz', gramas: 300 },
      { tipo: 'farofa', texto: '200 g de farofa', gramas: 200 },
      { tipo: 'vinagrete', texto: '200 g de vinagrete', gramas: 200 },
    ],
  },
  {
    id: 'combo-familia',
    nome: 'Combo Família',
    nota: 'Sem pão de alho',
    preco: 15990,
    itens: [
      { tipo: 'alcatra', texto: '500 g de alcatra', gramas: 500 },
      { tipo: 'coxinha', texto: '500 g de coxinha da asa', gramas: 500 },
      { tipo: 'linguica', texto: '4 linguiças toscanas', unidades: 4 },
      ...arrozFarofaVinagrete,
    ],
  },
  {
    id: 'combo-campeao-de-vendas',
    nome: 'Combo Campeão de Vendas',
    preco: 10999,
    itens: [
      { tipo: 'alcatra', texto: '300 g de alcatra', gramas: 300 },
      { tipo: 'coxinha', texto: '300 g de coxinha da asa', gramas: 300 },
      { tipo: 'linguica', texto: '3 linguiças toscanas', unidades: 3 },
      { tipo: 'pao', texto: '1 pão de alho', unidades: 1 },
      ...arrozFarofaVinagrete,
    ],
  },
  {
    id: 'rei-da-brasa',
    nome: 'Rei da Brasa',
    preco: 24990,
    itens: [
      { tipo: 'alcatra', texto: '1 kg de alcatra', gramas: 1000 },
      { tipo: 'coxinha', texto: '700 g de coxinha da asa', gramas: 700 },
      { tipo: 'linguica', texto: '6 linguiças toscanas', unidades: 6 },
      { tipo: 'pao', texto: '3 pães de alho', unidades: 3 },
      ...arrozFarofaVinagrete,
    ],
  },
  {
    id: 'imperador-bruto',
    nome: 'Imperador Bruto',
    nota: 'Premium da casa, acompanha molhos',
    preco: 17990,
    itens: [
      { tipo: 'contrafile', texto: '300 g de contrafilé', gramas: 300 },
      { tipo: 'alcatra', texto: '300 g de alcatra', gramas: 300 },
      { tipo: 'coxinha', texto: '300 g de coxinha da asa', gramas: 300 },
      { tipo: 'linguica', texto: '3 linguiças toscanas', unidades: 3 },
      { tipo: 'arroz', texto: '400 g de arroz', gramas: 400 },
      { tipo: 'farofa', texto: '200 g de farofa', gramas: 200 },
      { tipo: 'vinagrete', texto: '200 g de vinagrete', gramas: 200 },
      { tipo: 'pao', texto: '1 pão de alho', unidades: 1 },
      { tipo: 'molho', texto: 'Molhos' },
    ],
  },
  {
    id: 'combo-costela-suina-bbq',
    nome: 'Combo Costela Suína BBQ',
    preco: 12990,
    itens: [
      { tipo: 'costela', texto: '1 kg de costela suína com molho barbecue', gramas: 1000 },
      { tipo: 'arroz', texto: '300 g de arroz', gramas: 300 },
      { tipo: 'farofa', texto: '200 g de farofa', gramas: 200 },
      { tipo: 'vinagrete', texto: '200 g de vinagrete', gramas: 200 },
      { tipo: 'pao', texto: '1 pão de alho', unidades: 1 },
    ],
  },
  {
    id: 'carnivoro-bruto-bbq',
    nome: 'Carnívoro Bruto BBQ',
    preco: 14990,
    itens: [
      { tipo: 'alcatra', texto: '300 g de alcatra', gramas: 300 },
      { tipo: 'coxinha', texto: '300 g de coxinha da asa', gramas: 300 },
      { tipo: 'linguica', texto: '200 g de linguiça toscana', gramas: 200 },
      { tipo: 'costela', texto: '500 g de costela suína com barbecue', gramas: 500 },
      { tipo: 'pao', texto: '1 pão de alho', unidades: 1 },
    ],
  },
  {
    id: 'carnivoro-bruto-bbq-sem-pao',
    nome: 'Carnívoro Bruto BBQ sem pão de alho',
    nota: 'Sem pão de alho',
    preco: 13990,
    itens: [
      { tipo: 'alcatra', texto: '400 g de alcatra', gramas: 400 },
      { tipo: 'coxinha', texto: '300 g de coxinha da asa', gramas: 300 },
      { tipo: 'linguica', texto: '200 g de linguiça toscana', gramas: 200 },
      { tipo: 'costela', texto: '500 g de costela suína com barbecue', gramas: 500 },
    ],
  },
];

export const adicionais: Adicional[] = [
  { id: 'add-alcatra', nome: 'Alcatra', porcao: '200 g', preco: 3390 },
  { id: 'add-coxinha', nome: 'Coxinha da asa', porcao: '300 g', preco: 2490 },
  { id: 'add-linguica', nome: 'Linguiça toscana', porcao: '200 g', preco: 1690 },
  { id: 'add-costela', nome: 'Costela suína', porcao: '300 g', preco: 2490 },
  { id: 'add-farofa', nome: 'Farofa', porcao: '200 g', preco: 500 },
  { id: 'add-arroz', nome: 'Arroz', porcao: '300 g', preco: 700 },
  { id: 'add-vinagrete', nome: 'Vinagrete', porcao: '200 g', preco: 500 },
];

export type Produto = { id: string; nome: string; preco: number; detalhe: string };

/** Combos e adicionais numa lista só, para o carrinho achar pelo id. */
export const produtos: Record<string, Produto> = Object.fromEntries([
  ...combos.map((c) => [c.id, { id: c.id, nome: c.nome, preco: c.preco, detalhe: 'Combo' }]),
  ...adicionais.map((a) => [a.id, {
    id: a.id, nome: `${a.nome} (${a.porcao})`, preco: a.preco, detalhe: 'Adicional',
  }]),
]);
