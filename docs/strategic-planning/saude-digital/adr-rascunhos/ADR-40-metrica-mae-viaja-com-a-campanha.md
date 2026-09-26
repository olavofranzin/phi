# ADR-40 — A Métrica-Mãe viaja com a campanha

| | |
|---|---|
| **Status** | ✅ **ACEITO** — **Olavo, 2026-09-21** · as 4 verificações passaram (§5.1) · execução **fundida com o ADR-39** no brief `2026-09-21-adr39-adr40-metrica-e-cadastro-subchat-brief.md`. Proposta original: executor do ADR-39 ("opção D") |
| **Data efetiva da execução** | 🟡 **Fase A: 2026-09-21, 19h–22h BRT.** Os 3 requisitos do §6 estão CUMPRIDOS em produção: **REQ-1** (`\|\| null` no `PHI - Subworkflow Campanhas`, versão `4f42b244`) · **REQ-2** (backfill feito: 487 linhas casaram, 12 seguem `NULL` — ver abaixo) · **REQ-3** (sticky com prazo **22/09/2026** no `PHI - Pipeline_v2`, versão `b880adee`). **Fase B: ⬜ não ocorreu** |
| **Conferência da PARADA (22/09)** | ✅ **as 3 passaram**, com dado. E a rodada manual do `sw metricas campanhas` (exec **41967**) **provou o A3b**: o `Code Montar SQL` gerou `'CPA' AS primary_metric_type` para as duas campanhas do KIL, vindo da Métrica-Mãe. Relatório: `docs/handoff/2026-09-22-conferencia-parada-e-o-B2-sem-base.md` |
| 🔴 **O motor só calcula CPA** | descoberto em 22/09: a porta de qualidade do score reprova qualquer `primary_metric_type != 'CPA'` como `INSUFFICIENT_DATA` / `METRIC_TYPE_UNSUPPORTED`. **Este ADR não causou isso — tornou visível.** Um cliente com CPL entra no score e sai com `phi_value` NULL. **Precisa de ADR próprio** |
| **Pendência conhecida** | ⚠️ **12 linhas do CHA (`CLI-13`) seguem com `primary_metric_type` NULL** em `raw_campaign_data` — o backfill sai do `client_config`, e o CHA ainda não está lá. O **CA5 não se prova** enquanto isso. ⚠️ **E o passo B2, que fecharia isso, perdeu a base** — ver o cabeçalho do ADR-39 |
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
| **REQ-1** | 🔴 **O `\|\| 'ROAS'` do `PHI - Subworkflow Campanhas` morre** — ver §6.1 para o que entra no lugar | hoje o fallback só suja uma coluna de configuração. **Depois do ADR-40 ele passa a carimbar o tipo errado em toda linha de fato** — e, pela V3, a mentira chega à tarefa no Notion. **Tipo errado viajando com a campanha é pior que tipo no lugar errado** (achado do executor, e ele está certo) |
| **REQ-2** | 🔴 **Backfill obrigatório, a partir do `client_config` atual** | `ADD COLUMN` nasce `NULL`, e **a porta de qualidade do score reprova `NULL` como `INSUFFICIENT_DATA`**. Sem backfill, **recalcular qualquer dia passado derruba a série inteira** |
| **REQ-3** | **O `COALESCE` de transição tem prazo escrito** | é a **R12**: estado temporário sem prazo vira permanente invisível. O `COALESCE` existe para cobrir a janela entre o `ADD COLUMN` e o backfill — **e some quando ela fecha** |

> **O REQ-2 é o risco real deste ADR, e ele não está no código.** O executor: *"o risco não está no
> código; `ADD COLUMN` nasce NULL."* **Concordo — e é exatamente o tipo de dano que só apareceria
> semanas depois, na primeira tentativa de recalcular o passado.**

### 6.1. O que entra no lugar do fallback — refinamento do REQ-1

**O executor propôs erro alto. Recomendo vazio, e a diferença importa.**

