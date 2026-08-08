# Brief sub-chat — Prefixo `=` em expressões n8n: correção pontual + varredura

Data: 2026-08-08
Branch de trabalho: `claude/consolidacao-2026-08`
Workflow alvo da correção: `sw metricas anuncios` (`vVAdXAJh6MW2Z5Hp`)
Execution log a produzir: `docs/handoff/2026-08-08-prefixo-expressao-n8n-execution-log.md`

---

## 0. Aviso sobre ferramentas

O Olavo pediu que este sub-chat usasse o **context7**. **Ele NÃO está conectado neste
ambiente** — foi procurado e não existe servidor MCP correspondente. Não invente uso dele
e não finja tê-lo consultado. Se ele estiver disponível na sua sessão, use; se não,
registre no execution log a ausência e use os substitutos abaixo.

**Substitutos para documentação n8n (nesta ordem):**
1. MCP n8n: `get_sdk_reference` e `get_workflow_best_practices` (o servidor pode aparecer
   com nome em hash — localize com `ToolSearch`, ex.: `select:mcp__*__get_sdk_reference`).
2. Skills locais: `n8n-code-javascript`, `n8n-validation-expert`, `n8n-node-configuration`,
   `n8n-api-workflow-review`.
3. `mcp__*__validate_workflow` — foi ele que sinalizou o defeito (`MISSING_EXPRESSION_PREFIX`).

---

## 1. O defeito

No n8n, um parâmetro só é avaliado como expressão se o valor **começar com `=`**.
Sem o prefixo, `{{ ... }}` é enviado como **texto literal**.

**Caso confirmado** — nó `BigQuery Série Diária` de `sw metricas anuncios`:

```sql
... FROM `project-0e7c58d4-656f-49e8-807.phi_prod.raw_campaign_data`
WHERE campaign_id = '{{ $json.bq_campaign_id }}'
  AND date >= DATE_SUB(CURRENT_DATE('America/Sao_Paulo'), INTERVAL 21 DAY)
```

O `sqlQuery` **não começa com `=`**. Resultado: o BigQuery recebe a string literal
`{{ $json.bq_campaign_id }}` como valor de comparação. É SQL **sintaticamente válido** —
por isso **nunca deu erro** (as 14 execuções mais recentes estão todas `success`) — e
retorna **zero linhas, sempre**.

**Consequência em cadeia:** `n_dias = 0` → o nó `Code Tendência Real` cai no
`if (nDias >= 4)` e devolve `tendencia_real = null` com `metodo = 'sem_historico'` →
o sistema sempre usou o proxy da janela da API (3d vs 7d) em vez da série diária
3d-vs-3d anunciada no código. **A tendência real do BigQuery nunca funcionou.**

**Prova de que é defeito e não estilo:** no mesmo workflow, o nó `Update a database page`
usa `="={{ ... }}"` corretamente nas 23 propriedades.

---

## 2. Escopo APROVADO (fazer)

### 2.1 Corrigir `BigQuery Série Diária`

Só este nó. É um `SELECT` — risco zero de escrita.

**Antes de corrigir, verifique a origem do campo.** Prepender `=` sem isso pode só trocar
um bug por outro (`campaign_id = 'undefined'` também retorna zero linhas):

- O nó anterior é `Code Prep Tendência`. Confirme que ele realmente emite `bq_campaign_id`.
- Confirme o **formato** do valor contra a coluna `campaign_id` de `phi_prod.raw_campaign_data`.
  Atenção: no PHI o identificador canônico de campanha é `GADS-21149189736` (prefixado),
  não o ID numérico cru do Google. Se houver divergência de formato, **corrija também** —
  é parte do mesmo defeito (a query nunca casou com nada, então nunca foi validada).
- Rode um `SELECT DISTINCT campaign_id ... LIMIT 20` no BigQuery para ver o formato real.

**A correção:** `sqlQuery` deve passar a começar com `=`, mantendo o restante idêntico.

### 2.2 Publicar o rascunho de `sw metricas anuncios`

O rascunho **já contém** as correções dos itens 1–4 (feitas nesta sessão, verificadas):

| Nó | O que mudou |
|---|---|
| `Code classificar status` | Gate binário de 7d → **escada de evidência** (pleno/parcial/nenhum) usando 7d e 30d + idade do anúncio |
| `Code Diagnóstico Criativo` | `ad_tendencia` solta do gate; rótulos honestos; `Urgente`→`Alta` sob evidência parcial |
| `Code Cálcula Métricas` | ROAS/Receita = `null` quando `conversions_value` é placeholder |

**Estado no momento deste brief:**
- `versionId` (rascunho): `4370e727`
- `activeVersionId` (produção): `f618a9d6` ← **rollback é restaurar esta versão**

