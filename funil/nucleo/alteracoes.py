"""
AS ALTERAÇÕES — o cliente pede no WhatsApp, o estúdio faz

  cliente: "tira a lasanha do cardápio e põe o X-Tudo a R$ 28"
     ↓  atendente entende, anota o pedido e responde "deixa comigo"
     ↓  estúdio: guarda uma cópia do site, chama o Claude Code na pasta
     ↓  com o pedido, confere, empacota e republica NO MESMO endereço
  cliente: "Pronto! Já está no ar: <link>"

POR QUE GUARDA CÓPIA ANTES

O site é dele e está no ar. Uma alteração que quebra a página não pode
ser o fim da história: a cópia de antes fica em `versoes/` e voltar é
copiar a pasta de volta e rodar `funil.py publicar`.

O QUE ELE NÃO FAZ

**Não mexe em mais nada além do pedido.** A instrução diz isso com todas
as letras, e o Claude Code trabalha só dentro da pasta do site.

**Não inventa o que o pedido não diz.** "Põe o preço novo" sem dizer qual
nem chega aqui: o atendente pergunta antes de anotar.

**Não manda "pronto" sem estar pronto.** A mensagem para o cliente só é
escrita depois que a Netlify devolve o deploy `ready`.
"""
from __future__ import annotations

import shutil
import time
from pathlib import Path
from typing import Any

from .a3_estudio import claude_code, empacota, tem_claude_code
from .estado import Estado

AGENTE = 'estudio_alteracoes'

PEDE_ALTERACAO = """Este é o site de um cliente, já no ar. Ele pediu pelo \
WhatsApp a alteração abaixo.

PEDIDO DO CLIENTE
{pedido}

O QUE FAZER
- Faça SÓ o que foi pedido. Não mude layout, cor, texto ou seção que o \
pedido não cita.
- O site publicado é a pasta `publico/` (index.html na raiz). Se existir um \
gerador (`construir.mjs`) e o texto morar em `conteudo/`, mude lá e rode \
`node construir.mjs`; senão, mude direto em `publico/`.
- Se o pedido cita uma foto nova, ela está em `{fotos}` (se a pasta existir). \
Sem a foto, faça o resto e diga que faltou a foto.
- Não invente nada: preço, horário e telefone só como o cliente escreveu.
- Quando terminar, responda em UMA linha, para o cliente ler, o que foi \
mudado. Se algo do pedido não deu para fazer, diga o quê e por quê."""

# O gerador precisa do node; o resto é edição de arquivo.
FERRAMENTAS_ALTERACAO = 'Read,Write,Edit,Glob,Grep,Bash(node:*)'


def pasta_do_site(est: Estado, lead_id: int) -> Path | None:
    d = est.demo(lead_id)
    if d and d['pasta'] and (Path(d['pasta']) / 'publico' / 'index.html').exists():
        return Path(d['pasta'])
    return None


def guarda_versao(pasta: Path) -> Path:
    """Cópia de `publico/` (e do gerador, se houver) antes de mexer."""
    destino = pasta / 'versoes' / time.strftime('%Y%m%d-%H%M%S')
    destino.mkdir(parents=True, exist_ok=True)
    for nome in ('publico', 'conteudo', 'modelos'):
        if (pasta / nome).is_dir():
            shutil.copytree(pasta / nome, destino / nome, dirs_exist_ok=True)
    return destino


def faz(est: Estado, cfg, limite: int = 3, executor: Any = None,
        publica: Any = None) -> dict[str, int]:
    """Faz os pedidos novos, republica e deixa a mensagem de 'pronto'."""
    conta = {'feitos': 0, 'falhas': 0, 'esperando': 0}
    for p in est.pedidos('novo')[:limite]:
        lead = est.lead(p['lead_id'])
        pasta = pasta_do_site(est, lead.id)
        if pasta is None:
            est.marca_pedido(p['id'], 'esperando', 'não achei a pasta do site')
            est.avisa('alteracao', f'pedido #{p["id"]} ("{p["texto"][:120]}"): não achei '
                      'a pasta do site no computador. Cadastre com "funil.py cliente".',
                      lead.id)
            conta['esperando'] += 1
            continue
        if not (executor or tem_claude_code()):
            est.marca_pedido(p['id'], 'esperando', 'Claude Code não instalado')
            est.avisa('alteracao', f'pedido #{p["id"]}: o Claude Code não está instalado '
                      'nesta máquina. Instale (npm i -g @anthropic-ai/claude-code) '
                      'ou faça à mão.', lead.id)
            conta['esperando'] += 1
            continue

        est.marca_pedido(p['id'], 'fazendo')
        print(f'  ✎ pedido #{p["id"]} de {lead.nome}: {p["texto"][:80]}')
        versao = guarda_versao(pasta)
        fotos = cfg.material / lead.slug / f'alteracao-{p["id"]}'
        try:
            relato = claude_code(
                PEDE_ALTERACAO.format(pedido=p['texto'], fotos=fotos),
                pasta, cfg.estudio_modelo_alteracao, cfg.estudio_esforco_alteracao,
                tempo_limite=1800, executor=executor, ferramentas=FERRAMENTAS_ALTERACAO,
                extra=['--add-dir', str(fotos)] if fotos.is_dir() else ())
            if not (pasta / 'publico' / 'index.html').exists():
                raise RuntimeError('a alteração apagou publico/index.html')
            zip_ = empacota(pasta)
            d = est.demo(lead.id)
            url = d['url'] or ''
            if cfg.netlify:
                if publica is None:
                    from .a4_entrega import confere_equipe
                    from .a4_entrega import publica as _publica
                    equipe = confere_equipe(cfg.netlify, cfg.equipe_netlify)

                    def publica(token, lead_, zip__, site_id_):
                        return _publica(token, lead_, zip__, equipe, site_id_)
                # Mesmo site_id = mesmo endereço: o cliente não recebe link novo.
                url, site_id = publica(cfg.netlify, lead, zip_, d['site_id'] or '')
                est.guarda_demo(lead.id, url=url, site_id=site_id, zip=str(zip_))
            else:
                est.avisa('alteracao', f'pedido #{p["id"]} feito, mas sem NETLIFY_TOKEN '
                          'não publiquei.', lead.id)
            resumo = relato.strip().splitlines()[-1] if relato.strip() else p['texto']
            est.marca_pedido(p['id'], 'feito', resumo[:500])
            if url and cfg.netlify:
                est.guarda_mensagem(lead.id, 'alteracao',
                                    f'Pronto! {resumo.rstrip(".")}. Já está no ar: {url}')
            est.anota(AGENTE, 'feito', lead.id, f'#{p["id"]} {resumo[:200]}')
            conta['feitos'] += 1
            print(f'  ✓ pedido #{p["id"]}: {resumo[:100]}')
        except Exception as e:
            # Volta o site como estava: o cliente continua com o que tinha.
            for nome in ('publico', 'conteudo', 'modelos'):
                if (versao / nome).is_dir():
                    shutil.rmtree(pasta / nome, ignore_errors=True)
                    shutil.copytree(versao / nome, pasta / nome)
            est.marca_pedido(p['id'], 'falhou', str(e)[:500])
            est.avisa('alteracao', f'pedido #{p["id"]} falhou e o site voltou como '
                      f'estava: {str(e)[:200]}', lead.id)
            conta['falhas'] += 1
            print(f'  ✗ pedido #{p["id"]}: {e}')
    return conta
