# ADR-40 — A Métrica-Mãe viaja com a campanha

| | |
|---|---|
| **Status** | 🟢 **PRONTO PARA ACEITE** — 2026-09-21 · **as 4 verificações passaram** (§5.1) · aguarda OK do Olavo. Autor da proposta: executor do ADR-39 ("opção D") |
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
> em novembro, o score de outubro continua dizendo **com que régua foi julgado naquele dia**.
>
> ⚠️ **Mas precisa ser escolhido de propósito**, não herdado: *a régua histórica é imutável, ou
> recalculamos o passado quando a métrica muda?* **Recomendo imutável** — recalcular o passado apaga
> o motivo pelo qual se agiu na época, e é o oposto da R-B (acumular aprendizado).

> 🔴 **CORREÇÃO DE 21/09 — eu escrevi que isto era "a razão de existir do `client_goal_history`",
> sugerindo que a régua histórica já existia.** Não existe. A verificação V3 mostrou que
> **`phi_score_history` não guarda `primary_metric_type`**: 30 colunas no `INSERT`, nenhuma é essa.
> Há régua versionada para a **meta** (`client_goal_history`, com `valid_from`/`valid_until`) e
> **nenhuma para o tipo**.
>
> **Um score de julho não sabe contra o que foi julgado.** O ADR-40 não preserva a régua histórica —
> **ele a cria.** Isso o torna mais valioso do que eu havia avaliado, não menos.

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

## 5.1. ✅ Resultado das verificações (executor, 2026-09-21)

### A premissa se sustenta — a ambiguidade era da redação

> *"Quando escrevi 'os dois writers', eu falava dos dois writers de `raw_campaign_data`. O §A9 fala
> do workflow `client_config`, que não é writer de `raw_campaign_data` — é um terceiro workflow. As
> duas afirmações são verdadeiras ao mesmo tempo."*

**Ele tem razão, e a dúvida era legítima dos dois lados.** A frase não era falsa; era ambígua — e
numa casa com o P-27 na memória, **ambiguidade sobre uma premissa que decide custo é tratada como
defeito**. A verificação custou quatro leituras e comprou certeza. Foi barata.

### V1 — os writers leem, e o artefato diz mais do que a proposta afirmava

| Writer | Onde lê | Observação |
|---|---|---|
| `sw metricas campanhas` | `Get many database Campanhas` filtra **`Métrica-Mãe is_not_empty`** · `Code Clean Campanhas` emite `clean_metrica_mae` | 🟢 **a Métrica-Mãe já é obrigatória** — campanha sem ela **nem entra na coleta** |
| `PHI - Subworkflow Campanhas` | `props['Métrica-Mãe'].multi_select[0].name` | 🔴 com **`\|\| 'ROAS'`** no fim — **fallback silencioso** |

> 🟢 **E o achado que barateia tudo:** os dois **já leem, carregam e jogam fora na porta do
> BigQuery**. No `Code Montar SQL` a meta é buscada em `context.raw_notion_data.clean_meta_metrica_mae`
> — **o tipo está no mesmo objeto**, como `clean_metrica_mae`. **É a mesma expressão, trocando o nome
> do campo.**

### V2 — a Métrica-Mãe já mora na campanha, e o cadastro do Olavo não muda

**DB Campanhas**, `multi_select`, ao lado da *"Meta da Métrica-mãe"*. **Não existe na DB Clientes** —
as 38 propriedades foram enumeradas.

> **Isto é o argumento decisivo contra a opção A do ADR-39:** aquela teria pedido um **campo novo** e
> **três preenchimentos manuais** do Olavo. **A opção D não pede nada dele.** O dado já está no lugar
> certo no Notion — só não chega ao BigQuery.

### V3 — um leitor interno, dois consumidores na tela

| Onde | O quê |
|---|---|
| `Pipeline_v2` | 13 ocorrências, 3 nós de SQL. Zero no Agregador, no `sw metricas anuncios` e no `sw metricas campanhas` |
| ⚠️ `Buscar Clientes Ativos` | **parece morto**: seleciona a coluna, e o subworkflow que recebe o item só aceita 3 campos, nenhum é o tipo |
| 🔴 **Notion** | **`Métrica Afetada`** na **Tarefa** e no **Log de Otimizações** |

