# Fase 6: `sw metricas campanhas` = so metricas na DB Campanhas — MAPA + confirmacao

Data: 2026-08-09
Branch: claude/consolidacao-2026-08
Brief: docs/handoff/2026-08-09-fase6-campanhas-metricas-only-brief.md
Fases anteriores: `1dd1459` · `820b895` · `79956ab` · `c92b49a` (fase4) · `33eee5e` (fase5)

> **Resultado: SEM MUDANCA no workflow.** O `sw metricas campanhas` **ja escreve apenas
> metricas** na DB Campanhas (12 propriedades, todas metricas). Nenhum veredito
> (status/score/classe/crise) chega a DB Campanhas por ele. **Nao ha o que remover; nao ha
> colisao.** O veredito interno (`final_status`/`final_score`/`classe_score`/`status_meta`)
> vai para a DB **Observacoes Diarias** (um log diario, DB separada), nao para a pagina da
> campanha — fora do escopo aprovado (que e "na DB Campanhas"). Entrego o mapa + confirmacao.

Ativo (inalterado): `2a4c40e5-21b4-4b03-a82a-6a6716b9e171`.

---

## 1. Mapa — quem escreve o que na DB Campanhas (`collection://19fb65e5-c72b-80be-8c3b-000bb115d53f`)

### 1.1 `sw metricas campanhas` (W571K320aqIHsdtH) — todas as escritas no Notion

Dois nos Notion de escrita (o `Get many database Campanhas` e leitura):

**A) `Update a database page` -> DB Campanhas** (pageId = `$('Get many database Campanhas').item.json.id`).
12 propriedades, **todas METRICA**, origem `Code Cálcula Métricas` / `Code Unificar Períodos`:

| Propriedade | Tipo | Origem | Classe |
|---|---|---|---|
| CPA Campanha | rich_text | investimento_7d/30d formatado | METRICA |
| CPA da Campanha | number | investimento_7d | METRICA |
| CPC Campanha | rich_text | cpc_7d/30d | METRICA |
| CPL Campanha | rich_text | cpl_7d/30d | METRICA |
| CPM Campanha | rich_text | cpm_7d/30d | METRICA |
| CTR Campanha | rich_text | ctr_7d/30d | METRICA |
| Taxa de Conversão | rich_text | taxa_conversao_7d/30d | METRICA |
| Impressões | rich_text | impressions_7d/30d | METRICA |
| Métrica-Mãe 1D | number | Code Unificar v_d1 | METRICA (valor da metrica-mae) |
| Métrica-Mãe 3D | number | Code Unificar v_3d | METRICA |
| Métrica-Mãe 7D | number | Code Unificar v_7d | METRICA |
| Total Investido Campanha | number | investimento_30d | METRICA |

**Nenhuma propriedade de VEREDITO** (sem Status Geral, sem Score Diário, sem Em Crise?,
sem classe/prioridade). Confirma o achado da fase 5.

**B) `Create a database page Create Observation` -> DB Observacoes Diarias**
(`19fb65e5-c72b-8192-8f73-ff7f500a0972`) — **NAO e a DB Campanhas.** E o log diario, ligado a
campanha por `Campanha|relation`. Aqui SIM ha veredito, mas no LOG, nao na pagina da campanha:

| Propriedade (Observacao) | Origem | Classe |
|---|---|---|
| Análise de Performance | `Code classificar status`.final_status | VEREDITO (no log) |
| PHI Score | final_score | VEREDITO (no log) |
| Classificação PHI | classe_score | VEREDITO (no log) |
| Emoji Status | status_emoji | VEREDITO (no log) |
| Status da Métrica-Mãe | status_meta | VEREDITO (no log) |
| Métrica Principal | sop_config.metric_principal | contexto |
| Valor Métrica-Mãe 1D/3D/7D, Optimization Score, Tendência 3D/1D | Code Unificar / Code Valida | METRICA |
| id_google_camp/account, id_meta_account/ads, Data Execução, id_workflow, Criado Por, Campanha(rel) | contexto/ids | — |

### 1.2 `PHI - Pipeline_v2` (ITWG3Ge0asXtUM8U) — escritas na DB Campanhas

