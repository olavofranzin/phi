# Brief de decisão — Qual é a identidade canônica de `raw_campaign_data`?

| | |
|---|---|
| **Para** | Chat-mãe (planejamento estratégico) |
| **De** | Sub-chat de Consolidação de Writers |
| **Data** | 2026-09-09 |
| **Decisão pedida** | **P-10** do ADR-37 — qual identidade (`campaign_id` + `client_id`) é a verdadeira |
| **O que está travado** | **Fases 1 e 2 do ADR-37** (suspensas em 09/09). A Fase 3 **não** depende disto |
| **Impacto** | Critério **C2** da Definição de Pronto e, por consequência, o **Score v2 (C1)** |
| **Base factual** | ADR-37 §3.0.3 · execuções n8n **37179/37180** (leitura) · SQL do nó `Calcular e Persistir PHI Score` |

---

## 1. Resumo em cinco linhas

`phi_prod.raw_campaign_data` recebe, todo dia, **duas linhas para a mesma campanha**, gravadas por dois
workflows que usam **identidades incompatíveis**. As linhas do writer das 04h têm **`client_id` vazio** e
são **silenciosamente descartadas** pelo `INNER JOIN` do cálculo do score. Ou seja: **metade do que o
sistema ingere nunca é lida**, e o writer que o ADR-37 elegeu como canônico é justamente o que o score
ignora. Antes de escolher writer, é preciso escolher **identidade**.

---

## 2. O que está acontecendo (fato verificado)

Leitura de `raw_campaign_data` para 06, 07 e 08/09 — **5 linhas por dia**, sempre no mesmo padrão:

| | Writer das 04h (`DAILY_ENTRY`) | Writer das 07h (`GADS_INSERT`) |
|---|---|---|
| workflow | `sw metricas campanhas` (`W571K320aqIHsdtH`) | `PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`) |
| `client_id` | **`''` (vazio)** | `CLI-4` |
| `campaign_id` | `CMP.KIL.CAMP-7`, `CMP.KIL.CAMP-8`, `CMP.CHA.CAMP-10` | `GADS-21116045403`, `GADS-21149189736` |
| `revenue` | `NULL` | preenchido |
| `cost_3d` / `conversions_3d` | preenchidos | `NULL` |
| `data_source` / `platform` | preenchidos | `NULL` |

**São a mesma campanha.** Os custos batem em todos os dias verificados:

| Campanha | 04h | 07h |
|---|---|---|
| Salão (08/09) | `CMP.KIL.CAMP-7` → cost `30.576738`, conv **13** | `GADS-21116045403` → cost `30.58`, conv **12** |
| Salão (07/09) | cost `48.652893`, conv 8 | cost `48.65`, conv 8 |
| Barbearia (08/09) | `CMP.KIL.CAMP-8` → cost `0.241752` | `GADS-21149189736` → cost `0.24` |

---

## 3. Por que isso não foi visto antes

O `MERGE` casa por `(client_id, campaign_id, date)`. Como **os dois campos diferem**, o `WHEN MATCHED`
**nunca dispara** — é sempre `INSERT`. Os dois writers **nunca colidiram**, então nada nunca falhou, deu
erro ou alertou. Cada um inseriu a sua linha, todo dia, em silêncio.

> **Correção de rumo registrada.** O inventário de 08/09 concluiu que o writer das 07h **sobrescrevia** o
> rótulo do das 04h. Isso está **errado** — a verificação de 09/09 desmentiu. A Fase 0.1, aplicada em
> produção em 08/09, continua correta como defesa (invariante I2) e não causou dano, mas **não era o
> problema**. Registrado no ADR-37 §3.0.3 conforme a **R6**.

---

## 4. A consequência real — lida no SQL do score

Do nó `Calcular e Persistir PHI Score` (`PHI - Pipeline_v2`):

