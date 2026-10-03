# Brief — Webview, passo 1: apagar as duas rotas sem consumidor

| | |
|---|---|
| **Natureza** | **SUBTRAÇÃO.** Nada é construído. Se a execução começar a construir algo, **ela saiu do escopo** |
| **Autorizado em** | **2026-10-02 pelo Olavo** (*"apagar rotas sem consumidor = ok"*, parcial: só estas duas) |
| **Camada de modelo** (**R10**) | 🟢 **RÁPIDA basta.** A decisão já está tomada e as linhas estão nomeadas abaixo. **Não há julgamento aqui** — o que havia, o chat-mãe já mediu e fechou |
| **Escrito por** | chat-mãe, 2026-10-03, **medindo no que está no ar**, não no relatório de terceiro |

---

## 🔴 R15 — as três perguntas. E aqui são DOIS repositórios, atenção

| # | | |
|---|---|---|
| **1a** | **ONDE COMMITO O CÓDIGO** | 🔴 **`olavofranzin/phi-dashboard-webview`**, branch **`webview`**<br>`https://github.com/olavofranzin/phi-dashboard-webview/tree/webview`<br>`git clone -b webview https://github.com/olavofranzin/phi-dashboard-webview` |
| **1b** | **ONDE COMMITO A DOCUMENTAÇÃO** | **`olavofranzin/phi`**, branch **`claude/consolidacao-2026-08`**<br>`https://github.com/olavofranzin/phi/tree/claude/consolidacao-2026-08`<br>`git fetch origin claude/consolidacao-2026-08 && git checkout claude/consolidacao-2026-08` |
| **2** | **ONDE LEIO** | **`docs/strategic-planning/webview/CLAUDE.md`** (no repo `phi`) — a frente. E o **`CLAUDE.md` da raiz**, que são as regras |
| **3** | **ONDE REGISTRO** | (a) `webview/CLAUDE.md` §2 — o passo **1** sai de *"parcialmente liberado"* para **feito, com a prova**<br>(b) `webview/CHECKLIST-webview.md`<br>(c) a linha no **Ledger** (**R3**) — **abertura ao começar e encerramento ao fim**, não só uma |

> 🔴 **A trava da R15 compara branches DENTRO DO MESMO REPOSITÓRIO.** Dois repositórios **não são
> divergência** — são o desenho desta tarefa. Se a instrução da sua sessão apontar uma branch do
> `phi`, isso **não entra em conflito** com commitar código no `phi-dashboard-webview`.
>
> **O que ainda PARA e avisa:** se a instrução da sua sessão apontar, **dentro do `phi`**, uma branch
> diferente de `claude/consolidacao-2026-08`, ou, **dentro do webview**, uma diferente de `webview`.
>
> ⚠️ **E registre a parada no Ledger ANTES de parar** (emenda da R15, 03/10): *parar é um estado, e
> estado se registra.*

---

## 0. 🔴 Leia o que está NO AR. O clone que você encontrar pode ser o pai

