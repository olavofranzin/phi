# ADR-38 — Identidade neutra de plataforma + rebuild da série histórica

| | |
|---|---|
| **Status** | ✅ **ACEITO** na direção (Olavo, 2026-09-09) · **execução condicionada** aos pré-checks do §6 |
| **Substitui** | a "Opção A" do `2026-09-09-decisao-P-10-identidade-canonica.md` (prefixo `GADS-`/`META-`) |
| **Fecha** | **P-10** do ADR-37 |
| **Impacto** | `raw_campaign_data`, os 2 writers, o SQL do score, `phi_score_history` · critérios **C1** e **C2** |
| **Data efetiva do corte** | ⬜ **ainda não ocorreu.** Etapas 2 e 3 prontas em rascunho em 2026-09-09; o corte só acontece quando 2→6 rodarem no mesmo bloco (ver §10.2) |

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

## 10. Estado da execução em 2026-09-09 — etapas 2 e 3 **em rascunho**, produção intacta

### 10.1 O que foi alterado (n8n, **não publicado**)

| Workflow | Nó | Mudança |
|---|---|---|
| `sw metricas campanhas` (`W571K320aqIHsdtH`) | `Code Montar SQL` | lê `client_id` da página do Notion via `Loop Over Items`; `campaign_id` vira o **ID nativo**; chave do `MERGE` ganha `platform` |
| `PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`) | `Code in JavaScript` + `Execute SQL  INSERT raw_campaign_data` | tira o prefixo `GADS-`/`META-`, passa a gravar **`platform`**, chave do `MERGE` ganha `platform` |
| `PHI - Pipeline_v2` (`ITWG3Ge0asXtUM8U`) | `Calcular e Persistir PHI Score` | dedup e `GROUP BY` por `(client_id, platform, campaign_id, date)`; `plataforma` deixa de vir do `STARTS_WITH` e passa a vir da coluna `platform` |

> **Nenhum foi publicado.** `versionId != activeVersionId` nos três — a versão que roda às 04h/07h
> continua sendo a antiga. **Produção não foi tocada.**

### 10.2 🔴 Por que parei antes de publicar — a ordem tem uma janela perigosa

Cheguei a atualizar o `campaign_id` das duas campanhas KIL no Notion para o ID nativo e **revertí em
seguida**, ao perceber o seguinte:

**Publicar (ou mudar o Notion) sem fazer o rebuild no mesmo bloco cria inconsistência garantida:**

| Se eu... | O que acontece |
|---|---|
| mudar só o **Notion**, com os workflows em rascunho | a produção grava `GADS-…` e o `Code Clean Campanhas F3` lê o ID nativo → **o match quebra hoje** |
| publicar só os **workflows**, sem o Notion | as linhas novas nascem com o ID nativo e o F3 lê `GADS-…` → **o match quebra amanhã** |
| publicar **tudo** e não rebuildar até as 04h | a tabela fica com as duas identidades: a série de 7 dias da identidade nova terá **1 dia só**, e o score de amanhã sai com `cost_7d` de um dia — **errado, e em silêncio** |

**Conclusão:** as etapas **2, 3, 4, 5 e 6 formam um bloco atômico** e precisam acontecer na mesma
janela. O ADR já dizia isso ("a data do corte é o dia da alteração"); a execução deixou claro que a
consequência de quebrar o bloco é **score errado sem erro visível**.

O estado atual — workflows em rascunho, Notion no formato antigo — é **consistente e seguro**. O
pipeline de amanhã roda exatamente como hoje.

### 10.3 ✅ P-12 resolvido — quem é `CMP.CHA.CAMP-10`

| Campo | Valor |
|---|---|
| Campanha | `[CHA] IG_MENS__PROD.TESTE__` |
| `client_id` | **`CLI-13`** |
| Plataforma | **Meta Ads** |
| `id_meta_camp` | `120223097083780450` |
| `campaign_id` no Notion | **vazio** |

