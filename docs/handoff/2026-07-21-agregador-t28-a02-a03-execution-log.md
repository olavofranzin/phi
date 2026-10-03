# [EXECUTION-LOG Claude] Agregador T28 — a02 (ctx-por-campanha) + a03 (resolução de client_id) — PUBLICADO

> **Data:** 2026-07-21. **Executor:** Claude (orquestrador), branch `claude/agentic-agency-planning-KwJEw`.
> **Workflow:** `PHI — Agregador de Métricas Multi-fonte` (`4sdG2UKMCBuFq8xn`).
> **Resultado:** re-smoke **PASSOU** (C2 decisivo). v3 (`f4d4283e`) **publicado em produção**.
> **Origem:** despacho do brief a02 (`docs/handoff/2026-07-03-agregador-t28-fix-a02-codex-brief.md`, na branch
> `claude/saude-digital-phi-midia-score-0ko12c`), que estava pronto porém **nunca executado**.

## 1. O que foi feito (nesta passada)

### 1.1 Limpeza pré-smoke (5 linhas-lixo do a01)
`DELETE FROM \`phi_prod.t28_campaign\` WHERE execution_id = 'EXEC-T28-13697'` — confirmado **5 → 0**
(COUNT antes = 5, depois = 0). Eram as linhas com `client_id` NULL do smoke a01 que falhou.

### 1.2 Edições a02 (brief original — 3 nós do DRAFT)
1. **`[T28] BQ Read raw_campaign_data`** — removido o filtro `campaign_id` (voltou a ler o cliente inteiro).
2. **`Adaptador Input T28`** — âncoras revertidas para `Set dados`/`Get database *` (fim do `nodeFirst('Loop')`
   do a01); **`campCtxMap`** keyed por `id_google_camp`; `googleCampaigns` monta contexto por campanha via mapa.
3. **`Normalizador T28`** — `objetivo/modelo_negocio/metrica_mae/meta_metrica_mae/landing_page` passam a vir
   por campanha (`c.*`) com fallback ao `ctx`.

### 1.3 Extensão a03 (fix de resolução de `client_id` — fora do escopo do a02, autorizado pelo Olavo)
O re-smoke inicial (exec 19738) expôs a causa-raiz: no **branch "done" do Loop**, `$('Set dados').item` é
**ambíguo** e resolvia para o **item errado** (`CLI-13`, um cliente **só-Meta** sem linhas em
`raw_campaign_data`) → BQ Read retornava **zero linhas** → Adaptador/Normalizador **puldados** (0 itens a
montante). Mesma família do bug do a01 (`.item`/`.first()` posicional em cadeia one-shot), num parâmetro que
o a02 mandava não tocar.

**Correção (mesma filosofia: fontes estáveis, nunca `.item` posicional):**
1. **`[T28] BQ Read`** — filtro por **data apenas** (`WHERE date BETWEEN @start_date AND @end_date`), sem
   `client_id`. Lê todos os clientes da janela; cada linha carrega seu próprio `client_id`. (Descartada a
   variante com `IN (...)` via expressão inline `{{ }}` — sem prefixo `=` o n8n não avalia; date-only é
   robusto e não depende de expressão.)
2. **`Adaptador`** — cada campanha em `googleCampaigns` carrega `client_id: r.client_id` (da linha do BQ).
3. **`Normalizador`** — `t28_campaign.client_id` vem por-linha (`c.client_id`); as demais tabelas usam um
   **cliente primário derivado do raw** (`rawPrimaryClient`) em vez do `ctx` ambíguo.

## 2. Validação (C2 decisivo — PASSOU)

Re-smoke: execução manual **19981** = `success` (rodou o DRAFT v3 em modo manual, sem publicar). Saída do
`Normalizador T28` (pré-MERGE) + `success` de ponta a ponta (nós BQ Merge gravaram):

| Campanha | client_id | meta_metrica_mae | landing_page | linhas |
|---|---|---|---|---|
| Salão `GADS-21116045403` | **CLI-4** | **3.5** | (própria: null) | 5 |
| Barbearia `GADS-21149189736` | **CLI-4** | **5.2** | `lp-corte-barba` | 5 |

- ✅ `client_id = 'CLI-4'` em **todas** as 13 linhas de saída (0 NULL) — bug do client_id resolvido.
- ✅ **Salão ≠ Barbearia** (3.5 × 5.2) — contexto por campanha correto, **sem contaminação** (Salão não herda
  mais 5.2/`lp-corte-barba` da Barbearia). Critério C2 decisivo do brief.
- Janela do run: D-7 → 07-16 a 07-20 (5 dias × 2 campanhas = 10 linhas `t28_campaign`).
- As linhas `EXEC-T28-19981` são **dados válidos e idempotentes** (MERGE keyed por client_id+campaign+date+
  janela) — o run agendado real casa/sobrescreve as mesmas chaves; **não** precisam de limpeza.

## 3. Publicação (produção)

- Publicado **v3 `f4d4283e`** como `activeVersionId` (`publish_workflow`). Confirmado `versionId` =
  `activeVersionId` = `f4d4283e`, `active: true`.
- Workflow temporário de queries (`lkn4IYfeX68yBOXB`) **arquivado**.

## 4. Incidente de versionamento (registrar)

Durante o trabalho, o `activeVersionId` migrou de `a46d5a6a` (produção original, pré-a01) para `ceec3154`
(a02) — provavelmente por uma ação pontual na UI, **não** pelo "Test workflow" (o run 19981 provou que testar
NÃO publica). Ao tentar restaurar a `a46d5a6a`, o n8n retornou **"Version not found"**: o histórico retém só
~7 versões recentes e a **original saiu do histórico** (irrecuperável). Como o destino final era o v3 validado
mesmo, seguimos: validamos o v3 e publicamos. **Lição:** este n8n não é fonte confiável de rollback de longo
prazo — versões-âncora importantes devem ser snapshotadas fora (git/export) se precisarem sobreviver.

## 5. Limitação conhecida remanescente (candidata a a04)

O branch "done" do Loop é **single-context** para as fontes de enriquecimento: `t28_adset`, `t28_ga4_landing`,
`t28_gbp_daily`, `t28_clarity_daily`, `t28_meta_campaign` leem via `nodeFirst(...)` (primeiro item) e usam o
`rawPrimaryClient`. **Hoje está correto** porque só **um** cliente (CLI-4) tem dados Google/GA4/GBP/Clarity
(CLI-13 é só-Meta e nem aparece no BQ read). Quando um **2º cliente Google-ativo** for onboardado, o
enriquecimento não-campaign será atribuído só ao cliente primário — precisará de iteração por-cliente da
cadeia T28 (ou done-branch por cliente). `t28_campaign` **já** é multi-cliente correto (client_id por-linha).

## 6. Âncoras
- Workflow: `4sdG2UKMCBuFq8xn` · versão publicada `f4d4283e` · ativo pré-trabalho (perdido) `a46d5a6a`.
- Brief a02: `docs/handoff/2026-07-03-agregador-t28-fix-a02-codex-brief.md` (branch `…saude-digital-phi-midia-score-0ko12c`).
- Consolidação a01: `docs/handoff/2026-07-03-agregador-t28-smoke-a01-consolidacao-claude.md` (mesma branch).
- Tabelas: `phi_prod.t28_campaign` (+ `t28_adset`/`t28_ga4_landing`/`t28_gbp_daily`/`t28_clarity_daily`/`t28_meta_campaign`).
