'use client';

/**
 * As entradas da página: cada parte de uma seção sobe e aparece quando
 * a seção chega na tela — título, depois o texto, depois a imagem.
 *
 * Quem marca é o HTML (`data-revela`, e `--atraso` para escalonar). O
 * CSS só esconde quando há JavaScript (a classe `js` no <html>), então
 * sem script nada fica invisível. Com "reduzir movimento", o CSS tira o
 * deslocamento e deixa só a aparição.
 */
import { useEffect } from 'react';

export default function Movimento() {
  useEffect(() => {
    const olho = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        (e.target as HTMLElement).dataset.visto = '';
        olho.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });

    const observa = () => document.querySelectorAll('[data-revela]:not([data-visto])').forEach((el) => olho.observe(el));
    observa();
    // Partes que aparecem depois (a linha aberta do cardápio, por exemplo).
    const novidades = new MutationObserver(observa);
    novidades.observe(document.body, { childList: true, subtree: true });
    return () => { olho.disconnect(); novidades.disconnect(); };
  }, []);
  return null;
}