```sql
raw_dedup AS (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY client_id, campaign_id, date
    ORDER BY CASE WHEN ingestion_step = 'DAILY_ENTRY' THEN 0 ELSE 1 END) AS rn
  FROM `phi_prod.raw_campaign_data` ...)
...
INNER JOIN `phi_prod.client_config` cc ON j.client_id = cc.client_id AND cc.is_active = TRUE
```

1. **A dedup nunca dedupa.** Como `client_id` e `campaign_id` diferem, cada linha cai na **própria
   partição** e sai com `rn = 1`. A cláusula que prefere `DAILY_ENTRY` **nunca teve efeito** — e a razão
   não é a que supúnhamos.
2. **O `INNER JOIN` elimina 100% das linhas das 04h**, porque `client_id = ''` não casa com cliente
   nenhum. **O score nunca viu esses dados** — nem antes da Fase 0.1, nem depois.
3. **O score recalcula as janelas** 3d/7d por `SUM(...)` sobre os 7 dias. As colunas `cost_3d`,
   `conversions_3d`, `cost_7d`, `conversions_7d` que o writer das 04h grava **não são lidas por ele**.

### Efeitos colaterais já mensuráveis

- **Trabalho descartado diariamente:** as janelas 3d/7d, `data_source` e `platform` são gravadas e
  nunca consumidas pelo score.
- **Telemetria infla a cobertura em 2,5×:** o `raw_d1_rows` do `workflow_execution_log` conta **5**
  linhas de D-1; só **2** chegam ao score.
- **Divergência de `conversions` entre os dois writers**, com evidência: Salão 08/09 → **13** (o das 04h,
  `Math.round`) contra **12** (o das 07h, `parseInt` truncante). É consistente com um valor real entre
  12,5 e 12,9. **Isto é evidência forte, não prova** — não medi contra o export oficial do Google Ads.

---

## 5. Isso inverte a decisão `D1` do ADR-37

O `D1` (aprovado em 08/09) elegeu o `sw metricas campanhas` como writer canônico, com três justificativas.
**Duas caíram:**

| Justificativa de 08/09 | Depois da verificação |
|---|---|
| "é o preferido pelos dois consumidores, que já têm a cláusula de desempate" | ❌ **falso na prática** — a cláusula não dedupa, e as linhas dele são descartadas no `INNER JOIN` |
| "escreve as janelas `cost_3d`/`conversions_3d`, que o outro não escreve" | ❌ **não sustenta** — o score recalcula por `SUM`; não lê essas colunas |
| "usa `Math.round`, não `parseInt` truncante" | ✅ **de pé, e agora com evidência** (13 vs 12) |

> **Hoje, o writer que de fato alimenta o score é o `GADS_INSERT`** — exatamente o que o ADR mandava
> aposentar na Fase 2. Aposentá-lo agora deixaria o score **sem fonte**. Por isso **as Fases 1 e 2 estão
> suspensas e nada foi executado.**

---

## 6. As opções

### Opção A — Adotar `GADS-<id>` + `client_id` (o que o resto do sistema já usa)
Corrigir o `sw metricas campanhas` para gravar `client_id` preenchido e `campaign_id` no formato `GADS-`.

- **A favor:** é o formato que o **score**, o **`client_config`**, o **Notion** e o `CLAUDE.md` já usam
  (`GADS-21149189736` é o cliente de referência documentado). Muda **um** workflow. Depois disso os dois
  writers finalmente colidem no `MERGE`, a dedup passa a funcionar e a **Fase 0.1 passa a valer de
  verdade**. Reversível.
- **Contra:** mantém o `campaign_id` acoplado ao ID da plataforma — o problema que o ADR-33 (rascunho)
  queria resolver. É consertar o presente, não a raiz.
- **Custo estimado:** baixo — 1 workflow, smoke nas 2 campanhas KIL. **Estimativa, não medição.**

### Opção B — Adotar `CMP.<SLUG>.CAMP-N` (a identidade estável)
Migrar score, `client_config`, Notion e consumidores para a identidade nova.

