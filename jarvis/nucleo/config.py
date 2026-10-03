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
MODELO_OPENROUTER = ''   # vazio = escolhe do catálogo
MODELO_GROQ = ''         # idem

PROVEDORES = ('claude', 'gemini', 'openrouter', 'groq')


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
    openrouter: str = ''
    groq: str = ''

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
    # claude | gemini | openrouter | groq — quem DECIDE e usa as 51
    # ferramentas. Sai sozinho da chave que existir no .env.
    # Os outros continuam de consultor ("o que o Gemini acha disso?").
    provedor: str = ''
    modelo: str = MODELO_CLAUDE
    modelo_gpt: str = MODELO_GPT
    modelo_gemini: str = MODELO_GEMINI
    modelo_openrouter: str = MODELO_OPENROUTER
    modelo_groq: str = MODELO_GROQ
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
        return {'gemini': self.gemini,
                'openrouter': self.openrouter,
                'groq': self.groq}.get(self.provedor, self.anthropic)

    @property
    def modelo_do_cerebro(self) -> str:
        return {'gemini': self.modelo_gemini,
                'openrouter': self.modelo_openrouter or '(escolhe sozinho)',
                'groq': self.modelo_groq or '(escolhe sozinho)'
                }.get(self.provedor, self.modelo)

    def exige_cerebro(self) -> None:
        self.exige({'gemini': 'gemini',
                    'openrouter': 'openrouter',
                    'groq': 'groq'}.get(self.provedor, 'anthropic'))

    def exige(self, *chaves: str) -> None:
        nomes = {'anthropic': 'ANTHROPIC_API_KEY', 'openai': 'OPENAI_API_KEY',
                 'gemini': 'GEMINI_API_KEY', 'openrouter': 'OPENROUTER_API_KEY',
                 'groq': 'GROQ_API_KEY'}
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
        anthropic=os.environ.get('ANTHROPIC_API_KEY', ''),
        openai=os.environ.get('OPENAI_API_KEY', ''),
        gemini=os.environ.get('GEMINI_API_KEY', ''),
        openrouter=os.environ.get('OPENROUTER_API_KEY', ''),
        groq=os.environ.get('GROQ_API_KEY', ''),
    )
    arquivo = caminho or (RAIZ / 'config.toml')
    if arquivo.exists():
        t = _le_toml(arquivo)
        for secao, campos in (
            ('geral', ('nome', 'tratamento', 'provedor', 'modelo', 'modelo_gpt',
                       'modelo_gemini', 'modelo_openrouter', 'modelo_groq',
                       'voltas_maximas')),
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
    # Sem escolha explícita, vale a chave que existe. O OpenRouter vem
    # primeiro porque uma chave dele já alcança os outros dois; o Groq é
    # o último porque 30 requisições por minuto no plano grátis seguram
    # pouca conversa com ferramenta.
    if c.provedor not in PROVEDORES:
        if c.openrouter and not (c.anthropic or c.gemini):
            c.provedor = 'openrouter'
        elif c.gemini and not c.anthropic:
            c.provedor = 'gemini'
        elif c.groq and not (c.anthropic or c.gemini):
            c.provedor = 'groq'
        else:
            c.provedor = 'claude'

    if not c.raizes_seguras:
        c.raizes_seguras = _padrao_raizes()
    if not c.funil_db:
        provavel = RAIZ.parent / 'funil' / 'dados' / 'funil.db'
        c.funil_db = str(provavel)
    return c
