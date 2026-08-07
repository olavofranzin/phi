# [BRIEF Codex] Keystone — fix do PHI·Mídia Score (Pipeline_v2) + writer canônico

> **Decisões travadas (Olavo, 2026-07-03):** writer canônico = **Daily Entry**; join do score por
> **data de negócio** (fim do filtro por execution_id único); semântica **INSUFFICIENT_DATA**;
> **modelo v1.2 com es/rs/os peso 0**; **CPA-only formal** (CLI-5 está INATIVO — campanhas Meta dele
> viram fixture de teste futuro com datas pinadas); **fim do FALLBACK-***.
> **Evidência da regressão (Claude, 2026-07-03 ~21h UTC):** a rodada 07:00 de hoje (versão `4b723285`,
> publicada em 2026-07-02 17:19Z) escreveu **0 linhas** em `phi_score_history`, com o log registrando
> INGESTION/CALCULATION **SUCCESS** e sem fase OPERATIONAL. Produção está sem score novo desde ontem.
> **Contexto completo:** `docs/handoff/2026-07-02-saude-digital-phi-midia-score-analise-report.md`.
> **Workflow:** `PHI - Pipeline_v2` (`ITWG3Ge0asXtUM8U`). Trabalhar em DRAFT; publicar SÓ na Fase 3
> com OK explícito do Olavo. Read-back byte a byte após CADA update (nó grande já falhou silencioso).

---

## Fase 0 — Preparação e diagnóstico (read-only + 1 correção de config)

**0.1 CLI-5 inativo:** `client_config` no BQ ainda tem `CLI-5 is_active=true` (updated 2026-03-05).
Verificar se o Olavo já marcou INATIVO no Notion; rodar/verificar o workflow de sync do client_config
(`SI5NSzRb8lVUz74RwOhIT`); confirmar no BQ `is_active=false`. Se o sync não cobrir, reportar (não
fazer UPDATE manual sem registrar).

**0.2 Cobertura do Daily Entry (CRÍTICO):** o raw da CLI-4 hoje só tem linhas `GADS_INSERT`
(Subworkflow) — o Daily Entry NÃO escreve as 2 campanhas dela (evidência Q10 do report). Diagnosticar
no workflow Daily Entry (`zGgIqiLlo5iAn8ud`) POR QUE (filtro de campanhas? escopo de cliente?) e
reportar o achado ANTES de qualquer fix. **Gate:** a Fase 4 (desligar o writer GADS_INSERT) só pode
acontecer depois que o Daily Entry provar cobertura diária das campanhas ativas. Até lá, o score lê o
raw com dedup preferindo DAILY_ENTRY (Fase 2) — funciona com o que existe.

## Fase 1 — `model_config` v1.2 (DML via workflow temporário, padrão da casa)

```sql
UPDATE `phi_prod.model_config` SET valid_until = CURRENT_TIMESTAMP()
WHERE model_id = 'MODEL-VAREJO-001' AND model_version = 'v1.1' AND valid_until IS NULL;

INSERT INTO `phi_prod.model_config`
  (model_id, model_version, business_model, mas, tss, fis, es, rs, os, threshold, valid_until)
VALUES
  ('MODEL-VAREJO-001', 'v1.2', 'VAREJO_LOCAL', 0.34, 0.33, 0.33, 0.0, 0.0, 0.0, 0.75, NULL);
```
(Colunas conferidas na evidência Q2; se o schema real divergir, parar e reportar.)

## Fase 2 — Edições no DRAFT do Pipeline_v2

### 2.1 `Buscar ID de Sucesso Hoje` — mata o FALLBACK, vira gerador de run-id + sonda

```sql
SELECT
  CONCAT('EXEC-PHI-', FORMAT_TIMESTAMP('%Y%m%d%H%M%S', CURRENT_TIMESTAMP()), '-',
         SUBSTR(GENERATE_UUID(), 1, 8)) AS execution_id,
  (SELECT COUNT(*) FROM `phi_prod.raw_campaign_data`
   WHERE date = DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY)
     AND ingestion_status = 'SUCCESS') AS raw_d1_rows
```
Nos nós `Log CALCULATION RUNNING/SUCCESS`, incluir `raw_d1_rows` no campo de detalhes/mensagem (se
existir campo livre) — observabilidade de "quanto raw havia". (Melhoria futura: IF explícito
`raw_d1_rows=0 → CALCULATION FAILED`; NÃO adicionar o IF neste lote — mudança de topologia fica fora.)

