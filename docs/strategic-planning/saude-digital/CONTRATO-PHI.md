# CONTRATO DO PARQUE PHI — documento canônico

| | |
|---|---|
| **Status** | 🟢 **v1.0 — LEI, desde 2026-09-20.** A entrevista do §9 foi respondida pelo Olavo em 20/09 (3 rodadas) e o **§4 foi preenchido com leitura do artefato**, não com dedução |
| **As-built** | ✅ **Lido em 2026-09-20** — 27 das 30 perguntas da Lista A respondidas nos nós da `activeVersion` e no histórico de execuções. Relatório completo: `docs/handoff/2026-09-20-parque-phi-lista-A-as-built.md` |
| **Células ❓ restantes** | **5**, todas com motivo declarado: 3 dependem de acesso ao BigQuery, 1 de ligar o MCP access de um workflow, 1 é pergunta de produto. Ver §4.4 |
| **Decisões** | ✅ **D1–D6 tomadas + D7–D11 novas**, todas em 2026-09-20 — ver §6 |
| **Escopo** | Quem grava o quê em `phi_prod`, nos campos PHI do Notion e no Telegram — da métrica crua até a tarefa no Notion |
| **Não cobre** | **Prospecção** (planilha `leads` + CRM Odoo) — já normatizada pelo `CONTRATO-PROSPECCAO` + ADR-35/36. **Não tocar**. E, por decisão do Olavo em 20/09: **Onboarding** (7× `Onb - *`), **`WF-EXEC-*`** (execução de demandas) e **`L1 - Abertura de Projeto`** — ver D6 |
| **Decisor** | Olavo |
| **Documentos-pai** | `ADR-37` (um destino, um dono) · `ADR-38` (identidade neutra) · `ADR-003` (autoridade do score) · `ADR-010` (writer único) |
| **Base factual** | 🔴 **`docs/handoff/2026-09-20-parque-phi-lista-A-as-built.md`** (leitura nó a nó — **é esta que vence**) · `panorama-workflows-phi.md` (2026-09-19, ⚠️ contém 2 afirmações que o as-built refutou) · `docs/handoff/2026-09-08-consolidacao-writers-lote1-inventario.md` |
| **Modelo** | `CONTRATO-PROSPECCAO.md` — mesma forma, outra frente |

> **Regra de precedência** (copiada do contrato da Prospecção, porque funcionou):
> divergência entre este contrato e um workflow é **bug do workflow**.
> Divergência entre este contrato e o BigQuery real é **bug do contrato** — corrigir aqui primeiro.

---

## 0. Por que este documento existe

O `CONTRATO-PROSPECCAO` nasceu quando descobrimos que não dava para responder *"quem grava, quem
apaga e quem some com registro"* na planilha `leads`. **No PHI a pergunta é a mesma, e a resposta
hoje também é "não sei".** O que já encontramos, com o sistema em produção:

| Achado | Consequência |
|---|---|
| Duas cadeias escrevem `raw_campaign_data` todo dia | Cada linha mistura duas origens · o rótulo de uma apaga o da outra |
| `client_config` insere em `phi_dev`, o score lê `phi_prod` com `INNER JOIN` | **Cliente novo nunca entra no score** — sem erro, sem alarme |
| `raw_ad_data` vazia desde 30/06, com 2 workflows ativos escrevendo nela | 3 meses de dado que ninguém coletou — e ninguém notou |
| Checagem de unicidade devolvendo 0 itens no caso saudável | **Fase 3 morta 8 dias**, verde todo dia |
| `WHERE campaign_id = 'GADS-' + id` depois do ADR-38 | *"sem histórico"* em campanha com **250 dias** de série |
| 12 workflows ativos sem uma linha de descrição | A auditoria precisa **perguntar ao Olavo** para entender — teste da **R5** reprovado |

**Nenhum desses é um bug difícil. Todos são consequência de não haver dono declarado por destino —
e de não haver consumidor declarado por dado.**

---

## 1. Princípio duplo

> **1. Um destino, um dono.** (herdado do ADR-37)
> Cada tabela do BigQuery e cada campo do Notion tem **um** workflow autorizado a escrevê-lo. Todos
> podem ler; nenhum outro escreve — **nem para "corrigir"**.
>
> **2. Um dado, um consumidor declarado.** (novo, e é a lição de 2026-09-18)
> Todo dado que se escreve tem **alguém nomeado que o lê**. Tabela sem leitor não é ativo: é custo
> de API, tempo de janela e superfície de erro.

O primeiro princípio impede o dado **errado**. O segundo impede o dado **inútil** — e é ele que
`raw_ad_data` quebrou por três meses sem que nada acendesse.

---

## 2. Arquitetura alvo — as 5 camadas

