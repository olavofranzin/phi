# ADR-39 — Dono único de `client_config`, e o fim do `phi_dev`

| | |
|---|---|
| **Status** | ✅ **ACEITO** — **Olavo, 2026-09-20** (*"Aprovado"*), na **opção A** do §3 · execução pelo brief `docs/handoff/2026-09-20-adr39-client-config-subchat-brief.md` |
| **Escopo** | Quem escreve `client_config`, em qual ambiente, e em que ordem a troca acontece |
| **Origem** | **D3** do `CONTRATO-PHI.md`, reaberta pelo as-built de 20/09 (achado **A10**) |
| **Decisor** | Olavo |
| **Bloqueia** | **Fase 3 do ADR-37** — e, por consequência corrigida, a **Fase 2** |
| **Base factual** | `docs/handoff/2026-09-20-parque-phi-lista-A-as-built.md` §A9, §A10, §A15 |
| **Destrava** | o **D2** (`phi_dev` some) e o cadastro de cliente novo no score |

---

> 🔴 **NOTA DE 2026-09-21 — o grão da coluna está errado, e há prova documental.**
>
> Este ADR decide **quem escreve** `primary_metric_type`. Não decide **onde ela deveria morar** — e
> o `regras-otimizacao-metodo-subido.md` §2 mostra que o lugar está errado: a tabela é
> **"Métrica-mãe por objetivo"**, e objetivo é atributo **da campanha**, não do cliente.
> Hoje ela mora em `client_config`, por cliente.
>
> **Não bloqueia os 5 passos do §4** — eles continuam válidos e necessários: mesmo no lugar errado,
> a coluna precisa de dono único e de `INSERT`. **Mas o passo 4.1 (*"ler a Métrica-Mãe do Notion"*)
> passa a ser um conserto de curto prazo**, que funciona enquanto houver 1 campanha por cliente.
>
> O executor propôs uma **opção D** em cima disso. **O chat-mãe ainda não a leu** e não decide sobre
> o que não leu (R6) — ver `PLANO-ENTREGA-FINAL-PHI.md` §4.2.

## 1. Por que isto saiu do ADR-37

O ADR-37 tratava `client_config` como um caso de **ambiente errado**: um workflow escrevendo em
`phi_dev` enquanto o score lê `phi_prod`. A correção parecia ser uma linha — repontar o `MERGE`.

**O as-built de 20/09 mostrou que o problema é outro, e maior.**

| O que o ADR-37 achava (08/09) | O que foi medido (20/09) |
|---|---|
| há **um** writer, no ambiente errado | há **dois** writers, em ambientes diferentes, **na mesma coluna** |
| repontar para `phi_prod` sobrescreveria o CPA do KIL com `ROAS` | **não sobrescreveria** — o KIL cai em `WHEN MATCHED`, que não toca essa coluna |
| o `UPDATE` em `phi_prod` era detalhe | **é o único writer de `primary_metric_type` em produção**, e é o que mantém o CPA do KIL correto (execução **40814**, verde, 2×/dia) |

**O risco real nunca foi a sobrescrita. É o M1 quebrado de propósito: dois donos na mesma coluna.**
Repontar sem decidir o dono não conserta — instala o defeito que o contrato existe para proibir.

## 2. O mapa de hoje

| Destino | Quem escreve | O quê | Como |
|---|---|---|---|
| `phi_dev.client_config` | workflow **`client_config`** (`SI5NSzRb8lVUz74RwOhIT`) | a **linha inteira** | `MERGE`, com `primary_metric_type` vindo de um **mapa fixo** (`ROAS`), não da Métrica-Mãe do Notion |
| **`phi_prod.client_config`** | **`PHI - Subworkflow Campanhas`** (`b1pbn8qmzCNTufTp`) | **só `primary_metric_type`** | `UPDATE … WHERE client_id` — **sem `INSERT`** |

**Consumidor:** o `Pipeline_v2`, com `INNER JOIN phi_prod.client_config … AND is_active = TRUE`.

> 🔴 **A consequência que ninguém tinha ligado:** o writer de produção é `UPDATE` **sem `INSERT`**.
> Então **cliente novo nunca ganha linha em `phi_prod`** — e o `INNER JOIN` o elimina do score, sem
> erro e sem alarme. É por isso que só **CLI-4** volta de `Buscar Clientes Ativos`, e o **CLI-13
> (CHA) não existe no score**, apesar de estar cadastrado.
>
> Isso deixou de ser hipótese: **o cadastro do Notion não chega ao score, e a única razão de o KIL
> funcionar é que alguém inseriu aquela linha à mão, um dia, e o `UPDATE` a mantém viva.**

## 3. As três opções

