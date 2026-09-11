-- =============================================================================
-- SMOKE — raw_ad_data (Fase 4). Rodar em phi_dev DEPOIS de executar o workflow
-- p/ 1 cliente piloto com anúncios Google reais (ex.: CLI-4).
-- Projeto: project-0e7c58d4-656f-49e8-807  (phi_dev = dataset)
-- Substituir 'CLI-4' pelo client_id do piloto.
-- =============================================================================

-- V1 — Grão correto: exatamente 1 linha por (ad_id, date). Esperado: 0 linhas.
SELECT client_id, campaign_id, adset_id, ad_id, date, COUNT(*) AS n
FROM `phi_dev.raw_ad_data`
WHERE client_id = 'CLI-4'
GROUP BY client_id, campaign_id, adset_id, ad_id, date
HAVING COUNT(*) > 1;

-- V2 — Sanidade das aditivas (comparar manualmente com o retorno GAQL do dia).
-- Esperado: números coerentes; conv_value > 0 onde houve conversão; sem NULL nas chaves.
SELECT ad_id, ad_name, ad_status, date,
       impressions, clicks, cost, conversions, conv_value,
       SAFE_DIVIDE(conv_value, cost) AS roas
FROM `phi_dev.raw_ad_data`
WHERE client_id = 'CLI-4'
ORDER BY cost DESC;

-- V3 — Rollup de adset soma certo: VIEW deve bater com SUM direto do grão.
-- Esperado: 0 linhas (nenhuma divergência).
WITH direto AS (
  SELECT client_id, campaign_id, adset_id, date,
         SUM(impressions) impr, SUM(clicks) clk, SUM(cost) cost,
         SUM(conversions) conv, SUM(conv_value) cv
  FROM `phi_dev.raw_ad_data`
  WHERE client_id = 'CLI-4'
  GROUP BY 1,2,3,4
)
SELECT d.* EXCEPT(impr), v.impressions AS view_impr, d.impr AS direto_impr
FROM direto d
JOIN `phi_dev.raw_adset_data_rollup` v
  USING (client_id, campaign_id, adset_id, date)
WHERE d.impr <> v.impressions OR d.clk <> v.clicks OR d.cost <> v.cost
   OR d.conv <> v.conversions OR d.cv <> v.conv_value;

-- V4 — Idempotência: rodar o workflow DUAS vezes p/ o mesmo dia e reexecutar V1.
-- O MERGE (chave client_id+campaign_id+adset_id+ad_id+date) NÃO deve duplicar.
-- Conferência rápida de contagem total (deve ficar estável entre as duas execuções):
SELECT date, COUNT(*) AS linhas
FROM `phi_dev.raw_ad_data`
WHERE client_id = 'CLI-4'
GROUP BY date
ORDER BY date;

-- V5 — PMAX: cliente 100% Performance Max não tem ad_group_ad → GAQL volta vazio.
-- Esperado: 0 linhas e SEM erro no workflow (comportamento esperado, ADR-24).
SELECT COUNT(*) AS linhas_pmax
FROM `phi_dev.raw_ad_data`
WHERE client_id = ':CLIENT_PMAX';   -- trocar pelo client_id de um cliente PMAX
