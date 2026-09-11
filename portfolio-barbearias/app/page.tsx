import Cabecalho from "@/components/site/Cabecalho";
import Rodape from "@/components/site/Rodape";
import BotaoFlutuante from "@/components/site/BotaoFlutuante";
import Hero from "@/components/site/secoes/Hero";
import Problema from "@/components/site/secoes/Problema";
import Projetos from "@/components/site/secoes/Projetos";
import Maquina from "@/components/site/secoes/Maquina";
import Processo from "@/components/site/secoes/Processo";
import Planos from "@/components/site/secoes/Planos";
import Perguntas from "@/components/site/secoes/Perguntas";
import Fechamento from "@/components/site/secoes/Fechamento";
import { agencia } from "@/content/agencia";

/* Dados estruturados: ajudam o Google a entender que isto é uma
   agência de criação de sites e a exibir os dados certos na busca. */
const dadosEstruturados = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: agencia.nome,
  description:
    "Agência especializada em criação de sites para barbearias, com foco em agendamento e captação de clientes.",
  areaServed: "BR",
  serviceType: "Criação de sites para barbearia",
  telephone: `+${agencia.whatsapp}`,
  email: agencia.email,
};

export default function Home() {
  return (
    <>
      <Cabecalho />
      <main id="conteudo">
        <Hero />
        <Problema />
        <Projetos />
        <Maquina />
        <Processo />
        <Planos />
        <Perguntas />
        <Fechamento />
      </main>
      <Rodape />
      <BotaoFlutuante />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados) }}
      />
    </>
  );
}
