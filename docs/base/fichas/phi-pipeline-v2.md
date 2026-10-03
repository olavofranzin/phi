# Ficha — `PHI - Pipeline_v2`

| | |
|---|---|
| **Tipo** | workflow n8n · `ITWG3Ge0asXtUM8U` · 🟢 **ativo, 07h** |
| **Verificado em** | 2026-10-03, pelo **sub-chat da Fase 1**, **contra** `panorama-workflows-phi.md` (linhas 85–88), `CONTRATO-PHI.md`, `ESTADO-DO-PROJETO.md` (v0.1.52) e o `CLAUDE.md` da raiz |
| ⬜ **NÃO verificado contra o n8n** | esta fase não abriu o n8n. **O artefato vence a ficha** (**R13**) |

## O que faz
🔴 **É o coração do PHI.** Calcula e persiste `phi_score_history`, checa unicidade, sincroniza o
Notion e roda a **Fase 3** (Fechamento → Escalada → Abertura, ordem imutável).

## 🟢 Por que existe — RESPONDIDO pelo Olavo em 2026-10-03

> **“Ele foi o 1º workflow criado para medir o PHI.”** — Olavo, 03/10/2026

| | |
|---|---|
| **a ideia geradora** | **medir o PHI.** Este workflow **é** a primeira materialização da ideia do produto: antes dele, o score não era calculado por máquina nenhuma |
| **o que substituiu** | 🔴 **NADA. Ele foi o primeiro.** Não há antecessor |
| **fonte** | **memória do Olavo**, perguntada e respondida. **Não é dedução, não é inferência de nome** |
| **o que falta** (**R5**) | ⬜ a **descrição no n8n** continua sem isto. Enquanto não carregar, **a próxima auditoria pergunta de novo** — e a resposta estará só aqui, não no artefato |

### 🔴 E o nome MENTE: o `_v2` não marca sucessão de nada

**Esta é a lição que a resposta do Olavo entrega, e ela é maior que a ficha.**

| | |
|---|---|
| **o que o nome sugere** | que existiu um `Pipeline_v1`, substituído por este |
| **o que é** | **este é o primeiro.** O `_v2` **não se refere a um workflow anterior** |
| **o que a dedução teria feito** | **inventado um antecessor que nunca existiu** — e, pior, inventado *“por que ele foi substituído”*, porque a pergunta seguinte já viria pronta |

🟢 **A busca exaustiva de 03/10 estava certa, e agora se sabe por quê:** `git log --all -S` em todo
commit de todas as branches e em todo `.md` deu **zero ocorrências** de `Pipeline_v1` e de toda forma
de *“pipeline antigo”*. **Não era lacuna de registro. Era ausência de fato.**

> 🔴 **A regra que sai daqui — é a R14, corolário de tipo, na forma de NOME DE ARTEFATO:**
> *não grave no nome o que pertence a outro campo.* Um sufixo de versão **afirma uma história**, e
> **esta afirmou uma história falsa por tempo indeterminado** — a ponto de o chat-mãe gastar uma
> busca exaustiva atrás de um antecessor inexistente, e de a ficha quase registrar
> *“presumivelmente substituiu um v1”*.
>
> **Teste prático:** *o nome deste artefato afirma algum fato?* Se afirma, **ou o fato está provado,
> ou o nome está mentindo** — e **nome é a coisa mais lida e menos auditada que existe.**
>
> ⚠️ **Custo já pago:** uma busca exaustiva. **Custo evitado:** a ficha teria registrado um
> antecessor fictício, e a próxima auditoria acreditaria nela (**R13** regra 3 — a testemunha falsa).

## O que substituiu, e por quê
| | |
|---|---|
| **substituiu** | 🟢 **NADA — foi o primeiro** (Olavo, 03/10). ⚠️ **A linha anterior desta ficha dizia *“presumivelmente um Pipeline v1”*: era dedução a partir do nome, e estava ERRADA.** Fica registrada para mostrar como o nome engana |
| **por quê** | 🟢 **não houve substituição.** A ideia geradora é **medir o PHI** |

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
| **1** | 🟢 **RESPONDIDA pelo Olavo em 03/10:** foi o primeiro workflow criado para medir o PHI, e **não substituiu nada — o `_v2` do nome não marca sucessão.** ⬜ **O que resta:** levar isto para a **descrição no n8n** (**R5**), porque hoje o porquê existe só nesta ficha |
| **2** | **O motor multi-métrica** é obrigatório (ADR-40), com gatilho *“o primeiro cliente não-CPA”*. **O `CLI-13` já é CPL e já é real** — então o gatilho já aconteceu? |
