# [CONSOLIDAÇÃO Claude] Keystone a02 — draft do Pipeline_v2 COMPLETO, aguardando OK para publicar

> **Data:** 2026-07-04 · **Entradas:** report Codex a02 (copiado para esta branch; original em
> `claude/agentic-agency-planning-KwJEw` commit `4b1a098`) + patch direto do Claude via MCP.
> **Estado:** draft `9a174e50-e98e-4e25-9fd5-9c7aac32a851` COMPLETO e verificado ·
> ativo segue `4b723285` (produção intocada, ainda com a regressão de 02/07).
> **DECISÃO PENDENTE DO OLAVO: publicar o draft.**

## 1. O que o Codex entregou (a02 — tudo com evidência no report dele)

- ✅ Fase 0.1: CLI-5 inativado em `phi_prod` e `phi_dev` (DML registrado).
- ✅ Fase 1: `model_config` v1.2 vigente (0.34/0.33/0.33/0/0/0), v1.1 fechada.
- ✅ Fase 1.5: DDL aplicado — `phi_value` e 6 componentes aceitam NULL.
- ✅ Fase 3 (standalone): **o novo MERGE funciona** — Salão `phi=57.93` (MAS 79.32, TSS 93.57),
  Barbearia `phi=49.42` (MAS 0 — zero conversões na janela, sinal real), es/rs/os NULL,
  caso INSUFFICIENT_DATA persistiu com NULLs. Idempotência provada (2 execuções).
- ✅ Fase 0.2 (diagnóstico): writer das linhas `DAILY_ENTRY` é o `sw metricas campanhas`
  (`W571K320aqIHsdtH`, nó `Execute SQL inserir daily entry`); o `client_id` se perde no
  `Code prepara contexto para observacao` → `Code Montar SQL` (fallback grava `''`). Fix = a03.
- ⚠️ 3 de 5 nós do draft persistiram; `Calcular e Persistir PHI Score` e `Log Notion Mapping
  Missing` não persistiram via MCP do Codex (retorno `appliedOperations` mentiu — 2ª ocorrência
  documentada do bug).

## 2. O que o Claude completou (2026-07-04, via MCP oficial n8n + read-back)

- `Calcular e Persistir PHI Score`: sqlQuery substituído pelo MERGE do brief — **read-back
  byte a byte idêntico (8167/8167 chars)**.
- `Log Notion Mapping Missing`: `is_reprocessing FALSE` no INSERT + removida a chave órfã
  `parameters.parameters` deixada pela tentativa do Codex (parameters reescritos limpos).
- Read-back final dos 5 nós: PASS (FALLBACK eliminado do Buscar ID; FQN limpo nos Logs).
- Draft: `8733a520` → `9a174e50` (limpeza). `activeVersionId` inalterado em todas as operações.

## 3. Pré-revisão Claude: APROVADO (autoria do SQL + verificação byte a byte + validação
standalone do Codex sobre o MESMO SQL). Antigravity segue sem cota — dado o standalone PASS e o
read-back, recomendo não bloquear a publicação por ele; pode auditar a posteriori.

## 4. Para publicar (decisão Olavo) e pós-publicação

1. Publicar o draft `9a174e50` (via UI ou MCP `publish_workflow`).
2. Monitorar a rodada 07:00 seguinte: `phi_score_history` com linhas novas (esperado: 2 da CLI-4,
   valores ≠ 50 constante), log com fases INGESTION/CALCULATION/OPERATIONAL e sem o erro de
   `is_reprocessing`, Notion recebendo `Score Diário` real.
3. Fila seguinte: **a03** (client_id no `sw metricas campanhas`) → destrava Fase 4 (desligar
   GADS_INSERT) · **Agregador a02** (re-smoke do mapa por campanha) · backfill do history.

## 5. Aprendizado a cristalizar

MCP `update_workflow` de terceiros retornou `appliedOperations` sem persistir nó grande (2º caso);
o MCP oficial n8n persistiu o mesmo nó (8K) com sucesso. Canal de aplicação para nós grandes:
MCP oficial ou UI, sempre com read-back byte a byte — nunca confiar no retorno da API.

---

## 6. PUBLICADO (2026-07-04, OK do Olavo nesta conversa)

- `publish_workflow` via MCP: `activeVersionId = 9a174e50-e98e-4e25-9fd5-9c7aac32a851` (sucesso).
- **Verificação da próxima rodada 07:00** (rodar após ~07:05 BRT):

```sql
-- V1: escreveu com valores reais?
SELECT calculated_date, campaign_id, phi_value, mas, tss, fis, calculation_status,
       phi_classification, execution_id, source_execution_id
FROM `phi_prod.phi_score_history`
WHERE snapshot_timestamp >= TIMESTAMP(CURRENT_DATE('America/Sao_Paulo'))
ORDER BY campaign_id;
-- esperado: 2 linhas CLI-4, phi != 50 constante, execution_id EXEC-PHI-*, model v1.2

-- V2: log das 3 fases sem erro de is_reprocessing
SELECT execution_id, phase, status, error_message, started_at
FROM `phi_prod.workflow_execution_log`
WHERE DATE(started_at, 'America/Sao_Paulo') = CURRENT_DATE('America/Sao_Paulo')
ORDER BY started_at;
-- esperado: INGESTION + CALCULATION + OPERATIONAL, execution_id EXEC-PHI-* (sem FALLBACK)
```
- Conferir também no Notion: `Score Diário` das 2 campanhas CLI-4 atualizado com valor real.
