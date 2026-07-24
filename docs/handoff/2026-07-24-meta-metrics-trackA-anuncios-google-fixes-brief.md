# [BRIEF · Track A] Anúncios — Correções do caminho Google (margem + dataset)

> **Executor:** rode **`/goal`** com este brief e siga estas regras (do Olavo):
> 1. **Antes de mudar algo grande, explique o plano e espere o Olavo aprovar.**
> 2. **Prefira a solução mais simples que resolve. Nada de complicar sem motivo.**
> 3. **Descreva como vai verificar se o resultado está correto.**

## Contexto (por que este trabalho existe)

O workflow keystone de métricas de anúncio (`sw metricas anuncios`) tem o caminho **Google já
rodando**, mas com **dois bugs reais** que contaminam o score/diagnóstico:
- O break-even ROAS está **travado em 0.30** (margem nunca é lida da fonte).
- O nó de BigQuery grava no dataset **errado** (`phi_dev`), enquanto o cérebro T28 lê `phi_prod` —
  então o nível anúncio nunca chega ao Módulo 28.

Track A conserta os dois. É smokável **agora** (Google roda em produção). Track B (Meta ad-level) é
um brief separado.

## Alvo

- **Workflow:** `sw metricas anuncios` — **`vVAdXAJh6MW2Z5Hp`**.
- **Estado atual:** `active=false`, draft `versionId=d5aa00f9-1ff4-44cc-8ad0-9c7ba075d0b2`,
  `activeVersionId=null` (nunca publicado). O draft é o "rico" (diagnóstico + BigQuery + 7d/30d).

## Disciplina de edição (obrigatória)

- Editar **via n8n MCP** (`update_workflow` / `updateNodeParameters`), **nunca** salvar pela UI do n8n
  (esta instância **corrompe não-ASCII → U+FFFD**).
- Após cada edição: **read-back byte-exato** do nó; rodar um scan de U+FFFD no workflow inteiro
  (contagem deve ser **0**).
- Fluxo: **draft → smoke → publicar**. **Publicar SÓ com o OK explícito do Olavo.**
- Prefixo do MCP n8n oscila (`mcp__3043b2bf-…__` ou `mcp__n8n__`) — recarregue via ToolSearch.
- `get_workflow_details` é grande e salva em arquivo → use jq/python (não leia o output direto).
- `execute_workflow`/trigger via MCP costuma bater em parede de aprovação (-32003) → smokes rodam
  pela UI ("Test workflow") e o Olavo cola o exec ID.

## A1 — Margem (destravar break-even ROAS)

**Diagnóstico confirmado:** `Code clean propriedades` **não seta** `clean_margem_contribuicao`,
`clean_modelo_negocio` nem `clean_objetivo` (grep = 0). O consumidor `Code calculo desvio meta` faz:
```js
const margem = Number(
  data.clean_margem_contribuicao ||
  MARGEM_PADRAO[data.clean_modelo_negocio] ||   // SaaS 0.80, Infoproduto 0.85, Serviços 0.50, ...
  MARGEM_PADRAO[data.clean_objetivo] ||
  MARGEM_FALLBACK                               // 0.30
);
```
Como os três primeiros nunca existem, cai **sempre** no 0.30 → break-even ROAS = 3.33.

**⛔ PORTÃO (regra 1) — confirmar com o Olavo ANTES de editar:** de onde vem a margem?
- Opção 1 (recomendada, mais simples): setar `clean_modelo_negocio` no `Code clean propriedades` a
  partir de uma prop Notion (ex.: `campanhaProps['Modelo de Negócio']`) e deixar o `MARGEM_PADRAO`
  existente resolver. **Não** cria campo de margem novo — reusa a tabela que já existe.
- Opção 2 (mais precisa): setar `clean_margem_contribuicao` direto de uma prop de margem por cliente.
- **Espelhar o Agregador:** o `PHI — Agregador de Métricas Multi-fonte` (`4sdG2UKMCBuFq8xn`) já
  preenche `modelo_negocio` + `margem_contribuicao_pct` no `t28_campaign`. Ler qual prop Notion ele
  usa e **usar a mesma fonte** (evita divergência). Confirme a prop com o Olavo antes de escrever.

