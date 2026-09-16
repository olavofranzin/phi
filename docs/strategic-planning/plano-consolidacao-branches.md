# Plano de Consolidação de Branches (risco T12) — Opção B

> **[GOVERNANÇA — 2026-08-01]** Decisão do Olavo: **Opção B — a branch
> `claude/agentic-agency-planning-KwJEw` é a BASE do trunk** (tem o grosso do projeto:
> +275 commits desde o ancestral comum `860062c`; o `main` tem só +12, majoritariamente
> uma reorganização + biblioteca de skills). Este doc é o **plano**; **nenhum merge foi
> executado** — aguarda aprovação por fase. As branches remotas são o backup natural.

## 1. Diagnóstico da divergência KwJEw ↔ main

- Ancestral comum: `860062c`. **`main` +12 commits · `KwJEw` +275 commits.**
- O `main` fez uma **reorganização grande**: moveu `workflows/` para subpastas
  (`workflows/main`, `workflows/onboarding`, `workflows/subworkflows`, …), adicionou
  **bibliotecas de skills** (`.agents/skills/`, `.claude/skills/`), `docs/WORKFLOWS.md`,
  `docs/analises/`, refs de Google Ads API. A `KwJEw` **não tem** esse reorg.
- A `KwJEw` acumulou o **IP estratégico** (ADRs, agentes, regras, roster, skills
  destiladas, ESTADO, etc.).

### Merge de teste (KwJEw base + main) — resultado REAL do git 3-way
Rodado numa branch descartável e **abortado** (diagnóstico apenas):

- **209 arquivos entram LIMPOS** (`A`) — todo o reorg + skills do `main`, sem conflito.
- **7 auto-merges** limpos.
- **Apenas 7 conflitos reais** (todos `AA` = ambos criaram o arquivo):

| # | Arquivo | Resolução (Opção B = KwJEw manda) |
|---|---|---|
| 1 | `CLAUDE.md` | **Diff-and-graft:** base = KwJEw (restaurado do main + seção T28); enxertar qualquer conteúdo só-do-main mais novo (v1.5) |
| 2 | `docs/strategic-planning/ESTADO-DO-PROJETO.md` | **Manter KwJEw** (é o doc mestre canônico) |
| 3 | `docs/modulo-28-analise-cognitiva.md` | **Manter KwJEw** (7 prompts + guardrails); conferir só-do-main |
| 4 | `docs/pesquisa-trafego-pago.md` | **Diff-and-graft** (substrato — ver qual está mais completo) |
| 5 | `docs/Gestão de Tráfego Pago, Métricas e Benchmarks (2026).md` | **Diff-and-graft** (substrato) |
| 6 | `docs/strategic-planning/README.md` | **Manter KwJEw**; conferir só-do-main |
| 7 | `.gitignore` | **União** das duas listas (trivial) |

> **Cleanup pós-merge (não é conflito):** o `main` moveu workflows para subpastas; a
> `KwJEw` tem versões antigas no **root**. Depois do merge vão **coexistir duplicadas** →
> deduplicar (manter a estrutura do `main`, remover as do root). Idem skills (agora em 3
> lugares: `.agents/skills`, `.claude/skills`, `docs/strategic-planning/skills`).

## 2. Inventário das 14 outras branches

| Branch | +KwJEw | +main | Conteúdo / Destino |
|---|---|---|---|
| `review-technical-docs` | 0 | 0 | Vazia (no ancestral). **ARQUIVAR** |
| `tender-gates-2euo90` | 7 | 0 | Contida no `main`. **ARQUIVAR** |
| `claude-md-access-2k7znf` | 11 | 1 | main + 1 (CLAUDE.md v1.5). Enxertar no conflito #1 → **ARQUIVAR** |
| `paid-media-planning-frameworks-fofu96` | 14 | 2 | main + 2 (D1 planning — **já trazido pra KwJEw**). Confirmar e **ARQUIVAR** |
| `n8n-workflow-review-skill-sp5mrq` | 12 | 4 | main + 4 (skill n8n review). **Revisar leve → ARQUIVAR** |
| `campaign-analysis-framework-l3-u67ugn` | 2 | 187 | KwJEw + 2 (brief L3.0 Codex). **Absorver os 2 → ARQUIVAR** |
| `gbp-scoring-motor-n8n-0zri0i` | 6 | 225 | KwJEw + 6 (Comercial/GBP sync). **Revisar os 6 → absorver** |
| `affectionate-davinci-Ey2oV` | 2 | 2 | +2 (brief telemetria). **Revisar → provável archive** |
| `lucid-tesla-ZWcbr` | 2 | 2 | +2 (L1 setup export / Priorização JSONs). **Revisar** |
| `add-find-skills-lDj2v` | 11 | 11 | +11 (skills). **Revisar** |
| `create-phi-folder-n2RXF` | 10 | 10 | +10 (Google Ads Insights Semanal). É a "dev branch" do CLAUDE.md do main. **Revisar** |
| `fix-daily-entry-workflow-dC96Q` | 17 | 17 | +17 (Meta Ads / daily entry). **Revisar** |
| `wonderful-hawking-Q6VLQ` | 10 | 10 | +10 (T28 adapter: business context, métrica-mãe). **Revisar — toca o T28** |
| **`saude-digital-phi-midia-score-0ko12c`** | **20** | **13** | **Pipeline_v2 v1.2 PUBLICADO — o KEYSTONE do score.** **PRIORIDADE — absorver antes de fechar** |

