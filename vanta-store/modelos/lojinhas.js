/** VANTA STORE — carrinho, checkout e conta. */
import { LOJA, CUPONS, ESTADOS, PAGAMENTOS, AVISO_DEMO, linkWhats, MSG, ENTREGA }
  from '../conteudo/site.js';
import { esc, moeda, botao, cabeca, secao, ICO } from './ui.js';
import { pagina, jsonLdLoja } from './base.js';

/* ── Carrinho (página cheia) ──────────────────────────────── */
export function paginaCarrinho() {
  const corpo = `
<section class="pagina">
  <div class="wrap">
    <nav class="migalhas" aria-label="Você está em">
      <ol><li><a href="index.html">Início</a></li><li><span aria-current="page">Carrinho</span></li></ol>
    </nav>
    <h1 class="titulo-pagina">SEU CARRINHO</h1>

    <div class="carrinho" id="carrinhoPagina">
      <div class="carrinho__lista">
        <div class="carrinho__itens" id="paginaItens"></div>
        <div class="vazio" id="paginaVazio" hidden>
          <p class="vazio__titulo">Seu carrinho está vazio</p>
          <p class="vazio__texto">Escolha uma peça e ela aparece aqui.</p>
          <a class="btn btn--tinta" href="index.html#loja">Ver o catálogo</a>
        </div>
        <p class="carrinho__voltar">
          <a class="link-seta link-seta--volta" href="index.html#loja">
            <span aria-hidden="true">←</span> Continuar comprando</a>
        </p>
      </div>

      <aside class="resumo" aria-label="Resumo do pedido">
        <h2>Resumo</h2>

        <form class="cupom" id="formCupom" novalidate>
          <label for="cupomCampo">Cupom de desconto</label>
          <div class="cupom__linha">
            <input type="text" id="cupomCampo" placeholder="Digite o código"
              autocomplete="off" spellcheck="false">
            <button type="submit" class="btn btn--linha">Aplicar</button>
          </div>
          <p class="cupom__aviso" id="cupomAviso" role="status" aria-live="polite"></p>
          <p class="cupom__dica">Cupons de demonstração:
            ${CUPONS.map((c) => `<button type="button" class="pilula" data-cupom="${c.codigo}"
              title="${esc(c.texto)}">${c.codigo}</button>`).join('')}</p>
        </form>

        <dl class="resumo__linhas">
          <div><dt>Subtotal</dt><dd id="resSubtotal">R$ 0,00</dd></div>
          <div id="resLinhaDesc" hidden><dt>Desconto</dt><dd id="resDesconto">− R$ 0,00</dd></div>
          <div><dt>Frete</dt><dd id="resFrete">A calcular</dd></div>
          <div class="resumo__total"><dt>Total</dt><dd id="resTotal">R$ 0,00</dd></div>
        </dl>
        <p class="resumo__pix" id="resPix" hidden></p>

        <a class="btn btn--tinta btn--bloco btn--gg" href="checkout.html" id="paginaCheckout">
          Finalizar compra</a>
        <p class="resumo__nota">${esc(AVISO_DEMO)}</p>
      </aside>
    </div>
  </div>
</section>`;

  return pagina({
    titulo: `Carrinho | ${LOJA.nome} ${LOJA.sobrenome}`,
    descricao: 'Revise os produtos do seu carrinho, aplique um cupom e siga para o ' +
      'checkout. Loja demonstrativa: nenhum pagamento é processado.',
    caminho: 'carrinho.html', raiz: '', corpo, classe: 'pg-carrinho',
    jsonLd: [jsonLdLoja],
  });
}

/* ── Checkout ─────────────────────────────────────────────── */
const campo = ({ id, rotulo, tipo = 'text', auto, dica, largura, obrigatorio = true,
                 modo, max }) => `
  <div class="campo${largura ? ` campo--${largura}` : ''}">
    <label for="${id}">${esc(rotulo)}${obrigatorio ? '' : ' <i>(opcional)</i>'}</label>
    <input type="${tipo}" id="${id}" name="${id}"${obrigatorio ? ' required' : ''}
      ${auto ? ` autocomplete="${auto}"` : ''}${modo ? ` inputmode="${modo}"` : ''}
      ${max ? ` maxlength="${max}"` : ''}${dica ? ` placeholder="${esc(dica)}"` : ''}>
    <p class="campo__erro" id="erro-${id}" role="alert" hidden></p>
  </div>`;

