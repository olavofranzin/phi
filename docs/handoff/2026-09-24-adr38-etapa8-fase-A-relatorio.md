# [FASE A — RELATÓRIO] Etapa 8 do ADR-38 — tabela de dono por coluna de `raw_campaign_data`

> **Data:** 2026-09-24 · **Sub-chat:** Saúde Digital / ADR-38 etapa 8
> **Entrada:** `docs/handoff/2026-09-24-go-etapa8-fase-A-com-o-que-mudou.md`
> 🔴 **PARADA OBRIGATÓRIA ATINGIDA.** A Fase B e a Fase C **não** foram iniciadas.
> **A Fase C não começa sem o Olavo reconfirmar o D1 com esta tabela na mão.**

---

## 0. As quatro linhas que decidem

| # | Achado | Consequência para o D1 |
|---|---|---|
| **1** | **`revenue` é a ÚNICA coluna que se perde ao aposentar o writer 2.** Todas as outras 14 que ele escreve, o writer 1 também escreve | confirma a B.1 — **com evidência de coluna, não mais por inferência** |
| **2** | 🆕 **O writer 2 é o ÚLTIMO a escrever os números de todo dia.** `ingested_at` = **07:01 BRT** em todas as linhas do CLI-4 | aposentá-lo **troca a fonte de `cost`/`conversions`** da rodada das 07h para a das 04h. **Não está no plano** |
| **3** | 🆕 **Em 22/09 o writer 2 foi a única razão de a linha de 21/09 existir.** As duas rodadas do writer 1 falharam; ele inseriu | ele é **rede de contenção de fato**, não só redundância |
| **4** | 🆕 **12 das 32 colunas não têm writer nenhum, e nunca tiveram dado.** 0 linhas preenchidas em 505 | violam o **M11**. **Candidatas a sair, não a migrar** |

---

## 1. Como a prova foi feita

**Três fontes, cruzadas** — nenhuma conclusão vem de uma só:

| Fonte | O que deu |
|---|---|
| `activeVersion` dos dois writers, **relida em 24/09** (R13) | as colunas de cada `INSERT` e de cada `WHEN MATCHED` |
| `phi_prod.INFORMATION_SCHEMA.COLUMNS` + `COUNTIF(... IS NOT NULL)` por `ingestion_step` | quais colunas têm dado, e de quem |
| `activeVersion` dos **quatro leitores** | quem lê cada coluna (M11) |

> ✅ **Os dois writers estão `sameAsDraft: true`** — o que li é o que roda.
> `sw metricas campanhas` = `752e5300` · `PHI - Subworkflow Campanhas` = `4f42b244`.

### 1.1. A impressão digital — o método que fechou a prova

Cada writer tem **colunas exclusivas**, e elas funcionam como assinatura:

- **só o writer 1** escreve `cost_3d`, `conversions_3d`, `cost_7d`, `conversions_7d`, `data_source`
- **só o writer 2** escreve `revenue`

Então, numa linha qualquer, **`revenue` preenchido prova que o writer 2 a tocou** e **`cost_3d` preenchido
prova que o writer 1 a tocou** — independentemente do que o `ingestion_step` diga.

---

## 2. 🔴 A tabela de dono por coluna — `raw_campaign_data` (32 colunas)

**W1** = `sw metricas campanhas` (`W571K320aqIHsdtH`), nó `Code Montar SQL` → `Execute SQL inserir daily entry` · carimba `DAILY_ENTRY` · 00h e 04h BRT
**W2** = `PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`), nó `Execute SQL  INSERT raw_campaign_data` · carimba `GADS_INSERT` · 07h BRT

