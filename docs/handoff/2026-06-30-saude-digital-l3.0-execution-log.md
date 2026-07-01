# L3.0 - Execution Log - Orquestrador de Analises

Data: 2026-06-30
Branch: claude/agentic-agency-planning-KwJEw
Brief: docs/handoff/2026-06-30-saude-digital-l3.0-codex-plumbing-brief.md

## Resultado

Foram criados dois workflows novos no n8n via MCP `create_workflow_from_code`.
Nenhum workflow foi publicado ou ativado. Nenhum smoke real foi executado.

Projeto n8n de destino:
- id: QAumYwlPGm37G3p1
- name: Olavo Franzin <olavofranzin@franzcomunicacao.com>
- type: personal

## Workflows

### WF-T28-Orquestrador-Analises

- workflowId: 8Q5ofmAZju0hTN08
- versionId: 796c86fa-8a59-4841-932e-71fc62af26ee
- active: false
- activeVersionId: null
- nodeCount: 11
- url: https://n8n-n8n-editor.1unqx7.easypanel.host/workflow/8Q5ofmAZju0hTN08

Nodes:
- Manual Trigger
- Schedule Trigger
- Set config
- Calc Window Dates
- BQ Read T28 Score
- Loop Campaigns
- Resolve Campaign Relation
- Resolve Client Relation
- Build Analysis Payload
- Execute Campaign Analysis
- Done

Configuracao inicial:
- BQ_DATASET: phi_dev
- SCORE_DATASET: phi_prod
- tenant_id: phi-agencia
- janela: D-7
- business_date: 2026-06-21

Credenciais auto-atribuidas:
- BQ Read T28 Score: Google BigQuery account / googleBigQueryOAuth2Api
- Resolve Campaign Relation: Notion account / notionApi
- Resolve Client Relation: Notion account / notionApi

Query BigQuery:

```sql
SELECT
  t.client_id, t.campaign_id, t.business_date, t.janela,
  t.campaign_name, t.data_inicio_campanha, t.objetivo, t.modelo_negocio,
  t.metrica_mae, t.meta_metrica_mae, t.margem_contribuicao_pct, t.ticket_ltv,
  t.landing_page, t.impressions, t.clicks, t.cost, t.conversions,
  t.conv_value, t.impression_share, t.budget_lost_is, t.cpm, t.cpc,
  t.ctr, t.cvr, t.cpa, t.cpl, t.roas, t.pct_brand_terms,
  t.pct_problem_solving_terms, t.pct_competitor_terms, t.pct_other_terms,
  t.volume_suficiente, TO_JSON_STRING(t.source_status) AS source_status,
  t.versao_contract_aplicada,
  s.phi_value, s.phi_classification, s.calculated_date,
  s.mas, s.tss, s.fis, s.es, s.rs, s.os, s.business_model, s.model_version
FROM `<BQ_DATASET>.t28_campaign` t
LEFT JOIN `<SCORE_DATASET>.phi_score_current` s
  ON t.client_id = s.client_id AND t.campaign_id = s.campaign_id
WHERE t.business_date = DATE('<business_date>')
  AND t.janela = '<janela>'
```

Notas:
- `operation=executeQuery`, `resource=database`, `useLegacySql=false`.
- O node usa `phi_dev.t28_campaign` no config de smoke e `phi_prod.phi_score_current` como score canonico.
- Relations Notion sao best-effort com `onError=continueRegularOutput` e `alwaysOutputData=true`.
- O payload emitido usa `EXEC-ORQ-SMOKE-<ts>-<rand>` no `execution_id`.

### WF-T28-Analise-Campaign

- workflowId: fhYmJH0o9BW1IO4i
- versionId: 3c5e1538-4b2c-4fa0-bf86-d2454b7e2a4d
- active: false
- activeVersionId: null
- nodeCount: 7
- url: https://n8n-n8n-editor.1unqx7.easypanel.host/workflow/fhYmJH0o9BW1IO4i

Nodes:
- Execute Workflow Trigger
- Build Deterministic Flags
- Build Notion Page
- Lookup Existing Analysis
- Has Existing Analysis
- Update Analysis Page
- Create Analysis Page

Credenciais auto-atribuidas na criacao:
- Lookup Existing Analysis: Notion account / notionApi
- Update Analysis Page: Notion account / notionApi
- Create Analysis Page: Notion account / notionApi

