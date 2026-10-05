"""
A COLÔNIA — agentes que vivem de dinheiro de verdade e morrem sem ele.

A CARTEIRA É UM ENVELOPE SOBRE A SUA CONTA, NÃO UM COFRE DO AGENTE

Isto é o ponto, e é o que faz o resto fazer sentido. Existe UM dinheiro:
o seu. O que a colônia faz é fatiar esse dinheiro em envelopes:

    BANCO: R$ 25,00   ← o que VOCÊ declarou que pode ser gasto nisto
      ├─ g0-01 .... R$ 5,00   reservado. Ele só pode tocar nestes R$ 5,00.
      ├─ g0-02 .... R$ 5,00   idem — e não pode pegar do envelope do outro.
      └─ livre .... R$ 15,00  o que ainda não foi prometido a ninguém

Um organismo com R$ 5,00 no envelope não gasta R$ 6,00 nem que o banco
tenha R$ 25,00. E a soma dos envelopes dos vivos NUNCA passa do banco —
é invariante checada em código, não intenção. Enquanto houver livre, nasce
mais um; quando não houver, não nasce, e a mensagem diz exatamente isso.

Quando um organismo morre, o que sobrou no envelope dele volta para o
livre: o dinheiro é seu, não dele.

Cada organismo nasce com R$ 5,00, gasta para trabalhar, recebe quando um
cliente paga, e some para sempre quando o envelope zera. Quem dá lucro se
reproduz e passa R$ 5,00 do próprio envelope para o filho. Quem não dá,
morre. É seleção, não metáfora: o dinheiro é o mesmo que sai da sua conta.

O QUE O BANCO É, DE VERDADE

Um número que você declara: `funil.py colonia --banco 2500`. Nenhum
agente mexe na sua conta — o que eles fazem é causar cobrança na Places
API, no provedor de modelo e na Netlify. O banco é o teto de quanto isso
pode somar, e a colônia debita cada centavo que gasta.

Isso significa que o banco pode DESCOLAR da realidade, se a sua fatura
vier diferente do que a tabela de preços aqui diz. Quando isso acontecer,
reconcilie: `--banco` com o número verdadeiro.

O QUE FAZ UM ORGANISMO ESTAR VIVO

Ele tem DUAS reservas, e as duas acabam:

  • CARTEIRA, em centavos. Debitada no custo real de cada operação —
    busca na Places API, token de modelo pago, publicação. Zerou, morreu.
  • TOQUES, o número de primeiros contatos que ele ainda pode te pedir.
    Esta é a reserva que importa de verdade. Computação é barata e tem
    plano grátis; o que é escasso no seu negócio é quantas vezes você
    pode bater na porta de um estranho antes de o número ser bloqueado.
    Um organismo que queimou 40 toques e não fechou nada é uma estratégia
    ruim, e estratégia ruim precisa morrer antes de gastar a sua reputação.

Sem a segunda reserva isto não seria simulação de nada: rodando tudo em
plano grátis o custo é zero, a carteira nunca zera e todo mundo sobrevive
para sempre, inclusive o que não funciona.

COMO O DINHEIRO ENTRA

Por você, com o valor na mão: `funil.py colonia --recebi <id> 90000`.
O Pix cai na SUA conta, não na do agente, então receita é fato que você
confirma — nunca número que o organismo escreve sozinho. Sem isso a
colônia inteira viraria um gerador de otimismo.

OS LIMITES, E POR QUE ELES EXISTEM

Reprodução é limitada, e de propósito:

  • só se reproduz quem JÁ RECEBEU dinheiro de cliente. Guardar a
    semente sem trabalhar não conta. Sem essa regra a colônia se
    multiplica sem nunca ter provado nada.
  • TETO_VIVOS é teto de código, não de configuração. Você pode baixar,
    não pode furar. Um erro numa geração vira dezenas de agentes
    repetindo o mesmo erro com o seu número, e aí não há como recolher.
  • TETO_GASTO é o total que a colônia pode gastar na vida. Quando bate,
    ninguém mais age. É o freio de mão.
  • o filho herda a estratégia do pai com UMA mutação. Clone idêntico não
    ensina nada: se o pai funcionou por causa da cidade, o filho precisa
    variar algo para você descobrir o que era.

E o que nenhum organismo faz, por decisão de projeto: mandar o primeiro
contato sozinho. Ele gasta um toque, enfileira a mensagem, e o envio sai
pelo caminho que já existe — `funil.py enviar --abrir`, com o seu clique.
A resposta a quem JÁ te escreveu continua automática, pela vigia.
"""
from __future__ import annotations