| # | Coluna | Escreve no `INSERT` | **Atualiza no `WHEN MATCHED`?** | Quem lê | Veredito |
|---|---|---|---|---|---|
| 1 | `execution_id` | W1 · W2 | 🔴 **NENHUM** | Agregador · motor do score (`source_execution_id`) | **fica com quem criou a linha** — mesma doença do `ingestion_step` |
| 2 | `client_id` | W1 · W2 | — (chave) | score · Vigia · Agregador | ✅ |
| 3 | `campaign_id` | W1 · W2 | — (chave) | score · Vigia · Agregador · Série Diária | ✅ id nativo nos dois (ADR-38) |
| 4 | `date` | W1 · W2 | — (chave) | todos | ✅ |
| 19 | `platform` | W1 · W2 | W1 (inócuo: está na chave) | score · Vigia · Agregador | ✅ |
| 5 | `impressions` | W1 · W2 | **W1 · W2** | Agregador · Série Diária | ⚠️ **os dois sobrescrevem** |
| 6 | `clicks` | W1 · W2 | **W1 · W2** | Agregador · Série Diária | ⚠️ idem |
| 7 | `cost` | W1 · W2 | **W1 · W2** | **score** · Agregador · Série Diária | 🔴 **idem — e alimenta o score** |
| 8 | `conversions` | W1 · W2 | **W1 · W2** | **score** · Agregador · Série Diária | 🔴 **idem — e alimenta o score** |
| 10 | `primary_metric_goal` | W1 · W2 | **W1 · W2** | **score** | 🔴 idem |
| 32 | `primary_metric_type` | W1 · W2 | **W1 · W2** | **score** | 🔴 idem — **a coluna nova do ADR-40 (21/09) nasceu com dois donos** |
| 11 | `ingestion_status` | W1 · W2 | **W1 · W2** | score (`WHERE`) · `Buscar ID de Sucesso Hoje` | ⚠️ idem |
| 13 | `ingested_at` | W1 · W2 | **W1 · W2** | 🔴 **ninguém** | ⚠️ viola M11 — mas é o **relógio que denuncia quem escreveu por último**. Ver §3 |
| **9** | **`revenue`** | 🔴 **só W2** | 🔴 **só W2** | **Agregador** (`conv_value`) | 🔴🔴 **A ÚNICA PERDA REAL DA FASE C** |
| 12 | `ingestion_step` | W1 · W2 | 🔴 **NENHUM** | score (`ORDER BY`) · **Agregador (`ORDER BY` + grava em `t28_campaign`)** | 🔴 **o carimbo mente.** Ver §3 |
| 14 | `cost_3d` | só W1 | só W1 | 🔴 **ninguém** | 🔴 **viola M11 — o motor recalcula.** Ver §4 |
| 15 | `conversions_3d` | só W1 | só W1 | 🔴 **ninguém** | 🔴 idem |
| 16 | `cost_7d` | só W1 | só W1 | 🔴 **ninguém** | 🔴 idem |
| 17 | `conversions_7d` | só W1 | só W1 | 🔴 **ninguém** | 🔴 idem |
| 18 | `data_source` | só W1 | só W1 | Agregador | ✅ **dono único** — o único caso limpo da tabela |
| 20 | `primary_metric_target` | 🔴 **ninguém** | ninguém | ninguém | 🔴 **0 de 505 linhas** |
| 21 | `active_view_impressions` | 🔴 ninguém | ninguém | ninguém | 🔴 0 de 505 |
| 22 | `average_cpm` | 🔴 ninguém | ninguém | ninguém | 🔴 0 de 505 |
| 23 | `average_cpc` | 🔴 ninguém | ninguém | ninguém | 🔴 0 de 505 |
| 24 | `phone_calls` | 🔴 ninguém | ninguém | ninguém | 🔴 0 de 505 |
| 25 | `bidding_strategy_type` | 🔴 ninguém | ninguém | ninguém | 🔴 0 de 505 |
| 26 | `target_cpa_micros` | 🔴 ninguém | ninguém | ninguém | 🔴 0 de 505 |
| 27 | `target_roas` | 🔴 ninguém | ninguém | ninguém | 🔴 0 de 505 |
| 28 | `ad_network_search` | 🔴 ninguém | ninguém | ninguém | 🔴 0 de 505 |
| 29 | `ad_network_display` | 🔴 ninguém | ninguém | ninguém | 🔴 0 de 505 |
| 30 | `ad_network_partners` | 🔴 ninguém | ninguém | ninguém | 🔴 0 de 505 |
| 31 | `top_search_terms` | 🔴 ninguém | ninguém | ninguém | 🔴 0 de 505 |

