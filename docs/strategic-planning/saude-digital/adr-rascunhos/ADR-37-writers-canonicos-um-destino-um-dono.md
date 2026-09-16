# ADR-37 — Writers canônicos do pipeline do Score: um destino, um dono

| | |
|---|---|
| **Status** | ⚠️ **ACEITO com D1 EM REVISÃO** — 2026-09-08 · Fase 0.1 executada · **Fases 1 e 2 suspensas em 2026-09-09** pelo achado da §3.0.3 |
| **Escopo** | Quem grava o quê em `raw_campaign_data`, `raw_ad_data`, `client_config` e nos campos de campanha do Notion |
| **Não cobre** | Frente Prospecção (planilha `leads` + CRM) — já normatizada pelo **ADR-35**. Não tocar. |
| **Decisor** | Olavo |
| **Documentos-pai** | `ADR-35` (modelo de contrato) · `ADR-010` (writer único do `raw_campaign_data` — este ADR o **atualiza**) |
| **Base factual** | `docs/handoff/2026-09-08-consolidacao-writers-lote1-inventario.md` (inventário nó a nó) + `...-execution-log.md` |
| **Destrava** | **C2** da `DEFINICAO-DE-PRONTO-PHI-V1.md` e, por consequência, **C1** (Score v2 / ADR-34) |

---

## 1. Contexto

O `ADR-010` já dizia que `phi_prod.raw_campaign_data` deve ter **um único writer**. O inventário de
2026-09-08 (leitura nó a nó dos 14 workflows vivos) mostrou que a regra não é seguida — e, mais
importante, mostrou **por que ninguém tinha percebido**.

| # | Achado | Consequência |
|---|---|---|
| **S1** | Duas cadeias escrevem `raw_campaign_data` todo dia: `sw metricas campanhas` (`DAILY_ENTRY`, 04h) e `PHI - Subworkflow Campanhas` (`GADS_INSERT`, 07h) | Cada linha mistura duas origens. Métricas de D-1 vêm do segundo; janelas 3d/7d, do primeiro |
| **S1b** | O `UPDATE SET` do segundo **inclui** `ingestion_step` e `execution_id`; o do primeiro **não** | O rótulo do primeiro é apagado. O BigQuery mostrava 100% `GADS_INSERT` e **parecia haver um writer só** |
| **S1c** | Os dois consumidores (cálculo do score e Agregador T28) têm a mesma cláusula preferindo `DAILY_ENTRY` no desempate | **Nenhuma surte efeito.** A intenção de design foi escrita duas vezes e nunca se realizou, em silêncio |
| **S2** | `Otimização Ativa?` (Notion) é escrito por `PHI - Pipeline_v2` (1×/dia) e por `PHI - Fechar Otimização` (de hora em hora) | 🟡 **Reclassificado na execução** — os papéis são **complementares, não concorrentes**. Ver §3 Fase 0.2 |
| **S3** | `client_config`: o writer que **INSERE** grava em `phi_dev`; o que grava em `phi_prod` só faz **`UPDATE`** | **Cliente novo não ganha linha em `phi_prod`** e o `INNER JOIN` do score o elimina, sem erro |
| **S3b** | Para o CLI-4 (KIL), `phi_prod` diz `CPA` (correto) e `phi_dev` diz `ROAS` — porque o writer do `dev` usa um default fixo em vez da Métrica-Mãe do Notion | Apontar esse workflow para `phi_prod` — a correção óbvia — **quebraria o score do KIL em silêncio** |
| **S4** | `raw_ad_data` tem dois writers **que funcionam**: mesmo workflow, em sequência, colunas disjuntas | É o padrão que já existe na casa e dá certo. **Generalizar, não reinventar** |
| — | Duas formas de arredondar `conversions` na mesma coluna: `parseInt` (trunca) no writer vencedor, `Math.round` no perdedor. E a coluna é `INT64` | Fração de conversão é perdida. Candidato a parte do subcount do Salão (321 no BQ vs ~481 no export) |

**O problema-raiz não é quantidade de writer — é que `ingestion_step` foi usado como se fosse
linhagem, quando é apenas "quem tocou por último".** Uma coluna que o próprio `UPDATE` alheio
sobrescreve não pode responder "de onde veio este número".

