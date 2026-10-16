import { AntesDepois } from '@/components/AntesDepois';
import { CTA } from '@/components/CTA';
import { Depoimentos } from '@/components/Depoimentos';
import { Diferenciais } from '@/components/Diferenciais';
import { FAQ } from '@/components/FAQ';
import { Hero } from '@/components/Hero';
import { Nav } from '@/components/Nav';
import { Preloader } from '@/components/Preloader';
import { Procedimentos } from '@/components/Procedimentos';
import { Profissional } from '@/components/Profissional';
import { Rodape } from '@/components/Rodape';
import { Sobre } from '@/components/Sobre';
import { SuaveScroll } from '@/components/SuaveScroll';
import { WhatsAppFlutuante } from '@/components/WhatsAppFlutuante';

/**
 * A PÁGINA.
 *
 * A ordem é a de uma conversa: quem somos, o que fazemos, por que
 * aqui, prove, quem atende, o que dizem, e as dúvidas que ficaram —
 * só então o pedido de agendamento.
 *
 * Reparar na alternância de fundo: areia, grafite, areia, areia,
 * areia, grafite, areia, dourado, grafite. O escuro entra onde o olho
 * já está cansando de bege, e é ele que dá ritmo à rolagem.
 */
export default function Pagina() {
  return (
    <>
      <Preloader />
      <SuaveScroll />
      <Nav />

      <main id="conteudo">
        <Hero />
        <Sobre />
        <Procedimentos />
        <Diferenciais />
        <AntesDepois />
        <Profissional />
        <Depoimentos />
        <FAQ />
        <CTA />
      </main>

      <Rodape />
      <WhatsAppFlutuante />
    </>
  );
}
