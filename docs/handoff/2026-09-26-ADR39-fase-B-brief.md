# [BRIEF sub-chat] ADR-39 Fase B — dar dono único ao `client_config` e matar o `phi_dev`

> **Como usar:** sub-chat **novo**. Cole este arquivo como primeira mensagem.
> **Modelo:** Opus · **Repo:** `olavofranzin/phi` · **Branch:** `claude/consolidacao-2026-08`
> **Papel do Olavo:** **ponte.** Decisão que aparecer → **pare e devolva ao chat-mãe.**
>
> 🔴 **Esta etapa ALTERA PRODUÇÃO e tem um passo irreversível.** Leia o §3 antes de tocar em nada.

---

## 0. Por que esta etapa, e por que agora

**Hoje, um cliente novo que você cadastra no Notion nunca chega ao score.** O writer de produção do `phi_prod.client_config` é um `UPDATE` **sem `INSERT`**; o que **insere** grava no `phi_dev`, que o score não lê. O `INNER JOIN` elimina o cliente — **sem erro e sem alarme**.

> *"A única razão de o KIL funcionar é que alguém inseriu aquela linha à mão, um dia, e o `UPDATE` a mantém viva."* — ADR-39 §2

| | |
|---|---|
| **ADR** | `ADR-39-dono-unico-client-config.md` — **ACEITO**, Fase A concluída em 21/09, **Fase B nunca começou** |
| **Fecha** | o **F1** do ponto final · o **D2** (`phi_dev` some) |
| **Destrava** | a **Fase 3 do ADR-37** e, por consequência, a **Fase 2** |
| **Custo de modelo** | **zero** — nenhum nó de LLM |
| 🔴 **Pré-requisito** | **a Fase R do ADR-37** (`2026-09-26-ADR37-raw-campaign-data-fase-R-brief.md`) — a resposta **R7** dela diz se o `UPDATE` do passo 4.4 ainda tem função. **Sem ela, o 4.4 é chute** |

---

## 1. 🔴 As seis regras desta etapa

| # | Regra |
|---|---|
| **1** | **Janela de manutenção 09h–23h** (D9). Fora dela, não execute |
| **2** | **Os passos 4.2, 4.3 e 4.4 acontecem na MESMA SESSÃO** (R12). Entre o 4.2 e o 4.4 existe uma janela com **dois writers vivos na mesma coluna** — ela é aceitável só porque é **curta e declarada** |
| **3** | 🔴 **O 4.4 é o único irreversível na prática.** Antes dele, o CA1 e o CA2 têm de estar provados |
| **4** | **R13 inteira**: leia `activeVersion`, compare `versionId` com `activeVersionId`, e **releia depois de publicar** |
| **5** | 🔴 **Remeça a linha de base antes de mexer** (R6, corolário 2). A do ADR é de **20/09** — seis dias. **Número lido não é número medido** |
| **6** | **Limite de 3 voltas** (R9). Se o dado desmentir o plano: **pare, não execute, registre** |

---

## 2. O que mudou desde que o ADR foi escrito — leia antes de seguir o §4 dele

| Mudança | Efeito no plano |
|---|---|
| **ADR-40 aceito** — `primary_metric_type` viaja com a campanha | 🔴 o passo **4.1 está REVOGADO**. A coluna **sai** do `client_config`; não se corrige a derivação de um campo que será removido |
| **Fase A executada** (21/09) | os dois writers de `raw_campaign_data` já gravam a Métrica-Mãe |
| 🔴 **O CA3 perdeu o caso de prova** | a campanha do CHA foi **encerrada em 22/09**, e a Métrica-Mãe dela é **`CPL`**, que o motor do score **não sabe calcular**. O CHA chegaria e sairia com `phi_value` NULL |
| **O vigia está no ar** (26/09) | o **V3** pergunta todo dia se todo cliente ativo aparece no score — **a falha deixou de ser silenciosa** |

---

## 3. 🔴 O CA3 estava conflando duas coisas — e é por isso que esta etapa travou

**O ADR pede: *"um cliente novo do Notion chega ao score"*. São duas perguntas, e só uma é deste ADR:**

| | Pergunta | De quem é | Dá para provar hoje? |
|---|---|---|---|
| **CA3a** | o cliente novo **ganha linha em `phi_prod.client_config`** | 🟢 **deste ADR** | ✅ **sim** |
| **CA3b** | o cliente novo **recebe `phi_value`** | 🔴 **do F1** — exige campanha real coletando | ❌ **não** — não há cliente novo |

> **Separar os dois destrava a etapa sem fingir nada.** O ADR-39 entrega o CA3a. O CA3b fica
> explicitamente em aberto, **e o V3 do vigia avisa no dia em que acontecer.**

### Como provar o CA3a sem esperar cliente real

**Com um cliente de teste declarado e datado**, no padrão que a casa acabou de adotar:

1. Cadastre no Notion um cliente de teste, **com `Tipo = Teste`** (ou, se a propriedade ainda não existir, com a palavra `TESTE` no nome **e** registrado neste brief e no relatório)
2. Rode o `client_config` e confirme a linha nascendo em **`phi_prod`** por `WHEN NOT MATCHED`
3. **Remova-o na mesma sessão** e registre a remoção

