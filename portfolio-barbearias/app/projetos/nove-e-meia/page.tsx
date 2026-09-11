import type { Metadata } from "next";
import Image from "next/image";
import { archivoBlack, spaceGrotesk } from "@/lib/fontes";
import { noveMeia } from "@/content/demo-nove-e-meia";
import BarraDemo from "@/components/demos/BarraDemo";
import Revelar from "@/components/ui/Revelar";
import TopoNove from "./TopoNove";
import "./nove.css";

export const metadata: Metadata = {
  title: "Nove & Meia · Barbearia (projeto demonstrativo)",
  description:
    "Projeto demonstrativo de site para barbearia urbana: escolha do barbeiro, agendamento rápido, galeria de cortes e horários livres do dia.",
};

const zap = (msg: string) =>
  `https://wa.me/${noveMeia.whatsapp}?text=${encodeURIComponent(msg)}`;

export default function PaginaNove() {
  const linkAgendar = zap("Olá! Quero agendar um horário na Nove & Meia.");
  /* A faixa é duplicada para o loop ficar contínuo. */
  const faixa = [...noveMeia.marquee, ...noveMeia.marquee];

  return (
    <div className={`tema-nove ${archivoBlack.variable} ${spaceGrotesk.variable}`} id="topo">
      <TopoNove linkAgendar={linkAgendar} />

      {/* ── Hero ── */}
      <section className="n-hero">
        <div className="n-hero__fundo">
          <Image
            className="n-hero__arte-alta"
            src="/arte/nove/hero-alto.svg"
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
          <Image
            className="n-hero__arte-larga"
            src="/arte/nove/hero.svg"
            alt=""
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className="n-hero__veu" aria-hidden />
        <div className="n-wrap n-hero__conteudo">
          <h1>
            {noveMeia.hero.linha1}
            <span>{noveMeia.hero.linha2}</span>
          </h1>
          <p className="n-hero__sub">{noveMeia.hero.subtitulo}</p>
          <div className="n-hero__acoes">
            <a className="n-btn n-btn--limao" href={linkAgendar} target="_blank" rel="noopener noreferrer">
              {noveMeia.hero.cta}
            </a>
            <a className="n-btn n-btn--linha" href="#trabalhos">
              {noveMeia.hero.ctaSecundario}
            </a>
          </div>
        </div>
      </section>

      {/* ── Faixa rolante de prova ── */}
      <div className="n-faixa">
        <div className="n-faixa__trilho" aria-hidden>
          {faixa.map((t, i) => (
            <span key={`${t}-${i}`}>{t}</span>
          ))}
        </div>
        <span className="sr-only">
          Avaliação 4,9 no Google, mais de 2.000 cortes por ano, aberto até 21h.
        </span>
      </div>

      {/* ── Barbeiros: a seção principal, antes dos serviços ── */}
      <section className="n-secao" id="equipe">
        <div className="n-wrap">
          <p className="n-etiqueta">{noveMeia.barbeiros.etiqueta}</p>
          <h2 className="n-titulo">{noveMeia.barbeiros.titulo}</h2>
          <p className="n-apoio" style={{ marginTop: "1rem" }}>
            {noveMeia.barbeiros.texto}
          </p>

          <div className="n-barbeiros">
            {noveMeia.barbeiros.lista.map((b, i) => (
              <Revelar key={b.nome} atraso={i * 0.06} className="n-barbeiro">
                <Image
                  src={`/arte/nove/barbeiro-${i + 1}.svg`}
                  alt={`Retrato ilustrado do barbeiro ${b.nome}`}
                  width={600}
                  height={700}
                />
                <div className="n-barbeiro__corpo">
                  <h3>{b.nome}</h3>
                  <p className="n-barbeiro__esp">{b.especialidade}</p>
                  <p className="n-barbeiro__agenda">{b.agenda}</p>
                  <a
                    className="n-btn n-btn--limao"
                    style={{ padding: "11px 16px", fontSize: "0.82rem" }}
                    href={zap(`Olá! Quero agendar um horário com o ${b.nome}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Agendar com {b.nome}
                  </a>
                </div>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ── Serviços ── */}
      <section className="n-secao n-borda" id="servicos">
        <div className="n-wrap">
          <p className="n-etiqueta">{noveMeia.servicos.etiqueta}</p>
          <h2 className="n-titulo">{noveMeia.servicos.titulo}</h2>

          <div className="n-servicos">
            {noveMeia.servicos.lista.map((s, i) => (
              <Revelar key={s.nome} atraso={i * 0.03} className="n-servico">
                <div>
                  <h3>
                    {s.nome}
                    {s.tag && <span className="n-tag">{s.tag}</span>}
                  </h3>
                  <p className="n-servico__tempo">{s.tempo}</p>
                </div>
                <span className="n-servico__preco">{s.preco}</span>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section className="n-secao n-borda">
        <div className="n-wrap">
          <p className="n-etiqueta">{noveMeia.comoFunciona.etiqueta}</p>
          <h2 className="n-titulo">{noveMeia.comoFunciona.titulo}</h2>

          <div className="n-passos">
            {noveMeia.comoFunciona.passos.map((p, i) => (
              <Revelar key={p.numero} atraso={i * 0.08} className="n-passo">
                <span className="n-passo__num">{p.numero}</span>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ── Galeria ── */}
      <section className="n-secao n-borda" id="trabalhos">
        <div className="n-wrap">
          <p className="n-etiqueta">{noveMeia.galeria.etiqueta}</p>
          <h2 className="n-titulo">{noveMeia.galeria.titulo}</h2>
          <p className="n-apoio" style={{ marginTop: "1rem" }}>
            {noveMeia.galeria.texto}
          </p>

          <div className="n-galeria">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <figure key={n}>
                <Image
                  src={`/arte/nove/trabalho-${n}.svg`}
                  alt="Corte degradê feito na barbearia"
                  width={700}
                  height={700}
                  loading="lazy"
                />
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Horários livres + avaliação ── */}
      <section className="n-secao n-borda">
        <div className="n-wrap">
          <div className="n-painel">
            <Revelar className="n-cartao">
              <h3 style={{ fontSize: "1.6rem" }}>{noveMeia.horariosLivres.titulo}</h3>
              <p className="n-apoio" style={{ marginTop: "0.6rem", fontSize: "0.92rem" }}>
                {noveMeia.horariosLivres.texto}
              </p>
              <div className="n-slots">
                {noveMeia.horariosLivres.slots.map((h) => (
                  <a
                    key={h}
                    className="n-slot"
                    href={zap(`Olá! Quero agendar hoje às ${h}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {h}
                  </a>
                ))}
              </div>
            </Revelar>

            <Revelar atraso={0.08} className="n-cartao">
              <p className="n-nota">{noveMeia.avaliacao.nota}</p>
              <p className="n-estrelas" aria-hidden>
                ★★★★★
              </p>
              <p className="n-apoio" style={{ marginTop: "0.8rem", fontSize: "0.9rem" }}>
                {noveMeia.avaliacao.quantidade} avaliações no Google. Leia todas antes de decidir.
              </p>
              <a
                className="n-btn n-btn--linha"
                style={{ marginTop: "18px", padding: "12px 20px", fontSize: "0.84rem" }}
                href="https://www.google.com/maps"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver no Google
              </a>
            </Revelar>
          </div>
        </div>
      </section>

      {/* ── Onde é ── */}
      <section className="n-secao n-borda" id="onde">
        <div className="n-wrap">
          <div className="n-painel">
            <div>
              <p className="n-etiqueta">Onde é</p>
              <h2 className="n-titulo">
                Vila Matilde,<br />
                <em>fácil de achar</em>
              </h2>
              <p className="n-apoio" style={{ marginTop: "1rem" }}>
                {noveMeia.endereco.linha1}
                <br />
                {noveMeia.endereco.linha2}
                <br />
                <span style={{ opacity: 0.7 }}>{noveMeia.endereco.referencia}</span>
              </p>
              <a
                className="n-btn n-btn--laranja"
                style={{ marginTop: "22px" }}
                href="https://www.google.com/maps"
                target="_blank"
                rel="noopener noreferrer"
              >
                Traçar rota
              </a>
            </div>

            <div className="n-cartao">
              <h3 style={{ fontSize: "1.3rem" }}>Horário</h3>
              <ul className="n-horarios">
                {noveMeia.horarios.map((h) => (
                  <li key={h.dia}>
                    <span>{h.dia}</span>
                    <span>{h.hora}</span>
                  </li>
                ))}
              </ul>
              <p className="n-apoio" style={{ marginTop: "1rem", fontSize: "0.85rem" }}>
                {noveMeia.instagram} · {noveMeia.telefoneVisivel}
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="n-rodape">
        <div className="n-wrap n-rodape__linha">
          <p style={{ margin: 0 }}>
            {noveMeia.nome} · {noveMeia.playlist}
          </p>
          <p style={{ margin: 0 }}>Barbearia fictícia, criada para demonstração.</p>
        </div>
      </footer>

      {/* Barra fixa com duas ações */}
      <div className="n-fixo">
        <a className="n-btn n-btn--limao" href={linkAgendar} target="_blank" rel="noopener noreferrer">
          Agendar
        </a>
        <a
          className="n-btn n-btn--linha"
          href={zap("Olá! Tenho uma dúvida sobre a Nove & Meia.")}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
      </div>

      <BarraDemo nome={noveMeia.nome} />
    </div>
  );
}