### 2.1. O placar

| | quantas |
|---|---|
| colunas na tabela | **32** |
| escritas por algum writer | **20** |
| **escritas pelos DOIS** (colisão) | **13** |
| exclusivas do W1 | **5** (`cost_3d`, `conversions_3d`, `cost_7d`, `conversions_7d`, `data_source`) |
| **exclusivas do W2** | **1** (`revenue`) |
| **sem writer nenhum** | **12** |
| **sem leitor nenhum** (viola M11) | **17** — as 12 órfãs + as 4 janelas + `ingested_at` |

---

## 3. 🔴 O `ingestion_step` mente **nos dois sentidos** — e agora há prova dos dois

O go (§2.3) descrevia **um** sentido: carimbo do primeiro, números do último.
**O dado mostra os dois**, e cada um tem linhas em produção:

| Sentido | Evidência | Linhas |
|---|---|---|
| carimbo `DAILY_ENTRY` (W1 criou) **com `revenue` preenchido** — que só o W2 escreve | o W2 tocou uma linha carimbada com o nome do W1 | **28** |
| carimbo `GADS_INSERT` (W2 criou) **com `cost_3d` preenchido** — que só o W1 escreve | o W1 tocou uma linha carimbada com o nome do W2 | **2** (21/09) |

### 3.1. O relógio confirma, e vai além

`ingested_at` das linhas do CLI-4 é **07:0x BRT em todos os dias de 09/09 a 23/09** — enquanto
`execution_id` é `EXEC-DE-2026…0300xx`, ou seja, **00h BRT**.

> **Tradução:** a linha é **criada** pelo W1 à meia-noite, **atualizada** pelo W1 às 04h, e
> **atualizada de novo pelo W2 às 07h**. O carimbo diz `DAILY_ENTRY`; **os números finais são do W2**.

### 3.2. 🔴 Mas o efeito hoje é INERTE — e é importante não exagerar

O desempate do score é `ROW_NUMBER() OVER (PARTITION BY client_id, platform, campaign_id, date
ORDER BY CASE WHEN ingestion_step = 'DAILY_ENTRY' THEN 0 ELSE 1 END)`.

**Os dois writers usam essa mesma chave no MERGE.** Logo **nunca há mais de uma linha por partição**,
`rn = 1` sempre, e **o `ORDER BY` nunca escolhe nada.** O defeito é real e **está armado**, mas não
dispara enquanto a chave for compartilhada.

> ⚠️ **Onde ele NÃO é inerte:** o **Agregador** lê `ingestion_step` e o **grava em `t28_campaign`**
> como `source_ingestion_step`. Ali o carimbo mentiroso **vira dado persistido** e viaja para o T28.
> 🔴 **E o `PARTITION BY` do Agregador é `(client_id, campaign_id, date)` — sem `platform`** (viola M2
> por omissão, igual à chave do `t28_campaign`).

**Conforme instruído, não consertei.** Some com a Fase C.

---

## 4. 🆕 As quatro colunas de janela não têm leitor — o motor recalcula

`cost_3d`, `conversions_3d`, `cost_7d`, `conversions_7d` são escritas pelo W1 **todo dia**, nas 505 linhas.
**Ninguém as lê.** O motor do score monta as janelas ele mesmo, a partir de `cost` e `conversions` diários:

```sql
SUM(cost) AS cost_7d,
SUM(IF(date >= DATE_SUB(…, INTERVAL 3 DAY), cost, 0)) AS cost_3d
```

> **Isto não é trivial:** são as **únicas 4 colunas que justificariam manter o W1 como dono de algo
> além do básico** — e elas não servem a ninguém. **Candidatas a sair, não a migrar** (M11).

---

## 5. O que a Fase C mata — a lista fechada

