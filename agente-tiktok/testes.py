"""Testes do agente. Sem dependência de rede nem de navegador."""
import json, sys, tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from nucleo import roteiro as rot, edicao, tendencias, publicar
from nucleo.config import carrega, ffmpeg

cfg = carrega()
ok, mau = 0, []
def t(nome, cond):
    global ok
    if cond: ok += 1
    else: mau.append(nome)

base = {"id": "t", "site": "vanta-store",
        "cenas": [{"tipo": "rolagem", "duracao": 4.0, "legenda": "oi"},
                  {"tipo": "rolagem", "duracao": 4.0, "legenda": "oi"},
                  {"tipo": "estatico", "duracao": 4.0, "legenda": "oi"},
                  {"tipo": "estatico", "duracao": 4.0, "legenda": "oi"}]}

# ── validação ───────────────────────────────────────────────────────
t("roteiro válido passa", rot.valida(json.loads(json.dumps(base)), cfg).duracao == 16.0)

def rejeita(mut, trecho):
    d = json.loads(json.dumps(base)); mut(d)
    try:
        rot.valida(d, cfg); return False
    except rot.RoteiroInvalido as e:
        return trecho.lower() in str(e).lower()

t("rejeita site fora do config", rejeita(lambda d: d.update(site="nao-existe"), "não está em config"))
t("rejeita tipo de cena inválido", rejeita(lambda d: d["cenas"][0].update(tipo="voar"), "não existe"))
t("rejeita cena longa demais", rejeita(lambda d: d["cenas"][0].update(duracao=20.0), "fora de"))
t("rejeita cena curta demais", rejeita(lambda d: d["cenas"][0].update(duracao=0.1), "fora de"))
t("rejeita legenda prolixa", rejeita(lambda d: d["cenas"][0].update(
    legenda="uma legenda absurdamente longa que jamais caberia em tela de celular nenhum"), "palavras"))
t("rejeita vídeo curto demais", rejeita(lambda d: d.update(cenas=[d["cenas"][0]]), "alvo é 15"))
t("rejeita vídeo longo demais", rejeita(lambda d: d.update(cenas=d["cenas"] * 5), "alvo é 15"))
t("rejeita campo faltando", rejeita(lambda d: d.pop("cenas"), "faltam os campos"))

# ── posições por seção ──────────────────────────────────────────────
r = rot.valida(json.loads(json.dumps(base)), cfg)
r.cenas[0].de, r.cenas[0].ate = "topo", "secao:precos"
r.cenas[1].de, r.cenas[1].ate = "secao:inexistente", "fim"
rot.resolve_posicoes(r, {"/": {"precos": 4200, "__altura__": 9000}})
t("'topo' vira 0", r.cenas[0].de == 0)
t("'secao:precos' vira o pixel medido", r.cenas[0].ate == 4200)
t("seção inexistente cai no topo", r.cenas[1].de == 0)
t("'fim' vira a altura da página", r.cenas[1].ate == 9000)

# ── easing ──────────────────────────────────────────────────────────
t("suave(0) = 0", abs(edicao.suave(0.0)) < 1e-9)
t("suave(1) = 1", abs(edicao.suave(1.0) - 1) < 1e-9)
t("suave(0,5) = 0,5", abs(edicao.suave(0.5) - 0.5) < 1e-9)
t("suave é monotônico", all(edicao.suave(i/50) <= edicao.suave((i+1)/50) for i in range(50)))
t("suave arranca devagar", edicao.suave(0.1) < 0.1)

# ── legenda ASS ─────────────────────────────────────────────────────
with tempfile.TemporaryDirectory() as d:
    a = edicao.escreve_ass(
        [edicao.Fala("PRIMEIRA", 0.0, 2.0), edicao.Fala("*DESTACADA", 2.0, 4.0)],
        cfg, Path(d) / "x.ass")
    txt = a.read_text(encoding="utf-8")
    t("ASS tem cabeçalho de estilos", "[V4+ Styles]" in txt)
    t("ASS sobe para caixa alta", "PRIMEIRA" in txt)
    t("ASS usa o estilo de destaque com *", ",Destaque,," in txt)
    t("ASS não deixa o * no texto", "*DESTACADA" not in txt)
    t("ASS usa a fonte do config", cfg.marca.fonte in txt)
    t("ASS usa o corpo do config", f",{cfg.marca.corpo_legenda}," in txt)
    t("ASS formata o tempo certo", "0:00:00.00" in txt and "0:00:02.00" in txt)

# ── scrim ───────────────────────────────────────────────────────────
with tempfile.TemporaryDirectory() as d:
    from PIL import Image
    s = edicao.scrim(cfg, Path(d) / "s.png")
    im = Image.open(s)
    t("scrim tem o tamanho do vídeo", im.size == (cfg.video.largura, cfg.video.altura))
    t("scrim é transparente no topo", im.getpixel((540, 10))[3] == 0)
    t("scrim é opaco no rodapé", im.getpixel((540, cfg.video.altura - 10))[3] > 90)

# ── config ──────────────────────────────────────────────────────────
t("escala bate com a largura", abs(cfg.video.escala * cfg.video.largura_css - cfg.video.largura) < 1)
t("ffmpeg existe", Path(ffmpeg()).exists())
t("há sites configurados", len(cfg.sites) > 0)
t("segredo não vem do toml", cfg.tiktok_client_key is None or "TIKTOK_CLIENT_KEY" in __import__("os").environ)

# ── tendências ──────────────────────────────────────────────────────
l = tendencias.colhe(cfg, "manual")
t("fonte manual lê o arquivo", l.fonte == "manual")
t("sinais trazem a origem", all(s.origem == "manual" for s in l.sinais))
g = tendencias.ganchos(cfg)
t("biblioteca tem formatos", len(g) >= 8)
t("todo gancho tem primeira frase", all(x.get("primeira_frase") for x in g))
t("todo gancho tem batidas", all(x.get("batidas") for x in g))
t("todo gancho tem cta", all(x.get("cta") for x in g))
t("ids de gancho são únicos", len({x["id"] for x in g}) == len(g))

# ── publicação ──────────────────────────────────────────────────────
t("envia sem token falha limpo", publicar.envia(Path("/dev/null"), "x", cfg).ok is False)
with tempfile.TemporaryDirectory() as d:
    v = Path(d) / "v.mp4"; v.write_bytes(b"x")
    r2 = rot.valida(json.loads(json.dumps(base)), cfg)
    r2.legenda_post, r2.hashtags = "Legenda de teste", ["#um", "#dois"]
    p = publicar.prepara(v, r2, cfg, Path(d) / "postar")
    t("prepara escreve legenda.txt", (p / "legenda.txt").exists())
    t("prepara escreve a ficha", (p / "COMO-POSTAR.txt").exists())
    t("legenda junta as hashtags", "#um #dois" in (p / "legenda.txt").read_text(encoding="utf-8"))
    t("ficha avisa sobre o som no app", "DENTRO do app" in (p / "COMO-POSTAR.txt").read_text(encoding="utf-8"))

print(f"{ok}/{ok+len(mau)} testes passaram")
if mau:
    print("FALHARAM:\n - " + "\n - ".join(mau)); sys.exit(1)
