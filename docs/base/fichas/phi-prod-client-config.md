# Ficha — `phi_prod.client_config` (a tabela e o seu writer)

| | |
|---|---|
| **Tipo** | tabela BigQuery · `phi_prod.client_config` · **writer:** workflow n8n `client_config` (`SI5NSzRb8lVUz74RwOhIT`, 🟢 ativo, Notion Trigger poll 1h) |
| **Verificado em** | 2026-10-03, pelo **sub-chat da Fase 1**, **contra** `ADR-39`, `ADR-40`, `CONTRATO-PHI.md` (linhas 119–121 e 137) e `docs/handoff/2026-09-28-ADR39-fase-B-relatorio.md` |
| ⬜ **NÃO verificado contra o BigQuery nem o n8n** | esta fase não abre nenhum dos dois (brief §7/§11). **O artefato vence a ficha** (**R13**) |

## O que faz
Guarda a **configuração por cliente** — entre outros, `client_id`, `client_slug`, `model_id` e
`primary_metric_type`. **É a porta de entrada do cliente no score:** o `PHI - Pipeline_v2` a lê com
**`INNER JOIN`**.

## 🔴 Por que existe (o writer, e a forma que ele tem hoje)
🟢 **SOURCED — `ADR-39`** (*Dono único de `client_config`, e o fim do `phi_dev`*), ✅ **ACEITO**, Fase A
concluída em **21/09** e Fase B em **27–28/09**.

**A ideia geradora:** a tabela tinha **mais de um escritor e em ambiente errado**, e *“cliente novo
nunca entrava no score — sem erro, sem alarme”*. O ADR-39 existe para dar a ela **um dono único, em
`phi_prod`**. **Origem declarada:** o **D3** do `CONTRATO-PHI`, reaberto pelo as-built de 20/09
(achado **A10**).

## O que substituiu, e por quê
| | |
|---|---|
| **substituiu** | 🟢 a configuração dividida entre **`phi_dev.client_config`** (escrita pelo workflow) e um **`UPDATE` dentro do `PHI - Subworkflow Campanhas`** |
| **por quê** | 🟢 sourced: **duas escritas e dois ambientes** faziam o cliente novo nascer onde o score não lia. A `phi_dev.client_config` **foi apagada**; o `UPDATE` **saiu da versão ativa** |
| **e um detalhe de desenho que vale guardar** | `primary_metric_type` **ficou `NULLABLE` de propósito** — porque **a métrica pertence à campanha, não ao cliente** (**ADR-40**) |

## Quem escreve / quem lê
| | |
|---|---|
| ✅ **escreve (dono único)** | workflow **`client_config`** (`SI5NSzRb8lVUz74RwOhIT`), nó `Execute a SQL query` — **`MERGE` em `phi_prod` com `WHEN NOT MATCHED`** |
| **de onde vem o dado** | DB **`Clientes`** do Notion (`19fb65e5-c72b-8147-8aa3-c63aa273d205`). `client_slug` vem da fórmula *“Sigla Cliente”*; `model_id` vem do mapa explícito `Segmento → modelo` (`Negócio Local → MODEL-VAREJO-001`) |
| **lido por** | `PHI - Pipeline_v2` (`INNER JOIN`) · `PHI - Vigia de Frescor` (`INNER JOIN`) |

## O que acontece quando a fonte falta
| | |
|---|---|
| **segmento sem mapa** | 🟢 **falha ANTES do `MERGE`** — escolha de propósito, e é o comportamento certo (**R11 regra 1**: a falta de critério **não** vira *“todos”*) |
| 🔴 **cliente ausente da tabela** | **desaparece do score sem erro e sem alarme**, por causa do `INNER JOIN`. Foi **o** modo de falha que originou o ADR-39 |
| **métrica vazia** | `primary_metric_type` **`NULL` é estado válido** — não é ausência de dado, é *“a métrica mora na campanha”* |

## A prova, com número
| | |
|---|---|
| **linha de base (CA2)** | em 20/09: `phi_prod.client_config` com `CLI-4`, `primary_metric_type = 'CPA'`, `updated_at 2026-09-20T07:01:10 BRT` — execução **`41352`** |
| **o dono único provado (CA3a)** | `CLI-15` **nasceu por `WHEN NOT MATCHED` em `phi_prod`** com métrica `NULL` e foi removido na mesma sessão — execuções **`43733`/`43734`/`43735`/`43737`** |
| **`phi_dev.client_config` apagada** | preflight **`44092`** · DROP **`44093`** · pós-condição **`44095`** |
| **o `UPDATE` saiu** | a versão ativa **`0cc36334`** do `PHI - Subworkflow Campanhas` **não contém** o nó de `UPDATE` |

## 🔴 Um achado desta ficha: o `panorama` está VENCIDO sobre esta tabela
| Documento | O que diz | Veredito |
|---|---|---|
| `panorama-workflows-phi.md` linha 73 | *“`client_config` → **`phi_dev`**`.client_config` · 🔴 **ambiente errado** — cliente novo some sem erro”* | 🔴 **VENCIDO.** Descreve o mundo **antes** da Fase B |
| `CONTRATO-PHI.md` linha 137 | *“✅ **dono único desde a Fase B do ADR-39**. Cliente novo nasce em `phi_prod`”* | 🟢 **ATUAL** (carimbado 28/09) |

> **Dois documentos da mesma frente, afirmando o oposto sobre a mesma tabela.** É a doença nº 2 desta
> casa ([`BASE-04` §2](../BASE-04-INCIDENTES.md#2-D2-documento-que-mente)) acontecendo **agora**.
> ⬜ **Registrado.** Corrigir o `panorama` **não é escopo desta fase** (ela move documento de memória,
> não conserta doc de frente sem pedido) — **mas quem abrir o `panorama` precisa saber.**

## ⬜ O que falta perguntar / fazer
| # | |
|---|---|
| **1** | **O `panorama` deve ser corrigido** — está dizendo *“ambiente errado”* sobre algo consertado há 5 dias |
| **2** | 🟡 **O `CA5` amplo do ADR-39 continua ABERTO:** a tabela fechou, mas o `WF-T28-Orquestrador-Analises` (`8Q5ofmAZju0hTN08`) **ainda referencia o dataset `phi_dev`** no nó `Set config`. **O dataset `phi_dev` continua de pé** |
