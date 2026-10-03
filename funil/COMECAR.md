# Começar — do zero até o primeiro site publicado

Siga na ordem. Cada passo termina com um comando que **confirma** que
deu certo, para você não descobrir no passo 6 que errou no passo 2.

Tempo: uma hora, sendo quase tudo espera de cadastro.

---

## Passo 0 — Pegar o código novo (2 min)

**Não pule este passo.** `conferir` e `colonia` são comandos novos; sem o
`git pull` eles não existem e o Python responde `invalid choice`.

Abra o **PowerShell** (não o CMD) e rode:

```powershell
cd "$env:USERPROFILE\Documents\Site-restaurante"
git pull origin claude/tempero-familia-website-nzqgb4
cd funil
pip install -r requirements.txt
```

**Confirme:** `python funil.py conferir --seco` tem de imprimir o
diagnóstico. Se der erro de comando, você está na pasta errada.

---

## Passo 1 — A chave da Places API (15 min)

É o que falta para o agente 1 achar restaurante sozinho. Sem ela você só
adiciona lead à mão.

1. Abra **https://console.cloud.google.com**
2. No topo, ao lado de "Google Cloud", escolha ou **crie um projeto**
3. Ative o faturamento (aqueles **US$ 300** de crédito que você viu).
   É obrigatório mesmo para usar só a parte grátis — o Google pede o
   cartão e não cobra enquanto você fica na cota.
4. Menu ☰ → **APIs e Serviços** → **Biblioteca**
5. Busque **"Places API (New)"** — com o `(New)`, não a antiga —
   e clique em **Ativar**
6. Menu ☰ → **APIs e Serviços** → **Credenciais**
7. **+ Criar credenciais** → **Chave de API** → copie
8. Clique na chave recém-criada → **Restrições de API** →
   **Restringir chave** → marque **Places API (New)** → **Salvar**

   *Faça esta parte.* Chave aberta é fatura aberta: se ela vazar, qualquer
   um gasta no seu cartão.

Agora cole no arquivo `funil\.env`.

> **Se você já tem um `.env`, NÃO copie o exemplo por cima.** Ele
> sobrescreve sem avisar e leva junto as chaves que já funcionavam. Esta
> linha cria o arquivo só quando ele ainda não existe:
>
> ```powershell
> if (-not (Test-Path .env)) { copy .env.exemplo .env }
> notepad .env
> ```

```
GOOGLE_PLACES_KEY=AIza...sua...chave
```

> **Cuidado com o Bloco de Notas.** Ele salva com uma marca invisível no
> começo (BOM) que já quebrou o `.env` antes. O código hoje lê os dois
> jeitos, mas prefira o **VS Code** ou o Notepad++.

**Confirme:**

```powershell
python funil.py conferir
```

A linha `Places API` tem de ficar **✓ válida**. Se vier
"não está ATIVADA", volte ao passo 5. Se vier "RECUSOU A CHAVE", recole
— provavelmente faltou um pedaço.

---

## Passo 2 — O cérebro (você já tem) (2 min)

A sua chave do Gemini já funciona. Confira que está no `.env`:

```
GEMINI_API_KEY=AQ....sua...chave
```

E em `funil\config.toml` (copie do `config.exemplo.toml`):

```toml
[geral]
provedor = "gemini"
cidade = "Natal, RN"
```

**Confirme:** na saída do `conferir`, a linha do cérebro diz
**✓ válida · N modelos disponíveis**.

Se a sua cota do Gemini apertar, pegue uma do **Groq**
(console.groq.com/keys, grátis sem cartão), ponha `GROQ_API_KEY=gsk_...`
no `.env` e troque para `provedor = "groq"`. Funciona sem mexer em código.

---

## Passo 3 — O token da Netlify (5 min)

É o agente 4, o que publica o site e gera o link que você manda.

1. **https://app.netlify.com/user/applications**
2. Em **Personal access tokens** → **New access token**
3. Dê um nome ("funil"), gere, **copie na hora** — ele não aparece de novo
4. No `.env`:

```
NETLIFY_TOKEN=nfp_...seu...token
```

**Confirme:** a linha `Netlify` fica **✓ válido · equipe "conta5197-99"
encontrada**. Se disser que a equipe não está entre as suas, o
`conferir` lista as reais — corrija `equipe_netlify` no `config.toml`.