### 2.2 `Calcular e Persistir PHI Score` — substituir o `sqlQuery` INTEIRO por:

```sql
MERGE `phi_prod.phi_score_history` AS target
USING (
  WITH raw_dedup AS (
    SELECT *, ROW_NUMBER() OVER (
      PARTITION BY client_id, campaign_id, date
      ORDER BY CASE WHEN ingestion_step = 'DAILY_ENTRY' THEN 0 ELSE 1 END
    ) AS rn
    FROM `phi_prod.raw_campaign_data`
    WHERE ingestion_status = 'SUCCESS'
      AND date BETWEEN DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 7 DAY)
                   AND DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY)
  ),
  janelas AS (
    SELECT
      client_id, campaign_id,
      DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY) AS reference_date,
      SUM(cost) AS cost_7d,
      SUM(conversions) AS conversions_7d,
      SUM(IF(date >= DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 3 DAY), cost, 0)) AS cost_3d,
      SUM(IF(date >= DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 3 DAY), conversions, 0)) AS conversions_3d,
      COUNT(DISTINCT date) AS dias_com_dado,
      MAX(IF(date = DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY), primary_metric_goal, NULL)) AS primary_metric_goal,
      MAX(IF(date = DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY), execution_id, NULL)) AS source_execution_id,
      MAX(IF(date = DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 1 DAY), 1, 0)) AS tem_d1
    FROM raw_dedup
    WHERE rn = 1
    GROUP BY client_id, campaign_id
  ),
  campanhas_exec AS (
    SELECT
      '{{ $("Buscar ID de Sucesso Hoje").first().json.execution_id }}' AS execution_id,
      j.*,
      CASE WHEN STARTS_WITH(j.campaign_id, 'GADS-') THEN 'GOOGLE ADS'
           WHEN STARTS_WITH(j.campaign_id, 'META-') THEN 'META ADS'
           ELSE 'UNKNOWN' END AS plataforma,
      cc.primary_metric_type,
      mc.model_id, mc.business_model, mc.model_version,
      mc.mas AS peso_mas, mc.tss AS peso_tss, mc.fis AS peso_fis,
      mc.es AS peso_es, mc.rs AS peso_rs, mc.os AS peso_os,
      mc.threshold AS threshold_used
    FROM janelas j
    INNER JOIN `phi_prod.client_config` cc ON j.client_id = cc.client_id AND cc.is_active = TRUE
    INNER JOIN `phi_prod.model_config`  mc ON cc.model_id = mc.model_id AND mc.valid_until IS NULL
    WHERE j.tem_d1 = 1
  ),
  qualidade AS (
    SELECT *,
      CASE
        WHEN primary_metric_type IS NULL OR primary_metric_type != 'CPA' THEN 'INSUFFICIENT_DATA'
        WHEN primary_metric_goal IS NULL OR primary_metric_goal <= 0 THEN 'INSUFFICIENT_DATA'
        WHEN cost_7d IS NULL OR cost_7d <= 0 THEN 'INSUFFICIENT_DATA'
        ELSE 'SUCCESS'
      END AS calculation_status,
      CASE
        WHEN primary_metric_type IS NULL OR primary_metric_type != 'CPA' THEN 'METRIC_TYPE_UNSUPPORTED'
        WHEN primary_metric_goal IS NULL OR primary_metric_goal <= 0 THEN 'NO_GOAL'
        WHEN cost_7d IS NULL OR cost_7d <= 0 THEN 'NO_SPEND_7D'
        ELSE 'CORE'
      END AS calculation_last_step
    FROM campanhas_exec
  ),
  portfolio_cost AS (
    SELECT client_id, SUM(cost_7d) AS total_cost_7d FROM qualidade GROUP BY client_id
  ),
  calc_components AS (
    SELECT q.*, pc.total_cost_7d,
      CASE WHEN q.calculation_status != 'SUCCESS' THEN NULL
           WHEN q.conversions_7d > 0
             THEN LEAST(100.0, GREATEST(0.0, (q.primary_metric_goal / (q.cost_7d / q.conversions_7d)) * 100.0))
           ELSE 0.0 END AS mas,
      CASE WHEN q.calculation_status != 'SUCCESS' THEN NULL
           WHEN q.conversions_7d > 0 AND q.conversions_3d > 0
             THEN LEAST(100.0, GREATEST(0.0,
               100.0 - ABS((q.cost_3d / q.conversions_3d) - (q.cost_7d / q.conversions_7d))
                       / (q.cost_7d / q.conversions_7d) * 100.0))
           ELSE NULL END AS tss,
      CASE WHEN q.calculation_status != 'SUCCESS' THEN NULL
           WHEN pc.total_cost_7d > 0
             THEN GREATEST(0.0, 100.0 - (q.cost_7d / pc.total_cost_7d * 100.0))
           ELSE NULL END AS fis,
      CAST(NULL AS FLOAT64) AS es, CAST(NULL AS FLOAT64) AS rs, CAST(NULL AS FLOAT64) AS os,
      CASE WHEN q.calculation_status = 'SUCCESS' AND q.conversions_7d > 0
             THEN (q.cost_7d / q.conversions_7d - q.primary_metric_goal) * q.conversions_7d
           ELSE 0.0 END AS miv
    FROM qualidade q
    INNER JOIN portfolio_cost pc ON q.client_id = pc.client_id
  ),
  calc_phi AS (
    SELECT *,
      CASE WHEN calculation_status = 'SUCCESS' THEN
        ROUND((
          COALESCE(mas,50.0)*peso_mas + COALESCE(tss,50.0)*peso_tss + COALESCE(fis,50.0)*peso_fis +
          COALESCE(es,50.0)*peso_es + COALESCE(rs,50.0)*peso_rs + COALESCE(os,50.0)*peso_os
        ) / NULLIF(peso_mas+peso_tss+peso_fis+peso_es+peso_rs+peso_os, 0), 2)
      ELSE NULL END AS phi_value_raw,
      CASE WHEN calculation_status = 'SUCCESS' AND total_cost_7d > 0 AND miv > 0
             THEN LEAST(100.0, GREATEST(0.0, miv / total_cost_7d * 100.0))
           ELSE 0.0 END AS miv_normalizado
    FROM calc_components
  )
  SELECT
    execution_id, source_execution_id, client_id, campaign_id,
    reference_date AS calculated_date,
    business_model, model_id, model_version,
    phi_value_raw AS phi_value,
    ROUND(mas,2) AS mas, ROUND(tss,2) AS tss, ROUND(fis,2) AS fis,
    es, rs, os, threshold_used,
    ROUND(miv,2) AS miv, ROUND(miv_normalizado,2) AS miv_normalizado,
    CASE WHEN phi_value_raw IS NOT NULL
         THEN ROUND((100.0 - phi_value_raw) * 0.60 + miv_normalizado * 0.40, 2) ELSE NULL END AS priority_score,
    CASE WHEN phi_value_raw IS NULL THEN 'INSUFFICIENT_DATA'
         WHEN phi_value_raw >= 80 THEN 'EXCELLENT'
         WHEN phi_value_raw >= 60 THEN 'GOOD'
         WHEN phi_value_raw >= 40 THEN 'WARNING'
         ELSE 'CRITICAL' END AS phi_classification,
    calculation_status, calculation_last_step,
    '7d' AS mas_janela,
    (calculation_status != 'SUCCESS') AS rs_data_insufficient,
    (calculation_status != 'SUCCESS') AS os_data_unavailable,
    plataforma, primary_metric_type, conversions_7d,
    CURRENT_TIMESTAMP() AS snapshot_timestamp,
    FALSE AS reprocessed, CAST(NULL AS TIMESTAMP) AS reprocessed_at, CAST(NULL AS STRING) AS reprocessed_by
  FROM calc_phi
) AS source
ON target.client_id = source.client_id
AND target.campaign_id = source.campaign_id
AND target.calculated_date = source.calculated_date
WHEN MATCHED AND target.reprocessed = FALSE THEN UPDATE SET
  execution_id = source.execution_id, source_execution_id = source.source_execution_id,
  business_model = source.business_model, model_id = source.model_id, model_version = source.model_version,
  phi_value = source.phi_value, mas = source.mas, tss = source.tss, fis = source.fis,
  es = source.es, rs = source.rs, os = source.os, threshold_used = source.threshold_used,
  miv = source.miv, miv_normalizado = source.miv_normalizado, priority_score = source.priority_score,
  phi_classification = source.phi_classification, calculation_status = source.calculation_status,
  calculation_last_step = source.calculation_last_step, mas_janela = source.mas_janela,
  rs_data_insufficient = source.rs_data_insufficient, os_data_unavailable = source.os_data_unavailable,
  snapshot_timestamp = source.snapshot_timestamp
WHEN NOT MATCHED THEN INSERT (
  execution_id, source_execution_id, client_id, campaign_id, calculated_date,
  business_model, model_id, model_version, phi_value, mas, tss, fis, es, rs, os, threshold_used,
  miv, miv_normalizado, priority_score, phi_classification, calculation_status, calculation_last_step,
  mas_janela, rs_data_insufficient, os_data_unavailable, snapshot_timestamp, reprocessed, reprocessed_at, reprocessed_by
) VALUES (
  source.execution_id, source.source_execution_id, source.client_id, source.campaign_id, source.calculated_date,
  source.business_model, source.model_id, source.model_version, source.phi_value, source.mas, source.tss,
  source.fis, source.es, source.rs, source.os, source.threshold_used, source.miv, source.miv_normalizado,
  source.priority_score, source.phi_classification, source.calculation_status, source.calculation_last_step,
  source.mas_janela, source.rs_data_insufficient, source.os_data_unavailable, source.snapshot_timestamp,
  source.reprocessed, source.reprocessed_at, source.reprocessed_by
);
```