import json
import os
import random
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path

from .config import comando
from typing import Any

# ── dinheiro ────────────────────────────────────────────────────────
# Sempre em centavos inteiros. Dinheiro em float é erro de arredondamento
# esperando a hora certa de aparecer, e aqui ele decide quem vive.
SEMENTE = 500            # R$ 5,00 — com o que cada organismo nasce
LUCRO_PARA_REPRODUZIR = 2 * SEMENTE   # sobra necessária para gerar um filho

# Tetos de código. Baixar pela configuração é permitido; furar, não.
TETO_VIVOS = 32
TETO_GERACOES = 12
TETO_GASTO = 50_000     # R$ 500,00 na vida da colônia inteira

# Quanto custa, em centavos, cada coisa que um organismo faz.
#
# Os números abaixo são PADRÕES, não verdade eterna: preço de API muda e
# câmbio muda mais. Onde a API devolve o custo medido, é o medido que
# vale — veja `cobra_medido`. Confira em:
#   Places API  → developers.google.com/maps/billing-and-pricing/pricing
#   modelos     → a página de preço do provedor que você escolheu
DOLAR = 540              # R$ 5,40, em centavos. Corrija quando mudar.

PRECOS = {
    # Text Search com websiteUri cai no SKU Enterprise: US$ 35 por mil
    # chamadas depois de 1.000 grátis por mês. US$ 0,035 → 19 centavos.
    'busca': round(0.035 * DOLAR),
    # Nos provedores de plano grátis (Gemini, Groq, modelos :free do
    # OpenRouter) isto é zero de verdade. Em provedor pago, o valor certo
    # vem de `cobra_medido` com os tokens da resposta.
    'abordagem': 0,
    'triagem': 0,
    'leitura_instagram': 0,
    'construcao': 0,
    # Netlify publica de graça no plano gratuito.
    'publicacao': 0,
}

# Quantas buscas da Places API cabem no grátis do mês. Depois disso o
# organismo paga de verdade — e é aí que a carteira começa a doer.
BUSCAS_GRATIS_MES = 1000

# Quantos primeiros contatos um recém-nascido pode pedir.
#
# Este número é o que decide se a colônia consegue começar, e a conta é
# dura. Com conversão de 3% (que é razoável em contato frio), a chance de
# UMA venda é:
#
#     25 toques → 53%     40 toques → 70%
#     60 toques → 84%    100 toques → 95%
#
# Com 25 a primeira geração morre em metade das tentativas, e aí não há
# linhagem nenhuma: geração 0 não tem pai de quem herdar. Na primeira
# simulação a colônia inteira morreu na volta 5 por causa disso.
#
# 40 é o meio honesto: 70% de chance de o fundador provar algo, sem pedir
# cem mensagens frias do seu número na primeira semana. Se a sua conversão
# real vier maior, baixe — o extrato mostra a sua taxa medida.
TOQUES_INICIAIS = 40

TONS = ('direto', 'curioso', 'prestativo', 'numerico')


def dinheiro(centavos: int) -> str:
    """1234 → 'R$ 12,34'. Sem float em nenhum ponto do caminho."""
    sinal = '-' if centavos < 0 else ''
    c = abs(int(centavos))
    return f'{sinal}R$ {c // 100},{c % 100:02d}'


