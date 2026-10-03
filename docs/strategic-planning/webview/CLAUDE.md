# Webview — a tela do PHI

> Leia **PRIMEIRO** o [`CLAUDE.md` da raiz](../../../CLAUDE.md) — as regras **R1–R15** valem aqui também.
> Esta frente é dona de: **o que está no ar na tela**, as rotas do backend, as dívidas declaradas e
> as decisões do Olavo de 02/10 sobre segurança, faxina e o join.
> Verificado em **2026-10-03**, pelo **sub-chat da Fase 1 da memória compartilhada**, contra o
> `CHECKLIST-webview.md`, o `2026-10-02-webview-os-6-passos-decisao-do-olavo.md`, o
> `BASE-02-SUPERFICIES.md` §4/§5 e **a árvore do repositório**.

| | |
|---|---|
| **Por que este arquivo existe** | o que se aprendeu em 02/10 estava espalhado em **três documentos e um handoff**, e o `CHECKLIST` passou três semanas vivendo **só** numa branch que ninguém abria. **Ilha é onde o conhecimento morre** |
| 🔴 **O que esta frente NÃO faz** | **exibe, não escreve.** O score é fato (**ADR-003**): a tela **não recalcula** |
| **Quem também manda aqui** | [`BASE-02-SUPERFICIES.md`](../../base/BASE-02-SUPERFICIES.md) §4 (o que está no ar) e §5 (o que está morto) |

---

## 1. O que está no ar, medido

| | |
|---|---|
| **URL** | `https://app-app.1unqx7.easypanel.host/` |
| **HEAD / rollback** | `c37d0b0c9dcd169609eff4060b04fa72a37de8be` |
| **Deploy** | **EasyPanel**, com o `Dockerfile` **da raiz** e contexto `/` |
| 🔴 **Repositório do código** | **`olavofranzin/phi-dashboard-webview`**, branch `webview` — ⚠️ **NÃO é este repo.** Este guarda o `CHECKLIST`, os ADRs e os briefs |
| 🔴 **O arquivo vivo** | **`server/notion.js` na RAIZ daquele repo** — **não** `webview/server/notion.js`. A pasta `webview/` é **resíduo morto** |
| **Fonte do dado** | BigQuery (`phi_score_current`, `raw_campaign_data`) + Notion (DB `Clientes`) |

> 🟢 **Um achado desta fase que se desfez no mesmo dia — e por isso fica escrito.** O sub-chat da
> Fase 1 mediu com `git ls-tree` que **não existe `server/` na raiz de nenhuma branch de
> `olavofranzin/phi`** (conferiu três) e concluiu que *“o código que está no ar não está em git”*,
> classificando-o como **`R13` no nível do repositório**.
>
> **O chat-mãe mediu no repositório certo, em 03/10, e o alarme caiu:**
>
> | | |
> |---|---|
> | **Repositório do código vivo** | 🟢 **`olavofranzin/phi-dashboard-webview`** — branch `webview` |
> | **`server/` na raiz dele** | 🟢 **existe**: `index.js` · `notion.js` · `package.json` · `package-lock.json` |
> | **o rollback `c37d0b0…`** | 🟢 **é commit de verdade lá** |
> | **quem já nomeava o repo** | 🟢 **o `BASE-02` §4**, no arquivo que o próprio sub-chat estava editando |
>
> 🔴 **A lição é a R6 no lado da GRAVIDADE:** o **fato** estava medido; a **conclusão** e a
> **urgência** foram acrescentadas. **O rollback é acionável, e revisar este código é revisar o que
> está em produção.**
>
> ⚠️ **O que sobra de dívida real:** são **dois repositórios** — o código num, o `CHECKLIST` e os ADRs
> no outro — e **nenhuma das duas pontas declara a outra no lugar onde se trabalha.** É isso que
> precisa de conserto, não o código "perdido".

---

## 2. 🔴 As decisões do Olavo em 02/10 — e o que continua aberto

| # | Passo | Natureza | Estado |
|---|---|---|---|
| **1** | apagar rotas sem consumidor | subtração | 🟢 **parcialmente liberado**: `/api/notion-debug` (era CRITICAL — lia **qualquer** base do Notion) e `/api/campaign-detail`. ⏸️ **retidos:** `/api/health` e `/api/phi-score-history` |
| **2** | tirar a tela `/sites` | subtração | 🟢 recomendado — *“a única tela 100% ficção”*. **Tela vazia informa; tela que inventa desinforma com confiança** |
| **3** | **autenticação** | configuração | 🔴 **o de maior retorno.** Hoje **quem souber o endereço lê a carteira de clientes inteira** — nomes, endereços, sites, scores e investimentos. Recomendado **no EasyPanel, não em código**: protege **as 6 rotas**, não 2 |
| **4** | banner de erro | honestidade | parar de apresentar falha como boa notícia |
| **5** | 🔴 **conserto do join por `client_id`** | construção | **a função central do produto.** Dois agentes apontaram independentemente. **Não sai sem o teste** (uma página do Notion + uma linha do BigQuery do mesmo cliente, afirmando que casam) |
| **6** | ligar `strictNullChecks` | construção | 🟡 **medir antes de decidir.** Hoje `strict: false`. Recomendado: ligar, rodar `tsc --noEmit`, **contar** os erros, **não consertar nada**, devolver o número |