Notas de design (não alterar sem reportar):
- **Janelas calculadas do raw diário** (padrão T28) — as colunas `cost_7d/3d` do raw deixam de ser lidas.
- Dedup prefere `DAILY_ENTRY`; hoje CLI-4 só tem `GADS_INSERT` (com custo/conversões diários reais) —
  o score volta a ter sinal SEM esperar a Fase 4.
- Pesos v1.2 (es/rs/os = 0) + divisão por soma dos pesos → phi = média de MAS/TSS/FIS. Os COALESCE(...,50)
  são inertes com peso 0 (defesa para pesos legados).
- `phi_value=NULL` + `phi_classification='INSUFFICIENT_DATA'` + flags verdadeiras quando sem meta/custo/
  tipo != CPA. **Verificar antes**: se `phi_classification` tiver constraint de valores, reportar; a VIEW
  `phi_score_current` filtra `calculation_status='SUCCESS'` e não é afetada.
- `tss` NULL (sem conv 3d) com status SUCCESS: phi vira média dos calculáveis via COALESCE 50 com peso
  cheio — LIMITAÇÃO ACEITA v1.2 (documentar no report; refinamento fica para v1.3).

### 2.3 Higiene no mesmo lote
- `Get All Current Scores (Sync)` e `Buscar Campanhas Alertas`: continuam filtrando por
  `execution_id = run id` — segue funcionando (o MERGE agora carimba esse id). Apenas conferir e reportar.
