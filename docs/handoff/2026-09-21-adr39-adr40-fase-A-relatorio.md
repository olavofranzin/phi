# ADR-39 + ADR-40 — relatório da FASE A (aditiva)

| | |
|---|---|
| **Estado** | ✅ **FASE A CONCLUÍDA** em 2026-09-21, 19h–22h BRT — dentro da janela 09h–23h (**CA10 ✅**) |
| **Próximo passo** | ⏸️ **PARADA OBRIGATÓRIA.** Rodar um dia inteiro. A Fase B **não começa** antes da conferência da manhã de 22/09 — §4 |
| **O que mudou em produção** | 2 `ADD COLUMN` · 1 backfill · 3 workflows publicados |
| **O que NÃO mudou** | nada foi removido. `phi_dev` de pé · `client_config` intocado (`99abdada`) · `UPDATE` do Subworkflow ainda lá |
| **Se parar aqui** | o sistema funciona como ontem, com dado a mais. É o ponto de parada seguro, e existe de propósito |
| **Brief** | `2026-09-21-adr39-adr40-metrica-e-cadastro-subchat-brief.md` |

---

## 1. Passo zero (R13) — os `versionId` que eu citei continuam sendo os publicados

As verificações do adendo saíram de dumps de 20/09 com o n8n fora do ar. Reconfirmei **antes** de
tocar em qualquer coisa: **os seis `versionId` citados estavam inalterados, e cada um igual ao seu
`activeVersionId`.** Nenhuma leitura velha entrou na execução.

## 2. O que foi feito, passo a passo

| # | O que | Onde | Prova |
|---|---|---|---|
| **A1** | `ADD COLUMN primary_metric_type` | `phi_prod.raw_campaign_data` e `phi_prod.phi_score_history` | workflow temporário `9kAicvy73zVk8doU`, execução **41650** |
| **A2** | Backfill a partir do `client_config` | as duas tabelas | workflow temporário `XBHaLdsZdGv8L9Mn`, execução **41652** — contagens antes/depois em §3 |
| **A3a** | writer 1 grava o tipo | `PHI - Subworkflow Campanhas` → `Code transformar retorno Google Ads` + `Execute SQL  INSERT raw_campaign_data` | publicado: `activeVersionId = 4f42b244-b591-4c9c-82ef-ba78668b69be` |
| **A3b** | writer 2 grava o tipo | `sw metricas campanhas` → `Code Montar SQL` (MERGE: source, UPDATE SET, INSERT, VALUES) | publicado: `versionId = activeVersionId = 752e5300-c9e4-4c86-b4fd-a7ec6d044505` |
| **A4** | **REQ-1:** `\|\| 'ROAS'` → `\|\| null` | `PHI - Subworkflow Campanhas` → `Code in JavaScript` | mesma versão `4f42b244` |
| **A5** | score lê o tipo **da campanha** | `PHI - Pipeline_v2` → `Calcular e Persistir PHI Score` | publicado: `versionId = activeVersionId = b880adee-1b6e-4493-ad3d-b9180b5123ee` |
| **A6** | `phi_score_history` **grava** o tipo | mesmo nó — INSERT **e** UPDATE SET | mesma versão `b880adee` |
| **REQ-3** | sticky com a **data** de remoção do `COALESCE` | `PHI - Pipeline_v2`, nó `REQ-3 PRAZO: COALESCE do primary_metric_type` @ `[7376,12000]` | mesma versão `b880adee` |

**Todas as três publicações foram relidas depois** (R13): `versionId == activeVersionId` nos três, e
o SQL/JS que está no ar foi comparado **byte a byte** com o que eu mandei. Bateu.

### 2.1. O que exatamente entrou no score (A5)

```sql
-- no CTE janelas, do mesmo jeito que o primary_metric_goal já era lido:
MAX(IF(date = D-1, primary_metric_type, NULL)) AS primary_metric_type,
...
j.* EXCEPT (primary_metric_type),                       -- senão colide com a linha abaixo
COALESCE(j.primary_metric_type, cc.primary_metric_type) AS primary_metric_type,
```

O `EXCEPT` não estava no plano — **apareceu na execução**: o `j.*` traria a coluna nova e ela bateria
de frente com o alias do `COALESCE`. É o tipo de detalhe que só o artefato conta.

### 2.2. Uma decisão que tomei e que o brief não dita

O A6 pede que o histórico *"grave o tipo junto com o score"*. Coloquei a coluna **no `INSERT` e
também no `UPDATE SET`**. Motivo: o MERGE reescreve a linha do dia quando roda de novo; uma linha
atualizada que **não** atualizasse o tipo guardaria uma régua velha ao lado de um score novo — que é
exatamente a mentira que o A6 existe para impedir.

## 3. Os números do backfill (REQ-2 — o risco real deste trabalho)

**Previsão antes de executar:** 487 linhas casariam, 12 ficariam `NULL`.
**Resultado depois:** 487 casaram, 12 seguem `NULL`. **Bateu exatamente.**

As 12 são do **CHA (`CLI-13`)**, `2026-09-09` a `2026-09-20`, escritas pelo `sw metricas campanhas`
(`DAILY_ENTRY`, `meta_ads`). O backfill sai do `client_config` — e o CHA **não está lá**. É
precisamente o buraco que o **passo B2** fecha.

