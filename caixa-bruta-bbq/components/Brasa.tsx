'use client';

/**
 * A BRASA — a única luz da página.
 *
 * Não há foto de churrasqueira aqui: o fogo é desenhado ao vivo, num
 * shader. A câmera olha a grelha de cima, em perspectiva: carvão em
 * pedaços (células de Voronoi entortadas por ruído), as frestas acesas
 * onde há calor embaixo, as barras de ferro com a quina pegando o
 * reflexo, chama baixa tremendo e fagulhas subindo. Pesa alguns KB, não megabytes de vídeo.
 *
 * Economia: para quando sai da tela ou a aba fica escondida, limita a
 * densidade de pixels, e com "reduzir movimento" desenha um quadro só.
 * Sem WebGL, fica o quadro pintado em CSS por baixo.
 */
import { useEffect, useRef } from 'react';

const VERTICE = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAGMENTO = `
precision highp float;
uniform vec2 res;
uniform float t;
uniform float corte;

float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 h2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float ruido(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h1(i), h1(i + vec2(1, 0)), u.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * ruido(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}
// x: distância à borda; y: sorteio da peça; z: distância ao centro
vec3 voronoi(vec2 x) {
  vec2 n = floor(x); vec2 f = fract(x);
  vec2 mg; vec2 mr; float md = 8.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = 0.15 + 0.7 * h2(n + g);
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  float centro = sqrt(md);
  md = 8.0;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j));
    vec2 o = 0.15 + 0.7 * h2(n + g);
    vec2 r = g + o - f;
    if (dot(mr - r, mr - r) > 0.00001) md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
  }
  return vec3(md, h1(n + mg), centro);
}
vec3 rampa(float x) {
  x = clamp(x, 0.0, 1.0);
  vec3 c = mix(vec3(0.0), vec3(0.32, 0.03, 0.01), smoothstep(0.0, 0.25, x));
  c = mix(c, vec3(0.78, 0.12, 0.04), smoothstep(0.2, 0.5, x));
  c = mix(c, vec3(0.97, 0.42, 0.08), smoothstep(0.45, 0.75, x));
  c = mix(c, vec3(1.0, 0.78, 0.36), smoothstep(0.75, 1.0, x));
  return c;
}

void main() {
  vec2 uv = gl_FragCoord.xy / res.xy;
  float asp = res.x / res.y;
  // perspectiva: embaixo está perto (peças grandes), em cima longe
  float z = 1.0 / (1.18 - uv.y * 0.98);
  vec2 chao = vec2((uv.x - 0.5) * asp * z, z);

  // ── o carvão: peças irregulares (o Voronoi entortado por ruído)
  vec2 c = chao * 4.4;
  c += 0.35 * vec2(fbm(c * 1.3), fbm(c * 1.3 + 7.0)) - 0.17;
  vec3 v = voronoi(c);
  float sorte = v.y;
  float tempo = t * 0.3;
  float vivo = fbm(c * 0.45 + vec2(tempo * 0.5, -tempo * 0.35));
  float calorPeca = smoothstep(0.5, 0.85, vivo + 0.3 * sorte);
  float pulso = 0.72 + 0.28 * sin(t * (0.7 + sorte * 1.9) + sorte * 30.0);
  float grao = fbm(c * 6.0 + sorte * 10.0);
  float fresta = 1.0 - smoothstep(0.0, 0.09 + 0.05 * grao, v.x);

  // miolo da peça: preto com veio; as quentes acendem de dentro para fora
  vec3 peca = mix(vec3(0.03, 0.028, 0.027), vec3(0.085, 0.078, 0.072), grao);
  float cinza = smoothstep(0.5, 0.8, grao) * (1.0 - calorPeca) * smoothstep(0.03, 0.25, v.x);
  peca = mix(peca, vec3(0.26, 0.245, 0.23), cinza * 0.6);
  float brasaDentro = calorPeca * pulso * smoothstep(0.75, 0.05, v.z) * smoothstep(0.25, 0.75, grao + 0.25);
  peca += rampa(brasaDentro * 0.85) * (0.3 + 0.7 * calorPeca);
  // a borda da peça pega o reflexo
  peca += rampa(0.5) * smoothstep(0.06, 0.0, abs(v.x - 0.07)) * calorPeca * 0.4;
  // as frestas brilham onde há calor embaixo, e apagam onde não há
  float fundo = smoothstep(0.25, 0.9, vivo) * pulso;
  vec3 cor = mix(peca, rampa(0.35 + 0.65 * fundo) * (0.15 + 0.85 * fundo), fresta);

  // ── longe, o carvão some no escuro
  cor *= smoothstep(1.0, 0.45, uv.y);

  // ── a chama baixa, tremendo sobre o leito
  vec2 fq = vec2(uv.x * asp * 2.4, uv.y * 3.2 - t * 1.2);
  float n = fbm(fq + vec2(fbm(fq * 1.6 + t * 0.3) * 1.3, 0.0));
  float chama = smoothstep(0.05, 0.55, n - uv.y * 0.9 - 0.12) * smoothstep(0.9, 0.2, uv.y);
  cor += rampa(0.5 + chama * 0.5) * chama * 0.5;

  // ── a grelha: barras em perspectiva, escuras, acesas por baixo
  float gx = (uv.x - 0.5) * asp * z;
  float barras = fract(gx * 2.6 + 0.5);
  float lado = barras - 0.5;
  float meia = 0.075;
  float naBarra = smoothstep(meia + 0.012, meia, abs(lado));
  vec3 ferro = vec3(0.02, 0.018, 0.017) + vec3(0.05, 0.03, 0.018) * fbm(vec2(gx * 30.0, z * 12.0));
  // só a quina de baixo pega o reflexo da brasa; o resto é ferro opaco
  float quina = smoothstep(0.022, 0.0, abs(lado + meia * 0.72));
  vec3 grelha = ferro + rampa(0.62) * quina * (0.35 + 0.55 * fundo);
  cor = mix(cor, grelha, naBarra * smoothstep(1.02, 0.8, uv.y));
  float trav = smoothstep(0.024, 0.017, abs(uv.y - corte));
  cor = mix(cor, vec3(0.02) + rampa(0.6) * smoothstep(corte + 0.024, corte - 0.024, uv.y) * 0.22, trav);

  // ── fagulhas
  for (int i = 0; i < 30; i++) {
    float fi = float(i);
    float vel = 0.05 + 0.09 * h1(vec2(fi, 3.1));
    float y = fract(h1(vec2(fi, 9.7)) + t * vel);
    float x = h1(vec2(fi, 1.3)) * asp + 0.06 * sin(t * (0.6 + h1(vec2(fi, 5.0))) + fi) * y;
    vec2 pos = vec2(x, 0.12 + y * 0.92);
    vec2 q = vec2(uv.x * asp, uv.y);
    float d = length((q - pos) * vec2(1.0, 0.6));
    float vida = (1.0 - y) * smoothstep(0.0, 0.1, y);
    float r = 0.0018 + 0.0024 * h1(vec2(fi, 7.7));
    cor += rampa(0.8 + 0.2 * vida) * smoothstep(r, 0.0, d) * vida * 1.8;
  }

  // ── fumaça no alto, e o quadro afundando no preto
  float fumaca = fbm(vec2(uv.x * asp * 1.5 + t * 0.03, uv.y * 2.0 - t * 0.08));
  cor = mix(cor, vec3(0.055, 0.05, 0.047), smoothstep(0.5, 1.0, uv.y) * fumaca * 0.7);
  float vinheta = smoothstep(0.0, 0.2, uv.x) * smoothstep(0.0, 0.2, 1.0 - uv.x);
  cor *= mix(0.55, 1.0, vinheta);
  cor = max(cor, vec3(0.031));
  gl_FragColor = vec4(cor, 1.0);
}
`;