É uma campanha de teste do Meta. **`CLI-13` não existe em `client_config`** (que só tem `CLI-4` e
`CLI-5`), então ela seria descartada pelo `INNER JOIN` de qualquer forma — coerente com o **gate do
Meta**, que segue valendo. Não foi alterada.

### 10.4 🟡 Risco novo — precisão do `id_meta_camp`

`120223097083780450` é **maior que 2^53** (o limite de inteiro exato em JavaScript e no tipo *number*
do Notion). Isso significa que o ID do Meta **pode já estar armazenado com perda de precisão** no
próprio Notion, antes de qualquer código nosso.

Não afeta o Google (`21149189736` está muito abaixo do limite) e não bloqueia este ADR, porque o Meta
está no gate. **Mas precisa ser resolvido antes da primeira campanha Meta real** — provavelmente
mudando `id_meta_camp` para um campo de **texto** no Notion.

### 10.5 O inventário das campanhas ativas (fonte para o corte)

| Campanha | `client_id` | `campaign_id` hoje | Alvo |
|---|---|---|---|
| KIL Salão | `CLI-4` | `GADS-21116045403` | `21116045403` |
| KIL Barbearia | `CLI-4` | `GADS-21149189736` | `21149189736` |
| CHA (teste Meta) | `CLI-13` | *(vazio)* | fora do escopo — gate do Meta |

**São 2 páginas a atualizar no Notion.** As 4 campanhas `Concluído` têm `campaign_id` vazio e não
entram (o writer filtra `Status = 'Em execução'`).

### 10.6 O que falta para fechar o bloco

| # | Falta | Observação |
|---|---|---|
| 4 | Backup de `raw_campaign_data` | antes de qualquer `DELETE` |
| 5 | `UPDATE` em `phi_score_history` tirando o prefixo | |
| 6 | **Puxar o relatório e recarregar** | é a etapa que eu ainda não sei executar sozinho — ver abaixo |
| — | Publicar os 3 workflows + atualizar as 2 páginas do Notion | **no mesmo bloco da 6** |

> ⚠️ **Ponto que precisa de decisão do Olavo antes da etapa 6:** de onde vem o relatório de janeiro
> até D-1. Pela API do Google Ads (GAQL com `segments.date`, usando a credencial que já existe) ou de
> um export manual? A API é reprodutível e não depende de arquivo, mas puxar ~8 meses × 2 campanhas
> exige paginação e é a primeira vez que este pipeline faria uma carga histórica.

---

## 11. 🔴 2026-09-09 17:35 UTC — BLOQUEIO: a credencial do BigQuery caiu

Ao iniciar a etapa 4 (backup), o n8n devolveu:

> `The credential "Google BigQuery account" needs to be reconnected.`
> *Access could not be refreshed because the connected account has revoked access, the refresh token
> expired, or the account password or permissions changed.*

Credencial `UhLRAanVarQeOpQy` (`Google BigQuery account`). Execução **37276**, falhou no primeiro nó.
**Nada foi criado, nada foi apagado** — o backup não chegou a rodar.

### 11.1 Isso é maior que o rebuild

A credencial **funcionava hoje de manhã**: o pipeline das 04h (`37117`) e das 07h (`37163`) rodaram com
sucesso, e a verificação da Fase 0.3 (execuções `37179`/`37180`, 11:00 UTC) leu o BigQuery normalmente.
**Ela caiu em algum momento entre 11:00 e 17:35 UTC de hoje.**

**Consequência imediata, independente deste ADR:** todo nó BigQuery está fora do ar. Se não for
reconectada, **o pipeline das 04h e das 07h de amanhã falha** — ingestão e cálculo do score.

### 11.2 E provavelmente explica os "dias vazios"

O §3 deste ADR lista, entre os problemas que o rebuild resolve, os **dias vazios "porque a credencial
caiu e o workflow não rodou"**. Isso não é história: **está acontecendo agora**, e foi observado ao
vivo. Reforça o valor do rebuild — e mostra que **o rebuild sozinho não basta**: sem tratar a
renovação da credencial, novos buracos vão aparecer.

