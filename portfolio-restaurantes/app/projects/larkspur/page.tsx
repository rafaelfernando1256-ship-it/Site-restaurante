import type { Metadata } from "next";
import Image from "next/image";
import { playfair, karla } from "@/lib/fontes-larkspur";
import { larkspur } from "@/content/demo-larkspur";
import BarraDemo from "@/components/demos/BarraDemo";
import Revelar from "@/components/ui/Revelar";
import TopoLarkspur from "./TopoLarkspur";
import "./larkspur.css";

export const metadata: Metadata = {
  title: "Larkspur · Tasting Room (demo project)",
  description:
    "Demo website for a chef-driven tasting room: reservation as the only action, a seven-course menu with wine pairings, private dining and gift cards.",
};

export default function PaginaLarkspur() {
  return (
    <div className={`tema-larkspur ${playfair.variable} ${karla.variable}`} id="top">
      <TopoLarkspur />

      {/* ── Hero ── */}
      <section className="l-hero">
        <div className="l-wrap l-hero__grade">
          <div>
            <p className="l-hero__etiqueta">{larkspur.hero.etiqueta}</p>
            <h1>{larkspur.hero.titulo}</h1>
            <p className="l-hero__sub">{larkspur.hero.subtitulo}</p>
            <div className="l-hero__acoes">
              <a className="l-btn l-btn--cobre" href="#reserve">
                {larkspur.hero.cta}
              </a>
              <a className="l-btn l-btn--linha" href="#menu">
                {larkspur.hero.ctaSecundario}
              </a>
            </div>
          </div>
          <figure className="l-hero__foto">
            <Image
              src="/arte/larkspur/hero.svg"
              alt="A plated course at Larkspur: fish, brown butter and green almond"
              width={900}
              height={1000}
              priority
            />
          </figure>
        </div>
      </section>

      {/* ── A cozinha ── */}
      <section className="l-secao l-borda l-fundo-2" id="kitchen">
        <div className="l-wrap">
          <Revelar>
            <p className="l-etiqueta">{larkspur.cozinha.etiqueta}</p>
            <h2 className="l-titulo">{larkspur.cozinha.titulo}</h2>
            <p className="l-apoio">{larkspur.cozinha.texto}</p>
          </Revelar>

          <ol className="l-passos">
            {larkspur.cozinha.passos.map((p, i) => (
              <Revelar key={p.numero} atraso={0.04 * i}>
                <li>
                  <span className="l-passos__n">{p.numero}</span>
                  <h3>{p.titulo}</h3>
                  <p>{p.texto}</p>
                </li>
              </Revelar>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Menu degustação ── */}
      <section className="l-secao l-borda" id="menu">
        <div className="l-wrap">
          <Revelar>
            <p className="l-etiqueta">{larkspur.menu.etiqueta}</p>
            <h2 className="l-titulo">{larkspur.menu.titulo}</h2>
            <p className="l-apoio">{larkspur.menu.texto}</p>
          </Revelar>

          <div className="l-menu">
            {larkspur.menu.cursos.map((c, i) => (
              <Revelar key={c.nome} atraso={0.03 * i}>
                <div className="l-curso">
                  <p className="l-curso__nome">{c.nome}</p>
                  <p className="l-curso__nota">{c.nota}</p>
                  <p className="l-curso__vinho">{c.vinho}</p>
                </div>
              </Revelar>
            ))}
          </div>

          <Revelar atraso={0.1}>
            <div className="l-menu__preco">
              <b>$145</b>
              <span>per person · seven courses</span>
              <b>$85</b>
              <span>wine pairing</span>
            </div>
            <p className="l-nota">{larkspur.menu.observacao}</p>
          </Revelar>
        </div>
      </section>

      {/* ── A sala ── */}
      <section className="l-secao l-borda l-fundo-2" id="room">
        <div className="l-wrap">
          <Revelar>
            <p className="l-etiqueta">{larkspur.equipe.etiqueta}</p>
            <h2 className="l-titulo">{larkspur.equipe.titulo}</h2>
          </Revelar>

          <div className="l-equipe">
            {larkspur.equipe.lista.map((m, i) => (
              <Revelar key={m.nome} atraso={0.06 * i}>
                <article className="l-pessoa">
                  <Image
                    src={`/arte/larkspur/retrato-${i + 1}.svg`}
                    alt=""
                    width={600}
                    height={700}
                    loading="lazy"
                  />
                  <h3>{m.nome}</h3>
                  <p className="l-pessoa__papel">{m.papel}</p>
                  <p>{m.anos} · {m.especialidade}</p>
                </article>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ── Privado + vale-presente ── */}
      <section className="l-secao l-borda" id="private">
        <div className="l-wrap">
          <div className="l-cartoes">
            <Revelar>
              <article className="l-cartao l-cartao--musgo">
                <p className="l-etiqueta">{larkspur.privado.etiqueta}</p>
                <h3>{larkspur.privado.titulo}</h3>
                <p>{larkspur.privado.texto}</p>
                <a className="l-btn l-btn--cobre" href="#reserve">
                  {larkspur.privado.cta}
                </a>
              </article>
            </Revelar>
            <Revelar atraso={0.08}>
              <article className="l-cartao">
                <h3>{larkspur.presente.titulo}</h3>
                <p>{larkspur.presente.texto}</p>
                <a className="l-btn l-btn--linha" href="#reserve">
                  {larkspur.presente.cta}
                </a>
              </article>
            </Revelar>
          </div>
        </div>
      </section>

      {/* ── Reserva e informações ── */}
      <section className="l-secao l-borda l-fundo-2" id="reserve">
        <div className="l-wrap l-reserva">
          <div>
            <Revelar>
              <p className="l-etiqueta">{larkspur.reserva.etiqueta}</p>
              <h2 className="l-titulo">{larkspur.reserva.titulo}</h2>
              <p className="l-apoio">{larkspur.reserva.texto}</p>
              <div className="l-hero__acoes">
                <a className="l-btn l-btn--cobre" href={larkspur.reservaUrl}>
                  {larkspur.reserva.cta}
                </a>
                <a className="l-btn l-btn--linha" href={`tel:${larkspur.telefone}`}>
                  {larkspur.telefoneVisivel}
                </a>
              </div>
              <p className="l-nota">{larkspur.reserva.nota}</p>
            </Revelar>
          </div>

          <Revelar atraso={0.08}>
            <dl className="l-info">
              <dt>Address</dt>
              <dd>
                {larkspur.endereco.linha1}
                <br />
                {larkspur.endereco.linha2}
                <br />
                <span style={{ color: "var(--osso-2)" }}>{larkspur.endereco.referencia}</span>
              </dd>

              <dt>Parking</dt>
              <dd>{larkspur.endereco.estacionamento}</dd>

              <dt>Phone</dt>
              <dd>{larkspur.telefoneVisivel}</dd>

              <dt>Service</dt>
              <dd>
                <ul className="l-horarios">
                  {larkspur.horarios.map((h) => (
                    <li key={h.dia}>
                      <span>{h.dia}</span>
                      <span>{h.hora}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </dl>
          </Revelar>
        </div>
      </section>

      <footer className="l-rodape">
        <div className="l-wrap l-rodape__linha">
          <p style={{ margin: 0 }}>
            {larkspur.nome} · {larkspur.descritor}
          </p>
          <p style={{ margin: 0 }}>Fictional restaurant, built for demonstration.</p>
        </div>
      </footer>

      {/* Barra fixa de reserva no celular */}
      <div className="l-fixo">
        <p className="l-fixo__linha">
          <b>$145</b>
          seven courses · one seating
        </p>
        <a className="l-btn l-btn--cobre" style={{ padding: "13px 24px", minHeight: "46px" }} href={larkspur.reservaUrl}>
          Reserve
        </a>
      </div>

      <BarraDemo nome={larkspur.nome} />
    </div>
  );
}
