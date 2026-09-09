# ADR-38 — Identidade neutra de plataforma + rebuild da série histórica

| | |
|---|---|
| **Status** | ✅ **ACEITO** na direção (Olavo, 2026-09-09) · **execução condicionada** aos pré-checks do §6 |
| **Substitui** | a "Opção A" do `2026-09-09-decisao-P-10-identidade-canonica.md` (prefixo `GADS-`/`META-`) |
| **Fecha** | **P-10** do ADR-37 |
| **Impacto** | `raw_campaign_data`, os 2 writers, o SQL do score, `phi_score_history` · critérios **C1** e **C2** |
| **Data efetiva do corte** | ⬜ *a preencher no dia da execução* — decidido: **o dia da alteração** |

---

## 1. Contexto

O P-10 perguntava qual identidade é a canônica em `raw_campaign_data`. Eu havia recomendado a
**Opção A** — padronizar em `GADS-<id>`, e depois ajustei para prefixo por plataforma
(`GADS-`/`META-`) por causa da linha de Meta.

**O Olavo apontou o defeito da minha proposta, e ele está certo:**

> *"Crie um identificador único (e não mais GADS ou META), porque futuramente se entrar outra
> plataforma (ex.: TikTok) o código terá que ser escrito novamente. **Já temos o dado de qual
> plataforma é — não precisamos deste identificador.**"*

O prefixo **duplica** informação que já existe na coluna `platform`. Duplicação de informação é a
mesma doença dos dois writers, só que dentro de um campo: **duas fontes para o mesmo fato**. E cobra
o preço em cada plataforma nova.

## 2. Decisão 1 — a identidade

| Campo | Conteúdo | Exemplo |
|---|---|---|
| `campaign_id` | **ID nativo da plataforma, SEM prefixo** | `21116045403` |
| `platform` | a plataforma | `google_ads` · `meta_ads` · `tiktok_ads`… |
| `client_id` | **sempre preenchido** (fecha o P-11) | `CLI-4` |

> **Chave de identidade: `(client_id, platform, campaign_id, date)`.**
> Plataforma nova = **um valor novo em `platform`**. Zero código de identidade a reescrever.

### Por que o ID nativo, e não um surrogate (`CMP.KIL.CAMP-7`)
- **Rastreabilidade:** com o ID nativo dá para abrir o Google Ads/Meta e achar a campanha na hora.
  Um surrogate exige uma tabela de-para só para depurar.
- **Sem estado:** surrogate sequencial precisa de gerador + tabela de mapeamento — mais um artefato
  para manter e mais um ponto de falha (quem atribui o número? e se dois workflows gerarem juntos?).
- **Atende o pedido sem abrir obra:** o `platform` já carrega o que o prefixo carregava.

> ⚠️ **Limitação conhecida e aceita:** se uma campanha for **recriada** na plataforma, ela ganha ID
> novo e a série histórica quebra naquele ponto. É exatamente o problema que o **ADR-33** (identidade
> estável) quer resolver. Este ADR **não fecha essa porta** — se o ADR-33 for aceito, a migração vira
> planejada, a partir de **uma** identidade em produção em vez de duas por acidente.

## 3. Decisão 2 — rebuild da série histórica a partir da fonte

**Autorizado pelo Olavo (2026-09-09):** apagar `phi_prod.raw_campaign_data` e recarregar a partir de
um **relatório oficial do Google Ads**, de **janeiro até a data do corte**.

### O que o rebuild resolve de brinde (é mais valioso que a própria troca de identidade)

| Problema | Como o rebuild resolve |
|---|---|
| **Dias vazios** (a credencial caiu e o workflow não rodou) | o relatório traz os dias que faltam |
| **Subcount de `conversions`** (Salão: BQ 321 × export ~481) | conversões **já assentaram** — o relatório de hoje traz o valor final, não o parcial de D-1 |
| **`parseInt` truncante × `Math.round`** | some: a carga vem de uma fonte só, com uma regra só |
| **Série diária suja** — o que **bloqueia o Score v2 (ADR-34)** | entrega a **série limpa** que o C1 precisa |

> 🎯 **Consequência estratégica:** este rebuild pode destravar o **C1** mais do que a própria
> consolidação dos writers. O ADR-34 foi validado em exports do Google Ads — o rebuild coloca no
> BigQuery **exatamente o tipo de dado em que ele foi validado**.

## 4. ⚠️ O que o relatório NÃO traz (não pode ser esquecido)

Um relatório de campanha traz métricas. **Não traz** o resto da linha:

