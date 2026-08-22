# Plano W3 — Backend BigQuery (edge functions) para o Webview

- **Status:** Proposto (aguarda aprovação do Olavo antes de executar no Lovable)
- **Data:** 2026-08-22
- **Frente:** Webview · Lote 3
- **Regra de ouro:** o webview EXIBE. Segredos só no servidor. Score é fato
  (lê `phi_score_current`, nunca recalcula — ADR-003).

---

## 1. Ideia em uma frase

Hoje o webview lê dados de **mock**. No W3, trocamos a origem por **funções de
backend (edge functions do Supabase, que é o backend nativo do Lovable)** que
leem o **BigQuery** com segurança. O front continua igual — só muda de onde os
números vêm.

## 2. Por que backend (e não ler BigQuery direto do navegador)

- A chave da service account (`phi-workflow-sa`) **não pode** ir para o navegador
  — qualquer pessoa veria o segredo. Ela fica só no servidor (edge function).
- O navegador chama a edge function (sem segredo); a edge function chama o
  BigQuery com a chave e devolve só o resultado já tratado.

```
Navegador (React)  →  Edge Function (Supabase, tem o segredo)  →  BigQuery (phi_prod)
   usePhiData             valida + monta SQL + trata N/D            phi_score_current, etc.
```

## 3. O que cada tela precisa (mapa métrica → tabela)

| Tela / elemento | Fonte canônica (phi_prod) |
|---|---|
| Score + classificação da campanha | `phi_score_current` (VIEW) — **ler, nunca recalcular** |
| Tendência do score | `phi_score_history` |
| KPIs brutos (investimento, CPA, conversões, CTR, ROAS) | `raw_campaign_data` |
| Métricas por janela D-7 / D-30 | `t28_campaign` / `t28_meta_campaign` |
| Config e metas do cliente | `client_config` / `client_goal_history` |

## 4. Edge functions (API fina, uma por assunto)

Todas retornam **o mesmo formato (shape)** que o mock usa hoje, para o front
não mudar. Trocamos só o `queryFn` dentro de `usePhiData`/`useClientData`.

1. `phi-snapshot` → devolve `PhiSnapshot` (campanhas + score + KPIs + tendência).
   Lê `phi_score_current` + `raw_campaign_data` + `t28_*`.
2. `phi-score-history?campaign=<id>` → série do score (para o gráfico de tendência).
3. `client-config` → `client_config` + `client_goal_history` (metas do cliente).

> Observação: os dados de **Dossiê** (Notion Clientes) entram no **W4**. No W3,
> `useClientData` pode continuar no mock até o W4; o foco do W3 é a parte de
> **métricas** (BigQuery).

## 5. Como a edge function fala com o BigQuery (sem n8n)

1. A edge function lê o **segredo** (JSON da service account) de uma variável de
   ambiente do Supabase — nunca do código, nunca do client.
2. Gera um **token de acesso Google** assinando um JWT com a chave da SA
   (fluxo OAuth2 service account). Escopo: `bigquery.readonly`.
3. Chama a **API REST do BigQuery** (`jobs.query`) com o SQL, no projeto/dataset
   `phi_prod`.
4. Aplica os **guardrails de dado** antes de devolver:
   - `conversions = 0` ⇒ CPA/ROAS = **N/D** (não 0).
   - fonte com erro/ausente (`source_status` error/missing) ⇒ **N/D** (não 0).
   - score sempre vem de `phi_score_current` (fato).
5. Cache curto (ex.: `Cache-Control` 60–300s) + React Query `staleTime` 5min já
   existente. Evita estourar limites e deixa a tela rápida.

## 6. Segredos — o que fica onde

| Item | Onde | Quem coloca |
|---|---|---|
| JSON da service account `phi-workflow-sa` | Secret do Supabase (backend) | **Olavo** (passo a passo abaixo) |
| ID do projeto/dataset (`phi_prod`) | Variável de ambiente (não sensível) | Claude deixa pronto |
| Qualquer chave no navegador | **NUNCA** | — |

## 7. Passo a passo das credenciais (para o Olavo, quando aprovarmos)

> Só rodamos isto **depois** de você aprovar o plano. Guia resumido:

1. Você já tem a service account `phi-workflow-sa@phi-production-488720.iam.gserviceaccount.com`.
2. No Google Cloud → IAM → Service Accounts → `phi-workflow-sa` → **Keys** →
   *Add key* → *JSON*. Baixa o arquivo `.json` (guarde com cuidado — é segredo).
3. Garanta que a SA tem permissão de **leitura** no dataset `phi_prod`
   (papel `BigQuery Data Viewer` + `BigQuery Job User` no projeto).
4. No Lovable, habilitamos o backend (Supabase) e você cola o **conteúdo do JSON**
   como um *secret* (ex.: `GCP_SA_KEY`). Eu te mostro exatamente a tela e o nome
   da variável na hora. **O JSON nunca vai para o código nem para o navegador.**
5. Testamos uma edge function de leitura (um SELECT simples em `phi_score_current`)
   e confirmamos que o número aparece na tela. Se der erro, tratamos como N/D
   honesto (não quebra a tela).

## 8. Verificação (como saberemos que o W3 está certo)

- Uma campanha real de referência (KIL — `GADS-21149189736`) aparece no webview
  com o **mesmo score** que está em `phi_score_current` (comparar valor a valor).
- Campanha com `conversions = 0` mostra CPA/ROAS = **N/D** (não 0).
- Nenhum segredo aparece no bundle do navegador (inspeção do build).
- Overview e páginas de campanha continuam funcionando (sem regressão).

## 9. Custo / créditos

- Habilitar backend + criar as edge functions no Lovable **gasta créditos**
  (send_message). Só executamos com **OK de budget** do Olavo (guardrail §6).
- Este documento (planejamento) **não** gastou créditos.
