# Panorama do Parque PHI — o que grava métrica, o que consome, e o que só está ligado

> **Data:** 2026-09-19 · **Método:** varredura dos **81 workflows** do n8n, classificando cada um por
> **o que ele escreve** e **quem lê o que ele escreveu**. Workflow que não escreve nada e não produz
> decisão não tem razão de existir.
> **Base:** `search_workflows` (2026-09-19) + `docs/handoff/2026-09-08-consolidacao-writers-lote1-inventario.md`
> (leitura nó a nó do Lote 1) + `docs/handoff/2026-09-18-achado-parque-workflows-sem-producao.md`.
>
> ⚠️ **Este documento é o diagnóstico, não o as-built.** Ele foi montado a partir do **nome, da
> descrição e do estado** de cada workflow — **não abrimos os nós**. Pela **R13**, nada aqui vale
> como afirmação sobre o que roda em produção até um sub-chat reler o artefato. As colunas marcadas
> **❓** são exatamente as que precisam dessa leitura.

---

## 0. O diagnóstico em uma linha

**81 workflows no parque. ~26 ativos tocam o PHI. Destes, 12 não têm uma linha de descrição, 2 não
produzem nada há quase 3 meses, e 1 escreve no ambiente errado.**

E há **~20 inativos** que ninguém sabe se morreram ou se esperam — porque o procedimento de
aposentadoria da **R5** só foi aplicado a **3** workflows do parque inteiro.

---

## 1. Como classificamos

O PHI tem um caminho só, e todo workflow ocupa um lugar nele:

```
    [plataformas]  Google Ads · Meta · GA4 · GBP · Clarity
            │
     (1) INGESTÃO ──────▶ phi_prod.raw_campaign_data · raw_ad_data
            │
     (2) CÁLCULO ───────▶ phi_score_history ──▶ phi_score_current (view)
            │
     (3) ENTREGA ───────▶ Notion (Campanhas · Tasks · Checklist · Log)
            │
     (4) VIGILÂNCIA ────▶ Telegram do Olavo
            │
     (5) CONSUMO ───────▶ T28 (análise) · execução de demandas · telemetria
```

**Quem não está em nenhuma das cinco camadas está fora do parque PHI** — é Prospecção (já tem o
`CONTRATO-PROSPECCAO`), é Onboarding, ou é lixo.

---

## 2. Camada 1 — Ingestão (quem escreve métrica)

| Workflow | ID | Estado | Escreve em | Quando | Veredicto |
|---|---|---|---|---|---|
| `sw metricas campanhas` | `W571K320aqIHsdtH` | 🟢 ativo | `raw_campaign_data` (`DAILY_ENTRY`) | **2×/dia**: gatilho próprio 00h + chamado 04h | ✅ **dono canônico** (ADR-37) — mas **por que 2×?** ❓ |
| `PHI - Subworkflow Campanhas` | `b1pbn8qmzCNTufTp` | 🟢 ativo | `raw_campaign_data` (`GADS_INSERT`) | chamado pelo Pipeline_v2, 07h | 🔴 **2º writer na mesma tabela** — aposentar (ADR-37 Fase 2) |
| `sw metricas anuncios` | `vVAdXAJh6MW2Z5Hp` | 🟢 ativo | `raw_ad_data` | chamado 04h, `waitForSubWorkflow` | 🔴 **0 linhas desde 30/06** · sem descrição |
| `sw metricas conjuntos` | `t0DH5N5maws4egnG` | 🟢 ativo | `raw_adset_data_rollup` (view sobre `raw_ad_data`) | chamado 04h, `waitForSubWorkflow` | 🔴 **0 linhas desde 30/06** · sem descrição |
| `operador unico metricas` | `cLcimNoefTOnVVbd` | 🟢 ativo | — (orquestra) | 04:00 BRT | ✅ dá `execution_id` único aos 3 grãos — **mas espera por 2 que não produzem** |
| `client_config` | `SI5NSzRb8lVUz74RwOhIT` | 🟢 ativo | **`phi_dev`**`.client_config` | Notion Trigger, poll 1h | 🔴 **ambiente errado** — o Pipeline lê `phi_prod` com `INNER JOIN`. Cliente novo some sem erro |
| `PHI — Agregador de Métricas Multi-fonte` | `4sdG2UKMCBuFq8xn` | 🟢 ativo | ❓ (`t28_*`?) | **2 gatilhos** ❓ | ⚠️ já puxa *"Google Ads GAQL 3 níveis"* e *"Meta level=ad"* — **pode tornar os 2 de cima redundantes** |
| `Daily Entry` | `zGgIqiLlo5iAn8ud` | ⚪ inativo | — | — | ⚠️ *"não arquivar sem ADR"* — sucedido, mas nunca conferido a 100% |