```
 (1) INGESTÃO ──▶ phi_prod.raw_campaign_data · raw_ad_data · client_config
 (2) CÁLCULO  ──▶ phi_score_history ──▶ phi_score_current (view)
 (3) ENTREGA  ──▶ Notion: Campanhas · Tasks · Checklist · Log de Otimizações
 (4) VIGILÂNCIA ▶ Telegram do Olavo
 (5) CONSUMO  ──▶ T28 (análise cognitiva) · execução de demandas · telemetria
```

| # | Camada | Papel — uma frase | Dono hoje |
|---|---|---|---|
| **1** | Ingestão | Traz da plataforma o número cru, sem interpretar. | `sw metricas campanhas` + `operador unico metricas` |
| **2** | Cálculo | Transforma número em **score, classificação e severidade**. Fato, não opinião. | `PHI - Pipeline_v2` |
| **3** | Entrega | Põe o diagnóstico **onde o gestor trabalha**. | `PHI - Pipeline_v2` (Fase 3) + `PHI - Fechar Otimização` |
| **4** | Vigilância | Grita quando a camada 1, 2 ou 3 **não fez o que devia**. | `Vigia de Frescor` + `Alerta de Falha` |
| **5** | Consumo | Lê o score e produz **análise, demanda ou relatório**. | ✅ **T28** — `PHI — Agregador de Métricas Multi-fonte` + `WF-T28-Error-Handler`. Decidido em D4 |

**Tudo o que não ocupar uma destas cinco camadas é arquivado pelo procedimento da R5.**

---

## 3. Invariantes M1–M12 — o que não muda sem ADR

Numerados **M** (de Mídia) para não colidir com os **I1–I11** da Prospecção.

| # | Invariante | Onde já nos mordeu |
|---|---|---|
| **M1** | **Um destino, um dono.** Exceção única: mesmo workflow, em sequência, **colunas disjuntas e declaradas** (padrão S4) | 2 writers em `raw_campaign_data` |
| **M2** | **Identidade neutra.** `campaign_id` = **ID nativo sem prefixo**; a plataforma mora em `platform`. Chave: `(client_id, platform, campaign_id, date)` | ADR-38 · o `'GADS-' + id` que matou a Série Diária |
| **M3** | **`client_id` sempre preenchido.** Linha sem cliente é linha órfã | P-11 do ADR-37 |
| **M4** | 🔴 **Zero nunca é ausência.** `conversions=0 ⇒ CPA/ROAS indefinidos`; `source_status error/missing ⇒ N/D`, **nunca 0**. Query agregada traz junto **a contagem do que casou** | guardrails 8/9 · R11 regra 5 · I3 da Prospecção |
| **M5** | **O score é fato.** Ninguém recalcula `phi_value`, flags ou severidade fora da camada 2 | ADR-003 |
| **M6** | 🔴 **A ordem da Fase 3 é imutável:** Fechamento → Escalada → Abertura | Regra Crítica nº 11 · quase quebrada na Fase 0.2 do ADR-37 |
| **M7** | 🔄 **`ingestion_step` não é linhagem.** ⚠️ **Corrigido pelo as-built de 20/09:** ele diz **quem tocou PRIMEIRO**, não por último. Os dois writers de `raw_campaign_data` respeitam o ADR-37 I2 e **não atualizam o campo no `WHEN MATCHED`** — então a linha fica `DAILY_ENTRY` (quem inseriu às 00h) carregando os números que o `GADS_INSERT` gravou às 07h | S1b do ADR-37 · A13 do as-built |
| **M8** | **O PHI detecta, classifica e orienta. Nunca executa otimização** | princípio central do produto |
| **M9** | **Um ambiente só: `phi_prod`.** Nenhum workflow de produção escreve ou lê `phi_dev` | `client_config` · `WF-T28-Orquestrador` |
| **M10** | 🔴 **Todo workflow ativo tem saída observável.** Se ninguém sabe dizer o que ele produziu ontem, ele não está no ar — **está ligado** | `raw_ad_data` vazia 3 meses, verde |
| **M11** | **Todo dado escrito tem consumidor declarado** (o princípio 2 do §1) | o grão de anúncio |
| **M12** | **Escrita idempotente.** MERGE por chave, `Always Output Data = true` no nó de INSERT/MERGE. Rodar duas vezes o mesmo dia não duplica | Regra Crítica nº 2 |

> ⚠️ **M10 e M11 são novos.** Saíram da semana de 09 a 18/09 e são a diferença entre este contrato e
> o da Prospecção: lá bastava dizer **quem escreve**; aqui é preciso dizer também **quem lê e como
> se prova que houve produção.**

---

## 4. Matriz de propriedade — **AS-BUILT (lido em 2026-09-20)**

> ✅ **Esta tabela foi lida nos nós**, na `activeVersion` de cada workflow (R13), e nas execuções reais de
> 19/09. **Não é mais alvo: é o que roda.** Cada linha tem o nó exato que escreve.
> Detalhe e evidência de cada célula: `docs/handoff/2026-09-20-parque-phi-lista-A-as-built.md`.
>
> **Coluna "Estado":** ✅ conforme · ⚠️ funciona mas viola invariante · 🔴 defeito ativo · ❓ não lido (motivo em §4.4)