| Opção | O que acontece com campanha sem Métrica-Mãe | Efeito colateral |
|---|---|---|
| **Erro alto** | o nó falha | 🔴 **derruba a coleta do lote inteiro** por causa de uma campanha — e o alarme chega, mas o dado do dia se perde para todas |
| ⭐ **Vazio (`NULL`)** | a campanha é coletada; o tipo fica vazio | a porta de qualidade a reprova como **`INSUFFICIENT_DATA`** — **que é a verdade**: não dá para julgar sem saber a régua |

**Por que o vazio é a resposta desta casa:** é o **M4** literal — *campo não observado grava vazio,
nunca um valor inventado* —, é o **I3** da Prospecção, e é a **R11 regra 1** (*a falta de critério
nunca pode significar um padrão herdado*). **`'ROAS'` não é um valor: é um chute com cara de dado.**

> ⚠️ **E o vazio sozinho não basta** — senão vira a terceira cara do vazio da R11 (*"pare"* silencioso).
> **O REQ-1 só está cumprido com as duas metades:**
> 1. o tipo grava **vazio**, nunca `'ROAS'`;
> 2. **quantas campanhas ficaram sem tipo** entra na conferência diária do **vigia do F3** — vira a
>    **V7**, e o F3 ainda está em plano, então cabe sem retrabalho.

**Nota:** o `sw metricas campanhas` — o dono canônico — **já filtra `Métrica-Mãe is_not_empty`**, e
portanto nunca produz vazio. Este requisito existe só pelo `PHI - Subworkflow Campanhas`, **que está
marcado para aposentadoria na Fase 2 do ADR-37.** É trabalho de sobrevida curta — **e é exatamente
por isso que precisa ser barato**: trocar `\|\| 'ROAS'` por `\|\| null` é uma linha, erro alto é um
desenho.

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


---

## 10. O que a Fase A revelou (2026-09-22) — e a hipótese mais barata

### 10.1. ✅ Provado com dado: o writer canônico grava o tipo, vindo da campanha

Execução **41967** (22/09, 14h36 BRT), `sw metricas campanhas` rodado à mão, `success`, loop completo.
Saída do `Code Montar SQL`: `'CPA' AS primary_metric_type` para as duas campanhas do KIL, com as metas
5,20 e 3,50. **`phi_score_history` guarda a régua pela primeira vez** — 260 linhas, 0 nulos.

### 10.2. 🔴 O `ingestion_step` mente, e o desempate do score depende dele

O `WHEN MATCHED THEN UPDATE SET` do MERGE atualiza `cost`, `conversions`, `primary_metric_type`,
`ingested_at` — **e não atualiza `ingestion_step`**. Reescrita a linha, **o carimbo fica com o
primeiro writer e os números com o último**.

E o desempate do SQL do score é literalmente
`ORDER BY CASE WHEN ingestion_step = 'DAILY_ENTRY' THEN 0 ELSE 1 END`.

> **É o S1b do ADR-37 uma camada mais fundo.** Lá, o problema era que o rótulo de um writer apagava o
> do outro. Aqui é pior: **o rótulo não acompanha quem escreveu**, e um `ORDER BY` decide o vencedor
> com base nele. **Some quando a Fase 2 do ADR-37 aposentar o segundo writer** — e é mais um motivo
> para ela acontecer. Registrado, não consertado (fora do escopo).

### 10.3. 🔴🔴 O motor de score só calcula CPA

```sql
WHEN primary_metric_type IS NULL OR primary_metric_type != 'CPA'
  THEN 'INSUFFICIENT_DATA'    -- e 'METRIC_TYPE_UNSUPPORTED'
```

A Métrica-Mãe do CHA é **CPL**. Ele apareceria em `Buscar Clientes Ativos`, **o CA3 "passaria"**, e o
`phi_value` sairia `NULL`. **R11 literal: o critério verde escondendo que nada foi calculado.**

> **Não foi causado pelo ADR-40 — foi tornado visível por ele** (observação do executor, e está
> certa). Com a métrica morando no cliente por mapa fixo, ninguém via. **O parque tem duas réguas e
> o motor entende uma.**

### 10.4. ⚠️ E isto reabilita retroativamente a escolha da opção D

O mapa fixo do workflow `client_config` gravava **`'ROAS'`**. O motor rejeita tudo que não seja
**`'CPA'`**.