| Coluna | De onde vem no rebuild |
|---|---|
| `primary_metric_goal` | **`client_goal_history`** — a meta muda ao longo do tempo; usar a meta **vigente em cada data**, não a de hoje |
| `platform` / `data_source` | definido pela carga (`google_ads`) |
| `client_id` | resolvido por cliente/conta |
| `revenue` | só se o relatório trouxer valor de conversão; senão **vazio, nunca 0** (invariante I3) |
| `cost_3d`/`conversions_3d`/`cost_7d`/`conversions_7d` | **NÃO backfillar.** O score recalcula por `SUM` sobre 7 dias (verificado em 09/09). Preencher seria trabalho descartado |
| `ingestion_step` | **`BACKFILL_2026-09`** — rótulo próprio, honesto |
| `execution_id` | id da execução da carga |

> **O rótulo `BACKFILL_2026-09` não é detalhe.** Sem ele, daqui a seis meses ninguém sabe que aquele
> trecho da série veio de relatório e não do pipeline diário. É a regra **R5** aplicada a dado.

## 5. 🔴 Riscos — o que decidir ANTES de apagar

1. ✅ **`phi_score_history` — DECIDIDO (Olavo, 2026-09-09): migrar a chave AGORA, recalcular no Score v2.**
   A tabela está chaveada por `GADS-...`; trocar a identidade em `raw_campaign_data` a deixaria órfã.

   O Olavo perguntou: *"não deve ser recalculada já que entrarão novos dados?"* — **sim, deve.** Os
   scores históricos foram calculados sobre a série suja (dias faltando, conversões subcontadas), e a
   `phi_score_history` é usada como **régua**: o **ADR-29** compara a métrica-mãe de hoje com o
   histórico ("salto implausível") e o **T28** lê o score canônico de lá. Régua construída sobre dado
   errado mede errado.

   **Mas recalcular agora é trabalho feito duas vezes.** O **Score v2 (ADR-34 / critério C1)** muda a
   fórmula, e validá-lo **já exige** recalcular sobre a série histórica limpa. Portanto:

   | Quando | O quê | Por quê |
   |---|---|---|
   | **Agora** (etapa 5) | `UPDATE` tirando o prefixo — migrar só a **chave** | senão o score diário cria linha nova em vez de casar com a antiga, e o histórico **duplica em silêncio** |
   | **No Score v2** (C1) | **recalcular** os scores sobre a série limpa | vem junto com a validação do v2 — e com a fórmula que vai ficar |
   | **Antes de apagar** | backup `phi_score_history_backup_2026-09` | guarda **o que o PHI disse na época**; o recálculo diz o que ele diria hoje — são coisas diferentes |

   > ⚠️ **Correção de um erro meu na 1ª versão deste ADR.** Eu justifiquei a migração dizendo que ela
   > "preserva o `acerto_previsao`". **Está errado:** `acerto_previsao` **não existe** em
   > `phi_score_history` — ele vive na **planilha `leads`** da frente Prospecção (bloco de aprendizado,
   > dono **P6**, ver `CONTRATO-PROSPECCAO.md`). O rebuild de `raw_campaign_data` **não toca** nesse
   > loop de aprendizado. A decisão acima não depende do argumento errado. (**R6** — hipótese
   > desmentida também se registra.)
2. **Backup antes de apagar.** Exportar a tabela atual (GCS ou tabela `_backup_2026-09-09`) **antes**
   de qualquer `DELETE`. Apagar é irreversível; o backup custa minutos.
3. **Outros consumidores.** O **Agregador T28** e o SQL do score leem essa tabela. O
   `STARTS_WITH(campaign_id, 'GADS-')` do score **quebra** com a identidade nova — tem de sair, dando
   lugar à coluna `platform`.
4. **Os dois writers têm de emitir a identidade nova ANTES da carga.** Se recarregar primeiro, o
   pipeline das 04h/07h volta a poluir no formato velho no dia seguinte.

## 6. Sequência obrigatória (não pular, não reordenar)

| # | Etapa | Por quê |
|---|---|---|
| 1 | **P-11** — descobrir por que o `client_id` sai vazio | ✅ **RESOLVIDO 2026-09-09 — ver §9. Mudou o custo: o `client_id` nunca foi extraído do Notion** |
| 2 | Ajustar **os dois writers** para a identidade nova (`campaign_id` nativo + `platform` + `client_id`) | senão a carga é repoluída no dia seguinte |
| 3 | Ajustar **os consumidores**: `MERGE` pela chave nova, remover o `STARTS_WITH` do score **e atualizar o campo `campaign_id` no Notion (Campanhas + Tasks abertas)** — ver §9.5 | senão o score não acha nada **e a Fase 3 inteira para** |
| 4 | **Backup** de `raw_campaign_data` | irreversível |
| 5 | **Migrar a chave** de `phi_score_history` (`UPDATE` tirando o prefixo) — §5.1 | senão o histórico duplica em silêncio a partir do dia seguinte |
| 6 | **Apagar e recarregar** de janeiro até a data do corte, com `ingestion_step = 'BACKFILL_2026-09'` | |
| 7 | Smoke nas 2 campanhas KIL + conferir que os dois writers **agora colidem** no `MERGE` | é o teste real |
| 8 | Retomar as Fases 1 e 2 do ADR-37 sob a identidade única | |

