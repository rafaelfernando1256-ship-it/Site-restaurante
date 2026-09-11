import type { Metadata } from "next";
import Image from "next/image";
import { alfaSlab, libreBaskerville } from "@/lib/fontes";
import { domAurelio } from "@/content/demo-dom-aurelio";
import BarraDemo from "@/components/demos/BarraDemo";
import Revelar from "@/components/ui/Revelar";
import TopoAurelio from "./TopoAurelio";
import SeloAberto from "./SeloAberto";
import "./aurelio.css";

export const metadata: Metadata = {
  title: "Barbearia Dom Aurélio · Desde 1978 (projeto demonstrativo)",
  description:
    "Projeto demonstrativo de site para barbearia clássica de bairro: telefone como ação principal, preços grandes, história da família e localização ampliada.",
};

const zap = (msg: string) =>
  `https://wa.me/${domAurelio.whatsapp}?text=${encodeURIComponent(msg)}`;

export default function PaginaAurelio() {
  return (
    <div className={`tema-aurelio ${alfaSlab.variable} ${libreBaskerville.variable}`} id="topo">
      <TopoAurelio />

      {/* ── Hero ── */}
      <section className="a-hero">
        <div className="a-wrap a-hero__grade">
          <div>
            <p className="a-hero__selo">{domAurelio.hero.selo}</p>
            <h1>{domAurelio.hero.titulo}</h1>
            <p className="a-hero__sub">{domAurelio.hero.subtitulo}</p>
            <div className="a-hero__acoes">
              <a className="a-btn a-btn--vermelho" href={`tel:${domAurelio.telefone}`}>
                {domAurelio.hero.cta}: {domAurelio.telefoneVisivel}
              </a>
              <a className="a-btn a-btn--linha" href="#onde">
                {domAurelio.hero.ctaSecundario}
              </a>
            </div>
          </div>
          <div className="a-hero__arte">
            <Image
              src="/arte/aurelio/hero.svg"
              alt="Placa pintada da Barbearia Dom Aurélio, com poste de barbeiro e tesoura"
              width={1600}
              height={1100}
              priority
            />
          </div>
        </div>
      </section>

      {/* ── Faixa de contato: o que esse público mais procura ── */}
      <div className="a-faixa">
        <div className="a-wrap a-faixa__grade">
          <div className="a-faixa__item">
            <span className="a-faixa__rotulo">Telefone</span>
            <a className="a-faixa__valor" href={`tel:${domAurelio.telefone}`}>
              {domAurelio.telefoneVisivel}
            </a>
          </div>
          <div className="a-faixa__item">
            <span className="a-faixa__rotulo">Endereço</span>
            <span className="a-faixa__valor" style={{ fontSize: "1.05rem" }}>
              {domAurelio.endereco.linha1}
            </span>
          </div>
          <div className="a-faixa__item">
            <span className="a-faixa__rotulo">Atendimento</span>
            <span className="a-faixa__valor" style={{ fontSize: "1.05rem" }}>
              Por ordem de chegada
            </span>
          </div>
        </div>
      </div>

      {/* ── História ── */}
      <section className="a-secao" id="historia">
        <div className="a-wrap">
          <p className="a-etiqueta">{domAurelio.historia.etiqueta}</p>
          <h2 className="a-titulo">{domAurelio.historia.titulo}</h2>

          <div className="a-marcos">
            {domAurelio.historia.marcos.map((m, i) => (
              <Revelar key={m.ano} atraso={i * 0.08} className="a-marco">
                <p className="a-marco__ano">{m.ano}</p>
                <h3>{m.titulo}</h3>
                <p>{m.texto}</p>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preços ── */}
      <section className="a-secao a-borda a-fundo-2" id="precos">
        <div className="a-wrap">
          <p className="a-etiqueta">{domAurelio.servicos.etiqueta}</p>
          <h2 className="a-titulo">{domAurelio.servicos.titulo}</h2>

          <div className="a-precos">
            {domAurelio.servicos.lista.map((s) => (
              <div key={s.nome} className="a-preco">
                <span className="a-preco__nome">{s.nome}</span>
                <span className="a-preco__valor">{s.preco}</span>
              </div>
            ))}
            <p className="a-precos__obs">{domAurelio.servicos.observacao}</p>
          </div>
        </div>
      </section>

      {/* ── O ofício ── */}
      <section className="a-secao a-borda">
        <div className="a-wrap">
          <p className="a-etiqueta">{domAurelio.oficio.etiqueta}</p>
          <h2 className="a-titulo">{domAurelio.oficio.titulo}</h2>

          <div className="a-oficio">
            {domAurelio.oficio.itens.map((o, i) => (
              <Revelar key={o.titulo} atraso={i * 0.07} className="a-oficio__item">
                <h3>{o.titulo}</h3>
                <p>{o.texto}</p>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ── A família ── */}
      <section className="a-secao a-borda a-fundo-2" id="familia">
        <div className="a-wrap">
          <p className="a-etiqueta">{domAurelio.familia.etiqueta}</p>
          <h2 className="a-titulo">{domAurelio.familia.titulo}</h2>

          <div className="a-familia">
            {domAurelio.familia.lista.map((p, i) => (
              <Revelar key={p.nome} atraso={i * 0.08} className="a-pessoa">
                <Image
                  src={`/arte/aurelio/familia-${i + 1}.svg`}
                  alt={`Retrato ilustrado de ${p.nome}`}
                  width={600}
                  height={700}
                />
                <h3>{p.nome}</h3>
                <p className="a-pessoa__papel">
                  {p.papel} · {p.desde}
                </p>
                <p>{p.nota}</p>
              </Revelar>
            ))}
          </div>
        </div>
      </section>

      {/* ── Galeria + avaliação ── */}
      <section className="a-secao a-borda">
        <div className="a-wrap">
          <p className="a-etiqueta">A casa</p>
          <h2 className="a-titulo">Do jeito que sempre foi</h2>

          <div className="a-galeria">
            {[1, 2, 3, 4].map((n) => (
              <Image
                key={n}
                src={`/arte/aurelio/galeria-${n}.svg`}
                alt="Detalhe da barbearia"
                width={800}
                height={640}
                loading="lazy"
              />
            ))}
          </div>

          <div className="a-avaliacao">
            <div>
              <p className="a-avaliacao__nota">{domAurelio.avaliacao.nota}</p>
              <p className="a-avaliacao__estrelas" aria-hidden>
                ★★★★★
              </p>
            </div>
            <div style={{ flex: 1, minWidth: "220px" }}>
              <p style={{ margin: 0 }}>
                <strong>{domAurelio.avaliacao.quantidade} avaliações no Google.</strong> Quem mora
                no bairro conhece — e quem passa uma vez, volta.
              </p>
            </div>
            <a
              className="a-btn a-btn--linha"
              href="https://www.google.com/maps"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver avaliações
            </a>
          </div>
        </div>
      </section>

      {/* ── Onde fica: a seção ampliada deste projeto ── */}
      <section className="a-secao a-borda a-fundo-2" id="onde">
        <div className="a-wrap">
          <p className="a-etiqueta">{domAurelio.localizacao.etiqueta}</p>
          <h2 className="a-titulo">{domAurelio.localizacao.titulo}</h2>
          <p className="a-apoio" style={{ marginTop: "1rem" }}>
            {domAurelio.localizacao.texto}
          </p>

          <div className="a-local">
            <div>
              <h3 style={{ fontSize: "1.4rem" }}>
                Horário
                <SeloAberto />
              </h3>
              <ul className="a-horarios">
                {domAurelio.horarios.map((h) => (
                  <li key={h.dia}>
                    <span>{h.dia}</span>
                    <span>{h.hora}</span>
                  </li>
                ))}
              </ul>

              <p style={{ marginTop: "1.6rem" }}>
                <strong>{domAurelio.endereco.linha1}</strong>
                <br />
                {domAurelio.endereco.linha2}
                <br />
                <span style={{ color: "var(--tinta-2)" }}>{domAurelio.endereco.referencia}</span>
                <br />
                <span style={{ color: "var(--tinta-2)" }}>{domAurelio.endereco.estacionamento}</span>
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "1.4rem" }}>
                <a className="a-btn a-btn--vermelho" href={`tel:${domAurelio.telefone}`}>
                  Ligar agora
                </a>
                <a
                  className="a-btn a-btn--zap"
                  href={zap("Olá! Gostaria de saber se tem fila agora na barbearia.")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="a-mapa">
              <div className="a-mapa__aviso">
                <p style={{ margin: 0 }}>
                  <strong>Mapa do Google</strong>
                  <br />
                  No site publicado, o mapa aparece aqui com o endereço marcado.
                  <br />
                  <a
                    href="https://www.google.com/maps"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--azul)", textDecoration: "underline", display: "inline-block", padding: "10px 4px", minHeight: "44px" }}
                  >
                    Abrir no Google Maps
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="a-rodape">
        <div className="a-wrap a-rodape__linha">
          <p style={{ margin: 0 }}>
            {domAurelio.nome} · {domAurelio.descritor}
          </p>
          <p style={{ margin: 0 }}>Barbearia fictícia, criada para demonstração.</p>
        </div>
      </footer>

      {/* Barra fixa: ligar tem o dobro do espaço do WhatsApp */}
      <div className="a-fixo">
        <a className="a-btn a-btn--vermelho" href={`tel:${domAurelio.telefone}`}>
          Ligar agora
        </a>
        <a
          className="a-btn a-btn--zap"
          href={zap("Olá! Gostaria de saber se tem fila agora na barbearia.")}
          target="_blank"
          rel="noopener noreferrer"
        >
          Zap
        </a>
      </div>

      <BarraDemo nome="Dom Aurélio" />
    </div>
  );
}