Um unico no escreve VEREDITO na pagina da campanha:

**`Sync Scores to Notion` -> DB Campanhas** (pageId = `$json.notion_page_id`):

| Propriedade | Origem | Classe |
|---|---|---|
| Score Diário (0-100) | phi_value | VEREDITO (score canonico) |
| Status Geral da Campanha | phi_classification (CRITICAL/WARNING/GOOD/EXCELLENT) | VEREDITO |
| phi_ultima_execucao | today | carimbo |

Mais dois nos que tocam a pagina da campanha (checkbox operacional, nao metrica/veredito):
- `Update otimização ativa` -> `Otimização Ativa?` = true (pageId Code Enriquecer.notion_page_id).
- `Auto-Close: Desativar Otimização` -> `Otimização Ativa?` = (uncheck).

> Os demais nos Notion do Pipeline_v2 escrevem em **Tasks** (`Update a database page` com
> Gravidade/Prioridade/Dias em Alerta; `Create a database page`; auto-close de tarefas),
> **Checklist** e **Log de Otimizacoes** — nao na DB Campanhas. Fora do overlap.

### 1.3 Overlap na DB Campanhas — por propriedade

| Propriedade (DB Campanhas) | sw metricas campanhas | Pipeline_v2 | Colisao? |
|---|---|---|---|
| CPA Campanha / CPA da Campanha | escreve (metrica) | — | **nao** |
| CPC / CPL / CPM / CTR Campanha | escreve (metrica) | — | **nao** |
| Taxa de Conversão | escreve (metrica) | — | **nao** |
| Impressões | escreve (metrica) | — | **nao** |
| Métrica-Mãe 1D / 3D / 7D | escreve (metrica) | — | **nao** |
| Total Investido Campanha | escreve (metrica) | — | **nao** |
| Score Diário (0-100) | — | escreve (veredito) | **nao** |
| Status Geral da Campanha | — | escreve (veredito) | **nao** |
| phi_ultima_execucao | — | escreve (carimbo) | **nao** |
| Otimização Ativa? | — | escreve (operacional) | **nao** |
| Resultado Atual (Métrica-mãe) | — | — (nenhum dos dois) | — |
| Em Crise? / Status da Métrica-mãe | — (formulas, read-only) | — | — |

**Intersecao = VAZIA. Nenhuma propriedade e escrita pelos dois. Zero colisao.**

---

## 2. O que foi removido

**Nada.** A escrita do `sw metricas campanhas` na DB Campanhas ja e 100% metrica; nenhum
veredito/score/status/crise sai dele para a pagina da campanha. Nao ha "fio de veredito" a
cortar na DB Campanhas. (O classificador interno `Code classificar status` segue calculando —
inocuo, serve de diagnostico nos logs — mas sua saida so alcanca a DB **Observacoes Diarias**,
nao a DB Campanhas.)

---

## 3. Colisoes de metrica entre os dois workflows

**Nenhuma.** Nenhuma das 12 metricas escritas pelo `sw metricas campanhas` e escrita pelo
`Pipeline_v2` (que so escreve Score Diário / Status Geral / phi_ultima_execucao / Otimização
Ativa? na campanha). Nao ha last-writer-wins em metrica. Nada para o Olavo decidir aqui.

---

## 4. `status_meta` — destino

`status_meta` ("Acima da Meta 🚨") **nao** vira propriedade da PAGINA DA CAMPANHA. Ele e
escrito como `Status da Métrica-Mãe|rich_text` na **Observacao Diaria** (log). Na pagina da
campanha, `Status da Métrica-mãe` e uma **formula** (read-only) — ninguem a escreve via API.
Pela regra do brief ("se so vive no payload/observacao, deixa quieto"), **deixado como esta**.
Registro: se o Olavo quiser que nem o log diario carregue veredito, e uma decisao a parte
(ver pendencias).

---

## 5. Aceite (verificado na pagina da campanha da barbearia, `2a1b65e5-c72b-80ce-b5b9-d384a62151da`, `GADS-21149189736`)

