# Saúde Digital do Negócio — o pilar não medido

> Leia **PRIMEIRO** o [`CLAUDE.md` da raiz](../../../CLAUDE.md) — as regras **R1–R15** valem aqui também.
> Esta frente é dona de: **o Índice de Saúde Digital do Negócio** (o entendimento sendo refeito), o
> **contrato de fontes por indicador**, as **réguas D6/D9**, e os **ADR-41 / ADR-42**.
> Verificado em **2026-10-03**, pelo **sub-chat da Fase 1 da memória compartilhada**, contra o
> `README.md` desta pasta, o `ADR-41`, o `ADR-42`, o `CONTRATO-DE-FONTES-v0.md` e o `REGUAS-D6-D9-v0.md`.

| | |
|---|---|
| **Aberta em** | **2026-09-25**, por decisão do Olavo |
| **Status** | 🟡 **estudo.** 🔴 **Nada aqui é decisão até virar ADR aprovado** (**R7**) |
| **Por que existe** | o material de fundamentos descreve um escopo **muito maior** do que o PHI cobre hoje, e o entendimento precisa ser refeito **antes** de qualquer construção |

---

## 1. ⚠️ Não confundir com a pasta `saude-digital/`

| Pasta | O que é |
|---|---|
| `saude-digital/` | **o que existe e está no ar**: `phi_value`, o parque de workflows, ADR-37/38/39/40, o `CONTRATO-PHI.md` com os invariantes **M1–M12** |
| **`saude-digital-do-negocio/`** (esta) | **o entendimento sendo refeito.** Estudo, mapas, comparações |

> 🔴 **As duas foram separadas de propósito.** Misturar contaminaria o que já é lei — e **separar é
> reversível; misturar não é.** Se a reformulação concluir que devem ser uma só, **funde-se depois,
> por ADR.**

---

## 2. O índice, e o tamanho real da lacuna

O índice do material tem **8 pilares somando 100**. 🔴 **O PHI hoje mede uma fatia de um deles.**

> **Esta é a fronteira do produto, e o dono dela é o
> [`BASE-01-PRINCIPIOS.md`](../../base/BASE-01-PRINCIPIOS.md) §7** — inclusive o fato de que **o
> Índice não foi construído**: existe **decisão** (ADR-41, aceito) e **metodologia**, e **não existe
> motor**. A tabela pilar-por-pilar está no [`README.md`](README.md) desta pasta.

---

## 3. As decisões e os insumos — quem é dono do quê

| Documento | De que é dono | Estado |
|---|---|---|
| **`ADR-41`** | 🔴 **pesos iguais provisórios + cobertura declarada.** **Supersede parcialmente o ADR-21** — só a tabela de pesos | 🟢 **ACEITO** — Olavo, **2026-09-25** |
| **`ADR-42`** | **normalização de indicador de alvo** + consolidação das decisões de 25/09 | 🟡 **rascunho** |
| `DICIONARIO-DE-INDICADORES-v0.md` | **o quê** — 92 indicadores, canônico | 🟡 insumo |
| `CONTRATO-DE-FONTES-v0.md` | **de onde o dado DEVE vir** (contrato, **não** as-built) | 🟡 rascunho |
| `REGUAS-D6-D9-v0.md` | **quanto é bom** — D6 Experiência e D9 Relacionamento | 🟡 insumo |
| `Metodologia Estatística…md` · `Análise Estatística.md` · `fundamentos-presenca-digital.md` | a base estatística | material |

> ⚠️ **ADR em rascunho é decisão pendente, e a idade dele é o tamanho do risco** (`BASE-00` §2).
> **O ADR-42 está em rascunho e carrega a normalização de alvo.**

---

## 4. 🔴 As três coisas que quem chega aqui precisa saber antes de escrever uma linha

| # | |
|---|---|
| **1** | **O contrato de fontes é CONTRATO, não as-built.** *“De onde o dado deve vir”* ≠ *“de onde vem hoje”* — o as-built mora na coluna *“onde está hoje”* do dicionário. **Misturar os dois é o erro que a R2 proíbe**, e já fez reportar *“tem dado”* sobre tabela zerada |
| **2** | 🔴 **As réguas D6/D9 são do Olavo, por elicitação — não são benchmark de mercado.** Força de evidência **C/D**: julgamento de especialista com **n=1**. O **D9 do ADR-41** exige que a força seja declarada, e **`D` nunca sustenta certeza** |
| **3** | **A inversão de ordem foi decisão do Olavo em 25/09:** **primeiro a fonte de cada indicador, depois o workflow.** O brief anterior partia de *“zero coleta nova”* — premissa que ele mudou. Aquele brief **recebeu banner de histórico, não foi apagado** (**R2**) |

---

## 5. ⬜ O que esta frente não sabe

| ⬜ | |
|---|---|
| **o motor do Índice** | não existe. **Nada foi construído** |
| **os 92 indicadores contra a realidade** | esta fase (memória compartilhada) **não abriu BigQuery nem fonte externa** |
| **a fusão com `saude-digital/`** | em aberto por decisão: **se concluir que são uma só, funde-se por ADR** |