### 4.1. BigQuery `phi_prod`

> 🟡 **ATUALIZADO EM 2026-09-21 — Fase A do ADR-39+40 (aditiva).** Três linhas desta tabela mudaram
> e estão marcadas **`[21/09]`** abaixo. **Nada foi removido**: o `phi_dev` segue de pé e o writer
> de `client_config` segue onde estava — isso é a **Fase B**, que ainda não começou.
> Relatório: `docs/handoff/2026-09-21-adr39-adr40-fase-A-relatorio.md`.

| Destino | Dono real (nó que escreve) | Momento | Consumidor declarado | Estado |
|---|---|---|---|---|
| `raw_campaign_data` **`[21/09]`** | **2 writers.** `sw metricas campanhas` (`W571K320aqIHsdtH`), nó `Execute SQL` do `Code Montar SQL` → `ingestion_step='DAILY_ENTRY'` · **e** `PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`), nó `Execute SQL  INSERT raw_campaign_data` → `'GADS_INSERT'` | 00h e 04h (1º) · 07h (2º) | `PHI - Pipeline_v2` · `PHI — Agregador` · `PHI - Vigia de Frescor` | 🔴 **viola M1.** Os dois usam a **mesma chave** `(client_id, platform, campaign_id, date)` → **não duplicam linha; um sobrescreve os números do outro em silêncio.** O desempate `DAILY_ENTRY`-primeiro no SQL do score **nunca é acionado**.<br>🟡 **[21/09] Os dois passaram a gravar `primary_metric_type`** — a Métrica-Mãe da campanha (ADR-40). Campanha sem Métrica-Mãe grava **vazio, nunca `'ROAS'`** (REQ-1). Versões no ar: `752e5300` e `4f42b244`. ✅ **[22/09] os dois exercidos com dado** (exec 41967).<br>🔴 **[22/09] achado novo: o `ingestion_step` mente.** O `WHEN MATCHED THEN UPDATE SET` do `sw metricas campanhas` **não atualiza `ingestion_step`** — quando os dois tocam a mesma linha, **o carimbo fica com o primeiro e os números com o último**. E é justamente esse campo que o desempate do score usa (`ORDER BY CASE WHEN ingestion_step='DAILY_ENTRY'…`). Pré-existente; some com a Fase 2 do ADR-37 |
| `raw_ad_data` | **`sw metricas anuncios`** (`vVAdXAJh6MW2Z5Hp`), nós `Execute SQL inserir daily entry` e `BigQuery Persistir Sinais Criativo` (MERGE) | 04h | 🟡 **a criar** — decidido em D1: Notion + T28 + relatório | 🔴 **0 linhas.** Os dois nós **nunca executam**: o ramo morre no `IF Gate PMAX` com `_skip_reason: "sem_ad_id (PMAX ou GAQL vazia)"`. Causa raiz: a entrada é a DB Notion *Anúncios*, que só tem 2 anúncios **Meta**, e a Meta devolve 0 resultados |
| `raw_adset_data_rollup` (view) | 🔄 **ninguém. Nunca teve writer.** O `sw metricas conjuntos` **não tem um único nó de BigQuery** — ele escreve no **Notion** | — | — | 🔴 **vazia por não ter origem.** O panorama e o rascunho v0.1 deste contrato atribuíam a escrita ao `sw metricas conjuntos`: **estava errado** |
| `client_config` (**`phi_prod`**) | 🔴 **`PHI - Subworkflow Campanhas`**, nó **`Execute SQL client_config sincronizado`**: `UPDATE phi_prod.client_config SET primary_metric_type = …`. **Só essa coluna. Sem INSERT.** | 07h, 1× por campanha | `PHI - Pipeline_v2` (`INNER JOIN`) · `PHI - Vigia de Frescor` (`INNER JOIN`) | 🔴 **É ele que mantém o `CPA` do KIL correto — não uma correção manual.** Aposentar o Subworkflow (ADR-37 Fase 2) **mata este writer em silêncio**. E, por não ter INSERT, **cliente novo nunca entra**.<br>🟡 **[21/09] este `UPDATE` ficou sem função** — o tipo agora viaja com a campanha. **Ele sai no passo B3**, e a coluna sai do `client_config` no **B4**, junto com o `COALESCE` de transição (prazo escrito em sticky: **22/09/2026**) |
| `client_config` (**`phi_dev`**) | workflow **`client_config`** (`SI5NSzRb8lVUz74RwOhIT`), nó `Execute a SQL query` — **um MERGE só, `phi_dev` nas duas cláusulas** | Notion Trigger, poll 1h | **ninguém** | 🔴 **ambiente errado (M9).** Grava `primary_metric_type = 'ROAS'` **fixo** (`metricDefaultMap`), descarta cliente cujo `Segmento` não seja `'Negócio Local'`, e **nunca marca `is_active = false`**. **0 execuções** no histórico retido |
| `model_config` | **carga manual** — nenhum workflow escreve | — | `PHI - Pipeline_v2` (`INNER JOIN … mc.valid_until IS NULL`) | ✅ leitor declarado |
| `client_goal_history` | **carga manual** — nenhum workflow escreve | — | `PHI - Subworkflow Campanhas`, nó `Execute a SQL query` (*fallback* de `primary_metric_goal`) | ⚠️ o único leitor está no workflow que o ADR-37 manda aposentar |
| `phi_score_history` **`[21/09]`** | **`PHI - Pipeline_v2`**, nó `Calcular e Persistir PHI Score` (MERGE por `client_id`+`platform`+`campaign_id`+`calculated_date`) | 07h | `phi_score_current` · Notion · T28 | ✅ **writer único**.<br>🟡 **[21/09] passou a gravar `primary_metric_type` junto com o score** — a **régua congelada**, que não existia: agora dá para saber contra que métrica um score de julho foi julgado. No `INSERT` **e** no `UPDATE SET`. Versão no ar: `b880adee` (sticky do REQ-3 atualizado em 22/09 → `900bcc76`).<br>🔴 **[22/09] O motor só calcula `CPA`**: a porta de qualidade reprova qualquer outro tipo como `INSUFFICIENT_DATA` / `METRIC_TYPE_UNSUPPORTED`. Um cliente com `CPL` entra e sai com `phi_value` NULL. **Não é efeito do ADR-40 — é limitação que ele tornou visível.** Precisa de ADR próprio |
| `phi_score_current` (view) | — | — | `PHI - Pipeline_v2` (`Get All Current Scores`) · `WF-T28-Orquestrador` | 🔴 **devolve 3 linhas por campanha.** Medido em 19/09: 6 linhas para 2 campanhas, cópias idênticas → o score é escrito **3× na mesma página do Notion**. Causa exige BigQuery (§4.4) |
| `workflow_execution_log` | **`PHI - Pipeline_v2`**, 10 nós (`Log INGESTION/CALCULATION/OPERATIONAL RUNNING/SUCCESS/FAILED` + `Log Notion Mapping Missing`) | 07h | 🔴 **ninguém.** O nó `Buscar ID de Sucesso Hoje` **não lê esta tabela** — ele gera um `execution_id` e conta `raw_campaign_data` | 🔴 **viola M11.** 10 escritas/dia, 0 leituras |
| `t28_campaign` | **`PHI — Agregador`**, nó `[T28] BQ Merge t28_campaign` (`DATASET = 'phi_prod'`) | seg 09h · dia 1º 09h | `WF-T28-Orquestrador` — **que lê `phi_dev`** 🔴 | ⚠️ **chave `(client_id, campaign_id, business_date, janela)` — sem coluna `platform`.** Viola M2 por omissão: Google e Meta com o mesmo id nativo colidiriam |
| `t28_adset` · `t28_meta_campaign` | `PHI — Agregador` | idem | T28 | ⚠️ **os MERGE não executaram** em 14/09 — os filtros anteriores zeraram |
| `t28_ga4_landing` · `t28_clarity_daily` | `PHI — Agregador` | idem | T28 | ✅ escreveram em 14/09 |
| `t28_gbp_daily` | `PHI — Agregador` | idem | T28 | 🔴 **nunca recebe dado.** O `HTTP Request GBP` falha **toda rodada** com *"The service is receiving too many requests from you"* (cota) |
| `t28_errors` | **`WF-T28-Error-Handler`** (`rTS5pE34eElfuMPl`), chamado pelo nó `[Err] Call Handler` do Agregador | onError | ❓ **sem leitor conhecido** | ✅ **funciona e já disparou 4×** (07/09 e 14/09), sempre pelo erro de GBP. O `triggerCount: 0` engana: o gatilho é `executeWorkflowTrigger` |

