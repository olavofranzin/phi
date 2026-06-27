# Bootstrap de Sub-chat — Métricas de Anúncios e Conjuntos de Anúncios

> **Propósito:** este documento inicializa um **sub-chat dedicado** (sessão Claude
> nova) para implementar a captura de métricas de **anúncio (ad)** e **conjunto de
> anúncios (adset)** nos moldes do que já existe para **campanha**. Colar este
> arquivo (ou apontar para ele) ao abrir o sub-chat.
> **Branch:** `claude/agentic-agency-planning-KwJEw`.
> **Foco inicial (decisão do Olavo):** começar pelas **métricas de anúncios**, a
> partir do workflow já iniciado `sw metricas anuncios copy` (id `vVAdXAJh6MW2Z5Hp`).

---

## 0. TL;DR para o sub-chat

1. Existem **duas camadas** de dados. Não confundir:
   - **Ingestão / "Daily Entry"** (`sw metricas *`) → escreve tabelas `raw_*_data`.
   - **Contrato / "PHI" Agregador T28** (`4sdG2UKMCBuFq8xn`) → lê `raw_*` e escreve `t28_*`.
2. O foco imediato é a **ingestão de anúncios** (`sw metricas anuncios copy`).
3. **Bug atual confirmado:** esse workflow é um clone do de campanhas e ainda
   escreve em `phi_prod.raw_campaign_data` com `MERGE ON (client_id, campaign_id,
   date)` — **grão de campanha, sem `ad_id`/`adset_id`**. O SQL alvo NÃO foi
   adaptado para anúncio.
4. A **query GAQL já é ad-grain** (`FROM ad_group_ad`, traz `campaign.id` +
   `ad_group.id` + `ad.id`) → boa base; rollup-capable.
5. **Recomendação estratégica (detalhada na §4):** salvar **grão de anúncio** em
   uma tabela nova `raw_ad_data` e **derivar adset por rollup** (VIEW), em vez de
   gravar adset separadamente. Honra a intuição do Olavo ("salvar só anúncio") e o
   ADR-24 (bottom-up). **Mas isso reabre parcialmente a D15** — confirmar com o
   Olavo antes de criar tabela (ver §8).

---

## 1. Mapa das duas camadas

```
INGESTÃO (Daily Entry)                       CONTRATO (PHI / Agregador T28)
─────────────────────────                    ──────────────────────────────
operador unico metricas (cLcimNoefTOnVVbd)   PHI — Agregador Multi-fonte
  └─ sw metricas campanhas (W571K320aqIHsdtH)   (4sdG2UKMCBuFq8xn)
        → phi_prod.raw_campaign_data             lê raw_campaign_data +
  └─ sw metricas anuncios copy (vVAdXAJh6MW2Z5Hp) GAQL adset/ad fresh
        → (HOJE: raw_campaign_data — BUG)         escreve t28_campaign / t28_adset
                                                  / t28_ga4_landing / t28_gbp_daily
                                                  / t28_clarity_daily / t28_meta_campaign
```

- **`raw_campaign_data`** é a fonte canônica de campanha (ADR-010, Daily Entry).
  **Não duplicar grão de campanha** em outra tabela.
- O Agregador T28 (PHI) hoje **não persiste `t28_ad`** — por D15, dados de anúncio
  iriam como `criativos_json` (top-N) dentro de `t28_adset`.

## 2. Estado atual do `sw metricas anuncios copy` (id `vVAdXAJh6MW2Z5Hp`)

- Trigger: `executeWorkflowTrigger` (é sub-WF chamado pelo orquestrador).
- Fluxo Google: `Get database anuncios` → `Loop Over Items` → `Get database
  campanhas` → `Get database conjuntos anuncios` → `Code clean propriedades` →
  `If Plataforma` → `v23 Bloco 1/2/3` → `HTTP Request Google Ontem (D1/D3/D7)` →
  `Code Unificar Períodos` → `Code Cálcula Métricas` → ... → `Code Montar SQL` →
  `Execute SQL inserir daily entry` (BigQuery).
