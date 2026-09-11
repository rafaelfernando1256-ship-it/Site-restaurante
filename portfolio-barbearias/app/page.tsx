import Cabecalho from "@/components/site/Cabecalho";
import Rodape from "@/components/site/Rodape";
import BotaoFlutuante from "@/components/site/BotaoFlutuante";
import Hero from "@/components/site/secoes/Hero";
import Problema from "@/components/site/secoes/Problema";
import Maquina from "@/components/site/secoes/Maquina";
import Projetos from "@/components/site/secoes/Projetos";
import Conta from "@/components/site/secoes/Conta";
import QuemFaz from "@/components/site/secoes/QuemFaz";
import Processo from "@/components/site/secoes/Processo";
import Planos from "@/components/site/secoes/Planos";
import Perguntas from "@/components/site/secoes/Perguntas";
import Fechamento from "@/components/site/secoes/Fechamento";
import { agencia } from "@/content/agencia";

const dadosEstruturados = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: agencia.nome,
  description:
    "Criação de sites para barbearias, com foco em agendamento e captação de clientes.",
  areaServed: "BR",
  serviceType: "Criação de sites para barbearia",
  telephone: `+${agencia.whatsapp}`,
  email: agencia.email,
};

export default function Home() {
  return (
    <>
      <Cabecalho />

      {/* A página segue uma ordem de venda, não de portfólio:
          problema → solução → demonstração → benefício → confiança
          → oferta → objeções → risco zero → contato.               */}
      <main id="conteudo">
        <Hero />
        <Problema />   {/* 01 · o espelho */}
        <Maquina />    {/* 02 · o que eu faço */}
        <Projetos />   {/* 03 · a prova, com chamada no fim */}
        <Conta />      {/* 04 · o benefício em dinheiro */}
        <Planos />     {/* 05 · o preço, logo depois da conta */}
        <QuemFaz />    {/* 06 · quem está do outro lado */}
        <Processo />   {/* 07 · como funciona */}
        <Perguntas />  {/* 08 · o que trava o fechamento */}
        <Fechamento /> {/* 09 · garantia e contato */}
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