1. `sw metricas campanhas` escreve na DB Campanhas **somente metricas**: **OK** (12 props,
   todas metricas; confirmado com valores vivos: CPA Campanha "R$ 19.16 (R$ 54.16)",
   Impressões "1070 (3702)", Métrica-Mãe 7D 6.39, Total Investido 54.16, Taxa de Conversão
   "7.89% (4.46%)").
2. **Nenhuma colisao** silenciosa: **OK** (intersecao vazia — tabela 1.3).
3. **Pipeline_v2 intacto e unico dono do veredito:** **OK** — na pagina lida agora:
   `Status Geral da Campanha` = **WARNING**, `Score Diário (0-100)` = **55.94**
   (o brief citava 56.26; a diferenca e o Pipeline_v2 recalculando em dia novo — segue sendo
   dele, nao sobrescrito), `phi_ultima_execucao` = 2026-08-09. O `sw metricas campanhas` nao
   escreve nenhum desses campos.
4. **Metricas continuam atualizando:** **OK** (valores do dia presentes na pagina).

---

## 6. Publicacao

**SEM MUDANCA — nao publiquei.** Nenhuma alteracao de workflow foi necessaria (a DB Campanhas
ja recebe so metricas). `activeVersionId` permanece `2a4c40e5-21b4-4b03-a82a-6a6716b9e171`.
Rollback nao se aplica (nada mudou).

---

## 7. Pendencias / decisoes para o Olavo

1. **Veredito no log diario (Observacoes Diarias).** O `sw metricas campanhas` grava
   `final_status`/`final_score`/`classe_score`/`status_meta` no `Create Observation`
   (DB Observacoes Diarias, nao DB Campanhas). Isso esta **fora do escopo aprovado** (que era
   DB Campanhas) e nao foi tocado. **Decisao do Olavo:** se, pela mesma logica ADR-003
   (Pipeline_v2 e a autoridade do veredito), o log diario tambem deve deixar de gravar
   veredito e virar so metricas — ou se o log e um snapshot diagnostico legitimo e pode
   manter. Minha recomendacao: **manter** (o log e um registro historico datado, nao a
   verdade corrente da campanha; nao colide com nada). Se decidir remover, e desconectar 5
   campos do `Create Observation` (Análise de Performance, PHI Score, Classificação PHI,
   Emoji Status, Status da Métrica-Mãe) — trivial, mas quero OK antes.
2. **`Resultado Atual (Métrica-mãe)`** (20.24 na pagina) nao e escrito por **nenhum** dos dois
   workflows mapeados — origem desconhecida (outro fluxo ou manual). So registro; fora do
   escopo.
3. **Classificador interno de campanhas** (fases 4/5) segue calculando sem destino na DB
   Campanhas. Se o Olavo confirmar que o veredito de campanha e exclusivamente do Pipeline_v2
   para sempre, o `Code classificar status` / `Code calculo desvio meta` de campanhas viram
   codigo morto candidato a remocao futura (nao removi — inocuo e util em log).

---

## 8. Fora de escopo respeitado

- Nenhuma metrica removida de nenhum pipeline (nao havia colisao).
- `PHI - Pipeline_v2`: nao tocado.
- Prefixo `=`, nos de escrita BigQuery, `PHI - Subworkflow Campanhas`: intocados.
- `Merge Meta Ads` / `Code Valida Dados`: nao perseguidos.
- Sem force-push, sem PR, sem publish (nada mudou).

## Como verificar

1. `get_workflow_details` `W571K320aqIHsdtH` -> `Update a database page` tem 12 props, todas
   metricas; nenhum `final_status`/`final_score`/`Status Geral`/`Score Diário`.
2. `get_workflow_details` `ITWG3Ge0asXtUM8U` -> `Sync Scores to Notion` escreve
   `Score Diário (0-100)` e `Status Geral da Campanha` na DB Campanhas.
3. Notion page `2a1b65e5-c72b-80ce-b5b9-d384a62151da` -> `Status Geral da Campanha`=WARNING,
   `Score Diário`=55.94 (Pipeline_v2), metricas CPA/Impressoes/etc. atualizadas (sw metricas
   campanhas). Intersecao de donos = vazia.