- **A favor:** resolve a raiz que o ADR-33 aponta (identidade que não depende da plataforma).
- **Contra:** toca o SQL do score, o `client_config`, o `phi_score_history` (histórico já gravado com
  `GADS-`), a classificação `STARTS_WITH(campaign_id, 'GADS-')` e o T28. O **ADR-33 ainda é rascunho** —
  isto o promoveria a obra grande, sem que ele tenha sido aceito.
- **Custo estimado:** alto, com migração de dado histórico. **Estimativa grosseira.**

### Opção C — Paliativo: tabela/VIEW de reconciliação
Deixar os dois como estão e criar um mapa `CMP.* ↔ GADS-*`.

- **A favor:** não mexe em writer nenhum; destrava a leitura das colunas hoje órfãs.
- **Contra:** **institucionaliza a duplicação** e cria um terceiro artefato para manter. Viola o
  princípio "um destino, um dono" do próprio ADR-37.
- **Só faz sentido** como ponte curta se houver pressa por `revenue` + janelas na mesma consulta.

### Recomendação
**Opção A.** É a menor mudança que torna o sistema coerente, e é a única reversível. Ela **não fecha a
porta** para o ADR-33: se a identidade estável for adotada depois, será uma migração planejada — não
duas identidades convivendo por acidente.

---

## 7. O que eu não sei (não decidir sobre isto sem verificar)

- **Por que o `client_id` sai vazio** no `sw metricas campanhas` — não abri o Code node dele. Pode ser
  bug simples ou decisão deliberada. **Muda o custo da Opção A.**
- **De onde vem o formato `CMP.<SLUG>.CAMP-N`** e se é mesmo a identidade do ADR-33 — o ADR fala de
  `entity_id`/`page_id` e **não define esse formato**. Não confirmei a ligação.
- **Quem é `CMP.CHA.CAMP-10`** (`meta_ads`): não existe cliente `CHA` no `client_config`. Pode ser
  cliente novo, teste, ou lixo.
- **Se algo fora do pipeline** (dashboard, Looker, consulta manual) lê as colunas que o score ignora.
- Se a divergência 13 vs 12 é **só** truncamento ou também atraso de atribuição — só medindo contra o
  export oficial.

---

## 8. O que está no ar agora

- **Fase 0.1 aplicada e publicada** (`b1pbn8qmzCNTufTp`, versão `105d22b3`): o `UPDATE SET` não toca mais
  `execution_id`/`ingestion_step`. Correta, inócua hoje, **relevante assim que a Opção A for feita**.
- **Nada mais foi executado.** Fases 1 e 2 suspensas.
- Pipelines das 04h e 07h de 09/09 rodaram **com sucesso**.

---

## 9. Encaminhamento sugerido

| Ordem | Ação | Depende de P-10? |
|---|---|---|
| 1 | **Decidir P-10** (A, B ou C) | — |
| 2 | **Fase 3 — `client_config`**, na ordem obrigatória 3.1 → 3.2 → 3.3 → 3.4 | ❌ **não depende — pode andar já** |
| 3 | Investigar P-11 (`client_id` vazio) e P-12 (`CMP.CHA.CAMP-10`) | ❌ não depende |
| 4 | Refazer as Fases 1 e 2 do ADR-37 sob a identidade escolhida | ✅ sim |

> **Nota sobre a Fase 3.** A verificação de hoje **confirmou a armadilha com evidência direta**: o SQL do
> score tem `WHEN primary_metric_type != 'CPA' THEN 'INSUFFICIENT_DATA'` — **o score só suporta CPA**. Se
> o `client_config` do KIL virasse `ROAS` (como está hoje no `phi_dev`), o score sairia
> `INSUFFICIENT_DATA`. A ordem "corrigir a métrica **antes** de trocar o dataset" está certa e é
> obrigatória.

---

*Um destino, um dono — e o destino é a transição, não o campo.*
*E: se dois writers nunca colidem, não é porque estão de acordo — pode ser que nem se enxerguem.*