| | Opção | O que muda | Custo | Risco |
|---|---|---|---|---|
| **A** ⭐ | **O workflow `client_config` vira dono único, em `phi_prod`** | corrigir a derivação → repontar → garantir `INSERT` → remover o `UPDATE` do outro | 4 passos, ordem obrigatória | baixo **se a ordem for respeitada**; alto se invertida |
| **B** | **O `PHI - Subworkflow Campanhas` vira dono** | o Notion deixa de ser fonte; a Métrica-Mãe passa a viver no SQL | 1 passo | 🔴 o cadastro sai do lugar onde o Olavo trabalha, e o workflow está marcado para aposentadoria |
| **C** | **Deixar como está** | nada | zero | 🔴 `phi_dev` permanece (contra o **D2**), cliente novo nunca entra no score, e o dono real é invisível |

### Recomendação: **A**

**Porque a fonte da verdade é o Notion**, onde o Olavo cadastra o cliente e escolhe a Métrica-Mãe. O
workflow `client_config` é o único que nasce de lá. A opção B move o cadastro para dentro de um SQL
num workflow que o ADR-37 manda aposentar — troca um dono invisível por outro.

## 4. A ordem, e por que ela não pode inverter

| # | Passo | Se fizer fora de ordem |
|---|---|---|
| ~~**4.1**~~ | 🔴 **REVOGADO em 2026-09-21.** Com o **ADR-40 aceito e fundido na mesma execução**, a coluna **sai** do `client_config` — corrigir a derivação de um campo que será removido na mesma sessão é trabalho jogado fora | **A decisão de 20/09 (*"manter mesmo sendo descartável"*) valia enquanto os dois ADRs rodariam separados, com semanas entre eles. Fundidos, o motivo dela deixou de existir** |
| **4.2** | Repontar o `MERGE` de `phi_dev` para `phi_prod` | ⚠️ a precaução *"antes de 4.1"* **caiu junto com o 4.1** — com o ADR-40, o `MERGE` não escreve mais `primary_metric_type` nenhum |
| **4.3** | Garantir que o `MERGE` **INSERE** e validar com um cliente-teste (o **CHA** é o caso real esperando) | 🔴 sem isso, o bug do cliente-fantasma continua |
| **4.4** | **Só então** remover o `UPDATE` do `PHI - Subworkflow Campanhas` | 🔴 **antes de 4.3**, o KIL fica sem nenhum writer e o CPA vira o que estiver na linha |
| **4.5** | Apagar `phi_dev.client_config` e fechar o **D2** | — |

> ⚠️ **4.4 é o passo perigoso, e é o único irreversível na prática.** Entre 4.2 e 4.4 existe uma
> janela em que os **dois** writers estão vivos na mesma coluna. Ela é aceitável **porque é curta e
> declarada** — mas exige que 4.2, 4.3 e 4.4 aconteçam **na mesma sessão** (é a **R12**).

## 5. Critérios de aceite — escritos antes (R9)

| # | Critério | Como se prova |
|---|---|---|
| **CA1** | `phi_prod.client_config` tem **um** writer | ler os nós dos dois workflows e confirmar que só um escreve |
| **CA2** | O KIL continua `CPA` | consultar a linha do `CLI-4` **depois** de 4.4, não antes |
| **CA3** | Um cliente novo do Notion **chega ao score** | cadastrar o **CHA** e vê-lo voltar de `Buscar Clientes Ativos` |
| **CA4** | A Métrica-Mãe do Notion **vence** o mapa fixo | trocar a métrica de um cliente no Notion e ver a coluna mudar |
| **CA5** | `phi_dev` não é mais escrito nem lido | varrer os workflows por `phi_dev` — **inclui o `WF-T28-Orquestrador`** |
| **CA6** | Nada disso rodou fora da janela | **09h–23h** (D9) |

## 6. O que este ADR não decide

- **Não decide o `WF-T28-Orquestrador`**, que lê `phi_dev.t28_campaign` — é o mesmo defeito, outro
  par de tabelas. Fica no **D2**, e o CA5 apenas o denuncia.
- **Não aposenta o `PHI - Subworkflow Campanhas`** — isso é a Fase 2 do ADR-37, que este ADR
  **desbloqueia** ao dar um dono à coluna.
- **Não trata o score 3× no Notion** — achado independente, ainda sem causa fechada.

## 7. Hipótese registrada como refutada (R6, corolário)

> *"Repontar o `client_config` para `phi_prod` sobrescreveria o CPA do KIL com `ROAS`."*

**Falso.** O KIL já existe na tabela, então cai em `WHEN MATCHED`, que **não atualiza**
`primary_metric_type`. A precaução do ADR-37 §Fase 3 (fazer 3.1 antes de 3.2) continua **certa** —
mas pelo motivo errado: ela protege **o cliente novo**, que entra por `WHEN NOT MATCHED`, não o
cliente existente.

**Registrado para que a próxima auditoria não levante o mesmo alarme.**