🔴 **A Métrica-Mãe do cliente de teste tem de ser `CPA`.** O motor do score **só calcula CPA** — qualquer outra sai `METRIC_TYPE_UNSUPPORTED`, e você concluiria que falhou quando não falhou.

⚠️ **Sem declarar e sem datar, você cria o terceiro caso de dado de teste morando em produção.** Os dois primeiros já custaram uma exceção no vigia cada um.

---

## 4. Os passos — nesta ordem, e só nesta

| # | Passo | Se fizer fora de ordem |
|---|---|---|
| ~~4.1~~ | 🔴 **REVOGADO** (ADR-40) | — |
| **4.0** | 🔴 **Remedir a linha de base**: quem escreve hoje, o que tem a linha do `CLI-4`, e o que o `phi_dev` ainda guarda | sem isso você opera em cima de número de seis dias atrás |
| **4.2** | Repontar o `MERGE` do workflow `client_config` (`SI5NSzRb8lVUz74RwOhIT`) de `phi_dev` para **`phi_prod`** | — |
| **4.3** | Garantir que o `MERGE` **INSERE** e provar o **CA3a** com o cliente de teste (§3) | 🔴 sem isso, o bug do cliente-fantasma continua |
| **4.4** | 🔴 **Só então** remover o `UPDATE` do `PHI - Subworkflow Campanhas` | 🔴 **antes do 4.3, o KIL fica sem nenhum writer e o CPA vira o que estiver na linha** |
| **4.5** | Apagar `phi_dev.client_config` e fechar o **D2** | — |

> ✅ **Hipótese já refutada, não a levante de novo:** *"repontar sobrescreveria o CPA do KIL com ROAS"*
> — **falso.** O KIL cai em `WHEN MATCHED`, que não toca essa coluna. A precaução continua certa, mas
> protege **o cliente novo**, não o existente.

---

## 5. Critérios de aceite — escritos antes (R9)

| # | Critério | Como se prova |
|---|---|---|
| **CA1** | `phi_prod.client_config` tem **UM** writer | ler os nós dos dois workflows e confirmar |
| **CA2** | O KIL continua **`CPA`** | consultar a linha do `CLI-4` **depois** do 4.4, nunca antes |
| **CA3a** | 🟢 Cliente novo **ganha linha em `phi_prod`** | o cliente de teste do §3, nascendo por `WHEN NOT MATCHED` |
| **CA3b** | ⬜ Cliente novo **recebe score** | **fica em aberto** — não há cliente real. O V3 do vigia avisa no dia |
| **CA5** | `phi_dev` não é mais escrito nem lido | varrer os workflows por `phi_dev` — 🔴 **inclui o `WF-T28-Orquestrador`**, que lê `phi_dev.t28_campaign` |
| **CA6** | Nada rodou fora da janela **09h–23h** | horário das execuções |
| **CA7** | 🔴 **O que foi publicado é o que está no ar** | reler: `versionId == activeVersionId` |
| **CA8** | **O cliente de teste foi removido na mesma sessão** | consultar a tabela ao fim (R12) |

> ⚠️ **O CA4 do ADR original** (*"a Métrica-Mãe do Notion vence o mapa fixo"*) **ficou inválido**: com
> o ADR-40 a coluna sai do `client_config`. **Não tente prová-lo.**

---

## 6. ⛔ Fora do escopo

- ❌ **Não aposente o `PHI - Subworkflow Campanhas`** — isso é a Fase 2 do ADR-37, que esta etapa **destrava** e não executa
- ❌ **Não toque no `WF-T28-Orquestrador`.** O CA5 só o **denuncia**
- ❌ **Não conserte o `client_id` vazio** do `sw metricas campanhas` — é da Fase R
- ❌ **Não mexa no vigia, no índice, no Agregador**
- ❌ **Nenhum nó de LLM**

---

## 7. O que entregar

| # | Entrega |
|---|---|
| 1 | **Relatório de execução** com a prova de cada CA, número de execução ao lado — `docs/handoff/2026-09-__-ADR39-fase-B-relatorio.md` |
| 2 | **ADR-39 atualizado**: cabeçalho dizendo que a Fase B ocorreu, a data, e o que ficou diferente do plano (R2 item 5 — **o cabeçalho é o que se lê**) |
| 3 | **Descrições dos workflows alterados** (R5), dizendo o que mudou e por quê |
| 4 | **Linha no Notion** ao começar e ao encerrar (R3) |
| 5 | Se algum passo não ocorrer: **qual, por quê, e o que ficou no lugar** |

---

## 8. Como falar com o Olavo

- Ele é **ponte**. Decisão → **pare, escreva a pergunta com opções e consequências, devolva.**
- 🔴 **Publicar/ativar nesta etapa NÃO está pré-autorizado** — a autorização de 26/09 valia para o vigia. **Aqui você para antes do 4.4 e pede**, porque é o passo irreversível.
- **Separe o que leu do que mediu.** Nesta etapa, **só o medido conta**.