- **Query GAQL (D1/D3/D7)** — já ad-grain:
  ```sql
  SELECT campaign.id, campaign.name, ad_group.id, ad_group.name,
         ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.status,
         segments.date, metrics.cost_micros, metrics.clicks, metrics.impressions,
         metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.average_cpc
  FROM ad_group_ad
  WHERE ad_group_ad.ad.id = <clean_id_google_ad> AND segments.date = '<date>'
  ```
  - Busca **1 anúncio por requisição** (filtro `ad.id = X`, `date = D`). Alto número
    de chamadas; avaliar batelada por campanha (`WHERE campaign.id = X` sem filtro
    de ad) — decisão de design da §5.
  - Sem `impression_share` (correto: não existe em nível de anúncio).
- **`Code Montar SQL`** monta `MERGE phi_prod.raw_campaign_data ... ON (client_id,
  campaign_id, date)` — **grão de campanha**. Precisa virar grão de anúncio
  (incluir `adset_id`, `ad_id` na chave) e apontar para a tabela nova.

## 3. Decisões existentes que CONSTRANGEM (ler antes de propor)

| Ref | Decisão | Implicação |
|---|---|---|
| **ADR-010** | Daily Entry é o escritor canônico de `raw_campaign_data` | Não reescrever campanha por outro caminho; anúncio vai em tabela própria. |
| **D15 (Aprovada)** | `t28_ad` dedicada **diferida** para L3; default = `criativos_json` em `t28_adset` | Criar tabela de anúncio reabre essa decisão — confirmar com Olavo (§8). |
| **ADR-24** | Granularidade bottom-up / rollup | Favorece salvar o grão mais fino (anúncio) e derivar acima. |
| **D5** | Search Terms **nunca** persistem em BQ | Os blocos `v23 ... Termos` não geram tabela; só features agregadas. |
| **t28_adset.criativos_json** | Criativos top-N como JSON aninhado no adset | Alternativa a `raw_ad_data`/`t28_ad`; pesar na §4. |

## 4. Recomendação estratégica de granularidade (a pergunta do Olavo)

**Pergunta:** "devemos salvar apenas dados de anúncios?"

**Resposta curta: sim, em essência — com 2 ressalvas.**

**Salvar grão de anúncio (`raw_ad_data`) e derivar adset por rollup (VIEW).**
A query já traz `campaign.id` + `ad_group.id` + `ad.id`, então as métricas
**aditivas** (impressions, clicks, cost, conversions, conv_value) sobem
deterministicamente: adset = `SUM` por `ad_group.id`; campanha = `SUM` por
`campaign.id`. Salvar o grão mais fino uma vez e derivar acima:
- honra a intuição "salvar só anúncio" e o ADR-24 (bottom-up);
- evita **gravar adset redundante** (escrever a mesma métrica em 2 grãos convida
  a deriva/reconciliação — total da campanha ≠ soma dos adsets ≠ soma dos ads);
- mantém uma única fonte de verdade ad-level para drill-down (quais anúncios pausar).

**Ressalva 1 — métricas não-aditivas não sobem.** `impression_share` /
`budget_lost_is` existem só em nível campanha/adset e **não** fazem rollup a
partir de anúncio. As colunas existem em `t28_campaign`/`t28_adset`. Se a análise
precisar de impression_share por adset, é preciso uma query **separada**
`FROM ad_group` (nível adset) só para esse campo. **Recomendo diferir** (YAGNI /
espírito da D15) até uma análise concreta pedir — começar ad-only.

**Ressalva 2 — seam de reconciliação.** O rollup de anúncio **não baterá exato**
com `raw_campaign_data` (fontes/atribuição/timing diferentes). Portanto: o rollup
de adset a partir de `raw_ad_data` serve para **drill-down ad-level**, enquanto o
**relatório de campanha continua em `raw_campaign_data`**. Documentar essa
fronteira; não tentar substituir a campanha pelo rollup.

**Conclusão prática:** uma tabela nova `raw_ad_data` (grão anúncio) + VIEW de
rollup de adset para aditivas. Campanha intocada. impression_share por adset
diferido. **Como isso reabre a D15, o sub-chat deve confirmar com o Olavo a
escolha entre (A) `raw_ad_data` + rollup [recomendado], vs (B) manter D15 e só
preencher `criativos_json` em `t28_adset`** antes de criar qualquer tabela (§8).

