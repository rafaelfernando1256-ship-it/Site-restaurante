#!/usr/bin/env python3
"""
AGENTE DE TIKTOK
Lê tendência, escreve roteiro, grava o site, edita e prepara o post.

  python3 agente.py tendencias
  python3 agente.py roteiro  --site vanta-store [--gancho antes-depois]
  python3 agente.py gravar   --roteiro saida/<id>/roteiro.json
  python3 agente.py publicar --pasta saida/<id> [--api]
  python3 agente.py tudo     --site vanta-store

`tudo` é o atalho de ponta a ponta. Os passos existem separados porque é
assim que se conserta um vídeo ruim sem refazer o resto: muda o roteiro,
roda `gravar` de novo, e a captura reaproveita o que já tinha.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import time
from datetime import date
from pathlib import Path

from nucleo import captura, edicao, publicar, roteiro as rot, tendencias
from nucleo.config import RAIZ, carrega

REPO = RAIZ.parent


# ── servidor local dos sites ─────────────────────────────────────────
class Servidor:
    """
    Serve a pasta do site em localhost enquanto a gravação roda.

    Gravar direto de `file://` não serve: caminho absoluto quebra, fonte
    local é bloqueada por CORS e qualquer `fetch` morre.
    """

    def __init__(self, pasta: Path, porta: int):
        self.pasta, self.porta, self.pr = pasta, porta, None

    def __enter__(self) -> str:
        if not self.pasta.is_dir():
            raise SystemExit(f"pasta do site não existe: {self.pasta}")
        self.pr = subprocess.Popen(
            [sys.executable, "-m", "http.server", str(self.porta), "-d", str(self.pasta)],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        base = f"http://127.0.0.1:{self.porta}"
        import urllib.request

        for _ in range(40):
            try:
                urllib.request.urlopen(base, timeout=1)
                return base
            except Exception:
                time.sleep(0.25)
        raise SystemExit(f"o servidor não subiu na porta {self.porta}")

    def __exit__(self, *_):
        if self.pr:
            self.pr.terminate()
            self.pr.wait(timeout=5)


def curto(p: Path) -> str:
    """Caminho relativo à raiz do projeto quando der, absoluto quando não."""
    try:
        return str(Path(p).resolve().relative_to(RAIZ))
    except ValueError:
        return str(p)


def pasta_do_site(cfg, slug: str) -> Path:
    if slug not in cfg.sites:
        raise SystemExit(
            f"site '{slug}' não está em config.toml.\nDisponíveis: {', '.join(cfg.sites)}"
        )
    return (REPO / cfg.sites[slug]).resolve()


# ── comandos ─────────────────────────────────────────────────────────
def cmd_tendencias(args, cfg) -> None:
    leitura = tendencias.colhe(cfg, args.fonte)
    print(f"\nfonte: {leitura.fonte} · país: {leitura.pais} · colhido: {leitura.colhido_em}")
    if leitura.aviso:
        print(f"⚠ {leitura.aviso}")
    print(leitura.resumo())
    lib = tendencias.ganchos(cfg)
    print(f"\nformatos na biblioteca ({len(lib)}):")
    for g in lib:
        print(f"  {g['id']:<22} {g['nome']}")
    print()


def cmd_roteiro(args, cfg) -> Path:
    leitura = tendencias.colhe(cfg)
    prompt = rot.monta_prompt(cfg, leitura, args.site, args.gancho)

    if args.prompt:
        # Caminho sem chave de API: imprime o prompt para o Claude Code
        # (ou você) escrever o JSON e salvar com --de.
        print(prompt)
        return Path()

    if args.de:
        bruto = json.loads(Path(args.de).read_text(encoding="utf-8"))
    else:
        print("escrevendo o roteiro pela API…")
        bruto = rot.gera_pela_api(prompt, cfg)

    bruto.setdefault("id", f"{date.today().isoformat()}-{args.site}")
    bruto.setdefault("site", args.site)
    r = rot.valida(bruto, cfg)
    destino = cfg.dir_saida / r.id / "roteiro.json"
    rot.salva(r, destino)
    print(f"✓ roteiro: {curto(destino)}  ({r.duracao:.1f}s, {len(r.cenas)} cenas)")
    print(f"  gancho da abertura: “{r.cenas[0].legenda}”")
    return destino


def cmd_gravar(args, cfg) -> Path:
    caminho_rot = Path(args.roteiro).resolve()
    r = rot.carrega(caminho_rot, cfg)
    trab = caminho_rot.parent
    (trab / "paginas").mkdir(parents=True, exist_ok=True)
    (trab / "clipes").mkdir(parents=True, exist_ok=True)

    paginas_usadas = sorted({c.pagina for c in r.cenas})
    with Servidor(pasta_do_site(cfg, r.site), cfg.porta_servidor) as base:
        with captura.Capturador(cfg) as cap:
            print(f"medindo {len(paginas_usadas)} página(s)…")
            pontos = {p: cap.pontos_de_interesse(base + p) for p in paginas_usadas}
            rot.resolve_posicoes(r, pontos)

            prints: dict[str, Path] = {}
            for p in paginas_usadas:
                alvo = trab / "paginas" / (p.strip("/").replace("/", "_") or "raiz")
                alvo = alvo.with_suffix(".png")
                print(f"  print de {p} …", end="", flush=True)
                _, alt = cap.pagina_inteira(base + p, alvo)
                prints[p] = alvo
                print(f" {alt}px")

            clipes, falas, t = [], [], 0.0
            for i, c in enumerate(r.cenas, 1):
                saida_c = trab / "clipes" / f"c{i:02d}.mp4"
                print(f"  cena {i}/{len(r.cenas)} ({c.tipo}, {c.duracao}s) …", end="", flush=True)
                if c.tipo == "rolagem":
                    edicao.clipe_rolagem(prints[c.pagina], c.de, c.ate, c.duracao, cfg, saida_c)
                elif c.tipo == "estatico":
                    edicao.clipe_estatico(prints[c.pagina], c.em, c.duracao, cfg, saida_c, c.zoom)
                else:
                    acoes = [captura.Acao(**a) for a in c.acoes]
                    qs = cap.sequencia(
                        base + c.pagina, acoes, c.duracao, trab / "quadros" / f"c{i:02d}"
                    )
                    edicao.clipe_sequencia(qs, cfg, saida_c)
                clipes.append(saida_c)
                if c.legenda:
                    # 120ms de folga nas pontas: legenda que troca no mesmo
                    # quadro do corte pisca.
                    falas.append(edicao.Fala(c.legenda, t + 0.12, t + c.duracao - 0.12))
                t += c.duracao
                print(" ok")

    bruto = edicao.concatena(clipes, trab / "bruto.mp4")
    ass = edicao.escreve_ass(falas, cfg, trab / "legendas.ass")
    final = trab / f"{r.id}.mp4"
    print("queimando legenda e exportando…")
    edicao.finaliza(bruto, ass, cfg, final, dir_fontes=cfg.dir_biblioteca / "fontes")

    m = edicao.sonda(final)
    print(f"✓ vídeo: {curto(final)}  "
          f"({m['duracao']:.1f}s, {m['mb']:.1f} MB, "
          f"{m.get('largura','?')}x{m.get('altura','?')})")
    if not args.manter:
        edicao.limpa(trab)
        bruto.unlink(missing_ok=True)
    return final


def cmd_publicar(args, cfg) -> None:
    pasta = Path(args.pasta).resolve()
    r = rot.carrega(pasta / "roteiro.json", cfg)
    video = next(pasta.glob("*.mp4"), None)
    if not video:
        raise SystemExit(f"nenhum .mp4 em {pasta} — rode `gravar` antes")

    if args.api:
        res = publicar.envia(video, f"{r.legenda_post}\n\n{' '.join(r.hashtags)}",
                             cfg, direto=args.direto)
        print(("✓ " if res.ok else "✗ ") + res.detalhe)
        if not res.ok:
            sys.exit(1)
        return

    destino = publicar.prepara(video, r, cfg, pasta / "postar")
    print(f"✓ pronto para subir: {curto(destino)}")
    print((destino / "COMO-POSTAR.txt").read_text(encoding="utf-8"))


def cmd_tudo(args, cfg) -> None:
    caminho = cmd_roteiro(args, cfg)
    args.roteiro = caminho
    cmd_gravar(args, cfg)
    args.pasta = caminho.parent
    args.api = args.api if hasattr(args, "api") else False
    cmd_publicar(args, cfg)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    t = sub.add_parser("tendencias", help="mostra o que está em alta e os formatos")
    t.add_argument("--fonte", choices=list(tendencias.FONTES))

    for nome in ("roteiro", "tudo"):
        s = sub.add_parser(nome, help="escreve o roteiro" if nome == "roteiro"
                           else "roteiro + gravação + preparo, de ponta a ponta")
        s.add_argument("--site", required=True)
        s.add_argument("--gancho", help="id de um formato da biblioteca")
        s.add_argument("--de", help="usa um roteiro JSON já escrito em vez de chamar a API")
        s.add_argument("--prompt", action="store_true",
                       help="só imprime o prompt, para o Claude Code escrever o roteiro")
        s.add_argument("--manter", action="store_true", help="não apaga os intermediários")
        s.add_argument("--api", action="store_true", help="publica pela API em vez de preparar")
        s.add_argument("--direto", action="store_true",
                       help="publica direto em vez de mandar pro rascunho (exige auditoria)")

    g = sub.add_parser("gravar", help="captura o site e monta o vídeo")
    g.add_argument("--roteiro", required=True)
    g.add_argument("--manter", action="store_true")

    v = sub.add_parser("publicar", help="prepara o post (ou envia pela API)")
    v.add_argument("--pasta", required=True)
    v.add_argument("--api", action="store_true")
    v.add_argument("--direto", action="store_true")

    args = p.parse_args()
    cfg = carrega()
    {"tendencias": cmd_tendencias, "roteiro": cmd_roteiro, "gravar": cmd_gravar,
     "publicar": cmd_publicar, "tudo": cmd_tudo}[args.cmd](args, cfg)


if __name__ == "__main__":
    main()
