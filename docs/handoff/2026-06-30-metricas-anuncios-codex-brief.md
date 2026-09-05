# [BRIEF Codex] Métricas de Anúncios — correções da ingestão ad-grain + smoke

> **Frente:** Ingestão / Daily Entry · **Workflow:** `sw metricas anuncios copy` (`vVAdXAJh6MW2Z5Hp`, `active:false`) · **Branch:** `claude/agentic-agency-planning-KwJEw`
> **Doc de implementação (fonte da verdade, com todo o código):** `docs/handoff/2026-06-30-metricas-anuncios-implementacao.md`
> **Bootstrap original:** `docs/handoff/2026-06-27-metricas-anuncios-subchat-bootstrap.md`
> **Fluxo de revisão:** Codex implementa → Claude pré-revisa → Antigravity → smoke real (Olavo).
> **⚠️ Workflow LEGADO com 36 nós de nome ACENTUADO.** Ver §5 (guard de mojibake) antes de tocar via MCP.

---

## 0. TL;DR do que entregar

Corrigir o `sw metricas anuncios copy` para ingestão **grão de anúncio** idempotente e
independente do Notion, e validar em **phi_dev**. Seis mudanças no workflow + 2 SQLs
(Olavo roda no BQ). Nada de publish/activate — segue `active:false` até smoke verde.

