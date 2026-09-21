/* ═══════════════════════════════════════════════════════════════
   AGENCY DETAILS
   This is the file you will edit most. Name, phone, prices and
   sales copy all live here.

   The phone number below is inside 555-0100–555-0199, the block
   the North American Numbering Plan reserves for fiction, so it
   can't ring a real person. Replace it with yours before launch.
   ═══════════════════════════════════════════════════════════════ */

export const agencia = {
  nome: "Full House",
  descritor: "Websites for restaurants",

  /* ⚠️ REPLACE WITH YOUR NUMBER. `telefone` is what the tel: and
     sms: links dial — digits only, with +1. */
  telefone: "+15125550134",
  telefoneVisivel: "(512) 555-0134",

  /* Response promise — shown under the buttons. */
  tempoResposta: "I answer within the hour, Monday through Saturday",

  email: "hello@fullhousestudio.com",
  cidade: "Austin, TX · working with restaurants nationwide",
} as const;

/** tel: link for the call buttons. */
export const linkTel = () => `tel:${agencia.telefone}`;

/** sms: link with the message already written.
 *  The ?&body= form is the one both iOS and Android accept. */
export function linkTexto(mensagem: string) {
  return `sms:${agencia.telefone}?&body=${encodeURIComponent(mensagem)}`;
}

