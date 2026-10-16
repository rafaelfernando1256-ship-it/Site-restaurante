'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import { SemWebGL, temWebGL } from '@/components/SemWebGL';
import { site } from '@/content/site';
import { usePrefereMenosMovimento, useTelaGrande } from '@/lib/movimento';

/**
 * A ABERTURA.
 *
 * O canvas entra por `dynamic` com `ssr: false` por duas razões, e as
 * duas importam para a nota do Lighthouse:
 *
 *   · three.js + drei pesam uns 600 KB. Fora do pacote inicial, a
 *     primeira pintura não espera por eles.
 *   · WebGL não existe no servidor; renderizar isto no Node só
 *     geraria erro de hidratação.
 *
 * O texto NÃO depende do canvas. Ele é servidor-renderizado, legível e
 * clicável mesmo que o 3D nunca carregue — se a forma é o charme, o
 * texto é o conteúdo.
 */
const HeroCanvas = dynamic(() => import('./HeroCanvas'), {
  ssr: false,
  loading: () => <PlanoDeFundoEstatico />,
});

export function Hero() {
  const secao = useRef<HTMLElement>(null);
  const menosMovimento = usePrefereMenosMovimento();
  const telaGrande = useTelaGrande();

  // ─────────────────────────────────────────────────────────────
  // O 3D ESPERA A PÁGINA FICAR INTERATIVA
  // ─────────────────────────────────────────────────────────────
  // Montar o canvas junto com a página custava segundos de thread
  // bloqueada — medido com o Lighthouse: 5,4 s em máquina sem
  // aceleração gráfica. Enquanto isso, o botão "Agendar avaliação"
  // não respondia a clique.
  //
  // Então a ordem é esta: primeiro a página responde, depois a
  // decoração aparece. O `requestIdleCallback` espera a thread
  // esvaziar; o `setTimeout` é a rede para o Safari, que não o tem.
  //
  // A pergunta sobre WebGL também fica aqui porque no servidor não há
  // o que perguntar — e responder "não" na primeira renderização
  // causaria divergência de hidratação.
  const [podeTres, setPodeTres] = useState(false);
  useEffect(() => {
    const decide = () => setPodeTres(temWebGL());
    type ComIdle = { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const janela = window as unknown as ComIdle;
    if (typeof janela.requestIdleCallback === 'function') {
      const id = janela.requestIdleCallback(decide, { timeout: 2500 });
      return () => (window as unknown as { cancelIdleCallback?: (i: number) => void })
        .cancelIdleCallback?.(id);
    }
    const relogio = setTimeout(decide, 1200);
    return () => clearTimeout(relogio);
  }, []);

  // Um número de 0 a 1 com o quanto da abertura já passou. Vai para o
  // canvas por `ref` — e não por `state` — de propósito: atualizar
  // estado do React a cada pixel de rolagem re-renderizaria a árvore
  // sessenta vezes por segundo. O canvas lê o valor dentro do próprio
  // laço de animação.
  const progresso = useRef(0);
  const { scrollYProgress } = useScroll({
    target: secao,
    offset: ['start start', 'end start'],
  });

  useEffect(() => {
    return scrollYProgress.on('change', (v) => {
      progresso.current = v;
    });
  }, [scrollYProgress]);

  // O texto sobe mais devagar que a página: o paralaxe clássico, em
  // dose pequena.
  const yTexto = useTransform(scrollYProgress, [0, 1], ['0%', '38%']);
  const opacidadeTexto = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section
      ref={secao}
      className="grao relative flex min-h-[100svh] items-center overflow-hidden bg-areia-fundo"
    >
      {/* A luz de fundo, em CSS. Fica atrás do canvas e sustenta a
          cena mesmo enquanto o 3D ainda está carregando. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 62% 42%, rgba(201,169,124,0.20) 0%, rgba(245,239,232,0) 70%)',
        }}
        aria-hidden="true"
      />

      {/* A forma vive na metade direita da tela, não no meio: assim ela
          nunca disputa a leitura com o título. No celular ela sobe e
          fica atrás do texto, com opacidade menor — presente como
          atmosfera, não como obstáculo. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[-8%] h-[72%] opacity-45 lg:inset-y-0 lg:left-[46%] lg:right-[-6%] lg:h-auto lg:opacity-100"
        aria-hidden="true"
      >
        {/* O brilho que envolve a forma é CSS, não WebGL: um degradê
            custa zero por quadro e fica mais macio que qualquer halo
            de geometria. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 48%, rgba(255,250,243,0.9) 0%, rgba(232,221,208,0.45) 38%, rgba(245,239,232,0) 66%)',
          }}
        />
        {menosMovimento || !podeTres || !telaGrande ? (
          <PlanoDeFundoEstatico />
        ) : (
          <SemWebGL alternativa={<PlanoDeFundoEstatico />}>
            <HeroCanvas progresso={progresso} />
          </SemWebGL>
        )}
      </div>

      <motion.div
        className="relative z-10 mx-auto w-full max-w-[82rem] px-6 lg:px-10"
        style={menosMovimento ? undefined : { y: yTexto, opacity: opacidadeTexto }}
      >
        <div className="max-w-2xl">
          <Entrada atraso={0}>
            <p className="sobretitulo">{site.hero.sobretitulo}</p>
          </Entrada>

          <h1 className="mt-7 font-display text-[clamp(3.2rem,11vw,8.5rem)] font-light text-grafite">
            {site.hero.titulo.map((linha, i) => (
              <span key={linha} className="block overflow-hidden">
                <Entrada atraso={0.08 + i * 0.1} distancia={80}>
                  <span className="block">{linha}</span>
                </Entrada>
              </span>
            ))}
          </h1>

          <Entrada atraso={0.34}>
            <p className="mt-8 max-w-lg text-[1.02rem] leading-relaxed text-grafite-claro">
              {site.hero.texto}
            </p>
          </Entrada>

          <Entrada atraso={0.44}>
            <div className="mt-11 flex flex-col gap-3.5 xs:flex-row xs:items-center">
              <a
                href={site.hero.botaoPrimario.href}
                className="rounded-full bg-grafite px-8 py-4 text-center text-[0.82rem] tracking-wide text-areia transition-all duration-400 ease-maison hover:bg-grafite-claro"
              >
                {site.hero.botaoPrimario.rotulo}
              </a>
              <a
                href={site.hero.botaoSecundario.href}
                className="group inline-flex items-center justify-center gap-2.5 px-2 py-4 text-[0.82rem] tracking-wide text-grafite-claro transition-colors hover:text-grafite"
              >
                {site.hero.botaoSecundario.rotulo}
                <span className="h-px w-7 bg-dourado transition-all duration-400 ease-maison group-hover:w-11" />
              </a>
            </div>
          </Entrada>
        </div>
      </motion.div>

      <Entrada atraso={0.8}>
        <div className="absolute bottom-9 left-1/2 z-10 -translate-x-1/2 text-center">
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-grafite-suave">
            {site.hero.rolar}
          </p>
          <span className="mx-auto mt-3 block h-9 w-px bg-gradient-to-b from-dourado to-transparent" />
        </div>
      </Entrada>
    </section>
  );
}

/** Entrada escalonada da abertura. Diferente do `Revelar` das outras
 *  seções: aqui não se espera rolagem, a animação começa de cara. */
function Entrada({
  children,
  atraso,
  distancia = 22,
}: {
  children: React.ReactNode;
  atraso: number;
  distancia?: number;
}) {
  const menosMovimento = usePrefereMenosMovimento();
  if (menosMovimento) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: distancia }}
      animate={{ opacity: 1, y: 0 }}
      // O atraso base espera a cortina de abertura sair.
      transition={{ duration: 0.95, delay: 1.0 + atraso, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** O que aparece no lugar do 3D: para quem pediu menos movimento, e
 *  enquanto o canvas ainda está baixando. */
function PlanoDeFundoEstatico() {
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
      <div
        className="aspect-square w-[78%] rounded-full opacity-80 blur-[0.5px]"
        style={{
          background:
            'radial-gradient(circle at 36% 30%, #ffffff 0%, #f3e8d9 34%, #d9bb92 68%, #c9a97c 100%)',
        }}
      />
    </div>
  );
}
