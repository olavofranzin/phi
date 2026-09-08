# ADR-37 — Writers canônicos do pipeline do Score: um destino, um dono

| | |
|---|---|
| **Status** | 📝 **PROPOSTO** — 2026-09-08 · aguarda decisão do Olavo |
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
| **S2** | `Otimização Ativa?` (Notion) tem dois donos: `PHI - Pipeline_v2` (1×/dia) e `PHI - Fechar Otimização` (**de hora em hora**) | Quem roda 24× mais é o dono efetivo, e pode desfazer o que o pipeline marcou minutos antes |
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
declaradas, mesmo workflow).

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

### 2.4. Decisões que este ADR pede ao Olavo

| # | Decisão | Recomendação |
|---|---|---|
| `D1` | Writer canônico de `raw_campaign_data` | **`sw metricas campanhas`**, aposentando o `GADS_INSERT` |
| `D2` | Dono de `Otimização Ativa?` | **`PHI - Fechar Otimização`** (cadência de hora em hora) |
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

### Fase 0 — Estancar (baixo risco, alto retorno, nada é desligado)

| # | Ação | Por quê |
|---|---|---|
| **0.1** | No nó `Execute SQL  INSERT raw_campaign_data` (`b1pbn8qmzCNTufTp`), **remover `execution_id` e `ingestion_step` do `UPDATE SET`** | Duas linhas de SQL. Devolve a linhagem **sem desligar ninguém** e faz as cláusulas de desempate (S1c) voltarem a funcionar. **Totalmente reversível.** |
| **0.2** | Desabilitar os nós `Update otimização ativa` e `Auto-Close: Desativar Otimização` no `Pipeline_v2` (D2) | Encerra a S2 imediatamente |
| **0.3** | Verificar no dia seguinte: `SELECT ingestion_step, COUNT(*) FROM phi_prod.raw_campaign_data WHERE date = CURRENT_DATE()-1 GROUP BY 1` | Deve passar a aparecer `DAILY_ENTRY`. **É o teste de que a Fase 0 funcionou.** |

> Depois da 0.1 os dois writers continuam existindo, mas **a linha passa a dizer a verdade sobre a
> própria origem**. Isso já destrava o diagnóstico do Score v2 (C1) antes de qualquer obra.

### Fase 1 — Completar o sucessor (antes de aposentar o outro)

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

### Fase 2 — Aposentar o `GADS_INSERT`
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
| P-2 | Fase 0 — estancar (0.1, 0.2, 0.3) | execução, baixo risco |
| P-3 | Fase 1 — `revenue` + `FLOAT64` + re-puxe + smoke KIL | execução |
| P-4 | Fase 2 — aposentar o `GADS_INSERT` | execução |
| P-5 | Fase 3 — `client_config` na ordem 3.1 → 3.2 → 3.3 → 3.4 | 🔴 execução com armadilha |
| P-6 | Fase 4 — `ADR-010`, descrições, repo × n8n, arquivamentos | acabamento |
| P-7 | Explicar a origem das 2 linhas de fev/2025 em `phi_prod.client_config` | investigação |
| P-8 | Medir o subcount do Salão na Fase 1.5 | qualidade de dado |

---

*Um destino, um dono. E: `ingestion_step` não é linhagem — é só quem tocou por último.*
