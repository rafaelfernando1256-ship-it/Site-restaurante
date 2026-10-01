"""
PUBLICAÇÃO

Dois modos. O padrão é `preparar`, porque é o que funciona hoje sem você
abrir conta de desenvolvedor em lugar nenhum.

  preparar  — deixa numa pasta o MP4, a legenda pronta pra colar, as
              hashtags e um lembrete do som a escolher. Você sobe pelo
              app, leva meio minuto. Zero dependência, zero risco.

  api       — usa a Content Posting API de verdade. Exige app aprovado
              em developers.tiktok.com e token OAuth do seu usuário.

O QUE SABER ANTES DE QUERER O MODO `api`
----------------------------------------
1. App sem auditoria não publica em público. O TikTok força SELF_ONLY
   (só você vê) até auditar o app. Para publicar aberto, você precisa
   pedir auditoria e passar.
2. Existem dois caminhos, e eles pedem escopos diferentes:
     • inbox  (escopo video.upload)  — cai no seu rascunho, você termina
       no app. É o que app sem auditoria consegue fazer de útil.
     • direto (escopo video.publish) — publica sem passar pelo app.
       Exige auditoria.
3. Postar pela API tem um custo escondido: você perde o seletor de som
   do aplicativo. E som em alta é metade da distribuição neste nicho.
   Por isso, mesmo com a API ligada, `preparar` continua sendo a escolha
   certa na maioria dos dias. Não é limitação do código — é o que rende
   mais alcance.
"""
from __future__ import annotations

import json
import textwrap
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from .config import Config

BASE = "https://open.tiktokapis.com/v2"
AUTORIZA = "https://www.tiktok.com/v2/auth/authorize/"


# ── modo padrão: preparar para subir na mão ──────────────────────────
def prepara(video: Path, roteiro, cfg: Config, pasta: Path) -> Path:
    """Escreve tudo que você precisa ter na mão na hora de postar."""
    pasta.mkdir(parents=True, exist_ok=True)
    legenda = roteiro.legenda_post.strip()
    tags = " ".join(roteiro.hashtags)
    texto_post = f"{legenda}\n\n{tags}".strip()

    (pasta / "legenda.txt").write_text(texto_post, encoding="utf-8")

    som = roteiro.som or "(escolha um som em alta na hora de postar)"
    ficha = textwrap.dedent(
        f"""\
        POSTAR: {roteiro.titulo_interno or roteiro.id}
        ───────────────────────────────────────────────
        vídeo    {video.name}
        gerado   {datetime.now().strftime('%d/%m/%Y %H:%M')}
        formato  {cfg.video.largura}x{cfg.video.altura}, {cfg.video.fps}fps

        1. Abra o TikTok e escolha este arquivo.
        2. Som: {som}
           ↳ escolha DENTRO do app. Som da biblioteca entra na
             distribuição daquele som; áudio embutido no arquivo não
             entra, e ainda arrisca direito autoral.
        3. Cole a legenda (está em legenda.txt):

        {textwrap.indent(texto_post, '           ')}

        4. Capa: escolha um quadro do meio, não o primeiro.
        5. Antes de publicar, confira: o vídeo é demonstrativo e nenhum
           número de cliente ou resultado foi inventado.
        """
    )
    (pasta / "COMO-POSTAR.txt").write_text(ficha, encoding="utf-8")
    return pasta


# ── modo api ─────────────────────────────────────────────────────────
@dataclass
class Resultado:
    ok: bool
    publish_id: str = ""
    detalhe: str = ""


