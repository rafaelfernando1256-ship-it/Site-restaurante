/**
 * A CAIXA, vista de cima.
 *
 * Cada combo é desenhado como a marmita aberta, e o tamanho de cada
 * divisória segue o que o cardápio informa: 1 kg de alcatra ocupa mais
 * caixa do que 300 g. Linguiças e pães de alho, que o cardápio conta em
 * unidades, aparecem na quantidade certa. Acompanhamento sem peso
 * informado ganha um espaço padrão.
 *
 * O desenho é determinístico (sementes fixas por combo): o servidor e
 * o navegador desenham a mesma coisa, sem piscar na hidratação.
 */
import type { Combo, ItemDaCaixa, Tipo } from '@/content/cardapio';

const CARNES: Tipo[] = ['contrafile', 'alcatra', 'costela', 'coxinha', 'linguica'];
const LADOS: Tipo[] = ['arroz', 'farofa', 'vinagrete'];

/** Peso usado só para dividir o espaço quando o cardápio conta em unidades. */
const PESO_DA_UNIDADE: Partial<Record<Tipo, number>> = { linguica: 80, pao: 45 };
const PESO_SEM_INFORMACAO: Partial<Record<Tipo, number>> = { arroz: 300, farofa: 200, vinagrete: 200 };

const W = 640;
const H = 420;
const ABA = 16;   // espessura da borda da caixa
const PAREDE = 7; // divisória entre compartimentos

/* ── sorteio com semente ───────────────────────────────────────── */
export function semente(texto: string) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i += 1) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6d2b79f5;
    let x = h;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
const r1 = (n: number) => Math.round(n * 10) / 10;

type Cel = { x: number; y: number; w: number; h: number };

/* ── os pintores: cada comida no seu jeito ─────────────────────── */

function fatias(c: Cel, rnd: () => number, gordura: boolean) {
  // Fatias grelhadas deitadas em fileiras, uma por cima da outra, como
  // ficam no tabuleiro: borda tostada, miolo rosado, marca da grelha.
  const out: React.ReactNode[] = [];
  const fileiras = Math.max(1, Math.round(c.h / 92));
  const alturaFila = c.h / fileiras;
  for (let f = 0; f < fileiras; f += 1) {
    const y0 = c.y + f * alturaFila;
    let x = c.x - 14 + rnd() * 10 + (f % 2) * 12;
    let i = 0;
    while (x < c.x + c.w + 4) {
      const w = 34 + rnd() * 12;
      const h = alturaFila - 6 - rnd() * 10;
      const ang = -14 + rnd() * 28;
      const cx = x + w / 2;
      const cy = y0 + alturaFila / 2 + rnd() * 6 - 3;
      const miolo = rnd() > 0.5 ? '#a24a34' : '#93402c';
      out.push(
        <g key={`${f}-${i}`} transform={`rotate(${r1(ang)} ${r1(cx)} ${r1(cy)})`}>
          <rect x={r1(cx - w / 2)} y={r1(cy - h / 2)} width={r1(w)} height={r1(h)} rx={r1(w / 2.4)} fill="#2e0f08" />
          <rect x={r1(cx - w / 2 + 3)} y={r1(cy - h / 2 + 3)} width={r1(w - 6)} height={r1(h - 6)} rx={r1(w / 2.8)} fill="#5e2314" />
          <rect x={r1(cx - w / 2 + 7)} y={r1(cy - h / 2 + 9)} width={r1(w - 14)} height={r1(h - 18)} rx={r1(w / 3.5)} fill={miolo} />
          <rect x={r1(cx - w / 2 + 11)} y={r1(cy - h / 2 + 18)} width={r1(w - 22)} height={r1(h * 0.3)} rx="4" fill="#c46a50" opacity="0.45" />
          {gordura && <rect x={r1(cx - w / 2 + 4)} y={r1(cy - h / 2 + 1)} width={r1(w - 8)} height="8" rx="4" fill="#e6d3ad" />}
          {[0.34, 0.64].map((k) => (
            <rect key={k} x={r1(cx - w / 2 + 3)} y={r1(cy - h / 2 + h * k)} width={r1(w - 6)} height="3.4" rx="1.7"
              fill="#1f0905" opacity="0.8" transform={`rotate(-30 ${r1(cx)} ${r1(cy - h / 2 + h * k)})`} />
          ))}
        </g>,
      );
      x += w * (0.62 + rnd() * 0.12);
      i += 1;
    }
  }
  return out;
}

