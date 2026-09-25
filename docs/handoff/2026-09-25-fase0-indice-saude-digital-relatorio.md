# Fase 0 do Índice de Saúde Digital v0.1 — relatório de verificação

| | |
|---|---|
| **Data** | 2026-09-25 |
| **Autoriza** | OK de budget do Olavo ("ok Fase 0") · brief `2026-09-25-indice-saude-digital-v0.1-construcao-subchat-brief.md` |
| **Como** | `TMP - A6 BigQuery Audit` (`m8unFD0ksEc1Zvbk`, inativo, só `SELECT`) — **3 execuções**: `43038` (schema), `43040` (contagem), `43042` (lacunas). A `43039` falhou e o erro virou achado |
| **R13** | `activeVersionId: null` e `active: false` — não há versão publicada; o `Schedule Trigger` de 1 min **não dispara**. Confirmado antes de executar |

> 🔴 **Veredito: a Fase 0 fez o que existia para fazer — desmentiu o plano.** Dos **24** indicadores do escopo, **18 se confirmam** com dado, **6 caem**. A cobertura de **3 pilares de 8 se mantém** (cada um ainda tem ao menos um indicador com dado, per **D7**), mas **o pilar Experiência encolheu de 7 indicadores para 4** — e o que sustentava a régua dele piorou.

---

## 1. 🔴 Os oito pontos em que o dicionário estava errado

| # | O dicionário dizia | O dado diz | Efeito |
|---|---|---|---|
| **1** | `SD-EXP-04` profundidade de scroll 🟢 | `clarity_avg_scroll_depth` — **0 não-nulos** em 13 linhas | 🟢→🟡 **cai** |
| **2** | `SD-EXP-05` duração da sessão 🟢 (duas fontes) | `clarity_avg_session_sec` **0** · `avg_session_duration_sec` **0** — **as duas vazias** | 🟢→🟡 **cai** |
| **3** | `SD-EXP-06` taxa de rejeição 🟢 | `t28_ga4_landing.bounce_rate` — **0 não-nulos** em 24 linhas | 🟢→🟡 **cai** |
| **4** | `SD-AQU-09` conjuntos 🟢 `t28_adset` | 🔴 **`t28_adset` está VAZIA** — a consulta agrupada devolveu **zero linhas** | 🟢→🟡 **cai** |
| **5** | `SD-CVR-12` margem de contribuição 🟢 | `margem_contribuicao_pct` — **0 não-nulos** em 304 | 🟢→🟡 **cai** |
| **6** | `SD-CVR-13` ticket / LTV 🟢 | `ticket_ltv` — **0 não-nulos** em 304 | 🟢→🟡 **cai** |
| **7** | `SD-AQU-11` impression share: *"não há coluna"* | 🟡 **a coluna EXISTE** (`impression_share`, e ainda `budget_lost_is`) — e está **vazia** | errado **nos dois sentidos** |
| **8** | `SD-AQU-13` termos: *"calculado em runtime, não persistido"* | 🟢 **É PERSISTIDO**, como proporção: `pct_brand_terms`, `pct_problem_solving_terms`, `pct_competitor_terms`, `pct_other_terms` — **304 de 304** | ✅ **resolve o item 2 da entrevista por fato** |

> 🟢 **O nº 8 é boa notícia dupla:** o que eu ia recomendar — *persistir só a proporção, nunca o termo* — **já está construído**, e o `ADR-29 D5` está sendo respeitado na prática (`raw_campaign_data.top_search_terms` existe e tem **0 não-nulos**: nunca foi escrita).
>
> ⚠️ **Mas com uma ressalva que precisa de olho:** em **todas** as linhas, `source_status.search_terms = "error"` — e as quatro colunas `pct_*` estão **cheias**. **Valor presente com fonte em erro é candidato a sucesso silencioso** (R11). Não sei se são valores reais ou default; **não tenho como confirmar** sem ler o Normalizador.

---

## 2. 🔴 Três achados que ninguém estava procurando

### 2.1. Existe um SEGUNDO cliente: `CLI-13`

Toda a conversa desta frente assumiu **um cliente**. Há dois.

