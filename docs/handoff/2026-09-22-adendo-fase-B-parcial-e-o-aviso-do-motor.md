# [ADENDO] Fase B parcial autorizada + a verificação do "não sei julgar"

> Cole no **mesmo sub-chat** do ADR-39+40. Continuação, não brief novo.
> ✅ **Olavo autorizou em 22/09: "Sim, destrava o que dá."**

---

## 1. O que está autorizado

**B1, B3 e B5.** Nenhum depende do CHA.

| # | Passo | Cuidado |
|---|---|---|
| **B1** | Repontar o `MERGE` do workflow `client_config` de `phi_dev` para **`phi_prod`** | `dataset.table` entre backticks **sem project ID** (Regra Crítica nº 1) — corrija a dívida junto |
| **B3** | Remover o `UPDATE` de `client_config` do `PHI - Subworkflow Campanhas` | já **sem função**: o tipo viaja com a campanha desde 21/09 |
| **B5** | Apagar `phi_dev.client_config` + varrer os workflows por `phi_dev` | ⚠️ o `WF-T28-Orquestrador` também lê `phi_dev` — **reporte, não conserte** |

## 2. 🔴 O que continua parado, e por quê

| | |
|---|---|
| **B2** (cadastrar o CHA e vê-lo chegar ao score) | **sem base** — ele não tem campanha em execução. Você estava certo |
| **B4** (remover a coluna + tirar o `COALESCE`) | **depende do B2.** Você estava certo em não fazer |

> **O CA3 fica PENDENTE, declarado.** O chat-mãe **descartou** criar campanha de teste no Notion:
> esta casa já pagou caro por transformar dado de teste em evidência. **O F1 fecha com cliente real
> entrando, e não antes.**

## 3. ⭐ A verificação nova — e faça-a ANTES do B1

O Olavo decidiu duas coisas que mudam o alvo:

1. **CPL e CPA são diferentes** — a hipótese de vocabulário caiu. É motor mesmo.
2. Sobre outras réguas: *"não sei ainda"* — e escolheu a opção que diz que **o motor deveria dizer
   claramente "não sei julgar isto" em vez de devolver score nulo silencioso.**

**Antes de propor construir qualquer coisa (R7), responda:**

| # | Pergunta |
|---|---|
| **M1** | O `'METRIC_TYPE_UNSUPPORTED'` que aparece no SQL **é gravado em alguma coluna**, ou só existe dentro da expressão? |
| **M2** | Se é gravado: **ele chega ao Notion?** Em qual campo? **O Olavo o veria?** |
| **M3** | Quando o tipo não é suportado, o que o gestor vê hoje na tela — campo vazio, "sem dado", ou nada que o distinga de um dia sem coleta? |

> 🔴 **Se o estado já existe e só não chega à tela, o conserto é de entrega — talvez uma linha.** Se
> não existe, é desenho, e volta ao chat-mãe.
>
> **Ensinar o motor a calcular CPL/ROAS/CPC é obra. Fazer o motor dizer que não sabe é o mínimo que
> impede o pior caso: campanha sendo monitorada de mentira.** Primeiro o aviso, depois as réguas.

## 4. ⛔ Não faça

- **Não ensine o motor a calcular CPL** — precisa de ADR, e o Olavo ainda não dimensionou.
- **Não corrija o `regras-otimizacao-metodo-subido.md`.** A divergência CPL×CPA foi **anotada** lá, e
  **a correção é do Olavo** — é o método dele. Inventar a definição alheia num documento normativo é
  pior que deixá-lo impreciso com a divergência à vista.
- **Não conserte o `ingestion_step`** que não acompanha quem escreveu (seu achado de hoje). Ele
  **some quando a Fase 2 do ADR-37 aposentar o segundo writer** — e o B3 é um passo nessa direção.
- **Não toque** no score 3× (F2), no grão de anúncio (F4) nem na Prospecção.

## 5. Critérios que fecham com este adendo

| # | Critério | Como se prova |
|---|---|---|
| **CA1** | `phi_prod.client_config` tem **um** writer | ler os nós dos dois workflows |
| **CA9** | `phi_dev` não é escrito nem lido | varredura — e a lista do que ainda cita `phi_dev` |
| **CA10** | Nada rodou fora de **09h–23h** | — |
| **novo** | **M1–M3 respondidas**, com onde você leu | — |

**Ficam pendentes e declarados:** CA2, CA3, CA5, CA6, CA7 (dependem de cliente ou do B4).

## 6. Sobre o seu relatório de hoje

Três coisas suas foram aceitas e registradas no ADR-40 §10, com o seu nome no achado:

- o **`ingestion_step` que mente** virou §10.2 — e é mais um argumento para a Fase 2 do ADR-37;
- o **motor só-CPA** virou §10.3, com a sua frase: *"não foi causado pelo ADR-40, foi tornado
  visível por ele"*;
- e uma consequência que **nem você nem eu tínhamos visto** (§10.4): o mapa fixo gravava `'ROAS'` e
  o motor só aceita `'CPA'`. **A opção A — que eu havia recomendado — teria feito todo cliente novo
  nascer com score `NULL`, silenciosamente, aparecendo só no segundo cliente.** A sua opção D evitou
  um defeito que ninguém tinha enxergado.