---

## Passo 4 — O navegador, para o agente tirar os prints (5 min)

```powershell
python -m playwright install chromium
```

**Confirme:** a linha `navegador` fica **✓ Chromium abre**.

Isto é opcional: sem ele tudo funciona, você só tem de pôr os prints do
Instagram à mão em `material\<nome-do-lead>\`.

---

## Passo 5 — A hora da verdade: um lead, do começo ao fim (20 min)

**Faça com UM lead antes de rodar em volume.** É o único jeito de
descobrir o que eu não pude testar daqui — a Netlify e o WhatsApp são
bloqueados no ambiente onde escrevi o código.

```powershell
# 1. achar — UM termo e UMA página, para não trazer 200 de primeira
python funil.py cacar --cidade "Natal, RN" --termos pizzaria --paginas 1
python funil.py resumo

# 2. escrever a abordagem
python funil.py escrever --limite 1

# 3. LER o que ele escreveu, com os seus olhos
python funil.py painel

# 4. aprovar e mandar (abre o WhatsApp Web; você confere e clica Enter)
python funil.py aprovar --todas
python funil.py enviar --abrir
```

Agora **espere a resposta de verdade**. Quando o dono responder:

```powershell
python funil.py retorno 1 "cola aqui exatamente o que ele respondeu"
python funil.py triar

# 5. construir a demonstração a partir do Instagram dele
python funil.py capturar --limite 1      # ou ponha os prints à mão
python funil.py construir --limite 1

# 6. publicar e mandar o link
python funil.py publicar --limite 1
python funil.py enviar
```

**Confirme:** abra o link que saiu do `publicar`, no celular. Se o site
abrir e estiver decente, o sistema inteiro funciona de ponta a ponta — e
isso ninguém sabe ainda, nem eu.

---

## Passo 6 — Só agora, a colônia (5 min)

Faça isto **depois** do passo 5 ter dado certo. A colônia não é o
caminho para começar; é o jeito de descobrir *qual estratégia* funciona
depois que você sabe que o caminho funciona.

```powershell
python funil.py colonia --banco 2500
python funil.py colonia --nascer --tom direto
python funil.py colonia --nascer --tom curioso
python funil.py colonia --viver
```

Quando um cliente pagar:

```powershell
python funil.py colonia --recebi g0-01 90000     # R$ 900,00 em centavos
python funil.py colonia                           # o extrato
```

Depois de uns 40 primeiros contatos o extrato começa a dizer a **sua**
conversão medida — quantas portas custam uma venda. É esse número que
vale, não o meu palpite.

---

## Quando algo der errado

**Primeiro, sempre:**

```powershell
python funil.py conferir
```

Ele testa as chaves de verdade e diz o que fazer, não só que falhou.

| o que você vê | o que é |
|---|---|
| `não está ATIVADA` | passo 1.5 — ativar a Places API (New) |
| `RECUSOU A CHAVE` | recole a chave, inteira e sem espaço |
| `Restrições de API` | passo 1.8 — inclua Places API (New) nas restrições |
| `token do claude.ai` | você colou o token do site errado |
| `a equipe X não está entre as suas` | corrija `equipe_netlify` no config.toml |
| `erro de formato` no config.toml | chave repetida; apague a linha duplicada |
| `invalid choice: 'conferir'` | falta o passo 0 — `git pull` |
| o `.env` ficou em branco | foi sobrescrito pelo exemplo; recole as chaves |
| `429` ou `sobrecarregado` | cota do dia; espere ou troque de provedor |

**Nunca mexa no `dados\funil.db` à mão.** Tem nome e telefone de gente
real, e o funil depende das transições de estado para não mandar a mesma
mensagem duas vezes.

---

## O que este sistema NÃO faz, de propósito

- **não manda o primeiro contato sozinho.** Ele escreve, você lê e clica.
  Disparo automático para quem nunca te procurou é o jeito mais rápido de
  perder o número que você usa para vender.
- **não inventa nada no site do cliente.** Sem preço que não leu, sem
  depoimento, sem nota média. Todo site sai marcado como demonstração.
- **não processa pagamento.** O Pix é gerado, quem confere o recebimento
  é você — e é você que digita o valor em `colonia --recebi`.
