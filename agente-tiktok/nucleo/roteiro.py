"""
ROTEIRO
Decide o que o vídeo vai dizer e mostrar.

O roteiro é um JSON — é o contrato entre decidir e gravar. Quem escreve
esse JSON pode ser:

  • a API da Anthropic, quando o agente roda sozinho (cron, VPS). Precisa
    de ANTHROPIC_API_KEY;
  • o próprio Claude Code, quando você está na sessão. Aí não precisa de
    chave nenhuma: o subagente escreve o arquivo e chama `gravar`;
  • você, na mão. É só um JSON.

Os três caminhos passam por `valida`, então um roteiro escrito à mão
quebra do mesmo jeito que um roteiro mal gerado — na hora de validar, com
mensagem clara, e não no meio da renderização.
"""
from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

from .config import Config
from .tendencias import Leitura, ganchos

ESQUEMA = """
{
  "id": "slug-curto-com-data",
  "site": "<slug do site em config.toml>",
  "gancho": "<id de um gancho da biblioteca>",
  "titulo_interno": "<para você se achar na pasta, não aparece no vídeo>",
  "cenas": [
    {
      "tipo": "rolagem",            // rolagem | estatico | interacao
      "pagina": "/",                // caminho a partir da raiz do site
      "de": "secao:hero",           // número em px, ou "secao:<id>", ou "topo"/"fim"
      "ate": "secao:precos",
      "duracao": 4.0,
      "legenda": "TEXTO NA TELA"    // curto: cabe em 2 linhas
    },
    {
      "tipo": "estatico",
      "pagina": "/",
      "em": "secao:contato",
      "duracao": 2.5,
      "zoom": 1.08,                 // opcional, 1.0 = sem zoom
      "legenda": "*DESTAQUE"        // * no início pinta na cor de destaque
    },
    {
      "tipo": "interacao",
      "pagina": "/",
      "duracao": 3.0,
      "acoes": [{"tipo": "clicar", "seletor": ".btn-pedir"}],
      "legenda": "DOIS TOQUES"
    }
  ],
  "legenda_post": "<legenda do post, até 2 linhas, sem hashtag>",
  "hashtags": ["#..."],
  "som": "<nome do som em alta pra você escolher no app, ou vazio>",
  "cta": "<a frase do último quadro>"
}
"""

INSTRUCAO = """Você escreve roteiro de TikTok para um desenvolvedor solo brasileiro que \
vende site para negócio local (restaurante, barbearia, lanchonete, loja de bairro).

Regras que não se quebram:
- 15 a 34 segundos no total. Some as durações e confira.
- A legenda da PRIMEIRA cena é o gancho. Tem que ter tensão ou número. \
Nunca cumprimento, nunca apresentação.
- Legenda de cena: no máximo 6 palavras. É texto queimado em tela de celular.
- Cena de 2 a 4,5 segundos. Nenhuma cena passa de 4,5.
- Nunca invente número de cliente, faturamento, avaliação ou resultado. \
Os sites são demonstrativos e fictícios: se o vídeo falar deles, fala como demonstração.
- Português do Brasil, falado, sem jargão de programador.
- O CTA pede comentário, não só "link na bio".

Responda SOMENTE com o JSON, sem cerca de código e sem texto antes ou depois."""


@dataclass
class Cena:
    tipo: str
    pagina: str = "/"
    duracao: float = 3.0
    legenda: str = ""
    de: str | int = "topo"
    ate: str | int = "fim"
    em: str | int = "topo"
    zoom: float = 1.0
    acoes: list[dict] = field(default_factory=list)


@dataclass
class Roteiro:
    id: str
    site: str
    cenas: list[Cena]
    gancho: str = ""
    titulo_interno: str = ""
    legenda_post: str = ""
    hashtags: list[str] = field(default_factory=list)
    som: str = ""
    cta: str = ""

    @property
    def duracao(self) -> float:
        return sum(c.duracao for c in self.cenas)

    def para_json(self) -> dict:
        return {
            "id": self.id, "site": self.site, "gancho": self.gancho,
            "titulo_interno": self.titulo_interno,
            "cenas": [
                {k: v for k, v in vars(c).items()
                 if v not in ("", 1.0, [], "topo", "fim") or k in ("tipo", "duracao", "legenda")}
                for c in self.cenas
            ],
            "legenda_post": self.legenda_post, "hashtags": self.hashtags,
            "som": self.som, "cta": self.cta,
        }


class RoteiroInvalido(ValueError):
    pass


