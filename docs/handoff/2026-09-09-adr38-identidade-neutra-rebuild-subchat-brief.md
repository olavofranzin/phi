# [BRIEF sub-chat] ADR-38 — identidade neutra + rebuild da série histórica

> **Como usar:** cole este arquivo como 1ª mensagem **no sub-chat da consolidação dos writers**
> (o que já rodou o Lote 1). É o mesmo território — `raw_campaign_data` e os dois writers — e ele já
> tem o contexto. Se aquele sub-chat estiver fechado, abra um novo e cole também o
> `docs/handoff/2026-09-08-consolidacao-writers-subchat-brief-v2.md`.
> **Modelo recomendado:** Opus. **Repo:** `olavofranzin/phi` · **Branch:** `claude/consolidacao-2026-08`.
> **Idioma com o Olavo:** português simples. **Antes de mudança grande: explicar e esperar OK.**

---

## 0. Missão

Executar a **sequência obrigatória do ADR-38 §6** — trocar a identidade de `raw_campaign_data` para
`(client_id, platform, campaign_id, date)` e **recarregar a série histórica** a partir de relatório
oficial do Google Ads.

**Doc canônico:** `docs/strategic-planning/saude-digital/adr-rascunhos/ADR-38-identidade-neutra-e-rebuild-serie-historica.md`
— **leia inteiro antes de tocar em qualquer coisa.** Este brief não o substitui; organiza a execução.

**Por que vale a pena:** o rebuild resolve, de brinde, mais do que a troca de identidade —
preenche os dias perdidos na queda de credencial, traz as conversões **já assentadas** (fecha a
dúvida do subcount do Salão: BQ 321 × export ~481) e entrega ao **Score v2 (ADR-34) a série diária
limpa** que ele precisa. Pode destravar o critério **C1** antes de a consolidação dos writers acabar.

---

## 1. ✅ As duas decisões do Olavo (2026-09-09) — já respondidas

**D1 — data do corte: o DIA EM QUE A ALTERAÇÃO FOR FEITA** (não 08/09). Isso muda a execução:

1. o relatório é puxado **depois** das etapas 1–5, **imediatamente antes** da carga — não antes;
2. ele cobre **de janeiro até D-1 do dia do corte**; a 1ª rodada diária nova cobre do dia do corte
   em diante;
3. **sobrepor um dia é seguro** (o `MERGE` pela chave nova deduplica); **deixar buraco não é**;
4. **escreva a data real** na tabela do topo do ADR-38 no dia em que acontecer (**R2**).

**D2 — `phi_score_history`: migrar a chave AGORA, recalcular no Score v2.**
O Olavo perguntou se não deveria ser recalculada, já que entram dados novos. **Deveria, sim** — os
scores históricos foram calculados sobre a série suja, e essa tabela é usada como **régua** (ADR-29
compara com o histórico; o T28 lê o score canônico de lá).
**Mas recalcular agora é fazer duas vezes:** o **Score v2 (ADR-34 / C1)** muda a fórmula e a validação
dele **já exige** recalcular sobre a série limpa. Então:

| Quando | O quê |
|---|---|
| **Agora** (etapa 5) | `UPDATE` tirando o prefixo — migrar só a **chave** |
| **No Score v2 (C1)** | **recalcular** os scores sobre a série limpa |
| **Antes de apagar** | backup `phi_score_history_backup_2026-09` — guarda o que o PHI **disse na época** |

> ⚠️ **Não repita um erro meu:** a 1ª versão do ADR-38 dizia que migrar "preserva o `acerto_previsao`".
> **Falso** — `acerto_previsao` não existe em `phi_score_history`; ele vive na **planilha `leads`** da
> Prospecção (dono **P6**). Este trabalho **não toca** naquele loop de aprendizado.

---

## 2. A sequência — não pular, não reordenar

| # | Etapa | Feito |
|---|---|---|
| 1 | **P-11** — descobrir **por que** o `client_id` sai vazio no writer das 04h | ⬜ |
| 2 | Ajustar **os dois writers**: `campaign_id` nativo + `platform` + `client_id` sempre preenchido | ⬜ |
| 3 | Ajustar **os consumidores**: `MERGE` pela chave nova + remover o `STARTS_WITH(campaign_id,'GADS-')` do score | ⬜ |
| 4 | **Backup** de `raw_campaign_data` (GCS ou `raw_campaign_data_backup_2026-09`) | ⬜ |
| 5 | `UPDATE` em `phi_score_history` tirando o prefixo `GADS-` (só a chave — **não** recalcular) | ⬜ |
| 6 | Puxar o relatório (**janeiro → D-1 do dia do corte**), **apagar e recarregar** com `ingestion_step='BACKFILL_2026-09'` | ⬜ |
| 7 | **Smoke** nas 2 campanhas KIL + conferir que os dois writers **agora colidem** no `MERGE` | ⬜ |
| 8 | Retomar as **Fases 1 e 2 do ADR-37** sob a identidade única | ⬜ |

**Por que a ordem é essa, em uma frase cada:**
- **2 antes de 6:** se recarregar primeiro, o pipeline das **04h/07h repolui no formato velho no dia
  seguinte** e o trabalho é perdido.
- **3 antes de 6:** com a identidade nova, o `STARTS_WITH('GADS-')` do score **não acha mais nada** —
  e falha em silêncio, como sempre falhou.
