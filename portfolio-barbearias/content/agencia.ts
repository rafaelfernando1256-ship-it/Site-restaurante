/* ═══════════════════════════════════════════════════════════════
   AGENCY DETAILS
   This is the file you will edit most. Name, phone, prices and
   sales copy all live here.

   Numbers below use the ranges Ofcom reserves for fiction
   (07700 900xxx and 020 7946 0xxx), so nothing here rings a real
   person. Replace them with yours before going live.
   ═══════════════════════════════════════════════════════════════ */

export const agencia = {
  nome: "Full Chair",
  descritor: "Websites for barbershops",

  /* ⚠️ REPLACE WITH YOUR NUMBER: country code + number, digits only. */
  whatsapp: "447700900123",
  whatsappVisivel: "07700 900123",

  /* Response promise — shown under the buttons. */
  tempoResposta: "I reply within the hour, Monday to Saturday",

  email: "hello@fullchair.co.uk",
  cidade: "London · working with shops across the UK",
} as const;

/** Builds the WhatsApp link with the message already written. */
export function linkWhats(mensagem: string) {
  return `https://wa.me/${agencia.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}

/* ─── Hero ─────────────────────────────────────────────────── */
export const hero = {
  etiqueta: "One trade, nothing else: barbershops",
  titulo: "Barbershop websites that fill the chair",
  subtitulo:
    "Your next customer searches for a barber at nine on a Thursday night. Whoever turns up first, with prices on screen and a booking button, gets the cut. I build that site.",
  ctaPrimario: "Show me mine, free",
  ctaSecundario: "See the work",
  mensagemWhats:
    "Hi! I saw your portfolio and I want a website for my barbershop.\n\nShop name: \nTown: ",
  provas: [
    { valor: "3 days", rotulo: "from first hello to live site" },
    { valor: "£0", rotulo: "to see yours before you decide" },
    { valor: "1 trade", rotulo: "barbershops only, nothing else" },
  ],
};

/* ─── The mirror: the owner's problem ──────────────────────── */
export const problema = {
  etiqueta: "The problem",
  titulo: "You don't lose customers in the chair. You lose them before they walk in.",
  texto:
    "Someone looking for a barber decides in under a minute, on their phone, comparing three Google results. If yours has no prices, no easy address and no button that works, they go to the one below you.",
  itens: [
    {
      titulo: "Instagram alone won't do it",
      texto:
        "Instagram shows your work to people who already follow you. A website shows up for the ones who don't know you yet and are searching right now, three streets away.",
    },
    {
      titulo: "Hidden prices lose the booking",
      texto:
        "The first thing anyone wants to know is what it costs. With no answer on screen, they don't message to ask — they close the tab and open your competitor.",
    },
    {
      titulo: "A Google listing isn't enough on its own",
      texto:
        "Your Google profile is the shop window. The website is the shop. One feeds the other: a well-built site lifts you on the map and converts more of the people who tap through.",
    },
    {
      titulo: "An empty slot is money gone",
      texto:
        "Every gap in the diary is a cut that never comes back. A booking button in the right place fills Tuesday afternoon.",
    },
  ],
};

/* ─── What every site includes ─────────────────────────────── */
export const maquina = {
  etiqueta: "The machine",
  titulo: "The five parts in every site I build",
  texto:
    "The look changes, the audience changes, the prices change. These five don't — they're what turns a visit into someone sitting in your chair.",
  pecas: [
    {
      numero: "01",
      titulo: "One main action, always in reach",
      texto:
        "Book, call or message — one of them, fixed on screen, reachable with a thumb. No menu of options for the customer to think about.",
    },
    {
      numero: "02",
      titulo: "Services with the price right there",
      texto:
        "A clear list, no 'enquire for pricing'. Visible prices filter out browsers and bring in people who already decided to pay.",
    },
    {
      numero: "03",
      titulo: "Proof tied to your Google reviews",
      texto:
        "Your real rating and real reviews, linked to the profile. Never invented testimonials — those fall apart the first time someone checks.",
    },
    {
      numero: "04",
      titulo: "Your barbers, with names and faces",
      texto:
        "People don't pick a shop, they pick the person holding the clippers. Whoever shows up on screen becomes the one they ask for.",
    },
    {
      numero: "05",
      titulo: "Getting there without thinking",
      texto:
        "Map, landmark, parking and opening hours. Choosing a local barber is really a decision about the walk.",
    },
  ],
};

/* ─── The maths ────────────────────────────────────────────────
   A barber thinks in haircuts and pounds, not conversion rates.
   This section lets him do the sum himself, with his own numbers.
   Nothing here is a promise: the figures come from what he types.  */
export const conta = {
  etiqueta: "The maths",
  titulo: "What is one new customer a week worth?",
  texto:
    "Move the numbers below to match your shop. The sum counts only each new customer's first visit — it ignores them coming back, which is where a barbershop actually makes its money.",
  campos: {
    preco: { rotulo: "Your price for a cut", min: 10, max: 80, passo: 1, padrao: 25, prefixo: "£" },
    novos: { rotulo: "New customers per week", min: 1, max: 20, passo: 1, padrao: 3, prefixo: "" },
  },
  resultado: {
    rotuloMes: "per month",
    rotuloAno: "per year",
  },
  nota: "This isn't a promise of results: it's the sum you just did yourself. What I guarantee is a site ready to catch that customer when they show up.",
  comparacao: { antes: "And the site costs", valor: "£200", depois: "once, whichever model you pick." },
  cta: "Show me mine, free",
  mensagemWhats:
    "Hi! I did the sum on your site and I'd like to see an example for my barbershop.\n\nShop name: \nTown: ",
};

/* ─── Who builds it ────────────────────────────────────────────
   ⚠️ THIS IS THE MOST IMPORTANT SECTION FOR YOU TO PERSONALISE.
   A local service bought from a stranger over WhatsApp: the first
   question in the owner's head is "who is this person?". Without a
   name, a face and a town, that question goes unanswered and he
   doesn't message. Replace everything below with your real details. */
export const quemFaz = {
  etiqueta: "Who builds it",
  titulo: "You talk to me, not to a support desk",
  /* ⚠️ REPLACE: your name */
  nome: "Rafael Fernando",
  /* ⚠️ REPLACE: your role, the way you'd introduce yourself */
  papel: "Developer · London",
  /* ⚠️ REPLACE: put a photo of yourself in public/quem-faz.jpg.
     Head and shoulders, looking at the camera, no sunglasses.
     Until then, your initial stands in. */
  foto: "",
  /* ⚠️ REPLACE: three paragraphs, in your voice. Say why barbershops,
     how you work, and what the customer can expect from you. */
  paragrafos: [
    "I chose to work only with barbershops because the trade lives on two things a website handles well: being found on Google and making booking easy. Rather than half-learn ten industries, I'd rather know one properly.",
    "There's no team and no support desk. I answer the messages, I do the design, and I make the changes afterwards. You never have to tell your story to three different people.",
    "If I think your shop doesn't need a site right now, I'll say so. I'd rather lose the sale than hand over something that won't bring you customers.",
  ],
  /* ⚠️ REPLACE or remove: promises you can actually keep */
  compromissos: [
    "I reply within the hour, Monday to Saturday",
    "You see the finished site before you pay anything",
    "One payment: no monthly fee, no tie-in",
  ],
};

/* ─── Process ──────────────────────────────────────────────── */
export const processo = {
  etiqueta: "How it works",
  titulo: "From first hello to live site",
  passos: [
    {
      numero: "01",
      titulo: "A fifteen-minute chat",
      prazo: "Day 1",
      texto:
        "Over WhatsApp is fine. I want to know who your customers are, what you charge, and what makes you different from the shop on the corner.",
    },
    {
      numero: "02",
      titulo: "I build it and show you",
      prazo: "Day 2",
      texto:
        "You get a link to your finished site to open on your phone. Not a sketch or a mock-up: the real thing, working.",
    },
    {
      numero: "03",
      titulo: "Fine-tuning",
      prazo: "Day 3",
      texto:
        "You tell me what you'd change and I change it there and then. Colours, wording, photos, prices — until it's yours.",
    },
    {
      numero: "04",
      titulo: "Live, on your own domain",
      prazo: "Day 3",
      texto:
        "I publish it, connect it to your Google Business profile and walk you through it. Keeping it online is on me after that.",
    },
  ],
};

/* ─── Call to action right after the projects ──────────────────
   This is the page's high-interest moment: they have just seen
   three working sites. Leaving it without an action was a waste.  */
export const chamadaProjetos = {
  titulo: "Want to see your shop in one of these?",
  texto: "Send me the name and the town. Within 24 hours I'll send back the link to your finished site, free.",
  cta: "Show me mine, free",
  mensagemWhats:
    "Hi! I saw the projects and I'd like to see an example for my barbershop.\n\nShop name: \nTown: ",
};

/* ─── Pricing ──────────────────────────────────────────────────
   Priced by model rather than by abstract package: the owner picks
   the demo his shop looks like and sees what that one costs.
   One-off fee — none of the models carry a monthly charge.
   ═══ To change a price, edit only the `preco` field. ═══         */
export const planos = {
  etiqueta: "Investment",
  titulo: "One price, three models",
  texto:
    "All three models cost the same, paid once. You choose by what suits your shop, not by what you can afford.",
  /* A single price, stated once, in large type: three cards all
     repeating the same number would read like a mistake. */
  destaque: { valor: "£200", nota: "one payment · no monthly fee · any model" },
  lista: [
    {
      slug: "aurelio-and-sons",
      nome: "Classic",
      modelo: "Like Aurelio & Sons",
      preco: "£200",
      resumo:
        "For the neighbourhood shop with regulars, where customers would rather ring than tap through an app.",
      destaque: false,
      inclui: [
        "A one-page site, built to measure",
        "The phone as the main action, with a call button",
        "Full service and price list",
        "Map, opening hours and directions",
        "A WhatsApp button in every section",
        "Google Business profile wired to the site",
        "30 days of changes included",
      ],
      cta: "I want the Classic",
    },
    {
      slug: "nine-thirty",
      nome: "Urban",
      modelo: "Like Nine Thirty",
      preco: "£200",
      resumo:
        "For a shop with a team, a younger crowd and a diary that needs to stop living in a notebook.",
      destaque: true,
      selo: "Most chosen",
      inclui: [
        "Everything in the Classic",
        "A team page with a profile for each barber",
        "Booking wired to the app you already use",
        "Gallery of recent work",
        "Today's free slots pulled to the top",
        "Instagram feed connected",
      ],
      cta: "I want the Urban",
    },
    {
      slug: "casa-valerio",
      nome: "Premium",
      modelo: "Like Casa Valerio",
      preco: "£200",
      resumo:
        "For a high-ticket shop selling memberships that needs to look like what it charges.",
      destaque: false,
      inclui: [
        "Everything in the Urban",
        "Membership plans section",
        "Gift cards for buying on someone else's behalf",
        "Visual identity: your own palette and typefaces",
        "Site copy written by me",
        "60 days of changes included",
      ],
      cta: "I want the Premium",
    },
  ],
  /* Recurring costs that aren't mine — said plainly, so they don't
     turn into a surprise later. */
  rodape: {
    titulo: "What isn't in the price",
    itens: [
      "A .co.uk domain: around £12 a year, registered in your name with any registrar. It's yours and it goes with you.",
      "Hosting: I set it up on a free service, so there's no monthly cost to you.",
      "Changes after the included period: agreed as they come up, no contract.",
    ],
  },
};

/* ─── Guarantee ────────────────────────────────────────────── */
export const garantia = {
  titulo: "You see it before you pay",
  texto:
    "I build your shop's site and send you the link. If you don't like it, you pay nothing and we part ways with no awkwardness. The risk is all mine.",
  /* The mechanism, in three steps: a guarantee with no explanation
     of how it works reads like a salesman's promise. */
  passos: [
    { numero: "01", texto: "You send me the shop name and the town." },
    { numero: "02", texto: "Within 24 hours I send back the link to your finished site." },
    { numero: "03", texto: "If you like it, we go ahead. If you don't, you owe me nothing." },
  ],
  cta: "Show me mine, free",
  mensagemWhats:
    "Hi! I'd like to see an example of my barbershop's site before committing.\n\nShop name: \nTown: ",
};

/* ─── Objections ───────────────────────────────────────────── */
export const objecoes = {
  etiqueta: "Straight questions",
  titulo: "What every owner asks before saying yes",
  lista: [
    {
      pergunta: "I already have Instagram. Do I need a website?",
      resposta:
        "Instagram and a website do different jobs. Instagram talks to people who already follow you. The website turns up for someone searching for a barber right now who's never heard of you — and it's what lifts your profile on Google Maps. Neither replaces the other; together they pull each other up.",
    },
    {
      pergunta: "I know nothing about websites. Will I be able to manage it?",
      resposta:
        "You don't need to. For the first 30 days: price changed, new barber started, hours moved? Message me and I'll change it the same day, at no cost. After that we agree it as it comes up — it's usually a matter of minutes.",
    },
    {
      pergunta: "Is there a monthly fee? Am I tied into a contract?",
      resposta:
        "No and no. You pay once for the site and it's yours. The only bill that continues is the domain, around £12 a year, paid by you directly to a registrar and registered in your name. If you ever want to move to someone else, you take everything with you.",
    },
    {
      pergunta: "How long does it take?",
      resposta:
        "Three working days from the brief to going live, as long as you send me photos and prices quickly. What usually holds things up is photos, not code.",
    },
    {
      pergunta: "Will my site show up on Google?",
      resposta:
        "It'll be built for it: address and services marked up the way Google reads them, fast loading, and a link to your Google Business profile. I won't promise first place — anyone who does is lying. I promise a site that's technically right to compete.",
    },
    {
      pergunta: "I already have a website. Is it worth replacing?",
      resposta:
        "Send me the link. If it's fast, good on a phone and converting, I'll tell you not to spend the money. If it's slow or stuck in 2015, I'll show you exactly what it's costing you.",
    },
  ],
};

/* ─── Closing call ─────────────────────────────────────────── */
export const fechamento = {
  titulo: "Send me your shop's name",
  texto:
    "Within 24 hours I'll send back an example of your site, with your colours, your services and your prices. Free, no strings and no sales patter.",
  cta: "Show me mine, free",
  mensagemWhats:
    "Hi! I'd like the free example of my barbershop's website.\n\nShop name: \nTown: \nInstagram: ",
};
