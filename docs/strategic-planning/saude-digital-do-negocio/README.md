# Saúde Digital do Negócio — a frente de reformulação

| | |
|---|---|
| **Aberta em** | 2026-09-25, por decisão do Olavo |
| **Status** | 🟡 **estudo** — nada aqui é decisão até virar ADR aprovado |
| **Por que existe** | o material de fundamentos descreve um escopo **muito maior** do que o PHI cobre hoje, e o entendimento precisa ser refeito antes de qualquer construção |

## ⚠️ Não confundir com a pasta `saude-digital/`

| Pasta | O que é |
|---|---|
| `saude-digital/` | **o que existe e está no ar**: `phi_value`, o parque de workflows, ADR-37/38/39/40, `CONTRATO-PHI.md` com os invariantes M1–M12 |
| **`saude-digital-do-negocio/`** (esta) | **o entendimento sendo refeito.** Estudo, mapas, comparações |

> 🔴 **As duas foram separadas de propósito.** Misturar contaminaria o que já é lei — e **separar é
> reversível; misturar não é.** Se a reformulação concluir que devem ser uma só, funde-se depois,
> por ADR.

## O que já dá para ver, antes do estudo começar

O índice do material tem **8 pilares somando 100**. O PHI hoje mede **uma fatia de um deles**:

| Pilar | Peso | Quem cobre hoje |
|---|---|---|
| Presença e infraestrutura | 10 | — |
| Visibilidade orgânica e local | 15 | 🟡 **Prospecção** (GBP do lead) |
| Redes sociais e conteúdo | 10 | — |
| Reputação e autoridade | 10 | 🟡 **Prospecção** (reviews do lead) |
| Experiência digital | 10 | 🟡 **Prospecção** (medição do site) |
| Aquisição orgânica e paga | 15 | 🟢 **`phi_value`** — e só a parte **paga** |
| 🔴 **Conversão e atendimento** | 🔴 **20** | 🟡 **CRM Odoo**, parcialmente |
| Dados, automação e governança | 10 | 🟢 **o parque PHI** (writers, contratos, vigias) |

**Duas leituras saem daí, e as duas são para o sub-chat confirmar ou derrubar:**

1. **As duas frentes da casa podem ser duas metades da mesma coisa.** A Prospecção já diagnostica
   presença digital — só que **de leads**, para vender. A Saúde Digital diagnostica **de clientes**,
   para entregar. **Mesma pergunta, dois momentos do funil.**
2. **Nada do que foi construído é desperdício.** O trabalho das últimas semanas — writers canônicos,
   identidade, contrato, vigias — **é o pilar "Dados e governança" inteiro**. Muda de lugar no mapa,
   não de valor.

## Conteúdo

| Arquivo | O que é |
|---|---|
| `fundamentos-presenca-digital.md` | o material trazido pelo Olavo — **insumo, não decisão** |
| 🟢 **`DICIONARIO-DE-INDICADORES-v0.md`** | 🔴 **O DOCUMENTO CANÔNICO desta frente** (decisão do Olavo, 25/09). A Versão 0 que a `Metodologia Estatística` exige: finalidade, **92 indicadores** com fonte e estado na casa, duplicidades eliminadas e regras de evidência. **Não decide pilares nem pesos** — isso é camada acima, e foi decidido pelo ADR-41 |
| 🟢 **`../../handoff/2026-09-25-indice-saude-digital-v0.1-construcao-subchat-brief.md`** | **Brief de construção do índice v0.1** (R1: briefs moram em `docs/handoff/`). Escopo fechado: **3 pilares, 24 indicadores, zero coleta nova**. Traz a **entrevista de alinhamento** (8 itens) e os **12 critérios de aceite escritos antes** (R9). 🔴 **Fase 0 obrigatória:** verificar em BigQuery o que o dicionário afirma — pode reduzir a cobertura para 2/8. **Aguarda o OK do Olavo** |
| 🟢 **`adr-rascunhos/ADR-41-…md`** | 🔴 **ACEITO em 2026-09-25** e publicado no Notion ([página](https://app.notion.com/p/3e6b65e5c72b8150857cea4596fb6ffe)). Fixa: pesos **iguais provisórios** (D2) · **cobertura declarada** — pilar não medido nunca é zero (D3) · **peso só para pilar com fonte** (D7), a regra que impede repetir o ADR-21 · **superseção parcial do ADR-21**, com banner, não apagamento (já executada). Invariantes **S1–S6**. Seis itens continuam declaradamente em aberto no §4 |
| `MAPA-material-x-casa.md` | 🟡 **insumo, com CORREÇÃO no cabeçalho.** Entrega de 25/09 — o material × o que a casa tem, pilar por pilar e dimensão por dimensão, com nome de workflow, tabela e coluna. **Confirma 3 linhas da tabela acima e derruba 4** (ver §6 do mapa). Traz 6 perguntas para o Olavo |

> ⚠️ **A tabela "o que já dá para ver" acima é a leitura PRELIMINAR do chat-mãe, de antes do estudo.**
> **Quatro linhas dela não se sustentaram** — Experiência, Aquisição, Conversão/atendimento e Dados/governança.
> **O `MAPA-material-x-casa.md` §6 é o que vale.** Esta tabela fica como registro do que se supunha (R6:
> hipótese desmentida também se registra).

---

## 🔴 O que a leitura dos ADRs mudou (2026-09-25)

**A casa já tinha um índice de pilares, e ele foi esquecido.** O **ADR-21** (Aceito 11/06/2026)
promoveu o PHI a **Índice de Saúde Digital** com 6 pilares — Paga 35 · Funil 20 · Orgânico 15 ·
Social 10 · Reputação 10 · Dados 10 — e nunca saiu do papel. O **ADR-22** (mesma data) já decidiu o
ciclo de aprendizado. **O material novo não é a descoberta: é a segunda tentativa dela.**

Com isso, existem **quatro estruturas de peso incompatíveis** na casa (ADR-21 · duas dentro da
`Análise Estatística` · pesos iguais na `Metodologia`). 🟢 **Resolvido em 25/09 pelo ADR-41: não
vale nenhuma das quatro** — vale pesos **iguais provisórios** com **cobertura declarada**, e peso só
para pilar que tenha fonte. **O que segue aberto é o agrupamento nominal dos pilares**, e com pesos
iguais essa escolha deixou de ser urgente. Ver §2 do dicionário.

> 🔴 **Decisão do Olavo em 25/09:** esta frente **se sobrepõe** ao que estava em andamento. As regras
> e normas anteriores **deixam de ser fixas** e passam a ser lidas à luz do material novo. O que sair
> daqui é canônico. **Os workflows da área serão construídos ou reformados** — depois do dicionário e
> do ADR, nunca antes (R7).