Publique **depois** de aplicar 2.1, para que as duas correções entrem juntas.

### 2.3 Varredura — SÓ RELATAR, NÃO CORRIGIR

Varra **todos** os workflows do n8n atrás do mesmo defeito
(`MISSING_EXPRESSION_PREFIX`: parâmetro contendo `{{ }}` sem `=` inicial).

Para cada ocorrência, registre no execution log:

| Campo | O que anotar |
|---|---|
| workflow (nome + id) | |
| nó + parâmetro | |
| trecho | primeiros ~120 chars |
| ativo? | o workflow está publicado/rodando? |
| tipo | **leitura** (SELECT/GET) ou **escrita** (INSERT/MERGE/POST/UPDATE) |
| efeito provável | erro visível · silencioso (0 linhas) · sem efeito |
| risco de corrigir | o que passa a acontecer que hoje não acontece |

`validate_workflow` por workflow é o caminho mais rápido; confirme cada achado lendo o
parâmetro de verdade (o validador tem falso-positivo: uma query 100% estática que
mencione `{{` em comentário seria sinalizada à toa).

---

## 3. Restrições (inegociáveis)

1. **Não corrija nenhum outro nó além do `BigQuery Série Diária`.** Nem no `sw metricas
   anuncios`, nem em outro workflow. A varredura é diagnóstico.
2. **Especialmente NÃO toque** em `Execute SQL inserir daily entry` nem em
   `BigQuery Persistir Sinais Criativo` (mesmo workflow, mesmo defeito). Eles **escrevem**.
   Hoje não falham — ou estão sendo pulados por gate, ou engolindo erro. Corrigir o prefixo
   pode **ligar uma escrita que hoje não acontece**. Descobrir qual dos dois é o caso faz
   parte do relatório; a correção é decisão do Olavo depois.
3. **Sem force-push. Sem deletar branch. Sem abrir PR.**
4. **Disciplina de token:** não execute workflows que gastem LLM/API sem necessidade.
   Ler configuração é barato; executar não é.
5. Se a verificação de 2.1 mostrar que o problema é maior que prepender `=`
   (ex.: `bq_campaign_id` não existe, ou o formato não bate), **pare, registre e não
   publique** — volte para o Olavo. Publicar os itens 1–4 com a tendência ainda quebrada é
   pior que esperar.

---

## 4. Entregável

Crie `docs/handoff/2026-08-08-prefixo-expressao-n8n-execution-log.md` seguindo a estrutura
usada em `docs/handoff/2026-07-01-metricas-anuncios-execution-log.md`:

```
# <título> - Execution Log
Data / Branch / Workflow / WorkflowId / Brief

## Estado inicial observado
  (versionId antes, activeVersionId antes, active, nodeCount)

## Verificação do campo bq_campaign_id
  (o que Code Prep Tendência emite; formato real da coluna no BigQuery; bateu ou não)

## Mudanças aplicadas no n8n
  (nó, parâmetro, antes → depois; versionId depois; publicado sim/não)

## Varredura de MISSING_EXPRESSION_PREFIX
  (tabela do §2.3, um bloco por workflow)

## Pendências para o Olavo
  (decisões que ficaram, especialmente os 2 nós de escrita)

## Ferramentas
  (context7 disponível? o que foi usado no lugar)
```

Commite na branch `claude/consolidacao-2026-08` com mensagem descritiva e faça
`git push -u origin claude/consolidacao-2026-08`.

---

## 5. Contexto de origem

Este brief nasceu da verificação do anúncio `AD01-PMAX_BARBEARIA_10/01/26`
(Notion `29db65e5-c72b-8013-9418-edfaee111e8c`), campanha
`[KIL] GG_VISITA NEGÓCIO LOCAL_PMAX_BARBEARIA_SP.CAPITAL` (`GADS-21149189736`, CLI-4).
O Olavo apontou que `ad_diagnostico`, `ad_prioridade_otimizacao`, `ad_score_operacional`,
`ad_status_operacional` e `ad_tendencia` não refletiam a realidade. A investigação
confirmou que ele estava certo em todos os pontos e produziu os itens 1–4 (já no rascunho).
O defeito de prefixo apareceu como achado colateral — e é o que impede a tendência de ser boa.

**Regras do repositório que valem aqui:** CLAUDE.md regra 8 (SQL dinâmico montado em Code
node, nunca `{{ }}` dentro da query BigQuery) — note que o `BigQuery Série Diária` viola
justamente essa regra; vale registrar se a correção deveria ser prepender `=` ou migrar a
montagem para um Code node, que é o padrão da casa.
