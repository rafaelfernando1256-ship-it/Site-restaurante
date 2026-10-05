"""
A PERMISSÃO — a peça mais importante deste projeto

Você pediu um Ultron com acesso a tudo. Acesso a tudo é fácil; o que é
difícil é acesso a tudo que não destrói a sua máquina num mal-entendido.
E aqui o mal-entendido não é hipótese: **voz é um canal com erro**. O
reconhecimento confunde palavra parecida, a TV ao fundo entra no
microfone, e alguém falando na sala pode virar comando.

Por isso tudo que ele faz cai em um de três níveis:

  LIVRE    lê e olha. Nada muda. Faz na hora, sem perguntar.
           ler arquivo, consultar o funil, ler página, tirar print

  CUIDADO  muda algo seu, e dá para desfazer. Confirma por voz.
           rodar comando, escrever arquivo, abrir programa, digitar,
           criar projeto, montar slide, tocar música

  PERIGO   não dá para desfazer, ou sai da sua máquina. **Nunca aceita
           só a voz.** Você digita a confirmação no terminal.
           apagar, formatar, mandar mensagem, publicar, instalar,
           mexer em registro do sistema, qualquer coisa com sudo/admin

A regra que vale mais que todas: **voz sozinha nunca autoriza coisa
irreversível.** Se ele ouviu errado, o pior que acontece é você ler uma
pergunta na tela.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

LIVRE = 'livre'
CUIDADO = 'cuidado'
PERIGO = 'perigo'

ORDEM = {LIVRE: 0, CUIDADO: 1, PERIGO: 2}


# Padrões que transformam um comando comum em PERIGO, por mais inocente
# que a frase falada tenha soado. Esta lista é propositalmente paranoica:
# falso alarme custa uma pergunta, erro custa a máquina.
DESTRUTIVO = [
    (r'\brm\s+(-[a-z]*[rf][a-z]*\s+)+', 'rm com -r ou -f'),
    (r'\bdel\s+/[sfq]', 'del /s /f /q'),
    (r'\brmdir\s+/s', 'rmdir /s'),
    (r'\bRemove-Item\b.*-(Recurse|Force)', 'Remove-Item -Recurse/-Force'),
    (r'\bformat\b\s+[a-z]:', 'format de unidade'),
    (r'\bdiskpart\b', 'diskpart'),
    (r'\bmkfs\b', 'mkfs'),
    (r'\bdd\s+if=', 'dd'),
    (r'\bshutdown\b|\breboot\b|\bRestart-Computer\b', 'desligar ou reiniciar'),
    (r'\breg\s+delete\b|\bRemove-ItemProperty\b', 'mexer no registro'),
    (r'\btakeown\b|\bicacls\b.*\/grant', 'trocar dono de arquivo do sistema'),
    (r'\bsudo\b|\brunas\b|Start-Process.*-Verb\s+RunAs', 'elevar privilégio'),
    (r'\bnet\s+user\b.*\/(add|delete)', 'mexer em conta de usuário'),
    (r'\bcurl\b[^|]*\|\s*(ba)?sh|\biwr\b[^|]*\|\s*iex', 'baixar e executar direto'),
    (r'\bgit\s+push\b.*(--force|-f)\b', 'git push --force'),
    (r'\bgit\s+reset\s+--hard\b', 'git reset --hard'),
    (r'\bpip\s+install\b|\bnpm\s+i(nstall)?\b|\bwinget\s+install\b|\bchoco\s+install\b',
     'instalar pacote'),
    (r'\bschtasks\b|\bcrontab\b', 'agendar tarefa no sistema'),
    (r'\bnetsh\b|\bfirewall\b', 'mexer em rede ou firewall'),
    (r':\s*\(\)\s*\{.*\}\s*;\s*:', 'fork bomb'),
]

# Pastas que nunca são seguras, mesmo que caiam dentro de uma raiz livre.
PROIBIDAS = ['/etc', '/boot', '/sys', '/proc', '/dev', '/var/lib',
             'c:\\windows', 'c:\\program files', 'c:\\programdata',
             '/system', '/library/system', '/usr/bin', '/usr/sbin']


@dataclass
class Veredito:
    nivel: str
    motivo: str = ''
    precisa_digitar: bool = False

    def __post_init__(self):
        # PERIGO sempre exige teclado, tenha sido declarado na ferramenta
        # ou descoberto no argumento. Esquecer a flag num lugar só não
        # pode abrir a porta.
        if self.nivel == PERIGO:
            self.precisa_digitar = True
        if not self.motivo and self.nivel == PERIGO:
            self.motivo = 'não dá para desfazer'

    @property
    def livre(self) -> bool:
        return self.nivel == LIVRE


def _toca_proibida(texto: str) -> str:
    t = texto.lower().replace('/', '\\') if '\\' in texto else texto.lower()
    for p in PROIBIDAS:
        alvo = p.replace('/', '\\') if '\\' in t else p
        if alvo in t:
            return p
    return ''


def avalia_comando(comando: str) -> Veredito:
    """Um comando de terminal: CUIDADO por padrão, PERIGO se bater padrão."""
    for padrao, nome in DESTRUTIVO:
        if re.search(padrao, comando, re.I):
            return Veredito(PERIGO, f'o comando faz {nome}', precisa_digitar=True)
    proibida = _toca_proibida(comando)
    if proibida:
        return Veredito(PERIGO, f'o comando mexe em {proibida}', precisa_digitar=True)
    return Veredito(CUIDADO, 'roda um comando na sua máquina')


def avalia_caminho(caminho: str | Path, cfg, escrita: bool = True) -> Veredito:
    """Ler é livre. Escrever depende de onde."""
    texto = str(caminho)
    proibida = _toca_proibida(texto)
    if proibida:
        return Veredito(PERIGO, f'{proibida} é pasta de sistema', precisa_digitar=True)
    if not escrita:
        return Veredito(LIVRE)
    if cfg.seguro(texto):
        return Veredito(CUIDADO, 'escreve numa pasta sua')
    return Veredito(PERIGO, f'{texto} está fora das pastas que você liberou',
                    precisa_digitar=True)


class Porteiro:
    """
    Decide, pergunta e lembra. `perguntar_voz` e `perguntar_teclado` são
    injetados — assim o motor inteiro roda em teste sem voz e sem gente.
    """

    def __init__(self, cfg, diario=None,
                 perguntar_voz: Callable[[str], bool] | None = None,
                 perguntar_teclado: Callable[[str], bool] | None = None):
        self.cfg = cfg
        self.diario = diario
        self.perguntar_voz = perguntar_voz
        self.perguntar_teclado = perguntar_teclado
        self.liberados: set[str] = set()   # "não pergunta de novo nesta sessão"

    def libera_sessao(self, chave: str) -> None:
        self.liberados.add(chave)

    @staticmethod
    def _leitura(resposta) -> str:
        """As respostas chegam como 'sim', 'nao' ou 'sempre' — ou bool."""
        if isinstance(resposta, bool):
            return 'sim' if resposta else 'nao'
        return str(resposta or 'nao').strip().lower()

    def autoriza(self, ferramenta: str, veredito: Veredito, descricao: str) -> bool:
        """
        True = pode fazer. A diferença que importa: PERIGO nunca passa só
        pela voz, nem com modo_livre ligado, nem com 'sempre' guardado.
        """
        if veredito.nivel == LIVRE:
            return True

        chave = f'{ferramenta}:{veredito.nivel}'

        if veredito.nivel == CUIDADO:
            if self.cfg.modo_livre or chave in self.liberados:
                return True
            pergunta = f'{descricao}. Confirma?'
            if self.cfg.confirmar_por_voz and self.perguntar_voz:
                r = self._leitura(self.perguntar_voz(pergunta))
            elif self.perguntar_teclado:
                r = self._leitura(self.perguntar_teclado(pergunta))
            else:
                return False
            if r == 'sempre':
                # Vale só para esta ferramenta, neste nível, nesta sessão.
                # Fechou o Ultron, volta a perguntar.
                self.liberados.add(chave)
                return True
            return r == 'sim'

        # PERIGO. A voz pode no máximo levar você até a pergunta — e
        # 'sempre' não existe aqui: toda vez é uma vez.
        pergunta = (f'{descricao}\nMotivo: {veredito.motivo}\n'
                    'Isto não dá para desfazer. Digite SIM para confirmar')
        if self.perguntar_teclado:
            return self._leitura(self.perguntar_teclado(pergunta)) == 'sim'
        return False