**Edição:** apenas no `Code clean propriedades` — acrescentar a(s) chave(s) ao objeto `clean` usando os
helpers já existentes (`extractPlainText` / `extractNumber`). **Não** mudar o consumidor
(`Code calculo desvio meta` já lê o cascade corretamente).

## A2 — Dataset (`phi_dev` → `phi_prod`) e visibilidade do anúncio pro cérebro

**Diagnóstico confirmado:** `Code Montar SQL` monta `MERGE phi_dev.raw_ad_data AS target …`. O projeto
é `phi-production` (`project-0e7c58d4-656f-49e8-807`), mas o **dataset** é `phi_dev`. O nó
`BigQuery Série Diária` lê `phi_prod.raw_campaign_data` (dataset certo). A tabela ad-level já existe em
`phi_dev.raw_ad_data`.

**Edição mínima:** no `Code Montar SQL`, trocar `phi_dev.raw_ad_data` → **`phi_prod.raw_ad_data`**
(conferir que não há outra referência a `phi_dev` no nó). O nó `Execute SQL inserir daily entry` aponta
pro projeto certo; nada a mudar nele.

**Pré-requisito:** a tabela `phi_prod.raw_ad_data` **precisa existir**. Confirmar via `SELECT`; se não
existir, criar espelhando o schema de `phi_dev.raw_ad_data`:
`CREATE TABLE IF NOT EXISTS phi_prod.raw_ad_data LIKE phi_dev.raw_ad_data;`
Colunas esperadas: `execution_id, client_id, campaign_id, adset_id, ad_id, date, ad_name, ad_status,
impressions, clicks, cost, conversions, conv_value, cost_3d, conversions_3d, conv_value_3d, cost_7d,
conversions_7d, conv_value_7d, data_source, platform, ingestion_status, ingestion_step, ingested_at`.
> **⛔ Criar tabela em `phi_prod` é "algo grande" (regra 1): explique e espere aprovação antes.**

**⛔ PORTÃO — escopo do `t28_ad` (confirmar com o Olavo):** opção (a) completa = além de corrigir o
dataset, criar um MERGE **`t28_ad`** normalizado (espelho de como o Agregador constrói `t28_adset`)
para o Módulo 28 ler o nível anúncio. Se o Olavo aprovar só o dataset por ora, **deixar `t28_ad` para
depois** (não bloquear A2). Prefira a versão mínima que já destrava (dataset), a menos que ele peça o
`t28_ad` junto.

## Como verificar (regra 3)

1. **Bytes:** após cada edição, read-back byte-exato dos nós tocados; U+FFFD no workflow = **0**.
2. **Smoke (via UI, Olavo cola o exec ID):** rodar o WF contra um cliente Google real (PMAX). No exec:
   - **A1:** no output do `Code calculo desvio meta`, `break_even_roas` reflete a margem real
     (**≠ 3.33** fallback) — ex.: Serviços 0.50 → 2.0. Confirmar que `analise_desvios` usa a meta certa.
   - **A2:** o nó `Execute SQL inserir daily entry` conclui SUCCESS; então rodar no BigQuery
     `SELECT * FROM phi_prod.raw_ad_data WHERE client_id = '<cliente>' AND date = '<D-1>'` e confirmar
     que a linha chegou em **`phi_prod`** (não em `phi_dev`).
   - **Sem regressão:** o `Update a database page` (Notion) segue populando as props de sempre.
3. **Publicar** só depois do OK do Olavo. Registrar exec IDs + versão publicada num execution-log em
   `docs/handoff/` e no ledger.

## Âncoras

- WF: `vVAdXAJh6MW2Z5Hp` (draft `d5aa00f9-1ff4-44cc-8ad0-9c7ba075d0b2`).
- Nós: `Code clean propriedades` (A1) · `Code Montar SQL` + `Execute SQL inserir daily entry` (A2) ·
  consumidor `Code calculo desvio meta`.
- Referência margem/t28: Agregador `4sdG2UKMCBuFq8xn` (`t28_campaign.modelo_negocio` /
  `margem_contribuicao_pct`; padrão de MERGE `t28_adset`).
- BigQuery: projeto `phi-production` (`project-0e7c58d4-656f-49e8-807`); datasets `phi_dev` (errado) /
  `phi_prod` (certo); tabelas `raw_ad_data`, `raw_campaign_data`.
- Nota: **não** mover o dev-token do Google (n8n self-hosted não tem credencial pra isso — fica no nó).
