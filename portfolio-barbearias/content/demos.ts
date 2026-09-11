/* ═══════════════════════════════════════════════════════════════
   ÍNDICE DOS PROJETOS DEMONSTRATIVOS
   Metadados usados na home do portfólio (cards e navegação).
   O conteúdo de cada site fica em content/demo-<slug>.ts
   ═══════════════════════════════════════════════════════════════ */

export type ResumoDemo = {
  slug: string;
  nome: string;
  arquetipo: string;
  slogan: string;
  /** A frase que você usa na prospecção ao mostrar este projeto. */
  objetivo: string;
  /** O que este demo prova para o prospect. */
  prova: string;
  publico: string;
  destaques: string[];
  paleta: { nome: string; hex: string }[];
  tipografia: string;
  /** Cor usada no card do portfólio. */
  corCard: string;
  corTexto: string;
  mockup: string;
};

export const demos: ResumoDemo[] = [
  {
    slug: "casa-valerio",
    nome: "Casa Valério",
    arquetipo: "Premium · Barbearia privê",
    slogan: "O tempo que você reserva para si.",
    objetivo:
      "Feito para justificar ticket alto e vender assinatura mensal antes do primeiro corte.",
    prova: "Prova que eu construo marca de luxo, não só site bonito.",
    publico: "Executivos 30–55, ticket médio R$ 190",
    destaques: [
      "Seção do ritual de atendimento",
      "Serviços em menu de restaurante",
      "Clube de assinatura com 3 níveis",
      "Vale-presente para compra por terceiros",
    ],
    paleta: [
      { nome: "Preto tinta", hex: "#0D0D0F" },
      { nome: "Latão", hex: "#C4A867" },
      { nome: "Mármore", hex: "#EDE8E0" },
      { nome: "Verde garrafa", hex: "#17372E" },
    ],
    tipografia: "Marcellus + Jost",
    corCard: "#0D0D0F",
    corTexto: "#EDE8E0",
    mockup: "/mockups/casa-valerio.jpg",
  },
  {
    slug: "nove-e-meia",
    nome: "Nove & Meia",
    arquetipo: "Urbana · Barbearia jovem",
    slogan: "Agenda aberta. Estilo fechado.",
    objetivo:
      "Feito para transformar seguidor do Instagram em horário agendado no mesmo minuto.",
    prova: "Prova que eu resolvo agendamento online e integração com redes.",
    publico: "18–35, ticket médio R$ 55, alto volume",
    destaques: [
      "Escolha do barbeiro antes do serviço",
      "Faixa rolante de prova social",
      "Galeria em grade estilo feed",
      "Horários livres de hoje em destaque",
    ],
    paleta: [
      { nome: "Asfalto", hex: "#101114" },
      { nome: "Limão elétrico", hex: "#C6F24E" },
      { nome: "Laranja sinal", hex: "#FF5A1F" },
      { nome: "Gelo", hex: "#F2F2EF" },
    ],
    tipografia: "Archivo Black + Space Grotesk",
    corCard: "#101114",
    corTexto: "#C6F24E",
    mockup: "/mockups/nove-e-meia.jpg",
  },
  {
    slug: "dom-aurelio",
    nome: "Barbearia Dom Aurélio",
    arquetipo: "Clássica · Barbearia de bairro",
    slogan: "Três gerações cortando o cabelo do bairro.",
    objetivo:
      "Feito para quem decide pelo telefone: ligar é o botão principal, não agendar.",
    prova: "Prova que eu desenho para o cliente do cliente, não para o meu portfólio.",
    publico: "35–70, ticket médio R$ 45, clientela fiel",
    destaques: [
      "Ligar como ação principal",
      "Corpo de texto em 18px por acessibilidade",
      "Linha do tempo de três gerações",
      "Seção de localização ampliada",
    ],
    paleta: [
      { nome: "Papel creme", hex: "#F7F1E3" },
      { nome: "Vermelho esmalte", hex: "#B22B2B" },
      { nome: "Azul marinho", hex: "#1F3A5F" },
      { nome: "Nogueira", hex: "#6B4A2F" },
    ],
    tipografia: "Alfa Slab One + Libre Baskerville",
    corCard: "#F7F1E3",
    corTexto: "#B22B2B",
    mockup: "/mockups/dom-aurelio.jpg",
  },
];

export function acharDemo(slug: string) {
  return demos.find((d) => d.slug === slug);
}