> **Se a opção A tivesse sido executada** — repontar o `MERGE` para `phi_prod` e deixar a coluna onde
> estava — **todo cliente novo teria nascido com `'ROAS'`**, e o motor o teria reprovado como
> `METRIC_TYPE_UNSUPPORTED`. **Score `NULL`, silenciosamente, para cada cliente que entrasse.**
>
> O KIL estava protegido (cai em `WHEN MATCHED`), então **o defeito só apareceria no segundo
> cliente** — exatamente quando a regra *"todos os que contratarem tráfego pago"* começasse a valer.
> **A opção D não foi só mais elegante: evitou um defeito que ninguém tinha visto.**

### 10.5. ⭐ A hipótese mais barata, a verificar antes de abrir ADR nenhum

**`CPL` e `CPA` podem ser o mesmo conceito com dois nomes.** O próprio método da casa equipara:

> `regras-otimizacao-metodo-subido.md` §2: **"Cadastro / Leads → CPA (Custo por Lead/Aquisição)"**

Se for isso, **não é um ADR de motor multi-métrica: é vocabulário.** A lista do `multi_select` da DB
Campanhas tem duas grafias para a mesma coisa, e a correção é normalizar o vocabulário — **horas, não
semanas.**

**Verificar antes de dimensionar qualquer obra** (é a **R7**):
1. Quais valores a lista do `multi_select` **Métrica-Mãe** oferece hoje?
2. `CPL` e `CPA` significam a mesma coisa **para o Olavo**?
3. Se sim: qual nome fica, e quem normaliza o que já está gravado?

> ⚠️ **Só depois dessas três é que se sabe se existe um problema de motor.** Pode haver — se o parque
> for ter campanha de **Tráfego** (CPC) ou **Reconhecimento** (CPM), aí o motor precisa mesmo
> aprender. **Mas isso é pergunta de negócio, não achado técnico.**


## 11. Decisões do Olavo (2026-09-22) — e a hipótese barata caiu

| Pergunta | Resposta |
|---|---|
| CPL e CPA são a mesma coisa? | "São diferentes" → 🔄 **REVISTO no mesmo dia: *"vamos manter o que está escrito nas regras de otimização e desconsiderar o que eu disse"*** — ver §11.3 |
| Vai haver outras réguas? | **"Não sei ainda"** |
| Autoriza B1, B3, B5? | ✅ **"Sim, destrava o que dá"** |

### 11.1. 🔴 A hipótese do vocabulário caiu — e revelou um defeito na régua do F4

**Minha hipótese do §10.5 estava errada**, e o modo como errou importa mais que o erro.

Eu a baseei no `regras-otimizacao-metodo-subido.md` §2, que equipara:
> *"Cadastro / Leads → **CPA (Custo por Lead/Aquisição)**"*

**O Olavo distingue.** Ao escolher *"São diferentes"*, aceitou esta definição:

> **CPL** = custo por **lead bruto**. **CPA** = custo por **aquisição de fato** (lead qualificado,
> venda).

> 🔴 **Então o documento que é a régua do F4 está impreciso num ponto que muda o diagnóstico.** O
> §4.1 do `PLANO-ENTREGA-FINAL-PHI.md` chama aquele método de *"o F4 escrito em linguagem de
> negócio"* — e ele mistura duas métricas que o dono do método separa. **Se o PHI executar o método
> como está escrito, vai julgar lead bruto e aquisição pela mesma régua.**
>
> **Correção pendente, e ela é do Olavo** (é o método dele): o §2 do método precisa separar as duas
> linhas. **Não corrigi por conta própria** — inventar a definição alheia num documento normativo é
> pior que deixá-lo impreciso com a divergência anotada.

**E a distinção não é acadêmica:** *lead bruto × lead qualificado* é exatamente o assunto do **§8 do
método** (*"Medição e qualidade de lead"*), do **ADR-29** (Guardião / integridade de medição) e do
padrão **"Curioso"** já identificado na Salão/CLI-4. **A casa já sabia que essa diferença existe —
só não a tinha posto na tabela de Métrica-Mãe.**

### 11.2. ⭐ O que fazer com *"não sei ainda"* — e é barato

