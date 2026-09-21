"use client";

import { useState } from "react";
import Secao, { CabecaSecao } from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import Botao from "@/components/ui/Botao";
import IconeTexto from "@/components/ui/IconeTexto";
import { conta, linkTexto } from "@/content/agencia";

/* Serviços no mês = 6 noites por semana × 4,33 semanas ≈ 26.
   O título e a nota falam em "uma mesa por noite, seis noites por
   semana" — a conta precisa contar as mesmas noites, senão o dono
   faz o cálculo de cabeça e vê que não bate.
   Restaurante que abre sete dias? 7 × 4,33 ≈ 30. */
const SERVICOS_NO_MES = 26;

/* Para trocar de moeda, mude as duas linhas abaixo e o campo
   `prefixo` em content/agencia.ts → conta.campos.preco. */
function moeda(valor: number) {
  return valor.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/* ═══════════════════════════════════════════════════════════════
   A CONTA
   O argumento do site inteiro era abstrato ("transforma visita em
   cliente"). Aqui ele vira dinheiro, com os números que o próprio
   dono digita — por isso não é promessa minha, é conta dele.
   ═══════════════════════════════════════════════════════════════ */
export default function Conta() {
  const [preco, setPreco] = useState(conta.campos.preco.padrao);
  const [novos, setNovos] = useState(conta.campos.novos.padrao);

  const porMes = Math.round(preco * novos * SERVICOS_NO_MES);
  const porAno = porMes * 12;

  const controles = [
    { ...conta.campos.preco, id: "preco", valor: preco, definir: setPreco },
    { ...conta.campos.novos, id: "novos", valor: novos, definir: setNovos },
  ];

  return (
    <Secao id="conta" tom="poco">
      <CabecaSecao
        indice="04"
        etiqueta={conta.etiqueta}
        titulo={conta.titulo}
        texto={conta.texto}
      />

      <div className="mt-14 grid gap-4 sm:mt-16 lg:grid-cols-[1fr_1.05fr]">
        {/* Controles */}
        <Revelar>
          <div className="flex h-full flex-col justify-center gap-10 rounded-[1.25rem] bg-tinta-2 p-8 ring-1 ring-fio sm:p-10">
            {controles.map((c) => (
              <div key={c.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <label htmlFor={c.id} className="text-[0.95rem] text-osso-2">
                    {c.rotulo}
                  </label>
                  <output htmlFor={c.id} className="t-numeral text-[1.6rem] text-osso">
                    {c.prefixo}
                    {c.valor}
                  </output>
                </div>
                <input
                  id={c.id}
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.passo}
                  value={c.valor}
                  onChange={(e) => c.definir(Number(e.target.value))}
                  className="faixa mt-5 w-full"
                />
                <div className="mt-2 flex justify-between text-[0.72rem] text-osso-3">
                  <span>
                    {c.prefixo}
                    {c.min}
                  </span>
                  <span>
                    {c.prefixo}
                    {c.max}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Revelar>

        {/* Resultado */}
        <Revelar atraso={0.08}>
          <div className="flex h-full flex-col justify-between rounded-[1.25rem] bg-tinta-3 p-8 ring-1 ring-fio-forte sm:p-10">
            <div>
              <p className="t-rotulo text-osso-3">{conta.resultado.rotuloMes}</p>
              <p className="t-numeral mt-3 text-[clamp(2.8rem,7vw,4.4rem)] text-osso">
                {moeda(porMes)}
              </p>
              <p className="mt-4 border-t border-fio pt-4 text-[0.95rem] text-osso-2">
                <span className="t-numeral text-[1.15rem] text-osso">{moeda(porAno)}</span>{" "}
                {conta.resultado.rotuloAno}
              </p>
              {/* A comparação é a linha que fecha: o que entra ao lado
                  do que sai, com o mesmo corpo de número. */}
              <p className="mt-7 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-fio pt-6 text-[0.95rem] text-osso-2">
                {conta.comparacao.antes}
                <span className="t-numeral text-[1.6rem] text-osso">{conta.comparacao.valor}</span>
                {conta.comparacao.depois}
              </p>
            </div>

            <div className="mt-8">
              <Botao
                href={linkTexto(conta.mensagemTexto)}
                variante="claro"
                tamanho="lg"
                externo
                className="w-full sm:w-auto"
              >
                <IconeTexto className="h-[18px] w-[18px]" />
                {conta.cta}
              </Botao>
            </div>
          </div>
        </Revelar>
      </div>

      <Revelar atraso={0.12}>
        <p className="mt-6 max-w-[62ch] text-[0.8rem] leading-[1.6] text-osso-3">{conta.nota}</p>
      </Revelar>
    </Secao>
  );
}