Aposentar o `PHI - Subworkflow Campanhas` (W2) remove **três** coisas, não uma:

| # | O que morre | Gravidade | Quem se importa |
|---|---|---|---|
| **1** | **`revenue` em `raw_campaign_data`** | 🔴 **bloqueio da Fase C** | **Agregador** lê como `conv_value` → T28 |
| **2** | o `UPDATE` de `client_config.primary_metric_type` | 🟡 **já endereçado** | é o **passo B3 do ADR-39+40**, de outro sub-chat |
| **3** | o **único leitor** de `phi_prod.client_goal_history` | 🟡 | a tabela fica sem leitor (M11) |

### 5.1. E uma coisa que a Fase C **troca** — não estava no plano

Hoje os números que o score consome (`cost`, `conversions`) são os da leitura das **07h**.
Sem o W2, passam a ser os da leitura das **04h**.

> 🟡 **É estimativa, não fato medido:** o Google Ads amadurece atribuição ao longo do dia, então
> esperar-se-ia número menor às 04h que às 07h. **Não medi a diferença** — teria de comparar valores
> antes e depois da rodada das 07h, e o histórico não guarda o valor intermediário.
>
> **É exatamente o que o D4 (re-puxe D-1..D-3) existe para compensar** — o que amarra a **P-20** à
> decisão da Fase C, e não só à Fase B.

### 5.2. 🔴 E o caso de 22/09, que muda o peso do argumento

As duas rodadas do W1 em 22/09 **falharam** (execuções `41749` às 00h e `41806` às 04h).
As linhas de 21/09 existem **porque o W2 rodou às 07h e as inseriu** — são exatamente as 2 linhas
`GADS_INSERT` da tabela.

> **O W2 não é só redundância: em 22/09 ele foi a única ingestão do dia.** Aposentá-lo sem o D4
> (que re-puxa D-1..D-3 e recuperaria o dia seguinte) **remove a rede que já pegou uma queda.**

---

## 6. Hipótese levantada e **refutada** (R6)

| Hipótese | Por que levantei | O que o dado disse |
|---|---|---|
| *"a porta das 04h está fechada"* — o nó `Schedule Trigger` (`executeWorkflowTrigger`) do W1 está **`disabled: true`**, e é por ele que o `operador unico metricas` chama o workflow | seria a R12 outra vez (`[P5] Entrada` desabilitado no smoke de 16/09) | 🔴 **REFUTADA.** As execuções mostram **duas rodadas todo dia**: `mode: trigger` às 03:00 UTC (00h BRT) e `mode: integrated` às 07:00 UTC (**04h BRT**). A chamada como subworkflow **funciona** apesar do nó desabilitado |

> **Registrado para não ser levantado de novo** (corolário da R6). O nó desabilitado é **vestígio**,
> não bloqueio — mas continua sendo ruído, porque o próximo leitor tropeça nele como eu tropecei.

---

## 7. Divergências com a doc canônica — o que corrigir (R6 / R2)

| Onde | Dizia | É |
|---|---|---|
| `CONTRATO-PHI.md` §4.1, linha `raw_campaign_data` | *"o desempate `DAILY_ENTRY`-primeiro no SQL do score **nunca é acionado**"* | ✅ **confirmado** — e agora com o porquê explícito (chave compartilhada ⇒ `rn=1` sempre) |
| `CONTRATO-PHI.md` §3, **M7** | *"a linha fica `DAILY_ENTRY` … carregando os números que o `GADS_INSERT` gravou às 07h"* | ✅ **confirmado, e incompleto**: o sentido inverso também existe (2 linhas `GADS_INSERT` com números do W1) |
| brief da etapa 8, §5 B.1 | `revenue` NULL em 472, preenchido em 18 | **hoje: 28 preenchidas** (o W2 seguiu rodando). A conclusão **não muda** |
| `ADR-37` §2.2 (matriz) | — | **não contém grão de coluna.** A tabela do §2 acima é a primeira que existe nesse grão |

---

## 8. ⛔ O que NÃO foi feito, e por quê

