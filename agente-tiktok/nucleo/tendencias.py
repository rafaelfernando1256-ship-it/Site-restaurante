"""
TENDÊNCIAS

Leia isto antes de confiar no módulo.

O TikTok NÃO tem API pública e gratuita de tendências. O que existe:

  • Creative Center (ads.tiktok.com/business/creativecenter) — tem hashtag,
    som e vídeo em alta por país. É página web, não API. Dá para ler com
    navegador, mas isso é raspagem: cabe nos Termos de Serviço deles
    discutir, pode quebrar quando mudarem o HTML e pode bloquear seu IP.
    Fica disponível aqui, desligado por padrão, e a decisão é sua.

  • Research API — só para pesquisador com vínculo acadêmico aprovado.

  • Serviços pagos (Apify, RapidAPI e afins) — funcionam, custam, e você
    precisa da sua própria chave.

Por isso o padrão é `manual`: você abre o TikTok, olha o que está
rodando no seu nicho e anota em `dados/tendencias.json`. Leva três
minutos por semana e é o dado mais confiável que existe, porque é o seu
feed, do seu público, e não a média do país.

E uma observação que vale mais que o módulo inteiro: para quem vende
serviço local, **hashtag em alta importa pouco**. O que carrega vídeo
desse nicho é o FORMATO — o gancho nos três primeiros segundos, o ritmo
do corte, a promessa concreta. Isso está em `biblioteca/ganchos.json`,
não depende de dado ao vivo e envelhece muito mais devagar.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from .config import Config


@dataclass
class Sinal:
    """Uma coisa em alta, com a procedência registrada."""

    tipo: str  # hashtag | som | formato | tema
    valor: str
    origem: str  # de onde veio: manual, creative-center, apify...
    observacao: str = ""
    forca: int = 0  # 0–100, só quando a fonte dá um número de verdade


@dataclass
class Leitura:
    colhido_em: str
    pais: str
    fonte: str
    sinais: list[Sinal] = field(default_factory=list)
    aviso: str = ""

    def por_tipo(self, tipo: str) -> list[Sinal]:
        return [s for s in self.sinais if s.tipo == tipo]

    def resumo(self) -> str:
        if not self.sinais:
            return "nenhum sinal — preencha dados/tendencias.json"
        linhas = []
        for tipo in ("formato", "tema", "hashtag", "som"):
            itens = self.por_tipo(tipo)
            if itens:
                linhas.append(f"  {tipo}: " + ", ".join(s.valor for s in itens[:6]))
        return "\n".join(linhas)


# ── fonte 1: você mesmo (padrão) ─────────────────────────────────────
def _manual(cfg: Config) -> Leitura:
    arq = cfg.dir_dados / "tendencias.json"
    if not arq.exists():
        modelo = cfg.dir_dados / "tendencias.exemplo.json"
        if modelo.exists():
            arq.write_text(modelo.read_text(encoding="utf-8"), encoding="utf-8")
        else:
            arq.write_text(
                json.dumps({"sinais": []}, ensure_ascii=False, indent=2), encoding="utf-8"
            )
        print(f"  criei {arq.relative_to(cfg.dir_dados.parent)} — preencha e rode de novo")

    bruto = json.loads(arq.read_text(encoding="utf-8"))
    sinais = [
        Sinal(
            tipo=s.get("tipo", "tema"),
            valor=s["valor"],
            origem="manual",
            observacao=s.get("observacao", ""),
            forca=int(s.get("forca", 0)),
        )
        for s in bruto.get("sinais", [])
        if s.get("valor")
    ]
    return Leitura(
        colhido_em=bruto.get("atualizado_em", "—"),
        pais=cfg.pais,
        fonte="manual",
        sinais=sinais,
        aviso="" if sinais else "arquivo vazio: o roteiro vai sair só da biblioteca de ganchos",
    )


# ── fonte 2: Creative Center, por navegador (opt-in) ─────────────────
def _creative_center(cfg: Config) -> Leitura:
    """
    Lê a página pública de hashtags em alta do Creative Center.

    DESLIGADO POR PADRÃO. É raspagem de página: pode violar os Termos de
    Serviço do TikTok, quebra quando eles mudarem o HTML e pode render
    bloqueio do seu IP. Ligue em config.toml só se você aceitar isso.
    Nunca roda sem você pedir.
    """
    from playwright.sync_api import sync_playwright

    from .config import chromium

    url = (
        "https://ads.tiktok.com/business/creativecenter/inspiration/popular/"
        f"hashtag/pc/en?period=7&countryCode={cfg.pais}"
    )
    sinais: list[Sinal] = []
    aviso = ""
    try:
        with sync_playwright() as p:
            exe = chromium()
            nav = p.chromium.launch(executable_path=exe, args=["--no-sandbox"]) if exe \
                else p.chromium.launch(args=["--no-sandbox"])
            pg = nav.new_context(locale="pt-BR").new_page()
            pg.goto(url, wait_until="networkidle", timeout=45_000)
            pg.wait_for_timeout(2500)
            itens = pg.evaluate(
                """() => [...document.querySelectorAll('[class*="titleText"], [class*="hashtagName"]')]
                     .map(e => e.textContent.trim()).filter(Boolean).slice(0, 25)"""
            )
            nav.close()
        sinais = [
            Sinal("hashtag", t if t.startswith("#") else f"#{t}", "creative-center")
            for t in itens
        ]
        if not sinais:
            aviso = "a página carregou mas nenhum item foi reconhecido — o HTML deles mudou"
    except Exception as e:
        aviso = f"não consegui ler o Creative Center: {e}"

    return Leitura(
        colhido_em=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        pais=cfg.pais,
        fonte="creative-center",
        sinais=sinais,
        aviso=aviso,
    )


# ── fonte 3: serviço pago, com a sua chave ───────────────────────────
def _apify(cfg: Config) -> Leitura:
    import os
    import urllib.request

    token = os.environ.get("APIFY_TOKEN")
    if not token:
        return Leitura(
            colhido_em="—", pais=cfg.pais, fonte="apify", sinais=[],
            aviso="APIFY_TOKEN não definido no ambiente",
        )
    ator = os.environ.get("APIFY_ATOR", "clockworks~tiktok-scraper")
    url = f"https://api.apify.com/v2/acts/{ator}/runs/last/dataset/items?token={token}&limit=50"
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            itens = json.loads(r.read())
    except Exception as e:
        return Leitura(colhido_em="—", pais=cfg.pais, fonte="apify", sinais=[],
                       aviso=f"falha na chamada: {e}")

    contagem: dict[str, int] = {}
    for it in itens:
        for h in it.get("hashtags", []) or []:
            nome = h.get("name") if isinstance(h, dict) else str(h)
            if nome:
                contagem[f"#{nome.lstrip('#')}"] = contagem.get(f"#{nome.lstrip('#')}", 0) + 1
    ordenado = sorted(contagem.items(), key=lambda x: -x[1])[:20]
    topo = ordenado[0][1] if ordenado else 1
    return Leitura(
        colhido_em=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        pais=cfg.pais, fonte="apify",
        sinais=[Sinal("hashtag", h, "apify", forca=round(100 * n / topo))
                for h, n in ordenado],
    )


FONTES = {"manual": _manual, "creative-center": _creative_center, "apify": _apify}


def colhe(cfg: Config, fonte: str | None = None) -> Leitura:
    nome = fonte or cfg.fonte_tendencias
    if nome not in FONTES:
        raise ValueError(f"fonte '{nome}' não existe. Use: {', '.join(FONTES)}")
    leitura = FONTES[nome](cfg)
    destino = cfg.dir_cache / "ultima-leitura.json"
    destino.write_text(
        json.dumps(asdict(leitura), ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return leitura


def ganchos(cfg: Config) -> list[dict]:
    """A biblioteca de formatos. É o que não depende de dado ao vivo."""
    arq = cfg.dir_biblioteca / "ganchos.json"
    if not arq.exists():
        return []
    return json.loads(arq.read_text(encoding="utf-8")).get("ganchos", [])