type Props = {
  /** Altura da travessa da grelha, de 0 (embaixo) a 1 (em cima). */
  corte?: number;
  className?: string;
  rotulo?: string;
};

export default function Brasa({ corte = 0.12, className = '', rotulo }: Props) {
  const tela = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = tela.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
    if (!gl) return;

    const compila = (tipo: number, fonte: string) => {
      const s = gl.createShader(tipo)!;
      gl.shaderSource(s, fonte);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compila(gl.VERTEX_SHADER, VERTICE);
    const fs = compila(gl.FRAGMENT_SHADER, FRAGMENTO);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const p = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(p);
    gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'res');
    const uT = gl.getUniformLocation(prog, 't');
    gl.uniform1f(gl.getUniformLocation(prog, 'corte'), corte);

    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)');
    let quadro = 0;
    let visivel = true;
    const inicio = performance.now() - 7000; // começa já com fagulha no ar

    const mede = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, w, h);
    };

    const desenha = (agora: number) => {
      mede();
      gl.uniform1f(uT, (agora - inicio) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      canvas.dataset.pronto = '1';
    };

    const gira = (agora: number) => {
      desenha(agora);
      if (visivel && !quieto.matches && !document.hidden) quadro = requestAnimationFrame(gira);
      else quadro = 0;
    };
    const retoma = () => {
      if (!quadro && visivel && !document.hidden) quadro = requestAnimationFrame(gira);
    };

    const olho = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      if (visivel) retoma();
    }, { rootMargin: '100px' });
    olho.observe(canvas);
    const redimensiona = new ResizeObserver(() => { if (!quadro) desenha(performance.now()); });
    redimensiona.observe(canvas);
    document.addEventListener('visibilitychange', retoma);
    quieto.addEventListener('change', retoma);

    desenha(performance.now());
    retoma();

    return () => {
      cancelAnimationFrame(quadro);
      olho.disconnect();
      redimensiona.disconnect();
      document.removeEventListener('visibilitychange', retoma);
      quieto.removeEventListener('change', retoma);
      // Sem loseContext aqui: o React monta duas vezes em desenvolvimento,
      // e um contexto perdido não volta na segunda montagem.
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, [corte]);

  return (
    <div className={`brasa ${className}`} role={rotulo ? 'img' : undefined} aria-label={rotulo}
      aria-hidden={rotulo ? undefined : true}>
      <canvas ref={tela} />
    </div>
  );
}