> **Pendência que este ADR não cobre e precisa de dono:** por que a credencial OAuth do BigQuery
> expira, e o que fazer para o pipeline **avisar** quando isso acontece em vez de simplesmente deixar
> de gravar. Hoje a falha é silenciosa do ponto de vista do Olavo — só aparece como dia faltando na
> série, semanas depois.

### 11.3 O que está travado

| Etapa | Estado |
|---|---|
| 4 — backup | 🔴 **bloqueada** — precisa da credencial |
| 5 — migrar `phi_score_history` | 🔴 bloqueada (BigQuery) |
| 6 — apagar e recarregar | 🔴 bloqueada (BigQuery) |
| 2 e 3 — writers e score | ✅ prontos **em rascunho**, não publicados |
| Notion | ✅ no formato antigo, consistente com a produção |

**Ação necessária (só o Olavo pode fazer):** reconectar a credencial `Google BigQuery account` no n8n
(abrir a credencial → reconectar a conta Google). Depois disso o bloco de corte pode rodar inteiro.

### 11.4 Decisão de ordem — proposta de mudança ao §6

Quando destravar, sugiro **inverter as etapas 5 e 6** e inserir uma validação no meio:

| Ordem do §6 | Ordem proposta | Por quê |
|---|---|---|
| 4 backup → 5 migrar histórico → 6 apagar e recarregar | 4 backup → **6a carregar em staging** → **6b conferir** → **6c apagar e trocar** → 5 migrar histórico | **só apagar quando o dado novo já estiver na mão e conferido.** Se a carga histórica falhar no meio (API, paginação, limite), a tabela de produção nunca chega a ficar vazia |

O ADR manda apagar antes de carregar; a queda de credencial de hoje é exatamente o tipo de evento que
torna isso perigoso. **Fica como proposta, não aplicada** — o §6 segue valendo até o Olavo decidir.

---

## 12. Diagnóstico pré-carga (2026-09-09, execução **37280**) — credencial OK e três achados

Credencial reconectada pelo Olavo e **confirmada funcionando**. Workflow temporário de leitura já
arquivado.

### 12.1 A série NÃO começa em janeiro — começa em **março de 2026**, e tem 67 dias de buraco

| Mês | Dias com dado | Dias no mês | Faltam |
|---|---|---|---|
| 2026-03 | 7 | 31 | **24** |
| 2026-04 | 14 | 30 | **16** |
| 2026-05 | 20 | 31 | **11** |
| 2026-06 | 23 | 30 | **7** |
| 2026-07 | 22 | 31 | **9** |
| 2026-08 | 31 | 31 | 0 ✅ |
| 2026-09 | 8 | 8 | 0 ✅ |

**67 dias faltando**, todos entre março e julho. Agosto e setembro estão completos.

> O §3 e o §6 falam em recarregar "**de janeiro** até a data do corte". **Não existe dado de janeiro
> nem de fevereiro** — a ingestão começou em **2026-03**. O período do relatório deve ser
> **2026-03-01 → 2026-09-08**, salvo se o Olavo quiser puxar antes disso (as campanhas existem desde
> **2024-03-22**, segundo o Notion).

### 12.2 A duplicação começou em **junho/2026**

A contagem de `campaign_id` distintos por mês salta de **2** (março–maio) para **5** (junho em diante).
Os 5 são exatamente as duas identidades convivendo: `GADS-21116045403`, `GADS-21149189736`,
`CMP.KIL.CAMP-7`, `CMP.KIL.CAMP-8` e `CMP.CHA.CAMP-10`.

**Ou seja: o writer das 04h passou a gravar em junho/2026.** Antes disso só existia o `GADS_INSERT`.
Isso data o início da sobreposição S1 com precisão.

### 12.3 🔴 A instrução do §4 sobre `primary_metric_goal` está errada

