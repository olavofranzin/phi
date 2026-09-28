# ADR-39 — Fase B — relatório de execução

**Data:** 2026-09-27 a 2026-09-28  
**Branch:** `claude/consolidacao-2026-08`  
**Resultado:** Fase B concluída. O cadastro ganhou writer único em `phi_prod`; o writer de métrica no grão do cliente saiu; `phi_dev.client_config` foi removida.

## Provas medidas

| Etapa | Resultado | Evidência |
|---|---|---|
| DDL | `primary_metric_type` passou de REQUIRED para NULLABLE | `43731` / `43732` |
| CA3a | `CLI-15` nasceu por `WHEN NOT MATCHED` em `phi_prod`, com métrica `NULL`, e foi removido na mesma sessão | `43733` / `43734` / `43735` / `43737` |
| Sincronização | `CLI-13` e `CLI-4` foram processados no mesmo loop; `CLI-13` entrou em produção | `43738` / `43739` |
| `client_slug` | `CLI-13` nasceu como `CHA`, não `NULL` | `44090` |
| `model_id` | `CLI-13` recebeu `MODEL-VAREJO-001`: Notion `Segmento = Negócio Local` → mapa explícito → `model_config.business_model = VAREJO_LOCAL` | `44090` |
| 4.3b ao vivo | A rodada natural devolveu campanha `21149189736` com `CPA` lido de `phi_score_history` | Pipeline `43984` |
| 4.4 | O nó `Execute SQL client_config sincronizado` saiu; o INSERT de campanha liga direto a `Fim subworkflow` | versão ativa `0cc36334-07a1-47df-9fa3-e097a907a45c` |
| 4.5 | Somente `phi_dev.client_config` foi apagada | preflight `44092`; DROP `44093`; pós-condição `44095` |
| CA2 | Depois do 4.4, `CLI-4` continua com `primary_metric_type = CPA` | `44095` |
| R13 | Os workflows alterados foram relidos com `versionId = activeVersionId` | `client_config` `b4742c15`; `Pipeline_v2` `88c65762`; Subworkflow `0cc36334` |

## Contrato documentado para novos clientes

- `client_slug` vem da fórmula `Sigla Cliente` do Notion.
- `model_id` deriva de um mapa explícito do `Segmento` do Notion. Hoje: `Negócio Local → MODEL-VAREJO-001`.
- O Code implementa falha antes do MERGE quando o segmento não está no mapa; esse caminho negativo não foi executado nesta fase.
- `MODEL-VAREJO-001` aponta para `VAREJO_LOCAL`, versão `v1.2`, com pesos MAS `0,34`, TSS `0,33` e FIS `0,33`.

## Achado adicional — Regra Crítica nº 5

Antes da correção, o BigQuery não devolvia item após o MERGE e o `splitInBatches` nunca passava do primeiro cliente. A sincronização terminava verde, sem erro, mas todos os clientes seguintes ficavam sem processamento. `Always Output Data` foi habilitado e a execução `43738` provou duas iterações.

## Estado de `phi_dev`

A tabela `phi_dev.client_config` morreu. O dataset não foi apagado: a varredura de 82 workflows encontrou `WF-T28-Orquestrador-Analises` (`8Q5ofmAZju0hTN08`) ainda referenciando `phi_dev` no nó `Set config`. O workflow está inativo, mas a decisão sobre o dataset pertence a outra etapa.

## Diferenças do plano

- A coluna `primary_metric_type` precisou ser relaxada para aceitar cliente sem métrica no grão errado.
- O loop precisava de `Always Output Data`; repontar o MERGE sozinho não sincronizaria mais de um cliente.
- A prova do 4.3b foi redefinida corretamente: o SQL real devolveu dado real com a métrica da campanha; não foi necessário criar tarefa fora da hora.

## Fora desta fase

- A coluna `client_config.primary_metric_type` continua existindo para os dois leitores restantes.
- O `PHI - Subworkflow Campanhas` continua ativo até a Fase 2 do ADR-37.
- O dataset `phi_dev` continua de pé.
- O resumo seguinte deve observar o `CLI-13` pelo V3B do vigia.



## Critérios de aceite

| Critério | Estado | Prova |
|---|---|---|
| CA1 — um writer de `phi_prod.client_config` | ✅ | `client_config` mantém o MERGE; a versão ativa `0cc36334` do Subworkflow não contém o nó de UPDATE |
| CA2 — KIL continua CPA depois do 4.4 | ✅ | `44095`: uma linha casada, valor `CPA` |
| CA3a — cliente novo ganha linha | ✅ | `43733` / `43734`; teste removido em `43735` / `43737` |
| CA3b — cliente novo recebe score | ⬜ fora desta fase | O V3B acompanha `CLI-13`; sua campanha encerrada e métrica CPL não provam score CPA |
| CA5 amplo — `phi_dev` não é escrito nem lido | ⬜ aberto | A tabela `client_config` fechou (`44095`), mas `WF-T28-Orquestrador-Analises` ainda referencia o dataset |
| CA6 — janela 09h–23h | ✅ | Mudanças da Volta 3 executadas em 28/09 entre 13h41 e 13h50 BRT |
| CA7 — publicado é o ativo | ✅ | `versionId = activeVersionId` em `b4742c15`, `88c65762` e `0cc36334` |
| CA8 — cliente de teste removido na mesma sessão | ✅ | Notion e BigQuery limpos; `43737` confirmou zero `CLI-15` |

