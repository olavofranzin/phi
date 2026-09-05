# [RASCUNHO] ADR-27 — Entrega de análises (DB Análises PHI + integração DBs)

> **STATUS:** RASCUNHO (git, ADR-012). Vira `Aceito` no Lote 3.5.
> Aprovado em princípio por Olavo 2026-06-22 (D11).

## Contexto

Olavo perguntou como o workflow termina, qual e onde é a entrega. A camada
1 (Agregador) termina em `t28_*` (BQ, não-humano). A análise (camada 2)
produz insight LLM. Falta definir **onde o humano vê** e como a entrega se
conecta aos DBs operacionais existentes (Campanhas, Anúncios, Demandas).

## Decisão

**Notion é o canônico humano da entrega (ADR-012). Análises materializam
num novo DB Análises PHI + atualizam properties dos DBs existentes +
disparam Telegram para alertas críticos.**

| Destino | O que recebe | Quando |
|---|---|---|
| **DB Análises PHI** (novo) | 1 page por análise. Body = insight + recomendações LLM. Properties = nível, janela, cliente, PHI·Mídia score, flags. | Toda análise |
| **DBs Campanhas/Anúncios/Conjuntos** (existentes) | Update `phi_midia_score`, `last_analysis_date`, `flags_ativas`. | Toda análise (rollup recente) |
| **DB Demandas** (existente) | Tarefa automática (loop ADR-22). | Quando análise dispara alerta |
| **DB Otimizações** (existente/confirmar) | Log análise + ação tomada. | Toda análise |
| **Telegram** | Resumo + link Notion. | Alertas críticos |
| **Web dashboard** | Lê BQ + Notion via API. | Futuro (fora de escopo) |

## Schema DB Análises PHI (esboço — fechar no L3.5)

```
Properties:
- Titulo (title)
- Nivel (select: ad | adset | campaign | cliente)
- Cliente (relation -> DB Clientes)
- Entidade (relation -> Campanhas/Anuncios/Conjuntos conforme nivel)
- Janela (select: D-1 | D-3 | D-7 | D-30)
- Business Date (date)
- PHI Midia Score (number)
- Flags Ativas (multi-select)
- Severidade (select: info | atencao | critico)
- execution_id (rich_text)
- Versao Contract (rich_text)
Body:
- Insight (LLM)
- Recomendacoes (LLM, acionaveis)
- Evidencias (metricas que sustentam)
```

## Alternativas consideradas

1. **Entrega só em BQ (tabela `t28_analyses`).** Rejeitado para humano:
   BQ não é superfície de leitura operacional (ADR-012). Pode coexistir
   como sink analítico, mas o canônico humano é Notion.
2. **Entrega só em Telegram.** Rejeitado: efêmero, sem histórico navegável,
   sem relação com entidades.
3. **DB Análises PHI + update DBs existentes + Telegram p/ crítico
   (escolhida).** Histórico navegável + score nas entidades + alerta push.

## Consequências

- (+) Humano tem 1 lugar canônico (DB Análises) + score direto nas entidades.
- (+) Loop ADR-22 fechado: análise -> alerta -> tarefa -> otimização.
- (+) Telegram só para crítico evita ruído.
- (-) Mais um DB Notion para manter + properties novas nos DBs existentes.
- (-) Write Notion em volume (1 page/análise) — atenção a rate limit.

## Reavaliar quando

- Volume de análises estressar rate limit do Notion (batch/throttle).
- Web dashboard maduro o bastante para virar superfície primária.

## Conexões com ADRs vigentes

- **ADR-012** (Notion canônico operacional): entrega humana mora no Notion.
- **ADR-21** (PHI -> Índice Saúde Digital): PHI·Mídia score é property-chave.
- **ADR-22** (loop alerta -> tarefa -> otimização): entrega cria a tarefa.
- **ADR-23/24** (camadas + rollup): entrega é a camada 3.
- **ADR Eventos canônicos**: análise pode emitir `analise.concluida` no sink BQ.
