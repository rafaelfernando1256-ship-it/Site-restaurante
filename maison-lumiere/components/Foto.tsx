import Image from 'next/image';

/**
 * A FOTO — ou o lugar dela.
 *
 * Todo campo `foto` do content/site.ts passa por aqui. Se tiver uma
 * URL, entra uma <Image> do Next (que otimiza, serve AVIF/WebP e
 * reserva o espaço). Se estiver vazio, entra um placeholder desenhado
 * na paleta da casa.
 *
 * Por que não deixar quebrar: um site de portfólio com seis retângulos
 * cinzas escrito "imagem não encontrada" não vende nada. Assim ele
 * fica apresentável desde o primeiro minuto, e cada foto real que o
 * cliente colar é uma melhora — não um conserto.
 */

type Props = {
  src?: string;
  alt: string;
  /** Marca a foto como a principal da tela inicial (carrega antes). */
  prioridade?: boolean;
  className?: string;
  /** Um número qualquer: muda o desenho do placeholder, para dois
   *  cartões lado a lado não ficarem idênticos. */
  semente?: number;
  sizes?: string;
};

export function Foto({
  src,
  alt,
  prioridade = false,
  className = '',
  semente = 0,
  sizes = '(max-width: 768px) 100vw, 50vw',
}: Props) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={prioridade}
        className={`object-cover ${className}`}
      />
    );
  }

  return <Placeholder alt={alt} semente={semente} className={className} />;
}

/**
 * O placeholder: dois degradês em ângulos diferentes mais um arco
 * dourado. Nada de ícone de "imagem quebrada", nada de cinza.
 *
 * É decorativo, então vai com aria-hidden e um <span class="sr-only">
 * descrevendo que ali entra uma foto — quem usa leitor de tela merece
 * saber que falta algo, sem ouvir um alt mentindo que a foto existe.
 */
function Placeholder({
  alt,
  semente,
  className,
}: {
  alt: string;
  semente: number;
  className: string;
}) {
  const giro = 20 + ((semente * 37) % 110);
  const desloca = 30 + ((semente * 23) % 40);

  return (
    <div
      className={`absolute inset-0 overflow-hidden bg-areia-escura ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(${giro}deg, #e8ddd0 0%, #f5efe8 45%, #dcc4a0 100%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(60% 70% at ${desloca}% 25%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 60%)`,
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
      >
        <circle
          cx={200 + ((semente * 29) % 80) - 40}
          cy={210}
          r={118}
          fill="none"
          stroke="#c9a97c"
          strokeOpacity="0.4"
          strokeWidth="0.75"
        />
        <circle
          cx={200 + ((semente * 29) % 80) - 40}
          cy={210}
          r={82}
          fill="none"
          stroke="#a8884f"
          strokeOpacity="0.22"
          strokeWidth="0.75"
        />
      </svg>
      <span className="sr-only">{alt} — espaço reservado para a foto</span>
    </div>
  );
}
