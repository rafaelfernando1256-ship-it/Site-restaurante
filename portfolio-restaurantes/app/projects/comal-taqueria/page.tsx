import type { Metadata } from "next";
import Image from "next/image";
import { archivoBlack, spaceGrotesk } from "@/lib/fontes-comal";
import { comal } from "@/content/demo-comal-taqueria";
import BarraDemo from "@/components/demos/BarraDemo";
import Revelar from "@/components/ui/Revelar";
import TopoComal from "./TopoComal";
import "./comal.css";

export const metadata: Metadata = {
  title: "Comal Street Tacos · Order ahead (demo project)",
  description:
    "Demo website for a fast-casual taquería: order-ahead as the fixed action, a photo-first menu, daily specials and catering inquiries.",
};

export default function PaginaComal() {
  return (
    <div className={`tema-comal ${archivoBlack.variable} ${spaceGrotesk.variable}`} id="top">
      <TopoComal />

      {/* ── Hero ── */}
      <section className="c-hero">
        <div className="c-wrap c-hero__grade">
          <div>
            <h1>
              {comal.hero.linha1}
              <em>{comal.hero.linha2}</em>
            </h1>
            <p className="c-hero__sub">{comal.hero.subtitulo}</p>
            <div className="c-hero__acoes">
              <a className="c-btn c-btn--chile" href={comal.pedidoUrl}>
                {comal.hero.cta}
              </a>
              <a className="c-btn c-btn--linha" href="#menu">
                {comal.hero.ctaSecundario}
              </a>
            </div>
          </div>
          <figure className="c-hero__foto">
            <Image
              src="/arte/comal/hero.svg"
              alt="Three street tacos on a hot comal"
              width={900}
              height={1000}
              priority
            />
          </figure>
        </div>
      </section>

      {/* ── Faixa rolante de prova ── */}
      <div className="c-faixa">
        <div className="c-faixa__trilho">
          {[0, 1].map((n) => (
            <ul key={n} aria-hidden={n === 1}>
              {comal.marquee.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* ── Menu ── */}
      <section className="c-secao" id="menu">
        <div className="c-wrap">
          <Revelar>
            <p className="c-etiqueta">{comal.menu.etiqueta}</p>
            <h2 className="c-titulo">{comal.menu.titulo}</h2>
            <p className="c-apoio">{comal.menu.texto}</p>
          </Revelar>

          {comal.menu.grupos.map((g, gi) => (
            <div className="c-grupo" key={g.nome}>
              <Revelar atraso={0.04 * gi}>
                <h3>{g.nome}</h3>
              </Revelar>
              <div className="c-itens">
                {g.itens.map((it) => (
                  <div className="c-item" key={it.nome}>
                    <p className="c-item__nome">
                      {it.nome}
                      {it.tag && <span className="c-tag">{it.tag}</span>}
                    </p>
                    <p className="c-item__preco">{it.preco}</p>
                    <p className="c-item__desc">{it.descricao}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Especiais do dia ── */}
      <section className="c-secao c-borda c-fundo-2" id="today">
        <div className="c-wrap">
          <Revelar>
            <p className="c-etiqueta">{comal.especiais.etiqueta}</p>
            <h2 className="c-titulo">{comal.especiais.titulo}</h2>
            <p className="c-apoio">{comal.especiais.texto}</p>
          </Revelar>
          <div className="c-especiais">
            {comal.especiais.lista.map((e, i) => (
              <Revelar key={e.nome} atraso={0.06 * i}>
                <article className="c-especial">
                  <div>
                    <h3>{e.nome}</h3>
                    <p>{e.descricao}</p>
                  </div>
                  <b>{e.preco}</b>
                </article>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section className="c-secao c-borda" id="how">
        <div className="c-wrap">
          <Revelar>
            <p className="c-etiqueta">{comal.comoFunciona.etiqueta}</p>
            <h2 className="c-titulo">{comal.comoFunciona.titulo}</h2>
          </Revelar>
          <div className="c-passos">
            {comal.comoFunciona.passos.map((p, i) => (
              <Revelar key={p.numero} atraso={0.06 * i}>
                <article className="c-passo">
                  <span className="c-passo__n">{p.numero}</span>
                  <h3>{p.titulo}</h3>
                  <p>{p.texto}</p>
                </article>
              </Revelar>
            ))}
          </div>
          <Revelar atraso={0.2}>
            <p className="c-apoio" style={{ marginTop: "28px", fontStyle: "italic" }}>
              {comal.comoFunciona.nota}
            </p>
          </Revelar>
        </div>
      </section>

      {/* ── Galeria ── */}
      <section className="c-secao c-borda c-fundo-2" id="food">
        <div className="c-wrap">
          <Revelar>
            <p className="c-etiqueta">{comal.galeria.etiqueta}</p>
            <h2 className="c-titulo">{comal.galeria.titulo}</h2>
            <p className="c-apoio">{comal.galeria.texto}</p>
          </Revelar>
          <div className="c-galeria">
            {[1, 2, 3, 4, 5, 6].map((n, i) => (
              <Revelar key={n} atraso={0.03 * i}>
                <Image
                  src={`/arte/comal/food-${n}.svg`}
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

      {/* ── Catering + avaliação ── */}
      <section className="c-secao c-borda" id="catering">
        <div className="c-wrap c-duplo">
          <Revelar>
            <article className="c-caixa c-caixa--chile">
              <p className="c-etiqueta">{comal.catering.etiqueta}</p>
              <h2 className="c-titulo" style={{ fontSize: "clamp(1.7rem,3.6vw,2.6rem)" }}>
                {comal.catering.titulo}
              </h2>
              <p className="c-apoio">{comal.catering.texto}</p>
              <a className="c-btn c-btn--masa" href={`tel:${comal.telefone}`} style={{ marginTop: "22px" }}>
                {comal.catering.cta}
              </a>
            </article>
          </Revelar>
          <Revelar atraso={0.08}>
            <article className="c-caixa">
              <div className="c-nota">
                <b>{comal.avaliacao.nota}</b>
                <span className="c-estrelas" aria-hidden>
                  ★★★★★
                </span>
              </div>
              <p className="c-apoio" style={{ marginTop: "10px" }}>
                {comal.avaliacao.quantidade} Google reviews. Read them before you order.
              </p>
              <a
                className="c-btn c-btn--linha"
                href="https://www.google.com/maps"
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: "20px" }}
              >
                See on Google
              </a>
            </article>
          </Revelar>
        </div>
      </section>

      {/* ── Onde fica ── */}
      <section className="c-secao c-borda c-fundo-2" id="find">
        <div className="c-wrap c-local">
          <Revelar>
            <div>
              <p className="c-etiqueta">Find us</p>
              <h2 className="c-titulo">
                East Cesar Chavez,
                <br />
                <em style={{ fontStyle: "normal", color: "var(--masa)" }}>easy to find</em>
              </h2>
              <p className="c-apoio">
                {comal.endereco.linha1}
                <br />
                {comal.endereco.linha2}
                <br />
                {comal.endereco.referencia}
                <br />
                {comal.endereco.estacionamento}
              </p>
              <a
                className="c-btn c-btn--chile"
                href="https://www.google.com/maps"
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: "24px" }}
              >
                Get directions
              </a>
            </div>
          </Revelar>
          <Revelar atraso={0.08}>
            <div className="c-caixa">
              <h3 style={{ fontSize: "1.3rem" }}>Opening hours</h3>
              <ul className="c-horarios">
                {comal.horarios.map((h) => (
                  <li key={h.dia}>
                    <span>{h.dia}</span>
                    <span>{h.hora}</span>
                  </li>
                ))}
              </ul>
              <p className="c-apoio" style={{ marginTop: "18px", fontSize: "0.88rem" }}>
                {comal.instagram} · {comal.telefoneVisivel}
              </p>
            </div>
          </Revelar>
        </div>
      </section>

      <footer className="c-rodape">
        <div className="c-wrap c-rodape__linha">
          <p style={{ margin: 0 }}>
            {comal.nome} · {comal.descritor}
          </p>
          <p style={{ margin: 0 }}>Fictional restaurant, built for demonstration.</p>
        </div>
      </footer>

      {/* Barra fixa de pedido */}
      <div className="c-fixo">
        <p className="c-fixo__linha">
          <b>Ready in 12 minutes</b>
          Order ahead, skip the line
        </p>
        <a className="c-btn c-btn--chile" style={{ padding: "12px 22px", minHeight: "46px" }} href={comal.pedidoUrl}>
          Order
        </a>
      </div>

      <BarraDemo nome={comal.nomeCurto} />
    </div>
  );
}