# ── o organismo ─────────────────────────────────────────────────────
@dataclass
class Organismo:
    id: str
    cidade: str
    termos: list[str]
    tom: str = 'direto'
    preco: int = 90_000          # R$ 900,00 — o que ele cobra pela montagem
    carteira: int = SEMENTE
    toques: int = TOQUES_INICIAIS
    ganho: int = 0               # centavos que ENTRARAM, confirmados por você
    gasto: int = 0
    pai: str = ''
    geracao: int = 0
    nascido: int = 0
    morto: int = 0
    causa: str = ''
    filhos: list[str] = field(default_factory=list)
    leads: int = 0               # leads que ele achou
    fechados: int = 0
    recarregados: int = 0        # toques que VOCÊ devolveu, depois de ele fechar

    @property
    def vivo(self) -> bool:
        return not self.morto

    @property
    def saldo(self) -> int:
        """Lucro de verdade: o que entrou menos o que saiu."""
        return self.ganho - self.gasto

    @property
    def pode_reproduzir(self) -> bool:
        """
        Só se reproduz quem já recebeu dinheiro de cliente E tem sobra
        para bancar o filho sem se matar. As duas condições juntas: ter
        guardado a semente sem trabalhar não prova nada.
        """
        return (self.vivo and self.ganho > 0
                and self.carteira >= SEMENTE + LUCRO_PARA_REPRODUZIR)

    @property
    def parado(self) -> bool:
        """
        Vivo mas incapaz de agir: já fechou (então a ceifa o poupa) e
        ficou sem toque. Não morre, mas também não produz — e isso tem de
        aparecer no extrato, senão o extrato mente por omissão.
        """
        return self.vivo and self.toques <= 0

    def toques_gastos(self, iniciais: int) -> int:
        """Quantas portas ele já bateu. Conta recarga, se houve."""
        return max(0, iniciais + self.recarregados - self.toques)

    def pode_pagar(self, centavos: int) -> bool:
        return self.carteira >= centavos

    def resumo(self) -> str:
        if not self.vivo:
            estado = f'MORTO ({self.causa})'
        elif self.parado:
            estado = 'PARADO (sem toques)'
        else:
            estado = 'vivo'
        return (f'{self.id} · g{self.geracao} · {self.cidade} · {self.tom} · '
                f'cobra {dinheiro(self.preco)} · {estado}\n'
                f'    envelope {dinheiro(self.carteira)} · '
                f'ganhou {dinheiro(self.ganho)} · gastou {dinheiro(self.gasto)} · '
                f'saldo {dinheiro(self.saldo)}\n'
                f'    {self.toques} toques · {self.leads} leads · '
                f'{self.fechados} fechados'
                + (f' · filhos: {", ".join(self.filhos)}' if self.filhos else ''))


# ── a colônia ───────────────────────────────────────────────────────
class SemDinheiro(RuntimeError):
    """O organismo tentou agir sem ter com que pagar. Ele morre por isso."""


class ColoniaCheia(RuntimeError):
    pass


class SemBanco(RuntimeError):
    """Não há dinheiro livre no banco para abrir mais um envelope."""


class ContaErrada(RuntimeError):
    """A invariante do dinheiro quebrou. Nada mais age até você olhar."""


