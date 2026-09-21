import type { Metadata } from "next";
import Image from "next/image";
import { alfaSlab, libreBaskerville } from "@/lib/fontes-diner";
import { bluePlate } from "@/content/demo-blue-plate-diner";
import BarraDemo from "@/components/demos/BarraDemo";
import Revelar from "@/components/ui/Revelar";
import TopoDiner from "./TopoDiner";
import "./diner.css";

export const metadata: Metadata = {
  title: "Blue Plate Diner · Since 1961 (demo project)",
  description:
    "Demo website for a classic neighborhood diner: the phone as the main action, the full menu in large type, holiday hours and parking said out loud.",
};

export default function PaginaDiner() {
  return (
    <div className={`tema-diner ${alfaSlab.variable} ${libreBaskerville.variable}`} id="top">
      <TopoDiner />

      {/* ── Hero ── */}
      <section className="d-hero">
        <div className="d-wrap d-hero__grade">
          <div>
            <p className="d-hero__selo">{bluePlate.hero.selo}</p>
            <h1>{bluePlate.hero.titulo}</h1>
            <p className="d-hero__sub">{bluePlate.hero.subtitulo}</p>
            <div className="d-hero__acoes">
              <a className="d-btn d-btn--vermelho" href={`tel:${bluePlate.telefone}`}>
                {bluePlate.hero.cta}: {bluePlate.telefoneVisivel}
              </a>
              <a className="d-btn d-btn--linha" href="#menu">
                {bluePlate.hero.ctaSecundario}
              </a>
            </div>
          </div>
          <figure className="d-hero__foto">
            <Image
              src="/arte/diner/hero.svg"
              alt="The Blue Plate: two eggs, bacon and home fries"
              width={900}
              height={1000}
              priority
            />
          </figure>
        </div>
      </section>

      {/* ── Faixa: o que quem liga quer saber ── */}
      <section className="d-faixa">
        <div className="d-wrap d-faixa__grade">
          <p style={{ margin: 0 }}>
            <span className="d-faixa__rotulo">Address</span>
            <strong>{bluePlate.endereco.linha1}</strong>
            <br />
            {bluePlate.endereco.referencia}
          </p>
          <p style={{ margin: 0 }}>
            <span className="d-faixa__rotulo">Parking</span>
            <strong>{bluePlate.endereco.estacionamento}</strong>
          </p>
          <p style={{ margin: 0 }}>
            <span className="d-faixa__rotulo">Seating</span>
            <strong>No reservations — walk in</strong>
          </p>
        </div>
      </section>

      {/* ── História ── */}
      <section className="d-secao d-borda" id="story">
        <div className="d-wrap">
          <Revelar>
            <p className="d-etiqueta">{bluePlate.historia.etiqueta}</p>
            <h2 className="d-titulo">{bluePlate.historia.titulo}</h2>
          </Revelar>
          <div className="d-marcos">
            {bluePlate.historia.marcos.map((m, i) => (
              <Revelar key={m.ano} atraso={0.05 * i}>
                <article className="d-marco">
                  <span className="d-marco__ano">{m.ano}</span>
                  <div>
                    <h3>{m.titulo}</h3>
                    <p>{m.texto}</p>
                  </div>
                </article>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ── Menu ── */}
      <section className="d-secao d-borda d-fundo-2" id="menu">
        <div className="d-wrap">
          <Revelar>
            <p className="d-etiqueta">{bluePlate.menu.etiqueta}</p>
            <h2 className="d-titulo">{bluePlate.menu.titulo}</h2>
          </Revelar>

          {bluePlate.menu.grupos.map((g, gi) => (
            <div className="d-grupo" key={g.nome}>
              <Revelar atraso={0.04 * gi}>
                <h3>{g.nome}</h3>
              </Revelar>
              <div className="d-itens">
                {g.itens.map((it) => (
                  <div className="d-item" key={it.nome}>
                    <p className="d-item__nome">{it.nome}</p>
                    <p className="d-item__preco">{it.preco}</p>
                    <p className="d-item__desc">{it.descricao}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Revelar atraso={0.1}>
            <p className="d-obs">{bluePlate.menu.observacao}</p>
          </Revelar>
        </div>
      </section>

      {/* ── Ofício ── */}
      <section className="d-secao d-borda">
        <div className="d-wrap">
          <Revelar>
            <p className="d-etiqueta">{bluePlate.oficio.etiqueta}</p>
            <h2 className="d-titulo">{bluePlate.oficio.titulo}</h2>
          </Revelar>
          <div className="d-cartoes">
            {bluePlate.oficio.itens.map((it, i) => (
              <Revelar key={it.titulo} atraso={0.06 * i}>
                <article className="d-cartao">
                  <h3>{it.titulo}</h3>
                  <p>{it.texto}</p>
                </article>
              </Revelar>
            ))}
          </div>

          <div className="d-galeria">
            {[1, 2, 3, 4].map((n, i) => (
              <Revelar key={n} atraso={0.03 * i}>
                <Image
                  src={`/arte/diner/gallery-${n}.svg`}
                  alt=""
                  width={700}
                  height={700}
                  loading="lazy"
                />
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quem está aqui ── */}
      <section className="d-secao d-borda d-fundo-2" id="people">
        <div className="d-wrap">
          <Revelar>
            <p className="d-etiqueta">{bluePlate.familia.etiqueta}</p>
            <h2 className="d-titulo">{bluePlate.familia.titulo}</h2>
          </Revelar>
          <div className="d-cartoes">
            {bluePlate.familia.lista.map((m, i) => (
              <Revelar key={m.nome} atraso={0.06 * i}>
                <article className="d-pessoa">
                  <Image
                    src={`/arte/diner/familia-${i + 1}.svg`}
                    alt=""
                    width={600}
                    height={700}
                    loading="lazy"
                  />
                  <h3>{m.nome}</h3>
                  <p className="d-pessoa__papel">
                    {m.papel} · {m.desde}
                  </p>
                  <p>{m.nota}</p>
                </article>
              </Revelar>
            ))}
          </div>

          <Revelar atraso={0.2}>
            <div className="d-avaliacao">
              <span className="d-avaliacao__nota">{bluePlate.avaliacao.nota}</span>
              <div>
                <p className="d-avaliacao__estrelas" aria-hidden style={{ margin: 0 }}>
                  ★★★★★
                </p>
                <p style={{ margin: "6px 0 0" }}>
                  <strong>{bluePlate.avaliacao.quantidade} Google reviews.</strong> People who live
                  around here know us — and anyone who walks in once comes back.
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "0.78rem", opacity: 0.72 }}>
                  {bluePlate.avaliacao.aviso}
                </p>
              </div>
              <a
                className="d-btn d-btn--linha"
                href="https://www.google.com/maps"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the reviews
              </a>
            </div>
          </Revelar>
        </div>
      </section>

      {/* ── Onde fica ── */}
      <section className="d-secao d-borda" id="find">
        <div className="d-wrap">
          <Revelar>
            <p className="d-etiqueta">{bluePlate.localizacao.etiqueta}</p>
            <h2 className="d-titulo">{bluePlate.localizacao.titulo}</h2>
            <p className="d-apoio">{bluePlate.localizacao.texto}</p>
          </Revelar>

          <div className="d-local" style={{ marginTop: "34px" }}>
            <Revelar>
              <div>
                <h3 style={{ fontSize: "1.5rem" }}>Opening hours</h3>
                <ul className="d-horarios">
                  {bluePlate.horarios.map((h) => (
                    <li key={h.dia}>
                      <span>{h.dia}</span>
                      <span>{h.hora}</span>
                    </li>
                  ))}
                </ul>
                <p className="d-obs" style={{ marginTop: "18px" }}>
                  {bluePlate.feriados}
                </p>
              </div>
            </Revelar>

            <Revelar atraso={0.08}>
              <div className="d-mapa">
                <p style={{ margin: 0 }}>
                  <strong>Google map</strong>
                  <br />
                  On the published site, the map sits here with the address pinned.
                </p>
                <p style={{ margin: "14px 0 0" }}>
                  {bluePlate.endereco.linha1}
                  <br />
                  {bluePlate.endereco.linha2}
                  <br />
                  {bluePlate.endereco.estacionamento}
                </p>
                <a
                  className="d-btn d-btn--linha"
                  href="https://www.google.com/maps"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginTop: "20px" }}
                >
                  Open in Google Maps
                </a>
              </div>
            </Revelar>
          </div>
        </div>
      </section>

      <footer className="d-rodape">
        <div className="d-wrap d-rodape__linha">
          <p style={{ margin: 0 }}>
            {bluePlate.nome} · {bluePlate.descritor}
          </p>
          <p style={{ margin: 0 }}>Fictional restaurant, built for demonstration.</p>
        </div>
      </footer>

      {/* Barra fixa: ligar e traçar rota */}
      <div className="d-fixo">
        <a className="d-btn d-btn--vermelho" href={`tel:${bluePlate.telefone}`}>
          Call us
        </a>
        <a
          className="d-btn d-btn--linha"
          href="https://www.google.com/maps"
          target="_blank"
          rel="noopener noreferrer"
        >
          Directions
        </a>
      </div>

      <BarraDemo nome={bluePlate.nome} />
    </div>
  );
}
