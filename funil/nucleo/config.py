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
MODELO_GROQ = ''         # idem

PROVEDORES = ('claude', 'gemini', 'openrouter', 'groq')

# Termos de busca padrão. Sem "restaurante" sozinho: o Places devolve
# shopping e praça de alimentação. Termo específico traz casa específica.
TERMOS = [
    'restaurante caseiro', 'comida regional', 'pizzaria', 'hamburgueria',
    'churrascaria', 'restaurante japonês', 'açaí', 'cafeteria',
    'padaria e confeitaria', 'restaurante self service', 'esfiharia',
    'comida nordestina', 'sorveteria', 'tapiocaria',
]

# Hospedagem é outro ramo e outra venda: aqui o dono já paga comissão de
# OTA todo mês, e a conversa começa num número que ele conhece de cor.
# Fica em lista separada porque misturar os dois numa busca só gasta
# cota da Places e volta com lead de dois tipos no mesmo lote.
TERMOS_HOSPEDAGEM = [
    'pousada', 'hotel', 'hostel', 'chalé para alugar', 'flat',
    'pousada à beira-mar', 'hotel fazenda', 'casa de temporada',
]

RAMOS = {'comida': TERMOS, 'hospedagem': TERMOS_HOSPEDAGEM}


def comando(texto: str) -> str:
    """
    Traduz o comando sugerido para a língua do sistema de quem está lendo.

    No Windows não existe `python3`: o que existe é um atalho da loja da
    Microsoft com esse nome, que ABRE A LOJA em vez de rodar o programa.
    Um guia que manda digitar `python3` ali é um guia que não funciona —
    e o custo disso cai todo em quem está começando, que não tem como
    saber que o errado é a instrução, não ele.
    """
    return texto.replace('python3 ', 'python ') if os.name == 'nt' else texto


def _carrega_env(arquivo: Path | None = None) -> None:
    """Lê o `.env` sem dependência, sem sobrescrever o que já está no ambiente."""
    arquivo = arquivo or (RAIZ / '.env')
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
# As chaves de FOTO moram no .env do projeto `conteudo` — foi lá que
# elas foram cadastradas. A prévia usa o acervo de lá, então sem esta
# linha ela sairia sem foto nenhuma e sem dizer por quê, que é o pior
# jeito de uma coisa não funcionar.
_carrega_env(RAIZ.parent / 'conteudo' / '.env')


@dataclass
class Config:
    # segredos
    google_places: str = ''
    anthropic: str = ''
    gemini: str = ''
    openrouter: str = ''
    groq: str = ''
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

    # ── a colônia ───────────────────────────────────────────────────
    # Os tetos. Você pode BAIXAR daqui; furar o teto de código não.
    # Veja o topo de nucleo/colonia.py para o porquê de cada um.
    colonia_teto_vivos: int = 4        # quantos organismos podem viver juntos
    colonia_teto_gasto: int = 5_000    # centavos que a colônia pode gastar na vida
    colonia_semente: int = 500         # com quanto cada organismo nasce
    colonia_toques: int = 40           # primeiros contatos que cada um pode pedir
    colonia_banco: int = 2_500         # centavos que a colônia pode gastar. 2500 = R$ 25,00

    # preferências
    # claude | gemini | openrouter | groq — quem escreve as abordagens,
    # tria as respostas e lê o Instagram. Sai sozinho da chave do .env.
    provedor: str = ''
    modelo: str = MODELO
    modelo_gemini: str = MODELO_GEMINI
    modelo_openrouter: str = MODELO_OPENROUTER
    modelo_groq: str = MODELO_GROQ
    cidade: str = ''
    # Seu nome. Aparece no aviso de prévia no rodapé do site e na
    # assinatura da mensagem — sem ele, a prévia diz "um desenvolvedor
    # local", que funciona mas não constrói nome nenhum.
    autor: str = 'um desenvolvedor local'
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
                'openrouter': self.modelo_openrouter,
                'groq': self.modelo_groq}.get(self.provedor, self.modelo)

    @property
    def chave_do_dialeto(self) -> str:
        """
        A chave que o agente precisa passar na mão.

        Claude e Gemini vêm com SDK, e o SDK lê a variável de ambiente
        sozinho. OpenRouter e Groq são HTTPS puro: ali a chave viaja como
        argumento, e passar a do provedor errado é um 401 difícil de ler.
        """
        return {'openrouter': self.openrouter,
                'groq': self.groq}.get(self.provedor, '')

    def exige_cerebro(self) -> None:
        self.exige({'gemini': 'gemini',
                    'openrouter': 'openrouter',
                    'groq': 'groq'}.get(self.provedor, 'anthropic'))

    def exige(self, *chaves: str) -> None:
        """Falha cedo, com o nome exato da variável que falta."""
        nomes = {
            'google_places': 'GOOGLE_PLACES_KEY',
            'anthropic': 'ANTHROPIC_API_KEY',
            'gemini': 'GEMINI_API_KEY',
            'openrouter': 'OPENROUTER_API_KEY',
            'groq': 'GROQ_API_KEY',
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
        groq=os.environ.get('GROQ_API_KEY', ''),
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
        c.modelo_groq = g.get('modelo_groq', c.modelo_groq)

        colonia = t.get('colonia', {})
        for campo, destino in (('teto_vivos', 'colonia_teto_vivos'),
                               ('teto_gasto', 'colonia_teto_gasto'),
                               ('semente', 'colonia_semente'),
                               ('toques', 'colonia_toques'),
                               ('banco', 'colonia_banco')):
            if campo in colonia:
                setattr(c, destino, int(colonia[campo]))
        c.cidade = g.get('cidade', c.cidade)
        c.autor = g.get('autor', c.autor)
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

    # Sem escolha explícita, vale a chave que existe. A ordem não é
    # gosto: é quem resolve mais com uma chave só. OpenRouter alcança
    # Claude, GPT e Gemini; o Groq roda os abertos, e é o último porque
    # 30 requisições por minuto no plano grátis seguram pouco lead.
    if c.provedor not in PROVEDORES:
        if c.openrouter and not (c.anthropic or c.gemini):
            c.provedor = 'openrouter'
        elif c.gemini and not c.anthropic:
            c.provedor = 'gemini'
        elif c.groq and not (c.anthropic or c.gemini):
            c.provedor = 'groq'
        else:
            c.provedor = 'claude'
    return c