| | `raw_campaign_data` | `t28_campaign` | `t28_clarity_daily` | `t28_ga4_landing` |
|---|---|---|---|---|
| **CLI-4** (KIL) | 495 linhas · 266 dias · 01/01→**24/09** | 304 · 95 dias · →**20/09** | 13 · 12 dias · →**06/09** | 24 · 12 dias · →**06/09** |
| **CLI-13** | 12 · 12 dias · 09/09→**20/09** | 12 · D-7 · →20/09 | 2 | 4 |

⚠️ **`CLI-13` tem `primary_metric_type` com 0 não-nulos** em `raw_campaign_data` — **sem métrica-mãe, o PHI·Mídia não pontua** (M-guardrail). Ele entra na base, mas não no score.

> **Isto melhora o problema de amostra do ADR-41:** a calibração deixa de ter n=1. Ainda é pequena, mas **2 não é 1**.

### 2.2. 🔴 `t28_campaign` tem 318 linhas com `client_id` NULO — mais que as 304 do CLI-4

| janela | linhas | período | campanhas | execs | amostra de `campaign_id` |
|---|--:|---|--:|--:|---|
| D-30 | 135 | 01/07 → 31/08 | 3 | 2 | `CMP.CHA.CAMP-10` |
| D-7 | 183 | 22/07 → 06/09 | 3 | 9 | `CMP.CHA.CAMP-10` |

O padrão `CMP.CHA.CAMP-10` **não é identificador de campanha real** (as do CLI-4 são `GADS-21149189736`). **[DEDUZO] é resíduo de teste** — e mora em `phi_prod`, sem cliente, em volume maior que o dado real.

🔴 **Consequência direta para a construção:** qualquer consulta do índice **tem de filtrar `client_id IS NOT NULL`**. Sem isso, ou 318 linhas de teste entram na conta, ou desaparecem silenciosamente do `GROUP BY` — e as duas coisas são ruins. **Está nos critérios de aceite a partir de agora.**

### 2.3. 🔴 Clarity e GA4 pararam de receber em 06/09 — há 19 dias

| Tabela | Último dado | Atraso hoje (25/09) |
|---|---|---|
| `raw_campaign_data` | **24/09** | 1 dia ✅ |
| `phi_score_history` | **24/09** | 1 dia ✅ |
| `t28_campaign` | **20/09** | **5 dias** ⚠️ |
| `t28_clarity_daily` | **06/09** | 🔴 **19 dias** |
| `t28_ga4_landing` | **06/09** | 🔴 **19 dias** |

**São ramos do MESMO Agregador, e uns pararam enquanto outros seguiram.** O dicionário afirmava *"escreveu 14/09"* — **o último dado é 06/09**; 14/09 era a data da observação, não do dado.

> 🔴 **E ninguém viu, porque o vigia não olha para lá.** O `PHI - Vigia de Frescor dos Dados` compara campanhas ativas com `raw_campaign_data` e `phi_score_history` — **as duas tabelas que estão em dia.** As três que atrasaram **não têm vigia**. É a **R11** na forma mais limpa: verde todo dia, e o pilar Experiência morto há quase três semanas.
>
> ⚠️ **Este achado é maior que o índice.** Existe sem ele, e continuaria existindo se esta frente nunca tivesse começado.

---

## 3. E o dado não é série diária — é janela

Todas as tabelas `t28_*` gravam por **`janela`: `D-7` e `D-30`**, não por dia. O CLI-4 tem **12 datas distintas de Clarity em 2,5 meses**, não 75.

| Consequência | Efeito |
|---|---|
| 🟢 **Cadência semanal está certa** | confirma a recomendação do brief §7. Um índice diário não teria o que ler |
| 🔴 **Mata o baseline próprio como régua** | 12 pontos em 2,5 meses **não sustentam** mediana histórica. A saída (a) do §5 do brief **cai por falta de dado**, não por opinião |

---

## 4. Placar corrigido

