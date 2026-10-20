import Brasa from './Brasa';
import BotaoEncomendar from './BotaoEncomendar';
import ProximaEntrega from './ProximaEntrega';

const atraso = (ms: number) => ({ '--atraso': `${ms}ms` }) as React.CSSProperties;

/**
 * O primeiro quadro: a brasa acesa sob a grelha, e o título passando
 * por baixo dela como letreiro de filme.
 */
export default function Hero() {
  return (
    <section id="inicio" aria-labelledby="titulo-inicio" className="hero moldura">
      <h1 id="titulo-inicio" className="hero-titulo titulo text-mostra">
        <span className="linha-entra"><span>Não é apenas churrasco.</span></span>
        <span className="linha-entra" style={atraso(120)}><span>É Caixa Bruta.</span></span>
      </h1>

      <div className="hero-quadro quadro-entra">
        <Brasa className="h-full" rotulo="Brasa acesa sob a grelha, com fagulhas subindo" />
      </div>

      <div className="hero-lado">
        <p className="max-w-[34ch] text-destaque leading-[1.4]" data-revela style={atraso(200)}>
          Carnes selecionadas, preparadas com dedicação e aquele sabor inconfundível da brasa.
          Seu churrasco favorito, feito sob encomenda.
        </p>
        <div className="flex flex-wrap gap-3" data-revela style={atraso(280)}>
          <a href="#cardapio" className="bt bt-claro">Explorar cardápio</a>
          <BotaoEncomendar className="bt bt-acao">Fazer minha encomenda</BotaoEncomendar>
        </div>
        <div className="bg-dourado p-5 text-carvao" data-revela style={atraso(360)}>
          <p className="font-extrabold leading-snug">
            Encomendas com no mínimo 8 horas de antecedência.
          </p>
          <ProximaEntrega className="mt-1.5 font-medium leading-snug" />
        </div>
        <p className="font-semibold text-cinza" data-revela style={atraso(420)}>
          Quinta, sexta e sábado <span aria-hidden>•</span> Entregas a partir das 20h
        </p>
      </div>
    </section>
  );
}
