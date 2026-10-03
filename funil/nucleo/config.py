"""
CONFIGURAÇÃO

Nenhuma chave dentro de código. Nenhuma chave dentro do git. A ordem de
procura é: variável de ambiente, depois `.env` na raiz do projeto, depois
`config.toml` (só para o que não é segredo).

Segredo vai no ambiente ou no `.env` — e `.env` está no `.gitignore`.
"""
from __future__ import annotations

import os
import tomllib
from dataclasses import dataclass, field
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BANCO = RAIZ / 'dados' / 'funil.db'
SAIDA = RAIZ / 'saida'
MATERIAL = RAIZ / 'material'      # capturas do Instagram, uma pasta por lead

MODELO = 'claude-opus-5-5'
MODELO_GEMINI = 'gemini-3.8-flash'
MODELO_OPENROUTER = ''   # vazio = escolhe do catálogo

# Termos de busca padrão. Sem "restaurante" sozinho: o Places devolve
# shopping e praça de alimentação. Termo específico traz casa específica.
TERMOS = [
    'restaurante caseiro', 'comida regional', 'pizzaria', 'hamburgueria',
    'churrascaria', 'restaurante japonês', 'açaí', 'cafeteria',
    'padaria e confeitaria', 'restaurante self service', 'esfiharia',
    'comida nordestina', 'sorveteria', 'tapiocaria',
]


def _carrega_env() -> None:
    """Lê o `.env` sem dependência, sem sobrescrever o que já está no ambiente."""
    arquivo = RAIZ / '.env'
    if not arquivo.exists():
        return
    for linha in arquivo.read_text(encoding='utf-8').splitlines():
        linha = linha.strip()
        if not linha or linha.startswith('#') or '=' not in linha:
            continue
        chave, valor = linha.split('=', 1)
        chave = chave.strip()
        valor = valor.strip().strip('"').strip("'")
        if chave and chave not in os.environ:
            os.environ[chave] = valor


_carrega_env()


@dataclass
class Config:
    # segredos
    google_places: str = ''
    anthropic: str = ''
    gemini: str = ''
    openrouter: str = ''
    netlify: str = ''
    whatsapp_token: str = ''
    whatsapp_phone_id: str = ''

    # ── capturas do Instagram ───────────────────────────────────────
    capturar_sozinho: bool = True        # tira os prints do perfil do lead
    posts_por_perfil: int = 3            # quantos posts abrir (cardápio mora neles)
    perfil_instagram: str = ''           # pasta do Chrome logado no Instagram

    # ── a vigia (acompanhamento das conversas em andamento) ─────────
    responder_sozinho: bool = True       # responde quem escreveu para você
    varredura_a_cada: int = 10           # de N em N voltas, confere todo mundo
    perfil_whatsapp: str = ''            # pasta do perfil logado do WhatsApp Web
    horario: list = field(default_factory=lambda: [8, 21])
    intervalo_segundos: list = field(default_factory=lambda: [20, 60])
    max_por_dia: int = 60

    # preferências
    # claude | gemini | openrouter — quem escreve as abordagens, tria as
    # respostas e lê o Instagram. Sai sozinho da chave que existir no .env.
    provedor: str = ''
    modelo: str = MODELO
    modelo_gemini: str = MODELO_GEMINI
    modelo_openrouter: str = MODELO_OPENROUTER
    cidade: str = ''
    canal_envio: str = 'link'      # link (padrão) | cloud
    equipe_netlify: str = 'conta5197-99'
    termos: list[str] = field(default_factory=lambda: list(TERMOS))

    # caminhos
    banco: Path = BANCO
    saida: Path = SAIDA
    material: Path = MATERIAL

    @property
    def modelo_do_cerebro(self) -> str:
        return {'gemini': self.modelo_gemini,
                'openrouter': self.modelo_openrouter}.get(self.provedor, self.modelo)

    def exige_cerebro(self) -> None:
        self.exige({'gemini': 'gemini',
                    'openrouter': 'openrouter'}.get(self.provedor, 'anthropic'))

    def exige(self, *chaves: str) -> None:
        """Falha cedo, com o nome exato da variável que falta."""
        nomes = {
            'google_places': 'GOOGLE_PLACES_KEY',
            'anthropic': 'ANTHROPIC_API_KEY',
            'gemini': 'GEMINI_API_KEY',
            'openrouter': 'OPENROUTER_API_KEY',
            'netlify': 'NETLIFY_TOKEN',
        }
        faltam = [nomes.get(c, c.upper()) for c in chaves if not getattr(self, c, '')]
        if faltam:
            raise SystemExit(
                'Falta configurar: ' + ', '.join(faltam) + '\n'
                f'Coloque no ambiente ou em {RAIZ / ".env"} (veja .env.exemplo).'
            )


