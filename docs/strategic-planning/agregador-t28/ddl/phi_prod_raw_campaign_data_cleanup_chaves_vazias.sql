-- =============================================================================
-- LIMPEZA — remover linhas de CHAVE VAZIA gravadas por engano em raw_campaign_data
-- Origem: execução #12769 do sw metricas anuncios copy (nó antigo Code Montar SQL
-- ainda escrevendo phi_prod.raw_campaign_data com client_id='' e campaign_id='').
-- Viola ADR-010 (só Daily Entry de campanha escreve raw_campaign_data) e é lixo
-- (ambos os anúncios eram PMAX → sem dado ad-level).
-- Rodar o SELECT primeiro para conferir o volume; só então o DELETE.
-- =============================================================================

-- 1) PREVIEW — conferir o que será apagado (esperado: linhas só com chave vazia).
SELECT execution_id, client_id, campaign_id, date, cost, conversions, ingested_at
FROM `phi_prod.raw_campaign_data`
WHERE client_id = '' OR campaign_id = ''
ORDER BY ingested_at DESC;

-- 2) DELETE — remover só as linhas de chave vazia.
DELETE FROM `phi_prod.raw_campaign_data`
WHERE client_id = '' OR campaign_id = '';

-- (opcional) Se aparecerem chaves NULL em vez de '', rodar também:
-- DELETE FROM `phi_prod.raw_campaign_data`
-- WHERE client_id IS NULL OR campaign_id IS NULL;