Upsert:
- Lookup em `PHI - ANALISES` (`38fb65e5-c72b-80db-a425-e5939fc35c7a`).
- Chave: `client_id`, `campaign_id`, `business_date`, `janela`, `nivel=campaign`.
- IF com `id` preenchido atualiza pagina; caso contrario cria pagina.

Regras deterministicas placeholder:
- Preserva flags de resolucao de relation vindas do orquestrador.
- `volume_insuficiente` quando `qualidade.volume_suficiente=false`.
- `score_indisponivel` quando `score.phi_value` esta ausente.
- `cpa_acima_meta` quando `metrica_mae=CPA` e `cpa > meta * 1.2`.
- `roas_abaixo_meta` quando `metrica_mae=ROAS` e `roas < meta`.
- `impression_share_baixo` quando `impression_share < 0.5`.
- `budget_lost` quando `budget_lost_is > 0.2`.
- `sem_conversao` quando `conversions=0` e `cost>0`.

## Validacao

- `validate_workflow` do subworkflow: valid=true, nodeCount=7.
- `validate_workflow` do orquestrador: valid=true, nodeCount=11.
- `get_workflow_details` confirmou `active=false` e `activeVersionId=null` nos dois workflows.

Avisos conhecidos:
- BigQuery: `validate_workflow` emitiu falso positivo para `sqlQuery` com `resource=database`, `operation=executeQuery`, `useLegacySql=false`. O node criado ficou com Standard SQL e SELECT read-only.
- Notion: o validador emitiu avisos de tipo em `relationValue` e `multiSelectValue` porque os campos recebem expressoes que resolvem arrays em runtime. O workflow foi aceito e criado em draft.

## Nao executado

- Smoke manual em `phi_dev`: nao executado.
- Re-run de idempotencia Notion: nao executado.
- Ativacao de schedule: nao executada.
- Qualquer execucao em `phi_prod` para T28: nao executada.

## Observacoes para pre-revisao

- Todos os nomes de nodes novos estao em ASCII.
- O orquestrador referencia o subworkflow por id `fhYmJH0o9BW1IO4i`.
- Lookup de cliente pode retornar vazio por diferenca de formato entre `t28.client_id` e o schema real da base de clientes; isso degrada para relation vazia e flag `cliente_nao_resolvido`.
- Se o smoke revelar que o titulo real da base `PHI - ANALISES` nao e exposto pelo n8n como `Name|title`, ajustar o key do update de titulo antes de publicar.

---

## Pre-revisao Claude + fixes aplicados (2026-06-30)

Pre-revisao do JSON real dos dois workflows (nao so do log). Arquitetura/encanamento
aprovados: loop splitInBatches bem cabeado, refs `.all()[0].json`, `executeOnce`,
draft, nomes ASCII, `onError:continue` nos lookups do orquestrador, BQ read-only +
JOIN cross-dataset, regras deterministicas de flags conferem com o brief.

### Blockers encontrados (todos no sub-WF WF-T28-Analise-Campaign) e CORRIGIDOS
Aplicados via `update_workflow` (setNodeParameter, mantem DRAFT). Novo
versionId: `5f63c883-c59a-4d19-9398-d46a3d6c48b3`. active=false preservado.

1. `Create Analysis Page` / `Update Analysis Page` — chaves de propriedade com
   tipo/nome errado (o DB real tem `cliente`/`campanha` minusculo, `janela`/`leitura`
   sao SELECT):
   - `Cliente|relation` -> `cliente|relation`
   - `Campanha|relation` -> `campanha|relation`
   - `janela|rich_text` -> `janela|select`
   - `leitura|rich_text` -> `leitura|select`
2. `Update Analysis Page` — titulo: `Name|title` -> `titulo|title`.
3. `Lookup Existing Analysis`:
   - `matchType` ausente => default `anyFilter` (OR) => upsert casava pagina errada
     (quebra idempotencia). Setado `allFilters` (AND).
   - filtro `janela|rich_text` -> `janela|select`.
4. `Build Notion Page` (qualidade): `phi_midia_score` agora vai `null` quando nao ha
   score (era `0`, parecia score real); `leitura` vai `null` quando sem
   classification (guard p/ select vazio).

