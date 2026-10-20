/**
 * O caminho inteiro da encomenda, num navegador de verdade, no tamanho
 * de um celular e com o relógio fixado numa sexta às 14h59.
 *
 *   npm run build && npx serve out -l 3000      (num terminal)
 *   npm run testar:navegador                    (no outro)
 *
 * Precisa do Playwright: npm i -D playwright && npx playwright install chromium
 */
let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  console.error('Falta o Playwright: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}
const url = process.argv[2] || 'http://localhost:3000/';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'America/Sao_Paulo' });
const p = await ctx.newPage();
// Sexta, 23/10/2026, 14h59 em Sarandi: as 20h de hoje não podem, as 23h podem.
await p.clock.install({ time: new Date('2026-10-23T14:59:00-03:00') });
const erros = [];
p.on('pageerror', (e) => erros.push(e.message));
await p.addInitScript(() => { window.__aberto = []; window.open = (u) => { window.__aberto.push(u); return {}; }; });
await p.goto(url, { waitUntil: 'networkidle' });
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) process.exitCode = 1; };

await p.waitForFunction(() => document.querySelector('#inicio')?.innerText.includes('Pedindo agora'));
ok(/primeira entrega possível é hoje \(sexta-feira\), às 23h/.test(await p.locator('#inicio').innerText()),
  'o topo diz a primeira entrega possível certa (sexta 15h → hoje 23h)');

// adiciona 2x Combo da Casa
await p.locator('#cardapio').scrollIntoViewIfNeeded();
await p.getByRole('button', { name: 'Aumentar quantidade' }).first().click();
await p.getByRole('button', { name: /Adicionar à encomenda/ }).first().click();
await p.waitForTimeout(400);
ok(await p.getByRole('status').filter({ hasText: '2x Combo da Casa na encomenda' }).isVisible(), 'recado de adicionado aparece');
// um adicional
await p.getByRole('button', { name: 'Pôr uma porção de Farofa' }).click();
ok((await p.getByRole('button', { name: /Abrir minha encomenda/ }).getAttribute('aria-label')).includes('3 itens'), 'o carrinho conta 3 itens');

// recarregar não perde a encomenda
await p.reload({ waitUntil: 'networkidle' });
await p.waitForFunction(() => document.querySelector('[aria-label^="Abrir minha encomenda"]')?.getAttribute('aria-label').includes('3 itens'), null, { timeout: 5000 }).catch(() => {});
ok((await p.getByRole('button', { name: /Abrir minha encomenda/ }).getAttribute('aria-label')).includes('3 itens'), 'a encomenda sobrevive ao recarregar');

await p.getByRole('button', { name: /Abrir minha encomenda/ }).click();
await p.waitForTimeout(600);
const gaveta = p.getByRole('dialog', { name: 'Minha encomenda' });
ok(await gaveta.getByText('R$ 255,00').first().isVisible(), 'subtotal R$ 255,00 (2x 125 + 5)');

await gaveta.getByRole('button', { name: 'Escolher dia e entrega' }).click();
await p.waitForTimeout(400);
// tenta revisar sem nada: erros aparecem
await gaveta.getByRole('button', { name: 'Revisar encomenda' }).click();
await p.waitForTimeout(400);
ok(await gaveta.getByText('Escolha o dia da entrega.').isVisible(), 'sem dia, o erro aparece');
ok(await gaveta.getByText('Diga o seu nome.').isVisible(), 'sem nome, o erro aparece');

// hoje (sex 23/10): 20h riscado, 23h disponível
await gaveta.getByRole('radio', { name: /sex\s*23\/10/ }).click();
const vinte = gaveta.getByRole('radio', { name: /^20h, indisponível/ });
ok(await vinte.isDisabled(), 'sexta às 15h: 20h de hoje está bloqueado');
ok(await gaveta.getByRole('radio', { name: /^22h30, indisponível/ }).isDisabled(), '22h30 bloqueado (só 7h31)');
ok(!(await gaveta.getByRole('radio', { name: '23h', exact: true }).isDisabled()), '23h liberado (8h01)');

// escolhe sábado 20h
await gaveta.getByRole('radio', { name: /sáb\s*24\/10/ }).click();
await gaveta.getByRole('radio', { name: '20h', exact: true }).click();
await gaveta.getByLabel('Nome').fill('Ana Souza');
await gaveta.getByLabel('WhatsApp para contato').fill('44999990000');
ok((await gaveta.getByLabel('WhatsApp para contato').inputValue()) === '(44) 99999-0000', 'máscara do telefone');
await gaveta.getByRole('radio', { name: 'Maringá' }).click();
await p.waitForTimeout(300);
ok(await gaveta.getByText(/Grátis até 10 km, a confirmar/).isVisible(), 'Maringá: taxa a confirmar');
await gaveta.getByLabel('Rua e número').fill('Rua das Flores, 120');
await gaveta.getByLabel('Bairro').fill('Zona 7');
await gaveta.getByRole('radio', { name: 'Dinheiro' }).click();
await gaveta.getByLabel(/Troco para quanto/).fill('R$ 300');
await gaveta.getByRole('button', { name: 'Revisar encomenda' }).click();
await p.waitForTimeout(500);
ok(await gaveta.getByText('sábado, 24 de outubro, às 20h').isVisible(), 'a revisão mostra a data e hora');
ok(await gaveta.getByText('R$ 255,00 (ou R$ 270,00 se passar de 10 km)').isVisible(), 'total estimado honesto para Maringá');
ok(await gaveta.getByText(/no mínimo 8 horas de antecedência/).first().isVisible(), 'aviso das 8 horas na revisão');

// o relógio anda: a página fica aberta até sábado 12h58 → 20h perde as 8h; o clique final tem de barrar
await p.clock.setSystemTime(new Date('2026-10-24T12:58:00-03:00'));
await gaveta.getByRole('button', { name: 'Confirmar encomenda pelo WhatsApp' }).click();
await p.waitForTimeout(500);
ok((await p.evaluate(() => window.__aberto.length)) === 0, 'página aberta demais: o clique final não abre o WhatsApp');
ok(await gaveta.getByText(/precisamos de pelo menos 8 horas/).first().isVisible(), 'e mostra o aviso das 8 horas');
ok(await gaveta.getByRole('radio', { name: /^20h, indisponível/ }).isDisabled(), 'e o 20h de sábado já aparece riscado');

// escolhe 21h (8h02) e confirma
await gaveta.getByRole('radio', { name: '21h', exact: true }).click();
await gaveta.getByRole('button', { name: 'Revisar encomenda' }).click();
await p.waitForTimeout(400);
await gaveta.getByRole('button', { name: 'Confirmar encomenda pelo WhatsApp' }).click();
await p.waitForTimeout(900);
const abertos = await p.evaluate(() => window.__aberto);
ok(abertos.length === 1 && abertos[0].startsWith('https://wa.me/5544998780479?text='), 'abre o wa.me do número oficial');
const texto = decodeURIComponent(abertos[0]?.split('?text=')[1] ?? '');
ok(texto.includes('HORÁRIO SOLICITADO: 21h') && texto.includes('• 2x Combo da Casa — R$ 250,00'), 'a mensagem traz itens e horário');
ok(await p.getByText('A encomenda ainda não está confirmada').isVisible(), 'não diz que está confirmado');
if (erros.length) { console.log('ERROS NA PÁGINA:', erros); process.exitCode = 1; }
await b.close();
