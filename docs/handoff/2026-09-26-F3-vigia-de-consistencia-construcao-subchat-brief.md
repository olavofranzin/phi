# [BRIEF sub-chat] F3 — o vigia de consistência: construção

> **Como usar:** abra um sub-chat **novo** e cole este arquivo como primeira mensagem.
> **Modelo:** Opus · **Repo:** `olavofranzin/phi` · **Branch:** `claude/consolidacao-2026-08`
> **Idioma com o Olavo:** português simples, sem jargão.
> **O papel dele nesta etapa:** 🔴 **ponte entre você e o chat-mãe.** Ele não vai decidir no meio do
> caminho. Se aparecer decisão, **pare e devolva a pergunta** — não escolha por ele.

> 🔴 **VOLTA 2 — atualizado em 26/09, depois de a volta 1 parar antes do primeiro nó.**
>
> **O executor fez certo em não construir.** Três premissas deste brief foram refutadas pelo dado.
> Relatório dele: `2026-09-26-F3-vigia-execucao-relatorio.md` · resposta do chat-mãe:
> `2026-09-26-F3-volta-1-resposta-do-chat-mae.md`.
>
> | O que mudou | Onde |
> |---|---|
> | 🔴 **PRÉ-REQUISITO NOVO: uma query antes de qualquer nó** | §2.0 |
> | **CA3 e CA4 trocados** por defeitos medidos em 26/09 | §3 |
> | **O V4 passa a ter DUAS perguntas**, não uma | §2.0 e §2.1 |
> | **V1 e V5 dependem de uma decisão do Olavo** | §2.5 |
>
> **O desenho das 4 conferências construíveis já está pronto** —
> `docs/strategic-planning/saude-digital/F3-conferencias-sql-e-codigo.md`. **A volta 2 é montagem,
> não desenho.**

---

## 0. A etapa, em uma frase

**Estender o `PHI - Vigia de Frescor` para que ele pare de perguntar *"chegou dado?"* e passe a perguntar *"o que eu esperava, aconteceu?"* — 7 conferências, 1 mensagem por dia, e saída visível inclusive quando está tudo certo.**

| | |
|---|---|
| **Plano canônico** | `docs/strategic-planning/saude-digital/PLANO-F3-vigia-de-consistencia.md` — **aprovado pelo Olavo em 21/09.** Leia inteiro antes de qualquer coisa |
| **Workflow alvo** | `PHI - Vigia de Frescor dos Dados` — `JMgc0HdLPOFPnFYb` · **ATIVO**, roda às 08h · ⚠️ estender, **não criar novo** |
| **Custo financeiro** | **zero** — nenhum nó de LLM. BigQuery, n8n e Telegram |
| **Por que agora** | é o **primeiro da fila** desde 24/09; bloqueia a **Fase C** do ADR-38 e o **F5**; e é o único item que não depende de ninguém de fora |

> 🟢 **A condição *"vira brief quando o ADR-39 fechar"*, escrita no cabeçalho do plano, está
> LIBERADA.** Ela era de ordem de fila, e a fila mudou em 24/09. **O vigia não depende do ADR-39:**
> ele só detecta. Aliás, enquanto o ADR-39 não fechar, é esperado que o **V3 continue acusando** —
> *isso é o vigia funcionando*, não falso positivo.

---

## 1. 🔴 As cinco regras desta etapa

| # | Regra |
|---|---|
| **1** | **Você estende um workflow ATIVO.** Vale a **R13** inteira: leia `activeVersion.nodes`, compare `versionId` com `activeVersionId`, e **depois de publicar releia e confirme**. *"Não deu erro"* não é *"está no ar"* |
| **2** | 🟢 **PUBLICAR JÁ ESTÁ AUTORIZADO** — Olavo, 26/09: *"pode publicar quando os 9 critérios passarem"*. **A autorização é condicional: os nove, todos.** Um só que não passe ⇒ **não publique** — relate e devolva |
| **3** | **O vigia avisa; não conserta.** Ele vai encontrar coisa quebrada. **Não conserte nada** — nem a coleta morta, nem o score 3×, nem as linhas sem cliente. Consertar é outro brief |
| **4** | **Nada mudado para teste fica para trás** (R12). Antes de fechar, releia o artefato e confirme que voltou |
| **5** | **Limite de 3 voltas** (R9). Se na terceira o critério não passar, o problema é o plano — devolva ao chat-mãe |

**E a R11 é a razão de este vigia existir.** Leia a tabela dela no `CLAUDE.md` antes de escrever o primeiro nó: **sete casos em que um nó verde fez o contrário do que o nome dizia.** O seu vigia é uma salvaguarda — e *"salvaguarda é código novo em produção e exige o mesmo smoke que a mudança que ela protege"*.

