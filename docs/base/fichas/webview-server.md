# Ficha — o servidor do webview (`server/index.js` · `server/notion.js`)

| | |
|---|---|
| **Tipo** | servidor Node, no ar via **EasyPanel** (Dockerfile) · `https://app-app.1unqx7.easypanel.host/` |
| **Verificado em** | 2026-10-03, pelo **sub-chat da Fase 1**, **contra** `CHECKLIST-webview.md`, `docs/handoff/2026-10-02-webview-os-6-passos-decisao-do-olavo.md`, `BASE-02-SUPERFICIES.md` §4/§5 e 🔴 **`git ls-tree` em 3 branches** |
| 🔴 **O que a verificação ACHOU, e é o item mais importante desta ficha** | ver *“o achado”* abaixo |

## O que faz
Backend do webview. Autentica na service account, **lê `phi_score_current` e `raw_campaign_data` do
BigQuery** e **a DB `Clientes` do Notion**, deriva KPIs (CPA/CTR/ROAS a partir de
cost/clicks/impressions/conversions/revenue) com os **guardrails aplicados**, e serve **6 rotas**
(`/api/phi-snapshot`, `/api/clients`, `/api/phi-score-history`, `/api/health`, e as órfãs
`/api/notion-debug` e `/api/campaign-detail`).

🔴 **Exibe, não escreve. O score é fato — não recalcula** (**ADR-003**).

## 🔴 Por que existe
🟡 **Parcialmente sourced.** O que está escrito: ele é o **W3** do plano do webview (*“Backend
BigQuery, CONCLUÍDO e VALIDADO em prod”*, **ADR-002**) e o **W4** (*“Backend Notion, publicado em
02/10”*), e existe para que **o dossiê do cliente deixasse de ser mock**.

🟢 **E o “por que existe” tem uma metade bem documentada: ele substituiu as Edge Functions do
Supabase** — ver abaixo.

⬜ **O que NÃO achei:** por que a arquitetura saiu do Supabase para um servidor Node no EasyPanel.
**Há indício** (o commit anterior ao publicado chama-se *“Removed supabase…”*), **mas indício não é
fonte. ⬜ a perguntar ao Olavo. Não deduzo.**

## O que substituiu, e por quê
| | |
|---|---|
| 🟢 **substituiu** | as **Edge Functions do Supabase** — `supabase/functions/phi-snapshot/index.ts` e `phi-score-history/index.ts` têm **exatamente os nomes das rotas vivas**, e `_shared/bq.ts` **falava com o BigQuery**. **Era a arquitetura anterior, não andaime** |
| **a prova de que a anterior está morta** | **Olavo, verbatim, 02/10:** *“o projeto no supabase não tem referência com o phi dashboard webview”* — **ele olhou na conta dele, que é o único lugar onde essa pergunta se responde** |
| **por quê** | ⬜ **a perguntar ao Olavo** |
| 🔴 **e a R5 manda registrar isto** | *“registre que foram apagadas **porque o `server/index.js` as substituiu**”* — **senão a próxima auditoria acha as funções no histórico e abre a mesma investigação.** **Esta ficha é esse registro.** |

## Quem escreve / quem lê
| | |
|---|---|
| **lê** | BigQuery (`phi_score_current`, `raw_campaign_data`, `phi_score_history`) · Notion (DB `Clientes`) |
| **escreve** | 🟢 **nada.** View-only por guardrail |
| **lido por** | o front (`usePhiData`, `useClientData`) — e 🔴 **por qualquer pessoa que souber o endereço**, porque **não há autenticação** |

## O que acontece quando a fonte falta
| | |
|---|---|
| **campo vazio na fonte** | 🟢 **`N/D` honesto** — e **está certo**: medido, **o melhor cliente tem 3 de 41 campos preenchidos**, e nenhum dos 11 tem nada em Marca, Comunicação, Mercado, Comercial, Arquivos, Branding ou Metas. **É vazio real da fonte** |
| **arquivo hospedado pelo Notion** | o `readProp` **caía em `null` em silêncio** para `Documentos Legais` — **consertado no W4** |
| 🔴 **erro** | *“apresenta falha como boa notícia”* — o **passo 4** (banner de erro) existe por isso, e **não foi feito** |
| 🔴 **nulo onde o tipo diz `string`** | **é a causa raiz do bug do 1970:** `strict: false`, `strictNullChecks: false`. **O `tsc --noEmit` passar limpo não prova nada sobre nulos** |

## A prova, com número
| | |
|---|---|
| **no ar** | HEAD/rollback **`c37d0b0c9dcd169609eff4060b04fa72a37de8be`** |
| **`CA1`** | `GET /api/clients` devolve o **KIL real** (`site` + `endereco` preenchidos, `telefone` `N/D`, **que é o correto na fonte**) |
| **`CA4`** | telefone **0 → 6 de 11** (CLI-2, 3, 5, 7, 8, 13) |
| **`CA10`** | `/api/phi-snapshot` **igual antes e depois** — 2 campanhas, mesmos ids, scores, investimentos, tarefas, logs e alertas; **só o `generatedAt` mudou** |
| **o dossiê** | **41 chaves, 41 com fonte**, em 9 seções |
| **validação do W3** | KIL `GADS-21149189736`, **score 59/WARNING confere** com o BigQuery |
| **dívidas, medidas** | **12 vulnerabilidades** (10 altas) · lockfile não fecha e o Dockerfile usa `npm install` · **3 chaves `VITE_*` no `.env` versionado, públicas por construção, nada a rotacionar** |

## 🔴 O achado: o código que está no ar não está em git (ou está onde eu não achei)
O `CHECKLIST-webview` afirma, em maiúsculas, que **o arquivo vivo é `server/notion.js` na RAIZ**, não
`webview/server/notion.js`, e que a pasta `webview/` é resíduo morto.

**Medido em 03/10 com `git ls-tree`:**

| Branch | Existe `server/` na raiz? |
|---|---|
| `claude/consolidacao-2026-08` | 🔴 **não** |
| `main` | 🔴 **não** |
| `claude/webview-metricas-clientes-lxps0l` | 🔴 **não** — só **`webview/server/`**, a pasta que o `CHECKLIST` chama de morta |

> 🔴 **Conclusão honesta: não achei, em nenhuma branch deste repositório, o arquivo que está no ar.**
> **⬜ a perguntar ao Olavo.** Pode ser outro repositório, pode ser deploy direto no EasyPanel, pode
> ser commit que não subiu. **Não deduzo qual.**
>
> **E isto é mais grave que dívida de limpeza: é a `R13` no nível do repositório.** *“Leia o que está
> no ar, não o que está na tela”* — e aqui **nem a tela tem o código.** Enquanto isso valer, **o
> rollback citado (`c37d0b0…`) pode não ser acionável a partir deste repositório**, e **nenhuma
> revisão de código do webview pode ser considerada revisão do que está em produção.**

## ⬜ O que falta perguntar
| # | |
|---|---|
| **1** | 🔴 **Onde mora o código que está no ar?** É a pergunta de maior consequência das 7 fichas |
| **2** | **Por que a arquitetura saiu do Supabase para Node/EasyPanel?** |
| **3** | 🔴 **A linha *“Rotação de credenciais expostas — não confirmado”*** do plano no Notion: o chat-mãe apontou dois candidatos e **os dois caíram**. *“Então eu não sei a que aquela linha se refere”* — **e não deve ser cancelada por eliminação de candidatos** |