### 4.2. Notion

| Campo / DB | Dono real (nó que escreve) | Momento | Estado |
|---|---|---|---|
| `Score Diário (0-100)` · `Status Geral da Campanha` · `phi_ultima_execucao` (Campanhas) | `PHI - Pipeline_v2`, nó **`Sync Scores to Notion`** | 07h | ⚠️ **escreve 3× por campanha** (ver `phi_score_current`). Regra Crítica nº 9 respeitada: nenhum outro nó toca `Score Diário` |
| `Otimização Ativa?` (Campanhas) | **os dois, em papéis disjuntos (padrão S4).** `PHI - Pipeline_v2` nós `Update otimização ativa` e `Auto-Close: Desativar Otimização` · `PHI - Fechar Otimização` nó `Desmarcar Otimização Ativa` | Pipeline 1×/dia · Fechar 1×/h | ✅ **confirmado no artefato.** O `Fechar Otimização` tem 8 nós e escreve **só este campo**: não abre, não limpa órfã. ❓ resolvido |
| Tasks (create) | `PHI - Pipeline_v2`, nó `Create a database page` — 20 campos | 07h | ✅ |
| Tasks (update) | `PHI - Pipeline_v2`, nós `Update a database page` (9 campos) · `Update Hipótese na Tarefa` (2) · `Update Escalar Tarefa` (`Prazo`) · `Auto-Close Task` (`Status`) | 07h · 1×/h | ✅ |
| Checklist | `PHI - Pipeline_v2`, nó `Create a database page chklist` — 6 campos | 07h | ✅ |
| Log de Otimizações | `PHI - Pipeline_v2`, nó `Criar Log Otimizacoes` — 12 campos | 07h | ⚠️ **único nó do Pipeline com `onError: continueRegularOutput` sem destino visível.** Se falhar, a ação fica sem registro e o Pipeline segue verde (R11 regra 2) |
| Conjuntos de Anúncios | **`sw metricas conjuntos`**, nó `Update database page Conjuntos` — 12 campos | 04h | ⚠️ **writer não declarado até hoje.** E grava `cpa`/`roas`/`ctr`/`cpc` **como `0`** quando o denominador é 0 — **quebra o M4 na tela do gestor** |
| DB Clientes | **humano (Olavo)** | — | ✅ **sem conflito de escrita.** Lida por `client_config`, `L1 - Abertura` e `WF-DOC-Telemetria`, escrita por nenhum. ❓ resolvido |
| `PHI - ANÁLISES` | `WF-T28-Analise-Campaign` (`fhYmJH0o9BW1IO4i`) | **inativo** | 🟡 rascunho |
| `Registro de Execuções (Sub-chats)` | **sub-chats** (R3) | por bloco | ✅ lido pelo Digest 08:30 |

