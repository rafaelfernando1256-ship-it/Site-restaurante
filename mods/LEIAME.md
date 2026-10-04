# mods — plugins do Claude Code

Cada pasta aqui é um **mod**: um plugin de hooks que o Claude Code carrega
e que desenha ou age dentro da sua sessão.

## funil-band

Uma barra acima do prompt com o estado do funil. Mostra duas coisas
diferentes conforme a fase:

- **antes do primeiro lead** — quais chaves já estão configuradas
  (`places ✓ · groq ✓ · netlify ✗`). É a pergunta que se faz dez vezes
  durante a instalação, e ter a resposta à vista poupa dez `conferir`.
- **depois** — leads por etapa e, em destaque, **quantas mensagens
  esperam o seu clique**. Esse número é o único que trava o funil: nada
  sai sozinho para quem nunca te procurou, por projeto. O resto da barra
  é cinza; esse número é negrito, e tem teste provando que continua assim.

Também registra `/funil`, que relê na hora.

### Quando ele atualiza

Na abertura da sessão, e depois de **qualquer** comando `funil.py` — que
é exatamente quando o estado muda. Sem relógio e sem varredura de fundo:
um processo por mudança real.

### Como ele lê

`python3 funil.py resumo --json`, que existe para isto. Adivinhar o texto
bonito do `resumo` seria combinar dois formatos que ninguém prometeu
manter iguais: saída de máquina é contrato, saída de tela é desenho.

Fora do repositório, sem Python ou sem o funil instalado, a barra
simplesmente não aparece — ela é informação, não dependência.

### Usar

```bash
claude --plugin-dir mods
```

Verificar antes:

```bash
claude plugin validate mods/funil-band
claude plugin test mods/funil-band       # 6 testes
```