---

## 2. O que construir — as 7 conferências

**A tabela completa está no §4 do plano.** Aqui vão só as **quatro correções** que entraram depois de o plano ser aprovado. Elas são obrigatórias:

### 2.0 🔴 PRÉ-REQUISITO — a query que resolve a contradição, antes do primeiro nó

**Dois relatórios leram a mesma tabela na mesma semana e deram respostas opostas** sobre o
`t28_ga4_landing`: máximo em **06/09** (Fase 0, 25/09) contra cargas em **06/09 → 13/09 → 20/09**
(volta 1, 26/09). **E 20/09 já existia quando a Fase 0 rodou.**

**Hipótese do chat-mãe, marcada como hipótese:** as duas leituras olharam colunas diferentes. A
tabela tem `business_date` (a data **do dado**, chave de partição) e `ingested_at` (a data **da
carga**). **06/09, 13/09 e 20/09 são três domingos seguidos — o horário do Agregador.** Tem cara de
data de execução, não de data de dado.

**Rode isto primeiro, por tabela, lado a lado:**

```
MAX(business_date) · MAX(ingested_at) · COUNT(*)   — agrupado por client_id e janela
```

🔴 **Se as duas datas divergirem, o defeito tem nome e é pior que morte:** *a carga acontece e a data
não anda* — e uma tabela assim **fica verde para sempre** em qualquer conferência que olhe só a carga.

**Enquanto esta query não rodar, o V4 não tem especificação.** Não construa em cima dela.

### 2.1 🔴 O V4 tem DUAS perguntas, e um período esperado por tabela

O plano escreveu o V4 como *"toda tabela que tem writer declarado recebeu linha?"* — **diariamente.** Metade das tabelas é **semanal**. Do jeito que está, ou grita todo dia para tabela semanal, ou é desligado — **e fica cego justamente para o buraco que motivou esta correção.**

**As duas perguntas:** *carregou?* (`ingested_at`) **e** *avançou?* (`business_date`). Uma só não
serve — olhar só a carga fica verde com dado congelado; olhar só a data grita num workflow que está
rodando certo. **Juntas, elas dizem qual dos dois é o problema.**

**A expectativa é uma lista explícita no código (opção A do §5 do plano), com o período de cada tabela:**

| Tabela | Período esperado | Estado conhecido em 25/09 |
|---|---|---|
| `raw_campaign_data` | **diário** | ✅ em dia (24/09) |
| `phi_score_history` | **diário** | ✅ em dia (24/09) |
| `t28_campaign` | **semanal** (Agregador, segundas 09h) | ⚠️ 20/09 |
| `t28_ga4_landing` | **semanal** | 🔴 **06/09 — 19 dias de atraso.** É a fonte que sobrou |
| `t28_adset` · `t28_meta_campaign` · `t28_gbp_daily` | **semanal** | vazias — ver 2.3 |
| `raw_ad_data` | **diário** | vazia desde 30/06 |
| 🟡 `t28_clarity_daily` | **em estudo — não alerta, mas lista** | saiu do índice, **mas a coleta fica**. Ver 2.4 |

**Fonte destes números:** `docs/handoff/2026-09-25-fase0-indice-saude-digital-relatorio.md` §2.3. **Confira antes de usar** (R6) — são de 25/09.

### 2.2 🔴 Toda consulta filtra `client_id IS NOT NULL`

A `t28_campaign` tem **318 linhas sem `client_id`**, com `campaign_id` em padrão de teste (`CMP.CHA.CAMP-10`), dentro de `phi_prod` — **mais que as 304 do cliente real.** Sem o filtro, ou elas entram na conta, ou somem do `GROUP BY` em silêncio. **As duas coisas são ruins.**

### 2.3 🔴 Três estados diferentes, três tratamentos

*"Tabela sem linha"* não é um estado só. São três, e o alerta precisa distinguir:

| Estado | Exemplo | O que o vigia faz |
|---|---|---|
| **parou de receber** | `t28_ga4_landing` — recebia, parou em **06/09** | 🔴 **alerta** |
| **nunca recebeu** | `t28_gbp_daily` (cota do GBP) · `raw_ad_data` (desde 30/06) | 🟡 **lista como conhecido**, não grita todo dia |
| **em estudo, sem consumidor** | `t28_clarity_daily` — ver 2.4 | 🟡 **não alerta, mas aparece no resumo** |

> **Isto é o M4 outra vez:** *"zero nunca é ausência"*. Uma tabela em zero desde o nascimento, uma que
> morreu ontem e uma que está em estudo **contam a mesma história para um `COUNT`, e histórias
> opostas para o Olavo.**

