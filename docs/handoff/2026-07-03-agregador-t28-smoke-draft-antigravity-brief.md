# [BRIEF Antigravity] Verificação independente do smoke do draft do Agregador T28

> **Executor:** Antigravity · **Entrada:** report do Codex
> (`2026-07-03-agregador-t28-smoke-draft-codex-report.md`) · **Saída:** report
> próprio · consolidação final pelo Claude · decisão: **Olavo**.
> **Papel:** VERIFICADOR INDEPENDENTE, não revisor de texto. Não confie em
> nenhum número do report do Codex sem reproduzir a evidência você mesmo.

## 1. Verificações obrigatórias (reproduzir, não conferir prosa)

1. **Estado do workflow:** via `get_workflow_details` em `4sdG2UKMCBuFq8xn`,
   confirme com seus próprios olhos: `activeVersionId = a46d5a6a-...` (produção
   intocada) e draft = `cbd3568d-...` (nenhuma edição durante o smoke).
2. **Diff do draft vs. ativo é SÓ o pretendido:** os únicos parâmetros
   diferentes devem ser (a) `sqlQuery` + `namedParameters` do
   `[T28] BQ Read raw_campaign_data` e (b) `jsCode` do `Adaptador Input T28`
   (âncoras `Loop`/match por chave + linha do landing page). Qualquer outra
   divergência = achado.
3. **Re-rode as queries E1/B2 do brief do Codex** no BQ e compare com o que
   ele reportou. Divergência de números = achado.
4. **Critérios C1–C6:** emita SEU veredito por critério, independente do dele.
5. **Execuções n8n:** via `get_execution` dos ids que o Codex reportar,
   confira status real, `source_status` no output do Normalizador e se o
   error handler foi acionado (e por quais nós).

## 2. Revisão adversarial (além do que o Codex olhou)

- **Match por chave falhou silenciosamente?** O Adaptador tem fallback
  `?? campItems[0]` — se `notion_id_camp` não casar (formato/formula), o bug
  antigo volta MASCARADO. Prova: os valores de ctx em E1 diferem entre as 2
  campanhas OU conferem campo a campo com o Notion. Se todas as linhas
  repetirem o mesmo ctx, investigue se é fallback (bug) ou coincidência real.
- **Campanha sem `id_google_campanha`:** `@campaign_id` viraria `GADS-null`
  → 0 linhas do raw → campanha some do t28 sem trilha. Verifique se alguma
  campanha ativa do Notion está nesse caso hoje.
- **`source_ingestion_step`:** coluna nova no SELECT — confirme que o MERGE
  builder NÃO a persiste (não existe no SCHEMA do t28_campaign) e que isso não
  gera erro nem coluna fantasma.
- **Janela:** execução manual usa o trigger Semanal → D-7→D-1. Confirme que
  `business_date` das linhas está dentro da janela e `janela='D-7'`.

## 3. Report

Commitar em `docs/handoff/2026-07-03-agregador-t28-smoke-draft-antigravity-report.md`
na mesma branch: veredito próprio C1–C6 + achados da revisão adversarial +
divergências vs. report do Codex (se houver) + recomendação
(APROVAR PUBLICAÇÃO / REPROVAR / APROVAR COM RESSALVAS).
**Não editar workflow, não publicar, não corrigir nada** — achados viram
texto, não ação.