## 7. Verificação

- `SELECT platform, COUNT(*) FROM phi_prod.raw_campaign_data GROUP BY 1` — sem `NULL`.
- **Nenhum** `campaign_id` começando com `GADS-` ou `META-`.
- **Uma** linha por `(client_id, platform, campaign_id, date)` — a duplicação diária acabou.
- Os dias que estavam vazios (queda de credencial) **têm dado**.
- `SUM(conversions)` do Salão no período **bate com o relatório oficial** — fecha a dúvida do subcount.
- O score roda e as 2 campanhas KIL aparecem em `phi_score_history`.

## 8. Pontos abertos

- ✅ **Data do corte — DECIDIDO (Olavo, 2026-09-09): o dia em que a alteração for feita** (não 08/09).
  Consequências práticas, que mudam a execução:
  1. o relatório é puxado **depois** das etapas 1–5, **imediatamente antes** da carga — não antes;
  2. ele cobre **de janeiro até D-1 do dia do corte**; a 1ª rodada diária nova cobre do dia do corte
     em diante;
  3. **sobrepor um dia é seguro** (o `MERGE` pela chave nova deduplica); **deixar buraco não é**;
  4. **registrar a data real na tabela do topo** no dia em que acontecer (**R2**).
- **Meta Ads:** o **gate** continua valendo. Com a identidade neutra ele fica **mais fácil** de
  atender (não há prefixo a inventar), mas o consumidor ainda precisa aprender a pontuar Meta.
- **ADR-33** segue em aberto (identidade estável × campanha recriada).

---

## 9. ✅ Etapa 1 — P-11 resolvido (2026-09-09)

Leitura nó a nó do `sw metricas campanhas` (`W571K320aqIHsdtH`, 38 nós). **Somente leitura, nada alterado.**

### 9.1 Por que o `client_id` sai vazio — três elos, e o terceiro é o que importa

| # | Elo | O que acontece |
|---|---|---|
| 1 | `Code Clean Campanhas` extrai do Notion `properties['client_slug']` e publica como **`clean_client_slug`** | ✔ funciona |
| 2 | `Code prepara contexto para observação` lê **`data.clean_sigla_cliente`** — **nome que não existe** | ✗ `sigla_cliente` vira `undefined` |
| 3 | `Code Montar SQL` tenta 5 fontes e cai no fallback `''` | ✗ grava vazio |

```js
// Code Montar SQL — as 5 tentativas, todas falham hoje
const clientId = context.raw_notion_data?.clean_client_id   // 'raw_notion_data' não existe no contexto
  || context.raw_notion_data?.clean_sigla_cliente           // idem
  || context.sigla_cliente                                  // undefined (elo 2)
  || calculated.client_id || input.client_id || '';         // não existem
```

> 🔴 **Corrigir o nome do campo NÃO resolve.** Se os três elos batessem, o valor gravado seria **`KIL`** —
> o **`client_slug`**, não o **`client_id` (`CLI-4`)**. São campos diferentes (**Regra Crítica nº 4**), e o
> `INNER JOIN client_config ON client_id` continuaria descartando as linhas.
>
> **O normalizador nunca extraiu o `client_id`.** Ele só extrai `client_slug`.

**A correção real:** o campo **`client_id` existe no DB Campanhas do Notion** — o outro writer já o lê
(`props['client_id']?.rich_text?.[0]?.plain_text` no `PHI - Subworkflow Campanhas`). Basta o
`Code Clean Campanhas` passar a extraí-lo também, e o contexto propagá-lo com o nome certo.
**Alternativa** (se algum dia faltar no Notion): resolver `client_slug → client_id` pelo `client_config`.

### 9.2 Achado extra — o `campaign_id` errado tem a mesma causa: referência ao nó errado

```js
const campaignId = calculated.bq_campaign_id   // 'calculated' = Code Cálcula Métricas → NÃO tem esse campo
  || context.campaign_id                       // = clean_id_campanha → 'CMP.KIL.CAMP-7'  ← é este que vence
  || (googleId ? `GADS-${googleId}` : ...);    // nunca alcançado
```

