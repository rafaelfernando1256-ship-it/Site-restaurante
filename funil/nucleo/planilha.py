"""
A PLANILHA — a porta de entrada que não depende de API nenhuma.

Você preenche seis colunas num CSV (o Excel e o Google Planilhas salvam
nesse formato) e o funil inteiro passa a trabalhar naqueles negócios.

POR QUE CSV E NÃO UM FORMULÁRIO BONITO

Porque você estuda e trabalha. O que você já tem aberto no celular, na
fila do banco, é a planilha. Um formulário web significa subir servidor,
abrir aba, lembrar a senha — três passos a mais para a mesma informação.

POR QUE O place_id DE UM LEAD MANUAL É "manual:nome-cidade"

A tabela de leads usa `place_id` como chave única, porque foi desenhada
em volta da Places API. Lead posto à mão não tem place_id. Inventar um
aleatório faria a MESMA linha da planilha, importada duas vezes, criar
dois leads — e você descobriria isso mandando duas mensagens para o
mesmo dono. Derivar a chave do nome + cidade torna a importação
idempotente: reimportar atualiza, não duplica.

O QUE ENTRA, E O QUE O SISTEMA NÃO INVENTA

Só dado comercial público: nome, tipo, endereço, telefone comercial,
perfil público, horário que o próprio negócio publica. Nada de nome,
CPF ou dado pessoal do dono — LGPD à parte, não serve para nada aqui.

Coluna vazia NÃO vira palpite. Se não há horário, o site diz "confirme
com a casa" e a pendência vai junto na sua mensagem. Prévia com dado
inventado é a forma mais rápida de perder a venda na primeira conferida.
"""
from __future__ import annotations

import csv
import re
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path

from .a1_cacador import e164

# As seis que você preenche + as que melhoram a prévia se você souber.
COLUNAS = ['nome', 'tipo', 'endereco', 'telefone', 'instagram', 'tem_site',
           'cidade', 'horario', 'especialidades', 'observacao']

OBRIGATORIAS = ['nome']

# tipo (o que você escreve) → modelo visual (qual template)
MODELOS = {
    'restaurante': 'restaurante', 'lanchonete': 'restaurante',
    'pizzaria': 'restaurante', 'hamburgueria': 'restaurante',
    'churrascaria': 'restaurante', 'cafe': 'restaurante',
    'cafeteria': 'restaurante', 'padaria': 'restaurante',
    'sorveteria': 'restaurante', 'bar': 'restaurante',
    'açaiteria': 'restaurante', 'acaiteria': 'restaurante',
    'marmitaria': 'restaurante', 'pastelaria': 'restaurante',
    'hotel': 'hotel', 'pousada': 'hotel', 'hostel': 'hotel',
    'chale': 'hotel', 'chalé': 'hotel', 'resort': 'hotel',
    'flat': 'hotel', 'apart': 'hotel',
}

SIM = {'sim', 's', 'yes', 'y', 'true', '1', 'tem', 'x'}


@dataclass
class Linha:
    """Uma linha da sua planilha, já limpa."""
    nome: str
    tipo: str = ''
    endereco: str = ''
    telefone: str = ''
    instagram: str = ''
    tem_site: bool = False
    cidade: str = ''
    horario: str = ''
    especialidades: list[str] = field(default_factory=list)
    observacao: str = ''
    problemas: list[str] = field(default_factory=list)

    @property
    def modelo(self) -> str:
        """Qual dos três templates. Sem tipo reconhecido, o genérico —
        que é feio errar para o lado do cardápio num hotel."""
        return MODELOS.get(_simples(self.tipo), 'negocio')

    @property
    def place_id(self) -> str:
        return f'manual:{_slug(self.nome)}-{_slug(self.cidade) or "sc"}'

    @property
    def presenca(self) -> str:
        if self.tem_site:
            return 'tem_site'
        return 'so_rede' if self.instagram else 'sem_presenca'

    def para_lead(self) -> dict:
        """Os campos do jeito que `Estado.guarda_lead` espera."""
        return {
            'place_id': self.place_id, 'nome': self.nome,
            'telefone': self.telefone, 'telefone_e164': e164(self.telefone),
            # sem o '@': é como o caçador grava, e o painel põe o
            # arroba na hora de mostrar. Gravar com ele dava "@@perfil".
            'instagram': self.instagram.lstrip('@'), 'endereco': self.endereco,
            'cidade': self.cidade, 'categoria': self.tipo or 'negócio',
            'presenca': self.presenca, 'pontuacao': self.pontuacao(),
            'dados': {'origem': 'planilha', 'modelo': self.modelo,
                      'horario': self.horario,
                      'especialidades': self.especialidades,
                      'observacao': self.observacao},
        }

    def pontua_vazios(self) -> list[str]:
        """O que falta para a prévia ficar boa. Vira recado, não palpite."""
        falta = []
        if not self.endereco:
            falta.append('endereço (sem ele não dá mapa)')
        if not self.telefone:
            falta.append('telefone (sem ele não dá botão de WhatsApp)')
        if not self.horario:
            falta.append('horário de funcionamento')
        if not self.especialidades:
            falta.append('3 pratos/serviços para a vitrine')
        return falta

    def pontuacao(self) -> int:
        """
        Quem vale a prévia primeiro, de 0 a 10.

        Quem NÃO tem site vale mais: é para quem a oferta faz sentido.
        Quem tem Instagram vale mais ainda — já tem foto e movimento, e a
        conversa começa num lugar melhor que "oi, tudo bem?".
        """
        p = 0
        p += 0 if self.tem_site else 4
        p += 2 if self.instagram else 0
        p += 2 if self.telefone else 0
        p += 1 if self.endereco else 0
        p += 1 if self.especialidades else 0
        return min(p, 10)