function coxinhas(c: Cel, rnd: () => number) {
  const out: React.ReactNode[] = [];
  const passoX = 40;
  const passoY = 30;
  let i = 0;
  for (let y = c.y + 14; y < c.y + c.h + 6; y += passoY) {
    const desloca = (Math.round((y - c.y) / passoY) % 2) * (passoX / 2);
    for (let x = c.x + 12 + desloca - passoX / 2; x < c.x + c.w + 12; x += passoX) {
      const ang = rnd() * 360;
      const px = x + rnd() * 8 - 4;
      const py = y + rnd() * 6 - 3;
      out.push(
        <g key={i} transform={`translate(${r1(px)} ${r1(py)}) rotate(${r1(ang)})`}>
          <rect x="10" y="-3.5" width="12" height="7" rx="3.5" fill="#efe3c9" />
          <ellipse cx="0" cy="0" rx="17" ry="12.5" fill="#6e2a10" />
          <ellipse cx="-1.5" cy="-1" rx="14" ry="10" fill="#a4501d" />
          <ellipse cx="-4" cy="-3.5" rx="7" ry="4.5" fill="#c97a35" opacity="0.8" />
          <rect x="-12" y="2" width="16" height="2.4" rx="1.2" fill="#3d1508" opacity="0.7" transform="rotate(-18)" />
        </g>,
      );
      i += 1;
    }
  }
  return out;
}

function linguicas(c: Cel, rnd: () => number, quantas: number) {
  const out: React.ReactNode[] = [];
  const vertical = c.h > c.w * 1.15;
  const largo = vertical ? c.w : c.h;
  const longo = vertical ? c.h : c.w;
  const grossura = 24;
  const porLinha = Math.max(1, Math.min(quantas, Math.floor((largo - 6) / (grossura + 7))));
  const linhas = Math.ceil(quantas / porLinha);
  const comp = Math.min(170, longo / linhas - 14);
  for (let i = 0; i < quantas; i += 1) {
    const lin = Math.floor(i / porLinha);
    const nestaLinha = Math.min(porLinha, quantas - lin * porLinha);
    const col = i % porLinha;
    const sobra = largo - nestaLinha * (grossura + 7);
    const transversal = sobra / 2 + col * (grossura + 7) + (grossura + 7) / 2;
    const ao = (longo / linhas) * (lin + 0.5);
    const cx = c.x + (vertical ? transversal : ao);
    const cy = c.y + (vertical ? ao : transversal);
    const ang = (vertical ? 90 : 0) + rnd() * 6 - 3;
    out.push(
      <g key={i} transform={`translate(${r1(cx)} ${r1(cy)}) rotate(${r1(ang)})`}>
        <rect x={r1(-comp / 2)} y={-grossura / 2} width={r1(comp)} height={grossura} rx={grossura / 2} fill="#4a160c" />
        <rect x={r1(-comp / 2 + 3)} y={-grossura / 2 + 3} width={r1(comp - 6)} height={grossura - 6} rx={(grossura - 6) / 2} fill="#80301b" />
        <rect x={r1(-comp / 2 + 10)} y={-grossura / 2 + 5} width={r1(comp - 20)} height="4" rx="2" fill="#bd6244" opacity="0.65" />
        {[-0.3, -0.1, 0.1, 0.3].map((k) => (
          <rect key={k} x={r1(comp * k - 1.5)} y={-grossura / 2 + 2} width="3" height={grossura - 4} rx="1.5"
            fill="#240904" opacity="0.75" transform={`rotate(30 ${r1(comp * k)} 0)`} />
        ))}
      </g>,
    );
  }
  return out;
}

function costela(c: Cel, rnd: () => number) {
  // A costela em ripas: a manta inteira laqueada de barbecue, as
  // costelas marcadas por cima e a ponta do osso saindo da carne.
  const out: React.ReactNode[] = [];
  const blocos = Math.max(1, Math.round(c.h / 130));
  const alturaBloco = c.h / blocos;
  for (let b = 0; b < blocos; b += 1) {
    const y0 = c.y + b * alturaBloco + 14;
    const h = alturaBloco - 22;
    const x0 = c.x + 8;
    const w = c.w - 16;
    out.push(<rect key={`m${b}`} x={r1(x0)} y={r1(y0)} width={r1(w)} height={r1(h)} rx="18" fill="#260803" />);
    out.push(<rect key={`n${b}`} x={r1(x0 + 3)} y={r1(y0 + 3)} width={r1(w - 6)} height={r1(h - 6)} rx="16" fill="#4a1408" />);
    const ossos = Math.max(2, Math.round(w / 38));
    const passo = w / ossos;
    for (let o = 0; o < ossos; o += 1) {
      const x = x0 + o * passo;
      out.push(
        <g key={`${b}-${o}`}>
          <rect x={r1(x + passo / 2 - 3.5)} y={r1(y0 - 7)} width="7" height="13" rx="3.5" fill="#d8c7a4" />
          <rect x={r1(x + 5)} y={r1(y0 + 8)} width={r1(passo - 10)} height={r1(h - 16)} rx="11" fill={o % 2 ? '#5a190b' : '#64200f'} />
          <rect x={r1(x + 9)} y={r1(y0 + 13)} width={r1(Math.max(4, passo * 0.22))} height={r1(h * (0.35 + rnd() * 0.25))} rx="4"
            fill="#9a4024" opacity="0.5" />
        </g>,
      );
    }
  }
  return out;
}