export function paginaCheckout() {
  const corpo = `
<section class="pagina">
  <div class="wrap">
    <nav class="migalhas" aria-label="Você está em">
      <ol><li><a href="index.html">Início</a></li>
        <li><a href="carrinho.html">Carrinho</a></li>
        <li><span aria-current="page">Checkout</span></li></ol>
    </nav>
    <h1 class="titulo-pagina">CHECKOUT</h1>
    <p class="tarja-demo">${esc(AVISO_DEMO)} Este formulário mostra a interface de
      um checkout real, mas <b>não envia nada e não cobra nada</b>.</p>

    <div class="checkout" id="checkoutPagina">
      <form class="checkout__form" id="formCheckout" novalidate>
        <fieldset>
          <legend><span class="passo">1</span> Seus dados</legend>
          <div class="campos">
            ${campo({ id: 'nome', rotulo: 'Nome completo', auto: 'name', largura: 'cheio' })}
            ${campo({ id: 'email', rotulo: 'E-mail', tipo: 'email', auto: 'email', dica: 'seu@email.com' })}
            ${campo({ id: 'telefone', rotulo: 'Telefone', tipo: 'tel', auto: 'tel',
                      modo: 'tel', dica: '(11) 90000-0000' })}
          </div>
        </fieldset>

        <fieldset>
          <legend><span class="passo">2</span> Endereço de entrega</legend>
          <div class="campos">
            ${campo({ id: 'cep', rotulo: 'CEP', modo: 'numeric', auto: 'postal-code',
                      dica: '00000-000', max: 9 })}
            ${campo({ id: 'endereco', rotulo: 'Endereço', auto: 'address-line1', largura: 'cheio' })}
            ${campo({ id: 'numero', rotulo: 'Número', modo: 'numeric' })}
            ${campo({ id: 'complemento', rotulo: 'Complemento', obrigatorio: false,
                      auto: 'address-line2' })}
            ${campo({ id: 'bairro', rotulo: 'Bairro', auto: 'address-level3' })}
            ${campo({ id: 'cidade', rotulo: 'Cidade', auto: 'address-level2' })}
            <div class="campo">
              <label for="estado">Estado</label>
              <select id="estado" name="estado" required autocomplete="address-level1">
                <option value="">Selecione</option>
                ${ESTADOS.map((u) => `<option value="${u}">${u}</option>`).join('')}
              </select>
              <p class="campo__erro" id="erro-estado" role="alert" hidden></p>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend><span class="passo">3</span> Pagamento</legend>
          <div class="pagamentos" role="radiogroup" aria-label="Forma de pagamento">
            ${PAGAMENTOS.map((f, i) => `
              <label class="pagamento">
                <input type="radio" name="pagamento" value="${f.id}"${i === 0 ? ' checked' : ''}>
                <span class="pagamento__corpo">
                  <b>${esc(f.nome)}</b><i>${esc(f.linha)}</i>
                </span>
              </label>`).join('')}
          </div>
          <div class="cartao" id="camposCartao" hidden>
            <div class="campos">
              ${campo({ id: 'cartaoNumero', rotulo: 'Número do cartão', modo: 'numeric',
                        dica: '0000 0000 0000 0000', largura: 'cheio', obrigatorio: false })}
              ${campo({ id: 'cartaoNome', rotulo: 'Nome impresso no cartão', obrigatorio: false })}
              ${campo({ id: 'cartaoValidade', rotulo: 'Validade', dica: 'MM/AA', max: 5, obrigatorio: false })}
              ${campo({ id: 'cartaoCvv', rotulo: 'CVV', modo: 'numeric', max: 4, obrigatorio: false })}
            </div>
            <p class="cartao__aviso">${ICO.escudo}Campos de demonstração. Não digite dados
              de um cartão real: nada aqui é enviado, mas também nada é protegido.</p>
          </div>
        </fieldset>

        <!-- O total vai no próprio botão: no celular o resumo fica abaixo,
             e ninguém deve apertar "finalizar" sem ver quanto é. -->
        <button type="submit" class="btn btn--tinta btn--gg btn--bloco" id="finalizar">
          <span>Finalizar pedido</span><b id="finalizarTotal"></b></button>
        <p class="checkout__legal">Ao finalizar você verá apenas uma confirmação de
          demonstração. Nenhum pedido é criado e nenhuma cobrança é feita.</p>
      </form>

      <aside class="resumo resumo--checkout" aria-label="Resumo do pedido">
        <h2>Seu pedido</h2>
        <div class="resumo__itens" id="checkoutItens"></div>
        <dl class="resumo__linhas">
          <div><dt>Subtotal</dt><dd id="coSubtotal">R$ 0,00</dd></div>
          <div id="coLinhaDesc" hidden><dt>Desconto</dt><dd id="coDesconto">− R$ 0,00</dd></div>
          <div><dt>Frete</dt><dd id="coFrete">A calcular</dd></div>
          <div class="resumo__total"><dt>Total</dt><dd id="coTotal">R$ 0,00</dd></div>
        </dl>
        <p class="resumo__nota">${esc(ENTREGA.nota)}</p>
        <a class="link-seta link-seta--volta" href="carrinho.html">
          <span aria-hidden="true">←</span> Voltar ao carrinho</a>
      </aside>
    </div>

    <div class="sucesso" id="sucesso" role="dialog" aria-modal="true"
      aria-labelledby="sucessoTitulo" hidden>
      <div class="sucesso__caixa">
        <span class="sucesso__ico" aria-hidden="true">${ICO.check}</span>
        <h2 id="sucessoTitulo">Pedido de demonstração registrado</h2>
        <p>Numa loja publicada, aqui apareceria o número do pedido e o e-mail de
          confirmação. Como esta é uma demonstração, <b>nada foi enviado, cobrado
          ou armazenado</b>.</p>
        <p class="sucesso__num">Pedido fictício nº <b id="numPedido">—</b></p>
        <div class="sucesso__acoes">
          <a class="btn btn--tinta" href="index.html">Voltar para a loja</a>
          ${botao({ texto: `${ICO.whats}Falar no WhatsApp`, variante: 'linha',
                    externo: true, href: linkWhats(MSG.pedido) })}
        </div>
      </div>
    </div>
  </div>
</section>`;

  return pagina({
    titulo: `Checkout | ${LOJA.nome} ${LOJA.sobrenome}`,
    descricao: 'Checkout demonstrativo da VANTA STORE, com Pix, cartão e boleto. ' +
      'Nenhum pagamento é processado.',
    caminho: 'checkout.html', raiz: '', corpo, classe: 'pg-checkout',
    jsonLd: [jsonLdLoja],
  });
}

