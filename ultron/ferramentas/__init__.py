"""
AS MÃOS

Cada ferramenta é uma função com argumentos declarados em Pydantic — o
esquema que vai para o modelo sai daí, então nunca fica fora de sincronia
com o código que executa.

Três coisas que cada ferramenta declara:

  nivel    LIVRE, CUIDADO ou PERIGO (veja nucleo/permissao.py)
  avalia   quando o nível depende do argumento: `rm -rf` e `ls` são o
           mesmo `rodar`, e não podem ter o mesmo nível
  resumo   a frase que ele FALA antes de fazer. É o que você ouve e o
           que você confirma — então tem que descrever a coisa real,
           não a ferramenta

Ferramenta que depende de pacote opcional não derruba o Ultron: ela
simplesmente não entra no catálogo, e ele diz o que falta instalar.
"""
from __future__ import annotations

import importlib
import traceback
from dataclasses import dataclass, field
from typing import Any, Callable

from pydantic import BaseModel

from nucleo.permissao import CUIDADO, LIVRE, PERIGO, Veredito

MODULOS = ['arquivos', 'computador', 'navegador', 'musica', 'projetos',
           'slides', 'funil', 'whatsapp', 'conhecimento', 'memoria']


@dataclass
class Ferramenta:
    nome: str
    descricao: str
    args: type[BaseModel]
    funcao: Callable[..., Any]
    nivel: str = CUIDADO
    avalia: Callable[[BaseModel, Any], Veredito] | None = None
    resumo: Callable[[BaseModel], str] | None = None

    def esquema(self) -> dict:
        e = self.args.model_json_schema()
        e.pop('title', None)
        return {'name': self.nome, 'description': self.descricao, 'input_schema': e}

    def veredito(self, args: BaseModel, ctx: Any) -> Veredito:
        if self.avalia:
            return self.avalia(args, ctx)
        return Veredito(self.nivel, '')

    def descreve(self, args: BaseModel) -> str:
        if self.resumo:
            try:
                return self.resumo(args)
            except Exception:
                pass
        return self.nome.replace('_', ' ')


REGISTRO: dict[str, Ferramenta] = {}
FALTANDO: dict[str, str] = {}


def ferramenta(nome: str, descricao: str, args: type[BaseModel],
               nivel: str = CUIDADO, avalia=None, resumo=None):
    def envolve(f):
        REGISTRO[nome] = Ferramenta(nome, descricao.strip(), args, f, nivel, avalia, resumo)
        return f
    return envolve


def carrega_tudo(verboso: bool = False) -> dict[str, Ferramenta]:
    """Importa os módulos de ferramenta; o que não puder entrar, fica de fora."""
    for m in MODULOS:
        try:
            importlib.import_module(f'ferramentas.{m}')
        except ImportError as e:
            FALTANDO[m] = str(e)
            if verboso:
                print(f'  ferramenta "{m}" fora: {e}')
        except Exception as e:
            FALTANDO[m] = f'{type(e).__name__}: {e}'
            if verboso:
                traceback.print_exc()
    return REGISTRO


def catalogo() -> list[dict]:
    return [f.esquema() for f in REGISTRO.values()]


@dataclass
class Contexto:
    """O que toda ferramenta enxerga. Estado compartilhado mora aqui."""
    cfg: Any
    diario: Any = None
    porteiro: Any = None
    falar: Callable[[str], None] = lambda t: None
    pedido: str = ''
    partilha: dict = field(default_factory=dict)   # navegador aberto, etc.

    def diz(self, texto: str) -> None:
        try:
            self.falar(texto)
        except Exception:
            pass
