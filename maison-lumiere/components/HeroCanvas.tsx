'use client';

import { Environment, Lightformer, MeshDistortMaterial } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { BackSide } from 'three';
import type { Group, Mesh } from 'three';

/**
 * A FORMA.
 *
 * Um corpo de vidro que respira, gira devagar e segue o mouse de
 * longe. Não é um objeto reconhecível de propósito — é luz presa em
 * vidro, que é o que a clínica vende.
 *
 * Como ele reage, em ordem de importância:
 *   mouse   → inclina para onde você está, com atraso
 *   rolagem → gira e afasta conforme a página desce
 *   tempo   → deformação lenta e contínua, a "respiração"
 *
 * ─────────────────────────────────────────────────────────────────
 * POR QUE NÃO É VIDRO
 * ─────────────────────────────────────────────────────────────────
 * A primeira versão usava `MeshTransmissionMaterial`, que é o caminho
 * óbvio para "orgânico e sofisticado". Rodei, olhei, e estava errado:
 * vidro só mostra o que há ATRÁS dele, e atrás dele não há cena
 * nenhuma — então a forma saía preta e esverdeada no meio de uma
 * página areia e dourada. Bonito num fundo escuro; fora da paleta
 * aqui.
 *
 * Esta versão é uma pérola: um corpo opaco cor de creme com um halo
 * dourado em volta. Fica na paleta por construção, custa uma fração do
 * que custava (sem alvo de renderização a cada quadro) e não depende
 * de haver mundo atrás.
 *
 * ─────────────────────────────────────────────────────────────────
 * O AMBIENTE É CONSTRUÍDO AQUI DENTRO
 * ─────────────────────────────────────────────────────────────────
 * O brilho especular vem de `<Lightformer>`: retângulos luminosos numa
 * cena própria, que o drei transforma num mapa de cubo na hora.
 *
 * A saída fácil seria `<Environment preset="studio" />`, mas preset do
 * drei BAIXA um HDR de uns 2 MB de um CDN de terceiros a cada visita —
 * peso, dependência externa e uma requisição que sai do seu domínio.
 * Montado à mão: zero download, zero terceiro, controle total da luz.
 */