def _simples(t: str) -> str:
    plano = unicodedata.normalize('NFKD', t or '').encode('ascii', 'ignore')
    return plano.decode().strip().lower()


def _slug(t: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', _simples(t)).strip('-')


def _instagram(t: str) -> str:
    """Aceita @perfil, perfil, instagram.com/perfil e o link com ?igsh=..."""
    t = (t or '').strip()
    if not t:
        return ''
    m = re.search(r'instagram\.com/([A-Za-z0-9_.]+)', t)
    alvo = m.group(1) if m else t.lstrip('@').split('/')[0].split('?')[0]
    return f'@{alvo}' if alvo else ''


def le(caminho: Path) -> list[Linha]:
    """
    Lê o CSV e devolve as linhas limpas, com os problemas anotados em
    cada uma — em vez de parar tudo no primeiro erro de digitação.
    """
    bruto = caminho.read_bytes()
    # O Excel brasileiro salva com BOM e com ponto e vírgula. Aceitar os
    # dois formatos evita o suporte de "abri e não entendeu nada".
    texto = bruto.decode('utf-8-sig', errors='replace')
    primeira = texto.splitlines()[0] if texto.strip() else ''
    sep = ';' if primeira.count(';') > primeira.count(',') else ','

    linhas: list[Linha] = []
    for i, cru in enumerate(csv.DictReader(texto.splitlines(), delimiter=sep), 2):
        pega = {(_simples(k) or ''): (v or '').strip()
                for k, v in cru.items() if k}
        nome = pega.get('nome', '')
        if not nome:
            continue                      # linha em branco no fim da planilha
        especialidades = [x.strip() for x in
                          re.split(r'[;|]', pega.get('especialidades', ''))
                          if x.strip()]
        linha = Linha(
            nome=nome, tipo=pega.get('tipo', ''),
            endereco=pega.get('endereco', ''),
            telefone=pega.get('telefone', ''),
            instagram=_instagram(pega.get('instagram', '')),
            tem_site=_simples(pega.get('tem_site', '')) in SIM,
            cidade=pega.get('cidade', ''), horario=pega.get('horario', ''),
            especialidades=especialidades[:6],
            observacao=pega.get('observacao', ''))
        if not _simples(linha.tipo):
            linha.problemas.append(f'linha {i}: sem tipo — usei o modelo '
                                   'genérico')
        elif _simples(linha.tipo) not in MODELOS:
            linha.problemas.append(
                f'linha {i}: "{linha.tipo}" não é restaurante nem hotel, '
                'então usei o modelo genérico (é o certo para ele)')
        linhas.append(linha)
    return linhas


MODELO_CSV = """nome,tipo,endereco,telefone,instagram,tem_site,cidade,horario,especialidades,observacao
Cantina da Vó,restaurante,"Rua das Flores, 120 - Centro",+55 84 98888-7777,@cantinadavo,nao,Natal,Ter a Dom 11h-15h,Lasanha da casa;Parmegiana;Feijoada no sábado,dona Rita atende de manhã
Pousada Maré Alta,pousada,"Av. Beira Mar, 45",+55 84 97777-6666,@pousadamarealta,nao,Natal,Recepção 24h,12 quartos;Café da manhã incluído;Piscina,
Barbearia do Léo,barbearia,"Rua Nova, 8 - Alecrim",+55 84 96666-5555,,nao,Natal,Seg a Sáb 9h-19h,Corte na tesoura;Barba na navalha;Pezinho,sem Instagram ainda
"""


def escreve_modelo(caminho: Path) -> Path:
    """
    Gera a planilha de exemplo JÁ PREENCHIDA com três linhas.

    Preenchida de propósito: planilha com só o cabeçalho deixa você
    adivinhando o formato de "especialidades" e de "tem_site", e o
    primeiro lote sai errado.
    """
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(MODELO_CSV, encoding='utf-8')
    return caminho