O Olavo escolheu a opção que diz:
> *"o motor deveria pelo menos dizer claramente **'não sei julgar isto'** em vez de devolver score
> nulo silencioso."*

**Isso não é o ADR de motor multi-métrica.** É bem menor, e resolve o risco imediato:

| | |
|---|---|
| **Hoje** | tipo não suportado → `phi_value` **`NULL`**, silencioso |
| **Alvo** | tipo não suportado → **estado explícito**, visível na bancada do Olavo |

**Primeira pergunta a verificar, antes de construir qualquer coisa (R7):** o SQL já menciona
`'METRIC_TYPE_UNSUPPORTED'`. **Ele é gravado? Chega ao Notion? O Olavo o veria?**
**Se já existe e não chega, o trabalho é de entrega, não de motor** — e é de uma linha.

> **Ensinar o motor a calcular CPL, ROAS, CPC e CPM é obra.** Fazer o motor **dizer que não sabe** é
> o mínimo que impede o pior caso: **campanha sendo monitorada de mentira.** Ordem certa: primeiro o
> aviso, depois as réguas.


### 11.3. 🔄 A resposta foi revista pelo Olavo — o §11.1 está SUPERADO

> *"CPA e CPL podem ser confundidos porque, caso tenha uma campanha cujo objetivo é a geração de
> Leads, o Custo Por Aquisição = Custo Por Lead; mas se por ventura eu tiver uma campanha de
> mensagens no WhatsApp, por exemplo, posso separar o custo do lead do custo da venda. **Neste caso
> vamos manter o que está escrito nas regras de otimização e desconsiderar o que eu disse.**"*

| Situação | CPA e CPL |
|---|---|
| objetivo é **gerar contato** — **o caso de hoje** | **são o mesmo número.** O método está certo |
| há **venda medida além do lead** | **são dois números** — e aí a tabela do método ganha uma linha, por ADR |

**Três consequências, nesta ordem:**

1. **A divergência que anotei no método foi retirada** — a pedido dele, e porque o método está certo
   para o caso de hoje.
2. 🟢 **A hipótese barata do §10.5 volta a valer: é vocabulário, não motor.**
3. **O §11.1 fica como registro do vai-e-volta, não como decisão.** Não apagado — **o caminho até a
   resposta é a parte que a próxima auditoria vai precisar** (R6, corolário).

> ⚠️ **O que eu fiz de errado aqui:** transformei a escolha de uma opção — cuja descrição eu mesmo
> havia redigido — em **definição do Olavo**, e escrevi isso num documento normativo dele. A
> descrição era minha; ele só marcou a caixa. **Chip escolhido não é redação, e eu já havia escrito
> exatamente isso no §1 do `PLANO-ENTREGA-FINAL-PHI` dois dias antes.** A regra valia para o §1 e
> vale para qualquer resposta de múltipla escolha.

### 11.4. O conserto, agora que se sabe que é vocabulário

**Um fato, um nome.** A lista do `multi_select` **Métrica-Mãe** oferece duas grafias para o mesmo
número — é isso que precisa acabar, **não o motor.**

| | Opção | Avaliação |
|---|---|---|
| ⭐ | **`CPA` é o nome; campanha de lead usa `CPA` no Notion** | alinhado ao método (*"CPA (Custo por Lead/Aquisição)"*), **zero código**, motor funciona como está |
| | o **writer traduz** `CPL` → `CPA` ao gravar | 🔴 **grava diferente do que está no Notion** — quebra a fidelidade (I10/M10) e esconde a origem |
| | o **motor aceita os dois** | funciona, mas **mantém dois nomes vivos** — e o próximo nome novo pede outra emenda |

> **Recomendo a primeira: é a única que resolve a causa.** Enquanto a lista oferecer dois nomes,
> alguém vai escolher o outro.
>
> ⚠️ **Gatilho registrado:** *quando houver medição de venda separada da de lead, voltam a existir
> duas métricas de verdade* — e aí é ADR, não vocabulário. **A campanha do CHA era `IG_MENS`
> (Instagram Mensagens): exatamente o tipo que o Olavo citou.**
