# [BRIEF sub-chat] ADR-39 — dono único de `client_config`, e o fim do `phi_dev`

> **Como usar:** cole este arquivo como **primeira mensagem** de um sub-chat.
> **Modelo:** Opus. **Repo:** `olavofranzin/phi` · **Branch:** `claude/consolidacao-2026-08`.
> **Idioma com o Olavo:** português simples, sem jargão.
> ✅ **Aprovado pelo Olavo em 2026-09-20** — na **opção A**. Isto é execução, não proposta.

---

## 0. O que você vai fazer, em uma frase

**Fazer o cadastro do Notion chegar ao score** — hoje ele não chega, e por isso o **CHA não existe**
para o PHI apesar de estar cadastrado.

## 1. Leia antes (nesta ordem, e é rápido)

| # | Documento | Por quê |
|---|---|---|
| 1 | `saude-digital/adr-rascunhos/ADR-39-dono-unico-client-config.md` | **a decisão. É lei** |
| 2 | `docs/handoff/2026-09-20-parque-phi-lista-A-as-built.md` §A9, §A10, §A15 | o que já foi medido — **não remeça** |
| 3 | `saude-digital/CONTRATO-PHI.md` §3 (M1–M12) e §4.1 | os invariantes e a matriz |
| 4 | `saude-digital/CLAUDE.md` | contexto da frente |
| 5 | `CLAUDE.md` da raiz | R1–R13 |

## 2. O estado de hoje (já medido — leia, não confira de novo)

| Destino | Quem escreve | O quê |
|---|---|---|
| `phi_dev.client_config` | workflow **`client_config`** (`SI5NSzRb8lVUz74RwOhIT`) | linha inteira, `MERGE`, com `primary_metric_type` de um **mapa fixo** (`ROAS`) |
| **`phi_prod.client_config`** | **`PHI - Subworkflow Campanhas`** (`b1pbn8qmzCNTufTp`), nó `Execute SQL client_config sincronizado` | **só `primary_metric_type`**, `UPDATE … WHERE` — **sem `INSERT`** |

🔴 **É esse `UPDATE` que mantém o CPA do KIL correto em produção.** Não é carga manual. Se ele sumir
antes do substituto estar provado, o KIL fica sem writer.

## 3. Os 5 passos — a ordem é lei

| # | Passo | O que fazer |
|---|---|---|
| **1** | **Corrigir a derivação** | no nó `Code limpar Notion` do workflow `client_config`: `primary_metric_type` passa a vir da **Métrica-Mãe do Notion**, não do `metricDefaultMap` fixo |
| **2** | **Repontar o `MERGE`** | de `phi_dev.client_config` para `phi_prod.client_config`. ⚠️ Use `dataset.table` entre backticks **sem project ID** (Regra Crítica nº 1) — hoje o SQL usa project ID, e isso é dívida a corrigir junto |
| **3** | **Provar o `INSERT`** | cadastrar o **CHA** no Notion e vê-lo aparecer em `phi_prod.client_config` e voltar de `Buscar Clientes Ativos` |
| **4** | **Remover o `UPDATE`** | tirar o nó `Execute SQL client_config sincronizado` do `PHI - Subworkflow Campanhas` — **só depois do passo 3 provado** |
| **5** | **Fechar o `phi_dev`** | apagar `phi_dev.client_config` e varrer os workflows por `phi_dev` |

🔴 **Os passos 2, 3 e 4 acontecem na MESMA SESSÃO.** Entre eles existe uma janela com **dois writers
vivos na mesma coluna** — aceitável porque é curta e declarada; inaceitável se dormir assim (**R12**).

⏰ **Janela de manutenção: entre 09h e 23h** (D9 do contrato). Fora disso, só com o Olavo avisado.

## 4. Critérios de aceite (escritos antes — R9)

| # | Critério | Como se prova |
|---|---|---|
| CA1 | `phi_prod.client_config` tem **um** writer | ler os nós dos dois workflows |
| CA2 | O KIL continua **`CPA`** | consultar a linha do `CLI-4` **depois** do passo 4 |
| CA3 | Cliente novo **chega ao score** | o CHA volta de `Buscar Clientes Ativos` |
| CA4 | A Métrica-Mãe do Notion **vence** o mapa fixo | trocar a métrica de um cliente no Notion e ver a coluna mudar |
| CA5 | `phi_dev` não é escrito nem lido | varredura — **o `WF-T28-Orquestrador` também lê `phi_dev`; se aparecer, reporte, não conserte** |
| CA6 | Nada rodou fora da janela | 09h–23h |

**Reprovou? Volta com relatório do defeito. Limite de 3 voltas** — na terceira o problema é o plano.

## 5. ⛔ Fora do escopo

- **Não aposente** o `PHI - Subworkflow Campanhas` — é a Fase 2 do ADR-37, e vem **depois** desta.
- **Não conserte** o `WF-T28-Orquestrador` (lê `phi_dev.t28_campaign`). Mesmo defeito, outro par.
- **Não toque** no score 3× no Notion, no grão de anúncio, nem na Prospecção.
- **Não construa nada novo** (R7).

## 6. As armadilhas

1. **Leia o que está NO AR** — `activeVersion.nodes`, não `nodes`. Compare `versionId` com
   `activeVersionId` antes e depois de publicar (**R13**).
2. ⚠️ **Mas `settings` e descrição são metadados de workflow, não de versão** — valem sem publicar.
3. **Zero nunca é ausência** (M4). Se uma consulta puder devolver `0` significando *"não achei"*,
   **traga junto a contagem do que casou**.
4. 🔴 **O `INNER JOIN … AND is_active = TRUE` esconde o defeito.** Um cliente sem linha em
   `phi_prod` é **descartado sem erro**. Ao validar o CA3, confirme que ele **aparece**, não que
   "não deu erro".
5. **Hipótese já refutada, não a levante de novo** (ADR-39 §7): repontar **não** sobrescreve o CPA do
   KIL — ele cai em `WHEN MATCHED`. A ordem protege o **cliente novo**, não o existente.
6. **R12:** o que você mudar para testar, volte **na mesma sessão**, e prove **lendo**.

## 7. Registro obrigatório (R3)

Ao **começar** e ao **encerrar**, linha na DB Notion **"PHI — Registro de Execuções (Sub-chats)"**:
frente `Saúde Digital / ADR-39` · o que foi feito · estado · próximo passo · link.

## 8. O que devolver

1. Os **6 critérios** com veredicto e a prova de cada um.
2. O **ADR-39 com cabeçalho atualizado** — data efetiva da execução **na tabela do topo**, não só no
   corpo (**R2 item 5**).
3. O **§4.1 do `CONTRATO-PHI.md`** com o dono novo e o ❓ apagado.
4. **Hipóteses suas que o dado desmentiu** (R6, corolário).
5. **Achados laterais** — foi assim que este ADR nasceu.
6. **Commit no git** na mesma sessão.

## 9. Skills

`n8n-mcp-tools-expert` (ler workflow e execução sem cair no rascunho) · `n8n-node-configuration`
(parâmetro de nó) · `find-skills` (se precisar de outra coisa, procure antes de improvisar — R7).
