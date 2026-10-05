#!/usr/bin/env python3
"""
PRIMEIRA VEZ

Cria o `config.toml` e o `.env` com os caminhos REAIS da sua máquina —
em vez de deixar você procurar e trocar `SEU_USUARIO` em seis lugares.

Roda sozinho no fim da instalação. Dá para rodar de novo quando quiser:
ele nunca sobrescreve um arquivo que já existe sem avisar.
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent


def pastas_do_usuario() -> list[str]:
    casa = Path.home()
    nomes = ['Desktop', 'Área de Trabalho', 'Documents', 'Documentos', 'Downloads',
             'Projetos', 'Projects']
    achadas, vistas = [], set()
    for n in nomes:
        p = casa / n
        if p.exists() and str(p.resolve()) not in vistas:
            vistas.add(str(p.resolve()))
            achadas.append(p.as_posix())
    return achadas or [casa.as_posix()]


def acha_funil() -> str:
    for candidato in (RAIZ.parent / 'funil' / 'dados' / 'funil.db',
                      Path.home() / 'Site-restaurante' / 'funil' / 'dados' / 'funil.db'):
        if candidato.parent.exists():
            return candidato.as_posix()
    return ''


def acha_musica() -> str:
    for n in ('Music', 'Músicas'):
        p = Path.home() / n
        if p.exists():
            return p.as_posix()
    return ''


def monta_config() -> str:
    pastas = '\n'.join(f'  "{p}",' for p in pastas_do_usuario())
    return f'''# Gerado por primeira_vez.py com os caminhos desta máquina.
# Segredo não entra aqui — segredo vai no .env.

[geral]
nome = "Ultron"
tratamento = "chefe"
modelo = "claude-opus-5-5"
voltas_maximas = 24

[voz]
palavra_chave = "hey ultron"
escuta_sempre = true
modelo_voz = "pt-BR-AntonioNeural"
velocidade_voz = "+8%"
modelo_escuta = "small"
idioma = "pt"
silencio_para_parar = 1.2

[permissoes]
# Onde ele escreve sem perguntar. Fora daqui, pede confirmação digitada.
raizes_seguras = [
{pastas}
]
confirmar_por_voz = true
modo_livre = false

[integracoes]
funil_db = "{acha_funil()}"
perfil_navegador = ""
whatsapp_chats = []
pasta_musica = "{acha_musica()}"
'''


def principal() -> int:
    print('\n  Preparando o Ultron para esta máquina...\n')

    env = RAIZ / '.env'
    if not env.exists():
        shutil.copy(RAIZ / '.env.exemplo', env)
        print(f'  criado: {env}')
    else:
        print(f'  já existia: {env}')

    cfg = RAIZ / 'config.toml'
    if not cfg.exists():
        cfg.write_text(monta_config(), encoding='utf-8')
        print(f'  criado: {cfg}')
        print('  pastas liberadas para escrita:')
        for p in pastas_do_usuario():
            print(f'    {p}')
    else:
        print(f'  já existia: {cfg} (não mexi)')

    for pasta in ('dados', 'saida'):
        (RAIZ / pasta).mkdir(exist_ok=True)

    print('\n  Baixando o modelo da palavra de ativação...')
    try:
        import openwakeword.utils
        openwakeword.utils.download_models()
        print('  pronto.')
    except ImportError:
        print('  (openwakeword não instalado — o modo voz vai cair no teclado)')
    except Exception as e:
        print(f'  (não consegui baixar agora: {e})')

    linhas = env.read_text(encoding='utf-8-sig').splitlines()
    def preenchida(nome: str) -> bool:
        return any(l.startswith(f'{nome}=') and len(l.split('=', 1)[1].strip()) > 20
                   for l in linhas)

    print('\n  ─────────────────────────────────────────────')
    if preenchida('ANTHROPIC_API_KEY') or preenchida('GEMINI_API_KEY'):
        print('  Tudo configurado.')
    else:
        print('  FALTA UMA COISA: a chave do cérebro. Escolha UMA:')
        print()
        print('    Claude   console.anthropic.com → API Keys')
        print('             (sk-ant-api03-... · é paga, à parte do claude.ai)')
        print('    Gemini   aistudio.google.com/apikey')
        print('             (AQ.... ou AIza... · tem camada gratuita)')
        print()
        print(f'  Abra {env} e preencha a linha da que você escolher.')
    print('  Depois rode:  ultron.bat --checar')
    print('  ─────────────────────────────────────────────\n')
    return 0


if __name__ == '__main__':
    sys.exit(principal())