> ⚠️ **O `ADR-010` não está violado só no nome.** Havia leitura circulando de que ele estaria apenas
> "desatualizado" (o `Daily Entry` foi sucedido pelo `sw metricas campanhas`). Isso é verdade para o
> **nome**, mas **existem de fato dois writers ativos na mesma tabela**. O princípio está violado.

---

## 2. Decisão

### 2.1. Princípio único
> **Um destino, um dono.** Cada tabela do BigQuery e cada campo do Notion tem **um** workflow
> autorizado a escrevê-lo. Todos podem ler; nenhum outro escreve — **nem para "corrigir"**.
>
> Quando dois writers precisam mesmo coexistir num destino, só é permitido o padrão **S4**:
> mesmo workflow, em sequência, **conjuntos de colunas disjuntos e declarados**.

### 2.2. Matriz de propriedade (alvo)

| Destino | Dono único | Momento | Observação |
|---|---|---|---|
| `phi_prod.raw_campaign_data` | **`sw metricas campanhas`** (`W571K320aqIHsdtH`) | 04:00 BRT | `GADS_INSERT` aposentado (Fase 2) |
| `phi_prod.raw_ad_data` | `sw metricas anuncios` (`vVAdXAJh6MW2Z5Hp`) | via orquestrador | 2 nós, colunas disjuntas — padrão S4, mantido |
| `phi_prod.phi_score_history` | `PHI - Pipeline_v2` (`ITWG3Ge0asXtUM8U`) | 07:00 BRT | já é dono único |
| `phi_prod.workflow_execution_log` | `PHI - Pipeline_v2` | 07:00 BRT | já é dono único |
| `phi_prod.t28_*` (6 tabelas) | `PHI — Agregador Multi-fonte` (`4sdG2UKMCBuFq8xn`) | semanal/mensal | já é dono único |
| `phi_prod.client_config` | **`client_config`** (`SI5NSzRb8lVUz74RwOhIT`) | Notion Trigger (1h) | após Fase 3 — hoje escreve no dataset errado |
| Notion · `Score Diário (0-100)`, `Status Geral da Campanha` | `PHI - Pipeline_v2` | 07:00 BRT | vem do `phi_value` canônico |
| Notion · `Otimização Ativa?` | **`PHI - Fechar Otimização`** (`83vfKD8XMYmjZjFQ`) | de hora em hora | é quem tem a cadência certa (Fase 0.2) |
| Notion · DB Conjuntos | `sw metricas conjuntos` (`t0DH5N5maws4egnG`) | via orquestrador | já é dono único |
| Notion · DB Anúncios | `sw metricas anuncios` | via orquestrador | já é dono único |
| Notion · Snapshots de Telemetria | `WF-DOC-Telemetria-Diaria` (`VubalOUaoBteCyC6`) | 08:30 BRT | já é dono único, idempotente |

### 2.3. Invariantes (I1–I10) — não mudam sem novo ADR

`I1` **um destino, um dono** — dois writers no mesmo destino só no padrão S4 (colunas disjuntas,
declaradas, mesmo workflow). **O destino é a transição de estado, não o nome do campo:** dois workflows
podem escrever o mesmo campo desde que cada transição (abrir / fechar / limpar) tenha um dono só e isso
esteja declarado. (Refinado em 2026-09-08 pelo achado da §3.0.2.)

`I2` **nenhum `UPDATE` toca linhagem alheia.** `ingestion_step`, `execution_id` e
`source_execution_id` **nunca** entram num `UPDATE SET` que atualiza linha que o writer não criou.

`I3` **`conversions` é contagem real de conversões, em `FLOAT64`.** Nunca métrica derivada (CPA,
ROAS), nunca truncada com `parseInt`. Quem precisar de inteiro arredonda **na leitura**, não na
gravação.

`I4` **campo não observado grava `NULL`, nunca `0`.** Mantém o guardrail `N/D` do PHI:
`conversions = 0 ⇒ CPA/ROAS indefinidos`; `source_status = error ⇒ N/D`, não `0`.

`I5` **writer que precisa criar linha usa `MERGE`** (`INSERT` + `UPDATE`), nunca `UPDATE` puro.
`UPDATE` sozinho falha em silêncio quando a linha não existe — foi exatamente o caso do `client_config`.