### 4.3. Telegram — chatId `930549271`

| Mensagem | Dono | Gatilho | Estado |
|---|---|---|---|
| Workflow quebrou | `PHI - Alerta de Falha` (`UZ7sIE5cWrrO8xea`) | onError | 🔴 **cobre só 5 dos 26 ativos.** Ver §4.5 |
| Falta de dado ontem | `PHI - Vigia de Frescor` | 08h | ⚠️ olha `raw_campaign_data` e `phi_score_history`. **Não olha `raw_ad_data`, `t28_*` nem Notion.** E o ramo `SEM SCORE` usa o **mesmo `INNER JOIN` com `client_config`** que descarta o cliente — **é cego onde o defeito mora** |
| Progresso do projeto | `PHI — Digest Diário de Progresso` | 08:30 | ⚠️ **colide com a telemetria** — duas mensagens longas no mesmo minuto |
| Telemetria de Onboarding | `WF-DOC-Telemetria-Diaria` | 08:30 | ⚠️ **fora do contrato** (D6), mas escreve no mesmo Telegram, no mesmo minuto |
| Falha da rodada de métricas | `operador unico metricas`, nó `Interromper Apos Alerta` | 04h | ✅ |
| Setup de cliente incompleto | `L1 - Abertura de Projeto` | 09h | **fora do contrato** (D6) |
| Quality gate FAIL | `WF-EXEC-QualityGate-Pacing` | 5 em 5 min | **fora do contrato** (D6) |
| 🔴 **"o que devia acontecer não aconteceu"** | 🔴 **ninguém** | — | **é o buraco da camada 4** — ver D5 |

### 4.4. As 5 células que continuam ❓ — e por quê

| Célula | O que falta | Quem destrava |
|---|---|---|
| `raw_ad_data` — já teve linha alguma vez? | consulta a `phi_prod.__TABLES__` | **Olavo** ou sub-chat com credencial BigQuery |
| `phi_score_current` — por que 3 linhas por campanha? | 2 queries (escritas no §6 do as-built) | idem |
| `phi_dev.t28_campaign` — existe? tem dado? | 1 query | idem |
| `TMP - Evolution Header Echo` — o que faz? | **MCP access está desligado** no workflow | **Olavo**, 1 clique no card do n8n |
| `t28_errors` — **quem lê?** | não é leitura de artefato: é decisão de produto. O `WF-T28-Error-Handler` já cria tarefa e manda Telegram; **a tabela em si não tem leitor declarado** | **Olavo** — ou a tabela vira log sem consumidor (viola M11) |

> **Nenhuma delas é dedução pendente: são quatro leituras que este sub-chat não tinha como fazer.**
> As três primeiras cabem numa sessão com acesso ao BigQuery.

### 4.5. Cobertura do `errorWorkflow` — lida em `settings` (R13 item 4)

**Têm (5):** `operador unico metricas` · `PHI - Pipeline_v2` · `PHI - Subworkflow Campanhas` ·
`sw metricas campanhas` · `PHI - Vigia de Frescor`.