**Leitura:** 5 branches já estão essencialmente no `main`/`KwJEw` (arquiváveis); ~7 têm
trabalho pequeno a revisar; **2 são críticas e têm IP não-mesclado:**
`saude-digital-phi-midia-score` (o score) e `wonderful-hawking` (adapter T28).

## 3. Mecânica segura (por fases, cada uma com aprovação)

- **FASE 0 (feita):** diagnóstico + este plano. Zero mudança destrutiva.
- **FASE 1 — Integração KwJEw ← main.** Numa branch nova `claude/consolidacao-2026-08`
  (a partir da KwJEw): `git merge --no-ff origin/main`; resolver os **7 conflitos** pela
  tabela §1; deduplicar os workflows root vs subpasta; verificar (arquivos-chave, nada
  quebrado). **Sem tocar em `main` nem `KwJEw`.**
- **FASE 2 — Absorver as 2 críticas** (`saude-digital-phi-midia-score`, `wonderful-hawking`)
  na branch de integração, com o mesmo cuidado (merge de teste antes).
- **FASE 3 — Varredura das branches pequenas** (absorver os poucos commits úteis;
  descartar o resto).
- **FASE 4 — Promoção.** Abrir **PR** da branch de integração para o `main` (o trunk) —
  **com aprovação do Olavo**. **NUNCA force-push no `main`.** Após merge, **arquivar** as
  branches obsoletas (`git push origin --delete` só com ok explícito).

## 4. Regras de segurança (inegociáveis)

1. **Nada de rebase** (275 commits). Merge de 3 vias resolve tudo de uma vez.
2. Todo trabalho numa **branch de integração**; `main` e `KwJEw` **não são tocados** até a
   promoção aprovada.
3. **Sem force-push** e **sem delete de branch** sem OK explícito do Olavo.
4. Antes de cada fase, **merge de teste + abort** para ver o conflito real.
5. As branches remotas são o **backup** — nada se perde no processo.

## 5. Recomendação de sequência

Começar pela **FASE 1** (KwJEw ← main) — é a de maior valor e baixo risco (só 7 conflitos
de doc). Depois a **FASE 2** (o score, que é keystone). As pequenas ficam por último.

---

## 6. Status de execução — branch `claude/consolidacao-2026-08` (2026-08-01)

- ✅ **FASE 1** (KwJEw ← main): 7 conflitos resolvidos (mantendo KwJEw, superset); 209 arquivos
  do `main` integrados (reorg `workflows/` + skills + `docs/WORKFLOWS.md`); 5 dupes de root removidas.
- ✅ **FASE 2** (críticas): `saude-digital-phi-midia-score` (keystone, merge limpo) +
  `wonderful-hawking` (adapter T28: `adaptador-input-t28.code.js`, `normalizador-t28.code.js`,
  `spec-contrato-agregador-t28.md`).
- ✅ **FASE 3** (pequenas): absorvidas `affectionate-davinci`, `campaign-analysis-l3`,
  `claude-md-access`, `create-phi-folder`, `gbp-scoring-motor`, `lucid-tesla`,
  `n8n-workflow-review`, `paid-media`, `fix-daily-entry` (Meta Ads/HubSpot/métricas). Dedup de root
  refeito; root limpo (só `CLAUDE.md`, `README.md`, `skills-lock.json`).
- **Estado:** 360 commits acima do `main` · 544 arquivos. `main` e KwJEw **intocados**.
- **Arquiváveis** (sem conteúdo único / já absorvidas): `add-find-skills` (redundante com skills do
  main), `review-technical-docs` e `tender-gates` (contidas), + todas as branches-fonte já
  mescladas. **Deletar só após a FASE 4 (promoção) e com OK explícito.**
- ⏳ **FASE 4 (pendente):** PR da integração → `main`. Só abro PR a pedido explícito.
