"""
CONFIGURAÇÃO

Chave nenhuma dentro do código. A ordem é: ambiente → `.env` → `config.toml`
(só o que não é segredo).

Um detalhe que decide muita coisa: `RAIZ_SEGURA`. É a lista de pastas em
que o Jarvis pode escrever sem perguntar. Fora dela, ele pede. Sem isso,
"apaga os temporários" vira uma frase perigosa.
"""
from __future__ import annotations

import os
import sys
import tomllib
from dataclasses import dataclass, field
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DADOS = RAIZ / 'dados'
SAIDA = RAIZ / 'saida'

MODELO_CLAUDE = 'claude-opus-5-5'
MODELO_GPT = 'gpt-4o'
MODELO_GEMINI = 'gemini-3.8-flash'


def _carrega_env(arquivo: Path | None = None) -> None:
    arquivo = arquivo or (RAIZ / '.env')
    if not arquivo.exists():
        return
    # utf-8-sig e não utf-8: o Bloco de Notas salva com BOM, e o BOM gruda
    # na primeira chave do arquivo — "\ufeffANTHROPIC_API_KEY" não é
    # "ANTHROPIC_API_KEY", e a chave some sem nenhum erro aparecer.
    for linha in arquivo.read_text(encoding='utf-8-sig').splitlines():
        linha = linha.strip()
        if not linha or linha.startswith('#') or '=' not in linha:
            continue
        chave, valor = linha.split('=', 1)
        chave, valor = chave.strip(), valor.strip().strip('"').strip("'")
        if chave and chave not in os.environ:
            os.environ[chave] = valor


_carrega_env()


def sistema() -> str:
    """windows | mac | linux — decide teclado, mídia e como abre app."""
    if sys.platform.startswith('win'):
        return 'windows'
    if sys.platform == 'darwin':
        return 'mac'
    return 'linux'


@dataclass
class Config:
    # ── segredos ────────────────────────────────────────────────────
    anthropic: str = ''
    openai: str = ''
    gemini: str = ''

    # ── voz ─────────────────────────────────────────────────────────
    palavra_chave: str = 'hey jarvis'
    escuta_sempre: bool = True
    atalho_fala: str = 'ctrl+alt+j'      # vale quando escuta_sempre = false
    modelo_voz: str = 'pt-BR-AntonioNeural'
    velocidade_voz: str = '+8%'
    modelo_escuta: str = 'small'         # tiny | base | small | medium
    # auto | local | gemini — quem transcreve o que você fala. "auto" usa o
    # motor local e só cai no Gemini se o local não carregar.
    motor_escuta: str = 'auto'
    idioma: str = 'pt'
    silencio_para_parar: float = 1.2     # segundos de silêncio que encerram a fala

    # ── cérebro ─────────────────────────────────────────────────────
    # claude | gemini — quem DECIDE e usa as ferramentas. O outro continua
    # disponível como consultor ("o que o Gemini acha disso?").
    provedor: str = ''
    modelo: str = MODELO_CLAUDE
    modelo_gpt: str = MODELO_GPT
    modelo_gemini: str = MODELO_GEMINI
    voltas_maximas: int = 24             # teto de idas e vindas numa só tarefa
    nome: str = 'Jarvis'
    tratamento: str = 'chefe'

    # ── permissões ──────────────────────────────────────────────────
    # Pastas onde ele escreve sem perguntar. TUDO fora disto pede.
    raizes_seguras: list[str] = field(default_factory=list)
    confirmar_por_voz: bool = True       # false = confirma sempre digitando
    modo_livre: bool = False             # true = não pede em nível CUIDADO

    # ── integrações ─────────────────────────────────────────────────
    funil_db: str = ''                   # o banco do projeto funil/
    perfil_navegador: str = ''           # perfil do Chrome que ele controla
    whatsapp_chats: list[str] = field(default_factory=list)
    pasta_musica: str = ''

    @property
    def chave_do_cerebro(self) -> str:
        return self.gemini if self.provedor == 'gemini' else self.anthropic

    @property
    def modelo_do_cerebro(self) -> str:
        return self.modelo_gemini if self.provedor == 'gemini' else self.modelo

    def exige_cerebro(self) -> None:
        self.exige('gemini' if self.provedor == 'gemini' else 'anthropic')

    def exige(self, *chaves: str) -> None:
        nomes = {'anthropic': 'ANTHROPIC_API_KEY', 'openai': 'OPENAI_API_KEY',
                 'gemini': 'GEMINI_API_KEY'}
        faltam = [nomes.get(c, c.upper()) for c in chaves if not getattr(self, c, '')]
        if faltam:
            raise SystemExit(
                'Falta configurar: ' + ', '.join(faltam)
                + f'\nPonha no ambiente ou em {RAIZ / ".env"} (veja .env.exemplo).')

    def seguro(self, caminho: Path | str) -> bool:
        """O caminho está dentro de uma raiz onde ele pode mexer sem pedir?"""
        try:
            p = Path(caminho).expanduser().resolve()
        except Exception:
            return False
        for r in self.raizes_seguras:
            try:
                p.relative_to(Path(r).expanduser().resolve())
                return True
            except ValueError:
                continue
        return False


def _padrao_raizes() -> list[str]:
    casa = Path.home()
    nomes = ['Desktop', 'Área de Trabalho', 'Documents', 'Documentos',
             'Downloads', 'Downloads', 'Projetos', 'Projects']
    achadas = [str(casa / n) for n in nomes if (casa / n).exists()]
    return achadas or [str(casa)]


def carrega(caminho: Path | None = None) -> Config:
    c = Config(
        anthropic=os.environ.get('ANTHROPIC_API_KEY', ''),
        openai=os.environ.get('OPENAI_API_KEY', ''),
        gemini=os.environ.get('GEMINI_API_KEY', ''),
    )
    arquivo = caminho or (RAIZ / 'config.toml')
    if arquivo.exists():
        with open(arquivo, 'rb') as f:
            t = tomllib.load(f)
        for secao, campos in (
            ('geral', ('nome', 'tratamento', 'provedor', 'modelo', 'modelo_gpt',
                       'modelo_gemini', 'voltas_maximas')),
            ('voz', ('palavra_chave', 'escuta_sempre', 'atalho_fala', 'modelo_voz',
                     'velocidade_voz', 'modelo_escuta', 'motor_escuta', 'idioma',
                     'silencio_para_parar')),
            ('permissoes', ('raizes_seguras', 'confirmar_por_voz', 'modo_livre')),
            ('integracoes', ('funil_db', 'perfil_navegador', 'whatsapp_chats',
                             'pasta_musica')),
        ):
            bloco = t.get(secao, {})
            for campo in campos:
                if campo in bloco:
                    setattr(c, campo, bloco[campo])
    # Sem escolha explícita, vale a chave que existe. Quem só tem a do
    # Gemini não deveria precisar aprender o que é "provedor" para ligar.
    if c.provedor not in ('claude', 'gemini'):
        c.provedor = 'gemini' if (c.gemini and not c.anthropic) else 'claude'

    if not c.raizes_seguras:
        c.raizes_seguras = _padrao_raizes()
    if not c.funil_db:
        provavel = RAIZ.parent / 'funil' / 'dados' / 'funil.db'
        c.funil_db = str(provavel)
    return c