def _post(caminho: str, token: str, corpo: dict) -> dict:
    req = urllib.request.Request(
        f"{BASE}{caminho}",
        data=json.dumps(corpo).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=UTF-8",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"error": {"code": str(e.code), "message": e.read().decode()[:500]}}


def url_de_autorizacao(cfg: Config, redirect_uri: str, state: str = "x") -> str:
    """Primeiro passo do OAuth: o link que você abre no navegador."""
    if not cfg.tiktok_client_key:
        raise RuntimeError("TIKTOK_CLIENT_KEY não definida")
    from urllib.parse import urlencode

    return AUTORIZA + "?" + urlencode({
        "client_key": cfg.tiktok_client_key,
        # video.upload = rascunho. Troque por video.publish quando o app
        # tiver passado pela auditoria e você quiser publicar direto.
        "scope": "user.info.basic,video.upload",
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "state": state,
    })


def troca_codigo(cfg: Config, codigo: str, redirect_uri: str) -> dict:
    """Segundo passo: o código da URL de retorno vira access token."""
    from urllib.parse import urlencode

    dados = urlencode({
        "client_key": cfg.tiktok_client_key,
        "client_secret": cfg.tiktok_client_secret,
        "code": codigo,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri,
    }).encode()
    req = urllib.request.Request(
        f"{BASE}/oauth/token/", data=dados,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def info_do_criador(token: str) -> dict:
    """
    O TikTok EXIGE essa consulta antes de postar. Ela devolve os limites
    da conta (duração máxima, opções de privacidade permitidas). Pular
    esse passo é motivo de reprovação na auditoria.
    """
    return _post("/post/publish/creator_info/query/", token, {})


def envia(
    video: Path,
    legenda: str,
    cfg: Config,
    direto: bool = False,
    privacidade: str = "SELF_ONLY",
) -> Resultado:
    """
    Sobe o vídeo. `direto=False` manda pro rascunho (escopo video.upload);
    `direto=True` publica (escopo video.publish, exige auditoria).
    """
    token = cfg.tiktok_access_token
    if not token:
        return Resultado(False, detalhe="TIKTOK_ACCESS_TOKEN não definido")

    tamanho = video.stat().st_size
    info = info_do_criador(token)
    if info.get("error", {}).get("code") not in (None, "ok"):
        return Resultado(False, detalhe=f"creator_info falhou: {info['error']}")

    # Arquivo inteiro num pedaço só. A API aceita isso quando o vídeo é
    # menor que 64 MB — e um TikTok de 30s fica muito abaixo disso.
    origem = {
        "source": "FILE_UPLOAD",
        "video_size": tamanho,
        "chunk_size": tamanho,
        "total_chunk_count": 1,
    }
    if direto:
        corpo = {
            "post_info": {
                "title": legenda[:2200],
                "privacy_level": privacidade,
                "disable_duet": False,
                "disable_comment": False,
                "disable_stitch": False,
            },
            "source_info": origem,
        }
        caminho = "/post/publish/video/init/"
    else:
        corpo = {"source_info": origem}
        caminho = "/post/publish/inbox/video/init/"

    inicio = _post(caminho, token, corpo)
    if inicio.get("error", {}).get("code") not in (None, "ok"):
        return Resultado(False, detalhe=f"init falhou: {inicio.get('error')}")
    dados = inicio.get("data", {})
    url_upload, publish_id = dados.get("upload_url"), dados.get("publish_id", "")
    if not url_upload:
        return Resultado(False, detalhe=f"a API não devolveu upload_url: {inicio}")

    req = urllib.request.Request(
        url_upload, data=video.read_bytes(), method="PUT",
        headers={
            "Content-Type": "video/mp4",
            "Content-Range": f"bytes 0-{tamanho - 1}/{tamanho}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            if r.status not in (200, 201, 204):
                return Resultado(False, publish_id, f"upload devolveu {r.status}")
    except urllib.error.HTTPError as e:
        return Resultado(False, publish_id, f"upload falhou {e.code}: {e.read().decode()[:300]}")

    onde = "publicado" if direto else "enviado para os seus rascunhos"
    return Resultado(True, publish_id, f"{onde} (publish_id {publish_id})")


def status(publish_id: str, cfg: Config) -> dict:
    return _post(
        "/post/publish/status/fetch/", cfg.tiktok_access_token or "",
        {"publish_id": publish_id},
    )