Quem define `bq_campaign_id` é o **`Code Prep Tendência`** (`bq_campaign_id = 'GADS-' + idG`), **não** o
`Code Cálcula Métricas` que o `Code Montar SQL` consulta. Ou seja: **o workflow já sabia produzir o ID da
plataforma e lia do nó errado.** Por isso venceu o `CMP.KIL.CAMP-7`, que é o campo *ID da campanha* do
Notion.

### 9.3 O que isso muda no custo da Etapa 2

| Item | Situação | Custo |
|---|---|---|
| `platform` | ✅ **já é gravado** corretamente (`google_ads`), com fallback por plataforma | **zero** |
| `campaign_id` nativo | o ID está disponível (`clean_id_google`); basta usá-lo **sem prefixo** | **baixo** |
| `client_id` | ⚠️ **não é extraído do Notion** — exige mexer no normalizador, não só no `Code Montar SQL` | **médio** |
| `conversions` | usa `Math.round` (`intNum`) — some no rebuild | — |

> A Etapa 2 é **menor do que parecia** para `campaign_id`/`platform` e **maior** para `client_id`: são
> **dois nós** a alterar no writer das 04h (`Code Clean Campanhas` + `Code prepara contexto`), além do
> `Code Montar SQL`.

### 9.4 Verificado de passagem
O `MERGE` deste writer casa por `ON client_id AND campaign_id AND date` — **a mesma chave** do outro
writer. Confirma que, com a identidade unificada, os dois **passam a colidir** (teste da etapa 7).

### 9.5 🔴 Achado que o ADR não previu — existe um **quinto** lugar com o `campaign_id`

O §5.3 lista como consumidores o **score** e o **Agregador T28**. Falta um, e ele é o mais frágil:
**o campo `campaign_id` (rich_text) da DB Campanhas do Notion.**

**Ele é a ponte BigQuery ↔ Notion.** No `PHI - Pipeline_v2`:

```js
// Code Clean Campanhas F3 — lê o texto gravado no Notion
const campaignId = extractRichText(props['campaign_id']?.rich_text);

// Code Enriquecer Campanha — casa com o campaign_id vindo do BigQuery
const cleanMatch = allCleaned.find(item => item.json.clean_campaing_id === campaignId);
```

Como o match **funciona hoje** (as campanhas KIL aparecem no score), está provado que esse campo do
Notion contém hoje **`GADS-21116045403`** — o mesmo valor do BigQuery.

**O que quebra se só o BigQuery mudar:**

| Consequência | Efeito prático |
|---|---|
| `cleanMatch` não acha → `notion_page_id = null` | o score **não é escrito** na campanha do Notion |
| sem `notion_id_camp` | a **Task não é criada** (Fase 3 — Abertura) |
| `Get tasks para Escalada` busca pelo id novo | **escalada** não acha as tarefas |
| `Get Task para Fechar` compara `Task.campaign_id` × `Campanha.campaign_id` | **fechamento** e a limpeza de órfã param |

Ou seja: **mudar só o BigQuery derruba a Fase 3 inteira** do PHI — em silêncio, como sempre.

E há um **segundo efeito** já em produção: o nó `Create a database page` grava na Task
`campaign_id = {{ campaign_id do BigQuery }}`. Então as Tasks **abertas** carregam o valor antigo e
também precisam ser migradas, senão o fechamento não as encontra.

**Duas formas de resolver — e a diferença importa:**

| | Como | Avaliação |
|---|---|---|
| **(i)** | Atualizar o campo `campaign_id` das páginas do Notion (Campanhas **e** Tasks abertas) para o ID nativo | ✅ **recomendada** — mantém Notion e BigQuery coerentes, e o código não muda |
| **(ii)** | Mudar o `Code Clean Campanhas F3` para montar a chave a partir de `id_google_camp` (number) | ❌ resolve o match, mas as Tasks passam a nascer com o id novo enquanto a Campanha guarda o velho — **o fechamento quebra do mesmo jeito** |

> A **(ii) sozinha não fecha o problema.** O campo do Notion tem de ser atualizado de qualquer forma.

**Impacto na sequência do §6:** a etapa 3 ("ajustar os consumidores") passa a incluir **o Notion** —
não só o SQL do score. É trabalho de dado, não de código, e precisa acontecer **junto** com as etapas
2 e 3, não depois.

### 9.6 Confirmação de passagem — o `client_id` existe mesmo no Notion
O `Code Clean Campanhas F3` já lê `clean_client_id: extractRichText(props['client_id']?.rich_text)`.
Isso **confirma** a correção proposta em §9.1: o campo existe na DB Campanhas e um workflow já o
consome. O writer das 04h só não o extrai.

---

*Não duplique informação dentro de um campo: se a coluna `platform` já sabe, o `campaign_id` não precisa saber de novo.*