Contexto do bug que motivou (exec #12769): gravou **8 registros** (deveria 2). Causa =
sub-WF chamado com 4 itens no trigger × `Get database anuncios` (Notion getAll roda 1×
por item de entrada) = 4×2 anúncios. Além disso rodava o `Code Montar SQL` **antigo**
(escrevia `raw_campaign_data` com chave vazia — viola ADR-010) e os 2 anúncios eram
**PMAX** (ad-level correto = 0 linhas, ADR-24). Pós-mortem completo no doc de implementação.

---

## 1. Decisões travadas (Olavo) — respeitar

| # | Decisão |
|---|---|
| Granularidade | **Choice A**: `raw_ad_data` (grão anúncio) + VIEW `raw_adset_data_rollup`. **Não** criar `t28_ad` (D15 preservada — `raw_*` é ingestão, `t28_*` é contrato). |
| Escopo pipeline | **Não podar** o ramo de observação Notion/tendências (mas ingestão deixa de depender dele — §3.5). |
| Ad-only | Adset dedicado e `impression_share` diferidos. |
| Cardinalidade GAQL | **Manter 1-ad-por-request**. |
| Ambiente | **phi_dev primeiro**; phi_prod só após smoke verde. |

---

## 2. Pré-requisitos / IDs concretos

| Item | Ref |
|---|---|
| Workflow anúncios (alvo) | `vVAdXAJh6MW2Z5Hp` (`active:false`) |
| Workflow campanhas (template) | `W571K320aqIHsdtH` |
| Orquestrador (chama o sub-WF) | `cLcimNoefTOnVVbd` |
| Projeto BQ (datasets phi_dev/phi_prod) | `project-0e7c58d4-656f-49e8-807` |
| Notion DB Anúncios (nó `Get database anuncios`) | `297b65e5-c72b-8061-89b3-f31bd41d7e7f` (filtro `Status do Anúncio = Iniciado`) |
| Credencial BigQuery / Notion no n8n | OK (reusar as do próprio workflow) |

**DDL/SQL (Olavo roda no BQ — Codex NÃO tem bq):**
- `docs/strategic-planning/agregador-t28/ddl/phi_dev_raw_ad_data.sql` — tabela + VIEW em phi_dev.
- `docs/strategic-planning/agregador-t28/ddl/phi_dev_raw_ad_data_smoke.sql` — 5 checagens.
- `docs/strategic-planning/agregador-t28/ddl/phi_prod_raw_ad_data.sql` — promoção.
- `docs/strategic-planning/agregador-t28/ddl/phi_prod_raw_campaign_data_cleanup_chaves_vazias.sql` — limpeza do lixo da #12769.

---

## 3. Mudanças no workflow (ordem de implementação)

Todo o código-fonte verbatim está no doc de implementação — **copiar de lá**, não reescrever.

### 3.1 Novo nó `Normalizar Trigger` (ASCII) — corrige a multiplicação
Entre `Schedule Trigger` e `Get database anuncios`. Colapsa a entrada em 1 item.
Código: doc de implementação §"Pós-mortem #12769" → correção 1.
Rewire: remover `Schedule Trigger` → `Get database anuncios`; adicionar
`Schedule Trigger` → `Normalizar Trigger` → `Get database anuncios`.

### 3.2 Novo nó `Dedup page_id` (ASCII) — defesa em profundidade
Entre `Get database anuncios` e `Loop Over Items`. Filtra por `it.json.id` único.
Código: doc de implementação §"Pós-mortem #12769" → correção 2.
Rewire: remover `Get database anuncios` → `Loop Over Items`; adicionar
`Get database anuncios` → `Dedup page_id` → `Loop Over Items`.

### 3.3 Substituir o corpo do `Code Montar SQL` pela versão ad-grain COM guard PMAX
Colar o jsCode da §"jsCode — nó Code Montar SQL (com guard PMAX)" do doc de
implementação. Escreve `phi_dev.raw_ad_data`, MERGE idempotente por
`client_id+campaign_id+adset_id+ad_id+date`; sem `ad_id`/`campaign_id` → `_bq_sql=''`
+ `_skip_ingestion=true`. Refs internas são todas ASCII (`Code clean propriedades`,
`Code Valida Dados`, `HTTP Request Google Ontem (D1/D3/D7)`).

### 3.4 Novo nó `IF Gate PMAX` (ASCII) — antes do insert
Value1 `={{ $json._bq_sql }}`, operation `is not empty`.
`IF › true` → `Execute SQL inserir daily entry`; `IF › false` → ponta solta.
Detalhe: doc de implementação §"Nó IF — gate PMAX".

### 3.5 Reorg do grafo — ingestão independente do Notion + remover `Code Debug`
Ver §"Reorganização do grafo" do doc de implementação (mudança completa de conexões).
Resumo:
- **Fan-out** de `Code Cálcula Métricas`: além de `Code Recupera Metas p Comparação`,
  ligar também → `Code Montar SQL` (ingestão vira ramo-folha: `Code Montar SQL` →
  `IF Gate PMAX` → `Execute SQL inserir daily entry`, folha).
- **Retorno do loop:** `Update a database page` → `Loop Over Items` (era `Execute SQL` → Loop).
- **Deletar** `Code Debug` (no-op); religar `Code Preparar Payload de Observação` →
  `Create a database page Create Observation`.
- Motivo do fan-out (não série): `Execute SQL` (googleBigQuery) retorna o resultado da
  query, não o item — em série descartaria o json que a observação consome.

### 3.6 Corrigir ref quebrada no `Create a database page Create Observation`
O nó referencia `$('Code prepara contexto para observação')` — **nó inexistente** neste
workflow (clone de campanhas). Trocar por `$('Code clean propriedades')` no campo
`Campanha|relation` (`...raw_notion_data.clean_notion_id_camp` → `...clean_notion_id_camp`).
Sem isso, esse nó pode derrubar a cadeia (mas com a §3.5 a ingestão já não depende dela).

---

## 4. Ordem de execução do smoke (após implementar)

1. Olavo roda `phi_dev_raw_ad_data.sql` (cria tabela + VIEW).
2. Codex confirma workflow salvo (draft), `validate_workflow` verde, e faz **auditoria de
   mojibake** (§5).
3. Rodar o sub-WF para um cliente com **anúncios Google não-PMAX** (a §7 do bootstrap cita
   CLI-4). Disparo via orquestrador ou manual.
4. Olavo roda `phi_dev_raw_ad_data_smoke.sql`.

---

## 5. Guard de mojibake (OBRIGATÓRIO — workflow legado acentuado)

- **Preferir editar via UI** os nós já existentes acentuados. Se usar MCP `update_workflow`,
  **auditar mojibake logo após**: grep por `Ã`, `Â` e pelo caractere de substituição
  U+FFFD em **todos** os nomes de nó
  e em refs `$('...')` dentro dos Code nodes. Qualquer acento corrompido → corrigir na **UI**,
  não re-MCP.
- **Nós novos com nome 100% ASCII**: `Normalizar Trigger`, `Dedup page_id`, `IF Gate PMAX`.
- Nós de referência crítica com acento no grafo: `Code Cálcula Métricas`,
  `Code Preparar Payload de Observação`, `Code Unificar Períodos (D1, 3D, 7D)`. Conferir
  que continuam íntegros após a edição.
- **Não** publicar / **não** ativar. Segue `active:false`.

---

## 6. Critérios de aceite (smoke phi_dev)

| # | Critério | Esperado |
|---|---|---|
| A | **Dedup/normalização:** nº de anúncios processados = nº de anúncios `Iniciado` únicos do cliente | sem multiplicação (o caso #12769 daria 2, não 8) |
| B | **Grão:** `raw_ad_data` tem 1 linha por `(ad_id, date)` (smoke V1) | 0 duplicatas |
| C | **Aditivas + ROAS:** cost/clicks/impr/conv/conv_value coerentes com o GAQL; `conv_value>0` onde houve conversão (V2) | coerente |
| D | **Rollup adset** bate com SUM do grão (V3) | 0 divergências |
| E | **Idempotência:** rodar 2× o mesmo dia → MERGE não duplica (V4) | contagem estável |
| F | **PMAX:** cliente/anúncio PMAX → GAQL vazia → `IF Gate PMAX` false → **0 linhas**, sem erro (V5) | 0 linhas, execução success |
| G | **ADR-010:** nada gravado em `phi_prod.raw_campaign_data` por este workflow | 0 escritas |

---

## 7. Fora de escopo (NÃO fazer agora)

- Promoção a `phi_prod` (DDL + trocar `phi_dev`→`phi_prod` no jsCode) → só após smoke verde.
- Tendência ad-level (o ramo `BigQuery Série Diária`/`Code Prep Tendência` segue grão de
  campanha), `impression_share` por adset, batelada GAQL por campanha.
- Recalibrar o gate de significância do `Code classificar status` (100 cliques/10 conv é
  volume de campanha — alto p/ anúncio) → backlog.
- Rotação do `google_developer_token`.

---

## 8. Entregáveis (checklist Codex)

- [ ] Nós novos `Normalizar Trigger`, `Dedup page_id`, `IF Gate PMAX` (ASCII).
- [ ] `Code Montar SQL` com versão ad-grain + guard PMAX; alvo `phi_dev.raw_ad_data`.
- [ ] Reorg do grafo (fan-out ingestão, retorno do loop por `Update a database page`,
      `Code Debug` deletado).
- [ ] Ref quebrada do `Create Observation` corrigida.
- [ ] `validate_workflow` verde + auditoria de mojibake registrada (0 corrupção).
- [ ] Workflow **draft / `active:false`**.
- [ ] Execution log em `docs/handoff/` (ids de execução, nº de linhas em `raw_ad_data`,
      resultado das 5 checagens do smoke, prova de idempotência).
- [ ] **NÃO** ativar; **NÃO** rodar prod. Aguardar pré-revisão (Claude) → smoke (Olavo).