function Forma({ progresso }: { progresso: React.RefObject<number> }) {
  const corpo = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);
  const grupo = useRef<Group>(null);

  useFrame((estado, delta) => {
    if (!corpo.current || !grupo.current) return;

    const t = estado.clock.elapsedTime;
    const mouse = estado.pointer;

    // O mouse puxa, mas com corda comprida. O fator depende do `delta`
    // e não do quadro, então o movimento é o mesmo em 60 e em 144 Hz.
    const forca = Math.min(1, delta * 2.2);
    grupo.current.rotation.x += (mouse.y * 0.2 - grupo.current.rotation.x) * forca;
    grupo.current.rotation.y += (mouse.x * 0.26 - grupo.current.rotation.y) * forca;

    // A rolagem gira e empurra para o fundo, de modo que a forma sai
    // de cena sozinha enquanto a próxima seção entra.
    const p = progresso.current ?? 0;
    corpo.current.rotation.y = t * 0.1 + p * 1.4;
    corpo.current.rotation.x = Math.sin(t * 0.16) * 0.12;
    corpo.current.position.y = Math.sin(t * 0.45) * 0.06 - p * 1.1;
    corpo.current.scale.setScalar(1 - p * 0.25);
    if (halo.current) halo.current.position.y = corpo.current.position.y;
  });

  return (
    <group ref={grupo} scale={0.74}>
      {/* O corpo. Icosaedro bem subdividido, e não uma esfera UV: a
          malha fica uniforme e a deformação não puxa as costuras dos
          polos. */}
      {/* detalhe 14 ≈ 4 mil triângulos. A primeira versão usava 32,
          que são ~22 mil — e como a deformação acontece no shader de
          VÉRTICE, cada um deles é recalculado a cada quadro. Em
          máquina sem aceleração gráfica isso sozinho travava a página
          por segundos. A 14 a silhueta continua lisa. */}
      <mesh ref={corpo}>
        <icosahedronGeometry args={[1, 14]} />
        <MeshDistortMaterial
          color="#f0dfc6"
          roughness={0.17}
          metalness={0.38}
          distort={0.42}
          speed={0.75}
          envMapIntensity={1.9}
        />
      </mesh>

      {/* O halo. Uma casca pelo lado de dentro: some no meio e
          acumula na borda, que é o contorno de luz de uma pérola.
          Fica justo (1,05) e fraco (0,10) de propósito — na primeira
          versão, a 1,16 e 0,18, virava um disco de borda dura em
          volta do objeto, que lia como tigela e não como brilho. */}
      <mesh ref={halo} scale={1.05}>
        <icosahedronGeometry args={[1, 6]} />
        <meshBasicMaterial
          color="#c9a97c"
          transparent
          opacity={0.1}
          side={BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** O estúdio: três fontes de luz com forma, que é o que o vidro
 *  reflete. Sem isto, o objeto fica preto. */
function Estudio() {
  return (
    <Environment resolution={128}>
      {/* A chave: um retângulo quente grande, em cima e à direita. */}
      <Lightformer
        form="rect"
        intensity={5}
        color="#fff3e2"
        position={[3, 4, 2]}
        scale={[6, 6, 1]}
        target={[0, 0, 0]}
      />
      {/* O preenchimento, frio e fraco, do lado oposto — só para a
          sombra não fechar em preto. */}
      <Lightformer
        form="rect"
        intensity={1.6}
        color="#dde6f2"
        position={[-5, -1, 2]}
        scale={[5, 5, 1]}
        target={[0, 0, 0]}
      />
      {/* O contorno dourado atrás, que desenha a borda do vidro contra
          o fundo claro da página. */}
      <Lightformer
        form="ring"
        intensity={3.2}
        color="#c9a97c"
        position={[0, 0.5, -4]}
        scale={[4, 4, 1]}
        target={[0, 0, 0]}
      />
      {/* Um chão claro, para o vidro ter algo embaixo. */}
      <Lightformer
        form="rect"
        intensity={1.2}
        color="#faf7f3"
        position={[0, -4, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[9, 9, 1]}
      />
    </Environment>
  );
}

export default function HeroCanvas({
  progresso,
}: {
  progresso: React.RefObject<number>;
}) {
  const [falhou, setFalhou] = useState(false);
  const moldura = useRef<HTMLDivElement>(null);
  const [naTela, setNaTela] = useState(true);

  // ─────────────────────────────────────────────────────────────
  // FORA DA TELA, PARADO
  // ─────────────────────────────────────────────────────────────
  // Sem isto, a cena continua renderizando a 60 quadros por segundo
  // enquanto a pessoa lê o FAQ dez telas abaixo — gastando bateria de
  // celular e ventilador de notebook para desenhar algo que ninguém
  // está vendo. O `frameloop="never"` para o laço; voltar a "always"
  // o retoma de onde estava.
  useEffect(() => {
    const alvo = moldura.current;
    if (!alvo) return;
    const observador = new IntersectionObserver(
      ([entrada]) => setNaTela(entrada.isIntersecting),
      { rootMargin: '120px' },
    );
    observador.observe(alvo);
    return () => observador.disconnect();
  }, []);

  // Sem WebGL (máquina antiga, driver bloqueado, navegador restrito) a
  // abertura não pode virar um buraco branco.
  if (falhou) return <Fallback />;

  return (
    <div ref={moldura} className="absolute inset-0">
    <Canvas
      frameloop={naTela ? 'always' : 'never'}
      // Teto de 2 no `dpr`: em tela 3x o custo triplica e ninguém
      // enxerga a diferença num objeto borrado por refração.
      dpr={[1, 2]}
      camera={{ position: [0, 0, 4.6], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', () => setFalhou(true));
      }}
      // Decorativo: a informação da abertura está no texto ao lado.
      aria-hidden="true"
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.4} />
      <Estudio />
      <Forma progresso={progresso} />
    </Canvas>
    </div>
  );
}

/** O mesmo clima, sem WebGL. */
function Fallback() {
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
      <div className="h-[72%] w-[72%] rounded-full bg-[radial-gradient(circle_at_34%_28%,#ffffff_0%,#f3e8d9_36%,#d9bb92_70%,#c9a97c_100%)] opacity-85" />
    </div>
  );
}
