# ADR-40 — A Métrica-Mãe viaja com a campanha

| | |
|---|---|
| **Status** | 🟡 **PROPOSTO** — 2026-09-21 · **condicionado a 4 verificações** (§5). Autor da proposta: executor do ADR-39 ("opção D") |
| **Escopo** | Onde mora `primary_metric_type`: por cliente ou por campanha |
| **Decisor** | Olavo |
| **Relação com o ADR-39** | **não o substitui.** O ADR-39 conserta *quem escreve e o `INSERT`*; este muda *o grão* |
| **Destrava** | **Fase 2 do ADR-37** (aposentar o `GADS_INSERT`) sem quebrar o KIL |
| **Base** | `regras-otimizacao-metodo-subido.md` §2 · `PLANO-ENTREGA-FINAL-PHI.md` §4.2 |

---

## 1. A proposta, verbatim

> *"`primary_metric_type` passa a viajar com a campanha em `raw_campaign_data`, ao lado da meta que
> já está lá. Os dois writers já leem a Métrica-Mãe da campanha; só precisam gravá-la. Isso dissolve
> o conflito em vez de declará-lo, corrige o bug da 'última campanha ganha', e destrava a Fase 2 do
> ADR-37 — o `UPDATE` fica sem função e aposentar o Subworkflow deixa de quebrar o KIL. Custo: mexe
> no schema, nos dois writers e no SQL do score. É arquitetura, precisa de ADR próprio."*

## 2. Por que a direção está certa

| Argumento | Fundamento |
|---|---|
| **A Métrica-Mãe é atributo do objetivo, e objetivo é da campanha** | `regras-otimizacao-metodo-subido.md` §2 — tabela *"Métrica-mãe por objetivo"* |
| **Dissolve o conflito em vez de declarar dono** | o M1 deixa de ser negociado: **não há dois writers numa coluna que não existe mais ali** |
| **Destrava a Fase 2 do ADR-37** | sem função, o `UPDATE` do `PHI - Subworkflow Campanhas` sai sem risco |
| **É o mesmo movimento do F4, um nível acima** | *dado guardado num grão mais grosso do que o grão onde a decisão mora* |

> **É melhor que a opção A do ADR-39.** A opção A escolhe um dono para uma coluna que está no lugar
> errado; a D tira a coluna do lugar errado. **Resolver um conflito é bom; fazer o conflito deixar de
> existir é melhor.**

## 3. 🔴 O bug da "última campanha ganha"

Com a métrica no cliente e o writer fazendo `UPDATE … WHERE client_id`, **um cliente com duas
campanhas de objetivos diferentes tem uma só régua** — e quem processar por último define qual.

| Campanha | Objetivo | Métrica-Mãe correta |
|---|---|---|
| Salão | Leads | **CPA** |
| (hipotética) Vendas | Vendas | **ROAS** |

**As duas seriam julgadas pela mesma.** Hoje não acontece porque há 1 campanha por cliente — **é a
mesma coincidência de tamanho que o Olavo apontou nos anúncios**, e ela acaba com o segundo cliente.

## 4. A consequência de pôr num fato diário — e por que é boa

`raw_campaign_data` é tabela de **fato, por dia**. A métrica seria repetida em toda linha de todo dia.

> **Isso não é desperdício: é registro histórico da régua.** Se a Métrica-Mãe de uma campanha mudar
> em novembro, o score de outubro continua dizendo **com que régua foi julgado naquele dia** — que é
> exatamente a razão de existir do `client_goal_history`.
>
> ⚠️ **Mas precisa ser escolhido de propósito**, não herdado: *a régua histórica é imutável, ou
> recalculamos o passado quando a métrica muda?* **Recomendo imutável** — recalcular o passado apaga
> o motivo pelo qual se agiu na época, e é o oposto da R-B (acumular aprendizado).

## 5. 🔴 As 4 verificações antes de aceitar (R6)

**A proposta contém uma afirmação que não foi provada e que decide o custo inteiro:**

> *"Os dois writers já leem a Métrica-Mãe da campanha; só precisam gravá-la."*

**Se for verdade, o custo é pequeno. Se for falsa, o custo é outro ADR.** E esta casa já pagou caro
por autorizar com base em afirmação escrita sem abrir o nó — foi o **P-27**, que deixou o PHI
reportando *"sem histórico"* em campanha com 250 dias de série.

| # | Verificação | Por quê |
|---|---|---|
| **V1** | **Os dois writers realmente leem a Métrica-Mãe da campanha?** De qual campo, de qual DB? | o as-built §A9 diz que o `client_config` usa um **mapa fixo** (`metricDefaultMap`), não a Métrica-Mãe |
| **V2** | **Onde a Métrica-Mãe mora no Notion** — DB Campanhas ou DB Clientes? | se está em Clientes, mover o dado exige **mudar o cadastro**, e isso é trabalho do Olavo, não de workflow |
| **V3** | **Quantos lugares leem `client_config.primary_metric_type`?** | o SQL do score é um. **Se houver outros, cada um é uma alteração a mais** |
| **V4** | **A coluna sai de `client_config` ou fica órfã?** | regra do Olavo (21/09): *descartar exige dizer o que entra no lugar* |

## 6. Recomendação

**Aceitar a direção; condicionar a execução ao resultado das 4 verificações.** Elas são baratas —
leitura de nó e de schema — e definem se isto é um ADR pequeno ou grande.

### Ordem com o ADR-39, que está em execução agora

**O ADR-39 continua, sem pausa.** Ele resolve *cliente novo entra no score* (**F1**), que não depende
de onde a métrica mora.

> ⚠️ **Uma decisão fina, e recomendo manter:** o **passo 4.1 do ADR-39** (corrigir a derivação para
> ler a Métrica-Mãe em vez do `ROAS` fixo) vira **trabalho descartável** se este ADR for aceito.
> **Manter mesmo assim.** É barato, e entre um ADR e outro haverá semanas — cliente novo entrando
> com `ROAS` fixo nesse intervalo é pior que o retrabalho.