/** mailto: link with subject and body filled in. */
export function linkEmail(assunto: string, corpo: string) {
  return `mailto:${agencia.email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}

/* ─── Hero ─────────────────────────────────────────────────── */
export const hero = {
  etiqueta: "One trade, nothing else: restaurants",
  titulo: "Restaurant websites that fill tables",
  subtitulo:
    "Someone three blocks away is deciding where to eat right now, on their phone, and the first thing they want is your menu. If yours is a PDF, you already lost them. I build the site that doesn't.",
  ctaPrimario: "Show me mine, free",
  ctaSecundario: "See the work",
  mensagemTexto:
    "Hi! I saw your portfolio and I'd like a website for my restaurant.\n\nRestaurant: \nCity: ",
  provas: [
    { valor: "5 days", rotulo: "from first call to live site" },
    { valor: "$0", rotulo: "to see yours before you decide" },
    { valor: "1 trade", rotulo: "restaurants only, nothing else" },
  ],
};

/* ─── The mirror: the owner's problem ──────────────────────── */
export const problema = {
  etiqueta: "The problem",
  titulo: "You don't lose the table in the dining room. You lose it at the red light.",
  texto:
    "Someone is sitting in their car, hungry, deciding between you and two other places. They have about forty seconds and one thumb. Everything that happens next is on your website.",
  itens: [
    {
      titulo: "Your menu is a PDF",
      texto:
        "It opens in a separate viewer, loads at postage-stamp size and makes them pinch and drag to read a price. That's the single most common reason a restaurant site loses someone, and it takes an afternoon to fix.",
    },
    {
      titulo: "The delivery apps own your customer",
      texto:
        "They take a cut of every check and keep the customer's name, phone and order history. Ordering from your own site costs you the card fee and nothing else — and the second order is yours to earn.",
    },
    {
      titulo: "Your hours are wrong somewhere",
      texto:
        "Google says one thing, the site says another, and the holiday schedule from two years ago is still up. A locked door at 8:40 on a Tuesday costs you that table twice: tonight, and the next time they think of you.",
    },
    {
      titulo: "The photos are of the empty room",
      texto:
        "Nobody chooses a restaurant by its chairs. Six honest photos of the food you actually serve outperform a professional shoot of the dining room at 3pm.",
    },
  ],
};

/* ─── What every site includes ─────────────────────────────── */
export const maquina = {
  etiqueta: "The machine",
  titulo: "The five parts in every site I build",
  texto:
    "The look changes, the food changes, the price changes. These five don't — they're what turns someone at a red light into someone at a table.",
  pecas: [
    {
      numero: "01",
      titulo: "The menu, as a web page",
      texto:
        "Real text on a real page: readable at arm's length, searchable by Google, and editable when the fish changes. Never a PDF, never a photo of a chalkboard.",
    },
    {
      numero: "02",
      titulo: "One action, matched to your room",
      texto:
        "A taqueria needs Order Now. A tasting room needs Reserve. A diner needs Call Us. The wrong button in the right place is still the wrong button.",
    },
    {
      numero: "03",
      titulo: "Food photography, front and center",
      texto:
        "Dishes at the top, above the fold, at a size where you can see the char on the tortilla. Phones are photo machines; people decide with their eyes.",
    },
    {
      numero: "04",
      titulo: "Hours in one place, right everywhere",
      texto:
        "The site, Google and the front door all read from the same list. Holiday closures included, because that's the one that burns people.",
    },
    {
      numero: "05",
      titulo: "How to get there, and where to put the car",
      texto:
        "Map, cross street, the parking situation said out loud. In a city, parking is half the decision and almost nobody puts it on the page.",
    },
  ],
};

/* ─── The math ─────────────────────────────────────────────────
   An owner thinks in covers and checks, not conversion rates.
   This section lets him do the sum himself, with his own numbers.
   Nothing here is a promise: the figures come from what he types.  */
export const conta = {
  etiqueta: "The math",
  titulo: "What is one more table a night worth?",
  texto:
    "Move the numbers to match your room. The sum counts one extra table per service, at your average check — nothing else. No assumptions about them coming back, which is where a restaurant actually makes its money.",
  campos: {
    preco: { rotulo: "Average check per guest", min: 8, max: 150, passo: 1, padrao: 28, prefixo: "$" },
    novos: { rotulo: "Guests at that extra table", min: 1, max: 8, passo: 1, padrao: 3, prefixo: "" },
  },
  resultado: {
    rotuloMes: "per month",
    rotuloAno: "per year",
  },
  nota: "This isn't a promise of results: it's the sum you just did yourself, at six nights a week. What I guarantee is a site ready to catch that table when it shows up.",
  comparacao: { antes: "And the site costs", valor: "$1,200", depois: "once, whichever model you pick." },
  cta: "Show me mine, free",
  mensagemTexto:
    "Hi! I ran the numbers on your site and I'd like to see an example for my restaurant.\n\nRestaurant: \nCity: ",
};

/* ─── Who builds it ────────────────────────────────────────────
   ⚠️ THIS IS THE MOST IMPORTANT SECTION FOR YOU TO PERSONALIZE.
   A local service bought from a stranger: the first question in the
   owner's head is "who is this person?". Without a name, a face and
   a city, that question goes unanswered and he doesn't call.
   Replace everything below with your real details.                */
export const quemFaz = {
  etiqueta: "Who builds it",
  titulo: "You talk to me, not to an account manager",
  /* ⚠️ REPLACE: your name */
  nome: "Rafael Fernando",
  /* ⚠️ REPLACE: your role, the way you'd introduce yourself */
  papel: "Developer · Austin, TX",
  /* ⚠️ REPLACE: drop a photo of yourself at public/quem-faz.jpg and
     set this to "/quem-faz.jpg". Head and shoulders, looking at the
     camera, no sunglasses. While it's empty, your initial stands in. */
  foto: "",
  /* ⚠️ REPLACE: three paragraphs, in your voice. */
  paragrafos: [
    "I work only with restaurants because the trade runs on two things a website does well: being found by someone who's hungry nearby, and making the next step obvious once they've found you. I'd rather know one business properly than ten halfway.",
    "There's no team and no ticket system. I build it, I answer the phone, and I make the changes afterwards. You never have to explain your restaurant to a second person.",
    "If I think your place doesn't need a new site right now, I'll tell you. I'd rather lose the job than hand over something that won't put anyone in a chair.",
  ],
  /* ⚠️ REPLACE or remove: promises you can actually keep */
  compromissos: [
    "I answer within the hour, Monday through Saturday",
    "You see the finished site before you pay anything",
    "One payment: no monthly fee, no lock-in",
  ],
};

/* ─── Process ──────────────────────────────────────────────── */
export const processo = {
  etiqueta: "How it works",
  titulo: "From first call to live site",
  passos: [
    {
      numero: "01",
      titulo: "Twenty minutes on the phone",
      prazo: "Day 1",
      texto:
        "Between lunch and dinner is usually best. I want your menu, your hours, who eats with you, and what you're tired of explaining to people who call.",
    },
    {
      numero: "02",
      titulo: "I build it and send you the link",
      prazo: "Day 3",
      texto:
        "Open it on your phone at the host stand. Not a mock-up or a slide deck: the real site, working, with your menu on it.",
    },
    {
      numero: "03",
      titulo: "You mark it up",
      prazo: "Day 4",
      texto:
        "Prices, photos, wording, the dish that's coming off next month. Tell me and I change it while we're on the call.",
    },
    {
      numero: "04",
      titulo: "Live, on your own domain",
      prazo: "Day 5",
      texto:
        "I publish it, connect your Google Business profile and walk your manager through it. Keeping it online is on me after that.",
    },
  ],
};

/* ─── Call to action right after the projects ──────────────────
   This is the page's high-interest moment: they have just seen
   three working sites. Leaving it without an action was a waste.  */
export const chamadaProjetos = {
  titulo: "Want to see your restaurant in one of these?",
  texto: "Send me the name and the city. Within 24 hours I'll send back the link to your finished site, free.",
  cta: "Show me mine, free",
  mensagemTexto:
    "Hi! I saw the projects and I'd like to see an example for my restaurant.\n\nRestaurant: \nCity: ",
};

/* ─── Pricing ──────────────────────────────────────────────────
   Priced by model rather than by abstract package: the owner picks
   the demo his room looks like and sees what that one costs.
   One-off fee — none of the models carry a monthly charge.
   ═══ To change a price, edit only the `preco` field. ═══         */
export const planos = {
  etiqueta: "Investment",
  titulo: "One price, three models",
  texto:
    "All three cost the same, paid once. You choose by the room you run, not by what fits the budget.",
  /* A single price, stated once, in large type: three cards all
     repeating the same number would read like a mistake. */
  destaque: { valor: "$1,200", nota: "one payment · no monthly fee · any model" },
  lista: [
    {
      slug: "blue-plate-diner",
      nome: "Classic",
      modelo: "Like Blue Plate Diner",
      preco: "$1,200",
      resumo:
        "For the neighborhood room with regulars, where people call ahead and want to know if you're open and what the special is.",
      destaque: false,
      inclui: [
        "A one-page site, built to measure",
        "Full menu as a readable web page",
        "Call button as the main action",
        "Hours, holiday closures and directions",
        "Parking said out loud",
        "Google Business profile wired to the site",
        "30 days of changes included",
      ],
      cta: "I want the Classic",
    },
    {
      slug: "comal-taqueria",
      nome: "Counter",
      modelo: "Like Comal Street Tacos",
      preco: "$1,200",
      resumo:
        "For fast casual and counter service, where the money is in order-ahead and you'd like to stop paying the apps a third of the check.",
      destaque: true,
      /* "Most chosen" seria uma estatística de vendas que você ainda
         não tem. "Recommended" é opinião sua — pode dizer no dia um. */
      selo: "Recommended",
      inclui: [
        "Everything in the Classic",
        "Order-ahead wired to your POS",
        "Today's specials, editable from your phone",
        "Photo-first menu, built for scrolling",
        "Catering and large-order inquiries",
        "Instagram feed connected",
      ],
      cta: "I want the Counter",
    },
    {
      slug: "larkspur",
      nome: "Reservation",
      modelo: "Like Larkspur",
      preco: "$1,200",
      resumo:
        "For chef-driven rooms with a tasting menu, a wine program and a check average that has to be justified before anyone books.",
      destaque: false,
      inclui: [
        "Everything in the Counter",
        "Reservations wired to your booking system",
        "Tasting menu and wine pairing pages",
        "Private dining and buyout inquiries",
        "Gift cards",
        "Visual identity: your own palette and typefaces",
        "60 days of changes included",
      ],
      cta: "I want the Reservation",
    },
  ],
  /* Recurring costs that aren't mine — said plainly, so they don't
     turn into a surprise later. */
  rodape: {
    titulo: "What isn't in the price",
    itens: [
      "A .com domain: about $15 a year, registered in your name with any registrar. It's yours and it goes with you.",
      "Hosting: I set it up on a free tier, so there's no monthly cost to you.",
      "Online ordering or reservations: whatever your POS or booking service charges. I connect what you already use rather than selling you something new.",
      "Changes after the included period: agreed as they come up, no contract.",
    ],
  },
};

/* ─── Guarantee ────────────────────────────────────────────── */
export const garantia = {
  titulo: "You see it before you pay",
  texto:
    "I build your restaurant's site and send you the link. If you don't like it, you pay nothing and we shake hands. The risk is all mine.",
  /* The mechanism, in three steps: a guarantee with no explanation
     of how it works reads like a salesman's promise. */
  passos: [
    { numero: "01", texto: "You send me the restaurant name, the city and a menu." },
    { numero: "02", texto: "Within 24 hours I send back the link to your finished site." },
    { numero: "03", texto: "If you like it, we go ahead. If you don't, you owe me nothing." },
  ],
  cta: "Show me mine, free",
  mensagemTexto:
    "Hi! I'd like to see an example of my restaurant's site before committing.\n\nRestaurant: \nCity: ",
};

/* ─── Objections ───────────────────────────────────────────── */
export const objecoes = {
  etiqueta: "Straight questions",
  titulo: "What every owner asks before saying yes",
  lista: [
    {
      pergunta: "We're on DoorDash and Instagram. Do we need a website?",
      resposta:
        "Those do two jobs, and neither is the one a website does. Instagram talks to people who already follow you. The apps rent you a customer and keep their details. Your site is the only place someone who's never heard of you can find your menu, your hours and a way to order that doesn't cost you a third of the ticket.",
    },
    {
      pergunta: "Can I update the menu myself, or do I have to call you?",
      resposta:
        "Prices and dishes are in one file with plain text in it — most owners change a price faster than they'd write me an email. If you'd rather not touch it, for the first 30 days you text me the change and I do it the same day at no cost. After that we agree it as it comes up.",
    },
    {
      pergunta: "Is there a monthly fee?",
      resposta:
        "No. You pay once for the site and it's yours. The only bill that continues is the domain, about $15 a year, paid by you directly to a registrar and registered in your name. If you ever want to move to someone else, you take everything with you.",
    },
    {
      pergunta: "Will online ordering work with our POS?",
      resposta:
        "I connect what you already run rather than selling you a new system. If you're on a POS with ordering built in, the site hands off to it. If you're not on one yet, I'll tell you which ones your kind of room tends to get along with — and I don't take a referral fee from any of them.",
    },
    {
      pergunta: "How long does it take?",
      resposta:
        "Five days from the call to going live, as long as I have the menu and a handful of photos. What holds it up is almost always photos, not code.",
    },
    {
      pergunta: "Will we show up on Google?",
      resposta:
        "It'll be built for it: menu as real text Google can read, hours and address marked up the way it expects, fast loading, and your Google Business profile connected. I won't promise the top spot — anyone who does is guessing. I promise a site that's technically right to compete for it.",
    },
  ],
};

/* ─── Closing call ─────────────────────────────────────────── */
export const fechamento = {
  titulo: "Send me your menu",
  texto:
    "Within 24 hours I'll send back an example of your site, with your dishes, your prices and your hours on it. Free, no strings and no sales pitch.",
  cta: "Show me mine, free",
  mensagemTexto:
    "Hi! I'd like the free example of my restaurant's website.\n\nRestaurant: \nCity: \nInstagram: ",
};
