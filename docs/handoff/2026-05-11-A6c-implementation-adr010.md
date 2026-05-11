# A.6c — Implementação do ADR-010 (Opção A)

Status: **Em andamento** → **Aguardando aceite** (após publicação deste handoff).

## 1) Audit do filtro `ingestion_step` (pré-patch)

Comandos executados:
- `rg -n "ingestion_step" *.json docs -g '*.json' -g '*.md'`
- inspeção manual dos SQLs de nós BigQuery em `phi_pipeline_v2.json`.

Resultado:
- **PHI-Pipeline_v2**: não foi encontrado `WHERE ingestion_step = 'DAILY_ENTRY'` nos SQLs do workflow.
- **Subworkflow Campanhas**: encontrado uso de `ingestion_step = 'GADS_INSERT'` no nó writer `Execute SQL  INSERT raw_campaign_data` (writer concorrente).
- **Downstream disponíveis no repositório (Fase 2/3 dentro do próprio pipeline JSON)**: sem filtro explícito por `ingestion_step`.

Decisão da bifurcação do passo 1:
- **(a) suspeita de filtro explícito não confirmada neste repositório**. Não houve remoção de cláusula `WHERE ingestion_step` porque ela não existe nos SQLs auditados daqui.

## 2) Decisão sobre `client_config sync`

Nó auditado: `Execute SQL client_config sincronizado` (subworkflow campanhas).

O que faz:
- Atualiza `phi_prod.client_config.primary_metric_type` por `client_id` usando o valor derivado do fluxo da campanha.

Decisão:
- **Manter no subworkflow** (opção i, recomendada).

Justificativa:
- É papel legítimo do subworkflow segundo ADR-010 (sync de configuração).
- Não depende da escrita em `raw_campaign_data`.
- Evita acoplamento adicional no Pipeline_v2.

## 3) Patch — PHI Subworkflow Campanhas (`b1pbn8qmzCNTufTp`)

Arquivo alterado: `phi_subworkflow_campanhas_fixed.json`.

Mudanças aplicadas:
1. Removido o nó writer `Execute SQL  INSERT raw_campaign_data`.
2. Roteamento ajustado para seguir de `Code transformar retorno Google Ads` direto para `Execute SQL client_config sincronizado`.
3. Start node recebeu novo input `source_execution_id` (read-only, sem uso para escrita).

## 4) Patch — PHI-Pipeline_v2 (`ITWG3Ge0asXtUM8U`)

Arquivo alterado: `phi_pipeline_v2.json`.

Mudanças aplicadas:
1. `Buscar ID de Sucesso Hoje` atualizado para:
   - gerar `execution_id` no padrão `EXEC-PHI-*`;
   - resolver `source_execution_id` via `raw_campaign_data` (`EXEC-DE-*` do dia SP) com fallback `FALLBACK-DE-*`.
2. `Call Subworkflow Campanhas` recebeu `source_execution_id` em `workflowInputs`.
3. Nós de `workflow_execution_log` atualizados para gravar o par `(execution_id, source_execution_id)`.
4. `Calcular e Persistir PHI Score` passa a consumir `raw_campaign_data` por `source_execution_id` e persiste o par em `phi_score_history`.

## 5) Validação ponta-a-ponta

Nesta execução local de repositório **não houve acesso ao n8n/BQ de produção para rodar retry e smoke operacional**; portanto ficaram pendentes as validações online:
- conferência em `raw_campaign_data` para `EXEC-DE-*` e `ingestion_step='DAILY_ENTRY'`;
- retry controlado do Pipeline_v2 com comprovação de `source_execution_id=EXEC-DE-*`;
- confirmação de `mas/tss` saindo de fallback;
- smoke retroativo +1h.

## 6) Critério de parada

Nenhum novo writer concorrente adicional foi encontrado nos artefatos versionados locais além do já mapeado e removido (`GADS_INSERT` no subworkflow).

Se no ambiente real `mas/tss` permanecerem em fallback após deploy, tratar como descoberta nova e abrir entrega separada (conforme instrução de parada forte).

## Publicação
Arquivo republicado nesta branch local para sincronização com o remoto.