function graos(c: Cel, rnd: () => number, base: string, cores: string[], quantos: number, raio: [number, number], quadrado = false) {
  const out: React.ReactNode[] = [<rect key="base" x={c.x} y={c.y} width={c.w} height={c.h} fill={base} />];
  const n = Math.round(c.w * c.h * quantos);
  for (let i = 0; i < n; i += 1) {
    const x = c.x + rnd() * c.w;
    const y = c.y + rnd() * c.h;
    const r = raio[0] + rnd() * (raio[1] - raio[0]);
    const cor = cores[Math.floor(rnd() * cores.length)];
    out.push(quadrado
      ? <rect key={i} x={r1(x)} y={r1(y)} width={r1(r * 2)} height={r1(r * 2)} rx="1" fill={cor}
        transform={`rotate(${r1(rnd() * 90)} ${r1(x + r)} ${r1(y + r)})`} />
      : <ellipse key={i} cx={r1(x)} cy={r1(y)} rx={r1(r * 1.9)} ry={r1(r)} fill={cor}
        transform={`rotate(${r1(rnd() * 180)} ${r1(x)} ${r1(y)})`} />);
  }
  return out;
}

function paes(c: Cel, rnd: () => number, quantos: number) {
  const out: React.ReactNode[] = [];
  const largura = Math.min(56, (c.w - 12) / quantos - 6);
  const altura = Math.min(c.h - 16, largura * 0.62);
  for (let i = 0; i < quantos; i += 1) {
    const cx = c.x + (c.w / quantos) * (i + 0.5);
    const cy = c.y + c.h / 2;
    out.push(
      <g key={i} transform={`rotate(${r1(-8 + rnd() * 16)} ${r1(cx)} ${r1(cy)})`}>
        <ellipse cx={r1(cx)} cy={r1(cy)} rx={r1(largura / 2)} ry={r1(altura / 2)} fill="#8a541c" />
        <ellipse cx={r1(cx)} cy={r1(cy - 1)} rx={r1(largura / 2 - 4)} ry={r1(altura / 2 - 4)} fill="#d9a24c" />
        {Array.from({ length: 7 }, (_, k) => (
          <circle key={k} cx={r1(cx - largura / 3 + rnd() * largura * 0.66)} cy={r1(cy - altura / 4 + rnd() * altura / 2)}
            r="1.6" fill="#4f6b22" />
        ))}
      </g>,
    );
  }
  return out;
}

function molhos(c: Cel) {
  const cores = ['#7b1d0e', '#b5651d', '#5d6b1f'];
  const r = Math.min(c.h / 2 - 8, (c.w - 16) / 6);
  return cores.map((cor, i) => {
    const cx = c.x + (c.w / 3) * (i + 0.5);
    const cy = c.y + c.h / 2;
    return (
      <g key={i}>
        <circle cx={r1(cx)} cy={r1(cy)} r={r1(r)} fill="#202020" />
        <circle cx={r1(cx)} cy={r1(cy)} r={r1(r - 4)} fill={cor} />
        <circle cx={r1(cx - r * 0.3)} cy={r1(cy - r * 0.3)} r={r1(r * 0.22)} fill="#f5f0e8" opacity="0.18" />
      </g>
    );
  });
}

export function pinta(item: ItemDaCaixa, c: Cel, rnd: () => number) {
  switch (item.tipo) {
    case 'alcatra': return fatias(c, rnd, false);
    case 'contrafile': return fatias(c, rnd, true);
    case 'coxinha': return coxinhas(c, rnd);
    case 'linguica': return linguicas(c, rnd, item.unidades ?? Math.max(2, Math.round((item.gramas ?? 160) / 80)));
    case 'costela': return costela(c, rnd);
    case 'arroz': return graos(c, rnd, '#e6dece', ['#fbf7ee', '#f3ecdf', '#d3c8b4'], 0.05, [1.3, 2]);
    case 'farofa': return graos(c, rnd, '#b98a46', ['#e0b971', '#8a5e2c', '#6b4423', '#d4a55a'], 0.07, [0.9, 1.6]);
    case 'vinagrete': return graos(c, rnd, '#3a1d13', ['#c8321f', '#d9452c', '#4f7a2a', '#efe6d6', '#e5b43a'], 0.03, [2.2, 3.4], true);
    case 'pao': return paes(c, rnd, item.unidades ?? 1);
    case 'molho': return molhos(c);
    default: return null;
  }
}

/* ── a divisão do espaço ───────────────────────────────────────── */