## 5. Workstream proposto (fases)

> Padrão de revisão do projeto: **Codex implementa → pré-revisão Claude →
> Antigravity → smoke real (Olavo)**. Cada fase fecha com commit no branch.

**Fase 0 — Orientação (sub-chat lê/coleta, sem mudar nada):**
- Ler este doc + `docs/strategic-planning/saude-digital/BRUTO-v0.1-arquitetura-saude-digital.md`
  (D15, ADR-24) + `docs/strategic-planning/agregador-t28/ddl/phi_prod_t28_tables.sql`
  (modelo t28_adset/criativos_json).
- `get_workflow_details` em `vVAdXAJh6MW2Z5Hp` (anúncio, foco) e `W571K320aqIHsdtH`
  (campanha, template) — **diff** entre os dois para mapear o que falta adaptar.
- `bq show --schema phi_prod.raw_campaign_data` — schema real (modelo p/ `raw_ad_data`).
- Confirmar que **não existe** `raw_ad_data`/`t28_ad` ainda.

**Fase 1 — Queries GAQL corretas (anúncio):**
- Validar a query `FROM ad_group_ad` (campos certos; `conversions_value` para ROAS).
- Decidir **cardinalidade da chamada**: 1-ad-por-request (atual, simples, caro) vs
  batelada por campanha (`WHERE campaign.id = X`, 1 request → N ads). Recomendado
  bateladar para reduzir quota; cuidar do `searchStream` paginado.
- Tratar PMAX: campanhas PMAX **não têm `ad_group_ad`** → retorno vazio é esperado
  (igual ao `t28_adset=0`); não é erro. Logar, não quebrar.
- Cross-ref: o Agregador T28 tem um nó `Google Ads Anúncios (GAQL)` com erro
  "Bad request" **diferido** — mesmo nível de dados; alinhar a query correta entre
  os dois.

**Fase 2 — BQ apto para os inserts (a decisão da §4):**
- Confirmar a escolha A/B com o Olavo (§8).
- Se A: escrever DDL `raw_ad_data` (phi_dev primeiro), modelado em
  `raw_campaign_data` + chaves de anúncio. Esqueleto inicial:
  ```sql
  CREATE TABLE IF NOT EXISTS `phi_dev.raw_ad_data` (
    execution_id     STRING NOT NULL,
    client_id        STRING NOT NULL,
    campaign_id      STRING NOT NULL,   -- GADS-<google_campaign_id>
    adset_id         STRING NOT NULL,   -- ad_group.id
    ad_id            STRING NOT NULL,   -- ad_group_ad.ad.id
    date             DATE   NOT NULL,
    ad_name          STRING,
    ad_status        STRING,
    impressions      INT64,
    clicks           INT64,
    cost             FLOAT64,
    conversions      INT64,
    conv_value       FLOAT64,           -- conversions_value (p/ ROAS)
    -- janelas multi-periodo (espelhar raw_campaign_data: d1/3d/7d se mantido)
    data_source      STRING,
    platform         STRING,
    ingestion_status STRING,
    ingestion_step   STRING,
    ingested_at      TIMESTAMP NOT NULL
  )
  PARTITION BY date
  CLUSTER BY client_id, campaign_id;
  -- + VIEW raw_adset_data_rollup: SUM(aditivas) GROUP BY client_id, campaign_id, adset_id, date
  ```
  Ajustar contra o schema real de `raw_campaign_data` (pode ter `revenue`,
  janelas `_3d`/`_7d`, etc.).
- Decidir `INSERT` streaming vs `MERGE` idempotente. **Recomendado MERGE** (chave
  `client_id, campaign_id, adset_id, ad_id, date`) — o re-run não duplica
  (mesmo problema que motivou o lote L1.6 do Agregador).

**Fase 3 — Adaptar o `sw metricas anuncios copy`:**
- `Code Montar SQL`: trocar alvo `raw_campaign_data` → `raw_ad_data`; chave incluir
  `adset_id` + `ad_id`; mapear `ad_group.id`/`ad.id`/`ad.name`/`status` do retorno GAQL.
