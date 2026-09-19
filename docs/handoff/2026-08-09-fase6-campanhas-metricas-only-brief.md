# Brief sub-chat — Fase 6: `sw metricas campanhas` = só métricas; veredito é do Pipeline_v2

Data: 2026-08-09
Branch: `claude/consolidacao-2026-08`
Fases anteriores: `2026-08-08-*` (prefixo, tendência, desvio, fase4, fase5)
Execution log a produzir: `docs/handoff/2026-08-09-fase6-campanhas-metricas-only-execution-log.md`

> **Decisão do Olavo (arquitetura, fecha a fase 5):** o `sw metricas campanhas` deve
> escrever **apenas métricas** na DB Campanhas. **Todo veredito — status, score,
> classificação, "em crise" — é responsabilidade EXCLUSIVA do `PHI - Pipeline_v2`**
> (o PHI·Mídia Score canônico, ADR-003: o score é fato, autoridade única).
>
> Isto **encerra** a linha de trabalho do classificador em campanhas: a escada de
> evidência da fase 5 e o desvio da fase 4 no `sw metricas campanhas` passam a ser, na
> melhor das hipóteses, **internos e sem destino** — não devem alimentar nenhuma
> propriedade de veredito no Notion.

Workflow: `sw metricas campanhas`. Ativo agora = **`2a4c40e5`** (rollback).

---

## 1. Primeiro MAPEAR (antes de qualquer remoção)

Sem este mapa, remover é às cegas. Produza a tabela **quem-escreve-o-quê na DB Campanhas**
(`collection://19fb65e5-c72b-80be-8c3b-000bb115d53f`):

1. **`sw metricas campanhas`** — enumere TODA escrita no Notion (nó a nó): qual DB, quais
   propriedades, e a origem de cada valor. Cubra tanto o `Update`/atualização da página de
   campanha quanto qualquer `Create Observation` (Observações Diárias).
2. **`PHI - Pipeline_v2`** — enumere o que ele escreve **na DB Campanhas** (esp.
   `Status Geral da Campanha`, `Score Diário (0-100)`, `Resultado Atual (Métrica-mãe)`,
   `Em Crise?`, `Status da Métrica-mãe` e afins).
3. **Overlap:** para cada propriedade, marque quem escreve — só `sw metricas campanhas`, só
   Pipeline_v2, ou **ambos** (colisão: last-writer-wins corrompe o valor).

Classifique cada propriedade escrita pelo `sw metricas campanhas` em:
- **MÉTRICA** (CPA/CPC/CPL/CPM/CTR/impressões/cliques/conversões/investido/taxa de conversão/
  valores de métrica-mãe formatados, etc.) → candidata a MANTER.
- **VEREDITO** (status, score, classificação, crise, prioridade, "dentro/fora da meta"
  como julgamento) → candidata a REMOVER (é do Pipeline_v2).

---

## 2. Aplicar (o que está aprovado, e o que precisa parar-e-perguntar)

**APROVADO — remover agora:** qualquer escrita de **VEREDITO/STATUS/SCORE/CRISE** feita pelo
`sw metricas campanhas` na DB Campanhas. Isso inclui desconectar do payload de escrita
qualquer campo derivado do `Code classificar status` / `final_status` / `final_score` /
`classe_score` que porventura chegue ao Notion. **Pipeline_v2 é a autoridade.**

**PARAR e REPORTAR (não remover sem OK):** se alguma **MÉTRICA** for escrita por **ambos**
os workflows (colisão real). Aí a decisão de qual dos dois mantém a escrita é do Olavo —
liste a colisão no retorno com sua recomendação, mas **não** remova métrica de um pipeline
em produção sem confirmação.

**NÃO tocar no cálculo interno:** o `Code classificar status`, `Code calculo desvio meta`
etc. podem **permanecer** calculando internamente (é inócuo e serve de diagnóstico nos
logs de execução). O que importa é que a saída de **veredito** deles **não vá para o
Notion**. Não gaste esforço arrancando o classificador — só corte o fio que leva veredito à
página. Se o classificador não escreve nada no Notion (como você indicou na fase 5), então
**pode não haver nada a remover** — nesse caso, confirme isso explicitamente no log e o
trabalho vira só o mapa + a confirmação de não-colisão.

**`status_meta`** (o "Acima da Meta 🚨"): decida pela natureza — se ele é escrito numa
propriedade da campanha e representa um **julgamento** (dentro/fora da meta), é veredito →
removê-lo do Notion (Pipeline_v2 cobre via `Status da Métrica-mãe`). Se ele só vive no
payload interno e não vira propriedade, deixa quieto. Registre o que achou.

---

## 3. Aceite

1. Após a mudança, o `sw metricas campanhas` escreve na DB Campanhas **somente métricas** —
   nenhuma propriedade de veredito/score/status.
2. **Nenhuma colisão** silenciosa: nenhuma propriedade escrita por ambos os workflows sem
   que você a tenha reportado.
3. **Não-regressão do Pipeline_v2:** confirme que `Status Geral da Campanha` (hoje `WARNING`
   na campanha da barbearia `GADS-21149189736`) e `Score Diário` (56.26) continuam vindo do
   Pipeline_v2 e **não** são sobrescritos pelo `sw metricas campanhas`.
4. As **métricas** da campanha (CPA/CPC/CPL/etc.) continuam sendo atualizadas normalmente.

Smoke antes de publicar (se houver mudança que publicar). Se nada precisou mudar, não
publique — registre "sem mudança" e entregue só o mapa.

**Rollback:** `restore_workflow_version` para `2a4c40e5`.

---

## 4. Não fazer

1. Não remover **métrica** de nenhum pipeline sem OK (só reportar colisão).
2. Não mexer no `PHI - Pipeline_v2` (ele é a autoridade; esta fase não o altera).
3. Não tocar no prefixo `=`, nem nos nós de escrita BigQuery, nem arquivar o
   `PHI - Subworkflow Campanhas`.
4. Não perseguir `Merge Meta Ads` nem `Code Valida Dados` (ficam para desenho próprio).
5. Sem force-push, sem deletar branch, sem abrir PR.

---

## 5. Entregável

`docs/handoff/2026-08-09-fase6-campanhas-metricas-only-execution-log.md`. Seções:
mapa quem-escreve-o-quê (as 2 tabelas + overlap) · o que foi removido (veredito) · colisões
de métrica reportadas (se houver) · `status_meta` (destino) · publicação (versionId
antes/depois, ou "sem mudança") · aceite (Pipeline_v2 intacto; métricas intactas) ·
pendências.

Commit + `git push -u origin claude/consolidacao-2026-08`.

Retorno compacto PT-BR: (a) o mapa resumido (quem escreve veredito, quem escreve métrica);
(b) o que foi removido do `sw metricas campanhas`, se algo; (c) houve colisão de métrica
entre os dois workflows?; (d) `Status Geral`/`Score Diário` seguem só do Pipeline_v2?;
(e) versionId antes/depois (ou "sem mudança"); (f) log + hash; (g) o que sobrou.
