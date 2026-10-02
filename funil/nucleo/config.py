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
    netlify: str = ''
    whatsapp_token: str = ''
    whatsapp_phone_id: str = ''

    # preferências
    # claude | gemini — quem escreve as abordagens, tria as respostas e lê
    # o Instagram. Sai sozinho da chave que existir no .env.
    provedor: str = ''
    modelo: str = MODELO
    modelo_gemini: str = MODELO_GEMINI
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
        return self.modelo_gemini if self.provedor == 'gemini' else self.modelo

    def exige_cerebro(self) -> None:
        self.exige('gemini' if self.provedor == 'gemini' else 'anthropic')

    def exige(self, *chaves: str) -> None:
        """Falha cedo, com o nome exato da variável que falta."""
        nomes = {
            'google_places': 'GOOGLE_PLACES_KEY',
            'anthropic': 'ANTHROPIC_API_KEY',
            'gemini': 'GEMINI_API_KEY',
            'netlify': 'NETLIFY_TOKEN',
        }
        faltam = [nomes.get(c, c.upper()) for c in chaves if not getattr(self, c, '')]
        if faltam:
            raise SystemExit(
                'Falta configurar: ' + ', '.join(faltam) + '\n'
                f'Coloque no ambiente ou em {RAIZ / ".env"} (veja .env.exemplo).'
            )


def carrega(caminho: Path | None = None) -> Config:
    c = Config(
        google_places=os.environ.get('GOOGLE_PLACES_KEY', ''),
        anthropic=os.environ.get('ANTHROPIC_API_KEY', ''),
        gemini=os.environ.get('GEMINI_API_KEY', ''),
        netlify=os.environ.get('NETLIFY_TOKEN', ''),
        whatsapp_token=os.environ.get('WHATSAPP_TOKEN', ''),
        whatsapp_phone_id=os.environ.get('WHATSAPP_PHONE_ID', ''),
    )
    arquivo = caminho or (RAIZ / 'config.toml')
    if arquivo.exists():
        with open(arquivo, 'rb') as f:
            t = tomllib.load(f)
        g = t.get('geral', {})
        c.provedor = g.get('provedor', c.provedor)
        c.modelo = g.get('modelo', c.modelo)
        c.modelo_gemini = g.get('modelo_gemini', c.modelo_gemini)
        c.cidade = g.get('cidade', c.cidade)
        c.canal_envio = g.get('canal_envio', c.canal_envio)
        c.equipe_netlify = g.get('equipe_netlify', c.equipe_netlify)
        if g.get('termos'):
            c.termos = list(g['termos'])
        caminhos = t.get('caminhos', {})
        for campo in ('banco', 'saida', 'material'):
            if caminhos.get(campo):
                p = Path(caminhos[campo]).expanduser()
                setattr(c, campo, p if p.is_absolute() else RAIZ / p)

    # Sem escolha explícita, vale a chave que existe.
    if c.provedor not in ('claude', 'gemini'):
        c.provedor = 'gemini' if (c.gemini and not c.anthropic) else 'claude'
    return c
