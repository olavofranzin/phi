# Ficha — `PHI - Pipeline_v2`

| | |
|---|---|
| **Tipo** | workflow n8n · `ITWG3Ge0asXtUM8U` · 🟢 **ativo, 07h** |
| **Verificado em** | 2026-10-03, pelo **sub-chat da Fase 1**, **contra** `panorama-workflows-phi.md` (linhas 85–88), `CONTRATO-PHI.md`, `ESTADO-DO-PROJETO.md` (v0.1.52) e o `CLAUDE.md` da raiz |
| ⬜ **NÃO verificado contra o n8n** | esta fase não abriu o n8n. **O artefato vence a ficha** (**R13**) |

## O que faz
🔴 **É o coração do PHI.** Calcula e persiste `phi_score_history`, checa unicidade, sincroniza o
Notion e roda a **Fase 3** (Fechamento → Escalada → Abertura, ordem imutável).

## 🔴 Por que existe
⬜ **A PERGUNTAR AO OLAVO.** **Procurei nos três lugares e não achei a ideia geradora.**

| Lugar | O que achei |
|---|---|
| descrição no n8n | ⬜ não lida (fase não abre n8n); e o padrão medido nos snapshots é `description: null` |
| ADR | 🔴 **não existe ADR do Pipeline_v2.** O **ADR-003** diz que *o score é fato* — isso é **autoridade** do score, **não o porquê deste workflow existir** |
| `ESTADO-DO-PROJETO` | dá **o que faz** e o histórico de consertos, **não a ideia geradora** |

> 🟢 **O chat-mãe fechou uma das hipóteses em 03/10, para a próxima sessão não procurar de novo**
> (**R7** regra 3). Buscado em **todo commit de todas as branches** — `git log --all -S` — e em **todo
> `.md` da árvore: `Pipeline_v1` · `pipeline v1` · `pipeline antigo` · `substituiu o pipeline` ·
> `primeiro pipeline` → **zero ocorrências, em todas as formas.**
>
> **Consequência:** o porquê **não está em git, em nenhuma versão.** ⬜ **Resta memória do Olavo ou a
> descrição no n8n** (que o padrão dos snapshots mostra como `null`). **Não procure no git outra vez.**
>
> 🔴 **E há uma pista que eu me recuso a transformar em resposta:** o nome diz **`_v2`**, o que implica
> um **v1**. ⬜ **Não achei o v1, não achei por que ele foi substituído, e não vou deduzir.** O nome é
> indício, não fonte. *(É exatamente a `R6`: este porquê eu li, ou eu inventei?)*

## O que substituiu, e por quê
| | |
|---|---|
| **substituiu** | ⬜ **a perguntar** — presumivelmente um *“Pipeline”* v1, **não confirmado** |
| **por quê** | ⬜ **a perguntar ao Olavo** |

## Quem escreve / quem lê
| | |
|---|---|
| **lê** | `phi_prod.raw_campaign_data` · `phi_prod.client_config` (**`INNER JOIN`**) · `model_config` |
| **escreve** | `phi_prod.phi_score_history` (MERGE) → a VIEW `phi_score_current` |
| **lido por** | o Notion (`Score Diário`) · o webview · o T28 (**ADR-003: não recalcula**) |

## O que acontece quando a fonte falta
🔴 **Três modos de falha silenciosa já medidos neste workflow:**

| | |
|---|---|
| `INNER JOIN` com `client_config` | **descartava 100% das linhas de um writer** — e **cliente novo nunca entra no score, sem erro e sem alarme** |
| a **checagem de unicidade** | *“zero linhas no caso saudável = zero itens = fim do ramo”* — **matou o `Sync Scores to Notion` e a Fase 3 inteira por 8 dias, verde todo dia** |
| o `MERGE` por `source_execution_id` | filtro vazio → **0 linhas → não recalcula → `phi_score_current` serve linha velha congelada** (explica o *“50”* da `CLI-4`) |

> 🔴 **A lição mais cara da casa saiu daqui:** *“o maior estrago não veio da mudança de identidade —
> veio da **salvaguarda** que instalei para protegê-la.”*
> [História](../BASE-04-INCIDENTES.md#1-D1-vazio-vira-outra-coisa).

## A prova, com número
| | |
|---|---|
| **consertado e provado em produção** | `Pipeline_v2` **v1.2**, `activeVersion` **`9a174e50`** — valores reais: **Salão `phi=67.12` GOOD**, **Barbearia `phi=49.38` com `MAS=0`** (`ESTADO` v0.1.52) |
| **limite do motor, medido** | 🔴 **só calcula CPA.** `primary_metric_type != 'CPA'` sai como `INSUFFICIENT_DATA` — o `CHA`/`CLI-13` é **CPL** e **entra e sai sem nota** |
| **componentes** | `es`/`rs`/`os` eram constantes `50.0`; hoje **peso 0** no `model_config` MODEL-VAREJO-001 v1.2 |
| **incidente de credencial** | a credencial `Google BigQuery account` `UhLRAanVarQeOpQy` **expirou de 08 a 16/jul — 10 dias sem dado, sem alerta** |

## ⬜ O que falta perguntar
| # | |
|---|---|
| **1** | 🔴 **Por que o Pipeline_v2 existe, e o que era o v1?** É o porquê mais importante que falta nesta pasta — **é o coração do produto e é o único dos 7 sem nenhuma fonte de porquê** |
| **2** | **O motor multi-métrica** é obrigatório (ADR-40), com gatilho *“o primeiro cliente não-CPA”*. **O `CLI-13` já é CPL e já é real** — então o gatilho já aconteceu? |