**Medido em 03/10:** `origin/webview` está em **`c37d0b0`** (*"feat: load client dossiers from
Notion"*). Existe por aí um clone em **`9e4ab45`**, que é o **pai** dele — e **os números de linha
dos dois arquivos são diferentes entre as duas versões.**

| | |
|---|---|
| **antes de qualquer edição** | `git fetch origin webview` e trabalhe sobre **`c37d0b0`** |
| **ponto de rollback** | **`c37d0b0`** — anote-o no Ledger antes de tocar em nada |
| 🔴 **os números de linha deste brief** | **são da versão `c37d0b0`.** Confirme cada um com `grep -n` antes de apagar. **Se não casar, PARE** — você está em outra versão |

> **Motivo:** é a **R13** na forma git, e ela já morreu três vezes nesta casa — a última foi o
> chat-mãe afirmando o estado de uma branch a partir de clone velho.

---

## 1. O que apagar, e por quê — medido no código que está no ar

### 1.1 As duas rotas, em `server/index.js`

| Linhas (em `c37d0b0`) | O quê | Consumidores medidos |
|---|---|---|
| **344–354** | o comentário (*"Painel operacional da campanha…"*) + `app.get("/api/campaign-detail", ...)`, **fecha no `});` da 354** | 🔴 **zero** |
| **356–365** | o comentário (*"Diagnóstico de uma base do Notion…"*) + `app.get("/api/notion-debug", ...)`, **fecha no `});` da 365** | 🔴 **zero** |

> ⚠️ **A linha 355 é branca e a 366 é branca** — sobra **uma** entre a `/api/phi-snapshot` e a
> `/api/clients`. Não deixe duas em branco coladas.
>
> 🔴 **O comentário de cada rota sai COM ela.** Comentário órfão descrevendo rota que não existe é
> a **R5** ao contrário: documentação que mente sobre o artefato.

**Como a contagem foi feita** (refaça, não confie):
```
git grep -l "api/campaign-detail" origin/webview -- 'src/*' 'public/*' '*.html'
git grep -l "api/notion-debug"    origin/webview -- 'src/*' 'public/*' '*.html'
```
**As duas devolvem vazio.** Para comparação, `api/phi-snapshot` devolve `src/hooks/usePhiData.ts` e
`api/clients` devolve `src/hooks/useClientData.ts` + o teste dele.

### 1.2 Por que o `notion-debug` é o motivo de a tarefa existir

```js
app.get("/api/notion-debug", async (req, res) => {
  const db = String(req.query.db || "").trim();
  if (!db) return res.status(400).json({ error: "parâmetro 'db' (database_id) obrigatório" });
  res.json(await debugDatabase(db));
```

| O que isto é, **lido** | |
|---|---|
| **recebe** | **qualquer `database_id`** pela query string |
| **confere** | 🔴 **nada** — sem login, sem lista de bases permitidas |
| **usa** | o **`NOTION_TOKEN` do servidor**, logo alcança **tudo** que aquele token alcança |

> ⬜ **O que o chat-mãe NÃO mediu, e você também não precisa medir para executar:** se a URL de
> produção responde sem credencial de fora (a política de rede da sessão bloqueou o host). **Isso
> governa a URGÊNCIA, não a correção** — apagar rota com zero consumidores está certo de qualquer
> forma. **Não invente a gravidade que não mediu** (**R6**, lado da gravidade).

### 1.3 As funções que ficam órfãs, em `server/notion.js`

**Apagar junto, senão sobra código morto que a próxima auditoria investiga:**

| Linhas (em `c37d0b0`) | O quê |
|---|---|
| **262–321** | `async function getCampaignDetail(...)` — **fecha no `}` da 321** |
| **323–347** | 🔴 **o comentário de doc das 323–324** (*"Diagnóstico: primeiras `limit` linhas…"*) **+** `async function debugDatabase(...)`, **fecha no `}` da 347** |
| **353 e 354** | as duas entradas no `module.exports` — **só essas duas.** As linhas 350–352 (`getNameMaps`, `getClients`, `clientNum`) e as 355+ (`formatBrl`, `formatDateBr`, …) **ficam** |

> 🔴 **O comentário de doc sai com a função** — igual às rotas. Comentário descrevendo função que
> não existe mais é testemunha falsa (**R13** regra 3).

**E em `server/index.js` linha 22**, tirar os dois nomes do `require` — **deixando `getNameMaps`,
`getClients` e `clientNum`, que continuam em uso:**
```js
const { getNameMaps, getClients, clientNum, debugDatabase, getCampaignDetail } = require("./notion");
```

---

## 2. 🔴 O que NÃO se apaga — e por que isto está escrito aqui

| Rota | Consumidor hoje | Por que FICA |
|---|---|---|
| `/api/phi-snapshot` | `src/hooks/usePhiData.ts` | em uso |
| `/api/clients` | `src/hooks/useClientData.ts` | em uso |
| `/api/health` | 🔴 **zero** | **retido pelo Olavo em 02/10.** Devolve só `true`/`false` (`hasNotion`, `hasSecret`) — **diz que o token existe, não diz qual é** |
| `/api/phi-score-history` | 🔴 **zero** | **retido: o Olavo decidiu em 02/10 que o gráfico "Evolução do Score" VOLTA.** Esta rota é o que ele vai consumir |

> 🔴 **E uma tarefa de uma linha que evita a próxima limpeza matar o trabalho:** ponha, **acima de
> cada uma dessas duas rotas retidas, um comentário dizendo por que ela existe sem consumidor.**
>
> **Motivo:** é a **R5** aplicada a rota. **"Zero consumidores" é exatamente o critério desta
> tarefa** — sem o comentário, a próxima faxina apaga as duas com toda a razão aparente.

---

## 3. Publicar — e o portão

**Não há `.github/workflows` neste repositório** (medido). O deploy é do **EasyPanel**, com o
`Dockerfile` **da raiz** e contexto `/`.

| | |
|---|---|
| 🔴 **NÃO presuma que `git push` publica** | descubra como esta aplicação sobe, **escreva o que descobriu**, e **espere o OK do Olavo antes de publicar** |
| **precedente** | foi assim no W4: o executor parou, pediu, o Olavo disse *"ok, pode publicar"* |
| **depois de publicar** | **releia o que está no ar** (**R13** regra 2). *"Não deu erro"* não é *"está no ar"* |

---

## 4. Critérios de aceite — escritos ANTES (R9)

| # | Critério | Como provar |
|---|---|---|
| **CA1** | as duas rotas **respondem 404** | `curl` nas duas, **depois** de publicar |
| **CA2** | 🔴 **`/api/phi-snapshot` idêntico antes e depois**, exceto o `generatedAt` | guarde o JSON **antes** de mexer; compare campo a campo. **É o padrão que provou o W4** |
| **CA3** | `/api/clients` idêntico antes e depois | mesmo método |
| **CA4** | as telas que consomem as duas rotas vivas **continuam carregando** | abrir a aplicação |
| **CA5** | **zero referência** sobrando a `debugDatabase` e `getCampaignDetail` | `git grep` nos dois nomes → **vazio** |
| **CA6** | `/api/health` e `/api/phi-score-history` **continuam existindo**, **com o comentário do §2** | ler o arquivo |
| **CA7** | **nada deixado pendurado** (**R12**) | `git status` limpo; nenhuma alteração só local |
| **CA8** | a mensagem de commit diz **o que saiu e por quê** (**R5**) | ler o commit |
| **CA9** | **duas linhas no Ledger**: abertura e encerramento (**R3**) | ver a DB |
| **CA10** | `webview/CLAUDE.md` §2 e o `CHECKLIST` **atualizados na mesma sessão** (**R2**) | o commit no repo `phi` |

---

## 5. Fora de escopo — não toque

**`.env` no `.gitignore`** · **lockfile / `npm ci` / as 12 vulnerabilidades** · **apagar a pasta
`webview/`** · **a árvore `supabase/`** · **`/sites`, o banner de erro, o join, `strictNullChecks`** ·
**o gráfico "Evolução do Score"**.

> Cada um desses tem autorização e dono próprios. **Este brief é uma coisa só:** duas rotas e duas
> funções órfãs. **Lote pequeno é o que permite provar que nada mais mudou** — e é o CA2 que prova.

---

## 6. O relatório de volta

1. **o que apagou**, com as linhas e o diff
2. **CA1 a CA10**, um por um, com a prova colada — e **o que ficou vermelho, vermelho**
3. **como esta aplicação publica** (o que você descobriu no EasyPanel)
4. **o rollback**: `c37d0b0`, e o commit novo
5. 🔴 **o que você mediu e contradiz este brief.** O chat-mãe mediu em 03/10; **se o artefato
   discordar, o artefato vence** (**R6**) — e **diga, não conserte em silêncio**