`I6` **configuração lida do Notion nunca é substituída por default hardcoded.** Se a Métrica-Mãe
não vier, grava `NULL` e registra — não chuta `ROAS`.

`I7` **score é fato** (ADR-003). Este ADR trata de **escrita e ingestão**; não recalcula
`phi_value`, flags ou severidade.

`I8` **aposentadoria segue o procedimento do `[APOSENTADO]`** (§2.5). Workflow substituído não é
deletado nem deixado solto.

`I9` **descrição fiel** (regra R5): todo workflow diz o que faz, por que existe e o que substituiu.

`I10` **nada em produção escreve em `phi_dev`.** Workflow ativo aponta para `phi_prod`; `phi_dev` é
só para smoke.

### 2.4. Decisões — ✅ aprovadas pelo Olavo em 2026-09-08

| # | Decisão | Resolução |
|---|---|---|
| `D1` | Writer canônico de `raw_campaign_data` | ⚠️ **aprovado, mas EM REVISÃO desde 2026-09-09.** Duas das três justificativas caíram na verificação: hoje quem alimenta o score é o `GADS_INSERT`. Antes de escolher o writer é preciso decidir a **identidade** — ver §3.0.3 |
| `D2` | Dono de `Otimização Ativa?` | ⚠️ **aprovado, mas a premissa caiu na execução.** Não há writer a desligar — ver §3.0.2. Dono do *fechamento por tarefa* = `PHI - Fechar Otimização`; abertura e limpeza de órfã seguem no `Pipeline_v2` |
| `D3` | `conversions` vira `FLOAT64` | **Sim** — o `raw_ad_data` já é assim |
| `D4` | Atraso de atribuição | **Re-puxar os últimos 3 dias** a cada rodada (o `MERGE` já é idempotente) |
| `D5` | Arquivar o `Daily Entry` (`zGgIqiLlo5iAn8ud`) | **Não agora** — só depois da Fase 2 estável |

**Por que o `sw metricas campanhas` e não o `GADS_INSERT` (D1):**
1. é o preferido pelos **dois** consumidores, que já têm a cláusula de desempate escrita (S1c);
2. usa `Math.round`, não `parseInt` truncante;
3. escreve as janelas `cost_3d/7d` e `conversions_3d/7d`, que o outro não escreve;
4. é a sucessão declarada do `Daily Entry` — a função canônica do `ADR-010`.

**O que o `GADS_INSERT` escreve e o sucessor não:** apenas **`revenue`**. Isso é dívida da Fase 1,
e é o motivo pelo qual ele **não pode ser desligado antes** dela.

### 2.5. Procedimento de aposentadoria (o padrão da casa)
Copiado do que funcionou em 2026-07-21 com o `PHI - Loop Alerta Fase 1` (um double-write de tasks):

1. consolidar a função no workflow que fica;
2. **desabilitar o nó chamador** no workflow pai;
3. desativar o workflow aposentado;
4. **renomear com o carimbo `[APOSENTADO AAAA-MM-DD] ... — NÃO REUTILIZAR`**;
5. **sticky note** dizendo o que ele era, por que saiu e qual ADR autoriza reabrir;
6. só então considerar arquivamento.

---

## 3. Plano de migração — começa por **Estancar**

> Nenhuma fase constrói nada novo antes de parar o que apaga dado alheio.
> 🔴 **O pipeline das 04:00/07:00 BRT não pode quebrar.** Toda mudança de SQL passa por `phi_dev` +
> smoke nas duas campanhas KIL (Barbearia `GADS-21149189736`, Salão `GADS-21116045403`).

### Fase 0 — Estancar — ✅ **EXECUTADA em 2026-09-08**

| # | Ação | Estado |
|---|---|---|
| **0.1** | Remover `execution_id` e `ingestion_step` do `UPDATE SET` do nó `Execute SQL  INSERT raw_campaign_data` (`b1pbn8qmzCNTufTp`) | ✅ **aplicado e publicado** — versão ativa `105d22b3-5704-41a3-b143-ef5b1414d1c7` |
| **0.2** | Desabilitar os dois nós de `Otimização Ativa?` no `Pipeline_v2` | ❌ **CANCELADA — a instrução estava errada.** Ver §3.0.2 |
| **0.3** | Verificar `ingestion_step` no dia seguinte | ✅ **executada 2026-09-09** — resultado **desmentiu a premissa da S1**. Ver §3.0.3 |