> 🔴 **O achado que decide a camada:** `raw_ad_data` foi criada em **30/06/2026 e tem zero linhas**.
> Dois workflows ativos escrevem nela todo dia às 04h, e a rodada diária **espera** por eles.
> Detalhe completo em `docs/handoff/2026-09-18-achado-parque-workflows-sem-producao.md`.

## 3. Camada 2 e 3 — Cálculo e entrega

| Workflow | ID | Estado | Faz | Veredicto |
|---|---|---|---|---|
| `PHI - Pipeline_v2` | `ITWG3Ge0asXtUM8U` | 🟢 ativo 07h | calcula e persiste `phi_score_history`, checa unicidade, sincroniza Notion, roda a **Fase 3** | ✅ **o coração** — e o ponto único de falha |
| `PHI - Fechar Otimização` | `83vfKD8XMYmjZjFQ` | 🟢 ativo 1×/h | desmarca `Otimização Ativa?` em tarefas já concluídas | ✅ complementar ao Pipeline (ADR-37 S2) — ❓ **faz só isso?** |

> ⚠️ **A checagem de unicidade dentro do Pipeline_v2 já matou a Fase 3 por 8 dias**, verde todo dia,
> porque **zero linhas no caso saudável = zero itens = fim do ramo** (R11, regra 5). Qualquer
> salvaguarda nova nessa cadeia precisa do teste *"o que acontece no dia em que ela não pega nada?"*.

## 4. Camada 4 — Vigilância

| Workflow | ID | Estado | Olha | Ponto cego |
|---|---|---|---|---|
| `PHI - Vigia de Frescor dos Dados` | `JMgc0HdLPOFPnFYb` | 🟢 ativo 08h | **chegou** dado ontem em `raw_campaign_data` e `phi_score_history`? | **não olha `raw_ad_data`** nem o Notion |
| `PHI - Alerta de Falha` (errorWorkflow) | `UZ7sIE5cWrrO8xea` | 🟢 ativo | workflow **quebrou**? | só falha dura — verde-que-não-faz-nada é invisível |
| `PHI — Digest Diário de Progresso` | `rhobbBEeQaiWIuiF` | 🟢 ativo 08:30 | a DB Notion de sub-chats (**R3**) | progresso do projeto, não do dado |
| `[APOSENTADO 2026-09-17] PHI - Alerta de Erro` | `Oj1RbA0laZTzJZPx` | ⚪ inativo | — | ✅ **aposentadoria exemplar** (prefixo + sticky) |

> ⚠️ **Medido em 19/09, e corrige uma afirmação minha:** eu havia dito que *"o alerta disparou 5× e
> o que está falhando é o Vigia"*. Falso — **o Vigia falhou uma vez**, e a credencial do BigQuery
> está provada (verde em 18 e 19/09, 11:00 UTC). Os outros disparos vieram de **até 4 workflows que
> ninguém identificou até hoje**. Deduzi uma causa a partir de uma amostra: é a **R6** quebrada.
> **Achar esses quatro é item aberto do parque** (pergunta A23 do brief).

> 🔴 **O buraco da camada, nomeado em 18/09:** o Vigia olha **chegada**, o Alerta olha **quebra** —
> **nada olha se o que devia ter acontecido, aconteceu.** Foi por isso que a Fase 3 morreu 8 dias e
> a `raw_ad_data` passou 3 meses vazia sem um único alarme.

## 5. Camada 5 — Consumo (a fronteira do parque)