O §4 manda buscar a meta em **`client_goal_history`**, "a meta vigente em cada data". A tabela tem:

| client_id | goal_value | valid_from | valid_until |
|---|---|---|---|
| `CLI-4` | **3.0** | 2026-03-05 | *(null)* |
| `CLI-5` | 3.0 | 2026-03-05 | *(null)* |

**Dois problemas:**

1. **A meta ali é por CLIENTE, não por campanha.** Mas as duas campanhas do CLI-4 têm metas
   **diferentes**: Salão **3,50** e Barbearia **5,20** (Notion, e confirmado no `CLAUDE.md`). Uma
   tabela por cliente **não consegue** representar isso.
2. **O valor não bate com nenhuma das duas** — `client_goal_history` diz `3.0`.

**Como o pipeline realmente faz hoje:** a fonte primária é o campo **`Meta da Métrica-mãe` do Notion,
por campanha**; o `client_goal_history` é apenas **fallback** quando aquele vem nulo (é o que o nó
`If primary_metric_goal` do `PHI - Subworkflow Campanhas` faz).

> **Se o backfill seguisse o §4 ao pé da letra, gravaria `3.0` para as duas campanhas** — sobrescrevendo
> as metas reais em ~190 dias de série e alterando o score histórico. (**R6** — registro em vez de
> executar.)

**Proposta para a etapa 6:** usar a **meta por campanha do Notion** (3,50 Salão / 5,20 Barbearia) para
todo o período recarregado, e **assumir explicitamente** que ela foi constante — porque **não existe
histórico de meta por campanha** em lugar nenhum. Se a meta mudou em algum momento, essa informação
**está perdida** e o backfill vai achatá-la. É uma perda conhecida e aceita, não um detalhe.

**Pendência derivada (sem dono):** `client_goal_history` é por cliente e o negócio é por campanha. Ou a
tabela ganha `campaign_id`, ou ela deixa de ser a fonte de meta e vira só histórico de referência.

### 12.4 `phi_score_history` — extensão atual

| campaign_id | linhas | de | até |
|---|---|---|---|
| `GADS-21116045403` | 116 | 2026-03-29 | 2026-09-08 |
| `GADS-21149189736` | 117 | 2026-03-27 | 2026-09-08 |
| `TEST-INSUFFICIENT-A02` | 1 | 2000-01-01 | 2000-01-01 |

São **233 linhas reais** a migrar na etapa 5 (mais uma linha de teste, que pode ser descartada).

---

## 13. 🎯 Staging carregada e conferida — o achado que justifica o ADR inteiro

Fonte: exports oficiais do Google Ads (`docs/analises/google_ads/*jan-set.csv`), **01/01/2026 → 08/09/2026**,
lidos direto do repositório pelo n8n. Execuções **37287** (carga) e **37288** (comparação); backups pela
**37289**. Workflows temporários arquivados.

### 13.1 A staging bate com o arquivo

| Campanha | Linhas | Período | Conversões | Custo | Linhas com fração |
|---|---|---|---|---|---|
| Salão `21116045403` | 215 | 01/01 → 08/09 | **2 585,92** | 6 756,85 | **59** |
| Barbearia `21149189736` | 248 | 01/01 → 08/09 | **117,00** | 953,24 | 0 |

Conferido contra leitura independente do CSV: **idêntico**. O parse do formato pt-BR (ponto de milhar,
vírgula decimal) está correto, e as **59 linhas com conversão fracionada** do Salão sobreviveram — são
exatamente o que o `parseInt` do pipeline vinha truncando.

### 13.2 🔴 O que a produção tem hoje, comparado ao real — na mesma janela

Janela: a partir de **29/03/2026**, quando a produção começou a ter dado.