🔴 **Não têm (21 dos 26 ativos legíveis)** — e os que mais doem:
`sw metricas anuncios` e `sw metricas conjuntos` (**os dois que o operador chama às 04h**) ·
`PHI - Fechar Otimização` (24×/dia, escreve no Notion do gestor) · `client_config` ·
`PHI — Agregador`.

> **Consequência medida:** os 5 disparos de 17/09 vieram dos 5 workflows cobertos (4 deles), todos
> pela mesma causa — credencial OAuth do BigQuery expirada. **Não há alarme faltando: há workflow
> fora da cobertura.**

### 4.6. Versão publicada × rascunho (R13) — varredura de 2026-09-20

**25 dos 26 ativos legíveis têm `versionId == activeVersionId`.** O que está na tela é o que roda.

🔴 **A exceção:** `WF-EXEC-Intake-Pacing` (`9vyTlIJdvc5nf8Yk`) —
`versionId f481f60a-18fe-4de2-b4e7-8b9da2ce65db` ≠ `activeVersionId 87b911f2-c294-458e-94a1-9037b1ccf817`.
**Agravante:** tem **0 execuções**, então nenhuma execução denunciaria a diferença. Está **fora do
contrato** por D6, mas fica registrado aqui porque a varredura é do parque.

> `TMP - Evolution Header Echo` **não entrou na conta** (MCP access desligado). A leitura correta é
> **"1 em 26 lidos, com 1 não lido"** — não "1 em 27". Os 7 ativos da Prospecção ficaram fora por escopo.

## 5. As armadilhas desta frente (já custaram caro)

1. 🔴 **Verde não é produção.** Execução bem-sucedida que escreve zero linhas é o modo de falha desta
   casa. Antes de chamar um workflow de saudável, **conte os itens que chegaram ao nó de escrita**.
2. 🔴 **O rascunho mente.** `nodes` é o rascunho; o que roda é `activeVersion.nodes`. `triggerCount`
   conta gatilhos **ativos**. *"Não deu erro"* não é *"está no ar"* (**R13**).
3. 🔴 **Salvaguarda é código novo em produção.** A checagem de unicidade instalada para proteger o
   score **matou a Fase 3 por 8 dias**. O teste que falta nunca é *"ela pega o defeito?"* — é **"o
   que acontece no dia em que ela não pega nada?"**, que é todo dia.
4. **`phi_dev` está em produção sem ninguém ter decidido isso.** Dois workflows o usam. Não existe
   nota dizendo por quê.
5. **Dois scores no projeto.** Aqui é `phi_value` (campanha). `potencial_comercial` é lead, outra
   frente, outro ADR.
6. **Configuração mudada para teste não volta sozinha** (**R12**) — e nó desabilitado no n8n **não
   tem cor, não tem alarme e não aparece em lista nenhuma**.

---

## 6. Decisões — **tomadas por Olavo em 2026-09-20**

> Entrevista conduzida em **3 rodadas**, conforme o brief. As respostas estão **verbatim** no §6.7.
> A entrevista veio **antes** do contrato virar lei — a R9 praticada como deve.

| # | Decisão | Resposta do Olavo (20/09) | Consequência |
|---|---|---|---|
| **D1** | O grão de **anúncio/conjunto** faz parte do produto? | ✅ **SIM.** *"Sim, quero o anúncio culpado"* — e o grão de anúncio é a **prioridade dos próximos 15 dias** | `raw_ad_data` ganha dono e consumidor. `sw metricas anuncios` **não se aposenta: conserta-se.** A causa raiz já está isolada (§4.1) |
| **D1b** | Quem consome o grão? | **Três, não um:** a tela do Notion · o **T28** · um **relatório para o cliente**. **Não** entra no `phi_value` | O grão não mexe no ADR-34. Mas precisa ser **diário e persistido**, não só o snapshot semanal do Agregador |
| **D2** | `phi_dev` some, ou vira ambiente declarado? | ✅ **SOME.** Um ambiente só, `phi_prod` (M9) | Repontar o workflow `client_config` e o `WF-T28-Orquestrador`. ⚠️ **Não é repontar e pronto:** ver D3 |
| **D3** | Quem é o dono de `client_config`? | 🔴 **Reaberta pelo as-built.** O achado A10 mudou a pergunta: **já existem dois writers**, em ambientes diferentes, na mesma coluna | **Nenhuma ação antes de resolver isto.** ✅ **ADR-39 ACEITO em 20/09 (opção A)** (`adr-rascunhos/ADR-39-dono-unico-client-config.md`) — propõe o workflow `client_config` como dono único em `phi_prod`, com ordem obrigatória de 5 passos e 6 critérios de aceite. **Dono único: o workflow `client_config`, em `phi_prod`.** Destrava as Fases 3 e 2 do ADR-37, nessa ordem |
| **D4** | A camada 5 entra no contrato? | ✅ **T28 entra — é a camada 5.** `Agregador` + `WF-T28-Error-Handler` + tabelas `t28_*` | Já estava dentro de fato: o Agregador lê `raw_campaign_data` e escreve 6 tabelas em `phi_prod`. Agora está de direito |
| **D5** | Quem observa *"o que devia acontecer, aconteceu"*? | 🟡 **Pendente de construção (R7).** Mas a severidade está definida: **acorda o Olavo** (a) número errado no Notion e (b) credencial expirada | O Vigia passa a precisar vigiar **consistência**, não só chegada. Construção exige plano aprovado — **não é deste contrato** |
| **D6** | Onboarding é parque PHI? | ❌ **NÃO.** E mais: **`WF-EXEC-*` e `L1 - Abertura` também ficam de fora.** Só o **T28** entra | 11 workflows saem do escopo: 7× `Onb - *`, 3× `WF-EXEC-*`, `L1`. O `WF-DOC-Telemetria-Diaria` segue a mesma sorte (mede Onboarding). Vão para `docs/operacao/` |