| Workflow | ID | Estado | Descrição | Relação com o PHI |
|---|---|---|---|---|
| `WF-T28-Error-Handler` | `rTS5pE34eElfuMPl` | 🟢 **ativo** | grava `t28_errors` + tarefa + Telegram | ✅ ADR aceito 22/06 — ❓ **é acionado por quem, se o T28 não roda?** |
| `WF-T28-Analise-Campaign` | `fhYmJH0o9BW1IO4i` | ⚪ inativo | rascunho L3.0 | Diagnóstico vive; **Maestro E1 no rascunho** (ADR-28) |
| `WF-T28-Orquestrador-Analises` | `8Q5ofmAZju0hTN08` | ⚪ inativo | lê **`phi_dev`** T28 🔴 | mesma doença do `client_config` |
| `WF-EXEC-Orquestrador` | `2rbC7F9FneUmwUH6` | 🟢 ativo | **sem descrição** · tags `phi/lote1/execucao` | ❓ consome tarefa do PHI? |
| `WF-EXEC-Intake-Pacing` | `9vyTlIJdvc5nf8Yk` | 🟢 ativo | **sem descrição** · tag `phi` | ❓ |
| `WF-EXEC-QualityGate-Pacing` | `yHlDj5eL0fYuCdrt` | 🟢 ativo | **sem descrição** · tag `phi` | ❓ |
| `WF-DOC-Telemetria-Diaria` | `VubalOUaoBteCyC6` | 🟢 ativo | **sem descrição** · tags `phi/telemetria` | ❓ mede o quê? |
| `L1 - Abertura de Projeto Tecnico Setup` | `cgw7ozJ7Zk9jBrj1` | 🟢 ativo | cria projeto + checklist p/ cliente ATIVO sem setup | ⚠️ **lê a DB Clientes** — mesma fonte do `client_config` |
| `L1 - ...` (cópia) | `7maZbsqPwG4b1FFl` | ⚪ inativo | descrição **idêntica** à do ativo | 🔴 **descrição copiada é bug** (R5) |
| 7× `Onb - *` | — | 🟢 ativos | 6 dos 7 **sem descrição** | ⚠️ fronteira: tocam Notion Clientes/Projetos |

## 6. Os antepassados — inativos sem procedimento de aposentadoria

Nenhum tem prefixo `[APOSENTADO]`, nenhum tem sticky. **Ninguém sabe, olhando, se morreram ou se
esperam.**

| Grupo | Workflows |
|---|---|
| **Cópias de segurança de métricas** | `sw metricas campanhas copia seg` · `sw métricas conjuntos copia seg` · `sw métricas e diagnósticos anúncios copia seg` · `sw métricas e diagnósticos anúncios` (`uqEHxuJPWRiZS6ai` — ❓ **antecessor dos dois vazios?**) |
| **Versões antigas do pipeline** | `PHI - Pipeline` · `sw phi pipeline_v2` · `PHI - Fase 2 Cálculo Score` · `PHI - Fase 3 Operacional` · `phi-production` · `Daily Entry (demo)` |
| **Google Ads soltos** | `Google Ads Insights Semanal` · `Google Ads v2` · `workflow_google.ads` |
| **Templates importados nunca usados** | `Automate unified marketing reports…` · `Monitor ad performance drops…` · `Automate Google Ads search term analysis…` |
| **Temporários que viraram permanentes** | `TMP - A6 BigQuery Audit` · `TMP - Notion DB ID Probe` · `TMP - Notion Connection Test` · 🔴 **`TMP - Evolution Header Echo` está ATIVO desde 26/05** |
| **Ponte de dados** | `Notion to Notion` · `Notion to Google Sheets` · `Google Sheets to Notion` · `Inserção Data Table` |

---

## 7. O placar

| Achado | Quantos |
|---|---|
| Workflows no n8n | **81** |
| Ativos que tocam o PHI | **~26** |
| **Ativos sem uma linha de descrição** (viola R5) | **12** |
| **Ativos que não produzem nada** | **2** (+1 `TMP` ativo desde maio) |
| **Ativos escrevendo/lendo `phi_dev` em produção** | **2** (`client_config`, `WF-T28-Orquestrador`) |
| Tabelas com 2 writers | **1** (`raw_campaign_data` — ADR-37 Fase 2 pendente) |
| Inativos **com** aposentadoria formal | **3** de ~20 |

---

## 8. O que este panorama NÃO resolve

1. **Não sabemos o que a maioria faz.** 12 ativos sem descrição significam 12 caixas-pretas — e a
   única forma de abrir é ler os nós, um a um.
2. **Não sabemos quem lê o que se escreve.** Sabemos quem escreve `raw_ad_data`; não sabemos se
   alguém a leria se ela tivesse dado.
3. **Não sabemos o que é produto e o que é andaime.** O grão de anúncio, o T28, a telemetria e o
   Onboarding podem ser tudo isso — ou nada. **Essa resposta não está no n8n; está com o Olavo.**

> É exatamente por isso que o próximo passo é **entrevista antes de contrato** — o erro que a
> Prospecção cometeu ao contrário, e que a **R9** existe para não repetir.