**O que a 0.1 mudou, exatamente.** Os dois campos saíram do `WHEN MATCHED ... UPDATE SET` e **continuam** no
`WHEN NOT MATCHED ... INSERT` — onde este workflow é de fato o criador da linha. Um comentário no topo do
SQL explica o invariante I2, para que ninguém "conserte" isso de volta.

#### 3.0.2 🔴 Correção: a Fase 0.2 estava errada e não foi executada

Antes de desabilitar os nós, a leitura nó a nó do `Pipeline_v2` e do `PHI - Fechar Otimização` mostrou que
**a S2 não é uma duplicação**. Os três caminhos são distintos:

| Caminho | Quem faz | Ninguém mais faz? |
|---|---|---|
| **Abrir** (marca `true` após criar a otimização) | `Pipeline_v2` → `Update otimização ativa` | ✅ **exclusivo** |
| **Fechar por tarefa concluída** | `Pipeline_v2` (07h) **e** `PHI - Fechar Otimização` (1h) | ❌ sobreposto — mas inofensivo |
| **Limpar órfã** (campanha marcada `true` **sem tarefa aberta**) | `Pipeline_v2` → branch **FALSE** do `Tarefa para Fechar Existe?` | ✅ **exclusivo** |

Desabilitar qualquer um dos dois nós causaria dano:

- desligar `Update otimização ativa` → **nenhuma otimização volta a ser aberta** (quebra a Fase 3 do PHI,
  cuja ordem é imutável pela Regra Crítica nº 11);
- desligar `Auto-Close: Desativar Otimização` → **campanhas órfãs travam em `true` para sempre**, e como o
  `Buscar Campanha` do `PHI - Fechar Otimização` filtra por `Otimização Ativa? = true`, elas ficam presas.

E o `PHI - Fechar Otimização` **tem função própria e legítima**: quando o gestor conclui a tarefa **à mão**,
ele desmarca em até 1 hora; sem ele, a campanha esperaria até as 07h do dia seguinte. É **rede de
segurança**, não writer concorrente.

> **Por que eu errei.** O inventário viu "dois workflows escrevem o mesmo campo" e eu classifiquei como
> conflito sem separar as **transições**. A lição vira invariante: **`I1` se aplica a transições de estado,
> não a nomes de campo.** Dois workflows podem escrever o mesmo campo se cada transição tiver um dono só.

**Consequência para o `D2`:** a resposta muda de forma. Não há writer a desligar. O dono do **fechamento por
tarefa concluída** é o `PHI - Fechar Otimização`; o `Pipeline_v2` mantém **abertura** e **limpeza de órfã**.
Tornar isso um dono único de verdade exige portar a limpeza de órfã para o `Fechar Otimização` — **é obra,
não estancamento**, e virou a pendência **P-9**.

## 3.0.3 🔴 Fase 0.3 — o resultado desmentiu a premissa da S1

Verificação de 2026-09-09 (execuções **37179** e **37180**, leitura, workflow temporário
`FhNyngyJkTKO6ZiH` arquivado em seguida). Os pipelines das 04h (`37117`) e das 07h (`37163`)
rodaram **com sucesso** — a mudança de ontem não quebrou nada.

### O que a tabela mostra (D-1 = 2026-09-08)

| `ingestion_step` | linhas | `ingested_at` |
|---|---|---|
| `DAILY_ENTRY` | 3 | 04:00:15 → 04:00:49 BRT |
| `GADS_INSERT` | 2 | 07:00:59 → 07:01:06 BRT |

`DAILY_ENTRY` **apareceu**. Mas a leitura linha a linha mostra que isso **não é mérito da Fase 0.1**:

| campo | linhas `DAILY_ENTRY` | linhas `GADS_INSERT` |
|---|---|---|
| `client_id` | **`''` (vazio)** | `CLI-4` |
| `campaign_id` | `CMP.KIL.CAMP-7` / `CMP.KIL.CAMP-8` / `CMP.CHA.CAMP-10` | `GADS-21116045403` / `GADS-21149189736` |
| `revenue` | `NULL` | preenchido |
| `cost_3d` / `conversions_3d` | preenchidos | `NULL` |
| `data_source` / `platform` | preenchidos | `NULL` |