/* ── Conta (demonstrativa) ────────────────────────────────── */
export function paginaConta() {
  const corpo = `
<section class="pagina">
  <div class="wrap wrap--estreito">
    <nav class="migalhas" aria-label="Você está em">
      <ol><li><a href="index.html">Início</a></li><li><span aria-current="page">Minha conta</span></li></ol>
    </nav>
    <h1 class="titulo-pagina">MINHA CONTA</h1>
    <p class="tarja-demo">Área de conta demonstrativa. Numa loja publicada, aqui ficariam
      seus pedidos, endereços e dados de cadastro — com login de verdade.
      <b>Este formulário não cria conta nem guarda nada.</b></p>

    <div class="conta">
      <form class="conta__form" id="formConta" novalidate>
        <h2>Entrar</h2>
        <div class="campo">
          <label for="contaEmail">E-mail</label>
          <input type="email" id="contaEmail" required autocomplete="email" placeholder="seu@email.com">
          <p class="campo__erro" id="erro-contaEmail" role="alert" hidden></p>
        </div>
        <div class="campo">
          <label for="contaSenha">Senha</label>
          <input type="password" id="contaSenha" required autocomplete="current-password"
            placeholder="Não use uma senha de verdade">
          <p class="campo__erro" id="erro-contaSenha" role="alert" hidden></p>
        </div>
        <button type="submit" class="btn btn--tinta btn--bloco">Entrar</button>
        <p class="conta__aviso" id="contaAviso" role="status" aria-live="polite"></p>
      </form>

      <div class="conta__lado">
        <h2>Meus pedidos</h2>
        <div class="vazio">
          <p class="vazio__titulo">Nenhum pedido por aqui</p>
          <p class="vazio__texto">Os pedidos apareceriam nesta lista depois da primeira compra.</p>
          <a class="btn btn--linha" href="index.html#loja">Ver o catálogo</a>
        </div>
      </div>
    </div>
  </div>
</section>`;

  return pagina({
    titulo: `Minha conta | ${LOJA.nome} ${LOJA.sobrenome}`,
    descricao: 'Área de conta demonstrativa da VANTA STORE.',
    caminho: 'conta.html', raiz: '', corpo, classe: 'pg-conta',
    jsonLd: [jsonLdLoja],
  });
}
