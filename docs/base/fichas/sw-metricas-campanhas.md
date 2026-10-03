# Ficha — `sw metricas campanhas`

| | |
|---|---|
| **Tipo** | workflow n8n · `W571K320aqIHsdtH` · 🟢 **ativo** |
| **Verificado em** | 2026-10-03, pelo **sub-chat da Fase 1**, **contra** `panorama-workflows-phi.md` (linha 68), `CONTRATO-PHI.md`, o `CLAUDE.md` da raiz (**R5**) e o snapshot `saude-digital-do-negocio/sw metricas campanhas.json` |
| ⬜ **NÃO verificado contra o n8n** | esta fase não abriu o n8n (brief §7/§11). **A ficha é hipótese sobre o hoje; o artefato vence** (**R13**) |

## O que faz
Coleta a métrica diária de campanha e escreve em **`phi_prod.raw_campaign_data`** com
`ingestion_step = DAILY_ENTRY`. **Dono canônico da tabela** pelo **ADR-37**.

## 🔴 Por que existe
🟡 **Parcialmente sourced.** O **fato** está escrito no `CLAUDE.md` (motivo da **R5**, hoje em
[`BASE-04` §8](../BASE-04-INCIDENTES.md#8-D8-intencao-nao-escrita)):

> *“a auditoria por inventário **não descobriu** que o `Daily Entry` tinha sido desativado **porque**
> o `sw metricas campanhas` entrou no lugar. Isso só existia na cabeça do Olavo.”*

**Então: ele existe para ocupar o lugar do `Daily Entry`.** ⬜ **O que NÃO está escrito em lugar
nenhum: por que a substituição foi feita** — o que o `Daily Entry` fazia de errado, ou o que este faz
melhor. **Não deduzo. ⬜ a perguntar ao Olavo.**

## O que substituiu, e por quê
| | |
|---|---|
| **substituiu** | o **`Daily Entry`** (desativado) — fato sourced |
| **por quê** | ⬜ **a perguntar ao Olavo** |

## Quem escreve / quem lê
| | |
|---|---|
| **escreve em** | `phi_prod.raw_campaign_data` (`DAILY_ENTRY`) |
| **lido por** | `PHI - Pipeline_v2` (o score) |
| ⚠️ **não é o único writer** | o `PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`) escreve na **mesma tabela** com `GADS_INSERT` — **2º writer, a aposentar na Fase 2 do ADR-37**. Viola o **M1** |

## O que acontece quando a fonte falta
🔴 **Silêncio.** Pelo verbatim do Olavo (02/10, em [`BASE-01` §7](../BASE-01-PRINCIPIOS.md)): *“o único
alerta que recebo é quando há algum erro que impediu o wf operador único de rodar. Se houver falha na
coleta, não haver coleta, enfim, qualquer outra falha só sei se abrir o Notion e ver alguma
incoerência.”* **Este workflow não tem alarme próprio.**

## A prova, com número
| | |
|---|---|
| **o `M7` medido em 20/09** | os dois writers **não atualizam** `ingestion_step` no `WHEN MATCHED` — então a linha fica `DAILY_ENTRY` (quem inseriu às 00h) **carregando os números que o `GADS_INSERT` gravou às 07h**. É o as-built **A13** |
| **descrição no n8n** | 🔴 **`description: null`** no snapshot em git. **Reprova a R5** |

## ⬜ O que falta perguntar
| # | |
|---|---|
| **1** | **Por que o `Daily Entry` foi substituído?** (o porquê gerador) |
| **2** | 🔴 **Por que ele roda 2×/dia** — gatilho próprio às 00h **e** chamado às 04h? A pergunta está aberta no `panorama` (linha 68) com um `❓` desde que foi escrita |