**São a mesma campanha, em linhas separadas.** Os custos batem:

| Campanha | `DAILY_ENTRY` | `GADS_INSERT` |
|---|---|---|
| Salão (08/09) | `CMP.KIL.CAMP-7` — cost `30.576738`, conv **13** | `GADS-21116045403` — cost `30.58`, conv **12** |
| Barbearia (08/09) | `CMP.KIL.CAMP-8` — cost `0.241752`, conv 0 | `GADS-21149189736` — cost `0.24`, conv 0 |

### 🔴 A premissa S1b estava errada

O `MERGE` casa por `(client_id, campaign_id, date)`. Como **os dois campos diferem**, o
`WHEN MATCHED` **nunca dispara** — é sempre `INSERT`. **Os dois writers nunca colidiram.**
O `GADS_INSERT` jamais sobrescreveu o rótulo do `DAILY_ENTRY`; e as linhas de **06 e 07/09**,
anteriores à mudança, **já traziam `DAILY_ENTRY`**.

> **A Fase 0.1 não produziu efeito observável.** Ela continua correta como defesa (invariante
> I2) e não causou dano, mas **não era o problema**. O que eu registrei em 08/09 como
> "confirmado por outro mecanismo" estava **errado**.

### 🔴 O problema real é maior: duas identidades incompatíveis

A cadeia das 04h grava com a identidade `CMP.<SLUG>.CAMP-N` e **`client_id` vazio**; a das 07h
grava com `GADS-<id>` e `client_id` preenchido. **Nada reconcilia as duas.** Consequência, lida
direto no SQL do nó `Calcular e Persistir PHI Score`:

```sql
raw_dedup AS (SELECT *, ROW_NUMBER() OVER (
    PARTITION BY client_id, campaign_id, date
    ORDER BY CASE WHEN ingestion_step = 'DAILY_ENTRY' THEN 0 ELSE 1 END) AS rn ...)
...
INNER JOIN `phi_prod.client_config` cc ON j.client_id = cc.client_id AND cc.is_active = TRUE
```

1. **A cláusula de desempate nunca dedupa nada.** Como `client_id` e `campaign_id` diferem, cada
   linha cai na **própria partição** e sai com `rn = 1`. As duas passam.
2. **O `INNER JOIN` elimina todas as linhas do `DAILY_ENTRY`**, porque `client_id = ''` não casa
   com nenhum cliente. **O score nunca viu esses dados — nem antes, nem agora.**
3. O `CASE ... STARTS_WITH(campaign_id, 'GADS-')` classificaria `CMP.*` como `'UNKNOWN'`.

### 🔴 Isso inverte o `D1`

Eu justifiquei o `sw metricas campanhas` como writer canônico por três motivos. **Dois caíram:**

| Justificativa de 08/09 | Situação após a verificação |
|---|---|
| "é o preferido pelos dois consumidores, que têm a cláusula de desempate" | ❌ **falso na prática** — a cláusula não dedupa, e as linhas dele são descartadas no `INNER JOIN` |
| "escreve as janelas `cost_3d`/`conversions_3d`, que o outro não escreve" | ❌ **não sustenta** — o score **recalcula** as janelas por `SUM(...)` sobre os 7 dias; **não lê** essas colunas |
| "usa `Math.round`, não `parseInt` truncante" | ✅ **de pé, e agora com evidência**: Salão 08/09 → `13` (round) vs `12` (parseInt) |

> **Hoje, o writer que de fato alimenta o score é o `GADS_INSERT`** — exatamente o que o ADR
> mandava aposentar. **A Fase 2 está suspensa.** Aposentá-lo agora deixaria o score sem fonte.

### Consequências imediatas

- **Fases 1 e 2 suspensas.** A Fase 1 (`revenue` + `FLOAT64`) melhoraria um writer cujas linhas
  o score descarta — trabalho sem efeito. **Nada disso foi executado.**
- As colunas `cost_3d/7d`, `conversions_3d/7d`, `data_source` e `platform` são, hoje, **gravadas
  todo dia e nunca lidas**.
- O `raw_d1_rows` do log conta **5 linhas** de D-1, mas só **2** chegam ao score. A telemetria
  superestima a cobertura em 2,5×.