### 6.1. D7 (nova) — prazo: o que entra no v1 de 30/11

**Resposta:** *"Só o que atrapalha o v1."*

**Entra no v1** (porque bloqueia número certo):
1. O **score 3× no Notion** (`phi_score_current`)
2. Os **dois writers de `client_config`** — D3
3. O **`phi_dev`** — D2
4. O **grão de anúncio** — D1, prioridade dos 15 dias

**Fica para depois do v1:** renomeação do parque, aposentadoria dos inativos, `TMP-*`, cobertura
total de `errorWorkflow`, `workflow_execution_log` sem leitor.

### 6.2. D8 (nova) — os ~20 inativos

**Resposta:** *"Apagar os óbvios, aposentar os nossos."*

| Ação | Quais |
|---|---|
| **Apagar sem cerimônia** | os 3 templates importados nunca usados (`Automate unified marketing reports…`, `Monitor ad performance drops…`, `Automate Google Ads search term analysis…`) e os `TMP - *` inativos |
| **Aposentar pela R5** (5 passos: consolidar → desabilitar chamador → desativar → renomear `[APOSENTADO <data>]` → sticky) | `Daily Entry` · `PHI - Pipeline` · `sw phi pipeline_v2` · `PHI - Fase 2 Cálculo Score` · `PHI - Fase 3 Operacional` · `phi-production` · as 3 `copia seg` · `sw métricas e diagnósticos anúncios` |

⚠️ **`TMP - Evolution Header Echo` está ATIVO e não foi lido** (§4.4). **Não entra em nenhuma das duas
listas até ser lido.** Quem desliga é o Olavo.

### 6.3. D9 (nova) — janela de manutenção

**Resposta:** *"Depois das 09h e antes das 23h."*

Confere com o que foi medido: a última janela automática do dia é o **Agregador, segundas às 09h**;
a primeira da madrugada é o `sw metricas campanhas` às **00h**.

> **Regra:** alteração em produção **só entre 09h e 23h**. Fora disso, só com o Olavo avisado.

### 6.4. D10 (nova) — severidade

**Resposta:** *"1 e 3"* — **acorda o Olavo:**
1. 🔴 **Número errado no Notion** — porque ele age em cima dele.
2. 🔴 **Credencial expirada** — porque só ele pode reconectar, e em 17/09 derrubou ingestão, score e
   vigia no mesmo dia.

**"Conserta amanhã":** todo o resto.

> **Consequência para a camada 4:** os dois alarmes que faltam hoje são exatamente esses. O
> `Alerta de Falha` pega credencial expirada **só nos 5 workflows cobertos** (§4.5), e **nada** vigia
> número errado.

### 6.5. D11 (nova) — Meta Ads

**Resposta:** *"Depois do v1."*

> ⚠️ **Divergência conhecida, registrada de propósito:** os **2 únicos anúncios** cadastrados na DB
> Notion *Anúncios* são **Meta**, o cliente **CHA é Meta Ads**, e o `PHI - Subworkflow Campanhas`
> manda Meta para um noOp chamado **`Meta Ads — em breve`**. Ou seja: **há cadastro Meta em produção
> sem caminho de ingestão.** Como Meta fica para depois do v1, o contrato manda **desligar o caminho
> Meta explicitamente** em vez de deixar o nó "em breve" no ar (R12: estado temporário sem prazo vira
> permanente invisível).

### 6.6. O que a entrevista NÃO respondeu

B4 (quantos clientes hoje e em 30/11) · B5 (interno ou produto) · B7 (o que você faz com o alarme) ·
B8 (quantos alarmes por dia é demais) · B9 (3 dias sem rodar, perceberia?) · B12 (prefixo de nome) ·
B19 (orçamento de API) · B22 (o que já tentou e desistiu).

**Ficam como dívida declarada.** Nenhuma delas bloqueia o contrato; todas ajudariam a dimensionar.

### 6.7. Respostas verbatim (brief §8 item 2)