- FQN: remover project-id de dentro do SQL nos 2 nós (`Log INGESTION SUCCESS`, `Log CALCULATION SUCCESS`)
  → `phi_prod.tabela` (regra 1 CLAUDE.md). Mojibake: corrigir strings nos 3 nós afetados.

## Fase 3 — Validação e publicação (gates)

1. **Validação standalone do MERGE** (antes de tocar o draft): workflow temporário com o SQL acima e o
   template do execution_id substituído por literal `EXEC-PHI-SMOKE-<data>`. Executar 2× → evidência:
   linhas escritas para as 2 campanhas CLI-4 com `phi_value` real (≠50 constante), componentes coerentes
   (conferir CPA real vs goal 3.5/5.2), idempotência (2ª execução não duplica), e caso INSUFFICIENT
   (se houver campanha sem goal). Arquivar o temporário.
2. Aplicar 2.1/2.2/2.3 no DRAFT + read-back byte a byte de cada nó.
3. Report em `docs/handoff/2026-07-03-keystone-pipeline-v2-fix-codex-report.md` (commit + push) →
   **pré-revisão Claude → OK do Olavo → publish**. Monitorar a rodada 07:00 seguinte (linhas escritas > 0,
   distribuição descomprimida, fase OPERATIONAL de volta no log).

## Fase 4 — Desligar o writer GADS_INSERT (GATED — não executar neste lote)

Só após 0.2 provar cobertura do Daily Entry: desativar o MERGE de `raw_campaign_data` no
`PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`) preservando o restante da sua função. Brief próprio.

## Backfill (fora deste lote)

Após 3+ dias estáveis: recalcular history retroativo com o novo SQL (parametrizar a data), respeitando
`reprocessed=TRUE`; limpar a linha legada `'OK'`. Brief próprio com plano de lotes por data.
