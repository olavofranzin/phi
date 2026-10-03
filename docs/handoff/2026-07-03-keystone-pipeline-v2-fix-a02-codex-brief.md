# [BRIEF Codex a02] Keystone Pipeline_v2 — desbloqueio dos gates do a01

> **Entrada:** report `2026-07-03-keystone-pipeline-v2-fix-codex-report.md` (gate PASS — parada correta).
> **Este a02 SUBSTITUI as Fases 0/1 do brief a01** (`2026-07-03-keystone-pipeline-v2-fix-codex-brief.md`)
> **e ADICIONA a Fase 1.5 (DDL) e um item na Fase 2.** As Fases 2 (MERGE), 3 e 4 do a01 permanecem
> válidas como escritas, com os ajustes marcados abaixo. Guardrails inalterados (draft-only, read-back,
> publish só com OK do Olavo).
> **Consolidação Claude dos achados do a01:** os 4 gates eram legítimos; nenhum era falso-positivo.

---

## Fase 0 (revisada)

**0.1 CLI-5 inativo — DML direto e registrado** (o sync `SI5NSzRb` escreve em `phi_dev` e descarta
inativos — não serve; bugs do sync viram pendência própria, NÃO corrigir neste lote):

```sql
UPDATE `phi_prod.client_config`
SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP()
WHERE client_id = 'CLI-5';
```
(Executar também em `phi_dev.client_config` para coerência. Evidência: SELECT antes/depois.)

**0.2 Cobertura Daily Entry — reescopo com o novo achado:** as linhas `DAILY_ENTRY` de D-1 SÃO as
campanhas da CLI-4 (mesmos custos do GADS_INSERT), porém com **`client_id = ''`**. E o workflow
`Daily Entry` (`zGgIqiLlo5iAn8ud`) está `active=false` — então outro workflow grava com esse step
(provável cadeia `operador unico metricas` `cLcimNoefTOnVVbd` → `sw metricas campanhas`
`W571K320aqIHsdtH`, EXEC-DE-* ~07:00). **Tarefa (diagnóstico, sem fix):** identificar o nó writer
das linhas `DAILY_ENTRY` e ONDE o `client_id` se perde; reportar com o trecho do nó. O fix do
`client_id` vazio será um a03 cirúrgico — ele é o pré-requisito real da Fase 4.
**Nota:** o MERGE da Fase 2 é resiliente a isso hoje (o dedup particiona por `client_id`; as linhas
`''` caem fora no INNER JOIN com `client_config`) — o score volta via `GADS_INSERT` normalmente.

## Fase 1 (revisada) — `model_config` v1.2 com o schema REAL

Uma única query multi-statement (BQ scripting), nesta ordem:

```sql
INSERT INTO `phi_prod.model_config`
  (model_id, business_model, model_version, mas, tss, fis, es, rs, os,
   threshold, phi_threshold_min, phi_threshold_max, valid_from, valid_until, created_by, created_at)
SELECT
  model_id, business_model, 'v1.2', 0.34, 0.33, 0.33, 0.0, 0.0, 0.0,
  threshold, phi_threshold_min, phi_threshold_max,
  CURRENT_DATE('America/Sao_Paulo'), CAST(NULL AS DATE), 'keystone-fix-a02', CURRENT_TIMESTAMP()
FROM `phi_prod.model_config`
WHERE model_id = 'MODEL-VAREJO-001' AND model_version = 'v1.1' AND valid_until IS NULL;

UPDATE `phi_prod.model_config`
SET valid_until = CURRENT_DATE('America/Sao_Paulo')
WHERE model_id = 'MODEL-VAREJO-001' AND model_version = 'v1.1' AND valid_until IS NULL;
```

Pós-condição (evidenciar): exatamente 1 linha com `valid_until IS NULL` por model_id, e ela é a v1.2.
(INSERT herda `threshold/phi_threshold_min/phi_threshold_max` da v1.1 — sem inventar valores.)

## Fase 1.5 (NOVA) — DDL: permitir NULL nos componentes e no phi_value

Decisão de design (decorrência direta do INSUFFICIENT_DATA aprovado pelo Olavo; DDL é permissivo —
nenhum writer atual grava NULL, portanto zero risco de quebra retroativa):

```sql
ALTER TABLE `phi_prod.phi_score_history` ALTER COLUMN phi_value DROP NOT NULL;
ALTER TABLE `phi_prod.phi_score_history` ALTER COLUMN mas DROP NOT NULL;
ALTER TABLE `phi_prod.phi_score_history` ALTER COLUMN tss DROP NOT NULL;
ALTER TABLE `phi_prod.phi_score_history` ALTER COLUMN fis DROP NOT NULL;
ALTER TABLE `phi_prod.phi_score_history` ALTER COLUMN es DROP NOT NULL;
ALTER TABLE `phi_prod.phi_score_history` ALTER COLUMN rs DROP NOT NULL;
ALTER TABLE `phi_prod.phi_score_history` ALTER COLUMN os DROP NOT NULL;
```

Evidência: re-rodar o `INFORMATION_SCHEMA.COLUMNS` e colar no report. `threshold_used`,
`business_model`, `model_id/version`, `calculation_status` continuam NOT NULL — o MERGE do a01 sempre
os preenche (não alterar). A VIEW `phi_score_current` não é afetada.

## Fase 2 — como no a01, com 1 item adicional de higiene

- **2.4 (NOVO) `Log Notion Mapping Missing`:** o INSERT omite `is_reprocessing` (NOT NULL) e derruba a
  run DEPOIS do cálculo (erro real da execução `13614` de hoje). Adicionar `is_reprocessing`
  (valor `FALSE`) à lista de colunas/VALUES desse INSERT. Conferir se os demais Log de fase já o
  preenchem (os de RUNNING/SUCCESS preenchem — só este nó está incompleto).
- Lembrete do a01 §2.2: os `es/rs/os` do novo MERGE saem NULL — depende da Fase 1.5 aplicada ANTES.

## Fase 3 — inalterada (validação standalone → draft → read-back → report → pré-revisão Claude → OK Olavo → publish)

Acrescentar à validação standalone: 1 caso INSUFFICIENT_DATA forçado (ex.: rodar o SELECT interno com
um goal anulado via CTE de teste) provando `phi_value NULL + calculation_status='INSUFFICIENT_DATA'`
persistindo sem erro de NOT NULL.

## Fase 4 — permanece GATED (agora no fix do `client_id` vazio do writer DAILY_ENTRY, a03)

## Report

`docs/handoff/2026-07-03-keystone-pipeline-v2-fix-a02-codex-report.md` — commit + push na branch.
Evidências: DMLs com SELECT antes/depois, DDL com schema antes/depois, validação standalone (2 execuções
+ caso INSUFFICIENT), read-back byte a byte dos nós editados, versionIds antes/depois (publicar NÃO).
