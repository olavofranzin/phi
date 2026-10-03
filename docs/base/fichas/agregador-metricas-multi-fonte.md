# Ficha — `PHI — Agregador de Métricas Multi-fonte`

| | |
|---|---|
| **Tipo** | workflow n8n · `4sdG2UKMCBuFq8xn` · 🟢 **ativo** |
| **Verificado em** | 2026-10-03, pelo **sub-chat da Fase 1**, **contra** `ADR-23`, `ADR-33`, `panorama-workflows-phi.md` (linha 74), o `CLAUDE.md` da raiz (**R12**/**R14**) e o snapshot `docs/audits/PHI — Agregador de Métricas Multi-fonte.json` |
| ⬜ **NÃO verificado contra o n8n** | **e aqui isso pesa mais que no resto:** este workflow é **ativo** e já teve **draft divergindo do ar** (**R12**). O artefato vence (**R13**) |

## O que faz
**ETL multi-fonte.** Lê `raw_campaign_data` + APIs (Google Ads GAQL em 3 níveis, Meta `level=ad`),
**normaliza no contrato T28** e grava nas tabelas `t28_*`. **68 nós** (medido em 02/10).

## 🔴 Por que existe
🟢 **SOURCED — `ADR-23`** (*Separação Agregador (ETL) vs Orquestrador de Análises*), aprovado em
princípio pelo Olavo em **2026-06-22** (D11/D12). A ideia geradora, no texto do próprio ADR:

> *“O workflow (…) hoje é só ETL (…). A evolução natural pede análises LLM (insight + recomendações)
> por anúncio, conjunto, campanha e cliente. **Há tentação de acoplar a análise dentro do mesmo
> workflow do ETL.**”*

**Então ele existe para ser o ETL — e para que a análise NÃO more dentro dele.** O
`WF-T28-Orquestrador-Analises` é a outra metade dessa separação.

## O que substituiu, e por quê
| | |
|---|---|
| **substituiu** | ⬜ nada declarado. ⚠️ **O inverso está aberto:** o `panorama` (linha 74) registra que ele *“pode tornar os 2 de cima redundantes”* (`sw metricas conjuntos` e `sw métricas anúncios`) — **ou seja, ele é candidato a substituir, e isso nunca foi decidido** |
| **por quê** | ⬜ **a perguntar ao Olavo** — é decisão de produto, não de execução |

## Quem escreve / quem lê
| | |
|---|---|
| **lê** | `phi_prod.raw_campaign_data` · Google Ads API · Meta Ads API |
| **escreve** | `t28_*` · `t28_errors` (via `[Err] Call Handler` → `WF-T28-Error-Handler`) |
| **lido por** | `WF-T28-Orquestrador-Analises` |
| ⚠️ **`t28_errors`** | 🔴 **sem leitor declarado** — viola o **M11**. É pergunta de produto aberta no `CONTRATO-PHI` §186 |

## O que acontece quando a fonte falta
| | |
|---|---|
| **o handler funciona** | `WF-T28-Error-Handler` **já disparou 4×** (07/09 e 14/09), **sempre pelo erro de GBP** |
| ⚠️ **o `triggerCount: 0` engana** | o gatilho é `executeWorkflowTrigger` — conta **gatilhos ativos**, não declarados (**R13**) |
| 🔴 **o modo que custou** | a identidade era casada por **posição no array** (`nodeFirst()`, `.first()`, `$('Set dados').all()[0]`) → **dado do KIL gravado sob o `CLI-13`**, e o guarda **convertendo `error` em `not_configured`**. Virou a **R14**. [História](../BASE-04-INCIDENTES.md#6-D6-identidade-por-posicao) |

## A prova, com número
| | |
|---|---|
| **o conserto da identidade** | **ADR-33 ✅ ACEITO** pelo Olavo em **2026-09-28**, com o Contrato de Identidade estendido: `client_id` + `source` + `source_id` + `date_start`/`date_end`. **6 linhas** de passivo apagadas na ordem *conserta → recoleta → apaga* |
| 🔴 **o draft órfão** | em **01/10**: o draft diferia do ar **só no nó `Reclassifica IDs`**, e **regredia** o conserto que acabara de ser provado. **A próxima publicação de qualquer coisa o embarcaria.** É uma das 4 linhas da **R12** |
| **a medição do descarte** | depois de *“Descartar alterações”*: `versionId 7aba9362` · `activeVersionId ecec7073` · **ids diferentes**, **conteúdo idêntico** — 68 nós, zero nós diferentes. Virou a **emenda da R13** |
| **passivo de `client_id`** | **5 linhas** com `client_id NULL` a limpar (`ESTADO` v0.1.52) — viola o **M3** |

## 🔴 Um achado desta ficha, que nenhum documento registrava
As **4 sticky notes** do snapshot em git estão em **inglês genérico de template** — *“Step 1: Trigger
& Report Type Detection: Scheduled triggers decide whether the workflow runs **weekly or monthly**”* —
e **descrevem um workflow que não é este** (o Agregador é diário e orientado a campanha, não um
relatório semanal/mensal de websites).

> **É a `R5` na peça central do T28:** *“descrição copiada de outro artefato é bug”*. E é pior que
> descrição vazia, porque **tem cara de documentação**. ⬜ **Registrado; corrigir a nota é tocar no
> artefato, e esta fase não toca.**

## ⬜ O que falta perguntar
| # | |
|---|---|
| **1** | **Os `sw metricas conjuntos` / `anúncios` ficam ou saem?** O Agregador *“pode torná-los redundantes”* há meses, sem decisão |
| **2** | 🔴 **Quem lê `t28_errors`?** Sem leitor, é log sem consumidor (**M11**) |
| **3** | **Por que 2 gatilhos?** Aberto com `❓` no `panorama` |
