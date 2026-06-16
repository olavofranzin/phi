# Handoff de Validação: Entrega A.0 (ADR-005)
**Data:** 2026-05-09
**Status:** ✅ APROVADO

## Resumo da Validação
A entrega A.0 visava implementar e validar a regra **ADR-005** (Agregação de custo 3d/7d apenas para Google Ads, fixando 0 para Meta Ads) no workflow *Daily Entry*. A validação foi concluída com sucesso através de auditoria de código e análise de dados no BigQuery.

## 1. Auditoria de Código (Diff Estático)
O nó **"Code Montar SQL"** (`a096aa19...`) foi auditado. Confirmamos que:
- Campanhas onde `isGoogleCampaign` é `false` (Meta Ads) têm `cost_3d` e `cost_7d` explicitamente setados como `0`.
- Campanhas Google Ads utilizam a agregação v23 baseada nas propriedades do Notion.

## 2. Resultados BigQuery (Snapshot Analysis)
A análise pré/pós patch (07/05/2026) confirmou a ativação da lógica:

| Campaign ID | Date | Cost | Cost 3D | Cost 7D |
| :--- | :--- | :--- | :--- | :--- |
| GADS-21116045403 | 2026-05-07 | 31.36 | 90.51 | 179.15 |
| GADS-21149189736 | 2026-05-07 | 3.69 | 15.32 | 36.10 |

**Evidência:** Antes de 07/05, os campos `cost_3d/7d` estavam zerados. A partir desta data, os valores estão sendo populados corretamente conforme o esperado.

## 3. Smoke Test Canária (GADS-21149189736)
A campanha canária, que originou o Aprendizado #7, foi validada retroativamente:
- **Até 03/05:** `cost_3d = 0`, `cost_7d = 0` (Comportamento antigo/bugado).
- **A partir de 07/05:** `cost_3d = 15.32`, `cost_7d = 36.10` (Lógica corrigida).

## Conclusão
A lógica está operando conforme o ADR-005. A heterogeneidade de custos entre canais está protegida pela trava de segurança no código de ingestão.