> 🔴 **Não é coluna interna: ela chega na bancada do Olavo.** Se estiver errada para uma das duas
> campanhas de um cliente, **a tarefa que ele abre mente.** Isso a põe direto sob a **D10** —
> *número errado no Notion acorda o Olavo*.

### V4 — sai uma, entram duas

| Sai | Entra | Responde |
|---|---|---|
| `client_config.primary_metric_type` | **`raw_campaign_data.primary_metric_type`** | *"qual é a métrica desta campanha hoje?"* — **estado** |
| | **`phi_score_history.primary_metric_type`** | *"contra o que este score de 12/07 foi julgado?"* — **história** |

**Aceito, e é melhor que a proposta original** (que previa só a primeira). São perguntas diferentes,
e juntá-las numa coluna só seria a mesma doença de sempre: **dois fatos na mesma célula.**

## 6. Os 3 requisitos que saíram das verificações

Nenhum deles estava na proposta. **Os três são condição de aceite, não detalhe de implementação.**

| # | Requisito | Por quê |
|---|---|---|
| **REQ-1** | 🔴 **O `\|\| 'ROAS'` do `PHI - Subworkflow Campanhas` vira erro alto** | hoje o fallback só suja uma coluna de configuração. **Depois do ADR-40 ele passa a carimbar o tipo errado em toda linha de fato** — e, pela V3, a mentira chega à tarefa no Notion. **Tipo errado viajando com a campanha é pior que tipo no lugar errado** (achado do executor, e ele está certo) |
| **REQ-2** | 🔴 **Backfill obrigatório, a partir do `client_config` atual** | `ADD COLUMN` nasce `NULL`, e **a porta de qualidade do score reprova `NULL` como `INSUFFICIENT_DATA`**. Sem backfill, **recalcular qualquer dia passado derruba a série inteira** |
| **REQ-3** | **O `COALESCE` de transição tem prazo escrito** | é a **R12**: estado temporário sem prazo vira permanente invisível. O `COALESCE` existe para cobrir a janela entre o `ADD COLUMN` e o backfill — **e some quando ela fecha** |

> **O REQ-2 é o risco real deste ADR, e ele não está no código.** O executor: *"o risco não está no
> código; `ADD COLUMN` nasce NULL."* **Concordo — e é exatamente o tipo de dano que só apareceria
> semanas depois, na primeira tentativa de recalcular o passado.**

## 7. ⚠️ Ressalva de leitura (R13)

As verificações foram feitas sobre **dumps das `activeVersion` lidas em 20/09** e guardadas em
arquivo — o conector do n8n caiu durante a sessão. **Cada afirmação traz o `versionId` que foi lido.**

**Risco avaliado: baixo** — o ADR-39 não executou nada, então **nada mudou por nossa mão** nesse
intervalo. **Mas a reconfirmação é obrigatória no momento da execução**, não agora: confirmar que os
`versionId` citados continuam sendo os publicados. É a R13 aplicada ao próprio relatório que a cita.

## 8. Custo

**6 artefatos · 2 DDL · ~15 linhas de código** — mais o backfill do REQ-2, que é o trabalho de
verdade.

## 9. Recomendação

**ACEITAR.** As quatro verificações passaram, a premissa se sustenta, o cadastro do Olavo não muda,
e o ADR **cria** uma régua histórica que não existia. É a categoria barata — com os três requisitos
do §6 como condição, não como sugestão.

### Ordem com o ADR-39, que está em execução agora

**O ADR-39 continua, sem pausa.** Ele resolve *cliente novo entra no score* (**F1**), que não depende
de onde a métrica mora.

> ⚠️ **Uma decisão fina, e recomendo manter:** o **passo 4.1 do ADR-39** (corrigir a derivação para
> ler a Métrica-Mãe em vez do `ROAS` fixo) vira **trabalho descartável** se este ADR for aceito.
> **Manter mesmo assim.** É barato, e entre um ADR e outro haverá semanas — cliente novo entrando
> com `ROAS` fixo nesse intervalo é pior que o retrabalho.