### Follow-ups conhecidos (nao bloqueiam — confirmar no smoke)
- Resolucao de relations provavelmente volta vazia: `Resolve Client Relation` filtra
  `client_id|rich_text` em Clientes Database onde `client_id` e auto_increment; e ha
  duvida de formato `t28.campaign_id` vs `Campanhas.campaign_id`. Degrada (relation
  vazia + flag), por design. Confirmar formatos reais no smoke e ajustar o match.
- `leitura|select` com `|| null`: depende do nó Notion omitir select vazio. Em
  campanha com score (esperado no smoke) leitura vem preenchida.
- Filtro `business_date|date equals` na idempotencia: risco menor de timezone;
  validar no re-run.

### Avisos benignos do validador
`relationValue`/`multiSelectValue` "expected array, got string" — expressoes que
resolvem array em runtime (mesmo aviso do build original; aceito).

### Estado
Pronto para smoke real em phi_dev (Olavo). Criterios de aceite no brief §7.

---

## Smoke real phi_dev (2026-07-01) — PASS + idempotência provada

Disparado por Claude via MCP `execute_workflow` (executionMode `manual` — WFs em draft).

**Fix pré-smoke (bug pego pelo smoke):** run `13044` falhou no `BQ Read T28 Score`
com `invalid syntax`. Causa: `sqlQuery` estava como expressão n8n estilo
`={{ const c = ...; return "SELECT..." }}` — o motor de **expressão** do n8n não
aceita statements (`const`/`return`) no topo, só uma expressão. Corrigido via
`update_workflow` para template `=SELECT ... FROM \`{{ $('Calc Window Dates').all()[0].json.BQ_DATASET }}.t28_campaign\` ... WHERE business_date = DATE('{{ ...business_date }}') AND janela = '{{ ...janela }}'`
(interpolações `{{ }}` diretas). Também removido um assignment vazio do `Set config`.

**Run `13046` SUCCESS (~11.5s):**
- BQ Read: 2 campanhas (CLI-4 / `GADS-21116045403`, `GADS-21149189736`), D-7, 2026-06-21.
- **Score JOIN OK:** `phi_value=50.0`, `phi_classification=WARNING`,
  `calculated_date=2026-06-30`, componentes + `business_model=VAREJO_LOCAL`,
  `model_version=v1.1` vindos de `phi_prod.phi_score_current` (LEFT JOIN por
  client_id+campaign_id).
- **Relations:** `campanha` **RESOLVEU** (`29db65e5...`, `2a1b65e5...`); `cliente`
  vazio + flag `cliente_nao_resolvido` (esperado).
- **2 pages criadas** em `PHI - ANÁLISES` (`390b65e5...d28f`, `390b65e5...5553`) com
  todas as props (score 50, leitura WARNING, severidade atenção/crítico, flags,
  execution_id, tenant, campanha relacionada).

**Run `13054` SUCCESS — idempotência PROVADA:** mesmos 2 page IDs; `criado_em`
preservado (16:58, não 17:18); `execution_id` atualizado. Upsert por chave de
negócio (`matchType=allFilters` + `business_date|date equals`) casou → UPDATE, sem
duplicar. Count=2.

**Follow-ups (não bloqueiam o plumbing):**
1. **cliente relation:** `t28.client_id="CLI-4"` é sigla; `Clientes Database.client_id`
   é auto_increment INT → não casa. Filtrar por `Sigla Cliente`/`id_client` (a
   property que contém "CLI-4"). Confirmar a property numa linha real e ajustar o
   `Resolve Client Relation`.
2. **Bug no placeholder de flags:** helper `numeric(null)` retorna `0` (pois
   `Number(null)===0` é finito) → gera `impression_share_baixo` espúrio quando
   `impression_share=null`. Lógica de flags é placeholder (será reescrita no
   sub-chat do framework §4); guardar guard `value==null → null`.
3. `campaign_name` null no t28 → título usa `campaign_id` (Agregador não popula).

**Veredito: plumbing L3.0 VALIDADO.** Pipeline `t28 → score canônico →
relations → fan-out → sub-WF → page idempotente` funciona E2E em phi_dev.
Execuções sub-WF: `13047/13048` (run 2), `13055/13056` (run 3).
