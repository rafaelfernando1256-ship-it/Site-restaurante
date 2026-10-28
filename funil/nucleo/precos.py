"""
OS PREÇOS, POR NICHO

Você escolhe o nicho na central e digita os valores. O atendente lê daqui
quando o cliente pergunta "quanto fica?" — e só daqui: preço que não está
configurado não é inventado, vira aviso para você.

DOIS JEITOS DE COBRAR

  • fazer + manutenção — um valor para fazer o site e uma mensalidade.
    É o único jeito para clínica, barbearia, hotel, salão...
  • só a mensalidade — o site sai sem custo de criação e ele paga por
    mês. Existe só para COMIDA (restaurante, pizzaria, lanchonete...):
    é o ramo que muda cardápio e preço o tempo todo, e onde "não pago
    nada para começar" decide a venda.

Para comida, você escolhe qual dos dois vale. Os valores dos dois ficam
guardados: trocar de um para o outro não apaga o que você digitou.

Os valores moram em `dados/precos.json`, ao lado do banco — é dado seu,
não código, e não vai para o git.
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

FAZER_E_MANUTENCAO = 'fazer_e_manutencao'
SO_MENSALIDADE = 'so_mensalidade'
MODOS = (FAZER_E_MANUTENCAO, SO_MENSALIDADE)

# Os nichos de comida: são os que ganham a segunda opção ("só a
# mensalidade"). A chave é o nome que aparece na central; a lista ao lado
# são as palavras que, na categoria do Google ou na planilha, levam a ele.
COMIDA = {
    'restaurante': ['restaurante', 'restaurant', 'comida', 'self service',
                    'marmita', 'churrascaria', 'japones', 'sushi', 'esfiha',
                    'esfiharia', 'tapiocaria', 'food'],
    'pizzaria': ['pizza', 'pizzaria'],
    'hamburgueria': ['hamburguer', 'hamburgueria', 'burger'],
    'lanchonete': ['lanchonete', 'lanche', 'pastelaria', 'pastel', 'snack'],
    'açaí e sorveteria': ['acai', 'sorvete', 'sorveteria', 'gelato', 'ice cream'],
    'cafeteria e padaria': ['cafe', 'cafeteria', 'padaria', 'confeitaria',
                            'doceria', 'bakery', 'coffee'],
    'bar e petiscaria': ['bar', 'boteco', 'petiscaria', 'choperia', 'pub'],
}

OUTROS = {
    'clínica de estética': ['estetica', 'clinica de estetica', 'beauty', 'spa',
                            'depilacao', 'harmonizacao', 'micropigmentacao'],
    'barbearia': ['barbearia', 'barbeiro', 'barber'],
    'salão de beleza': ['salao', 'cabeleireiro', 'manicure', 'unhas', 'hair', 'nail'],
    'hotel e pousada': ['hotel', 'pousada', 'hostel', 'chale', 'flat', 'temporada',
                        'lodging', 'resort'],
    'clínica e consultório': ['clinica', 'consultorio', 'dentista', 'odonto',
                              'fisioterapia', 'psicologo', 'nutricionista', 'medico'],
    'academia': ['academia', 'crossfit', 'pilates', 'studio fitness', 'gym'],
    'pet shop': ['pet', 'petshop', 'veterinaria', 'veterinario', 'banho e tosa'],
    'loja': ['loja', 'boutique', 'store', 'moda', 'joias', 'otica'],
    'oficina e serviços': ['oficina', 'mecanica', 'lava jato', 'autopecas',
                           'eletricista', 'encanador'],
}


def _simples(texto: str) -> str:
    sem = unicodedata.normalize('NFKD', texto or '').encode('ascii', 'ignore').decode()
    return re.sub(r'\s+', ' ', sem.lower()).strip()


def eh_comida(nicho: str) -> bool:
    return _simples(nicho) in {_simples(n) for n in COMIDA}


def nichos(extras: list[str] | None = None) -> list[dict]:
    """A lista da central: os de comida primeiro, depois os outros."""
    vistos = set()
    saida = []
    for nome in [*COMIDA, *OUTROS, *(extras or [])]:
        if _simples(nome) in vistos:
            continue
        vistos.add(_simples(nome))
        saida.append({'nome': nome, 'comida': eh_comida(nome)})
    return saida


def nicho_de(texto: str) -> str:
    """
    Categoria do Google ou tipo da planilha → nicho da central.

    Palavra inteira, não pedaço: "bar" não pode casar com "barbearia".
    Sem casamento nenhum, devolve o próprio texto — um nicho novo que você
    pode precificar na central.
    """
    alvo = f' {_simples(texto)} '
    if not alvo.strip():
        return ''
    # Comida primeiro: "loja de açaí" é açaí, não loja. O casamento por
    # palavra inteira é o que impede "bar" de pegar "barbearia".
    for grupo in (COMIDA, OUTROS):
        for nome, palavras in grupo.items():
            if _simples(nome) == alvo.strip():
                return nome
            for p in sorted(palavras, key=len, reverse=True):
                if f' {p} ' in alvo:
                    return nome
    return texto.strip()


# O que digitar na busca do Google para achar cada nicho. "restaurante"
# sozinho traz shopping e praça de alimentação; termo específico traz casa
# específica.
BUSCA = {
    'restaurante': ['restaurante caseiro', 'comida regional', 'restaurante self service'],
    'açaí e sorveteria': ['açaí', 'sorveteria'],
    'cafeteria e padaria': ['cafeteria', 'padaria e confeitaria'],
    'bar e petiscaria': ['bar e petiscaria', 'boteco'],
    'hotel e pousada': ['pousada', 'hotel'],
    'clínica e consultório': ['clínica odontológica', 'fisioterapia'],
    'oficina e serviços': ['oficina mecânica', 'lava jato'],
}


def termos_de_busca(nicho: str) -> list[str]:
    for k, v in BUSCA.items():
        if _simples(k) == _simples(nicho):
            return list(v)
    return [nicho]


def nicho_do_lead(lead) -> str:
    dados = getattr(lead, 'dados', None) or {}
    return dados.get('nicho') or nicho_de(getattr(lead, 'categoria', '') or '')


class Precos:
    """O arquivo de preços. Lê e grava; quem decide o valor é você."""

    def __init__(self, caminho: Path):
        self.caminho = Path(caminho)
        try:
            self.dados: dict = json.loads(self.caminho.read_text(encoding='utf-8'))
        except Exception:
            self.dados = {}

    def _chave(self, nicho: str) -> str:
        for k in self.dados:
            if _simples(k) == _simples(nicho):
                return k
        return nicho.strip()

    def de(self, nicho: str) -> dict:
        return dict(self.dados.get(self._chave(nicho), {}))

    def define(self, nicho: str, modo: str = FAZER_E_MANUTENCAO, fazer: float = 0,
               manutencao: float = 0, mensalidade: float = 0) -> dict:
        if not nicho.strip():
            raise ValueError('escolha um nicho')
        if modo not in MODOS:
            raise ValueError(f'modo "{modo}" não existe')
        if modo == SO_MENSALIDADE and not eh_comida(nicho):
            raise ValueError('"só a mensalidade" existe só para nicho de comida')
        for nome, v in (('fazer', fazer), ('manutenção', manutencao),
                        ('mensalidade', mensalidade)):
            if v < 0:
                raise ValueError(f'valor de {nome} negativo')
        if modo == FAZER_E_MANUTENCAO and not (fazer > 0 and manutencao > 0):
            raise ValueError('preencha o valor para fazer E o da manutenção')
        if modo == SO_MENSALIDADE and not mensalidade > 0:
            raise ValueError('preencha o valor da mensalidade')
        chave = self._chave(nicho)
        atual = self.dados.get(chave, {})
        # Guarda os dois jogos de valores: trocar de modo não apaga o outro.
        atual.update({'modo': modo})
        if fazer:
            atual['fazer'] = fazer
        if manutencao:
            atual['manutencao'] = manutencao
        if mensalidade:
            atual['mensalidade'] = mensalidade
        self.dados[chave] = atual
        self.grava()
        return atual

    def apaga(self, nicho: str) -> None:
        self.dados.pop(self._chave(nicho), None)
        self.grava()

    def grava(self) -> None:
        self.caminho.parent.mkdir(parents=True, exist_ok=True)
        self.caminho.write_text(json.dumps(self.dados, indent=2, ensure_ascii=False),
                                encoding='utf-8')

    def texto(self, nicho: str) -> str:
        """
        O preço como o atendente deve dizer. Vazio = não configurado — e o
        atendente NÃO inventa: passa a conversa para você.
        """
        p = self.de(nicho)
        modo = p.get('modo')
        if modo == SO_MENSALIDADE and p.get('mensalidade'):
            return (f'{reais(p["mensalidade"])} por mês, sem custo para fazer o site '
                    '(a mensalidade já cobre a criação, a hospedagem e as alterações)')
        if modo == FAZER_E_MANUTENCAO and p.get('fazer') and p.get('manutencao'):
            return (f'{reais(p["fazer"])} para fazer o site, e depois '
                    f'{reais(p["manutencao"])} por mês de manutenção '
                    '(hospedagem e alterações)')
        return ''


def valor(texto) -> float:
    """
    O que você digitou → número. "1.500" é mil e quinhentos, "1500,50" e
    "1.500,50" têm centavos, e "89.90" também (ponto seguido de dois
    dígitos não é milhar).
    """
    if isinstance(texto, (int, float)):
        return float(texto)
    t = re.sub(r'[^\d,.]', '', str(texto or ''))
    if not t:
        return 0.0
    if ',' in t:
        t = t.replace('.', '').replace(',', '.')
    elif re.fullmatch(r'\d{1,3}(\.\d{3})+', t):
        t = t.replace('.', '')
    try:
        return float(t)
    except ValueError:
        raise ValueError(f'"{texto}" não é um valor') from None


def reais(valor: float) -> str:
    """1500 → 'R$ 1.500'; 89.9 → 'R$ 89,90'."""
    if float(valor).is_integer():
        return 'R$ ' + f'{int(valor):,}'.replace(',', '.')
    inteiro, centavos = f'{valor:,.2f}'.split('.')
    return f'R$ {inteiro.replace(",", ".")},{centavos}'