- Garantir `client_id`/`campaign_id` derivados certos (hoje usa `GADS-<google_id>`).
- Manter o resto do pipeline (observação Notion, tendências) ou podar o que for de
  campanha e não se aplica a anúncio — decisão de escopo com o Olavo.

**Fase 4 — Smoke (phi_dev, cliente piloto):**
- Rodar para 1 cliente com anúncios reais (CLI-4 tem ads Google).
- Validar `raw_ad_data`: 1 linha por (ad_id, date); aditivas batem com o GAQL;
  rollup de adset (VIEW) soma certo.
- Re-run idempotente (MERGE não duplica).
- PMAX → 0 linhas, sem erro.
- Só então promover phi_dev → phi_prod.

## 6. Restrições e guardas (obrigatório)

- **phi_dev primeiro, phi_prod só após smoke verde.** Nunca testar direto em prod.
- **Mojibake:** ao editar Code nodes via `update_workflow`, preservar acentos
  verbatim e fazer grep `Ã` pós-edit (refs de node e properties têm acento). Em
  caso de mojibake, corrigir na **UI** do n8n (não re-MCP).
- **Segurança:** `google_developer_token` aparece **em claro** no `Set dados` do
  Agregador (e provavelmente aqui) — não imprimir o valor em commits; entra no
  backlog de rotação. Não trocar credencial sem pedido do Olavo.
- **D5:** Search Terms **não** persistem em BQ.
- **ADR-010:** não reescrever `raw_campaign_data` por este workflow.
- **Não publicar / não ativar** o workflow sem smoke verde; ele está `active:false`.
- **Commits** terminam com o footer Co-Authored-By + Claude-Session do projeto.

## 7. Artefatos & IDs (tudo num lugar)

| Item | Ref |
|---|---|
| Workflow anúncios (foco) | `sw metricas anuncios copy` — `vVAdXAJh6MW2Z5Hp` (active:false) |
| Workflow campanhas (template) | `sw metricas campanhas` — `W571K320aqIHsdtH` (active:true) |
| Orquestrador | `operador unico metricas` — `cLcimNoefTOnVVbd` (tem trigger) |
| PHI Agregador T28 (contrato) | `4sdG2UKMCBuFq8xn` |
| Arquitetura 4 camadas + D15/ADR-24 | `docs/strategic-planning/saude-digital/BRUTO-v0.1-arquitetura-saude-digital.md` |
| ADR-24 bottom-up | `docs/strategic-planning/saude-digital/adr-rascunhos/ADR-24-granularidade-bottom-up-rollup.md` |
| DDL t28_* (modelo adset/criativos_json) | `docs/strategic-planning/agregador-t28/ddl/phi_prod_t28_tables.sql` |
| Lógica do SQL builder de campanha | `docs/code_montar_sql_logic.md` |
| Estado mestre | `docs/strategic-planning/ESTADO-DO-PROJETO.md` (§3.8) |

## 8. Primeiras perguntas que o sub-chat deve fazer ao Olavo

1. **Granularidade (reabre D15):** opção **A** — criar `raw_ad_data` (grão anúncio)
   + VIEW de rollup de adset [recomendado], ou **B** — manter D15 e só preencher
   `criativos_json` em `t28_adset` (sem tabela de anúncio)? *(A recomendação deste
   doc é A; mas a decisão é do Olavo porque mexe na D15.)*
2. **Escopo do pipeline:** o `sw metricas anuncios copy` deve manter o ramo de
   observação Notion + tendências (como o de campanha), ou só fazer ingestão BQ
   nesta primeira etapa?
3. **Adset agora ou depois:** começar ad-only (rollup de adset por VIEW) e tratar
   adset dedicado / impression_share só quando uma análise pedir — confirma?
4. **Cardinalidade da chamada GAQL:** pode bateladar por campanha (1 request → N
   ads) ou há razão para manter 1-ad-por-request?

---

**Fim do bootstrap.** Ao abrir o sub-chat, começar pela Fase 0 (orientação) e
trazer as 4 perguntas da §8 antes de criar tabela ou editar o workflow.