- **4 antes de 6:** apagar é irreversível. O backup custa minutos.
- **7 é o teste real:** hoje os dois writers **nunca colidem** porque suas identidades diferem. Depois
  da mudança eles **têm** de colidir no `MERGE` — se não colidirem, a identidade ainda não é única.

---

## 3. O que o relatório NÃO traz (o erro fácil de cometer)

Relatório traz métrica. **Não traz o resto da linha.** Ver ADR-38 §4:

| Coluna | De onde vem |
|---|---|
| `primary_metric_goal` | **`client_goal_history`** — a meta **vigente em cada data**, não a de hoje |
| `platform` / `data_source` | definido pela carga (`google_ads`) |
| `client_id` | resolvido por cliente/conta |
| `revenue` | se o relatório não trouxer: **vazio, NUNCA 0** (invariante I3) |
| `cost_3d`/`conversions_3d`/`cost_7d`/`conversions_7d` | ⛔ **NÃO backfillar** — o score recalcula por `SUM` sobre 7 dias (verificado em 09/09). Preencher é trabalho jogado fora |
| `ingestion_step` | **`BACKFILL_2026-09`** — rótulo próprio e honesto |

---

## 4. Verificação (ADR-38 §7 — rode tudo antes de dizer "pronto")

```sql
-- 1. nenhuma plataforma nula
SELECT platform, COUNT(*) FROM phi_prod.raw_campaign_data GROUP BY 1;

-- 2. nenhum resquício de prefixo
SELECT COUNT(*) FROM phi_prod.raw_campaign_data
WHERE STARTS_WITH(campaign_id,'GADS-') OR STARTS_WITH(campaign_id,'META-');   -- esperado: 0

-- 3. uma linha por chave (a duplicação diária acabou)
SELECT client_id, platform, campaign_id, date, COUNT(*) c
FROM phi_prod.raw_campaign_data GROUP BY 1,2,3,4 HAVING c > 1;                 -- esperado: vazio

-- 4. os dias vazios (queda de credencial) têm dado
SELECT date FROM phi_prod.raw_campaign_data
WHERE client_id='CLI-4' GROUP BY 1 ORDER BY 1;                                 -- sem buracos
```

- `SUM(conversions)` do **Salão** no período **bate com o relatório oficial** → fecha a dúvida do
  subcount.
- O score roda e as **2 campanhas KIL** aparecem em `phi_score_history`.

---

## 5. Guardrails (não-negociáveis)

- **R6 — o dado vence o plano.** Este ADR está aceito, e ainda assim: se a verificação da premissa
  desmentir uma etapa, **pare, não execute, corrija o ADR e escreva por quê**. Foi assim que a
  Fase 0.2 do ADR-37 foi cancelada na hora certa. **Hipótese desmentida também se registra.**
- **R2 — documentação na mesma sessão.** Cada etapa concluída atualiza o ADR-38 (checklist do §6 e
  respostas do §8) **e** o `ESTADO-DO-PROJETO.md`. Commit no git. *Se não está escrito, não aconteceu.*
- **R3 — Notion, obrigatório.** Ao **começar** e ao **encerrar** cada bloco, escreva na DB
  **"PHI — Registro de Execuções (Sub-chats)"** (`8d8eb685f66249c7ba4f298d744feec3`):
  frente · o que foi feito · estado · próximo passo · link. Sem isso o digest diário das 08:30
  continua dizendo "sem progresso".
- **R5 — descrição fiel.** Todo workflow que você alterar sai da sessão com a descrição dizendo
  **o que faz e por que existe**, incluindo o que substituiu.
- **Não ativar/executar workflow sem OK de budget do Olavo.**
- **Não mexa na metade (a)** — planilha `leads` / CRM / `PROSP-01..08`. Tem contrato vigente (ADR-35).
- **Recalcular `phi_score_history` agora é fora de escopo** — é entrega do Score v2 (C1).
- **`conversions=0 ⇒ CPA/ROAS indefinidos`**; `source_status error/missing ⇒ N/D`, **não 0**.
- **ADR-003:** não recalcular `phi_value`/flags/severidade — são fato.

## 6. Fontes

- `docs/strategic-planning/saude-digital/adr-rascunhos/ADR-38-identidade-neutra-e-rebuild-serie-historica.md` ← **principal**
- `docs/handoff/2026-09-08-consolidacao-writers-subchat-brief-v2.md` (o inventário dos writers, Lote 1)
- `docs/handoff/2026-09-09-decisao-P-10-identidade-canonica.md` — **SUPERSEDIDO** pelo ADR-38;
  valem só o **§3 (gate do Meta)** e o **§5 (o score só suporta CPA)**
- `docs/strategic-planning/DEFINICAO-DE-PRONTO-PHI-V1.md` (critérios **C1** e **C2**)
- `docs/strategic-planning/ESTADO-DO-PROJETO.md` §0 (painel)
- `CLAUDE.md` (regras críticas + R1–R6)

## 7. Fora de escopo

- **ADR-33** (identidade estável × campanha recriada) — segue em aberto, **não resolva aqui**.
- **Suporte a Meta Ads no score** — é o **gate**, dispara quando a 1ª campanha Meta subir.
- **Fase 3 (`client_config`)** — corre em paralelo, outro bloco.
