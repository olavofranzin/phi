# Brief sub-chat — Fase 2: consertar a tendência (opção B) + publicar itens 1–4

Data: 2026-08-08
Branch: `claude/consolidacao-2026-08`
Brief anterior: `docs/handoff/2026-08-08-prefixo-expressao-n8n-subchat-brief.md`
Log anterior: `docs/handoff/2026-08-08-prefixo-expressao-n8n-execution-log.md` (commit `1dd1459`)
Execution log a produzir: `docs/handoff/2026-08-08-tendencia-serie-diaria-fix-execution-log.md`

> **Sua investigação da fase 1 foi confirmada e aceita.** O prefixo `=` é falso positivo;
> a causa real é `bq_campaign_id` chegando vazio. O Olavo aprovou executar as duas
> recomendações que saíram dali. Este brief é a fase de execução.

---

## 1. Decisão do Olavo

1. **Consertar a tendência pela opção B** (montar o SQL em Code node) — nos **dois**
   workflows: `sw metricas anuncios` (`vVAdXAJh6MW2Z5Hp`) e `sw metricas campanhas`.
2. **Publicar** o rascunho de `sw metricas anuncios`, que já traz os itens 1–4.

Ordem: **conserta primeiro, publica uma vez só** — menos mudanças em produção.

---

## 2. Opção B — especificação

**Hoje:** `Code Prep Tendência` monta `bq_campaign_id` a partir de um campo que não existe
naquele ponto da cadeia (`idG = 0` → string vazia), e o nó `BigQuery Série Diária` carrega
o SQL inteiro com `{{ $json.bq_campaign_id }}` embutido — violando a **regra 8 do CLAUDE.md**
(SQL dinâmico se monta em Code node; nunca `{{ }}` dentro da query BigQuery).

**Alvo:**

- `Code Prep Tendência` passa a:
  - ler o id da **campanha** da fonte correta — `$('Code clean propriedades').item.json.clean_id_google_camp`
    (com os fallbacks que já existam), e **não** o campo atual que chega vazio;
  - manter o formato canônico `'GADS-' + id` / `'META-' + id` (isso já está certo, não mude);
  - montar a **query inteira** numa string e devolvê-la em `_bq_sql_serie`;
  - devolver também `bq_campaign_id` (agora preenchido) e um `_serie_motivo` diagnosticável.
- `BigQuery Série Diária` passa a ter `sqlQuery` = `={{ $json._bq_sql_serie }}`
  (**com** o `=` — aqui é a forma correta, é um campo que passa a ser só expressão).

### Armadilhas (leia antes de codar)

1. **`Code Tendência Real` pareia por ÍNDICE** com `Code Prep Tendência`
   (`prep[i]` ↔ `rows[i]`). **Não altere a contagem de itens** — nada de filtrar, nem de
   `continue` que pule item. Um item entra, um item sai.
2. **Não deixe `_bq_sql_serie` vazio.** O nó BigQuery quebraria. Se o id não resolver,
   emita uma query **válida que retorne zero linhas** (ex.: comparando com `'SEM-ID'`) e
   registre o porquê em `_serie_motivo`. Assim o comportamento degrada igual ao de hoje,
   sem criar um modo de falha novo.
3. Mantenha a query **semanticamente idêntica** à atual (mesmas janelas 3d/3d-anteriores,
   `INTERVAL 21 DAY`, `America/Sao_Paulo`, mesmos aliases `n_dias`, `cost_3`, `conv_3`,
   `clicks_3`, `impr_3`, `rev_3`, `cost_prev3`, `conv_prev3`, `clicks_prev3`, `impr_prev3`,
   `rev_prev3`). O `Code Tendência Real` depende desses nomes.
4. Você relatou um bug latente: `clean_id_google` é o id do **anúncio** em campanha
   não-PMAX. Use o campo de **campanha**. Se a distinção não estiver clara no código,
   registre no log em vez de adivinhar.

---

## 3. Ordem de execução

1. **`sw metricas anuncios`** — aplicar a opção B no rascunho (que já tem os itens 1–4).
2. **Validar antes de publicar:** confirme que `_bq_sql_serie` resolve com um `campaign_id`
   real (`GADS-21149189736` é a campanha da barbearia do KIL, CLI-4). Se tiver como
   inspecionar sem publicar, faça; se não, aceite a validação estática + o smoke do passo 4.
3. **Publicar** `sw metricas anuncios`.
4. **Smoke:** executar uma vez e verificar, na execução:
   - `bq_campaign_id` **não vazio** e no formato `GADS-...`;
   - `n_dias >= 4` e `tendencia_metodo = 'bigquery_3d_vs_3d'` (não `sem_historico`);
   - a página do anúncio `AD01-PMAX_BARBEARIA_10/01/26`
     (Notion `29db65e5-c72b-8013-9418-edfaee111e8c`) com os campos novos.
   **Critério de aceite dos itens 1–4** nessa página:
   `ad_status_operacional` ≠ "Em aprendizado" · `ad_prioridade_otimizacao` ≠ "Baixa" ·
   `ad_tendencia` ≠ "Sem dados" · `ad_diagnostico` citando desvio e janela de evidência.
5. **`sw metricas campanhas`** — mesma correção, mesmo cuidado, publicar e smoke.

**Rollback:** `restore_workflow_version`.
- `sw metricas anuncios`: produção atual = `f618a9d6` · rascunho a publicar = `4370e727`.
- `sw metricas campanhas`: **anote o `activeVersionId` ANTES de mexer** e registre no log.

---

## 4. Não fazer

1. **Não mexer no prefixo `=` de nenhuma outra query.** As 30 ocorrências que você mapeou
   são falso positivo e ficam como estão. A exceção é o `BigQuery Série Diária`, e só
   porque o campo passa a ser exclusivamente uma expressão.
2. **Não tocar** em `Execute SQL inserir daily entry` nem `BigQuery Persistir Sinais
   Criativo`.
3. **Não arquivar** o `PHI - Subworkflow Campanhas`. Apenas **investigue e relate**
   (tem execuções recentes? é chamado por algum outro workflow?). Arquivar workflow ativo
   é decisão do Olavo, não deste sub-chat.
4. Sem force-push, sem deletar branch, sem abrir PR.
5. **Pare e volte** se o smoke do passo 4 falhar, ou se `clean_id_google_camp` também
   não chegar ao `Code Prep Tendência` — nesse caso o problema é mais fundo na cadeia
   (`Code Valida Dados` espalhando a resposta da API por cima dos campos limpos) e a
   solução muda de forma.

---

## 5. Entregável

`docs/handoff/2026-08-08-tendencia-serie-diaria-fix-execution-log.md`, no formato dos
anteriores. Seções mínimas:

```
## Estado inicial (os 2 workflows: versionId, activeVersionId, active)
## Opção B aplicada  (código antes -> depois, por nó, nos 2 workflows)
## Publicação        (versionId depois; o que virou ativo)
## Smoke             (execution ids; bq_campaign_id; n_dias; tendencia_metodo;
                      print dos 5 campos da página do anúncio KIL)
## PHI - Subworkflow Campanhas  (órfão? evidência — SEM arquivar)
## Pendências para o Olavo
```

Commit + `git push -u origin claude/consolidacao-2026-08`.