| | Salão | Barbearia |
|---|---|---|
| Dias na produção | 98 | 115 |
| Dias reais | **140** | **161** |
| **Dias faltando** | **42** | **46** |
| Conversões na produção | 749,00 | 5,00 |
| Conversões reais | **1 427,19** | **43,00** |
| **Diferença** | **+678,19** | **+38,00** |
| Custo na produção | 3 314,19 | 289,54 |
| Custo real | 4 520,73 | 330,85 |

> **A produção tinha 52% das conversões do Salão e 12% das da Barbearia.**

### 13.3 🔴🔴 O impacto vai além do dado: o score estava classificando errado

| Campanha | Meta (CPA) | CPA com o dado da produção | CPA com o dado real | Leitura |
|---|---|---|---|---|
| **Salão** | 3,50 | **4,42** (acima da meta → ruim) | **3,17** (abaixo da meta → bom) | 🔴 **o diagnóstico se inverte** |
| **Barbearia** | 5,20 | **57,91** (11× a meta) | **7,69** (1,5× a meta) | 🔴 severidade muito exagerada |

**O PHI vinha dizendo que o Salão estava fora da meta quando ele estava dentro.** E tratava a Barbearia
como catástrofe quando o desvio real é bem menor.

Isso reposiciona o ADR-38: ele deixa de ser "arrumação de identidade" e passa a ser **correção de um erro
de diagnóstico que chegava ao gestor**. Também explica por que o Score v2 (C1) não podia ser validado
sobre a série atual.

> **Ressalva honesta:** a comparação de CPA acima é agregada na janela inteira, não é o `phi_value`. O
> score usa janela de 7 dias, pesos por modelo e outros componentes (MAS/TSS/FIS). A direção do erro está
> demonstrada; **o efeito exato em cada `phi_value` diário só aparece quando os scores forem recalculados**
> — o que é entrega do Score v2, não deste ADR.

### 13.4 Backups feitos (etapa 4 ✅)

| Tabela | Origem | Backup |
|---|---|---|
| `raw_campaign_data` → `raw_campaign_data_backup_2026_09_09` | 436 | **436** ✅ |
| `phi_score_history` → `phi_score_history_backup_2026_09` | 234 | **234** ✅ |

### 13.5 Duas correções ao plano do §6, para o passo destrutivo

**(a) O `DELETE` deve ser restrito, não total.** O §6 diz "apagar e recarregar". Apagar a tabela inteira
levaria junto as linhas de `CMP.CHA.CAMP-10` (CLI-13, Meta), que o backfill **não cobre** — não há export
do Meta. O `DELETE` deve alcançar só o que será reposto:

```sql
DELETE FROM `phi_prod.raw_campaign_data`
WHERE client_id = 'CLI-4'
   OR campaign_id IN ('GADS-21116045403','GADS-21149189736','CMP.KIL.CAMP-7','CMP.KIL.CAMP-8');
```

(as linhas do writer das 04h têm `client_id` vazio, por isso a segunda condição). As linhas do CHA ficam
intactas, com a identidade antiga, e viram pendência à parte.

**(b) `conversions` precisa virar `FLOAT64` ANTES do INSERT.** A coluna é `INT64` hoje; inserir 27,98
truncaria de novo — exatamente o defeito que o rebuild existe para corrigir. É o `D3` do ADR-37, já
aprovado:

```sql
ALTER TABLE `phi_prod.raw_campaign_data` ALTER COLUMN conversions SET DATA TYPE FLOAT64;
-- idem conversions_3d e conversions_7d
```

### 13.6 O que o backfill NÃO traz

| Coluna | Fica | Por quê |
|---|---|---|
| `revenue` | **NULL** | o export não tem coluna de valor de conversão — **vazio, nunca 0** (I3) |
| `cost_3d/7d`, `conversions_3d/7d` | NULL | o score recalcula por `SUM` (verificado em 09/09) |
| `primary_metric_goal` | 3,50 / 5,20 | meta por campanha do Notion, **assumida constante** (§12.3) |

---

*Não duplique informação dentro de um campo: se a coluna `platform` já sabe, o `campaign_id` não precisa saber de novo.*