- ✅ **Confirmada com evidência a armadilha da Fase 3**: o SQL tem
  `WHEN primary_metric_type != 'CPA' THEN 'INSUFFICIENT_DATA'`. **O score só suporta CPA.** Se o
  `client_config` do KIL virasse `ROAS` — como está hoje no `phi_dev` — o score do KIL sairia
  como `INSUFFICIENT_DATA`. A ordem obrigatória da Fase 3 está certa.

### O que ainda não sei

- **Por que `client_id` sai vazio** no `sw metricas campanhas`. Não investiguei o Code node.
- **De onde vem o formato `CMP.<SLUG>.CAMP-N`** e se ele é a identidade do ADR-33 (que fala de
  `entity_id`/`page_id`, sem definir esse formato). Não confirmei a ligação.
- Quem é **`CMP.CHA.CAMP-10`** (`meta_ads`): não há cliente `CHA` no `client_config`.
- Se algum consumidor **fora do pipeline** lê as colunas que o score ignora.

### Decisão que este achado exige do Olavo

A pergunta não é mais "qual dos dois writers fica", e sim **qual identidade é a verdadeira**:

- **(A)** `GADS-<id>` + `client_id` — o que o score, o `client_config` e o Notion já usam. Corrigir
  o `sw metricas campanhas` para gravar nesse formato; aí os dois writers finalmente colidem no
  `MERGE` e a Fase 0.1 passa a valer de verdade.
- **(B)** `CMP.<SLUG>.CAMP-N` — migrar score, `client_config` e consumidores para a identidade nova.
  Muito maior, e o ADR-33 ainda é rascunho.

**Recomendação: (A)** — é a que o sistema já usa de ponta a ponta, e é reversível.

### Fase 1 — ⏸️ SUSPENSA (ver §3.0.3) — Completar o sucessor

| # | Ação |
|---|---|
| 1.1 | Adicionar **`revenue`** ao `Code Montar SQL` do `sw metricas campanhas` (`metrics.conversionsValue`, já buscado pela GAQL) |
| 1.2 | Trocar `CAST(... AS INT64)` por **`FLOAT64`** em `conversions`, `conversions_3d`, `conversions_7d`; tirar o `Math.round` (I3) |
| 1.3 | Migrar o tipo da coluna em `phi_dev` → smoke → `phi_prod` |
| 1.4 | Implementar o re-puxe de D-1..D-3 (D4) |
| 1.5 | Smoke nas 2 campanhas KIL em `phi_dev`, comparando com o export oficial do Google Ads |

> A 1.5 é também a chance de **fechar a questão do subcount do Salão** (321 vs ~481). Se a diferença
> sumir com `FLOAT64` + re-puxe, era truncamento + atraso de atribuição. Se não sumir, é escopo de
> ações de conversão — e vira pendência própria.

### Fase 2 — ⏸️ SUSPENSA (ver §3.0.3) — Aposentar o `GADS_INSERT`
Aplicar o §2.5 ao `PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`), **preservando** o nó
`Execute SQL client_config sincronizado` até a Fase 3 — ou migrando-o junto.
Desabilitar o nó `Call Subworkflow Campanhas` no `Pipeline_v2`.

### Fase 3 — `client_config` — **nesta ordem, e só nesta**

| # | Ação | Se inverter |
|---|---|---|
| **3.1** | Corrigir a derivação de `primary_metric_type` no nó `Code limpar Notion`: **ler a Métrica-Mãe do Notion**, não o `metricDefaultMap` fixo (I6) | — |
| **3.2** | Trocar o `MERGE` de `phi_dev.client_config` para `phi_prod.client_config` (I10) | 🔴 fazer 3.2 antes de 3.1 **transforma o CPA do KIL em ROAS e quebra o score em silêncio** |
| **3.3** | Confirmar que o `MERGE` **INSERE** (I5) e cadastrar um cliente-teste no Notion para validar ponta a ponta | — |
| **3.4** | Remover o `UPDATE` de `client_config` do `b1pbn8qmzCNTufTp` (vira dono único) | — |

### Fase 4 — Fechar o rastro