| Dimensão | Era 🟢 | Agora 🟢 | O que caiu |
|---|--:|--:|---|
| D6 Experiência | 7 | 🔴 **4** | scroll, duração, rejeição |
| D7 Aquisição | 11 | **10** | conjuntos (`t28_adset` vazia) |
| D8 Conversão | 6 | **4** | margem, ticket/LTV |
| **Escopo v0.1** | **24** | 🔴 **18** | — |

**Os 18 que ficam:**
- **Experiência (4):** `SD-EXP-01` rage · `-02` dead · `-03` scroll excessivo · `-07` taxa de engajamento
- **Aquisição (10):** `SD-AQU-01` investimento · `-02` impressões · `-03` cliques · `-04` CTR · `-05` CPC · `-06` CPM · `-07` métrica-mãe · `-08` PHI·Mídia · `-12` orgânico (12 linhas, confirmado) · `-13` composição de termos
- **Conversão (4):** `SD-CVR-01` conversões · `-02` CPA · `-03` ROAS · `-05` conversões de site

⚠️ **Parciais, a tratar explicitamente:** `cpa` 134 de 304 · `cpc` 240 · `ctr` 279 · `roas` 245. **É o guardrail 8 funcionando** (`conversions=0 ⇒ CPA indefinido`), não defeito — mas o índice tem de distinguir *"indefinido"* de *"ruim"*.

✅ **Correção sobre a receita:** `SD-CVR-04` tem duas fontes e elas divergem — `raw_campaign_data.revenue` = **32 de 495**, mas `t28_campaign.conv_value` = **318 de 318**. **O ROAS não depende de `revenue`**, e portanto **não fica indefinido se a etapa 8 do ADR-38 aposentar aquele writer.** O brief §3 dizia o contrário: estava errado, e a preocupação era infundada.

📌 **Também corrigido:** o placar do dicionário dizia `D8 = 7 🟢` e as linhas tinham **6**. As linhas estavam certas; o placar, errado. **O total de 🟢 no dicionário era 26, não 27.** Com as quedas desta rodada: **20**, dos quais **18 verificados por query** aqui (os 2 de D1/D2 são de lead e não foram medidos nesta rodada).

---

## 5. O que muda no plano

| Decisão | Antes da Fase 0 | Depois |
|---|---|---|
| **Régua do Experiência** (entrevista nº 1) | recomendava baseline próprio | 🔴 **cai:** 12 pontos não fazem baseline. Sobra **(b) pilar exibido sem nota**, ou aceitar **força D** com 12 observações — **decisão do Olavo, agora com número** |
| **`SD-AQU-13`** (nº 2) | pergunta aberta | ✅ **resolvida por fato:** já persiste como proporção. ⚠️ investigar `search_terms = error` |
| **Cadência semanal** (§7) | recomendação | ✅ **confirmada pelo dado** (`janela` D-7 / D-30) |
| **Filtro `client_id IS NOT NULL`** | não existia | 🔴 **requisito novo e obrigatório** |
| **Amostra de calibração** | n=1 | **n=2** (`CLI-4`, `CLI-13`) |
| **Receita / ROAS** | risco pela etapa 8 do ADR-38 | ✅ **risco não existe** — ROAS vem de `conv_value` |

---

## 6. 🔴 O que NÃO foi verificado, e fica dito

| O que | Por quê |
|---|---|
| Se os `pct_*_terms` são reais ou default, com `search_terms = error` | exigiria ler o Normalizador do Agregador. **Não tenho como confirmar hoje** |
| Por que Clarity e GA4 pararam em 06/09 | exige ler execuções do Agregador — **é troubleshooting, vira sub-chat** (R1) |
| Se as 318 linhas sem cliente são de teste | 🔴 **é dedução pelo padrão do `campaign_id`**, não fato provado |
| `t28_gbp_daily` e `t28_meta_campaign` | fora do escopo v0.1 — não foram consultadas |
| Os 2 🟢 de D1 e D2 | são de lead, não de cliente |
| Qualquer coisa em `phi_dev` | só `phi_prod` foi lido |

**Confiança nos números deste relatório: 0,93** — são contagens diretas, com `COUNT(*)` ao lado (R11 regra 5). **Confiança nas duas deduções marcadas: 0,6.**