| | Motivo |
|---|---|
| **Fase B e Fase C** | parada obrigatória do go. **Nada em produção foi alterado nesta fase** |
| conserto do `ingestion_step` | fora de escopo por instrução — some com a Fase C |
| conserto do `execution_id` (mesmo defeito, §2 linha 1) | **mesma razão**, e não foi pedido. **Registrado aqui para não se perder** |
| remoção das 12 colunas órfãs | não é da etapa 8. **Vira pendência P-31** |
| `workflow_execution_log` · `client_config` | fora de escopo por instrução |

### 8.1. Estado do outro sub-chat (§2.2 do go) — **reportado, não coordenado**

🟡 **O nó `Execute SQL client_config sincronizado` AINDA ESTÁ NO WORKFLOW**, ativo e conectado
(`Execute SQL  INSERT raw_campaign_data` → ele → `Fim subworkflow`).
Versão no ar `4f42b244`, **atualizada em 21/09 19:44** — nada mudou desde então. **O B3 não foi executado.**

🔴 **E o prazo do `COALESCE` venceu.** O comentário dentro do nó `Calcular e Persistir PHI Score` diz:
*"PRAZO DO COALESCE: 22/09/2026. Se esta data passou, remova."* — **passou anteontem.** Não é meu
escopo; **é do ADR-39+40.** Reportado aqui como o go mandou.

---

## 9. R12 — configuração mexida nesta sessão

| O quê | Estado ao fechar |
|---|---|
| `TMP - A6 BigQuery Audit` (`m8unFD0ksEc1Zvbk`) — troquei a query 3× para as leituras desta fase | **workflow inativo** (`active: false`), gatilho não dispara. Ficou com a última query da §2, **rotulada no próprio SQL**. Nenhum efeito em produção |
| produção | 🔴 **nada foi alterado.** Zero `update_workflow` em workflow ativo nesta fase |

---

## 10. 🔴 O que o Olavo precisa decidir para a Fase C começar

| # | Pergunta | O que a tabela responde |
|---|---|---|
| **D1** | aposentar o W2? | **Só depois do `revenue` no W1** (Fase B.1). É a única perda de dado — **confirmado no grão de coluna** |
| **D1-b** 🆕 | aceitar que `cost`/`conversions` passem da leitura das 07h para a das 04h? | **não está no plano.** Amarra a **P-20/D4** à Fase C, não só à Fase B |
| **D1-c** 🆕 | aceitar perder a rede que salvou 21/09? | o W2 foi a **única ingestão** naquele dia |
| **P-31** 🆕 | as 12 colunas órfãs saem? | 0 de 505 linhas, 0 leitores. **Sair, não migrar** |
| **P-32** 🆕 | as 4 colunas de janela saem? | 505 de 505 preenchidas, **0 leitores** — o motor recalcula |

---

## 11. Como eu verifico que esta tabela está certa

| Afirmação | Como se refaz |
|---|---|
| quem escreve cada coluna | reler `Code Montar SQL` (W1) e `Execute SQL  INSERT raw_campaign_data` (W2) na `activeVersion` e conferir as listas do `INSERT` e do `UPDATE SET` |
| quais colunas têm dado | `COUNTIF(<col> IS NOT NULL)` agrupado por `ingestion_step` — **sempre com `COUNT(*)` ao lado** (M4) |
| quem lê cada coluna | os 4 nós: `Calcular e Persistir PHI Score` · `[T28] BQ Read raw_campaign_data` · `Buscar lacunas de ontem` · `Code Prep Tendência` |
| a impressão digital | `revenue IS NOT NULL` ⇒ W2 tocou · `cost_3d IS NOT NULL` ⇒ W1 tocou |

> ⚠️ **Limite declarado:** a lista de leitores é a do as-built de 20/09, que varreu o parque. **Reli os
> quatro nós**, coluna por coluna. **Não refiz a varredura do parque inteiro** — se um leitor novo
> apareceu entre 20 e 24/09, ele não está aqui.