const peso = (i: ItemDaCaixa) => i.gramas
  ?? (i.unidades ? i.unidades * (PESO_DA_UNIDADE[i.tipo] ?? 60) : PESO_SEM_INFORMACAO[i.tipo] ?? 150);

function divide(combo: Combo) {
  const carnes = combo.itens.filter((i) => CARNES.includes(i.tipo))
    .sort((a, b) => CARNES.indexOf(a.tipo) - CARNES.indexOf(b.tipo));
  const lados = combo.itens.filter((i) => LADOS.includes(i.tipo));
  const extras = combo.itens.filter((i) => i.tipo === 'pao' || i.tipo === 'molho');

  const x0 = ABA;
  const y0 = ABA;
  const larguraUtil = W - ABA * 2;
  const alturaUtil = H - ABA * 2;

  // Sem acompanhamento, pão de alho e molho viram uma faixa embaixo,
  // em vez de uma coluna inteira quase vazia.
  const faixa = lados.length === 0 && extras.length > 0;
  const alturaFaixa = faixa ? 84 : 0;
  const alturaCarne = faixa ? alturaUtil - alturaFaixa - PAREDE : alturaUtil;

  const pesoCarne = carnes.reduce((s, i) => s + peso(i), 0);
  const pesoLado = lados.reduce((s, i) => s + peso(i), 0) + extras.reduce((s, i) => s + peso(i) * 0.6, 0);
  const temColuna = lados.length > 0;
  const fracao = temColuna ? Math.min(0.74, Math.max(0.56, pesoCarne / (pesoCarne + pesoLado))) : 1;
  const larguraCarne = temColuna ? (larguraUtil - PAREDE) * fracao : larguraUtil;

  const cels: { item: ItemDaCaixa; c: Cel }[] = [];

  // Carnes: faixas verticais, largura proporcional ao peso.
  let x = x0;
  const disponivel = larguraCarne - PAREDE * (carnes.length - 1);
  carnes.forEach((item, i) => {
    const w = i === carnes.length - 1 ? x0 + larguraCarne - x : disponivel * (peso(item) / pesoCarne);
    cels.push({ item, c: { x, y: y0, w, h: alturaCarne } });
    x += w + PAREDE;
  });

  if (faixa) {
    const yf = y0 + alturaCarne + PAREDE;
    let xf = x0;
    const util = larguraUtil - PAREDE * (extras.length - 1);
    extras.forEach((item, i) => {
      const w = i === extras.length - 1 ? x0 + larguraUtil - xf : util / extras.length;
      cels.push({ item, c: { x: xf, y: yf, w, h: alturaFaixa } });
      xf += w + PAREDE;
    });
  }

  // Acompanhamentos e extras: a coluna da direita, empilhada.
  if (temColuna) {
    const cx = x0 + larguraCarne + PAREDE;
    const cw = x0 + larguraUtil - cx;
    const pilha = [...lados, ...extras];
    const pesos = pilha.map((i) => (i.tipo === 'pao' || i.tipo === 'molho' ? Math.max(110, peso(i) * 0.9) : peso(i)));
    const total = pesos.reduce((s, p) => s + p, 0);
    const util = alturaUtil - PAREDE * (pilha.length - 1);
    let y = y0;
    pilha.forEach((item, i) => {
      const h = i === pilha.length - 1 ? y0 + alturaUtil - y : util * (pesos[i] / total);
      cels.push({ item, c: { x: cx, y, w: cw, h } });
      y += h + PAREDE;
    });
  }
  return cels;
}

type Props = { combo: Combo; className?: string };

export default function Caixa({ combo, className = '' }: Props) {
  const cels = divide(combo);
  const id = `cx-${combo.id}`;
  const descricao = `Desenho da caixa ${combo.nome} vista de cima: ${combo.itens.map((i) => i.texto.toLowerCase()).join(', ')}.`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={descricao}>
      <defs>
        {cels.map(({ c }, i) => (
          <clipPath key={i} id={`${id}-${i}`}>
            <rect x={r1(c.x)} y={r1(c.y)} width={r1(c.w)} height={r1(c.h)} rx="10" />
          </clipPath>
        ))}
      </defs>
      {/* a caixa: borda, fundo e as divisórias aparecendo entre os compartimentos */}
      <rect x="0" y="0" width={W} height={H} rx="22" fill="#1b1b1b" />
      <rect x="5" y="5" width={W - 10} height={H - 10} rx="18" fill="#0d0d0d" />
      {cels.map(({ item, c }, i) => (
        <g key={i} clipPath={`url(#${id}-${i})`}>
          <rect x={r1(c.x)} y={r1(c.y)} width={r1(c.w)} height={r1(c.h)} fill="#171311" />
          {pinta(item, c, semente(`${combo.id}:${item.tipo}:${i}`))}
        </g>
      ))}
    </svg>
  );
}
