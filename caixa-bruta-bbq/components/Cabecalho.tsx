'use client';

import { Menu, ShoppingBag, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { negocio } from '@/content/negocio';
import { useLoja } from '@/lib/loja';

const LINKS = [
  { href: '#cardapio', texto: 'Cardápio' },
  { href: '#como-funciona', texto: 'Como funciona' },
  { href: '#entrega', texto: 'Entrega' },
];

export default function Cabecalho() {
  const loja = useLoja();
  const [rolou, setRolou] = useState(false);
  const [menu, setMenu] = useState(false);
  const botaoMenu = useRef<HTMLButtonElement>(null);
  const folha = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ve = () => setRolou(window.scrollY > 12);
    ve();
    window.addEventListener('scroll', ve, { passive: true });
    return () => window.removeEventListener('scroll', ve);
  }, []);

  // O menu do celular: trava a rolagem, fecha no Esc e devolve o foco.
  useEffect(() => {
    if (!menu) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    folha.current?.querySelector<HTMLElement>('a, button')?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false);
      if (e.key === 'Tab' && folha.current) {
        const focaveis = [...folha.current.querySelectorAll<HTMLElement>('a, button')];
        const [primeiro, ultimo] = [focaveis[0], focaveis[focaveis.length - 1]];
        if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
        if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
      }
    };
    document.addEventListener('keydown', tecla);
    return () => {
      document.body.style.overflow = antes;
      document.removeEventListener('keydown', tecla);
      botaoMenu.current?.focus();
    };
  }, [menu]);

  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${rolou || menu ? 'bg-carvao' : 'bg-transparent'}`}>
      <div className="moldura flex h-[72px] items-center justify-between gap-6 md:h-20">
        <a href="#inicio" className="titulo text-destaque leading-none tracking-[0.01em]"
          aria-label={`${negocio.nome}, voltar ao início`}>
          Caixa Bruta <span className="text-dourado">BBQ</span>
        </a>

        <nav aria-label="Principal" className="hidden items-center gap-9 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="font-semibold hover:text-dourado transition-colors">
              {l.texto}
            </a>
          ))}
          <button type="button" onClick={() => loja.abre()} className="bt bt-acao min-h-[46px] px-5">
            <ShoppingBag size={18} aria-hidden />
            Minha encomenda
            <span className="numeros min-w-[1.5rem] bg-carvao/25 px-1.5 text-center" aria-label={`${loja.pecas} itens`}>
              {loja.pecas}
            </span>
          </button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button type="button" onClick={() => loja.abre()} className="relative grid h-12 w-12 place-items-center bg-grafite"
            aria-label={`Abrir minha encomenda, ${loja.pecas} itens`}>
            <ShoppingBag size={20} aria-hidden />
            {loja.pecas > 0 && (
              <span className="numeros absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center bg-intenso px-1 text-[0.8rem] font-bold">
                {loja.pecas}
              </span>
            )}
          </button>
          <button ref={botaoMenu} type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu}
            aria-controls="menu-celular" className="grid h-12 w-12 place-items-center bg-grafite"
            aria-label={menu ? 'Fechar o menu' : 'Abrir o menu'}>
            {menu ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menu && (
          <motion.div id="menu-celular" ref={folha} role="dialog" aria-modal="true" aria-label="Menu"
            className="fixed inset-x-0 bottom-0 top-[72px] z-40 flex flex-col bg-carvao px-[var(--margem)] pb-8 pt-6 md:hidden"
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
            <nav aria-label="Menu do celular" className="flex flex-col">
              {LINKS.map((l, i) => (
                <motion.a key={l.href} href={l.href} onClick={() => setMenu(false)}
                  className="titulo py-3 text-titulo"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                  {l.texto}
                </motion.a>
              ))}
            </nav>
            <div className="mt-auto grid gap-4">
              <p className="bg-dourado p-4 font-bold text-carvao">
                Encomendas com no mínimo 8 horas de antecedência.
              </p>
              <button type="button" className="bt bt-acao w-full" onClick={() => { setMenu(false); loja.abre(); }}>
                Ver minha encomenda ({loja.pecas})
              </button>
              <a className="bt bt-calmo w-full" href={`https://wa.me/${negocio.whatsapp.numero}`} target="_blank" rel="noopener">
                WhatsApp {negocio.whatsapp.exibicao}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