### 2.4 O `t28_clarity_daily` **fica coletando, mas não alerta**

**Duas decisões do Olavo, e as duas importam:**

> **25/09 —** *"O Clarity sai do índice e volta a ser ferramenta. O pensamento inicial era que ele
> substituísse o Hotjar e pudéssemos extrair mapa de calor e gravação — **instrumentos de análise
> para pessoa. Nunca foram para ser coluna em BigQuery.**"*
>
> **26/09 —** *"**Mantenha o Clarity**, depois vamos estudar a documentação para sabermos se o que
> queremos dá pra extrair."*

**O que isso significa para você, exatamente:**

| | |
|---|---|
| ✅ **a coleta continua** | **não aposente o ramo, não apague a tabela, não mexa em nada** |
| ✅ **o vigia a LISTA** | uma linha no resumo: *"em estudo, sem consumidor, último dado 06/09"* |
| ❌ **o vigia NÃO alerta** por ela | ela não tem consumidor hoje. **Alertar por dado que ninguém usa seria instalar, dentro do próprio vigia, o defeito que ele existe para combater (M11)** |

> **Por que listar em vez de ignorar:** é a **R12**. *Coisa desligada não tem cor, não tem alarme e
> não aparece em lista nenhuma* — e some da memória de todo mundo. **Uma linha no resumo custa nada
> e impede o esquecimento.**

🔴 **E atenção ao efeito colateral, porque ele vai na direção contrária da intuição:** com o Clarity
fora do índice, **o `t28_ga4_landing` virou a ÚNICA fonte do único indicador de Experiência com valor
real** (`SD-EXP-07`, taxa de engajamento, 0,64–0,81, execução `43061`). **A fonte que sobrou é a que
está morta há 19 dias** — por isso o **CA4** é sobre ela, e por isso ele pesa.

---

## 3. 🔴 Critérios de aceite — escritos ANTES, como manda a R9

**A etapa só está concluída quando os nove passarem.** Publicado sem prova **não é concluído**.

| # | Critério | Como se prova |
|---|---|---|
| **CA1** | No dia saudável o vigia emite a **linha de prova de vida** | uma execução com tudo certo, e a mensagem no Telegram |
| **CA2** | Cada uma das 7 conferências **pega o seu defeito** | injetar em ambiente controlado **ou** provar pelo dado histórico do dia em que aconteceu |
| **CA3′** | 🟢 **V7 acusa `primary_metric_type` vazio** — 1 de 3 campanhas, 16–20/09. **Medido em 26/09** | tem de acusar na primeira execução real |
| **CA4′** | 🟢 **V4 acusa `t28_gbp_daily`** — **1 linha única, de 21/06, há 97 dias.** Medido em 26/09 | é a *quarta cara do vazio*: **não está vazia** (passa no *"tem dado?"*) e **não está em dia**. E o `t28_clarity_daily` aparece no resumo **sem alertar** (§2.4) |
| **CA5** | O vigia **não morre calado**: zero achados ≠ zero itens | 🟢 **prova ao vivo:** o vigia de hoje tem `return []` no caso saudável. **Antes e depois no mesmo workflow** |
| **CA6** | 7 conferências = **1 mensagem** por dia | contar as mensagens de uma execução |
| **CA7** | As consultas **filtram `client_id IS NOT NULL`** | as 318 linhas de teste **não** aparecem em nenhuma contagem |
| **CA8** | O vigia tem `errorWorkflow` apontado | ler `settings` (vale sem publicar — R13 item 4) |
| **CA9** | 🔴 **O que foi publicado é o que está no ar** | reler o workflow **depois** de publicar: `versionId == activeVersionId`, `sameAsDraft: true` |

> 🔴 **CA3′, CA4′ e CA5 são defeitos MEDIDOS em 26/09, não herdados de documento.** Foi exatamente o
> contrário disso que derrubou a volta 1: os critérios anteriores vieram de um relatório do dia
> anterior e **dois deles não estavam acontecendo.**
>
> **Corolário da R6 que saiu daí:** *número herdado de documento não vira critério de aceite sem ser
> medido de novo.* **Se você desconfiar de qualquer número deste brief, meça — e o que você medir
> vence o que está escrito aqui.**

### 2.5 🔴 O V1 e o V5 dependem de uma decisão do Olavo — e ela pode não ter vindo

| Conferência | Estado |
|---|---|
| **V1** (o `Pipeline_v2` chegou ao fim?) | ⛔ **não construível sem uma chave de API do n8n.** Nenhuma das 26 credenciais é do tipo `n8nApi` |
| **V5** (terminou verde tendo roteado erro?) | 🟡 **parcial**: dá para ler `t28_errors`, que cobre **só quem usa o error-handler do T28** |