def _le_toml(arquivo: Path) -> dict:
    """
    Lê o config.toml dizendo o que está errado em vez de despejar um
    traceback. O erro mais comum é chave repetida — TOML recusa duas
    linhas com o mesmo nome na mesma seção, e a mensagem original não
    diz que é disso que se trata.
    """
    try:
        # utf-8-sig: editor do Windows salva com BOM, e o tomllib recusa o
        # arquivo inteiro por causa de três bytes invisíveis no começo.
        return tomllib.loads(arquivo.read_text(encoding='utf-8-sig'))
    except tomllib.TOMLDecodeError as e:
        texto = str(e)
        dica = ''
        if 'overwrite' in texto or 'Cannot declare' in texto or 'duplicate' in texto.lower():
            dica = ('\nIsso quase sempre é a MESMA CHAVE escrita duas vezes na '
                    'mesma seção.\nApague a linha repetida e salve.')
        raise SystemExit(f'O arquivo {arquivo} tem um erro de formato:\n'
                         f'  {texto}{dica}') from e
    except OSError as e:
        raise SystemExit(f'não consegui ler {arquivo}: {e}') from e


def carrega(caminho: Path | None = None) -> Config:
    c = Config(
        google_places=os.environ.get('GOOGLE_PLACES_KEY', ''),
        anthropic=os.environ.get('ANTHROPIC_API_KEY', ''),
        gemini=os.environ.get('GEMINI_API_KEY', ''),
        openrouter=os.environ.get('OPENROUTER_API_KEY', ''),
        netlify=os.environ.get('NETLIFY_TOKEN', ''),
        whatsapp_token=os.environ.get('WHATSAPP_TOKEN', ''),
        whatsapp_phone_id=os.environ.get('WHATSAPP_PHONE_ID', ''),
    )
    arquivo = caminho or (RAIZ / 'config.toml')
    if arquivo.exists():
        t = _le_toml(arquivo)
        g = t.get('geral', {})
        c.provedor = g.get('provedor', c.provedor)
        c.modelo = g.get('modelo', c.modelo)
        c.modelo_gemini = g.get('modelo_gemini', c.modelo_gemini)
        c.modelo_openrouter = g.get('modelo_openrouter', c.modelo_openrouter)
        c.cidade = g.get('cidade', c.cidade)
        c.canal_envio = g.get('canal_envio', c.canal_envio)
        c.equipe_netlify = g.get('equipe_netlify', c.equipe_netlify)
        if g.get('termos'):
            c.termos = list(g['termos'])
        insta = t.get('instagram', {})
        for campo in ('capturar_sozinho', 'posts_por_perfil', 'perfil_instagram'):
            if campo in insta:
                setattr(c, campo, insta[campo])

        vigia = t.get('vigia', {})
        for campo in ('responder_sozinho', 'varredura_a_cada', 'perfil_whatsapp',
                      'horario', 'intervalo_segundos', 'max_por_dia'):
            if campo in vigia:
                setattr(c, campo, vigia[campo])

        caminhos = t.get('caminhos', {})
        for campo in ('banco', 'saida', 'material'):
            if caminhos.get(campo):
                p = Path(caminhos[campo]).expanduser()
                setattr(c, campo, p if p.is_absolute() else RAIZ / p)

    # Sem escolha explícita, vale a chave que existe. O OpenRouter vem
    # primeiro porque uma chave dele já dá acesso aos outros dois.
    if c.provedor not in ('claude', 'gemini', 'openrouter'):
        if c.openrouter and not (c.anthropic or c.gemini):
            c.provedor = 'openrouter'
        elif c.gemini and not c.anthropic:
            c.provedor = 'gemini'
        else:
            c.provedor = 'claude'
    return c