def valida(bruto: dict, cfg: Config) -> Roteiro:
    """Rejeita cedo e com motivo. Erro aqui custa segundos; na gravação, minutos."""
    faltando = [c for c in ("id", "site", "cenas") if not bruto.get(c)]
    if faltando:
        raise RoteiroInvalido(f"faltam os campos: {', '.join(faltando)}")
    if cfg.sites and bruto["site"] not in cfg.sites:
        raise RoteiroInvalido(
            f"site '{bruto['site']}' não está em config.toml. "
            f"Disponíveis: {', '.join(cfg.sites)}"
        )

    cenas = []
    for i, c in enumerate(bruto["cenas"], 1):
        if c.get("tipo") not in ("rolagem", "estatico", "interacao"):
            raise RoteiroInvalido(f"cena {i}: tipo '{c.get('tipo')}' não existe")
        d = float(c.get("duracao", 3.0))
        if not 0.5 <= d <= 8.0:
            raise RoteiroInvalido(f"cena {i}: duração {d}s fora de 0,5–8,0")
        if len(c.get("legenda", "").split()) > 9:
            raise RoteiroInvalido(
                f"cena {i}: legenda com {len(c['legenda'].split())} palavras — "
                "corte para 6 ou menos, é texto em tela de celular"
            )
        cenas.append(
            Cena(
                tipo=c["tipo"], pagina=c.get("pagina", "/"), duracao=d,
                legenda=c.get("legenda", ""), de=c.get("de", "topo"),
                ate=c.get("ate", "fim"), em=c.get("em", "topo"),
                zoom=float(c.get("zoom", 1.0)), acoes=c.get("acoes", []),
            )
        )

    r = Roteiro(
        id=re.sub(r"[^a-z0-9-]", "-", bruto["id"].lower()),
        site=bruto["site"], cenas=cenas, gancho=bruto.get("gancho", ""),
        titulo_interno=bruto.get("titulo_interno", ""),
        legenda_post=bruto.get("legenda_post", ""),
        hashtags=[h if h.startswith("#") else f"#{h}" for h in bruto.get("hashtags", [])],
        som=bruto.get("som", ""), cta=bruto.get("cta", ""),
    )
    if not 8 <= r.duracao <= 60:
        raise RoteiroInvalido(
            f"o vídeo somaria {r.duracao:.1f}s. O alvo é 15–34s "
            "(abaixo de 15 não prova nada, acima de 35 a retenção cai)"
        )
    return r


def monta_prompt(cfg: Config, leitura: Leitura, site: str, gancho_id: str | None) -> str:
    lib = ganchos(cfg)
    escolhidos = [g for g in lib if g["id"] == gancho_id] if gancho_id else lib
    return "\n\n".join([
        INSTRUCAO,
        f"SITE A MOSTRAR: {site} (pasta: {cfg.sites.get(site, site)})",
        f"DATA: {date.today().isoformat()}",
        "SINAIS DE TENDÊNCIA (pode ignorar se não servirem ao nicho):\n"
        + (leitura.resumo() or "  nenhum"),
        "FORMATOS DISPONÍVEIS:\n" + json.dumps(escolhidos, ensure_ascii=False, indent=1),
        "ESQUEMA DE SAÍDA:\n" + ESQUEMA,
    ])


def gera_pela_api(prompt: str, cfg: Config) -> dict:
    """Chama a API da Anthropic. Só urllib, sem dependência extra."""
    chave = cfg.chave_anthropic
    if not chave:
        raise RuntimeError(
            "ANTHROPIC_API_KEY não definida.\n"
            "  • Rodando dentro do Claude Code? Use o subagente: ele escreve o "
            "roteiro direto e não precisa de chave.\n"
            "  • Rodando sozinho (cron/VPS)? Exporte a chave ou ponha no .env."
        )
    corpo = json.dumps({
        "model": cfg.modelo_claude,
        "max_tokens": 2000,
        "messages": [{"role": "user", "content": prompt}],
    }).encode()
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages", data=corpo,
        headers={
            "content-type": "application/json",
            "x-api-key": chave,
            "anthropic-version": "2023-06-01",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            resposta = json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"API devolveu {e.code}: {e.read().decode()[:400]}") from e

    texto = "".join(b.get("text", "") for b in resposta.get("content", []))
    # Cerca de código às vezes escapa mesmo com a instrução.
    texto = re.sub(r"^```(?:json)?\s*|\s*```$", "", texto.strip())
    try:
        return json.loads(texto)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"resposta não era JSON válido:\n{texto[:500]}") from e


def resolve_posicoes(r: Roteiro, pontos: dict[str, dict[str, int]]) -> None:
    """
    Troca "secao:precos" pelo pixel real, medido na página.

    É isso que deixa o roteiro escrever em termos de conteúdo ("mostra os
    preços") em vez de pixel chutado — e continuar valendo depois que o
    site mudar de tamanho.
    """
    def px(valor, pagina: str) -> int:
        p = pontos.get(pagina, {})
        altura = p.get("__altura__", 20000)
        if isinstance(valor, (int, float)):
            return int(valor)
        v = str(valor).strip()
        if v in ("topo", "inicio", "0"):
            return 0
        if v in ("fim", "final", "rodape"):
            return altura
        if v.startswith("secao:"):
            alvo = v.split(":", 1)[1]
            if alvo in p:
                return p[alvo]
            print(f"    ⚠ seção '{alvo}' não existe em {pagina} — usando o topo")
            return 0
        try:
            return int(float(v))
        except ValueError:
            return 0

    for c in r.cenas:
        c.de, c.ate, c.em = px(c.de, c.pagina), px(c.ate, c.pagina), px(c.em, c.pagina)


def salva(r: Roteiro, destino: Path) -> Path:
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(
        json.dumps(r.para_json(), ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return destino


def carrega(caminho: Path, cfg: Config) -> Roteiro:
    return valida(json.loads(Path(caminho).read_text(encoding="utf-8")), cfg)
