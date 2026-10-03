# Ficha — `WF-T28-Analise-Campaign`

| | |
|---|---|
| **Tipo** | workflow n8n · `fhYmJH0o9BW1IO4i` · ⚪ **inativo** (Diagnóstico vive; **Maestro E1 no rascunho**) |
| **Verificado em** | 2026-10-03, pelo **sub-chat da Fase 1**, **contra** `ADR-28`, `ADR-27`, `ESTADO-DO-PROJETO.md` (v0.1.52 e §753), `panorama-workflows-phi.md` (linha 116) e a skill `phi-diagnostico` |
| ⬜ **NÃO verificado contra o n8n** | esta fase não abriu o n8n. **O artefato vence** (**R13**) |

## O que faz
Recebe uma campanha já pontuada, calcula **flags determinísticas**, chama o **LLM** (nó *“Message a
model”*, `claude-sonnet-5`, tool `phi_analise_campanha`) e faz **upsert idempotente** de uma página na
DB Notion **`PHI - ANÁLISES`** (`38fb65e5-c72b-80db-a425-e5939fc35c7a`).

🔴 **Ele LÊ o `phi_value` canônico de `phi_score_current` e NÃO recalcula** — **ADR-003**.

## 🔴 Por que existe
🟢 **SOURCED — `ADR-28`** (*Decomposição do cérebro de análise (T28) em estágios; E1: Maestro sobre o
Diagnóstico*), aprovado em princípio pelo Olavo em **2026-07-31**. A entrega tem casa própria pelo
**ADR-27** (`PHI - ANÁLISES`), e a separação ETL × análise vem do **ADR-23**.

**A ideia geradora:** traduzir o score em **diagnóstico + decisão recomendada** — **e o humano dá o
“play”.** É a camada de análise cognitiva sobre o número, não um segundo número.

## O que substituiu, e por quê
| | |
|---|---|
| **substituiu** | o **insight placeholder**. O nó `Build Deterministic Flags` gravava **texto de insight placeholder** e as *Recomendações* saíam **vazias**; o framework §4 (implementado em 19/07) passou a preencher com `llm.recomendacoes` |
| **por quê** | 🟢 sourced: o placeholder existia para provar o **plumbing** antes de existir framework — *“o framework de análise §4 é o ÚLTIMO ponto”*, por decisão do Olavo em 30/06 |

## Quem escreve / quem lê
| | |
|---|---|
| **lê** | `phi_prod.phi_score_current` (**JOIN** com `t28_campaign` por `client_id`+`campaign_id`) |
| **escreve** | DB Notion `PHI - ANÁLISES` — **upsert idempotente**, por `relations` (não `rich_text`) |
| **chamado por** | `WF-T28-Orquestrador-Analises` (`8Q5ofmAZju0hTN08`, ⚪ inativo) |

## O que acontece quando a fonte falta
| | |
|---|---|
| **sem o score** | o `phi_midia_score` tem **null-guard** (fix da pré-revisão) |
| **sem credencial** | 🔴 **falha dura, e já falhou:** execução **#18711** em 18/07 — *“Node does not have any credentials set”* |
| ⚠️ **a armadilha de idempotência já consertada** | o `matchType` era `anyFilter` (OR por padrão) → **quebrava a idempotência**. Corrigido para `allFilters` |

## A prova, com número
| | |
|---|---|
| **idempotência provada** | smoke `phi_dev` em 01/07: run **`13046`** SUCCESS (2 campanhas `CLI-4`, `phi_value=50`/`WARNING` vindo de `phi_score_current`, 2 páginas criadas) e run **`13054`** — **mesmos page IDs, `criado_em` preservado → UPDATE, não duplica** |
| **as relations resolvem** | re-smoke **`13060`**: `cliente` **e** `campanha` resolvidas → *“plumbing 100%”* |
| **o bloqueio** | exec **#18711** (credencial Claude/Anthropic) |
| **a parada, carimbada** | ⏸️ **parado por decisão do Olavo, 27/09** — gatilho de volta: **quando o F2 fechar**. A parada está escrita **na descrição dos dois workflows**, lida de volta e conferida em 27/09 |

> 🔴 **E este é o único artefato das 7 fichas cuja descrição no n8n foi verificada por alguém** — em
> 27/09, exatamente como a **R5** e a **R12** mandam. **É o precedente bom da casa.**
>
> ⚠️ **Antes de 27/09 ele estava *“parado por esquecimento”*:** os dois workflows inativos **sem
> alteração desde 24/07 e 01/08, e ninguém sabia dizer por quê.** A diferença entre *“parado por
> esquecimento”* e *“parado de propósito, com gatilho”* **é uma frase escrita na descrição.**

## O porquê da parada, que vale guardar
> *“O T28 **lê** o `phi_value`. Ligar análise sobre número em obra produz **diagnóstico bonito sobre
> dado errado** — que é pior que diagnóstico nenhum, porque **tem cara de resposta**.”* — `ADR-28`

## ⬜ O que falta perguntar
| # | |
|---|---|
| **1** | **O F2 fechou?** É o gatilho declarado da volta |
| **2** | **A credencial `Anthropic account` (`YifaYCQuGWjdd1Oh`) está ligada nos nós?** O `CLAUDE.md` dizia *“existe; confirmar binding + smoke antes de ativar”* — **continua a confirmar** |
