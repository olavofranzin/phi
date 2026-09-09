# ADR-38 — Identidade neutra de plataforma + rebuild da série histórica

| | |
|---|---|
| **Status** | ✅ **ACEITO** na direção (Olavo, 2026-09-09) · **execução condicionada** aos pré-checks do §6 |
| **Substitui** | a "Opção A" do `2026-09-09-decisao-P-10-identidade-canonica.md` (prefixo `GADS-`/`META-`) |
| **Fecha** | **P-10** do ADR-37 |
| **Impacto** | `raw_campaign_data`, os 2 writers, o SQL do score, `phi_score_history` · critérios **C1** e **C2** |

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

1. **`phi_score_history` está chaveado por `GADS-...`.** Trocar a identidade em `raw_campaign_data`
   **órfã o histórico de scores**. Três saídas — **decidir explicitamente, não descobrir depois**:
   (a) migrar o histórico para a identidade nova; (b) aceitar a descontinuidade e marcar a data de
   corte; (c) recalcular os scores sobre a série nova. **Recomendo (a)** — é `UPDATE` com regra
   simples (tirar o prefixo) e preserva o `acerto_previsao`.
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
| 1 | **P-11** — descobrir por que o `client_id` sai vazio | pode mudar o custo de tudo |
| 2 | Ajustar **os dois writers** para a identidade nova (`campaign_id` nativo + `platform` + `client_id`) | senão a carga é repoluída no dia seguinte |
| 3 | Ajustar **os consumidores**: `MERGE` por `(client_id, platform, campaign_id, date)` e remover o `STARTS_WITH` do score | senão o score não acha nada |
| 4 | **Backup** de `raw_campaign_data` | irreversível |
| 5 | Decidir o destino de `phi_score_history` (§5.1) | |
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

- **Data do corte** — o Olavo puxa o relatório de janeiro até 08/09 **ou até o dia da alteração**.
  Definir a data exata na hora, e registrar.
- **Meta Ads:** o **gate** continua valendo. Com a identidade neutra ele fica **mais fácil** de
  atender (não há prefixo a inventar), mas o consumidor ainda precisa aprender a pontuar Meta.
- **ADR-33** segue em aberto (identidade estável × campanha recriada).

---

*Não duplique informação dentro de um campo: se a coluna `platform` já sabe, o `campaign_id` não precisa saber de novo.*