> 🔴 **O join é a MESMA doença do Agregador, e é por isso que ele é o passo 5 e não o 6.** Lá a
> identidade era casada por **posição no array**; aqui por **chave coagível** (`client_id` com zero à
> esquerda deixa de casar). **Duas frentes, mesma semana, mesmo padrão** — virou a **R14**. História
> em [`BASE-04-INCIDENTES.md`](../../base/BASE-04-INCIDENTES.md#6-D6-identidade-por-posicao).
>
> ⚠️ **E o conserto tem risco próprio:** depois dele a tela mostra **pareamentos diferentes** — e
> quem decidiu algo olhando a tela de hoje decidiu sobre pareamento possivelmente errado.
> **Publicação própria, para o rollback ser limpo.**

### 2.1. ✅ O Supabase fechou — e fechou duas coisas

> **Olavo, verbatim, 2026-10-02:** *“o projeto no supabase não tem referência com o phi dashboard
> webview”*. **Ele olhou na conta dele, que é o único lugar onde essa pergunta se responde.**

| # | O que fecha | Consequência |
|---|---|---|
| **1** | não há projeto vivo atrás da chave `anon` | logo **as Edge Functions não podem estar publicadas**, e **não há `GCP_SA_KEY` em segredo nenhum** |
| **2** | **a autenticação volta a ser SUFICIENTE** | o chat-mãe havia escrito que ela *“trancaria só uma das duas portas”*. **Não há segunda porta** |

**Vai embora como código morto puro:** `supabase/config.toml` · `supabase/functions/` (as 2 funções +
`_shared/bq.ts` e `_shared/columnMap.ts`) · `src/integrations/supabase/client.ts` · as 3 chaves
`VITE_SUPABASE_*`.

> 🔴 **A `R5` vale para o que sobrar:** registre que foram apagadas **porque o `server/index.js` as
> substituiu**, e que **a verificação de projeto vivo foi feita pelo Olavo em 02/10**. Senão a próxima
> auditoria acha as funções no histórico e **abre a mesma investigação de novo.**

---

## 3. As dívidas declaradas — fora de escopo **por decisão do Olavo**, não por esquecimento

| Dívida | Medida |
|---|---|
| **lockfile não reproduzível** | o `package-lock.json` **não fecha** com o `package.json`, e o `Dockerfile` usa `npm install`, **não `npm ci`** |
| **vulnerabilidades** | **12**, pré-existentes, **10 altas** |
| **`.env` versionado** | 🔴 **e a gravidade foi medida, não herdada:** são **três chaves `VITE_*`, públicas por construção, em repo privado, sem `NOTION_TOKEN`.** **Nada a rotacionar.** O `NOTION_TOKEN` mora **só no `.env` da VPS** |
| **a pasta `webview/`** | resíduo morto, sai na faxina |

> 🔴 **Por que o `.env` está escrito assim, com o número:** em 02/10 o chat-mãe apresentou este item
> como *“das urgentes”* e *“pode ser credencial exposta”* **sem medir** — e mandou trabalho ao Olavo
> em cima disso. **O custo de medir eram dois comandos.** História em
> [`BASE-04-INCIDENTES.md`](../../base/BASE-04-INCIDENTES.md#4-D4-numero-e-gravidade-herdados).

### 3.1. 🔴 O que NÃO fechou, e não deve ser fechado por eliminação

A linha do plano no Notion *“Rotação de credenciais expostas — não confirmado”* **continua de pé, e
agora sem candidato.** O chat-mãe apontou dois (o `.env` versionado e o `GCP_SA_KEY` nas Edge
Functions) e **os dois caíram**.

> **“Então eu não sei a que aquela linha se refere”** — e *“não sei”* é a resposta honesta, não
> *“então não é nada”*. ⬜ **Precisa de investigação própria, com quem a escreveu.**

---

## 4. 🔴 O `W5` e o gráfico que deixou de existir

| | |
|---|---|
| **O que o `CHECKLIST` diz** | `W5` **CONCLUÍDO**, com *“tendência real (gráfico Evolução do Score ligado a `/api/phi-score-history`)”* |
| 🔴 **O que foi medido em 02/10** | o gráfico **parou de existir sem ninguém ver**. Decisão do Olavo: `/api/phi-score-history` **não se apaga** — fica, e **religar o gráfico vira tarefa de construção** |
| **Por que é incidente, não só tarefa** | *“declarado entregue, verde, ausente”* — é o **M10 no nível de funcionalidade** |
| **O que teria pego** | **um teste que afirme que o gráfico renderiza. Não existe.** Entra na lista de testes do passo 5 |

> ⚠️ **E o `CHECKLIST-webview.md` ainda não foi corrigido** — medido em 03/10, ele continua
> descrevendo o W5 como concluído **com** o gráfico. **É a R2 regra 5 acontecendo agora, neste
> arquivo:** o corpo do documento narra, e o checklist no topo mente. **Não corrigi o `CHECKLIST`
> nesta fase** porque a Fase 1 não mexe em artefato de outra frente sem pedido — ⬜ **fica
> registrado como dívida, e aqui está o aviso que faltava.**
