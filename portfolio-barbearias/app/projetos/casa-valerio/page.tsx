import type { Metadata } from "next";
import Image from "next/image";
import { marcellus, jost } from "@/lib/fontes";
import { valerio } from "@/content/demo-casa-valerio";
import BarraDemo from "@/components/demos/BarraDemo";
import Revelar from "@/components/ui/Revelar";
import TopoValerio from "./TopoValerio";
import "./valerio.css";

export const metadata: Metadata = {
  title: "Casa Valério · Barbearia Privê (projeto demonstrativo)",
  description:
    "Projeto demonstrativo de site para barbearia premium: ritual de atendimento, carta de serviços, clube de assinatura e reserva por WhatsApp.",
};

const zap = (msg: string) =>
  `https://wa.me/${valerio.whatsapp}?text=${encodeURIComponent(msg)}`;

export default function PaginaValerio() {
  const linkReserva = zap(valerio.reserva.mensagem);

  return (
    <div className={`tema-valerio ${marcellus.variable} ${jost.variable}`} id="topo">
      <TopoValerio linkReserva={linkReserva} />

      {/* ── Hero ── */}
      <section className="v-hero">
        <div className="v-hero__fundo">
          <Image
            className="v-hero__arte-alta"
            src="/arte/valerio/hero-alto.svg"
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
          <Image
            className="v-hero__arte-larga"
            src="/arte/valerio/hero.svg"
            alt=""
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className="v-hero__veu" aria-hidden />
        <div className="v-wrap v-hero__conteudo">
          <p className="v-etiqueta">{valerio.hero.etiqueta}</p>
          <h1>{valerio.hero.titulo}</h1>
          <p className="v-hero__sub">{valerio.hero.subtitulo}</p>
          <div className="v-hero__acoes">
            <a className="v-btn v-btn--ouro" href={linkReserva} target="_blank" rel="noopener noreferrer">
              {valerio.hero.cta}
            </a>
            <a className="v-btn v-btn--linha" href="#clube">
              {valerio.hero.ctaSecundario}
            </a>
          </div>
        </div>
      </section>

      {/* ── O ritual ── */}
      <section className="v-secao v-borda-topo" id="ritual">
        <div className="v-wrap">
          <p className="v-etiqueta">{valerio.ritual.etiqueta}</p>
          <h2 className="v-titulo">{valerio.ritual.titulo}</h2>
          <p className="v-apoio" style={{ marginTop: "1.2rem" }}>
            {valerio.ritual.texto}
          </p>

          <div className="v-ritual">
            {valerio.ritual.passos.map((p, i) => (
              <Revelar key={p.numero} atraso={i * 0.06} className="v-ritual__passo">
                <span className="v-ritual__num">{p.numero}</span>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ── Carta de serviços ── */}
      <section className="v-secao v-borda-topo" id="carta">
        <div className="v-wrap">
          <p className="v-etiqueta">{valerio.servicos.etiqueta}</p>
          <h2 className="v-titulo">{valerio.servicos.titulo}</h2>
          <p className="v-apoio" style={{ marginTop: "1.2rem" }}>
            {valerio.servicos.texto}
          </p>

          <div className="v-carta">
            {valerio.servicos.lista.map((s, i) => (
              <Revelar key={s.nome} atraso={i * 0.04} className="v-item">
                <div>
                  <h3>{s.nome}</h3>
                  <p>{s.descricao}</p>
                </div>
                <div>
                  <span className="v-item__preco">{s.preco}</span>
                  <span className="v-item__duracao">{s.duracao}</span>
                </div>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mestres ── */}
      <section className="v-secao v-borda-topo" id="mestres">
        <div className="v-wrap">
          <p className="v-etiqueta">{valerio.mestres.etiqueta}</p>
          <h2 className="v-titulo">{valerio.mestres.titulo}</h2>

          <div className="v-mestres">
            {valerio.mestres.lista.map((m, i) => (
              <Revelar key={m.nome} atraso={i * 0.08} className="v-mestre">
                <Image
                  src={`/arte/valerio/mestre-${i + 1}.svg`}
                  alt={`Retrato ilustrado de ${m.nome}`}
                  width={600}
                  height={720}
                />
                <div className="v-mestre__corpo">
                  <h3>{m.nome}</h3>
                  <p className="v-mestre__papel">{m.papel}</p>
                  <p>
                    {m.anos} · {m.especialidade}
                  </p>
                </div>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ── Clube de assinatura ── */}
      <section className="v-secao v-borda-topo" id="clube">
        <div className="v-wrap">
          <p className="v-etiqueta">{valerio.clube.etiqueta}</p>
          <h2 className="v-titulo">{valerio.clube.titulo}</h2>
          <p className="v-apoio" style={{ marginTop: "1.2rem" }}>
            {valerio.clube.texto}
          </p>

          <div className="v-planos">
            {valerio.clube.planos.map((p, i) => (
              <Revelar key={p.nome} atraso={i * 0.07} className="v-plano" data-destaque={p.destaque}>
                <h3>{p.nome}</h3>
                <p className="v-plano__preco">
                  {p.preco}
                  <span>{p.periodo}</span>
                </p>
                <ul>
                  {p.inclui.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <a
                  className={`v-btn ${p.destaque ? "v-btn--ouro" : "v-btn--linha"}`}
                  style={{ marginTop: "28px" }}
                  href={zap(`Olá! Gostaria de assinar o plano ${p.nome} do Clube Valério.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Assinar
                </a>
              </Revelar>
            ))}
          </div>

          <div className="v-presente">
            <h3 style={{ fontSize: "1.8rem" }}>{valerio.presente.titulo}</h3>
            <p className="v-apoio" style={{ marginTop: "0.8rem" }}>
              {valerio.presente.texto}
            </p>
            <a
              className="v-btn v-btn--linha"
              style={{ marginTop: "24px" }}
              href={zap("Olá! Gostaria de comprar um vale-presente da Casa Valério.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              {valerio.presente.cta}
            </a>
          </div>
        </div>
      </section>

      {/* ── Galeria ── */}
      <section className="v-secao v-borda-topo">
        <div className="v-wrap">
          <p className="v-etiqueta">A casa</p>
          <h2 className="v-titulo">Cada detalhe pensado</h2>

          <div className="v-galeria">
            {["ambiente", "galeria-1", "galeria-2", "galeria-3"].map((nome, i) => (
              <figure key={nome}>
                <Image
                  src={`/arte/valerio/${nome}.svg`}
                  alt="Detalhe do ambiente da Casa Valério"
                  width={800}
                  height={640}
                  loading={i === 0 ? "eager" : "lazy"}
                />
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reserva e localização ── */}
      <section className="v-secao v-borda-topo" id="casa">
        <div className="v-wrap">
          <div style={{ display: "grid", gap: "clamp(32px, 5vw, 64px)" }} className="v-reserva-grade">
            <div>
              <p className="v-etiqueta">{valerio.reserva.etiqueta}</p>
              <h2 className="v-titulo">{valerio.reserva.titulo}</h2>
              <p className="v-apoio" style={{ marginTop: "1.2rem" }}>
                {valerio.reserva.texto}
              </p>
              <a
                className="v-btn v-btn--ouro"
                style={{ marginTop: "28px" }}
                href={linkReserva}
                target="_blank"
                rel="noopener noreferrer"
              >
                {valerio.reserva.cta}
              </a>
            </div>

            <dl className="v-info">
              <dt>Endereço</dt>
              <dd>
                {valerio.endereco.linha1}
                <br />
                {valerio.endereco.linha2}
                <br />
                <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                  {valerio.endereco.referencia}
                </span>
              </dd>

              <dt>Telefone</dt>
              <dd>{valerio.telefoneVisivel}</dd>

              <dt>Horários</dt>
              <dd style={{ marginBottom: 0 }}>
                <ul className="v-horarios">
                  {valerio.horarios.map((h) => (
                    <li key={h.dia}>
                      <span>{h.dia}</span>
                      <span>{h.hora}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </dl>
          </div>
        </div>
      </section>

      <footer className="v-rodape">
        <div className="v-wrap v-rodape__linha">
          <p style={{ margin: 0 }}>
            {valerio.nome} · {valerio.descritor}
          </p>
          <p style={{ margin: 0 }}>Barbearia fictícia, criada para demonstração.</p>
        </div>
      </footer>

      {/* Barra fixa de reserva no celular */}
      <div className="v-fixo">
        <p className="v-fixo__preco">
          A partir de R$ 120
          <span>Corte Valério</span>
        </p>
        <a
          className="v-btn v-btn--ouro"
          style={{ padding: "13px 24px", fontSize: "0.7rem" }}
          href={linkReserva}
          target="_blank"
          rel="noopener noreferrer"
        >
          Reservar horário
        </a>
      </div>

      <BarraDemo nome={valerio.nome} />
    </div>
  );
}