**Se a decisão não tiver chegado quando você começar:**

- **construa as conferências possíveis e entregue** — não espere;
- **o V1 fica declarado como NÃO CONSTRUÍDO**, com o motivo. 🔴 **Não invente um V1 que leia outra
  coisa e pareça funcionar** — seria um vigia de mentira para o defeito mais caro da casa;
- **o V5 entra com o rótulo da parcialidade dentro da própria mensagem:** *"cobre só os workflows com
  error-handler do T28"*. **Parcial silencioso é pior que ausente.**

**Os critérios de aceite valem sobre o que foi construído.** V1 ausente **por decisão declarada** não
reprova a etapa; V1 ausente **sem declaração**, sim.

### 🟢 A autorização de publicação — o que ela cobre e o que não cobre

> **Olavo, 2026-09-26:** *"pode publicar quando os 9 critérios passarem."*

| ✅ Cobre | ❌ **Não** cobre |
|---|---|
| publicar e ativar **este** workflow (`JMgc0HdLPOFPnFYb`) | ativar ou publicar **qualquer outro** workflow |
| depois de os **nove** critérios passarem | publicar com oito. **Não há "quase"** |
| executar manualmente para provar os critérios | qualquer nó de **LLM**, em qualquer lugar |
| — | consertar o que o vigia achar |

🔴 **Se um critério não passar:** não publique, **não adapte o critério para ele passar**, e não
tente contornar. **Relate o defeito e devolva** — é a volta da R9, e são até 3. Na terceira, o
problema é o plano, não a execução.

---

## 4. O que entregar para dizer "concluído"

**Seis artefatos. Faltando um, a etapa não acabou** (R2 e R4).

| # | Entrega | Onde |
|---|---|---|
| **1** | O **workflow estendido, publicado e ativo** | n8n `JMgc0HdLPOFPnFYb` |
| **2** | A **prova de cada CA1–CA9**, uma linha cada, com o número da execução ou o print do dado | no relatório |
| **3** | 🔴 **Relatório de execução** — o que foi feito, o que o vigia achou na estreia, o que **não** foi feito e por quê | `docs/handoff/2026-09-__-F3-vigia-execucao-relatorio.md` |
| **4** | **As-built no plano F3**: banner no topo dizendo que foi construído, a data, e **o que ficou diferente do plano** — o real vence o plano | `PLANO-F3-vigia-de-consistencia.md` |
| **5** | **Descrição do workflow atualizada** (R5): o que ele faz, por que existe, **e o que mudou nesta extensão** | no próprio n8n |
| **6** | **Linha na DB Notion** *"PHI — Registro de Execuções (Sub-chats)"*, ao começar **e** ao encerrar (R3) | Notion |

**E a pergunta da R4, respondida no relatório:** *onde estamos, quanto falta, e o que eu atualizei para provar isso?*

---

## 5. ⛔ Fora do escopo — e não é pouco

**Não construa, não conserte, não investigue:**

- ❌ **Por que o GA4 parou em 06/09.** O vigia **avisa**; a causa é outro brief — **e é o próximo**
- ❌ **Aposentar o ramo do Clarity** no Agregador — **ele fica, por decisão de 26/09.** Você só o move para *"em estudo"*
- ❌ **Estudar a API do Clarity.** É outra etapa, e é pesquisa, não construção
- ❌ O **score 3×**. O vigia acusa; consertar é outro trabalho
- ❌ As **318 linhas sem cliente**. Filtre; não apague, não investigue
- ❌ O **ADR-39/40**, a **etapa 8 do ADR-38**, o **Agregador**, o **índice de Saúde Digital**
- ❌ Os **21 workflows sem `errorWorkflow`** — trabalho separado e mecânico
- ❌ **Qualquer nó de LLM.** Esta etapa não gasta token de modelo em lugar nenhum

> **Se você encontrar algo grave fora do escopo: escreva no relatório e siga.** Achado registrado vale; achado consertado no meio do caminho quebra o aceite.

---

## 6. Como falar com o Olavo nesta etapa

Ele é **ponte**, não decisor do meio do caminho.

- 🟢 **Nem a pergunta do fim existe mais:** publicar já está autorizado, condicionado aos 9 critérios.
- Qualquer outra decisão que aparecer → **pare, escreva a pergunta com opções e a consequência de cada uma, e devolva ao chat-mãe.** Não decida por ele.
- **Separe o que leu do que deduziu.** Escreva *"deduzo que"* quando for dedução.
- **Discordar do plano é permitido e desejado** (R6): se o dado desmentir o plano aprovado, **pare, não execute, e registre.**