class Colonia:
    """
    A população e o livro-caixa, num JSON ao lado do banco do funil.

    JSON e não tabela de propósito: isto é um arquivo que você vai querer
    abrir, ler e às vezes corrigir à mão sem precisar de SQL.
    """

    def __init__(self, caminho: Path, teto_vivos: int = 8,
                 teto_gasto: int = TETO_GASTO, semente: int = SEMENTE,
                 toques: int = TOQUES_INICIAIS, banco: int = 0):
        self.caminho = Path(caminho)
        self.teto_vivos = max(1, min(int(teto_vivos), TETO_VIVOS))
        self.teto_gasto = max(0, min(int(teto_gasto), TETO_GASTO))
        self.semente = max(1, int(semente))
        self.toques_iniciais = max(1, int(toques))
        # O banco: centavos que VOCÊ declarou disponíveis. Dele saem os
        # envelopes, e nele voltam os envelopes de quem morre.
        self.banco = max(0, int(banco))
        self.bichos: dict[str, Organismo] = {}
        self.buscas_pagas = 0        # quantas buscas já saíram do grátis
        self.gasto_total = 0
        self.diario: list[dict] = []
        self.carrega()

    # ── o banco e os envelopes ──────────────────────────────────────
    @property
    def reservado(self) -> int:
        """Centavos prometidos aos envelopes dos VIVOS."""
        return sum(o.carteira for o in self.vivos())

    @property
    def livre(self) -> int:
        """O que ainda não foi prometido a ninguém."""
        return self.banco - self.reservado

    def confere(self) -> None:
        """
        A invariante, checada depois de toda mexida em dinheiro: a soma
        dos envelopes dos vivos não passa do banco.

        Isto levanta em vez de corrigir sozinho, de propósito. Se a soma
        passou do banco, algum caminho criou dinheiro que não existe — e
        um livro-caixa que se "ajusta" sozinho esconde exatamente o bug
        que você mais precisa ver.
        """
        if self.reservado > self.banco:
            raise ContaErrada(
                f'os envelopes somam {dinheiro(self.reservado)} e o banco tem '
                f'{dinheiro(self.banco)}. Alguma coisa criou dinheiro que não '
                'existe — não gaste mais nada até entender.')
        for o in self.bichos.values():
            if o.carteira < 0:
                raise ContaErrada(f'{o.id} está com envelope negativo: '
                                  f'{dinheiro(o.carteira)}')

    def declara_banco(self, centavos: int) -> None:
        """
        Você diz quanto há. Baixar abaixo do que já está reservado é
        recusado: o dinheiro desses envelopes já foi prometido, e
        confiscar em silêncio faria organismo gastar o que não existe.
        """
        centavos = max(0, int(centavos))
        if centavos < self.reservado:
            raise ContaErrada(
                f'não dá para declarar {dinheiro(centavos)}: os envelopes dos '
                f'vivos já somam {dinheiro(self.reservado)}.\n'
                'Mate um organismo primeiro (o envelope dele volta para o '
                'livre): ' + comando('python3 funil.py colonia --matar <id>'))
        antes = self.banco
        self.banco = centavos
        self._anota('banco', 'declarado', centavos - antes,
                    f'de {dinheiro(antes)} para {dinheiro(centavos)}')
        self.confere()

    # ── disco ───────────────────────────────────────────────────────
    def carrega(self) -> None:
        if not self.caminho.exists():
            return
        try:
            d = json.loads(self.caminho.read_text(encoding='utf-8-sig'))
        except (OSError, json.JSONDecodeError) as e:
            raise SystemExit(f'não consegui ler {self.caminho}: {e}')
        self.bichos = {o['id']: Organismo(**o) for o in d.get('organismos', [])}
        self.buscas_pagas = int(d.get('buscas_pagas', 0))
        self.gasto_total = int(d.get('gasto_total', 0))
        self.diario = list(d.get('diario', []))
        # O banco do arquivo vence o do argumento: ele é o saldo corrente,
        # já descontado de tudo que foi gasto. Deixar o argumento vencer
        # ressuscitaria dinheiro já queimado a cada abertura.
        if 'banco' in d:
            self.banco = int(d['banco'])

    def salva(self) -> None:
        """
        Escreve em arquivo temporário e troca. Interromper no meio de um
        write deixaria o livro-caixa pela metade, e livro-caixa pela
        metade é pior que livro-caixa nenhum.
        """
        self.caminho.parent.mkdir(parents=True, exist_ok=True)
        d = {
            'banco': self.banco,
            'organismos': [asdict(o) for o in self.bichos.values()],
            'buscas_pagas': self.buscas_pagas,
            'gasto_total': self.gasto_total,
            # O diário é a trilha de auditoria: nada é apagado dele.
            'diario': self.diario[-2000:],
        }
        tmp = self.caminho.with_suffix('.tmp')
        tmp.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding='utf-8')
        os.replace(tmp, self.caminho)

    def _anota(self, quem: str, o_que: str, quanto: int = 0, detalhe: str = '') -> None:
        self.diario.append({'quando': int(time.time()), 'quem': quem,
                            'o_que': o_que, 'quanto': quanto, 'detalhe': detalhe})

    # ── nascer ──────────────────────────────────────────────────────
    def vivos(self) -> list[Organismo]:
        return [o for o in self.bichos.values() if o.vivo]

    def mortos(self) -> list[Organismo]:
        return [o for o in self.bichos.values() if not o.vivo]

    def _id(self, geracao: int) -> str:
        n = sum(1 for o in self.bichos.values() if o.geracao == geracao) + 1
        return f'g{geracao}-{n:02d}'

    def nascer(self, cidade: str, termos: list[str], tom: str = 'direto',
               preco: int = 90_000, pai: str = '', geracao: int = 0) -> Organismo:
        if len(self.vivos()) >= self.teto_vivos:
            raise ColoniaCheia(
                f'a colônia está no teto de {self.teto_vivos} vivos. '
                'Espere alguém morrer, ou suba o teto em config.toml '
                f'(máximo de código: {TETO_VIVOS}).')
        if geracao > TETO_GERACOES:
            raise ColoniaCheia(f'geração {geracao} passa do teto de {TETO_GERACOES}')
        # O envelope sai do LIVRE. Sem banco suficiente, não nasce — e a
        # mensagem diz quanto falta, porque "não nasceu" sem motivo é o
        # tipo de silêncio que faz você mexer no lugar errado.
        if self.livre < self.semente:
            raise SemBanco(
                f'o banco tem {dinheiro(self.banco)}, os envelopes dos vivos já '
                f'somam {dinheiro(self.reservado)}, então sobram '
                f'{dinheiro(self.livre)} livres — e um organismo nasce com '
                f'{dinheiro(self.semente)}.\n'
                + comando('Declare mais: python3 funil.py colonia --banco ')
                + f'{self.banco + (self.semente - self.livre)}')
        o = Organismo(id=self._id(geracao), cidade=cidade, termos=list(termos),
                      tom=tom, preco=int(preco), carteira=self.semente,
                      toques=self.toques_iniciais,
                      pai=pai, geracao=geracao, nascido=int(time.time()))
        self.bichos[o.id] = o
        self._anota(o.id, 'nasceu', self.semente,
                    f'{cidade} · {tom}' + (f' · filho de {pai}' if pai else ''))
        return o

    # ── gastar, e morrer por isso ───────────────────────────────────
    def preco_de(self, operacao: str) -> int:
        """
        O custo da próxima operação. A busca é o único que muda de preço
        no caminho: as primeiras mil do mês são grátis, e a 1.001 começa
        a custar. Modelar isso importa porque é exatamente o momento em
        que a colônia para de ser barata.
        """
        if operacao == 'busca':
            if self.buscas_pagas < BUSCAS_GRATIS_MES:
                return 0
            return PRECOS['busca']
        return PRECOS.get(operacao, 0)

    def cobra(self, quem: str, operacao: str, vezes: int = 1) -> int:
        """
        Debita o custo da operação. Devolve o quanto saiu.

        Levanta SemDinheiro quando não dá — e aí o chamador NÃO insiste:
        quem não tem com que pagar está morto, e `ceifa()` recolhe.
        """
        o = self.bichos[quem]
        if not o.vivo:
            raise SemDinheiro(f'{quem} está morto desde {o.causa}')
        if self.gasto_total >= self.teto_gasto:
            raise SemDinheiro(
                f'a colônia bateu o teto de gasto ({dinheiro(self.teto_gasto)}). '
                'Ninguém mais age até você subir o teto.')
        custo = self.preco_de(operacao) * max(1, int(vezes))
        if custo and not o.pode_pagar(custo):
            raise SemDinheiro(
                f'{quem} tem {dinheiro(o.carteira)} e a operação "{operacao}" '
                f'custa {dinheiro(custo)}')
        if operacao == 'busca':
            self.buscas_pagas += max(1, int(vezes))
        o.carteira -= custo
        o.gasto += custo
        # Sai do envelope E do banco: o gasto é cobrança de verdade na sua
        # conta da Places, do provedor de modelo ou da Netlify.
        self.banco -= custo
        self.gasto_total += custo
        if custo:
            self._anota(quem, f'gastou:{operacao}', -custo, f'{vezes}x')
        self.confere()
        return custo

    def cobra_medido(self, quem: str, centavos: int, motivo: str) -> int:
        """
        Para quando o provedor diz o custo real (tokens de modelo pago).
        Custo medido vale mais que tabela, sempre.
        """
        o = self.bichos[quem]
        if not o.vivo:
            raise SemDinheiro(f'{quem} está morto')
        centavos = max(0, int(centavos))
        if centavos and not o.pode_pagar(centavos):
            raise SemDinheiro(f'{quem} tem {dinheiro(o.carteira)} e '
                              f'{motivo} custou {dinheiro(centavos)}')
        o.carteira -= centavos
        o.gasto += centavos
        self.banco -= centavos
        self.gasto_total += centavos
        if centavos:
            self._anota(quem, f'gastou:{motivo}', -centavos)
        self.confere()
        return centavos

    def toca(self, quem: str) -> None:
        """
        Gasta um toque: um primeiro contato que ele vai te pedir para
        mandar. Sem toque, ele não pode mais pedir — e é essa reserva que
        protege o seu número.
        """
        o = self.bichos[quem]
        if not o.vivo:
            raise SemDinheiro(f'{quem} está morto')
        if o.toques <= 0:
            raise SemDinheiro(f'{quem} não tem mais toques')
        o.toques -= 1
        self._anota(quem, 'tocou', 0, f'restam {o.toques}')

    # ── receber ─────────────────────────────────────────────────────
    def recebe(self, quem: str, centavos: int, de: str = '') -> None:
        """
        Você confirma um pagamento. Só por aqui entra dinheiro — nenhum
        organismo credita a si mesmo.
        """
        o = self.bichos[quem]
        centavos = int(centavos)
        if centavos <= 0:
            raise ValueError('valor recebido tem que ser positivo, em centavos')
        # Entra no banco (é dinheiro novo na sua conta) e no envelope de
        # quem trouxe. As duas pontas juntas mantêm a invariante: envelope
        # que cresce sem banco crescer seria dinheiro inventado.
        self.banco += centavos
        o.ganho += centavos
        o.fechados += 1
        if o.vivo:
            o.carteira += centavos
            self._anota(quem, 'recebeu', centavos, de)
        else:
            # Acontece de verdade: o cliente demora a pagar e o organismo
            # morre no meio. O dinheiro é seu e entra no banco; o envelope
            # dele não volta a existir. Creditar o envelope de um morto
            # deixaria dinheiro parado fora do `reservado` e fora do
            # `livre` ao mesmo tempo — some do extrato sem sair da conta.
            self._anota(quem, 'recebeu:depois_de_morto', centavos,
                        f'{de} · foi para o livre, não para o envelope')
        self.confere()

    # ── morrer ──────────────────────────────────────────────────────
    def mata(self, quem: str, causa: str) -> Organismo:
        """
        Morte é definitiva. Não existe reviver: um organismo que volta
        depois de falir apaga a única informação que a colônia produz,
        que é qual estratégia não funciona.
        """
        o = self.bichos[quem]
        if o.vivo:
            o.morto = int(time.time())
            o.causa = causa
            # O que sobrou no envelope volta para o livre. O dinheiro é
            # SEU, não dele: enterrar R$ 3,00 com o organismo seria perder
            # dinheiro de verdade para manter uma metáfora.
            devolvido, o.carteira = o.carteira, 0
            self._anota(quem, 'morreu', devolvido,
                        causa + (f' · devolveu {dinheiro(devolvido)} ao livre'
                                 if devolvido else ''))
            self.confere()
        return o

    def ceifa(self) -> list[Organismo]:
        """
        Recolhe quem não tem mais como agir. Dois jeitos de morrer:

          • sem toque e sem nunca ter fechado — a estratégia não convence;
          • sem carteira para a operação mais barata que ainda custa algo.

        Quem ficou sem toque MAS já fechou não morre: provou que funciona,
        e merece que você decida se recarrega.
        """
        mortos = []
        barato = min(p for p in PRECOS.values() if p > 0) if any(
            p > 0 for p in PRECOS.values()) else 0
        for o in self.vivos():
            if o.toques <= 0 and o.fechados == 0:
                mortos.append(self.mata(o.id, 'queimou os toques sem fechar nada'))
            elif barato and o.carteira < barato and o.ganho == 0:
                mortos.append(self.mata(o.id, f'carteira em {dinheiro(o.carteira)}'))
        return mortos

    # ── reproduzir ──────────────────────────────────────────────────
    def muta(self, pai: Organismo, cidades: list[str],
             sorteio: random.Random | None = None) -> dict:
        """
        UMA mutação por filho, e só uma.

        Clone idêntico não ensina nada: se o pai deu lucro, você precisa
        saber se foi a cidade, o tom ou o preço. Variar um eixo por vez é
        o que transforma a colônia em experimento em vez de aposta.
        """
        r = sorteio or random.Random()
        eixos = ['tom', 'preco', 'termos']
        outras = [c for c in cidades if c and c != pai.cidade]
        if outras:
            eixos.append('cidade')
        # Cortar termo só é mutação quando há termo para cortar. Sem esta
        # linha, um organismo de termo único gerava filho IDÊNTICO — e
        # filho idêntico não ensina nada, que é o que esta função evita.
        if len(pai.termos) <= 1 and 'termos' in eixos:
            eixos.remove('termos')
        eixo = r.choice(eixos)
        novo = {'cidade': pai.cidade, 'termos': list(pai.termos),
                'tom': pai.tom, 'preco': pai.preco}
        if eixo == 'cidade':
            novo['cidade'] = r.choice(outras)
        elif eixo == 'tom':
            novo['tom'] = r.choice([t for t in TONS if t != pai.tom] or list(TONS))
        elif eixo == 'preco':
            # ±25%, arredondado para dezena de real: preço quebrado em
            # proposta de serviço parece erro de planilha.
            fator = r.choice((0.75, 1.25))
            novo['preco'] = max(10_000, int(pai.preco * fator) // 1000 * 1000)
        else:
            novo['termos'] = r.sample(pai.termos, len(pai.termos) - 1)
        novo['eixo'] = eixo
        return novo

    def reproduz(self, quem: str, cidades: list[str] | None = None,
                 sorteio: random.Random | None = None) -> Organismo | None:
        """
        O pai paga a semente do filho com o SEU dinheiro. Se não tem, não
        reproduz — a colônia nunca cria valor do nada.
        """
        pai = self.bichos[quem]
        if not pai.pode_reproduzir:
            return None
        if len(self.vivos()) >= self.teto_vivos:
            return None
        if pai.geracao + 1 > TETO_GERACOES:
            return None
        plano = self.muta(pai, list(cidades or [pai.cidade]), sorteio)
        # O pai transfere do PRÓPRIO envelope para o do filho. O banco não
        # muda: é o mesmo dinheiro, só mudou de envelope. Por isso o
        # débito vem antes de nascer — senão `nascer` olharia o livre e
        # veria dinheiro que já está prometido ao filho.
        pai.carteira -= self.semente
        filho = self.nascer(cidade=plano['cidade'], termos=plano['termos'],
                            tom=plano['tom'], preco=plano['preco'],
                            pai=pai.id, geracao=pai.geracao + 1)
        pai.filhos.append(filho.id)
        self._anota(pai.id, 'reproduziu', -self.semente,
                    f'{filho.id} · mutou {plano["eixo"]}')
        return filho

    # ── leitura ─────────────────────────────────────────────────────
    def medida(self) -> dict[str, Any]:
        """
        A conta que a colônia existe para produzir: quantas portas você
        bate por venda, e quanto custa cada uma.

        Isto vale mais que o saldo. Saldo diz se deu certo; isto diz
        quanto você precisa gastar da sua reputação para a próxima dar.
        """
        bichos = list(self.bichos.values())
        gastos = sum(o.toques_gastos(self.toques_iniciais) for o in bichos)
        fechados = sum(o.fechados for o in bichos)
        ganho = sum(o.ganho for o in bichos)
        gasto = sum(o.gasto for o in bichos)
        return {
            'toques_gastos': gastos,
            'fechados': fechados,
            'conversao': (fechados / gastos) if gastos else 0.0,
            'toques_por_venda': (gastos / fechados) if fechados else 0.0,
            'custo_por_venda': int(gasto / fechados) if fechados else 0,
            'ganho': ganho,
            'gasto': gasto,
        }

    def extrato(self) -> str:
        vivos, mortos = self.vivos(), self.mortos()
        ganho = sum(o.ganho for o in self.bichos.values())
        gasto = sum(o.gasto for o in self.bichos.values())
        m = self.medida()
        cabem = self.livre // self.semente
        linhas = [
            '',
            f'  BANCO {dinheiro(self.banco)}'
            f'  =  envelopes {dinheiro(self.reservado)}'
            f'  +  livre {dinheiro(self.livre)}',
            f'  cabem mais {cabem} organismo(s) de {dinheiro(self.semente)}'
            if cabem else '  não cabe mais nenhum organismo no livre',
            '',
            f'  COLÔNIA · {len(vivos)} vivos de {len(self.bichos)} · '
            f'teto {self.teto_vivos}',
            f'  entrou {dinheiro(ganho)} · saiu {dinheiro(gasto)} · '
            f'saldo {dinheiro(ganho - gasto)}',
            f'  buscas pagas da Places: {self.buscas_pagas} '
            f'(grátis até {BUSCAS_GRATIS_MES}/mês)',
            f'  teto de gasto da colônia: {dinheiro(self.teto_gasto)} · '
            f'já gastou {dinheiro(self.gasto_total)}',
        ]
        if m['toques_gastos']:
            if m['fechados']:
                linhas.append(
                    f'  MEDIDO: {m["toques_gastos"]} portas batidas, '
                    f'{m["fechados"]} vendas · conversão '
                    f'{m["conversao"]:.1%} · {m["toques_por_venda"]:.0f} '
                    f'portas por venda · custo de API por venda '
                    f'{dinheiro(m["custo_por_venda"])}')
            else:
                linhas.append(
                    f'  MEDIDO: {m["toques_gastos"]} portas batidas, '
                    'nenhuma venda ainda. Com 3% de conversão, 40 portas '
                    'dão 70% de chance de uma — ainda é cedo para concluir.')
        linhas.append('')
        for o in sorted(vivos, key=lambda x: (-x.saldo, x.id)):
            linhas.append('  ' + o.resumo())
        if mortos:
            linhas += ['', '  ── cemitério ──']
            for o in sorted(mortos, key=lambda x: x.morto):
                linhas.append(f'  † {o.id} · {o.cidade} · {o.tom} · {o.causa} · '
                              f'ganhou {dinheiro(o.ganho)}, '
                              f'gastou {dinheiro(o.gasto)}')
        return '\n'.join(linhas) + '\n'
