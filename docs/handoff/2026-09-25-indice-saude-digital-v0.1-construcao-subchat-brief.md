# Brief de sub-chat — Construção do Índice de Saúde Digital do Negócio v0.1

| | |
|---|---|
| **Data** | 2026-09-25 |
| **Frente** | Saúde Digital do Negócio (Produto PHI — core) |
| **Autoriza** | **ADR-41**, `Aceito` 2026-09-25 — [página no Notion](https://app.notion.com/p/3e6b65e5c72b8150857cea4596fb6ffe) · `docs/strategic-planning/saude-digital-do-negocio/adr-rascunhos/ADR-41-…md` |
| **Base factual** | `docs/strategic-planning/saude-digital-do-negocio/DICIONARIO-DE-INDICADORES-v0.md` (canônico) |
| **Branch** | a definir pelo sub-chat — **nunca** `claude/exciting-bardeen-ozheq6` (é deste chat) |
| **Escrito por** | chat-mãe (R1: planejamento aqui, execução no sub-chat) |

> ⚠️ **Nota de localização.** O escopo anterior desta frente dizia *"escreve só na pasta `saude-digital-do-negocio/`"*. Este arquivo está em `docs/handoff/` porque é **brief de sub-chat**, e a **R1** fixa esse caminho. É mudança deliberada de destino, não descuido.

> 🟢 **FASE 0 EXECUTADA EM 25/09 — leia o relatório antes deste brief:** `2026-09-25-fase0-indice-saude-digital-relatorio.md`. **O escopo caiu de 24 para 18 indicadores**, o pilar Experiência encolheu de 7 para 4, e a recomendação de régua do §5 **caiu por falta de dado**. Onde este brief e o relatório divergirem, **vale o relatório** — ele tem contagem, o brief tinha as-built.

> 🔴 **Este brief não é autorização para construir.** Ele é o plano que a **R7** exige *antes* da construção, e traz a **entrevista de alinhamento** junto (R9 — *"entrevista atrasada não é entrevista, é autópsia"*). **O sub-chat responde a entrevista e espera o OK do Olavo antes do primeiro nó.**

---

## 0. As regras de ouro deste trabalho

1. 🔴 **Nada que está no ar muda de comportamento nesta rodada.** O índice **lê**; não reescreve `phi_value`, não altera `sw metricas *`, não toca `volume_suficiente` (produção, ADR-29 D1, decisão do Olavo).
2. 🔴 **Nenhum número de régua é inventado.** Todo limite (`L`, `T`, `U`) tem fonte escrita. Sem fonte, o indicador **não pontua** — ver §5. *Não existe "aproximadamente" aqui.*
3. **Fase 0 é obrigatória e pode matar o resto.** Se a verificação em BigQuery desmentir o dicionário, **pare e relate** (R6: o dado vence o plano — inclusive este).
4. **Ler `activeVersion`, não o rascunho** (R13). Os JSON exportados em git **não trazem** `activeVersion`.
5. **Registrar na DB Notion `PHI — Registro de Execuções (Sub-chats)`** ao começar e ao encerrar cada bloco (R3) — senão o digest de 08:30 diz "sem progresso".
6. **Descrição do artefato na mesma sessão** (R5). Workflow novo ou reformado sem descrição fiel é bug.

---

## 1. O que o ADR-41 já decidiu — e que aqui não se rediscute

| # | Regra | Consequência prática nesta construção |
|---|---|---|
| **D2** | pesos **iguais** entre pilares, provisórios | não há tabela de pesos para implementar: é `1/n` |
| **D3 / S1 / S2** | **pilar não medido não é zero e não entra na média** | o peso é redistribuído entre os medidos, e **a cobertura é publicada junto com a nota** |
| **D4** | aritmética **dentro** do pilar · geométrica **entre** pilares | 🔴 a geométrica **não aceita zero** → o piso técnico tem de ser escrito (§6) |
| **D5 / S4** | normalização por **distância à meta com limites fixos**; **percentil de coorte proibido** | `z = 100 × clip((x − L)/(T − L), 0, 1)` para ↑ · `z = 100 × clip((U − x)/(U − T), 0, 1)` para ↓ |
| **D6 / S5** | falha crítica é **alerta**, não desconto | governança quebrada não baixa a nota: emite alerta ao lado dela |
| **D7 / S3** | **peso só para pilar com fonte** | ⇒ **3 pilares entram, 5 não** |
| **D8** | nome: **"Índice Experimental de Saúde Digital do Negócio"** | é o rótulo em qualquer saída visível |
| **D9 / S6** | toda nota carrega evidência, fonte, período e força (A/B/C/D) | é **coluna**, não comentário |

---

## 2. R7 — o que eu procurei antes de propor construir

**Procurei. Registro para a próxima sessão não procurar de novo.**

| Procurei | Resultado |
|---|---|
| **82 workflows** no n8n, listados por nome (A→Z e Z→A) | 🔴 **nenhum calcula índice de negócio.** Busca por "saude" devolve **0** |
| Um agregador multi-fonte que já leia tudo | 🟢 **existe:** `PHI — Agregador de Métricas Multi-fonte` (`4sdG2UKMCBuFq8xn`), **ATIVO**, semanal/mensal, 66 nós, já lê Ads 3 níveis · GA4 orgânico+pago · GBP · Meta · Clarity · search terms |
| Um jeito de rodar `SELECT` avulso sem criar workflow | 🟢 **existe:** `TMP - A6 BigQuery Audit` (`m8unFD0ksEc1Zvbk`), **inativo**, só SELECT, último uso 24/09 na Fase A do ADR-38 |
| Skill que faça isto | 🔴 nenhuma. As úteis são **`n8n-api-workflow-review`** e **`sql-queries`** |
| Tabela que já guarde índice por cliente | 🔴 não existe. `phi_score_history` é por **campanha**, não por negócio |

> 🔴 **A conclusão de arquitetura que sai daí:** **não se constrói coletor novo.** A coleta existe e está no ar. O que falta é **leitor** — e é exatamente o que o dicionário chama de 17 indicadores que escrevem para ninguém. **Esta rodada é reforma + um cálculo novo, não construção de pipeline.**

---

## 3. Escopo v0.1 — nominal, fechado

**3 pilares medidos de 8** (D7). Cliente: **KIL / `CLI-4`** — é o único, e é o de referência.

| Pilar v0.1 | Dimensão do dicionário | Indicadores 🟢 | Fonte física |
|---|---|--:|---|
| **Experiência digital** | D6 | **7** | `t28_clarity_daily` · `t28_ga4_landing` |
| **Aquisição** | D7 | **11** | `raw_campaign_data` · `t28_campaign` · `phi_score_history` · `t28_ga4_landing` (orgânico) |
| **Conversão** | D8 | **6** | `raw_campaign_data` · `t28_campaign` · `t28_ga4_landing` · DB Clientes |

**Os indicadores, por id** (do dicionário §3 — nenhum outro entra):

- **Experiência:** `SD-EXP-01` rage clicks ↓ · `-02` dead clicks ↓ · `-03` scroll excessivo ↓ · `-04` profundidade de scroll ⊙ · `-05` duração da sessão ↑ · `-06` taxa de rejeição ↓ · `-07` taxa de engajamento ↑
- **Aquisição:** `SD-AQU-01` investimento ⊙ · `-02` impressões ↑ · `-03` cliques ↑ · `-04` CTR ↑ · `-05` CPC ↓ · `-06` CPM ↓ · `-07` métrica-mãe ⊙ · `-08` **PHI·Mídia** ↑ · `-09` conjuntos ⊙ · `-12` aquisição orgânica ↑ · `-13` composição de termos ⊙
- **Conversão:** `SD-CVR-01` conversões da plataforma ↑ · `-02` CPA/CPL ↓ · `-03` ROAS ↑ · `-05` **conversões de site** ↑ · `-12` margem de contribuição ↑ · `-13` ticket/LTV ↑

**Total: 24 — 🔴 e a Fase 0 derrubou 6 deles em 25/09. Ficam 18.** Caíram: `SD-EXP-04`, `SD-EXP-05`, `SD-EXP-06` (colunas vazias), `SD-AQU-09` (`t28_adset` VAZIA), `SD-CVR-12` e `SD-CVR-13` (a DB Clientes não alimenta). Ver o relatório §4.

> 🔴 **Duas inconsistências que eu mesmo deixei no dicionário e que a Fase 0 tem de reconciliar — não mascare:**
>
> 1. **O placar do dicionário diz `D8 = 7 🟢`; as linhas do D8 têm 6.** Por isso escrevi **24** aqui e **não "~25"**. Uma das duas está errada. **Descubra qual e corrija o dicionário** (R2).
> 2. **`SD-AQU-13` é 🟢 mas NÃO é persistido** — é calculado em runtime e descartado de propósito (ADR-29 D5: termos de busca são sensíveis). **Um índice diário/semanal não pode depender de valor que não fica gravado.** Ou ele sai do v0.1, ou se persiste apenas a **composição agregada** (proporção marca × problema), nunca o termo. 🔴 **Persistir termo bruto é proibido e o código lança exceção** (`assertNoRawSearchTerms`). **Decisão do Olavo — item 2 da entrevista.**

### O que fica FORA, e por quê

| Fora | Motivo |
|---|---|
| Visibilidade · Reputação (D2/D4) | colunas existem, **tabela `t28_gbp_daily` vazia por cota**. Entra por **gatilho** (D10), não por data |
| Presença e infraestrutura (D1) | só existe para **lead**, não para cliente |
| Conteúdo / redes sociais (D5) | **zero indicadores 🅐**. Sem credencial de Instagram por cliente |
| Relacionamento / atendimento (D9) | **10 de 10 inexistentes**, e o dado não está na agência. 🔴 **Decisão pendente do Olavo** (ADR-41 §4 item 2) |
| Dados e governança do cliente (D10) | maioria é checklist de auditoria; sem procedimento, não há coleta |
| `criativo_score_operacional` e os benchmarks hardcoded | ADR-41 §4 item 5, **em aberto**. Não mexer nesta rodada |
| `SD-CVR-04` receita / ROAS | depende da etapa 8 do ADR-38, **parada pelo Olavo**. Se `revenue` sumir, `SD-CVR-03` fica indefinido — **declarar, não estimar** |
| Qualquer coleta nova | 🔴 **zero API nova, zero credencial nova, zero coluna de origem nova** |

---

## 4. 🔴 FASE 0 — Verificar antes de construir (a fase que pode cancelar as outras)

**O ADR-41 §10 declara, com todas as letras, que nenhuma query no BigQuery foi rodada.** O *"tem dado"* vem de as-built documentado. **A R6 não permite construir sobre isso.**

**Use o `TMP - A6 BigQuery Audit` (só SELECT). Não crie workflow para isto.**

Para **cada uma** das 4 tabelas (`t28_clarity_daily`, `t28_ga4_landing`, `raw_campaign_data`, `phi_score_history`), responda com número na mão:

1. **Quantas linhas, para `CLI-4`, nos últimos 30 dias?** — e a data da linha **mais recente**.
2. **Para cada coluna dos 24 indicadores: quantos valores não nulos?** Uma coluna que existe e vem `NULL` é 🟡 disfarçado de 🟢.
3. 🔴 **Quantos dias distintos** a série cobre? Clarity e GA4 começaram em **14/09** — pode haver **menos de duas semanas**. Isso decide se dá para calcular baseline próprio (§5).
4. **A chave bate?** `client_id` = `CLI-4` e `client_slug` = `KIL` são **campos diferentes** (Regra Crítica 4). Confirme qual cada tabela usa.

> 🔴 **Regra do vazio (R11 regra 5, terceira cara):** use `COUNT(*)` **junto** com qualquer agregação. Query agregada **sempre devolve uma linha** — *"não achei"* e *"achei zero"* saem idênticos. **Traga a contagem do que casou, sempre.**

**Critério de parada da Fase 0:** se qualquer um dos 24 indicadores cair de 🟢 para 🟡/🔴, **não prossiga**. Atualize o dicionário (R2), registre a refutação (R6 corolário) e devolva ao chat-mãe. **Um pilar pode perder indicadores suficientes para não entrar — e aí a cobertura do v0.1 é 2/8, não 3/8.**

---

## 5. 🔴 O problema mais difícil: as réguas. E é aqui que NÃO se inventa número

O dicionário §3.11 mediu: **de 10 dimensões, 1 tem régua, 2 dispensam, 5 não têm.** O D5 exige `L`, `T`, `U` **por indicador**. Então:

| Pilar | Régua existe? | De onde |
|---|---|---|
| **Aquisição** (CTR, CPC, CPM, CPA) | 🟢 **sim** | `docs/conhecimento/benchmarks-canonicos.yaml` (`[BM-*]`, com `forca_evidencia`), sob as arbitragens **ARB-CVR-01** (CVR de site ≠ CVR de plataforma), **ARB-ROAS-01**, **ARB-ESCOPO-01** (limiares de e-commerce **fora de escopo**: a operação é Google Ads lead-gen local) |
| **Conversão** (parte de campanha) | 🟡 **parcial** | mesma fonte; a fatia de **site** não tem régua |
| **Experiência** (rage clicks, dead clicks, scroll, rejeição) | 🔴 **NÃO EXISTE** | o substrato da casa é **todo de mídia paga** — confirmado no dicionário §3.12 |

> 🔴 **Não vá buscar benchmark de presença digital na internet.** É proibição explícita do brief do substrato (§5 item 1).

### O que eu recomendo — e que precisa do OK do Olavo, porque é regra nova

**Aplicar a lógica do D3 um nível abaixo: indicador sem régua não pontua e a ausência é declarada.**

```
Sem fonte escrita para L/T/U  ⇒  o indicador NÃO entra na média aritmética do pilar
                             ⇒  entra na saída como "sem régua", nominalmente
                             ⇒  o pilar publica a própria cobertura interna,
                                 como o índice publica a dele (S2)
```

**Por que assim:** é exatamente o **S1** (*"não medido nunca é zero"*) e o **M4** aplicados ao grão do indicador. A alternativa — arbitrar um `T` plausível para *rage clicks* — **fabricaria a régua e depois mediria contra ela**, o que faria o índice parecer preciso sendo inventado. **O erro seria invisível e permanente.**

**Para os 7 do Experiência sobram duas saídas honestas, e nenhuma é inventar:**

| Saída | O que é | Custo |
|---|---|---|
| **(a) baseline próprio** | `T` = mediana histórica do próprio cliente; nota = distância à **própria** base. É o 1º degrau da hierarquia de consulta da casa (*percentis da própria conta*) e o ADR-41 §9 já o endossa | 🔴 exige série suficiente — e a Fase 0 item 3 pode mostrar que **há menos de duas semanas de dado**. Força de evidência **D**, e o **D9 diz que `D` nunca sustenta certeza** |
| **(b) Experiência entra sem nota no v0.1** | o pilar aparece como **"medido, sem régua"**: os dados são exibidos, não pontuados | cobertura cai para **2/8 pontuados**. Mais honesto, menos vendável |

> ⚠️ **Minha recomendação é (a) com rótulo D explícito, e (b) como saída se a Fase 0 mostrar série curta.** Mas **isto é regra nova** — se o Olavo aprovar, vira **adendo ao ADR-41 (invariante S7)**, escrito **pelo chat-mãe**, não pelo sub-chat. **Sub-chat não cria invariante.**

---

## 6. Schema — o que gravar, e o requisito que quase sempre é esquecido

**Dataset: `phi_dev` primeiro. Só depois `phi_prod`.** Sempre `dataset.table` entre backticks, **sem project id** (Regra Crítica 1).

**Duas tabelas** (recomendação; alternativa no item 4 da entrevista):

**`sd_index_history`** — uma linha por `(client_id, period_end, grain)`
- `client_id` · `period_start` · `period_end` · `grain` (`semanal`/`mensal`)
- `indice_valor` FLOAT64 · `indice_classe` STRING (CRITICAL/WARNING/GOOD/EXCELLENT — a escala do ADR-21 permanece)
- 🔴 `pilares_medidos` ARRAY<STRING> · `pilares_nao_medidos` ARRAY<STRING> · `cobertura_pilares` STRING (ex.: `"3 de 8"`)
- `alertas_criticos` ARRAY<STRING> (D6 — **alerta, não desconto**)
- `metodo_versao` STRING (ex.: `"ADR-41 · pesos iguais"`) · `execution_id` · `ingested_at`

**`sd_pilar_history`** — uma linha por `(client_id, period_end, pilar)`
- `pilar` · `pilar_valor` FLOAT64 **NULLABLE** (🔴 `NULL` = não medido; **nunca `0`**)
- `indicadores_usados` ARRAY<STRING> · `indicadores_sem_regua` ARRAY<STRING> · `peso_aplicado` FLOAT64
- `forca_evidencia` STRING (A/B/C/D) · `evidencia` STRING · `fonte` STRING

### 🔴 Os quatro requisitos que, se faltarem, o índice mente

1. **Gravar QUAIS pilares entraram na conta em cada data.** O D3 redistribui peso; quando um pilar entra, **a nota muda sem a saúde mudar**. Sem `pilares_medidos` na linha, **a comparação no tempo é falsa** e ninguém descobre. *É o requisito que o ADR-41 §7 já sinalizou.*
2. **Piso da média geométrica, escrito.** Geométrica **não aceita zero**: um pilar em 0 zera o índice. O D6 resolve por **veto/alerta**, mas o piso numérico (ex.: `max(z, 1)`) **tem de estar na spec, não no código sem nota**.
3. **`pilar_valor` NULLABLE, e o consumidor obrigado a distinguir `NULL` de `0`.** É o **M4** e a lição de `n_dias = 0` em campanha com 250 dias de série.
4. **MERGE, nunca INSERT cego** (Regra Crítica 2: `Always Output Data = true` nos nós de INSERT/MERGE). E a chave de idempotência declarada.

---

## 7. Onde o cálculo mora

**Recomendação: reformar o `PHI — Agregador de Métricas Multi-fonte` (`4sdG2UKMCBuFq8xn`) — ele já é semanal/mensal e já lê tudo.** Um índice de saúde do **negócio** não precisa de cadência diária: semanal cabe, e isso é economia.

🔴 **Mas ele está ATIVO e tem 66 nós.** Então, nesta ordem, sem atalho:

1. **Ler `activeVersion`** e comparar `versionId` com `activeVersionId`. Se `sameAsDraft` for `false`, **você está lendo uma proposta, não o sistema** (R13).
2. Montar o SQL em **Code node**, nunca `{{ }}` dentro da query BigQuery (Regra Crítica 8).
3. **Não reaproveitar nó existente para função nova.** Nó novo, nome que diz o que faz.
4. Confirmar `errorWorkflow` — o contrato diz que ele cobre **5 de 26** workflows. Se o Agregador não estiver coberto, **falha some** (R11 regra 2).
5. **Depois de publicar, reler e confirmar que publicou.** *"Não deu erro"* não é *"está no ar"*.
6. **Escrever a descrição** dizendo o que passou a fazer e por quê (R5) — os 4 workflows da área estão **sem descrição nenhuma** hoje.

> ⚠️ Se a reforma do Agregador se mostrar arriscada demais (é ativo e grande), a alternativa é **workflow novo que só LÊ o BigQuery e escreve as duas tabelas** — zero toque no Agregador. **Mais seguro, mais um artefato para manter.** Item 3 da entrevista.

---

## 8. Entrevista de alinhamento — responder ANTES do primeiro nó (R9)

| # | Pergunta | Minha recomendação |
|---|---|---|
| **1** | 🔴 **Régua do Experiência:** baseline próprio com rótulo D, ou pilar sem nota? | **(a)**, virando adendo S7 ao ADR-41 — **mas só se a Fase 0 mostrar série suficiente** |
| **2** | 🔴 **`SD-AQU-13`** (termos): sai do v0.1, ou persiste-se só a **proporção** marca × problema? | **persistir só a proporção** — nunca o termo. Mantém o ADR-29 D5 intacto |
| **3** | **Reformar o Agregador** (ativo, 66 nós) ou **workflow novo só de leitura**? | **workflow novo de leitura** na v0.1; consolidar no Agregador depois de provado. Menos risco em produção |
| **4** | Duas tabelas (`sd_index_history` + `sd_pilar_history`) ou uma com `ARRAY<STRUCT>`? | **duas** — a série por pilar precisa ser auditável sozinha (S2) |
| **5** | **Nome das tabelas:** `sd_*` ou `phi_*`? | 🔴 **`sd_*`.** A política *going-forward* do ADR-21 diz que os `phi_*` existentes **se referem ao PHI·Mídia**. Nomear o índice de `phi_*` ressuscitaria exatamente a ambiguidade que o ADR-21 fechou |
| **6** | ~~**Quem consome a saída?**~~ | ✅ **RESPONDIDO pelo Olavo em 25/09: agentes de IA.** Ver §8.1 — a resposta muda o desenho e abre três itens novos |
| **7** | `phi_dev` e depois `phi_prod`, ou direto em `prod`? | **`dev` primeiro.** ⚠️ Atenção: o workflow `client_config` **escreve em `phi_dev` enquanto o Pipeline_v2 lê `phi_prod`** — essa pegadinha já existe na casa |
| **8** | Orçamento: **quantas execuções** de smoke o Olavo autoriza? | declarar antes. Nada roda sem OK de budget |

### 8.1 ✅ Consumidor definido: **agentes de IA** (Olavo, 25/09)

**O que isso resolve, e é bastante:**

| Consequência | Efeito |
|---|---|
| **A saída é payload, não relatório** | 🟢 **não há dashboard, template de e-mail nem página para construir na v0.1.** As duas tabelas do §6 já são a entrega |
| O **D9** (evidência) deixa de ser prosa | vira **campo estruturado**: `evidencia`, `fonte`, `periodo`, `forca_evidencia` — já está no schema |
| O leitor natural é a camada **T28** | `WF-T28-Analise-Campaign` (`fhYmJH0o9BW1IO4i`) · Maestro + especialistas · DB `PHI - ANÁLISES` (`38fb65e5-c72b-80db-a425-e5939fc35c7a`) |

**E o que ela obriga a acrescentar — porque agente erra diferente de humano:**

1. 🔴 **`NULL` tem de ser instruído, não só gravado.** O **BLOCO COMUM regra 9** já diz *`source_status error/missing ⇒ N/D`, não 0*. Um agente que receba `pilar_valor: null` **sem instrução** vai tratar como zero ou alucinar um valor. Então o payload carrega, junto de cada `NULL`, um **`motivo_nao_medido`** legível (*"sem credencial de Instagram"*, *"cota do GBP"*), e o **prompt do agente diz explicitamente que não medido nunca é zero** (S1).
2. 🔴 **O índice precisa da mesma autoridade que o `phi_value` tem no ADR-003.** Lá está escrito: *não recalcular `phi_value`/flags/severidade — são fato*. **Sem a regra equivalente, o agente vai recalcular ou discutir o índice**, e a casa passa a ter duas notas para a mesma coisa. **[DEDUZO] isto é invariante, e invariante vem por ADR** — candidato a **S8**, escrito por mim, não pelo sub-chat.
3. ⚠️ **Camada de modelo** (R10): ler índice e diagnosticar é **camada forte**; montar o payload é **camada rápida**. Declarar antes, e **medir antes de trocar para economizar**.

> 🔴 **O senão, e é honesto dizer:** verifiquei no n8n e **a cadeia T28 de análise não está no ar.** `WF-T28-Orquestrador-Analises` (`8Q5ofmAZju0hTN08`) e `WF-T28-Analise-Campaign` (`fhYmJH0o9BW1IO4i`) estão **`active: false`** — só o `WF-T28-Error-Handler` está ativo. O ADR-28 registra o Maestro como rascunho não ativado.
>
> **Ou seja: o consumidor está definido no desenho e não existe em execução.** Se a v0.1 gravar as tabelas e a cadeia T28 continuar desligada, **o índice nasce sendo o 18º indicador sem leitor** — exatamente o defeito que ele existe para corrigir, só um nível acima.
>
> **Saída barata e que não depende de ativar o T28:** a skill **`phi-diagnostico`** já existe, é byte-idêntica ao nó vivo e **roda no chat sem gastar token do n8n**. **Recomendo que o aceite da v0.1 inclua um agente lendo o payload pela skill** — prova que o dado é consumível por agente, sem ativar nada em produção nem gastar budget. **Ativar a cadeia T28 é decisão separada, sua, e não bloqueia esta rodada.**

---

## 9. Critérios de aceite — escritos ANTES da construção (R9 item 4)

Quem revisa **não é quem executou**. **Limite de 3 voltas** — na terceira, o problema é o plano, não a execução.

| # | Aceite | Como se prova |
|---|---|---|
| **1** | Fase 0 concluída com **números**, não adjetivos | tabela de contagem por coluna, colada no relatório |
| **2** | O dicionário foi **corrigido** onde a Fase 0 o desmentiu | diff em git (R2) |
| **3** | Nenhuma régua sem fonte escrita | tabela `L/T/U` com a citação de cada um; as sem fonte aparecem como *"sem régua"* |
| **4** | Cliente sem um pilar recebe `NULL`, **não `0`** | query mostrando `pilar_valor IS NULL` e o índice calculado **sem** ele |
| **5** | 🔴 A linha gravada diz **quais pilares entraram** | `SELECT pilares_medidos, cobertura_pilares` devolve `"3 de 8"` e a lista nominal |
| **6** | A saída traz o rótulo **"Índice Experimental de Saúde Digital do Negócio"** (D8) | print da saída |
| **7** | Um pilar em 0 **não zera** o índice | teste com valor forçado: o piso e o alerta funcionam (D6) |
| **8** | `phi_value` **não mudou** | `phi_score_history` do dia antes e depois: valores idênticos |
| **9** | Recálculo do mesmo período **não duplica linha** | rodar 2× e conferir a contagem (idempotência) |
| **10** | O artefato tem **descrição fiel** (R5) e, se houver nó desabilitado, **nota dizendo quando religar** (R12) | leitura do artefato, não da intenção |
| **11** | 🔴 **Teste do caso vazio, de propósito** | *"o que acontece no dia em que nenhuma linha casa?"* O fluxo **para**; não processa tudo, não grava zero. **A salvaguarda é código novo e exige o mesmo smoke que o que ela protege** |
| **15** | 🔴 **Toda consulta filtra `client_id IS NOT NULL`** | `t28_campaign` tem **318 linhas sem cliente**, mais que as 304 do CLI-4. Sem o filtro, elas entram na conta ou desaparecem em silêncio do `GROUP BY` |
| **16** | O índice distingue **"indefinido"** de **"ruim"** | `cpa` tem 134 não-nulos de 304 — é o guardrail 8 funcionando. `NULL` em CPA **não é CPA alto** |
| **12** | Registro no Notion no início **e** no fim (R3) | linha na DB `PHI — Registro de Execuções` |
| **13** | 🔴 **Um agente lê o payload e produz diagnóstico** — sem ativar workflow e sem gastar token do n8n | rodar a skill `phi-diagnostico` com o payload real colado no chat. **Prova que a saída serve ao consumidor declarado** (§8.1) |
| **14** | Todo `NULL` vem com **`motivo_nao_medido`** legível | query mostrando `pilar_valor IS NULL AND motivo_nao_medido IS NOT NULL` — **nenhuma linha com `NULL` sem motivo** |

---

## 10. O que este sub-chat NÃO faz

⛔ Não decide pesos finais · ⛔ não decide se atendimento é do PHI ou do `Board Agência` · ⛔ não decide o Raio-X como produto · ⛔ não toca `volume_suficiente` · ⛔ não mexe no `criativo_score_operacional` nem nos benchmarks hardcoded · ⛔ não cria credencial, API, coluna de origem ou coleta nova · ⛔ **não cria invariante** · ⛔ não publica ADR · ⛔ não altera workflow da Prospecção nem do parque PHI fora do que o §7 autoriza.

---

## 11. Aviso a levar adiante

🔴 **O sub-chat que executa o ADR-39 + ADR-40 precisa saber que o calendário de 30/11 foi destravado em 25/09.** Aqueles ADRs **devem seguir**: o ADR-39 conserta a **entrada de cliente**, de que **qualquer** versão deste índice depende. Não são concorrentes desta frente — são pré-requisito dela.

---

## 12. Como verificar este brief

| O que | Como |
|---|---|
| Que o ADR-41 está aceito | página Notion `3e6b65e5-c72b-8150-857c-ea4596fb6ffe`, `Status: Aceito` |
| Que o ADR-21 não foi apagado | página `37db65e5-c72b-814b-b3c1-eb6b8ceab705`: banner no topo, corpo de 11/06 intacto |
| Que nada na casa já faz isto | `search_workflows` sem filtro, 82 resultados, os dois sentidos; busca `"saude"` → 0 |
| Os 24 indicadores | `DICIONARIO-DE-INDICADORES-v0.md` §3, dimensões D6, D7 e D8 |
| 🔴 **O que este brief NÃO verificou** | **nenhuma query no BigQuery** — é literalmente o trabalho da Fase 0. **Todo "🟢 tem dado" aqui é as-built documentado, não medição.** |

**Confiança no plano: 0,84.** O ponto frágil é o §5: **se a Fase 0 mostrar série curta, o pilar Experiência não tem régua honesta, e a cobertura do v0.1 cai para 2 de 8.** Isso muda a conversa comercial, e a decisão é do Olavo — não deste brief.