| # | Ação |
|---|---|
| 4.1 | Atualizar o **`ADR-010`** com a cadeia real (`operador unico metricas` → `sw metricas campanhas`) |
| 4.2 | Aplicar as descrições R5 restantes (`sw metricas conjuntos`, `sw metricas anuncios`, `PHI - Pipeline_v2`) |
| 4.3 | **Resolver o repositório × n8n**: hoje o git descreve um sistema que não existe. Ou sincronizar de verdade, ou parar de versionar JSON de workflow e versionar só os ADRs |
| 4.4 | Arquivar os 14 inativos confirmados (menos o `Daily Entry`, por D5) |

---

## 4. Consequências

1. **`ingestion_step` deixa de ser linhagem e passa a ser rótulo do criador da linha.** Quem precisa
   saber a origem usa `execution_id`/`source_execution_id`, que o I2 protege.
2. **O `ADR-010` é atualizado, não revogado.** O princípio (um writer) continua; muda o nome do
   workflow que o cumpre.
3. **A Fase 0 entrega valor sozinha.** Se as fases seguintes atrasarem, a linhagem já está correta.
4. **O Score v2 (C1) fica destravado a partir da Fase 1**, quando a série diária passa a ter
   `conversions` real em `FLOAT64` e sem mistura de origens.
5. **Toda mudança em I1–I10 exige novo ADR.**
6. 🟡 **Ponto que este ADR não resolve:** como as 2 linhas de `phi_prod.client_config` entraram lá
   em fev/2025. Se existir uma carga manual documentada, ela também é um writer e precisa entrar na
   matriz §2.2.

---

## 5. O que NÃO foi verificado (honestidade de método)

- **Nenhuma das fases foi executada.** Este ADR é desenho; o Lote 1 foi read-only, exceto pelas
  descrições R5 e por uma leitura no BigQuery (execução 36946, workflow temporário já arquivado).
- **O subcount do Salão (321 vs ~481) não foi medido.** A hipótese `parseInt` + atraso de atribuição
  é plausível e não confirmada. Vira teste na Fase 1.5.
- **Não foi confirmado que não exista writer fora do n8n.** O inventário cobre os 14 workflows vivos.
  Carga manual, script ou job externo não seriam vistos por esse método — e o `created_at` de
  fev/2025 em `client_config` sugere justamente um.
- **`raw_ad_data` e `t28_*` foram inventariados, mas não auditados linha a linha** como o
  `raw_campaign_data`. São donos únicos; a qualidade interna deles não foi verificada.
- **O impacto de desligar o `GADS_INSERT` sobre consumidores fora do pipeline** (dashboards,
  consultas manuais, Looker) não foi levantado.

---

## 6. Pendências deste ADR (a lista fechada)

| # | Pendência | Tipo |
|---|---|---|
| P-1 | Olavo decidir `D1`–`D5` (§2.4) | 🔴 bloqueante |
| P-2 | Fase 0.3 — conferir `ingestion_step` após as 07h de 2026-09-09 | ✅ 0.1 feita · verificação pendente |
| P-3 | Fase 1 — `revenue` + `FLOAT64` + re-puxe + smoke KIL | execução |
| P-4 | Fase 2 — aposentar o `GADS_INSERT` | execução |
| P-5 | Fase 3 — `client_config` na ordem 3.1 → 3.2 → 3.3 → 3.4 | 🔴 execução com armadilha |
| P-6 | Fase 4 — `ADR-010`, descrições, repo × n8n, arquivamentos | acabamento |
| P-7 | Explicar a origem das 2 linhas de fev/2025 em `phi_prod.client_config` | investigação |
| P-8 | Medir o subcount do Salão na Fase 1.5 | qualidade de dado |
| P-10 | 🔴 **Decidir a identidade canônica** (`GADS-<id>` vs `CMP.<SLUG>.CAMP-N`) — bloqueia as Fases 1 e 2 | 🔴 bloqueante |
| P-11 | Investigar por que o `sw metricas campanhas` grava `client_id` vazio | investigação |
| P-12 | Identificar `CMP.CHA.CAMP-10` (cliente `CHA` não existe no `client_config`) | investigação |
| P-9 | Portar a **limpeza de órfã** do `Pipeline_v2` para o `PHI - Fechar Otimização`, para o campo ter dono único de verdade | obra (não é Fase 0) |

---

*Um destino, um dono — e o destino é a transição, não o campo.*
*E: `ingestion_step` não é linhagem; é só quem tocou por último.*
