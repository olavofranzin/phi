# [RASCUNHO] ADR-23 — Separação Agregador (ETL) vs Orquestrador de Análises

> **STATUS:** RASCUNHO (git, ADR-012). Não publicado no Notion. Vira
> `Aceito` no DB `PHI™ — Decisões` quando o Lote 3 (Orquestrador) chegar.
> Aprovado em princípio por Olavo 2026-06-22 (D11/D12).

## Contexto

O workflow "PHI — Agregador de Métricas Multi-fonte" (`4sdG2UKMCBuFq8xn`)
hoje é só ETL: lê `raw_campaign_data` + APIs, normaliza no contract T28,
grava em `t28_*`. A evolução natural pede análises LLM (insight +
recomendações) por anúncio, conjunto, campanha e cliente. Há tentação de
acoplar a análise dentro do mesmo workflow do ETL.

## Decisão

**ETL e Análise vivem em workflows separados, encadeados via Execute
Workflow Trigger.**

- **Agregador T28** (camada 1): ETL puro. Sem LLM. Idempotente. Termina
  nos 6 BQ Inserts.
- **Orquestrador de Análises** (camada 2): consome `t28_*`, orquestra
  sub-WFs de análise LLM bottom-up, não reprocessa ETL.

## Alternativas consideradas

1. **Tudo num workflow só** (status quo tentado). Rejeitado: LLM (lento,
   caro, quota Gemini) acoplado ao ETL faz uma falha de quota derrubar a
   ingestão; reexecução do ETL custaria reanálise LLM.
2. **Análise como nodes inline pós-BQ Insert.** Rejeitado: infla o
   Agregador, mistura idempotência ETL com não-determinismo LLM.
3. **Separação em 2 WFs (escolhida).** ETL idempotente isolado; análise
   reexecutável independente; quota LLM não afeta ingestão.

## Consequências

- (+) Agregador permanece rápido, idempotente, reexecutável sem custo LLM.
- (+) Análise pode ter retry/cache/quota própria sem tocar ETL.
- (+) Cada camada depura/desliga isoladamente.
- (-) Mais um workflow para manter + contrato de handoff entre eles.
- (-) Latência adicional do Execute Workflow Trigger (irrelevante na cadência diária).

## Reavaliar quando

- Volume de clientes tornar o encadeamento Execute Workflow Trigger gargalo.
- Surgir necessidade de análise em tempo real (hoje é batch diário/semanal/mensal).

## Conexões com ADRs vigentes

- **ADR-010** (BQ analítico): `t28_*` é a fronteira de handoff entre camadas.
- **ADR-012** (separação de concerns): este ADR é aplicação direta.
- **ADR Tiering** (Pro vs Flash): Orquestrador decide tier por nível de análise.
- **ADR-19** (build-time injection): credenciais Gemini injetadas, não em `$env`.