| Pergunta | Resposta |
|---|---|
| B18 — o que dói mais | **"Dado errado"** |
| B20 — uma coisa em 15 dias | **"O grão de anúncio"** |
| B1 — apontar o anúncio culpado? | **"Sim, quero o anúncio culpado"** |
| B11 — `phi_dev` deve existir? | **"phi_dev some"** |
| B6 — em qual parte não confia | **"Todas estas opções"** (cobertura · score · métricas cruas · status e tarefas) |
| B2 — quem consome o grão | **"Mistura das opções 1, 2 e 4"** (tela do Notion · T28 · relatório para o cliente) |
| B3 — Meta entra quando | **"Depois do v1"** |
| B14/B15/B16 — escopo do contrato | **"T28 (análise) — é a camada 5"** (e só) |
| B21 — parque limpo no v1? | **"Só o que atrapalha o v1"** |
| B17 — os inativos | **"Apagar os óbvios, aposentar os nossos"** |
| B13 — janela de manutenção | **"Depois das 09h e antes das 23h"** |
| B10 — o que acorda | **"1 e 3"** (número errado no Notion · credencial expirada) |

> 🔄 **Tensão registrada, não interpretada:** o Olavo diz que o que dói é **dado errado** (B18), mas
> elege o **grão de anúncio** (B20) para os 15 dias — que é *dado que falta*. Perguntei de volta na
> rodada 2 e ele manteve as duas. **Leitura literal: as duas coisas são para fazer, e o grão vem
> primeiro no calendário.** Isso está na ordem do §6.1.

## 7. Como este contrato se mantém vivo

Copiado do que funcionou na Prospecção, e do que falhou:

1. **Toda mudança de dono passa por ADR** — não por edição direta aqui.
2. **O as-built vence o plano** (R2). Quando o artefato divergir, corrige-se o contrato **e registra-se
   a divergência**, nunca se apaga.
3. **Hipótese desmentida também se escreve** (R6, corolário) — senão a próxima auditoria levanta o
   mesmo alarme.
4. 🔴 **O cabeçalho é o que se lê** (R2 item 5). Marcar estado **na tabela do topo**, não só no corpo.
   O ADR-38 ficou 9 dias "não executado" no cabeçalho depois de executado.

---

## 8. O que este contrato NÃO decide

- **Não decide a fórmula do score** — é o ADR-34 (Score v2).
- **Não decide o que o T28 analisa** — é o ADR-28 e o `modulo-28-analise-cognitiva.md`.
- **Não decide preço, oferta ou posicionamento** — é outra conversa, outro documento.
- **Não decide nada da Prospecção.** Aquela frente tem contrato próprio, e ele é lei lá.

---

## 9. A entrevista — **feita em 2026-09-20** ✅

Este contrato tinha **~25 células marcadas ❓**. Hoje tem **5**, e as cinco têm motivo declarado
(§4.4): três dependem de uma consulta ao BigQuery, uma de ligar o MCP access de um workflow, e uma é
pergunta de produto (quem lê `t28_errors`).
**Nenhuma é dedução pendente.**

| Etapa | Estado |
|---|---|
| **Lista A** — 30 perguntas de as-built, respondidas por leitura | ✅ **27 respondidas, 3 parciais** — `docs/handoff/2026-09-20-parque-phi-lista-A-as-built.md` |
| **Lista B** — 22 perguntas de decisão, só o Olavo responde | ✅ **12 respondidas em 3 rodadas** · 8 ficaram como dívida declarada (§6.6) |
| **§4 as-built** | ✅ preenchido **com o que foi lido nos nós**, não com o que foi deduzido |
| **D1–D6 + D7–D11** | ✅ registradas com data (§6) |

> **A ordem foi a da R9, e desta vez na direção certa:** entrevista **antes** do contrato virar lei.
> Na Prospecção ela chegou três dias depois do início da construção, e quatro das nove perguntas já
> tinham sido respondidas por incidente. *Entrevista atrasada não é entrevista — é autópsia.*

### 9.1. O que a leitura mudou no plano — antes de qualquer execução (R6)

Quatro premissas que o parque tinha como certas **não sobreviveram ao artefato**. Elas estão inteiras
no §7 do relatório da Lista A; aqui ficam as duas que mudam plano aceito:

1. 🔴 **A Fase 2 do ADR-37 não pode ser executada como está.** Aposentar o
   `PHI - Subworkflow Campanhas` mata o writer de `primary_metric_type` em `phi_prod` (§4.1). **O ADR
   precisa ser corrigido antes.**
2. 🔴 **Os dois writers de `raw_campaign_data` não produzem linha duplicada** — produzem sobrescrita
   silenciosa. O desempate instalado para resolver isso **nunca é acionado**. O problema é real, o
   diagnóstico era outro.

> É a **R6** funcionando: *executar um plano aceito que o dado já desmentiu é o pior dos dois mundos.*
