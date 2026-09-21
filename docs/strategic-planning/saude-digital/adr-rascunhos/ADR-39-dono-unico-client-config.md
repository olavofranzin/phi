# ADR-39 — Dono único de `client_config`, e o fim do `phi_dev`

| | |
|---|---|
| **Status** | ⏸️ **ACEITO, EXECUÇÃO SUSPENSA NA VOLTA 1** — aceito por Olavo em 2026-09-20 na **opção A** do §3; a execução **parou antes do passo 4.1** em 2026-09-20 21h BRT |
| **Data efetiva da execução** | ⬜ **não ocorreu.** Nada foi alterado em produção. O `client_config` segue em `versionId = activeVersionId = 99abdada` |
| **Por que parou** | 🔴 **O passo 4.1 não tem fonte: a DB Clientes do Notion não possui campo `Métrica-Mãe`.** Ela é **por campanha**, na DB Campanhas — ver §8 |
| **Destrava com** | **uma decisão do Olavo** entre as 3 saídas do §8.4 · relatório: `docs/handoff/2026-09-20-adr39-volta-1-relatorio-do-defeito.md` |
| **Escopo** | Quem escreve `client_config`, em qual ambiente, e em que ordem a troca acontece |
| **Origem** | **D3** do `CONTRATO-PHI.md`, reaberta pelo as-built de 20/09 (achado **A10**) |
| **Decisor** | Olavo |
| **Bloqueia** | **Fase 3 do ADR-37** — e, por consequência corrigida, a **Fase 2** |
| **Base factual** | `docs/handoff/2026-09-20-parque-phi-lista-A-as-built.md` §A9, §A10, §A15 |
| **Destrava** | o **D2** (`phi_dev` some) e o cadastro de cliente novo no score |

---

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
| **4.1** | Corrigir a derivação de `primary_metric_type` no nó `Code limpar Notion`: **ler a Métrica-Mãe do Notion**, não o mapa fixo | — |
| **4.2** | Repontar o `MERGE` de `phi_dev` para `phi_prod` | 🔴 **antes de 4.1**, cliente novo entra com `ROAS` fixo e o score dele nasce errado |
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

---

## 8. 🔴 Volta 1 — o que a execução encontrou (2026-09-20, 21h BRT)

> **R6 aplicada:** *"Antes de uma ação irreversível ou em produção, verifique a premissa que a
> justifica — mesmo que o plano já esteja aceito num ADR. Se o dado desmentir o plano: pare, não
> execute, corrija o ADR e registre o porquê."* **A premissa do §4.1 não sobreviveu.**
> Relatório completo: `docs/handoff/2026-09-20-adr39-volta-1-relatorio-do-defeito.md`.

### 8.1. A premissa que caiu

O §4.1 manda `primary_metric_type` **vir da Métrica-Mãe do Notion**. **A DB Clientes
(`19fb65e5-c72b-8147-8aa3-c63aa273d205`), que é a única que o workflow `client_config` lê, não tem
essa propriedade.** Suas 38 propriedades foram lidas hoje: não há nenhuma de tipo de métrica.

A `Métrica-Mãe` existe na **DB Campanhas**, como `multi_select`, **uma por campanha**. É de lá que o
`PHI - Subworkflow Campanhas` a lê.

**O choque é de grão:** `client_config.primary_metric_type` é **um valor por cliente**; a
`Métrica-Mãe` é **uma por campanha**. Um cliente com duas campanhas pode ter duas métricas
diferentes, e não existe regra para o empate. O KIL não expõe isso só porque suas duas campanhas são
`CPA`.

### 8.2. O CHA não serve de prova para o CA3

O §0 do brief diz que o cadastro não chega ao score *"e por isso o CHA não existe para o PHI"*. A
primeira metade está certa. **A segunda não:** o `client_config` é o **primeiro de três portões**, e
os outros dois estão fora deste ADR.

| # | Portão | CHA | Deste ADR? |
|---|---|---|---|
| 1 | linha em `phi_prod.client_config` | 🔴 não | ✅ **sim** |
| 2 | linha em `raw_campaign_data` (`WHERE j.tem_d1 = 1`) | 🔴 **não haverá** — a campanha do CHA é **Meta**, e o Subworkflow manda Meta para o noOp `Meta Ads — em breve` | ❌ é o **D11** (*depois do v1*) |
| 3 | `primary_metric_type = 'CPA'` | 🔴 não — a Métrica-Mãe do CHA é **`CPL`** | ❌ é o ADR-34 |

O score só sabe `CPA`: no nó `Calcular e Persistir PHI Score`, CTE `qualidade`,
`WHEN primary_metric_type IS NULL OR primary_metric_type != 'CPA' THEN 'INSUFFICIENT_DATA'` (e
`'METRIC_TYPE_UNSUPPORTED'`).

### 8.3. O raio de alcance é 3×, não 1

A DB Clientes tem **três** `ATIVO`, não um: **CLI-4** (KIL, Google, CPA), **CLI-7** (RODRIGO VIEIRA
CLARA — **sem campanha e sem conta de anúncio**, serviço é *Criação de Site*) e **CLI-13** (CHA,
Meta, CPL). Repontar o `MERGE` insere os três.

### 8.4. As três saídas — pendente de decisão do Olavo

| | Saída | Custo | Risco |
|---|---|---|---|
| **A** ⭐ | criar `Métrica-Mãe` na **DB Clientes** e o `Code limpar Notion` lê de lá | 1 propriedade + 3 preenchimentos | baixo; mantém a fonte da verdade no Notion, que é o argumento do §3 |
| **B** | derivar do grão de campanha (ler também a DB Campanhas) | lógica nova | 🔴 exige **regra de empate** — regra nova sem ADR é R7 quebrada |
| **C** | tirar `primary_metric_type` do escopo: `client_config` fica dono do resto e o `UPDATE` do Subworkflow vira **padrão S4 declarado** | zero | ⚠️ dois writers, colunas disjuntas — **exceção que o M1 já permite** |

### 8.5. O que muda no §4 deste ADR quando a decisão vier

- **Se A:** o §4.1 continua válido, com a fonte corrigida para a nova propriedade.
- **Se C:** o §4.1 e o §4.4 **saem** da ordem; o ADR passa a ter 3 passos (repontar, provar o
  `INSERT`, fechar o `phi_dev`), e o §4.4 vira *"declarar o padrão S4 no §4.1 do contrato"*.
- **Se B:** entra um §4.0 novo — a regra de empate — e ele precisa ser aceito antes.

### 8.6. Hipóteses deste ADR que o dado desmentiu

| # | O ADR dizia | O artefato mostra |
|---|---|---|
| 1 | §4.1: ler *"a Métrica-Mãe do Notion"* | **não existe** no grão de cliente |
| 2 | §5 CA3: o CHA é *"o caso real esperando"* | o CHA é barrado por **dois portões fora deste ADR** |
| 3 | §4.2: *"cliente novo entra com ROAS fixo e o score dele nasce errado"* | **não nasce** — `ROAS != 'CPA'` vira `INSUFFICIENT_DATA` |
| 4 | §2/§4.3: o caso é o CHA | são **três** clientes ativos, um deles sem mídia paga |

> ✅ **O que este ADR acertou e segue de pé:** o diagnóstico do §1 (dois writers, mesma coluna,
> ambientes diferentes), a refutação do §7 (repontar não sobrescreve o CPA do KIL), e a **ordem** do
> §4 — que continua certa, e é justamente por respeitá-la que a execução parou no primeiro passo em
> vez de quebrar o KIL no quarto.