> **Não improvisei em cima disso.** Rodar o mesmo backfill de novo depois do B2 é o fim natural, e
> está anotado no §4. Preencher essas 12 linhas por fora seria inventar o dado que o ADR-39 existe
> para fazer chegar direito.

## 4. ⏸️ PARADA OBRIGATÓRIA — a conferência da manhã de 22/09

**A Fase B não começa antes disto, e se qualquer um falhar ela não começa de jeito nenhum.**

| # | Conferir | Esperado |
|---|---|---|
| 1 | linha nova de `raw_campaign_data` com tipo vazio | **nenhuma** (fora campanha sem Métrica-Mãe) |
| 2 | score do KIL | continua **`CPA`** |
| 3 | `phi_score_history` do dia | tipo **preenchido** |

Depois disso, a Fase B na ordem B1 → **B2** → B3 → B4 → B5, e o **backfill repetido** logo após o B2
para fechar as 12 linhas do CHA.

## 5. Os 10 critérios de aceite — onde cada um está

| # | Critério | Hoje |
|---|---|---|
| **CA1** | `phi_prod.client_config` tem um writer | ⬜ **depende do B1** |
| **CA2** | KIL continua `CPA`, vindo da campanha | 🟡 **parcial** — linha de base provada em 20/09 (`CLI-4` = `'CPA'`); o brief manda consultar **depois do B4** |
| **CA3** | ⭐ CHA chega ao score | ⬜ **depende do B2** |
| **CA4** | Métrica-Mãe do Notion vence | ⬜ depende de trocar a métrica e esperar um dia |
| **CA5** | nenhuma linha com tipo `NULL` | 🟡 **487 de 499.** As 12 restantes são o CHA e **só fecham depois do B2** — §3 |
| **CA6** | o fallback não inventa mais | ✅ **`\|\| null` no ar** (`4f42b244`). ⬜ falta o teste forçando um item sem Métrica-Mãe |
| **CA7** | `phi_score_history` guarda a régua | ✅ **a coluna existe e o MERGE a grava** (`b880adee`). ⬜ a prova com dado é a conferência nº 3 do §4 |
| **CA8** | o `COALESCE` saiu, e a data estava escrita antes | 🟡 **a data está escrita** (sticky, 22/09/2026) — a saída é o **B4** |
| **CA9** | `phi_dev` não é escrito nem lido | ⬜ **depende do B1/B5** |
| **CA10** | nada rodou fora de 09h–23h | ✅ **tudo entre 19h e 22h BRT** |

**Nenhum critério da Fase B foi marcado como provado.** A Fase A é aditiva; ela não tinha como
provar remoção.

## 6. Hipóteses que o dado desmentiu (R6, corolário)

| Eu afirmei | O dado mostrou |
|---|---|
| *"o CHA nunca teria linha em `raw_campaign_data`"* (2º portão do relatório da volta 1) | ❌ **falso.** O CHA tem **12 linhas**, de 09/09 a 20/09, com `tem_ontem = 1`, escritas pelo `sw metricas campanhas`. Foi essa refutação que produziu a pendência do §3 |
| *"os dois writers já leem a Métrica-Mãe"* (minha frase no ADR-40 §1) | ✅ **o conteúdo se sustenta** — mas escrevi mal: "os dois writers" eram os dois de `raw_campaign_data`, e a frase deixava ler como se incluísse o `client_config`, que usa mapa fixo (§A9). O chat-mãe pegou a ambiguidade, e ela era minha |

## 7. Achados laterais (não consertei — não é o escopo)

1. 🔴 **`plataforma` e `conversions_7d` são projetadas na `source` do MERGE do score e nunca
   gravadas** — exatamente a doença que o `primary_metric_type` tinha. Vale conferir se essas
   colunas existem em `phi_score_history` e quem as leria.
2. ⚠️ **14 nós BigQuery do `PHI - Pipeline_v2` têm `{{ }}` no `sqlQuery` sem o prefixo `=`** — entre
   eles o próprio `Calcular e Persistir PHI Score`, no `execution_id`. O validador do n8n marca todos
   como `[pre-existing]`. **Não mexi** (preservei byte a byte), mas **isto merece uma conferência
   própria**: se o n8n tratar esses `{{ }}` como texto literal, o `execution_id` gravado é a string
   do template — e seria um sucesso silencioso clássico (R11). **Não tenho como confirmar** sem ler
   uma linha real de `phi_score_history`; entra na conferência da manhã.
3. O `PHI - Subworkflow Campanhas` já tinha o mesmo padrão sem `=` e **funciona** — o que sugere que
   o nó BigQuery resolve mesmo assim. **Sugere, não prova.**

## 8. R12 — o que mudei para testar, e a prova de que voltou

| O que | Estado |
|---|---|
| `TMP - ADR39+40 Fase A1 DDL` (`9kAicvy73zVk8doU`) | ✅ **arquivado** — provado lendo: *"is archived and cannot be accessed"* |
| `TMP - ADR39+40 Fase A2 backfill` (`XBHaLdsZdGv8L9Mn`) | ✅ **arquivado** — mesma prova |
| `TMP` anterior (`SwVDXIkOHloajCeS`) | ✅ arquivado e verificado em 20/09 |

Nenhum nó ficou desabilitado, nenhuma configuração ficou em modo de teste.

---

*Relatório da Fase A — sub-chat do parque PHI, 2026-09-21.*
